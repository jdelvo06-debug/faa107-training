-- Shared project qbeioesktbpvdlgzrgsm: retain retired DroneWire records, close client access.
begin;
set local lock_timeout = '5s';
set local statement_timeout = '30s';

do $lockdown$
declare
  target text;
  columns_sql text;
  policy_record record;
  sequence_record record;
begin
  foreach target in array array['articles', 'tags', 'article_tags', 'article_relations', 'explainers', 'explainer_tags', 'contracts', 'newsletter_subscribers', 'rss_feeds', 'contact_submissions', 'systems', 'system_tags', 'foundation_rollback_guard_checksums', 'event_clusters', 'content_sources', 'system_citations', 'explainer_citations', 'media_assets', 'search_documents', 'newsletter_issues', 'newsletter_deliveries', 'request_rate_limits']
  loop
    if to_regclass(format('public.%I', target)) is null then
      raise exception 'Expected retired table is missing: %', target;
    end if;
    execute format('alter table public.%I enable row level security', target);
    -- Retain policies scoped exclusively to administrator/service roles.
    for policy_record in select policyname from pg_policies
      where schemaname = 'public' and tablename = target
        and roles && array['public','anon','authenticated']::name[]
    loop
      execute format('drop policy %I on public.%I', policy_record.policyname, target);
    end loop;
    execute format('revoke all privileges on table public.%I from public, anon, authenticated', target);
    select string_agg(format('%I', attname), ', ') into columns_sql
      from pg_attribute where attrelid = to_regclass(format('public.%I', target))
      and attnum > 0 and not attisdropped;
    execute format('revoke all privileges (%s) on table public.%I from public, anon, authenticated', columns_sql, target);
    -- Table revocation does not revoke privileges on owned sequences.
    for sequence_record in
      select sn.nspname, s.relname from pg_class s
      join pg_namespace sn on sn.oid = s.relnamespace
      join pg_depend d on d.objid = s.oid and d.classid = 'pg_class'::regclass
      where s.relkind = 'S' and d.refobjid = to_regclass(format('public.%I', target))
        and d.deptype in ('a','i')
    loop
      execute format('revoke all privileges on sequence %I.%I from public, anon, authenticated', sequence_record.nspname, sequence_record.relname);
    end loop;
  end loop;
end
$lockdown$;

create table public.faa107_healthcheck (
  id smallint primary key check (id = 1),
  marker text not null check (marker = 'faa107-ok')
);
insert into public.faa107_healthcheck (id, marker) values (1, 'faa107-ok');
alter table public.faa107_healthcheck enable row level security;
revoke all privileges on table public.faa107_healthcheck from public, anon, authenticated;
grant select on table public.faa107_healthcheck to anon, authenticated;
create policy "Read non-sensitive FAA health marker"
on public.faa107_healthcheck for select to anon, authenticated using (id = 1);
comment on table public.faa107_healthcheck is 'Non-sensitive, read-only Data API health marker. No learner data.';
commit;
