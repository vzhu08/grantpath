import { previewWorksheet } from "./assembly";
import { localDate } from "../dates";
import { contentDigest, boundedSnapshot } from "./canonical";
import { requireAward, validateEvidence, validateSourceRef, freezeSources, originGlobalSources, type AwardHost, refKey, collectSourceRefs } from "./context";
import { performanceIssues } from "./progress";
import { ANNUAL_TEMPLATE } from "./templates";
import { ReportSnapshotPayloadSchema, SECTION_KEYS, type AnnualReportRevision, type AwardsState, type FactualBlock, type ReportContext, type SectionRevision, type SectionKey } from "./schema";

export function validateReportContext(context: ReportContext, awardId: string, state: AwardsState, host: AwardHost, latest = false) {
  const award = state.records.find(a => a.id === awardId);
  const terms = state.termsVersions.find(t => t.id === context.termsVersionId && t.awardId === awardId);
  requireAward(award && terms && terms.digest === context.termsDigest, "Report terms version/digest does not resolve to this award.");
  const period = terms.payload.budgetPeriods.find(p => p.id === context.periodId);
  requireAward(period && period.start === context.periodStart && period.end === context.periodEnd, "Report period must exactly match its confirmed budget period.");
  requireAward(context.evidenceThrough >= period.start && context.evidenceThrough <= period.end && context.evidenceThrough <= context.asOfDate, "Evidence-through must be within this budget period and no later than the server as-of date.");
  const origin = state.originSnapshots.find(o => o.id === award.originContext.id);
  requireAward(origin, "Origin snapshot missing.");
  const allowed = originGlobalSources(origin.payload);
  validateEvidence(context, host, award.projectId, allowed);
  const refs = new Set(context.sourceRefs.map(refKey));
  requireAward(refs.size === context.sourceRefs.length, "Report source version selections must be unique.");
  for (const ref of terms.payload.sourceRefs) requireAward(refs.has(refKey(ref)), "Select every source version supporting the report's full terms interpretation.");
  const updates = new Set<string>();
  for (const ref of context.progressRefs) {
    requireAward(!updates.has(ref.updateId), "Select one revision per progress update."); updates.add(ref.updateId);
    const update = state.progressUpdates.find(u => u.id === ref.updateId && u.awardId === awardId);
    const revision = update?.revisions.find(r => r.id === ref.revisionId);
    requireAward(revision, "A selected progress revision is missing or belongs to another award.");
    for (const r of collectSourceRefs(revision.evidence)) requireAward(refs.has(refKey(r)), "Select every source version used by the report's progress evidence.");
    if (latest) requireAward(update!.revisions.at(-1)!.id === revision.id, "Progress was corrected. Save a reconciled report revision before review.", 409);
  }
  if (latest) {
    requireAward(context.termsVersionId === award.currentConfirmedTermsVersionId, "Current award terms changed. Save a reconciled report revision.", 409);
    for (const ref of context.sourceRefs) {
      const { source } = validateSourceRef(ref, host, award.projectId, allowed);
      const current = source.versions.at(-1)!;
      if (current.version !== ref.version) requireAward(context.historicalSourceReviews.some(r => r.sourceId === ref.sourceId && r.version === ref.version && r.latestVersion === current.version), "Newer evidence needs an explicit historical-version review and reason.", 409);
    }
  }
}
export function blockIssues(block: FactualBlock, context: ReportContext, awardId: string, state: AwardsState, host: AwardHost): string[] {
  const issues = block.supportRefs.filter(r => r.kind === "missing").map(r => r.reason);
  const award = state.records.find(a => a.id === awardId)!;
  const origin = state.originSnapshots.find(o => o.id === award.originContext.id)!;
  const allowed = originGlobalSources(origin.payload);
  const selected = new Set(context.sourceRefs.map(refKey));
  let hasGoal = false, hasProgress = false, hasEligibleActual = false, hasDelay = false, hasPlan = false, hasContext = false;
  for (const ref of block.supportRefs) {
    if (ref.kind === "approved_goal") {
      const terms = state.termsVersions.find(t => t.id === ref.termsVersionId && t.awardId === awardId);
      requireAward(ref.awardId === awardId && terms && terms.id === context.termsVersionId && terms.payload.goals.some(g => g.goalId === ref.goalId), "A goal block must pin an approved goal from the report's selected terms.");
      hasGoal = true;
    } else if (ref.kind === "source_quote") {
      validateEvidence(ref, host, award.projectId, allowed);
      requireAward(selected.has(refKey(ref.citation)), "Select the quoted source version in this report context.");
      hasContext = true;
    } else if (ref.kind === "progress_update") {
      requireAward(ref.awardId === awardId && context.progressRefs.some(p => p.updateId === ref.updateId && p.revisionId === ref.revisionId), "Block progress reference is outside the selected report context.");
      const revision = state.progressUpdates.find(u => u.id === ref.updateId && u.awardId === awardId)?.revisions.find(r => r.id === ref.revisionId);
      requireAward(revision, "Block progress revision is unavailable.");
      hasProgress = true; hasContext = true;
      const actualIssues = performanceIssues(revision, context, block.claimKind === "actual_result");
      if (!actualIssues.length) hasEligibleActual = true;
      else if (["actual_activity", "actual_result"].includes(block.claimKind)) issues.push(...actualIssues);
      hasDelay ||= revision.state === "delayed" && !!revision.delayReason.trim() && !performanceIssues(revision, context).length;
      if (block.claimKind === "delay") issues.push(...performanceIssues(revision, context));
      hasPlan ||= !!(revision.nextPlan.trim() || revision.recoveryPlan.trim());
    }
  }
  if (block.claimKind === "approved_goal" && !hasGoal) issues.push("Approved goal support is missing.");
  if (["actual_activity", "actual_result"].includes(block.claimKind) && (!hasProgress || !hasEligibleActual)) issues.push("Actual claims require an eligible dated progress revision and evidence; proposal text or a quote alone cannot qualify.");
  if (block.claimKind === "delay" && !hasDelay) issues.push("Delay needs the selected delayed progress revision.");
  if (block.claimKind === "future_plan" && !hasPlan) issues.push("Future plan needs a selected progress plan, or a disclosed missing input.");
  if (block.claimKind === "context" && !hasContext && !hasGoal) issues.push("Context statement has no resolved support.");
  return [...new Set(issues)];
}
export function reportIssues(sections: SectionRevision[], context: ReportContext, awardId: string, state: AwardsState, host: AwardHost): string[] {
  const issues: string[] = [];
  for (const key of SECTION_KEYS) {
    const section = sections.find(s => s.sectionKey === key);
    requireAward(section, "All six worksheet sections must be saved.");
    if (!section.blocks.length) issues.push(`${key}: Missing narrative or explicit nothing-to-report review.`);
    for (const b of section.blocks) issues.push(...blockIssues(b, context, awardId, state, host).map(i => `${key}/${b.blockId}: ${i}`));
  }
  return [...new Set(issues)];
}
export function sectionFingerprint(revision: AnnualReportRevision, section: SectionRevision) {
  return contentDigest({ version: "award-section-review-v1", aggregateRevisionId: revision.id, context: revision.context, section });
}
export function currentReportDifferences(state: AwardsState, reportId: string, host: AwardHost): string[] {
  const report = state.reports.find(r => r.id === reportId);
  requireAward(report, "Report not found.", 404);
  const revision = report.revisions.at(-1)!;
  const differences: string[] = [];
  const award = state.records.find(a => a.id === report.awardId)!;
  if (award.currentConfirmedTermsVersionId !== revision.context.termsVersionId) differences.push("Current confirmed award terms changed.");
  for (const ref of revision.context.progressRefs) if (state.progressUpdates.find(u => u.id === ref.updateId)?.revisions.at(-1)?.id !== ref.revisionId) differences.push(`Progress ${ref.updateId} was corrected.`);
  for (const ref of revision.context.sourceRefs) if (host.sources.find(s => s.id === ref.sourceId)?.versions.at(-1)?.version !== ref.version) differences.push(`Newer source: ${ref.sourceId}.`);
  return differences;
}
export function assembleWorksheet(state: AwardsState, awardId: string, context: ReportContext, host: AwardHost) {
  validateReportContext(context, awardId, state, host);
  return previewWorksheet(state, awardId, context);
}
export function buildReportSnapshot(state: AwardsState, reportId: string, revisionId: string, host: AwardHost, actor: string, note: string, now: Date) {
  const report = state.reports.find(r => r.id === reportId);
  requireAward(report && report.revisions.at(-1)!.id === revisionId, "Select the current saved report revision before freezing.", 409);
  const revision = report.revisions.at(-1)!;
  const award = state.records.find(a => a.id === report.awardId)!;
  validateReportContext(revision.context, award.id, state, host, true);
  requireAward(revision.context.asOfDate <= localDate(now), "Report as-of date is in the future.");
  const sections = revision.sectionRevisionIds.map(id => state.sectionRevisions.find(s => s.id === id)!);
  const reviews = sections.map(section => {
    const review = state.sectionReviews.filter(r => r.reportRevisionId === revision.id && r.sectionRevisionId === section.id && r.fingerprint === sectionFingerprint(revision, section)).at(-1);
    requireAward(review, "Review every section of this exact report revision before freezing.", 409);
    return review;
  });
  const origin = state.originSnapshots.find(o => o.id === award.originContext.id)!;
  const updates = revision.context.progressRefs.map(ref => {
    const u = state.progressUpdates.find(u => u.id === ref.updateId)!;
    return { ...u, revisions: u.revisions.filter(r => r.id === ref.revisionId) };
  });
  const termIds = new Set([revision.context.termsVersionId, ...updates.flatMap(u => u.revisions.map(r => r.termsVersionId))]);
  const itemIds = new Set(updates.flatMap(u => u.revisions.flatMap(r => r.itemIds)));
  const allItems = [...state.obligations, ...state.milestones].filter(i => i.awardId === award.id);
  let items = allItems.filter(i => itemIds.has(i.id));
  for (let i = 0; i < items.length; i++) for (const r of items[i]!.revisions) {
    if (r.supersedesItemId && !itemIds.has(r.supersedesItemId)) { itemIds.add(r.supersedesItemId); items = allItems.filter(x => itemIds.has(x.id)); i = -1; break; }
  }
  for (const item of items) for (const r of item.revisions) termIds.add(r.termsVersionId);
  // Close carry-forward, confirmed interpretation and reconciliation dependencies.
  const candidateIds = new Set<string>();
  let changed = true;
  while (changed) {
    const count = termIds.size + candidateIds.size;
    for (const t of state.termsVersions.filter(t => termIds.has(t.id))) {
      if (t.baseTermsVersionId) termIds.add(t.baseTermsVersionId);
      if (t.candidateId) candidateIds.add(t.candidateId);
    }
    for (const c of state.changeCandidates.filter(c => candidateIds.has(c.id))) {
      termIds.add(c.baseTermsVersionId);
      if (c.termsVersionId) termIds.add(c.termsVersionId);
      if (c.supersedesCandidateId) candidateIds.add(c.supersedesCandidateId);
    }
    changed = count !== termIds.size + candidateIds.size;
  }
  const terms = state.termsVersions.filter(t => termIds.has(t.id));
  const changeCandidates = state.changeCandidates.filter(c => candidateIds.has(c.id));
  const events = state.events.filter(e => e.awardId === award.id && (termIds.has(e.targetId) || candidateIds.has(e.targetId)));
  const selected = { revision, sections, updates, terms, items, origin, changeCandidates, events };
  const absences = sections.filter(s => reviews.some(r => r.sectionRevisionId === s.id && r.decision === "nothing_to_report_confirmed")).map(s => `${s.sectionKey}: Missing narrative or explicit nothing-to-report review.`);
  const unresolved = [...new Set([...revision.unresolved, ...reportIssues(sections, revision.context, award.id, state, host), ...revision.policyMetadata.coverageLimits])].filter(i => !absences.includes(i));
  const payload = ReportSnapshotPayloadSchema.parse({ version: "award-report-snapshot-v1", canonicalVersion: "sorted-json-utf8-v1", award, origin, terms,
    reportRevision: revision, sections, reviews, updates, items, changeCandidates, events,
    sources: freezeSources(selected, host, award.projectId, originGlobalSources(origin.payload)),
    template: revision.policyMetadata, unresolved, reviewActor: actor, reviewedAt: now.toISOString(), note });
  boundedSnapshot(payload);
  return payload;
}
