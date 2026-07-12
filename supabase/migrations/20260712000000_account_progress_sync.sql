create schema if not exists private;

create table public.faa107_user_progress (
  user_id uuid primary key references auth.users(id) on delete cascade,
  progress jsonb not null,
  revision bigint not null default 0 check (revision >= 0),
  reset_generation uuid not null,
  reset_epoch bigint not null default 0 check (reset_epoch >= 0),
  updated_at timestamptz not null default now()
);

create table private.faa107_progress_operation_receipts (
  user_id uuid not null references auth.users(id) on delete cascade,
  operation_id uuid not null,
  created_at timestamptz not null default now(),
  primary key (user_id, operation_id)
);

alter table public.faa107_user_progress enable row level security;
alter table private.faa107_progress_operation_receipts enable row level security;

revoke all on table public.faa107_user_progress from public, anon, authenticated;
grant select on table public.faa107_user_progress to authenticated;

revoke all on table private.faa107_progress_operation_receipts from public, anon, authenticated;

create policy "FAA 107 owners can read their progress"
on public.faa107_user_progress
for select
to authenticated
using ((select auth.uid()) = user_id);

create function private.faa107_normalize_progress(candidate jsonb)
returns jsonb
language plpgsql
set search_path = ''
as $$
begin
  perform candidate;

  raise exception using
    errcode = '55000',
    message = 'FAA 107 progress RPC is not enabled';
end;
$$;

create function private.faa107_progress_delta(base_progress jsonb, proposed_progress jsonb)
returns jsonb
language plpgsql
set search_path = ''
as $$
begin
  perform base_progress, proposed_progress;

  raise exception using
    errcode = '55000',
    message = 'FAA 107 progress RPC is not enabled';
end;
$$;

create function private.faa107_merge_progress(current_progress jsonb, progress_delta jsonb)
returns jsonb
language plpgsql
set search_path = ''
as $$
begin
  perform current_progress, progress_delta;

  raise exception using
    errcode = '55000',
    message = 'FAA 107 progress RPC is not enabled';
end;
$$;

create function private.faa107_prune_operation_receipts(owner_id uuid)
returns void
language plpgsql
set search_path = ''
as $$
begin
  perform owner_id;

  raise exception using
    errcode = '55000',
    message = 'FAA 107 progress RPC is not enabled';
end;
$$;

create function public.commit_faa107_progress(
  expected_revision bigint,
  expected_generation uuid,
  base_progress jsonb,
  proposed_progress jsonb,
  operation_id uuid
)
returns table (
  status text,
  progress jsonb,
  revision bigint,
  reset_generation uuid,
  reset_epoch bigint
)
language plpgsql
security definer
set search_path = ''
as $$
declare
  owner_id uuid := (select auth.uid());
begin
  perform expected_revision, expected_generation, base_progress, proposed_progress, operation_id;
  status := null;
  progress := null;
  revision := null;
  reset_generation := null;
  reset_epoch := null;

  if owner_id is null then
    raise exception using
      errcode = '28000',
      message = 'Authentication required';
  end if;

  raise exception using
    errcode = '55000',
    message = 'FAA 107 progress RPC is not enabled';
end;
$$;

create function public.reset_faa107_progress(operation_id uuid)
returns table (
  status text,
  progress jsonb,
  revision bigint,
  reset_generation uuid,
  reset_epoch bigint
)
language plpgsql
security definer
set search_path = ''
as $$
declare
  owner_id uuid := (select auth.uid());
begin
  perform operation_id;
  status := null;
  progress := null;
  revision := null;
  reset_generation := null;
  reset_epoch := null;

  if owner_id is null then
    raise exception using
      errcode = '28000',
      message = 'Authentication required';
  end if;

  raise exception using
    errcode = '55000',
    message = 'FAA 107 progress RPC is not enabled';
end;
$$;

revoke all on function private.faa107_normalize_progress(jsonb) from public, anon, authenticated;
revoke all on function private.faa107_progress_delta(jsonb, jsonb) from public, anon, authenticated;
revoke all on function private.faa107_merge_progress(jsonb, jsonb) from public, anon, authenticated;
revoke all on function private.faa107_prune_operation_receipts(uuid) from public, anon, authenticated;

revoke all on function public.commit_faa107_progress(bigint, uuid, jsonb, jsonb, uuid) from public, anon, authenticated;
grant execute on function public.commit_faa107_progress(bigint, uuid, jsonb, jsonb, uuid) to authenticated;

revoke all on function public.reset_faa107_progress(uuid) from public, anon, authenticated;
grant execute on function public.reset_faa107_progress(uuid) to authenticated;

do $$
begin
  if exists (
    select 1
    from pg_catalog.pg_publication
    where pubname = 'supabase_realtime'
  ) and not exists (
    select 1
    from pg_catalog.pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'faa107_user_progress'
  ) then
    alter publication supabase_realtime add table public.faa107_user_progress;
  end if;
end;
$$;
