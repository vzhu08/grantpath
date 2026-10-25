import type { AwardsState, AwardCitation } from "./schema";
import { requireAward } from "./context";

export function proposedAnnualTarget(period: { id: string; start: string; end: string }, evidence: AwardCitation[]) {
  requireAward(evidence.length, "A proposed rule needs its exact guidance/award citation.");
  const target = new Date(`${period.end}T00:00:00Z`); target.setUTCDate(target.getUTCDate() - 90);
  return { rule: "period_end_minus_90_calendar_days" as const, periodId: period.id, periodStart: period.start, periodEnd: period.end,
    proposedDate: target.toISOString().slice(0, 10), evidence, confirmed: false };
}
export function awardAgenda(state: AwardsState, applicationId: string) {
  const award = state.records.find(a => a.applicationId === applicationId && a.localState === "recorded");
  if (!award) return [];
  const items = [...state.obligations, ...state.milestones].filter(i => i.awardId === award.id);
  const superseded = new Set(items.flatMap(i => { const r = i.revisions.at(-1)!;
    return r.review === "confirmed" && r.applicable && r.termsVersionId === award.currentConfirmedTermsVersionId && r.supersedesItemId ? [r.supersedesItemId] : []; }));
  return items.flatMap(item => {
    const r = item.revisions.at(-1)!;
    const completed = state.completions.filter(c => c.itemId === item.id && c.itemRevisionId === r.id).at(-1)?.status === "completed";
    if (superseded.has(item.id) || r.review !== "confirmed" || !r.applicable || r.termsVersionId !== award.currentConfirmedTermsVersionId || completed || r.derivation && !r.derivation.confirmed) return [];
    return [{ id: `award:${award.id}:${item.kind}:${item.id}`, awardId: award.id, itemId: item.id,
      title: r.title, description: `${item.kind === "milestone" ? "Internal milestone" : r.origin === "sponsor" ? "Confirmed locally · award obligation" : "Internal task"}. ${r.description}`,
      deadline: r.deadline, updatedAt: r.at, responsibility: r.responsibility, label: "Award" as const }];
  });
}
