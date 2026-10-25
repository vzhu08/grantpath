import { z } from "zod";
import { DependencySchema, INPUT_VERSION, RESULT_VERSION, SOLVER_VERSION, WitnessSchema, digest, type Dependency } from "./schema";
import { canonical, sha256, validateInput, ascii } from "./validation";
import { solve } from "./solver";
import { checkReadyWitness } from "./checker";

const issue = z.strictObject({ code: z.string().max(100), refs: z.array(z.string().max(500)).max(500), detail: z.string().max(4000) });
const row = z.strictObject({ id: z.string().max(500), refs: z.array(z.string().max(500)).max(500), unit: z.string().max(100), used: z.string().regex(/^[0-9]+$/), cap: z.string().regex(/^[0-9]+$/), slack: z.string().regex(/^-?[0-9]+$/), satisfied: z.boolean() });
export const ResultSchema = z.strictObject({
  contractVersion: z.literal(RESULT_VERSION), solverVersion: z.literal(SOLVER_VERSION),
  status: z.enum(["feasible", "infeasible", "unknown", "needs_input", "invalid_model", "error"]),
  fingerprint: digest.nullable(), branchId: z.string().max(100).nullable(), label: z.enum(["synthetic", "confirmed_assumptions"]).nullable(),
  nodes: z.number().int().min(0).max(50_000), searchComplete: z.boolean(),
  stopReason: z.enum(["exhausted", "direct_proof", "node_limit", "witness_limit", "validation", "internal_error"]),
  issues: z.array(issue).max(1000), witnesses: z.array(z.strictObject({ witness: WitnessSchema, constraints: z.array(row).max(500) })).max(3),
  proof: z.strictObject({ kind: z.enum(["direct", "exhaustive"]), constraints: z.array(row).max(500), sufficientClaimIds: z.array(z.string().max(100)).max(80), minimal: z.literal(false) }).nullable(),
  exclusions: z.array(z.strictObject({ costId: z.string().max(100), sourceId: z.string().max(100), reasons: z.array(z.string().max(200)).max(80), refs: z.array(z.string().max(100)).max(100) })).max(60),
}).superRefine((v, ctx) => {
  const identity = v.fingerprint !== null && v.branchId !== null && v.label !== null;
  const noConclusion = v.witnesses.length === 0 && v.proof === null && !v.searchComplete;
  const coherent = v.status === "feasible" ? identity && v.witnesses.length > 0 && v.proof === null && v.nodes > 0 && (v.searchComplete ? v.stopReason === "exhausted" : ["node_limit", "witness_limit"].includes(v.stopReason)) :
    v.status === "infeasible" ? identity && v.proof !== null && v.searchComplete && v.witnesses.length === 0 && (v.proof.kind === "direct" ? v.stopReason === "direct_proof" && v.nodes === 0 : v.stopReason === "exhausted" && v.nodes > 0) :
    v.status === "unknown" ? identity && noConclusion && v.stopReason === "node_limit" && v.nodes > 0 :
    v.status === "error" ? noConclusion && v.stopReason === "internal_error" && v.issues.length > 0 :
    noConclusion && !identity && v.stopReason === "validation" && v.nodes === 0 && v.issues.length > 0;
  if (!coherent) ctx.addIssue({ code: "custom", message: "Inconsistent result status/proof/witness" });
});
const ExportSchema = z.strictObject({ format: z.enum(["json", "markdown"]), serializer: z.literal("grantweave.export.v1"), content: z.string().max(2_000_000), byteLength: z.number().int().min(1).max(2_000_000), sha256: digest });
export const SnapshotSchema = z.strictObject({
  version: z.literal("grantweave.snapshot.v1"), inputVersion: z.literal(INPUT_VERSION), solverVersion: z.literal(SOLVER_VERSION),
  fingerprint: digest, dependencies: z.array(DependencySchema).max(80),
  exports: z.tuple([ExportSchema, ExportSchema]),
});
export type Snapshot = z.infer<typeof SnapshotSchema>;
const exportText = (format: "json" | "markdown", content: string) => ({ format, serializer: "grantweave.export.v1" as const, content, byteLength: Buffer.byteLength(content, "utf8"), sha256: sha256(content) });
const md = (s: string) => s.replace(/[\\`*_{}\[\]<>|]/g, "\\$&").replace(/[\r\n]+/g, " ");

// Pure in-memory freeze; the host must later save the returned bytes atomically with receipts.
// There is deliberately no filesystem store, finance adapter or claim of persistence here.
export function createSnapshot(raw: unknown): { status: "frozen"; snapshot: Snapshot } | { status: "unavailable"; reason: string } {
  const validated = validateInput(raw);
  if (validated.status !== "ready") return { status: "unavailable", reason: validated.status };
  const result = solve(validated.input);
  if (!ResultSchema.safeParse(result).success || result.status === "error") return { status: "unavailable", reason: "Solver result unavailable" };
  const input = validated.input;
  const json = canonical({ version: "grantweave.internal.v1", input, result }) + "\n";
  const lines = ["# GrantWeave internal planning result", "", `Label: ${input.model.label}`, `Branch: ${input.branch.id} (${input.branch.version})`, `Result: ${result.status}`, `Fingerprint: ${result.fingerprint}`, `Solver: ${result.solverVersion}`, `Search complete: ${result.searchComplete}; nodes: ${result.nodes}; stop: ${result.stopReason}`, "", "Conditional on the complete encoded assumptions. No award receipt, spending permission, scientific or institutional validation is asserted.", "", "## Branch assumptions", ...input.branch.outcomes.map((x) => `- ${x.sourceId}: ${x.outcome}`).sort(ascii)];
  for (const [i, found] of result.witnesses.entries()) {
    lines.push("", `## Witness ${i + 1}`, ...found.witness.assignments.map((a) => `- ${a.costId} -> ${a.sourceId}`));
    lines.push("", "Constraint | Used | Cap | Slack | Unit | Claim references", "--- | --- | --- | --- | --- | ---", ...found.constraints.map((c) => `${md(c.id)} | ${c.used} | ${c.cap} | ${c.slack} | ${md(c.unit)} | ${c.refs.map(md).join(", ")}`));
  }
  if (result.proof) lines.push("", `Proof: ${result.proof.kind}. Sufficient set includes all active claims and fixed model; no minimal-conflict claim.`, ...result.proof.constraints.map((c) => `- ${md(c.id)}: ${c.used} > ${c.cap} ${md(c.unit)}; claims ${c.refs.map(md).join(", ")}`));
  lines.push("", "## Exact assumption snapshot", ...[...input.model.claims].sort((a, b) => ascii(a.id, b.id)).map((c) => `- ${c.id} (${c.status}; ${c.sourceId}; UTF-16 [${c.start},${c.end})): ${md(c.quote)} — ${md(c.interpretation)}; ${md(c.actor)} at ${c.recordedAt}`), "", "Complete model, dependency manifest, source bodies/digests and exclusions are retained in the paired JSON export.", "");
  const snapshot = { version: "grantweave.snapshot.v1" as const, inputVersion: INPUT_VERSION, solverVersion: SOLVER_VERSION, fingerprint: validated.fingerprint, dependencies: JSON.parse(canonical(input.model.dependencies)), exports: [exportText("json", json), exportText("markdown", lines.join("\n"))] };
  const parsed = SnapshotSchema.safeParse(snapshot);
  return parsed.success ? { status: "frozen", snapshot: parsed.data } : { status: "unavailable", reason: "Frozen export exceeds core format bounds" };
}

export function readFrozenExport(raw: unknown, format: unknown): { status: "available"; content: string; byteLength: number; sha256: string } | { status: "unavailable"; reason: string } {
  if (format !== "json" && format !== "markdown") return { status: "unavailable", reason: "Unsupported export format" };
  const parsed = SnapshotSchema.safeParse(raw);
  if (!parsed.success) return { status: "unavailable", reason: "Missing or invalid saved content" };
  const saved = parsed.data;
  if (saved.exports[0].format !== "json" || saved.exports[1].format !== "markdown") return { status: "unavailable", reason: "Invalid paired formats" };
  for (const e of saved.exports) if (Buffer.byteLength(e.content, "utf8") !== e.byteLength || sha256(e.content) !== e.sha256) return { status: "unavailable", reason: "Saved export integrity mismatch" };
  try {
    const body = z.strictObject({ version: z.literal("grantweave.internal.v1"), input: z.unknown(), result: ResultSchema }).parse(JSON.parse(saved.exports[0].content));
    const validated = validateInput(body.input);
    if (validated.status !== "ready" || validated.fingerprint !== saved.fingerprint || body.result.fingerprint !== saved.fingerprint || canonical(saved.dependencies, true) !== canonical(validated.input.model.dependencies, true)) return { status: "unavailable", reason: "Saved closure identity mismatch" };
    if (body.result.branchId !== validated.input.branch.id || body.result.label !== validated.input.model.label) return { status: "unavailable", reason: "Saved branch/label mismatch" };
    if (body.result.nodes > validated.input.limits.maxNodes || (body.result.stopReason === "node_limit" && body.result.nodes !== validated.input.limits.maxNodes) || (body.result.stopReason === "witness_limit" && body.result.witnesses.length !== validated.input.limits.maxWitnesses)) return { status: "unavailable", reason: "Saved limit counters mismatch" };
    for (const found of body.result.witnesses) {
      const checked = checkReadyWitness(validated.input, found.witness);
      if (!checked.valid || canonical(checked.constraints) !== canonical(found.constraints)) return { status: "unavailable", reason: "Invalid saved witness or constraint totals" };
    }
    // A claimed exhaustive absence of witnesses cannot be independently checked from
    // sums alone. Recheck with the pinned bounded engine; never regenerate saved bytes.
    if (body.result.status === "infeasible" && canonical(solve(validated.input)) !== canonical(body.result)) return { status: "unavailable", reason: "Saved infeasibility proof mismatch" };
  } catch { return { status: "unavailable", reason: "Invalid saved closure" }; }
  const e = saved.exports.find((x) => x.format === format)!;
  return { status: "available", content: e.content, byteLength: e.byteLength, sha256: e.sha256 };
}

// Caller observations are assertions supplied by a future authoritative host adapter.
// This function reports a comparison only; it does not verify upstream facts or files.
export function assessCurrentness(captured: unknown, observed: unknown) {
  const a = z.array(DependencySchema).max(80).safeParse(captured), b = z.array(DependencySchema).max(80).safeParse(observed);
  if (!a.success || !b.success || new Set(a.data.map((x) => x.key)).size !== a.data.length || new Set(b.data.map((x) => x.key)).size !== b.data.length) return { status: "unavailable" as const, changed: [] as string[], missing: [] as string[] };
  const changed: string[] = [], missing: string[] = [];
  for (const dep of a.data) {
    const current: Dependency | undefined = b.data.find((x) => x.key === dep.key);
    if (!current) missing.push(dep.key); else if (dep.version !== current.version || dep.digest !== current.digest) changed.push(dep.key);
  }
  return { status: missing.length ? "unavailable" as const : changed.length ? "stale" as const : "unchanged" as const, changed: changed.sort(ascii), missing: missing.sort(ascii) };
}
