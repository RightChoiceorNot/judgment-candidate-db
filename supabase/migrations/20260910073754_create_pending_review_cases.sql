create function public.create_pending_review_cases(p_rows jsonb)
returns table (inserted_count integer, skipped_count integer, withdrawn_count integer)
language plpgsql
set search_path = public, pg_temp
as $$
declare
  v_row jsonb;
  v_judgment public.raw_judgments%rowtype;
  v_inserted integer := 0;
  v_skipped integer := 0;
  v_withdrawn integer := 0;
begin
  for v_row in select value from jsonb_array_elements(p_rows)
  loop
    select * into v_judgment
    from public.raw_judgments
    where external_jid = v_row ->> 'external_jid';

    if not found then
      v_skipped := v_skipped + 1;
      continue;
    end if;
    if v_judgment.public_status = 'withdrawn' then
      v_withdrawn := v_withdrawn + 1;
      continue;
    end if;

    insert into public.review_cases (
      candidate_id, raw_judgment_id, source_file_id, status, match_reason, local_source_path
    ) values (
      (v_row ->> 'candidate_id')::bigint,
      v_judgment.id,
      v_judgment.source_file_id,
      'pending_review',
      jsonb_build_object(
        'matcher', 'local_jfull_exact_name_v1',
        'matched_name', v_row ->> 'matched_name',
        'external_jid', v_judgment.external_jid
      ),
      v_row ->> 'local_source_path'
    ) on conflict (candidate_id, raw_judgment_id) do nothing;

    if found then v_inserted := v_inserted + 1; else v_skipped := v_skipped + 1; end if;
  end loop;
  return query select v_inserted, v_skipped, v_withdrawn;
end;
$$;

revoke all on function public.create_pending_review_cases(jsonb) from public;
grant execute on function public.create_pending_review_cases(jsonb) to service_role;
