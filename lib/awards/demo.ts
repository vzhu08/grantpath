import { createResubmissionDemoWorkspace } from "../resubmissions/demo";
import { applyCommand, validateWorkspace } from "../repository";
import { cite, newSource } from "../evidence";
import { assembleWorksheet } from "./reporting";
import { FIELD_NAMES, SECTION_KEYS, type MoneyFactV1, type TermsPayload } from "./schema";
import type { AwardCommand } from "./commands";

/** Explicit synthetic acceptance/rehearsal data. Never reads or seeds a user's store. */
export function createAwardDemoWorkspace(includeAward = true) {
  let state = createResubmissionDemoWorkspace().state;
  const applicationId = "resubmission-demo-original", projectId = state.applications.find(a => a.id === applicationId)!.projectId;
  const actor = "Synthetic example researcher", at = "2026-10-25T12:00:00.000Z";
  const notice = newSource({ id: "award-demo-notice", projectId, title: "Synthetic NSF award notice", type: "other", provenance: "demo",
    text: "SYNTHETIC NOTICE — no real award.\nAward number: NSF-DEMO-240\nRecipient: Example University\nIssue date: 2026-01-01\nEffective date: 2026-01-01\nAward start: 2026-01-01\nAward end: 2026-12-31\nBudget period: 2026-01-01 through 2026-12-31\nCurrent action: USD 240000.00\nCumulative obligation: USD 240000.00\nApproved goals: Run experiment A; run experiment B; run experiment C.\nAnnual narrative preparation is required. Confirm the applicable reporting date and full conditions with the actual award before real use." });
  const proposal = newSource({ id: "award-demo-request", projectId, title: "Synthetic proposed request", type: "other", provenance: "demo", text: "SYNTHETIC PROPOSAL CONTEXT: the proposal requested USD 300000.00. This requested amount is not an approved award amount or a performance result." });
  const output = newSource({ id: "award-demo-output", projectId, title: "Synthetic dated research log", type: "other", provenance: "demo", text: "SYNTHETIC RESEARCHER LOG. Observed 2026-10-01: Experiment A completed with an inconclusive result. Experiment B is delayed because supplies are missing; the recovery plan is to repeat it next month. No actual update has been recorded for experiment C." });
  const amendment = newSource({ id: "award-demo-amendment", projectId, title: "Synthetic documented extension", type: "other", provenance: "demo", text: "SYNTHETIC DOCUMENTED ADMINISTRATIVE EXTENSION. Issued and effective 2026-10-20. The recorded award end date is extended to 2027-03-31. The budget period, approved scope and cumulative obligation USD 240000.00 remain unchanged. This action supplies no action amount or additional money; it is not merely a request." });
  state.sources.push(notice, proposal, output, amendment);
  const q = cite(notice, notice.versions[0]!.text), pq = cite(proposal, proposal.versions[0]!.text), oq = cite(output, output.versions[0]!.text), aq = cite(amendment, amendment.versions[0]!.text);
  const ref = (source: typeof notice, role: string) => ({ sourceId: source.id, version: 1, hash: source.versions[0]!.hash, role });
  const fact = (id: string, basis: MoneyFactV1["basis"], minorUnits: string, evidence = [q]): MoneyFactV1 => ({ id, basis,
    value: { state: "known", currency: "USD", scale: 2, minorUnits }, evidence, periodId: null, confirmedBy: actor, confirmedAt: at });
  const quoted = { mode: "new" as const, citations: [q] }, unknown = (reason: string) => ({ mode: "unknown" as const, reason });
  const payload: TermsPayload = { sponsorActionId: "award-demo-initial-action", changeKind: "initial", sponsorIdentifier: "Initial synthetic notice", absenceReason: "",
    issueDate: "2026-01-01", effectiveDate: "2026-01-01", dateEvidence: [q],
    identity: { sponsor: "NSF", instrument: "standard_grant", sponsorAwardNumber: "NSF-DEMO-240", recipientName: "Example University", evidence: [q] },
    awardPeriod: { start: "2026-01-01", end: "2026-12-31", evidence: [q] }, budgetPeriods: [{ id: "award-demo-year-1", label: "Synthetic budget year 1", start: "2026-01-01", end: "2026-12-31", evidence: [q], supersedesPeriodId: null }],
    goals: ["A", "B", "C"].map(letter => ({ goalId: `award-demo-goal-${letter}`, text: `Run experiment ${letter}`, citations: [q], incorporationRef: null, predecessorGoalIds: [] })),
    fundingFacts: [fact("award-demo-action-money", "current_action", "24000000"), fact("award-demo-cumulative", "obligated_cumulative", "24000000")], approvedBudgetRefs: [], policies: [], sponsorLifecycle: { value: "unknown", evidence: [] },
    fieldEvidence: { identity: quoted, awardPeriod: quoted, budgetPeriods: quoted, goals: quoted, fundingFacts: quoted,
      approvedBudgetRefs: unknown("Approved category budget not supplied"), policies: unknown("Full applicable conditions need actual award review"), sponsorLifecycle: unknown("No sponsor lifecycle assertion supplied") },
    sourceRefs: [ref(notice, "notice")], historicalSourceReviews: [], unresolved: ["Synthetic example only; full conditions, category budget and portal fields remain unverified."] };
  const app = state.applications.find(a => a.id === applicationId)!;
  const initialCommand: AwardCommand = { type: "confirmInitialAward", applicationId, expectedApplicationRevision: app.revision,
    expectedProjectRevision: state.projects.find(p => p.id === projectId)!.revision, payload,
    originSelection: { draftIds: app.sections.map(s => s.revisions.at(-1)!.id), proposedMoneyFacts: [fact("award-demo-requested", "proposal_requested", "30000000", [pq])], packetId: null,
      submissionSnapshotId: state.resubmissions.snapshots.find(s => s.originalApplicationId === applicationId)!.id, submissionEvidence: { state: "unknown" } },
    selectInitialCurrent: true, transcriptionConfirmed: true, actor, reason: "Reviewed the exact synthetic notice and selected initial applicable terms locally." };
  let sequence = 0;
  function run(action: AwardCommand, operationId = `award-demo-operation-${++sequence}`) {
    const result = applyCommand(state, { expectedRevision: state.revision, command: { type: "awardMutation", operationId, action } });
    state = result.state; return result.resultIds!;
  }
  const bind = () => ({ awardId: state.awards.records[0]!.id, expectedAwardRevision: state.awards.records[0]!.revision });
  if (includeAward) {
    run(initialCommand, "award-demo-initial");
    const head = state.awards.records[0]!.currentConfirmedTermsVersionId;
    const item = run({ type: "saveAwardObligation", ...bind(), itemId: null, expectedItemRevisionId: null, actor, reason: "Review the quoted annual narrative task and local preparation date.",
      input: { termsVersionId: head, title: "Prepare annual narrative worksheet", description: "Confirm actual award instructions before real use.", responsibility: actor,
        deadline: { kind: "date", raw: "Synthetic preparation target 2026-10-24", date: "2026-10-24", confirmed: true }, evidence: [q], origin: "sponsor", review: "proposed", applicable: true, supersedesItemId: null, goalId: null, derivation: null } });
    run({ type: "reviewAwardObligation", ...bind(), itemId: item[0]!, expectedItemRevisionId: item[1]!, actor, reason: "Confirmed only as a synthetic local preparation item." });
    for (const [letter, status, finding, text] of [["A", "completed", "inconclusive", "Experiment A completed; the finding was inconclusive."], ["B", "delayed", "none_reported", "Experiment B remains unfinished."]] as const)
      run({ type: "saveAwardProgress", ...bind(), updateId: null, expectedProgressRevisionId: null, actor, reason: "Reviewed exact synthetic researcher-reported activity.", input: { termsVersionId: head, goalIds: [`award-demo-goal-${letter}`], itemIds: [], startDate: "2026-10-01", endDate: "2026-10-01", observedDate: "2026-10-01", state: status, finding,
        factualText: text, delayReason: status === "delayed" ? "Supplies missing." : "", recoveryPlan: status === "delayed" ? "Repeat next month; this is future work." : "", nextPlan: "", evidence: [oq], evidenceKind: "researcher_log", correctionReason: "", allocation: null } });
    const context = { termsVersionId: head, termsDigest: state.awards.termsVersions[0]!.digest, periodId: "award-demo-year-1", periodStart: "2026-01-01", periodEnd: "2026-12-31", evidenceThrough: "2026-10-25", asOfDate: "2026-10-25",
      progressRefs: state.awards.progressUpdates.map(u => ({ updateId: u.id, revisionId: u.revisions.at(-1)!.id })), sourceRefs: [ref(notice, "notice"), ref(output, "actual progress")], historicalSourceReviews: [] };
    const sections = assembleWorksheet(state.awards, bind().awardId, context, state), { asOfDate: _, ...reportContext } = context;
    const [reportId, reportRevisionId] = run({ type: "saveAnnualReport", ...bind(), reportId: null, expectedReportRevisionId: null, context: reportContext,
      sections: SECTION_KEYS.map(sectionKey => ({ sectionKey, blocks: sections[sectionKey], mode: "deterministic" })), actor, reason: "Save an honest annual worksheet with the third experiment and portal inputs missing." });
    for (const sectionRevisionId of state.awards.reports[0]!.revisions[0]!.sectionRevisionIds) run({ type: "reviewAnnualSection", ...bind(), reportId: reportId!, reportRevisionId: reportRevisionId!, sectionRevisionId, decision: "reviewed", actor, reason: "Reviewed this exact saved section and its disclosed gaps; no sponsor certification." });
    run({ type: "freezeAnnualReport", ...bind(), reportId: reportId!, reportRevisionId: reportRevisionId!, actor, reason: "Freeze the reviewed draft with gaps for reproducible local export." }, "award-demo-freeze");
  }
  function extensionPayload(baseId: string, workspace = state): TermsPayload {
    const current = workspace.awards.termsVersions.find(t => t.id === baseId)!, next = structuredClone(current.payload);
    next.sponsorActionId = "award-demo-extension-action"; next.changeKind = "documented_administrative_change"; next.sponsorIdentifier = null;
    next.absenceReason = "Synthetic recorded administrative extension without a numbered amendment."; next.issueDate = "2026-10-20"; next.effectiveDate = "2026-10-20"; next.dateEvidence = [aq];
    next.awardPeriod = { start: "2026-01-01", end: "2027-03-31", evidence: [aq] }; next.fundingFacts = next.fundingFacts.filter(f => f.basis !== "current_action");
    for (const field of FIELD_NAMES) next.fieldEvidence[field] = { mode: "carry_forward", termsVersionId: baseId, field };
    next.fieldEvidence.awardPeriod = { mode: "new", citations: [aq] }; next.fieldEvidence.fundingFacts = { mode: "new", citations: [aq] };
    next.sourceRefs.push(ref(amendment, "documented administrative extension")); return next;
  }
  return { state: validateWorkspace(state), initialCommand, applicationId, projectId, noticeId: notice.id, outputId: output.id, amendmentId: amendment.id, proposalId: proposal.id,
    extensionPayload, snapshotId: state.awards.reportSnapshots[0]?.id, reportId: state.awards.reports[0]?.id };
}
