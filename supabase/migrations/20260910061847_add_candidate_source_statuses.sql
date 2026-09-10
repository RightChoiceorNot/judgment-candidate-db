alter table public.candidacies
  drop constraint candidacies_candidate_status_check;

alter table public.candidacies
  add constraint candidacies_candidate_status_check
  check (
    candidate_status in (
      'pending_verification',
      'provisional',
      'registered',
      'officially_listed',
      'active',
      'withdrawn',
      'elected',
      'not_elected'
    )
  );
