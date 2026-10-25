import type { AwardsState, FactualBlock, ReportContext, SectionKey } from "./schema";
import { SECTION_KEYS } from "./schema";
import { performanceIssues, periodNarrative } from "./progress";

/** Browser-safe preview. The server independently validates the selected graph on save. */
export function previewWorksheet(state: AwardsState, awardId: string, context: ReportContext) {
  const terms = state.termsVersions.find(t => t.id === context.termsVersionId && t.awardId === awardId);
  if (!terms) throw new Error("Select confirmed terms and a reporting budget period.");
  const sections = Object.fromEntries(SECTION_KEYS.map(k => [k, [] as FactualBlock[]])) as Record<SectionKey, FactualBlock[]>;
  terms.payload.goals.forEach((g, i) => sections.accomplishments.push({ blockId: `goal-${i}`, text: `Approved goal: ${g.text}`, claimKind: "approved_goal",
    supportRefs: [{ kind: "approved_goal", awardId, termsVersionId: terms.id, goalId: g.goalId }] }));
  const revisions = context.progressRefs.map(ref => {
    const p = state.progressUpdates.find(u => u.id === ref.updateId && u.awardId === awardId)?.revisions.find(r => r.id === ref.revisionId);
    if (!p) throw new Error("Selected progress revision is unavailable."); return { ref, p };
  });
  revisions.forEach(({ ref, p }, i) => {
    const support = { kind: "progress_update" as const, awardId, updateId: ref.updateId, revisionId: ref.revisionId };
    const eligibility = performanceIssues(p, context);
    const actualText = periodNarrative(p, context);
    if (actualText.trim() && !eligibility.length) sections.accomplishments.push({ blockId: `activity-${i}`, text: `${p.evidenceKind === "researcher_log" ? "Researcher-reported" : "Recorded"} ${p.state} activity (${p.observedDate ?? p.endDate}): ${actualText}\nFinding: ${p.finding}.`, claimKind: p.state === "completed" && p.finding !== "none_reported" ? "actual_result" : "actual_activity", supportRefs: [support] });
    else sections.accomplishments.push({ blockId: `gap-${i}`, text: `Missing or excluded actual activity: ${p.factualText || "No update supplied"}. ${eligibility.join(" ")}`, claimKind: "context", supportRefs: [{ kind: "missing", reason: eligibility.join(" ") || "No factual update." }] });
    if (p.state === "delayed" && !eligibility.length) sections.changes.push({ blockId: `delay-${i}`, text: `Delayed: ${p.delayReason}`, claimKind: "delay", supportRefs: [support] });
    if (["negative", "inconclusive"].includes(p.finding) && !performanceIssues(p, context, true).length) sections.changes.push({ blockId: `finding-${i}`, text: `Completed activity with ${p.finding} finding: ${actualText}`, claimKind: "actual_result", supportRefs: [support] });
    if (p.recoveryPlan || p.nextPlan) sections.accomplishments.push({ blockId: `plan-${i}`, text: `Future plan: ${p.recoveryPlan || p.nextPlan}`, claimKind: "future_plan", supportRefs: [support] });
  });
  for (const goal of terms.payload.goals) if (!revisions.some(({ p }) => p.goalIds.includes(goal.goalId)))
    sections.accomplishments.push({ blockId: `missing-${goal.goalId}`, text: `No actual progress update for goal: ${goal.text}`, claimKind: "context", supportRefs: [{ kind: "missing", reason: "Goal has no selected actual progress update." }] });
  return sections;
}
