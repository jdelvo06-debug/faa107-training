-- Run after both migrations against isolated retired-table fixtures.
begin;
select no_plan();
create temporary table retired_tables(name text);
insert into retired_tables values ('articles'),('tags'),('article_tags'),('article_relations'),('explainers'),('explainer_tags'),('contracts'),('newsletter_subscribers'),('rss_feeds'),('contact_submissions'),('systems'),('system_tags'),('foundation_rollback_guard_checksums'),('event_clusters'),('content_sources'),('system_citations'),('explainer_citations'),('media_assets'),('search_documents'),('newsletter_issues'),('newsletter_deliveries'),('request_rate_limits');
select ok(c.relrowsecurity, t.name || ': RLS enabled')
from retired_tables t join pg_class c on c.oid=to_regclass('public.'||t.name);
select ok(not has_table_privilege(r.role, 'public.'||t.name, 'SELECT,INSERT,UPDATE,DELETE,TRUNCATE,REFERENCES,TRIGGER'), t.name||': no '||r.role||' table privileges')
from retired_tables t cross join (values ('anon'),('authenticated')) r(role);
select ok(not has_any_column_privilege(r.role, 'public.'||t.name, 'SELECT,INSERT,UPDATE,REFERENCES'), t.name||': no '||r.role||' column privileges')
from retired_tables t cross join (values ('anon'),('authenticated')) r(role);
select ok(not has_sequence_privilege(r.role,s.oid,'USAGE,SELECT,UPDATE'), s.relname||': no '||r.role||' sequence privileges')
from retired_tables t join pg_depend d on d.refobjid=to_regclass('public.'||t.name)
join pg_class s on s.oid=d.objid and s.relkind='S'
cross join (values ('anon'),('authenticated')) r(role)
where d.classid='pg_class'::regclass and d.deptype in ('a','i');
select is((select count(*) from pg_policies p join retired_tables t on p.tablename=t.name
where p.schemaname='public' and p.roles && array['public','anon','authenticated']::name[]), 0::bigint, 'no retired client policies remain');
grant select on retired_tables to anon,authenticated;

set local role anon;
select throws_ok(format('select * from public.%I',name),'42501',null,name||': anon cannot read') from retired_tables;
select is((select marker from public.faa107_healthcheck where id=1),'faa107-ok','anon reads marker');
select throws_ok('update public.faa107_healthcheck set marker=''faa107-ok''','42501',null,'anon cannot modify marker');
select throws_ok('delete from public.faa107_healthcheck','42501',null,'anon cannot delete marker');
select throws_ok('insert into public.faa107_healthcheck values (1,''faa107-ok'')','42501',null,'anon cannot insert marker');
reset role;

set local role authenticated;
select throws_ok(format('select * from public.%I',name),'42501',null,name||': authenticated cannot read') from retired_tables;
select is((select marker from public.faa107_healthcheck where id=1),'faa107-ok','authenticated reads marker');
select throws_ok('update public.faa107_healthcheck set marker=''faa107-ok''','42501',null,'authenticated cannot modify marker');
select throws_ok('delete from public.faa107_healthcheck','42501',null,'authenticated cannot delete marker');
select throws_ok('insert into public.faa107_healthcheck values (1,''faa107-ok'')','42501',null,'authenticated cannot insert marker');
reset role;
select * from finish();
rollback;
