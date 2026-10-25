import { z } from "zod";
import { TermsPayloadSchema, MoneyFactV1Schema, OriginPayloadSchema, AwardItemSchema, ProgressRevisionSchema,
  FactualBlockSchema, SECTION_KEYS, ReportContextSchema, CompletionSchema } from "./schema";

const id = z.string().min(1).max(100).regex(/^[a-zA-Z0-9_-]+$/);
const actor = z.string().trim().min(1).max(500);
const reason = z.string().trim().min(1).max(500);
const award = { awardId: id, expectedAwardRevision: z.number().int().positive() };
const attributed = { actor, reason };
const head = { ...award, expectedHeadId: id };
export const OriginSelectionSchema = z.object({
  draftIds: z.array(id).max(30), proposedMoneyFacts: z.array(MoneyFactV1Schema).max(20), packetId: id.nullable(),
  submissionEvidence: OriginPayloadSchema.shape.submissionEvidence,
}).strict();
const itemInput = AwardItemSchema.shape.revisions.element.omit({ id: true, ordinal: true, actor: true, at: true });
const progressInput = z.object(ProgressRevisionSchema.shape).omit({ id: true, ordinal: true, author: true, at: true }).strict();
const reportContextInput = ReportContextSchema.omit({ asOfDate: true });
export const AwardCommandSchema = z.discriminatedUnion("type", [
  z.object({ type: z.literal("confirmInitialAward"), applicationId: id, expectedApplicationRevision: z.number().int().positive(),
    expectedProjectRevision: z.number().int().positive(), payload: TermsPayloadSchema, originSelection: OriginSelectionSchema,
    selectInitialCurrent: z.literal(true), transcriptionConfirmed: z.literal(true), ...attributed }).strict(),
  z.object({ type: z.literal("saveAwardChangeCandidate"), ...head, payload: TermsPayloadSchema,
    supersedesCandidateId: id.nullable(), ...attributed }).strict(),
  z.object({ type: z.literal("reviewAwardChange"), ...head, candidateId: id,
    decision: z.enum(["confirmed", "rejected", "withdrawn"]), sameAwardConfirmed: z.boolean(), ...attributed }).strict(),
  z.object({ type: z.literal("selectCurrentAwardTerms"), ...head, termsVersionId: id,
    applicabilityConfirmed: z.literal(true), retroactivePeriodsReviewed: z.boolean(), ...attributed }).strict(),
  z.object({ type: z.literal("saveAwardObligation"), ...award, itemId: id.nullable(), expectedItemRevisionId: id.nullable(), input: itemInput, ...attributed }).strict(),
  z.object({ type: z.literal("saveAwardMilestone"), ...award, itemId: id.nullable(), expectedItemRevisionId: id.nullable(), input: itemInput, ...attributed }).strict(),
  z.object({ type: z.literal("reviewAwardObligation"), ...award, itemId: id, expectedItemRevisionId: id, ...attributed }).strict(),
  z.object({ type: z.literal("recordAwardCompletion"), ...award,
    input: CompletionSchema.omit({ id: true, awardId: true, actor: true, at: true }), ...attributed }).strict(),
  z.object({ type: z.literal("saveAwardProgress"), ...award, updateId: id.nullable(), expectedProgressRevisionId: id.nullable(),
    input: progressInput, ...attributed }).strict(),
  z.object({ type: z.literal("saveAnnualReport"), ...award, reportId: id.nullable(), expectedReportRevisionId: id.nullable(),
    context: reportContextInput, sections: z.array(z.object({ sectionKey: z.enum(SECTION_KEYS),
      blocks: z.array(FactualBlockSchema).max(100), mode: z.enum(["manual", "deterministic"]) }).strict()).length(6), ...attributed }).strict(),
  z.object({ type: z.literal("reviewAnnualSection"), ...award, reportId: id, reportRevisionId: id, sectionRevisionId: id,
    decision: z.enum(["reviewed", "nothing_to_report_confirmed"]), ...attributed }).strict(),
  z.object({ type: z.literal("freezeAnnualReport"), ...award, reportId: id, reportRevisionId: id, ...attributed }).strict(),
  z.object({ type: z.literal("archiveAward"), ...award, ...attributed }).strict(),
]);
export const AwardMutationSchema = z.object({ operationId: id, expectedRevision: z.number().int().nonnegative(), command: AwardCommandSchema }).strict();
export type AwardCommand = z.infer<typeof AwardCommandSchema>;
export type AwardMutation = z.infer<typeof AwardMutationSchema>;
export const isAwardCommand = (value: { type: string }) => ["confirmInitialAward", "saveAwardChangeCandidate", "reviewAwardChange", "selectCurrentAwardTerms", "saveAwardObligation", "saveAwardMilestone", "reviewAwardObligation", "recordAwardCompletion", "saveAwardProgress", "saveAnnualReport", "reviewAnnualSection", "freezeAnnualReport", "archiveAward"].includes(value.type);
