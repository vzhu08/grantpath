import { RESULT_VERSION, SOLVER_VERSION, type Cost, type Funding, type Input, type Witness } from "./schema";
import { active, checkReadyWitness, constraint, fixedConstraints, overlaps, type Constraint } from "./checker";
import { ascii, validateInput, type Issue } from "./validation";

export type SolveResult = {
  contractVersion: typeof RESULT_VERSION; solverVersion: typeof SOLVER_VERSION;
  status: "feasible" | "infeasible" | "unknown" | "needs_input" | "invalid_model" | "error";
  fingerprint: string | null; branchId: string | null; label: "synthetic" | "confirmed_assumptions" | null;
  nodes: number; searchComplete: boolean; stopReason: "exhausted" | "direct_proof" | "node_limit" | "witness_limit" | "validation" | "internal_error";
  issues: Issue[]; witnesses: { witness: Witness; constraints: Constraint[] }[];
  proof: { kind: "direct" | "exhaustive"; constraints: Constraint[]; sufficientClaimIds: string[]; minimal: false } | null;
  exclusions: { costId: string; sourceId: string; reasons: string[]; refs: string[] }[];
};

export function solve(raw: unknown): SolveResult {
  const base: SolveResult = { contractVersion: RESULT_VERSION, solverVersion: SOLVER_VERSION, status: "error", fingerprint: null, branchId: null, label: null, nodes: 0, searchComplete: false, stopReason: "internal_error", issues: [], witnesses: [], proof: null, exclusions: [] };
  try {
    const validation = validateInput(raw);
    if (validation.status !== "ready") return { ...base, status: validation.status, issues: validation.issues, stopReason: "validation" };
    const input = validation.input, m = input.model;
    Object.assign(base, { fingerprint: validation.fingerprint, branchId: input.branch.id, label: m.label });
    const sufficientClaimIds = m.claims.map((x) => x.id).sort(ascii);
    const direct = (rows: Constraint[]): SolveResult => ({ ...base, status: "infeasible", searchComplete: true, stopReason: "direct_proof", proof: { kind: "direct", constraints: rows, sufficientClaimIds, minimal: false } });
    const fixed = fixedConstraints(input).filter((x) => !x.satisfied);
    if (fixed.length) return direct(fixed);
    const required = m.costs.reduce((s, c) => s + BigInt(c.amountCents), 0n);
    const available = m.funding.reduce((s, f) => s + (active(input, f) ? BigInt(f.capacityCents!) : 0n), 0n);
    if (required > available) return direct([constraint("necessary_total_capacity", m.funding.map((f) => f.claimId), "USD_cents", required, available)]);
    const funding = [...m.funding].sort((a, b) => ascii(a.id, b.id));
    const domains = new Map<string, Funding[]>();
    for (const c of [...m.costs].sort((a, b) => ascii(a.id, b.id))) {
      const p = m.packages.find((v) => v.id === c.packageId)!;
      const choices: Funding[] = [];
      for (const f of funding) {
        const reasons: string[] = [], refs = [c.claimId, f.claimId];
        if (!active(input, f)) reasons.push("branch_inactive");
        if (!f.packageIds!.includes(c.packageId)) reasons.push("package");
        const category = f.categories!.find((v) => v.category === c.category);
        if (!category) reasons.push("category");
        if (c.incurredOn < f.budgetWindow!.start || c.incurredOn > f.budgetWindow!.end) reasons.push("budget_date");
        if (p.interval.start < f.performanceWindow!.start || p.interval.end > f.performanceWindow!.end) reasons.push("performance_interval");
        if (BigInt(c.amountCents) > BigInt(f.capacityCents!)) reasons.push("total_cap");
        if (category && BigInt(c.amountCents) > BigInt(category.capCents!)) reasons.push("category_cap");
        for (const t of f.periodCaps) if (c.incurredOn >= t.interval.start && c.incurredOn <= t.interval.end && BigInt(c.amountCents) > BigInt(t.capCents!)) { reasons.push(`period_cap:${t.id}`); refs.push(t.claimId); }
        for (const r of m.restrictions) if (r.kind === "disallow_cost" && r.costId === c.id && r.sourceId === f.id) { reasons.push(`disallow_cost:${r.id}`); refs.push(r.claimId); }
        if (reasons.length) base.exclusions.push({ costId: c.id, sourceId: f.id, reasons, refs }); else choices.push(f);
      }
      domains.set(c.id, choices);
    }
    const empty = m.costs.filter((c) => !domains.get(c.id)!.length);
    if (empty.length) return direct(empty.map((c) => constraint(`eligible_sources:${c.id}`, [c.claimId, ...base.exclusions.filter((x) => x.costId === c.id).flatMap((x) => x.refs)], "required_assignment", 1n, 0n)));
    const costs = [...m.costs].sort((a, b) => domains.get(a.id)!.length - domains.get(b.id)!.length || ascii(a.id, b.id));
    const allocations = new Map<string, string>();
    const permitted = (c: Cost, f: Funding) => {
      const assigned = costs.filter((v) => allocations.get(v.id) === f.id).concat(c);
      if (assigned.reduce((s, v) => s + BigInt(v.amountCents), 0n) > BigInt(f.capacityCents!)) return false;
      for (const cat of f.categories!) if (assigned.filter((v) => v.category === cat.category).reduce((s, v) => s + BigInt(v.amountCents), 0n) > BigInt(cat.capCents!)) return false;
      for (const t of f.periodCaps) if (assigned.filter((v) => v.incurredOn >= t.interval.start && v.incurredOn <= t.interval.end).reduce((s, v) => s + BigInt(v.amountCents), 0n) > BigInt(t.capCents!)) return false;
      const candidate = new Map(allocations).set(c.id, f.id);
      for (const r of m.restrictions) if (r.kind === "scoped_support_exclusion") {
        const inScope = new Set<string>();
        for (const s of m.existingSupport) if (r.sourceIds.includes(s.sourceId) && s.packageIds.some((p) => r.packageIds.includes(p)) && overlaps(s.interval, r.interval)) inScope.add(s.sourceId);
        for (const [costId, sourceId] of candidate) {
          const item = m.costs.find((v) => v.id === costId)!;
          if (r.sourceIds.includes(sourceId) && r.packageIds.includes(item.packageId) && overlaps(m.packages.find((v) => v.id === item.packageId)!.interval, r.interval)) inScope.add(sourceId);
        }
        if (inScope.size > 1) return false;
      }
      return true;
    };
    let stop: "node_limit" | "witness_limit" | null = null;
    const dfs = (index: number): void => {
      if (base.nodes === input.limits.maxNodes) { stop = "node_limit"; return; }
      base.nodes++;
      if (index === costs.length) {
        const witness: Witness = { version: "grantweave.witness.v1", assignments: [...allocations].map(([costId, sourceId]) => ({ costId, sourceId })).sort((a, b) => ascii(a.costId, b.costId)) };
        const checked = checkReadyWitness(input, witness);
        if (!checked.valid) throw new Error("Independent witness verification failed");
        base.witnesses.push({ witness, constraints: checked.constraints });
        if (base.witnesses.length === input.limits.maxWitnesses) stop = "witness_limit";
        return;
      }
      const c = costs[index];
      for (const f of domains.get(c.id)!) {
        if (!permitted(c, f)) continue;
        allocations.set(c.id, f.id); dfs(index + 1); allocations.delete(c.id);
        if (stop) return;
      }
    };
    dfs(0);
    return { ...base, status: base.witnesses.length ? "feasible" : stop ? "unknown" : "infeasible", searchComplete: !stop, stopReason: stop ?? "exhausted", proof: !base.witnesses.length && !stop ? { kind: "exhaustive", constraints: [], sufficientClaimIds, minimal: false } : null };
  } catch {
    return { ...base, status: "error", witnesses: [], proof: null, searchComplete: false, stopReason: "internal_error", issues: [{ code: "internal_error", refs: [], detail: "No compatibility conclusion; retry with the retained input" }] };
  }
}
