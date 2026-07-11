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

function question(id, correctIndex, topic = "Operations") {
  return {
    id,
    topic,
    prompt: `Question ${id}`,
    choices: ["A", "B", "C", "D"],
    correctIndex,
    explanation: "Explanation",
  };
}

test("every generated study-plan module link uses the real numeric route", () => {
  const { moduleHref } = loadTypeScriptModule("lib/learning-routes.ts");

  for (let moduleNumber = 1; moduleNumber <= 13; moduleNumber += 1) {
    const href = moduleHref(moduleNumber);
    assert.equal(href, `/modules/${moduleNumber}`);
    assert.doesNotMatch(href, /\/modules\/module-/);
  }
});

test("flashcard activity routes separate the progress namespace from the learner URL", () => {
  const { flashcardActivityHref } = loadTypeScriptModule(
    "lib/learning-routes.ts",
  );

  assert.equal(flashcardActivityHref("all", "/flashcards"), "/flashcards");
  assert.equal(flashcardActivityHref("9"), "/modules/9/flashcards");
});

test("timer submission uses the latest answers and flags and only completes once", () => {
  const { createExamSubmissionController } = loadTypeScriptModule(
    "lib/exam-session.ts",
  );
  const pool = [question("q1", 1, "Regulations"), question("q2", 0)];
  const controller = createExamSubmissionController();

  controller.update({ pool, answers: {}, flags: [] });
  controller.update({ pool, answers: { q1: 1, q2: 3 }, flags: ["q2"] });

  const timerAttempt = controller.submit();
  assert.deepEqual(
    {
      score: timerAttempt.score,
      total: timerAttempt.total,
      passed: timerAttempt.passed,
      topicScores: timerAttempt.topicScores,
      flaggedCount: timerAttempt.flaggedCount,
    },
    {
    score: 1,
    total: 2,
    passed: false,
    topicScores: {
      Regulations: { correct: 1, total: 1 },
      Operations: { correct: 0, total: 1 },
    },
    flaggedCount: 1,
    },
  );
  assert.equal(timerAttempt.review.length, 2);
  assert.equal(controller.submit(), null, "button/timer race must not duplicate");
});

test("active exam sessions round-trip exact question order and learner state", () => {
  const { createActiveExamSession, restoreActiveExamSession } =
    loadTypeScriptModule("lib/exam-session.ts");
  const now = 2_000_000;
  const questions = [question("q1", 0), question("q2", 1), question("q3", 2)];
  const stored = createActiveExamSession(
    {
      questionIds: ["q3", "q1", "q2"],
      answers: { q3: 2, q1: 1 },
      flags: ["q2"],
      currentIndex: 2,
      remainingSeconds: 4_321,
    },
    now,
  );

  const restored = restoreActiveExamSession(
    JSON.parse(JSON.stringify(stored)),
    questions,
    now,
  );

  assert.ok(restored);
  assert.deepEqual(
    restored.pool.map((item) => item.id),
    ["q3", "q1", "q2"],
  );
  assert.deepEqual(restored.answers, { q3: 2, q1: 1 });
  assert.deepEqual(restored.flags, ["q2"]);
  assert.equal(restored.currentIndex, 2);
  assert.equal(restored.secondsLeft, 4_321);
  assert.equal(restored.started, true);
});

test("corrupt, invalid, and missing-question exam sessions are rejected", () => {
  const { createActiveExamSession, restoreActiveExamSession } =
    loadTypeScriptModule("lib/exam-session.ts");
  const now = 3_000_000;
  const questions = [question("q1", 0), question("q2", 1)];
  const valid = createActiveExamSession(
    {
      questionIds: ["q1", "q2"],
      answers: { q1: 0 },
      flags: ["q2"],
      currentIndex: 1,
      remainingSeconds: 60,
    },
    now,
  );

  assert.equal(restoreActiveExamSession("not an object", questions, now), null);
  assert.equal(
    restoreActiveExamSession({ ...valid, answers: { unknown: 0 } }, questions, now),
    null,
  );
  assert.equal(
    restoreActiveExamSession(valid, questions.slice(0, 1), now),
    null,
  );
  const expired = restoreActiveExamSession(valid, questions, now + 60_001);
  assert.ok(expired);
  assert.equal(expired.variant, "legacy_timed");
  assert.equal(expired.secondsLeft, 0);
});

test("FAA timed session round-trips exact variant, presentation, learner state, and deadline", () => {
  const { buildFaaTimedExam } = loadTypeScriptModule(
    "lib/assessment-engine.ts",
  );
  const { createActiveExamSession, restoreActiveExamSession } =
    loadTypeScriptModule("lib/exam-session.ts");
  const topics = {
    Regulations: 12,
    Airspace: 12,
    Weather: 9,
    "Loading & Performance": 6,
    Operations: 21,
  };
  const questions = Object.entries(topics).flatMap(([topic, count]) =>
    Array.from({ length: count }, (_, index) =>
      question(`${topic}-${index}`, index % 4, topic),
    ),
  );
  const now = 4_000_000;
  const seed = 2_026_07_11;
  const pool = buildFaaTimedExam(questions, { seed });
  const stored = createActiveExamSession(
    {
      variant: "faa_timed",
      seed,
      questions: pool,
      answers: {
        [pool[0].sourceQuestionId]: 1,
        [pool[1].sourceQuestionId]: 2,
      },
      flags: [pool[1].sourceQuestionId],
      currentIndex: 1,
      remainingSeconds: 6_543,
    },
    now,
  );

  const restored = restoreActiveExamSession(
    JSON.parse(JSON.stringify(stored)),
    questions,
    now,
  );

  assert.ok(restored);
  assert.equal(restored.variant, "faa_timed");
  assert.equal(restored.seed, seed);
  assert.deepEqual(restored.pool, pool);
  assert.deepEqual(restored.answers, stored.answers);
  assert.deepEqual(restored.flags, stored.flags);
  assert.equal(restored.currentIndex, 1);
  assert.equal(restored.deadlineAt, now + 6_543_000);
});

test("practice drill session round-trips canonical choices without a timer", () => {
  const { buildPracticeDrill } = loadTypeScriptModule(
    "lib/assessment-engine.ts",
  );
  const { createActiveExamSession, restoreActiveExamSession } =
    loadTypeScriptModule("lib/exam-session.ts");
  const questions = [question("q1", 0), question("q2", 3), question("q3", 2)];
  const pool = buildPracticeDrill(questions, { seed: 55, count: 3 });
  const stored = createActiveExamSession({
    variant: "practice_drill",
    seed: 55,
    questions: pool,
    answers: { [pool[0].sourceQuestionId]: 0 },
    flags: [pool[2].sourceQuestionId],
    currentIndex: 2,
    deadlineAt: null,
  });

  const restored = restoreActiveExamSession(stored, questions);

  assert.ok(restored);
  assert.equal(restored.variant, "practice_drill");
  assert.equal(restored.deadlineAt, null);
  assert.deepEqual(restored.pool, pool);
  assert.equal(restored.pool.every((item) => item.choices.length === 4), true);
});

test("version 2 sessions reject changed, corrupt, or incompatible presentation metadata", () => {
  const { presentQuestion } = loadTypeScriptModule(
    "lib/assessment-engine.ts",
  );
  const { createActiveExamSession, restoreActiveExamSession } =
    loadTypeScriptModule("lib/exam-session.ts");
  const questions = [question("q1", 1), question("q2", 0)];
  const pool = questions.map((item) =>
    presentQuestion(item, "faa_timed", { seed: 80 }),
  );
  const stored = createActiveExamSession({
    variant: "faa_timed",
    seed: 80,
    questions: pool,
    answers: {},
    flags: [],
    currentIndex: 0,
    remainingSeconds: 60,
  });

  assert.equal(
    restoreActiveExamSession(
      {
        ...stored,
        questions: stored.questions.map((item, index) =>
          index === 0
            ? {
                ...item,
                presentation: {
                  ...item.presentation,
                  sourceChoiceIndexes: [0, 0, 1],
                },
              }
            : item,
        ),
      },
      questions,
    ),
    null,
  );
});

test("review summary reports answered, unanswered, and flagged counts", () => {
  const { createExamReviewSummary } = loadTypeScriptModule(
    "lib/exam-session.ts",
  );
  const pool = [question("q1", 0), question("q2", 1), question("q3", 2)];

  assert.deepEqual(
    createExamReviewSummary(pool, { q1: 0, q3: 1 }, ["q2", "q3"]),
    { answered: 2, unanswered: 1, flagged: 2, total: 3 },
  );
});

test("manual submit requires confirmation only when unanswered questions remain", () => {
  const { getManualSubmitGuard } = loadTypeScriptModule(
    "lib/exam-session.ts",
  );

  assert.deepEqual(
    getManualSubmitGuard({ answered: 59, unanswered: 1, flagged: 3, total: 60 }),
    { requiresConfirmation: true, unanswered: 1 },
  );
  assert.deepEqual(
    getManualSubmitGuard({ answered: 60, unanswered: 0, flagged: 3, total: 60 }),
    { requiresConfirmation: false, unanswered: 0 },
  );
});

test("completed exam attempt retains detailed answer-review data", () => {
  const { createExamSubmissionController } = loadTypeScriptModule(
    "lib/exam-session.ts",
  );
  const pool = [question("q1", 1, "Airspace"), question("q2", 0, "Weather")];
  const controller = createExamSubmissionController();

  controller.update({
    variant: "practice_drill",
    pool,
    answers: { q1: 1 },
    flags: ["q2"],
  });
  const attempt = controller.submit();

  assert.equal(attempt.variant, "practice_drill");
  assert.deepEqual(attempt.review, [
    {
      questionNumber: 1,
      sourceQuestionId: "q1",
      prompt: "Question q1",
      topic: "Airspace",
      selectedAnswer: "B",
      correctAnswer: "B",
      correct: true,
      explanation: "Explanation",
      flagged: false,
    },
    {
      questionNumber: 2,
      sourceQuestionId: "q2",
      prompt: "Question q2",
      topic: "Weather",
      selectedAnswer: null,
      correctAnswer: "A",
      correct: false,
      explanation: "Explanation",
      flagged: true,
    },
  ]);
});

test("successful final submission clears the active session and stores one attempt", () => {
  const originalWindow = global.window;
  const values = new Map();
  global.window = {
    localStorage: {
      getItem: (key) => values.get(key) ?? null,
      setItem: (key, value) => values.set(key, value),
      removeItem: (key) => values.delete(key),
    },
    dispatchEvent: () => true,
  };

  try {
    const {
      completeExamAttempt,
      getProgress,
      saveActiveExamSession,
    } = loadTypeScriptModule("lib/progress-storage.ts");
    const { createActiveExamSession } = loadTypeScriptModule(
      "lib/exam-session.ts",
    );
    saveActiveExamSession(
      createActiveExamSession(
        {
          questionIds: ["q1"],
          answers: { q1: 0 },
          flags: [],
          currentIndex: 0,
          remainingSeconds: 60,
        },
        Date.now(),
      ),
    );

    const completion = completeExamAttempt({
      score: 1,
      total: 1,
      passed: true,
      topicScores: { Operations: { correct: 1, total: 1 } },
      flaggedCount: 0,
    });

    assert.equal(values.has("faa107-active-exam-v1"), false);
    assert.deepEqual(completion, { persisted: true, activeSessionCleared: true });
    assert.equal(getProgress().examAttempts.length, 1);
    assert.equal(getProgress().recentActivity.length, 1);
  } finally {
    global.window = originalWindow;
  }
});

test("failed final persistence returns a recoverable result and safely attempts cleanup", () => {
  const originalWindow = global.window;
  let cleanupAttempts = 0;
  global.window = {
    localStorage: {
      getItem: () => null,
      setItem: () => {
        throw new Error("QuotaExceededError");
      },
      removeItem: () => {
        cleanupAttempts += 1;
        throw new Error("SecurityError");
      },
    },
    dispatchEvent: () => true,
  };

  try {
    const { completeExamAttempt } = loadTypeScriptModule(
      "lib/progress-storage.ts",
    );
    let completion;

    assert.doesNotThrow(() => {
      completion = completeExamAttempt({
        score: 7,
        total: 10,
        passed: true,
        topicScores: { Operations: { correct: 7, total: 10 } },
        flaggedCount: 1,
      });
    });
    assert.deepEqual(completion, {
      persisted: false,
      activeSessionCleared: false,
    });
    assert.equal(cleanupAttempts, 1);
  } finally {
    global.window = originalWindow;
  }
});

test("completion outcome routes persisted results and preserves failed results in memory", () => {
  const { createExamCompletionOutcome } = loadTypeScriptModule(
    "lib/exam-session.ts",
  );
  const attempt = {
    score: 7,
    total: 10,
    passed: true,
    topicScores: { Operations: { correct: 7, total: 10 } },
    flaggedCount: 0,
  };

  assert.deepEqual(createExamCompletionOutcome(attempt, true), {
    route: "/exam/results",
    fallback: null,
  });
  assert.deepEqual(createExamCompletionOutcome(attempt, false), {
    route: null,
    fallback: {
      score: 7,
      total: 10,
      passed: true,
    },
  });
});

test("active exam saves fail safely when localStorage setItem throws", () => {
  const originalWindow = global.window;
  global.window = {
    localStorage: {
      getItem: () => null,
      setItem: () => {
        throw new Error("QuotaExceededError");
      },
      removeItem: () => {},
    },
    dispatchEvent: () => true,
  };

  try {
    const { saveActiveExamSession } = loadTypeScriptModule(
      "lib/progress-storage.ts",
    );
    const { createActiveExamSession } = loadTypeScriptModule(
      "lib/exam-session.ts",
    );
    const session = createActiveExamSession({
      questionIds: ["q1"],
      answers: {},
      flags: [],
      currentIndex: 0,
      remainingSeconds: 60,
    });
    let continued = false;
    let result;

    assert.doesNotThrow(() => {
      result = saveActiveExamSession(session);
      continued = true;
    });
    assert.equal(result, false);
    assert.equal(continued, true, "exam state updates must continue in memory");
  } finally {
    global.window = originalWindow;
  }
});

test("active exam reads fail safely when getItem and cleanup both throw", () => {
  const originalWindow = global.window;
  global.window = {
    localStorage: {
      getItem: () => {
        throw new Error("SecurityError");
      },
      setItem: () => {},
      removeItem: () => {
        throw new Error("SecurityError");
      },
    },
    dispatchEvent: () => true,
  };

  try {
    const { getActiveExamSession } = loadTypeScriptModule(
      "lib/progress-storage.ts",
    );
    let restored;
    assert.doesNotThrow(() => {
      restored = getActiveExamSession([question("q1", 0)]);
    });
    assert.equal(restored, null);
  } finally {
    global.window = originalWindow;
  }
});

test("invalid-session and explicit active-exam cleanup fail safely", () => {
  const originalWindow = global.window;
  global.window = {
    localStorage: {
      getItem: () => JSON.stringify({ version: 1, started: true }),
      setItem: () => {},
      removeItem: () => {
        throw new Error("SecurityError");
      },
    },
    dispatchEvent: () => true,
  };

  try {
    const { clearActiveExamSession, getActiveExamSession } =
      loadTypeScriptModule("lib/progress-storage.ts");
    let restored;
    let cleared;

    assert.doesNotThrow(() => {
      restored = getActiveExamSession([question("q1", 0)]);
      cleared = clearActiveExamSession();
    });
    assert.equal(restored, null);
    assert.equal(cleared, false);
  } finally {
    global.window = originalWindow;
  }
});

test("expired FAA timed sessions restore at zero so their saved snapshot can complete", () => {
  const { buildFaaTimedExam } = loadTypeScriptModule("lib/assessment-engine.ts");
  const { createActiveExamSession, restoreActiveExamSession } =
    loadTypeScriptModule("lib/exam-session.ts");
  const topics = { Regulations: 12, Airspace: 12, Weather: 9, "Loading & Performance": 6, Operations: 21 };
  const questions = Object.entries(topics).flatMap(([topic, count]) =>
    Array.from({ length: count }, (_, index) => question(`${topic}-expired-${index}`, index % 4, topic)),
  );
  const pool = buildFaaTimedExam(questions, { seed: 91 });
  const stored = createActiveExamSession({
    variant: "faa_timed",
    seed: 91,
    questions: pool,
    answers: { [pool[0].sourceQuestionId]: pool[0].correctIndex },
    flags: [pool[1].sourceQuestionId],
    currentIndex: 4,
    deadlineAt: 10_000,
  });

  const restored = restoreActiveExamSession(stored, questions, 10_001);

  assert.ok(restored);
  assert.equal(restored.variant, "faa_timed");
  assert.equal(restored.secondsLeft, 0);
  assert.deepEqual(restored.answers, stored.answers);
  assert.deepEqual(restored.flags, stored.flags);
  assert.deepEqual(restored.pool, pool);
});

test("legacy active sessions resume honestly as timed legacy exams", () => {
  const { restoreActiveExamSession } = loadTypeScriptModule("lib/exam-session.ts");
  const now = 20_000;
  const questions = [question("legacy-1", 0), question("legacy-2", 1)];
  const restored = restoreActiveExamSession({
    version: 1,
    started: true,
    questionIds: questions.map((item) => item.id),
    answers: { "legacy-1": 0 },
    flags: ["legacy-2"],
    currentIndex: 1,
    deadlineAt: now + 30_000,
  }, questions, now);

  assert.ok(restored);
  assert.equal(restored.variant, "legacy_timed");
  assert.equal(restored.secondsLeft, 30);
  assert.equal(restored.deadlineAt, now + 30_000);
});

test("result messaging distinguishes FAA assessment, drill study, and legacy timed attempts", () => {
  const { getExamResultMessaging } = loadTypeScriptModule("lib/exam-session.ts");

  assert.deepEqual(getExamResultMessaging("faa_timed", true), {
    label: "FAA-like Timed Exam", title: "Passing score", action: "Retake exam", assessment: true,
  });
  assert.deepEqual(getExamResultMessaging("practice_drill", false), {
    label: "Practice Drill", title: "Drill complete", action: "Start another drill", assessment: false,
  });
  assert.deepEqual(getExamResultMessaging("legacy_timed", false), {
    label: "Resumed legacy timed practice exam", title: "Legacy timed practice complete", action: "Choose new practice", assessment: true,
  });
});

test("unanswered confirmation uses Radix Dialog focus management", () => {
  const source = fs.readFileSync(path.join(root, "components/practice-exam.tsx"), "utf8");

  assert.match(source, /@radix-ui\/react-dialog/);
  assert.match(source, /<Dialog\.Root open=\{confirmUnanswered\}/);
  assert.match(source, /<Dialog\.Content/);
  assert.doesNotMatch(source, /role="alertdialog"/);
});
