alter table public.candidacies
  add column source_record_key text unique;

alter table public.candidate_sources
  add column source_file_name text,
  add column source_sha256 text,
  add column source_published_at date,
  add column parser_version text;

create function public.import_registered_candidate_rows(
  p_election_cycle_id bigint,
  p_rows jsonb
)
returns table (inserted_count integer, skipped_count integer)
language plpgsql
set search_path = public, pg_temp
as $$
declare
  v_row jsonb;
  v_candidate_id bigint;
  v_candidacy_id bigint;
  v_inserted integer := 0;
  v_skipped integer := 0;
begin
  for v_row in select value from jsonb_array_elements(p_rows)
  loop
    select id into v_candidacy_id
    from public.candidacies
    where source_record_key = v_row ->> 'source_record_key';

    if found then
      v_skipped := v_skipped + 1;
      continue;
    end if;

    insert into public.candidates (full_name, normalized_name)
    values (v_row ->> 'full_name', regexp_replace(v_row ->> 'full_name', '[[:space:][:punct:]]', '', 'g'))
    returning id into v_candidate_id;

    insert into public.candidacies (
      candidate_id, election_cycle_id, election_type, district, party_name,
      candidate_status, official_source_url, source_fetched_at, source_record_key
    )
    values (
      v_candidate_id, p_election_cycle_id, v_row ->> 'election_type', v_row ->> 'district',
      nullif(v_row ->> 'party_name', '無'), 'registered', v_row ->> 'source_page_url',
      (v_row ->> 'fetched_at')::timestamptz, v_row ->> 'source_record_key'
    )
    returning id into v_candidacy_id;

    insert into public.candidate_sources (
      candidate_id, candidacy_id, source_kind, source_url, fetched_at, source_note,
      source_file_name, source_sha256, source_published_at, parser_version
    )
    values (
      v_candidate_id, v_candidacy_id, 'cec_candidate_registration_summary_pdf',
      v_row ->> 'source_page_url', (v_row ->> 'fetched_at')::timestamptz,
      format('PDF=%s; page=%s; registration_date=%s; note=%s',
        v_row ->> 'source_file_name', v_row ->> 'page_number', v_row ->> 'registration_date_roc', v_row ->> 'note'),
      v_row ->> 'source_file_name', v_row ->> 'source_sha256',
      (v_row ->> 'source_published_at')::date, 'cec-registration-pdf-v1'
    );
    v_inserted := v_inserted + 1;
  end loop;

  return query select v_inserted, v_skipped;
end;
$$;

revoke all on function public.import_registered_candidate_rows(bigint, jsonb) from public;
grant execute on function public.import_registered_candidate_rows(bigint, jsonb) to service_role;
