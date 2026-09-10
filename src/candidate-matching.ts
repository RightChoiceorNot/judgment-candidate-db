export type MatchCandidate = {
  candidateId: number;
  fullName: string;
  aliases: string[];
};

export type LocalJudgment = {
  externalJid: string;
  fullText: string;
  localSourcePath: string;
};

export type PendingReviewMatch = {
  candidateId: number;
  externalJid: string;
  status: "pending_review";
  matchReason: {
    matchedName: string;
    matchType: "full_name" | "alias";
  };
  localSourcePath: string;
};

export function normalizeName(value: string) {
  return value
    .normalize("NFKC")
    .replace(/[\s\p{P}\p{S}]/gu, "")
    .toLocaleLowerCase("zh-TW");
}

export function findPendingReviewMatches(
  candidates: MatchCandidate[],
  judgment: LocalJudgment,
  withdrawnJids: ReadonlySet<string> = new Set(),
): PendingReviewMatch[] {
  if (withdrawnJids.has(judgment.externalJid)) {
    return [];
  }

  const normalizedText = normalizeName(judgment.fullText);
  const matches: PendingReviewMatch[] = [];

  for (const candidate of candidates) {
    const names = [
      { value: candidate.fullName, matchType: "full_name" as const },
      ...candidate.aliases.map((value) => ({ value, matchType: "alias" as const })),
    ];

    const matched = names.find(({ value }) => {
      const normalizedName = normalizeName(value);
      return normalizedName.length >= 2 && normalizedText.includes(normalizedName);
    });

    if (matched) {
      matches.push({
        candidateId: candidate.candidateId,
        externalJid: judgment.externalJid,
        status: "pending_review",
        matchReason: {
          matchedName: matched.value,
          matchType: matched.matchType,
        },
        localSourcePath: judgment.localSourcePath,
      });
    }
  }

  return matches;
}
