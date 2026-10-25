import { spawn } from "node:child_process";
import { randomUUID } from "node:crypto";
import { mkdir, open, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
async function main() {
  const root = process.cwd(),
    port = Number(process.env.PORT || 3000),
    origin = `http://127.0.0.1:${port}`;
  if (!Number.isInteger(port) || port < 1024 || port > 65535)
    throw new Error("Choose a local port from 1024 through 65535.");
  const directory = path.resolve(
    process.env.GRANTPATH_DATA_DIR || ".local-data",
  );
  await mkdir(directory, { recursive: true });
  const recordPath = path.join(directory, `local-server-${port}.json`);
  const build = (
    await readFile(path.join(root, ".next/BUILD_ID"), "utf8").catch(() => {
      throw new Error(
        "Run npm run build before starting the local review server.",
      );
    })
  ).trim();
  async function health() {
    try {
      const response = await fetch(origin + "/api/health", {
        signal: AbortSignal.timeout(1000),
      });
      return response.ok ? await response.json() : null;
    } catch {
      return null;
    }
  }
  const current = await health();
  if (current) {
    if (current.service !== "grantpath")
      throw new Error(
        `${origin} is already used by another application. Set PORT to another local port.`,
      );
    if (current.build === build) {
      console.log(`Review GrantPath: ${origin}`);
      return;
    }
    const saved = JSON.parse(
      await readFile(recordPath, "utf8").catch(() => "null"),
    );
    if (!saved || saved.instance !== current.instance)
      throw new Error(
        "A different GrantPath server is using this port. Stop it explicitly or choose another PORT.",
      );
    process.kill(saved.pid);
    for (let i = 0; i < 30; i++) {
      if (!(await health())) break;
      await new Promise((resolve) => setTimeout(resolve, 100));
    }
  }
  const instance = randomUUID();
  const stdout = await open(path.join(directory, "server.stdout.log"), "a"),
    stderr = await open(path.join(directory, "server.stderr.log"), "a");
  const child = spawn(
    process.execPath,
    [
      path.join(root, "node_modules/next/dist/bin/next"),
      "start",
      "--hostname",
      "127.0.0.1",
      "--port",
      String(port),
    ],
    {
      cwd: root,
      env: {
        ...process.env,
        GRANTPATH_INSTANCE_ID: instance,
        GRANTPATH_BUILD_ID: build,
        NEXT_TELEMETRY_DISABLED: "1",
      },
      detached: true,
      windowsHide: true,
      stdio: ["ignore", stdout.fd, stderr.fd],
    },
  );
  await new Promise((resolve, reject) => {
    child.once("spawn", resolve);
    child.once("error", reject);
  });
  child.unref();
  await stdout.close();
  await stderr.close();
  await writeFile(
    recordPath,
    JSON.stringify(
      {
        pid: child.pid,
        instance,
        port,
        build,
        startedAt: new Date().toISOString(),
      },
      null,
      2,
    ),
    { mode: 0o600 },
  );
  for (let i = 0; i < 100; i++) {
    const status = await health();
    if (status?.instance === instance) {
      console.log(`Review GrantPath: ${origin}`);
      return;
    }
    await new Promise((resolve) => setTimeout(resolve, 150));
  }
  throw new Error(
    "The local server did not become healthy. Inspect .local-data/server.stderr.log; no browser success was assumed.",
  );
}
await main();
