alter table public.source_files
  add column judgment_year_month text,
  add column file_size_bytes bigint check (file_size_bytes >= 0),
  add column record_count integer check (record_count >= 0),
  add column last_error_at timestamptz;

create function public.pipeline_quality_check()
returns table (check_name text, failure_count bigint)
language sql
stable
set search_path = public, pg_temp
as $$
  select 'duplicate_raw_judgment_jids', count(*) - count(distinct external_jid)
  from public.raw_judgments
  union all
  select 'raw_judgments_missing_date', count(*)
  from public.raw_judgments
  where judgment_date is null
  union all
  select 'raw_judgments_missing_source_file', count(*)
  from public.raw_judgments
  where source_file_id is null
  union all
  select 'unmarked_withdrawal_matches', count(*)
  from public.raw_judgments r
  join public.judgment_deletions d on d.external_jid = r.external_jid
  left join public.judgment_deletion_marks m on m.raw_judgment_id = r.id
  where m.id is null
  union all
  select 'withdrawn_without_audit_mark', count(*)
  from public.raw_judgments r
  left join public.judgment_deletion_marks m on m.raw_judgment_id = r.id
  where r.public_status = 'withdrawn' and m.id is null
  union all
  select 'failed_source_files', count(*)
  from public.source_files
  where processing_status = 'failed';
$$;

revoke all on function public.pipeline_quality_check() from public;
grant execute on function public.pipeline_quality_check() to service_role;
