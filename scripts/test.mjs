import { mkdirSync } from "node:fs";
import { spawnSync } from "node:child_process";
import path from "node:path";
const directory = path.resolve(".test-data/temp");
mkdirSync(directory, { recursive: true });
const result = spawnSync(
  process.execPath,
  [
    "node_modules/vitest/vitest.mjs",
    "run",
    "--maxWorkers=2",
    ...process.argv.slice(2),
  ],
  {
    stdio: "inherit",
    env: { ...process.env, TEMP: directory, TMP: directory },
  },
);
process.exit(result.status ?? 1);
