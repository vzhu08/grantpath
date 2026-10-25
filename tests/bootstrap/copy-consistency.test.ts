import { describe, expect, it } from "vitest";
import { canonical, exportPlanJson, freezePlan, hashText, parsePlanningInput, planBootstrap, PlanningInputSchema, validateInput, verifySnapshot, type PlanningInput } from "../../modules/bootstrap/src/index";
import { at, referenceInput } from "./reference-input";

const metadata = { id: "copy-plan", createdAt: at, createdBy: "Synthetic researcher", priorPlanId: null };
function pair(v: PlanningInput) { return [v.gaps[0]!.intake.feedback[0]!, v.gaps[1]!.intake.feedback[0]!] as const; }
function file(v: PlanningInput["gaps"][number]["intake"]["feedback"][number], id = "physical-1", contentHash = "c".repeat(64)) {
  v.physicalSource = { ...v.physicalSource, documentVersionId: id, contentHash, integrity: "available" };
}
const conflicts: { name: string; mutate: (v: PlanningInput) => void; reason: RegExp }[] = [
  { name: "same source/version with independently valid different text and SHA", mutate(v) { const [a, b] = pair(v); b.sourceId = a.sourceId; }, reason: /source version identity/ },
  { name: "same source/version with different physical origin", mutate(v) { const [a] = pair(v); v.gaps[1]!.intake.feedback = [structuredClone(a)]; file(v.gaps[1]!.intake.feedback[0]!); }, reason: /source version identity/ },
  { name: "same source/version with different file version", mutate(v) { const [a] = pair(v); file(a); v.gaps[1]!.intake.feedback = [structuredClone(a)]; file(v.gaps[1]!.intake.feedback[0]!, "physical-2"); }, reason: /source version identity/ },
  { name: "same file version across sources with conflicting immutable hashes", mutate(v) { const [a, b] = pair(v); file(a); file(b, "physical-1", "d".repeat(64)); }, reason: /physical document version identity/ },
  { name: "same file version across sources with conflicting integrity", mutate(v) { const [a, b] = pair(v); file(a); file(b); b.physicalSource.integrity = "missing"; }, reason: /physical document version identity/ },
  { name: "same source with conflicting current head", mutate(v) { const [a] = pair(v); v.gaps[1]!.intake.feedback = [structuredClone(a)]; v.gaps[1]!.intake.feedback[0]!.physicalSource.latestSourceVersion = 2; }, reason: /source currentness/ },
  { name: "same source with conflicting exclusion state", mutate(v) { const [a] = pair(v); v.gaps[1]!.intake.feedback = [structuredClone(a)]; v.gaps[1]!.intake.feedback[0]!.physicalSource.excluded = true; }, reason: /source currentness/ },
  { name: "same current action with conflicting owner", mutate(v) { v.gaps[1]!.intake.actions = [structuredClone(v.gaps[0]!.intake.actions[0]!)]; v.gaps[1]!.intake.actions[0]!.owner = "Conflicting owner"; }, reason: /current action identity/ },
];
describe("closed copied identity consistency", () => {
  it.each(conflicts)("rejects $name at every validated entrypoint", ({ mutate, reason }) => {
    const v = referenceInput(); mutate(v);
    // All per-record schemas still pass: rejection must come from cross-copy validation.
    expect(PlanningInputSchema.safeParse(v).success).toBe(true);
    expect(() => validateInput(v)).toThrow(reason);
    expect(() => parsePlanningInput(canonical(v))).toThrow(reason);
    expect(() => planBootstrap(v)).toThrow(reason);
    expect(() => freezePlan(v, metadata)).toThrow(reason);
  });
  it.each(conflicts)("rejects redigested snapshot containing $name", ({ mutate, reason }) => {
    const saved = JSON.parse(exportPlanJson(freezePlan(referenceInput(), metadata)));
    mutate(saved.payload.input);
    saved.payloadDigest = hashText(canonical(saved.payload));
    const { envelopeDigest: _, ...envelope } = saved;
    saved.envelopeDigest = hashText(canonical(envelope));
    expect(() => verifySnapshot(saved)).toThrow(reason);
  });
  it.each(conflicts)("rejects $name independently of input ordering", ({ mutate, reason }) => {
    const v = referenceInput(); mutate(v); v.gaps.reverse(); for (const g of v.gaps) g.intake.feedback.reverse();
    expect(() => validateInput(v)).toThrow(reason);
  });
  it("accepts one retained version with distinct exact quote ranges and a shared action", () => {
    const v = referenceInput(), [a] = pair(v); file(a);
    const b = structuredClone(a); b.start = 0; b.end = 9; b.quote = b.text.slice(0, 9);
    v.gaps[1]!.intake.feedback = [b]; v.gaps[1]!.intake.actions = [structuredClone(v.gaps[0]!.intake.actions[0]!)];
    const saved = freezePlan(v, metadata), bytes = exportPlanJson(saved);
    expect(saved.payload.result.branches[1]!.complete).not.toBeNull(); expect(exportPlanJson(verifySnapshot(JSON.parse(bytes)))).toBe(bytes);
  });
  it("accepts different versions/text/origins of one source under a consistent current head", () => {
    const v = referenceInput(), [a, b] = pair(v); b.sourceId = a.sourceId; b.version = 2;
    a.physicalSource.latestSourceVersion = 2; b.physicalSource.latestSourceVersion = 2; file(a, "physical-1"); file(b, "physical-2", "d".repeat(64));
    expect(() => validateInput(v)).not.toThrow(); expect(() => freezePlan(v, metadata)).not.toThrow();
    expect(planBootstrap(v).branches[1]!.completeStatus).toBe("needs-input"); // older quotation remains historical, not currently anchored
  });
  it("accepts different sources sharing one consistent physical file identity", () => {
    const v = referenceInput(), [a, b] = pair(v); file(a); file(b);
    expect(planBootstrap(v).branches[1]!.complete).not.toBeNull(); expect(() => freezePlan(v, metadata)).not.toThrow();
  });
  it("rejects conflicting copies within a single gap too", () => {
    const v = referenceInput(), [a, b] = pair(v); b.sourceId = a.sourceId; v.gaps[0]!.intake.feedback.push(b); v.gaps[1]!.intake.feedback = [structuredClone(a)];
    expect(() => validateInput(v)).toThrow(/source version identity/);
  });
  it("rejects contradictory retained copies even in an optional gap", () => {
    const v = referenceInput(), [a, b] = pair(v); b.sourceId = a.sourceId; v.gaps[1]!.required = false;
    expect(() => planBootstrap(v)).toThrow(/source version identity/);
  });
  it("accepts distinct document versions with equal bytes and different source text", () => {
    const v = referenceInput(), [a, b] = pair(v); file(a, "physical-1"); file(b, "physical-2");
    expect(() => validateInput(v)).not.toThrow(); expect(planBootstrap(v).branches[1]!.complete).not.toBeNull();
  });
});
