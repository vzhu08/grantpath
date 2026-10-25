import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { expect } from "@playwright/test";
import { unzipSync, strFromU8 } from "fflate";

const escape = (text) => text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
const sha256 = (bytes) => createHash("sha256").update(bytes).digest("hex");
const visibleText = (blocks) =>
  blocks
    .flatMap((block) =>
      block.type === "table"
        ? [...block.headers, ...block.rows.flat()]
        : block.type === "list"
          ? block.items
          : [block.text],
    )
    .join("\n");

/** Loopback-only acceptance, invoked after e2e.mjs creates its researcher journey. */
export async function proposalBrowserAcceptance({ page, origin, artifacts }) {
  await mkdir(artifacts, { recursive: true });
  const request = page.request;
  const workspaceUrl = origin + "/api/workspace";
  async function state() {
    const response = await request.get(workspaceUrl);
    assert.equal(response.status(), 200, await response.text());
    return response.json();
  }
  async function command(value) {
    const latest = await state();
    const response = await request.post(workspaceUrl, {
      headers: { origin, "content-type": "application/json" },
      data: { expectedRevision: latest.revision, command: value },
    });
    assert.equal(response.status(), 200, await response.text());
    return response.json();
  }
  function mutationResponse() {
    return page.waitForResponse(
      (response) =>
        response.url() === workspaceUrl &&
        response.request().method() === "POST",
    );
  }
  async function saveClick(button, status = 200) {
    const waiting = mutationResponse();
    await button.click();
    const response = await waiting;
    assert.equal(response.status(), status, await response.text());
    return response.json();
  }
  const initial = await state();
  const project =
    initial.projects.find(
      (item) => item.profile.title === "E2E Watershed Research",
    ) ??
    initial.projects.find(
      (item) =>
        item.provenance === "researcher" &&
        initial.applications.some((app) => app.projectId === item.id),
    );
  assert.ok(
    project,
    "The baseline journey must create a researcher project first.",
  );
  const baselineApp = initial.applications.find(
    (item) => item.projectId === project.id,
  );
  assert.ok(
    baselineApp,
    "The baseline journey must create a saved application first.",
  );
  const applicationId = baselineApp.id;
  let evidence =
    initial.sources.find(
      (source) =>
        source.projectId === project.id &&
        source.versions
          .at(-1)
          .text.includes("No pilot measurements have been collected."),
    ) ?? initial.sources.find((source) => source.projectId === project.id);
  assert.ok(evidence, "The baseline project must have researcher evidence.");
  const editor = (key) =>
    page.locator(`[aria-labelledby="section-${applicationId}-${key}"]`);
  const sectionNav = () =>
    page.getByRole("navigation", { name: "Proposal sections", exact: true });
  async function openProposal({ reload = true } = {}) {
    // The preceding fixture journey deliberately leaves an unsaved buffer.
    const acceptReload = (dialog) => dialog.accept();
    page.on("dialog", acceptReload);
    try {
      if (reload) await page.reload();
      await expect(
        page.getByLabel("Current project", { exact: true }),
      ).toBeVisible();
      await page
        .getByLabel("Current project", { exact: true })
        .selectOption(project.id);
      await page
        .getByRole("navigation", { name: "Workspace steps", exact: true })
        .getByRole("button", { name: /Draft & readiness/ })
        .click();
      await page
        .getByLabel("Application", { exact: true })
        .selectOption(applicationId);
    } finally {
      page.off("dialog", acceptReload);
    }
  }
  await openProposal();

  // Adoption and applicability are real user decisions; preview cannot change state.
  const beforeAdoption = await state();
  await page
    .getByLabel("Proposal template", { exact: true })
    .selectOption("nsf-standard-research");
  await expect(
    page.getByRole("heading", { name: "Adoption preview", exact: true }),
  ).toBeVisible();
  assert.deepEqual(
    await state(),
    beforeAdoption,
    "Adoption preview must not mutate saved data.",
  );
  const adopted = await saveClick(
    page.getByRole("button", {
      name: "Adopt this template and retain history",
      exact: true,
    }),
  );
  let app = adopted.state.applications.find(
    (item) => item.id === applicationId,
  );
  assert.equal(app.sections.length, 14);
  assert.ok(
    app.archivedSections.length >= 3,
    "Legacy histories must remain archived.",
  );
  const manifest = app.binding.manifest;
  for (const question of manifest.questions) {
    const answer = [
      "supports-graduate-students",
      "has-prior-nsf-support",
    ].includes(question.id)
      ? "yes"
      : "no";
    await page
      .getByLabel(question.prompt, { exact: true })
      .selectOption(answer);
  }
  await page
    .getByLabel("Researcher confirming applicability and mapping", {
      exact: true,
    })
    .fill("Acceptance researcher");
  await page
    .getByLabel("Confirmation note", { exact: true })
    .fill(
      "Reviewed the synthetic call, complete requirements, official source metadata and supported single-organization scope.",
    );
  await page
    .getByLabel(
      /I reviewed the call, applicability answers, mapping and supported/,
    )
    .check();
  const confirmed = await saveClick(
    page.getByRole("button", {
      name: "Confirm applicability and call mapping",
      exact: true,
    }),
  );
  app = confirmed.state.applications.find((item) => item.id === applicationId);
  assert.ok(app.binding.confirmedAt);
  assert.equal(app.binding.confirmedBy, "Acceptance researcher");
  await expect(sectionNav().getByRole("button")).toHaveCount(14);
  for (let index = 0; index < app.sections.length; index++) {
    await sectionNav().getByRole("button").nth(index).click();
    await expect(
      editor(app.sections[index].key).getByRole("heading", {
        name: app.sections[index].label,
        exact: true,
      }),
    ).toBeVisible();
  }

  // Exercise ordinary paragraph/heading/list/table controls, never a JSON editor.
  await sectionNav().getByRole("button").nth(0).click();
  const overview = editor("summary-overview");
  const overviewText =
    "The proposed study compares sensor readings with laboratory reference measurements. No pilot measurements have been collected.";
  await overview
    .getByLabel("Paragraph text 1", { exact: true })
    .fill(overviewText);
  for (const type of ["heading", "list", "table"]) {
    await overview
      .getByLabel("Content to add", { exact: true })
      .selectOption(type);
    await overview
      .getByRole("button", { name: "Add content block", exact: true })
      .click();
  }
  await overview
    .getByLabel("Heading text 2", { exact: true })
    .fill("Evaluation milestones");
  await overview
    .getByLabel("List items 3", { exact: true })
    .fill("Collect paired samples\nAssess measurement uncertainty");
  await overview
    .getByLabel("List style 3", { exact: true })
    .selectOption("numbered");
  await overview
    .getByLabel("Table 4 column 1 heading", { exact: true })
    .fill("Milestone");
  await overview
    .getByLabel("Table 4 column 2 heading", { exact: true })
    .fill("Month");
  await overview
    .getByLabel("Table 4 row 1 column 1", { exact: true })
    .fill("Pilot comparison");
  await overview
    .getByLabel("Table 4 row 1 column 2", { exact: true })
    .fill("3");
  await overview.getByRole("button", { name: "Add row", exact: true }).click();
  await overview
    .getByLabel("Table 4 row 2 column 1", { exact: true })
    .fill("Evaluation");
  await overview
    .getByLabel("Table 4 row 2 column 2", { exact: true })
    .fill("9");
  await overview
    .locator("summary")
    .filter({ hasText: /^Evidence selection and exact quotations/ })
    .click();
  await overview
    .getByLabel("Quotation source", { exact: true })
    .selectOption(evidence.id);
  const quotation = evidence.versions
    .at(-1)
    .text.includes("No pilot measurements have been collected.")
    ? "No pilot measurements have been collected."
    : evidence.versions.at(-1).text.slice(0, 60);
  await overview.getByLabel("Exact quotation", { exact: true }).fill(quotation);
  await overview
    .getByRole("button", { name: "Attach exact quotation", exact: true })
    .click();
  let saved = await saveClick(
    overview.getByRole("button", {
      name: "Save section revision",
      exact: true,
    }),
  );
  const table = saved.state.applications
    .find((item) => item.id === applicationId)
    .sections[0].revisions.at(-1)
    .blocks.find((block) => block.type === "table");
  assert.deepEqual(table.rows, [
    ["Pilot comparison", "3"],
    ["Evaluation", "9"],
  ]);

  // Section navigation and another section's save must preserve this buffer.
  const buffer =
    overviewText +
    " Unsaved overview buffer survives section switching and conflicts.";
  await overview.getByLabel("Paragraph text 1", { exact: true }).fill(buffer);
  await sectionNav().getByRole("button").nth(1).click();
  const merit = editor("summary-intellectual-merit");
  await merit
    .getByLabel("Paragraph text 1", { exact: true })
    .fill(
      "The proposed evaluation examines paired measurement uncertainty; conclusions remain prospective.",
    );
  await saveClick(
    merit.getByRole("button", { name: "Save section revision", exact: true }),
  );
  await sectionNav().getByRole("button").nth(0).click();
  await expect(
    overview.getByLabel("Paragraph text 1", { exact: true }),
  ).toHaveValue(buffer);
  await expect(
    page.getByRole("button", {
      name: "Freeze saved inputs and generate packet",
      exact: true,
    }),
  ).toBeDisabled();
  const concurrent = await state();
  const concurrentSection = concurrent.applications
    .find((item) => item.id === applicationId)
    .sections.find((section) => section.key === "summary-overview");
  const current = concurrentSection.revisions.at(-1);
  const competingBlocks = current.blocks.map((block, index) =>
    index === 0
      ? { type: "paragraph", text: "Competing saved overview revision." }
      : block,
  );
  await command({
    type: "saveDraft",
    applicationId,
    sectionKey: concurrentSection.key,
    label: concurrentSection.label,
    wordLimit: concurrentSection.wordLimit,
    text: visibleText(competingBlocks),
    blocks: competingBlocks,
    sourceIds: current.selectedSources.map((source) => source.sourceId),
    citations: current.citations,
  });
  await saveClick(
    overview.getByRole("button", {
      name: "Save section revision",
      exact: true,
    }),
    409,
  );
  await expect(
    overview.getByLabel("Paragraph text 1", { exact: true }),
  ).toHaveValue(buffer);
  await page
    .getByRole("button", {
      name: "Use latest save revision (keep editor text)",
      exact: true,
    })
    .click();
  await expect(
    overview.getByLabel("Paragraph text 1", { exact: true }),
  ).toHaveValue(buffer);
  saved = await saveClick(
    overview.getByRole("button", {
      name: "Save section revision",
      exact: true,
    }),
  );
  await overview
    .getByLabel("Researcher reviewing this saved revision", { exact: true })
    .fill("Acceptance researcher");
  const reviewed = await saveClick(
    overview.getByRole("button", {
      name: "Mark saved revision reviewed",
      exact: true,
    }),
  );
  const reviewedSection = reviewed.state.applications.find(
    (item) => item.id === applicationId,
  ).sections[0];
  assert.ok(
    reviewedSection.reviews.some(
      (review) => review.revisionId === reviewedSection.revisions.at(-1).id,
    ),
  );
  assert.deepEqual(
    reviewedSection.revisions
      .at(-1)
      .blocks.find((block) => block.type === "table"),
    table,
  );

  // Save, approve and context-confirm one exact version, then insert it elsewhere.
  const libraryTitle = "Acceptance paired-measurement overview";
  await overview
    .locator("summary")
    .filter({ hasText: "Save approved reusable content from this section" })
    .click();
  await overview
    .getByLabel("Reusable content title", { exact: true })
    .fill(libraryTitle);
  await overview
    .getByLabel("Reusable content category", { exact: true })
    .selectOption("methods");
  await overview
    .getByLabel("Approved scope of reuse", { exact: true })
    .fill(
      "Synthetic acceptance content only. Recheck study-specific facts, dates and sponsor requirements.",
    );
  const createdItem = await saveClick(
    overview.getByRole("button", {
      name: "Save library version for approval",
      exact: true,
    }),
  );
  const itemId = createdItem.selectedId;
  const library = page
    .locator("section.card")
    .filter({
      has: page.getByRole("heading", {
        name: "Approved, versioned content library",
        exact: true,
      }),
    });
  const itemDetails = library
    .locator("details")
    .filter({
      has: page.getByRole("heading", { name: libraryTitle, exact: true }),
    })
    .first();
  await itemDetails.locator(":scope > summary").click();
  await itemDetails
    .getByLabel(`Researcher approving ${libraryTitle} v1`, { exact: true })
    .fill("Acceptance researcher");
  const approved = await saveClick(
    itemDetails.getByRole("button", {
      name: "Approve this exact version",
      exact: true,
    }),
  );
  assert.ok(
    approved.state.contentLibrary.find((item) => item.id === itemId).versions[0]
      .approvedAt,
  );
  await library
    .getByLabel("Destination section for library insertion", { exact: true })
    .selectOption("description-methods");
  await itemDetails
    .getByLabel(`Context decision for ${libraryTitle}`, { exact: true })
    .fill(
      "Reviewed this version against the synthetic methods section; all content is prospective and carries its original evidence.",
    );
  await itemDetails
    .getByLabel(
      /I reviewed this exact version and its evidence for the destination context/,
    )
    .check();
  const inserted = await saveClick(
    itemDetails.getByRole("button", {
      name: "Insert approved version into selected section",
      exact: true,
    }),
  );
  const methods = inserted.state.applications
    .find((item) => item.id === applicationId)
    .sections.find((section) => section.key === "description-methods");
  assert.ok(
    methods.revisions
      .at(-1)
      .reusedContent.some(
        (reference) => reference.itemId === itemId && reference.revision === 1,
      ),
  );
  assert.ok(
    methods.revisions.at(-1).blocks.some((block) => block.type === "table"),
  );
  assert.ok(
    !methods.reviews.some(
      (review) => review.revisionId === methods.revisions.at(-1).id,
    ),
    "Insertion requires a new review.",
  );

  // Record an actual incomplete external task; draft text cannot clear it.
  const task =
    manifest.externalTasks.find((item) => /dmsp/i.test(item.id + item.label)) ??
    manifest.externalTasks[0];
  const taskCard = page
    .locator("article.criterion")
    .filter({
      has: page.getByRole("heading", { name: task.label, exact: true }),
    });
  await taskCard
    .getByLabel(`Status of ${task.label}`, { exact: true })
    .selectOption("In progress");
  await taskCard
    .getByLabel(`Researcher recording ${task.label}`, { exact: true })
    .fill("Acceptance researcher");
  await taskCard
    .getByLabel(`External action note for ${task.label}`, { exact: true })
    .fill(
      "Portal completion remains outstanding; the local preparation worksheet is not the external action.",
    );
  await saveClick(
    taskCard.getByRole("button", {
      name: "Record researcher task status",
      exact: true,
    }),
  );

  // Populate remaining sections with explicit test material through the same API.
  let populated = await state();
  app = populated.applications.find((item) => item.id === applicationId);
  for (const section of app.sections) {
    if (
      ![
        "summary-overview",
        "summary-intellectual-merit",
        "description-methods",
      ].includes(section.key)
    ) {
      const text = `${section.label}. Proposed synthetic acceptance activity; study-specific facts and approvals still require researcher confirmation.`;
      await command({
        type: "saveDraft",
        applicationId,
        sectionKey: section.key,
        label: section.label,
        wordLimit: section.wordLimit,
        text,
        blocks: [{ type: "paragraph", text }],
        sourceIds: [evidence.id],
        citations: [],
      });
    }
    const fresh = (await state()).applications
      .find((item) => item.id === applicationId)
      .sections.find((item) => item.key === section.key);
    if (
      !fresh.reviews.some(
        (review) => review.revisionId === fresh.revisions.at(-1).id,
      )
    )
      await command({
        type: "reviewSection",
        applicationId,
        sectionKey: fresh.key,
        revisionId: fresh.revisions.at(-1).id,
        by: "Acceptance researcher (API fixture setup)",
      });
  }
  await openProposal();
  await expect(
    editor("summary-overview").getByLabel("Paragraph text 1", { exact: true }),
  ).toHaveValue(buffer);
  await expect(
    editor("summary-overview").getByLabel("Table 4 row 2 column 2", {
      exact: true,
    }),
  ).toHaveValue("9");

  const freezing = mutationResponse();
  const starting = page.waitForResponse(
    (response) =>
      response.url() === origin + "/api/proposal-exports" &&
      response.request().method() === "POST",
  );
  await page
    .getByRole("button", {
      name: "Freeze saved inputs and generate packet",
      exact: true,
    })
    .click();
  const freezeResponse = await freezing;
  assert.equal(freezeResponse.status(), 200, await freezeResponse.text());
  const frozen = await freezeResponse.json();
  const startResponse = await starting;
  assert.ok(
    [200, 202].includes(startResponse.status()),
    await startResponse.text(),
  );
  const started = await startResponse.json();
  const snapshot = frozen.state.packetSnapshots.find(
    (item) => item.id === frozen.selectedId,
  );
  assert.ok(snapshot);
  const frozenBytes = JSON.stringify(snapshot);
  assert.match(snapshot.digest, /^[a-f0-9]{64}$/);
  let metadata;
  await expect
    .poll(
      async () => {
        const response = await request.get(
          `${origin}/api/proposal-exports/${encodeURIComponent(started.exportId)}`,
        );
        assert.equal(response.status(), 200, await response.text());
        metadata = await response.json();
        return ["succeeded", "failed"].includes(metadata.export.status);
      },
      {
        timeout: 180_000,
        intervals: [300, 700, 1500, 2500],
        message:
          "Frozen export reaches a terminal state and retains review artifacts.",
      },
    )
    .toBe(true);
  const job = metadata.export;
  for (const component of manifest.components)
    assert.ok(
      job.artifacts.some(
        (artifact) =>
          artifact.componentId === component.id && artifact.format === "docx",
      ),
      `Editable DOCX preserved for ${component.id}; ${job.errors.join("; ")}`,
    );
  const manifestArtifact = job.artifacts.find(
    (artifact) =>
      artifact.componentId === "internal-manifest" &&
      artifact.format === "json",
  );
  const docxArtifact = job.artifacts.find(
    (artifact) =>
      artifact.componentId === "project-summary" && artifact.format === "docx",
  );
  assert.ok(manifestArtifact && docxArtifact);
  assert.ok(
    job.artifacts.some(
      (artifact) =>
        artifact.componentId === "internal-review-report" &&
        artifact.format === "md",
    ),
  );
  if (job.status === "failed") {
    assert.ok(job.errors.length, "Failed rendering remains explicit.");
    assert.ok(
      job.measurements.some(
        (measurement) =>
          measurement.pages === null && measurement.passed === null,
      ),
      "Unavailable rendering leaves page compliance Unknown.",
    );
  }
  async function download(artifact, destination) {
    const downloading = page.waitForEvent("download");
    await page
      .getByRole("link", {
        name: new RegExp(`^Download ${escape(artifact.filename)} ·`),
      })
      .click();
    const file = await downloading;
    await file.saveAs(destination);
    const bytes = await readFile(destination);
    assert.equal(bytes.length, artifact.bytes);
    assert.equal(sha256(bytes), artifact.sha256);
    return bytes;
  }
  const manifestPath = path.join(artifacts, "proposal-browser-manifest.json"),
    docxPath = path.join(artifacts, "proposal-browser-summary.docx");
  const manifestBytes = await download(manifestArtifact, manifestPath);
  const downloadedManifest = JSON.parse(manifestBytes.toString("utf8"));
  assert.equal(downloadedManifest.snapshotId, snapshot.id);
  assert.equal(downloadedManifest.snapshotDigest, snapshot.digest);
  const docxBytes = await download(docxArtifact, docxPath);
  const document = strFromU8(unzipSync(docxBytes)["word/document.xml"]);
  assert.match(document, /<w:tbl>/);
  assert.match(document, /Pilot comparison/);
  assert.match(document, /Evaluation milestones/);
  assert.equal(metadata.currentInputsMatch, true);

  // Saved-source edits must not rewrite a frozen payload or its exported bytes.
  populated = await state();
  evidence = populated.sources.find((source) => source.id === evidence.id);
  await command({
    type: "saveSource",
    id: evidence.id,
    projectId: project.id,
    title: evidence.title,
    sourceType: evidence.type,
    text:
      evidence.versions.at(-1).text +
      "\nAcceptance source version two: interpretation requires a fresh researcher review.",
    url: evidence.url,
  });
  const afterSourceEdit = await state();
  assert.equal(
    JSON.stringify(
      afterSourceEdit.packetSnapshots.find((item) => item.id === snapshot.id),
    ),
    frozenBytes,
  );
  const historical = await request.get(
    `${origin}/api/proposal-exports/${encodeURIComponent(job.id)}`,
  );
  assert.equal((await historical.json()).currentInputsMatch, false);
  const retained = await request.get(
    `${origin}/api/proposal-exports/${encodeURIComponent(job.id)}/${encodeURIComponent(manifestArtifact.id)}`,
  );
  assert.equal(retained.status(), 200);
  assert.equal(sha256(await retained.body()), manifestArtifact.sha256);
  await openProposal();
  await expect(
    editor("summary-overview").getByLabel("Paragraph text 1", { exact: true }),
  ).toHaveValue(buffer);
  await expect(
    page.getByText(/Original supporting evidence changed/),
  ).toBeVisible();
  const persisted = await state();
  assert.equal(
    JSON.stringify(
      persisted.packetSnapshots.find((item) => item.id === snapshot.id),
    ),
    frozenBytes,
  );
  assert.equal(
    persisted.contentLibrary.find((item) => item.id === itemId).versions[0]
      .approvedBy,
    "Acceptance researcher",
  );
  await page.screenshot({
    path: path.join(artifacts, "proposal-browser-desktop.png"),
    fullPage: true,
  });
  const result = {
    passed: true,
    applicationId,
    itemId,
    snapshotId: snapshot.id,
    exportId: job.id,
    exportStatus: job.status,
    rendererErrors: job.errors,
    artifacts: { manifest: manifestPath, docx: docxPath },
    checks: [
      "nonmutating adoption preview",
      "all 14 sections reachable",
      "paragraph heading list table controls",
      "exact citations",
      "independent unsaved section buffers",
      "409 recovery keeps buffers",
      "saved revision review",
      "exact library approval and context-confirmed insertion",
      "external completion stays explicit",
      "frozen export polling",
      "verified manifest and DOCX downloads",
      "structured table in DOCX",
      "frozen input immutability after source edits",
      "reload persistence",
    ],
  };
  await writeFile(
    path.join(artifacts, "proposal-browser-result.json"),
    JSON.stringify(result, null, 2),
  );
  return result;
}
