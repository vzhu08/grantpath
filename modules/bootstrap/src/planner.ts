import { z } from "zod";
import { POLICY, inputDigest, validateInput, type Interval } from "./model";

const numeric = z.number().int().nonnegative().safe();
const aggregate = z.object({ low: numeric.nullable(), high: numeric.nullable(), reason: z.string() }).strict();
const totals = z.object({ cashCents: aggregate, elapsedMinutes: aggregate, effortMinutes: aggregate, computeMinutes: aggregate, ramMiB: numeric.nullable(), storageMiB: numeric.nullable() }).strict();
export const BundleSchema = z.object({ nodeIds: z.array(z.string()), productIds: z.array(z.string()), coveredGapIds: z.array(z.string()), uncoveredGapIds: z.array(z.string()), possibleGapIds: z.array(z.string()), totals,
  violations: z.array(z.string()), uncertainties: z.array(z.string()), coverageUncertainties: z.array(z.string()),
}).strict();
export type Bundle = z.infer<typeof BundleSchema>;
export const BranchSchema = z.object({ id: z.enum(["confirmed", "hypothetical"]), conditional: z.boolean(), fundingIds: z.array(z.string()), conditions: z.array(z.string()), fundingNotes: z.array(z.string()), availableCashCents: numeric.nullable(), guaranteedCashCents: numeric, maximumPossibleCashCents: numeric.nullable(),
  outcome: z.enum(["complete", "partial", "infeasible", "needs-input"]), completeStatus: z.enum(["robust-complete", "no-robust-complete", "needs-input"]), minimumStatus: z.enum(["proven-minimum", "best-known", "none"]), coverageNotes: z.array(z.string()),
  complete: BundleSchema.nullable(), partials: z.array(BundleSchema).max(8), frontierCount: numeric, frontierTruncated: z.boolean(),
  alternatives: z.array(z.object({ nodeIds: z.array(z.string()), violations: z.array(z.string()), uncertainties: z.array(z.string()) }).strict()).max(32), alternativeCount: numeric, alternativesTruncated: z.boolean(),
  enumeratedSubsetCount: numeric, uniqueClosureCount: numeric,
}).strict();
export const PlanningResultSchema = z.object({ schemaVersion: z.literal(1), policy: z.literal(POLICY), mode: z.literal("synthetic-demo-planning-only"), scientificValidation: z.literal("deferred"), execution: z.literal("none"), inputDigest: z.string().regex(/^[a-f0-9]{64}$/), requiredGapIds: z.array(z.string()), branches: z.array(BranchSchema).min(1).max(2) }).strict();
export type PlanningResult = z.infer<typeof PlanningResultSchema>;
const lex = (a: string, b: string) => a < b ? -1 : a > b ? 1 : 0;
const sorted = (ids: Iterable<string>) => [...new Set(ids)].sort(lex);
const expired = (p: { asOf: string; validUntil: string }, at: string) => Date.parse(at) < Date.parse(p.asOf) || Date.parse(at) > Date.parse(p.validUntil);
function sum(xs: Interval[]): Interval {
  const add = (key: "low" | "high") => xs.some(x => x[key] === null) ? null : xs.reduce((n, x) => n + x[key]!, 0);
  return { low: add("low"), high: add("high"), reason: "Sum of unique future work nodes; bounds are assumptions, not probability intervals." };
}
function compare(a: Bundle, b: Bundle) {
  return a.totals.cashCents.high! - b.totals.cashCents.high! || a.totals.elapsedMinutes.high! - b.totals.elapsedMinutes.high! || a.totals.effortMinutes.high! - b.totals.effortMinutes.high! || lex(a.nodeIds.join("|"), b.nodeIds.join("|"));
}
function dominates(a: Bundle, b: Bundle) {
  return b.coveredGapIds.every(g => a.coveredGapIds.includes(g)) && a.totals.cashCents.high! <= b.totals.cashCents.high! && a.totals.elapsedMinutes.high! <= b.totals.elapsedMinutes.high! && a.totals.effortMinutes.high! <= b.totals.effortMinutes.high! &&
    (a.coveredGapIds.length > b.coveredGapIds.length || a.totals.cashCents.high! < b.totals.cashCents.high! || a.totals.elapsedMinutes.high! < b.totals.elapsedMinutes.high! || a.totals.effortMinutes.high! < b.totals.effortMinutes.high!);
}

/** Bounded exhaustive subset search. No fetching, execution, persistence or task-03 writes. */
export function planBootstrap(raw: unknown): PlanningResult {
  const input = validateInput(raw);
  const required = sorted(input.gaps.filter(g => g.required).map(g => g.id));
  const nodes = [...input.catalog.nodes].sort((a, b) => lex(a.id, b.id));
  const byId = new Map(nodes.map(n => [n.id, n]));
  const closures = new Map<string, string[]>();
  for (let mask = 0; mask < 2 ** nodes.length; mask++) {
    const ids = new Set(nodes.filter((_, i) => mask & (1 << i)).map(n => n.id));
    for (const id of ids) for (const ref of [...byId.get(id)!.dependencies, ...byId.get(id)!.requiredTogether]) ids.add(ref);
    const key = sorted(ids); closures.set(key.join("|"), key);
  }
  const branch = (hypothetical: boolean): z.infer<typeof BranchSchema> => {
    const assumptions = hypothetical ? input.hypotheticalFundingIds : [];
    const resourceValid = !expired(input.resources.provenance, input.asOf);
    let cash = resourceValid ? input.resources.cashCents.value ?? 0 : 0;
    let cashUnknown = input.resources.cashCents.value === null || !resourceValid;
    let cashCeiling: number | null = resourceValid ? input.resources.cashCents.value : null;
    const fundingIds: string[] = [], conditions: string[] = [], fundingNotes: string[] = [];
    for (const f of input.funding) {
      const selected = assumptions.includes(f.id);
      if (selected) conditions.push(`${f.id}: ${f.condition}; approval, amount, scope and availability before work must be confirmed.`);
      if (f.status !== "confirmed" && !selected) { fundingNotes.push(`${f.id}: ${f.status}; not counted.`); continue; }
      if (f.available === "after-window" || f.scope === "restricted") { fundingNotes.push(`${f.id}: unavailable/restricted; not counted.`); continue; }
      if (cashCeiling !== null) cashCeiling = f.amountCents.value === null || expired(f.provenance, input.asOf) ? null : cashCeiling + f.amountCents.value;
      if (f.available === "unknown" || f.scope === "unknown" || f.amountCents.value === null || expired(f.provenance, input.asOf)) { cashUnknown = true; fundingNotes.push(`${f.id}: availability, amount, scope or dated provenance needs input; not counted.`); continue; }
      cash += f.amountCents.value; fundingIds.push(f.id);
    }
    const evaluated: Bundle[] = [];
    for (const ids of closures.values()) {
      if (!ids.length) continue;
      const selected = ids.map(id => byId.get(id)!);
      const proof = (kind: "cashCents" | "effortMinutes" | "elapsedMinutes" | "computeMinutes") => selected.reduce((s, n) => s + (expired(n.provenance, input.asOf) ? 0 : n[kind].high ?? n[kind].low ?? 0), 0);
      const violations: string[] = [], uncertainties: string[] = [], coverageUncertainties: string[] = [];
      const groups = new Set<string>();
      for (const n of selected) {
        for (const group of n.exclusionGroups) { if (groups.has(group)) violations.push(`exclusivity:${group}`); groups.add(group); }
        if (n.suitability === "rejected") violations.push(`suitability:${n.id}:rejected`);
        if (n.suitability === "unknown") uncertainties.push(`suitability:${n.id}:unknown`);
        for (const kind of ["access", "reviewer"] as const) { if (n[kind] === "denied") violations.push(`${kind}:${n.id}:denied`); if (n[kind] === "unknown") uncertainties.push(`${kind}:${n.id}:unknown`); }
        if (expired(n.provenance, input.asOf)) uncertainties.push(`provenance:${n.id}:outside-validity`);
      }
      if (expired(input.resources.provenance, input.asOf)) uncertainties.push("resources:outside-validity");
      const productIds = input.catalog.products.filter(p => p.nodeIds.every(id => ids.includes(id))).map(p => p.id);
      const covered = new Set<string>(), possible = new Set<string>();
      for (const l of input.catalog.links) {
        if (!required.includes(l.gapId) || !productIds.includes(l.productId) || l.decision === "rejected" || l.relation === "rejected" || l.relation === "none" || l.relation === "weak") continue;
        possible.add(l.gapId);
        const g = input.gaps.find(g => g.id === l.gapId)!;
        const sourceIssues = g.intake.feedback.flatMap(q => {
          const p = q.physicalSource;
          return p.excluded || p.latestSourceVersion !== q.version || !["available", "not-applicable"].includes(p.integrity) ? [`gap:${g.id}:source-currentness`] : [];
        });
        if (l.decision === "accepted" && l.relation === "direct" && l.qualification === "demo-assumed-direct" && !sourceIssues.length) covered.add(l.gapId);
        // Alternative weak/unknown decisions do not invalidate a different accepted direct link.
      }
      if (!possible.size) continue;
      for (const id of possible) if (!covered.has(id)) coverageUncertainties.push(`gap:${id}:link-or-source-needs-review`);
      const total = {
        cashCents: sum(selected.map(n => n.cashCents)), elapsedMinutes: sum(selected.map(n => n.elapsedMinutes)), effortMinutes: sum(selected.map(n => n.effortMinutes)), computeMinutes: sum(selected.map(n => n.computeMinutes)),
        ramMiB: selected.some(n => n.ramMiB.value === null) ? null : Math.max(...selected.map(n => n.ramMiB.value!)),
        storageMiB: selected.some(n => n.storageMiB.value === null) ? null : Math.max(...selected.map(n => n.storageMiB.value!)),
      };
      const check = (label: string, interval: Interval, capacity: number | null, proofBound: number) => {
        if (capacity !== null && proofBound > capacity) violations.push(`${label}:upper-bound-exceeds-available`);
        if (capacity === null || interval.low === null || interval.high === null) uncertainties.push(`${label}:unknown`);
      };
      if (total.cashCents.high !== null && total.cashCents.low !== null && total.cashCents.high <= cash) { /* guaranteed cash suffices without uncertain funding */ }
      else if (cashUnknown) {
        if (cashCeiling !== null && proof("cashCents") > cashCeiling) violations.push("cashCents:upper-bound-exceeds-available");
        else uncertainties.push("cashCents:unknown-available-funding");
      }
      else check("cashCents", total.cashCents, cash, proof("cashCents"));
      for (const kind of ["effortMinutes", "elapsedMinutes", "computeMinutes"] as const) check(kind, total[kind], resourceValid ? input.resources[kind].value : null, proof(kind));
      // Serial lane: RAM and scratch requirements are per-node PEAK reservations; retained outputs must be included in each node's reservation.
      for (const kind of ["ramMiB", "storageMiB"] as const) {
        for (const n of selected) if (resourceValid && !expired(n.provenance, input.asOf) && n[kind].value !== null && input.resources[kind].value !== null && n[kind].value! > input.resources[kind].value!) violations.push(`${kind}:${n.id}:exceeds-capacity`);
        if (total[kind] === null || input.resources[kind].value === null) uncertainties.push(`${kind}:unknown`);
      }
      evaluated.push({ nodeIds: ids, productIds: sorted(productIds), coveredGapIds: sorted(covered), uncoveredGapIds: required.filter(g => !covered.has(g)), possibleGapIds: sorted(possible), totals: total, violations: sorted(violations), uncertainties: sorted(uncertainties), coverageUncertainties: sorted(coverageUncertainties) });
    }
    const feasible = evaluated.filter(b => !b.violations.length && !b.uncertainties.length);
    const completes = feasible.filter(b => !b.uncoveredGapIds.length).sort(compare), best = completes[0] ?? null;
    const unresolved = evaluated.filter(b => !b.violations.length && (b.uncertainties.length || b.coverageUncertainties.length) && required.every(g => b.possibleGapIds.includes(g)));
    // A lower bound on each unknown upper objective can independently rule out a better result.
    const relevant = unresolved.filter(b => {
      if (!best) return true;
      const lower = (kind: "cashCents" | "elapsedMinutes" | "effortMinutes") => b.nodeIds.reduce((s, id) => { const n = byId.get(id)!; return s + (expired(n.provenance, input.asOf) ? 0 : n[kind].high ?? n[kind].low ?? 0); }, 0);
      const boundOrder = lower("cashCents") - best.totals.cashCents.high! || lower("elapsedMinutes") - best.totals.elapsedMinutes.high! || lower("effortMinutes") - best.totals.effortMinutes.high! || lex(b.nodeIds.join("|"), best.nodeIds.join("|"));
      return boundOrder < 0;
    });
    const partials = feasible.filter(b => b.coveredGapIds.length && b.uncoveredGapIds.length);
    const frontier = partials.filter(b => !partials.some(a => a !== b && dominates(a, b))).sort(compare);
    const alternatives = evaluated.filter(b => b.violations.length || b.uncertainties.length || b.coverageUncertainties.length).sort((a, b) => lex(a.nodeIds.join("|"), b.nodeIds.join("|")));
    return {
      id: hypothetical ? "hypothetical" : "confirmed", conditional: hypothetical, fundingIds: sorted(fundingIds), conditions, fundingNotes, availableCashCents: cashUnknown ? null : cash, guaranteedCashCents: cash, maximumPossibleCashCents: cashCeiling,
      outcome: best ? "complete" : relevant.length ? "needs-input" : frontier.length ? "partial" : "infeasible",
      coverageNotes: required.flatMap(id => {
        const links = input.catalog.links.filter(l => l.gapId === id);
        return [ ...(links.length ? [] : [`gap:${id}:no-catalog-link`]), ...links.filter(l => l.relation !== "direct" || l.decision !== "accepted" || l.qualification !== "demo-assumed-direct").map(l => `link:${l.id}:gap:${id}:${l.relation}:${l.decision}:${l.qualification}`) ];
      }),
      completeStatus: best ? "robust-complete" : relevant.length ? "needs-input" : "no-robust-complete", minimumStatus: best ? relevant.length ? "best-known" : "proven-minimum" : "none",
      complete: best, partials: frontier.slice(0, 8), frontierCount: frontier.length, frontierTruncated: frontier.length > 8,
      alternatives: alternatives.slice(0, 32).map(b => ({ nodeIds: b.nodeIds, violations: b.violations, uncertainties: sorted([...b.uncertainties, ...b.coverageUncertainties]) })), alternativeCount: alternatives.length, alternativesTruncated: alternatives.length > 32,
      enumeratedSubsetCount: 2 ** nodes.length, uniqueClosureCount: closures.size,
    };
  };
  return PlanningResultSchema.parse({ schemaVersion: 1, policy: POLICY, mode: input.mode, scientificValidation: "deferred", execution: "none", inputDigest: inputDigest(input), requiredGapIds: required, branches: [branch(false), ...(input.hypotheticalFundingIds.length ? [branch(true)] : [])] });
}
