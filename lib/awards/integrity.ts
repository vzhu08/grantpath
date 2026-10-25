import { AwardsStateSchema, emptyAwards, SECTION_KEYS, type AwardsState, type ReportSnapshot } from "./schema";
import { canonicalJson, contentDigest, boundedSnapshot } from "./canonical";
import { requireAward, type AwardHost, validateEvidence, originGlobalSources, frozenHost, collectSourceRefs, refKey } from "./context";
import { validateTerms } from "./terms";
import { validateProgress } from "./progress";
import { validateReportContext, reportIssues, sectionFingerprint } from "./reporting";
import { externalAwardKey } from "./identity";
import { snapshotDigest } from "../resubmissions/snapshots";

function validateOriginSubmission(origin: AwardsState["originSnapshots"][number]["payload"]) {
  const snapshot = origin.submittedSnapshot;
  if (snapshot) {
    const { digest, ...payload } = snapshot;
    requireAward(snapshot.projectId === origin.projectId && snapshot.originalApplicationId === origin.applicationId && snapshotDigest(payload) === digest, "Frozen origin attested submission identity/digest is invalid.");
    requireAward(origin.submissionEvidence.state === "human_attested_snapshot" && origin.submissionEvidence.snapshotId === snapshot.id && origin.submissionEvidence.digest === digest, "Origin submission attribution does not match its selected snapshot.");
  } else requireAward(origin.submissionEvidence.state !== "human_attested_snapshot", "Origin claims a missing attested submission snapshot.");
}

function assertAcyclic(ids: string[], next: (id: string) => string[]) {
  const done = new Set<string>(), active = new Set<string>();
  const visit = (id: string) => { requireAward(!active.has(id), "Award correction/supersession lineage is cyclic."); if (done.has(id)) return; active.add(id); next(id).forEach(visit); active.delete(id); done.add(id); };
  ids.forEach(visit);
}

export function validateFrozenReport(snapshot: ReportSnapshot) {
  requireAward(contentDigest(snapshot.payload) === snapshot.digest, "Frozen report digest is invalid.");
  boundedSnapshot(snapshot.payload);
  const p = snapshot.payload, a = p.award;
  requireAward(snapshot.awardId === a.id && snapshot.reportId === p.reportRevision.reportId && snapshot.reportRevisionId === p.reportRevision.id, "Frozen report identity does not match its payload.");
  requireAward(contentDigest(p.origin.payload) === p.origin.digest && a.originContext.id === p.origin.id && a.originContext.digest === p.origin.digest, "Frozen origin digest/reference is invalid.");
  validateOriginSubmission(p.origin.payload);
  const host = frozenHost(p.sources, a.projectId);
  const allowed = originGlobalSources(p.origin.payload);
  validateEvidence(p, host, a.projectId, allowed);
  const selected = new Set(p.reportRevision.sectionRevisionIds);
  requireAward(selected.size === 6 && p.sections.every(s => selected.has(s.id)) && new Set(p.sections.map(s => s.sectionKey)).size === 6, "Frozen sections do not match the aggregate revision.");
  for (const s of p.sections) requireAward(p.reviews.some(r => r.reportRevisionId === p.reportRevision.id && r.sectionRevisionId === s.id && r.fingerprint === sectionFingerprint(p.reportRevision, s)), "Frozen section review fingerprint is invalid.");
  for (const t of p.terms) requireAward(contentDigest(t.payload) === t.digest && t.awardId === a.id, "Frozen terms digest/ownership is invalid.");
  const terms = p.terms.find(t => t.id === p.reportRevision.context.termsVersionId);
  requireAward(terms && terms.digest === p.reportRevision.context.termsDigest, "Frozen report terms are missing.");
  const { id: _revisionId, digest: aggregateDigest, ...aggregatePayload } = p.reportRevision;
  requireAward(contentDigest(aggregatePayload) === aggregateDigest, "Frozen aggregate report digest is invalid.");
  for (const ref of p.reportRevision.context.progressRefs)
    requireAward(p.updates.some(u => u.id === ref.updateId && u.awardId === a.id && u.revisions.some(r => r.id === ref.revisionId)), "Frozen progress support is missing.");
  requireAward(canonicalJson(p.template) === canonicalJson(p.reportRevision.policyMetadata), "Frozen policy metadata differs from the reviewed report.");
  const selectedGraph: AwardsState = { ...emptyAwards(),
    records: [a], originSnapshots: [p.origin], termsVersions: p.terms, progressUpdates: p.updates, changeCandidates: p.changeCandidates, events: p.events,
    obligations: p.items.filter(i => i.kind === "obligation"), milestones: p.items.filter(i => i.kind === "milestone") };
  validateReportContext(p.reportRevision.context, a.id, selectedGraph, host);
  reportIssues(p.sections, p.reportRevision.context, a.id, selectedGraph, host);
  for (const update of p.updates) for (const r of update.revisions) validateProgress(r, a.id, selectedGraph, host);
  for (const t of p.terms) {
    const base = t.baseTermsVersionId ? p.terms.find(b => b.id === t.baseTermsVersionId) : null;
    requireAward(!t.baseTermsVersionId || base && base.ordinal < t.ordinal, "Frozen terms carry/base support is missing or cyclic.");
    validateTerms(t.payload, base ?? null, a.id, selectedGraph, host, a.projectId, false, true);
    if (t.candidateId) requireAward(p.changeCandidates.some(c => c.id === t.candidateId && c.awardId === a.id && c.decision === "confirmed" && c.termsVersionId === t.id && canonicalJson(c.payload) === canonicalJson(t.payload)), "Frozen confirmed interpretation is missing.");
  }
  requireAward(a.currentConfirmedTermsVersionId === p.reportRevision.context.termsVersionId && p.events.some(e => e.type === "terms_selected" && e.targetId === a.currentConfirmedTermsVersionId && e.awardId === a.id), "Frozen current-selection evidence is missing.");
  for (const c of p.changeCandidates) {
    requireAward(c.awardId === a.id && p.terms.some(t => t.id === c.baseTermsVersionId), "Frozen candidate base/ownership is invalid.");
    if (c.supersedesCandidateId) requireAward(p.changeCandidates.some(prior => prior.id === c.supersedesCandidateId && prior.payload.sponsorActionId === c.payload.sponsorActionId), "Frozen reconciled candidate support is missing.");
    if (c.termsVersionId) requireAward(p.terms.some(t => t.id === c.termsVersionId && t.candidateId === c.id), "Frozen candidate terms reference is missing.");
  }
  for (const item of p.items) for (const r of item.revisions) {
    requireAward(item.awardId === a.id && p.terms.some(t => t.id === r.termsVersionId), "Frozen item terms/ownership is invalid.");
    if (r.supersedesItemId) requireAward(p.items.some(i => i.id === r.supersedesItemId && i.awardId === a.id && i.id !== item.id), "Frozen superseded item support is missing.");
  }
  assertAcyclic(p.items.map(i => i.id), id => p.items.find(i => i.id === id)?.revisions.flatMap(r => r.supersedesItemId ? [r.supersedesItemId] : []) ?? []);
  assertAcyclic(p.changeCandidates.map(c => c.id), id => { const prior = p.changeCandidates.find(c => c.id === id)?.supersedesCandidateId; return prior ? [prior] : []; });
}

/** Validate the retained graph on load and before every repository commit. No 'latest' freshness requirement here. */
export function validateAwardsIntegrity(raw: AwardsState, host: AwardHost): AwardsState {
  const state = AwardsStateSchema.parse(raw);
  const allIds = new Set<string>();
  const unique = (values: { id: string }[]) => values.forEach(v => { requireAward(!allIds.has(v.id), "Duplicate award record/revision ID."); allIds.add(v.id); });
  for (const list of [state.records, state.originSnapshots, state.termsVersions, state.changeCandidates, state.obligations, state.milestones,
    state.completions, state.progressUpdates, state.reports, state.sectionRevisions, state.sectionReviews, state.reportSnapshots, state.events]) unique(list);
  for (const item of [...state.obligations, ...state.milestones]) unique(item.revisions);
  state.progressUpdates.forEach(u => unique(u.revisions)); state.reports.forEach(r => unique(r.revisions));
  requireAward(new Set(state.receipts.map(r => r.operationId)).size === state.receipts.length, "Duplicate award operation receipt.");
  const appIds = new Set<string>(), externalKeys = new Map<string, string>();
  for (const award of state.records) {
    const app = host.applications.find(a => a.id === award.applicationId);
    requireAward(app && app.projectId === award.projectId && host.projects.some(p => p.id === award.projectId), "Award application/project binding is invalid.");
    requireAward(!appIds.has(award.applicationId), "More than one award is bound to an application."); appIds.add(award.applicationId);
    const origin = state.originSnapshots.find(o => o.id === award.originContext.id);
    requireAward(origin && origin.digest === award.originContext.digest && contentDigest(origin.payload) === origin.digest, "Award origin snapshot is missing or corrupt.");
    requireAward(origin.payload.applicationId === app.id && origin.payload.projectId === app.projectId, "Origin binding is invalid.");
    requireAward(origin.payload.applicationCycleId === (app.cycleId ?? "initial") && origin.payload.originAttemptId === (app.originAttemptId ?? null), "Origin application cycle binding is invalid.");
    validateOriginSubmission(origin.payload);
    validateEvidence(origin.payload, host, award.projectId, originGlobalSources(origin.payload));
    const frozen = frozenHost(origin.payload.sources, award.projectId);
    validateEvidence(origin.payload, frozen, award.projectId, originGlobalSources(origin.payload));
    const terms = state.termsVersions.filter(t => t.awardId === award.id);
    requireAward(terms.length > 0 && terms.length <= 20, "Award needs one to twenty full terms versions.");
    const ordinals = new Set<number>();
    for (const t of terms) {
      requireAward(!ordinals.has(t.ordinal), "Duplicate terms ordinal."); ordinals.add(t.ordinal);
      requireAward(contentDigest(t.payload) === t.digest, "Terms digest is invalid.");
      const base = t.baseTermsVersionId ? terms.find(x => x.id === t.baseTermsVersionId) : null;
      requireAward(!t.baseTermsVersionId || base && base.ordinal < t.ordinal, "Terms lineage is missing, cyclic or out of order.");
      requireAward(t.payload.changeKind === "initial" ? t.ordinal === 1 && !base && !t.candidateId : !!base, "Initial/noninitial terms lineage is invalid.");
      validateTerms(t.payload, base ?? null, award.id, state, host, award.projectId, false, true);
      if (t.candidateId) requireAward(state.changeCandidates.some(c => c.id === t.candidateId && c.awardId === award.id && c.termsVersionId === t.id && c.decision === "confirmed" && canonicalJson(c.payload) === canonicalJson(t.payload)), "Confirmed candidate/terms binding is invalid.");
      const key = externalAwardKey(t.payload.identity.sponsorAwardNumber, t.payload.identity.recipientName);
      requireAward(!externalKeys.has(key) || externalKeys.get(key) === award.id, "Duplicate external award identity across applications."); externalKeys.set(key, award.id);
    }
    const current = terms.find(t => t.id === award.currentConfirmedTermsVersionId);
    requireAward(current && current.payload.effectiveDate && state.events.some(e => e.awardId === award.id && e.type === "terms_selected" && e.targetId === current.id), "Current terms lack an explicit applicable selection event.");
    let cursor: typeof current | undefined = current;
    const actions = new Map<string, typeof current>();
    while (cursor) {
      const descendant = actions.get(cursor.payload.sponsorActionId);
      if (descendant) requireAward(descendant.payload.changeKind === "transcription_correction", "Current lineage applies one sponsor action twice without an explicit correction.");
      actions.set(cursor.payload.sponsorActionId, cursor);
      cursor = terms.find(t => t.id === cursor!.baseTermsVersionId);
    }
    requireAward(state.changeCandidates.filter(c => c.awardId === award.id).length <= 20 && state.obligations.filter(i => i.awardId === award.id).length <= 100 && state.milestones.filter(i => i.awardId === award.id).length <= 50 && state.progressUpdates.filter(u => u.awardId === award.id).length <= 100 && state.reports.filter(r => r.awardId === award.id).length <= 20, "Award feature record limit exceeded.");
  }
  const awardFor = (id: string) => { const a = state.records.find(a => a.id === id); requireAward(a, "Orphaned award-owned record."); return a; };
  assertAcyclic(state.changeCandidates.map(c => c.id), id => { const prior = state.changeCandidates.find(c => c.id === id)?.supersedesCandidateId; return prior ? [prior] : []; });
  const retainedItems = [...state.obligations, ...state.milestones];
  assertAcyclic(retainedItems.map(i => i.id), id => retainedItems.find(i => i.id === id)?.revisions.flatMap(r => r.supersedesItemId ? [r.supersedesItemId] : []) ?? []);
  for (const origin of state.originSnapshots) requireAward(state.records.some(a => a.originContext.id === origin.id), "Orphaned award origin snapshot.");
  for (const t of state.termsVersions) awardFor(t.awardId);
  for (const c of state.changeCandidates) {
    const a = awardFor(c.awardId), base = state.termsVersions.find(t => t.id === c.baseTermsVersionId && t.awardId === a.id);
    requireAward(base, "Candidate base is missing.");
    validateTerms(c.payload, base, a.id, state, host, a.projectId, false, true);
    if (c.supersedesCandidateId) requireAward(state.changeCandidates.some(p => p.id === c.supersedesCandidateId && p.awardId === a.id && p.payload.sponsorActionId === c.payload.sponsorActionId && p.createdAt <= c.createdAt && p.id !== c.id), "Candidate correction lineage is invalid.");
    requireAward(c.decision === "confirmed" ? !!c.termsVersionId : c.termsVersionId === null, "Candidate decision/terms mismatch.");
  }
  for (const item of [...state.obligations, ...state.milestones]) {
    const a = awardFor(item.awardId);
    requireAward((state.obligations.includes(item) ? "obligation" : "milestone") === item.kind, "Award item collection/kind mismatch.");
    item.revisions.forEach((r, i) => {
      requireAward(r.ordinal === i + 1, "Item revision order is invalid.");
      const t = state.termsVersions.find(t => t.id === r.termsVersionId && t.awardId === a.id);
      requireAward(t && (!r.goalId || t.payload.goals.some(g => g.goalId === r.goalId)), "Item terms/goal reference is invalid.");
      requireAward(item.kind !== "milestone" || r.origin === "internal", "Milestone cannot be a sponsor obligation.");
      requireAward(r.origin !== "sponsor" || r.evidence.length, "Sponsor obligation has no evidence.");
      if (r.supersedesItemId) requireAward([...state.obligations, ...state.milestones].some(x => x.id === r.supersedesItemId && x.awardId === a.id && x.id !== item.id), "Superseded item is missing.");
      validateEvidence(r, host, a.projectId);
      if (r.derivation) {
        const p = t.payload.budgetPeriods.find(p => p.id === r.derivation!.periodId);
        requireAward(p && p.start === r.derivation.periodStart && p.end === r.derivation.periodEnd, "Derived target period reference is invalid.");
        const target = new Date(`${p.end}T00:00:00Z`); target.setUTCDate(target.getUTCDate() - 90);
        requireAward(r.derivation.proposedDate === target.toISOString().slice(0, 10), "Derived preparation date is invalid.");
        if (r.derivation.confirmed) requireAward(r.review === "confirmed" && r.deadline.kind === "date" && r.deadline.date === r.derivation.proposedDate, "Derived target must be explicitly confirmed with its date.");
      }
    });
  }
  for (const c of state.completions) {
    const a = awardFor(c.awardId);
    requireAward([...state.obligations, ...state.milestones].some(i => i.id === c.itemId && i.awardId === a.id && i.revisions.some(r => r.id === c.itemRevisionId)), "Completion item/revision reference is invalid.");
    requireAward(c.status !== "completed" || c.evidence.length, "Completion has no supporting evidence."); validateEvidence(c, host, a.projectId);
  }
  for (const u of state.progressUpdates) {
    awardFor(u.awardId);
    u.revisions.forEach((r, i) => { requireAward(r.ordinal === i + 1, "Progress revision order is invalid."); validateProgress(r, u.awardId, state, host); });
  }
  for (const report of state.reports) {
    awardFor(report.awardId);
    report.revisions.forEach((r, i) => {
      const { id: _id, digest: savedDigest, ...payload } = r;
      requireAward(r.reportId === report.id && r.ordinal === i + 1 && contentDigest(payload) === savedDigest, "Report aggregate digest/order is invalid.");
      validateReportContext(r.context, report.awardId, state, host);
      const sections = r.sectionRevisionIds.map(id => state.sectionRevisions.find(s => s.id === id && s.reportId === report.id));
      requireAward(sections.every(Boolean) && new Set(sections.map(s => s!.sectionKey)).size === SECTION_KEYS.length, "Report aggregate section graph is incomplete.");
      reportIssues(sections as NonNullable<typeof sections[number]>[], r.context, report.awardId, state, host);
    });
  }
  for (const s of state.sectionRevisions) requireAward(state.reports.some(r => r.id === s.reportId && r.revisions.some(v => v.sectionRevisionIds.includes(s.id))), "Orphaned section revision.");
  for (const review of state.sectionReviews) {
    const r = state.reports.find(r => r.id === review.reportId)?.revisions.find(r => r.id === review.reportRevisionId);
    const section = state.sectionRevisions.find(s => s.id === review.sectionRevisionId);
    requireAward(r && section && r.sectionRevisionIds.includes(section.id) && sectionFingerprint(r, section) === review.fingerprint, "Review fingerprint/reference is invalid.");
  }
  for (const snapshot of state.reportSnapshots) {
    awardFor(snapshot.awardId); validateFrozenReport(snapshot);
    requireAward(state.reports.some(r => r.id === snapshot.reportId && r.awardId === snapshot.awardId && r.revisions.some(v => v.id === snapshot.reportRevisionId)), "Snapshot report revision reference is invalid.");
  }
  const owner = new Map<string, string>();
  state.records.forEach(a => { owner.set(a.id, a.id); owner.set(a.originContext.id, a.id); });
  for (const list of [state.termsVersions, state.changeCandidates, state.obligations, state.milestones, state.completions, state.progressUpdates, state.reports, state.reportSnapshots, state.events]) for (const item of list) owner.set(item.id, item.awardId);
  for (const item of retainedItems) item.revisions.forEach(r => owner.set(r.id, item.awardId));
  for (const u of state.progressUpdates) u.revisions.forEach(r => owner.set(r.id, u.awardId));
  for (const report of state.reports) { report.revisions.forEach(r => owner.set(r.id, report.awardId)); state.sectionRevisions.filter(s => s.reportId === report.id).forEach(s => owner.set(s.id, report.awardId)); state.sectionReviews.filter(r => r.reportId === report.id).forEach(r => owner.set(r.id, report.awardId)); }
  for (const event of state.events) { awardFor(event.awardId); requireAward(owner.get(event.targetId) === event.awardId, "Event target is missing or belongs to another award."); }
  for (const receipt of state.receipts) { awardFor(receipt.awardId); requireAward(receipt.resultIds.every(id => owner.get(id) === receipt.awardId), "Receipt result reference is missing or belongs to another award."); }
  return state;
}

export function assertAwardResetSafe(state: AwardsState, removedSourceIds: readonly string[], removedApplicationIds: readonly string[]) {
  const removed = new Set(removedSourceIds);
  for (const award of state.records) {
    const snapshot = state.reportSnapshots.some(s => s.awardId === award.id);
    if (award.provenance !== "demo" || snapshot) {
      requireAward(!removedApplicationIds.includes(award.applicationId), "Reset would delete an application referenced by an award/report. Preserve its dependencies.", 409);
      const graph = { origin: state.originSnapshots.find(o => o.id === award.originContext.id),
        terms: state.termsVersions.filter(t => t.awardId === award.id), updates: state.progressUpdates.filter(u => u.awardId === award.id),
        items: [...state.obligations, ...state.milestones].filter(i => i.awardId === award.id), snapshots: state.reportSnapshots.filter(s => s.awardId === award.id) };
      requireAward(!collectSourceRefs(graph).some(r => removed.has(r.sourceId)), "Reset would delete evidence referenced by an award/report. Preserve the dependency or cancel reset.", 409);
    }
  }
}
