const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const React = require("react");
const { renderToStaticMarkup } = require("react-dom/server");
const ts = require("typescript");

const root = path.resolve(__dirname, "..");

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
  compile(
    loaded.exports,
    localRequire,
    loaded,
    absolutePath,
    path.dirname(absolutePath),
  );
  return loaded.exports;
}

function renderSlideViewer(slideCount) {
  const styles = new Proxy({}, { get: (_, name) => String(name) });
  const Icon = () => React.createElement("span", { "aria-hidden": "true" });
  const lucide = new Proxy({}, { get: () => Icon });
  const omitMotionProps = ({ custom, initial, animate, exit, transition, ...props }) => props;
  const ui = {
    Badge: ({ children, ...props }) => React.createElement("span", props, children),
    Button: ({ asChild, children, variant, size, ...props }) =>
      asChild
        ? React.cloneElement(React.Children.only(children), props)
        : React.createElement("button", props, children),
    Card: ({ children, ...props }) => React.createElement("section", props, children),
    CardContent: ({ children, ...props }) => React.createElement("div", props, children),
    Progress: (props) => React.createElement("progress", props),
  };
  const Link = ({ href, children, ...props }) =>
    React.createElement("a", { href, ...props }, children);
  const localRequire = (specifier) => {
    if (specifier === "react" || specifier === "react/jsx-runtime") return require(specifier);
    if (specifier === "next/link") return { __esModule: true, default: Link };
    if (specifier === "next/image") return { __esModule: true, default: (props) => React.createElement("img", props) };
    if (specifier === "lucide-react") return lucide;
    if (specifier === "framer-motion") {
      return {
        AnimatePresence: ({ children }) => React.createElement(React.Fragment, null, children),
        motion: {
          article: ({ children, ...props }) =>
            React.createElement("article", omitMotionProps(props), children),
        },
        useReducedMotion: () => true,
      };
    }
    if (specifier === "@/components/ui/badge") return { Badge: ui.Badge };
    if (specifier === "@/components/ui/button") return { Button: ui.Button };
    if (specifier === "@/components/ui/card") return { Card: ui.Card, CardContent: ui.CardContent };
    if (specifier === "@/components/ui/progress") return { Progress: ui.Progress };
    if (specifier === "@/lib/progress-storage") {
      return {
        addActivity: () => {},
        getProgress: () => ({ modules: {} }),
        markSlideVisited: () => {},
      };
    }
    if (specifier === "@/lib/utils") return { isFocusContained: () => false };
    if (specifier.endsWith("modern-flight-school.module.css")) {
      return { __esModule: true, default: styles };
    }
    throw new Error(`Unexpected dependency: ${specifier}`);
  };
  const { SlideViewer } = compileModule(
    "components/slide-viewer.tsx",
    localRequire,
    ts.JsxEmit.ReactJSX,
  );
  const slides = Array.from({ length: slideCount }, (_, index) => ({
    id: `slide-${index + 1}`,
    title: `Slide ${index + 1}`,
    blocks: [{ type: "paragraph", text: `Lesson content ${index + 1}` }],
  }));

  return renderToStaticMarkup(
    React.createElement(SlideViewer, {
      courseModule: {
        id: "1",
        number: 1,
        title: "Regulations",
        description: "Know the operating rules.",
        estimatedMinutes: 10,
        topicArea: "Regulations",
        slides,
      },
    }),
  );
}

test("final slide renders a truthful completion state with clear exit actions", () => {
  const html = renderSlideViewer(1);

  assert.match(html, />Module Complete</);
  assert.match(html, /Module completion recorded on this device\./);
  assert.match(html, /href="\/dashboard"[^>]*>.*Return to Dashboard/s);
  assert.match(html, />Review Module</);
  assert.doesNotMatch(html, />Next</);
});

test("non-final slides retain Next navigation without completion UI", () => {
  const html = renderSlideViewer(2);

  assert.match(html, />Next</);
  assert.doesNotMatch(html, /Module Complete/);
  assert.doesNotMatch(html, /Module completion recorded on this device\./);
  assert.doesNotMatch(html, /href="\/dashboard"/);
});

test("visiting every slide still records local module completion", () => {
  const originalWindow = global.window;
  const values = new Map();
  global.window = {
    localStorage: {
      getItem: (key) => values.get(key) ?? null,
      setItem: (key, value) => values.set(key, value),
    },
    dispatchEvent: () => true,
  };

  try {
    const { getProgress, markSlideVisited } = compileModule(
      "lib/progress-storage.ts",
      (specifier) => {
        if (specifier === "react") return React;
        if (specifier === "@/lib/exam-session") {
          return { restoreActiveExamSession: () => null };
        }
        throw new Error(`Unexpected dependency: ${specifier}`);
      },
    );

    markSlideVisited("1", "slide-1", 2);
    assert.equal(getProgress().modules["1"].completed, false);

    markSlideVisited("1", "slide-2", 2);
    assert.deepEqual(getProgress().modules["1"], {
      visitedSlideIds: ["slide-1", "slide-2"],
      lastSlideId: "slide-2",
      completed: true,
    });
  } finally {
    global.window = originalWindow;
  }
});
