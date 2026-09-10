create table public.judgment_deletions (
  id bigint generated always as identity primary key,
  deleted_on date not null,
  judgment_year_month text not null,
  court_name text not null,
  external_jid text not null unique,
  source_file_id bigint references public.source_files(id),
  first_seen_at timestamptz not null default now(),
  last_seen_at timestamptz not null default now()
);

create index judgment_deletions_deleted_on_idx
on public.judgment_deletions (deleted_on);

alter table public.judgment_deletions enable row level security;

revoke all on public.judgment_deletions from anon, authenticated;

grant select, insert, update, delete
on table public.judgment_deletions
to service_role;

grant usage, select
on sequence public.judgment_deletions_id_seq
to service_role;