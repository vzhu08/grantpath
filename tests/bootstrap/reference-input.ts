/** Synthetic OFFLINE UNIT vectors, never imported by application code or injected into host data. */
import { hashText, type PlanningInput } from "../../modules/bootstrap/src/index";
export const at = "2026-10-25T12:00:00.000Z";
export const provenance = (id: string) => ({ id, version: 1, basis: "Synthetic arithmetic reference, not a quote or measured runtime", asOf: at, validUntil: "2026-11-01T12:00:00.000Z" });
export const amount = (value: number | null) => ({ value, basis: "Synthetic reference capacity" });
export const range = (low: number | null, high: number | null) => ({ low, high, reason: "Synthetic reference interval" });
export function gap(id: string): PlanningInput["gaps"][number] {
  const text = `Synthetic reviewer asks for ${id}.`;
  return { id, required: true, question: `Future product for ${id}`, intake: { origin: "synthetic-reference", projectId: "project", applicationId: "application", attemptId: "attempt", attemptState: "active", concernId: `concern-${id}`, concernRevision: 1, concernFingerprint: "a".repeat(64), status: "accepted", interpretation: `Retain unresolved ${id}; plan future analysis only`, interpretationConfirmed: true, confirmedBy: "Synthetic researcher", confirmedAt: at, targetDigest: "b".repeat(64), actions: [{ id: `action-${id}`, revision: 1, kind: "new-analysis", owner: "Synthetic researcher", due: null, state: "unstarted" }], feedback: [{ sourceId: `feedback-${id}`, version: 1, hash: hashText(text), text, start: 0, end: text.length, quote: text, physicalSource: { documentVersionId: null, contentHash: null, integrity: "not-applicable", latestSourceVersion: 1, excluded: false } }] } };
}
export function node(id: string, low: number, high: number, minutesLow: number, minutesHigh: number, dependencies: string[] = []): PlanningInput["catalog"]["nodes"][number] {
  return { id, version: 1, sharedKey: `shared-${id}`, description: `Future ${id}`, nonClaims: "No observed evidence, actual execution or scientific validation", dataDependenceKey: "same-synthetic-dataset", workState: "unstarted", dependencies, requiredTogether: [], exclusionGroups: [], suitability: "demo-assumed", access: "available", reviewer: "available", cashCents: range(low, high), effortMinutes: range(minutesLow, minutesHigh), elapsedMinutes: range(minutesLow, minutesHigh), computeMinutes: range(0, 0), ramMiB: amount(4096), storageMiB: amount(2048), provenance: provenance(`quote-${id}`) };
}
export function link(id: string, gapId: string, productId: string): PlanningInput["catalog"]["links"][number] {
  return { id, version: 1, gapId, productId, relation: "direct", decision: "accepted", qualification: "demo-assumed-direct", by: "Synthetic researcher", rationale: "Explicit demo assumption; scientific relevance deferred", at };
}
export function referenceInput(): PlanningInput {
  const nodes = [node("S", 2000, 4000, 30, 60), node("Q", 1500, 3000, 30, 60, ["S"]), node("V", 2000, 4000, 30, 60, ["Q"]), node("D", 3000, 6000, 60, 120, ["V"]), node("I", 1500, 3000, 30, 60, ["D"]), node("R", 2500, 5000, 30, 60, ["D"])];
  nodes.find(n => n.id === "D")!.requiredTogether = ["I"];
  nodes.find(n => n.id === "R")!.requiredTogether = ["I"];
  return { schemaVersion: 1, mode: "synthetic-demo-planning-only", projectId: "project", asOf: at, catalog: { id: "bootstrap-demo-v1", version: 1, family: "normalized-single-channel-microarray-limma", label: "Synthetic demo catalog — scientific relevance not validated", nodes, products: [{ id: "effect", nodeIds: ["D", "I"], description: "Effect estimation and required interpretation" }, { id: "sensitivity", nodeIds: ["R", "I"], description: "Same-data sensitivity and interpretation" }], links: [link("link-1", "G1", "effect"), link("link-2", "G2", "sensitivity")] }, gaps: [gap("G1"), gap("G2")], resources: { provenance: provenance("resources"), label: "synthetic", currency: "USD", cashCents: amount(21000), effortMinutes: amount(480), elapsedMinutes: amount(480), computeMinutes: amount(480), ramMiB: amount(8192), storageMiB: amount(10240) }, funding: [{ id: "seed", version: 1, status: "pending", amountCents: amount(6000), available: "before-window", scope: "allowed", condition: "Hypothetical seed support becomes confirmed before work", provenance: provenance("funding") }], hypotheticalFundingIds: ["seed"] };
}
export function tinyInput(): PlanningInput {
  const v = referenceInput();
  v.catalog.nodes = [node("A", 10, 10, 1, 1)]; v.catalog.products = [{ id: "p", nodeIds: ["A"], description: "Synthetic required product" }]; v.catalog.links = [link("l", "G1", "p")]; v.gaps = [gap("G1")]; v.funding = []; v.hypotheticalFundingIds = [];
  return v;
}
