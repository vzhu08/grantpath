import { createHash, randomUUID } from "node:crypto";
import { normalizeText } from "../../modules/documents/src/index";
import { validateCitation } from "../../packages/contracts/src/index";
import { KitError } from "../../packages/runtime/src/index";
import type { State } from "../schema";
import type { AttemptRecord, CitationRecord, EvidenceRecord, Resubmissions, RevisionRecord } from "./schema";

export type Workspace = Omit<State, "applications"> & {
  applications: (State["applications"][number] & { cycleId?: string; originAttemptId?: string | null })[];
  resubmissions: Resubmissions;
};
export type Clock = { at: string; id: (prefix: string) => string; fixture?: boolean };
export const clock = (): Clock => ({ at: new Date().toISOString(), id: p => `${p}-${randomUUID()}` });
export function fail(message: string, status = 400): never { throw new KitError(status === 409 ? "REVISION_CONFLICT" : status === 404 ? "NOT_FOUND" : "RESUBMISSION_INPUT", message, status); }
export function find<T extends { id: string }>(items: T[], id: string): T { return items.find(x => x.id === id) ?? fail("The referenced record is unavailable. Preserve your text and reload saved data.", 404); }
export const last = <T>(items: T[]): T => items[items.length - 1]!;
export function canonical(value: unknown): string {
  const order = (v: unknown): unknown => Array.isArray(v) ? v.map(order) : v && typeof v === "object" ? Object.fromEntries(Object.entries(v).filter(([, v]) => v !== undefined).sort(([a], [b]) => a.localeCompare(b, "en")).map(([k, v]) => [k, order(v)])) : v;
  return JSON.stringify(order(value));
}
export const sha256 = (value: unknown) => createHash("sha256").update(canonical(value), "utf8").digest("hex");
export const textDigest = (text: string) => createHash("sha256").update(text, "utf8").digest("hex");
export const jsonCopy = (value: unknown) => JSON.parse(JSON.stringify(value));
export function normalized(id: string, text: string) { return normalizeText({ id, filename: `${id}.txt`, text }); }
export function exactCitation(c: CitationRecord, text: string, hash: string) {
  const document=normalized(c.sourceId,text);
  return hash === c.hash && document.hash===hash && validateCitation({ documentId: c.sourceId, quote: c.quote, start: c.start, end: c.end }, [document]);
}
export function evidenceCopy(state: Workspace, projectId: string, c: CitationRecord, allowedCallSourceId?:string) {
  const source = find(state.sources, c.sourceId);
  if ((source.projectId !== projectId || source.type === "call")&&!(source.type==="call"&&source.id===allowedCallSourceId)) fail("Research evidence must belong to this project; reviewer feedback is a separate namespace.");
  const version = source.versions.find(v => v.version === c.version) ?? fail("The historical evidence version is unavailable.");
  if (!exactCitation(c, version.text, version.hash)) fail("Evidence quotation, hash or normalized UTF-16 range does not match.");
  return { id: source.id, projectId:source.projectId, title: source.title, type: source.type, provenance: source.provenance, version: version.version, hash: version.hash, text: version.text, createdAt: version.createdAt };
}
export function captureEvidenceCopy(state:Workspace,projectId:string,originalApplicationId:string|null,c:CitationRecord){const app=originalApplicationId?find(state.applications,originalApplicationId):null;return evidenceCopy(state,projectId,c,app?find(state.opportunities,app.opportunityId).sourceId:undefined);}
export function validateEvidence(state: Workspace, attempt: AttemptRecord, link: EvidenceRecord) { return evidenceCopy(state, attempt.projectId, link.citation); }
export function revisionCopy(state: Workspace, attempt: AttemptRecord, link: RevisionRecord) {
  if (link.applicationId !== attempt.targetApplicationId) fail("Choose a passage from this attempt's target application.");
  const app = find(state.applications, link.applicationId);
  if (app.projectId !== attempt.projectId) fail("Target application belongs to another project.");
  const section = [...app.sections,...(app.archivedSections??[])].find(s => s.key === link.sectionId&&s.revisions.some(r=>r.id===link.revisionId)) ?? fail("Mapped historical target section is unavailable.");
  const revision = section.revisions.find(r => r.id === link.revisionId) ?? fail("The selected target revision is unavailable.");
  if (textDigest(revision.text) !== link.digest) fail("Target text digest does not match the saved revision.");
  if (link.range && (link.range.end <= link.range.start || revision.text.slice(link.range.start, link.range.end) !== link.range.quote)) fail("Target passage does not match the saved UTF-16 range.");
  return { applicationId: app.id, sectionId: section.key, label: section.label, revision: structuredClone(revision), range: link.range };
}
export function attemptFor(state: Workspace, id: string, writable = false) {
  const attempt = find(state.resubmissions.attempts, id);
  if (writable && attempt.state === "archived") fail("This attempt is archived. Start a successor attempt to continue.");
  return attempt;
}
export function appendBound(items: unknown[], label: string, maximum = 100) { if (items.length >= maximum) fail(`${label} capacity reached (${maximum}). Export and start a new project, or arrange an explicit capacity change; retained history is never discarded.`, 413); }
export function assertUnique(ids: string[], label: string) { if (new Set(ids).size !== ids.length) fail(`${label} must not contain duplicate IDs.`); }
export function mappingsValid(state: Workspace, attempt: AttemptRecord, mappings: AttemptRecord["mappings"],historical=false) {
  const snapshot = find(state.resubmissions.snapshots, attempt.snapshotId), app = find(state.applications, attempt.targetApplicationId);
  for (const mapping of mappings) {
    if (mapping.originalSectionId !== null && !snapshot.sections.some(s => s.sectionId === mapping.originalSectionId)) fail("Original section mapping is unavailable.");
    assertUnique(mapping.targetSectionIds, "Section mapping");
    if (mapping.targetSectionIds.some(id => ![...app.sections,...(historical?app.archivedSections??[]:[])].some(s => s.key === id))) fail("Target section mapping is unavailable.");
  }
}
