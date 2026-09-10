import "dotenv/config";
import { createClient } from "@supabase/supabase-js";
import { isReviewStatus } from "./review-workflow.js";

function required(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`Missing required environment variable: ${name}`);
  return value;
}

function usage(): never {
  throw new Error("Usage: tsx src/record-review-decision.ts <case-id> <next-status> <reviewer> <reason> [evidence-source]");
}

async function main() {
  const [caseIdInput, nextStatus, reviewer, reason, evidenceSource] = process.argv.slice(2);
  if (!caseIdInput || !nextStatus || !reviewer || !reason) usage();
  const reviewCaseId = Number(caseIdInput);
  if (!Number.isSafeInteger(reviewCaseId) || reviewCaseId < 1 || !isReviewStatus(nextStatus)) usage();

  const supabase = createClient(required("SUPABASE_URL"), required("SUPABASE_SECRET_KEY"));
  const { data, error } = await supabase.rpc("record_review_decision", {
    p_review_case_id: reviewCaseId,
    p_next_status: nextStatus,
    p_reviewer: reviewer,
    p_reason: reason,
    p_evidence_source: evidenceSource ?? null,
  });
  if (error) throw error;
  console.log(JSON.stringify({ decision: data?.[0] ?? null }, null, 2));
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
