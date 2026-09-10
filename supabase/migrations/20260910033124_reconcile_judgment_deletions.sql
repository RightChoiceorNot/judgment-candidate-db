alter table public.raw_judgments
  alter column public_status set default 'pending_review';

alter table public.raw_judgments
  add constraint raw_judgments_public_status_check
  check (public_status in ('pending_review', 'withdrawn'));

create table public.judgment_deletion_marks (
  id bigint generated always as identity primary key,
  raw_judgment_id bigint not null unique references public.raw_judgments(id) on delete restrict,
  deletion_id bigint not null unique references public.judgment_deletions(id) on delete restrict,
  match_method text not null default 'external_jid_exact'
    check (match_method = 'external_jid_exact'),
  prior_public_status text not null,
  marked_at timestamptz not null default now(),
  reconcile_run_id bigint not null references public.ingest_runs(id) on delete restrict
);

create index judgment_deletion_marks_reconcile_run_id_idx
  on public.judgment_deletion_marks (reconcile_run_id);

alter table public.judgment_deletion_marks enable row level security;

revoke all on public.judgment_deletion_marks from anon, authenticated;

grant select, insert, update, delete
on public.judgment_deletion_marks
to service_role;

grant usage, select
on sequence public.judgment_deletion_marks_id_seq
to service_role;

create function public.preserve_withdrawn_judgment_status()
returns trigger
language plpgsql
set search_path = public, pg_temp
as $$
begin
  if old.public_status = 'withdrawn' and new.public_status <> 'withdrawn' then
    new.public_status := 'withdrawn';
  end if;

  return new;
end;
$$;

create trigger raw_judgments_preserve_withdrawn_status
before update on public.raw_judgments
for each row
execute function public.preserve_withdrawn_judgment_status();

revoke all on function public.preserve_withdrawn_judgment_status() from public;

create function public.reconcile_judgment_deletions()
returns table (
  reconcile_run_id bigint,
  exact_jid_matches integer,
  newly_marked integer,
  restored_withdrawn_status integer
)
language plpgsql
set search_path = public, pg_temp
as $$
declare
  v_run_id bigint;
  v_exact_jid_matches integer;
  v_newly_marked integer;
  v_restored_withdrawn_status integer;
begin
  insert into public.ingest_runs (job_name, status, details)
  values (
    'reconcile_judgment_deletions',
    'running',
    jsonb_build_object('match_method', 'external_jid_exact')
  )
  returning id into v_run_id;

  select count(*)::integer
  into v_exact_jid_matches
  from public.raw_judgments r
  join public.judgment_deletions d on d.external_jid = r.external_jid;

  insert into public.judgment_deletion_marks (
    raw_judgment_id,
    deletion_id,
    prior_public_status,
    reconcile_run_id
  )
  select r.id, d.id, r.public_status, v_run_id
  from public.raw_judgments r
  join public.judgment_deletions d on d.external_jid = r.external_jid
  on conflict (raw_judgment_id) do nothing;

  get diagnostics v_newly_marked = row_count;

  update public.raw_judgments r
  set public_status = 'withdrawn'
  from public.judgment_deletion_marks m
  where m.raw_judgment_id = r.id
    and r.public_status <> 'withdrawn';

  get diagnostics v_restored_withdrawn_status = row_count;

  update public.ingest_runs
  set status = 'completed',
      finished_at = now(),
      details = jsonb_build_object(
        'match_method', 'external_jid_exact',
        'exact_jid_matches', v_exact_jid_matches,
        'newly_marked', v_newly_marked,
        'restored_withdrawn_status', v_restored_withdrawn_status
      )
  where id = v_run_id;

  return query
  select v_run_id, v_exact_jid_matches, v_newly_marked, v_restored_withdrawn_status;
end;
$$;

revoke all on function public.reconcile_judgment_deletions() from public;
grant execute on function public.reconcile_judgment_deletions() to service_role;
