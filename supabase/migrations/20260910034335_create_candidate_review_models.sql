create table public.election_cycles (
  id bigint generated always as identity primary key,
  cycle_name text not null unique,
  election_date date,
  election_type text not null,
  official_source_url text,
  source_fetched_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.candidates (
  id bigint generated always as identity primary key,
  full_name text not null,
  normalized_name text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index candidates_normalized_name_idx
  on public.candidates (normalized_name);

create table public.candidate_aliases (
  id bigint generated always as identity primary key,
  candidate_id bigint not null references public.candidates(id) on delete restrict,
  alias_name text not null,
  normalized_alias text not null,
  source_url text,
  source_fetched_at timestamptz,
  created_at timestamptz not null default now(),
  unique (candidate_id, normalized_alias)
);

create index candidate_aliases_normalized_alias_idx
  on public.candidate_aliases (normalized_alias);

create table public.candidacies (
  id bigint generated always as identity primary key,
  candidate_id bigint not null references public.candidates(id) on delete restrict,
  election_cycle_id bigint not null references public.election_cycles(id) on delete restrict,
  election_type text not null,
  district text,
  party_name text,
  candidate_status text not null default 'pending_verification'
    check (candidate_status in ('pending_verification', 'active', 'withdrawn', 'elected', 'not_elected')),
  official_source_url text,
  source_fetched_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (candidate_id, election_cycle_id, election_type, district)
);

create index candidacies_election_cycle_id_idx
  on public.candidacies (election_cycle_id);

create table public.candidate_sources (
  id bigint generated always as identity primary key,
  candidate_id bigint not null references public.candidates(id) on delete restrict,
  candidacy_id bigint references public.candidacies(id) on delete restrict,
  source_kind text not null,
  source_url text not null,
  fetched_at timestamptz,
  recorded_at timestamptz not null default now(),
  source_note text
);

create index candidate_sources_candidate_id_idx
  on public.candidate_sources (candidate_id);

create table public.review_cases (
  id bigint generated always as identity primary key,
  candidate_id bigint not null references public.candidates(id) on delete restrict,
  raw_judgment_id bigint not null references public.raw_judgments(id) on delete restrict,
  source_file_id bigint references public.source_files(id) on delete restrict,
  status text not null default 'pending_review'
    check (status in ('pending_review', 'confirmed_match', 'rejected_match', 'withdrawn', 'needs_more_evidence')),
  match_reason jsonb not null default '{}'::jsonb,
  local_source_path text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (candidate_id, raw_judgment_id)
);

create index review_cases_status_idx
  on public.review_cases (status);

create table public.review_events (
  id bigint generated always as identity primary key,
  review_case_id bigint not null references public.review_cases(id) on delete restrict,
  event_status text not null
    check (event_status in ('pending_review', 'confirmed_match', 'rejected_match', 'withdrawn', 'needs_more_evidence')),
  reviewer text not null,
  reason text not null,
  evidence_source text,
  created_at timestamptz not null default now()
);

create index review_events_review_case_id_created_at_idx
  on public.review_events (review_case_id, created_at);

alter table public.election_cycles enable row level security;
alter table public.candidates enable row level security;
alter table public.candidate_aliases enable row level security;
alter table public.candidacies enable row level security;
alter table public.candidate_sources enable row level security;
alter table public.review_cases enable row level security;
alter table public.review_events enable row level security;

revoke all on table public.election_cycles from anon, authenticated;
revoke all on table public.candidates from anon, authenticated;
revoke all on table public.candidate_aliases from anon, authenticated;
revoke all on table public.candidacies from anon, authenticated;
revoke all on table public.candidate_sources from anon, authenticated;
revoke all on table public.review_cases from anon, authenticated;
revoke all on table public.review_events from anon, authenticated;

grant select, insert, update, delete on table public.election_cycles to service_role;
grant select, insert, update, delete on table public.candidates to service_role;
grant select, insert, update, delete on table public.candidate_aliases to service_role;
grant select, insert, update, delete on table public.candidacies to service_role;
grant select, insert, update,delete on table public.candidate_sources to service_role;
grant select, insert, update, delete on table public.review_cases to service_role;
grant select, insert, update, delete on table public.review_events to service_role;

grant usage, select on sequence public.election_cycles_id_seq to service_role;
grant usage, select on sequence public.candidates_id_seq to service_role;
grant usage, select on sequence public.candidate_aliases_id_seq to service_role;
grant usage, select on sequence public.candidacies_id_seq to service_role;
grant usage, select on sequence public.candidate_sources_id_seq to service_role;
grant usage, select on sequence public.review_cases_id_seq to service_role;
grant usage, select on sequence public.review_events_id_seq to service_role;
