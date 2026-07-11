const test = require("node:test");
const assert = require("node:assert/strict");
const path = require("node:path");
const fs = require("node:fs");
const ts = require("typescript");

const root = path.resolve(__dirname, "..");
const moduleCache = new Map();

function loadTypeScriptModule(relativePath) {
  const absolutePath = path.join(root, relativePath);
  if (moduleCache.has(absolutePath)) {
    return moduleCache.get(absolutePath).exports;
  }

  const source = fs.readFileSync(absolutePath, "utf8");
  const output = ts.transpileModule(source, {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2020,
      esModuleInterop: true,
    },
    fileName: absolutePath,
  }).outputText;
  const loaded = { exports: {} };
  moduleCache.set(absolutePath, loaded);

  const localRequire = (specifier) => {
    if (specifier.startsWith("@/")) {
      return loadTypeScriptModule(`${specifier.slice(2)}.ts`);
    }
    return require(specifier);
  };
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

test("isFocusContained returns false if container or target is null/undefined", () => {
  const { isFocusContained } = loadTypeScriptModule("lib/utils.ts");

  assert.strictEqual(isFocusContained(null, {}), false);
  assert.strictEqual(isFocusContained({}, null), false);
  assert.strictEqual(isFocusContained(null, null), false);
  assert.strictEqual(isFocusContained(undefined, undefined), false);
});

test("isFocusContained delegates to container.contains", () => {
  const { isFocusContained } = loadTypeScriptModule("lib/utils.ts");

  const mockTarget = { id: "target" };
  const mockContainer = {
    contains(node) {
      return node === mockTarget;
    },
  };

  assert.strictEqual(isFocusContained(mockContainer, mockTarget), true);
  assert.strictEqual(isFocusContained(mockContainer, { id: "other" }), false);
});

test("getTopicModuleHref returns correct module route for each TopicArea", () => {
  const { getTopicModuleHref } = loadTypeScriptModule("lib/progress-selectors.ts");

  assert.strictEqual(getTopicModuleHref("Regulations"), "/modules/2");
  assert.strictEqual(getTopicModuleHref("Airspace"), "/modules/3");
  assert.strictEqual(getTopicModuleHref("Weather"), "/modules/6");
  assert.strictEqual(getTopicModuleHref("Loading & Performance"), "/modules/7");
  assert.strictEqual(getTopicModuleHref("Operations"), "/modules/7");
  assert.strictEqual(getTopicModuleHref("Unknown"), "/modules");
});

test("findRecommendedDay returns the first day with an incomplete module", () => {
  const { findRecommendedDay } = loadTypeScriptModule("lib/progress-selectors.ts");

  const plan = [
    { day: 1, modules: [1, 2] },
    { day: 2, modules: [3] },
    { day: 3, modules: [4, 5] },
  ];

  assert.strictEqual(findRecommendedDay(plan, {}), 1);
  assert.strictEqual(findRecommendedDay(plan, { "1": { completed: true } }), 1);
  assert.strictEqual(
    findRecommendedDay(plan, {
      "1": { completed: true },
      "2": { completed: true },
    }),
    2
  );
  assert.strictEqual(
    findRecommendedDay(plan, {
      "1": { completed: true },
      "2": { completed: true },
      "3": { completed: true },
    }),
    3
  );
  assert.strictEqual(
    findRecommendedDay(plan, {
      "1": { completed: true },
      "2": { completed: true },
      "3": { completed: true },
      "4": { completed: true },
      "5": { completed: true },
    }),
    null
  );
});

test("getResumeTarget constructs appropriate labels and URLs", () => {
  const { getResumeTarget } = loadTypeScriptModule("lib/progress-selectors.ts");

  const state1 = {
    version: 1,
    modules: {},
    quizAttempts: [],
    flashcards: {},
    examAttempts: [],
    recentActivity: [],
  };
  const target1 = getResumeTarget(state1);
  assert.strictEqual(target1.href, "/modules/1");
  assert.strictEqual(target1.label, "Start Module 1");

  const state2 = {
    version: 1,
    modules: {
      "2": { visitedSlideIds: ["m2-1", "m2-2"], lastSlideId: "m2-2", completed: false },
    },
    quizAttempts: [],
    flashcards: {},
    examAttempts: [],
    recentActivity: [
      { id: "act1", label: "Viewed Module 2: Rules", href: "/modules/2", at: new Date().toISOString() },
    ],
  };
  const target2 = getResumeTarget(state2);
  assert.strictEqual(target2.href, "/modules/2");
  assert.match(target2.label, /^Resume Module 2/);
});
