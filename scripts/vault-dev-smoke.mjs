import { spawn, spawnSync } from "node:child_process";
import { mkdir, mkdtemp, writeFile } from "node:fs/promises";
import path from "node:path";
import assert from "node:assert/strict";
await mkdir(".test-data", { recursive: true });
await mkdir("test-results", { recursive: true });
const directory = await mkdtemp(path.resolve(".test-data/vault-dev-")),
  port = 3202,
  origin = `http://127.0.0.1:${port}`;
let log = "";
const child = spawn(
  process.platform === "win32" ? "cmd.exe" : "npm",
  process.platform === "win32"
    ? ["/d", "/s", "/c", `npm run dev -- --port ${port}`]
    : ["run", "dev", "--", "--port", String(port)],
  {
    env: {
      ...process.env,
      GRANTPATH_DATA_DIR: directory,
      NEXT_TELEMETRY_DISABLED: "1",
    },
    windowsHide: true,
    stdio: ["ignore", "pipe", "pipe"],
  },
);
child.stdout.on("data", (v) => (log += v));
child.stderr.on("data", (v) => (log += v));
try {
  let health;
  for (let i = 0; i < 180; i++) {
    if (child.exitCode !== null) throw new Error(log);
    try {
      const r = await fetch(origin + "/api/health", {
        signal: AbortSignal.timeout(1000),
      });
      if (r.ok) {
        health = await r.json();
        break;
      }
    } catch {}
    await new Promise((r) => setTimeout(r, 250));
  }
  assert.equal(health?.service, "grantpath");
  const r = await fetch(origin + "/api/workspace");
  assert.equal(r.status, 200);
  assert.equal((await r.json()).schemaVersion, 4);
  await writeFile(
    "test-results/vault-dev-smoke.json",
    JSON.stringify(
      {
        passed: true,
        command: `npm run dev -- --port ${port}`,
        directory,
        health,
      },
      null,
      2,
    ),
  );
  console.log("Dev smoke passed on isolated port3202");
} catch (e) {
  await writeFile("test-results/vault-dev-smoke.log", log);
  throw e;
} finally {
  if (process.platform === "win32")
    spawnSync("taskkill", ["/PID", String(child.pid), "/T", "/F"], {
      windowsHide: true,
      stdio: "ignore",
    });
  else child.kill();
}
