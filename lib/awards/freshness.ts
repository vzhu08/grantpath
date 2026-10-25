import type { AwardsState, ReportContext } from "./schema";

/** Current review eligibility; historical copies remain visible separately. */
export function reportReviewProblems(awards: AwardsState, awardId: string, context: ReportContext,
  sources: { id: string; versions: { version: number }[] }[]): string[] {
  const problems: string[] = [];
  if (awards.records.find(a => a.id === awardId)?.currentConfirmedTermsVersionId !== context.termsVersionId) problems.push("Current confirmed terms changed.");
  for (const ref of context.progressRefs) if (awards.progressUpdates.find(u => u.id === ref.updateId && u.awardId === awardId)?.revisions.at(-1)?.id !== ref.revisionId) problems.push("Selected progress was corrected.");
  for (const ref of context.sourceRefs) {
    const latest = sources.find(s => s.id === ref.sourceId)?.versions.at(-1)?.version;
    if (latest !== ref.version && !context.historicalSourceReviews.some(r => r.sourceId === ref.sourceId && r.version === ref.version && r.latestVersion === latest && !!r.reason.trim() && !!r.actor.trim())) problems.push(`Newer source needs review: ${ref.sourceId}.`);
  }
  return problems;
}
