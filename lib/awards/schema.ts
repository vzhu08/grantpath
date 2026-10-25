import { z } from "zod";
import { SubmissionSnapshot } from "../resubmissions/schema";

// Independent of lib/schema: the workspace schema can safely compose this namespace.
const id = z.string().min(1).max(100).regex(/^[a-zA-Z0-9_-]+$/);
const short = z.string().max(500);
const required = short.trim().min(1);
const narrative = z.string().max(5_000);
const date = z.iso.date();
const at = z.iso.datetime({ offset: true });
const digest = z.string().regex(/^[a-f0-9]{64}$/);
export const AwardCitationSchema = z.object({
  sourceId: id, version: z.number().int().positive(), hash: required,
  quote: z.string().min(1).max(20_000), start: z.number().int().nonnegative(),
  end: z.number().int().positive(),
}).strict().refine(c => c.end > c.start && c.end - c.start === c.quote.length, "Quote offsets must use normalized UTF-16 text.");
export const SourceVersionRefSchema = z.object({
  sourceId: id, version: z.number().int().positive(), hash: required, role: required,
}).strict();
const citations = z.array(AwardCitationSchema).max(20);
export const FrozenSourceSchema = SourceVersionRefSchema.extend({
  projectId: id.nullable(), title: required, provenance: z.enum(["demo", "researcher"]),
  text: z.string().max(20_000),
}).strict();
const attribution = { confirmedBy: required, confirmedAt: at };
export const MoneyFactV1Schema = z.object({
  id, basis: z.enum(["proposal_requested", "current_action", "obligated_cumulative", "anticipated_total"]),
  value: z.discriminatedUnion("state", [
    z.object({ state: z.literal("unknown"), raw: z.string().max(5_000), reason: required }).strict(),
    z.object({ state: z.literal("known"), currency: z.literal("USD"), scale: z.literal(2),
      minorUnits: z.string().regex(/^(?:0|-?[1-9]\d{0,17})$/) }).strict(),
  ]), evidence: citations, periodId: id.nullable(), ...attribution,
}).strict().superRefine((f, ctx) => {
  if (f.value.state === "known" && (!f.evidence.length || (f.value.minorUnits.startsWith("-") && f.basis !== "current_action")))
    ctx.addIssue({ code: "custom", message: "Known money needs exact evidence; only current action may be negative." });
  if (f.value.state === "known" && !f.evidence.some(c => /\b(?:USD|U\.S\. dollars|United States dollars)\b/i.test(c.quote)))
    ctx.addIssue({ code: "custom", message: "Known USD requires explicit currency in its quoted support; a dollar sign alone is insufficient." });
});
export const BudgetPeriodRefSchema = z.object({
  id, label: required, start: date, end: date, evidence: citations.min(1), supersedesPeriodId: id.nullable(),
}).strict().refine(p => p.start <= p.end, "Period end must follow start.");
export const FrozenOriginRefSchema = z.object({ id, digest }).strict();
export const GoalSchema = z.object({
  goalId: id, text: narrative.min(1), citations: citations.min(1),
  incorporationRef: AwardCitationSchema.nullable(), predecessorGoalIds: z.array(id).max(50),
}).strict();
export const FIELD_NAMES = ["identity", "awardPeriod", "budgetPeriods", "goals", "fundingFacts", "approvedBudgetRefs", "policies", "sponsorLifecycle"] as const;
const fieldEvidence = z.discriminatedUnion("mode", [
  z.object({ mode: z.literal("new"), citations: citations.min(1) }).strict(),
  z.object({ mode: z.literal("carry_forward"), termsVersionId: id, field: z.enum(FIELD_NAMES) }).strict(),
  z.object({ mode: z.literal("unknown"), reason: required }).strict(),
]);
export const TermsPayloadSchema = z.object({
  sponsorActionId: id,
  changeKind: z.enum(["initial", "numbered_amendment", "documented_administrative_change", "transcription_correction"]),
  sponsorIdentifier: short.nullable(), absenceReason: short,
  issueDate: date.nullable(), effectiveDate: date.nullable(), dateEvidence: citations,
  identity: z.object({ sponsor: z.literal("NSF"), instrument: z.literal("standard_grant"),
    sponsorAwardNumber: required, recipientName: required, evidence: citations.min(1) }).strict(),
  awardPeriod: z.object({ start: date, end: date, evidence: citations.min(1) }).strict().refine(p => p.start <= p.end).nullable(),
  budgetPeriods: z.array(BudgetPeriodRefSchema).max(20), goals: z.array(GoalSchema).max(50),
  fundingFacts: z.array(MoneyFactV1Schema).max(60), approvedBudgetRefs: z.array(SourceVersionRefSchema).max(20),
  policies: z.array(z.object({ label: required, evidence: citations.min(1), coverageNote: narrative }).strict()).max(20),
  sponsorLifecycle: z.object({ value: z.enum(["unknown", "active", "suspended", "terminated", "closed"]), evidence: citations }).strict(),
  fieldEvidence: z.object(Object.fromEntries(FIELD_NAMES.map(k => [k, fieldEvidence])) as Record<typeof FIELD_NAMES[number], typeof fieldEvidence>).strict(),
  sourceRefs: z.array(SourceVersionRefSchema).min(1).max(40),
  historicalSourceReviews: z.array(z.object({ sourceId: id, version: z.number().int().positive(), latestVersion: z.number().int().positive(), reason: required, actor: required }).strict()).max(40),
  unresolved: z.array(required).max(100),
}).strict().superRefine((t, ctx) => {
  if (!t.sponsorIdentifier && !t.absenceReason.trim()) ctx.addIssue({ code: "custom", message: "Record the sponsor action identifier or why none exists." });
  if (t.fundingFacts.some(f => f.basis === "proposal_requested")) ctx.addIssue({ code: "custom", message: "Requested money belongs only to the frozen proposal origin." });
  if (t.sponsorLifecycle.value !== "unknown" && !t.sponsorLifecycle.evidence.length) ctx.addIssue({ code: "custom", message: "Sponsor status requires evidence." });
  if ((t.issueDate || t.effectiveDate) && !t.dateEvidence.length) ctx.addIssue({ code: "custom", message: "Known notice dates require evidence." });
});
export const TermsVersionSchema = z.object({
  id, awardId: id, ordinal: z.number().int().positive(), baseTermsVersionId: id.nullable(),
  candidateId: id.nullable(), payload: TermsPayloadSchema, digest, ...attribution, note: required,
}).strict();
export const OriginPayloadSchema = z.object({
  version: z.literal("award-origin-v1"), applicationId: id, projectId: id,
  applicationRevision: z.number().int().positive(), projectRevision: z.number().int().positive(),
  applicationCycleId: id, originAttemptId: id.nullable(), submittedSnapshot: SubmissionSnapshot.nullable(),
  callId: id, callRevision: z.number().int().positive(), callSourceRef: SourceVersionRefSchema,
  capturedAt: at, provenance: z.enum(["demo", "researcher"]),
  sections: z.array(z.object({ key: required, draftId: id, revision: z.number().int().positive(), text: z.string().max(60_000), citations: z.array(AwardCitationSchema).max(50) }).strict()).max(30),
  proposedMoneyFacts: z.array(MoneyFactV1Schema).max(20),
  packet: z.object({ id, digest, attemptId: id.nullable() }).strict().nullable(),
  submissionEvidence: z.discriminatedUnion("state", [
    z.object({ state: z.literal("unknown") }).strict(),
    z.object({ state: z.literal("human_assertion"), evidence: citations.min(1), actor: required, at }).strict(),
    z.object({ state: z.literal("human_attested_snapshot"), snapshotId: id, digest, actor: required, at }).strict(),
  ]), sources: z.array(FrozenSourceSchema).max(60),
}).strict().refine(p => p.proposedMoneyFacts.every(f => f.basis === "proposal_requested"), "Origin money must be proposal_requested.");
export const OriginSnapshotSchema = z.object({ id, digest, payload: OriginPayloadSchema }).strict();
export const AwardRecordSchema = z.object({
  id, applicationId: id, projectId: id, provenance: z.enum(["demo", "researcher"]),
  localState: z.enum(["recorded", "archived"]), originContext: FrozenOriginRefSchema,
  currentConfirmedTermsVersionId: id, revision: z.number().int().positive(), createdAt: at, updatedAt: at,
}).strict();
export const ChangeCandidateSchema = z.object({
  id, awardId: id, baseTermsVersionId: id, supersedesCandidateId: id.nullable(),
  payload: TermsPayloadSchema, createdAt: at, createdBy: required,
  decision: z.enum(["proposed", "confirmed", "rejected", "withdrawn"]),
  termsVersionId: id.nullable(),
}).strict();
export const AwardDateSchema = z.discriminatedUnion("kind", [
  z.object({ kind: z.literal("unknown"), raw: short, reason: short }).strict(),
  z.object({ kind: z.literal("date"), raw: short, date, confirmed: z.literal(true) }).strict(),
  z.object({ kind: z.literal("exact"), raw: short, at,
    zone: z.string().regex(/^(UTC|[+-](?:0\d|1[0-3]):[0-5]\d|[+-]14:00)$/), confirmed: z.literal(true) }).strict()
    .refine(d => d.at.endsWith(d.zone === "UTC" ? "Z" : d.zone)),
]);
const itemRevision = z.object({
  id, ordinal: z.number().int().positive(), termsVersionId: id, title: required, description: narrative,
  responsibility: short, deadline: AwardDateSchema, evidence: citations,
  origin: z.enum(["sponsor", "internal"]), review: z.enum(["proposed", "confirmed"]),
  applicable: z.boolean(), supersedesItemId: id.nullable(), goalId: id.nullable(),
  derivation: z.object({ rule: z.literal("period_end_minus_90_calendar_days"), periodId: id,
    periodStart: date, periodEnd: date, proposedDate: date, evidence: citations.min(1), confirmed: z.boolean() }).strict().nullable(),
  actor: required, at,
}).strict();
export const AwardItemSchema = z.object({
  id, awardId: id, kind: z.enum(["obligation", "milestone"]), revisions: z.array(itemRevision).min(1),
}).strict();
export const ProgressRevisionSchema = z.object({
  id, ordinal: z.number().int().positive(), termsVersionId: id,
  goalIds: z.array(id).max(50), itemIds: z.array(id).max(50),
  startDate: date.nullable(), endDate: date.nullable(), observedDate: date.nullable(),
  state: z.enum(["in_progress", "completed", "delayed", "not_started", "no_update"]),
  finding: z.enum(["positive", "negative", "inconclusive", "none_reported"]),
  factualText: narrative, delayReason: narrative, recoveryPlan: narrative, nextPlan: narrative,
  evidence: citations, evidenceKind: z.enum(["artifact", "researcher_log", "other"]),
  author: required, at, correctionReason: short,
  allocation: z.object({ periodId: id, text: narrative.min(1), reason: required, actor: required, at }).strict().nullable(),
}).strict().refine(p => !p.startDate || !p.endDate || p.startDate <= p.endDate);
export const ProgressUpdateSchema = z.object({ id, awardId: id, revisions: z.array(ProgressRevisionSchema).min(1) }).strict();
export const SECTION_KEYS = ["accomplishments", "products", "participants", "impact", "changes", "special"] as const;
export const SupportRefSchema = z.discriminatedUnion("kind", [
  z.object({ kind: z.literal("approved_goal"), awardId: id, termsVersionId: id, goalId: id }).strict(),
  z.object({ kind: z.literal("progress_update"), awardId: id, updateId: id, revisionId: id }).strict(),
  z.object({ kind: z.literal("source_quote"), citation: AwardCitationSchema }).strict(),
  z.object({ kind: z.literal("missing"), reason: required }).strict(),
]);
export const FactualBlockSchema = z.object({
  blockId: id, text: z.string().min(1).max(10_000),
  claimKind: z.enum(["approved_goal", "actual_activity", "actual_result", "delay", "future_plan", "context"]),
  supportRefs: z.array(SupportRefSchema).min(1).max(30),
}).strict();
export const SectionRevisionSchema = z.object({
  id, reportId: id, sectionKey: z.enum(SECTION_KEYS), text: z.string().max(10_000),
  blocks: z.array(FactualBlockSchema).max(100), mode: z.enum(["manual", "deterministic"]), createdAt: at,
}).strict().refine(s => s.text === s.blocks.map(b => b.text).join("\n\n"), "Section text must equal its ordered blocks.");
export const ReportContextSchema = z.object({
  termsVersionId: id, termsDigest: digest, periodId: id, periodStart: date, periodEnd: date,
  evidenceThrough: date, asOfDate: date,
  progressRefs: z.array(z.object({ updateId: id, revisionId: id }).strict()).max(100),
  sourceRefs: z.array(SourceVersionRefSchema).max(60),
  historicalSourceReviews: z.array(z.object({ sourceId: id, version: z.number().int().positive(),
    latestVersion: z.number().int().positive(), reason: required, actor: required }).strict()).max(60),
}).strict();
export const AwardTemplateMetadataSchema = z.object({ id: required, version: z.number().int().positive(), checkedDate: date,
  scopeNote: narrative, coverageLimits: z.array(required).max(20), policyUrls: z.array(z.string().url()).max(20) }).strict();
export const ReportRevisionSchema = z.object({
  id, reportId: id, ordinal: z.number().int().positive(), templateId: z.literal("nsf-annual-narrative-v1"),
  templateVersion: z.literal(1), policyMetadata: AwardTemplateMetadataSchema, context: ReportContextSchema,
  sectionRevisionIds: z.array(id).length(6), unresolved: z.array(required).max(500),
  digest, createdAt: at,
}).strict();
export const ReportSchema = z.object({ id, awardId: id, revisions: z.array(ReportRevisionSchema).min(1) }).strict();
export const SectionReviewSchema = z.object({
  id, reportId: id, reportRevisionId: id, sectionRevisionId: id, fingerprint: digest,
  decision: z.enum(["reviewed", "nothing_to_report_confirmed"]), actor: required, at, reason: required,
}).strict();
export const CompletionSchema = z.object({
  id, awardId: id, itemId: id, itemRevisionId: id, actualDate: date,
  status: z.enum(["completed", "in_progress", "no_update"]), evidence: citations,
  actor: required, at, note: narrative,
}).strict();
export const AwardEventSchema = z.object({
  id, awardId: id, type: required, targetId: id, actor: required, at, reason: required,
}).strict();
export const ReportSnapshotPayloadSchema = z.object({
  version: z.literal("award-report-snapshot-v1"), canonicalVersion: z.literal("sorted-json-utf8-v1"),
  award: AwardRecordSchema, origin: OriginSnapshotSchema, terms: z.array(TermsVersionSchema).min(1).max(20),
  changeCandidates: z.array(ChangeCandidateSchema).max(20), events: z.array(AwardEventSchema).max(1000),
  reportRevision: ReportRevisionSchema, sections: z.array(SectionRevisionSchema).length(6),
  reviews: z.array(SectionReviewSchema).length(6), updates: z.array(ProgressUpdateSchema).max(100),
  items: z.array(AwardItemSchema).max(150), sources: z.array(FrozenSourceSchema).max(80),
  template: AwardTemplateMetadataSchema,
  unresolved: z.array(required).max(500), reviewActor: required, reviewedAt: at, note: required,
}).strict();
export const ReportSnapshotSchema = z.object({
  id, reportId: id, awardId: id, reportRevisionId: id, digest,
  payload: ReportSnapshotPayloadSchema,
}).strict();
export const AwardReceiptSchema = z.object({
  operationId: id, payloadHash: digest, awardId: id, resultIds: z.array(id).max(10), at,
}).strict();
export const AwardsStateSchema = z.object({
  contractVersion: z.literal("award-contract-v1"), records: z.array(AwardRecordSchema),
  originSnapshots: z.array(OriginSnapshotSchema), termsVersions: z.array(TermsVersionSchema),
  changeCandidates: z.array(ChangeCandidateSchema), obligations: z.array(AwardItemSchema), milestones: z.array(AwardItemSchema),
  completions: z.array(CompletionSchema), progressUpdates: z.array(ProgressUpdateSchema), reports: z.array(ReportSchema),
  sectionRevisions: z.array(SectionRevisionSchema), sectionReviews: z.array(SectionReviewSchema),
  reportSnapshots: z.array(ReportSnapshotSchema), events: z.array(AwardEventSchema), receipts: z.array(AwardReceiptSchema),
}).strict();
export const emptyAwards = (): AwardsState => ({ contractVersion: "award-contract-v1", records: [], originSnapshots: [], termsVersions: [],
  changeCandidates: [], obligations: [], milestones: [], completions: [], progressUpdates: [], reports: [], sectionRevisions: [],
  sectionReviews: [], reportSnapshots: [], events: [], receipts: [] });
export type AwardCitation = z.infer<typeof AwardCitationSchema>;
export type SourceVersionRef = z.infer<typeof SourceVersionRefSchema>;
export type FrozenSource = z.infer<typeof FrozenSourceSchema>;
export type MoneyFactV1 = z.infer<typeof MoneyFactV1Schema>;
export type BudgetPeriodRef = z.infer<typeof BudgetPeriodRefSchema>;
export type FrozenOriginRef = z.infer<typeof FrozenOriginRefSchema>;
export type TermsPayload = z.infer<typeof TermsPayloadSchema>;
export type AwardTermsVersion = z.infer<typeof TermsVersionSchema>;
export type AwardRecord = z.infer<typeof AwardRecordSchema>;
export type OriginPayload = z.infer<typeof OriginPayloadSchema>;
export type AwardsState = z.infer<typeof AwardsStateSchema>;
export type ProgressRevision = z.infer<typeof ProgressRevisionSchema>;
export type ReportContext = z.infer<typeof ReportContextSchema>;
export type FactualBlock = z.infer<typeof FactualBlockSchema>;
export type SectionRevision = z.infer<typeof SectionRevisionSchema>;
export type AnnualReportRevision = z.infer<typeof ReportRevisionSchema>;
export type ReportSnapshot = z.infer<typeof ReportSnapshotSchema>;
export type AwardItem = z.infer<typeof AwardItemSchema>;
export type SectionKey = typeof SECTION_KEYS[number];
export type AwardFinanceContextV1 = {
  contractVersion: "award-contract-v1"; awardId: string; applicationId: string; projectId: string;
  currentConfirmedTermsVersionId: string; currentTermsDigest: string;
  sponsorLifecycle: TermsPayload["sponsorLifecycle"]["value"];
  awardPeriod: { start: string; end: string } | null; budgetPeriods: readonly BudgetPeriodRef[];
  proposedContextRef: FrozenOriginRef; fundingFacts: readonly MoneyFactV1[];
  approvedBudgetRefs: readonly SourceVersionRef[]; unresolved: readonly string[]; confirmedBy: string; confirmedAt: string;
};
