import { chromium, expect } from "@playwright/test";
import { spawn } from "node:child_process";
import { once } from "node:events";
import { mkdir, mkdtemp, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import assert from "node:assert/strict";

const base = path.resolve(".test-data");
await mkdir(base, { recursive: true });
const data = await mkdtemp(path.join(base, "browser-"));
const artifacts = path.resolve("test-results");
await mkdir(artifacts, { recursive: true });
const port = Number(process.env.GRANTPATH_TEST_PORT || 3100),
  origin = `http://127.0.0.1:${port}`;
let server, browser;
let output = "";
const pageErrors = [];
async function start() {
  server = spawn(
    process.execPath,
    [
      "node_modules/next/dist/bin/next",
      "start",
      "--hostname",
      "127.0.0.1",
      "--port",
      String(port),
    ],
    {
      cwd: process.cwd(),
      env: {
        ...process.env,
        GRANTPATH_DATA_DIR: data,
        RUN_LIVE_AI: "false",
        NEXT_TELEMETRY_DISABLED: "1",
      },
      stdio: ["ignore", "pipe", "pipe"],
      windowsHide: true,
    },
  );
  server.stdout.on("data", (c) => (output += c));
  server.stderr.on("data", (c) => (output += c));
  for (let i = 0; i < 100; i++) {
    if (server.exitCode !== null) throw new Error(`Server failed: ${output}`);
    try {
      if ((await fetch(origin + "/api/health")).ok) return;
    } catch {}
    await new Promise((r) => setTimeout(r, 200));
  }
  throw new Error("Server startup timeout: " + output);
}
async function stop() {
  if (server && server.exitCode === null) {
    const closed = once(server, "exit");
    server.kill();
    await closed;
  }
}
try {
  await start();
  browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1440, height: 1000 },
    timezoneId: "America/New_York",
    acceptDownloads: true,
  });
  const page = await context.newPage();
  page.on("pageerror", (e) => pageErrors.push(e.message));
  await page.goto(origin);
  await expect(
    page.getByRole("button", { name: "Save project", exact: true }),
  ).toBeVisible();
  await page.screenshot({
    path: path.join(artifacts, "grantpath-desktop.png"),
    fullPage: true,
  });
  async function saveClick(locator) {
    const response = page.waitForResponse(
      (r) =>
        r.url().endsWith("/api/workspace") && r.request().method() === "POST",
    );
    await locator.click();
    const result = await response;
    assert.equal(result.status(), 200, await result.text());
    return result.json();
  }
  const navigate = (name) =>
    page
      .locator("nav")
      .getByRole("button", { name: new RegExp(name) })
      .click();
  await page
    .getByRole("button", { name: "+ New project", exact: true })
    .click();
  await page
    .getByLabel("Project title", { exact: true })
    .fill("E2E Watershed Research");
  await page
    .getByLabel("Short abstract", { exact: true })
    .fill(
      "Proposed comparison of water quality measurements. Pilot results and ethics approvals are not established.",
    );
  await page.getByLabel("Topic tags").fill("water, sensors");
  await page.getByLabel("Applicant type", { exact: true }).fill("University");
  await page.getByLabel("Career stage", { exact: true }).fill("Early career");
  await page
    .getByLabel("Institution", { exact: true })
    .fill("Example Research University");
  await page
    .getByLabel("Country / region", { exact: true })
    .fill("United States");
  await page
    .getByLabel("Approximate funding need", { exact: true })
    .fill("40000");
  const created = await saveClick(
    page.getByRole("button", { name: "Save project", exact: true }),
  );
  const projectId = created.selectedId;
  await page
    .getByLabel("Source title", { exact: true })
    .fill("Researcher methods note");
  const evidence =
    "The proposed study will compare sensor readings with laboratory reference measurements. No pilot measurements have been collected. Site access and the study size still require confirmation.";
  await page.getByLabel("Pasted evidence text", { exact: true }).fill(evidence);
  await saveClick(
    page.getByRole("button", { name: "Add evidence source", exact: true }),
  );
  await navigate("Opportunities");
  await page.getByRole("button", { name: "+ Add a call", exact: true }).click();
  await page
    .getByLabel("Call title", { exact: true })
    .fill("E2E Watershed Call");
  await page.getByLabel("Funder", { exact: true }).fill("Example Sponsor");
  await page
    .getByLabel("Funding call text", { exact: true })
    .fill(
      "Applicant type: University\nCareer stage: Early career\nCountry: United States\nTopics: water, sensors\nFunding minimum: 20000\nFunding maximum: 60000\nCurrency: USD\nDeadline: 2027-02-15\nSection: Project summary | 250 words\nSection: Significance | 500 words\nSection: Approach overview | 750 words\nDocument: Applicant CV",
    );
  const added = await saveClick(
    page.getByRole("button", { name: "Add funding call", exact: true }),
  );
  const reviewPanel = page.locator("section.card").filter({
    has: page.getByRole("heading", {
      name: "E2E Watershed Call",
      exact: true,
    }),
  });
  await expect(reviewPanel).toBeVisible();
  for (const box of await reviewPanel
    .locator(".criterion input[type=checkbox]")
    .all())
    await box.check();
  await reviewPanel
    .getByLabel("Deadline precision", { exact: true })
    .selectOption("date");
  await reviewPanel.getByLabel("Confirmed date").fill("2027-02-15");
  await reviewPanel.getByLabel("I reviewed the modeled eligibility").check();
  await saveClick(
    reviewPanel.getByRole("button", {
      name: "Save reviewed call fields",
      exact: true,
    }),
  );
  const callCard = page.locator("article.call-card").filter({
    has: page.getByRole("heading", {
      name: "E2E Watershed Call",
      exact: true,
    }),
  });
  await expect(
    callCard.getByText("Potential fit", { exact: true }),
  ).toBeVisible();
  const savedApp = await saveClick(
    callCard.getByRole("button", { name: "Save to application", exact: false }),
  );
  const applicationId = savedApp.selectedId;
  await expect(
    page.getByRole("heading", { name: "Application checklist", exact: true }),
  ).toBeVisible();
  for (let i = 0; i < 4; i++)
    await saveClick(
      page
        .getByRole("button", { name: "Confirm requirement", exact: true })
        .first(),
    );
  const cv = page.locator("article.requirement").filter({
    has: page.getByRole("heading", { name: "Applicant CV", exact: true }),
  });
  await cv
    .locator("summary")
    .filter({ hasText: "Edit status, support and target" })
    .click();
  await cv
    .getByLabel("Document / task status", { exact: true })
    .selectOption("Ready");
  await cv
    .getByLabel("Document status note", { exact: true })
    .fill("Researcher confirms the CV document is prepared.");
  await saveClick(
    cv.getByRole("button", { name: "Save checklist item", exact: true }),
  );
  await saveClick(
    page.getByRole("button", {
      name: "Confirm whole-call review",
      exact: true,
    }),
  );
  const calendar = page.waitForEvent("download");
  await page
    .getByRole("button", { name: "Export this event (.ics)", exact: false })
    .first()
    .click();
  const calendarDownload = await calendar;
  await calendarDownload.saveAs(path.join(artifacts, "browser-event.ics"));
  assert.match(
    await readFile(path.join(artifacts, "browser-event.ics"), "utf8"),
    /DTSTART;VALUE=DATE:20270215/,
  );
  await navigate("Draft & readiness");
  const drafts = page.locator("article.draft-editor");
  const savedTexts = [
    "This proposed project compares sensor and laboratory measurements. No pilot measurements have been collected.",
    "The study addresses the reliability of low-cost environmental measurements. Scientific conclusions will depend on the proposed evaluation.",
    "The proposed approach pairs sensor readings with laboratory reference measurements. Site access and sample size require researcher confirmation.",
  ];
  for (let i = 0; i < 3; i++) {
    const editor = drafts.nth(i);
    await editor.locator("textarea.draft-text").fill(savedTexts[i]);
    await saveClick(
      editor.getByRole("button", { name: "Save manual revision", exact: true }),
    );
  }
  const summary = drafts.nth(0);
  await summary
    .getByText("Evidence selection and exact quotations", { exact: true })
    .click();
  await summary
    .getByLabel("Add exact supporting quotation", { exact: true })
    .fill("No pilot measurements have been collected.");
  await summary
    .getByRole("button", { name: "Add quotation to this draft", exact: true })
    .click();
  await saveClick(
    summary.getByRole("button", { name: "Save manual revision", exact: true }),
  );
  await expect(page.getByText("0 blockers", { exact: true })).toBeVisible();
  // Saving one editor must not clear another editor's unsaved state.
  const significance=drafts.nth(1);
  await summary.locator('textarea.draft-text').fill(savedTexts[0]+' Reviewed wording.');
  await significance.locator('textarea.draft-text').fill(savedTexts[1]+' Pending manual edit.');
  await saveClick(summary.getByRole('button',{name:'Save manual revision',exact:true}));
  await expect(page.getByRole('button',{name:'Export packet',exact:false})).toBeDisabled();
  page.once('dialog',dialog=>dialog.dismiss());
  await navigate('Opportunities');
  await expect(significance.locator('textarea.draft-text')).toHaveValue(savedTexts[1]+' Pending manual edit.');
  await significance.locator('textarea.draft-text').fill(savedTexts[1]);
  await saveClick(significance.getByRole('button',{name:'Save manual revision',exact:true}));
  await summary.locator('textarea.draft-text').fill(savedTexts[0]);
  // A competing saved draft updates the concurrency base without replacing this buffer.
  let concurrent=await (await fetch(origin+'/api/workspace')).json();
  const currentDraft=concurrent.applications.find(a=>a.id===applicationId).sections[0];
  const competing=await fetch(origin+'/api/workspace',{method:'POST',headers:{origin,'content-type':'application/json'},body:JSON.stringify({expectedRevision:concurrent.revision,command:{type:'saveDraft',applicationId,sectionKey:'summary',label:currentDraft.label,wordLimit:currentDraft.wordLimit,text:'Competing saved text.',sourceIds:currentDraft.revisions.at(-1).selectedSources.map(s=>s.sourceId),citations:currentDraft.revisions.at(-1).citations}})});
  assert.equal(competing.status,200);
  const conflict=page.waitForResponse(r=>r.url().endsWith('/api/workspace')&&r.request().method()==='POST');
  await summary.getByRole('button',{name:'Save manual revision',exact:true}).click();
  assert.equal((await conflict).status(),409);
  await page.getByRole('button',{name:'Use latest save revision (keep editor text)',exact:true}).click();
  await expect(summary.locator('textarea.draft-text')).toHaveValue(savedTexts[0]);
  await saveClick(summary.getByRole('button',{name:'Save manual revision',exact:true}));
  await summary
    .getByText("Optional AI draft proposal", { exact: true })
    .click();
  await summary.getByLabel("Use the configured provider").check();
  await summary
    .getByRole("button", { name: "Generate proposal", exact: true })
    .click();
  await expect(summary.getByRole("alert")).toContainText("disabled");
  await expect(summary.locator("textarea.draft-text")).toHaveValue(
    savedTexts[0],
  );
  // Keyboard and narrow-screen checks use actual focus and geometry.
  await page.keyboard.press("Tab");
  assert.ok(
    await page.evaluate(() => document.activeElement?.tagName !== "BODY"),
  );
  await page.setViewportSize({ width: 390, height: 844 });
  await page.screenshot({
    path: path.join(artifacts, "grantpath-mobile.png"),
    fullPage: true,
  });
  assert.ok(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth + 1,
    ),
    "No horizontal viewport overflow",
  );
  await page.setViewportSize({ width: 1440, height: 1000 });
  const stageSave = page.waitForResponse(
    (r) =>
      r.url().endsWith("/api/workspace") && r.request().method() === "POST",
  );
  await page
    .getByLabel("Application stage", { exact: true })
    .selectOption("Ready for review");
  assert.equal((await stageSave).status(), 200);
  const packet = page.waitForEvent("download");
  await page
    .getByRole("button", { name: "Export packet", exact: false })
    .click();
  const packetDownload = await packet;
  await packetDownload.saveAs(path.join(artifacts, "browser-application.md"));
  const markdown = await readFile(
    path.join(artifacts, "browser-application.md"),
    "utf8",
  );
  assert.match(markdown, /No pilot measurements have been collected/);
  assert.match(markdown, /Source appendix/);
  assert.match(markdown, /Application checklist/);
  await page.reload();
  await expect(
    page.getByRole("button", { name: "Save project", exact: true }),
  ).toBeVisible();
  const beforeRestart = await (await fetch(origin + "/api/workspace")).json();
  assert.equal(
    beforeRestart.applications.find((a) => a.id === applicationId).stage,
    "Ready for review",
  );
  await stop();
  await start();
  const restarted = await (await fetch(origin + "/api/workspace")).json();
  assert.deepEqual(restarted, beforeRestart);
  // Fixture path is explicitly selected and remains isolated to the synthetic project.
  await page.reload();
  await expect(
    page.getByRole("button", { name: "Save project", exact: true }),
  ).toBeVisible();
  await page
    .getByLabel("Current project", { exact: true })
    .selectOption("demo-project");
  await navigate("Opportunities");
  const demoCard = page.locator("article.call-card").filter({
    has: page.getByRole("heading", {
      name: "Waterways Seed Research Award",
      exact: true,
    }),
  });
  await saveClick(
    demoCard.getByRole("button", { name: "Save to application", exact: false }),
  );
  await navigate("Draft & readiness");
  const fixtureEditor = page.locator("article.draft-editor").first();
  if (
    !(await fixtureEditor
      .getByLabel("Generation mode", { exact: true })
      .isVisible())
  )
    await fixtureEditor
      .getByText("Optional AI draft proposal", { exact: true })
      .click();
  await fixtureEditor
    .getByLabel("Generation mode", { exact: true })
    .selectOption("fixture");
  await fixtureEditor
    .getByRole("button", { name: "Generate proposal", exact: true })
    .click();
  await expect(
    fixtureEditor.getByText("DEMO / FIXTURE · Researcher review required", {
      exact: true,
    }),
  ).toBeVisible();
  await saveClick(
    fixtureEditor.getByRole("button", {
      name: "Accept proposal as new saved revision",
      exact: true,
    }),
  );
  await fixtureEditor
    .locator("textarea.draft-text")
    .fill("Unsaved researcher changes must remain in this editor.");
  if (
    !(await fixtureEditor
      .getByLabel("Generation mode", { exact: true })
      .isVisible())
  )
    await fixtureEditor
      .getByText("Optional AI draft proposal", { exact: true })
      .click();
  await fixtureEditor
    .getByLabel("Generation mode", { exact: true })
    .selectOption("fixture");
  await fixtureEditor
    .getByRole("button", { name: "Generate proposal", exact: true })
    .click();
  await expect(fixtureEditor.locator("textarea.draft-text")).toHaveValue(
    "Unsaved researcher changes must remain in this editor.",
  );
  await expect(
    fixtureEditor.getByRole("button", {
      name: "Accept proposal as new saved revision",
      exact: true,
    }),
  ).toBeDisabled();
  assert.deepEqual(pageErrors, [], "No uncaught browser errors");
  await writeFile(
    path.join(artifacts, "browser-result.json"),
    JSON.stringify(
      {
        passed: true,
        projectId,
        applicationId,
        dataDirectory: data,
        checks: [
          "manual full journey",
          "no-key recovery",
          "requirements/documents",
          "ICS and Markdown downloads",
          "source citations",
          "zero-blocker readiness stage",
          "refresh and real process restart persistence",
          "keyboard focus",
          "390px viewport",
          "explicit fixture generation/acceptance",
          "regeneration preserves unsaved text",
          "independent dirty editors and navigation guard",
          "competing draft conflict preserves local buffer",
        ],
        pageErrors,
      },
      null,
      2,
    ),
  );
  console.log(
    "Browser acceptance passed: manual journey, fixture path, exports, restart, keyboard and mobile. Artifacts: test-results/",
  );
} catch (error) {
  await writeFile(path.join(artifacts, "browser-server.log"), output);
  console.error(error);
  process.exitCode = 1;
} finally {
  await browser?.close();
  await stop();
}
