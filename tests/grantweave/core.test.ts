import { describe, expect, it } from "vitest";
import { solve, validateInput, validateWitness, createSnapshot, readFrozenExport, assessCurrentness, ResultSchema, type Input } from "../../modules/grantweave/index";
import { sha256 } from "../../modules/grantweave/validation";
import { oracle } from "./oracle";
import { reference, overlap, packing } from "./reference";

function assertOracle(x: Input, expected?: "feasible" | "infeasible") {
  const answer = oracle(x), solved = solve(x);
  const oracleStatus = answer.solutions.length ? "feasible" : "infeasible";
  expect(solved.status).toBe(oracleStatus);
  if (expected) expect(oracleStatus).toBe(expected);
  expect(ResultSchema.safeParse(solved).success).toBe(true);
  for (const found of solved.witnesses) {
    const choice = x.model.costs.map((c) => found.witness.assignments.find((a) => a.costId === c.id)!.sourceId);
    expect(answer.solutions).toContainEqual(choice);
    expect(validateWitness(x, found.witness).status).toBe("valid_witness");
    expect(found.constraints.every((c) => c.satisfied)).toBe(true);
  }
  return { answer, solved };
}
const variants: [string, (x: Input) => void, "feasible" | "infeasible"][] = [
  ["F1", () => {}, "feasible"],
  ["F2 C failed", (x) => { x.branch.outcomes[1].outcome = "failed"; }, "feasible"],
  ["F3 B failed", (x) => { x.branch.outcomes[0].outcome = "failed"; }, "infeasible"],
  ["F4 secured only", (x) => { x.branch.outcomes.forEach((v) => v.outcome = "failed"); }, "infeasible"],
  ["D1 wrong eligible dates despite 16000", (x) => { for (const f of x.model.funding.slice(1)) f.budgetWindow = { start: "2027-04-01", end: "2027-06-30" }; }, "infeasible"],
  ["E1 outside effort", (x) => { x.model.effort[1].outside = 8000; }, "infeasible"],
  ["C1 category zero", (x) => { x.model.funding[0].categories![1].capCents = "0"; }, "infeasible"],
  ["O1 invented scoped overlap", (x) => { overlap(x); }, "infeasible"],
  ["O2 retained counterfactual", (x) => { overlap(x); x.model.restrictions = []; x.model.version = "counterfactual_v2"; }, "feasible"],
  ["R1 resource", (x) => { x.model.packages[1].resources[0].amount = 41; }, "infeasible"],
  ["T1 fixed dependency dates", (x) => { x.model.packages[1].interval.start = "2027-01-15"; }, "infeasible"],
];

describe("independent reference enumeration", () => {
  it.each(variants)("%s", (_, mutate, expected) => { const x = reference(); mutate(x); assertOracle(x, expected); });
  it("has exactly four hand-derived F1 solutions over all 729 leaves", () => {
    const x = reference(), { answer } = assertOracle(x);
    expect(answer.leaves).toBe(729);
    expect(answer.solutions).toHaveLength(4);
    const triples = answer.solutions.map((s) => ["P2", "O2", "O3"].map((id) => s[x.model.costs.findIndex((c) => c.id === id)]).join(""));
    expect(triples.sort()).toEqual(["ABC", "BBA", "BBC", "BCA"]);
  });
  it("finds the exact sole F2 witness and binding caps", () => {
    const x = reference(); x.branch.outcomes[1].outcome = "failed";
    const { solved, answer } = assertOracle(x);
    expect(answer.solutions).toHaveLength(1); expect(solved.searchComplete).toBe(true);
    const rows = solved.witnesses[0].constraints;
    for (const id of ["total:A", "category:A:other", "total:B", "category:B:personnel", "category:B:other", "resources:compute_Feb"]) expect(rows.find((r) => r.id === id)?.slack).toBe("0");
    expect(rows.find((r) => r.id === "total:C")?.used).toBe("0");
  });
  it("independently classifies every complete witness for F1 and overlap", () => {
    for (const x of [reference(), overlap(reference())]) {
      const solutions = new Set(oracle(x).solutions.map((a) => a.join(",")));
      const enumerate = (choices: string[]) => {
        if (choices.length < x.model.costs.length) { for (const f of x.model.funding) enumerate([...choices, f.id]); return; }
        const candidate = { version: "grantweave.witness.v1", assignments: choices.map((sourceId, i) => ({ costId: x.model.costs[i].id, sourceId })) };
        expect(validateWitness(x, candidate).status === "valid_witness").toBe(solutions.has(choices.join(",")));
      };
      enumerate([]);
    }
  });
  it("ES1 existing support counts at zero new allocation", () => {
    const x = overlap(reference());
    x.model.costs = x.model.costs.filter((c) => c.id === "P2");
    x.model.funding[0].capacityCents = "0"; x.model.funding[1].capacityCents = "200000";
    x.branch.outcomes[1].outcome = "failed";
    x.model.existingSupport = [{ id: "already_paid", economicId: "different_existing_cost", sourceId: "A", packageIds: ["W2"], interval: { start: "2027-02-01", end: "2027-02-28" }, kind: "paid", claimId: "claim_plan" }];
    const { solved } = assertOracle(x, "infeasible"); expect(solved.proof?.kind).toBe("exhaustive");
    const candidate = { version: "grantweave.witness.v1", assignments: [{ costId: "P2", sourceId: "B" }] };
    expect(validateWitness(x, candidate).status).toBe("invalid_witness");
    x.model.existingSupport[0].interval = { start: "2028-01-01", end: "2028-02-01" };
    assertOracle(x, "feasible");
  });
  it("detects indivisible packing failure beyond aggregate money bounds", () => { const { solved } = assertOracle(packing(), "infeasible"); expect(solved.proof?.kind).toBe("exhaustive"); });
  it("compares 60 seeded small models including exclusions and periods", () => {
    let state = 991; const next = (max: number) => { state = (state * 1664525 + 1013904223) >>> 0; return state % max; };
    for (let k = 0; k < 60; k++) {
      const x = packing();
      for (const c of x.model.costs) c.amountCents = String(1 + next(5));
      for (const f of x.model.funding) { f.capacityCents = String(2 + next(12)); f.categories![0].capCents = String(1 + next(12)); f.periodCaps = [{ id: "Jan", interval: { start: "2027-01-01", end: "2027-01-31" }, capCents: String(next(12)), claimId: f.claimId }]; }
      if (k % 2) x.model.restrictions = [{ id: "deny", kind: "disallow_cost", costId: x.model.costs[next(4)].id, sourceId: x.model.funding[next(3)].id, claimId: "claim_plan" }];
      if (k % 3 === 0) overlap(x).model.restrictions.forEach((r) => { if (r.kind === "scoped_support_exclusion") r.packageIds = ["W1"]; });
      assertOracle(x);
    }
  });
});

describe("search work/status semantics and raw witness validation", () => {
  it("counts root and stops without claiming infeasibility", () => { const x = packing(); x.limits.maxNodes = 1; const r = solve(x); expect(r.status).toBe("unknown"); expect(r.nodes).toBe(1); expect(r.searchComplete).toBe(false); expect(r.proof).toBeNull(); });
  it("keeps a verified witness with incomplete alternatives", () => { const x = reference(); x.limits.maxWitnesses = 1; const r = solve(x); expect(r.status).toBe("feasible"); expect(r.searchComplete).toBe(false); expect(r.stopReason).toBe("witness_limit"); });
  it("direct complete proof may bypass a tiny search budget", () => { const x = reference(); x.limits.maxNodes = 1; x.model.effort[1].outside = 8000; const r = solve(x); expect(r.status).toBe("infeasible"); expect(r.nodes).toBe(0); expect(r.proof?.kind).toBe("direct"); });
  it("exact node budget and just-before-witness budget", () => {
    const x = reference(); x.branch.outcomes[1].outcome = "failed";
    const r = solve(x); x.limits.maxNodes = r.nodes; const exact = solve(x); expect(exact.status).toBe("feasible"); expect(exact.nodes).toBe(r.nodes); expect(exact.searchComplete).toBe(true);
    x.limits.maxNodes = 6; expect(solve(x).status).toBe("unknown");
  });
  it("X1 rejects duplicate/missing/unknown candidates independently of model feasibility", () => {
    const x = reference(), r = solve(x), good = r.witnesses[0].witness;
    for (const assignments of [[...good.assignments, { costId: "P2", sourceId: "A" }], good.assignments.slice(1), [...good.assignments.slice(1), { costId: "unknown", sourceId: "A" }], good.assignments.map((a) => ({ ...a, sourceId: "unknown" }))]) expect(validateWitness(x, { ...good, assignments }).status).toBe("invalid_witness");
    expect(solve(x).status).toBe("feasible");
  });
  it("enforces disallow and independent full work windows", () => {
    const x = reference(); x.model.restrictions = [{ id: "deny", kind: "disallow_cost", costId: "O1", sourceId: "A", claimId: "claim_plan" }]; assertOracle(x, "infeasible");
    x.model.restrictions = []; x.model.funding[0].performanceWindow!.start = "2027-01-02"; assertOracle(x, "infeasible");
  });
  it("period cap endpoints are inclusive and apply in addition to total", () => {
    const x = reference(); x.model.funding[0].periodCaps = [{ id: "Jan", interval: { start: "2027-01-31", end: "2027-01-31" }, capCents: "299999", claimId: "claim_A" }]; assertOracle(x, "infeasible");
    x.model.funding[0].periodCaps[0].capCents = "300000"; assertOracle(x, "feasible");
  });
  it("uses exact cents above Number.MAX_SAFE_INTEGER", () => {
    const x = packing(); x.model.costs = x.model.costs.slice(0, 2); x.model.funding = [x.model.funding[0]]; x.branch.outcomes = [];
    x.model.costs.forEach((c) => c.amountCents = "99999999999999999"); x.model.funding[0].capacityCents = "199999999999999998"; x.model.funding[0].categories![0].capCents = "199999999999999998";
    assertOracle(x, "feasible"); x.model.funding[0].capacityCents = "199999999999999997"; assertOracle(x, "infeasible");
  });
  it("bounds work at the admitted 5-source/12-cost limit without a guarantee", () => {
    const x = packing(); x.model.funding.push({ ...x.model.funding[0], id: "D" }, { ...x.model.funding[0], id: "E" });
    x.model.costs = Array.from({ length: 12 }, (_, i) => ({ ...x.model.costs[0], id: `c${i}`, economicId: `e${i}` }));
    for (const f of x.model.funding) { f.capacityCents = "5"; f.categories = [{ category: "personnel", capCents: "5" }]; }
    x.limits.maxNodes = 500; const r = solve(x); expect(r.status).toBe("unknown"); expect(r.nodes).toBe(500); expect(r.proof).toBeNull();
  });
  it("increasing a cap cannot destroy a known witness", () => {
    const x = reference(), first = solve(x).witnesses[0].witness;
    x.model.funding[0].capacityCents = "800000"; expect(validateWitness(x, first).status).toBe("valid_witness"); assertOracle(x, "feasible");
  });
});

describe("closed model boundaries and honest missing facts", () => {
  it.each(["-0", "-1", "01", "1.0", "1e3", "1,000", "1000000000000000000"])("rejects noncanonical/bounded money %s", (amount) => { const x = reference(); x.model.costs[0].amountCents = amount; expect(solve(x).status).toBe("invalid_model"); });
  it("rejects numeric cents, unknown keys and impossible dates", () => {
    const x = reference(); expect(solve({ ...x, futureFlag: true }).status).toBe("invalid_model");
    expect(solve({ ...x, model: { ...x.model, costs: [{ ...x.model.costs[0], amountCents: 100 }] } }).status).toBe("invalid_model");
    x.model.costs[0].incurredOn = "2027-02-29"; expect(solve(x).status).toBe("invalid_model");
  });
  it("rejects repeated economic costs across renamed new/prior records", () => {
    const x = reference(); x.model.costs[1].economicId = x.model.costs[0].economicId; expect(solve(x).status).toBe("invalid_model");
    const y = reference(); y.model.existingSupport = [{ id: "prior", economicId: y.model.costs[0].economicId, sourceId: "A", packageIds: ["W1"], interval: { start: "2027-01-01", end: "2027-01-31" }, kind: "committed", claimId: "claim_plan" }]; expect(solve(y).status).toBe("invalid_model");
  });
  it("rejects cycles/missing refs, unsupported stages/period overlaps/units and oversize", () => {
    const a = reference(); a.model.packages[0].predecessors = ["W3"]; expect(solve(a).status).toBe("invalid_model");
    const b = reference(); b.model.packages[0].effort[0].capacityId = "missing"; expect(solve(b).status).toBe("invalid_model");
    const c = reference(); c.model.effort[0].unit = "salary_months"; expect(solve(c).status).toBe("invalid_model");
    const d = reference(); d.model.funding[0].periodCaps = [1, 2].map((n) => ({ id: `period${n}`, interval: { start: "2027-01-01", end: "2027-02-01" }, capCents: "700000", claimId: "claim_A" })); expect(solve(d).status).toBe("invalid_model");
    const e = overlap(reference()); expect(solve({ ...e, model: { ...e.model, restrictions: [{ ...e.model.restrictions[0], stage: "coholding" }] } }).status).toBe("invalid_model");
    const f = reference(); f.model.costs = Array.from({ length: 13 }, () => f.model.costs[0]); expect(solve(f).status).toBe("invalid_model");
  });
  it("blocks null capacity/currency/eligibility, proposed claims and missing outcomes", () => {
    for (const mutate of [(x: Input) => { x.model.funding[0].capacityCents = null; }, (x: Input) => { x.model.funding[0].currency = null; }, (x: Input) => { x.model.funding[0].packageIds = null; }, (x: Input) => { x.model.effort[0].outside = null; }, (x: Input) => { x.model.claims[0].status = "proposed"; }, (x: Input) => { x.branch.outcomes.pop(); }]) { const x = reference(); mutate(x); expect(solve(x).status).toBe("needs_input"); }
    const x = reference(); x.model.funding[0].capacityCents = "0"; expect(solve(x).status).toBe("infeasible");
  });
  it("preserves synthetic labels, exact quotes/digests and funding basis", () => {
    const a = reference(); a.model.label = "confirmed_assumptions"; expect(solve(a).status).toBe("invalid_model");
    const b = reference(); b.model.claims[0].quote += "x"; expect(solve(b).status).toBe("invalid_model");
    const c = reference(); c.model.sources[0].text += "x"; expect(solve(c).status).toBe("invalid_model");
    const d = reference(); d.model.funding[0].basis = "explicit_scenario_amount"; expect(solve(d).status).toBe("invalid_model");
    const e = reference(); e.model.claims[0].end++; expect(solve(e).status).toBe("invalid_model");
  });
});

describe("versioned deterministic snapshots and targeted currentness", () => {
  it("reordering sets preserves full solve output and both export bytes", () => {
    const x = reference();
    const reverseSets = (v: unknown): unknown => Array.isArray(v) ? v.map(reverseSets).reverse() : v && typeof v === "object" ? Object.fromEntries(Object.entries(v).reverse().map(([k, val]) => [k, reverseSets(val)])) : v;
    const y = reverseSets(x); expect(solve(y)).toEqual(solve(x)); expect(createSnapshot(y)).toEqual(createSnapshot(x));
    const failed = reference(); failed.branch.outcomes[0].outcome = "failed"; expect(solve(reverseSets(failed))).toEqual(solve(failed));
  });
  it("semantic/provenance/solver-budget changes alter the fingerprint", () => {
    const original = solve(reference()).fingerprint;
    for (const mutate of [(x: Input) => { x.model.funding[0].capacityCents = "700001"; }, (x: Input) => { x.model.sources[0].version = "v2"; }, (x: Input) => { x.model.dependencies[0].digest = sha256("new ledger closure"); }, (x: Input) => { x.model.costs[0].economicId = "changed_identity"; }, (x: Input) => { x.model.effort[0].outside = 7001; }, (x: Input) => { x.model.claims[0].actor = "new_confirmer"; }, (x: Input) => { x.limits.maxNodes = 49999; }]) { const x = reference(); mutate(x); expect(solve(x).fingerprint).not.toBe(original); }
  });
  it("freezes paired bytes with witness traversal order and validates after JSON roundtrip", () => {
    const x = reference(), frozen = createSnapshot(x); expect(frozen.status).toBe("frozen"); if (frozen.status !== "frozen") throw Error("snapshot unavailable");
    const reopened = JSON.parse(JSON.stringify(frozen.snapshot));
    expect(readFrozenExport(reopened, "json")).toEqual(readFrozenExport(frozen.snapshot, "json"));
    expect(readFrozenExport(reopened, "markdown")).toEqual(readFrozenExport(frozen.snapshot, "markdown"));
    const data = JSON.parse(frozen.snapshot.exports[0].content); expect(data.result.witnesses).toEqual(solve(x).witnesses);
    const before = frozen.snapshot.exports[1].content; x.model.funding[0].capacityCents = "0"; solve(x); expect(frozen.snapshot.exports[1].content).toBe(before);
  });
  it("fails closed for corrupt/missing content or mismatched closure/serializer", () => {
    const frozen = createSnapshot(reference()); if (frozen.status !== "frozen") throw Error("snapshot unavailable");
    for (const alter of [(s: typeof frozen.snapshot) => { s.exports[0].content += "x"; }, (s: typeof frozen.snapshot) => { s.fingerprint = sha256("wrong"); }, (s: typeof frozen.snapshot) => { s.exports[1].byteLength++; }]) { const copy = structuredClone(frozen.snapshot); alter(copy); expect(readFrozenExport(copy, "json").status).toBe("unavailable"); }
    expect(readFrozenExport({ ...frozen.snapshot, exports: [frozen.snapshot.exports[0]] }, "json").status).toBe("unavailable");
    expect(readFrozenExport({ ...frozen.snapshot, solverVersion: "future" }, "json").status).toBe("unavailable");
    expect(readFrozenExport(frozen.snapshot, "html").status).toBe("unavailable");
  });
  it("rejects internally rehashed saved results with inconsistent labels/witnesses/states", () => {
    const frozen = createSnapshot(reference()); if (frozen.status !== "frozen") throw Error("snapshot unavailable");
    for (const edit of [(r: ReturnType<typeof solve>) => { r.branchId = "different"; }, (r: ReturnType<typeof solve>) => { r.label = "confirmed_assumptions"; }, (r: ReturnType<typeof solve>) => { r.witnesses[0].witness.assignments = []; }, (r: ReturnType<typeof solve>) => { r.witnesses[0].constraints[0].used = "999"; }, (r: ReturnType<typeof solve>) => { r.stopReason = "validation"; }, (r: ReturnType<typeof solve>) => { Object.assign(r, { status: "infeasible", nodes: 0, stopReason: "direct_proof", searchComplete: true, witnesses: [], proof: { kind: "direct", constraints: [], sufficientClaimIds: [], minimal: false } }); }, (r: ReturnType<typeof solve>) => { r.nodes = 1; r.stopReason = "node_limit"; }]) {
      const copy = structuredClone(frozen.snapshot), body = JSON.parse(copy.exports[0].content); edit(body.result);
      copy.exports[0].content = JSON.stringify(body); copy.exports[0].byteLength = Buffer.byteLength(copy.exports[0].content); copy.exports[0].sha256 = sha256(copy.exports[0].content);
      expect(readFrozenExport(copy, "json").status).toBe("unavailable");
    }
  });
  it("compares only captured dependency keys without rewriting history", () => {
    const deps = reference().model.dependencies, bytes = JSON.stringify(deps);
    expect(assessCurrentness(deps, [...deps, { key: "unrelated", version: "v1", digest: sha256("unrelated") }]).status).toBe("unchanged");
    expect(assessCurrentness(deps, [{ ...deps[0], version: "v2" }]).status).toBe("stale");
    expect(assessCurrentness(deps, []).status).toBe("unavailable");
    expect(assessCurrentness(deps, [...deps, deps[0]]).status).toBe("unavailable");
    expect(JSON.stringify(deps)).toBe(bytes);
  });
});
