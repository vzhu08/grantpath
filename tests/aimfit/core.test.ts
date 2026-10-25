import { describe,it,expect } from "vitest";
import { createHash } from "node:crypto";
import { AssumptionSet, canonicalJson, normalizeDecimal, digest, exactCost,supported,compareTargets,planAimFit,freezeRun,readRun,readClaimLink,exportRun,currentness,currentnessForLink,proposalDependency,claimChange,acceptPreview,linkAcceptedRevision,linkedRevisionStatus,hostAdapterAvailability } from "./public";
import { input,confirmed,pendingPort,provenance } from "./inputs";

describe("AIMFIT closed contracts and exact arithmetic",() => {
  it("rejects decimals with aliases, exponents, signs, excess precision and unknown keys",() => {
    for (const value of ["5.0","5e0","-0","+5","05","1,000","0","0.0000001","1000000000000"]) {
      const x = input(); x.scenarios[0].numerical.delta = confirmed(value);
      expect(AssumptionSet.safeParse(x).success,value).toBe(false);
    }
    expect(AssumptionSet.safeParse({ ...input(),clientPower: "1" }).success).toBe(false);
    expect(normalizeDecimal("5.000")).toBe("5");
  });
  it("requires unique identities and explicit source dependencies/project ownership",() => {
    const x = input(); x.variants[1].id = x.variants[0].id;
    expect(AssumptionSet.safeParse(x).success).toBe(false);
    const y = input(); y.question.provenance = { kind: "source",rationale: "quote",actor: "test",reviewedAt: "2026-10-25T12:00:00Z",projectId: "project1",sourceId: "s",versionId: "v",hashAlgorithm: "fnv-pair",upstreamHash: "original-hash",quotation: "😀",startUtf16: 3,endUtf16: 5 };
    expect(AssumptionSet.safeParse(y).success).toBe(false);
    y.dependencies = [{ key: "s",kind: "evidence",projectId: "project1",version: "v",hashAlgorithm: "fnv-pair",hash: "original-hash" }];
    expect(AssumptionSet.safeParse(y).success).toBe(true);
    y.dependencies[0].projectId = "another-project";
    expect(AssumptionSet.safeParse(y).success).toBe(false);
  });
  it("uses per-arm integer attrition, hand-checked cents and no Number money",() => {
    expect(exactCost(2,1,"0","1")).toEqual({ recruitsPerArm: 3,totalRecruits: 6,totalCents: "6" });
    for (const [bps,perArm,total] of [[0,50,"1400000"],[2000,63,"1660000"],[3000,72,"1840000"],[5000,100,"2400000"]]) expect(exactCost(50,Number(bps),"400000","10000")).toEqual({ recruitsPerArm: perArm,totalRecruits: Number(perArm)*2,totalCents: total });
    expect(exactCost(50,2000,"400000","12000").totalCents).toBe("1912000");
    expect(exactCost(2,0,"9007199254740993","1").totalCents).toBe("9007199254740997");
    expect(exactCost(64,2001,"400000","10000").totalCents).toBe("2020000");
  });
  it("checks the exact intersected envelope including lambda=35",() => {
    expect(supported("2","1",612)).toBe(true); expect(supported("2","1",613)).toBe(false);
    expect(supported("7","4",800)).toBe(true); expect(supported("7","4",801)).toBe(false);
    expect(supported("1","20",1000)).toBe(true); expect(supported("1","21",2)).toBe(false);
    expect(supported("50","100",64)).toBe(supported("5","10",64));
  });
  it("retains numerical target boundaries as unresolved",() => {
    const point = { nPerArm: 86,power: "0.9032299799913841",nominalHalfWidth: "3.010347257256072" };
    expect(compareTargets(point,"0.90323","3.010347")).toEqual({ power: "boundary_review",width: "boundary_review" });
    expect(compareTargets(point,"0.9","3")).toEqual({ power: "met",width: "unmet" });
  });
  it("canonicalizes ordinal keys without fractional floats or mutable aliases",() => {
    expect(canonicalJson({ z: 1,a: "0.05",A: true })).toBe('{"A":true,"a":"0.05","z":1}');
    for (const value of [.05,NaN,Infinity,undefined,-0,9007199254740992]) expect(() => canonicalJson(value)).toThrow();
  });
});

describe("AIMFIT facets and unavailable boundaries",() => {
  it("returns exact affordable alternatives and an unaffordable minimum target independently",async () => {
    const result = await planAimFit(input(),pendingPort()), s = result.scenarios[0];
    expect(s.candidates.map(c => [c.totalRecruits,c.totalCents,c.durationWeeks])).toEqual([[100,"1400000",11],[126,"1660000",13],[160,"2000000",14]]);
    expect(s.candidates.map(c => [c.affordability,c.power,c.resource,c.timeline])).toEqual([["met","unmet","met","met"],["met","unmet","met","met"],["unmet","met","unmet","unmet"]]);
    expect(s.outcome).toBe("affordable_but_target_unmet");
    expect(s.minimumTargetCost?.totalCents).toBe("2000000");
    expect(s.minimumTargetAffordability).toBe("unmet");
    expect(result.engine?.referenceStatus).toBe("r-pending");
  });
  it("checks cap equality and one-cent failures without rounding dollars",async () => {
    const x = input(); x.scenarios[0].ceiling = confirmed({ cents: "1660000",currency: "USD",role: "manual-scenario" });
    expect((await planAimFit(x)).scenarios[0].candidates[1].affordability).toBe("met");
    x.scenarios[0].ceiling.value.cents = "1659999";
    expect((await planAimFit(x)).scenarios[0].candidates[1].affordability).toBe("unmet");
  });
  it("never supplies numerical fixtures for a missing adapter/runtime",async () => {
    const result = await planAimFit(input());
    expect(result.numericalFailure).toBe("runtime_missing");
    expect(result.scenarios[0].outcome).toBe("calculation_unavailable");
    expect(result.scenarios[0].candidates.every(c => c.numerical === null)).toBe(true);
    expect(hostAdapterAvailability().status).toBe("unavailable");
  });
  it("keeps unknown required limits separate from explicit exclusions",async () => {
    const x = input(); x.scenarios[0].resourceLimit = { status: "unknown",reason: "Capacity unconfirmed" };
    const a = (await planAimFit(x,pendingPort())).scenarios[0];
    expect(a.outcome).toBe("inputs_needed"); expect(a.candidates[1].resource).toBe("unknown");
    x.scenarios[0].resourceLimit = { status: "not_modelled",reason: "Outside this comparison" };
    const b = (await planAimFit(x,pendingPort())).scenarios[0];
    expect(b.candidates[1].resource).toBe("not_modelled"); expect(b.exclusions).toContain("Outside this comparison");
  });
  it("does not call the engine for unknown or wholly unsupported assumptions",async () => {
    const x = input(); let calls = 0; const port = { async calculate() { calls++; throw Error(); } };
    x.scenarios[0].numerical.delta = { status: "unknown",reason: "Meaningful effect needed" };
    expect((await planAimFit(x,port)).scenarios[0].outcome).toBe("inputs_needed");
    x.scenarios[0].numerical.delta = confirmed("100");
    expect((await planAimFit(x,port)).scenarios[0].outcome).toBe("unsupported_family_or_range"); expect(calls).toBe(0);
  });
  it("rejects omitted/duplicate outputs, mismatched minimum and invalid predecessors",async () => {
    for (const change of [(r: any) => r.scenarios[0].points.pop(),(r: any) => r.scenarios[0].points[1] = r.scenarios[0].points[0],(r: any) => r.scenarios[0].search.predecessor.nPerArm = 62,(r: any) => r.scenarios[0].search.point.power = "0.7",(r: any) => r.engine.referenceStatus = "validated",(r: any) => r.scenarios[0].search = { status: "beyond_supported_range" }]) {
      const r = await planAimFit(input(),pendingPort(change));
      expect(r.numericalFailure).toBe("invalid_or_failed_engine"); expect(r.scenarios[0].outcome).toBe("calculation_unavailable");
    }
  });
  it("preserves engine failures and input immutability",async () => {
    const x = input(), before = canonicalJson(x);
    const r = await planAimFit(x,{ async calculate() { return { status: "unavailable",code: "runtime_timeout" }; } });
    expect(r.numericalFailure).toBe("runtime_timeout"); expect(canonicalJson(x)).toBe(before);
    x.scenarios[0].costs.fixed[0].cents = confirmed("0"); expect(r.input.scenarios[0].costs.fixed[0].cents).not.toEqual(x.scenarios[0].costs.fixed[0].cents);
    expect(Object.isFrozen(r.input.scenarios[0])).toBe(true);
  });
  it("rejects a predecessor contradicting the retained candidate",async () => {
    const x = input(); x.variants = [63,64].map(n => ({ id: `n${n}`,nPerArm: n,explanation: "Certificate contradiction probe",confirmed: true,provenance }));
    const r = await planAimFit(x,pendingPort(r => { const s = r.scenarios[0]; s.points = [{ nPerArm: 63,power: "0.9",nominalHalfWidth: "3.526565746997695" },s.points[2]]; }));
    expect(r.numericalFailure).toBe("invalid_or_failed_engine");
  });
  it("summarizes wholly unsupported variants and width-only target failures honestly",async () => {
    const x = input(); x.variants = [{ id: "huge",nPerArm: 1000,explanation: "Outside lambda envelope",confirmed: true,provenance }]; x.scenarios[0].numerical.delta = confirmed("20");
    const unsupported = await planAimFit(x,pendingPort(r => { r.scenarios[0].points = []; r.scenarios[0].search = { status: "beyond_supported_range" }; }));
    expect(unsupported.scenarios[0].outcome).toBe("unsupported_family_or_range");
    const y = input(); y.variants = [{ id: "n86",nPerArm: 86,explanation: "Power passes; width fails",confirmed: true,provenance }];
    y.scenarios[0].numerical.targetPower = confirmed("0.9"); y.scenarios[0].numerical.nominalHalfWidthTarget = confirmed("3"); y.scenarios[0].ceiling = confirmed({ cents: "9999999",currency: "USD",role: "manual-scenario" });
    const width = await planAimFit(y,pendingPort(r => { r.scenarios[0].points = [{ nPerArm: 86,power: "0.9032299799913841",nominalHalfWidth: "3.010347257256072" }]; r.scenarios[0].search = { status: "beyond_supported_range" }; }));
    expect(width.scenarios[0].outcome).toBe("affordable_but_target_unmet");
  });
});

describe("AIMFIT immutable closure, currentness and explicit acceptance",() => {
  it("roundtrips exact export bytes and rejects corrupted/forged content",async () => {
    const run = freezeRun(await planAimFit(input(),pendingPort()));
    const bytes = exportRun(run,"json"), reopened = await readRun(JSON.parse(bytes.bytes.toString("utf8")));
    expect(exportRun(reopened,"json").bytes.equals(bytes.bytes)).toBe(true);
    expect(createHash("sha256").update(bytes.bytes).digest("hex")).toBe(bytes.sha256);
    const bad = structuredClone(run); bad.content.scenarios[0].candidates[0].totalCents = "1";
    await expect(readRun({ ...bad,sha256: digest(bad.content) })).rejects.toThrow("Invalid run content");
    const corrupt = structuredClone(run); corrupt.content.input.question.units = "other";
    await expect(readRun(corrupt)).rejects.toThrow("Corrupt run digest");
  });
  it("reports targeted cost/numerical/head changes while historical bytes remain exact",async () => {
    const x = input(); x.dependencies = [{ key: "budget",kind: "budget",projectId: "project1",version: "v1",hashAlgorithm: "sha256",hash: "a".repeat(64) }];
    const run = freezeRun(await planAimFit(x,pendingPort())), original = exportRun(run,"json").sha256;
    expect(currentness(run,x,[],run.content.engine).status).toBe("unresolved");
    expect(currentness(run,x,x.dependencies,run.content.engine).status).toBe("current");
    x.scenarios[0].costs.perRecruit[0].cents = confirmed("12000");
    expect(currentness(run,x,x.dependencies,run.content.engine).findings).toContainEqual({ key: "baseline:costs",action: "cost-resource-review" });
    x.scenarios[0].numerical.sigma = confirmed("12");
    expect(currentness(run,x,x.dependencies,run.content.engine).findings).toContainEqual({ key: "baseline:numerical",action: "recalculate" });
    expect(exportRun(run,"json").sha256).toBe(original);
    expect(currentness(run,run.content.input,run.content.input.dependencies).status).toBe("unresolved");
    expect(currentness(run,run.content.input,run.content.input.dependencies,{ ...run.content.engine!,workerSha256: "c".repeat(64) }).findings).toContainEqual({ key: "numerical-engine",action: "recalculate" });
  });
  it("requires exact explicit shortfall acceptance and binds before to actual after",async () => {
    const x = input(); x.dependencies = [proposalDependency(x.proposalRevisions[0])];
    const run = freezeRun(await planAimFit(x,pendingPort())), change = claimChange(run,"baseline","n50");
    const before = { projectId: "project1",applicationId: "app1",sectionId: "methods",revisionId: "before",text: "Original 80% planning claim" };
    const request = { version: "aimfit-accept-v1",accepted: true,runDigest: run.sha256,scenarioId: "baseline",candidateId: "n50",candidateDigest: change.candidateDigest,before,replacementText: "Reviewed lower-power R-pending conditional planning text",acknowledged: [],actor: "researcher",acceptedAt: "2026-10-25T12:00:00Z",reason: "Explicit planning tradeoff" };
    expect(() => acceptPreview(run,request,currentness(run,x,x.dependencies,run.content.engine))).toThrow("acknowledgement");
    const accepted = acceptPreview(run,{ ...request,acknowledged: change.requiredAcknowledgements },currentness(run,x,x.dependencies,run.content.engine));
    expect(() => linkAcceptedRevision(accepted,{ ...before,revisionId: "after",text: "different" })).toThrow();
    const after = { ...before,revisionId: "after",text: accepted.replacementText }, link = linkAcceptedRevision(accepted,after);
    expect(linkedRevisionStatus(link,after)).toBe("current");
    const updated = structuredClone(x); updated.proposalRevisions = [after]; updated.dependencies = [proposalDependency(after)];
    expect(currentnessForLink(run,link,updated,updated.dependencies,run.content.engine).status).toBe("current");
    updated.proposalRevisions[0] = { ...after,revisionId: "later" };
    updated.dependencies = [proposalDependency(updated.proposalRevisions[0])];
    expect(currentnessForLink(run,link,updated,updated.dependencies,run.content.engine).status).toBe("stale");
    const { sha256: oldHash,...badLink } = { ...link,expectedActiveRevisionId: "wrong" };
    expect(oldHash.length).toBe(64);
    expect(() => readClaimLink({ ...badLink,sha256: digest(badLink) })).toThrow("Corrupt claim link");
    expect(linkedRevisionStatus(link,{ ...after,revisionId: "later" })).toBe("proposal-context-review");
    expect(before.text).toBe("Original 80% planning claim");
    expect(() => acceptPreview(run,{ ...request,acknowledged: change.requiredAcknowledgements },{ status: "stale",findings: [] })).toThrow();
  });
});
