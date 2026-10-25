import { PDFDocument, StandardFonts } from "pdf-lib";
import { chromium, expect } from "@playwright/test";
import { spawn } from "node:child_process";
import { once } from "node:events";
import { mkdir, mkdtemp, readFile, writeFile } from "node:fs/promises";
import { createHash, randomUUID } from "node:crypto";
import path from "node:path";
import assert from "node:assert/strict";
const port = Number(process.env.GRANTPATH_TEST_PORT || 3102),
  origin = `http://127.0.0.1:${port}`;
await mkdir(".test-data", { recursive: true });
await mkdir("test-results", { recursive: true });
const directory = await mkdtemp(path.resolve(".test-data/vault-browser-"));
let server,
  browser,
  logs = "";
const errors = [];
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
      env: {
        ...process.env,
        GRANTPATH_DATA_DIR: directory,
        NEXT_TELEMETRY_DISABLED: "1",
        RUN_LIVE_AI: "false",
      },
      stdio: ["ignore", "pipe", "pipe"],
      windowsHide: true,
    },
  );
  server.stdout.on("data", (x) => (logs += x));
  server.stderr.on("data", (x) => (logs += x));
  for (let i = 0; i < 150; i++) {
    if (server.exitCode !== null) throw new Error(logs);
    try {
      if ((await fetch(origin + "/api/health")).ok) return;
    } catch {}
    await new Promise((r) => setTimeout(r, 100));
  }
  throw new Error("startup timeout");
}
async function stop() {
  if (server && server.exitCode === null) {
    const closed = once(server, "exit");
    server.kill();
    await closed;
  }
}
async function state() {
  const r = await fetch(origin + "/api/workspace");
  assert.equal(r.status, 200, await r.clone().text());
  return r.json();
}
async function command(command) {
  const current = await state(),
    r = await fetch(origin + "/api/workspace", {
      method: "POST",
      headers: { "content-type": "application/json", origin },
      body: JSON.stringify({ expectedRevision: current.revision, command }),
    });
  assert.equal(r.status, 200, await r.clone().text());
  return r.json();
}
async function settled() {
  for (let i = 0; i < 200; i++) {
    const s = await state();
    if (
      s.parseAttempts.length &&
      !s.parseAttempts.some((p) => ["pending", "running"].includes(p.status))
    )
      return s;
    await new Promise((r) => setTimeout(r, 100));
  }
  throw new Error("parse timeout");
}
const sha = (bytes) => createHash("sha256").update(bytes).digest("hex");
try {
  await start();
  const seed = await state();
  const projectId = (
    await command({
      type: "saveProject",
      profile: {
        ...seed.projects[0].profile,
        title: "Vault acceptance synthetic researcher",
      },
    })
  ).selectedId;
  const callId = (
    await command({
      type: "saveCall",
      title: "Synthetic vault call",
      funder: "Synthetic only",
      url: "",
      text: "Document: Applicant CV\nDocument: Support letter\nSection: Project summary | 250 words\nDeadline: 2027-02-15",
    })
  ).selectedId;
  const appId = (
    await command({ type: "saveApplication", projectId, opportunityId: callId })
  ).selectedId;
  let current = await state(),
    app = current.applications.find((a) => a.id === appId);
  const cvReq = app.requirements.find((r) => r.description === "Applicant CV"),
    letterReq = app.requirements.find(
      (r) => r.description === "Support letter",
    );
  const vault = {
    delivery: "file-upload",
    phase: "application",
    requiredDate: null,
    allowedMime: ["application/pdf"],
    maxBytes: null,
    maxPages: null,
    manualRules: "Inspect all sponsor formatting manually",
    ethicsRecordId: null,
    settingsSource: "Synthetic reviewed instruction",
    officialUrl: "",
    checkedDate: "2026-10-25",
  };
  for (const r of [cvReq, letterReq])
    await command({
      type: "saveRequirement",
      applicationId: appId,
      requirement: {
        ...r,
        obligation: "required",
        review: "confirmed",
        status: "Ready",
        vault,
      },
    });
  const summary = app.requirements.find((r) => r.category === "section");
  await command({
    type: "saveRequirement",
    applicationId: appId,
    requirement: {
      ...summary,
      vault: { ...vault, delivery: "portal-text" },
      review: "confirmed",
    },
  });
  browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
      viewport: { width: 1440, height: 1050 },
    }),
    page = await context.newPage();
  page.on("pageerror", (e) => errors.push(e.message));
  async function project() {
    await page.goto(origin);
    await page
      .getByLabel("Current project", { exact: true })
      .selectOption(projectId);
  }
  async function clickSave(locator) {
    const response = page.waitForResponse(
      (r) =>
        r.url().endsWith("/api/workspace") && r.request().method() === "POST",
    );
    await locator.click();
    const r = await response;
    assert.equal(r.status(), 200, await r.text());
    return r.json();
  }
  await project();
  const library = page.getByRole("region", {
    name: "Project document library",
  });
  await library
    .locator("summary")
    .filter({ hasText: /^Upload a supporting document$/ })
    .click();
  await library.getByLabel("Original file", { exact: true }).setInputFiles({
    name: "cv.pdf",
    mimeType: "application/pdf",
    buffer: await readFile("modules/documents/fixtures/text.pdf"),
  });
  await library
    .getByLabel("Document title", { exact: true })
    .first()
    .fill("CV synthetic");
  const up = page.waitForResponse(
    (r) =>
      r.url().endsWith("/api/documents") && r.request().method() === "POST",
  );
  await library
    .getByRole("button", { name: "Upload original file", exact: true })
    .click();
  assert.equal((await up).status(), 201);
  const uploadedState = await state(),
    uploadedDoc = uploadedState.documents.find(
      (d) => d.projectId === projectId && d.title === "CV synthetic",
    );
  const upload = {
    documentId: uploadedDoc?.id,
    versionId: uploadedDoc?.versionIds.at(-1),
  };
  assert(upload.versionId);
  await settled();
  await project();
  let card = library.locator("article.requirement").filter({
    has: page.getByRole("heading", { name: "CV synthetic", exact: true }),
  });
  await card
    .locator("summary")
    .filter({ hasText: /^Versions, original files/ })
    .click();
  await card
    .locator("summary")
    .filter({ hasText: /^Version 1/ })
    .click();
  await card
    .getByRole("button", { name: "View extracted text", exact: true })
    .click();
  const extracted = await card
    .getByLabel("Normalized extracted text", { exact: true })
    .inputValue();
  assert(extracted.length > 0);
  await card.getByLabel("Passage start (UTF-16)", { exact: true }).fill("0");
  await card
    .getByLabel("Passage end (exclusive)", { exact: true })
    .fill(String(extracted.length));
  await card
    .getByLabel("Excerpt reviewer label", { exact: true })
    .fill("Synthetic researcher");
  await card
    .getByLabel("Excerpt review reason", { exact: true })
    .fill("Compared exact passage against the original synthetic file");
  await clickSave(
    card.getByRole("button", { name: "Promote reviewed excerpt", exact: true }),
  );
  current = await state();
  const source = current.sources.find(
    (s) => s.projectId === projectId && s.versions.at(-1).fileOrigin,
  );
  assert(source);
  const sv = source.versions.at(-1);
  await command({
    type: "saveDraft",
    applicationId: appId,
    sectionKey: summary.sectionKey,
    label: "Project summary",
    wordLimit: 250,
    text: "Proposed work supported by an explicitly reviewed synthetic excerpt.",
    sourceIds: [source.id],
    citations: [
      {
        sourceId: source.id,
        version: sv.version,
        hash: sv.hash,
        quote: sv.text,
        start: 0,
        end: sv.text.length,
      },
    ],
  });
  // The second synthetic document uses the same bounded original endpoint; file review remains independent.
  current = await state();
  const meta = {
    projectId,
    filename: "letter.pdf",
    claimedMime: "application/pdf",
    title: "Support letter synthetic",
    category: "Support letter",
    owner: "Synthetic researcher",
    expectedRevision: current.revision,
    idempotencyKey: randomUUID(),
  };
  const letterResponse = await fetch(origin + "/api/documents", {
    method: "POST",
    headers: {
      origin,
      "content-type": "application/octet-stream",
      "x-upload-metadata": Buffer.from(JSON.stringify(meta)).toString(
        "base64url",
      ),
    },
    body: await readFile("modules/documents/fixtures/text.pdf"),
  });
  assert.equal(letterResponse.status, 201);
  const letter = await letterResponse.json();
  await settled();
  await command({
    type: "saveEthicsRecord",
    projectId,
    record: {
      category: "IRB",
      scope: "Synthetic later-phase study",
      institution: "Synthetic institution",
      reference: "SYNTHETIC-IRB",
      status: "pending",
      basis: "Manual synthetic scenario",
      phase: "before-research",
      requiredDate: "2027-03-01",
      approvalDate: null,
      expiry: { kind: "unknown" },
      supportingVersionIds: [],
    },
  });
  await project();
  await page
    .locator("nav")
    .getByRole("button", { name: /Application plan/ })
    .click();
  for (const [req, versionId] of [
    [cvReq, upload.versionId],
    [letterReq, letter.versionId],
  ]) {
    const item = page.locator("article.requirement").filter({
      has: page.getByRole("heading", { name: req.description, exact: true }),
    });
    await item
      .getByLabel("Choose a project file version", { exact: true })
      .selectOption(versionId);
    await clickSave(
      item.getByRole("button", {
        name: "Select exact file version",
        exact: true,
      }),
    );
    await item
      .locator("summary")
      .filter({ hasText: /^Review selected original file$/ })
      .click();
    await item
      .getByLabel("Attachment reviewer label", { exact: true })
      .fill("Synthetic researcher");
    await item
      .getByLabel("Attachment review reason", { exact: true })
      .fill("Opened and checked this original against synthetic instructions");
    for (const label of [
      "I opened the original file and it is readable",
      "This version is relevant to the requirement",
      "I checked the sponsor's remaining manual format rules",
    ])
      await item.getByLabel(label, { exact: true }).check();
    await clickSave(
      item.getByRole("button", {
        name: "Accept reviewed selection",
        exact: true,
      }),
    );
  }
  const handoffResponse = page.waitForResponse(
    (r) => /\/handoffs$/.test(r.url()) && r.request().method() === "POST",
  );
  await page
    .getByRole("button", { name: "Save handoff snapshot", exact: true })
    .click();
  assert.equal((await handoffResponse).status(), 201);
  const handoff = { handoffId: (await state()).handoffs.at(-1)?.id };
  assert(handoff.handoffId);
  current = await state();
  const frozen = JSON.stringify(current.handoffs[0]);
  assert.equal(current.handoffs[0].files.length, 2);
  assert.equal(current.handoffs[0].answers.length, 1);
  assert(!current.handoffs[0].warnings.some((w) => w.includes("Ethics scope")));
  assert.notEqual(
    current.applications.find((a) => a.id === appId).stage,
    "Submitted",
  );
  for (const f of current.handoffs[0].files) {
    const download = await fetch(
      `${origin}/api/applications/${appId}/handoffs/${handoff.handoffId}/${f.documentVersionId}/download`,
    );
    assert.equal(download.status, 200);
    assert.equal(sha(Buffer.from(await download.arrayBuffer())), f.sha256);
  }
  await page
    .locator("nav")
    .getByRole("button", { name: /Project & evidence/ })
    .click();
  card = library.locator("article.requirement").filter({
    has: page.getByRole("heading", { name: "CV synthetic", exact: true }),
  });
  await card
    .locator("summary")
    .filter({ hasText: /^Replace with a new version$/ })
    .click();
  await card
    .getByLabel("Replacement original file", { exact: true })
    .setInputFiles({
      name: "cv-v2.pdf",
      mimeType: "application/pdf",
      buffer: await readFile("modules/documents/fixtures/text.pdf"),
    });
  const replace = page.waitForResponse(
    (r) =>
      r.url().endsWith("/api/documents") && r.request().method() === "POST",
  );
  await card
    .getByRole("button", { name: "Save a new immutable version", exact: true })
    .click();
  assert.equal((await replace).status(), 201);
  await settled();
  await expect(card.getByText(/latest v2/)).toBeVisible();
  await expect(
    page.getByText("A newer workspace version is available", { exact: true }),
  ).toHaveCount(0);
  current = await state();
  assert.equal(JSON.stringify(current.handoffs[0]), frozen);
  assert.equal(
    current.attachmentSelections
      .filter((s) => s.requirementId === cvReq.id)
      .at(-1).documentVersionId,
    upload.versionId,
  );
  await page.screenshot({
    path: "test-results/vault-desktop.png",
    fullPage: true,
  });
  await page.setViewportSize({ width: 390, height: 844 });
  await page.screenshot({
    path: "test-results/vault-mobile.png",
    fullPage: true,
  });
  assert(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
    "mobile overflow",
  );
  await stop();
  await start();
  await project();
  current = await state();
  assert.equal(JSON.stringify(current.handoffs[0]), frozen);
  assert.equal(
    current.documents.find((d) => d.id === upload.documentId).versionIds.length,
    2,
  );
  for (const f of current.handoffs[0].files) {
    const r = await fetch(
      `${origin}/api/applications/${appId}/handoffs/${handoff.handoffId}/${f.documentVersionId}/download`,
    );
    assert.equal(sha(Buffer.from(await r.arrayBuffer())), f.sha256);
  }
  assert.deepEqual(errors, []);
  const near = await PDFDocument.create(),
    font = await near.embedFont(StandardFonts.Helvetica);
  for (let i = 0; i < 100; i++)
    near
      .addPage()
      .drawText(`Synthetic responsiveness page ${i + 1}`, {
        x: 60,
        y: 700,
        font,
        size: 12,
      });
  const nearBytes = await near.save(),
    beforeProfile = await state();
  const profileMeta = {
    projectId,
    filename: "near-limit.pdf",
    claimedMime: "application/pdf",
    title: "Archived performance fixture",
    category: "Synthetic performance",
    owner: "Synthetic acceptance",
    expectedRevision: beforeProfile.revision,
    idempotencyKey: randomUUID(),
  };
  const admitted = await fetch(origin + "/api/documents", {
    method: "POST",
    headers: {
      origin,
      "content-type": "application/octet-stream",
      "x-upload-metadata": Buffer.from(JSON.stringify(profileMeta)).toString(
        "base64url",
      ),
    },
    body: nearBytes,
  });
  assert.equal(admitted.status, 201);
  const profiled = await admitted.json();
  const during = await state(),
    parsingAtProbe = during.parseAttempts.some(
      (a) =>
        a.documentVersionId === profiled.versionId &&
        ["pending", "running"].includes(a.status),
    );
  const probeStarted = performance.now(),
    probe = await fetch(origin + "/api/health");
  assert.equal(probe.status, 200);
  const healthDuringParseMs = performance.now() - probeStarted;
  const afterProfile = await settled(),
    profileAttempt = afterProfile.parseAttempts
      .filter((a) => a.documentVersionId === profiled.versionId)
      .at(-1);
  assert.equal(profileAttempt.status, "parsed");
  assert.equal(profileAttempt.pages, 100);
  await command({
    type: "archiveDocument",
    documentId: profiled.documentId,
    archived: true,
  });
  await writeFile(
    "test-results/vault-browser-result.json",
    JSON.stringify(
      {
        passed: true,
        directory,
        port,
        projectId,
        appId,
        handoffId: handoff.handoffId,
        checks: [
          "researcher fixture",
          "UI upload and byte-preserving storage",
          "exact extraction promotion and draft origin",
          "two explicitly reviewed selections",
          "later-phase ethics nonblocking",
          "frozen answers/files/warnings",
          "replacement pins v1",
          "download SHA256",
          "390px viewport",
          "real process restart",
        ],
        errors,
        performance: {
          parsingAtProbe,
          healthDuringParseMs,
          attempt: profileAttempt,
        },
      },
      null,
      2,
    ),
  );
  console.log(
    "Vault browser acceptance passed; evidence test-results/vault-browser-result.json",
  );
} catch (e) {
  console.error(e);
  await writeFile("test-results/vault-browser-server.log", logs);
  process.exitCode = 1;
} finally {
  await browser?.close();
  await stop();
}
