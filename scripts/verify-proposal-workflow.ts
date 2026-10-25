/**
 * Opt-in native acceptance. Requires configured LibreOffice and real Times New Roman.
 * Run: node --import tsx scripts/verify-proposal-workflow.ts
 * Keeps isolated workspace, exact export bytes and a readable artifact bundle in test-results/.
 * This script makes no provider requests and does not certify or submit an application.
 */
import assert from "node:assert/strict";
import { mkdir, mkdtemp, writeFile } from "node:fs/promises";
import path from "node:path";
import { PDFDocument } from "pdf-lib";
import { unzipSync, strFromU8 } from "fflate";
import { createRepository } from "../lib/repository";
import { cite, latest } from "../lib/evidence";
import type { Command, ProposalExport } from "../lib/schema";
import { visibleText, type ProposalBlock } from "../lib/proposals/blocks";
import { exportComponentPlan, type ApplicabilityAnswers } from "../lib/proposals/nsf-template";
import { createProposalExportService, snapshotComponents } from "../lib/proposals/export-service";
import { canonicalStringify, sha256 } from "../lib/proposals/workflow";
import { RENDER_PROFILE, validatePdfFonts } from "../lib/proposals/rendering";
import { ingestDocument } from "../modules/documents/src/server";

assert.ok(process.env.GRANTPATH_LIBREOFFICE_PATH, "Set GRANTPATH_LIBREOFFICE_PATH to the native LibreOffice executable.");
assert.ok(process.env.GRANTPATH_FONT_DIR || process.platform === "win32", "Configure GRANTPATH_FONT_DIR with actual Times New Roman fonts.");
const root = path.resolve("test-results/proposal-workflow");
await mkdir(root, { recursive: true });
const directory = await mkdtemp(path.join(root, "run-"));
const dataDirectory = path.join(directory, "workspace");
// Native LibreOffice on Windows can fail silently under deeply nested worktree paths.
// Allow an operator-selected short rendering root while keeping metadata/bundles isolated.
const nativeRoot = process.env.GRANTPATH_EXPORT_DIR
  ? path.join(path.resolve(process.env.GRANTPATH_EXPORT_DIR), path.basename(directory))
  : path.join(directory, "native-renderer");
process.env.GRANTPATH_EXPORT_DIR = nativeRoot;
const bundleDirectory = path.join(directory, "review-bundle");
await mkdir(bundleDirectory, { recursive: true });
const repo = createRepository(dataDirectory);
async function save(command: Command) {
  return repo.mutate({ command, expectedRevision: (await repo.read()).revision });
}
const initial = await repo.read();
const project = initial.projects[0]!, call = initial.opportunities[0]!, source = initial.sources.find((item) => item.projectId === project.id && item.type === "methods")!;
assert.ok(source, "The isolated synthetic project must have methods evidence.");
const created = await save({ type: "saveApplication", projectId: project.id, opportunityId: call.id });
const applicationId = created.selectedId!;
await save({ type: "adoptTemplate", applicationId, templateId: "nsf-standard-research" });
const answers: ApplicabilityAnswers = {
  "supports-graduate-students": "yes",
  "supports-postdoctoral-scholars": "yes",
  "has-prior-nsf-support": "yes",
  "has-subawards": "no",
  "multiple-submitting-organizations": "no",
  "special-proposal-type": "no",
  "call-deviations": "no",
};
await save({
  type: "confirmTemplate", applicationId, answers, mappings: [],
  by: "Synthetic acceptance fixture",
  note: "Synthetic generic-profile fixture only. No real call, sponsor eligibility or submission is certified.",
});
const app = (await repo.read()).applications.find((item) => item.id === applicationId)!;
const manifest = app.binding!.manifest!;
const quote = "No pilot measurements have been collected.";
const methodsCitation = cite(source, quote);
const normal = (text: string): ProposalBlock[] => [{ type: "paragraph", text }];
const content: Record<string, ProposalBlock[]> = {
  "summary-overview": normal("Synthetic acceptance fixture. The proposed study compares low-cost environmental measurements with laboratory reference observations. Study size and site access remain researcher-confirmed inputs."),
  "summary-intellectual-merit": normal("The proposed work examines reliability and uncertainty in paired measurements. No favorable result is assumed and no completed research outcome is claimed."),
  "summary-broader-impacts": normal("The proposed workflow may support more accessible environmental measurement. Community access and participation remain unconfirmed."),
  "description-objectives": normal("Synthetic fixture only. Assess measurement reliability using a transparent proposed comparison plan. [MISSING: researcher-confirmed study size]."),
  "description-context": normal("The proposal requires a researcher-verified review of relevant literature and current knowledge. No bibliographic source is fabricated by this acceptance fixture."),
  "description-methods": [
    { type: "heading", level: 2, text: "Measurement comparison procedure" },
    { type: "paragraph", text: "Synthetic fixture only. " + quote + " The proposed procedure will preserve uncertainty and missing evidence." },
    { type: "list", ordered: false, items: ["Compare paired sensor and laboratory reference observations.", "Document calibration drift and missing observations."] },
    { type: "list", ordered: true, items: ["Confirm site access before sampling.", "Review reference comparisons without assuming favorable findings."] },
    { type: "table", headers: ["Activity", "Status", "Evidence"], rows: [
      ["Calibration comparison", "Proposed", "Evidence note version 1"],
      ["Pilot results", "Unknown", "[MISSING: actual measurements]"],
      ["Unicode units", "μg/L, ± 0.5 °C", "Café naïve β"],
    ] },
    { type: "paragraph", text: "TABLE-END-MARKER: the final row and uncertainty must survive the exact PDF." },
  ],
  "description-evaluation": normal("Researcher review will define criteria for evaluating uncertainty and missing data. The sequence is proposed and does not establish access commitments."),
  "description-broader-impacts": normal("The synthetic project proposes transparent measurement documentation. Societal benefits are anticipated possibilities rather than demonstrated outcomes."),
  "prior-support": [
    { type: "heading", level: 2, text: "Award fixture record" },
    { type: "paragraph", text: "Synthetic fixture only. [MISSING: actual NSF award number, award dates and researcher-confirmed results]. This test does not claim that any past NSF award exists." },
    { type: "heading", level: 2, text: "Prior results requiring confirmation" },
    { type: "paragraph", text: "No actual prior result is established by the fixture. PRIOR-SUPPORT-END-MARKER is deliberately after this subheading, so subsection measurements must include it." },
  ],
  references: normal("[MISSING: researcher-verified bibliographic references]. This fixture supplies no fabricated publication or author."),
  "budget-justification": normal("Researcher must supply the actual budget and its justification. [MISSING: approved amounts, rates, effort and line items]. No budget commitment is inferred."),
  facilities: normal("Shared bench space is planned but access has not been confirmed. [MISSING: researcher-confirmed resources]. This fixture makes no financial valuation."),
  mentoring: normal("The proposed combined mentoring plan includes regular guidance, responsible research discussion and progress feedback for supported graduate students and postdoctoral scholars. The researcher must confirm participants and activities."),
  "dmsp-worksheet": normal("Preparation worksheet only. The researcher must complete the official Data Management and Sharing Plan in Research.gov. [MISSING: repository, stewardship, access, retention and sharing decisions]."),
};
for (const section of app.sections) {
  const blocks = content[section.key];
  assert.ok(blocks, "Missing native fixture content for " + section.key);
  await save({
    type: "saveDraft", applicationId, sectionKey: section.key, label: section.label, wordLimit: section.wordLimit,
    blocks, text: visibleText({ blocks }), sourceIds: [source.id],
    citations: section.key === "description-methods" ? [methodsCitation] : [],
  });
  const draft = (await repo.read()).applications.find((item) => item.id === applicationId)!.sections.find((item) => item.key === section.key)!.revisions.at(-1)!;
  await save({ type: "reviewSection", applicationId, sectionKey: section.key, revisionId: draft.id, by: "Synthetic acceptance fixture" });
}
await save({
  type: "setExternalTask", applicationId, id: "dmsp-researchgov", status: "In progress",
  note: "Synthetic acceptance fixture. Official Research.gov completion remains a separate human task.", by: "Synthetic acceptance fixture",
});
const frozen = await save({ type: "freezePacket", applicationId });
const snapshot = frozen.state.packetSnapshots.at(-1)!;
const frozenJSON = canonicalStringify(snapshot);
const plans = exportComponentPlan(manifest, answers).filter((plan) => plan.applicability !== "not-applicable");
assert.equal(plans.length, 7, "The fixture must exercise every supported NSF component, including mentoring and DMSP preparation.");
assert.equal(snapshotComponents(snapshot).length, 7);
const service = createProposalExportService(repo);
const queued = await service.request({ snapshotId: snapshot.id, expectedRevision: frozen.state.revision });
assert.equal(queued.state.proposalExports.find((item) => item.id === queued.exportId)!.status, "queued");
console.log("Native export queued: " + queued.exportId + "; isolated data: " + dataDirectory + "; native renderer files: " + nativeRoot);
await service.idle();
const status = await service.status(queued.exportId);
assert.equal(status.export.status, "succeeded", status.export.errors.join("\n"));
assert.equal(status.currentInputsMatch, true);
assert.equal(status.currentRendererMatch, true);
const job = status.export;
assert.equal(job.errors.length, 0);
const renderer = JSON.parse(job.renderer) as { profile: typeof RENDER_PROFILE; libreOffice: string; fonts: { name: string; sha256: string }[] };
assert.deepEqual(renderer.profile, RENDER_PROFILE);
assert.match(renderer.libreOffice, /LibreOffice/i);
assert.equal(renderer.fonts.length, 4);
assert.ok(renderer.fonts.every((font) => /^[a-f0-9]{64}$/u.test(font.sha256)));
const artifactResults: { componentId: string; format: string; path: string; sha256: string; bytes: number; pages: number | null; pdfFonts?: string[] }[] = [];
const pdfTexts = new Map<string, string>();
for (const artifact of job.artifacts) {
  const { bytes } = await service.download(job.id, artifact.id);
  assert.equal(bytes.byteLength, artifact.bytes, artifact.filename + " size mismatch");
  assert.equal(sha256(bytes), artifact.sha256, artifact.filename + " hash mismatch");
  const target = path.join(bundleDirectory, artifact.filename);
  await writeFile(target, bytes);
  const detail: (typeof artifactResults)[number] = { componentId: artifact.componentId, format: artifact.format, path: target, sha256: artifact.sha256, bytes: artifact.bytes, pages: artifact.pages };
  if (artifact.format === "pdf") {
    const pdf = await PDFDocument.load(bytes);
    assert.equal(pdf.getPageCount(), artifact.pages);
    detail.pdfFonts = validatePdfFonts(pdf, true);
    assert.ok(detail.pdfFonts.length, "No verified embedded Times New Roman in " + artifact.filename);
    const extracted = await ingestDocument({ filename: artifact.filename, bytes }, { maxBytes: 25_000_000, maxPages: 1000 });
    pdfTexts.set(artifact.componentId, extracted.text);
  }
  if (artifact.format === "docx") {
    const zip = unzipSync(bytes), xml = strFromU8(zip["word/document.xml"]!);
    assert.match(xml, /w:w="12240"/u);
    assert.match(xml, /w:h="15840"/u);
    assert.match(xml, /w:top="1440"/u);
    assert.match(xml, /w:lineRule="atLeast"/u);
    if (artifact.componentId === "project-description") {
      assert.match(xml, /w:tblHeader/u); assert.match(xml, /w:numPr/u); assert.match(xml, /Heading2/u);
      assert.match(xml, /PRIOR-SUPPORT-END-MARKER/u);
    }
    if (!artifact.componentId.startsWith("internal-")) {
      assert.ok(!xml.includes("Internal review report"));
      assert.ok(!xml.includes("Snapshot SHA-256"));
      assert.ok(!Object.keys(zip).some((name) => /word\/(header|footer)/u.test(name)));
    }
  }
  artifactResults.push(detail);
}
for (const plan of plans) {
  for (const format of ["docx", "pdf"] as const)
    assert.ok(job.artifacts.some((artifact) => artifact.componentId === plan.component.id && artifact.format === format), "Missing " + plan.component.id + "." + format);
  const measurement = job.measurements.find((item) => item.componentId === plan.component.id)!;
  assert.ok(measurement && measurement.pages !== null, "Unmeasured native component " + plan.component.id);
  assert.equal(measurement.limit, plan.aggregateLimits.pages);
  if (measurement.limit !== null) assert.equal(measurement.passed, measurement.pages! <= measurement.limit);
}
assert.equal(job.artifacts.filter((artifact) => artifact.format === "pdf").length, 8, "Seven components and the mandatory separate review report must have PDFs.");
const summary = pdfTexts.get("project-summary")!;
assert.match(summary, /Overview/u); assert.match(summary, /Intellectual Merit/u); assert.match(summary, /Broader Impacts/u);
const description = pdfTexts.get("project-description")!;
assert.match(description, /TABLE-END-MARKER/u);
assert.match(description, /PRIOR-SUPPORT-END-MARKER/u);
assert.match(description, /μg\/L/u);
const prior = job.measurements.find((item) => item.componentId === "prior-support")!;
assert.ok(prior?.pages !== null && prior?.pages !== undefined, "The uniquely anchored prior-support span must be measured from the actual PDF.");
assert.equal(prior.limit, 5);
assert.equal(prior.passed, prior.pages! <= 5);
assert.match(prior.note, /exact PDF/u);
const reportArtifact = job.artifacts.find((artifact) => artifact.componentId === "internal-review-report" && artifact.format === "md")!;
const report = (await service.download(job.id, reportArtifact.id)).bytes.toString("utf8");
assert.match(report, /Draft with unresolved issues/u);
assert.match(report, /official Research.gov DMSP/u);
assert.match(report, /separate external action\/review required/u);
assert.ok(!job.artifacts.some((artifact) => artifact.componentId === "cover-sheet"), "No cover sheet may be injected into sponsor narrative components.");
const manifestArtifact = job.artifacts.find((artifact) => artifact.componentId === "internal-manifest")!;
const exportedManifest = JSON.parse((await service.download(job.id, manifestArtifact.id)).bytes.toString("utf8"));
assert.equal(exportedManifest.snapshotDigest, snapshot.digest);
assert.equal(exportedManifest.snapshotId, snapshot.id);
assert.ok(exportedManifest.frozenIssues.some((issue: { severity: string; waived: string | null }) => issue.severity === "blocker" && !issue.waived));
assert.ok(exportedManifest.warnings.some((warning: string) => warning.includes("Preparation worksheet only")));
const repeated = await service.request({ snapshotId: snapshot.id, expectedRevision: 0, retry: true });
assert.equal(repeated.exportId, job.id, "A completed export is idempotent even with a stale expected revision or retry flag.");
assert.equal((await repo.read()).proposalExports.length, 1);
await save({
  type: "saveSource", id: source.id, projectId: project.id, title: source.title,
  sourceType: source.type, url: source.url, text: latest(source).text + "\nNative acceptance source update after export. No live draft or frozen snapshot is rewritten.",
});
const changed = await service.status(job.id);
assert.equal(changed.currentInputsMatch, false, "Changing selected evidence must make this saved measurement stale.");
assert.equal(changed.currentRendererMatch, true);
assert.equal(canonicalStringify((await repo.read()).packetSnapshots.find((item) => item.id === snapshot.id)!), frozenJSON);
const snapshotArtifact = job.artifacts.find((artifact) => artifact.componentId === "packet-snapshot")!;
assert.equal(canonicalStringify(JSON.parse((await service.download(job.id, snapshotArtifact.id)).bytes.toString("utf8"))), frozenJSON);
assert.equal((await service.request({ snapshotId: snapshot.id, expectedRevision: 0 })).exportId, job.id, "Source changes do not mutate the saved snapshot's idempotent export.");
const interruptedId = "native-restart-interrupted";
await repo.internal((state) => {
  const interrupted: ProposalExport = { ...structuredClone(job), id: interruptedId, status: "running", finishedAt: null, artifacts: [], measurements: [], errors: [] };
  state.proposalExports.push(interrupted);
});
const restarted = createProposalExportService(createRepository(dataDirectory));
await restarted.idle();
const recovered = (await restarted.status(interruptedId)).export;
assert.equal(recovered.status, "failed");
assert.match(recovered.errors.join(" "), /server restart/u);
assert.deepEqual((await restarted.status(job.id)).export, job, "Restart recovery may not mutate the completed export.");
const summaryResult = {
  passed: true, checkedAt: new Date().toISOString(), directory, dataDirectory, nativeRoot, bundleDirectory,
  applicationId, snapshotId: snapshot.id, snapshotDigest: snapshot.digest, exportId: job.id,
  renderer, componentCount: plans.length, artifacts: artifactResults, measurements: job.measurements,
  checks: {
    exactArtifactHashes: true, embeddedTimesNewRoman: true, letterPageAndStructuredBlocks: true,
    allSevenNSFComponents: true, aggregatePageCounts: true, exactPriorSupportSpan: true,
    separateReviewReportAndManifest: true, idempotency: true, changedSourceLeavesSnapshotStable: true,
    changedSourceMakesInputsStale: true, restartRecovery: true,
  },
};
const resultPath = path.join(directory, "verified-results.json");
await writeFile(resultPath, JSON.stringify(summaryResult, null, 2));
await writeFile(path.join(root, "latest-results.json"), JSON.stringify({ resultPath, ...summaryResult }, null, 2));
console.log(JSON.stringify({ passed: true, exportId: job.id, artifacts: job.artifacts.length, measurements: job.measurements.map((item) => ({ component: item.componentId, pages: item.pages, limit: item.limit, passed: item.passed })), resultPath, bundleDirectory }, null, 2));
