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
const GEN_A = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa";
const GEN_B = "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb";

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
    this.writes = [];
  }
  getItem(key) {
    this.reads.push(key);
    return this.values.get(key) ?? null;
  }
  setItem(key, value) {
    this.writes.push(key);
    this.values.set(key, value);
  }
  removeItem(key) {
    this.writes.push(key);
    this.values.delete(key);
  }
}

class FakeTimers {
  constructor() {
    this.nextId = 1;
    this.pending = new Map();
    this.delays = [];
  }
  setTimeout(callback, delay) {
    const id = this.nextId++;
    this.delays.push(delay);
    this.pending.set(id, callback);
    return id;
  }
  clearTimeout(id) {
    this.pending.delete(id);
  }
  async runNext() {
    const entry = this.pending.entries().next().value;
    assert.ok(entry, "expected a pending timer");
    this.pending.delete(entry[0]);
    entry[1]();
    await Promise.resolve();
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

function row({ progress = emptyProgress(), revision = "0", generation = GEN_A, epoch = "0" } = {}) {
  return { progress, revision, resetGeneration: generation, resetEpoch: epoch };
}

function result(status, overrides = {}) {
  return { status, ...row(overrides) };
}

class FakeRpc {
  constructor() {
    this.fetches = [];
    this.commits = [];
    this.resets = [];
    this.subscriptions = [];
    this.tokens = [];
    this.fetchImpl = async () => ({ status: "missing" });
    this.commitImpl = async (input) => result("committed", {
      progress: input.proposedProgress,
      revision: "1",
    });
    this.resetImpl = async () => result("reset", {
      progress: emptyProgress(),
      revision: "2",
      generation: GEN_B,
      epoch: "1",
    });
  }
  async fetch(userId, signal) {
    this.fetches.push(userId);
    return this.fetchImpl(userId, signal);
  }
  async commit(input, signal) {
    this.commits.push(input);
    return this.commitImpl(input, signal);
  }
  async reset(input, signal) {
    this.resets.push(input);
    return this.resetImpl(input, signal);
  }
  subscribe(userId, listener) {
    const subscription = { userId, listener, removed: false };
    this.subscriptions.push(subscription);
    return () => { subscription.removed = true; };
  }
  refreshRealtimeAuth(token) {
    this.tokens.push(token);
  }
}

function harness(overrides = {}) {
  const { createProgressSyncCoordinator } = loadTypeScriptModule("lib/progress-sync");
  const storage = overrides.storage ?? new MemoryStorage();
  const timers = overrides.timers ?? new FakeTimers();
  const rpc = overrides.rpc ?? new FakeRpc();
  const owners = [];
  let online = overrides.online ?? true;
  let operation = 0;
  const coordinator = createProgressSyncCoordinator({
    rpc,
    storage,
    locks: overrides.locks ?? null,
    now: () => NOW,
    random: () => 0.5,
    randomUuid: () => `00000000-0000-4000-8000-${String(++operation).padStart(12, "0")}`,
    isOnline: () => online,
    setTimeout: timers.setTimeout.bind(timers),
    clearTimeout: timers.clearTimeout.bind(timers),
    setProgressOwner(userId) { owners.push(userId); },
  });
  return { coordinator, rpc, storage, timers, owners, setOnline(value) { online = value; } };
}

test("RPC adapter uses owner-only SELECT, approved RPCs, bigint strings, and owner-filtered Realtime", async () => {
  const { createProgressRpcAdapter } = loadTypeScriptModule("lib/progress-rpc");
  const calls = [];
  const channel = {
    on(kind, filter, callback) { calls.push(["on", kind, filter]); this.callback = callback; return this; },
    subscribe() { calls.push(["subscribe"]); return this; },
  };
  const client = {
    from(table) {
      calls.push(["from", table]);
      return {
        select(columns) { calls.push(["select", columns]); return this; },
        eq(column, value) { calls.push(["eq", column, value]); return this; },
        async maybeSingle() {
          return { data: { user_id: USER_A, progress: emptyProgress(), revision: "9007199254740993", reset_generation: GEN_A, reset_epoch: "9007199254740995" }, error: null };
        },
      };
    },
    async rpc(name, args) {
      calls.push(["rpc", name, args]);
      return { data: [{ status: name === "reset_faa107_progress" ? "reset" : "current", progress: emptyProgress(), revision: "9007199254740993", reset_generation: GEN_A, reset_epoch: "9007199254740995" }], error: null };
    },
    channel(name) { calls.push(["channel", name]); return channel; },
    realtime: { setAuth(token) { calls.push(["setAuth", token]); } },
    async removeChannel(value) { calls.push(["removeChannel", value]); },
  };
  const adapter = createProgressRpcAdapter(client);
  const fetched = await adapter.fetch(USER_A);
  assert.deepEqual(fetched.row && { revision: fetched.row.revision, resetEpoch: fetched.row.resetEpoch }, {
    revision: "9007199254740993",
    resetEpoch: "9007199254740995",
  });
  await adapter.commit({ expectedRevision: null, expectedGeneration: null, baseProgress: emptyProgress(), proposedProgress: emptyProgress(), operationId: "00000000-0000-4000-8000-000000000001" });
  assert.equal((await adapter.reset({ operationId: "00000000-0000-4000-8000-000000000002" })).status, "reset");
  const remove = adapter.subscribe(USER_A, () => {});
  adapter.refreshRealtimeAuth("fresh-token");
  remove();
  assert.ok(calls.some((call) => call[0] === "select" && /user_id/.test(call[1])));
  assert.ok(calls.some((call) => call[0] === "eq" && call[1] === "user_id" && call[2] === USER_A));
  assert.deepEqual(calls.filter((call) => call[0] === "rpc").map((call) => call[1]), ["commit_faa107_progress", "reset_faa107_progress"]);
  assert.ok(calls.some((call) => call[0] === "on" && call[2].filter === `user_id=eq.${USER_A}`));
  assert.ok(calls.some((call) => call[0] === "setAuth" && call[1] === "fresh-token"));
  await Promise.resolve();
  assert.ok(calls.some((call) => call[0] === "removeChannel" && call[1] === channel));
  assert.equal(calls.some((call) => ["insert", "update", "upsert", "delete"].includes(call[0])), false);
});

test("startup with no remote row takes the null-generation first-commit path", async () => {
  const h = harness();
  await h.coordinator.authChanged({ id: USER_A });
  assert.deepEqual(h.owners, [USER_A]);
  assert.equal(h.rpc.fetches.length, 1);
  assert.equal(h.rpc.commits.length, 1);
  assert.equal(h.rpc.commits[0].expectedRevision, null);
  assert.equal(h.rpc.commits[0].expectedGeneration, null);
  assert.equal(h.rpc.commits[0].baseProgress.modules && Object.keys(h.rpc.commits[0].baseProgress.modules).length, 0);
});

test("local writes persist the unsynced marker before one debounce timer and then commit", async () => {
  const { writeAuthenticatedCache, progressKeyForUser, unsyncedKeyForUser } = loadTypeScriptModule("lib/progress-cache");
  const h = harness();
  h.rpc.fetchImpl = async () => ({ status: "ok", row: row() });
  await h.coordinator.authChanged({ id: USER_A });
  writeAuthenticatedCache(h.storage, USER_A, {
    envelopeVersion: 1,
    progress: progressWithSlide("m1-1"),
    resetGeneration: GEN_A,
    resetEpoch: "0",
    revision: "0",
    baseProgress: emptyProgress(),
  }, NOW);
  h.storage.writes.length = 0;
  h.coordinator.localWrite();
  h.coordinator.localWrite();
  assert.equal(h.storage.writes[0], unsyncedKeyForUser(USER_A));
  assert.equal(h.timers.pending.size, 1);
  await h.timers.runNext();
  await h.coordinator.flush("debounce");
  assert.equal(h.rpc.commits.at(-1).proposedProgress.modules["1"].lastSlideId, "m1-1");
  assert.ok(h.storage.values.has(progressKeyForUser(USER_A)));
});

test("transient offline work remains marked, retries 1/2/4/8/16/32/60 seconds, and online flushes immediately", async () => {
  const { writeAuthenticatedCache, readUnsyncedMarker } = loadTypeScriptModule("lib/progress-cache");
  const h = harness({ online: false });
  h.rpc.fetchImpl = async () => ({ status: "ok", row: row() });
  await h.coordinator.authChanged({ id: USER_A });
  writeAuthenticatedCache(h.storage, USER_A, {
    envelopeVersion: 1,
    progress: progressWithSlide("m1-1"),
    resetGeneration: GEN_A,
    resetEpoch: "0",
    revision: "0",
    baseProgress: emptyProgress(),
  }, NOW);
  h.coordinator.localWrite();
  await h.coordinator.flush("debounce");
  assert.ok(readUnsyncedMarker(h.storage, USER_A));
  assert.equal(h.rpc.commits.length, 0);
  assert.equal(h.timers.delays.at(-1), 1000);
  for (const expected of [2000, 4000, 8000, 16000, 32000, 60000, 60000]) {
    await h.timers.runNext();
    await h.coordinator.flush("debounce");
    assert.equal(h.timers.delays.at(-1), expected);
  }
  h.setOnline(true);
  await h.coordinator.flush("online");
  assert.equal(h.rpc.commits.length, 1);
  assert.equal(readUnsyncedMarker(h.storage, USER_A), null);
});

test("persisted dirty work resumes after coordinator reload", async () => {
  const { writeAuthenticatedCache, writeUnsyncedMarker } = loadTypeScriptModule("lib/progress-cache");
  const storage = new MemoryStorage();
  writeAuthenticatedCache(storage, USER_A, {
    envelopeVersion: 1,
    progress: progressWithSlide("m1-1"),
    resetGeneration: GEN_A,
    resetEpoch: "0",
    revision: "0",
    baseProgress: emptyProgress(),
  }, NOW);
  writeUnsyncedMarker(storage, USER_A, { dirty: true, resetGeneration: GEN_A, lastAttemptAt: null });
  const h = harness({ storage });
  h.rpc.fetchImpl = async () => ({ status: "ok", row: row() });
  await h.coordinator.authChanged({ id: USER_A });
  assert.equal(h.rpc.commits.length, 1);
});

test("token refresh updates Realtime auth and re-fetches without changing owner", async () => {
  const h = harness();
  h.rpc.fetchImpl = async () => ({ status: "ok", row: row() });
  await h.coordinator.authChanged({ id: USER_A });
  await h.coordinator.authTokenChanged("new-access-token");
  assert.deepEqual(h.rpc.tokens, ["new-access-token"]);
  assert.deepEqual(h.owners, [USER_A]);
  assert.equal(h.rpc.fetches.length, 2);
});

test("rapid A to B to A switching never applies or uploads an old-owner continuation", async () => {
  const h = harness();
  let oldRequestAborted = false;
  h.rpc.fetchImpl = (userId, signal) => userId === USER_A && h.rpc.fetches.length === 1
    ? new Promise((_resolve, reject) => signal.addEventListener("abort", () => {
      oldRequestAborted = true;
      reject(Object.assign(new Error("aborted"), { name: "AbortError" }));
    }, { once: true }))
    : Promise.resolve({ status: "ok", row: row({ generation: userId === USER_A ? GEN_A : GEN_B }) });
  const firstA = h.coordinator.authChanged({ id: USER_A });
  await Promise.resolve();
  await Promise.resolve();
  assert.deepEqual(h.rpc.fetches, [USER_A]);
  const readsBeforeB = h.storage.reads.length;
  const switchB = h.coordinator.authChanged({ id: USER_B });
  assert.equal(h.owners.at(-1), USER_B);
  await firstA;
  await switchB;
  assert.equal(oldRequestAborted, true);
  const bReadWindow = h.storage.reads.slice(readsBeforeB);
  assert.equal(bReadWindow.some((key) => key.includes(USER_A)), false);
  assert.ok(bReadWindow.some((key) => key.includes(USER_B)));
  await h.coordinator.authChanged({ id: USER_A });
  assert.deepEqual(h.owners, [USER_A, USER_B, USER_A]);
  assert.equal(h.rpc.commits.length, 0);
  assert.deepEqual(JSON.parse(h.storage.values.get(`faa107-progress-v1:${USER_A}`)).progress, emptyProgress());
});

test("a local write during startup fetch is re-read and committed instead of overwritten", async () => {
  const { writeAuthenticatedCache } = loadTypeScriptModule("lib/progress-cache");
  const storage = new MemoryStorage();
  writeAuthenticatedCache(storage, USER_A, {
    envelopeVersion: 1,
    progress: emptyProgress(),
    resetGeneration: GEN_A,
    resetEpoch: "0",
    revision: "0",
    baseProgress: emptyProgress(),
  }, NOW);
  let resolveFetch;
  const h = harness({ storage });
  h.rpc.fetchImpl = async () => new Promise((resolve) => { resolveFetch = resolve; });
  const startup = h.coordinator.authChanged({ id: USER_A });
  await Promise.resolve();
  await Promise.resolve();
  writeAuthenticatedCache(storage, USER_A, {
    envelopeVersion: 1,
    progress: progressWithSlide("m1-1"),
    resetGeneration: GEN_A,
    resetEpoch: "0",
    revision: "0",
    baseProgress: emptyProgress(),
  }, NOW);
  h.coordinator.localWrite();
  resolveFetch({ status: "ok", row: row() });
  await startup;
  assert.equal(h.rpc.commits.length, 1);
  assert.deepEqual(h.rpc.commits[0].proposedProgress.modules["1"].visitedSlideIds, ["m1-1"]);
});

test("a new-owner write before its startup job begins is marked and preserved as a delta", async () => {
  const { createNeverSyncedEnvelope, writeAuthenticatedCache } = loadTypeScriptModule("lib/progress-cache");
  const h = harness();
  h.rpc.fetchImpl = async () => ({ status: "ok", row: row({ generation: GEN_B }) });
  const startup = h.coordinator.authChanged({ id: USER_B });
  writeAuthenticatedCache(h.storage, USER_B, createNeverSyncedEnvelope(progressWithSlide("m1-1"), NOW), NOW);
  h.coordinator.localWrite();
  await startup;
  assert.equal(h.rpc.commits.length, 1);
  assert.deepEqual(h.rpc.commits[0].proposedProgress.modules["1"].visitedSlideIds, ["m1-1"]);
});

test("startup imports the durable anonymous claim only through the first commit", async () => {
  const { anonymousProgressKey } = loadTypeScriptModule("lib/progress-cache");
  const storage = new MemoryStorage({ [anonymousProgressKey]: JSON.stringify(progressWithSlide("m1-1")) });
  const locks = { request: async (_name, _options, callback) => callback() };
  const h = harness({ storage, locks });
  await h.coordinator.authChanged({ id: USER_A });
  assert.equal(h.rpc.commits.length, 1);
  assert.equal(h.rpc.commits[0].expectedGeneration, null);
  assert.deepEqual(h.rpc.commits[0].proposedProgress.modules["1"].visitedSlideIds, ["m1-1"]);
});

test("anonymous progress is claimed before fetch and imported into an existing remote row", async () => {
  const { anonymousImportKey, anonymousProgressKey } = loadTypeScriptModule("lib/progress-cache");
  const storage = new MemoryStorage({ [anonymousProgressKey]: JSON.stringify(progressWithSlide("m1-1")) });
  const locks = { request: async (_name, _options, callback) => callback() };
  const h = harness({ storage, locks });
  h.rpc.fetchImpl = async () => {
    assert.equal(JSON.parse(storage.values.get(anonymousImportKey)).ownerUserId, USER_A);
    return { status: "ok", row: row({ progress: progressWithSlide("m1-2") }) };
  };
  await h.coordinator.authChanged({ id: USER_A });
  assert.equal(h.rpc.commits.length, 1);
  assert.deepEqual(h.rpc.commits[0].proposedProgress.modules["1"].visitedSlideIds, ["m1-1", "m1-2"]);
  assert.equal(JSON.parse(storage.values.get(anonymousImportKey)).state, "complete");
});

test("a failed first fetch still pins the anonymous claim to that account", async () => {
  const { anonymousImportKey, anonymousProgressKey } = loadTypeScriptModule("lib/progress-cache");
  const storage = new MemoryStorage({ [anonymousProgressKey]: JSON.stringify(progressWithSlide("m1-1")) });
  const locks = { request: async (_name, _options, callback) => callback() };
  const h = harness({ storage, locks });
  h.rpc.fetchImpl = async (userId) => {
    if (userId === USER_A) throw Object.assign(new Error("offline"), { kind: "transient" });
    return { status: "ok", row: row({ generation: GEN_B }) };
  };
  await h.coordinator.authChanged({ id: USER_A });
  assert.equal(JSON.parse(storage.values.get(anonymousImportKey)).ownerUserId, USER_A);
  await h.coordinator.authChanged({ id: USER_B });
  assert.equal(h.rpc.commits.length, 0);
  assert.equal(JSON.parse(storage.values.get(anonymousImportKey)).ownerUserId, USER_A);
});

test("canonical remote state repairs an invalid scoped cache without uploading it", async () => {
  const storage = new MemoryStorage({ [`faa107-progress-v1:${USER_A}`]: "{malformed" });
  const h = harness({ storage });
  h.rpc.fetchImpl = async () => ({ status: "ok", row: row({ progress: progressWithSlide("m1-2") }) });
  await h.coordinator.authChanged({ id: USER_A });
  assert.equal(h.rpc.commits.length, 0);
  assert.deepEqual(JSON.parse(storage.values.get(`faa107-progress-v1:${USER_A}`)).progress.modules["1"].visitedSlideIds, ["m1-2"]);
});

test("first_row_race re-merges and retries while pre_generation_rejected adopts reset terminally", async () => {
  const { createNeverSyncedEnvelope, progressKeyForUser } = loadTypeScriptModule("lib/progress-cache");
  const firstStorage = new MemoryStorage({
    [progressKeyForUser(USER_A)]: JSON.stringify(createNeverSyncedEnvelope(progressWithSlide("m1-1"), NOW)),
  });
  const first = harness({ storage: firstStorage });
  first.rpc.commitImpl = async (input) => first.rpc.commits.length === 1
    ? result("first_row_race", { progress: progressWithSlide("m1-2"), revision: "1" })
    : result("current", { progress: input.proposedProgress, revision: "2" });
  await first.coordinator.authChanged({ id: USER_A });
  assert.equal(first.rpc.commits.length, 2);
  assert.deepEqual(first.rpc.commits[1].proposedProgress.modules["1"].visitedSlideIds, ["m1-1", "m1-2"]);
  assert.equal(first.rpc.commits[1].expectedRevision, "1");

  const terminal = harness();
  terminal.rpc.commitImpl = async () => result("pre_generation_rejected", {
    progress: emptyProgress(), revision: "5", generation: GEN_B, epoch: "1",
  });
  await terminal.coordinator.authChanged({ id: USER_A });
  assert.equal(terminal.rpc.commits.length, 1);
  const cached = JSON.parse(terminal.storage.values.get(`faa107-progress-v1:${USER_A}`));
  assert.equal(cached.resetGeneration, GEN_B);
  assert.equal(terminal.storage.values.has(`faa107-progress-unsynced-v1:${USER_A}`), false);
});

test("first_row_race preserves a newer local write made while the first RPC is pending", async () => {
  const { createNeverSyncedEnvelope, progressKeyForUser, writeAuthenticatedCache } = loadTypeScriptModule("lib/progress-cache");
  const storage = new MemoryStorage({
    [progressKeyForUser(USER_A)]: JSON.stringify(createNeverSyncedEnvelope(progressWithSlide("m1-1"), NOW)),
  });
  const h = harness({ storage });
  let resolveFirst;
  h.rpc.commitImpl = async (input) => h.rpc.commits.length === 1
    ? new Promise((resolve) => { resolveFirst = resolve; })
    : result("current", { progress: input.proposedProgress, revision: "2" });
  const startup = h.coordinator.authChanged({ id: USER_A });
  while (h.rpc.commits.length === 0) await Promise.resolve();
  writeAuthenticatedCache(storage, USER_A, createNeverSyncedEnvelope(emptyProgress({
    modules: {
      "1": { visitedSlideIds: ["m1-1", "m1-2"], completed: false, lastSlideId: "m1-2" },
    },
  }), NOW), NOW);
  h.coordinator.localWrite();
  resolveFirst(result("first_row_race", { progress: progressWithSlide("m1-3"), revision: "1" }));
  await startup;
  assert.equal(h.rpc.commits.length, 2);
  assert.deepEqual(h.rpc.commits[1].proposedProgress.modules["1"].visitedSlideIds, ["m1-1", "m1-2", "m1-3"]);
});

test("terminal reset rejection retires an anonymous claim so startup cannot resurrect it", async () => {
  const { anonymousImportKey, anonymousProgressKey } = loadTypeScriptModule("lib/progress-cache");
  const storage = new MemoryStorage({ [anonymousProgressKey]: JSON.stringify(progressWithSlide("m1-1")) });
  const locks = { request: async (_name, _options, callback) => callback() };
  const first = harness({ storage, locks });
  first.rpc.commitImpl = async () => result("pre_generation_rejected", {
    progress: emptyProgress(), revision: "5", generation: GEN_B, epoch: "1",
  });
  await first.coordinator.authChanged({ id: USER_A });
  assert.equal(JSON.parse(storage.values.get(anonymousImportKey)).state, "complete");
  first.coordinator.dispose();

  const second = harness({ storage, locks });
  second.rpc.fetchImpl = async () => ({ status: "ok", row: row({ revision: "5", generation: GEN_B, epoch: "1" }) });
  await second.coordinator.authChanged({ id: USER_A });
  assert.equal(second.rpc.commits.length, 0);
  assert.deepEqual(JSON.parse(storage.values.get(anonymousProgressKey)), progressWithSlide("m1-1"));
});

test("revision conflict confirms server merge and retries only newer local work", async () => {
  const { progressKeyForUser, unsyncedKeyForUser } = loadTypeScriptModule("lib/progress-cache");
  const storage = new MemoryStorage({
    [progressKeyForUser(USER_A)]: JSON.stringify({
      envelopeVersion: 1,
      progress: progressWithSlide("m1-1"),
      resetGeneration: GEN_A,
      resetEpoch: "0",
      revision: "0",
      baseProgress: emptyProgress(),
    }),
    [unsyncedKeyForUser(USER_A)]: JSON.stringify({ dirty: true, resetGeneration: GEN_A, lastAttemptAt: null }),
  });
  const h = harness({ storage });
  h.rpc.fetchImpl = async () => ({ status: "ok", row: row() });
  h.rpc.commitImpl = async (input) => h.rpc.commits.length === 1
    ? result("revision_conflict", { progress: progressWithSlide("m1-2"), revision: "2" })
    : result("current", { progress: input.proposedProgress, revision: "2" });
  await h.coordinator.authChanged({ id: USER_A });
  assert.equal(h.rpc.commits.length, 2);
  assert.equal(h.rpc.commits[1].expectedRevision, "2");
  assert.equal(h.rpc.commits[1].expectedGeneration, GEN_A);
  assert.deepEqual(h.rpc.commits[1].proposedProgress.modules["1"].visitedSlideIds, ["m1-1", "m1-2"]);
});

test("generation mismatch and Realtime reset discard stale candidates and converge on the reset row", async () => {
  const { writeAuthenticatedCache } = loadTypeScriptModule("lib/progress-cache");
  const h = harness();
  h.rpc.fetchImpl = async () => ({ status: "ok", row: row() });
  await h.coordinator.authChanged({ id: USER_A });
  writeAuthenticatedCache(h.storage, USER_A, {
    envelopeVersion: 1,
    progress: progressWithSlide("m1-1"),
    resetGeneration: GEN_A,
    resetEpoch: "0",
    revision: "0",
    baseProgress: emptyProgress(),
  }, NOW);
  h.rpc.commitImpl = async () => result("generation_mismatch", {
    progress: emptyProgress(), revision: "3", generation: GEN_B, epoch: "1",
  });
  h.coordinator.localWrite();
  await h.coordinator.flush("visibility");
  let cached = JSON.parse(h.storage.values.get(`faa107-progress-v1:${USER_A}`));
  assert.equal(cached.resetGeneration, GEN_B);
  assert.deepEqual(cached.progress, emptyProgress());

  h.rpc.subscriptions.at(-1).listener(row({ progress: emptyProgress(), revision: "4", generation: GEN_A, epoch: "2" }));
  await h.coordinator.flush("visibility");
  cached = JSON.parse(h.storage.values.get(`faa107-progress-v1:${USER_A}`));
  assert.equal(cached.resetEpoch, "2");
});

test("Realtime epoch-zero creation preserves a dirty null-generation first candidate", async () => {
  const { createNeverSyncedEnvelope, writeAuthenticatedCache, writeUnsyncedMarker } = loadTypeScriptModule("lib/progress-cache");
  const h = harness();
  h.rpc.fetchImpl = async () => ({ status: "ok", row: row() });
  await h.coordinator.authChanged({ id: USER_A });
  writeAuthenticatedCache(h.storage, USER_A, createNeverSyncedEnvelope(progressWithSlide("m1-1"), NOW), NOW);
  writeUnsyncedMarker(h.storage, USER_A, { dirty: true, resetGeneration: null, lastAttemptAt: null });
  h.rpc.subscriptions.at(-1).listener(row({ progress: progressWithSlide("m1-2"), revision: "1", epoch: "0" }));
  await h.coordinator.flush("visibility");
  assert.equal(h.rpc.commits.length, 1);
  assert.deepEqual(h.rpc.commits[0].proposedProgress.modules["1"].visitedSlideIds, ["m1-1", "m1-2"]);
});

test("reset is serialized, keeps old state on failure, and adopts the returned empty epoch on success", async () => {
  const { writeAuthenticatedCache } = loadTypeScriptModule("lib/progress-cache");
  const h = harness();
  h.rpc.fetchImpl = async () => ({ status: "ok", row: row({ progress: progressWithSlide("m1-1") }) });
  await h.coordinator.authChanged({ id: USER_A });
  writeAuthenticatedCache(h.storage, USER_A, {
    envelopeVersion: 1,
    progress: progressWithSlide("m1-1"),
    resetGeneration: GEN_A,
    resetEpoch: "0",
    revision: "0",
    baseProgress: progressWithSlide("m1-1"),
  }, NOW);
  h.rpc.resetImpl = async () => { throw Object.assign(new Error("offline"), { kind: "transient" }); };
  await assert.rejects(h.coordinator.reset(), /offline/);
  assert.equal(JSON.parse(h.storage.values.get(`faa107-progress-v1:${USER_A}`)).resetGeneration, GEN_A);
  h.rpc.resetImpl = async () => result("reset", { progress: emptyProgress(), revision: "1", generation: GEN_B, epoch: "1" });
  await h.coordinator.reset();
  assert.equal(h.rpc.resets[1].operationId, h.rpc.resets[0].operationId);
  const cached = JSON.parse(h.storage.values.get(`faa107-progress-v1:${USER_A}`));
  assert.deepEqual(cached.progress, emptyProgress());
  assert.equal(cached.resetGeneration, GEN_B);
  assert.equal(cached.resetEpoch, "1");
});

test("transient reset retry reuses its receipt and never falls through to a normal commit", async () => {
  const h = harness();
  h.rpc.fetchImpl = async () => ({ status: "ok", row: row({ progress: progressWithSlide("m1-1") }) });
  await h.coordinator.authChanged({ id: USER_A });
  h.rpc.resetImpl = async () => {
    if (h.rpc.resets.length === 1) throw Object.assign(new Error("timeout"), { kind: "transient" });
    return result("reset", { progress: emptyProgress(), revision: "2", generation: GEN_B, epoch: "1" });
  };
  await assert.rejects(h.coordinator.reset(), /timeout/);
  assert.equal(h.timers.pending.size, 1);
  await h.timers.runNext();
  await h.coordinator.flush("visibility");
  assert.equal(h.rpc.resets.length, 2);
  assert.equal(h.rpc.resets[1].operationId, h.rpc.resets[0].operationId);
  assert.equal(h.rpc.commits.length, 0);
});

test("an ambiguous commit retry reuses its operation ID until a definitive receipt arrives", async () => {
  const { writeAuthenticatedCache } = loadTypeScriptModule("lib/progress-cache");
  const h = harness();
  h.rpc.fetchImpl = async () => ({ status: "ok", row: row() });
  await h.coordinator.authChanged({ id: USER_A });
  writeAuthenticatedCache(h.storage, USER_A, {
    envelopeVersion: 1,
    progress: progressWithSlide("m1-1"),
    resetGeneration: GEN_A,
    resetEpoch: "0",
    revision: "0",
    baseProgress: emptyProgress(),
  }, NOW);
  h.rpc.commitImpl = async (input) => {
    if (h.rpc.commits.length === 1) throw Object.assign(new Error("timeout"), { kind: "transient" });
    return result("duplicate", { progress: input.proposedProgress, revision: "1" });
  };
  h.coordinator.localWrite();
  await h.coordinator.flush("debounce");
  await h.timers.runNext();
  await h.coordinator.flush("debounce");
  assert.equal(h.rpc.commits.length, 2);
  assert.equal(h.rpc.commits[1].operationId, h.rpc.commits[0].operationId);
});

test("authentication failures pause timers and token refresh resumes the same pending operation", async () => {
  const { writeAuthenticatedCache } = loadTypeScriptModule("lib/progress-cache");
  const h = harness();
  h.rpc.fetchImpl = async () => ({ status: "ok", row: row() });
  await h.coordinator.authChanged({ id: USER_A });
  writeAuthenticatedCache(h.storage, USER_A, {
    envelopeVersion: 1,
    progress: progressWithSlide("m1-1"),
    resetGeneration: GEN_A,
    resetEpoch: "0",
    revision: "0",
    baseProgress: emptyProgress(),
  }, NOW);
  h.rpc.commitImpl = async (input) => {
    if (h.rpc.commits.length === 1) throw Object.assign(new Error("JWT expired"), { kind: "auth" });
    return result("duplicate", { progress: input.proposedProgress, revision: "1" });
  };
  h.coordinator.localWrite();
  await h.coordinator.flush("debounce");
  assert.equal(h.timers.pending.size, 0);
  await h.coordinator.authTokenChanged("refreshed-token");
  assert.equal(h.rpc.commits.length, 2);
  assert.equal(h.rpc.commits[1].operationId, h.rpc.commits[0].operationId);
});

test("validation failures remain locally dirty but lifecycle events do not retry until a new write", async () => {
  const { writeAuthenticatedCache } = loadTypeScriptModule("lib/progress-cache");
  const h = harness();
  h.rpc.fetchImpl = async () => ({ status: "ok", row: row() });
  await h.coordinator.authChanged({ id: USER_A });
  writeAuthenticatedCache(h.storage, USER_A, {
    envelopeVersion: 1,
    progress: progressWithSlide("m1-1"),
    resetGeneration: GEN_A,
    resetEpoch: "0",
    revision: "0",
    baseProgress: emptyProgress(),
  }, NOW);
  h.rpc.commitImpl = async () => { throw Object.assign(new Error("invalid payload"), { kind: "validation" }); };
  h.coordinator.localWrite();
  await h.coordinator.flush("debounce");
  assert.equal(h.rpc.commits.length, 1);
  assert.equal(h.timers.pending.size, 0);
  await h.coordinator.flush("online");
  await h.coordinator.authTokenChanged("fresh-token");
  assert.equal(h.rpc.commits.length, 1);
  h.rpc.commitImpl = async (input) => result("committed", { progress: input.proposedProgress, revision: "1" });
  h.coordinator.localWrite();
  await h.coordinator.flush("debounce");
  assert.equal(h.rpc.commits.length, 2);
});

test("a duplicate receipt returned after reset adopts the reset generation without stale re-merge", async () => {
  const { writeAuthenticatedCache } = loadTypeScriptModule("lib/progress-cache");
  const h = harness();
  h.rpc.fetchImpl = async () => ({ status: "ok", row: row() });
  await h.coordinator.authChanged({ id: USER_A });
  writeAuthenticatedCache(h.storage, USER_A, {
    envelopeVersion: 1,
    progress: progressWithSlide("m1-1"),
    resetGeneration: GEN_A,
    resetEpoch: "0",
    revision: "0",
    baseProgress: emptyProgress(),
  }, NOW);
  h.rpc.commitImpl = async () => result("duplicate", {
    progress: emptyProgress(), revision: "5", generation: GEN_B, epoch: "1",
  });
  h.coordinator.localWrite();
  await h.coordinator.flush("debounce");
  const cached = JSON.parse(h.storage.values.get(`faa107-progress-v1:${USER_A}`));
  assert.equal(h.rpc.commits.length, 1);
  assert.equal(cached.resetGeneration, GEN_B);
  assert.deepEqual(cached.progress, emptyProgress());
});

test("sign-out invalidates retries, anonymous writes never call RPC, and dispose removes timers/channels", async () => {
  const h = harness({ online: false });
  h.rpc.fetchImpl = async () => ({ status: "ok", row: row() });
  await h.coordinator.authChanged({ id: USER_A });
  h.coordinator.localWrite();
  await h.coordinator.flush("debounce");
  assert.equal(h.timers.pending.size, 1);
  await h.coordinator.authChanged(null);
  assert.equal(h.timers.pending.size, 0);
  h.coordinator.localWrite();
  await h.coordinator.flush("online");
  assert.equal(h.rpc.commits.length, 0);
  h.coordinator.dispose();
  assert.ok(h.rpc.subscriptions.every((subscription) => subscription.removed));
  assert.equal(h.owners.at(-1), null);
});

test("adapter and coordinator source contain no direct table writes or service-role credentials", () => {
  const adapter = fs.readFileSync(path.join(root, "lib/progress-rpc.ts"), "utf8");
  const source = `${adapter}\n${fs.readFileSync(path.join(root, "lib/progress-sync.ts"), "utf8")}`;
  assert.doesNotMatch(adapter, /\.\s*(insert|update|upsert|delete)\s*\(/);
  assert.doesNotMatch(source, /service.?role/i);
});
