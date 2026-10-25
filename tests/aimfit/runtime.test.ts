import { describe,it,expect } from "vitest";
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import path from "node:path";
import { createPythonPort,type NumericQuery } from "./public";

/** Operator opt-in only. Ordinary offline tests never need a Python installation. */
describe.skipIf(!process.env.AIMFIT_PYTHON)("AIMFIT pinned runtime preflight (R-PENDING)",() => {
  it("executes seven bounded grids; verifies hand width and minimum/predecessor decisions",async () => {
    const pythonPath = process.env.AIMFIT_PYTHON!;
    const workerPath = path.resolve("modules/aimfit/runtime/worker.py");
    const sha = (file: string) => createHash("sha256").update(readFileSync(file)).digest("hex");
    const config = { pythonPath,pythonSha256: sha(pythonPath),workerPath,workerSha256: sha(workerPath),cwd: path.resolve(".test-data/aimfit/temp") };
    const q = (id: string,delta: string,sigma: string,targetPower: string,halfWidth: string | null,ns: number[]): NumericQuery => ({ id,delta,sigma,targetPower,halfWidth,ns });
    const queries = [q("baseline","5","10","0.8",null,[2,63,64]),q("power90","5","10","0.9",null,[85,86]),q("joint","5","10","0.9","3",[86,87]),q("powerBoundary","5","10","0.90323",null,[86]),q("widthBoundary","5","10","0.9","3.010347",[86]),q("lower","1","20","0.6",null,[2,1000]),q("upper","2","1","0.95",null,[2,612])];
    const port = createPythonPort(config), out = await port.calculate(queries);
    if (out.status !== "computed_unverified") throw new Error(out.code);
    expect(out.status).toBe("computed_unverified");
    expect(out.result.engine.referenceStatus).toBe("r-pending");
    for (const [i,n] of [[0,64],[1,86],[2,87]]) {
      const s = out.result.scenarios[i].search;
      expect(s.status).toBe("found");
      if (s.status === "found") { expect(s.point.nPerArm).toBe(n); expect(s.predecessor?.nPerArm).toBe(n-1); }
    }
    expect(out.result.scenarios[5].search.status).toBe("beyond_supported_range");
    // Independent analytic t(df=2) quantile, NOT a copy of scipy output.
    const n2 = out.result.scenarios[0].points[0];
    expect(Math.abs(Number(n2.nominalHalfWidth)-10*Math.sqrt(722/39))).toBeLessThan(1e-8);
    expect(out.result.scenarios[3].search.status).toBe("boundary_review");
    expect(out.result.scenarios[4].search.status).toBe("boundary_review");
    expect(await createPythonPort({ ...config,workerSha256: "0".repeat(64) }).calculate([queries[0]])).toEqual({ status: "unavailable",code: "runtime_identity_mismatch" });
    expect(await createPythonPort({ ...config,pythonPath: path.resolve("missing-python.exe") }).calculate([queries[0]])).toEqual({ status: "unavailable",code: "runtime_missing" });
    console.log(JSON.stringify({ caseCount: queries.length,engine: out.result.engine,searches: out.result.scenarios.map(s => ({ id: s.id,search: s.search })) }));
  },20000);
});
