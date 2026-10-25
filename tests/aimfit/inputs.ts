import { AssumptionSet, VERSION, type AimFitInput, type NumericResult, type NumericalPort } from "../../modules/aimfit/src/index";

/** SYNTHETIC offline unit/reference inputs. Never imported into product paths. */
export const provenance = { kind: "synthetic" as const,rationale: "Offline unit test only; no scientific evidence",actor: "test",reviewedAt: "2026-10-25T12:00:00Z" };
export function confirmed<T>(value: T) { return { status: "confirmed" as const,value,provenance: { ...provenance } }; }
export function input(): AimFitInput {
  return AssumptionSet.parse({ version: VERSION,id: "assumptions1",projectId: "project1",applicationId: "app1",parentAssumptionDigest: null,family: "two-independent-groups-pooled-t",
    question: { population: "Synthetic interface users",groups: ["A","B"],outcome: "Synthetic score",units: "points",measurementOccasion: "one session",contrast: "Difference in means",direction: "group1-minus-group2",model: "independent-normal-common-variance",interpretation: "Conditional nonclinical planning",provenance },
    variants: [40,50,64].map(n => ({ id: `n${n}`,nPerArm: n,explanation: "Only sample size changes",confirmed: true,provenance })),
    scenarios: [{ id: "baseline",label: "Synthetic baseline",confirmed: true,numerical: { delta: confirmed("5"),sigma: confirmed("10"),targetPower: confirmed("0.8"),nominalHalfWidthTarget: { status: "not_modelled",reason: "Diagnostic only" } },
      attritionBps: confirmed(2000),costs: { version: "aimfit-cost-v1",id: "prices1",fixed: [{ id: "setup",label: "All fixed costs",cents: confirmed("400000") }],perRecruit: [{ id: "participant",label: "All recruited-participant costs",cents: confirmed("10000") }],completeness: confirmed("all-in"),exclusions: ["No extra indirect cost assumed"] },
      ceiling: confirmed({ cents: "1800000",currency: "USD",role: "manual-scenario" }),resourceLimit: confirmed(140),timeline: confirmed({ setupWeeks: 2,followupWeeks: 2,analysisWeeks: 2,balancedRecruitsPerWeek: 20,maxWeeks: 13 }) }],dependencies: [],proposalRevisions: [{ projectId: "project1",applicationId: "app1",sectionId: "methods",revisionId: "before",text: "Original 80% planning claim" }] });
}
/** Research candidate values used ONLY to exercise engine-port contracts, NOT as R/math validation. */
export const pendingNumeric: NumericResult = {
  version: "aimfit-numeric-v1",engine: { method: "pooled-t-both-tails-v1",protocol: "aimfit-numeric-v1",python: "3.12.10",scipy: "1.15.3",numpy: "2.1.3",workerSha256: "a".repeat(64),pythonSha256: "b".repeat(64),platform: "win32-x64",referenceStatus: "r-pending" },
  scenarios: [{ id: "baseline",points: [
    { nPerArm: 40,power: "0.5981469011410999",nominalHalfWidth: "4.451669378669142" },
    { nPerArm: 50,power: "0.6968934055617443",nominalHalfWidth: "3.968934908853385" },
    { nPerArm: 64,power: "0.8014595579287106",nominalHalfWidth: "3.498358831049921" },
  ],search: { status: "found",point: { nPerArm: 64,power: "0.8014595579287106",nominalHalfWidth: "3.498358831049921" },predecessor: { nPerArm: 63,power: "0.7951683381304625",nominalHalfWidth: "3.526565746997695" } } }],
};
export function pendingPort(change?: (result: NumericResult) => void): NumericalPort {
  return { async calculate() { const result = structuredClone(pendingNumeric); change?.(result); return { status: "computed_unverified",result }; } };
}
