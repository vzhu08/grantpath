import type { State } from "../schema";
import { OriginPayloadSchema, type OriginPayload, type MoneyFactV1 } from "./schema";
import { contentDigest } from "./canonical";
import { canonicalStringify, sha256 } from "../proposals/workflow";
import { freezeSources, requireAward, validateEvidence } from "./context";

export const externalAwardKey = (number: string, recipient: string) =>
  `NSF:${number.trim().toLocaleUpperCase("en-US")}:${recipient.trim().toLocaleUpperCase("en-US")}`;
export type OriginSelection = {
  draftIds: string[]; proposedMoneyFacts: MoneyFactV1[]; packetId: string | null;
  submissionEvidence: OriginPayload["submissionEvidence"];
};
/** Server adapter: never accept a client-posted origin snapshot as authoritative. */
export function captureOrigin(state: State, applicationId: string, selection: OriginSelection, at: string): OriginPayload {
  const application = state.applications.find(a => a.id === applicationId);
  requireAward(application, "Select a saved application.");
  const project = state.projects.find(p => p.id === application.projectId);
  const call = state.opportunities.find(c => c.id === application.opportunityId);
  requireAward(project && call, "The originating project or call is unavailable.");
  const callSource = state.sources.find(s => s.id === call.sourceId);
  const callVersion = callSource?.versions.find(v => v.version === call.sourceVersion);
  requireAward(callVersion, "The originating call evidence is unavailable.");
  const sections = application.sections.flatMap(s => s.revisions.filter(r => selection.draftIds.includes(r.id)).map(r => ({
    key: s.key, draftId: r.id, revision: s.revisions.indexOf(r) + 1, text: r.text, citations: r.citations,
  })));
  requireAward(sections.length === new Set(selection.draftIds).size && sections.length === selection.draftIds.length, "Select unique originating draft revisions from this application.");
  const packet = selection.packetId ? state.packetSnapshots.find(p => p.id === selection.packetId && p.applicationId === applicationId) : null;
  requireAward(!selection.packetId || packet, "The selected packet does not belong to this application.");
  if (packet) requireAward(sha256(canonicalStringify(packet.payload)) === packet.digest, "The proposal packet digest is invalid.");
  const partial = {
    version: "award-origin-v1" as const, applicationId, projectId: project.id, applicationRevision: application.revision,
    projectRevision: project.revision, callId: call.id, callRevision: call.revision,
    callSourceRef: { sourceId: call.sourceId, version: call.sourceVersion, hash: callVersion.hash, role: "originating call" },
    capturedAt: at, provenance: application.provenance, sections, proposedMoneyFacts: selection.proposedMoneyFacts,
    packet: packet ? { id: packet.id, digest: packet.digest, attemptId: null } : null,
    submissionEvidence: selection.submissionEvidence,
  };
  validateEvidence(partial, state, project.id, [call.sourceId]);
  return OriginPayloadSchema.parse({ ...partial, sources: freezeSources(partial, state, project.id, [call.sourceId]) });
}
