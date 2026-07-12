const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const ts = require("typescript");

const root = path.resolve(__dirname, "..");
const moduleCache = new Map();
const fixtures = JSON.parse(
  fs.readFileSync(path.join(__dirname, "fixtures/progress-canonical-cases.json"), "utf8"),
);
const NOW = new Date("2026-07-12T18:00:00.000Z");

function loadTypeScriptModule(relativePath) {
  const withExtension = relativePath.endsWith(".ts") ? relativePath : `${relativePath}.ts`;
  const absolutePath = path.join(root, withExtension);
  if (moduleCache.has(absolutePath)) return moduleCache.get(absolutePath).exports;
  const source = fs.readFileSync(absolutePath, "utf8");
  const output = ts.transpileModule(source, {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2022,
      esModuleInterop: true,
    },
    fileName: absolutePath,
  }).outputText;
  const loaded = { exports: {} };
  moduleCache.set(absolutePath, loaded);
  const localRequire = (specifier) => {
    if (specifier.startsWith("@/")) return loadTypeScriptModule(specifier.slice(2));
    if (specifier.startsWith("./")) {
      return loadTypeScriptModule(path.join(path.dirname(withExtension), specifier));
    }
    return require(specifier);
  };
  new Function("exports", "require", "module", "__filename", "__dirname", output)(
    loaded.exports,
    localRequire,
    loaded,
    absolutePath,
    path.dirname(absolutePath),
  );
  return loaded.exports;
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

function uuid(index) {
  return `00000000-0000-4000-8000-${String(index).padStart(12, "0")}`;
}

function quizAttempt(index, completedAt, overrides = {}) {
  return {
    id: uuid(index),
    moduleId: "1",
    score: 1,
    total: 2,
    topicScores: { Operations: { correct: 1, total: 2 } },
    completedAt,
    ...overrides,
  };
}

function examAttempt(index, completedAt, overrides = {}) {
  return {
    id: uuid(index),
    score: 1,
    total: 2,
    passed: false,
    topicScores: { Operations: { correct: 1, total: 2 } },
    completedAt,
    flaggedCount: 0,
    ...overrides,
  };
}

function activity(index, at, overrides = {}) {
  return {
    id: uuid(index),
    label: `Activity ${index}`,
    href: "/modules/1",
    at,
    ...overrides,
  };
}

test("fixture normalization implements the approved legacy version-one contract", () => {
  const { normalizeProgress } = loadTypeScriptModule("lib/progress-merge");
  for (const fixture of fixtures.normalization) {
    const result = normalizeProgress(fixture.input, NOW);
    assert.equal(result.status, "ok", fixture.name);
    assert.deepEqual(result.progress, fixture.expected, fixture.name);
  }
});

test("malformed and future versions are invalid or unsupported without becoming empty progress", () => {
  const { normalizeProgress } = loadTypeScriptModule("lib/progress-merge");
  for (const version of [0, -1, 1.5, "1", null]) {
    assert.equal(normalizeProgress({ version }, NOW).status, "invalid");
  }
  const raw = { version: 2, modules: { "1": { visitedSlideIds: ["m1-1"] } } };
  const result = normalizeProgress(raw, NOW);
  assert.deepEqual(result, { status: "unsupported", version: 2, raw });
});

test("invalid IDs timestamps scores labels and learner routes drop only their containing records", () => {
  const { normalizeProgress } = loadTypeScriptModule("lib/progress-merge");
  const validTime = "2026-07-12T17:00:00.000Z";
  const result = normalizeProgress(emptyProgress({
    quizAttempts: [
      quizAttempt(1, validTime),
      quizAttempt(2, "2019-12-31T23:59:59.999Z"),
      quizAttempt(3, "2026-07-12T18:05:00Z"),
      quizAttempt(4, validTime, { id: "NOT-A-UUID" }),
      quizAttempt(5, validTime, { moduleId: "99" }),
      quizAttempt(6, validTime, { score: 3, total: 2 }),
      quizAttempt(7, validTime, { total: 9999 }),
    ],
    recentActivity: [
      activity(10, validTime),
      activity(11, validTime, { href: "https://example.com" }),
      activity(12, validTime, { href: "/not-a-learner-route" }),
      activity(13, validTime, { label: "x".repeat(121) }),
      activity(14, "2026-07-12T18:05:00.001Z"),
    ],
  }), NOW);
  assert.equal(result.status, "ok");
  assert.deepEqual(result.progress.quizAttempts.map((item) => item.id), [uuid(1)]);
  assert.deepEqual(result.progress.recentActivity.map((item) => item.id), [uuid(10)]);
});

test("module completion is recomputed from every current course slide", () => {
  const { normalizeProgress } = loadTypeScriptModule("lib/progress-merge");
  const allSlides = Array.from({ length: 8 }, (_, index) => `m1-${index + 1}`);
  const complete = normalizeProgress(emptyProgress({
    modules: { "1": { visitedSlideIds: [...allSlides].reverse(), completed: false } },
  }), NOW);
  assert.equal(complete.status, "ok");
  assert.deepEqual(complete.progress.modules["1"], {
    visitedSlideIds: allSlides,
    completed: true,
    lastSlideId: "m1-8",
  });

  const incomplete = normalizeProgress(emptyProgress({
    modules: { "1": { visitedSlideIds: allSlides.slice(0, -1), completed: true } },
  }), NOW);
  assert.equal(incomplete.progress.modules["1"].completed, false);
});

test("duplicate attempt and activity timestamps use canonical JSON as the deterministic tie-breaker", () => {
  const { normalizeProgress } = loadTypeScriptModule("lib/progress-merge");
  const at = "2026-07-12T12:00:00.000Z";
  const result = normalizeProgress(emptyProgress({
    quizAttempts: [quizAttempt(1, at, { score: 2 }), quizAttempt(1, at, { score: 1 })],
    recentActivity: [
      activity(2, at, { label: "Zulu" }),
      activity(2, at, { label: "Alpha" }),
    ],
  }), NOW);
  assert.equal(result.status, "ok");
  assert.equal(result.progress.quizAttempts[0].score, 1);
  assert.equal(result.progress.recentActivity[0].label, "Alpha");
});

test("merge unions before applying the 30 quiz 10 exam and 8 activity retention caps", () => {
  const { mergeProgress } = loadTypeScriptModule("lib/progress-merge");
  const timestamp = (index) => new Date(Date.UTC(2026, 6, 12, 12, 0, index)).toISOString();
  const local = emptyProgress({
    quizAttempts: Array.from({ length: 20 }, (_, index) => quizAttempt(index + 1, timestamp(index + 1))),
    examAttempts: Array.from({ length: 7 }, (_, index) => examAttempt(index + 101, timestamp(index + 1))),
    recentActivity: Array.from({ length: 6 }, (_, index) => activity(index + 201, timestamp(index + 1))),
  });
  const remote = emptyProgress({
    quizAttempts: Array.from({ length: 20 }, (_, index) => quizAttempt(index + 21, timestamp(index + 21))),
    examAttempts: Array.from({ length: 7 }, (_, index) => examAttempt(index + 108, timestamp(index + 8))),
    recentActivity: Array.from({ length: 6 }, (_, index) => activity(index + 207, timestamp(index + 7))),
  });
  const merged = mergeProgress(local, remote, NOW);
  assert.equal(merged.quizAttempts.length, 30);
  assert.equal(merged.examAttempts.length, 10);
  assert.equal(merged.recentActivity.length, 8);
  assert.deepEqual(merged.quizAttempts.map((item) => item.id), Array.from({ length: 30 }, (_, index) => uuid(40 - index)));
  assert.deepEqual(mergeProgress(remote, local, NOW), merged);
});

test("flashcard conflicts use review timestamps and legacy conflicts prefer the active local owner", () => {
  const { mergeProgress } = loadTypeScriptModule("lib/progress-merge");
  const local = emptyProgress({ flashcards: {
    "1": {
      known: ["fc-1-ftn", "fc-1-uag"],
      unknown: [],
      reviewedAt: { "fc-1-ftn": "2026-07-12T10:00:00.000Z" },
    },
  } });
  const remote = emptyProgress({ flashcards: {
    "1": {
      known: [],
      unknown: ["fc-1-ftn", "fc-1-uag"],
      reviewedAt: { "fc-1-ftn": "2026-07-12T11:00:00.000Z" },
    },
  } });
  const merged = mergeProgress(local, remote, NOW);
  assert.deepEqual(merged.flashcards["1"].known, ["fc-1-uag"]);
  assert.deepEqual(merged.flashcards["1"].unknown, ["fc-1-ftn"]);
  assert.equal(merged.flashcards["1"].reviewedAt["fc-1-ftn"], "2026-07-12T11:00:00.000Z");
});

test("approved merge fixtures and canonical bytes are deterministic across input ordering", () => {
  const { canonicalProgressJson, mergeProgress } = loadTypeScriptModule("lib/progress-merge");
  for (const fixture of fixtures.merge) {
    const merged = mergeProgress(fixture.local, fixture.remote, NOW);
    assert.deepEqual(merged, fixture.expected, fixture.name);
    assert.equal(canonicalProgressJson(merged, NOW), canonicalProgressJson(fixture.expected, NOW));
  }
  const reordered = JSON.parse(JSON.stringify(fixtures.merge[0].expected));
  reordered.modules = { "1": { updatedAt: reordered.modules["1"].updatedAt, completed: false, visitedSlideIds: ["m1-2", "m1-1"], lastSlideId: "m1-2" } };
  reordered.quizAttempts.reverse();
  assert.equal(
    canonicalProgressJson(reordered, NOW),
    canonicalProgressJson(fixtures.merge[0].expected, NOW),
  );
});

test("derived deltas apply proposed changes without losing concurrent current additions", () => {
  const { applyProgressDelta, deriveProgressDelta } = loadTypeScriptModule("lib/progress-merge");
  const base = emptyProgress();
  const proposed = emptyProgress({ modules: { "1": { visitedSlideIds: ["m1-1"], completed: false } } });
  const current = emptyProgress({ quizAttempts: [quizAttempt(1, "2026-07-12T12:00:00.000Z")] });
  const applied = applyProgressDelta(current, deriveProgressDelta(base, proposed, NOW), NOW);
  assert.deepEqual(applied.modules["1"].visitedSlideIds, ["m1-1"]);
  assert.equal(applied.quizAttempts.length, 1);
});

test("applying a delta does not let unchanged legacy state override concurrent canonical changes", () => {
  const { applyProgressDelta, deriveProgressDelta } = loadTypeScriptModule("lib/progress-merge");
  const base = emptyProgress({
    modules: { "1": { visitedSlideIds: ["m1-1"], completed: false, lastSlideId: "m1-1" } },
    flashcards: { "1": { known: ["fc-1-ftn"], unknown: [] } },
  });
  const proposed = JSON.parse(JSON.stringify(base));
  proposed.quizAttempts.push(quizAttempt(1, "2026-07-12T12:00:00.000Z"));
  const current = emptyProgress({
    modules: { "1": { visitedSlideIds: ["m1-1", "m1-2"], completed: false, lastSlideId: "m1-2" } },
    flashcards: { "1": { known: [], unknown: ["fc-1-ftn"] } },
  });
  const applied = applyProgressDelta(current, deriveProgressDelta(base, proposed, NOW), NOW);
  assert.equal(applied.modules["1"].lastSlideId, "m1-2");
  assert.deepEqual(applied.flashcards["1"], { known: [], unknown: ["fc-1-ftn"] });
  assert.equal(applied.quizAttempts.length, 1);
});

test("canonical payloads exceeding 256 KiB are rejected", () => {
  const { normalizeProgress } = loadTypeScriptModule("lib/progress-merge");
  const { examQuestions } = loadTypeScriptModule("lib/questions");
  const review = examQuestions.slice(0, 100).map((question, index) => ({
    questionNumber: index + 1,
    sourceQuestionId: question.id,
    prompt: "P".repeat(120),
    topic: question.topic,
    selectedAnswer: "S".repeat(120),
    correctAnswer: "C".repeat(120),
    correct: false,
    explanation: "E".repeat(500),
    flagged: false,
  }));
  const attempts = Array.from({ length: 10 }, (_, index) => examAttempt(index + 1, `2026-07-12T${String(index + 1).padStart(2, "0")}:00:00.000Z`, {
    total: review.length,
    review,
  }));
  const result = normalizeProgress(emptyProgress({ examAttempts: attempts }), NOW);
  assert.equal(result.status, "invalid");
  assert.match(result.reason, /256 KiB/);
});
