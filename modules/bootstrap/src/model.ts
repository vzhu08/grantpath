import { z } from "zod";
import { createHash } from "node:crypto";

export const POLICY = "bootstrap-exact-1" as const;
export const INPUT_LIMIT_BYTES = 80_000;
const id = z.string().regex(/^[A-Za-z0-9][A-Za-z0-9_.:-]{0,79}$/);
const text = z.string().trim().min(1).max(1000);
const digest = z.string().regex(/^[a-f0-9]{64}$/);
const integer = z.number().int().min(0).max(1_000_000_000);
export const Timestamp = z.string().datetime({ offset: true });
export const IntervalSchema = z.object({ low: integer.nullable(), high: integer.nullable(), reason: text }).strict().superRefine((v, ctx) => {
  if (v.low !== null && v.high !== null && v.low > v.high) ctx.addIssue({ code: "custom", message: "Interval low exceeds high." });
});
export const AmountSchema = z.object({ value: integer.nullable(), basis: text }).strict();
const stamp = z.object({ id, version: z.number().int().min(1).max(1_000_000), basis: text, asOf: Timestamp, validUntil: Timestamp }).strict().superRefine((v, ctx) => {
  if (Date.parse(v.asOf) > Date.parse(v.validUntil)) ctx.addIssue({ code: "custom", message: "Provenance expires before its as-of date." });
});
const quote = z.object({ sourceId: id, version: z.number().int().min(1), hash: digest, text: z.string().min(1).max(4000), start: integer, end: integer, quote: z.string().min(1).max(1000),
  physicalSource: z.object({ documentVersionId: id.nullable(), contentHash: digest.nullable(), integrity: z.enum(["available", "missing", "corrupt", "unknown", "not-applicable"]), latestSourceVersion: z.number().int().min(1), excluded: z.boolean() }).strict(),
}).strict().superRefine((v, ctx) => {
  if (v.end <= v.start || v.end > v.text.length || v.text.slice(v.start, v.end) !== v.quote || hashText(v.text) !== v.hash) ctx.addIssue({ code: "custom", message: "Exact historic UTF-16 quotation/hash mismatch." });
  if (v.physicalSource.latestSourceVersion < v.version) ctx.addIssue({ code: "custom", message: "Source head predates cited version." });
  if ((v.physicalSource.documentVersionId === null) !== (v.physicalSource.contentHash === null)) ctx.addIssue({ code: "custom", message: "Physical file version and hash must be paired." });
  if (v.physicalSource.documentVersionId === null && v.physicalSource.integrity !== "not-applicable") ctx.addIssue({ code: "custom", message: "Physical integrity needs a file identity." });
  if (v.physicalSource.documentVersionId !== null && v.physicalSource.integrity === "not-applicable") ctx.addIssue({ code: "custom", message: "File-backed sources require physical integrity assessment." });
});
const gap = z.object({ id, required: z.boolean(), question: text, intake: z.object({ origin: z.enum(["manual-task03-copy", "synthetic-reference"]), projectId: id, applicationId: id, attemptId: id,
  attemptState: z.literal("active"), concernId: id, concernRevision: z.number().int().min(1), concernFingerprint: digest, status: z.literal("accepted"), interpretation: text, interpretationConfirmed: z.literal(true),
  confirmedBy: text, confirmedAt: Timestamp, targetDigest: digest,
  actions: z.array(z.object({ id, revision: z.number().int().min(1), kind: z.enum(["new-analysis", "new-data"]), owner: text, due: Timestamp.nullable(), state: z.literal("unstarted") }).strict()).min(1).max(8),
  feedback: z.array(quote).min(1).max(4),
}).strict() }).strict();
const node = z.object({ id, version: z.number().int().min(1), sharedKey: id, description: text, nonClaims: text, dataDependenceKey: id, workState: z.literal("unstarted"),
  dependencies: z.array(id).max(12), requiredTogether: z.array(id).max(12), exclusionGroups: z.array(id).max(12), suitability: z.enum(["demo-assumed", "unknown", "rejected"]),
  access: z.enum(["available", "denied", "unknown"]), reviewer: z.enum(["available", "denied", "unknown"]),
  cashCents: IntervalSchema, effortMinutes: IntervalSchema, elapsedMinutes: IntervalSchema, computeMinutes: IntervalSchema, ramMiB: AmountSchema, storageMiB: AmountSchema, provenance: stamp,
}).strict();
const product = z.object({ id, nodeIds: z.array(id).min(1).max(12), description: text }).strict();
const link = z.object({ id, version: z.number().int().min(1), gapId: id, productId: id, relation: z.enum(["direct", "weak", "unknown", "none", "rejected"]),
  decision: z.enum(["accepted", "rejected", "unreviewed"]), qualification: z.enum(["demo-assumed-direct", "unreviewed"]), by: text, rationale: text, at: Timestamp,
}).strict();
const funding = z.object({ id, version: z.number().int().min(1), status: z.enum(["confirmed", "pending", "denied", "withdrawn"]), amountCents: AmountSchema,
  available: z.enum(["before-window", "after-window", "unknown"]), scope: z.enum(["allowed", "restricted", "unknown"]), condition: text, provenance: stamp,
}).strict();
export const PlanningInputSchema = z.object({ schemaVersion: z.literal(1), mode: z.literal("synthetic-demo-planning-only"), projectId: id, asOf: Timestamp,
  catalog: z.object({ id, version: z.number().int().min(1), family: z.literal("normalized-single-channel-microarray-limma"), label: z.literal("Synthetic demo catalog — scientific relevance not validated"), nodes: z.array(node).min(1).max(12), products: z.array(product).min(1).max(16), links: z.array(link).max(64) }).strict(),
  gaps: z.array(gap).min(1).max(8), resources: z.object({ provenance: stamp, label: z.literal("synthetic"), currency: z.literal("USD"), cashCents: AmountSchema, effortMinutes: AmountSchema, elapsedMinutes: AmountSchema, computeMinutes: AmountSchema, ramMiB: AmountSchema, storageMiB: AmountSchema }).strict(),
  funding: z.array(funding).max(8), hypotheticalFundingIds: z.array(id).max(8),
}).strict();
export type PlanningInput = z.infer<typeof PlanningInputSchema>;
export type Interval = z.infer<typeof IntervalSchema>;

export function hashText(value: string): string { return createHash("sha256").update(value, "utf8").digest("hex"); }
/** Objects sort by code-point key; array order is significant; strings are retained verbatim after schema trimming. */
export function canonical(value: unknown): string {
  function order(v: unknown): unknown {
    if (v === null || typeof v === "string" || typeof v === "boolean") return v;
    if (typeof v === "number" && Number.isSafeInteger(v)) return v;
    if (Array.isArray(v)) return v.map(order);
    if (typeof v === "object" && v && Object.getPrototypeOf(v) === Object.prototype) return Object.fromEntries(Object.keys(v).sort().map(k => [k, order((v as Record<string, unknown>)[k])]));
    throw new Error("Canonical payload must contain only plain JSON and safe integers.");
  }
  return JSON.stringify(order(value));
}
export function inputDigest(input: PlanningInput): string { return hashText(canonical(validateInput(input))); }
export function parsePlanningInput(json: string): PlanningInput {
  if (Buffer.byteLength(json, "utf8") > INPUT_LIMIT_BYTES) throw new Error("Bootstrap input exceeds 80000 UTF-8 bytes; reduce copied context without truncating quotations.");
  return validateInput(JSON.parse(json));
}
export function validateInput(raw: unknown): PlanningInput {
  if (Buffer.byteLength(canonical(raw), "utf8") > INPUT_LIMIT_BYTES) throw new Error("Bootstrap input capacity exceeded.");
  const v = PlanningInputSchema.parse(raw);
  const unique = (xs: string[], label: string) => { if (new Set(xs).size !== xs.length) throw new Error(`Duplicate ${label}.`); };
  unique(v.gaps.map(x => x.id), "gap"); unique(v.catalog.nodes.map(x => x.id), "node"); unique(v.catalog.nodes.map(x => x.sharedKey), "shared key: shared work must be one node"); unique(v.catalog.products.map(x => x.id), "product"); unique(v.catalog.links.map(x => x.id), "link"); unique(v.funding.map(x => x.id), "funding"); unique(v.hypotheticalFundingIds, "hypothetical funding");
  if (!v.gaps.some(g => g.required)) throw new Error("Select at least one required gap.");
  const nodes = new Map(v.catalog.nodes.map(n => [n.id, n]));
  for (const n of v.catalog.nodes) {
    unique(n.dependencies, "dependency"); unique(n.requiredTogether, "required product node"); unique(n.exclusionGroups, "exclusion group");
    for (const ref of [...n.dependencies, ...n.requiredTogether]) if (!nodes.has(ref) || ref === n.id) throw new Error("Unknown/self node reference.");
  }
  const visiting = new Set<string>(), done = new Set<string>();
  function visit(id: string) { if (visiting.has(id)) throw new Error("Cyclic analysis dependency."); if (done.has(id)) return; visiting.add(id); for (const ref of nodes.get(id)!.dependencies) visit(ref); visiting.delete(id); done.add(id); }
  for (const id of nodes.keys()) visit(id);
  for (const p of v.catalog.products) { unique(p.nodeIds, "product node"); if (p.nodeIds.some(id => !nodes.has(id))) throw new Error("Unknown product node."); }
  for (const l of v.catalog.links) {
    if (!v.gaps.some(g => g.id === l.gapId) || !v.catalog.products.some(p => p.id === l.productId)) throw new Error("Unknown gap/product link.");
    if (Date.parse(l.at) > Date.parse(v.asOf)) throw new Error("Relevance decision postdates the calculation.");
  }
  unique(v.gaps.map(g => g.intake.concernId), "selected concern");
  // A self-valid quote is not enough: all copies in this calculation must describe
  // one consistent immutable source/file identity and one current host view.
  const sourceVersions = new Map<string, string>();
  const sourceHeads = new Map<string, string>();
  const physicalVersions = new Map<string, string>();
  const actions = new Map<string, string>();
  function consistent(copies: Map<string, string>, key: string, value: unknown, label: string) {
    const signature = canonical(value), previous = copies.get(key);
    if (previous !== undefined && previous !== signature) throw new Error(`Conflicting copied ${label}.`);
    copies.set(key, signature);
  }
  for (const g of v.gaps) {
    if (g.intake.projectId !== v.projectId) throw new Error("Cross-project gap intake.");
    if (Date.parse(g.intake.confirmedAt) > Date.parse(v.asOf)) throw new Error("Intake confirmation postdates the calculation.");
    unique(g.intake.actions.map(a => a.id), "action");
    for (const action of g.intake.actions) consistent(actions, action.id, { ...action, projectId: g.intake.projectId, attemptId: g.intake.attemptId }, "current action identity");
    for (const q of g.intake.feedback) {
      const p = q.physicalSource;
      consistent(sourceVersions, `${q.sourceId}|${q.version}`, {
        text: q.text, hash: q.hash, documentVersionId: p.documentVersionId, contentHash: p.contentHash,
        projectId: g.intake.projectId, attemptId: g.intake.attemptId,
      }, "source version identity");
      consistent(sourceHeads, q.sourceId, { latestSourceVersion: p.latestSourceVersion, excluded: p.excluded, projectId: g.intake.projectId, attemptId: g.intake.attemptId }, "source currentness");
      if (p.documentVersionId !== null) consistent(physicalVersions, p.documentVersionId, {
        contentHash: p.contentHash, integrity: p.integrity, projectId: g.intake.projectId, attemptId: g.intake.attemptId,
      }, "physical document version identity");
    }
  }
  if (new Set(v.gaps.map(g => g.intake.attemptId)).size !== 1 || new Set(v.gaps.map(g => g.intake.applicationId)).size !== 1) throw new Error("One target attempt/application per solve.");
  for (const id of v.hypotheticalFundingIds) if (!v.funding.some(f => f.id === id && f.status === "pending")) throw new Error("Hypothetical support must reference pending funding.");
  const order = <T extends { id: string }>(xs: T[]) => xs.sort((a, b) => a.id < b.id ? -1 : a.id > b.id ? 1 : 0);
  order(v.gaps); order(v.catalog.nodes); order(v.catalog.products); order(v.catalog.links); order(v.funding); v.hypotheticalFundingIds.sort();
  for (const n of v.catalog.nodes) { n.dependencies.sort(); n.requiredTogether.sort(); n.exclusionGroups.sort(); }
  for (const p of v.catalog.products) p.nodeIds.sort();
  for (const g of v.gaps) { order(g.intake.actions); g.intake.feedback.sort((a, b) => canonical(a) < canonical(b) ? -1 : canonical(a) > canonical(b) ? 1 : 0); }
  return v;
}
