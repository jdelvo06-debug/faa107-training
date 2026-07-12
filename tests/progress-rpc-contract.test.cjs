const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const root = path.resolve(__dirname, "..");
const migration = fs.readFileSync(
  path.join(root, "supabase/migrations/20260712000000_account_progress_sync.sql"),
  "utf8",
);
const sqlTests = fs.readFileSync(
  path.join(root, "supabase/tests/account_progress_sync.sql"),
  "utf8",
);

function functionBody(signature) {
  const start = migration.indexOf(`create function ${signature}`);
  assert.notEqual(start, -1, `${signature} must exist`);
  const end = migration.indexOf("$$;", start);
  assert.notEqual(end, -1, `${signature} must have a complete body`);
  return migration.slice(start, end);
}

test("Phase 3 replaces both fail-closed RPC placeholders", () => {
  assert.doesNotMatch(migration, /FAA 107 progress RPC is not enabled/);
  for (const status of [
    "first_row_race",
    "pre_generation_rejected",
    "generation_mismatch",
    "revision_conflict",
    "duplicate",
  ]) {
    assert.match(migration, new RegExp(`'${status}'`));
  }
});

test("commit and reset use advisory-then-row lock order", () => {
  for (const signature of [
    "public.commit_faa107_progress(",
    "public.reset_faa107_progress(",
  ]) {
    const body = functionBody(signature);
    const advisory = body.indexOf("pg_catalog.pg_advisory_xact_lock");
    const rowLock = body.search(/for\s+update/i);
    assert.ok(advisory >= 0, `${signature} must acquire the per-user advisory transaction lock`);
    assert.ok(rowLock > advisory, `${signature} must row-lock only after the advisory lock`);
    assert.match(body, /hashtextextended\s*\(\s*owner_id::text\s*,\s*0\s*\)/);
  }
});

test("browser roles retain only RPC execution and owner SELECT", () => {
  assert.match(migration, /revoke all on table public\.faa107_user_progress from public, anon, authenticated/i);
  assert.match(migration, /grant select on table public\.faa107_user_progress to authenticated/i);
  assert.doesNotMatch(migration, /grant\s+(insert|update|delete)[^;]*faa107_user_progress/i);
  assert.match(migration, /revoke all on function private\.faa107_normalize_progress\(jsonb\) from public, anon, authenticated/i);
  assert.match(migration, /grant execute on function public\.commit_faa107_progress[^;]*to authenticated/i);
  assert.match(migration, /grant execute on function public\.reset_faa107_progress[^;]*to authenticated/i);
});

test("reset is update-based and operation receipts share the mutation transaction", () => {
  const reset = functionBody("public.reset_faa107_progress(");
  const prune = functionBody("private.faa107_prune_operation_receipts(");
  assert.doesNotMatch(reset, /delete\s+from\s+public\.faa107_user_progress/i);
  assert.match(reset, /reset_epoch\s*=\s*[^,;]*reset_epoch\s*\+\s*1/i);
  assert.match(reset, /reset_generation\s*=\s*extensions\.gen_random_uuid\(\)/i);
  assert.match(reset, /private\.faa107_progress_operation_receipts/i);
  assert.match(functionBody("public.commit_faa107_progress("), /private\.faa107_progress_operation_receipts/i);
  assert.match(prune, /created_at\s*<\s*pg_catalog\.now\(\)\s*-\s*interval\s+'30 days'/i);
  assert.match(prune, /limit\s+100/i);
});

test("SQL tests name every approved RPC and reset matrix lane", () => {
  for (const required of [
    "Authentication required",
    "owner is derived exclusively from auth.uid()",
    "first_row_race",
    "pre_generation_rejected",
    "generation_mismatch",
    "matching revision",
    "revision conflict",
    "repeated operation id",
    "reset-before-first-commit",
    "oversized progress payload",
    "receipt pruning",
  ]) {
    assert.match(sqlTests, new RegExp(required.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i"));
  }
});

test("the shared canonical fixture remains the only parity corpus", () => {
  const fixtures = JSON.parse(fs.readFileSync(
    path.join(root, "tests/fixtures/progress-canonical-cases.json"),
    "utf8",
  ));
  assert.ok(fixtures.normalization.length > 0);
  assert.ok(fixtures.merge.length > 0);
});
