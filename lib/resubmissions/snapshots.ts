import type { CaptureRecord, SnapshotRecord } from "./schema";
import { appendBound, captureEvidenceCopy, fail, find, jsonCopy, normalized, sha256, type Clock, type Workspace } from "./context";
import type { ResubmissionCommand } from "./schema";

export function snapshotDigest(snapshot: Omit<SnapshotRecord, "digest">) { return sha256(snapshot); }
export function freezeSubmission(state: Workspace, c: Extract<ResubmissionCommand, {type: "freezeSubmissionSnapshot"}>, env: Clock) {
  const capture = find(state.resubmissions.captures, c.captureId);
  const prior=state.resubmissions.snapshots.find(s=>s.captureId===capture.id);
  if(prior)fail("This capture is already frozen. Create a replacement capture with the prior snapshot and a correction reason; use the original operation ID only to recover a successful save.",409);
  if (capture.revision !== c.captureRevision) fail("The capture changed. Inspect it again before attesting.", 409);
  if (!capture.sections.length) fail("Capture at least one submitted section.");
  if(capture.sections.some(s=>!s.text.trim()))fail("Every frozen section must contain submitted text; omit an absent section and state the coverage limitation.");
  if (!c.coverage.confirmed) fail("Confirm the capture coverage and exclusions.");
  if (c.coverage.extent === "complete-text" && (capture.sections.every(s => ["summary", "significance", "approach"].includes(s.sectionId)) || c.coverage.included.length < capture.sections.length)) fail("Starter sections are partial coverage. Inventory the full captured text before claiming complete-text coverage.");
  const originalInventory=capture.originalApplicationId?find(state.applications,capture.originalApplicationId):null;
  if(c.coverage.extent==="complete-text"&&originalInventory&&(originalInventory.sections.length<=3||originalInventory.sections.some(s=>!capture.sections.some(c=>c.sectionId===s.key))))fail("The captured text does not cover the original application's full section inventory. Save it as partial coverage.");
  appendBound(state.resubmissions.snapshots.filter(x => x.projectId === capture.projectId), "Submitted snapshot", 50);
  const evidence = capture.sections.flatMap(s => s.citations.map(c => captureEvidenceCopy(state, capture.projectId, capture.originalApplicationId,c)));
  const unique = [...new Map(evidence.map(e => [`${e.id}:${e.version}`, e])).values()].sort((a,b) => a.id.localeCompare(b.id) || a.version-b.version);
  const project = find(state.projects, capture.projectId), original = capture.originalApplicationId ? find(state.applications, capture.originalApplicationId) : null;
  const payload: Omit<SnapshotRecord, "digest"> = { id: env.id("submission"), projectId: project.id, provenance: capture.provenance==="researcher"||unique.some(e=>e.provenance==="researcher")?"researcher":"demo", createdAt: env.at, updatedAt: env.at, captureId: capture.id, captureRevision: capture.revision, manifestVersion: 1, normalizationVersion: "bom-lf-utf16-v1", sections: structuredClone(capture.sections), coverage: c.coverage, attestation: c.attestation, originalApplicationId: capture.originalApplicationId, projectCopy: jsonCopy(project), callCopy: original ? jsonCopy(find(state.opportunities, original.opportunityId)) : null, templateManifest:original?.binding?.manifest?structuredClone(original.binding.manifest):null, evidence: unique, supersedesId: capture.supersedesId, correctionReason: capture.correctionReason };
  const snapshot = { ...payload, digest: snapshotDigest(payload) };
  state.resubmissions.snapshots.push(snapshot);
  return snapshot.id;
}
export function saveCaptureSection(state: Workspace, capture: CaptureRecord, c: Extract<ResubmissionCommand, {type: "saveCaptureSection"}>, env: Clock) {
  if (capture.revision !== c.captureRevision) fail("Capture changed. Your section text is preserved; reconcile before saving.", 409);
  appendBound(capture.history, "Capture history");
  const old = capture.sections.find(s => s.sectionId === c.sectionId);
  if (!old) appendBound(capture.sections, "Capture sections", 20);
  let section: CaptureRecord["sections"][number];
  if (c.savedRevisionId) {
    if (!capture.originalApplicationId) fail("Choose an original application before copying saved drafts.");
    const app = find(state.applications, capture.originalApplicationId), sourceSection = app.sections.find(s => s.key === c.sectionId);
    const rev = sourceSection?.revisions.find(r => r.id === c.savedRevisionId) ?? fail("The selected saved draft revision is unavailable.");
    section = { sectionId: c.sectionId, label: sourceSection!.label, revisionId: rev.id, text: rev.text, citations: structuredClone(rev.citations), origin: rev.mode, sourceApplicationId: app.id, representation: "normalized-plain-text-v1" };
    if(rev.mode==="manual"&&!env.fixture)capture.provenance="researcher";
  } else {
    const doc = normalized(c.sectionId, c.text);
    section = { sectionId: c.sectionId, label: c.label, revisionId: null, text: doc.text, citations: [], origin: "manual", sourceApplicationId: null, representation: "normalized-plain-text-v1" };
    if(!env.fixture)capture.provenance="researcher";
  }
  const sections = old ? capture.sections.map(s => s.sectionId === old.sectionId ? section : s) : [...capture.sections, section];
  if (sections.reduce((n,s) => n+s.text.length,0) > 100_000) fail("Captured narrative exceeds 100,000 UTF-16 units; reduce the explicitly scoped text without truncation.",413);
  capture.history.push({ revision: capture.revision, sections: structuredClone(capture.sections), at: capture.updatedAt });
  capture.sections = sections; capture.revision++; capture.updatedAt = env.at;
}
