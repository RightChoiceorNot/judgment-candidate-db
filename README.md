# judgment-candidate-db

Private tooling for an auditable index of public Taiwanese judicial judgments and a future human-review workflow for candidate-related research.

## Scope and safety

This project does not treat a judgment as a criminal record, proof of wrongdoing, or a candidate-eligibility decision. A name match is not an identity match. Any future candidate-to-judgment link is private and begins as `pending_review`; it must never be automatically published.

Original judgment JSON, including `JFULL`, remains local under `storage/`. It is ignored by Git and is not stored in Supabase by default. The database stores only metadata required for indexing and auditability.

Never place Supabase secret/service-role credentials, Judicial Open Data credentials, raw judgment text, or unreviewed personal data in Git, frontend code, issue text, screenshots, or reports.

## Local setup

Install dependencies:

```powershell
npm.cmd ci
```

Create a local `.env` with the backend-only variables required by the command you run:

```text
SUPABASE_URL=
SUPABASE_SECRET_KEY=
JUDICIAL_MEMBER_ACCOUNT=
JUDICIAL_MEMBER_PASSWORD=
```

Do not commit this file. The repository ignores `.env` and `storage/`.

## Data layers

| Layer | Purpose | Storage |
| --- | --- | --- |
| Source catalog | Judicial Open Data resource/fileset metadata | `source_resources` |
| Source file ledger | Download and processing provenance | `source_files` |
| Judgment index | Metadata-only indexes; no `JFULL` | `raw_judgments` |
| Withdrawal ledger | Source-provided removed judgment identifiers | `judgment_deletions` |
| Withdrawal audit | Exact-JID match record and reconciliation run | `judgment_deletion_marks`, `ingest_runs` |

All current `public` tables use RLS. There are no anon or authenticated read policies. Backend scripts use the local secret only.

## Current dataset

- 367 source resources
- 5,053 withdrawal entries
- 37,233 criminal metadata indexes for `202606`
- no full text in Supabase
- zero exact-JID overlaps in the first withdrawal reconciliation

These counts are operational facts, not claims about any individual.

## Common commands

```powershell
# Static type validation
npm.cmd run typecheck

# Reconcile exact external JIDs against the withdrawal ledger.
# This writes an audit run; it does not delete judgments.
npm.cmd run reconcile:deletions

# Run source/index/withdrawal integrity checks
npm.cmd run check:pipeline

# List month/fileset priorities and known size estimates; it never downloads files
npm.cmd run plan:historical-months

# Inspect a locally downloaded month without uploading text
npx.cmd tsx src/summarize-criminal-month.ts
npx.cmd tsx src/estimate-criminal-month-size.ts

# List migration state and run security checks
npx.cmd supabase migration list --linked
npx.cmd supabase db advisors --linked --type security --level warn
```

Schema changes must begin with `npx.cmd supabase migration new <name>`. Review the generated migration, then use `npx.cmd supabase db push --linked --yes --skip-vault` and validate the deployed schema and data. Do not edit production schema outside this migration workflow.

## Data sources

The current pipeline uses the Judicial Yuan Open Data catalog under category `051`, the criminal judgment fileset, and the withdrawal-list fileset. Store source URLs, fileset identifiers, and processing timestamps in the database so each operation remains traceable.

## Development status

The private database contains 19,675 rows from the CEC's 115-year completed-registration summary PDFs. Every row is `registered`, not `officially_listed`. Local-only matching has created private `pending_review` cases from exact name text matches; these are not identity confirmations and are not publicly accessible. `JFULL` remains local and is never uploaded. Do not provide public access without explicit approval.
