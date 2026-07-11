const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
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

function question(id, topic, correctIndex = 1) {
  return {
    id,
    topic,
    prompt: `Question ${id}`,
    choices: [`${id}-A`, `${id}-B`, `${id}-C`, `${id}-D`],
    correctIndex,
    explanation: `Explanation ${id}`,
  };
}

const targetCounts = {
  Regulations: 12,
  Airspace: 12,
  Weather: 9,
  "Loading & Performance": 6,
  Operations: 21,
};

function sufficientPool(extraPerTopic = 3) {
  return Object.entries(targetCounts).flatMap(([topic, count]) =>
    Array.from({ length: count + extraPerTopic }, (_, index) =>
      question(`${topic}-${index}`, topic, index % 4),
    ),
  );
}

test("FAA builder returns 60 unique questions at the exact target distribution", () => {
  const { buildFaaTimedExam } = loadTypeScriptModule(
    "lib/assessment-engine.ts",
  );

  const exam = buildFaaTimedExam(sufficientPool(), { seed: 107 });
  const counts = Object.fromEntries(
    Object.keys(targetCounts).map((topic) => [
      topic,
      exam.filter((item) => item.topic === topic).length,
    ]),
  );

  assert.equal(exam.length, 60);
  assert.equal(new Set(exam.map((item) => item.sourceQuestionId)).size, 60);
  assert.deepEqual(counts, targetCounts);
});

test("FAA builder fails explicitly when one topic inventory is insufficient", () => {
  const { buildFaaTimedExam } = loadTypeScriptModule(
    "lib/assessment-engine.ts",
  );
  const pool = sufficientPool().filter(
    (item) => item.topic !== "Weather" || Number(item.id.split("-").at(-1)) < 8,
  );

  assert.throws(
    () => buildFaaTimedExam(pool, { seed: 107 }),
    /Weather.*requires 9 unique questions.*received 8/i,
  );
});

test("FAA presentation keeps the canonical correct answer among exactly three choices", () => {
  const { presentQuestion } = loadTypeScriptModule(
    "lib/assessment-engine.ts",
  );
  const canonical = question("q1", "Operations", 2);

  const presented = presentQuestion(canonical, "faa_timed", { seed: 11 });

  assert.equal(presented.choices.length, 3);
  assert.equal(
    presented.choices.includes(canonical.choices[canonical.correctIndex]),
    true,
  );
});

test("FAA presentation remaps correctIndex and records canonical choice indexes", () => {
  const { presentQuestion } = loadTypeScriptModule(
    "lib/assessment-engine.ts",
  );
  const canonical = question("q2", "Airspace", 3);

  const presented = presentQuestion(canonical, "faa_timed", { seed: 22 });

  assert.equal(
    presented.choices[presented.correctIndex],
    canonical.choices[canonical.correctIndex],
  );
  assert.equal(
    presented.presentation.sourceChoiceIndexes[presented.correctIndex],
    canonical.correctIndex,
  );
  assert.equal(new Set(presented.presentation.sourceChoiceIndexes).size, 3);
});

test("same seed reproduces selected questions and presentation order", () => {
  const { buildFaaTimedExam } = loadTypeScriptModule(
    "lib/assessment-engine.ts",
  );
  const pool = sufficientPool();

  const first = buildFaaTimedExam(pool, { seed: 2_026_07_11 });
  const second = buildFaaTimedExam(pool, { seed: 2_026_07_11 });

  assert.deepEqual(second, first);
});

test("stored presentation metadata reconstructs the same FAA question", () => {
  const { presentQuestion, restorePresentationQuestion } =
    loadTypeScriptModule("lib/assessment-engine.ts");
  const canonical = question("q3", "Weather", 0);
  const presented = presentQuestion(canonical, "faa_timed", { seed: 33 });

  const restored = restorePresentationQuestion(
    canonical,
    presented.presentation,
  );

  assert.deepEqual(restored, presented);
});

test("practice drill preserves all canonical choices and their correct index", () => {
  const { presentQuestion } = loadTypeScriptModule(
    "lib/assessment-engine.ts",
  );
  const canonical = question("q4", "Regulations", 2);

  const presented = presentQuestion(canonical, "practice_drill", { seed: 44 });

  assert.deepEqual(presented.choices, canonical.choices);
  assert.notEqual(presented.choices, canonical.choices);
  assert.equal(presented.correctIndex, canonical.correctIndex);
  assert.deepEqual(presented.presentation.sourceChoiceIndexes, [0, 1, 2, 3]);
});

test("presentation leaves the canonical question object untouched", () => {
  const { presentQuestion } = loadTypeScriptModule(
    "lib/assessment-engine.ts",
  );
  const canonical = question("q5", "Operations", 1);
  const before = structuredClone(canonical);

  presentQuestion(canonical, "faa_timed", { seed: 55 });

  assert.deepEqual(canonical, before);
});

test("study mode permits answer changes and exposes immediate feedback", () => {
  const { applyQuizAnswer, getQuizModePolicy } = loadTypeScriptModule(
    "lib/assessment-engine.ts",
  );

  const first = applyQuizAnswer("study", undefined, 1);
  const changed = applyQuizAnswer("study", first, 3);

  assert.equal(changed, 3);
  assert.deepEqual(getQuizModePolicy("study"), {
    answersMayChange: true,
    feedback: "immediate",
  });
});

test("assessment mode locks the first answer and defers feedback", () => {
  const { applyQuizAnswer, getQuizModePolicy } = loadTypeScriptModule(
    "lib/assessment-engine.ts",
  );

  const first = applyQuizAnswer("assessment", undefined, 1);
  const attemptedChange = applyQuizAnswer("assessment", first, 3);

  assert.equal(attemptedChange, 1);
  assert.deepEqual(getQuizModePolicy("assessment"), {
    answersMayChange: false,
    feedback: "completion",
  });
});
