const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const { execFileSync, spawn } = require("node:child_process");
const ts = require("typescript");

const root = path.resolve(__dirname, "..");
const fixtures = JSON.parse(fs.readFileSync(
  path.join(__dirname, "fixtures/progress-canonical-cases.json"),
  "utf8",
));
const NOW = new Date("2026-07-12T18:00:00.000Z");
const EMPTY = {
  version: 1,
  modules: {},
  quizAttempts: [],
  flashcards: {},
  examAttempts: [],
  recentActivity: [],
};
const USERS = {
  first: "90000000-0000-4000-8000-000000000001",
  orderAB: "90000000-0000-4000-8000-000000000002",
  orderBA: "90000000-0000-4000-8000-000000000003",
  reset: "90000000-0000-4000-8000-000000000004",
  resetFirst: "90000000-0000-4000-8000-000000000005",
  normalize: "90000000-0000-4000-8000-000000000006",
  parity: "90000000-0000-4000-8000-000000000007",
  raceCommitFirst: "90000000-0000-4000-8000-000000000008",
  raceResetFirst: "90000000-0000-4000-8000-000000000009",
};
const moduleCache = new Map();

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

function dbContainer() {
  const names = execFileSync("docker", ["ps", "--format", "{{.Names}}"], { encoding: "utf8" })
    .trim().split("\n").filter(Boolean);
  const name = names.find((candidate) => candidate.startsWith("supabase_db_"));
  assert.ok(name, "the local Supabase database container must be running");
  return name;
}

function psql(sql) {
  return execFileSync(
    "docker",
    ["exec", "-i", dbContainer(), "psql", "-X", "-qAt", "-v", "ON_ERROR_STOP=1", "-U", "postgres", "-d", "postgres"],
    { input: sql, encoding: "utf8", maxBuffer: 4 * 1024 * 1024 },
  ).trim();
}

function psqlAsync(sql) {
  return new Promise((resolve, reject) => {
    const child = spawn(
      "docker",
      ["exec", "-i", dbContainer(), "psql", "-X", "-qAt", "-v", "ON_ERROR_STOP=1", "-U", "postgres", "-d", "postgres"],
      { stdio: ["pipe", "pipe", "pipe"] },
    );
    let stdout = "";
    let stderr = "";
    child.stdout.setEncoding("utf8").on("data", (chunk) => { stdout += chunk; });
    child.stderr.setEncoding("utf8").on("data", (chunk) => { stderr += chunk; });
    child.on("error", reject);
    child.on("close", (code) => {
      if (code === 0) resolve(stdout.trim());
      else reject(new Error(stderr.trim() || `psql exited ${code}`));
    });
    child.stdin.end(sql);
  });
}

function startPsqlController() {
  const child = spawn(
    "docker",
    ["exec", "-i", dbContainer(), "psql", "-X", "-qAt", "-v", "ON_ERROR_STOP=1", "-U", "postgres", "-d", "postgres"],
    { stdio: ["pipe", "pipe", "pipe"] },
  );
  let stdout = "";
  let stderr = "";
  child.stdout.setEncoding("utf8").on("data", (chunk) => { stdout += chunk; });
  child.stderr.setEncoding("utf8").on("data", (chunk) => { stderr += chunk; });
  const done = new Promise((resolve, reject) => {
    child.on("error", reject);
    child.on("close", (code) => {
      if (code === 0) resolve(stdout.trim());
      else reject(new Error(stderr.trim() || `psql exited ${code}`));
    });
  });
  return {
    write(sql) {
      child.stdin.write(sql);
    },
    finish(sql) {
      child.stdin.end(sql);
      return done;
    },
  };
}

async function waitForDatabaseValue(sql, expected, description) {
  for (let attempt = 0; attempt < 40; attempt += 1) {
    if (psql(sql) === expected) return;
    await new Promise((resolve) => setTimeout(resolve, 25));
  }
  assert.fail(`timed out waiting for ${description}`);
}

function parseRpcOutput(output) {
  const jsonLine = output.split("\n").findLast((line) => line.trim().startsWith("{"));
  assert.ok(jsonLine, `RPC output did not contain JSON: ${output}`);
  return JSON.parse(jsonLine);
}

function jsonb(value) {
  return `$progress$${JSON.stringify(value)}$progress$::jsonb`;
}

function nullable(value, cast) {
  return value === null ? `null::${cast}` : `'${value}'::${cast}`;
}

function rpcSql(userId, expression) {
  return `
    begin;
    set local role authenticated;
    set local request.jwt.claim.sub = '${userId}';
    select row_to_json(result)::text from (${expression}) result;
    commit;
  `;
}

function namedRpcSql(userId, applicationName, expression) {
  return `
    begin;
    set local application_name = '${applicationName}';
    set local role authenticated;
    set local request.jwt.claim.sub = '${userId}';
    select row_to_json(result)::text from (${expression}) result;
    commit;
  `;
}

function lockLeaderSql(userId, applicationName) {
  return `
    begin;
    set local application_name = '${applicationName}';
    set local idle_in_transaction_session_timeout = '10s';
    select pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended('${userId}'::text, 0));
  `;
}

function finishLockLeaderSql(userId, expression) {
  return `
    set local role authenticated;
    set local request.jwt.claim.sub = '${userId}';
    select row_to_json(result)::text from (${expression}) result;
    commit;
  `;
}

function commitExpression({ revision, generation, base, proposed, operation }) {
  return `select * from public.commit_faa107_progress(
    ${nullable(revision, "bigint")},
    ${nullable(generation, "uuid")},
    ${jsonb(base)},
    ${jsonb(proposed)},
    '${operation}'::uuid
  )`;
}

function commit(userId, options) {
  return JSON.parse(psql(rpcSql(userId, commitExpression(options))));
}

function reset(userId, operation) {
  return JSON.parse(psql(rpcSql(
    userId,
    `select * from public.reset_faa107_progress('${operation}'::uuid)`,
  )));
}

function quizProgress() {
  return {
    ...EMPTY,
    quizAttempts: [{
      id: "00000000-0000-4000-8000-000000000101",
      moduleId: "1",
      score: 1,
      total: 2,
      topicScores: { Operations: { correct: 1, total: 2 } },
      completedAt: "2026-07-12T12:00:00.000Z",
    }],
  };
}

function moduleProgress(slides) {
  return {
    ...EMPTY,
    modules: { "1": { visitedSlideIds: slides, completed: false } },
  };
}

function setupUsers() {
  const ids = Object.values(USERS);
  psql(`
    delete from auth.users where id = any(array[${ids.map((id) => `'${id}'::uuid`).join(",")}]);
    insert into auth.users (id, email)
    select id, 'rpc-' || row_number() over () || '@example.test'
    from unnest(array[${ids.map((id) => `'${id}'::uuid`).join(",")}]) as id;
  `);
}

function cleanupUsers() {
  const ids = Object.values(USERS);
  psql(`delete from auth.users where id = any(array[${ids.map((id) => `'${id}'::uuid`).join(",")}]);`);
}

test("local atomic progress RPC integration matrix", async (t) => {
  setupUsers();
  t.after(cleanupUsers);
  const { canonicalProgressJson, mergeProgress } = loadTypeScriptModule("lib/progress-merge");

  async function runConcurrentResetRace({ userId, ordering, operationPrefix }) {
    const g1Progress = mergeProgress(moduleProgress(["m1-1"]), quizProgress(), NOW);
    const g1 = commit(userId, {
      revision: null,
      generation: null,
      base: EMPTY,
      proposed: g1Progress,
      operation: `${operationPrefix}-0000-4000-8000-000000000001`,
    });
    assert.equal(g1.status, "committed");
    assert.equal(g1.reset_epoch, 0);
    assert.deepEqual(g1.progress, g1Progress);

    const staleProposal = mergeProgress(moduleProgress(["m1-1", "m1-2"]), g1Progress, NOW);
    const staleExpression = commitExpression({
      revision: g1.revision,
      generation: g1.reset_generation,
      base: g1.progress,
      proposed: staleProposal,
      operation: `${operationPrefix}-0000-4000-8000-000000000002`,
    });
    const resetExpression = `select * from public.reset_faa107_progress('${operationPrefix}-0000-4000-8000-000000000003'::uuid)`;
    const leaderExpression = ordering === "commit-first" ? staleExpression : resetExpression;
    const contenderExpression = ordering === "commit-first" ? resetExpression : staleExpression;
    const leaderApplication = `faa107_${ordering}_leader`;
    const contenderApplication = `faa107_${ordering}_contender`;

    const leader = startPsqlController();
    leader.write(lockLeaderSql(userId, leaderApplication));
    await waitForDatabaseValue(
      `select coalesce((
        select 'granted'
        from pg_catalog.pg_locks held_lock
        join pg_catalog.pg_stat_activity activity on activity.pid = held_lock.pid
        where activity.application_name = '${leaderApplication}'
          and held_lock.locktype = 'advisory'
          and held_lock.granted
        limit 1
      ), '');`,
      "granted",
      `${ordering} leader to hold the per-user advisory lock`,
    );

    const contenderPromise = psqlAsync(namedRpcSql(userId, contenderApplication, contenderExpression));
    await waitForDatabaseValue(
      `select coalesce((
        select activity.wait_event_type || ':' || activity.wait_event
        from pg_catalog.pg_stat_activity activity
        where activity.application_name = '${contenderApplication}'
        limit 1
      ), '');`,
      "Lock:advisory",
      `${ordering} contender to block on the advisory lock`,
    );

    const [leaderOutput, contenderOutput] = await Promise.all([
      leader.finish(finishLockLeaderSql(userId, leaderExpression)),
      contenderPromise,
    ]);
    const leaderResult = parseRpcOutput(leaderOutput);
    const contenderResult = parseRpcOutput(contenderOutput);
    const commitResult = ordering === "commit-first" ? leaderResult : contenderResult;
    const resetResult = ordering === "commit-first" ? contenderResult : leaderResult;

    if (ordering === "commit-first") {
      assert.equal(commitResult.status, "committed");
      assert.deepEqual(commitResult.progress.modules["1"].visitedSlideIds, ["m1-1", "m1-2"]);
      assert.equal(resetResult.status, "reset");
      assert.equal(resetResult.revision, commitResult.revision + 1);
    } else {
      assert.equal(resetResult.status, "reset");
      assert.equal(commitResult.status, "generation_mismatch");
      assert.equal(commitResult.revision, resetResult.revision);
      assert.equal(commitResult.reset_generation, resetResult.reset_generation);
    }

    assert.notEqual(resetResult.reset_generation, g1.reset_generation);
    assert.equal(resetResult.reset_epoch, g1.reset_epoch + 1);
    assert.deepEqual(resetResult.progress, EMPTY);

    const persisted = JSON.parse(psql(`
      select row_to_json(row)::text
      from (
        select progress, revision, reset_generation, reset_epoch
        from public.faa107_user_progress
        where user_id = '${userId}'
      ) row;
    `));
    assert.deepEqual(persisted, {
      progress: EMPTY,
      revision: resetResult.revision,
      reset_generation: resetResult.reset_generation,
      reset_epoch: g1.reset_epoch + 1,
    });

    const laterStaleRetry = commit(userId, {
      revision: g1.revision,
      generation: g1.reset_generation,
      base: g1.progress,
      proposed: staleProposal,
      operation: `${operationPrefix}-0000-4000-8000-000000000004`,
    });
    assert.equal(laterStaleRetry.status, "generation_mismatch");
    assert.equal(laterStaleRetry.reset_generation, resetResult.reset_generation);
    assert.equal(laterStaleRetry.reset_epoch, g1.reset_epoch + 1);
    assert.equal(laterStaleRetry.revision, resetResult.revision);
    assert.deepEqual(laterStaleRetry.progress, EMPTY);
  }

  await t.test("unauthenticated invocation is rejected", () => {
    assert.throws(
      () => psql(rpcSql(
        "",
        commitExpression({
          revision: null,
          generation: null,
          base: EMPTY,
          proposed: EMPTY,
          operation: "91000000-0000-4000-8000-000000000001",
        }),
      )),
      /Authentication required/,
    );
  });

  await t.test("simultaneous first-row creation converges through first_row_race", async () => {
    const moduleCandidate = moduleProgress(["m1-1"]);
    const quizCandidate = quizProgress();
    const calls = [
      commitExpression({ revision: null, generation: null, base: EMPTY, proposed: moduleCandidate, operation: "91000000-0000-4000-8000-000000000002" }),
      commitExpression({ revision: null, generation: null, base: EMPTY, proposed: quizCandidate, operation: "91000000-0000-4000-8000-000000000003" }),
    ];
    const raw = await Promise.all(calls.map((call) => psqlAsync(rpcSql(USERS.first, call))));
    const results = raw.map(JSON.parse);
    assert.deepEqual(results.map((result) => result.status).sort(), ["committed", "first_row_race"]);
    const raceIndex = results.findIndex((result) => result.status === "first_row_race");
    const loser = raceIndex === 0 ? moduleCandidate : quizCandidate;
    const canonical = results[raceIndex];
    assert.equal(canonical.reset_epoch, 0);
    const merged = mergeProgress(loser, canonical.progress, NOW);
    const retry = commit(USERS.first, {
      revision: canonical.revision,
      generation: canonical.reset_generation,
      base: canonical.progress,
      proposed: merged,
      operation: "91000000-0000-4000-8000-000000000004",
    });
    assert.equal(retry.status, "committed");
    assert.deepEqual(retry.progress.modules["1"].visitedSlideIds, ["m1-1"]);
    assert.equal(retry.progress.quizAttempts.length, 1);
  });

  async function conflictOrder(userId, firstKind) {
    const base = moduleProgress(["m1-1"]);
    const initial = commit(userId, {
      revision: null,
      generation: null,
      base: EMPTY,
      proposed: base,
      operation: firstKind === "module" ? "92000000-0000-4000-8000-000000000001" : "93000000-0000-4000-8000-000000000001",
    });
    const moduleCandidate = moduleProgress(["m1-1", "m1-2"]);
    const quizCandidate = mergeProgress(quizProgress(), base, NOW);
    const candidates = firstKind === "module" ? [moduleCandidate, quizCandidate] : [quizCandidate, moduleCandidate];
    const operationPrefix = firstKind === "module" ? "92000000" : "93000000";
    const first = commit(userId, {
      revision: initial.revision,
      generation: initial.reset_generation,
      base,
      proposed: candidates[0],
      operation: `${operationPrefix}-0000-4000-8000-000000000002`,
    });
    assert.equal(first.status, "committed");
    const conflict = commit(userId, {
      revision: initial.revision,
      generation: initial.reset_generation,
      base,
      proposed: candidates[1],
      operation: `${operationPrefix}-0000-4000-8000-000000000003`,
    });
    assert.equal(conflict.status, "revision_conflict");
    assert.deepEqual(conflict.progress.modules["1"].visitedSlideIds, ["m1-1", "m1-2"]);
    assert.equal(conflict.progress.quizAttempts.length, 1);
    const persisted = JSON.parse(psql(`select row_to_json(row)::text from (select progress, revision from public.faa107_user_progress where user_id = '${userId}') row;`));
    assert.deepEqual(persisted.progress, conflict.progress, "the conflict recipient can close without retry");
  }

  await t.test("revision conflicts preserve disjoint deltas in both commit orders", async () => {
    await conflictOrder(USERS.orderAB, "module");
    await conflictOrder(USERS.orderBA, "quiz");
  });

  await t.test("reset changes generation and blocks stale and null-generation resurrection", () => {
    const first = commit(USERS.reset, {
      revision: null,
      generation: null,
      base: EMPTY,
      proposed: moduleProgress(["m1-1"]),
      operation: "94000000-0000-4000-8000-000000000001",
    });
    const cleared = reset(USERS.reset, "94000000-0000-4000-8000-000000000002");
    assert.equal(cleared.status, "reset");
    assert.equal(cleared.reset_epoch, 1);
    assert.notEqual(cleared.reset_generation, first.reset_generation);
    assert.deepEqual(cleared.progress, EMPTY);
    const duplicate = reset(USERS.reset, "94000000-0000-4000-8000-000000000002");
    assert.equal(duplicate.status, "duplicate");
    assert.equal(duplicate.reset_epoch, 1);
    const stale = commit(USERS.reset, {
      revision: first.revision,
      generation: first.reset_generation,
      base: first.progress,
      proposed: moduleProgress(["m1-1", "m1-2"]),
      operation: "94000000-0000-4000-8000-000000000003",
    });
    assert.equal(stale.status, "generation_mismatch");
    assert.deepEqual(stale.progress, EMPTY);
    const preGeneration = commit(USERS.reset, {
      revision: null,
      generation: null,
      base: EMPTY,
      proposed: moduleProgress(["m1-1"]),
      operation: "94000000-0000-4000-8000-000000000004",
    });
    assert.equal(preGeneration.status, "pre_generation_rejected");
    assert.deepEqual(preGeneration.progress, EMPTY);

    const resetBeforeFirst = reset(USERS.resetFirst, "95000000-0000-4000-8000-000000000001");
    assert.equal(resetBeforeFirst.status, "reset");
    assert.equal(resetBeforeFirst.revision, 1);
    assert.equal(resetBeforeFirst.reset_epoch, 1);
    const delayedFirst = commit(USERS.resetFirst, {
      revision: null,
      generation: null,
      base: EMPTY,
      proposed: moduleProgress(["m1-1"]),
      operation: "95000000-0000-4000-8000-000000000002",
    });
    assert.equal(delayedFirst.status, "pre_generation_rejected");
  });

  await t.test("concurrent stale commit then reset leaves the reset canonical", async () => {
    await runConcurrentResetRace({
      userId: USERS.raceCommitFirst,
      ordering: "commit-first",
      operationPrefix: "98000000",
    });
  });

  await t.test("concurrent reset then stale commit returns generation_mismatch", async () => {
    await runConcurrentResetRace({
      userId: USERS.raceResetFirst,
      ordering: "reset-first",
      operationPrefix: "99000000",
    });
  });

  await t.test("invalid and oversized payloads fail without mutation", () => {
    assert.throws(
      () => commit(USERS.normalize, {
        revision: null,
        generation: null,
        base: EMPTY,
        proposed: { version: 2 },
        operation: "96000000-0000-4000-8000-000000000001",
      }),
      /Unsupported FAA 107 progress version|Invalid FAA 107 progress/,
    );
    assert.throws(
      () => commit(USERS.normalize, {
        revision: null,
        generation: null,
        base: EMPTY,
        proposed: { ...EMPTY, padding: "x".repeat(262145) },
        operation: "96000000-0000-4000-8000-000000000002",
      }),
      /256 KiB|Invalid FAA 107 progress/,
    );
    assert.equal(psql(`select count(*) from public.faa107_user_progress where user_id = '${USERS.normalize}';`), "0");
  });

  await t.test("local RPC results match every shared canonical fixture", () => {
    const normalization = fixtures.normalization[0];
    const normalized = commit(USERS.normalize, {
      revision: null,
      generation: null,
      base: EMPTY,
      proposed: normalization.input,
      operation: "96000000-0000-4000-8000-000000000003",
    });
    assert.deepEqual(normalized.progress, normalization.expected, normalization.name);
    assert.equal(
      psql(`select private.faa107_canonical_progress_text(${jsonb(normalized.progress)});`),
      canonicalProgressJson(normalization.expected, NOW),
      `${normalization.name} canonical bytes`,
    );

    const fixture = fixtures.merge[0];
    const remote = commit(USERS.parity, {
      revision: null,
      generation: null,
      base: EMPTY,
      proposed: fixture.remote,
      operation: "97000000-0000-4000-8000-000000000001",
    });
    const merged = commit(USERS.parity, {
      revision: 0,
      generation: remote.reset_generation,
      base: EMPTY,
      proposed: fixture.local,
      operation: "97000000-0000-4000-8000-000000000002",
    });
    assert.equal(merged.status, "revision_conflict");
    assert.deepEqual(merged.progress, fixture.expected, fixture.name);
    assert.equal(
      psql(`select private.faa107_canonical_progress_text(${jsonb(merged.progress)});`),
      canonicalProgressJson(fixture.expected, NOW),
      `${fixture.name} canonical bytes`,
    );
  });
});
