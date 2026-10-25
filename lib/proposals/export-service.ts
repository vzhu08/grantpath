import { randomUUID } from "node:crypto";
import {
  mkdir,
  readFile,
  writeFile,
  stat,
  lstat,
  realpath,
} from "node:fs/promises";
import path from "node:path";
import { z } from "zod";
import { PDFDocument } from "pdf-lib";
import {
  Id,
  type State,
  type PacketSnapshot,
  type ProposalExport,
} from "../schema";
import { repository, type createRepository } from "../repository";
import { assertLocalRequest } from "../http";
import { KitError } from "../../packages/runtime/src/index";
import { canonicalStringify, sha256 } from "./workflow";
import { exportComponentPlan, resolveTemplate } from "./nsf-template";
import {
  textBlocks,
  ProposalDocumentSchema,
  visibleText,
  type ProposalDocument,
} from "./blocks";
import {
  createProposalDocx,
  rendererIdentity,
  renderProposal,
  RENDER_PROFILE,
  type RenderResult,
} from "./rendering";
import { ingestDocument } from "../../modules/documents/src/server";

type Repository = ReturnType<typeof createRepository>;
type Artifact = ProposalExport["artifacts"][number];
type Measurement = ProposalExport["measurements"][number];
type Identity = Awaited<ReturnType<typeof rendererIdentity>>;
type Component = {
  id: string;
  label: string;
  document: ProposalDocument;
  pageLimit: number | null;
  nestedLimits: { id: string; pages: number; heading: string }[];
  boundaryHeadings?: string[];
  warnings: string[];
};
type Adapters = {
  identity?: () => Promise<Identity>;
  render?: (
    document: ProposalDocument,
    options: { pageLimit?: number; signal: AbortSignal },
  ) => Promise<RenderResult>;
  pack?: typeof createProposalDocx;
  maxArtifactBytes?: number;
  jobTimeoutMs?: number;
};
export const ExportRequestSchema = z
  .object({
    snapshotId: Id,
    expectedRevision: z.number().int().nonnegative(),
    retry: z.boolean().optional(),
  })
  .strict();
export const ExportCancellationSchema = z
  .object({ expectedRevision: z.number().int().nonnegative() })
  .strict();
const now = () => new Date().toISOString();
const safeId = (input: unknown) => {
  const value = Id.safeParse(input);
  if (!value.success)
    throw new KitError(
      "EXPORT_ID",
      "Use a valid export or artifact identifier.",
      400,
    );
  return value.data;
};
const fail = (code: string, message: string, status = 422): never => {
  throw new KitError(code, message, status);
};
const message = (error: unknown) =>
  error instanceof KitError
    ? error.message
    : "Export failed. Preserved files remain available; PDF/page measurement is Unknown.";
const filename = (name: string, extension: string) =>
  name.replace(/[^a-zA-Z0-9_-]/g, "-").slice(0, 72) + "." + extension;
const cancelled = () =>
  new KitError(
    "EXPORT_CANCELLED",
    "Export cancelled. Preserved DOCX and snapshot remain available; unfinished page measurements are Unknown.",
    408,
  );
export async function currentProposalRendererIdentity() {
  try {
    return canonicalStringify(await rendererIdentity());
  } catch {
    return canonicalStringify({ profile: RENDER_PROFILE, unavailable: true });
  }
}
/** Exact, conservative PDF span measurement. Ambiguous/missing anchors never pass. */
export async function nestedPageSpan(
  pdf: Uint8Array,
  document: ProposalDocument,
  heading: string,
  signal?: AbortSignal,
  boundaryHeadings?: readonly string[],
) {
  try {
    const extracted = await ingestDocument(
      { filename: "component.pdf", bytes: pdf },
      { maxBytes: 25_000_000, maxPages: 1000, signal },
    );
    const pages = extracted.segments.map((segment) => ({
      page: segment.page,
      text: extracted.text
        .slice(segment.start, segment.end)
        .replace(/\s+/gu, " ")
        .trim(),
    }));
    if (pages.some((page) => !page.page || !page.text)) return null;
    let text = "";
    const ranges = pages.map((page) => {
      const start = text.length;
      text += page.text + " ";
      return { start, end: text.length, page: page.page! };
    });
    // Only sponsor section boundaries may end a span. A researcher subheading inside
    // prior support does not create an extra page allowance or shorten the measured span.
    const anchors = (
      boundaryHeadings ??
      document.blocks.flatMap((block) =>
        block.type === "heading" && block.level === 1 ? [block.text] : [],
      )
    ).map((text) => text.replace(/\s+/gu, " ").trim());
    if (anchors.filter((anchor) => anchor === heading).length !== 1)
      return null;
    const positions = anchors.map((anchor) => {
      const first = text.indexOf(anchor);
      return first < 0 || text.indexOf(anchor, first + anchor.length) >= 0
        ? -1
        : first;
    });
    if (
      positions.some(
        (position, index) =>
          position < 0 || (index > 0 && position <= positions[index - 1]!),
      )
    )
      return null;
    const index = anchors.indexOf(heading);
    if (index < 0) return null;
    const start = positions[index]!,
      end =
        index + 1 < positions.length
          ? positions[index + 1]! - 1
          : text.trimEnd().length - 1;
    const first = ranges.find(
      (range) => range.start <= start && start < range.end,
    )?.page;
    const last = ranges.find(
      (range) => range.start <= end && end < range.end,
    )?.page;
    return first && last && last >= first ? last - first + 1 : null;
  } catch {
    return null;
  }
}
function assertSnapshot(state: State, snapshotId: string) {
  const snapshot =
    state.packetSnapshots.find((item) => item.id === snapshotId) ??
    fail("SNAPSHOT_NOT_FOUND", "The saved packet snapshot was not found.", 404);
  const { application, project, call, sources, library } = snapshot.payload;
  const live = state.applications.find(
    (item) => item.id === snapshot.applicationId,
  );
  if (
    !live ||
    application.id !== snapshot.applicationId ||
    live.projectId !== project.id ||
    live.opportunityId !== call.id ||
    application.projectId !== project.id ||
    application.opportunityId !== call.id ||
    sources.some(
      (source) => source.projectId && source.projectId !== project.id,
    ) ||
    library.some(
      (item) =>
        !application.sections.some((section) =>
          section.revisions
            .at(-1)
            ?.reusedContent?.some((ref) => ref.itemId === item.id),
        ),
    )
  )
    fail(
      "SNAPSHOT_SCOPE",
      "The snapshot does not belong to this saved application and project.",
    );
  if (sha256(canonicalStringify(snapshot.payload)) !== snapshot.digest)
    fail(
      "SNAPSHOT_DIGEST",
      "The frozen snapshot no longer matches its digest.",
    );
  return snapshot;
}
export function assertExportRequest(request: Request, mutation = false) {
  assertLocalRequest(request, mutation);
  if (request.headers.get("sec-fetch-site") === "cross-site")
    fail("FETCH_METADATA", "Open exports from the same local app.", 403);
  const origin = request.headers.get("origin");
  if (origin) {
    const internal = new URL(request.url);
    const actual = new URL(
      internal.protocol + "//" + (request.headers.get("host") ?? internal.host),
    );
    if (origin !== actual.origin)
      fail("ORIGIN", "Open exports from the same local app.", 403);
  }
}
export function snapshotInputsMatch(state: State, snapshot: PacketSnapshot) {
  const frozen = snapshot.payload;
  const app = state.applications.find(
    (item) => item.id === snapshot.applicationId,
  );
  const project = state.projects.find((item) => item.id === frozen.project.id);
  const call = state.opportunities.find((item) => item.id === frozen.call.id);
  return (
    !!app &&
    !!project &&
    !!call &&
    app.projectId === frozen.project.id &&
    app.opportunityId === frozen.call.id &&
    project.revision === frozen.project.revision &&
    call.revision === frozen.call.revision &&
    call.sourceVersion === frozen.call.sourceVersion &&
    canonicalStringify(app.binding ?? null) ===
      canonicalStringify(frozen.application.binding ?? null) &&
    canonicalStringify(
      app.sections.map((section) => [
        section.key,
        section.revisions.at(-1)?.id ?? null,
      ]),
    ) ===
      canonicalStringify(
        frozen.application.sections.map((section) => [
          section.key,
          section.revisions.at(-1)?.id ?? null,
        ]),
      ) &&
    frozen.sources.every((source) => {
      const current = state.sources.find((item) => item.id === source.id);
      return (
        !!current &&
        current.versions.at(-1)?.version === source.versions.at(-1)?.version &&
        current.versions.at(-1)?.hash === source.versions.at(-1)?.hash
      );
    })
  );
}
/** Build narrative trees only from the selected saved snapshot, with no source appendix or cover. */
export function snapshotComponents(snapshot: PacketSnapshot): Component[] {
  const app = snapshot.payload.application;
  const binding = app.binding;
  if (
    !binding ||
    binding.templateId === "legacy-three-section" ||
    !binding.manifest
  )
    return app.sections.map((section) => {
      const draft = section.revisions.at(-1);
      return {
        id: section.key,
        label: section.label,
        document: ProposalDocumentSchema.parse({
          blocks: [
            { type: "heading", level: 1, text: section.label },
            ...(draft?.blocks?.length
              ? draft.blocks
              : textBlocks(draft?.text || "[MISSING: " + section.label + "]")),
          ],
        }),
        pageLimit: null,
        nestedLimits: [],
        warnings: draft?.text.trim()
          ? []
          : ["Missing saved content: " + section.label],
      };
    });
  return exportComponentPlan(binding.manifest, binding.answers)
    .filter((plan) => plan.applicability !== "not-applicable")
    .map((plan) => {
      const blocks: ProposalDocument["blocks"] = [];
      const warnings: string[] = [];
      const nestedLimits: Component["nestedLimits"] = [];
      for (const item of plan.sections) {
        if (item.section.kind !== "content") continue;
        const draft = app.sections
          .find((section) => section.key === item.section.id)
          ?.revisions.at(-1);
        if (item.section.requiredness === "optional" && !draft?.text.trim())
          continue;
        if (item.applicability === "unresolved")
          warnings.push("Unresolved applicability: " + item.section.heading);
        blocks.push({ type: "heading", level: 1, text: item.section.heading });
        if (!draft || !draft.text.trim())
          warnings.push("Missing saved content: " + item.section.heading);
        blocks.push(
          ...(draft?.blocks?.length
            ? draft.blocks
            : textBlocks(
                draft?.text || "[MISSING: " + item.section.heading + "]",
              )),
        );
        if (
          item.section.id !== plan.component.rootSectionId &&
          item.section.limits.pages !== null
        )
          nestedLimits.push({
            id: item.section.id,
            pages: item.section.limits.pages,
            heading: item.section.heading,
          });
      }
      if (plan.component.delivery === "preparation-worksheet")
        warnings.push(
          "Preparation worksheet only. Complete the official Research.gov DMSP separately.",
        );
      const document = ProposalDocumentSchema.parse({ blocks });
      if (
        plan.aggregateLimits.words !== null &&
        visibleText(document).trim().split(/\s+/u).filter(Boolean).length >
          plan.aggregateLimits.words
      )
        warnings.push(
          "The aggregate component word limit is exceeded: " +
            plan.aggregateLimits.words,
        );
      return {
        id: plan.component.id,
        label: plan.component.label,
        document,
        pageLimit: plan.aggregateLimits.pages,
        nestedLimits,
        boundaryHeadings: plan.sections
          .filter(
            (item) =>
              item.section.kind === "content" &&
              (item.section.requiredness !== "optional" ||
                app.sections
                  .find((section) => section.key === item.section.id)
                  ?.revisions.at(-1)
                  ?.text.trim()),
          )
          .map((item) => item.section.heading),
        warnings,
      };
    });
}

export function createProposalExportService(
  repo: Repository,
  adapters: Adapters = {},
) {
  const render = adapters.render ?? renderProposal,
    pack = adapters.pack ?? createProposalDocx;
  const identity = adapters.identity ?? (() => rendererIdentity());
  const maxBytes = adapters.maxArtifactBytes ?? 25_000_000;
  const queue: string[] = [];
  const controllers = new Map<string, AbortController>();
  let worker: Promise<void> | null = null,
    admission: Promise<unknown> = Promise.resolve();
  const ready = (async () => {
    const state = await repo.read();
    if (
      state.proposalExports.some(
        (item) => item.status === "running" || item.status === "queued",
      )
    )
      await repo.internal((latest) => {
        for (const item of latest.proposalExports)
          if (item.status === "running" || item.status === "queued") {
            item.status = "failed";
            item.finishedAt = now();
            item.errors.push(
              "Export interrupted by a server restart. Preserved artifacts are available; retry explicitly.",
            );
          }
      });
  })();
  const serial = <T>(operation: () => Promise<T>) => {
    const result = admission.then(operation, operation);
    admission = result.catch(() => {});
    return result;
  };
  async function rendererKey() {
    try {
      return canonicalStringify(await identity());
    } catch {
      return canonicalStringify({ profile: RENDER_PROFILE, unavailable: true });
    }
  }
  function artifactPath(
    exportId: string,
    artifactId: string,
    format: Artifact["format"],
  ) {
    const root = path.resolve(repo.directory, "proposal-exports");
    const result = path.resolve(
      root,
      safeId(exportId),
      safeId(artifactId) + "." + format,
    );
    if (
      path.relative(root, result).startsWith("..") ||
      path.isAbsolute(path.relative(root, result))
    )
      fail("ARTIFACT_PATH", "Invalid artifact path.", 400);
    return result;
  }
  async function checkedDirectory(exportId: string, create = false) {
    const root = path.resolve(repo.directory, "proposal-exports"),
      directory = path.join(root, safeId(exportId));
    if (create) {
      await mkdir(root, { recursive: true, mode: 0o700 });
      await mkdir(directory, { recursive: true, mode: 0o700 });
    }
    const rootInfo = await lstat(root),
      info = await lstat(directory);
    if (
      !rootInfo.isDirectory() ||
      rootInfo.isSymbolicLink() ||
      !info.isDirectory() ||
      info.isSymbolicLink()
    )
      fail("ARTIFACT_PATH", "The artifact directory failed verification.", 409);
    const actualRoot = await realpath(root),
      actualDirectory = await realpath(directory);
    if (path.dirname(actualDirectory) !== actualRoot)
      fail(
        "ARTIFACT_PATH",
        "The artifact directory escaped its server-owned root.",
        409,
      );
    return actualDirectory;
  }
  async function update(
    exportId: string,
    operation: (item: ProposalExport) => void,
  ) {
    return repo.internal((state) => {
      const item =
        state.proposalExports.find((row) => row.id === exportId) ??
        fail("EXPORT_NOT_FOUND", "The export was not found.", 404);
      operation(item);
    });
  }
  async function save(
    exportId: string,
    componentId: string,
    format: Artifact["format"],
    bytes: Uint8Array | string,
    pages: number | null = null,
  ) {
    const content =
      typeof bytes === "string" ? Buffer.from(bytes, "utf8") : bytes;
    if (content.byteLength > maxBytes)
      fail(
        "ARTIFACT_LIMIT",
        "An export artifact exceeds its file size bound.",
        413,
      );
    const current = (await repo.read()).proposalExports.find(
      (item) => item.id === exportId,
    )!;
    if (
      current.artifacts.reduce((sum, artifact) => sum + artifact.bytes, 0) +
        content.byteLength >
      200_000_000
    )
      fail(
        "PACKET_LIMIT",
        "This export exceeds the 200 MB packet size bound.",
        413,
      );
    const id = "artifact_" + randomUUID(),
      target = artifactPath(exportId, id, format);
    await checkedDirectory(exportId, true);
    await writeFile(target, content, { flag: "wx", mode: 0o600 });
    const artifact: Artifact = {
      id,
      componentId,
      filename: filename(componentId, format),
      format,
      sha256: sha256(content),
      bytes: content.byteLength,
      pages,
    };
    await update(exportId, (item) => {
      item.artifacts.push(artifact);
    });
    return artifact;
  }
  async function boundedRead(target: string) {
    const metadata = await stat(target);
    if (metadata.size > maxBytes || !metadata.isFile())
      fail(
        "ARTIFACT_LIMIT",
        "The renderer artifact is outside its file size bound.",
        413,
      );
    return readFile(target);
  }
  async function renderComponent(
    exportId: string,
    component: Component,
    renderer: string,
    signal: AbortSignal,
  ) {
    let result: RenderResult | null = null;
    let error: string | null = null;
    try {
      result = await render(component.document, {
        pageLimit: component.pageLimit ?? undefined,
        signal,
      });
    } catch (cause) {
      error = message(cause);
    }
    // A missing renderer can throw before packing. Always preserve an editable DOCX.
    const docx = result
      ? await boundedRead(result.docxPath)
      : await pack(component.document);
    if (result && sha256(docx) !== result.docxSha256)
      fail(
        "ARTIFACT_HASH",
        "The exact rendered DOCX hash could not be verified.",
      );
    await save(exportId, component.id, "docx", docx);
    let pages: number | null = null,
      pdfBytes: Uint8Array | null = null;
    if (result?.status === "succeeded" && result.pdfPath && !signal.aborted) {
      if (canonicalStringify(result.renderer) !== renderer)
        error =
          "The renderer/font identity changed during this job; PDF and page measurements are unverified. Retry with the current renderer.";
      else {
        const pdf = await boundedRead(result.pdfPath);
        if (sha256(pdf) !== result.pdfSha256)
          fail("ARTIFACT_HASH", "The rendered PDF hash could not be verified.");
        pages = (await PDFDocument.load(pdf)).getPageCount();
        if (pages !== result.pages || pages < 1)
          fail("PDF_MEASUREMENT", "The PDF page count could not be verified.");
        await save(exportId, component.id, "pdf", pdf, pages);
        pdfBytes = pdf;
      }
    } else
      error ??=
        result?.error ?? "PDF unavailable; exact page measurement is Unknown.";
    if (signal.aborted) error = cancelled().message;
    const nested = await Promise.all(
      component.nestedLimits.map(async (limit) => {
        const span = pdfBytes
          ? await nestedPageSpan(
              pdfBytes,
              component.document,
              limit.heading,
              signal,
              component.boundaryHeadings,
            )
          : null;
        return {
          componentId: limit.id,
          pages: span,
          limit: limit.pages,
          passed: span === null ? null : span <= limit.pages,
          fingerprint: sha256(
            canonicalStringify({
              component: component.document,
              renderer,
              sectionId: limit.id,
            }),
          ),
          note:
            span === null
              ? "Unknown: the exact PDF has no unique ordered heading anchors for this nested page span; researcher review is required."
              : "Measured inclusively from unique ordered heading anchors in the exact PDF, through the next heading or component end; shared pages count in this span.",
        };
      }),
    );
    const measurements: Measurement[] = [
      {
        componentId: component.id,
        pages,
        limit: component.pageLimit,
        passed:
          pages !== null && component.pageLimit !== null
            ? pages <= component.pageLimit
            : null,
        fingerprint: sha256(
          canonicalStringify({
            snapshotId: (await repo.read()).proposalExports.find(
              (item) => item.id === exportId,
            )!.snapshotId,
            component: component.document,
            renderer,
          }),
        ),
        note:
          pages === null
            ? "Unknown: exact PDF rendering was not verified."
            : "Measured from the exact exported PDF; this checks administrative page count only.",
      },
      ...nested,
    ];
    await update(exportId, (item) => {
      item.measurements.push(...measurements);
      if (error) item.errors.push(component.id + ": " + error);
    });
    return { measurements, error };
  }
  async function run(exportId: string) {
    const controller = controllers.get(exportId) ?? new AbortController();
    controllers.set(exportId, controller);
    const timer = setTimeout(
      () => controller.abort(),
      adapters.jobTimeoutMs ?? 10 * 60_000,
    );
    try {
      const initial = await repo.read();
      const item = initial.proposalExports.find(
        (entry) => entry.id === exportId,
      )!;
      if (item.status !== "queued") return;
      const snapshot = structuredClone(
        assertSnapshot(initial, item.snapshotId),
      );
      await update(exportId, (entry) => {
        entry.status = "running";
      });
      await save(
        exportId,
        "packet-snapshot",
        "json",
        JSON.stringify(snapshot, null, 2),
      );
      const components = snapshotComponents(snapshot);
      const warnings = components.flatMap((component) => component.warnings);
      for (const component of components) {
        if (controller.signal.aborted) break;
        await renderComponent(
          exportId,
          component,
          item.renderer,
          controller.signal,
        );
      }
      if (controller.signal.aborted)
        await update(exportId, (entry) => {
          entry.errors.push(cancelled().message);
        });
      const latest = (await repo.read()).proposalExports.find(
        (entry) => entry.id === exportId,
      )!;
      const binding = snapshot.payload.application.binding;
      const external = binding?.manifest
        ? resolveTemplate(binding.manifest, binding.answers).externalTasks
        : [];
      const taskRecords = snapshot.payload.application.externalTasks ?? [];
      const externalNotes = external
        .filter((task) => task.applicability !== "not-applicable")
        .map((task) => {
          const recorded = taskRecords.some(
            (record) =>
              record.id === task.task.id &&
              record.bindingRevision === binding?.revision &&
              record.status === "Ready",
          );
          return (
            task.task.label +
            ": " +
            (recorded
              ? "researcher-recorded completion; inspect retained evidence"
              : "separate external action/review required")
          );
        });
      const effectiveIssues = snapshot.payload.issues.filter((issue) => {
        if (!issue.id.startsWith("pages-")) return true;
        const measurement = latest.measurements.find(
          (m) => "pages-" + m.componentId === issue.id,
        );
        return !measurement || measurement.passed !== true;
      });
      const lines = [
        "# Internal review report — researcher review required",
        "Snapshot: " + snapshot.id,
        "Snapshot SHA-256: " + snapshot.digest,
        "This export is preparation material. It does not certify scientific merit, sponsor compliance, or submission.",
        "Readiness: " +
          (effectiveIssues.some(
            (issue) => issue.severity === "blocker" && !issue.waived,
          ) ||
          warnings.length ||
          latest.errors.length
            ? "Draft with unresolved issues"
            : "Narrative checks passed; researcher review required"),
        ...effectiveIssues.map(
          (issue) =>
            issue.severity.toUpperCase() +
            ": " +
            issue.location +
            " — " +
            issue.message +
            " Fix: " +
            issue.fix +
            (issue.waived ? " WAIVED: " + issue.waived : ""),
        ),
        ...warnings.map((warning) => "WARNING: " + warning),
        ...latest.measurements.map(
          (measurement) =>
            measurement.componentId +
            ": " +
            (measurement.pages ?? "Unknown") +
            " pages; limit " +
            (measurement.limit ?? "none") +
            "; result " +
            (measurement.passed === null
              ? "Unknown"
              : measurement.passed
                ? "within page limit"
                : "EXCEEDS page limit") +
            ". " +
            measurement.note,
        ),
        ...externalNotes,
        ...latest.errors.map((error) => "ERROR: " + error),
      ];
      const report = lines.join("\n\n");
      await save(exportId, "internal-review-report", "md", report);
      // Review report is mandatory and separate; failure to render it also fails the operational job.
      if (!controller.signal.aborted)
        await renderComponent(
          exportId,
          {
            id: "internal-review-report",
            label: "Internal review report",
            document: ProposalDocumentSchema.parse({
              blocks: lines.flatMap((line) => textBlocks(line)),
            }),
            pageLimit: null,
            nestedLimits: [],
            warnings: [],
          },
          item.renderer,
          controller.signal,
        );
      const beforeManifest = (await repo.read()).proposalExports.find(
        (entry) => entry.id === exportId,
      )!;
      await save(
        exportId,
        "internal-manifest",
        "json",
        JSON.stringify(
          {
            formatVersion: 1,
            snapshotId: snapshot.id,
            snapshotDigest: snapshot.digest,
            applicationId: snapshot.applicationId,
            projectId: snapshot.payload.project.id,
            rulesVersion: snapshot.payload.rulesVersion,
            renderer: JSON.parse(item.renderer),
            notice:
              "Internal provenance and review metadata. Keep separate from sponsor narrative files.",
            warnings,
            frozenIssues: snapshot.payload.issues,
            externalTasks: externalNotes,
            measurements: beforeManifest.measurements,
            errors: beforeManifest.errors,
            artifacts: beforeManifest.artifacts,
          },
          null,
          2,
        ),
      );
      await update(exportId, (entry) => {
        entry.status =
          entry.errors.length || controller.signal.aborted
            ? "failed"
            : "succeeded";
        entry.finishedAt = now();
      });
    } catch (error) {
      await update(exportId, (entry) => {
        entry.status = "failed";
        entry.finishedAt = now();
        entry.errors.push(message(error));
      });
      // Even early operational failure gets a separate, downloadable review trail when storage permits.
      const failed = (await repo.read()).proposalExports.find(
        (entry) => entry.id === exportId,
      )!;
      if (
        !failed.artifacts.some(
          (artifact) => artifact.componentId === "internal-review-report",
        )
      )
        await save(
          exportId,
          "internal-review-report",
          "md",
          "# Internal review report\n\nDraft with unresolved issues.\n\n" +
            failed.errors.join("\n\n"),
        ).catch(() => {});
      if (
        !failed.artifacts.some(
          (artifact) => artifact.componentId === "internal-manifest",
        )
      )
        await save(
          exportId,
          "internal-manifest",
          "json",
          JSON.stringify(
            {
              snapshotId: failed.snapshotId,
              errors: failed.errors,
              artifacts: failed.artifacts,
              notice:
                "Interrupted or failed export. Unfinished page measurements remain Unknown.",
            },
            null,
            2,
          ),
        ).catch(() => {});
    } finally {
      clearTimeout(timer);
      controllers.delete(exportId);
    }
  }
  function schedule() {
    if (worker) return;
    worker = (async () => {
      // Admission completes before processing, making queued status observable and preventing stale response races.
      await new Promise<void>((resolve) => setTimeout(resolve, 0));
      while (queue.length) await run(queue.shift()!);
    })().finally(() => {
      worker = null;
      if (queue.length) schedule();
    });
  }
  return {
    request: (input: z.infer<typeof ExportRequestSchema>) =>
      serial(async () => {
        const request = ExportRequestSchema.parse(input);
        await ready;
        const state = await repo.read(),
          snapshot = assertSnapshot(state, request.snapshotId);
        const renderer = await rendererKey();
        const jobKey = sha256(
          canonicalStringify({
            snapshot: snapshot.digest,
            renderer,
            version: "packet-export-1",
          }),
        );
        const existing = [...state.proposalExports]
          .reverse()
          .find(
            (item) => item.snapshotId === snapshot.id && item.jobKey === jobKey,
          );
        if (existing && (existing.status !== "failed" || !request.retry))
          return { state, exportId: existing.id };
        if (
          state.proposalExports.filter(
            (item) => item.status === "queued" || item.status === "running",
          ).length >= 4
        )
          fail(
            "EXPORT_QUEUE_FULL",
            "The local export queue is full. Wait for an export to finish.",
            429,
          );
        const exportId = "export_" + randomUUID();
        // A retry gets its own immutable artifact directory; the failed export remains inspectable.
        const saved = await repo.internal((latest) => {
          assertSnapshot(latest, request.snapshotId);
          latest.proposalExports.push({
            id: exportId,
            snapshotId: snapshot.id,
            jobKey,
            status: "queued",
            createdAt: now(),
            finishedAt: null,
            artifacts: [],
            measurements: [],
            errors: [],
            renderer,
          });
        }, request.expectedRevision);
        queue.push(exportId);
        controllers.set(exportId, new AbortController());
        schedule();
        return { state: saved.state, exportId };
      }),
    status: async (id: string) => {
      await ready;
      safeId(id);
      const state = await repo.read();
      const item =
        state.proposalExports.find((entry) => entry.id === id) ??
        fail("EXPORT_NOT_FOUND", "The export was not found.", 404);
      const snapshot = assertSnapshot(state, item.snapshotId);
      return {
        export: item,
        snapshotId: snapshot.id,
        currentInputsMatch: snapshotInputsMatch(state, snapshot),
        currentRendererMatch:
          item.renderer === (await rendererKey()) &&
          !JSON.parse(item.renderer).unavailable,
      };
    },
    download: async (id: string, artifactId: string) => {
      await ready;
      safeId(id);
      safeId(artifactId);
      const state = await repo.read(),
        item =
          state.proposalExports.find((entry) => entry.id === id) ??
          fail("EXPORT_NOT_FOUND", "The export was not found.", 404);
      assertSnapshot(state, item.snapshotId);
      const artifact =
        item.artifacts.find((entry) => entry.id === artifactId) ??
        fail("ARTIFACT_NOT_FOUND", "The export artifact was not found.", 404);
      const target = artifactPath(id, artifactId, artifact.format);
      try {
        const info = await lstat(target);
        if (
          !info.isFile() ||
          info.isSymbolicLink() ||
          info.size !== artifact.bytes ||
          info.size > maxBytes
        )
          fail(
            "ARTIFACT_INTEGRITY",
            "The saved artifact failed verification.",
            409,
          );
        const root = await checkedDirectory(id);
        if (path.dirname(await realpath(target)) !== root)
          fail(
            "ARTIFACT_PATH",
            "The saved artifact path failed verification.",
            409,
          );
        const bytes = await readFile(target);
        if (sha256(bytes) !== artifact.sha256)
          fail(
            "ARTIFACT_INTEGRITY",
            "The saved artifact hash failed verification.",
            409,
          );
        return { artifact, bytes };
      } catch (error) {
        if (error instanceof KitError) throw error;
        return fail(
          "ARTIFACT_UNAVAILABLE",
          "The saved artifact is unavailable. Preserve the export record and retry.",
          409,
        );
      }
    },
    cancel: (id: string, expectedRevision: number) =>
      serial(async () => {
        await ready;
        safeId(id);
        const result = await repo.internal((state) => {
          const item =
            state.proposalExports.find((entry) => entry.id === id) ??
            fail("EXPORT_NOT_FOUND", "The export was not found.", 404);
          if (item.status !== "queued" && item.status !== "running") return;
          controllers.get(id)?.abort();
          if (item.status === "queued") {
            item.status = "failed";
            item.finishedAt = now();
            item.errors.push(cancelled().message);
          }
        }, expectedRevision);
        return { state: result.state, exportId: id };
      }),
    idle: async () => {
      await ready;
      await admission;
      while (worker) await worker;
    },
  };
}
const globalServices = globalThis as typeof globalThis & {
  grantpathProposalExportServices?: Map<
    string,
    ReturnType<typeof createProposalExportService>
  >;
};
export function proposalExportService() {
  const repo = repository(),
    services = (globalServices.grantpathProposalExportServices ??= new Map<
      string,
      ReturnType<typeof createProposalExportService>
    >());
  const key = path.resolve(repo.directory);
  if (!services.has(key)) services.set(key, createProposalExportService(repo));
  return services.get(key)!;
}
