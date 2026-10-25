import { expect, it } from "vitest";
import { assessPlan, canonical, exportPlanJson, exportPlanMarkdown, freezePlan, hashText, parsePlanJson, verifySnapshot } from "../../modules/bootstrap/src/index";
import { unavailableBootstrapIntake } from "../../lib/bootstrap/ports";
import { at, referenceInput } from "./reference-input";
const meta = { id: "plan-1", createdAt: at, createdBy: "Synthetic researcher", priorPlanId: null };
it("freezes deep copies, preserves exact JSON bytes on roundtrip, labels all exports", () => {
  const input = referenceInput(), saved = freezePlan(input, meta), json = exportPlanJson(saved);
  input.resources.cashCents.value = 0; expect(saved.payload.input.resources.cashCents.value).toBe(21000);
  expect(Object.isFrozen(saved.payload.result.branches[1]!.complete!.nodeIds)).toBe(true);
  expect(exportPlanJson(parsePlanJson(json))).toBe(json);
  expect(exportPlanMarkdown(saved)).toContain("scientific relevance not validated"); expect(exportPlanMarkdown(saved)).toContain("Conditional hypothetical funding"); expect(exportPlanMarkdown(saved)).toContain("no execution, observed evidence");
});
it("detects funding rejection and changed upper quote without modifying old snapshots", () => {
  const input = referenceInput(), saved = freezePlan(input, meta), bytes = exportPlanJson(saved);
  input.funding[0]!.status = "denied"; input.hypotheticalFundingIds = []; input.catalog.nodes.find(n => n.id === "D")!.cashCents.high = 9000;
  const current = assessPlan(saved, input, at); expect(current.status).toBe("stale"); expect(current.changed).toContain("funding:seed"); expect(current.changed).toContain("node:D"); expect(exportPlanJson(saved)).toBe(bytes);
});
it("assesses expiry without numeric changes, excludes global workspace revision", () => {
  const input = referenceInput(), saved = freezePlan(input, meta);
  expect(assessPlan(saved, { ...input, asOf: "2026-10-26T12:00:00.000Z" }, "2026-10-26T12:00:00.000Z").status).toBe("current");
  expect(assessPlan(saved, input, "2026-11-02T12:00:00.000Z").status).toBe("stale");
  input.gaps[0]!.intake.actions[0]!.owner = "Different owner"; expect(assessPlan(saved, input, at).changed).toContain("gap:G1");
});
it("keeps historic exact quote separate from current file integrity", () => {
  const input = referenceInput(), q = input.gaps[0]!.intake.feedback[0]!;
  q.physicalSource = { documentVersionId: "file-1", contentHash: "c".repeat(64), integrity: "available", latestSourceVersion: 1, excluded: false };
  const saved = freezePlan(input, meta), bytes = exportPlanJson(saved); q.physicalSource.integrity = "missing";
  expect(assessPlan(saved, input, at).status).toBe("stale"); expect(assessPlan(saved, null, at).status).toBe("missing"); expect(exportPlanJson(saved)).toBe(bytes);
  expect(assessPlan(saved, { ...input, gaps: [] }, at).status).toBe("unknown");
});
it("rejects both tampering and redigested forged totals", () => {
  const saved = JSON.parse(exportPlanJson(freezePlan(referenceInput(), meta)));
  saved.payload.result.branches[1].complete.totals.cashCents.high = 1;
  expect(() => verifySnapshot(saved)).toThrow(/digest/);
  saved.payloadDigest = hashText(canonical(saved.payload)); const { envelopeDigest: _, ...rest } = saved; saved.envelopeDigest = hashText(canonical(rest));
  expect(() => verifySnapshot(saved)).toThrow(/authoritative/);
});
it("escapes hostile source strings as inert Markdown", () => {
  const input = referenceInput(); input.gaps[0]!.question = '<img src=x onerror=alert(1)> [click](javascript:evil)';
  const md = exportPlanMarkdown(freezePlan(input, meta)); expect(md).not.toContain("<img"); expect(md).not.toContain("[click](javascript:");
});
it("unavailable host port fails honestly without synthetic fallback", async () => { expect((await unavailableBootstrapIntake.readCurrent("project", "attempt", ["G1"])).status).toBe("unavailable"); });
