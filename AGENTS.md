# judgment-candidate-db agent guide

## Purpose

This repository builds an auditable, updateable, privacy- and legally-risk-aware index of public judicial judgments. It will eventually support human review of public judgment information that may be relevant to local-election candidates.

## Non-negotiable principles

1. A judgment is not a criminal record, proof of a criminal fact, or a determination of candidate eligibility.
2. A name match is never proof of identity. Every candidate-to-judgment relationship starts as `pending_review`.
3. Do not publicly display a record or make a negative claim until identity, case outcome, finality, and withdrawal status have been confirmed by a human.
4. Do not build public search for unreviewed people and do not publish automatic name matches.
5. Keep original `JFULL` only in local `storage/`. Do not commit it, upload it to GitHub, or store it in Supabase by default.
6. Read the Supabase secret/service-role credential only from local backend scripts. Never place it in frontend code, Git, README, screenshots, logs, or status reports.
7. Every `public` schema table needs RLS. Do not create anon or authenticated public-read policies at this stage.
8. For every schema change, create a migration with `npx.cmd supabase migration new <name>`, then run `npx.cmd supabase db push --linked --yes --skip-vault` and verify the result.
9. Preserve source URLs, imports, withdrawal records, execution runs, and human-review history. Do not delete data merely to hide it.
10. Work autonomously within the active phase: inspect, edit, test, correct, commit, and push. Pause only at the approval gates below.

## Current baseline

- Remote Supabase migrations are pushed through `20260910033124`.
- `source_resources`: about 367 rows; `judgment_deletions`: about 5,053 rows.
- `raw_judgments`: 37,233 metadata-only criminal judgment indexes for `202606`.
- Judgment full text is absent from Supabase: `judgment_text` is null and `full_text_available` is false.
- `raw_judgments.public_status` defaults to `pending_review`.
- Local RAR/JSON source material is under ignored `storage/`.
- Exact external-JID withdrawal reconciliation exists; its first run had zero overlaps.
- TypeScript uses ESM (`package.json` has `"type": "module"`) and `npm run typecheck` is the standard static check.
- The private candidate/review schema is deployed, but its tables contain no real candidate data. The repository has a synthetic fixture only.

## Phases

### Phase 0 — audit and stabilization

Review uncommitted work; verify migrations, RLS, service-role access, counts, and withdrawal reconciliation. Keep TypeScript validation repeatable. Maintain a README describing local setup, data layers, sources, commands, and safety limits. Commit and push when complete.

### Phase 1 — candidate data model

Create private, RLS-protected models and migrations for `election_cycles`, `candidates`, `candidate_aliases`, `candidacies`, `candidate_sources`, `review_cases`, and `review_events`. Preserve election cycle, election type, district, party, candidate status, official source URL, retrieval time, and human-review history. Use fixtures only; do not ingest real candidate lists. Verify, commit, and push.

### Phase 2 — judicial pipeline reliability

Make monthly indexing and withdrawal processing restartable and auditable. Preserve source URL, fileset ID, month, count, file size, errors, and processing times. Never overwrite `withdrawn`. Add checks for duplicate JIDs, missing dates/source files, withdrawal state, and count differences. Produce a month list, size estimate, and priority order before any historical bulk download. Verify, commit, and push.

### Phase 3 — preliminary candidate matching

Match only against local `JFULL`; do not upload full text. Use name normalization, aliases, election context, and judgment dates as evidence. Store every hit as a `pending_review` `review_case` with match reason, JID, local source location, candidate ID, and creation time. Test same-name, alias, no-match, and withdrawn cases. Verify, commit, and push.

### Phase 4 — human review workflow

Support `pending_review`, `confirmed_match`, `rejected_match`, `withdrawn`, and `needs_more_evidence`. Each decision must preserve reviewer, timestamp, reason, and evidence source. Provide internal-only query tooling. Do not create public pages or public-read access. Verify, commit, and push.

### Phase 5 — frontend prototype

Build information architecture, design system, and fixture-only UI for project description, sources and limits, update history, methodology, and review workflow. Do not show real personal data. Frontend code must not receive secrets, full text, or unreviewed personal data. Verify, commit, and push.

### Phase 6 — pre-publication review

Draft public data policy, disclaimer, and methodology. Inventory proposed public fields and risks. Audit RLS, frontend variables, API endpoints, raw data, and Git history for secrets and unreviewed data. Produce only a release plan; do not deploy or open data.

## Approval gates

Stop and request explicit user approval before: importing real candidate personal data or election lists; opening anon/authenticated reads, deploying, or publishing real personal data; deleting or broadly rewriting existing data; changing a paid plan, causing charges, or downloading large historical source archives; or making any public presentation with uncertain identity, defamation, privacy, or legal risk.

## Phase report format

After each phase, report: phase goal and completion state; changed files/migrations/tables; commands actually run and results; relevant counts or integrity checks; known limits, risks, and the next step; and commit hash plus push status. Then proceed directly to the next phase unless an approval gate applies.
