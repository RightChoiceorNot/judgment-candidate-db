import assert from "node:assert/strict";
import test from "node:test";
import { isReviewStatus, isValidReviewTransition } from "./review-workflow.js";

test("allows an initial decision from pending review", () => {
  assert.equal(isValidReviewTransition("pending_review", "confirmed_match"), true);
  assert.equal(isValidReviewTransition("pending_review", "rejected_match"), true);
});

test("allows a case to return after more evidence is requested", () => {
  assert.equal(isValidReviewTransition("needs_more_evidence", "pending_review"), true);
});

test("does not allow a withdrawn case to be changed", () => {
  assert.equal(isValidReviewTransition("withdrawn", "pending_review"), false);
});

test("accepts only defined review statuses", () => {
  assert.equal(isReviewStatus("confirmed_match"), true);
  assert.equal(isReviewStatus("unreviewed"), false);
});
