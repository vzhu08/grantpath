import { FIELD_NAMES, TermsPayloadSchema, type AwardsState, type AwardFinanceContextV1, type AwardTermsVersion, type TermsPayload } from "./schema";
import { canonicalJson, contentDigest } from "./canonical";
import { type AwardHost, requireAward, validateEvidence, validateSourceRef, collectSourceRefs, refKey } from "./context";
import { externalAwardKey } from "./identity";

export function validateTerms(payload: TermsPayload, base: AwardTermsVersion | null, awardId: string,
  state: AwardsState, host: AwardHost, projectId: string, latestRequired = false, historical = false) {
  TermsPayloadSchema.parse(payload);
  const actionKey = payload.sponsorIdentifier?.trim().toLocaleUpperCase("en-US");
  if (actionKey) for (const other of [...state.termsVersions.filter(t => t.awardId === awardId).map(t => t.payload), ...state.changeCandidates.filter(c => c.awardId === awardId).map(c => c.payload)])
    requireAward(other.sponsorIdentifier?.trim().toLocaleUpperCase("en-US") !== actionKey || other.sponsorActionId === payload.sponsorActionId, "This sponsor identifier already maps to a different action ID. Reuse the original action identity.");
  validateEvidence(payload, host, projectId);
  for (const ref of payload.sourceRefs) {
    const { source } = validateSourceRef(ref, host, projectId);
    if (latestRequired && source.versions.at(-1)!.version !== ref.version)
      requireAward(payload.historicalSourceReviews.some(r => r.sourceId === ref.sourceId && r.version === ref.version && r.latestVersion === source.versions.at(-1)!.version), "A selected source changed. Review the newer text and give an explicit historical-version reason.", 409);
  }
  const refs = new Set(payload.sourceRefs.map(r => `${r.sourceId}:${r.version}:${r.hash}`));
  requireAward(refs.size === payload.sourceRefs.length, "Terms source selections must be unique.");
  for (const ref of collectSourceRefs({ dateEvidence: payload.dateEvidence, identity: payload.identity, awardPeriod: payload.awardPeriod,
    budgetPeriods: payload.budgetPeriods, goals: payload.goals, fundingFacts: payload.fundingFacts, approvedBudgetRefs: payload.approvedBudgetRefs,
    policies: payload.policies, sponsorLifecycle: payload.sponsorLifecycle, fieldEvidence: payload.fieldEvidence }))
    requireAward(refs.has(refKey(ref)), "Every quoted/carried source version must be in the reviewed terms selection.");
  // Every new quote must be in the explicit reviewed source selection.
  for (const field of FIELD_NAMES) {
    const support = payload.fieldEvidence[field];
    if (support.mode === "carry_forward") {
      requireAward(base && support.termsVersionId === base.id && support.field === field,
        "Carried terms must identify the exact base field.");
      requireAward(canonicalJson(payload[field]) === canonicalJson(base.payload[field]), "A carried field changed. Supply new evidence instead.");
      if (field === "fundingFacts" && payload.sponsorActionId !== base.payload.sponsorActionId)
        requireAward(!payload.fundingFacts.some(f => f.basis === "current_action"), "Current-action money cannot carry to a different sponsor action.");
    } else if (support.mode === "new") {
      for (const c of support.citations) requireAward(refs.has(`${c.sourceId}:${c.version}:${c.hash}`), "Review every newly cited source in the terms selection.");
    } else {
      const v = payload[field];
      requireAward(field !== "identity", "Award identity cannot be unknown when confirmed.");
      requireAward(v === null || Array.isArray(v) && (v.length === 0 || field === "fundingFacts" && payload.fundingFacts.every(f => f.value.state === "unknown")) || field === "sponsorLifecycle" && payload.sponsorLifecycle.value === "unknown", "An unknown field cannot contain confirmed values.");
    }
  }
  const periods = [...payload.budgetPeriods].sort((a, b) => a.start.localeCompare(b.start));
  const periodIds = new Set<string>();
  periods.forEach((p, i) => {
    requireAward(!periodIds.has(p.id), "Budget period IDs must be unique."); periodIds.add(p.id);
    requireAward(!i || periods[i - 1]!.end < p.start, "Active budget periods overlap. Resolve the sponsor interpretation first.");
    if (payload.awardPeriod) requireAward(p.start >= payload.awardPeriod.start && p.end <= payload.awardPeriod.end, "Budget period lies outside the award period.");
    for (const t of state.termsVersions.filter(t => t.awardId === awardId)) {
      const prior = t.payload.budgetPeriods.find(x => x.id === p.id);
      requireAward(!prior || prior.start === p.start && prior.end === p.end, "Changed period boundaries require a new period ID.");
      requireAward(!prior || prior.supersedesPeriodId === p.supersedesPeriodId, "A period's introduction lineage cannot change under the same ID.");
    }
    const inherited = base?.payload.budgetPeriods.some(x => x.id === p.id && x.start === p.start && x.end === p.end && x.supersedesPeriodId === p.supersedesPeriodId);
    if (p.supersedesPeriodId && !inherited) requireAward(base?.payload.budgetPeriods.some(x => x.id === p.supersedesPeriodId && x.id !== p.id), "A newly introduced period's predecessor must exist in the base terms.");
  });
  requireAward(new Set(payload.goals.map(g => g.goalId)).size === payload.goals.length, "Goal IDs must be unique.");
  for (const g of payload.goals) {
    const inherited = base?.payload.goals.some(x => x.goalId === g.goalId && x.text === g.text && canonicalJson(x.predecessorGoalIds) === canonicalJson(g.predecessorGoalIds));
    if (!inherited) for (const old of g.predecessorGoalIds)
      requireAward(base?.payload.goals.some(x => x.goalId === old), "A newly introduced goal's predecessor is missing from base terms.");
    for (const prior of state.termsVersions.filter(t => t.awardId === awardId).flatMap(t => t.payload.goals)) {
      requireAward(prior.goalId !== g.goalId || prior.text === g.text, "Changed or split goals require a new goal ID with predecessor links.");
      requireAward(prior.goalId !== g.goalId || canonicalJson(prior.predecessorGoalIds) === canonicalJson(g.predecessorGoalIds), "A goal's introduction lineage cannot change under the same ID.");
    }
  }
  const moneyKeys = new Set<string>();
  for (const f of payload.fundingFacts) {
    const key = `${f.basis}:${f.periodId}`;
    requireAward(!moneyKeys.has(key), "Resolve conflicting money facts for the same basis and period."); moneyKeys.add(key);
    requireAward(!f.periodId || periodIds.has(f.periodId), "Money fact references an unknown budget period.");
    if (f.basis === "current_action" && base && payload.sponsorActionId !== base.payload.sponsorActionId)
      requireAward(!base.payload.fundingFacts.some(old => old.id === f.id), "A new sponsor action needs its own action fact, or an explicit unknown.");
    if (f.basis === "current_action" && f.value.state === "known" && base && payload.sponsorActionId !== base.payload.sponsorActionId) {
      const oldQuotes = new Set(state.termsVersions.filter(t => t.awardId === awardId && t.payload.sponsorActionId !== payload.sponsorActionId)
        .flatMap(t => t.payload.fundingFacts.filter(x => x.basis === "current_action").flatMap(x => x.evidence.map(c => `${refKey(c)}:${c.start}:${c.end}`))));
      requireAward(f.evidence.some(c => !oldQuotes.has(`${refKey(c)}:${c.start}:${c.end}`)), "New action money needs new action support; relabeling the prior action's quoted amount is insufficient.");
    }
  }
  if (base) {
    const oldIdentity = externalAwardKey(base.payload.identity.sponsorAwardNumber, base.payload.identity.recipientName);
    const newIdentity = externalAwardKey(payload.identity.sponsorAwardNumber, payload.identity.recipientName);
    requireAward(oldIdentity === newIdentity || payload.changeKind === "transcription_correction", "A different award or recipient cannot replace this record. Use a source-backed transcription correction only for the same award.");
    const applied = state.termsVersions.filter(t => t.awardId === awardId && t.payload.sponsorActionId === payload.sponsorActionId);
    if (!historical) requireAward(!applied.length || payload.changeKind === "transcription_correction" || applied.every(t => !state.events.some(e => e.type === "terms_selected" && e.targetId === t.id)), "This sponsor action was already applied. Record an explicit correction, not another amendment.");
    if (payload.changeKind === "transcription_correction") requireAward(applied.length > 0, "A correction must retain the existing sponsor action identity.");
  }
}
export function awardFinanceContext(state: AwardsState, awardId: string): AwardFinanceContextV1 {
  const award = state.records.find(a => a.id === awardId);
  requireAward(award, "Award not found.", 404);
  const terms = state.termsVersions.find(t => t.id === award.currentConfirmedTermsVersionId && t.awardId === award.id);
  requireAward(terms && terms.digest === contentDigest(terms.payload), "Current confirmed terms are missing or corrupt.");
  const p = terms.payload;
  const unresolved = [...p.unresolved, ...Object.values(p.fieldEvidence).flatMap(f => f.mode === "unknown" ? [f.reason] : []),
    ...(["current_action", "obligated_cumulative", "anticipated_total"] as const).flatMap(basis => p.fundingFacts.some(f => f.basis === basis) ? [] : [`${basis}: not supplied; no value or balance inferred.`]),
    ...p.fundingFacts.flatMap(f => f.value.state === "unknown" ? [`${f.basis}: ${f.value.reason}`] : [])];
  return structuredClone({ contractVersion: "award-contract-v1", awardId, applicationId: award.applicationId, projectId: award.projectId,
    currentConfirmedTermsVersionId: terms.id, currentTermsDigest: terms.digest, sponsorLifecycle: p.sponsorLifecycle.value,
    awardPeriod: p.awardPeriod ? { start: p.awardPeriod.start, end: p.awardPeriod.end } : null, budgetPeriods: p.budgetPeriods,
    proposedContextRef: award.originContext, fundingFacts: p.fundingFacts, approvedBudgetRefs: p.approvedBudgetRefs,
    unresolved: [...new Set(unresolved)], confirmedBy: terms.confirmedBy, confirmedAt: terms.confirmedAt });
}
