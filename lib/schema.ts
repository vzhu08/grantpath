import { z } from "zod";

export const Id = z
  .string()
  .min(1)
  .max(100)
  .regex(/^[a-zA-Z0-9_-]+$/);
export const Provenance = z.enum(["demo", "researcher"]);
const text = z.string().max(20_000);
const short = z.string().max(500);
export const SafeUrl = z
  .string()
  .max(2000)
  .refine((value) => {
    if (!value) return true;
    try {
      return ["https:", "http:"].includes(new URL(value).protocol);
    } catch {
      return false;
    }
  }, "Use an http:// or https:// URL, or leave blank.");
export const DeadlineSchema = z.discriminatedUnion("kind", [
  z.object({ kind: z.literal("unknown"), raw: short, reason: short }),
  z.object({
    kind: z.literal("date"),
    raw: short,
    date: z.iso.date(),
    confirmed: z.literal(true),
  }),
  z
    .object({
      kind: z.literal("exact"),
      raw: short,
      at: z.iso.datetime({ offset: true }),
      zone: z.string().regex(/^(UTC|[+-](?:0\d|1[0-3]):[0-5]\d|[+-]14:00)$/),
      confirmed: z.literal(true),
    })
    .refine(
      (d) => d.at.endsWith(d.zone === "UTC" ? "Z" : d.zone),
      "The timestamp offset must match the confirmed source timezone.",
    ),
]);
export type Deadline = z.infer<typeof DeadlineSchema>;
export const unknownDeadline = (
  raw = "",
  reason = "Confirm the sponsor deadline and cutoff timezone.",
): Deadline => ({ kind: "unknown", raw, reason });
export const ProfileSchema = z
  .object({
    title: short.trim().min(1),
    abstract: z.string().max(5000),
    tags: z.array(z.string().trim().min(1).max(80)).max(30),
    applicantType: short,
    institution: short,
    careerStage: short,
    country: short,
    fundingNeed: z.number().finite().nonnegative().nullable(),
    currency: z.string().regex(/^[A-Z]{3}$/),
    startDate: z.union([z.literal(""), z.iso.date()]),
    endDate: z.union([z.literal(""), z.iso.date()]),
    knownFacts: z.string().max(5000),
  })
  .refine(
    (p) => !p.startDate || !p.endDate || p.endDate >= p.startDate,
    "End date must follow the start date.",
  );
export type Profile = z.infer<typeof ProfileSchema>;
export const CitationSchema = z.object({
  sourceId: Id,
  version: z.number().int().positive(),
  hash: z.string().min(1),
  quote: text.min(1),
  start: z.number().int().nonnegative(),
  end: z.number().int().positive(),
});
export type Citation = z.infer<typeof CitationSchema>;
export const SourceSchema = z.object({
  id: Id,
  projectId: Id.nullable(),
  title: short.min(1),
  type: z.enum([
    "preliminary",
    "methods",
    "team",
    "facilities",
    "call",
    "other",
  ]),
  url: SafeUrl,
  provenance: Provenance,
  createdAt: z.string(),
  updatedAt: z.string(),
  versions: z
    .array(
      z.object({
        version: z.number().int().positive(),
        hash: z.string(),
        text,
        createdAt: z.string(),
      }),
    )
    .min(1),
});
export type Source = z.infer<typeof SourceSchema>;
export const ProjectSchema = z.object({
  id: Id,
  revision: z.number().int().positive(),
  provenance: Provenance,
  profile: ProfileSchema,
  createdAt: z.string(),
  updatedAt: z.string(),
  history: z.array(
    z.object({
      revision: z.number().int(),
      profile: ProfileSchema,
      at: z.string(),
    }),
  ),
});
export type Project = z.infer<typeof ProjectSchema>;
export const CriterionSchema = z.object({
  field: z.enum(["applicantType", "careerStage", "country", "institution"]),
  values: z.array(short.trim().min(1)).min(1).max(20),
  confirmed: z.boolean(),
  conflict: z.boolean().default(false),
  citation: CitationSchema.nullable(),
  manual: z.boolean(),
});
export type Criterion = z.infer<typeof CriterionSchema>;
const callFields = {
  title: short.min(1),
  funder: short.min(1),
  url: SafeUrl,
  tags: z.array(z.string().trim().min(1).max(80)).max(30),
  minAmount: z.number().finite().nonnegative().nullable(),
  maxAmount: z.number().finite().nonnegative().nullable(),
  currency: z.union([z.literal(""), z.string().regex(/^[A-Z]{3}$/)]),
  criteria: z.array(CriterionSchema).max(20),
  reviewed: z.boolean(),
  deadline: DeadlineSchema,
};
export const CallFieldsSchema = z
  .object(callFields)
  .refine(
    (c) =>
      c.minAmount === null ||
      c.maxAmount === null ||
      c.maxAmount >= c.minAmount,
    "Maximum funding must be at least the minimum.",
  );
export const OpportunitySchema = z.object({
  ...callFields,
  id: Id,
  sourceId: Id,
  sourceVersion: z.number().int().positive(),
  revision: z.number().int().positive(),
  provenance: Provenance,
  importedAt: z.string(),
  lastCheckedAt: z.string().nullable(),
  history: z.array(
    z.object({
      revision: z.number().int(),
      sourceVersion: z.number().int(),
      fields: CallFieldsSchema,
      at: z.string(),
    }),
  ),
});
export type Opportunity = z.infer<typeof OpportunitySchema>;
export const RequirementSchema = z.object({
  id: Id,
  category: z.enum(["section", "document", "task"]),
  description: z.string().min(1).max(2000),
  obligation: z.enum(["required", "optional", "unknown"]),
  origin: z.enum(["sponsor", "internal"]),
  review: z.enum(["proposed", "confirmed"]),
  status: z.enum(["Missing", "In progress", "Ready"]),
  citation: CitationSchema.nullable(),
  manual: z.boolean(),
  due: DeadlineSchema,
  wordLimit: z.number().int().min(1).max(100_000).nullable(),
  sectionKey: z.enum(["summary", "significance", "approach"]).nullable(),
  linkedSourceId: Id.nullable(),
  reference: SafeUrl,
  note: z.string().max(3000),
  responsible: short,
});
export type Requirement = z.infer<typeof RequirementSchema>;
export const SectionKey = z.enum(["summary", "significance", "approach"]);
export type SectionKeyType = z.infer<typeof SectionKey>;
export const DraftRevisionSchema = z.object({
  id: Id,
  text,
  citations: z.array(CitationSchema).max(50),
  selectedSources: z
    .array(
      z.object({ sourceId: Id, version: z.number().int(), hash: z.string() }),
    )
    .max(10),
  projectRevision: z.number().int(),
  callRevision: z.number().int(),
  callSourceVersion: z.number().int(),
  missingInputs: z.array(short).max(30),
  mode: z.enum(["manual", "fixture", "live"]),
  promptVersion: short,
  createdAt: z.string(),
});
export type DraftRevision = z.infer<typeof DraftRevisionSchema>;
export const DraftSectionSchema = z.object({
  key: SectionKey,
  label: short.min(1),
  wordLimit: z.number().int().min(1).max(100_000).nullable(),
  revisions: z.array(DraftRevisionSchema),
});
export type DraftSection = z.infer<typeof DraftSectionSchema>;
export const ApplicationSchema = z.object({
  id: Id,
  projectId: Id,
  opportunityId: Id,
  revision: z.number().int().positive(),
  provenance: Provenance,
  stage: z.enum(["Considering", "Preparing", "Ready for review", "Submitted"]),
  requirements: z.array(RequirementSchema).max(100),
  sections: z.array(DraftSectionSchema).length(3),
  requirementsReviewed: z.boolean(),
  requirementsSourceVersion: z.number().int(),
  requirementsHistory: z
    .array(
      z.object({
        sourceVersion: z.number().int(),
        at: z.string(),
        items: z.array(RequirementSchema),
      }),
    )
    .default([]),
  waivers: z.array(
    z.object({
      issueId: short,
      fingerprint: z.string(),
      reason: z.string().trim().min(5).max(1000),
      at: z.string(),
    }),
  ),
  createdAt: z.string(),
  updatedAt: z.string(),
});
export type Application = z.infer<typeof ApplicationSchema>;
export const StateSchema = z.object({
  schemaVersion: z.literal(1),
  revision: z.number().int().nonnegative(),
  projects: z.array(ProjectSchema),
  sources: z.array(SourceSchema),
  opportunities: z.array(OpportunitySchema),
  applications: z.array(ApplicationSchema),
});
export type State = z.infer<typeof StateSchema>;
export const ProposalSchema = z.object({
  text: text.min(1),
  citations: z.array(CitationSchema).max(50),
  missingInputs: z.array(short).max(30),
});
export type Proposal = z.infer<typeof ProposalSchema>;
export const GenerationInputSchema = z
  .object({
    applicationId: Id,
    sectionKey: SectionKey,
    sourceIds: z.array(Id).max(10),
    mode: z.enum(["fixture", "live"]),
    confirmUsage: z.boolean(),
    expectedRevision: z.number().int(),
  })
  .strict();
export type GenerationInput = z.infer<typeof GenerationInputSchema>;
export const CommandSchema = z.discriminatedUnion("type", [
  z.object({
    type: z.literal("saveProject"),
    id: Id.optional(),
    profile: ProfileSchema,
  }),
  z.object({
    type: z.literal("saveSource"),
    id: Id.optional(),
    projectId: Id,
    title: short.min(1),
    sourceType: SourceSchema.shape.type,
    text: text.min(1),
    url: SafeUrl,
  }),
  z.object({
    type: z.literal("saveCall"),
    id: Id.optional(),
    title: short.min(1),
    funder: short.min(1),
    url: SafeUrl,
    text: text.min(1),
  }),
  z.object({ type: z.literal("reviewCall"), id: Id, fields: CallFieldsSchema }),
  z.object({
    type: z.literal("saveApplication"),
    projectId: Id,
    opportunityId: Id,
  }),
  z.object({
    type: z.literal("saveRequirement"),
    applicationId: Id,
    requirement: RequirementSchema,
  }),
  z.object({ type: z.literal("reviewRequirements"), applicationId: Id }),
  z.object({ type: z.literal("reextractRequirements"), applicationId: Id }),
  z.object({
    type: z.literal("saveDraft"),
    applicationId: Id,
    sectionKey: SectionKey,
    label: short.min(1),
    wordLimit: z.number().int().min(1).max(100_000).nullable(),
    text,
    sourceIds: z.array(Id).max(10),
    citations: z.array(CitationSchema).max(50).default([]),
    proposalToken: Id.optional(),
  }),
  z.object({
    type: z.literal("setStage"),
    applicationId: Id,
    stage: ApplicationSchema.shape.stage,
  }),
  z.object({
    type: z.literal("waiveIssue"),
    applicationId: Id,
    issueId: short,
    reason: z.string().trim().min(5).max(1000),
  }),
  z.object({ type: z.literal("resetDemo") }),
]);
export type Command = z.infer<typeof CommandSchema>;
export const MutationSchema = z
  .object({
    expectedRevision: z.number().int().nonnegative(),
    command: CommandSchema,
  })
  .strict();
export type Mutation = z.infer<typeof MutationSchema>;
