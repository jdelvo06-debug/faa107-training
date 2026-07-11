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
