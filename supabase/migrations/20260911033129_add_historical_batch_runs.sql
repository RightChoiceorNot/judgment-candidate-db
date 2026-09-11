create table public.historical_batches (
  id bigint generated always as identity primary key,
  batch_name text not null unique,
  start_month text not null check (start_month ~ '^\\d{6}$'),
  end_month text not null check (end_month ~ '^\\d{6}$'),
  status text not null default 'planned'
    check (status in ('planned', 'processing', 'awaiting_validation', 'completed', 'failed', 'source_text_purged')),
  expected_month_count integer not null check (expected_month_count > 0),
  processed_month_count integer not null default 0 check (processed_month_count >= 0),
  indexed_judgment_count bigint not null default 0 check (indexed_judgment_count >= 0),
  review_case_count bigint not null default 0 check (review_case_count >= 0),
  source_manifest jsonb not null default '[]'::jsonb,
  validation_summary jsonb not null default '{}'::jsonb,
  source_text_purged_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.historical_batches enable row level security;
revoke all on table public.historical_batches from anon, authenticated;
grant select, insert, update, delete on table public.historical_batches to service_role;
grant usage, select on sequence public.historical_batches_id_seq to service_role;
