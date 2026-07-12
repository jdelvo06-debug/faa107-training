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
  exists (
    select 1 from pg_catalog.pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'faa107_user_progress'
  ),
  'progress table is a member of the Realtime publication'
);

-- Runtime security behavior. Fixture setup is deliberately wrapped so the RED
-- run reports a missing schema boundary instead of aborting the entire file.
select lives_ok($setup$
  insert into auth.users (id, email)
  values
    ('11111111-1111-4111-8111-111111111111', 'owner-a@example.test'),
    ('22222222-2222-4222-8222-222222222222', 'owner-b@example.test');

  insert into public.faa107_user_progress (user_id, progress, reset_generation)
  values
    ('11111111-1111-4111-8111-111111111111', '{"version":1}'::jsonb, 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa'),
    ('22222222-2222-4222-8222-222222222222', '{"version":1}'::jsonb, 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb');
$setup$, 'security fixtures can be created as the migration owner');

set local role authenticated;
select set_config('request.jwt.claim.sub', '11111111-1111-4111-8111-111111111111', true);

select is((select count(*) from public.faa107_user_progress), 1::bigint, 'authenticated SELECT sees only the owner row');
select is((select user_id from public.faa107_user_progress), '11111111-1111-4111-8111-111111111111'::uuid, 'authenticated SELECT cannot see another owner');
select throws_ok($$insert into public.faa107_user_progress (user_id, progress, reset_generation) values ('11111111-1111-4111-8111-111111111111', '{}'::jsonb, gen_random_uuid())$$, '42501', null, 'authenticated direct INSERT is denied');
select throws_ok($$update public.faa107_user_progress set progress = '{}'::jsonb$$, '42501', null, 'authenticated direct UPDATE is denied');
select throws_ok($$delete from public.faa107_user_progress$$, '42501', null, 'authenticated direct DELETE is denied');

select throws_ok(
  $$select * from public.commit_faa107_progress(0, 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', '{"version":1}'::jsonb, '{"version":1}'::jsonb, 'aaaaaaaa-0000-4000-8000-000000000001')$$,
  '55000',
  'FAA 107 progress RPC is not enabled',
  'authenticated commit RPC fails closed in Phase 1'
);
select throws_ok(
  $$select * from public.reset_faa107_progress('aaaaaaaa-0000-4000-8000-000000000002')$$,
  '55000',
  'FAA 107 progress RPC is not enabled',
  'authenticated reset RPC fails closed in Phase 1'
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
select is((select count(*) from public.faa107_user_progress), 2::bigint, 'fail-closed RPC calls do not add or delete progress rows');
select is((select count(*) from private.faa107_progress_operation_receipts), 0::bigint, 'fail-closed RPC calls create no operation receipts');
select is((select sum(revision) from public.faa107_user_progress), 0::numeric, 'fail-closed RPC calls do not advance revisions');

select * from finish();
rollback;
