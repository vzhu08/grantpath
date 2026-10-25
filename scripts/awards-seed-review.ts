import { mkdir, open } from "node:fs/promises";
import path from "node:path";
import { createAwardDemoWorkspace } from "../lib/awards/demo";

const directory = path.resolve(".local-data/task-05-review");
const fixture = createAwardDemoWorkspace();
await mkdir(directory, { recursive: true });
try {
  const file = await open(path.join(directory, "workspace.json"), "wx", 0o600);
  try { await file.writeFile(JSON.stringify(fixture.state, null, 2), "utf8"); await file.sync(); } finally { await file.close(); }
  console.log(`Prepared explicit synthetic Task05 review workspace: ${directory}`);
} catch (error) {
  if ((error as NodeJS.ErrnoException).code !== "EEXIST") throw error;
  console.log(`Preserved existing private Task05 review workspace: ${directory}`);
}
