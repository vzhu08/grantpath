import { expect, it } from "vitest";
import { blankIntake, intakeTerms } from "../../lib/awards/intake";
import { newSource } from "../../lib/evidence";
import { validateTerms } from "../../lib/awards/terms";
import { fixture } from "./fixture";

it("a date-only extension retains original identity support and applies the changed end date without old action money", () => {
  const f = fixture(); f.execute(f.initialCommand()); const base = f.awards.termsVersions[0]!;
  const source = newSource({ id: "extension-source", projectId: "project", title: "Synthetic extension", type: "other", provenance: "demo", text: "Synthetic documented administrative extension, effective 2026-10-20. The end date is extended to 2027-03-31. No numbered amendment or new action amount is supplied." }); f.host.sources.push(source);
  const payload = intakeTerms({ ...blankIntake(), sponsorActionId: "extension-action", effective: "2026-10-20", end: "2027-03-31" }, source, source.versions[0]!.text, "Reviewer", "2026-10-25T12:00:00.000Z", base, "documented_administrative_change");
  expect(payload.identity).toEqual(base.payload.identity); expect(payload.fieldEvidence.identity).toMatchObject({ mode: "carry_forward", termsVersionId: base.id });
  expect(payload.awardPeriod).toMatchObject({ start: "2026-01-01", end: "2027-03-31" }); expect(payload.budgetPeriods).toEqual(base.payload.budgetPeriods);
  expect(payload.fundingFacts.some(fact => fact.basis === "current_action")).toBe(false);
  expect(() => validateTerms(payload, base, base.awardId, f.awards, f.host, "project", true)).not.toThrow();
});
it("partial initial ranges or budget edits fail visibly instead of silently discarding the entered date", () => {
  const f = fixture();
  expect(() => intakeTerms({ ...blankIntake(), end: "2027-03-31" }, f.notice, f.quote.quote, "Reviewer", "2026-10-25T12:00:00.000Z")).toThrow(/both award-period/);
  expect(() => intakeTerms({ ...blankIntake(), budgetEnd: "2027-03-31" }, f.notice, f.quote.quote, "Reviewer", "2026-10-25T12:00:00.000Z")).toThrow(/both reporting budget/);
});
