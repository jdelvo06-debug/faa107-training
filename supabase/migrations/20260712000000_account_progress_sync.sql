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

create function private.faa107_empty_progress()
returns jsonb
language sql
immutable
set search_path = ''
as $$
  select '{"version":1,"modules":{},"quizAttempts":[],"flashcards":{},"examAttempts":[],"recentActivity":[]}'::jsonb
$$;

create function private.faa107_canonical_json(candidate jsonb)
returns text
language plpgsql
stable
strict
set search_path = ''
as $$
declare
  result text;
begin
  case pg_catalog.jsonb_typeof(candidate)
    when 'object' then
      select '{' || coalesce(
        pg_catalog.string_agg(pg_catalog.to_jsonb(item.key)::text || ':' || private.faa107_canonical_json(item.value), ',' order by item.key),
        ''
      ) || '}'
      into result
      from pg_catalog.jsonb_each(candidate) as item;
    when 'array' then
      select '[' || coalesce(
        pg_catalog.string_agg(private.faa107_canonical_json(item.value), ',' order by item.ordinality),
        ''
      ) || ']'
      into result
      from pg_catalog.jsonb_array_elements(candidate) with ordinality as item(value, ordinality);
    else
      result := candidate::text;
  end case;
  return result;
end;
$$;

create function private.faa107_valid_timestamp(candidate text)
returns boolean
language plpgsql
volatile
set search_path = ''
as $$
declare
  parsed timestamptz;
begin
  if candidate is null or candidate !~ '^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$' then
    return false;
  end if;
  parsed := candidate::timestamptz;
  return pg_catalog.to_char(parsed at time zone 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"') = candidate
    and parsed >= '2020-01-01T00:00:00.000Z'::timestamptz
    and parsed <= pg_catalog.clock_timestamp() + interval '5 minutes';
exception when others then
  return false;
end;
$$;

create function private.faa107_module_slide_count(module_id text)
returns integer
language sql
immutable
set search_path = ''
as $$
  select case module_id
    when '1' then 8 when '2' then 12 when '3' then 10 when '4' then 10
    when '5' then 10 when '6' then 10 when '7' then 10 when '8' then 10
    when '9' then 8 when '10' then 8 when '11' then 8 when '12' then 7
    when '13' then 7 else null end
$$;

create function private.faa107_quiz_question_count(module_id text)
returns integer
language sql
immutable
set search_path = ''
as $$
  select case module_id
    when '1' then 6 when '2' then 8 when '3' then 5 when '4' then 5
    when '5' then 5 when '6' then 5 when '7' then 5 when '8' then 5
    when '9' then 5 when '10' then 5 when '11' then 4 else null end
$$;

create function private.faa107_flashcard_ids(module_id text)
returns text[]
language sql
immutable
set search_path = ''
as $$
  select case module_id
    when '1' then array['fc-1-ftn','fc-1-uag','fc-1-pass','fc-1-iacra','fc-1-laanc','fc-1-vlos']
    when '2' then array['fc-2-400','fc-2-speed','fc-2-night','fc-2-waiver','fc-2-remote-id']
    when '3' then array['fc-3-classb','fc-3-classc','fc-3-surface-e','fc-3-classg','fc-3-mtr','fc-3-tfr']
    when '4' then array['fc-4-dashed-magenta','fc-4-dashed-blue','fc-4-shelf-label','fc-4-mef','fc-4-obstacle-label','fc-4-airport-color']
    when '5' then array['fc-5-ctaf','fc-5-unicom','fc-5-traffic-pattern','fc-5-beacon-civilian','fc-5-multicom','fc-5-papi']
    when '6' then array['fc-6-metar','fc-6-taf','fc-6-density-altitude','fc-6-visibility-min','fc-6-thunderstorm-stages','fc-6-fog-types']
    when '7' then array['fc-7-rth','fc-7-battery-storage','fc-7-lost-link','fc-7-emergency-priority','fc-7-flight-modes','fc-7-tailwind-risk']
    when '8' then array['fc-8-decide','fc-8-pave','fc-8-hazardous-5','fc-8-imsafe','fc-8-anti-authority','fc-8-invulnerability']
    when '9' then array['fc-9-alcohol-8hr','fc-9-empty-myopia','fc-9-hypoxia-types','fc-9-autokinesis','fc-9-fatigue-cure']
    when '10' then array['fc-10-condition-safe','fc-10-prop-replace','fc-10-firmware-test','fc-10-postflight','fc-10-wear-items']
    when '11' then array['fc-11-passing-score','fc-11-three-pass','fc-11-topic-weight','fc-11-exam-traps']
    else array[]::text[] end
$$;

create function private.faa107_valid_question_id(candidate text)
returns boolean
language plpgsql
immutable
set search_path = ''
as $$
declare
  prefix text;
  item_number integer;
  maximum integer;
begin
  if candidate ~ '^m([1-9]|10|11)-q[1-9][0-9]*$' then
    prefix := pg_catalog.split_part(candidate, '-', 1);
    item_number := pg_catalog.substr(pg_catalog.split_part(candidate, '-', 2), 2)::integer;
    maximum := private.faa107_quiz_question_count(pg_catalog.substr(prefix, 2));
    return maximum is not null and item_number between 1 and maximum;
  end if;
  if candidate !~ '^exam-(adm|airspace|chart|maint|ops|performance|phys|reg|strat|weather)-[1-9][0-9]*$' then
    return false;
  end if;
  prefix := pg_catalog.split_part(candidate, '-', 2);
  item_number := pg_catalog.split_part(candidate, '-', 3)::integer;
  maximum := case prefix
    when 'adm' then 7 when 'airspace' then 15 when 'chart' then 5
    when 'maint' then 5 when 'ops' then 15 when 'performance' then 15
    when 'phys' then 6 when 'reg' then 15 when 'strat' then 2
    when 'weather' then 15 end;
  return item_number between 1 and maximum;
exception when others then
  return false;
end;
$$;

create function private.faa107_normalize_topic_scores(candidate jsonb)
returns jsonb
language plpgsql
stable
set search_path = ''
as $$
declare
  topic text;
  score jsonb;
  correct_value numeric;
  total_value numeric;
  result jsonb := '{}'::jsonb;
begin
  if pg_catalog.jsonb_typeof(candidate) <> 'object' then return null; end if;
  foreach topic in array array['Regulations','Airspace','Weather','Loading & Performance','Operations'] loop
    if not candidate ? topic then continue; end if;
    score := candidate -> topic;
    if pg_catalog.jsonb_typeof(score) <> 'object'
      or pg_catalog.jsonb_typeof(score -> 'correct') <> 'number'
      or pg_catalog.jsonb_typeof(score -> 'total') <> 'number' then return null; end if;
    correct_value := (score ->> 'correct')::numeric;
    total_value := (score ->> 'total')::numeric;
    if correct_value <> pg_catalog.trunc(correct_value) or total_value <> pg_catalog.trunc(total_value)
      or correct_value < 0 or total_value < 0 or correct_value > total_value
      or total_value > 9007199254740991 then return null; end if;
    result := result || pg_catalog.jsonb_build_object(topic, pg_catalog.jsonb_build_object(
      'correct', correct_value::bigint, 'total', total_value::bigint
    ));
  end loop;
  return result;
exception when others then
  return null;
end;
$$;

create function private.faa107_normalize_quiz_attempt(candidate jsonb)
returns jsonb
language plpgsql
volatile
set search_path = ''
as $$
declare
  module_id text;
  maximum integer;
  score_value numeric;
  total_value numeric;
  topic_scores jsonb;
  result jsonb;
begin
  if pg_catalog.jsonb_typeof(candidate) <> 'object'
    or pg_catalog.jsonb_typeof(candidate -> 'id') <> 'string'
    or (candidate ->> 'id') !~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
    or pg_catalog.jsonb_typeof(candidate -> 'moduleId') <> 'string'
    or not private.faa107_valid_timestamp(candidate ->> 'completedAt')
    or pg_catalog.jsonb_typeof(candidate -> 'score') <> 'number'
    or pg_catalog.jsonb_typeof(candidate -> 'total') <> 'number' then return null; end if;
  module_id := candidate ->> 'moduleId';
  maximum := private.faa107_quiz_question_count(module_id);
  if maximum is null then return null; end if;
  score_value := (candidate ->> 'score')::numeric;
  total_value := (candidate ->> 'total')::numeric;
  if score_value <> pg_catalog.trunc(score_value) or total_value <> pg_catalog.trunc(total_value)
    or total_value < 1 or total_value > maximum or score_value < 0 or score_value > total_value then return null; end if;
  topic_scores := private.faa107_normalize_topic_scores(candidate -> 'topicScores');
  if topic_scores is null then return null; end if;
  result := pg_catalog.jsonb_build_object(
    'id', candidate ->> 'id', 'moduleId', module_id, 'score', score_value::bigint,
    'total', total_value::bigint, 'topicScores', topic_scores, 'completedAt', candidate ->> 'completedAt'
  );
  if candidate ->> 'mode' in ('study','assessment') then
    result := result || pg_catalog.jsonb_build_object('mode', candidate ->> 'mode');
  end if;
  return result;
exception when others then
  return null;
end;
$$;

create function private.faa107_normalize_review_item(candidate jsonb, attempt_total integer)
returns jsonb
language plpgsql
stable
set search_path = ''
as $$
declare
  question_number numeric;
  prompt_value text;
  selected_value text;
  correct_answer_value text;
  explanation_value text;
begin
  if pg_catalog.jsonb_typeof(candidate) <> 'object'
    or pg_catalog.jsonb_typeof(candidate -> 'questionNumber') <> 'number'
    or pg_catalog.jsonb_typeof(candidate -> 'sourceQuestionId') <> 'string'
    or not private.faa107_valid_question_id(candidate ->> 'sourceQuestionId')
    or candidate ->> 'topic' not in ('Regulations','Airspace','Weather','Loading & Performance','Operations')
    or pg_catalog.jsonb_typeof(candidate -> 'correct') <> 'boolean'
    or pg_catalog.jsonb_typeof(candidate -> 'flagged') <> 'boolean' then return null; end if;
  question_number := (candidate ->> 'questionNumber')::numeric;
  if question_number <> pg_catalog.trunc(question_number) or question_number < 1 or question_number > attempt_total then return null; end if;
  prompt_value := pg_catalog.btrim(candidate ->> 'prompt');
  correct_answer_value := pg_catalog.btrim(candidate ->> 'correctAnswer');
  explanation_value := pg_catalog.btrim(candidate ->> 'explanation');
  if prompt_value is null or prompt_value = '' or pg_catalog.octet_length(prompt_value) > 2048
    or correct_answer_value is null or correct_answer_value = '' or pg_catalog.octet_length(correct_answer_value) > 512
    or explanation_value is null or explanation_value = '' or pg_catalog.octet_length(explanation_value) > 4096 then return null; end if;
  if candidate -> 'selectedAnswer' = 'null'::jsonb then
    selected_value := null;
  elsif pg_catalog.jsonb_typeof(candidate -> 'selectedAnswer') = 'string' then
    selected_value := pg_catalog.btrim(candidate ->> 'selectedAnswer');
    if selected_value = '' or pg_catalog.octet_length(selected_value) > 512 then return null; end if;
  else return null;
  end if;
  return pg_catalog.jsonb_build_object(
    'questionNumber', question_number::bigint, 'sourceQuestionId', candidate ->> 'sourceQuestionId',
    'prompt', prompt_value, 'topic', candidate ->> 'topic', 'selectedAnswer', pg_catalog.to_jsonb(selected_value),
    'correctAnswer', correct_answer_value, 'correct', (candidate ->> 'correct')::boolean,
    'explanation', explanation_value, 'flagged', (candidate ->> 'flagged')::boolean
  );
exception when others then
  return null;
end;
$$;

create function private.faa107_normalize_exam_attempt(candidate jsonb)
returns jsonb
language plpgsql
volatile
set search_path = ''
as $$
declare
  score_value numeric;
  total_value numeric;
  flagged_value numeric;
  topic_scores jsonb;
  review_value jsonb := null;
  result jsonb;
begin
  if pg_catalog.jsonb_typeof(candidate) <> 'object'
    or pg_catalog.jsonb_typeof(candidate -> 'id') <> 'string'
    or (candidate ->> 'id') !~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
    or not private.faa107_valid_timestamp(candidate ->> 'completedAt')
    or pg_catalog.jsonb_typeof(candidate -> 'score') <> 'number'
    or pg_catalog.jsonb_typeof(candidate -> 'total') <> 'number'
    or pg_catalog.jsonb_typeof(candidate -> 'passed') <> 'boolean'
    or pg_catalog.jsonb_typeof(candidate -> 'flaggedCount') <> 'number' then return null; end if;
  score_value := (candidate ->> 'score')::numeric;
  total_value := (candidate ->> 'total')::numeric;
  flagged_value := (candidate ->> 'flaggedCount')::numeric;
  if score_value <> pg_catalog.trunc(score_value) or total_value <> pg_catalog.trunc(total_value)
    or flagged_value <> pg_catalog.trunc(flagged_value) or total_value < 1 or total_value > 158
    or score_value < 0 or score_value > total_value or flagged_value < 0 or flagged_value > total_value then return null; end if;
  topic_scores := private.faa107_normalize_topic_scores(candidate -> 'topicScores');
  if topic_scores is null then return null; end if;
  if candidate ? 'review' then
    if pg_catalog.jsonb_typeof(candidate -> 'review') <> 'array'
      or pg_catalog.jsonb_array_length(candidate -> 'review') > total_value then return null; end if;
    select coalesce(pg_catalog.jsonb_agg(normalized order by (normalized ->> 'questionNumber')::integer, normalized ->> 'sourceQuestionId'), '[]'::jsonb)
    into review_value
    from (
      select private.faa107_normalize_review_item(item, total_value::integer) as normalized
      from pg_catalog.jsonb_array_elements(candidate -> 'review') item
    ) items;
    if exists (
      select 1 from pg_catalog.jsonb_array_elements(candidate -> 'review') item
      where private.faa107_normalize_review_item(item, total_value::integer) is null
    ) then return null; end if;
  end if;
  result := pg_catalog.jsonb_build_object(
    'id', candidate ->> 'id', 'score', score_value::bigint, 'total', total_value::bigint,
    'passed', (candidate ->> 'passed')::boolean, 'topicScores', topic_scores,
    'completedAt', candidate ->> 'completedAt', 'flaggedCount', flagged_value::bigint
  );
  if candidate ->> 'variant' in ('faa_timed','practice_drill','legacy_timed') then
    result := result || pg_catalog.jsonb_build_object('variant', candidate ->> 'variant');
  end if;
  if review_value is not null then result := result || pg_catalog.jsonb_build_object('review', review_value); end if;
  return result;
exception when others then
  return null;
end;
$$;

create function private.faa107_normalize_activity(candidate jsonb)
returns jsonb
language plpgsql
volatile
set search_path = ''
as $$
declare
  label_value text;
  href_value text;
begin
  if pg_catalog.jsonb_typeof(candidate) <> 'object'
    or pg_catalog.jsonb_typeof(candidate -> 'id') <> 'string'
    or (candidate ->> 'id') !~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
    or not private.faa107_valid_timestamp(candidate ->> 'at')
    or pg_catalog.jsonb_typeof(candidate -> 'label') <> 'string'
    or pg_catalog.jsonb_typeof(candidate -> 'href') <> 'string' then return null; end if;
  label_value := pg_catalog.btrim(candidate ->> 'label');
  href_value := candidate ->> 'href';
  if label_value = '' or pg_catalog.octet_length(label_value) > 120 or pg_catalog.octet_length(href_value) > 256 then return null; end if;
  if href_value not in ('/','/about','/cram-sheet','/dashboard','/exam','/exam/results','/flashcards','/login','/modules','/resources','/signup','/study-plan')
    and href_value !~ '^/modules/([1-9]|10|11|12|13)(/(quiz|flashcards))?$' then return null; end if;
  return pg_catalog.jsonb_build_object('id', candidate ->> 'id', 'label', label_value, 'href', href_value, 'at', candidate ->> 'at');
exception when others then
  return null;
end;
$$;

create function private.faa107_normalize_record_array(candidate jsonb, record_kind text, maximum integer)
returns jsonb
language plpgsql
volatile
set search_path = ''
as $$
declare
  time_key text := case record_kind when 'activity' then 'at' else 'completedAt' end;
  result jsonb;
begin
  if pg_catalog.jsonb_typeof(candidate) <> 'array' then return '[]'::jsonb; end if;
  select coalesce(pg_catalog.jsonb_agg(item order by item ->> time_key desc, item ->> 'id'), '[]'::jsonb)
  into result
  from (
    select item
    from (
      select distinct on (normalized ->> 'id') normalized as item
      from (
        select case record_kind
          when 'quiz' then private.faa107_normalize_quiz_attempt(value)
          when 'exam' then private.faa107_normalize_exam_attempt(value)
          when 'activity' then private.faa107_normalize_activity(value)
        end as normalized
        from pg_catalog.jsonb_array_elements(candidate) value
      ) normalized_items
      where normalized is not null
      order by normalized ->> 'id', normalized ->> time_key desc, private.faa107_canonical_json(normalized)
    ) deduplicated
    order by item ->> time_key desc, item ->> 'id'
    limit maximum
  ) retained;
  return result;
end;
$$;

create function private.faa107_normalize_progress(candidate jsonb)
returns jsonb
language plpgsql
volatile
set search_path = ''
as $$
declare
  version_value numeric;
  modules_value jsonb := '{}'::jsonb;
  flashcards_value jsonb := '{}'::jsonb;
  module_id text;
  raw_module jsonb;
  raw_deck jsonb;
  slide_count integer;
  visited jsonb;
  last_slide text;
  module_value jsonb;
  card_id text;
  known_value jsonb;
  unknown_value jsonb;
  reviewed_value jsonb;
  timestamp_value text;
  deck_value jsonb;
  result jsonb;
begin
  if candidate is null or pg_catalog.jsonb_typeof(candidate) <> 'object' then
    raise exception using errcode = '22023', message = 'Invalid FAA 107 progress: expected an object';
  end if;
  if pg_catalog.octet_length(candidate::text) > 262144 then
    raise exception using errcode = '22023', message = 'Invalid FAA 107 progress: payload exceeds 256 KiB';
  end if;
  if candidate ? 'version' then
    if pg_catalog.jsonb_typeof(candidate -> 'version') <> 'number' then
      raise exception using errcode = '22023', message = 'Invalid FAA 107 progress version';
    end if;
    version_value := (candidate ->> 'version')::numeric;
    if version_value <> pg_catalog.trunc(version_value) or version_value < 1 then
      raise exception using errcode = '22023', message = 'Invalid FAA 107 progress version';
    end if;
    if version_value > 1 then
      raise exception using errcode = '22023', message = 'Unsupported FAA 107 progress version';
    end if;
  end if;

  for module_number in 1..13 loop
    module_id := module_number::text;
    if pg_catalog.jsonb_typeof(candidate -> 'modules') <> 'object' or not (candidate -> 'modules') ? module_id then continue; end if;
    raw_module := candidate -> 'modules' -> module_id;
    if pg_catalog.jsonb_typeof(raw_module) <> 'object' or pg_catalog.jsonb_typeof(raw_module -> 'visitedSlideIds') <> 'array' then continue; end if;
    slide_count := private.faa107_module_slide_count(module_id);
    select coalesce(pg_catalog.jsonb_agg(pg_catalog.format('m%s-%s', module_id, slide_number) order by slide_number), '[]'::jsonb)
    into visited
    from pg_catalog.generate_series(1, slide_count) slide_number
    where raw_module -> 'visitedSlideIds' @> pg_catalog.jsonb_build_array(pg_catalog.format('m%s-%s', module_id, slide_number));
    if pg_catalog.jsonb_typeof(raw_module -> 'lastSlideId') = 'string'
      and visited @> pg_catalog.jsonb_build_array(raw_module ->> 'lastSlideId') then
      last_slide := raw_module ->> 'lastSlideId';
    else
      last_slide := visited ->> -1;
    end if;
    module_value := pg_catalog.jsonb_build_object(
      'visitedSlideIds', visited,
      'completed', pg_catalog.jsonb_array_length(visited) = slide_count
    );
    if last_slide is not null then module_value := module_value || pg_catalog.jsonb_build_object('lastSlideId', last_slide); end if;
    if private.faa107_valid_timestamp(raw_module ->> 'updatedAt') then
      module_value := module_value || pg_catalog.jsonb_build_object('updatedAt', raw_module ->> 'updatedAt');
    end if;
    modules_value := modules_value || pg_catalog.jsonb_build_object(module_id, module_value);
  end loop;

  for module_number in 1..13 loop
    module_id := module_number::text;
    if pg_catalog.jsonb_typeof(candidate -> 'flashcards') <> 'object' or not (candidate -> 'flashcards') ? module_id then continue; end if;
    raw_deck := candidate -> 'flashcards' -> module_id;
    if pg_catalog.jsonb_typeof(raw_deck) <> 'object'
      or pg_catalog.jsonb_typeof(raw_deck -> 'known') <> 'array'
      or pg_catalog.jsonb_typeof(raw_deck -> 'unknown') <> 'array' then continue; end if;
    known_value := '[]'::jsonb;
    unknown_value := '[]'::jsonb;
    reviewed_value := '{}'::jsonb;
    foreach card_id in array private.faa107_flashcard_ids(module_id) loop
      if raw_deck -> 'known' @> pg_catalog.jsonb_build_array(card_id) then
        known_value := known_value || pg_catalog.jsonb_build_array(card_id);
      elsif raw_deck -> 'unknown' @> pg_catalog.jsonb_build_array(card_id) then
        unknown_value := unknown_value || pg_catalog.jsonb_build_array(card_id);
      else continue;
      end if;
      if pg_catalog.jsonb_typeof(raw_deck -> 'reviewedAt') = 'object' then
        timestamp_value := raw_deck -> 'reviewedAt' ->> card_id;
        if private.faa107_valid_timestamp(timestamp_value) then
          reviewed_value := reviewed_value || pg_catalog.jsonb_build_object(card_id, timestamp_value);
        end if;
      end if;
    end loop;
    deck_value := pg_catalog.jsonb_build_object('known', known_value, 'unknown', unknown_value);
    if reviewed_value <> '{}'::jsonb then deck_value := deck_value || pg_catalog.jsonb_build_object('reviewedAt', reviewed_value); end if;
    flashcards_value := flashcards_value || pg_catalog.jsonb_build_object(module_id, deck_value);
  end loop;

  result := pg_catalog.jsonb_build_object(
    'version', 1,
    'modules', modules_value,
    'quizAttempts', private.faa107_normalize_record_array(candidate -> 'quizAttempts', 'quiz', 30),
    'flashcards', flashcards_value,
    'examAttempts', private.faa107_normalize_record_array(candidate -> 'examAttempts', 'exam', 10),
    'recentActivity', private.faa107_normalize_record_array(candidate -> 'recentActivity', 'activity', 8)
  );
  if pg_catalog.octet_length(private.faa107_canonical_json(result)) > 262144 then
    raise exception using errcode = '22023', message = 'Invalid FAA 107 progress: canonical payload exceeds 256 KiB';
  end if;
  return result;
exception
  when sqlstate '22023' then raise;
  when others then
    raise exception using errcode = '22023', message = 'Invalid FAA 107 progress';
end;
$$;

create function private.faa107_canonical_progress_text(candidate jsonb)
returns text
language sql
volatile
set search_path = ''
as $$
  select private.faa107_canonical_json(private.faa107_normalize_progress(candidate))
$$;

create function private.faa107_merge_record_arrays(local_records jsonb, remote_records jsonb, time_key text, maximum integer)
returns jsonb
language sql
stable
set search_path = ''
as $$
  select coalesce(pg_catalog.jsonb_agg(item order by item ->> time_key desc, item ->> 'id'), '[]'::jsonb)
  from (
    select item
    from (
      select distinct on (value ->> 'id') value as item
      from pg_catalog.jsonb_array_elements(local_records || remote_records) value
      order by value ->> 'id', value ->> time_key desc, private.faa107_canonical_json(value)
    ) deduplicated
    order by item ->> time_key desc, item ->> 'id'
    limit maximum
  ) retained
$$;

create function private.faa107_merge_canonical(local_progress jsonb, remote_progress jsonb)
returns jsonb
language plpgsql
volatile
set search_path = ''
as $$
declare
  local_value jsonb := private.faa107_normalize_progress(local_progress);
  remote_value jsonb := private.faa107_normalize_progress(remote_progress);
  modules_value jsonb := '{}'::jsonb;
  flashcards_value jsonb := '{}'::jsonb;
  module_id text;
  local_module jsonb;
  remote_module jsonb;
  module_value jsonb;
  visited jsonb;
  last_slide text;
  local_time text;
  remote_time text;
  updated_time text;
  card_id text;
  local_deck jsonb;
  remote_deck jsonb;
  local_state text;
  remote_state text;
  chosen_state text;
  local_card_time text;
  remote_card_time text;
  chosen_time text;
  known_value jsonb;
  unknown_value jsonb;
  reviewed_value jsonb;
  deck_value jsonb;
  result jsonb;
begin
  for module_number in 1..13 loop
    module_id := module_number::text;
    local_module := local_value -> 'modules' -> module_id;
    remote_module := remote_value -> 'modules' -> module_id;
    if local_module is null and remote_module is null then continue; end if;
    select coalesce(pg_catalog.jsonb_agg(pg_catalog.format('m%s-%s', module_id, slide_number) order by slide_number), '[]'::jsonb)
    into visited
    from pg_catalog.generate_series(1, private.faa107_module_slide_count(module_id)) slide_number
    where coalesce(local_module -> 'visitedSlideIds', '[]'::jsonb) @> pg_catalog.jsonb_build_array(pg_catalog.format('m%s-%s', module_id, slide_number))
       or coalesce(remote_module -> 'visitedSlideIds', '[]'::jsonb) @> pg_catalog.jsonb_build_array(pg_catalog.format('m%s-%s', module_id, slide_number));
    local_time := local_module ->> 'updatedAt';
    remote_time := remote_module ->> 'updatedAt';
    last_slide := local_module ->> 'lastSlideId';
    if local_module is null or (remote_time is not null and (local_time is null or remote_time > local_time)) then
      last_slide := remote_module ->> 'lastSlideId';
    elsif local_time is not null and remote_time = local_time then
      last_slide := case
        when coalesce(local_module ->> 'lastSlideId', '') <= coalesce(remote_module ->> 'lastSlideId', '')
          then local_module ->> 'lastSlideId' else remote_module ->> 'lastSlideId' end;
    end if;
    if last_slide is null or not visited @> pg_catalog.jsonb_build_array(last_slide) then last_slide := visited ->> -1; end if;
    updated_time := case when local_time is null then remote_time when remote_time is null then local_time else greatest(local_time, remote_time) end;
    module_value := pg_catalog.jsonb_build_object(
      'visitedSlideIds', visited,
      'completed', pg_catalog.jsonb_array_length(visited) = private.faa107_module_slide_count(module_id)
    );
    if last_slide is not null then module_value := module_value || pg_catalog.jsonb_build_object('lastSlideId', last_slide); end if;
    if updated_time is not null then module_value := module_value || pg_catalog.jsonb_build_object('updatedAt', updated_time); end if;
    modules_value := modules_value || pg_catalog.jsonb_build_object(module_id, module_value);
  end loop;

  for module_number in 1..13 loop
    module_id := module_number::text;
    local_deck := local_value -> 'flashcards' -> module_id;
    remote_deck := remote_value -> 'flashcards' -> module_id;
    if local_deck is null and remote_deck is null then continue; end if;
    known_value := '[]'::jsonb;
    unknown_value := '[]'::jsonb;
    reviewed_value := '{}'::jsonb;
    foreach card_id in array private.faa107_flashcard_ids(module_id) loop
      local_state := case
        when coalesce(local_deck -> 'known', '[]'::jsonb) @> pg_catalog.jsonb_build_array(card_id) then 'known'
        when coalesce(local_deck -> 'unknown', '[]'::jsonb) @> pg_catalog.jsonb_build_array(card_id) then 'unknown' end;
      remote_state := case
        when coalesce(remote_deck -> 'known', '[]'::jsonb) @> pg_catalog.jsonb_build_array(card_id) then 'known'
        when coalesce(remote_deck -> 'unknown', '[]'::jsonb) @> pg_catalog.jsonb_build_array(card_id) then 'unknown' end;
      if local_state is null and remote_state is null then continue; end if;
      local_card_time := local_deck -> 'reviewedAt' ->> card_id;
      remote_card_time := remote_deck -> 'reviewedAt' ->> card_id;
      chosen_state := coalesce(local_state, remote_state);
      chosen_time := coalesce(local_card_time, remote_card_time);
      if local_state = remote_state then
        chosen_time := case when local_card_time is null then remote_card_time when remote_card_time is null then local_card_time else greatest(local_card_time, remote_card_time) end;
      elsif local_card_time is not null or remote_card_time is not null then
        if local_card_time is null or (remote_card_time is not null and remote_card_time > local_card_time) then
          chosen_state := remote_state; chosen_time := remote_card_time;
        elsif remote_card_time is null or local_card_time > remote_card_time then
          chosen_state := local_state; chosen_time := local_card_time;
        else
          chosen_state := least(local_state, remote_state); chosen_time := local_card_time;
        end if;
      end if;
      if chosen_state = 'known' then known_value := known_value || pg_catalog.jsonb_build_array(card_id);
      elsif chosen_state = 'unknown' then unknown_value := unknown_value || pg_catalog.jsonb_build_array(card_id); end if;
      if chosen_state is not null and chosen_time is not null then
        reviewed_value := reviewed_value || pg_catalog.jsonb_build_object(card_id, chosen_time);
      end if;
    end loop;
    deck_value := pg_catalog.jsonb_build_object('known', known_value, 'unknown', unknown_value);
    if reviewed_value <> '{}'::jsonb then deck_value := deck_value || pg_catalog.jsonb_build_object('reviewedAt', reviewed_value); end if;
    flashcards_value := flashcards_value || pg_catalog.jsonb_build_object(module_id, deck_value);
  end loop;

  result := pg_catalog.jsonb_build_object(
    'version', 1,
    'modules', modules_value,
    'quizAttempts', private.faa107_merge_record_arrays(local_value -> 'quizAttempts', remote_value -> 'quizAttempts', 'completedAt', 30),
    'flashcards', flashcards_value,
    'examAttempts', private.faa107_merge_record_arrays(local_value -> 'examAttempts', remote_value -> 'examAttempts', 'completedAt', 10),
    'recentActivity', private.faa107_merge_record_arrays(local_value -> 'recentActivity', remote_value -> 'recentActivity', 'at', 8)
  );
  return private.faa107_normalize_progress(result);
end;
$$;

create function private.faa107_progress_delta(base_progress jsonb, proposed_progress jsonb)
returns jsonb
language sql
volatile
set search_path = ''
as $$
  select pg_catalog.jsonb_build_object(
    'base', private.faa107_normalize_progress(base_progress),
    'proposed', private.faa107_normalize_progress(proposed_progress)
  )
$$;

create function private.faa107_merge_progress(current_progress jsonb, progress_delta jsonb)
returns jsonb
language plpgsql
volatile
set search_path = ''
as $$
declare
  current_value jsonb := private.faa107_normalize_progress(current_progress);
  base_value jsonb := private.faa107_normalize_progress(progress_delta -> 'base');
  proposed_value jsonb := private.faa107_normalize_progress(progress_delta -> 'proposed');
  changed_value jsonb := private.faa107_empty_progress();
  changed_modules jsonb := '{}'::jsonb;
  changed_flashcards jsonb := '{}'::jsonb;
  module_id text;
  base_module jsonb;
  proposed_module jsonb;
  changed_module jsonb;
  added_slides jsonb;
  navigation_changed boolean;
  card_id text;
  base_deck jsonb;
  proposed_deck jsonb;
  base_state text;
  proposed_state text;
  base_time text;
  proposed_time text;
  known_value jsonb;
  unknown_value jsonb;
  reviewed_value jsonb;
  changed_deck jsonb;
begin
  for module_number in 1..13 loop
    module_id := module_number::text;
    base_module := base_value -> 'modules' -> module_id;
    proposed_module := proposed_value -> 'modules' -> module_id;
    if proposed_module is null then continue; end if;
    select coalesce(pg_catalog.jsonb_agg(slide.value order by slide.ordinality), '[]'::jsonb)
    into added_slides
    from pg_catalog.jsonb_array_elements(proposed_module -> 'visitedSlideIds') with ordinality slide(value, ordinality)
    where not coalesce(base_module -> 'visitedSlideIds', '[]'::jsonb) @> pg_catalog.jsonb_build_array(slide.value);
    navigation_changed := proposed_module ->> 'lastSlideId' is distinct from base_module ->> 'lastSlideId'
      or proposed_module ->> 'updatedAt' is distinct from base_module ->> 'updatedAt';
    if pg_catalog.jsonb_array_length(added_slides) = 0 and not navigation_changed then continue; end if;
    changed_module := pg_catalog.jsonb_build_object(
      'visitedSlideIds', case when navigation_changed then proposed_module -> 'visitedSlideIds' else added_slides end,
      'completed', false
    );
    if navigation_changed and proposed_module ? 'lastSlideId' then changed_module := changed_module || pg_catalog.jsonb_build_object('lastSlideId', proposed_module ->> 'lastSlideId'); end if;
    if navigation_changed and proposed_module ? 'updatedAt' then changed_module := changed_module || pg_catalog.jsonb_build_object('updatedAt', proposed_module ->> 'updatedAt'); end if;
    changed_modules := changed_modules || pg_catalog.jsonb_build_object(module_id, changed_module);
  end loop;

  for module_number in 1..13 loop
    module_id := module_number::text;
    base_deck := base_value -> 'flashcards' -> module_id;
    proposed_deck := proposed_value -> 'flashcards' -> module_id;
    if proposed_deck is null then continue; end if;
    known_value := '[]'::jsonb; unknown_value := '[]'::jsonb; reviewed_value := '{}'::jsonb;
    foreach card_id in array private.faa107_flashcard_ids(module_id) loop
      base_state := case
        when coalesce(base_deck -> 'known', '[]'::jsonb) @> pg_catalog.jsonb_build_array(card_id) then 'known'
        when coalesce(base_deck -> 'unknown', '[]'::jsonb) @> pg_catalog.jsonb_build_array(card_id) then 'unknown' end;
      proposed_state := case
        when proposed_deck -> 'known' @> pg_catalog.jsonb_build_array(card_id) then 'known'
        when proposed_deck -> 'unknown' @> pg_catalog.jsonb_build_array(card_id) then 'unknown' end;
      base_time := base_deck -> 'reviewedAt' ->> card_id;
      proposed_time := proposed_deck -> 'reviewedAt' ->> card_id;
      if base_state is not distinct from proposed_state and base_time is not distinct from proposed_time then continue; end if;
      if proposed_state = 'known' then known_value := known_value || pg_catalog.jsonb_build_array(card_id);
      elsif proposed_state = 'unknown' then unknown_value := unknown_value || pg_catalog.jsonb_build_array(card_id); end if;
      if proposed_state is not null and proposed_time is not null then reviewed_value := reviewed_value || pg_catalog.jsonb_build_object(card_id, proposed_time); end if;
    end loop;
    if pg_catalog.jsonb_array_length(known_value) > 0 or pg_catalog.jsonb_array_length(unknown_value) > 0 then
      changed_deck := pg_catalog.jsonb_build_object('known', known_value, 'unknown', unknown_value);
      if reviewed_value <> '{}'::jsonb then changed_deck := changed_deck || pg_catalog.jsonb_build_object('reviewedAt', reviewed_value); end if;
      changed_flashcards := changed_flashcards || pg_catalog.jsonb_build_object(module_id, changed_deck);
    end if;
  end loop;

  changed_value := pg_catalog.jsonb_set(changed_value, '{modules}', changed_modules);
  changed_value := pg_catalog.jsonb_set(changed_value, '{flashcards}', changed_flashcards);
  select coalesce(pg_catalog.jsonb_agg(proposed_item), '[]'::jsonb) into added_slides
  from pg_catalog.jsonb_array_elements(proposed_value -> 'quizAttempts') proposed_item
  where not exists (
    select 1 from pg_catalog.jsonb_array_elements(base_value -> 'quizAttempts') base_item
    where base_item ->> 'id' = proposed_item ->> 'id'
      and private.faa107_canonical_json(base_item) = private.faa107_canonical_json(proposed_item)
  );
  changed_value := pg_catalog.jsonb_set(changed_value, '{quizAttempts}', added_slides);
  select coalesce(pg_catalog.jsonb_agg(proposed_item), '[]'::jsonb) into added_slides
  from pg_catalog.jsonb_array_elements(proposed_value -> 'examAttempts') proposed_item
  where not exists (
    select 1 from pg_catalog.jsonb_array_elements(base_value -> 'examAttempts') base_item
    where base_item ->> 'id' = proposed_item ->> 'id'
      and private.faa107_canonical_json(base_item) = private.faa107_canonical_json(proposed_item)
  );
  changed_value := pg_catalog.jsonb_set(changed_value, '{examAttempts}', added_slides);
  select coalesce(pg_catalog.jsonb_agg(proposed_item), '[]'::jsonb) into added_slides
  from pg_catalog.jsonb_array_elements(proposed_value -> 'recentActivity') proposed_item
  where not exists (
    select 1 from pg_catalog.jsonb_array_elements(base_value -> 'recentActivity') base_item
    where base_item ->> 'id' = proposed_item ->> 'id'
      and private.faa107_canonical_json(base_item) = private.faa107_canonical_json(proposed_item)
  );
  changed_value := pg_catalog.jsonb_set(changed_value, '{recentActivity}', added_slides);
  return private.faa107_merge_canonical(changed_value, current_value);
end;
$$;

create function private.faa107_prune_operation_receipts(owner_id uuid)
returns void
language sql
volatile
set search_path = ''
as $$
  delete from private.faa107_progress_operation_receipts receipt
  where receipt.ctid in (
    select old_receipt.ctid
    from private.faa107_progress_operation_receipts old_receipt
    where old_receipt.user_id = owner_id
      and old_receipt.created_at < pg_catalog.now() - interval '30 days'
    order by old_receipt.created_at
    limit 100
  )
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
  locked_row public.faa107_user_progress%rowtype;
  normalized_base jsonb;
  normalized_proposed jsonb;
  merged_progress jsonb;
  row_was_absent boolean := false;
begin
  if owner_id is null then
    raise exception using
      errcode = '28000',
      message = 'Authentication required';
  end if;
  if operation_id is null or ((expected_revision is null) <> (expected_generation is null)) then
    raise exception using errcode = '22023', message = 'Invalid FAA 107 progress commit arguments';
  end if;
  normalized_base := private.faa107_normalize_progress(base_progress);
  normalized_proposed := private.faa107_normalize_progress(proposed_progress);

  perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended(owner_id::text, 0));
  select * into locked_row
  from public.faa107_user_progress owner_progress
  where owner_progress.user_id = owner_id
  for update;

  if not found then
    if expected_revision is not null or expected_generation is not null
      or normalized_base <> private.faa107_empty_progress() then
      raise exception using errcode = '22023', message = 'First FAA 107 progress commit requires null expectations and an empty base';
    end if;
    insert into public.faa107_user_progress (user_id, progress, revision, reset_generation, reset_epoch, updated_at)
    values (owner_id, private.faa107_empty_progress(), 0, extensions.gen_random_uuid(), 0, pg_catalog.now())
    returning * into locked_row;
    expected_revision := locked_row.revision;
    expected_generation := locked_row.reset_generation;
    row_was_absent := true;
  end if;

  if exists (
    select 1 from private.faa107_progress_operation_receipts receipt
    where receipt.user_id = owner_id and receipt.operation_id = commit_faa107_progress.operation_id
  ) then
    status := 'duplicate';
  elsif not row_was_absent and expected_generation is null then
    status := case when locked_row.reset_epoch = 0 then 'first_row_race' else 'pre_generation_rejected' end;
  elsif expected_generation <> locked_row.reset_generation then
    status := 'generation_mismatch';
  elsif expected_revision = locked_row.revision then
    if normalized_proposed = locked_row.progress then
      status := 'current';
    else
      update public.faa107_user_progress owner_progress
      set progress = normalized_proposed,
          revision = owner_progress.revision + 1,
          updated_at = pg_catalog.now()
      where owner_progress.user_id = owner_id
      returning * into locked_row;
      status := 'committed';
    end if;
    insert into private.faa107_progress_operation_receipts (user_id, operation_id)
    values (owner_id, commit_faa107_progress.operation_id);
    perform private.faa107_prune_operation_receipts(owner_id);
  else
    merged_progress := private.faa107_merge_progress(
      locked_row.progress,
      private.faa107_progress_delta(normalized_base, normalized_proposed)
    );
    update public.faa107_user_progress owner_progress
    set progress = merged_progress,
        revision = owner_progress.revision + 1,
        updated_at = pg_catalog.now()
    where owner_progress.user_id = owner_id
    returning * into locked_row;
    insert into private.faa107_progress_operation_receipts (user_id, operation_id)
    values (owner_id, commit_faa107_progress.operation_id);
    perform private.faa107_prune_operation_receipts(owner_id);
    status := 'revision_conflict';
  end if;

  progress := locked_row.progress;
  revision := locked_row.revision;
  reset_generation := locked_row.reset_generation;
  reset_epoch := locked_row.reset_epoch;
  return next;
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
  locked_row public.faa107_user_progress%rowtype;
begin
  if owner_id is null then
    raise exception using
      errcode = '28000',
      message = 'Authentication required';
  end if;
  if operation_id is null then
    raise exception using errcode = '22023', message = 'Invalid FAA 107 progress reset operation id';
  end if;

  perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended(owner_id::text, 0));
  select * into locked_row
  from public.faa107_user_progress owner_progress
  where owner_progress.user_id = owner_id
  for update;

  if not found then
    insert into public.faa107_user_progress (user_id, progress, revision, reset_generation, reset_epoch, updated_at)
    values (owner_id, private.faa107_empty_progress(), 0, extensions.gen_random_uuid(), 0, pg_catalog.now())
    returning * into locked_row;
  end if;

  if exists (
    select 1 from private.faa107_progress_operation_receipts receipt
    where receipt.user_id = owner_id and receipt.operation_id = reset_faa107_progress.operation_id
  ) then
    status := 'duplicate';
  else
    update public.faa107_user_progress owner_progress
    set progress = private.faa107_empty_progress(),
        revision = owner_progress.revision + 1,
        reset_generation = extensions.gen_random_uuid(),
        reset_epoch = owner_progress.reset_epoch + 1,
        updated_at = pg_catalog.now()
    where owner_progress.user_id = owner_id
    returning * into locked_row;
    insert into private.faa107_progress_operation_receipts (user_id, operation_id)
    values (owner_id, reset_faa107_progress.operation_id);
    perform private.faa107_prune_operation_receipts(owner_id);
    status := 'reset';
  end if;

  progress := locked_row.progress;
  revision := locked_row.revision;
  reset_generation := locked_row.reset_generation;
  reset_epoch := locked_row.reset_epoch;
  return next;
end;
$$;

revoke all on function private.faa107_normalize_progress(jsonb) from public, anon, authenticated;
revoke all on function private.faa107_progress_delta(jsonb, jsonb) from public, anon, authenticated;
revoke all on function private.faa107_merge_progress(jsonb, jsonb) from public, anon, authenticated;
revoke all on function private.faa107_prune_operation_receipts(uuid) from public, anon, authenticated;
revoke all on all functions in schema private from public, anon, authenticated;

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
