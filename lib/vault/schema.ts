import { z } from "zod";
const id = z
  .string()
  .min(1)
  .max(100)
  .regex(/^[a-zA-Z0-9_-]+$/);
const label = z.string().max(500);
const note = z.string().max(3000);
const hash = z.string().regex(/^[a-f0-9]{64}$/);
export const PhaseSchema = z.enum([
  "application",
  "pre-award",
  "before-research",
  "specific-date",
  "unknown",
]);
export type Phase = z.infer<typeof PhaseSchema>;
export const RequirementVaultSchema = z.object({
  delivery: z.enum([
    "file-upload",
    "portal-text",
    "external-record",
    "task",
    "unknown",
  ]),
  phase: PhaseSchema,
  requiredDate: z.iso.date().nullable(),
  allowedMime: z.array(label).max(4),
  maxBytes: z.number().int().positive().max(10_000_000).nullable(),
  maxPages: z.number().int().positive().max(100).nullable(),
  manualRules: note,
  ethicsRecordId: id.nullable(),
  settingsSource: note,
  officialUrl: z
    .string()
    .max(2000)
    .refine((v) => {
      if (!v) return true;
      try {
        return ["https:", "http:"].includes(new URL(v).protocol);
      } catch {
        return false;
      }
    }),
  checkedDate: z.iso.date().nullable(),
});
export const FileOriginSchema = z.object({
  documentId: id,
  documentVersionId: id,
  parseAttemptId: id,
  artifactSha256: hash,
  start: z.number().int().nonnegative(),
  end: z.number().int().positive(),
  reviewedHeadId: id,
  reviewedBy: label.min(1),
  reviewedAt: z.string(),
  reason: note,
  manualEdit: z.boolean().default(false),
});
export const DocumentSchema = z.object({
  id,
  projectId: id,
  title: label.min(1),
  category: label.min(1),
  owner: label,
  tags: z.array(z.string().max(80)).max(20),
  provenance: z.enum(["demo", "researcher"]),
  archivedAt: z.string().nullable(),
  versionIds: z.array(id).max(20),
  createdAt: z.string(),
});
export const DocumentVersionSchema = z.object({
  id,
  documentId: id,
  version: z.number().int().positive(),
  filename: z.string().max(255),
  mime: label,
  bytes: z.number().int().positive().max(10_000_000),
  sha256: hash,
  createdAt: z.string(),
  documentDate: z.iso.date().nullable(),
  integrity: z
    .enum(["unchecked", "available", "missing", "corrupt"])
    .default("unchecked"),
});
export const SegmentSchema = z.object({
  start: z.number().int().nonnegative(),
  end: z.number().int().nonnegative(),
  page: z.number().int().positive().optional(),
  section: label.optional(),
});
export const ParseAttemptSchema = z.object({
  id,
  documentVersionId: id,
  parser: label,
  status: z.enum([
    "pending",
    "running",
    "parsed",
    "partial",
    "no-text",
    "failed",
    "limit-exceeded",
    "retryable",
  ]),
  warnings: z.array(label).max(100),
  artifactSha256: hash.nullable(),
  textLength: z.number().int().nonnegative(),
  segments: z.array(SegmentSchema).max(10000),
  pages: z.number().int().positive().nullable(),
  startedAt: z.string(),
  finishedAt: z.string().nullable(),
  durationMs: z.number().nonnegative().optional(),
  peakMemoryBytes: z.number().nonnegative().optional(),
});
export const AttachmentSelectionSchema = z.object({
  id,
  applicationId: id,
  requirementId: id,
  documentVersionId: id,
  selectedAt: z.string(),
  review: z
    .object({
      decision: z.enum(["accepted", "rejected"]),
      readable: z.boolean(),
      relevant: z.boolean(),
      manualRulesChecked: z.boolean(),
      reason: note,
      by: label.min(1),
      at: z.string(),
      fingerprint: z.string(),
      reviewedHeadId: id,
    })
    .nullable(),
});
export const EthicsRevisionSchema = z.object({
  revision: z.number().int().positive(),
  scope: note.min(1),
  institution: label,
  reference: label,
  category: z.enum([
    "IRB",
    "animal-study",
    "data-use",
    "training",
    "conflict-of-interest",
    "other",
  ]),
  status: z.enum([
    "unknown",
    "pending",
    "approved",
    "exempt",
    "not-applicable",
    "expired",
    "withdrawn",
  ]),
  basis: note,
  phase: PhaseSchema,
  requiredDate: z.iso.date().nullable(),
  approvalDate: z.iso.date().nullable(),
  expiry: z.discriminatedUnion("kind", [
    z.object({ kind: z.literal("date"), date: z.iso.date() }),
    z.object({ kind: z.literal("no-expiry") }),
    z.object({ kind: z.literal("unknown") }),
  ]),
  supportingVersionIds: z.array(id).max(20),
  at: z.string(),
  confirmation: z
    .object({ by: label.min(1), at: z.string(), fingerprint: z.string() })
    .nullable(),
});
export const EthicsRecordSchema = z.object({
  id,
  projectId: id,
  revisions: z.array(EthicsRevisionSchema).min(1),
});
export const EthicsTaskSchema = z.object({
  id,
  recordId: id,
  revision: z.number().int(),
  kind: z.enum(["review", "expiry"]),
  title: label,
  date: z.iso.date().nullable(),
  active: z.boolean(),
  at: z.string(),
});
export const HandoffSchema = z.object({
  id,
  applicationId: id,
  projectId: id,
  applicationRevision: z.number().int(),
  projectRevision: z.number().int(),
  callRevision: z.number().int(),
  callSourceVersion: z.number().int(),
  phase: PhaseSchema,
  createdAt: z.string(),
  rulesVersion: label,
  requirements: z.array(z.unknown()),
  files: z.array(
    z.object({
      requirementId: id,
      documentId: id,
      documentVersionId: id,
      sha256: hash,
      filename: label,
      transferFilename: label,
      mime: label,
      bytes: z.number().int(),
      issues: z.array(label),
    }),
  ),
  answers: z.array(
    z.object({
      requirementId: id.optional(),
      sectionKey: id,
      label: label,
      revisionId: id,
      text: z.string().max(20000),
      wordLimit: z.number().nullable(),
      evidence: z.array(z.unknown()),
    }),
  ),
  warnings: z.array(z.string().max(3000)),
  ethics: z.array(EthicsRecordSchema),
  futureTasks: z.array(EthicsTaskSchema),
});
export const ReceiptSchema = z.object({
  key: id,
  kind: z.enum(["upload", "parse", "handoff"]),
  fingerprint: hash,
  resourceId: id,
  createdAt: z.string(),
});
export const VaultCollections = {
  documents: z.array(DocumentSchema).default([]),
  documentVersions: z.array(DocumentVersionSchema).default([]),
  parseAttempts: z.array(ParseAttemptSchema).default([]),
  attachmentSelections: z.array(AttachmentSelectionSchema).default([]),
  ethicsRecords: z.array(EthicsRecordSchema).default([]),
  ethicsTasks: z.array(EthicsTaskSchema).default([]),
  handoffs: z.array(HandoffSchema).default([]),
  operationReceipts: z.array(ReceiptSchema).default([]),
};
export const VaultCommandOptions = [
  z.object({
    type: z.literal("editDocumentMetadata"),
    documentId: id,
    title: label.min(1),
    category: label.min(1),
    owner: label,
    tags: z.array(z.string().max(80)).max(20),
  }),
  z.object({
    type: z.literal("archiveDocument"),
    documentId: id,
    archived: z.boolean(),
  }),
  z.object({
    type: z.literal("selectAttachment"),
    applicationId: id,
    requirementId: id,
    documentVersionId: id,
  }),
  z.object({
    type: z.literal("reviewAttachment"),
    applicationId: id,
    selectionId: id,
    decision: z.enum(["accepted", "rejected"]),
    readable: z.boolean(),
    relevant: z.boolean(),
    manualRulesChecked: z.boolean(),
    by: label.min(1),
    reason: note.min(5),
  }),
  z.object({
    type: z.literal("promoteFileExcerpt"),
    projectId: id,
    documentVersionId: id,
    parseAttemptId: id,
    start: z.number().int().nonnegative(),
    end: z.number().int().positive(),
    title: label.min(1),
    sourceId: id.optional(),
    by: label.min(1),
    reason: note.min(5),
  }),
  z.object({
    type: z.literal("saveEthicsRecord"),
    id: id.optional(),
    projectId: id,
    record: EthicsRevisionSchema.omit({
      revision: true,
      at: true,
      confirmation: true,
    }),
  }),
  z.object({
    type: z.literal("confirmEthicsRecord"),
    recordId: id,
    by: label.min(1),
  }),
] as const;
export const UploadMetadataSchema = z
  .object({
    projectId: id,
    documentId: id.optional(),
    filename: z.string().min(1).max(255),
    claimedMime: label,
    title: label.min(1),
    category: label.min(1),
    owner: label,
    expectedRevision: z.number().int().nonnegative(),
    idempotencyKey: id,
  })
  .strict();
export type UploadMetadata = z.infer<typeof UploadMetadataSchema>;
export type DocumentVersion = z.infer<typeof DocumentVersionSchema>;
export type ParseAttempt = z.infer<typeof ParseAttemptSchema>;
export type Handoff = z.infer<typeof HandoffSchema>;
