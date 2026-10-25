import assert from "node:assert/strict";
import { spawn, type ChildProcess } from "node:child_process";
import { once } from "node:events";
import { request as httpRequest } from "node:http";
import { mkdir, mkdtemp, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { chromium, expect } from "@playwright/test";
import { createAwardDemoWorkspace } from "../lib/awards/demo";
import { cite } from "../lib/evidence";
import { StateSchema, type State } from "../lib/schema";
import { SECTION_KEYS, type ReportContext } from "../lib/awards/schema";
import { assembleWorksheet, currentReportDifferences } from "../lib/awards/reporting";
import type { AwardCommand } from "../lib/awards/commands";

const fixture = createAwardDemoWorkspace(false), base = path.resolve(".test-data"), artifacts = path.resolve("test-results/awards");
await mkdir(base, { recursive: true }); await mkdir(artifacts, { recursive: true });
const data = await mkdtemp(path.join(base, "awards-")), port = Number(process.env.GRANTPATH_TEST_PORT || 3105), origin = `http://127.0.0.1:${port}`;
assert.equal(port, 3105, "Award acceptance uses only its reserved test port.");
await writeFile(path.join(data, "workspace.json"), JSON.stringify(fixture.state, null, 2));
let server: ChildProcess | undefined, output = "", browser: Awaited<ReturnType<typeof chromium.launch>> | undefined;
const errors: string[] = [], consoleErrors: string[] = [];
async function start() {
  const occupied = await fetch(origin + "/api/health", { signal: AbortSignal.timeout(500) }).catch(() => null);
  assert.equal(occupied, null, "Reserved acceptance port is occupied; preserve its process.");
  server = spawn(process.execPath, ["node_modules/next/dist/bin/next", "start", "--hostname", "127.0.0.1", "--port", String(port)], {
    cwd: process.cwd(), env: { ...process.env, GRANTPATH_DATA_DIR: data, RUN_LIVE_AI: "false", OPENAI_API_KEY: "", ANTHROPIC_API_KEY: "", NEXT_TELEMETRY_DISABLED: "1" },
    windowsHide: true, stdio: ["ignore", "pipe", "pipe"],
  });
  server.stdout!.on("data", value => output += value); server.stderr!.on("data", value => output += value);
  await writeFile(path.join(artifacts, "server-process.json"), JSON.stringify({ pid: server.pid, data, port, parentPid: process.pid, revision: process.env.APP_REVISION, build: process.env.GRANTPATH_BUILD_ID }, null, 2));
  for (let i = 0; i < 120; i++) { if (server.exitCode !== null) throw Error(output); try { if ((await fetch(origin + "/api/health")).ok) return; } catch {} await new Promise(r => setTimeout(r, 200)); }
  throw Error("Owned award acceptance server failed to start: " + output);
}
async function stop() { if (server && server.exitCode === null) { const closed = once(server, "exit"); server.kill(); await closed; } }
async function state(): Promise<State> { const r = await fetch(origin + "/api/workspace"); assert.equal(r.status, 200, await r.clone().text()); return StateSchema.parse(await r.json()); }
async function post(command: unknown, expectedRevision?: number) { const s = await state(); return fetch(origin + "/api/workspace", { method: "POST", headers: { origin, "content-type": "application/json" }, body: JSON.stringify({ expectedRevision: expectedRevision ?? s.revision, command }) }); }
async function action(command: AwardCommand, operationId = `award-accept-${crypto.randomUUID()}`, expectedRevision?: number) {
  const r = await post({ type: "awardMutation", operationId, action: command }, expectedRevision); assert.equal(r.status, 200, await r.clone().text()); return r.json() as Promise<{ state: State; resultIds: string[] }>;
}
const bind = (s: State) => ({ awardId: s.awards.records[0]!.id, expectedAwardRevision: s.awards.records[0]!.revision });
async function saveReport() {
  let s = await state(); const award = s.awards.records[0]!, terms = s.awards.termsVersions.find(t => t.id === award.currentConfirmedTermsVersionId)!;
  const period = terms.payload.budgetPeriods[0]!, refs = [...terms.payload.sourceRefs, ...s.awards.progressUpdates.flatMap(u => u.revisions.at(-1)!.evidence.map(c => ({ sourceId: c.sourceId, version: c.version, hash: c.hash, role: "actual progress" })))];
  const selected = [...new Map(refs.map(r => [`${r.sourceId}:${r.version}:${r.hash}`, r])).values()];
  const context: ReportContext = { termsVersionId: terms.id, termsDigest: terms.digest, periodId: period.id, periodStart: period.start, periodEnd: period.end,
    evidenceThrough: "2026-10-25", asOfDate: "2026-10-25", progressRefs: s.awards.progressUpdates.map(u => ({ updateId: u.id, revisionId: u.revisions.at(-1)!.id })), sourceRefs: selected,
    historicalSourceReviews: selected.flatMap(ref => { const latest = s.sources.find(source => source.id === ref.sourceId)!.versions.at(-1)!.version; return latest !== ref.version ? [{ sourceId: ref.sourceId, version: ref.version, latestVersion: latest, actor: "Synthetic reviewer", reason: "Reviewed the later correction; the retained historical delay remains explicitly supported." }] : []; }) };
  const sections = assembleWorksheet(s.awards, award.id, context, s), { asOfDate: _, ...input } = context;
  const saved = await action({ type: "saveAnnualReport", ...bind(s), reportId: null, expectedReportRevisionId: null, context: input,
    sections: SECTION_KEYS.map(sectionKey => ({ sectionKey, blocks: sections[sectionKey], mode: "deterministic" })), actor: "Synthetic reviewer", reason: "Reviewed manual worksheet with missing third result and portal inputs." });
  const report = saved.state.awards.reports.find(r => r.id === saved.resultIds[0])!, revision = report.revisions[0]!;
  for (const sectionRevisionId of revision.sectionRevisionIds) { s = await state(); await action({ type: "reviewAnnualSection", ...bind(s), reportId: report.id, reportRevisionId: revision.id, sectionRevisionId, decision: "reviewed", actor: "Synthetic reviewer", reason: "Read exact saved text and visible gaps; no sponsor certification." }); }
  s = await state(); return action({ type: "freezeAnnualReport", ...bind(s), reportId: report.id, reportRevisionId: revision.id, actor: "Synthetic reviewer", reason: "Freeze reviewed draft with gaps." });
}
try {
  await start();
  const before = await state(), priorHistory = JSON.stringify(before.resubmissions), proposedProfile = JSON.stringify(before.projects[0]!.profile);
  const initial = await action(fixture.initialCommand, "accept-initial"), awardId = initial.resultIds[0]!, firstHead = initial.state.awards.records[0]!.currentConfirmedTermsVersionId;
  assert.equal(initial.state.schemaVersion, 5); assert.equal(initial.state.awards.originSnapshots[0]!.payload.submissionEvidence.state, "human_attested_snapshot");
  assert.equal(initial.state.awards.originSnapshots[0]!.payload.proposedMoneyFacts[0]!.value.state, "known");
  const financeURL = `/api/awards/${awardId}/finance-context`;
  let dto = await (await fetch(origin + financeURL)).json(); assert.equal(dto.fundingFacts[0].value.minorUnits, "24000000");
  assert.equal(initial.state.awards.originSnapshots[0]!.payload.proposedMoneyFacts[0]!.value.state === "known" && initial.state.awards.originSnapshots[0]!.payload.proposedMoneyFacts[0]!.value.minorUnits, "30000000");
  assert.equal(JSON.stringify(initial.state.projects[0]!.profile), proposedProfile); assert.equal(JSON.stringify(initial.state.resubmissions), priorHistory);
  for (const [letter, status, finding] of [["A", "completed", "inconclusive"], ["B", "delayed", "none_reported"]] as const) {
    const s = await state(), source = s.sources.find(x => x.id === fixture.outputId)!;
    await action({ type: "saveAwardProgress", ...bind(s), updateId: null, expectedProgressRevisionId: null, actor: "Synthetic researcher", reason: "Recorded exact dated log; performance is researcher-reported.",
      input: { termsVersionId: firstHead, goalIds: [`award-demo-goal-${letter}`], itemIds: [], startDate: "2026-10-01", endDate: "2026-10-01", observedDate: "2026-10-01", state: status, finding,
        factualText: letter === "A" ? "Experiment A completed with an inconclusive result." : "Experiment B is still unfinished.", delayReason: letter === "B" ? "Supplies missing." : "", recoveryPlan: letter === "B" ? "Repeat next month; future work." : "", nextPlan: "", evidence: [cite(source, source.versions[0]!.text)], evidenceKind: "researcher_log", correctionReason: "", allocation: null } });
  }
  const frozen = await saveReport(), snapshotId = frozen.resultIds[0]!, exportURL = `/api/awards/reports/${snapshotId}/export`;
  const oldMD = await (await fetch(origin + exportURL + "?format=md")).text(), oldJSON = await (await fetch(origin + exportURL + "?format=json")).text();
  assert.match(oldMD, /inconclusive/); assert.match(oldMD, /No actual progress update for goal: Run experiment C/); assert.match(oldMD, /Reviewed draft with gaps/);
  assert.equal((await fetch(origin + exportURL + "?format=html")).status, 400);
  let s = await state(); const extension = fixture.extensionPayload(firstHead, s);
  const a = await action({ type: "saveAwardChangeCandidate", ...bind(s), expectedHeadId: firstHead, payload: extension, supersedesCandidateId: null, actor: "Synthetic researcher", reason: "Source-backed recorded administrative extension; no new action amount." });
  s = await state(); const b = await action({ type: "saveAwardChangeCandidate", ...bind(s), expectedHeadId: firstHead, payload: extension, supersedesCandidateId: a.resultIds[0]!, actor: "Synthetic researcher", reason: "Competing replacement interpretation against the same old base." });
  const confirmed: string[] = [];
  for (const candidateId of [a.resultIds[0]!, b.resultIds[0]!]) { s = await state(); confirmed.push((await action({ type: "reviewAwardChange", ...bind(s), expectedHeadId: firstHead, candidateId, decision: "confirmed", sameAwardConfirmed: false, actor: "Synthetic reviewer", reason: "Confirmed transcription, not automatic current applicability." })).resultIds[1]!); }
  s = await state(); await action({ type: "selectCurrentAwardTerms", ...bind(s), expectedHeadId: firstHead, termsVersionId: confirmed[0]!, applicabilityConfirmed: true, retroactivePeriodsReviewed: true, actor: "Synthetic reviewer", reason: "Explicitly adopt the recorded extension and review affected periods." });
  s = await state(); const stale = await post({ type: "awardMutation", operationId: "stale-selection", action: { type: "selectCurrentAwardTerms", ...bind(s), expectedHeadId: confirmed[0]!, termsVersionId: confirmed[1]!, applicabilityConfirmed: true, retroactivePeriodsReviewed: true, actor: "Synthetic reviewer", reason: "Try the stale base with a fresh expected head." } }); assert.equal(stale.status, 409);
  dto = await (await fetch(origin + financeURL)).json(); assert.equal(dto.fundingFacts.some((f: { basis: string }) => f.basis === "current_action"), false); assert.equal(dto.fundingFacts[0].value.minorUnits, "24000000");
  assert.equal((await fetch(origin + financeURL + `?expectedHead=${firstHead}`)).status, 409);
  s = await state(); const source = s.sources.find(x => x.id === fixture.outputId)!;
  const corrected = await post({ type: "saveSource", id: source.id, projectId: fixture.projectId, sourceType: source.type, title: source.title, url: "", text: source.versions[0]!.text + " Correction: no positive result has been established." }); assert.equal(corrected.status, 200);
  s = await state(); const update = s.awards.progressUpdates[0]!, old = update.revisions[0]!, { id: _id, ordinal: _ordinal, author: _author, at: _at, ...input } = old;
  const newSource = s.sources.find(x => x.id === fixture.outputId)!;
  await action({ type: "saveAwardProgress", ...bind(s), updateId: update.id, expectedProgressRevisionId: old.id, actor: "Synthetic researcher", reason: "Correction keeps the old observation and evidence.", input: { ...input, correctionReason: "Clarified uncertainty.", factualText: "Corrected: completed with an inconclusive finding; no positive result established.", evidence: [cite(newSource, newSource.versions.at(-1)!.text)] } });
  s = await state(); assert.ok(currentReportDifferences(s.awards, s.awards.reports[0]!.id, s).length);
  const bytesBeforeRetry = await readFile(path.join(data, "workspace.json")); const replay = await action(fixture.initialCommand, "accept-initial", 0);
  assert.equal(replay.resultIds[0], awardId); assert.deepEqual(await readFile(path.join(data, "workspace.json")), bytesBeforeRetry);
  const second = await saveReport(); assert.notEqual(second.resultIds[0], snapshotId);
  assert.equal(await (await fetch(origin + exportURL + "?format=md")).text(), oldMD); assert.equal(await (await fetch(origin + exportURL + "?format=json")).text(), oldJSON);
  await stop(); await start();
  s = await state(); assert.equal(s.awards.reportSnapshots.length, 2); assert.equal(JSON.stringify(s.resubmissions), priorHistory);
  assert.equal(await (await fetch(origin + exportURL + "?format=md")).text(), oldMD); assert.equal(await (await fetch(origin + exportURL + "?format=json")).text(), oldJSON);
  const forbidden = await fetch(origin + "/api/workspace", { method: "POST", headers: { origin: "https://example.invalid", "content-type": "application/json" }, body: "{}" }); assert.equal(forbidden.status, 403);
  const hostileHost = await new Promise<number>((resolve, reject) => { const request = httpRequest(origin + "/api/awards/templates", { headers: { host: "example.invalid" } }, response => { response.resume(); resolve(response.statusCode!); }); request.once("error", reject); request.end(); }); assert.equal(hostileHost, 403);
  const oversized = await fetch(origin + "/api/workspace", { method: "POST", headers: { origin, "content-type": "application/json" }, body: JSON.stringify({ padding: "😀".repeat(40_000) }) }); assert.equal(oversized.status, 413);
  browser = await chromium.launch({ headless: true }); const context = await browser.newContext({ viewport: { width: 1440, height: 1000 }, timezoneId: "America/New_York", acceptDownloads: true }), page = await context.newPage();
  let injectingNetworkFailure = false;
  page.on("pageerror", error => errors.push(error.message)); page.on("console", message => { if (message.type() === "error" && !injectingNetworkFailure) consoleErrors.push(message.text()); });
  await page.goto(origin); await page.locator("nav").getByRole("button", { name: /Draft & readiness/ }).click(); await page.getByRole("button", { name: "Award & progress", exact: true }).click();
  await expect(page.getByRole("heading", { name: "Current approved terms", exact: true })).toBeVisible(); await expect(page.getByText("NSF-DEMO-240 · Example University", { exact: true })).toBeVisible();
  const citation = page.locator(".citation summary").first(); await citation.focus(); await citation.press("Enter"); await expect(page.locator(".citation blockquote").first()).toBeVisible();
  await page.screenshot({ path: path.join(artifacts, "award-desktop.png"), fullPage: true });
  await page.getByRole("button", { name: "Actual progress", exact: true }).click();
  const buffer = "Manual unsaved update remains intact through a competing save and a recovered lost response.";
  await page.getByLabel("What actually happened", { exact: true }).fill(buffer); await page.getByLabel("Local author", { exact: true }).fill("Synthetic browser researcher"); await page.getByLabel("Review note", { exact: true }).fill("Actual UI buffer/retry acceptance.");
  let injected = false; injectingNetworkFailure = true;
  await page.route("**/api/workspace", async route => { if (route.request().method() === "POST" && !injected) { injected = true; await route.fulfill({ status: 409, contentType: "application/json", body: JSON.stringify({ error: { message: "Synthetic competing-save conflict; preserve all award buffers." } }) }); } else await route.continue(); });
  await page.getByRole("button", { name: "Save actual update", exact: true }).click(); await expect(page.getByText("Synthetic competing-save conflict; preserve all award buffers.", { exact: true })).toBeVisible(); await expect(page.getByLabel("What actually happened", { exact: true })).toHaveValue(buffer);
  await page.unroute("**/api/workspace"); await page.getByRole("button", { name: "Keep edits and reconcile as a new save", exact: true }).click(); await page.getByRole("button", { name: "Use latest save revision (keep editor text)", exact: true }).click();
  const count = (await state()).awards.progressUpdates.length; injectingNetworkFailure = true; let lost = false, lossFinished!: () => void;
  const lossComplete = new Promise<void>(resolve => { lossFinished = resolve; });
  await page.route("**/api/workspace", async route => { if (route.request().method() === "POST" && !lost) { lost = true; const response = await route.fetch(); assert.equal(response.status(), 200); await route.abort("failed"); lossFinished(); } else await route.continue(); });
  await page.getByRole("button", { name: "Save actual update", exact: true }).click(); await lossComplete; await expect(page.getByRole("button", { name: "Retry exact last operation · recover original result", exact: true })).toBeEnabled(); await page.unrouteAll({ behavior: "wait" });
  await page.getByRole("button", { name: "Retry exact last operation · recover original result", exact: true }).click(); await expect(page.getByText("Recovered the original saved operation and record IDs. Editor text is retained.", { exact: true })).toBeVisible();
  assert.equal((await state()).awards.progressUpdates.length, count + 1); await expect(page.getByLabel("What actually happened", { exact: true })).toHaveValue(buffer); injectingNetworkFailure = false;
  await page.getByRole("button", { name: "Annual worksheet", exact: true }).click(); await expect(page.getByRole("heading", { name: "Historical reviewed snapshots", exact: true })).toBeVisible();
  await page.getByLabel("Confirmed reporting budget period", { exact: true }).selectOption("award-demo-year-1");
  await page.getByLabel("Evidence through date", { exact: true }).fill("2026-10-25");
  const progressChoices = page.getByRole("group", { name: "Select actual progress revisions", exact: true }).getByRole("checkbox");
  await progressChoices.nth(0).check(); await progressChoices.nth(1).check();
  await page.getByLabel("Local reviewer/preparer", { exact: true }).fill("Synthetic browser reviewer");
  await page.getByLabel("Review note, absence decision or missing-input disclosure", { exact: true }).fill("Reviewed the exact saved narrative and missing inputs; no sponsor certification.");
  await page.getByLabel("If retaining older evidence: reason after inspecting every newer supplied source", { exact: true }).fill("Inspected the later correction; the retained historical delay remains supported.");
  await page.getByRole("button", { name: "Assemble evidence-linked preview · review required", exact: true }).click();
  async function saveClick(name: string) { await expect(page.getByRole("button", { name, exact: true })).toBeEnabled(); const [response] = await Promise.all([page.waitForResponse(r => r.url().endsWith("/api/workspace") && r.request().method() === "POST"), page.getByRole("button", { name, exact: true }).click()]); assert.equal(response.status(), 200, await response.text()); return response.json(); }
  await saveClick("Save exact worksheet revision");
  for (const key of SECTION_KEYS) await saveClick(`Review saved ${key} with visible gaps`);
  await saveClick("Save reviewed draft snapshot with gaps");
  const [download] = await Promise.all([page.waitForEvent("download"), page.getByRole("link", { name: "Download narrative Markdown", exact: true }).last().click()]);
  assert.match(download.suggestedFilename(), /^grantpath-annual-[a-zA-Z0-9_-]+\.md$/); await download.saveAs(path.join(artifacts, "ui-narrative.md"));
  assert.match(await readFile(path.join(artifacts, "ui-narrative.md"), "utf8"), /No actual progress update for goal: Run experiment C/);
  await page.screenshot({ path: path.join(artifacts, "award-worksheet.png"), fullPage: true }); await page.setViewportSize({ width: 390, height: 844 }); await page.screenshot({ path: path.join(artifacts, "award-mobile.png"), fullPage: true });
  assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth), "Award worksheet must not overflow at 390px."); assert.deepEqual(errors, []); assert.deepEqual(consoleErrors, []);
  await writeFile(path.join(artifacts, "result.json"), JSON.stringify({ passed: true, port, data, awardId, snapshotIds: [snapshotId, second.resultIds[0]], proof: ["source-backed same-app attested origin", "requested300000/approved240000 separation", "dated inconclusive/delayed/missing activity", "reviewed immutable worksheet exports", "stale-base amendment409", "extension without new action money", "corrected source/progress with unchanged old exports", "actual process restart", "receipt replay without another write", "HTTP/host/raw-byte limits", "keyboard citation inspection", "409 buffer and lost-response ID recovery", "desktop and390px view"], errors, consoleErrors }, null, 2));
  console.log(`Award acceptance passed: ${origin} (isolated data ${data})`);
} catch (error) { await writeFile(path.join(artifacts, "server.log"), output); throw error; }
finally { await browser?.close(); await stop(); }
