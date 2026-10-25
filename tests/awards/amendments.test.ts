import { it, expect } from "vitest";
import { fixture } from "./fixture";

it("requires a reconciled base at both confirmation and current selection", () => {
  const f = fixture(); f.execute(f.initialCommand()); const initialHead = f.awards.records[0]!.currentConfirmedTermsVersionId;
  const candidate = (action: string) => {
    const payload = structuredClone(f.terms); payload.changeKind = "numbered_amendment"; payload.sponsorActionId = action; payload.sponsorIdentifier = action;
    payload.fundingFacts = payload.fundingFacts.filter(x => x.basis !== "current_action");
    return f.execute({ type: "saveAwardChangeCandidate", ...f.bind(), expectedHeadId: initialHead, payload, supersedesCandidateId: null, actor: "Preparer", reason: "Reviewed new action with no action amount" }).resultIds[0]!;
  };
  const a = candidate("action-A"), b = candidate("action-B");
  const confirm = (id: string) => f.execute({ type: "reviewAwardChange", ...f.bind(), expectedHeadId: initialHead, candidateId: id, decision: "confirmed", sameAwardConfirmed: false, actor: "Reviewer", reason: "Confirmed transcription" });
  const ta = confirm(a).resultIds[1]!, tb = confirm(b).resultIds[1]!;
  f.execute({ type: "selectCurrentAwardTerms", ...f.bind(), expectedHeadId: initialHead, termsVersionId: ta, applicabilityConfirmed: true, retroactivePeriodsReviewed: true, actor: "Reviewer", reason: "Adopt A" });
  const before = JSON.stringify(f.awards);
  expect(() => f.execute({ type: "selectCurrentAwardTerms", ...f.bind(), expectedHeadId: ta, termsVersionId: tb, applicabilityConfirmed: true, retroactivePeriodsReviewed: true, actor: "Reviewer", reason: "Try stale B with refreshed head" })).toThrow(/actual current head/);
  expect(JSON.stringify(f.awards)).toBe(before);
  const current = f.awards.termsVersions.find(t => t.id === ta)!;
  expect(current.payload.fundingFacts.some(x => x.basis === "current_action")).toBe(false);
  expect(current.payload.fundingFacts[0]!.value).toMatchObject({ minorUnits: "24000000" });
});

it("keeps a future confirmed amendment pending and forbids cross-action carry-forward", () => {
  const f = fixture(); f.execute(f.initialCommand()); const head = f.awards.records[0]!.currentConfirmedTermsVersionId;
  const payload = structuredClone(f.terms); payload.changeKind = "documented_administrative_change"; payload.sponsorActionId = "extension";
  payload.sponsorIdentifier = null; payload.absenceReason = "Documented extension has no numbered amendment";
  payload.fieldEvidence.fundingFacts = { mode: "carry_forward", termsVersionId: head, field: "fundingFacts" };
  expect(() => f.execute({ type: "saveAwardChangeCandidate", ...f.bind(), expectedHeadId: head, payload, supersedesCandidateId: null, actor: "Preparer", reason: "Time extension" })).toThrow(/Current-action money/);
  payload.fundingFacts = payload.fundingFacts.filter(fact => fact.basis !== "current_action");
  payload.fieldEvidence.fundingFacts = { mode: "new", citations: [f.quote] }; payload.effectiveDate = "2026-11-01";
  const candidate = f.execute({ type: "saveAwardChangeCandidate", ...f.bind(), expectedHeadId: head, payload, supersedesCandidateId: null, actor: "Preparer", reason: "Time extension" }).resultIds[0]!;
  const terms = f.execute({ type: "reviewAwardChange", ...f.bind(), expectedHeadId: head, candidateId: candidate, decision: "confirmed", sameAwardConfirmed: false, actor: "Reviewer", reason: "Confirmed future action" }).resultIds[1]!;
  expect(() => f.execute({ type: "selectCurrentAwardTerms", ...f.bind(), expectedHeadId: head, termsVersionId: terms, applicabilityConfirmed: true, retroactivePeriodsReviewed: true, actor: "Reviewer", reason: "Too soon" })).toThrow(/Future/);
  expect(f.awards.records[0]!.currentConfirmedTermsVersionId).toBe(head);
});
