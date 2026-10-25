import { spawn } from "node:child_process";
import { createHash } from "node:crypto";
import { readFileSync, realpathSync } from "node:fs";
import path from "node:path";
import { NumericResponse, type NumericalPort, type NumericOutcome, type NumericQuery, FailureCode } from "./contracts";
import type { z } from "zod";
import { canonicalJson } from "./canonical";

/** Operator-only config. Never populate these paths/hashes from a planning request. */
export type RuntimeConfig = { pythonPath: string; pythonSha256: string; workerPath: string; workerSha256: string; cwd: string; timeoutMs?: number };
let active: symbol | null = null;
export function createPythonPort(config: RuntimeConfig): NumericalPort {
  return { async calculate(queries: NumericQuery[]): Promise<NumericOutcome> {
    if (active) return { status: "unavailable", code: "runtime_busy" };
    if (queries.length < 1 || queries.length > 7) return { status: "unavailable", code: "invalid_query_count" };
    const timeoutMs = config.timeoutMs ?? 10000;
    if (!Number.isInteger(timeoutMs) || timeoutMs < 1 || timeoutMs > 10000) return { status: "unavailable", code: "invalid_runtime_configuration" };
    let executable: string, worker: string;
    try {
      if (![config.pythonPath,config.workerPath,config.cwd].every(path.isAbsolute)) throw new Error();
      executable = realpathSync(config.pythonPath); worker = realpathSync(config.workerPath);
      const sha = (file: string) => createHash("sha256").update(readFileSync(file)).digest("hex");
      if (sha(executable) !== config.pythonSha256 || sha(worker) !== config.workerSha256) return { status: "unavailable", code: "runtime_identity_mismatch" };
    } catch { return { status: "unavailable", code: "runtime_missing" }; }
    const input = Buffer.from(canonicalJson({ version: "aimfit-numeric-v1",queries }),"utf8");
    if (input.length > 65536) return { status: "unavailable",code: "input_capacity" };
    const lease = Symbol("aimfit-child"); active = lease;
    const release = () => { if (active === lease) active = null; };
    try {
      return await new Promise<NumericOutcome>(resolve => {
        // Explicit env excludes provider credentials/PYTHONPATH; -I ignores user site/config.
        const env: NodeJS.ProcessEnv = { OPENBLAS_NUM_THREADS: "1", OMP_NUM_THREADS: "1", MKL_NUM_THREADS: "1" };
        for (const key of ["SystemRoot","WINDIR","TEMP","TMP"]) if (process.env[key]) env[key] = process.env[key];
        const child = spawn(executable,["-I","-B",worker],{ shell: false,windowsHide: true,cwd: config.cwd,env,stdio: ["pipe","pipe","pipe"] });
        const chunks: Buffer[] = []; let bytes = 0, errors = 0, failure: z.infer<typeof FailureCode> | null = null, done = false;
        const fail = (code: z.infer<typeof FailureCode>) => { failure ??= code; child.kill(); finish({ status: "unavailable",code }); };
        const timer = setTimeout(() => fail("runtime_timeout"),timeoutMs);
        const finish = (out: NumericOutcome) => { if (!done) { done = true; clearTimeout(timer); resolve(out); } };
        child.stdout.on("data", (b: Buffer) => { bytes += b.length; if (bytes > 65536) fail("output_capacity"); else chunks.push(b); });
        child.stderr.on("data", (b: Buffer) => { errors += b.length; if (errors > 4096) fail("stderr_capacity"); });
        child.stdin.on("error", () => fail("runtime_input_failure"));
        child.on("error", () => { finish({ status: "unavailable",code: "runtime_spawn_failure" }); });
        child.on("close", code => {
          release();
          if (failure || code !== 0 || errors > 0) return finish({ status: "unavailable",code: failure ?? "runtime_failed_or_warned" });
          try {
            const result = NumericResponse.parse(JSON.parse(Buffer.concat(chunks).toString("utf8")));
            if (result.engine.workerSha256 !== config.workerSha256 || result.engine.pythonSha256 !== config.pythonSha256) throw new Error();
            finish({ status: "computed_unverified",result });
          } catch { finish({ status: "unavailable",code: "invalid_runtime_output" }); }
        });
        child.stdin.end(input);
      });
    } catch { release(); return { status: "unavailable",code: "runtime_spawn_failure" }; }
  } };
}
