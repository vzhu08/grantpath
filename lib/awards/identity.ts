import type { State } from "../schema";
import { OriginPayloadSchema, type OriginPayload, type MoneyFactV1 } from "./schema";
import { contentDigest } from "./canonical";
import { canonicalStringify, sha256 } from "../proposals/workflow";
import { SubmissionSnapshot } from "../resubmissions/schema";
import { snapshotDigest } from "../resubmissions/snapshots";
import { freezeSources, requireAward, validateEvidence } from "./context";

export const externalAwardKey = (number: string, recipient: string) =>
  `NSF:${number.trim().toLocaleUpperCase("en-US")}:${recipient.trim().toLocaleUpperCase("en-US")}`;
export type OriginSelection = {
  draftIds: string[]; proposedMoneyFacts: MoneyFactV1[]; packetId: string | null;
  submissionSnapshotId?: string | null;
  submissionEvidence: OriginPayload["submissionEvidence"];
};
/** Server adapter: never accept a client-posted origin snapshot as authoritative. */
export function captureOrigin(state: State, applicationId: string, selection: OriginSelection, at: string): OriginPayload {
  const application = state.applications.find(a => a.id === applicationId);
  requireAward(application, "Select a saved application.");
  const project = state.projects.find(p => p.id === application.projectId);
  const call = state.opportunities.find(c => c.id === application.opportunityId);
  requireAward(project && call, "The originating project or call is unavailable.");
  requireAward(application.cycleId && application.originAttemptId !== undefined, "The originating application cycle is missing. Run the matching workspace migration.");
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
  const selectedSubmission = selection.submissionSnapshotId ? state.resubmissions.snapshots.find(s => s.id === selection.submissionSnapshotId) : null;
  requireAward(!selection.submissionSnapshotId || selectedSubmission && selectedSubmission.projectId === project.id && selectedSubmission.originalApplicationId === application.id,
    "Select an attested submitted snapshot for this exact awarded application. An origin attempt's prior submission does not establish submission of its target.");
  const submittedSnapshot = selectedSubmission ? SubmissionSnapshot.parse(selectedSubmission) : null;
  if (submittedSnapshot) {
    const { digest, ...payload } = submittedSnapshot;
    requireAward(snapshotDigest(payload) === digest, "Attested submission snapshot digest is invalid.");
  }
  requireAward(submittedSnapshot || selection.submissionEvidence.state !== "human_attested_snapshot", "An attested submission claim needs an explicitly selected matching snapshot.");
  const partial = {
    version: "award-origin-v1" as const, applicationId, projectId: project.id, applicationRevision: application.revision,
    projectRevision: project.revision, callId: call.id, callRevision: call.revision,
    applicationCycleId: application.cycleId, originAttemptId: application.originAttemptId, submittedSnapshot,
    callSourceRef: { sourceId: call.sourceId, version: call.sourceVersion, hash: callVersion.hash, role: "originating call" },
    capturedAt: at, provenance: application.provenance, sections, proposedMoneyFacts: selection.proposedMoneyFacts,
    packet: packet ? { id: packet.id, digest: packet.digest, attemptId: application.originAttemptId } : null,
    submissionEvidence: submittedSnapshot ? { state: "human_attested_snapshot" as const, snapshotId: submittedSnapshot.id,
      digest: submittedSnapshot.digest, actor: submittedSnapshot.attestation.by, at: submittedSnapshot.createdAt } : selection.submissionEvidence,
  };
  validateEvidence(partial, state, project.id, [call.sourceId]);
  return OriginPayloadSchema.parse({ ...partial, sources: freezeSources(partial, state, project.id, [call.sourceId]) });
}
