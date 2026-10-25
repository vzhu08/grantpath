// Independent complete enumeration. No imports from evaluator/search/validation.
import type { Input } from "../../modules/grantweave/schema";
export function oracle(x: Input): { leaves: number; solutions: string[][] } {
  const m = x.model, solutions: string[][] = []; let leaves = 0;
  const valid = (choices: string[]) => {
    for (const p of m.packages) for (const pred of p.predecessors) if (m.packages.find((v) => v.id === pred)!.interval.end >= p.interval.start) return false;
    for (const kind of ["effort", "resources"] as const) for (const c of m[kind]) {
      let used = c.outside!;
      for (const p of m.packages) for (const d of p[kind]) if (d.capacityId === c.id) used += d.amount;
      if (used > c.capacity!) return false;
    }
    for (let i = 0; i < m.costs.length; i++) {
      const c = m.costs[i], f = m.funding.find((v) => v.id === choices[i])!, p = m.packages.find((v) => v.id === c.packageId)!;
      if (f.kind === "hypothetical" && !x.branch.outcomes.some((v) => v.sourceId === f.id && v.outcome === "assumed_awarded")) return false;
      if (!f.packageIds!.includes(c.packageId) || !f.categories!.some((v) => v.category === c.category)) return false;
      if (c.incurredOn < f.budgetWindow!.start || c.incurredOn > f.budgetWindow!.end || p.interval.start < f.performanceWindow!.start || p.interval.end > f.performanceWindow!.end) return false;
      if (m.restrictions.some((r) => r.kind === "disallow_cost" && r.sourceId === f.id && r.costId === c.id)) return false;
    }
    for (const f of m.funding) {
      let used = 0n;
      for (let i = 0; i < m.costs.length; i++) if (choices[i] === f.id) used += BigInt(m.costs[i].amountCents);
      if (used > BigInt(f.capacityCents!)) return false;
      for (const cat of f.categories!) {
        let sum = 0n;
        for (let i = 0; i < m.costs.length; i++) if (choices[i] === f.id && m.costs[i].category === cat.category) sum += BigInt(m.costs[i].amountCents);
        if (sum > BigInt(cat.capCents!)) return false;
      }
      for (const period of f.periodCaps) {
        let sum = 0n;
        for (let i = 0; i < m.costs.length; i++) if (choices[i] === f.id && m.costs[i].incurredOn >= period.interval.start && m.costs[i].incurredOn <= period.interval.end) sum += BigInt(m.costs[i].amountCents);
        if (sum > BigInt(period.capCents!)) return false;
      }
    }
    for (const r of m.restrictions) if (r.kind === "scoped_support_exclusion") {
      const supported = new Set<string>();
      for (const s of m.existingSupport) if (r.sourceIds.includes(s.sourceId) && s.packageIds.some((p) => r.packageIds.includes(p)) && !(s.interval.end < r.interval.start || s.interval.start > r.interval.end)) supported.add(s.sourceId);
      for (let i = 0; i < m.costs.length; i++) {
        const c = m.costs[i], p = m.packages.find((v) => v.id === c.packageId)!;
        if (r.sourceIds.includes(choices[i]) && r.packageIds.includes(c.packageId) && !(p.interval.end < r.interval.start || p.interval.start > r.interval.end)) supported.add(choices[i]);
      }
      if (supported.size > 1) return false;
    }
    return true;
  };
  const all = (choices: string[]) => {
    if (choices.length === m.costs.length) { leaves++; if (valid(choices)) solutions.push(choices); return; }
    for (const f of m.funding) all([...choices, f.id]);
  };
  all([]); return { leaves, solutions };
}
