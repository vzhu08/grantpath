import { z } from "zod";
import { POLICY, PlanningInputSchema, Timestamp, canonical, hashText, validateInput, type PlanningInput } from "./model";
import { PlanningResultSchema, planBootstrap } from "./planner";

export const SNAPSHOT_LIMIT_BYTES = 256_000;
const identifier = z.string().regex(/^[A-Za-z0-9][A-Za-z0-9_.:-]{0,79}$/);
const SnapshotSchema = z.object({ schemaVersion: z.literal(1), id: identifier, createdAt: Timestamp, createdBy: z.string().trim().min(1).max(100), priorPlanId: identifier.nullable(),
  payload: z.object({ policy: z.literal(POLICY), input: PlanningInputSchema, result: PlanningResultSchema }).strict(), payloadDigest: z.string().regex(/^[a-f0-9]{64}$/), envelopeDigest: z.string().regex(/^[a-f0-9]{64}$/),
}).strict();
export type PlanSnapshot = z.infer<typeof SnapshotSchema>;
type DeepReadonly<T> = T extends object ? { readonly [K in keyof T]: DeepReadonly<T[K]> } : T;
function freeze<T>(value: T): DeepReadonly<T> {
  if (value && typeof value === "object") { Object.values(value).forEach(freeze); Object.freeze(value); }
  return value as DeepReadonly<T>;
}
export function freezePlan(raw: unknown, metadata: { id: string; createdAt: string; createdBy: string; priorPlanId: string | null }): DeepReadonly<PlanSnapshot> {
  const input = validateInput(raw), result = planBootstrap(input);
  if (Date.parse(metadata.createdAt) < Date.parse(input.asOf)) throw new Error("Snapshot creation predates the calculation.");
  if (metadata.priorPlanId === metadata.id) throw new Error("A plan cannot supersede itself.");
  const payload = { policy: POLICY, input, result }, payloadDigest = hashText(canonical(payload));
  const envelope = { schemaVersion: 1 as const, ...metadata, payload, payloadDigest };
  return freeze(verifySnapshot({ ...envelope, envelopeDigest: hashText(canonical(envelope)) }));
}
/** Verifies copied historic inputs/results independently of current sources. Does not certify physical file integrity. */
export function verifySnapshot(raw: unknown): PlanSnapshot {
  if (Buffer.byteLength(canonical(raw), "utf8") > SNAPSHOT_LIMIT_BYTES) throw new Error("Snapshot export capacity exceeded; no history was truncated.");
  const snapshot = SnapshotSchema.parse(raw);
  const { envelopeDigest, ...envelope } = snapshot;
  if (hashText(canonical(envelope)) !== envelopeDigest || hashText(canonical(snapshot.payload)) !== snapshot.payloadDigest) throw new Error("Snapshot digest mismatch.");
  const input = validateInput(snapshot.payload.input);
  if (canonical(input) !== canonical(snapshot.payload.input) || canonical(planBootstrap(input)) !== canonical(snapshot.payload.result)) throw new Error("Snapshot result does not match the authoritative solver.");
  if (Date.parse(snapshot.createdAt) < Date.parse(input.asOf) || snapshot.priorPlanId === snapshot.id) throw new Error("Invalid snapshot lineage/date.");
  return snapshot;
}
export function exportPlanJson(raw: unknown): string { return canonical(verifySnapshot(raw)); }
export function parsePlanJson(json: string): DeepReadonly<PlanSnapshot> {
  if (Buffer.byteLength(json, "utf8") > SNAPSHOT_LIMIT_BYTES) throw new Error("Snapshot export capacity exceeded.");
  return freeze(verifySnapshot(JSON.parse(json)));
}
function manifest(input: PlanningInput): Record<string, string> {
  const entries: [string, unknown][] = [["policy", POLICY], ["scope", { schemaVersion: input.schemaVersion, mode: input.mode, projectId: input.projectId, family: input.catalog.family, catalogId: input.catalog.id, catalogVersion: input.catalog.version }], ["resources", input.resources], ["hypotheticalFundingIds", input.hypotheticalFundingIds]];
  for (const [group, values] of [["gap", input.gaps], ["node", input.catalog.nodes], ["product", input.catalog.products], ["link", input.catalog.links], ["funding", input.funding]] as const) for (const value of values) entries.push([`${group}:${value.id}`, value]);
  return Object.fromEntries(entries.map(([key, value]) => [key, hashText(canonical(value))]));
}
export type CurrentAssessment = { status: "current" | "stale" | "missing" | "unknown"; changed: string[]; reasons: string[]; currentInputDigest: string | null };
/** Current input must come from an authoritative, freshly hydrated host adapter. Pure copies alone do not establish host currentness. */
export function assessPlan(raw: unknown, current: unknown | null, evaluatedAt: string): CurrentAssessment {
  const saved = verifySnapshot(raw);
  Timestamp.parse(evaluatedAt);
  if (Date.parse(evaluatedAt) < Date.parse(saved.createdAt)) throw new Error("Current assessment predates saved plan.");
  if (current === null) return { status: "missing", changed: [], reasons: ["Current host input is unavailable; historical export remains intact."], currentInputDigest: null };
  let input: PlanningInput;
  try { input = validateInput(current); } catch { return { status: "unknown", changed: [], reasons: ["Current input is invalid or no longer eligible; reload/reconfirm intake."], currentInputDigest: null }; }
  if (Date.parse(input.asOf) > Date.parse(evaluatedAt)) return { status: "unknown", changed: [], reasons: ["Current calculation date is in the future relative to assessment."], currentInputDigest: null };
  const before = manifest(saved.payload.input), after = manifest(input);
  const changed = [...new Set([...Object.keys(before), ...Object.keys(after)])].filter(key => before[key] !== after[key]).sort();
  const reasons: string[] = [];
  for (const [key, p] of [["resources", input.resources.provenance], ...input.catalog.nodes.map(n => [`node:${n.id}`, n.provenance] as const), ...input.funding.filter(f => f.status === "confirmed" || input.hypotheticalFundingIds.includes(f.id)).map(f => [`funding:${f.id}`, f.provenance] as const)] as const) {
    if (Date.parse(evaluatedAt) > Date.parse(p.validUntil) || Date.parse(evaluatedAt) < Date.parse(p.asOf)) reasons.push(`${key}:outside-validity`);
  }
  for (const g of input.gaps) for (const q of g.intake.feedback) if (q.physicalSource.excluded || q.physicalSource.latestSourceVersion !== q.version || !["available", "not-applicable"].includes(q.physicalSource.integrity)) reasons.push(`gap:${g.id}:source-currentness`);
  return { status: changed.length || reasons.length ? "stale" : "current", changed, reasons: [...new Set(reasons)].sort(), currentInputDigest: planBootstrap(input).inputDigest };
}
const escape = (value: string) => value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/[\\`*_{}\[\]()#+.!|~-]/g, "\\$&").replace(/\r?\n/g, " ");
export function exportPlanMarkdown(raw: unknown): string {
  const s = verifySnapshot(raw), result = s.payload.result;
  const lines = ["# Bootstrap planning record", "", "Synthetic demo catalog — scientific relevance not validated.", "Synthetic resource scenarios. Planning only: no execution, observed evidence, funding approval or task-03 completion.", "", `Plan: ${escape(s.id)}. Payload SHA256: ${s.payloadDigest}.`, `Frozen by ${escape(s.createdBy)} at ${s.createdAt}.`, ""];
  for (const b of result.branches) {
    lines.push(`## ${b.conditional ? "Conditional hypothetical funding" : "Confirmed resources"}`, "", `Outcome: ${b.outcome}; complete target: ${b.completeStatus}; minimum claim: ${b.minimumStatus}.`, `Guaranteed cash under this branch's assumptions: ${b.guaranteedCashCents} USD cents; possible upper availability: ${b.maximumPossibleCashCents ?? "unknown"} USD cents.`);
    for (const c of [...b.conditions, ...b.fundingNotes]) lines.push(`- ${escape(c)}`);
    for (const p of [b.complete, ...b.partials].filter(p => p !== null)) {
      const range = (v: { low: number | null; high: number | null }) => `${v.low ?? "unknown"}–${v.high ?? "unknown"}`;
      lines.push("", `Nodes: ${p.nodeIds.map(escape).join(", ")}. Covered: ${p.coveredGapIds.map(escape).join(", ")}; still open: ${p.uncoveredGapIds.map(escape).join(", ") || "none within this plan's declared targets"}.`, `USD cents: ${range(p.totals.cashCents)}; serial elapsed minutes: ${range(p.totals.elapsedMinutes)}; active minutes: ${range(p.totals.effortMinutes)}.`);
    }
    lines.push("", `Partial frontier: ${b.frontierCount}; display truncated: ${b.frontierTruncated}.`, `Alternative diagnostics: ${b.alternativeCount}; display truncated: ${b.alternativesTruncated}.`);
    const reasons = [...new Set([...b.coverageNotes, ...b.alternatives.flatMap(a => [...a.violations, ...a.uncertainties])])];
    for (const reason of reasons) lines.push(`- ${escape(reason)}`);
  }
  lines.push("", "## Retained questions", "");
  for (const g of s.payload.input.gaps) lines.push(`- ${escape(g.id)}: ${escape(g.question)} — ${escape(g.intake.interpretation)}`);
  lines.push("", "## Retained assumptions and dated bases", "");
  for (const n of s.payload.input.catalog.nodes) lines.push(`- ${escape(n.id)} v${n.version}: ${escape(n.description)}. Nonclaims: ${escape(n.nonClaims)}. Common data: ${escape(n.dataDependenceKey)}. Basis: ${escape(n.provenance.basis)}. As of ${n.provenance.asOf}; valid until ${n.provenance.validUntil}. Cash cents ${n.cashCents.low ?? "unknown"}–${n.cashCents.high ?? "unknown"}; elapsed minutes ${n.elapsedMinutes.low ?? "unknown"}–${n.elapsedMinutes.high ?? "unknown"}.`);
  const r = s.payload.input.resources;
  lines.push(`- Resources: ${escape(r.provenance.basis)}; as of ${r.provenance.asOf}; valid until ${r.provenance.validUntil}.`);
  for (const key of ["cashCents", "elapsedMinutes", "effortMinutes", "computeMinutes", "ramMiB", "storageMiB"] as const) lines.push(`- ${key}: ${r[key].value ?? "unknown"}; ${escape(r[key].basis)}.`);
  for (const f of s.payload.input.funding) lines.push(`- Funding ${escape(f.id)}: ${f.status}; ${f.amountCents.value ?? "unknown"} USD cents; ${f.available}; ${f.scope}. ${escape(f.provenance.basis)}; as of ${f.provenance.asOf}; valid until ${f.provenance.validUntil}.`);
  lines.push("", "Historic copies do not certify current source availability. Reassess before using any plan.", "");
  return lines.join("\n");
}
