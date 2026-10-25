import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import assert from "node:assert/strict";
import { renderProposal, type RenderResult } from "../lib/proposals/rendering";
import {
  fidelityFixture,
  overflowFixture,
  tableFixture,
} from "../lib/proposals/render-fixtures";
const results: Record<string, RenderResult> = {};
for (const [name, fixture, limit] of [
  ["fidelity", fidelityFixture, 1],
  ["overflow", overflowFixture, 1],
  ["table", tableFixture, undefined],
] as const) {
  const result = await renderProposal(fixture, { pageLimit: limit });
  results[name] = result;
  assert.equal(result.status, "succeeded", result.error ?? "Renderer failed");
  if (name === "fidelity") assert.equal(result.withinPageLimit, true);
  if (name === "overflow") {
    assert.ok(result.pages! > 1);
    assert.equal(result.withinPageLimit, false);
  }
  console.log(
    `${name}: ${result.pages} pages; page limit ${limit ?? "none"}; ${result.withinPageLimit === null ? "measured" : result.withinPageLimit ? "within limit" : "OVER LIMIT"}`,
  );
}
const output = path.resolve("test-results/proposal-rendering");
await mkdir(output, { recursive: true });
await writeFile(
  path.join(output, "verified-results.json"),
  JSON.stringify(results, null, 2),
);
console.log(
  "Canonical DOCX -> LibreOffice PDF verified. Results: test-results/proposal-rendering/verified-results.json",
);
