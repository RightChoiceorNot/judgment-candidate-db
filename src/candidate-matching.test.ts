import assert from "node:assert/strict";
import test from "node:test";
import { findPendingReviewMatches, normalizeName } from "./candidate-matching.js";

const candidates = [
  { candidateId: 1, fullName: "測試甲", aliases: ["甲測試"] },
  { candidateId: 2, fullName: "測試乙", aliases: [] },
];

test("normalizes full-width characters and spacing", () => {
  assert.equal(normalizeName("測 試－甲"), normalizeName("測試甲"));
});

test("a full-name text match remains pending review", () => {
  const matches = findPendingReviewMatches(candidates, {
    externalJid: "fixture-jid-1",
    fullText: "文中提及測試甲，但尚未確認身分。",
    localSourcePath: "storage/fixture/fixture-jid-1.json",
  });

  assert.deepEqual(matches, [{
    candidateId: 1,
    externalJid: "fixture-jid-1",
    status: "pending_review",
    matchReason: { matchedName: "測試甲", matchType: "full_name" },
    localSourcePath: "storage/fixture/fixture-jid-1.json",
  }]);
});

test("an alias match remains pending review", () => {
  const matches = findPendingReviewMatches(candidates, {
    externalJid: "fixture-jid-2",
    fullText: "甲測試出現在測試文字中。",
    localSourcePath: "storage/fixture/fixture-jid-2.json",
  });

  assert.equal(matches[0]?.matchReason.matchType, "alias");
  assert.equal(matches[0]?.status, "pending_review");
});

test("returns no match when no candidate name appears", () => {
  assert.deepEqual(findPendingReviewMatches(candidates, {
    externalJid: "fixture-jid-3",
    fullText: "沒有候選人名稱的測試文字。",
    localSourcePath: "storage/fixture/fixture-jid-3.json",
  }), []);
});

test("never creates a match for a withdrawn judgment", () => {
  assert.deepEqual(findPendingReviewMatches(candidates, {
    externalJid: "fixture-jid-4",
    fullText: "測試甲",
    localSourcePath: "storage/fixture/fixture-jid-4.json",
  }, new Set(["fixture-jid-4"])), []);
});
