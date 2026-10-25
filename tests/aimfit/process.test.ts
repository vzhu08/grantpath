import { afterEach,describe,it,expect,vi } from "vitest";
import { EventEmitter } from "node:events";
import { PassThrough } from "node:stream";
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import path from "node:path";
const fakes = vi.hoisted(() => ({ spawn: vi.fn() }));
vi.mock("node:child_process",() => ({ spawn: fakes.spawn }));
import { createPythonPort } from "../../modules/aimfit/src/numerical";

/** Fake streams exercise process lifecycle/failure contracts; no child process is launched. */
class FakeChild extends EventEmitter {
  stdin = new PassThrough(); stdout = new PassThrough(); stderr = new PassThrough(); kill = vi.fn(() => true);
}
const query = [{ id: "baseline",delta: "5",sigma: "10",targetPower: "0.8",halfWidth: null,ns: [64] }];
function setup(timeoutMs = 10000) {
  const children: FakeChild[] = [];
  fakes.spawn.mockImplementation(() => { const c = new FakeChild(); children.push(c); return c; });
  const pythonPath = process.execPath,workerPath = path.resolve("modules/aimfit/runtime/worker.py");
  const sha = (file: string) => createHash("sha256").update(readFileSync(file)).digest("hex");
  return { children,port: createPythonPort({ pythonPath,pythonSha256: sha(pythonPath),workerPath,workerSha256: sha(workerPath),cwd: process.cwd(),timeoutMs }) };
}
afterEach(() => { vi.useRealTimers(); fakes.spawn.mockReset(); });
describe("AIMFIT process failure boundaries",() => {
  it("holds the lease after error until close and ignores an old duplicate close",async () => {
    const { children,port } = setup(); const a = port.calculate(query);
    children[0].emit("error",new Error("synthetic spawn error"));
    expect(await a).toEqual({ status: "unavailable",code: "runtime_spawn_failure" });
    expect((await port.calculate(query)).status).toBe("unavailable"); expect(children).toHaveLength(1);
    children[0].emit("close",1);
    const b = port.calculate(query); children[0].emit("close",1);
    expect(await port.calculate(query)).toEqual({ status: "unavailable",code: "runtime_busy" });
    children[1].emit("close",1); await b;
  });
  it("returns a bounded timeout while retaining the lock until owned child closes",async () => {
    vi.useFakeTimers(); const { children,port } = setup(10); const pending = port.calculate(query);
    await vi.advanceTimersByTimeAsync(10);
    expect(await pending).toEqual({ status: "unavailable",code: "runtime_timeout" }); expect(children[0].kill).toHaveBeenCalledOnce();
    expect(await port.calculate(query)).toEqual({ status: "unavailable",code: "runtime_busy" });
    children[0].emit("close",1);
  });
  it("rejects overlong stdout/stderr and does not retain their payloads",async () => {
    for (const [stream,size,code] of [["stdout",65537,"output_capacity"],["stderr",4097,"stderr_capacity"]] as const) {
      const { children,port } = setup(), pending = port.calculate(query);
      children[0][stream].write(Buffer.alloc(size,65));
      expect(await pending).toEqual({ status: "unavailable",code }); children[0].emit("close",1);
    }
  });
  it("rejects warnings, malformed output and nonzero exit without fixture substitution",async () => {
    for (const kind of ["warning","malformed","nonzero"]) {
      const { children,port } = setup(), pending = port.calculate(query);
      if (kind === "warning") children[0].stderr.write("synthetic warning");
      if (kind === "malformed") children[0].stdout.write("not-json");
      children[0].emit("close",kind === "nonzero" ? 2 : 0);
      expect(await pending).toEqual({ status: "unavailable",code: kind === "malformed" ? "invalid_runtime_output" : "runtime_failed_or_warned" });
    }
  });
});
