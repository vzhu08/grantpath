import { spawn, spawnSync } from "node:child_process";
import { mkdir, mkdtemp, writeFile } from "node:fs/promises";
import path from "node:path";
import assert from "node:assert/strict";
await mkdir(".test-data", { recursive: true }); await mkdir("test-results/awards", { recursive: true });
const data = await mkdtemp(path.resolve(".test-data/awards-dev-")), port = 3205, origin = `http://127.0.0.1:${port}`;
const occupied = await fetch(origin + "/api/health", { signal: AbortSignal.timeout(500) }).catch(() => null);
assert.equal(occupied, null, "Preserve any existing process on the reserved dev port.");
let output = "";
const child = spawn(process.execPath, ["node_modules/next/dist/bin/next", "dev", "--hostname", "127.0.0.1", "--port", String(port)], {
  cwd: process.cwd(), env: { ...process.env, GRANTPATH_DATA_DIR: data, RUN_LIVE_AI: "false", NEXT_TELEMETRY_DISABLED: "1" }, windowsHide: true, stdio: ["ignore", "pipe", "pipe"],
});
child.stdout.on("data", value => output += value); child.stderr.on("data", value => output += value);
try {
  let health;
  for (let i = 0; i < 180; i++) { if (child.exitCode !== null) throw Error(output); try { const r = await fetch(origin + "/api/health", { signal: AbortSignal.timeout(1000) }); if (r.ok) { health = await r.json(); break; } } catch {} await new Promise(resolve => setTimeout(resolve, 250)); }
  assert.equal(health?.service, "grantpath");
  const response = await fetch(origin + "/api/workspace"); assert.equal(response.status, 200); const state = await response.json(); assert.equal(state.schemaVersion, 5); assert.deepEqual(state.awards.records, []);
  const template = await fetch(origin + "/api/awards/templates"); assert.equal(template.status, 200); assert.equal((await template.json()).id, "nsf-annual-narrative-v1");
  await writeFile("test-results/awards/dev-smoke.json", JSON.stringify({ passed: true, command: `npm run dev -- --port ${port}`, data, health, schemaVersion: state.schemaVersion }, null, 2));
  console.log("Award dev smoke passed: " + origin);
} catch (error) { await writeFile("test-results/awards/dev-smoke.log", output); throw error; }
finally { if (process.platform === "win32") spawnSync("taskkill", ["/PID", String(child.pid), "/T", "/F"], { windowsHide: true, stdio: "ignore" }); else child.kill(); }
