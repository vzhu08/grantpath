// OFFLINE SYNTHETIC UNIT/REFERENCE INPUTS ONLY. Never imported by application/product code.
import type { Input } from "../../modules/grantweave/schema";
import { sha256 } from "../../modules/grantweave/validation";

const paragraphs = {
  A: "A is an already awarded synthetic source. Its confirmed remaining capacity eligible for these new costs is $7,000, within January 1 through March 31, 2027. Personnel and other are allowed for W1, W2 and W3. The remaining other-category cap is $3,000. This is a local planning capacity after existing paid costs and commitments, not a bank balance or spending authorization.",
  B: "B is a hypothetical award with a scenario amount of $5,000, conditional on receipt on the assumed terms. Only W2 costs are eligible, during February 1 through March 31, 2027. Personnel is capped at $2,000 and other at $3,000. A rejected/not-awarded B supplies zero conditional capacity. No call maximum is copied into this amount.",
  C: "C is a hypothetical award with a scenario amount of $4,000, conditional on receipt on the assumed terms. Only other-category costs for W2 and W3 are eligible, during January 1 through March 31, 2027. A rejected/not-awarded C supplies zero conditional capacity. No call maximum is copied into this amount.",
  identity: "P1/O1/P2/O2/P3/O3 are six distinct economic costs. Each must be assigned wholly once to one eligible source. Duplicating a row, renaming an item or changing its category label does not create a new cost.",
  overlap: "For the overlap variant only, A and B may not jointly support the scoped science comprising W1–W3. This is a synthetic user-confirmed restriction on combined support, even if all charged cost identities are distinct. It is not a finding that the example has scientific overlap, and is not a general NSF rule.",
  plan: "Synthetic reference plan: W1 prepare existing dataset January 2027, W2 computational analysis February 2027, W3 validate/report March 2027, all required. W1 precedes W2 precedes W3. Personnel $2,000 each; other $1,000/$3,000/$2,000. PI effort 2000/3000/2000 basis points; outside 7000/6500/7500; monthly capacity 10000. February compute 40 plus existing 10 of 50 slot-hours. No other support or restrictions; all declared scope reviewed. These are invented test assumptions, not real permission.",
};
const interval = { start: "2027-01-01", end: "2027-03-31" };
export function reference(): Input {
  const entries = Object.entries(paragraphs);
  return {
    contractVersion: "grantweave.input.v1", model: {
      id: "reference", version: "v1", label: "synthetic",
      sources: entries.map(([id, text]) => ({ id: `source_${id}`, version: "v1", kind: "synthetic", text, sha256: sha256(text) })),
      claims: entries.map(([id, text]) => ({ id: `claim_${id}`, sourceId: `source_${id}`, status: "synthetic_confirmed", start: 0, end: text.length, quote: text, interpretation: `Explicit synthetic ${id} assumptions`, actor: "synthetic_test_author", recordedAt: "2026-10-25T12:00:00Z" })),
      packages: [
        { id: "W1", label: "Prepare existing dataset", required: true, interval: { start: "2027-01-01", end: "2027-01-31" }, predecessors: [], effort: [{ capacityId: "PI_Jan", amount: 2000 }], resources: [], claimId: "claim_plan" },
        { id: "W2", label: "Run analysis", required: true, interval: { start: "2027-02-01", end: "2027-02-28" }, predecessors: ["W1"], effort: [{ capacityId: "PI_Feb", amount: 3000 }], resources: [{ capacityId: "compute_Feb", amount: 40 }], claimId: "claim_plan" },
        { id: "W3", label: "Validate/report", required: true, interval: { start: "2027-03-01", end: "2027-03-31" }, predecessors: ["W2"], effort: [{ capacityId: "PI_Mar", amount: 2000 }], resources: [], claimId: "claim_plan" },
      ],
      costs: [1, 2, 3].flatMap((n) => [{ id: `P${n}`, economicId: `economic_P${n}`, packageId: `W${n}`, category: "personnel", amountCents: "200000", incurredOn: ["2027-01-31", "2027-02-28", "2027-03-31"][n - 1], claimId: "claim_plan" }, { id: `O${n}`, economicId: `economic_O${n}`, packageId: `W${n}`, category: "other", amountCents: ["100000", "300000", "200000"][n - 1], incurredOn: ["2027-01-31", "2027-02-28", "2027-03-31"][n - 1], claimId: "claim_plan" }]),
      funding: [
        { id: "A", kind: "secured", basis: "confirmed_eligible_residual", currency: "USD", scale: 2, capacityCents: "700000", packageIds: ["W1", "W2", "W3"], categories: [{ category: "personnel", capCents: "700000" }, { category: "other", capCents: "300000" }], budgetWindow: { ...interval }, performanceWindow: { ...interval }, periodCaps: [], claimId: "claim_A" },
        { id: "B", kind: "hypothetical", basis: "explicit_scenario_amount", currency: "USD", scale: 2, capacityCents: "500000", packageIds: ["W2"], categories: [{ category: "personnel", capCents: "200000" }, { category: "other", capCents: "300000" }], budgetWindow: { start: "2027-02-01", end: "2027-03-31" }, performanceWindow: { start: "2027-02-01", end: "2027-03-31" }, periodCaps: [], claimId: "claim_B" },
        { id: "C", kind: "hypothetical", basis: "explicit_scenario_amount", currency: "USD", scale: 2, capacityCents: "400000", packageIds: ["W2", "W3"], categories: [{ category: "other", capCents: "400000" }], budgetWindow: { ...interval }, performanceWindow: { ...interval }, periodCaps: [], claimId: "claim_C" },
      ],
      effort: ["Jan", "Feb", "Mar"].map((v, i) => ({ id: `PI_${v}`, subjectId: "PI", month: `2027-0${i + 1}`, unit: "basis_points_of_month_capacity", capacity: 10000, outside: [7000, 6500, 7500][i], claimId: "claim_plan" })),
      resources: [{ id: "compute_Feb", subjectId: "compute", month: "2027-02", unit: "slot_hours", capacity: 50, outside: 10, claimId: "claim_plan" }],
      existingSupport: [], restrictions: [], completenessClaimIds: ["claim_plan", "claim_identity"], dependencies: [{ key: "synthetic_plan", version: "v1", digest: sha256("synthetic plan dependency v1") }],
    }, branch: { id: "both_assumed", version: "v1", outcomes: [{ sourceId: "B", outcome: "assumed_awarded" }, { sourceId: "C", outcome: "assumed_awarded" }] }, limits: { maxNodes: 50000, maxWitnesses: 3 },
  };
}
export function overlap(input: Input) {
  input.model.restrictions.push({ id: "invented_overlap", kind: "scoped_support_exclusion", stage: "support", sourceIds: ["A", "B"], packageIds: ["W1", "W2", "W3"], interval: { ...interval }, claimId: "claim_overlap" });
  return input;
}
export function packing(): Input {
  const x = reference();
  x.model.packages = [{ ...x.model.packages[0], effort: [], resources: [] }]; x.model.effort = []; x.model.resources = [];
  x.model.costs = [0, 1, 2, 3].map((i) => ({ ...x.model.costs[0], id: `cost${i}`, economicId: `economic${i}`, amountCents: "2" }));
  for (const f of x.model.funding) { f.capacityCents = "3"; f.packageIds = ["W1"]; f.categories = [{ category: "personnel", capCents: "3" }]; f.budgetWindow = { ...interval }; f.performanceWindow = { ...interval }; }
  return x;
}
