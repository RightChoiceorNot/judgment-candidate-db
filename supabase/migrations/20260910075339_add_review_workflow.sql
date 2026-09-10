alter table public.review_events
  add column prior_status text
    check (prior_status is null or prior_status in ('pending_review', 'confirmed_match', 'rejected_match', 'withdrawn', 'needs_more_evidence')),
  add column event_type text not null default 'manual_decision'
    check (event_type in ('manual_decision', 'system_note'));

create or replace function public.is_valid_review_transition(
  p_prior_status text,
  p_next_status text
)
returns boolean
language sql
immutable
set search_path = public, pg_temp
as $$
  select case p_prior_status
    when 'pending_review' then p_next_status in ('confirmed_match', 'rejected_match', 'withdrawn', 'needs_more_evidence')
    when 'needs_more_evidence' then p_next_status in ('pending_review', 'confirmed_match', 'rejected_match', 'withdrawn')
    when 'confirmed_match' then p_next_status in ('needs_more_evidence', 'withdrawn')
    when 'rejected_match' then p_next_status in ('pending_review', 'needs_more_evidence', 'withdrawn')
    when 'withdrawn' then false
    else false
  end;
$$;

create or replace function public.record_review_decision(
  p_review_case_id bigint,
  p_next_status text,
  p_reviewer text,
  p_reason text,
  p_evidence_source text default null
)
returns table (review_case_id bigint, prior_status text, current_status text, review_event_id bigint)
language plpgsql
set search_path = public, pg_temp
as $$
declare
  v_prior_status text;
  v_event_id bigint;
begin
  if nullif(btrim(p_reviewer), '') is null then
    raise exception 'reviewer is required';
  end if;

  if nullif(btrim(p_reason), '') is null then
    raise exception 'reason is required';
  end if;

  if p_next_status not in ('pending_review', 'confirmed_match', 'rejected_match', 'withdrawn', 'needs_more_evidence') then
    raise exception 'invalid review status: %', p_next_status;
  end if;

  select status into v_prior_status
  from public.review_cases
  where id = p_review_case_id
  for update;

  if v_prior_status is null then
    raise exception 'review case % does not exist', p_review_case_id;
  end if;

  if not public.is_valid_review_transition(v_prior_status, p_next_status) then
    raise exception 'invalid review status transition from % to %', v_prior_status, p_next_status;
  end if;

  update public.review_cases
  set status = p_next_status,
      updated_at = now()
  where id = p_review_case_id;

  insert into public.review_events (
    review_case_id,
    prior_status,
    event_status,
    event_type,
    reviewer,
    reason,
    evidence_source
  )
  values (
    p_review_case_id,
    v_prior_status,
    p_next_status,
    'manual_decision',
    btrim(p_reviewer),
    btrim(p_reason),
    nullif(btrim(p_evidence_source), '')
  )
  returning id into v_event_id;

  return query select p_review_case_id, v_prior_status, p_next_status, v_event_id;
end;
$$;

create or replace function public.review_case_status_summary()
returns table (status text, case_count bigint)
language sql
stable
set search_path = public, pg_temp
as $$
  select review_cases.status, count(*)
  from public.review_cases
  group by review_cases.status
  order by review_cases.status;
$$;

revoke all on function public.record_review_decision(bigint, text, text, text, text) from public, anon, authenticated;
revoke all on function public.is_valid_review_transition(text, text) from public, anon, authenticated;
revoke all on function public.review_case_status_summary() from public, anon, authenticated;

grant execute on function public.record_review_decision(bigint, text, text, text, text) to service_role;
grant execute on function public.review_case_status_summary() to service_role;
