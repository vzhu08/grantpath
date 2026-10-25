import { z } from "zod";
import { TemplateManifestSchema } from "../proposals/nsf-template";

// Kept independent of the workspace module so it can be re-exported without a
// runtime import cycle. Server graph validation supplies ownership checks.
const id = z.string().min(1).max(100).regex(/^[a-zA-Z0-9_-]+$/);
const text = z.string().max(20_000);
const note = z.string().max(3000);
const label = z.string().max(500);
const at = z.iso.datetime();
const revision = z.number().int().positive();
const digest = z.string().regex(/^[a-f0-9]{64}$/);
export const Citation = z.object({ sourceId: id, version: revision, hash: z.string().min(1), quote: text.min(1), start: z.number().int().nonnegative(), end: z.number().int().positive() }).strict();
const provenance = z.enum(["demo", "researcher"]);
const origin = z.enum(["manual", "fixture", "live"]);
export const Due = z.discriminatedUnion("kind", [
  z.object({ kind: z.literal("unknown"), raw: label, reason: label }).strict(),
  z.object({ kind: z.literal("date"), raw: label, date: z.iso.date(), confirmed: z.literal(true) }).strict(),
  z.object({ kind: z.literal("exact"), raw: label, at: z.iso.datetime({ offset: true }), zone: z.string().regex(/^(UTC|[+-](?:0\d|1[0-3]):[0-5]\d|[+-]14:00)$/), confirmed: z.literal(true) }).strict().refine(d => d.at.endsWith(d.zone === "UTC" ? "Z" : d.zone), "Timestamp offset must match zone."),
]);
export const EvidenceLink = z.object({ citation: Citation, claim: note.min(1), classification: z.enum(["observed-result", "existing-fact", "proposed-work", "user-assertion"]), resultDate: z.union([z.iso.date(), z.literal("")]) }).strict();
export const RevisionLink = z.object({ applicationId: id, sectionId: id, revisionId: id, digest, range: z.object({ start: z.number().int().nonnegative(), end: z.number().int().positive(), quote: text.min(1) }).strict().nullable() }).strict();
export const SectionMapping = z.object({ originalSectionId: id.nullable(), targetSectionIds: z.array(id).max(32), note }).strict();
export const CapturedSection = z.object({ sectionId: id, label: label.min(1), text, citations: z.array(Citation).max(50), revisionId: id.nullable(), origin, sourceApplicationId: id.nullable(), representation: z.literal("normalized-plain-text-v1") }).strict();
export const Coverage = z.object({ extent: z.enum(["partial", "complete-text"]), included: z.array(label.trim().min(1)).min(1).max(50), excluded: z.array(label.trim().min(1)).min(1).max(50), limitation: note.trim().min(5), confirmed: z.boolean() }).strict();
export const Attestation = z.object({ by: z.string().trim().min(1).max(100), statement: note.trim().min(10), confirmsSubmittedText: z.literal(true), submittedOn: z.union([z.iso.date(), z.literal("unknown")]), sponsorIdentifier: label, applicationIdentifier: label }).strict();
const base = { id, projectId: id, provenance, createdAt: at, updatedAt: at };
export const Capture = z.object({ ...base, originalApplicationId: id.nullable(), method: z.enum(["saved-drafts", "pasted"]), revision, sections: z.array(CapturedSection).max(20), history: z.array(z.object({ revision, sections: z.array(CapturedSection).max(20), at }).strict()).max(100), supersedesId: id.nullable(), correctionReason: note }).strict();
export const EvidenceCopy = z.object({ id, projectId: id.nullable(), title: label, provenance, type: z.string().max(100), version: revision, hash: z.string(), text, createdAt: z.string() }).strict();
export const SubmissionSnapshot = z.object({ ...base, captureId: id, captureRevision: revision, manifestVersion: z.literal(1), normalizationVersion: z.literal("bom-lf-utf16-v1"), sections: z.array(CapturedSection).min(1).max(20), coverage: Coverage, attestation: Attestation, originalApplicationId: id.nullable(), projectCopy: z.json(), callCopy: z.json().nullable(), templateManifest:TemplateManifestSchema.nullable(), evidence: z.array(EvidenceCopy).max(100), supersedesId: id.nullable(), correctionReason: note, digest }).strict();
export const FeedbackVersion = z.object({ version: revision, text: text.min(1), hash: z.string().min(1), createdAt: at }).strict();
export const CoverageDecision = z.object({ start: z.number().int().nonnegative(), end: z.number().int().positive(), disposition: z.enum(["concern", "positive", "administrative", "no-action"]), reason: note.min(5) }).strict();
export const FeedbackSource = z.object({ ...base, attemptId: id, kind: z.enum(["individual-review", "panel-summary", "decision", "program-guidance"]), label: label.min(1), url: z.string().max(2000).refine(v => !v || /^https?:\/\//.test(v)), versions: z.array(FeedbackVersion).min(1).max(20), coverageReviews: z.array(z.object({ version: revision, hash: z.string(), decisions: z.array(CoverageDecision).max(500), by: z.string().min(1).max(100), at }).strict()).max(100), archivedAt: at.nullable() }).strict();
export const ContextDecision = z.object({ relationship: z.enum(["same-program", "different-program", "unknown"]), sponsorType: z.enum(["new", "formal-resubmission", "unresolved"]), rationale: note, checkedOn: z.union([z.iso.date(), z.literal("")]), confirmedBy: z.string().max(100), confirmed: z.boolean(), callRevision: revision, rules: z.array(z.object({ topic: label.min(1), excerpt: note, url: z.string().max(2000).refine(v => !v || /^https?:\/\//.test(v)), checkedOn: z.union([z.iso.date(), z.literal("")]), decision: note, status: z.enum(["unknown", "confirmed", "not-applicable"]) }).strict()).max(20), substantiveChanges: note, deliveryInstructions: note }).strict();
export const GenerationMetadata = z.object({ promptVersion: label, inputFingerprint: digest, provider: label, model: label, generatedAt: at, humanEdited: z.boolean() }).strict();
export const TextRevision = z.object({ id, text, origin, createdAt: at, citations: z.array(Citation).max(50), missingInputs: z.array(label).max(30), generation: GenerationMetadata.nullable() }).strict();
export const ResponseDocument = z.object({ concernOrder: z.array(id).max(200), opening: z.array(TextRevision).max(100), closing: z.array(TextRevision).max(100), reviews: z.array(z.object({ fingerprint: digest, by: z.string().min(1).max(100), at }).strict()).max(100) }).strict();
export const Attempt = z.object({ ...base, snapshotId: id, targetApplicationId: id, revision, cycleId: id, priorAttemptId: id.nullable(), profile: z.enum(["general", "nsf-resubmission-preparation"]), profileVersion: z.literal(1), state: z.enum(["working", "reviewed", "archived"]), archiveReason: note, mappings: z.array(SectionMapping).max(100), context: ContextDecision, contextHistory: z.array(ContextDecision).max(100), document: ResponseDocument, reviews: z.array(z.object({ fingerprint: digest, by: z.string().min(1).max(100), at }).strict()).max(100) }).strict();
export const ConcernFields = z.object({ interpretation: z.string().max(1000), citations: z.array(Citation).min(1).max(20), importance: z.enum(["unassigned", "major", "moderate", "minor"]), disposition: z.enum(["unassigned", "change", "clarify", "not-adopted"]), confirmed: z.boolean(), mappings: z.array(SectionMapping).max(32), noEditReason: note, rationale: note }).strict();
export const Concern = z.object({ ...base, attemptId: id, revision, fields: ConcernFields, history: z.array(z.object({ revision, fields: ConcernFields, at }).strict()).max(100), origin, generation: GenerationMetadata.nullable(), status: z.enum(["suggested", "accepted", "dismissed", "superseded"]), reason: note, parentIds: z.array(id).max(100), successorIds: z.array(id).max(100), awaitingReview: z.boolean(), suggestionId: id.nullable() }).strict();
export const ActionFields = z.object({ concernIds: z.array(id).min(1).max(100), description: note, owner: z.string().max(100), due: Due, kind: z.enum(["clarification", "existing-evidence", "new-analysis", "new-data", "scope-change", "administrative"]), evidenceRequired: z.boolean(), evidenceReason: note, evidence: z.array(EvidenceLink).max(10), revisions: z.array(RevisionLink).max(10), state: z.enum(["open", "in-progress", "reviewed"]), result: note, resultClassification: z.enum(["unrecorded", "observed-result", "negative-result", "inconclusive-result", "existing-fact", "proposed-work", "not-adopted"]), reviewedBy: z.string().max(100), reviewedAt: at.nullable() }).strict();
export const RevisionAction = z.object({ ...base, attemptId: id, revision, fields: ActionFields, history: z.array(z.object({ revision, fields: ActionFields, at }).strict()).max(100) }).strict();
export const Completion = z.object({ id, fingerprint: digest, responseRevisionId: id, kind: z.enum(["changed", "clarified", "not-adopted"]), reason: note.min(5), by: z.string().min(1).max(100), at }).strict();
export const ConcernResponse = z.object({ ...base, attemptId: id, concernId: id, revisions: z.array(TextRevision).min(1).max(100), completions: z.array(Completion).max(100) }).strict();
export const Conflict = z.object({ ...base, attemptId: id, concernIds: z.array(id).min(2).max(100), decisions: z.array(z.object({ rationale: note.min(5), callConstraint: note, by: z.string().min(1).max(100), fingerprint: digest, at }).strict()).max(100) }).strict();
export const Receipt = z.object({ projectId: id, operationId: id, command: z.string().max(100), inputDigest: digest, resultIds: z.array(id).min(1).max(5), createdAt: at }).strict();
// Packet payload is a canonical, self-contained JSON manifest, validated by the
// export builder and digest verifier; it never resolves live references on read.
export const ResponsePacket = z.object({ ...base, attemptId: id, manifestVersion: z.literal(1), payload: z.json(), digest }).strict();
export const ResubmissionsSchema = z.object({ captures: z.array(Capture), snapshots: z.array(SubmissionSnapshot), attempts: z.array(Attempt), feedback: z.array(FeedbackSource), concerns: z.array(Concern), actions: z.array(RevisionAction), responses: z.array(ConcernResponse), conflicts: z.array(Conflict), packets: z.array(ResponsePacket), receipts: z.array(Receipt) }).strict();
export type Resubmissions = z.infer<typeof ResubmissionsSchema>;
export type CaptureRecord = z.infer<typeof Capture>;
export type SnapshotRecord = z.infer<typeof SubmissionSnapshot>;
export type AttemptRecord = z.infer<typeof Attempt>;
export type FeedbackRecord = z.infer<typeof FeedbackSource>;
export type ConcernRecord = z.infer<typeof Concern>;
export type ActionRecord = z.infer<typeof RevisionAction>;
export type ResponseRecord = z.infer<typeof ConcernResponse>;
export type ConflictRecord = z.infer<typeof Conflict>;
export type PacketRecord = z.infer<typeof ResponsePacket>;
export type CitationRecord = z.infer<typeof Citation>;
export type EvidenceRecord = z.infer<typeof EvidenceLink>;
export type RevisionRecord = z.infer<typeof RevisionLink>;
export const emptyResubmissions = (): Resubmissions => ({ captures: [], snapshots: [], attempts: [], feedback: [], concerns: [], actions: [], responses: [], conflicts: [], packets: [], receipts: [] });

export const ResubmissionCommandSchema = z.discriminatedUnion("type", [
  z.object({ type: z.literal("createSubmissionCapture"), projectId: id, originalApplicationId: id.nullable(), method: z.enum(["saved-drafts", "pasted"]), supersedesId: id.nullable(), correctionReason: note }).strict(),
  z.object({ type: z.literal("saveCaptureSection"), captureId: id, captureRevision: revision, sectionId: id, label: label.min(1), text, savedRevisionId: id.nullable() }).strict(),
  z.object({ type: z.literal("freezeSubmissionSnapshot"), captureId: id, captureRevision: revision, coverage: Coverage, attestation: Attestation, operationId: id }).strict(),
  z.object({ type: z.literal("createResubmissionAttempt"), snapshotId: id, targetCallId: id, priorAttemptId: id.nullable(), profile: z.enum(["general", "nsf-resubmission-preparation"]), mode: z.enum(["blank", "reviewed-copy"]), targetTemplateId:z.enum(["same-as-original","captured-sections","legacy-three-section","nsf-standard-research"]).optional(), mappings: z.array(SectionMapping).max(100), confirmCopy: z.boolean(), operationId: id }).strict(),
  z.object({ type: z.literal("saveFeedbackSource"), attemptId: id, sourceId: id.optional(), label: label.min(1), kind: FeedbackSource.shape.kind, url: FeedbackSource.shape.url, text: text.min(1) }).strict(),
  z.object({ type: z.literal("reviewFeedbackCoverage"), sourceId: id, version: revision, hash: z.string(), decisions: z.array(CoverageDecision).max(500), by: z.string().min(1).max(100) }).strict(),
  z.object({ type: z.literal("saveConcern"), attemptId: id, concernId: id.optional(), concernRevision: revision.optional(), fields: ConcernFields, status: z.enum(["suggested", "accepted"]) }).strict(),
  z.object({ type: z.literal("decideConcernSuggestion"), concernId: id, concernRevision: revision, decision: z.enum(["accept", "dismiss"]), reason: note.min(5) }).strict(),
  z.object({ type: z.literal("acceptConcernPreview"), attemptId:id, previewToken:id, decisions:z.array(z.object({candidateId:id,decision:z.enum(["accept","dismiss"]),fields:ConcernFields,reason:note.min(5)}).strict()).min(1).max(15) }).strict(),
  z.object({ type: z.literal("splitConcern"), concernId: id, concernRevision: revision, children: z.array(ConcernFields).min(2).max(10), reason: note.min(5) }).strict(),
  z.object({ type: z.literal("mergeConcerns"), attemptId: id, concernIds: z.array(id).min(2).max(20), interpretation: z.string().max(1000), reason: note.min(5) }).strict(),
  z.object({ type: z.literal("recordConflictDecision"), attemptId: id, conflictId: id.optional(), concernIds: z.array(id).min(2).max(100), rationale: note, callConstraint: note, by: z.string().max(100) }).strict(),
  z.object({ type: z.literal("saveRevisionAction"), attemptId: id, actionId: id.optional(), actionRevision: revision.optional(), fields: ActionFields }).strict(),
  z.object({ type: z.literal("recordActionOutcome"), actionId: id, actionRevision: revision, result: note.min(1), resultClassification: ActionFields.shape.resultClassification, evidence: z.array(EvidenceLink).max(10), revisions: z.array(RevisionLink).max(10), by: z.string().min(1).max(100) }).strict(),
  z.object({ type: z.literal("saveConcernResponse"), concernId: id, text, citations: z.array(Citation).max(50), missingInputs: z.array(label).max(30), previewToken: id.optional() }).strict(),
  z.object({ type: z.literal("requestConcernReview"), concernId: id }).strict(),
  z.object({ type: z.literal("recordConcernCompletion"), concernId: id, responseRevisionId: id, expectedFingerprint: digest, kind: Completion.shape.kind, reason: note.min(5), by: z.string().min(1).max(100) }).strict(),
  z.object({ type: z.literal("confirmAttemptContext"), attemptId: id, context: ContextDecision }).strict(),
  z.object({ type: z.literal("reviewAttempt"), attemptId: id, expectedFingerprint: digest, by: z.string().min(1).max(100) }).strict(),
  z.object({ type: z.literal("archiveAttempt"), attemptId: id, reason: note.min(5) }).strict(),
  z.object({ type: z.literal("saveResponseDocument"), attemptId: id, concernOrder: z.array(id).max(200), opening: text, closing: text, reviewFingerprint: digest.optional(), by: z.string().max(100) }).strict(),
  z.object({ type: z.literal("saveResponsePacket"), attemptId: id, concernIds: z.array(id).max(100), includeOriginal: z.boolean(), includeTarget: z.boolean(), operationId: id }).strict(),
]);
export type ResubmissionCommand = z.infer<typeof ResubmissionCommandSchema>;
