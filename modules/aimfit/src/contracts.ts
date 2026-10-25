import { z } from "zod";
import { digest } from "./canonical";

export const VERSION = "aimfit-core-v1" as const;
const text = z.string().min(1).max(2000).refine(v => v.trim().length > 0,"Nonblank text required; exact characters retained");
const id = z.string().regex(/^[A-Za-z0-9_-]{1,100}$/);
const hash = z.string().regex(/^[a-f0-9]{64}$/);
const integer = z.number().int().safe().nonnegative();
export const Decimal = z.string().regex(/^(0|[1-9]\d*)(\.\d*[1-9])?$/).refine(v => {
  const [a, b = ""] = v.split("."); return a.length + b.length <= 12 && b.length <= 6;
}, "At most twelve total and six fractional digits");
export const PositiveDecimal = Decimal.refine(v => Number(v) > 0);
export const Cents = z.string().regex(/^(0|[1-9]\d{0,17})$/);
export const Provenance = z.discriminatedUnion("kind", [
  z.object({ kind: z.literal("manual"), rationale: text, actor: id, reviewedAt: z.iso.datetime() }).strict(),
  z.object({ kind: z.literal("synthetic"), rationale: text, actor: id, reviewedAt: z.iso.datetime() }).strict(),
  z.object({ kind: z.literal("source"), rationale: text, actor: id, reviewedAt: z.iso.datetime(),
    sourceId: id, versionId: id, projectId: id, hashAlgorithm: z.enum(["sha256", "fnv-pair"]), upstreamHash: text,
    quotation: text, startUtf16: integer, endUtf16: integer,
  }).strict().refine(v => v.endUtf16 > v.startUtf16 && v.endUtf16 - v.startUtf16 === v.quotation.length, "Exact UTF-16 quotation span")
]);
export function assumption<S extends z.ZodType>(value: S) {
  return z.discriminatedUnion("status", [
    z.object({ status: z.literal("confirmed"), value, provenance: Provenance }).strict(),
    z.object({ status: z.literal("unknown"), reason: text }).strict(),
  ]);
}
function limit<S extends z.ZodType>(value: S) {
  return z.union([assumption(value), z.object({ status: z.literal("not_modelled"), reason: text }).strict()]);
}
const CostLine = z.object({ id, label: text, cents: assumption(Cents) }).strict();
export const CostCatalog = z.object({ version: z.literal("aimfit-cost-v1"), id,
  fixed: z.array(CostLine).min(1).max(20), perRecruit: z.array(CostLine).min(1).max(20),
  completeness: assumption(z.literal("all-in")), exclusions: z.array(text).max(20),
}).strict().refine(v => new Set([...v.fixed, ...v.perRecruit].map(x => x.id)).size === v.fixed.length + v.perRecruit.length, "Unique cost line IDs");
export const NumericalInputs = z.object({ delta: assumption(PositiveDecimal), sigma: assumption(PositiveDecimal),
  targetPower: assumption(Decimal.refine(v => Number(v) >= .6 && Number(v) <= .95)),
  nominalHalfWidthTarget: z.union([assumption(PositiveDecimal), z.object({ status: z.literal("not_modelled"), reason: text }).strict()]),
}).strict();
export const Scenario = z.object({ id, label: text, confirmed: z.literal(true), numerical: NumericalInputs,
  attritionBps: assumption(integer.max(5000)), costs: CostCatalog,
  ceiling: assumption(z.object({ cents: Cents, currency: z.literal("USD"), role: z.enum(["manual-scenario", "proposal-request", "award-context"]) }).strict()),
  resourceLimit: limit(integer.positive().max(1000000)),
  timeline: limit(z.object({ setupWeeks: integer.max(10000), followupWeeks: integer.max(10000), analysisWeeks: integer.max(10000),
    balancedRecruitsPerWeek: integer.positive().max(1000000), maxWeeks: integer.max(10000) }).strict()),
}).strict();
export const Dependency = z.object({ kind: z.enum(["science", "cost", "evidence", "proposal", "budget"]), key: id, projectId: id,
  version: text, hashAlgorithm: z.enum(["sha256", "fnv-pair"]), hash: text }).strict().refine(v => v.hashAlgorithm !== "sha256" || /^[a-f0-9]{64}$/.test(v.hash),"Malformed SHA-256 dependency");
export const RevisionCopy = z.object({ projectId: id,applicationId: id,sectionId: id,revisionId: id,text: z.string().min(1).max(20000) }).strict();
export function proposalDependency(revision: z.infer<typeof RevisionCopy>): z.infer<typeof Dependency> {
  const copy = RevisionCopy.parse(revision);
  return { kind: "proposal",key: copy.sectionId,projectId: copy.projectId,version: copy.revisionId,hashAlgorithm: "sha256",hash: digest(copy) };
}
export const AssumptionSet = z.object({ version: z.literal(VERSION), id, projectId: id, applicationId: id,
  parentAssumptionDigest: hash.nullable(), family: z.literal("two-independent-groups-pooled-t"),
  question: z.object({ population: text, groups: z.tuple([text, text]), outcome: text, units: text,
    measurementOccasion: text, contrast: text, direction: z.enum(["group1-minus-group2", "group2-minus-group1"]),
    model: z.literal("independent-normal-common-variance"), interpretation: text, provenance: Provenance }).strict(),
  variants: z.array(z.object({ id, nPerArm: integer.min(2).max(1000), explanation: text,confirmed: z.literal(true),provenance: Provenance }).strict()).min(1).max(3),
  scenarios: z.array(Scenario).min(1).max(7), dependencies: z.array(Dependency).max(40),proposalRevisions: z.array(RevisionCopy).max(20),
}).strict().superRefine((v, ctx) => {
  for (const [label, values] of [["variant IDs", v.variants.map(x => x.id)], ["sample sizes", v.variants.map(x => x.nPerArm)],
    ["scenario IDs", v.scenarios.map(x => x.id)], ["dependency keys", v.dependencies.map(x => x.key)]] as const) {
    if (new Set<string | number>(values).size !== values.length) ctx.addIssue({ code: "custom", message: `Duplicate ${label}` });
  }
  const visit = (x: unknown): void => { if (!x || typeof x !== "object") return;
    const obj = x as Record<string, unknown>;
    if (obj.kind === "source" && obj.projectId !== v.projectId) ctx.addIssue({ code: "custom", message: "Cross-project assumption source" });
    Object.values(obj).forEach(visit);
    if (obj.kind === "source" && !v.dependencies.some(d => d.kind === "evidence" && d.key === obj.sourceId && d.version === obj.versionId && d.hashAlgorithm === obj.hashAlgorithm && d.hash === obj.upstreamHash)) ctx.addIssue({ code: "custom", message: "Source requires matching evidence dependency" });
  }; visit(v);
  if (v.dependencies.some(x => x.projectId !== v.projectId)) ctx.addIssue({ code: "custom", message: "Cross-project dependency" });
  if (v.proposalRevisions.some(x => x.projectId !== v.projectId || x.applicationId !== v.applicationId) || new Set(v.proposalRevisions.map(x => x.sectionId)).size !== v.proposalRevisions.length) ctx.addIssue({ code: "custom",message: "Proposal copies must have same scope and unique sections" });
  if (v.dependencies.some(d => d.kind === "proposal" && !v.proposalRevisions.some(r => r.sectionId === d.key && digest(proposalDependency(r)) === digest(d)))) ctx.addIssue({ code: "custom",message: "Proposal dependency must bind exact retained revision copy" });
});
export type AimFitInput = z.infer<typeof AssumptionSet>;
export type ScenarioInput = z.infer<typeof Scenario>;
export const OutputDecimal = z.string().regex(/^(0|[1-9]\d*)(\.\d*[1-9])?$/).max(80).refine(v => Number.isFinite(Number(v)));
export const Point = z.object({ nPerArm: integer.min(2).max(1000), power: OutputDecimal.refine(v => Number(v) >= 0 && Number(v) <= 1),
  nominalHalfWidth: OutputDecimal.refine(v => Number(v) > 0) }).strict();
export type NumericPoint = z.infer<typeof Point>;
export const Search = z.discriminatedUnion("status", [
  z.object({ status: z.literal("found"), point: Point, predecessor: Point.nullable() }).strict(),
  z.object({ status: z.literal("beyond_supported_range") }).strict(),
  z.object({ status: z.literal("boundary_review") }).strict(),
]);
export const EngineIdentity = z.object({ method: z.literal("pooled-t-both-tails-v1"), protocol: z.literal("aimfit-numeric-v1"),
  python: z.literal("3.12.10"), scipy: z.literal("1.15.3"), numpy: z.literal("2.1.3"), workerSha256: hash,
  pythonSha256: hash,platform: z.enum(["win32-x64","linux-x64"]),
  referenceStatus: z.literal("r-pending") }).strict();
export const NumericResponse = z.object({ version: z.literal("aimfit-numeric-v1"), engine: EngineIdentity,
  scenarios: z.array(z.object({ id, points: z.array(Point).max(3), search: Search }).strict()).max(7) }).strict();
export type NumericResult = z.infer<typeof NumericResponse>;
export type NumericQuery = { id: string; delta: string; sigma: string; targetPower: string; halfWidth: string | null; ns: number[] };
export const FailureCode = z.enum(["runtime_missing","runtime_busy","invalid_query_count","invalid_runtime_configuration","runtime_identity_mismatch","input_capacity","runtime_timeout","output_capacity","stderr_capacity","runtime_input_failure","runtime_spawn_failure","runtime_failed_or_warned","invalid_runtime_output","invalid_or_failed_engine"]);
export type NumericOutcome = { status: "computed_unverified"; result: NumericResult } | { status: "unavailable"; code: z.infer<typeof FailureCode> };
export interface NumericalPort { calculate(queries: NumericQuery[]): Promise<NumericOutcome> }
