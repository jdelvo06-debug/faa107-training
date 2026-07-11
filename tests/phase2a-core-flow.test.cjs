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
  assert.deepEqual(timerAttempt, {
    score: 1,
    total: 2,
    passed: false,
    topicScores: {
      Regulations: { correct: 1, total: 1 },
      Operations: { correct: 0, total: 1 },
    },
    flaggedCount: 1,
  });
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

test("corrupt, invalid, missing-question, and expired exam sessions are rejected", () => {
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
  assert.equal(restoreActiveExamSession(valid, questions, now + 60_001), null);
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
