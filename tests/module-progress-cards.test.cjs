const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const React = require("react");
const { renderToStaticMarkup } = require("react-dom/server");
const ts = require("typescript");

const root = path.resolve(__dirname, "..");

const courseModules = [
  {
    id: "1",
    number: 1,
    title: "Module One",
    description: "First module description.",
    estimatedMinutes: 20,
    slideIds: ["m1-1", "m1-2"],
  },
  {
    id: "2",
    number: 2,
    title: "Module Two",
    description: "Second module description.",
    estimatedMinutes: 25,
    slideIds: ["m2-1", "m2-2"],
  },
  {
    id: "3",
    number: 3,
    title: "Module Three",
    description: "Third module description.",
    estimatedMinutes: 30,
    slideIds: ["m3-1", "m3-2"],
  },
  {
    id: "4",
    number: 4,
    title: "Module Four",
    description: "Fourth module description.",
    estimatedMinutes: 35,
    slideIds: ["m4-1", "m4-2"],
  },
];

function compileModule(relativePath, localRequire, jsx = ts.JsxEmit.None) {
  const absolutePath = path.join(root, relativePath);
  const source = fs.readFileSync(absolutePath, "utf8");
  const output = ts.transpileModule(source, {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2020,
      esModuleInterop: true,
      jsx,
    },
    fileName: absolutePath,
  }).outputText;
  const loaded = { exports: {} };
  const compile = new Function(
    "exports",
    "require",
    "module",
    "__filename",
    "__dirname",
    output,
  );
  compile(loaded.exports, localRequire, loaded, absolutePath, path.dirname(absolutePath));
  return loaded.exports;
}

function renderModuleCards(progress) {
  const Icon = () => React.createElement("span", { "aria-hidden": "true" });
  const lucide = new Proxy({}, { get: () => Icon });
  const Link = ({ href, children, ...props }) =>
    React.createElement("a", { href, ...props }, children);
  const ui = {
    Badge: ({ children, ...props }) => React.createElement("span", props, children),
    Button: ({ asChild, children, variant, size, ...props }) =>
      asChild
        ? React.cloneElement(React.Children.only(children), props)
        : React.createElement("button", props, children),
    Card: ({ children, ...props }) => React.createElement("article", props, children),
    CardContent: ({ children, ...props }) => React.createElement("div", props, children),
    CardHeader: ({ children, ...props }) => React.createElement("header", props, children),
    CardTitle: ({ children, ...props }) => React.createElement("h3", props, children),
  };
  const getModuleCompletion = (moduleId, storedProgress) => {
    const courseModule = courseModules.find((item) => item.id === moduleId);
    const moduleProgress = storedProgress.modules[moduleId];
    if (!courseModule || !moduleProgress) return 0;
    return Math.round((moduleProgress.visitedSlideIds.length / courseModule.slideIds.length) * 100);
  };
  const localRequire = (specifier) => {
    if (specifier === "react") return React;
    if (specifier === "react/jsx-runtime") return require(specifier);
    if (specifier === "next/link") return { __esModule: true, default: Link };
    if (specifier === "lucide-react") return lucide;
    if (specifier === "@/components/ui/badge") return { Badge: ui.Badge };
    if (specifier === "@/components/ui/button") return { Button: ui.Button };
    if (specifier === "@/components/ui/card") {
      return {
        Card: ui.Card,
        CardContent: ui.CardContent,
        CardHeader: ui.CardHeader,
        CardTitle: ui.CardTitle,
      };
    }
    if (specifier === "@/lib/course-metadata") {
      return { courseModuleMetadata: courseModules };
    }
    if (specifier === "@/lib/progress-selectors") return { getModuleCompletion };
    if (specifier === "@/lib/progress-storage") return { useProgress: () => progress };
    if (specifier === "@/lib/utils") {
      return { cn: (...values) => values.filter(Boolean).join(" ") };
    }
    throw new Error(`Unexpected dependency: ${specifier}`);
  };
  const { ModuleCardGrid } = compileModule(
    "components/module-card-grid.tsx",
    localRequire,
    ts.JsxEmit.ReactJSX,
  );
  return renderToStaticMarkup(React.createElement(ModuleCardGrid));
}

function emptyProgress(overrides = {}) {
  return {
    version: 1,
    modules: {},
    quizAttempts: [],
    flashcards: {},
    examAttempts: [],
    recentActivity: [],
    ...overrides,
  };
}

function moduleCard(html, moduleId) {
  const start = html.indexOf(`data-module-id="${moduleId}"`);
  assert.notEqual(start, -1, `Module ${moduleId} card was not rendered`);
  const next = html.indexOf("data-module-id=", start + 1);
  return html.slice(start, next === -1 ? undefined : next);
}

test("Module 1 and Module 2 independently render completed lesson status", () => {
  const html = renderModuleCards(emptyProgress({
    modules: {
      "1": { visitedSlideIds: ["m1-1", "m1-2"], completed: true },
      "2": { visitedSlideIds: ["m2-1", "m2-2"], completed: true },
    },
  }));

  for (const moduleId of ["1", "2"]) {
    const card = moduleCard(html, moduleId);
    assert.match(card, />Complete</);
    assert.match(card, />Review module</);
  }
});

test("partial lesson progress renders its percentage and resume action", () => {
  const html = renderModuleCards(emptyProgress({
    modules: {
      "3": { visitedSlideIds: ["m3-1"], completed: false },
    },
  }));
  const card = moduleCard(html, "3");

  assert.match(card, /50% lesson progress/);
  assert.match(card, />Resume module</);
});

test("a module without lesson progress retains the open action", () => {
  const card = moduleCard(renderModuleCards(emptyProgress()), "4");

  assert.match(card, />Open module</);
  assert.doesNotMatch(card, /lesson progress/);
});

test("multiple quiz attempts render only the most recent attempt by completion time", () => {
  const html = renderModuleCards(emptyProgress({
    quizAttempts: [
      { id: "new", moduleId: "3", score: 8, total: 10, completedAt: "2026-07-12T14:00:00.000Z", topicScores: {} },
      { id: "old", moduleId: "3", score: 4, total: 10, completedAt: "2026-07-11T14:00:00.000Z", topicScores: {} },
    ],
  }));
  const card = moduleCard(html, "3");

  assert.match(card, /Latest quiz: 8\/10 · 80%/);
  assert.doesNotMatch(card, /4\/10/);
});

test("quiz score formatting rounds score divided by total to a percentage", () => {
  const html = renderModuleCards(emptyProgress({
    quizAttempts: [
      { id: "score", moduleId: "2", score: 2, total: 3, completedAt: "2026-07-12T14:00:00.000Z", topicScores: {} },
    ],
  }));

  assert.match(moduleCard(html, "2"), /Latest quiz: 2\/3 · 67%/);
});

test("a module without quiz attempts does not fabricate a score", () => {
  const card = moduleCard(renderModuleCards(emptyProgress()), "4");

  assert.doesNotMatch(card, /Latest quiz:/);
  assert.doesNotMatch(card, /0\/\d+ · 0%/);
});

test("quiz status links to the matching module quiz route", () => {
  const html = renderModuleCards(emptyProgress({
    quizAttempts: [
      { id: "route", moduleId: "3", score: 8, total: 10, completedAt: "2026-07-12T14:00:00.000Z", topicScores: {} },
    ],
  }));
  const card = moduleCard(html, "3");

  assert.match(card, /href="\/modules\/3\/quiz"/);
  assert.match(card, />Retake quiz</);
});
