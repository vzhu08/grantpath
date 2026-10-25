import { randomUUID } from "node:crypto";
import { localDate } from "../dates";
import { AwardMutationSchema, type AwardMutation } from "./commands";
import { type AwardsState, type OriginPayload, type AwardRecord, type AwardTermsVersion, type SectionRevision,
  SECTION_KEYS, OriginPayloadSchema, SectionRevisionSchema } from "./schema";
import { contentDigest, boundedSnapshot } from "./canonical";
import { requireAward, validateEvidence, validateSourceRef, type AwardHost, collectSourceRefs, refKey } from "./context";
import { externalAwardKey, type OriginSelection } from "./identity";
import { validateTerms } from "./terms";
import { validateProgress } from "./progress";
import { validateReportContext, reportIssues, sectionFingerprint, blockIssues, buildReportSnapshot } from "./reporting";
import { validateAwardsIntegrity } from "./integrity";
import { ANNUAL_TEMPLATE } from "./templates";

export type AwardRuntime = { now?: Date; uid?: (prefix: string) => string;
  captureOrigin: (applicationId: string, selection: OriginSelection, at: string) => OriginPayload };
export type AwardMutationResult = { awards: AwardsState; resultIds: string[]; awardId: string; replayed: boolean };

/** Pure transaction. Repository must commit awards + receipt + workspace revision atomically. */
export function applyAwardMutation(saved: AwardsState, host: AwardHost, raw: unknown, runtime: AwardRuntime): AwardMutationResult {
  const input: AwardMutation = AwardMutationSchema.parse(raw);
  const c = input.command;
  const payloadHash = contentDigest(c); // Never trust a browser hash; expected record/head IDs ARE semantic.
  const receipt = saved.receipts.find(r => r.operationId === input.operationId);
  if (receipt) {
    requireAward(receipt.payloadHash === payloadHash, "This operation ID was already used with different content. Reconcile before using a new operation ID.", 409);
    return { awards: saved, resultIds: [...receipt.resultIds], awardId: receipt.awardId, replayed: true };
  }
  requireAward(host.revision === input.expectedRevision, "A newer save exists. Your editor is preserved; reload saved data and reconcile before retrying.", 409);
  const state = structuredClone(saved);
  const now = runtime.now ?? new Date(), at = now.toISOString(), today = localDate(now);
  const uid = runtime.uid ?? (prefix => `${prefix}-${randomUUID()}`);
  let award: AwardRecord;
  let resultIds: string[] = [];
  const event = (type: string, targetId: string) => state.events.push({ id: uid("award-event"), awardId: award.id, type, targetId, actor: c.actor, at, reason: c.reason });
  const duplicateIdentity = (payload: AwardTermsVersion["payload"], ownId: string) => {
    const key = externalAwardKey(payload.identity.sponsorAwardNumber, payload.identity.recipientName);
    requireAward(!state.records.some(a => a.id !== ownId && state.termsVersions.some(t => t.awardId === a.id && externalAwardKey(t.payload.identity.sponsorAwardNumber, t.payload.identity.recipientName) === key)), "This sponsor award number and recipient already belong to another application.", 409);
  };
  if (c.type === "confirmInitialAward") {
    const app = host.applications.find(a => a.id === c.applicationId);
    const project = host.projects.find(p => p.id === app?.projectId);
    requireAward(app && project, "Select a saved application and its project.");
    requireAward(app.revision === c.expectedApplicationRevision && project.revision === c.expectedProjectRevision, "Originating application/project changed. Review the current saved proposal before confirming.", 409);
    requireAward(!state.records.some(a => a.applicationId === app.id), "This application already has an award, including archived records.", 409);
    requireAward(c.payload.changeKind === "initial" && c.payload.effectiveDate && c.payload.effectiveDate <= today, "Initial confirmation needs a known in-force notice effective date. Keep future/unknown notices in intake.");
    const awardId = uid("award");
    duplicateIdentity(c.payload, awardId);
    validateTerms(c.payload, null, awardId, state, host, project.id, true);
    const originPayload = OriginPayloadSchema.parse(runtime.captureOrigin(app.id, c.originSelection, at));
    requireAward(originPayload.applicationId === app.id && originPayload.projectId === project.id && originPayload.applicationRevision === app.revision && originPayload.projectRevision === project.revision, "Server origin capture does not match this application/project revision.");
    boundedSnapshot(originPayload);
    const origin = { id: uid("award-origin"), digest: contentDigest(originPayload), payload: originPayload };
    const terms: AwardTermsVersion = { id: uid("award-terms"), awardId, ordinal: 1, baseTermsVersionId: null, candidateId: null,
      payload: c.payload, digest: contentDigest(c.payload), confirmedBy: c.actor, confirmedAt: at, note: c.reason };
    award = { id: awardId, applicationId: app.id, projectId: project.id, provenance: app.provenance, localState: "recorded",
      originContext: { id: origin.id, digest: origin.digest }, currentConfirmedTermsVersionId: terms.id, revision: 1, createdAt: at, updatedAt: at };
    state.records.push(award); state.originSnapshots.push(origin); state.termsVersions.push(terms);
    event("initial_confirmed", terms.id); event("terms_selected", terms.id); resultIds = [award.id, terms.id, origin.id];
  } else {
    const found = state.records.find(a => a.id === c.awardId);
    requireAward(found, "Award not found.", 404); award = found;
    requireAward(award.revision === c.expectedAwardRevision, "Award changed. Preserve the editor and reconcile the newer record.", 409);
    requireAward(award.localState === "recorded", "Archived awards preserve history and cannot be edited.", 409);
    const head = state.termsVersions.find(t => t.id === award.currentConfirmedTermsVersionId)!;
    if ("expectedHeadId" in c) requireAward(c.expectedHeadId === head.id, "Current terms changed. Reconcile against the actual current head.", 409);
    if (c.type === "saveAwardChangeCandidate") {
      requireAward(state.changeCandidates.filter(x => x.awardId === award.id).length < 20, "This award has 20 change candidates. Keep the editor and reduce scope explicitly.");
      requireAward(c.payload.changeKind !== "initial", "An amendment cannot be another initial notice.");
      validateTerms(c.payload, head, award.id, state, host, award.projectId);
      const sameAction = state.changeCandidates.filter(x => x.awardId === award.id && x.payload.sponsorActionId === c.payload.sponsorActionId);
      requireAward(!sameAction.length || c.supersedesCandidateId, "This action already has an interpretation. Select it or identify the candidate being reconciled.", 409);
      if (c.supersedesCandidateId) {
        const prior = state.changeCandidates.find(x => x.id === c.supersedesCandidateId && x.awardId === award.id);
        requireAward(prior && prior.payload.sponsorActionId === c.payload.sponsorActionId, "A reconciled interpretation must retain the original sponsor action identity.");
      }
      const candidate = { id: uid("award-change"), awardId: award.id, baseTermsVersionId: head.id, supersedesCandidateId: c.supersedesCandidateId,
        payload: c.payload, createdAt: at, createdBy: c.actor, decision: "proposed" as const, termsVersionId: null };
      state.changeCandidates.push(candidate); event("change_proposed", candidate.id); resultIds = [candidate.id];
    } else if (c.type === "reviewAwardChange") {
      const candidate = state.changeCandidates.find(x => x.id === c.candidateId && x.awardId === award.id);
      requireAward(candidate && candidate.decision === "proposed", "Select an unreviewed change candidate.", 409);
      requireAward(candidate.baseTermsVersionId === head.id, "Candidate was based on older terms. Create and review a reconciled candidate; refreshing expected head is insufficient.", 409);
      if (c.decision === "confirmed") {
        requireAward(state.termsVersions.filter(t => t.awardId === award.id).length < 20, "This award has 20 terms versions.");
        requireAward(candidate.payload.changeKind !== "transcription_correction" || c.sameAwardConfirmed, "Confirm that this is a transcription correction for the same real award and recipient.");
        validateTerms(candidate.payload, head, award.id, state, host, award.projectId, true);
        duplicateIdentity(candidate.payload, award.id);
        const terms: AwardTermsVersion = { id: uid("award-terms"), awardId: award.id, ordinal: state.termsVersions.filter(t => t.awardId === award.id).length + 1,
          baseTermsVersionId: candidate.baseTermsVersionId, candidateId: candidate.id, payload: candidate.payload,
          digest: contentDigest(candidate.payload), confirmedBy: c.actor, confirmedAt: at, note: c.reason };
        state.termsVersions.push(terms); candidate.termsVersionId = terms.id; resultIds = [candidate.id, terms.id];
      } else resultIds = [candidate.id];
      candidate.decision = c.decision; event(`change_${c.decision}`, candidate.id);
    } else if (c.type === "selectCurrentAwardTerms") {
      const terms = state.termsVersions.find(t => t.id === c.termsVersionId && t.awardId === award.id);
      const candidate = state.changeCandidates.find(x => x.id === terms?.candidateId && x.decision === "confirmed");
      requireAward(terms && candidate && terms.baseTermsVersionId === head.id && candidate.baseTermsVersionId === head.id, "This interpretation does not extend the actual current head. Create a new reconciled candidate.", 409);
      requireAward(terms.payload.effectiveDate && terms.payload.effectiveDate <= today, "Future or unknown-effective terms cannot become current.");
      if (terms.payload.effectiveDate < today) requireAward(c.retroactivePeriodsReviewed, "Review affected periods before adopting a retroactive interpretation.");
      validateTerms(terms.payload, head, award.id, state, host, award.projectId, true);
      duplicateIdentity(terms.payload, award.id);
      award.currentConfirmedTermsVersionId = terms.id; event("terms_selected", terms.id); resultIds = [terms.id];
    } else if (c.type === "saveAwardObligation" || c.type === "saveAwardMilestone") {
      const list = c.type === "saveAwardObligation" ? state.obligations : state.milestones;
      const kind = c.type === "saveAwardObligation" ? "obligation" as const : "milestone" as const;
      let item = c.itemId ? list.find(i => i.id === c.itemId && i.awardId === award.id) : undefined;
      requireAward(!c.itemId || item, "Item does not belong to this award.");
      requireAward((item?.revisions.at(-1)?.id ?? null) === c.expectedItemRevisionId, "Item was edited. Reconcile the current revision.", 409);
      requireAward(item || list.filter(i => i.awardId === award.id).length < (kind === "obligation" ? 100 : 50), "Award item limit reached.");
      requireAward(kind !== "milestone" || c.input.origin === "internal", "Milestones are internal planning targets.");
      requireAward(c.input.review === "proposed", "Save the item as proposed; confirm it with a separate human review.");
      const terms = state.termsVersions.find(t => t.id === c.input.termsVersionId && t.awardId === award.id);
      requireAward(terms, "Pin this award's confirmed terms.");
      if (c.input.goalId) requireAward(terms.payload.goals.some(g => g.goalId === c.input.goalId), "The selected goal is absent from these terms.");
      if (c.input.origin === "sponsor") requireAward(c.input.evidence.length, "Sponsor obligations require exact term evidence.");
      validateEvidence(c.input, host, award.projectId);
      const revision = { ...c.input, id: uid("award-item-revision"), ordinal: (item?.revisions.length ?? 0) + 1, actor: c.actor, at };
      if (!item) { item = { id: uid(`award-${kind}`), awardId: award.id, kind, revisions: [] }; list.push(item); }
      item.revisions.push(revision); event("item_saved", item.id); resultIds = [item.id, revision.id];
    } else if (c.type === "reviewAwardObligation") {
      const item = [...state.obligations, ...state.milestones].find(i => i.id === c.itemId && i.awardId === award.id);
      const prior = item?.revisions.at(-1);
      requireAward(item && prior && prior.id === c.expectedItemRevisionId, "Item changed. Review the current revision.", 409);
      requireAward(prior.termsVersionId === head.id, "Item pins older terms. Save a reconciled item revision before confirming.", 409);
      validateEvidence(prior, host, award.projectId);
      if (prior.origin === "sponsor") requireAward(prior.evidence.length, "Sponsor obligation requires exact support.");
      const revision = { ...prior, id: uid("award-item-revision"), ordinal: item.revisions.length + 1, review: "confirmed" as const, actor: c.actor, at };
      if (revision.derivation) revision.derivation = { ...revision.derivation, confirmed: true };
      item.revisions.push(revision); event("item_confirmed", item.id); resultIds = [item.id, revision.id];
    } else if (c.type === "recordAwardCompletion") {
      const item = [...state.obligations, ...state.milestones].find(i => i.id === c.input.itemId && i.awardId === award.id);
      requireAward(item?.revisions.at(-1)?.id === c.input.itemRevisionId, "Completion must pin the current item revision.", 409);
      requireAward(c.input.actualDate <= today, "Future work cannot be completed today.");
      if (c.input.status === "completed") requireAward(c.input.evidence.length > 0, "Completion requires supporting evidence and a human assertion.");
      validateEvidence(c.input, host, award.projectId);
      const completion = { ...c.input, id: uid("award-completion"), awardId: award.id, actor: c.actor, at };
      state.completions.push(completion); event("completion_recorded", completion.id); resultIds = [completion.id];
    } else if (c.type === "saveAwardProgress") {
      let update = c.updateId ? state.progressUpdates.find(u => u.id === c.updateId && u.awardId === award.id) : undefined;
      requireAward(!c.updateId || update, "Progress update belongs to another award or is missing.");
      requireAward((update?.revisions.at(-1)?.id ?? null) === c.expectedProgressRevisionId, "Progress changed. Preserve your correction and reconcile.", 409);
      requireAward(update || state.progressUpdates.filter(u => u.awardId === award.id).length < 100, "Award progress limit reached.");
      if (update) requireAward(c.input.correctionReason.trim(), "Explain the correction; the original revision remains in history.");
      const revision = { ...c.input, id: uid("award-progress-revision"), ordinal: (update?.revisions.length ?? 0) + 1, author: c.actor, at };
      if (revision.allocation) revision.allocation = { ...revision.allocation, actor: c.actor, at };
      validateProgress(revision, award.id, state, host);
      if (!update) { update = { id: uid("award-progress"), awardId: award.id, revisions: [] }; state.progressUpdates.push(update); }
      update.revisions.push(revision); event("progress_saved", update.id); resultIds = [update.id, revision.id];
    } else if (c.type === "saveAnnualReport") {
      let report = c.reportId ? state.reports.find(r => r.id === c.reportId && r.awardId === award.id) : undefined;
      requireAward(!c.reportId || report, "Report belongs to another award or is missing.");
      requireAward((report?.revisions.at(-1)?.id ?? null) === c.expectedReportRevisionId, "Report changed. Preserve your draft and reconcile.", 409);
      requireAward(report || state.reports.filter(r => r.awardId === award.id).length < 20, "Award report limit reached.");
      const context = { ...c.context, asOfDate: today };
      validateReportContext(context, award.id, state, host, true);
      requireAward(new Set(c.sections.map(s => s.sectionKey)).size === 6, "Save each of the six sections exactly once.");
      const reportId = report?.id ?? uid("award-report");
      const sections: SectionRevision[] = SECTION_KEYS.map(key => {
        const inputSection = c.sections.find(s => s.sectionKey === key)!;
        const text = inputSection.blocks.map(b => b.text).join("\n\n");
        const previous = report?.revisions.at(-1)?.sectionRevisionIds.map(id => state.sectionRevisions.find(s => s.id === id)!).find(s => s.sectionKey === key);
        if (previous && contentDigest({ blocks: previous.blocks, mode: previous.mode }) === contentDigest({ blocks: inputSection.blocks, mode: inputSection.mode })) return previous;
        return SectionRevisionSchema.parse({ ...inputSection, id: uid("award-section"), reportId, text, createdAt: at });
      });
      requireAward(sections.reduce((sum, s) => sum + s.text.length, 0) <= 60_000, "Report exceeds 60,000 characters; your draft is preserved.");
      const unresolved = reportIssues(sections, context, award.id, state, host);
      const payload = { reportId, ordinal: (report?.revisions.length ?? 0) + 1, templateId: "nsf-annual-narrative-v1" as const,
        templateVersion: 1 as const, policyMetadata: ANNUAL_TEMPLATE, context, sectionRevisionIds: sections.map(s => s.id), unresolved, createdAt: at };
      const revision = { ...payload, id: uid("award-report-revision"), digest: contentDigest(payload) };
      if (!report) { report = { id: reportId, awardId: award.id, revisions: [] }; state.reports.push(report); }
      report.revisions.push(revision);
      sections.forEach(s => { if (!state.sectionRevisions.some(old => old.id === s.id)) state.sectionRevisions.push(s); });
      event("report_saved", report.id); resultIds = [report.id, revision.id];
    } else if (c.type === "reviewAnnualSection") {
      const report = state.reports.find(r => r.id === c.reportId && r.awardId === award.id);
      const revision = report?.revisions.at(-1);
      requireAward(revision && revision.id === c.reportRevisionId && revision.sectionRevisionIds.includes(c.sectionRevisionId), "Review the exact current aggregate and section revision.", 409);
      validateReportContext(revision.context, award.id, state, host, true);
      const section = state.sectionRevisions.find(s => s.id === c.sectionRevisionId)!;
      if (c.decision === "nothing_to_report_confirmed") {
        requireAward(section.sectionKey !== "accomplishments", "Approved goals and actual progress prompts cannot be dismissed by a blanket nothing-to-report response.");
        requireAward(section.blocks.length === 0, "Nothing-to-report requires an explicitly empty section plus a human reason, rather than contradictory narrative.");
      }
      // Unsupported draft blocks remain visibly reviewed with gaps; never give unqualified status.
      section.blocks.forEach(b => blockIssues(b, revision.context, award.id, state, host));
      const review = { id: uid("award-section-review"), reportId: report!.id, reportRevisionId: revision.id, sectionRevisionId: section.id,
        fingerprint: sectionFingerprint(revision, section), decision: c.decision, actor: c.actor, at, reason: c.reason };
      state.sectionReviews.push(review); event("section_reviewed", review.id); resultIds = [review.id];
    } else if (c.type === "freezeAnnualReport") {
      const report = state.reports.find(r => r.id === c.reportId && r.awardId === award.id);
      requireAward(report, "Report belongs to another award or is missing.");
      const payload = buildReportSnapshot(state, report.id, c.reportRevisionId, host, c.actor, c.reason, now);
      const snapshot = { id: uid("award-report-snapshot"), reportId: report.id, awardId: award.id, reportRevisionId: c.reportRevisionId, digest: contentDigest(payload), payload };
      state.reportSnapshots.push(snapshot); event("report_frozen", snapshot.id); resultIds = [snapshot.id];
    } else if (c.type === "archiveAward") {
      award.localState = "archived"; event("award_archived", award.id); resultIds = [award.id];
    }
    award.revision++; award.updatedAt = at;
  }
  state.receipts.push({ operationId: input.operationId, payloadHash, awardId: award.id, resultIds, at });
  return { awards: validateAwardsIntegrity(state, host), awardId: award.id, resultIds, replayed: false };
}
