import { WitnessSchema, type Input, type Witness, type Funding, type Cost } from "./schema";
import { validateInput, ascii, type Issue } from "./validation";

export type Constraint = { id: string; refs: string[]; unit: string; used: string; cap: string; slack: string; satisfied: boolean };
export const active = (input: Input, f: Funding) => f.kind === "secured" || input.branch.outcomes.some((x) => x.sourceId === f.id && x.outcome === "assumed_awarded");
export const overlaps = (a: { start: string; end: string }, b: { start: string; end: string }) => a.start <= b.end && b.start <= a.end;
export function constraint(id: string, refs: string[], unit: string, used: bigint, cap: bigint): Constraint {
  return { id, refs: [...new Set(refs)].sort(ascii), unit, used: String(used), cap: String(cap), slack: String(cap - used), satisfied: used <= cap };
}
export function fixedConstraints(input: Input): Constraint[] {
  const m = input.model, rows: Constraint[] = [];
  for (const kind of ["effort", "resources"] as const) for (const c of m[kind]) {
    const used = BigInt(c.outside!) + m.packages.reduce((sum, p) => sum + BigInt(p[kind].find((v) => v.capacityId === c.id)?.amount ?? 0), 0n);
    rows.push(constraint(`${kind}:${c.id}`, [c.claimId, ...m.packages.filter((p) => p[kind].some((d) => d.capacityId === c.id)).map((p) => p.claimId)], c.unit, used, BigInt(c.capacity!)));
  }
  for (const p of m.packages) for (const prior of p.predecessors) {
    const predecessor = m.packages.find((v) => v.id === prior)!;
    rows.push(constraint(`dependency:${prior}:${p.id}`, [predecessor.claimId, p.claimId], "finish_before_start", predecessor.interval.end < p.interval.start ? 0n : 1n, 0n));
  }
  return rows.sort((a, b) => ascii(a.id, b.id));
}

// This checker scans original records and recomputes all sums. It never reads DFS domains,
// running balances, pruning flags or a claimed result's totals.
export function checkReadyWitness(input: Input, witness: Witness): { valid: boolean; issues: Issue[]; constraints: Constraint[] } {
  const m = input.model, issues: Issue[] = [], rows = fixedConstraints(input);
  const bad = (code: string, detail: string, ...refs: string[]) => issues.push({ code, detail, refs });
  for (const a of witness.assignments) {
    if (!m.costs.some((c) => c.id === a.costId) || !m.funding.some((f) => f.id === a.sourceId)) bad("reference", "Unknown witness cost/source", a.costId, a.sourceId);
  }
  for (const c of m.costs) {
    const matches = witness.assignments.filter((a) => a.costId === c.id);
    if (matches.length !== 1) { bad("cost_conservation", `Cost has ${matches.length} assignments; exactly one required`, c.id); continue; }
    const f = m.funding.find((v) => v.id === matches[0].sourceId);
    const p = m.packages.find((v) => v.id === c.packageId)!;
    if (!f) continue;
    if (!active(input, f) || !f.packageIds!.includes(c.packageId) || !f.categories!.some((v) => v.category === c.category) || c.incurredOn < f.budgetWindow!.start || c.incurredOn > f.budgetWindow!.end || p.interval.start < f.performanceWindow!.start || p.interval.end > f.performanceWindow!.end) bad("eligibility", "Assignment violates branch/category/package/date terms", c.id, f.id, f.claimId);
    for (const r of m.restrictions) if (r.kind === "disallow_cost" && r.costId === c.id && r.sourceId === f.id) bad("disallow_cost", "Explicit cost/source exclusion", r.id, r.claimId);
  }
  for (const f of m.funding) {
    const allocated = m.costs.filter((c) => witness.assignments.some((a) => a.costId === c.id && a.sourceId === f.id));
    const sum = (costs: Cost[]) => costs.reduce((n, c) => n + BigInt(c.amountCents), 0n);
    rows.push(constraint(`total:${f.id}`, [f.claimId], "USD_cents", sum(allocated), active(input, f) ? BigInt(f.capacityCents!) : 0n));
    for (const c of f.categories!) rows.push(constraint(`category:${f.id}:${c.category}`, [f.claimId], "USD_cents", sum(allocated.filter((v) => v.category === c.category)), BigInt(c.capCents!)));
    for (const p of f.periodCaps) rows.push(constraint(`period:${f.id}:${p.id}`, [f.claimId, p.claimId], "USD_cents", sum(allocated.filter((v) => v.incurredOn >= p.interval.start && v.incurredOn <= p.interval.end)), BigInt(p.capCents!)));
  }
  for (const r of m.restrictions) if (r.kind === "scoped_support_exclusion") {
    const supporting = r.sourceIds.filter((sourceId) =>
      m.existingSupport.some((s) => s.sourceId === sourceId && s.packageIds.some((p) => r.packageIds.includes(p)) && overlaps(s.interval, r.interval)) ||
      m.costs.some((c) => r.packageIds.includes(c.packageId) && overlaps(m.packages.find((p) => p.id === c.packageId)!.interval, r.interval) && witness.assignments.some((a) => a.costId === c.id && a.sourceId === sourceId)));
    rows.push(constraint(`support:${r.id}`, [r.claimId, ...m.existingSupport.filter((s) => r.sourceIds.includes(s.sourceId) && s.packageIds.some((p) => r.packageIds.includes(p)) && overlaps(s.interval, r.interval)).map((s) => s.claimId)], "supporting_sources", BigInt(supporting.length), 1n));
  }
  rows.sort((a, b) => ascii(a.id, b.id));
  for (const r of rows.filter((x) => !x.satisfied)) bad("constraint", `Used ${r.used} exceeds ${r.cap} ${r.unit}`, r.id, ...r.refs);
  return { valid: issues.length === 0, issues, constraints: rows };
}
export function validateWitness(raw: unknown, candidate: unknown) {
  const model = validateInput(raw);
  if (model.status !== "ready") return model;
  const witness = WitnessSchema.safeParse(candidate);
  if (!witness.success) return { status: "invalid_witness" as const, issues: witness.error.issues.map((v) => ({ code: "shape", detail: v.message, refs: [v.path.join(".")] })) };
  const result = checkReadyWitness(model.input, witness.data);
  return { status: result.valid ? "valid_witness" as const : "invalid_witness" as const, ...result };
}
