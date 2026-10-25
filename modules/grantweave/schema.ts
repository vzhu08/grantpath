import { z } from "zod";

export const INPUT_VERSION = "grantweave.input.v1" as const;
export const SOLVER_VERSION = "grantweave.dfs.v1" as const;
export const RESULT_VERSION = "grantweave.result.v1" as const;
export const id = z.string().regex(/^[A-Za-z0-9_-]{1,100}$/);
const text = z.string().min(1).max(2000);
export const digest = z.string().regex(/^[a-f0-9]{64}$/);
export const cents = z.string().regex(/^(0|[1-9][0-9]{0,17})$/);
const positiveCents = cents.refine((v) => v !== "0", "Cost must be positive");
const integer = z.number().int().min(0).max(1_000_000_000);
export const date = z.string().regex(/^[1-9][0-9]{3}-[0-9]{2}-[0-9]{2}$/).refine(
  (v) => !Number.isNaN(Date.parse(v)) && new Date(v).toISOString().slice(0, 10) === v,
  "Invalid calendar date",
);
const month = z.string().regex(/^[1-9][0-9]{3}-(0[1-9]|1[0-2])$/);
const interval = z.strictObject({ start: date, end: date }).refine((v) => v.start <= v.end);
const refs = z.array(id).max(40);
const source = z.strictObject({ id, version: id, kind: z.enum(["synthetic", "manual"]), text: z.string().min(1).max(20_000), sha256: digest });
const claim = z.strictObject({
  id, sourceId: id, status: z.enum(["synthetic_confirmed", "confirmed", "proposed", "unknown"]),
  start: integer, end: integer, quote: z.string().min(1).max(20_000), interpretation: text,
  actor: text, recordedAt: z.iso.datetime(),
});
export const DependencySchema = z.strictObject({ key: id, version: id, digest });
const demand = z.strictObject({ capacityId: id, amount: integer });
const workPackage = z.strictObject({
  id, label: text, required: z.literal(true), interval, predecessors: z.array(id).max(6),
  effort: z.array(demand).max(72), resources: z.array(demand).max(72), claimId: id,
});
const cost = z.strictObject({ id, economicId: id, packageId: id, category: id, amountCents: positiveCents, incurredOn: date, claimId: id });
const capacity = z.strictObject({ id, subjectId: id, month, unit: id, capacity: integer.nullable(), outside: integer.nullable(), claimId: id });
const categoryCap = z.strictObject({ category: id, capCents: cents.nullable() });
const periodCap = z.strictObject({ id, interval, capCents: cents.nullable(), claimId: id });
const funding = z.strictObject({
  id, kind: z.enum(["secured", "hypothetical"]),
  basis: z.enum(["confirmed_eligible_residual", "explicit_scenario_amount"]),
  currency: z.literal("USD").nullable(), scale: z.literal(2), capacityCents: cents.nullable(),
  packageIds: z.array(id).max(6).nullable(), categories: z.array(categoryCap).max(12).nullable(),
  budgetWindow: interval.nullable(), performanceWindow: interval.nullable(),
  periodCaps: z.array(periodCap).max(12), claimId: id,
});
const existing = z.strictObject({ id, economicId: id, sourceId: id, packageIds: z.array(id).min(1).max(6), interval, kind: z.enum(["paid", "committed", "external"]), claimId: id });
const restriction = z.discriminatedUnion("kind", [
  z.strictObject({ id, kind: z.literal("scoped_support_exclusion"), stage: z.literal("support"), sourceIds: z.tuple([id, id]), packageIds: z.array(id).min(1).max(6), interval, claimId: id }),
  z.strictObject({ id, kind: z.literal("disallow_cost"), sourceId: id, costId: id, claimId: id }),
]);
export const ModelSchema = z.strictObject({
  id, version: id, label: z.enum(["synthetic", "confirmed_assumptions"]),
  sources: z.array(source).min(1).max(40), claims: z.array(claim).min(1).max(80),
  packages: z.array(workPackage).min(1).max(6), costs: z.array(cost).min(1).max(12),
  funding: z.array(funding).min(1).max(5), effort: z.array(capacity).max(72), resources: z.array(capacity).max(72),
  existingSupport: z.array(existing).max(40), restrictions: z.array(restriction).max(40),
  // These explicit attestations also cover no additional period caps/restrictions/support.
  completenessClaimIds: refs.min(1), dependencies: z.array(DependencySchema).max(80),
});
export const BranchSchema = z.strictObject({ id, version: id, outcomes: z.array(z.strictObject({ sourceId: id, outcome: z.enum(["assumed_awarded", "failed", "not_assumed"]) })).max(5) });
export const InputSchema = z.strictObject({
  contractVersion: z.literal(INPUT_VERSION), model: ModelSchema, branch: BranchSchema,
  limits: z.strictObject({ maxNodes: z.number().int().min(1).max(50_000), maxWitnesses: z.number().int().min(1).max(3) }),
});
export const WitnessSchema = z.strictObject({ version: z.literal("grantweave.witness.v1"), assignments: z.array(z.strictObject({ costId: id, sourceId: id })).max(12) });
export type Input = z.infer<typeof InputSchema>;
export type Model = Input["model"];
export type Funding = Model["funding"][number];
export type Cost = Model["costs"][number];
export type Witness = z.infer<typeof WitnessSchema>;
export type Dependency = z.infer<typeof DependencySchema>;
