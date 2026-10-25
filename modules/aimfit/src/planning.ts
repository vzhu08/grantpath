import { AssumptionSet, FailureCode, NumericResponse, VERSION, type AimFitInput, type ScenarioInput, type NumericPoint, type NumericalPort, type NumericQuery, type NumericResult } from "./contracts";
import { canonicalJson, clone, decimalFraction, deepFreeze, digest } from "./canonical";

export type Facet = "met" | "unmet" | "unknown" | "not_modelled" | "boundary_review";
export const POWER_TOLERANCE = 1e-7;
export function widthTolerance(width: number): number { return Math.max(1e-8, 1e-7 * Math.abs(width)); }
/** Exact intersection n*d^2 <=2450, .05<=d<=2. No scientific binary64 boundary decisions. */
export function supported(delta: string, sigma: string, n: number): boolean {
  if (!Number.isSafeInteger(n) || n < 2 || n > 1000) return false;
  const [a,b] = decimalFraction(delta), [c,d] = decimalFraction(sigma);
  const num = a*d, den = b*c;
  return num > 0n && den > 0n && num*20n >= den && num <= 2n*den && BigInt(n)*num*num <= 2450n*den*den;
}
export function compareTargets(point: NumericPoint, power: string, width: string | null): { power: Facet; width: Facet } {
  const p = Number(point.power), w = Number(point.nominalHalfWidth);
  return { power: Math.abs(p - Number(power)) <= POWER_TOLERANCE ? "boundary_review" : p > Number(power) ? "met" : "unmet",
    width: width === null ? "not_modelled" : Math.abs(w - Number(width)) <= widthTolerance(w) ? "boundary_review" : w < Number(width) ? "met" : "unmet" };
}
export function exactCost(n: number, attritionBps: number, fixed: string, perRecruit: string) {
  if (!Number.isSafeInteger(n) || n < 2 || n > 1000 || !Number.isInteger(attritionBps) || attritionBps < 0 || attritionBps > 5000 || !/^(0|[1-9]\d{0,17})$/.test(fixed) || !/^(0|[1-9]\d{0,17})$/.test(perRecruit)) throw new Error("Invalid cost inputs");
  const retention = BigInt(10000 - attritionBps);
  const recruitsPerArm = Number((BigInt(n)*10000n + retention - 1n)/retention);
  const totalRecruits = recruitsPerArm*2;
  const totalCents = (BigInt(fixed) + BigInt(totalRecruits)*BigInt(perRecruit)).toString();
  if (totalCents.length > 24) throw new Error("Cost capacity exceeded");
  return { recruitsPerArm, totalRecruits, totalCents };
}
function costTotals(s: ScenarioInput): { fixed: string; perRecruit: string } | null {
  if (s.costs.completeness.status !== "confirmed" || [...s.costs.fixed,...s.costs.perRecruit].some(x => x.cents.status !== "confirmed")) return null;
  const sum = (lines: typeof s.costs.fixed) => lines.reduce((n,x) => n + BigInt(x.cents.status === "confirmed" ? x.cents.value : "0"), 0n).toString();
  return { fixed: sum(s.costs.fixed), perRecruit: sum(s.costs.perRecruit) };
}
function query(s: ScenarioInput, input: AimFitInput): NumericQuery | null {
  const { delta, sigma, targetPower, nominalHalfWidthTarget: width } = s.numerical;
  if (delta.status !== "confirmed" || sigma.status !== "confirmed" || targetPower.status !== "confirmed" || width.status === "unknown") return null;
  return { id: s.id, delta: delta.value, sigma: sigma.value, targetPower: targetPower.value,
    halfWidth: width.status === "confirmed" ? width.value : null,
    ns: input.variants.filter(v => supported(delta.value,sigma.value,v.nPerArm)).map(v => v.nPerArm) };
}
export type Candidate = {
  id: string; nPerArm: number; numericalStatus: "computed_unverified" | "inputs_needed" | "unsupported_family_or_range" | "calculation_unavailable";
  recruitsPerArm: number | null; totalRecruits: number | null; totalCents: string | null; durationWeeks: number | null;
  costCompleteness: Facet; affordability: Facet; resource: Facet; timeline: Facet; power: Facet; nominalWidth: Facet;
  numerical: NumericPoint | null; conditionalTargetsMet: boolean; claims: string[];
};
export type ScenarioResult = { id: string; candidates: Candidate[]; outcome: "inputs_needed" | "unsupported_family_or_range" | "calculation_unavailable" | "no_affordable_candidate" | "affordable_but_target_unmet" | "affordable_but_resource_or_timeline_unmet" | "numerical_boundary_review" | "reference_pending";
  search: NumericResult["scenarios"][number]["search"] | null; minimumTargetCost: ReturnType<typeof exactCost> | null;minimumTargetAffordability: Facet; exclusions: string[] };
export type Plan = { version: typeof VERSION; inputDigest: string; input: AimFitInput; engine: NumericResult["engine"] | null;
  numericalFailure: string | null; scenarios: ScenarioResult[]; labels: string[] };
const computedPlans = new WeakSet<object>();
export function isComputedPlan(value: object): boolean { return computedPlans.has(value); }

function validateResult(value: unknown, queries: NumericQuery[]): NumericResult {
  const result = NumericResponse.parse(value);
  if (new Set(result.scenarios.map(x => x.id)).size !== queries.length || result.scenarios.length !== queries.length) throw new Error("Scenario identity mismatch");
  for (const q of queries) {
    const s = result.scenarios.find(x => x.id === q.id);
    if (!s || s.points.length !== q.ns.length || new Set(s.points.map(p => p.nPerArm)).size !== q.ns.length || s.points.some(p => !q.ns.includes(p.nPerArm))) throw new Error("Candidate identity mismatch");
    if (s.search.status === "beyond_supported_range" && s.points.some(p => { const f = compareTargets(p,q.targetPower,q.halfWidth); return f.power === "met" && ["met","not_modelled"].includes(f.width); })) throw new Error("Passing candidate contradicts range exhaustion");
    if (s.search.status === "found") {
      const { point, predecessor } = s.search;
      const facets = compareTargets(point,q.targetPower,q.halfWidth);
      if (!supported(q.delta,q.sigma,point.nPerArm) || facets.power !== "met" || !["met","not_modelled"].includes(facets.width)) throw new Error("Invalid minimum certificate");
      if (point.nPerArm === 2 ? predecessor !== null : predecessor === null || predecessor.nPerArm !== point.nPerArm-1) throw new Error("Invalid predecessor");
      if (predecessor) {
        const f = compareTargets(predecessor,q.targetPower,q.halfWidth);
        if (f.power !== "unmet" && f.width !== "unmet") throw new Error("Predecessor does not fail");
      }
      for (const check of [point,...(predecessor ? [predecessor] : [])]) {
        const candidate = s.points.find(p => p.nPerArm === check.nPerArm);
        if (candidate && canonicalJson(candidate) !== canonicalJson(check)) throw new Error("Inconsistent point");
      }
      for (const p of s.points.filter(p => p.nPerArm < point.nPerArm)) {
        const f = compareTargets(p,q.targetPower,q.halfWidth);
        if (f.power !== "unmet" && f.width !== "unmet") throw new Error("Earlier candidate contradicts minimum");
      }
    }
  }
  return result;
}
export async function planAimFit(raw: unknown, engine?: NumericalPort): Promise<Readonly<Plan>> {
  const input = AssumptionSet.parse(raw);
  const queries = input.scenarios.map(s => query(s,input)).filter((q): q is NumericQuery => q !== null && supported(q.delta,q.sigma,2));
  let numerical: NumericResult | null = null, numericalFailure: string | null = null;
  if (queries.length) {
    if (!engine) numericalFailure = "runtime_missing";
    else try {
      const out = await engine.calculate(clone(queries));
      if (out.status === "computed_unverified") numerical = validateResult(out.result,queries);
      else numericalFailure = FailureCode.parse(out.code);
    } catch { numericalFailure = "invalid_or_failed_engine"; }
  }
  const scenarios: ScenarioResult[] = input.scenarios.map(s => {
    const q = query(s,input), totals = costTotals(s), nr = numerical?.scenarios.find(x => x.id === s.id);
    const candidates: Candidate[] = input.variants.map(v => {
      const numericalStatus: Candidate["numericalStatus"] = !q ? "inputs_needed" : !supported(q.delta,q.sigma,v.nPerArm) ? "unsupported_family_or_range" : !nr ? "calculation_unavailable" : "computed_unverified";
      let cost: ReturnType<typeof exactCost> | null = null;
      if (s.attritionBps.status === "confirmed" && totals) {
        // Sum capacities can exceed an individual price; still bounded by 24 derived digits.
        const recruits = exactCost(v.nPerArm,s.attritionBps.value,"0","0");
        const totalCents = (BigInt(totals.fixed)+BigInt(recruits.totalRecruits)*BigInt(totals.perRecruit)).toString();
        if (totalCents.length > 24) throw new Error("Cost capacity exceeded");
        cost = { ...recruits, totalCents };
      }
      const recruits = s.attritionBps.status === "confirmed" ? exactCost(v.nPerArm,s.attritionBps.value,"0","0") : null;
      const durationWeeks = s.timeline.status === "confirmed" && recruits ? s.timeline.value.setupWeeks + Math.ceil(recruits.totalRecruits/s.timeline.value.balancedRecruitsPerWeek) + s.timeline.value.followupWeeks + s.timeline.value.analysisWeeks : null;
      const point = numericalStatus === "computed_unverified" ? nr!.points.find(p => p.nPerArm === v.nPerArm)! : null;
      const targets = point && q ? compareTargets(point,q.targetPower,q.halfWidth) : { power: "unknown" as Facet, width: s.numerical.nominalHalfWidthTarget.status === "not_modelled" ? "not_modelled" as Facet : "unknown" as Facet };
      const affordability: Facet = cost && s.ceiling.status === "confirmed" ? BigInt(cost.totalCents) <= BigInt(s.ceiling.value.cents) ? "met" : "unmet" : "unknown";
      const resource: Facet = s.resourceLimit.status === "not_modelled" ? "not_modelled" : recruits && s.resourceLimit.status === "confirmed" ? recruits.totalRecruits <= s.resourceLimit.value ? "met" : "unmet" : "unknown";
      const timeline: Facet = s.timeline.status === "not_modelled" ? "not_modelled" : durationWeeks !== null && s.timeline.status === "confirmed" ? durationWeeks <= s.timeline.value.maxWeeks ? "met" : "unmet" : "unknown";
      const conditionalTargetsMet = [affordability,resource,timeline,targets.power,targets.width].every(f => f === "met" || f === "not_modelled");
      return { id: v.id, nPerArm: v.nPerArm, numericalStatus, recruitsPerArm: recruits?.recruitsPerArm ?? null, totalRecruits: recruits?.totalRecruits ?? null, totalCents: cost?.totalCents ?? null,
        durationWeeks, costCompleteness: totals ? "met" : "unknown", affordability, resource, timeline, power: targets.power, nominalWidth: targets.width,
        numerical: point, conditionalTargetsMet, claims: ["Conditional planning arithmetic; R reference gate pending", "Nominal width uses assumed SD; realized width can differ", "Expected-retention inflation is not a recruitment guarantee",
          ...(targets.power === "unmet" ? ["Original target-power claim cannot be retained"] : [])] };
    });
    const unknown = candidates.some(c => [c.costCompleteness,c.affordability,c.resource,c.timeline,c.power,c.nominalWidth].includes("unknown") && c.numericalStatus !== "calculation_unavailable" && c.numericalStatus !== "unsupported_family_or_range");
    const outcome: ScenarioResult["outcome"] = !q || unknown ? "inputs_needed" : candidates.every(c => c.numericalStatus === "unsupported_family_or_range") ? "unsupported_family_or_range" : !nr ? "calculation_unavailable" : candidates.every(c => c.affordability === "unmet") ? "no_affordable_candidate" : candidates.some(c => c.power === "boundary_review" || c.nominalWidth === "boundary_review") ? "numerical_boundary_review" : candidates.some(c => c.affordability === "met" && (c.power === "unmet" || c.nominalWidth === "unmet")) && !candidates.some(c => c.conditionalTargetsMet) ? "affordable_but_target_unmet" : !candidates.some(c => c.conditionalTargetsMet) && candidates.some(c => c.affordability === "met" && (c.resource === "unmet" || c.timeline === "unmet")) ? "affordable_but_resource_or_timeline_unmet" : "reference_pending";
    let minimumTargetCost: ScenarioResult["minimumTargetCost"] = null;
    if (nr?.search.status === "found" && totals && s.attritionBps.status === "confirmed") {
      const r = exactCost(nr.search.point.nPerArm,s.attritionBps.value,"0","0");
      minimumTargetCost = { ...r,totalCents: (BigInt(totals.fixed)+BigInt(r.totalRecruits)*BigInt(totals.perRecruit)).toString() };
    }
    const minimumTargetAffordability: Facet = minimumTargetCost && s.ceiling.status === "confirmed" ? BigInt(minimumTargetCost.totalCents) <= BigInt(s.ceiling.value.cents) ? "met" : "unmet" : "unknown";
    return { id: s.id, candidates, outcome, search: nr?.search ?? null, minimumTargetCost,minimumTargetAffordability,
      exclusions: [...s.costs.exclusions, ...(s.resourceLimit.status === "not_modelled" ? [s.resourceLimit.reason] : []), ...(s.timeline.status === "not_modelled" ? [s.timeline.reason] : [])] };
  });
  const plan = deepFreeze(clone({ version: VERSION,inputDigest: digest(input),input,engine: numerical?.engine ?? null,numericalFailure,scenarios,
    labels: ["Nonclinical two independent groups; equal allocation and variance", "No scientific validation, causal conclusion, secured funds or achieved recruitment claim", "No host persistence, proposal mutation or finance adapter"] }));
  computedPlans.add(plan);
  return plan;
}
