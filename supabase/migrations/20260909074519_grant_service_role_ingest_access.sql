grant usage on schema public to service_role;

grant select, insert, update, delete
on table public.ingest_runs
to service_role;

grant select, insert, update, delete
on table public.source_resources
to service_role;

grant select, insert, update, delete
on table public.source_files
to service_role;

grant select, insert, update, delete
on table public.raw_judgments
to service_role;

grant usage, select
on all sequences in schema public
to service_role;