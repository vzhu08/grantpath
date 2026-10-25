import { afterEach, describe, expect, it } from "vitest";
import { mkdtemp, mkdir, readFile, writeFile, rm } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { PDFDocument, StandardFonts } from "pdf-lib";
import { unzipSync, strFromU8 } from "fflate";
import { createRepository } from "../../lib/repository";
import { createApplication } from "../../lib/fixtures";
import { PacketPayloadSchema, type PacketSnapshot } from "../../lib/schema";
import {
  NSF_STANDARD_RESEARCH_TEMPLATE,
  TemplateManifestSchema,
  type ApplicabilityAnswers,
} from "../../lib/proposals/nsf-template";
import {
  assertExportRequest,
  createProposalExportService,
  snapshotComponents,
  nestedPageSpan,
} from "../../lib/proposals/export-service";
import { canonicalStringify, sha256 } from "../../lib/proposals/workflow";
import {
  createProposalDocx,
  RENDER_PROFILE,
  type RenderResult,
} from "../../lib/proposals/rendering";
import type { ProposalDocument } from "../../lib/proposals/blocks";

const directories: string[] = [];
afterEach(async () => {
  await Promise.all(
    directories
      .splice(0)
      .map((directory) => rm(directory, { recursive: true, force: true })),
  );
});
const answers: ApplicabilityAnswers = {
  "supports-graduate-students": "no",
  "supports-postdoctoral-scholars": "no",
  "has-prior-nsf-support": "yes",
  "has-subawards": "no",
  "multiple-submitting-organizations": "no",
  "special-proposal-type": "no",
  "call-deviations": "no",
};
const identity = {
  profile: RENDER_PROFILE,
  libreOffice: "LibreOffice fixture 1",
  fonts: [{ name: "times.ttf", sha256: "a".repeat(64) }],
};
async function fixture() {
  const directory = await mkdtemp(
    path.join(os.tmpdir(), "grantpath-export-test-"),
  );
  directories.push(directory);
  const repo = createRepository(directory);
  const state = await repo.read();
  await repo.internal((current) => {
    const app = createApplication(
      current.projects[0]!,
      current.opportunities[0]!,
      current,
      "export-app",
    );
    app.binding = {
      ...app.binding!,
      templateId: "nsf-standard-research",
      manifest: TemplateManifestSchema.parse(NSF_STANDARD_RESEARCH_TEMPLATE),
      answers,
      confirmedAt: new Date().toISOString(),
      confirmedBy: "Researcher",
      confirmationNote: "Reviewed fixture scope",
    };
    app.sections = NSF_STANDARD_RESEARCH_TEMPLATE.sections
      .filter((section) => section.kind === "content")
      .map((section) => ({
        key: section.id,
        label: section.heading,
        wordLimit: null,
        revisions: [
          {
            id: "draft-" + section.id,
            text: "Saved " + section.id,
            blocks: [{ type: "paragraph", text: "Saved " + section.id }],
            representationVersion: 1,
            bindingRevision: 1,
            citations: [],
            selectedSources: [],
            projectRevision: 1,
            callRevision: 1,
            callSourceVersion: 1,
            missingInputs: [],
            mode: "manual",
            promptVersion: "test",
            createdAt: new Date().toISOString(),
          },
        ],
      }));
    current.applications.push(app);
  }, state.revision);
  const saved = await repo.read();
  const frozen = await repo.mutate({
    expectedRevision: saved.revision,
    command: { type: "freezePacket", applicationId: "export-app" },
  });
  const snapshot = frozen.state.packetSnapshots.at(-1)!;
  return { directory, repo, snapshot, state: frozen.state };
}
async function fakeRenderer(
  directory: string,
  options: {
    fail?: boolean;
    pages?: number;
    hold?: (signal: AbortSignal) => Promise<void>;
  } = {},
) {
  let active = 0,
    maxActive = 0,
    calls = 0;
  const render = async (
    document: ProposalDocument,
    input: { pageLimit?: number; signal: AbortSignal },
  ): Promise<RenderResult> => {
    active++;
    maxActive = Math.max(maxActive, active);
    calls++;
    try {
      await options.hold?.(input.signal);
      const job = path.join(directory, "renderer-" + calls);
      await mkdir(job, { recursive: true });
      const bytes = await createProposalDocx(document);
      const docxPath = path.join(job, "exact.docx");
      await writeFile(docxPath, bytes);
      const pdf = await PDFDocument.create();
      for (let i = 0; i < (options.pages ?? 1); i++) pdf.addPage([612, 792]);
      const pdfBytes = await pdf.save(),
        pdfPath = path.join(job, "exact.pdf");
      await writeFile(pdfPath, pdfBytes);
      return {
        status: options.fail || input.signal.aborted ? "failed" : "succeeded",
        jobId: path.basename(job),
        directory: job,
        docxPath,
        pdfPath: options.fail || input.signal.aborted ? null : pdfPath,
        pages:
          options.fail || input.signal.aborted ? null : (options.pages ?? 1),
        pageLimit: input.pageLimit ?? null,
        withinPageLimit: input.pageLimit
          ? (options.pages ?? 1) <= input.pageLimit
          : null,
        docxSha256: sha256(bytes),
        pdfSha256: options.fail ? null : sha256(pdfBytes),
        inputSha256: sha256(JSON.stringify(document)),
        renderer: identity,
        pdfFonts: ["TimesNewRomanPSMT"],
        error: options.fail
          ? "Fixture conversion failed; measurement Unknown."
          : null,
      };
    } finally {
      active--;
    }
  };
  return {
    render,
    get calls() {
      return calls;
    },
    get maxActive() {
      return maxActive;
    },
  };
}
function xml(bytes: Uint8Array) {
  return strFromU8(unzipSync(bytes)["word/document.xml"]!);
}

describe("frozen proposal exports", () => {
  it("groups sponsor components and keeps excluded conditional content out of the narrative", async () => {
    const { snapshot } = await fixture();
    const plans = snapshotComponents(snapshot);
    expect(
      plans
        .find((component) => component.id === "project-summary")!
        .document.blocks.filter((block) => block.type === "heading")
        .map((block) => block.text),
    ).toEqual(["Overview", "Intellectual Merit", "Broader Impacts"]);
    const description = plans.find(
      (component) => component.id === "project-description",
    )!;
    expect(description.pageLimit).toBe(15);
    expect(description.nestedLimits).toEqual([
      {
        id: "prior-support",
        pages: 5,
        heading: "Results from Prior NSF Support",
      },
    ]);
    expect(plans.some((component) => component.id === "mentoring")).toBe(false);
    expect(
      plans
        .find((component) => component.id === "dmsp-worksheet")!
        .warnings.join(" "),
    ).toContain("official Research.gov");
    expect(
      description.document.blocks.some(
        (block) =>
          block.type === "paragraph" &&
          block.text.includes("internal-manifest"),
      ),
    ).toBe(false);
    snapshot.payload.application.sections.find(
      (section) => section.key === "description-evaluation",
    )!.revisions = [];
    const withoutOptional = snapshotComponents(snapshot).find(
      (component) => component.id === "project-description",
    )!;
    expect(
      withoutOptional.warnings.some((warning) =>
        warning.includes("Evaluation and Timeline"),
      ),
    ).toBe(false);
    expect(
      withoutOptional.document.blocks.some(
        (block) =>
          block.type === "heading" && block.text === "Evaluation and Timeline",
      ),
    ).toBe(false);
  });
  it("exports immutable selected revisions, exact bytes, separate reports and genuine aggregate measurements", async () => {
    const { directory, repo, snapshot, state } = await fixture();
    const renderer = await fakeRenderer(directory, { pages: 2 });
    const service = createProposalExportService(repo, {
      identity: async () => identity,
      render: renderer.render,
    });
    const queued = await service.request({
      snapshotId: snapshot.id,
      expectedRevision: state.revision,
    });
    await repo.internal((current) => {
      const draft = current.applications[0]!.sections[0]!.revisions.at(-1)!;
      current.applications[0]!.sections[0]!.revisions.push({
        ...draft,
        id: "new-live-draft",
        text: "NEW LIVE CONTENT",
        blocks: [{ type: "paragraph", text: "NEW LIVE CONTENT" }],
      });
    });
    await service.idle();
    const status = await service.status(queued.exportId),
      job = status.export;
    expect(job.status).toBe("succeeded");
    expect(status.currentInputsMatch).toBe(false);
    expect(status.currentRendererMatch).toBe(true);
    const summary = job.artifacts.find(
      (artifact) =>
        artifact.componentId === "project-summary" &&
        artifact.format === "docx",
    )!;
    const downloaded = await service.download(job.id, summary.id);
    expect(xml(downloaded.bytes)).toContain("Saved summary-overview");
    expect(xml(downloaded.bytes)).not.toContain("NEW LIVE CONTENT");
    expect(xml(downloaded.bytes)).not.toContain("Internal review report");
    const exact = await readFile(
      path.join(directory, "renderer-1", "exact.docx"),
    );
    expect(downloaded.bytes).toEqual(exact);
    expect(
      job.measurements.find(
        (measurement) => measurement.componentId === "project-summary",
      ),
    ).toMatchObject({ pages: 2, limit: 1, passed: false });
    expect(
      job.measurements.find(
        (measurement) => measurement.componentId === "prior-support",
      ),
    ).toMatchObject({ pages: null, limit: 5, passed: null });
    expect(job.artifacts).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          componentId: "packet-snapshot",
          format: "json",
        }),
        expect.objectContaining({
          componentId: "internal-review-report",
          format: "pdf",
        }),
        expect.objectContaining({
          componentId: "internal-manifest",
          format: "json",
        }),
      ]),
    );
    const frozenArtifact = job.artifacts.find(
      (artifact) => artifact.componentId === "packet-snapshot",
    )!;
    expect(
      JSON.parse(
        (await service.download(job.id, frozenArtifact.id)).bytes.toString(),
      ).digest,
    ).toBe(snapshot.digest);
    const report = job.artifacts.find(
      (artifact) =>
        artifact.componentId === "internal-review-report" &&
        artifact.format === "md",
    )!;
    expect(
      (await service.download(job.id, report.id)).bytes.toString(),
    ).toContain("EXCEEDS page limit");
    expect(renderer.maxActive).toBe(1);
    const again = await service.request({
      snapshotId: snapshot.id,
      expectedRevision: 0,
    });
    expect(again.exportId).toBe(job.id);
    expect((await repo.read()).proposalExports).toHaveLength(1);
  }, 20_000);
  it("preserves DOCX, snapshot and review metadata after conversion failure and retries immutably", async () => {
    const { directory, repo, snapshot, state } = await fixture();
    const renderer = await fakeRenderer(directory, { fail: true });
    const service = createProposalExportService(repo, {
      identity: async () => identity,
      render: renderer.render,
    });
    const first = await service.request({
      snapshotId: snapshot.id,
      expectedRevision: state.revision,
    });
    await service.idle();
    const failed = (await service.status(first.exportId)).export;
    expect(failed.status).toBe("failed");
    expect(failed.artifacts.some((artifact) => artifact.format === "pdf")).toBe(
      false,
    );
    expect(
      failed.artifacts.some(
        (artifact) =>
          artifact.componentId === "project-description" &&
          artifact.format === "docx",
      ),
    ).toBe(true);
    expect(
      failed.artifacts.some(
        (artifact) => artifact.componentId === "packet-snapshot",
      ),
    ).toBe(true);
    expect(
      failed.artifacts.some(
        (artifact) => artifact.componentId === "internal-manifest",
      ),
    ).toBe(true);
    expect(
      failed.measurements.every(
        (measurement) =>
          measurement.pages === null && measurement.passed === null,
      ),
    ).toBe(true);
    expect(
      (await service.request({ snapshotId: snapshot.id, expectedRevision: 0 }))
        .exportId,
    ).toBe(first.exportId);
    const retry = await service.request({
      snapshotId: snapshot.id,
      expectedRevision: (await repo.read()).revision,
      retry: true,
    });
    expect(retry.exportId).not.toBe(first.exportId);
    await service.idle();
    expect((await service.status(first.exportId)).export).toEqual(failed);
  }, 20_000);
  it("keeps a DOCX when renderer configuration throws before packing", async () => {
    const { repo, snapshot, state } = await fixture();
    const service = createProposalExportService(repo, {
      identity: async () => {
        throw new Error("No LibreOffice");
      },
      render: async () => {
        throw new Error("No LibreOffice");
      },
    });
    const request = await service.request({
      snapshotId: snapshot.id,
      expectedRevision: state.revision,
    });
    await service.idle();
    const result = await service.status(request.exportId);
    expect(result.export.status).toBe("failed");
    expect(result.currentRendererMatch).toBe(false);
    expect(
      result.export.artifacts.filter((artifact) => artifact.format === "docx")
        .length,
    ).toBeGreaterThan(1);
    expect(
      result.export.measurements.every(
        (measurement) => measurement.pages === null,
      ),
    ).toBe(true);
  }, 20_000);
  it("rejects traversal and verifies artifact size and hash on every download", async () => {
    const { directory, repo, snapshot, state } = await fixture();
    const renderer = await fakeRenderer(directory);
    const service = createProposalExportService(repo, {
      identity: async () => identity,
      render: renderer.render,
    });
    const request = await service.request({
      snapshotId: snapshot.id,
      expectedRevision: state.revision,
    });
    await service.idle();
    await expect(
      service.download("../workspace", "artifact"),
    ).rejects.toMatchObject({ code: "EXPORT_ID" });
    await expect(service.status("%2f..")).rejects.toMatchObject({
      code: "EXPORT_ID",
    });
    const artifact = (await service.status(request.exportId)).export
      .artifacts[0]!;
    await expect(
      service.download(request.exportId, "../workspace"),
    ).rejects.toMatchObject({ code: "EXPORT_ID" });
    await writeFile(
      path.join(
        directory,
        "proposal-exports",
        request.exportId,
        artifact.id + "." + artifact.format,
      ),
      Buffer.alloc(artifact.bytes, 65),
    );
    await expect(
      service.download(request.exportId, artifact.id),
    ).rejects.toMatchObject({ code: "ARTIFACT_INTEGRITY" });
    await expect(
      service.download(request.exportId, "wrong-project-artifact"),
    ).rejects.toMatchObject({ code: "ARTIFACT_NOT_FOUND" });
  }, 20_000);
  it("recovers interrupted persisted work without silently resuming it", async () => {
    const { repo, snapshot } = await fixture();
    await repo.internal((current) => {
      current.proposalExports.push({
        id: "interrupted",
        snapshotId: snapshot.id,
        jobKey: "old",
        status: "running",
        createdAt: "before",
        finishedAt: null,
        artifacts: [],
        measurements: [],
        errors: [],
        renderer: canonicalStringify(identity),
      });
    });
    const service = createProposalExportService(repo, {
      identity: async () => identity,
    });
    await service.idle();
    const record = (await service.status("interrupted")).export;
    expect(record.status).toBe("failed");
    expect(record.errors.join(" ")).toContain("server restart");
  });
  it("serializes exports, permits cancellation and preserves prior artifacts", async () => {
    const { directory, repo, snapshot, state } = await fixture();
    let unblock!: () => void;
    const started = new Promise<void>((resolve) => {
      unblock = resolve;
    });
    const renderer = await fakeRenderer(directory, {
      hold: async (signal) => {
        unblock();
        if (signal.aborted) return;
        await new Promise<void>((resolve) => {
          signal.addEventListener("abort", () => resolve(), { once: true });
        });
      },
    });
    const service = createProposalExportService(repo, {
      identity: async () => identity,
      render: renderer.render,
    });
    const first = await service.request({
      snapshotId: snapshot.id,
      expectedRevision: state.revision,
    });
    await started;
    await service.cancel(first.exportId, (await repo.read()).revision);
    await service.idle();
    const result = (await service.status(first.exportId)).export;
    expect(result.status).toBe("failed");
    expect(result.errors.join(" ")).toContain("cancelled");
    expect(
      result.artifacts.some(
        (artifact) => artifact.componentId === "packet-snapshot",
      ),
    ).toBe(true);
    expect(
      result.artifacts.some((artifact) => artifact.format === "docx"),
    ).toBe(true);
    expect(renderer.maxActive).toBe(1);
  }, 20_000);
  it("rejects snapshot project mismatches and enforces file bounds", async () => {
    const { repo, snapshot, state } = await fixture();
    const broken: PacketSnapshot = structuredClone(snapshot);
    broken.payload.application.projectId = "other-project";
    broken.digest = sha256(
      canonicalStringify(PacketPayloadSchema.parse(broken.payload)),
    );
    const directRepo = {
      ...repo,
      read: async () => ({ ...state, packetSnapshots: [broken] }),
    };
    const guarded = createProposalExportService(directRepo, {
      identity: async () => identity,
    });
    await expect(
      guarded.request({
        snapshotId: snapshot.id,
        expectedRevision: state.revision,
      }),
    ).rejects.toMatchObject({ code: "SNAPSHOT_SCOPE" });
    const bounded = createProposalExportService(repo, {
      identity: async () => identity,
      maxArtifactBytes: 10,
    });
    const first = await bounded.request({
      snapshotId: snapshot.id,
      expectedRevision: (await repo.read()).revision,
    });
    await bounded.idle();
    expect(
      (await bounded.status(first.exportId)).export.errors.join(" "),
    ).toContain("size bound");
  });
});
describe("local export request boundary", () => {
  it("rejects cross-site requests, hostile hosts and mutation origins", () => {
    expect(() =>
      assertExportRequest(
        new Request("http://localhost:3000/api/proposal-exports", {
          headers: { "sec-fetch-site": "cross-site" },
        }),
      ),
    ).toThrow("same local");
    expect(() =>
      assertExportRequest(
        new Request("http://localhost:3000/api/proposal-exports", {
          headers: { host: "hostile.example" },
        }),
      ),
    ).toThrow("loopback");
    expect(() =>
      assertExportRequest(
        new Request("http://localhost:3000/api/proposal-exports", {
          method: "POST",
          headers: {
            origin: "http://evil.example",
            "content-type": "application/json",
          },
        }),
        true,
      ),
    ).toThrow("same local");
    expect(() =>
      assertExportRequest(
        new Request("http://localhost:3000/api/proposal-exports", {
          method: "POST",
          headers: {
            origin: "http://localhost:3000",
            "content-type": "text/plain",
          },
        }),
        true,
      ),
    ).toThrow("application/json");
    expect(() =>
      assertExportRequest(
        new Request("http://localhost:3000/api/proposal-exports", {
          method: "POST",
          headers: {
            origin: "http://localhost:3000",
            "content-type": "application/json",
            "sec-fetch-site": "same-origin",
          },
        }),
        true,
      ),
    ).not.toThrow();
  });
});
describe("exact nested PDF page spans", () => {
  it("measures unique ordered anchors on actual PDF pages and rejects ambiguous or missing anchors", async () => {
    const document: ProposalDocument = {
      blocks: [
        { type: "heading", level: 1, text: "Approach" },
        { type: "paragraph", text: "Method" },
        { type: "heading", level: 1, text: "Results from Prior NSF Support" },
        { type: "paragraph", text: "Actual prior results" },
      ],
    };
    const pdf = await PDFDocument.create(),
      font = await pdf.embedFont(StandardFonts.TimesRoman);
    pdf
      .addPage([612, 792])
      .drawText("Approach\nMethod", {
        x: 72,
        y: 720,
        size: 12,
        font,
        lineHeight: 14,
      });
    pdf
      .addPage([612, 792])
      .drawText("Results from Prior NSF Support\nActual prior results", {
        x: 72,
        y: 720,
        size: 12,
        font,
        lineHeight: 14,
      });
    pdf
      .addPage([612, 792])
      .drawText("More actual results", { x: 72, y: 720, size: 12, font });
    const bytes = await pdf.save();
    expect(
      await nestedPageSpan(bytes, document, "Results from Prior NSF Support"),
    ).toBe(2);
    expect(await nestedPageSpan(bytes, document, "Missing heading")).toBe(null);
    const duplicate: ProposalDocument = {
      blocks: [
        ...document.blocks,
        { type: "heading", level: 1, text: "Results from Prior NSF Support" },
      ],
    };
    expect(
      await nestedPageSpan(bytes, duplicate, "Results from Prior NSF Support"),
    ).toBe(null);
    const subheading: ProposalDocument = {
      blocks: [
        ...document.blocks,
        { type: "heading", level: 2, text: "More actual results" },
      ],
    };
    expect(
      await nestedPageSpan(bytes, subheading, "Results from Prior NSF Support"),
    ).toBe(2);
  });
});
