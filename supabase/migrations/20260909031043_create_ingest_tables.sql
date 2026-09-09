create table public.ingest_runs (
  id bigint generated always as identity primary key,
  job_name text not null,
  status text not null default 'running',
  started_at timestamptz not null default now(),
  finished_at timestamptz,
  details jsonb not null default '{}'::jsonb
);

create table public.source_resources (
  id bigint generated always as identity primary key,
  dataset_id bigint not null,
  dataset_title text not null,
  category_no text,
  fileset_id bigint not null unique,
  resource_format text,
  resource_description text,
  discovered_at timestamptz not null default now(),
  last_seen_at timestamptz not null default now()
);

create table public.source_files (
  id bigint generated always as identity primary key,
  fileset_id bigint not null,
  source_url text not null,
  original_filename text,
  file_format text,
  sha256 text,
  processing_status text not null default 'downloaded',
  downloaded_at timestamptz not null default now(),
  processed_at timestamptz,
  error_message text
);

create table public.raw_judgments (
  id bigint generated always as identity primary key,
  external_jid text unique,
  source_file_id bigint references public.source_files(id),
  court_name text,
  case_number text,
  judgment_date date,
  case_type text,
  judgment_text text,
  content_sha256 text,
  public_status text not null default 'public',
  first_seen_at timestamptz not null default now(),
  last_seen_at timestamptz not null default now()
);

alter table public.ingest_runs enable row level security;
alter table public.source_resources enable row level security;
alter table public.source_files enable row level security;
alter table public.raw_judgments enable row level security;

revoke all on public.ingest_runs from anon, authenticated;
revoke all on public.source_resources from anon, authenticated;
revoke all on public.source_files from anon, authenticated;
revoke all on public.raw_judgments from anon, authenticated;