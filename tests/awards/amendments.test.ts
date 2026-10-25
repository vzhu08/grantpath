import { it, expect } from "vitest";
import { fixture } from "./fixture";
import { newSource, cite } from "../../lib/evidence";
import { FIELD_NAMES, type TermsPayload } from "../../lib/awards/schema";

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

it("carries replacement period and goal introduction lineage unchanged through a third terms version", () => {
  const f = fixture(); f.execute(f.initialCommand());
  const adopt = (payload: TermsPayload) => {
    const head = f.awards.records[0]!.currentConfirmedTermsVersionId;
    const candidateId = f.execute({ type: "saveAwardChangeCandidate", ...f.bind(), expectedHeadId: head, payload, supersedesCandidateId: null, actor: "Preparer", reason: "Source-backed replacement interpretation" }).resultIds[0]!;
    const termsId = f.execute({ type: "reviewAwardChange", ...f.bind(), expectedHeadId: head, candidateId, decision: "confirmed", sameAwardConfirmed: false, actor: "Reviewer", reason: "Reviewed exact full interpretation" }).resultIds[1]!;
    f.execute({ type: "selectCurrentAwardTerms", ...f.bind(), expectedHeadId: head, termsVersionId: termsId, applicabilityConfirmed: true, retroactivePeriodsReviewed: true, actor: "Reviewer", reason: "Adopt with affected period review" });
    return termsId;
  };
  const amendment = newSource({ id: "amendment-source", projectId: "project", title: "Synthetic amendment B", type: "other", provenance: "demo",
    text: "Amendment B issued/effective 2026-01-02. Budget period is now 2026-01-02 through 2026-12-31. Goal A is replaced by a narrower experiment A2. No action amount is supplied." });
  f.host.sources.push(amendment); const quote = cite(amendment, amendment.versions[0]!.text);
  const b = structuredClone(f.terms); b.changeKind = "numbered_amendment"; b.sponsorActionId = "action-B"; b.sponsorIdentifier = "Amendment B";
  b.issueDate = "2026-01-02"; b.effectiveDate = "2026-01-02"; b.dateEvidence = [quote];
  b.sourceRefs.push({ sourceId: amendment.id, version: 1, hash: quote.hash, role: "amendment" });
  b.budgetPeriods = [{ ...b.budgetPeriods[0]!, id: "period-2", start: "2026-01-02", evidence: [quote], supersedesPeriodId: "period-1" }];
  b.goals[0] = { goalId: "goal-A2", text: "Run narrower experiment A2", citations: [quote], incorporationRef: null, predecessorGoalIds: ["goal-A"] };
  b.fieldEvidence.budgetPeriods = { mode: "new", citations: [quote] }; b.fieldEvidence.goals = { mode: "new", citations: [quote] };
  b.fundingFacts = b.fundingFacts.filter(m => m.basis !== "current_action");
  const bId = adopt(b);
  const sourceC = newSource({ id: "change-C", projectId: "project", title: "Synthetic administrative action C", type: "other", provenance: "demo", text: "Administrative action C issued/effective 2026-02-01. Other confirmed terms, including budget period and approved goals, remain unchanged. No action amount is supplied." });
  f.host.sources.push(sourceC); const cQuote = cite(sourceC, sourceC.versions[0]!.text);
  const c = structuredClone(b); c.changeKind = "documented_administrative_change"; c.sponsorActionId = "action-C"; c.sponsorIdentifier = "Administrative action C";
  c.issueDate = "2026-02-01"; c.effectiveDate = "2026-02-01"; c.dateEvidence = [cQuote];
  c.sourceRefs.push({ sourceId: sourceC.id, version: 1, hash: cQuote.hash, role: "administrative change" });
  for (const field of FIELD_NAMES) c.fieldEvidence[field] = { mode: "carry_forward", termsVersionId: bId, field };
  const cId = adopt(c);
  expect(f.awards.termsVersions.find(t => t.id === cId)!.payload.budgetPeriods[0]!).toMatchObject({ id: "period-2", supersedesPeriodId: "period-1" });
  expect(f.awards.termsVersions.find(t => t.id === cId)!.payload.goals[0]!).toMatchObject({ goalId: "goal-A2", predecessorGoalIds: ["goal-A"] });
});
