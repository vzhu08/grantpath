import { extractFields, type ExtractionField } from "../../modules/extraction/src/index";
import { sourceDocument, cite } from "../evidence";
import type { Source } from "../schema";
import type { TermsPayload, AwardCitation, MoneyFactV1 } from "./schema";
import { parseUsdMinorUnits } from "./money-facts";

const INTAKE_FIELDS: ExtractionField[] = [
  { key: "number", label: "Award number", aliases: ["Award"], kind: "text" },
  { key: "recipient", label: "Recipient", kind: "text" },
  { key: "effective", label: "Effective date", aliases: ["Effective"], kind: "date" },
  { key: "start", label: "Award start", kind: "date" }, { key: "end", label: "Award end", kind: "date" },
  { key: "goals", label: "Approved goals", aliases: ["Approved scope"], kind: "text" },
];
/** Suggestions only. Text/amount conversion never promotes extracted numeric prices. */
export function suggestAwardFields(source: Source, version?: number) { return extractFields(sourceDocument(source, version), INTAKE_FIELDS); }
export type IntakeFields = {
  number: string; recipient: string; effective: string; issue: string; start: string; end: string;
  budgetStart: string; budgetEnd: string; goals: string; sponsorActionId: string; sponsorIdentifier: string;
  currentAction: string; cumulative: string; anticipated: string; explicitUsd: boolean;
};
export const blankIntake = (): IntakeFields => ({ number: "", recipient: "", effective: "", issue: "", start: "", end: "", budgetStart: "", budgetEnd: "", goals: "",
  sponsorActionId: "", sponsorIdentifier: "", currentAction: "", cumulative: "", anticipated: "", explicitUsd: false });
export function intakeTerms(fields: IntakeFields, source: Source, quote: string, actor: string, at: string,
  base?: { id: string; payload: TermsPayload }, kind: TermsPayload["changeKind"] = "initial", version?: number): TermsPayload {
  const citation = cite(source, quote, version), ref = { sourceId: source.id, version: citation.version, hash: citation.hash, role: kind === "initial" ? "award notice" : "award change" };
  const quoted = { mode: "new" as const, citations: [citation] };
  const unknown = (reason: string) => ({ mode: "unknown" as const, reason });
  const money: MoneyFactV1[] = [];
  for (const [basis, raw] of [["current_action", fields.currentAction], ["obligated_cumulative", fields.cumulative], ["anticipated_total", fields.anticipated]] as const) {
    if (raw.trim()) money.push({ id: `money-${crypto.randomUUID()}`, basis,
      value: fields.explicitUsd ? { state: "known", currency: "USD", scale: 2, minorUnits: parseUsdMinorUnits(raw.trim(), basis) }
        : { state: "unknown", raw, reason: "Currency is not explicitly confirmed as USD." },
      evidence: [citation], periodId: null, confirmedBy: actor, confirmedAt: at });
  }
  // Empty amendment inputs explicitly retain supported cumulative/anticipated facts; action money never carries.
  if (base) for (const f of base.payload.fundingFacts) if (f.basis !== "current_action" && !money.some(x => x.basis === f.basis)) money.push(structuredClone(f));
  const changingRange = !!(fields.start || fields.end);
  const rangeStart = fields.start || base?.payload.awardPeriod?.start || "", rangeEnd = fields.end || base?.payload.awardPeriod?.end || "";
  if (changingRange && (!rangeStart || !rangeEnd)) throw new Error("Enter both award-period dates, or leave both unresolved. Your intake text is preserved.");
  if (!!fields.budgetStart !== !!fields.budgetEnd) throw new Error("Enter both reporting budget-period dates, or leave both unchanged/unresolved.");
  const range = changingRange ? { start: rangeStart, end: rangeEnd, evidence: [...(base?.payload.awardPeriod?.evidence ?? []), citation] } : null;
  const periods = fields.budgetStart && fields.budgetEnd ? [{ id: `period-${crypto.randomUUID()}`, label: "Confirmed reporting budget period", start: fields.budgetStart, end: fields.budgetEnd, evidence: [citation], supersedesPeriodId: base?.payload.budgetPeriods[0]?.id ?? null }] : base?.payload.budgetPeriods ?? [];
  const goals = fields.goals.trim() ? fields.goals.split("\n").map(g => g.trim()).filter(Boolean).map(text => ({ goalId: `goal-${crypto.randomUUID()}`, text,
    citations: [citation], incorporationRef: null as AwardCitation | null, predecessorGoalIds: base?.payload.goals.map(g => g.goalId) ?? [] })) : base?.payload.goals ?? [];
  const carry = (field: keyof TermsPayload["fieldEvidence"]) => ({ mode: "carry_forward" as const, termsVersionId: base!.id, field });
  const carryIdentity = !!base && !fields.number && !fields.recipient;
  const sourceRefs = [ref];
  if (base) for (const old of base.payload.sourceRefs) if (!sourceRefs.some(r => r.sourceId === old.sourceId && r.version === old.version)) sourceRefs.push(old);
  return { sponsorActionId: fields.sponsorActionId, changeKind: kind, sponsorIdentifier: fields.sponsorIdentifier || null,
    absenceReason: fields.sponsorIdentifier ? "" : "Human confirms this source-backed action has no numbered sponsor identifier.",
    issueDate: fields.issue || null, effectiveDate: fields.effective || null, dateEvidence: [citation],
    identity: carryIdentity ? structuredClone(base!.payload.identity) : { sponsor: "NSF", instrument: "standard_grant", sponsorAwardNumber: fields.number || base?.payload.identity.sponsorAwardNumber || "",
      recipientName: fields.recipient || base?.payload.identity.recipientName || "", evidence: [...(base?.payload.identity.evidence ?? []), citation] },
    awardPeriod: range ?? base?.payload.awardPeriod ?? null, budgetPeriods: periods, goals, fundingFacts: money,
    approvedBudgetRefs: base?.payload.approvedBudgetRefs ?? [], policies: base?.payload.policies ?? [],
    sponsorLifecycle: base?.payload.sponsorLifecycle ?? { value: "unknown", evidence: [] },
    fieldEvidence: { identity: carryIdentity ? carry("identity") : { mode: "new", citations: [...(base?.payload.identity.evidence ?? []), citation] }, awardPeriod: range ? { mode: "new", citations: range.evidence } : base ? carry("awardPeriod") : unknown("Award period not supplied"),
      budgetPeriods: fields.budgetStart && fields.budgetEnd ? quoted : base ? carry("budgetPeriods") : unknown("Budget period not supplied"),
      goals: fields.goals.trim() ? quoted : base ? carry("goals") : unknown("Approved scope not supplied"), fundingFacts: money.length ? quoted : unknown("No authoritative money fact supplied"),
      approvedBudgetRefs: base ? carry("approvedBudgetRefs") : unknown("Approved category-budget reference not supplied"),
      policies: base ? carry("policies") : unknown("Applicable full conditions not supplied"), sponsorLifecycle: base ? carry("sponsorLifecycle") : unknown("Sponsor lifecycle not asserted") },
    sourceRefs, historicalSourceReviews: [], unresolved: base?.payload.unresolved ?? ["Applicable conditions and approved category budget remain unverified."],
  };
}
