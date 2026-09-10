export const reviewStatuses = [
  "pending_review",
  "confirmed_match",
  "rejected_match",
  "withdrawn",
  "needs_more_evidence",
] as const;

export type ReviewStatus = (typeof reviewStatuses)[number];

const transitions: Readonly<Record<ReviewStatus, readonly ReviewStatus[]>> = {
  pending_review: ["confirmed_match", "rejected_match", "withdrawn", "needs_more_evidence"],
  needs_more_evidence: ["pending_review", "confirmed_match", "rejected_match", "withdrawn"],
  confirmed_match: ["needs_more_evidence", "withdrawn"],
  rejected_match: ["pending_review", "needs_more_evidence", "withdrawn"],
  withdrawn: [],
};

export function isReviewStatus(value: string): value is ReviewStatus {
  return (reviewStatuses as readonly string[]).includes(value);
}

export function isValidReviewTransition(prior: ReviewStatus, next: ReviewStatus): boolean {
  return transitions[prior].includes(next);
}
