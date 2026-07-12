begin;

select no_plan();

-- Schema shape and integrity.
select ok(to_regclass('public.faa107_user_progress') is not null, 'public progress table exists');
select ok(to_regclass('private.faa107_progress_operation_receipts') is not null, 'private receipt table exists');

select is(
  (select array_agg(a.attname order by a.attnum)
   from pg_catalog.pg_attribute a
   where a.attrelid = to_regclass('public.faa107_user_progress')
     and a.attnum > 0 and not a.attisdropped),
  array['user_id', 'progress', 'revision', 'reset_generation', 'reset_epoch', 'updated_at']::name[],
  'progress table has exactly the approved columns'
);

select is(
  (select array_agg(pg_catalog.format_type(a.atttypid, a.atttypmod) order by a.attnum)
   from pg_catalog.pg_attribute a
   where a.attrelid = to_regclass('public.faa107_user_progress')
     and a.attnum > 0 and not a.attisdropped),
  array['uuid', 'jsonb', 'bigint', 'uuid', 'bigint', 'timestamp with time zone']::text[],
  'progress column types match the approved schema'
);

select is(
  (select array_agg(a.attnotnull order by a.attnum)
   from pg_catalog.pg_attribute a
   where a.attrelid = to_regclass('public.faa107_user_progress')
     and a.attnum > 0 and not a.attisdropped),
  array[true, true, true, true, true, true]::boolean[],
  'all progress columns are not null'
);

select is(
  (select array_agg(a.attname order by a.attnum)
   from pg_catalog.pg_attribute a
   where a.attrelid = to_regclass('private.faa107_progress_operation_receipts')
     and a.attnum > 0 and not a.attisdropped),
  array['user_id', 'operation_id', 'created_at']::name[],
  'receipt table has exactly the approved columns'
);

select is(
  (select array_agg(pg_catalog.format_type(a.atttypid, a.atttypmod) order by a.attnum)
   from pg_catalog.pg_attribute a
   where a.attrelid = to_regclass('private.faa107_progress_operation_receipts')
     and a.attnum > 0 and not a.attisdropped),
  array['uuid', 'uuid', 'timestamp with time zone']::text[],
  'receipt column types match the approved schema'
);

select is(
  (select array_agg(a.attnotnull order by a.attnum)
   from pg_catalog.pg_attribute a
   where a.attrelid = to_regclass('private.faa107_progress_operation_receipts')
     and a.attnum > 0 and not a.attisdropped),
  array[true, true, true]::boolean[],
  'all receipt columns are not null'
);

select ok(
  exists (
    select 1 from pg_catalog.pg_attrdef d
    join pg_catalog.pg_attribute a on a.attrelid = d.adrelid and a.attnum = d.adnum
    where d.adrelid = to_regclass('public.faa107_user_progress')
      and a.attname = 'revision'
      and pg_catalog.pg_get_expr(d.adbin, d.adrelid) in ('0', '0::bigint')
  ),
  'revision defaults to zero'
);

select ok(
  exists (
    select 1 from pg_catalog.pg_attrdef d
    join pg_catalog.pg_attribute a on a.attrelid = d.adrelid and a.attnum = d.adnum
    where d.adrelid = to_regclass('public.faa107_user_progress')
      and a.attname = 'reset_epoch'
      and pg_catalog.pg_get_expr(d.adbin, d.adrelid) in ('0', '0::bigint')
  ),
  'reset epoch defaults to zero'
);

select ok(
  exists (
    select 1 from pg_catalog.pg_attrdef d
    join pg_catalog.pg_attribute a on a.attrelid = d.adrelid and a.attnum = d.adnum
    where d.adrelid = to_regclass('public.faa107_user_progress')
      and a.attname = 'updated_at'
      and pg_catalog.pg_get_expr(d.adbin, d.adrelid) = 'now()'
  ),
  'updated_at defaults to now'
);

select ok(
  exists (
    select 1 from pg_catalog.pg_attrdef d
    join pg_catalog.pg_attribute a on a.attrelid = d.adrelid and a.attnum = d.adnum
    where d.adrelid = to_regclass('private.faa107_progress_operation_receipts')
      and a.attname = 'created_at'
      and pg_catalog.pg_get_expr(d.adbin, d.adrelid) = 'now()'
  ),
  'receipt created_at defaults to now'
);

select ok(
  exists (
    select 1 from pg_catalog.pg_constraint c
    where c.conrelid = to_regclass('public.faa107_user_progress')
      and c.contype = 'p'
      and c.conkey = array[(select attnum from pg_catalog.pg_attribute where attrelid = c.conrelid and attname = 'user_id')]::smallint[]
  ),
  'progress table primary key is user_id'
);

select ok(
  exists (
    select 1 from pg_catalog.pg_constraint c
    where c.conrelid = to_regclass('private.faa107_progress_operation_receipts')
      and c.contype = 'p'
      and pg_catalog.pg_get_constraintdef(c.oid) = 'PRIMARY KEY (user_id, operation_id)'
  ),
  'receipt table primary key is user and operation'
);

select ok(
  exists (
    select 1 from pg_catalog.pg_constraint c
    where c.conrelid = to_regclass('public.faa107_user_progress')
      and c.contype = 'f'
      and c.confrelid = to_regclass('auth.users')
      and c.confdeltype = 'c'
  ),
  'progress owner foreign key cascades on auth user deletion'
);

select ok(
  exists (
    select 1 from pg_catalog.pg_constraint c
    where c.conrelid = to_regclass('private.faa107_progress_operation_receipts')
      and c.contype = 'f'
      and c.confrelid = to_regclass('auth.users')
      and c.confdeltype = 'c'
  ),
  'receipt owner foreign key cascades on auth user deletion'
);

select ok(
  exists (
    select 1 from pg_catalog.pg_constraint c
    where c.conrelid = to_regclass('public.faa107_user_progress')
      and c.contype = 'c'
      and pg_catalog.pg_get_constraintdef(c.oid) ilike '%revision >= 0%'
  ),
  'revision has a non-negative check'
);

select ok(
  exists (
    select 1 from pg_catalog.pg_constraint c
    where c.conrelid = to_regclass('public.faa107_user_progress')
      and c.contype = 'c'
      and pg_catalog.pg_get_constraintdef(c.oid) ilike '%reset_epoch >= 0%'
  ),
  'reset epoch has a non-negative check'
);

-- RLS, policies, and table grants.
select ok(
  coalesce((select c.relrowsecurity from pg_catalog.pg_class c where c.oid = to_regclass('public.faa107_user_progress')), false),
  'RLS is enabled on the public progress table'
);

select ok(
  coalesce((select c.relrowsecurity from pg_catalog.pg_class c where c.oid = to_regclass('private.faa107_progress_operation_receipts')), false),
  'RLS is enabled on the private receipt table as defense in depth'
);

select is(
  (select count(*) from pg_catalog.pg_policy p where p.polrelid = to_regclass('public.faa107_user_progress')),
  1::bigint,
  'the progress table has exactly one policy'
);

select ok(
  exists (
    select 1 from pg_catalog.pg_policy p
    where p.polrelid = to_regclass('public.faa107_user_progress')
      and p.polcmd = 'r'
      and p.polroles = array[(select oid from pg_catalog.pg_roles where rolname = 'authenticated')]::oid[]
      and pg_catalog.pg_get_expr(p.polqual, p.polrelid) like '%auth.uid()%'
      and pg_catalog.pg_get_expr(p.polqual, p.polrelid) like '%user_id%'
  ),
  'the only policy is authenticated owner SELECT derived from auth.uid()'
);

select is(
  (select count(*) from pg_catalog.pg_policy p where p.polrelid = to_regclass('public.faa107_user_progress') and p.polcmd = 'd'),
  0::bigint,
  'there is no DELETE policy'
);

select ok(not pg_catalog.has_table_privilege('anon', 'public.faa107_user_progress', 'SELECT'), 'anon cannot select progress');
select ok(not pg_catalog.has_table_privilege('anon', 'public.faa107_user_progress', 'INSERT,UPDATE,DELETE'), 'anon has no direct progress writes');
select ok(pg_catalog.has_table_privilege('authenticated', 'public.faa107_user_progress', 'SELECT'), 'authenticated can select progress');
select ok(not pg_catalog.has_table_privilege('authenticated', 'public.faa107_user_progress', 'INSERT'), 'authenticated cannot insert progress');
select ok(not pg_catalog.has_table_privilege('authenticated', 'public.faa107_user_progress', 'UPDATE'), 'authenticated cannot update progress');
select ok(not pg_catalog.has_table_privilege('authenticated', 'public.faa107_user_progress', 'DELETE'), 'authenticated cannot delete progress');
select ok(not pg_catalog.has_table_privilege('anon', 'private.faa107_progress_operation_receipts', 'SELECT,INSERT,UPDATE,DELETE'), 'anon has no receipt access');
select ok(not pg_catalog.has_table_privilege('authenticated', 'private.faa107_progress_operation_receipts', 'SELECT,INSERT,UPDATE,DELETE'), 'authenticated has no receipt access');
select ok(not pg_catalog.has_schema_privilege('anon', 'private', 'USAGE'), 'anon has no private schema usage');
select ok(not pg_catalog.has_schema_privilege('authenticated', 'private', 'USAGE'), 'authenticated has no private schema usage');

-- Public and private function boundaries.
select ok(
  to_regprocedure('public.commit_faa107_progress(bigint,uuid,jsonb,jsonb,uuid)') is not null,
  'commit RPC has the approved signature without a user id parameter'
);
select ok(
  to_regprocedure('public.reset_faa107_progress(uuid)') is not null,
  'reset RPC has the approved signature without a user id parameter'
);

select ok(
  coalesce((select p.prosecdef from pg_catalog.pg_proc p where p.oid = to_regprocedure('public.commit_faa107_progress(bigint,uuid,jsonb,jsonb,uuid)')), false),
  'commit RPC is security definer'
);
select ok(
  coalesce((select p.prosecdef from pg_catalog.pg_proc p where p.oid = to_regprocedure('public.reset_faa107_progress(uuid)')), false),
  'reset RPC is security definer'
);
select ok(
  coalesce((select p.proconfig @> array['search_path=""'] from pg_catalog.pg_proc p where p.oid = to_regprocedure('public.commit_faa107_progress(bigint,uuid,jsonb,jsonb,uuid)')), false),
  'commit RPC has an empty fixed search path'
);
select ok(
  coalesce((select p.proconfig @> array['search_path=""'] from pg_catalog.pg_proc p where p.oid = to_regprocedure('public.reset_faa107_progress(uuid)')), false),
  'reset RPC has an empty fixed search path'
);
select ok(
  coalesce((select pg_catalog.pg_get_functiondef(p.oid) like '%auth.uid()%' from pg_catalog.pg_proc p where p.oid = to_regprocedure('public.commit_faa107_progress(bigint,uuid,jsonb,jsonb,uuid)')), false),
  'commit RPC derives ownership from auth.uid()'
);
select ok(
  coalesce((select pg_catalog.pg_get_functiondef(p.oid) like '%auth.uid()%' from pg_catalog.pg_proc p where p.oid = to_regprocedure('public.reset_faa107_progress(uuid)')), false),
  'reset RPC derives ownership from auth.uid()'
);

select ok(
  not exists (
    select 1 from pg_catalog.pg_proc p,
      lateral pg_catalog.aclexplode(coalesce(p.proacl, pg_catalog.acldefault('f', p.proowner))) acl
    where p.oid = to_regprocedure('public.commit_faa107_progress(bigint,uuid,jsonb,jsonb,uuid)')
      and acl.grantee = 0 and acl.privilege_type = 'EXECUTE'
  ),
  'PUBLIC cannot execute commit RPC'
);
select ok(not coalesce(pg_catalog.has_function_privilege('anon', to_regprocedure('public.commit_faa107_progress(bigint,uuid,jsonb,jsonb,uuid)'), 'EXECUTE'), false), 'anon cannot execute commit RPC');
select ok(coalesce(pg_catalog.has_function_privilege('authenticated', to_regprocedure('public.commit_faa107_progress(bigint,uuid,jsonb,jsonb,uuid)'), 'EXECUTE'), false), 'authenticated can execute commit RPC');
select ok(
  not exists (
    select 1 from pg_catalog.pg_proc p,
      lateral pg_catalog.aclexplode(coalesce(p.proacl, pg_catalog.acldefault('f', p.proowner))) acl
    where p.oid = to_regprocedure('public.reset_faa107_progress(uuid)')
      and acl.grantee = 0 and acl.privilege_type = 'EXECUTE'
  ),
  'PUBLIC cannot execute reset RPC'
);
select ok(not coalesce(pg_catalog.has_function_privilege('anon', to_regprocedure('public.reset_faa107_progress(uuid)'), 'EXECUTE'), false), 'anon cannot execute reset RPC');
select ok(coalesce(pg_catalog.has_function_privilege('authenticated', to_regprocedure('public.reset_faa107_progress(uuid)'), 'EXECUTE'), false), 'authenticated can execute reset RPC');

select ok(to_regprocedure('private.faa107_normalize_progress(jsonb)') is not null, 'private normalize helper exists');
select ok(to_regprocedure('private.faa107_progress_delta(jsonb,jsonb)') is not null, 'private delta helper exists');
select ok(to_regprocedure('private.faa107_merge_progress(jsonb,jsonb)') is not null, 'private merge helper exists');
select ok(to_regprocedure('private.faa107_prune_operation_receipts(uuid)') is not null, 'private receipt-prune helper exists');
select ok(coalesce((select p.proconfig @> array['search_path=""'] from pg_catalog.pg_proc p where p.oid = to_regprocedure('private.faa107_normalize_progress(jsonb)')), false), 'normalize helper has an empty fixed search path');
select ok(coalesce((select p.proconfig @> array['search_path=""'] from pg_catalog.pg_proc p where p.oid = to_regprocedure('private.faa107_progress_delta(jsonb,jsonb)')), false), 'delta helper has an empty fixed search path');
select ok(coalesce((select p.proconfig @> array['search_path=""'] from pg_catalog.pg_proc p where p.oid = to_regprocedure('private.faa107_merge_progress(jsonb,jsonb)')), false), 'merge helper has an empty fixed search path');
select ok(coalesce((select p.proconfig @> array['search_path=""'] from pg_catalog.pg_proc p where p.oid = to_regprocedure('private.faa107_prune_operation_receipts(uuid)')), false), 'prune helper has an empty fixed search path');

select ok(
  not exists (
    select 1 from pg_catalog.pg_proc p,
      lateral pg_catalog.aclexplode(coalesce(p.proacl, pg_catalog.acldefault('f', p.proowner))) acl
    where p.oid = to_regprocedure('private.faa107_normalize_progress(jsonb)')
      and acl.grantee = 0 and acl.privilege_type = 'EXECUTE'
  ),
  'PUBLIC cannot execute normalize helper'
);
select ok(not coalesce(pg_catalog.has_function_privilege('anon', to_regprocedure('private.faa107_normalize_progress(jsonb)'), 'EXECUTE'), false), 'anon cannot execute normalize helper');
select ok(not coalesce(pg_catalog.has_function_privilege('authenticated', to_regprocedure('private.faa107_normalize_progress(jsonb)'), 'EXECUTE'), false), 'authenticated cannot execute normalize helper');
select ok(
  not exists (
    select 1 from pg_catalog.pg_proc p,
      lateral pg_catalog.aclexplode(coalesce(p.proacl, pg_catalog.acldefault('f', p.proowner))) acl
    where p.oid = to_regprocedure('private.faa107_progress_delta(jsonb,jsonb)')
      and acl.grantee = 0 and acl.privilege_type = 'EXECUTE'
  ),
  'PUBLIC cannot execute delta helper'
);
select ok(not coalesce(pg_catalog.has_function_privilege('anon', to_regprocedure('private.faa107_progress_delta(jsonb,jsonb)'), 'EXECUTE'), false), 'anon cannot execute delta helper');
select ok(not coalesce(pg_catalog.has_function_privilege('authenticated', to_regprocedure('private.faa107_progress_delta(jsonb,jsonb)'), 'EXECUTE'), false), 'authenticated cannot execute delta helper');
select ok(
  not exists (
    select 1 from pg_catalog.pg_proc p,
      lateral pg_catalog.aclexplode(coalesce(p.proacl, pg_catalog.acldefault('f', p.proowner))) acl
    where p.oid = to_regprocedure('private.faa107_merge_progress(jsonb,jsonb)')
      and acl.grantee = 0 and acl.privilege_type = 'EXECUTE'
  ),
  'PUBLIC cannot execute merge helper'
);
select ok(not coalesce(pg_catalog.has_function_privilege('anon', to_regprocedure('private.faa107_merge_progress(jsonb,jsonb)'), 'EXECUTE'), false), 'anon cannot execute merge helper');
select ok(not coalesce(pg_catalog.has_function_privilege('authenticated', to_regprocedure('private.faa107_merge_progress(jsonb,jsonb)'), 'EXECUTE'), false), 'authenticated cannot execute merge helper');
select ok(
  not exists (
    select 1 from pg_catalog.pg_proc p,
      lateral pg_catalog.aclexplode(coalesce(p.proacl, pg_catalog.acldefault('f', p.proowner))) acl
    where p.oid = to_regprocedure('private.faa107_prune_operation_receipts(uuid)')
      and acl.grantee = 0 and acl.privilege_type = 'EXECUTE'
  ),
  'PUBLIC cannot execute prune helper'
);
select ok(not coalesce(pg_catalog.has_function_privilege('anon', to_regprocedure('private.faa107_prune_operation_receipts(uuid)'), 'EXECUTE'), false), 'anon cannot execute prune helper');
select ok(not coalesce(pg_catalog.has_function_privilege('authenticated', to_regprocedure('private.faa107_prune_operation_receipts(uuid)'), 'EXECUTE'), false), 'authenticated cannot execute prune helper');
select ok(
  not exists (
    select 1
    from pg_catalog.pg_proc function_object
    join pg_catalog.pg_namespace function_schema on function_schema.oid = function_object.pronamespace
    where function_schema.nspname = 'private'
      and pg_catalog.has_function_privilege('anon', function_object.oid, 'EXECUTE')
  ),
  'anon cannot execute any private helper'
);
select ok(
  not exists (
    select 1
    from pg_catalog.pg_proc function_object
    join pg_catalog.pg_namespace function_schema on function_schema.oid = function_object.pronamespace
    where function_schema.nspname = 'private'
      and pg_catalog.has_function_privilege('authenticated', function_object.oid, 'EXECUTE')
  ),
  'authenticated cannot execute any private helper'
);

select ok(
  exists (
    select 1 from pg_catalog.pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'faa107_user_progress'
  ),
  'progress table is a member of the Realtime publication'
);

-- Runtime security and RPC behavior.
select lives_ok($setup$
  insert into auth.users (id, email)
  values
    ('11111111-1111-4111-8111-111111111111', 'owner-a@example.test'),
    ('22222222-2222-4222-8222-222222222222', 'owner-b@example.test'),
    ('33333333-3333-4333-8333-333333333333', 'owner-c@example.test'),
    ('44444444-4444-4444-8444-444444444444', 'owner-d@example.test');
$setup$, 'security fixtures can be created as the migration owner');

set local role authenticated;
select set_config('request.jwt.claim.sub', '11111111-1111-4111-8111-111111111111', true);

select throws_ok($$insert into public.faa107_user_progress (user_id, progress, reset_generation) values ('11111111-1111-4111-8111-111111111111', '{}'::jsonb, gen_random_uuid())$$, '42501', null, 'authenticated direct INSERT is denied');
select throws_ok($$update public.faa107_user_progress set progress = '{}'::jsonb$$, '42501', null, 'authenticated direct UPDATE is denied');
select throws_ok($$delete from public.faa107_user_progress$$, '42501', null, 'authenticated direct DELETE is denied');

select is(
  (select status from public.commit_faa107_progress(
    null,
    null,
    '{"version":1,"modules":{},"quizAttempts":[],"flashcards":{},"examAttempts":[],"recentActivity":[]}'::jsonb,
    '{"version":1,"modules":{"1":{"visitedSlideIds":["m1-1"],"completed":false}},"quizAttempts":[],"flashcards":{},"examAttempts":[],"recentActivity":[]}'::jsonb,
    'aaaaaaaa-0000-4000-8000-000000000001'
  )),
  'committed',
  'first commit creates the owner row atomically'
);
select is((select user_id from public.faa107_user_progress), '11111111-1111-4111-8111-111111111111'::uuid, 'commit owner is derived exclusively from auth.uid()');
select is((select reset_epoch from public.faa107_user_progress), 0::bigint, 'normal first creation starts at reset epoch zero');
select is((select revision from public.faa107_user_progress), 1::bigint, 'first canonical commit advances revision once');

select is(
  (select status from public.commit_faa107_progress(
    null,
    null,
    '{"version":1,"modules":{},"quizAttempts":[],"flashcards":{},"examAttempts":[],"recentActivity":[]}'::jsonb,
    '{"version":1,"modules":{"1":{"visitedSlideIds":["m1-2"],"completed":false}},"quizAttempts":[],"flashcards":{},"examAttempts":[],"recentActivity":[]}'::jsonb,
    'aaaaaaaa-0000-4000-8000-000000000002'
  )),
  'first_row_race',
  'null generation against an epoch-zero row returns first_row_race'
);
reset role;
select is(
  (select count(*) from private.faa107_progress_operation_receipts where operation_id = 'aaaaaaaa-0000-4000-8000-000000000002'),
  0::bigint,
  'first_row_race creates no receipt'
);
set local role authenticated;
select set_config('request.jwt.claim.sub', '11111111-1111-4111-8111-111111111111', true);

select is(
  (select status from public.commit_faa107_progress(
    (select revision from public.faa107_user_progress),
    (select reset_generation from public.faa107_user_progress),
    (select progress from public.faa107_user_progress),
    (select progress from public.faa107_user_progress),
    'aaaaaaaa-0000-4000-8000-000000000003'
  )),
  'current',
  'matching revision with identical canonical progress is current'
);
select is((select revision from public.faa107_user_progress), 1::bigint, 'current confirmation does not advance revision');

select is(
  (select status from public.commit_faa107_progress(
    (select revision from public.faa107_user_progress),
    (select reset_generation from public.faa107_user_progress),
    (select progress from public.faa107_user_progress),
    '{"version":1,"modules":{"1":{"visitedSlideIds":["m1-1","m1-2"],"completed":false}},"quizAttempts":[],"flashcards":{},"examAttempts":[],"recentActivity":[]}'::jsonb,
    'aaaaaaaa-0000-4000-8000-000000000004'
  )),
  'committed',
  'matching revision and generation commits proposed canonical progress'
);
select is((select revision from public.faa107_user_progress), 2::bigint, 'matching commit advances revision exactly once');

select is(
  (select status from public.commit_faa107_progress(
    1,
    (select reset_generation from public.faa107_user_progress),
    '{"version":1,"modules":{"1":{"visitedSlideIds":["m1-1"],"completed":false}},"quizAttempts":[],"flashcards":{},"examAttempts":[],"recentActivity":[]}'::jsonb,
    '{"version":1,"modules":{"1":{"visitedSlideIds":["m1-1"],"completed":false}},"quizAttempts":[{"id":"00000000-0000-4000-8000-000000000001","moduleId":"1","score":1,"total":2,"topicScores":{"Operations":{"correct":1,"total":2}},"completedAt":"2026-07-12T12:00:00.000Z"}],"flashcards":{},"examAttempts":[],"recentActivity":[]}'::jsonb,
    'aaaaaaaa-0000-4000-8000-000000000005'
  )),
  'revision_conflict',
  'revision conflict applies the submitted delta server-side'
);
select ok(
  (select progress #> '{modules,1,visitedSlideIds}' from public.faa107_user_progress) @> '["m1-2"]'::jsonb
  and jsonb_array_length((select progress -> 'quizAttempts' from public.faa107_user_progress)) = 1,
  'server-side conflict merge preserves canonical and submitted disjoint changes'
);
select is((select revision from public.faa107_user_progress), 3::bigint, 'revision conflict advances revision exactly once');

select is(
  (select status from public.commit_faa107_progress(
    1,
    (select reset_generation from public.faa107_user_progress),
    '{"version":1,"modules":{},"quizAttempts":[],"flashcards":{},"examAttempts":[],"recentActivity":[]}'::jsonb,
    '{"version":1,"modules":{},"quizAttempts":[],"flashcards":{},"examAttempts":[],"recentActivity":[]}'::jsonb,
    'aaaaaaaa-0000-4000-8000-000000000005'
  )),
  'duplicate',
  'repeated operation id returns duplicate'
);
select is((select revision from public.faa107_user_progress), 3::bigint, 'duplicate operation id does not mutate revision');

select throws_ok(
  $$select * from public.commit_faa107_progress(3, (select reset_generation from public.faa107_user_progress), '{"version":1}'::jsonb, '{"version":2}'::jsonb, 'aaaaaaaa-0000-4000-8000-000000000006')$$,
  '22023',
  null,
  'unsupported progress version is rejected'
);
select throws_ok(
  $$select * from public.commit_faa107_progress(3, (select reset_generation from public.faa107_user_progress), '{"version":1}'::jsonb, jsonb_build_object('version', 1, 'modules', jsonb_build_object(), 'quizAttempts', jsonb_build_array(), 'flashcards', jsonb_build_object(), 'examAttempts', jsonb_build_array(), 'recentActivity', jsonb_build_array(), 'padding', repeat('x', 262145)), 'aaaaaaaa-0000-4000-8000-000000000007')$$,
  '22023',
  null,
  'oversized progress payload is rejected before mutation'
);

select is(
  (select status from public.reset_faa107_progress('aaaaaaaa-0000-4000-8000-000000000008')),
  'reset',
  'reset writes canonical empty progress without deleting the row'
);
select is((select reset_epoch from public.faa107_user_progress), 1::bigint, 'reset increments reset_epoch exactly once');
select is((select revision from public.faa107_user_progress), 4::bigint, 'reset advances revision exactly once');
select is((select progress from public.faa107_user_progress), '{"version":1,"modules":{},"quizAttempts":[],"flashcards":{},"examAttempts":[],"recentActivity":[]}'::jsonb, 'reset persists canonical empty progress');
select is(
  (select status from public.reset_faa107_progress('aaaaaaaa-0000-4000-8000-000000000008')),
  'duplicate',
  'repeated reset operation id is idempotent'
);
select is((select reset_epoch from public.faa107_user_progress), 1::bigint, 'duplicate reset does not increment reset_epoch');

select is(
  (select status from public.commit_faa107_progress(
    null,
    null,
    '{"version":1,"modules":{},"quizAttempts":[],"flashcards":{},"examAttempts":[],"recentActivity":[]}'::jsonb,
    '{"version":1,"modules":{"1":{"visitedSlideIds":["m1-1"],"completed":false}},"quizAttempts":[],"flashcards":{},"examAttempts":[],"recentActivity":[]}'::jsonb,
    'aaaaaaaa-0000-4000-8000-000000000009'
  )),
  'pre_generation_rejected',
  'null generation after reset is terminal pre_generation_rejected'
);
reset role;
select is(
  (select count(*) from private.faa107_progress_operation_receipts where operation_id = 'aaaaaaaa-0000-4000-8000-000000000009'),
  0::bigint,
  'pre_generation_rejected creates no receipt'
);
set local role authenticated;
select set_config('request.jwt.claim.sub', '11111111-1111-4111-8111-111111111111', true);

select set_config('request.jwt.claim.sub', '22222222-2222-4222-8222-222222222222', true);
select is((select count(*) from public.faa107_user_progress), 0::bigint, 'authenticated owner B cannot see owner A row');
select is(
  (select status from public.reset_faa107_progress('bbbbbbbb-0000-4000-8000-000000000001')),
  'reset',
  'reset before first commit creates and resets one persistent row'
);
select is((select reset_epoch from public.faa107_user_progress), 1::bigint, 'reset-before-first-commit advances epoch from zero to one');
select is((select revision from public.faa107_user_progress), 1::bigint, 'reset-before-first-commit advances revision once');

select set_config('request.jwt.claim.sub', '11111111-1111-4111-8111-111111111111', true);
select is(
  (select status from public.commit_faa107_progress(
    3,
    'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
    '{"version":1,"modules":{},"quizAttempts":[],"flashcards":{},"examAttempts":[],"recentActivity":[]}'::jsonb,
    '{"version":1,"modules":{"1":{"visitedSlideIds":["m1-1"],"completed":false}},"quizAttempts":[],"flashcards":{},"examAttempts":[],"recentActivity":[]}'::jsonb,
    'aaaaaaaa-0000-4000-8000-000000000010'
  )),
  'generation_mismatch',
  'old generation is rejected after reset'
);

reset role;
select set_config('request.jwt.claim.sub', '', true);
set local role anon;
select throws_ok($$select * from public.faa107_user_progress$$, '42501', null, 'anon SELECT is denied at the table grant boundary');
select throws_ok(
  $$select * from public.commit_faa107_progress(null, null, '{}'::jsonb, '{}'::jsonb, gen_random_uuid())$$,
  '42501',
  null,
  'anon cannot execute commit RPC'
);
select throws_ok($$select * from public.reset_faa107_progress(gen_random_uuid())$$, '42501', null, 'anon cannot execute reset RPC');

reset role;
set local role authenticated;
select throws_ok(
  $$select * from public.commit_faa107_progress(null, null, '{}'::jsonb, '{}'::jsonb, gen_random_uuid())$$,
  '28000',
  'Authentication required',
  'commit RPC rejects a missing auth.uid()'
);
select throws_ok(
  $$select * from public.reset_faa107_progress(gen_random_uuid())$$,
  '28000',
  'Authentication required',
  'reset RPC rejects a missing auth.uid()'
);

reset role;
insert into private.faa107_progress_operation_receipts (user_id, operation_id, created_at)
values
  ('11111111-1111-4111-8111-111111111111', 'aaaaaaaa-0000-4000-8000-000000000011', now() - interval '31 days'),
  ('11111111-1111-4111-8111-111111111111', 'aaaaaaaa-0000-4000-8000-000000000012', now() - interval '29 days');
select lives_ok(
  $$select private.faa107_prune_operation_receipts('11111111-1111-4111-8111-111111111111')$$,
  'receipt pruning runs in a bounded private helper'
);
select is((select count(*) from private.faa107_progress_operation_receipts where operation_id = 'aaaaaaaa-0000-4000-8000-000000000011'), 0::bigint, 'receipts older than 30 days are pruned');
select is((select count(*) from private.faa107_progress_operation_receipts where operation_id = 'aaaaaaaa-0000-4000-8000-000000000012'), 1::bigint, 'receipts inside the 30-day retry window are retained');
select ok((select count(*) from public.faa107_user_progress) = 2, 'reset never deletes persistent progress rows');

select * from finish();
rollback;
