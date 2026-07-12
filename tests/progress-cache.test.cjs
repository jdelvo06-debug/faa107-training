const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const ts = require("typescript");

const root = path.resolve(__dirname, "..");
const moduleCache = new Map();
const NOW = new Date("2026-07-12T18:00:00.000Z");
const USER_A = "11111111-1111-4111-8111-111111111111";
const USER_B = "22222222-2222-4222-8222-222222222222";
const GENERATION = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa";

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
    if (specifier === "react") return { useEffect: () => {}, useState: (value) => [value, () => {}] };
    if (specifier.startsWith("@/")) return loadTypeScriptModule(specifier.slice(2));
    if (specifier.startsWith("./")) return loadTypeScriptModule(path.join(path.dirname(withExtension), specifier));
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

class MemoryStorage {
  constructor(entries = {}) {
    this.values = new Map(Object.entries(entries));
    this.reads = [];
  }
  getItem(key) {
    this.reads.push(key);
    return this.values.get(key) ?? null;
  }
  setItem(key, value) {
    this.values.set(key, value);
  }
  removeItem(key) {
    this.values.delete(key);
  }
}

class ImmediateLocks {
  constructor() {
    this.requests = [];
  }
  request(name, options, callback) {
    this.requests.push({ name, options });
    return callback();
  }
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

function progressWithSlide(slideId) {
  return emptyProgress({ modules: { "1": { visitedSlideIds: [slideId], completed: false, lastSlideId: slideId } } });
}

test("owner-scoped keys are exact and invalid owner IDs are rejected", () => {
  const { anonymousProgressKey, progressKeyForUser, unsyncedKeyForUser, anonymousImportKey } = loadTypeScriptModule("lib/progress-cache");
  assert.equal(anonymousProgressKey, "faa107-progress-v1");
  assert.equal(progressKeyForUser(USER_A), `faa107-progress-v1:${USER_A}`);
  assert.equal(unsyncedKeyForUser(USER_A), `faa107-progress-unsynced-v1:${USER_A}`);
  assert.equal(anonymousImportKey, "faa107-progress-anonymous-import-v1");
  assert.throws(() => progressKeyForUser("NOT-A-UUID"), /valid lowercase UUID/);
});

test("reading user B never reads anonymous or user A bytes", () => {
  const { createNeverSyncedEnvelope, progressKeyForUser, readAuthenticatedCache } = loadTypeScriptModule("lib/progress-cache");
  const storage = new MemoryStorage({
    "faa107-progress-v1": JSON.stringify(progressWithSlide("m1-1")),
    [progressKeyForUser(USER_A)]: JSON.stringify(createNeverSyncedEnvelope(progressWithSlide("m1-2"), NOW)),
    [progressKeyForUser(USER_B)]: JSON.stringify(createNeverSyncedEnvelope(progressWithSlide("m1-3"), NOW)),
  });
  const result = readAuthenticatedCache(storage, USER_B, NOW);
  assert.equal(result.status, "ok");
  assert.deepEqual(result.envelope.progress.modules["1"].visitedSlideIds, ["m1-3"]);
  assert.deepEqual(storage.reads, [progressKeyForUser(USER_B)]);
});

test("authenticated envelope preserves generation epoch revision and base metadata on local writes", () => {
  const { progressKeyForUser, readAuthenticatedCache, updateAuthenticatedProgress, writeAuthenticatedCache } = loadTypeScriptModule("lib/progress-cache");
  const storage = new MemoryStorage();
  const base = progressWithSlide("m1-1");
  writeAuthenticatedCache(storage, USER_A, {
    envelopeVersion: 1,
    progress: base,
    resetGeneration: GENERATION,
    resetEpoch: "9007199254740993",
    revision: "9007199254740995",
    baseProgress: base,
  }, NOW);
  updateAuthenticatedProgress(storage, USER_A, progressWithSlide("m1-2"), NOW);
  const stored = readAuthenticatedCache(storage, USER_A, NOW);
  assert.equal(stored.status, "ok");
  assert.deepEqual({
    resetGeneration: stored.envelope.resetGeneration,
    resetEpoch: stored.envelope.resetEpoch,
    revision: stored.envelope.revision,
    baseProgress: stored.envelope.baseProgress,
  }, {
    resetGeneration: GENERATION,
    resetEpoch: "9007199254740993",
    revision: "9007199254740995",
    baseProgress: base,
  });
  assert.deepEqual(stored.envelope.progress.modules["1"].visitedSlideIds, ["m1-2"]);
  assert.equal(JSON.parse(storage.values.get(progressKeyForUser(USER_A))).resetEpoch, "9007199254740993");
});

test("untagged malformed and future-version scoped cache bytes remain unmodified and unpromoted", () => {
  const { progressKeyForUser, readAuthenticatedCache, updateAuthenticatedProgress } = loadTypeScriptModule("lib/progress-cache");
  for (const [raw, expectedStatus] of [
    [JSON.stringify(progressWithSlide("m1-1")), "invalid"],
    ["{malformed", "invalid"],
    [JSON.stringify({ envelopeVersion: 1, progress: { version: 2 }, resetGeneration: null, resetEpoch: null, revision: null, baseProgress: null }), "unsupported"],
  ]) {
    const key = progressKeyForUser(USER_A);
    const storage = new MemoryStorage({ [key]: raw });
    assert.equal(readAuthenticatedCache(storage, USER_A, NOW).status, expectedStatus);
    assert.throws(() => updateAuthenticatedProgress(storage, USER_A, emptyProgress(), NOW), /unverified authenticated cache/);
    assert.equal(storage.values.get(key), raw);
  }
});

test("envelope metadata accepts only lowercase UUIDs and canonical non-negative decimal strings", () => {
  const { progressKeyForUser, readAuthenticatedCache } = loadTypeScriptModule("lib/progress-cache");
  const variants = [
    { resetGeneration: GENERATION.toUpperCase(), resetEpoch: "0", revision: "0" },
    { resetGeneration: GENERATION, resetEpoch: "01", revision: "0" },
    { resetGeneration: GENERATION, resetEpoch: "0", revision: -1 },
    { resetGeneration: GENERATION, resetEpoch: null, revision: "0" },
  ];
  for (const metadata of variants) {
    const key = progressKeyForUser(USER_A);
    const raw = JSON.stringify({ envelopeVersion: 1, progress: emptyProgress(), baseProgress: emptyProgress(), ...metadata });
    const storage = new MemoryStorage({ [key]: raw });
    assert.equal(readAuthenticatedCache(storage, USER_A, NOW).status, "invalid");
    assert.equal(storage.values.get(key), raw);
  }
});

test("scoped envelopes classify generation and epoch mismatches as stale without merging bytes", () => {
  const { classifyAuthenticatedEnvelope } = loadTypeScriptModule("lib/progress-cache");
  const envelope = {
    envelopeVersion: 1,
    progress: progressWithSlide("m1-1"),
    resetGeneration: GENERATION,
    resetEpoch: "7",
    revision: "9",
    baseProgress: progressWithSlide("m1-1"),
  };
  assert.equal(classifyAuthenticatedEnvelope(envelope, GENERATION, "7"), "current");
  assert.equal(classifyAuthenticatedEnvelope(envelope, "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb", "7"), "stale");
  assert.equal(classifyAuthenticatedEnvelope(envelope, GENERATION, "8"), "stale");
  assert.equal(classifyAuthenticatedEnvelope({ ...envelope, resetGeneration: null, resetEpoch: null, revision: null, baseProgress: null }, GENERATION, "7"), "unverified");
});

test("anonymous import claims persist and verify the exact normalized snapshot and SHA-256 hash under a Web Lock", async () => {
  const { anonymousImportKey, anonymousProgressKey, claimAnonymousProgress, readAnonymousImportSnapshot } = loadTypeScriptModule("lib/progress-cache");
  const anonymous = progressWithSlide("m1-1");
  const storage = new MemoryStorage({ [anonymousProgressKey]: JSON.stringify(anonymous) });
  const locks = new ImmediateLocks();
  const result = await claimAnonymousProgress(storage, locks, USER_A, NOW);
  assert.equal(result.status, "claimed");
  assert.match(result.claim.snapshotHash, /^[a-f0-9]{64}$/);
  assert.deepEqual(result.claim.snapshot, anonymous);
  assert.deepEqual(locks.requests, [{ name: anonymousImportKey, options: { mode: "exclusive" } }]);
  assert.deepEqual(await readAnonymousImportSnapshot(storage, USER_A, NOW), result.claim);
  assert.equal(JSON.parse(storage.values.get(anonymousImportKey)).state, "pending");
});

test("pending import retry uses its durable snapshot when anonymous progress mutates", async () => {
  const { anonymousProgressKey, claimAnonymousProgress, readAnonymousImportSnapshot } = loadTypeScriptModule("lib/progress-cache");
  const original = progressWithSlide("m1-1");
  const later = progressWithSlide("m1-2");
  const storage = new MemoryStorage({ [anonymousProgressKey]: JSON.stringify(original) });
  const locks = new ImmediateLocks();
  const first = await claimAnonymousProgress(storage, locks, USER_A, NOW);
  storage.setItem(anonymousProgressKey, JSON.stringify(later));
  const retry = await claimAnonymousProgress(storage, locks, USER_A, NOW);
  assert.equal(retry.status, "pending");
  assert.deepEqual(retry.claim.snapshot, original);
  assert.deepEqual((await readAnonymousImportSnapshot(storage, USER_A, NOW)).snapshot, original);
});

test("claim ownership is pinned to the first user and completed claims never import twice", async () => {
  const { anonymousProgressKey, claimAnonymousProgress, completeAnonymousImport } = loadTypeScriptModule("lib/progress-cache");
  const storage = new MemoryStorage({ [anonymousProgressKey]: JSON.stringify(progressWithSlide("m1-1")) });
  const locks = new ImmediateLocks();
  const claimed = await claimAnonymousProgress(storage, locks, USER_A, NOW);
  assert.equal((await claimAnonymousProgress(storage, locks, USER_B, NOW)).status, "owned-by-other");
  const completed = await completeAnonymousImport(storage, locks, USER_A, claimed.claim.snapshotHash, NOW);
  assert.deepEqual(completed, { status: "complete", anonymousCleared: true });
  assert.equal((await claimAnonymousProgress(storage, locks, USER_A, NOW)).status, "complete");
  assert.equal((await claimAnonymousProgress(storage, locks, USER_B, NOW)).status, "owned-by-other");
});

test("completion preserves anonymous progress changed after a pending claim", async () => {
  const { anonymousProgressKey, claimAnonymousProgress, completeAnonymousImport } = loadTypeScriptModule("lib/progress-cache");
  const original = progressWithSlide("m1-1");
  const later = progressWithSlide("m1-2");
  const storage = new MemoryStorage({ [anonymousProgressKey]: JSON.stringify(original) });
  const locks = new ImmediateLocks();
  const claimed = await claimAnonymousProgress(storage, locks, USER_A, NOW);
  storage.setItem(anonymousProgressKey, JSON.stringify(later));
  const completed = await completeAnonymousImport(storage, locks, USER_A, claimed.claim.snapshotHash, NOW);
  assert.deepEqual(completed, { status: "complete", anonymousCleared: false });
  assert.deepEqual(JSON.parse(storage.values.get(anonymousProgressKey)), later);
});

test("storage-denied or lock-denied browsers skip automatic import without changing anonymous bytes", async () => {
  const { anonymousProgressKey, claimAnonymousProgress } = loadTypeScriptModule("lib/progress-cache");
  const raw = JSON.stringify(progressWithSlide("m1-1"));
  const deniedStorage = new MemoryStorage({ [anonymousProgressKey]: raw });
  deniedStorage.setItem = () => { throw new Error("SecurityError"); };
  assert.equal((await claimAnonymousProgress(deniedStorage, new ImmediateLocks(), USER_A, NOW)).status, "unavailable");
  assert.equal(deniedStorage.values.get(anonymousProgressKey), raw);
  const storage = new MemoryStorage({ [anonymousProgressKey]: raw });
  const deniedLocks = { request: async () => { throw new Error("NotSupportedError"); } };
  assert.equal((await claimAnonymousProgress(storage, deniedLocks, USER_A, NOW)).status, "unavailable");
  assert.equal(storage.values.get(anonymousProgressKey), raw);
});

test("an import claim that cannot be read back is discarded instead of becoming partially durable", async () => {
  const { anonymousImportKey, anonymousProgressKey, claimAnonymousProgress } = loadTypeScriptModule("lib/progress-cache");
  const raw = JSON.stringify(progressWithSlide("m1-1"));
  const storage = new MemoryStorage({ [anonymousProgressKey]: raw });
  let claimWritten = false;
  const originalGetItem = storage.getItem.bind(storage);
  storage.setItem = (key, value) => {
    storage.values.set(key, value);
    if (key === anonymousImportKey) claimWritten = true;
  };
  storage.getItem = (key) => {
    if (key === anonymousImportKey && claimWritten) throw new Error("SecurityError");
    return originalGetItem(key);
  };
  const result = await claimAnonymousProgress(storage, new ImmediateLocks(), USER_A, NOW);
  assert.equal(result.status, "unavailable");
  assert.equal(storage.values.has(anonymousImportKey), false);
  assert.equal(storage.values.get(anonymousProgressKey), raw);
});

test("unsynced markers are owner-scoped and preserve bigint-safe generation metadata", () => {
  const { clearUnsyncedMarker, readUnsyncedMarker, unsyncedKeyForUser, writeUnsyncedMarker } = loadTypeScriptModule("lib/progress-cache");
  const storage = new MemoryStorage();
  const marker = { dirty: true, resetGeneration: GENERATION, lastAttemptAt: "2026-07-12T17:00:00.000Z" };
  writeUnsyncedMarker(storage, USER_A, marker);
  assert.deepEqual(readUnsyncedMarker(storage, USER_A), marker);
  assert.equal(readUnsyncedMarker(storage, USER_B), null);
  assert.ok(storage.values.has(unsyncedKeyForUser(USER_A)));
  clearUnsyncedMarker(storage, USER_A);
  assert.equal(readUnsyncedMarker(storage, USER_A), null);
});

test("the synchronous progress funnel preserves anonymous behavior and authenticated envelope metadata", () => {
  const originalWindow = global.window;
  const storage = new MemoryStorage();
  const events = [];
  global.window = { localStorage: storage, dispatchEvent: (event) => events.push(event.type) };
  try {
    const progressStorage = loadTypeScriptModule("lib/progress-storage");
    const { progressKeyForUser } = loadTypeScriptModule("lib/progress-cache");
    progressStorage.setProgressOwner(null);
    progressStorage.saveProgress(progressWithSlide("m1-1"));
    assert.ok(storage.values.has("faa107-progress-v1"));

    const envelope = {
      envelopeVersion: 1,
      progress: progressWithSlide("m1-1"),
      resetGeneration: GENERATION,
      resetEpoch: "7",
      revision: "9",
      baseProgress: progressWithSlide("m1-1"),
    };
    storage.setItem(progressKeyForUser(USER_A), JSON.stringify(envelope));
    progressStorage.setProgressOwner(USER_A);
    progressStorage.saveProgress(progressWithSlide("m1-2"));
    const stored = JSON.parse(storage.values.get(progressKeyForUser(USER_A)));
    assert.deepEqual({ resetGeneration: stored.resetGeneration, resetEpoch: stored.resetEpoch, revision: stored.revision, baseProgress: stored.baseProgress }, {
      resetGeneration: GENERATION,
      resetEpoch: "7",
      revision: "9",
      baseProgress: progressWithSlide("m1-1"),
    });
    assert.deepEqual(stored.progress.modules["1"].visitedSlideIds, ["m1-2"]);
    assert.deepEqual(JSON.parse(storage.values.get("faa107-progress-v1")).modules["1"].visitedSlideIds, ["m1-1"]);
    assert.deepEqual(events, ["faa107-progress", "faa107-progress"]);
  } finally {
    const progressStorage = moduleCache.get(path.join(root, "lib/progress-storage.ts"))?.exports;
    progressStorage?.setProgressOwner(null);
    global.window = originalWindow;
  }
});

test("local writers timestamp module visits and only flashcards whose rendered state changes", () => {
  const originalWindow = global.window;
  const storage = new MemoryStorage();
  global.window = { localStorage: storage, dispatchEvent: () => true };
  try {
    const progressStorage = loadTypeScriptModule("lib/progress-storage");
    progressStorage.setProgressOwner(null);
    progressStorage.saveProgress(emptyProgress({
      flashcards: {
        "1": {
          known: ["fc-1-ftn"],
          unknown: ["fc-1-uag"],
          reviewedAt: {
            "fc-1-ftn": "2026-07-12T10:00:00.000Z",
            "fc-1-uag": "2026-07-12T10:00:00.000Z",
          },
        },
      },
    }));
    progressStorage.saveFlashcardProgress("1", {
      known: ["fc-1-ftn", "fc-1-uag"],
      unknown: [],
    });
    const flashcards = progressStorage.getProgress().flashcards["1"];
    assert.equal(flashcards.reviewedAt["fc-1-ftn"], "2026-07-12T10:00:00.000Z");
    assert.notEqual(flashcards.reviewedAt["fc-1-uag"], "2026-07-12T10:00:00.000Z");
    assert.match(flashcards.reviewedAt["fc-1-uag"], /^\d{4}-\d{2}-\d{2}T/);

    progressStorage.markSlideVisited("1", "m1-1", 8);
    assert.match(progressStorage.getProgress().modules["1"].updatedAt, /^\d{4}-\d{2}-\d{2}T/);
  } finally {
    const progressStorage = moduleCache.get(path.join(root, "lib/progress-storage.ts"))?.exports;
    progressStorage?.setProgressOwner(null);
    global.window = originalWindow;
  }
});

test("active exam persistence remains one device-local key across owner context changes", () => {
  const originalWindow = global.window;
  const storage = new MemoryStorage();
  global.window = { localStorage: storage, dispatchEvent: () => true };
  try {
    const progressStorage = loadTypeScriptModule("lib/progress-storage");
    const session = { version: 1, questionIds: ["m1-q1"] };
    progressStorage.setProgressOwner(USER_A);
    assert.equal(progressStorage.saveActiveExamSession(session), true);
    progressStorage.setProgressOwner(USER_B);
    assert.equal(storage.values.has("faa107-active-exam-v1"), true);
    assert.equal(storage.values.has(`faa107-active-exam-v1:${USER_A}`), false);
  } finally {
    const progressStorage = moduleCache.get(path.join(root, "lib/progress-storage.ts"))?.exports;
    progressStorage?.setProgressOwner(null);
    global.window = originalWindow;
  }
});
