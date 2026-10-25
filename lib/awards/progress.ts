import type { AwardsState, ProgressRevision, ReportContext } from "./schema";
import { requireAward, validateEvidence, type AwardHost } from "./context";

export function validateProgress(revision: ProgressRevision, awardId: string, state: AwardsState, host: AwardHost) {
  const award = state.records.find(a => a.id === awardId);
  const terms = state.termsVersions.find(t => t.awardId === awardId && t.id === revision.termsVersionId);
  requireAward(award && terms, "Progress must pin this award's confirmed terms.");
  validateEvidence(revision, host, award.projectId);
  requireAward(new Set(revision.goalIds).size === revision.goalIds.length && new Set(revision.itemIds).size === revision.itemIds.length, "Progress goal/item selections must be unique.");
  for (const goalId of revision.goalIds) requireAward(terms.payload.goals.some(g => g.goalId === goalId), "Progress goal is not in the selected terms version.");
  for (const itemId of revision.itemIds) requireAward([...state.obligations, ...state.milestones].some(i => i.id === itemId && i.awardId === awardId), "Progress item belongs to another award or is missing.");
  if (revision.allocation) requireAward(terms.payload.budgetPeriods.some(p => p.id === revision.allocation!.periodId), "Allocation must identify a confirmed budget period.");
  if (revision.state === "delayed") requireAward(revision.delayReason.trim(), "Describe the delay; recovery plans may remain unknown.");
}

/** This only validates linkage and temporal eligibility. A human reviews meaning. */
export function performanceIssues(p: ProgressRevision, context: ReportContext, result = false): string[] {
  const issues: string[] = [];
  if (!p.evidence.length) issues.push("No exact performance evidence supplied.");
  if (["no_update", "not_started"].includes(p.state)) issues.push("No actual activity has been recorded.");
  if (result && (p.state !== "completed" || p.finding === "none_reported")) issues.push("An actual result requires completed work and an explicitly reported finding.");
  const observed = p.observedDate ?? p.endDate;
  if (!observed) issues.push("Observation/activity end date is missing.");
  const allDates = [p.startDate, p.endDate, p.observedDate].filter((d): d is string => d !== null);
  if (allDates.some(d => d > context.evidenceThrough || d > context.asOfDate)) issues.push("Actual activity or observation is later than the evidence-through/as-of date.");
  if (observed && (observed < context.periodStart || observed > context.periodEnd)) issues.push("Observation is outside the selected reporting period.");
  if (allDates.some(d => d < context.periodStart || d > context.periodEnd)) {
    if (!p.allocation || p.allocation.periodId !== context.periodId) issues.push("Activity spans a reporting boundary. Split it or record a reviewed period-specific allocation.");
  }
  return issues;
}

export function periodNarrative(p: ProgressRevision, context: ReportContext): string {
  return p.allocation?.periodId === context.periodId ? p.allocation.text : p.factualText;
}
