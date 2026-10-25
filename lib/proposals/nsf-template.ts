import { z } from "zod";

const stableId = z
  .string()
  .min(1)
  .max(80)
  .regex(/^[a-z][a-z0-9-]*$/);
const boundedText = z.string().trim().min(1).max(3000);
export const AnswerSchema = z.enum(["yes", "no", "unknown"]);
export const QuestionIdSchema = z.enum([
  "supports-graduate-students",
  "supports-postdoctoral-scholars",
  "has-prior-nsf-support",
  "has-subawards",
  "multiple-submitting-organizations",
  "special-proposal-type",
  "call-deviations",
]);
export type QuestionId = z.infer<typeof QuestionIdSchema>;
export type Answer = z.infer<typeof AnswerSchema>;
export const ApplicabilityAnswersSchema = z.partialRecord(
  QuestionIdSchema,
  AnswerSchema,
);
export type ApplicabilityAnswers = z.infer<typeof ApplicabilityAnswersSchema>;

const AnswerConditionSchema = z
  .object({
    op: z.literal("answer"),
    questionId: QuestionIdSchema,
    equals: z.enum(["yes", "no"]),
  })
  .strict();
export const ConditionSchema = z.discriminatedUnion("op", [
  AnswerConditionSchema,
  z
    .object({
      op: z.literal("any"),
      conditions: z.array(AnswerConditionSchema).min(1).max(10),
    })
    .strict(),
  z
    .object({
      op: z.literal("all"),
      conditions: z.array(AnswerConditionSchema).min(1).max(10),
    })
    .strict(),
]);
export type Condition = z.infer<typeof ConditionSchema>;
export type Applicability = "applicable" | "not-applicable" | "unresolved";

const PolicySourceSchema = z
  .object({
    id: stableId,
    title: boundedText,
    url: z
      .url()
      .refine(
        (url) =>
          new URL(url).hostname === "www.nsf.gov" &&
          new URL(url).protocol === "https:",
        "Policy sources must use official HTTPS NSF pages.",
      ),
    checkedAt: z.iso.date(),
    checkedBy: z.literal("Codex official-page review"),
    effective: boundedText,
    excerpt: boundedText,
    supersedes: z
      .array(z.object({ sourceId: stableId, scope: boundedText }).strict())
      .max(10),
  })
  .strict();
const SourceRefSchema = z
  .object({ sourceId: stableId, locator: boundedText })
  .strict();
const LimitsSchema = z
  .object({
    words: z.number().int().positive().max(100_000).nullable(),
    pages: z.number().int().positive().max(1000).nullable(),
  })
  .strict();
const RequirementKindSchema = z.enum(["required", "conditional", "optional"]);
const SectionSchema = z
  .object({
    id: stableId,
    componentId: stableId,
    parentId: stableId.nullable(),
    order: z.number().int().nonnegative(),
    kind: z.enum(["group", "content"]),
    heading: boundedText,
    headingPolicy: z.enum(["component-title", "required", "suggested"]),
    instructions: boundedText,
    requiredness: RequirementKindSchema,
    condition: ConditionSchema.nullable(),
    limits: LimitsSchema,
    requiredHeadings: z.array(boundedText).max(20),
    sourceRefs: z.array(SourceRefSchema).min(1).max(10),
  })
  .strict()
  .refine(
    (section) =>
      (section.requiredness === "conditional") === (section.condition !== null),
    "Only conditional sections must have a condition.",
  );
const ComponentSchema = z
  .object({
    id: stableId,
    order: z.number().int().nonnegative(),
    rootSectionId: stableId,
    label: boundedText,
    delivery: z.enum(["narrative", "preparation-worksheet"]),
    limits: LimitsSchema,
  })
  .strict();
const ExternalTaskSchema = z
  .object({
    id: stableId,
    order: z.number().int().nonnegative(),
    label: boundedText,
    instructions: boundedText,
    requiredness: RequirementKindSchema,
    condition: ConditionSchema.nullable(),
    completion: z.literal("researcher-recorded-external-action"),
    sourceRefs: z.array(SourceRefSchema).min(1).max(10),
  })
  .strict()
  .refine(
    (task) =>
      (task.requiredness === "conditional") === (task.condition !== null),
    "Only conditional external tasks must have a condition.",
  );
const RuleSchema = z
  .object({
    id: stableId,
    kind: z.enum([
      "no-urls",
      "references-confirmation",
      "no-financial-information",
      "call-reconciliation",
      "external-completion",
    ]),
    targetSectionId: stableId.nullable(),
    externalTaskId: stableId.nullable(),
    message: boundedText,
    sourceRefs: z.array(SourceRefSchema).min(1).max(10),
  })
  .strict();

export const TemplateManifestSchema = z
  .object({
    id: z.literal("nsf-standard-research"),
    version: z.number().int().positive(),
    sponsor: z.literal("NSF"),
    name: boundedText,
    checkedAt: z.iso.date(),
    policyRefresh: z.literal("manual-new-immutable-version"),
    coverage: z
      .object({
        proposalType: z.literal("standard-research"),
        singleSubmittingOrganization: z.literal(true),
        subawards: z.literal("unsupported"),
        multipleSubmittingOrganizations: z.literal("unsupported"),
        specialProposalTypes: z.literal("unsupported"),
        submission: z.literal(false),
        notice: boundedText,
      })
      .strict(),
    renderProfileId: stableId,
    sources: z.array(PolicySourceSchema).min(1).max(20),
    questions: z
      .array(
        z
          .object({
            id: QuestionIdSchema,
            prompt: boundedText,
            help: boundedText,
          })
          .strict(),
      )
      .min(1)
      .max(20),
    components: z.array(ComponentSchema).min(1).max(16),
    sections: z.array(SectionSchema).min(1).max(32),
    externalTasks: z.array(ExternalTaskSchema).min(1).max(32),
    rules: z.array(RuleSchema).min(1).max(32),
  })
  .strict()
  .superRefine((manifest, ctx) => {
    const problem = (message: string) =>
      ctx.addIssue({ code: "custom", message });
    for (const [label, rows] of [
      ["source", manifest.sources],
      ["question", manifest.questions],
      ["component", manifest.components],
      ["section", manifest.sections],
      ["external task", manifest.externalTasks],
      ["rule", manifest.rules],
    ] as const) {
      if (new Set(rows.map((row) => row.id)).size !== rows.length)
        problem(`Duplicate ${label} IDs.`);
    }
    if (
      new Set(manifest.components.map((c) => c.order)).size !==
      manifest.components.length
    )
      problem("Component order must be unique.");
    if (
      new Set(manifest.externalTasks.map((t) => t.order)).size !==
      manifest.externalTasks.length
    )
      problem("External task order must be unique.");
    const sources = new Set(manifest.sources.map((source) => source.id));
    const questions = new Set(
      manifest.questions.map((question) => question.id),
    );
    const sections = new Map(
      manifest.sections.map((section) => [section.id, section]),
    );
    const components = new Map(
      manifest.components.map((component) => [component.id, component]),
    );
    const tasks = new Set(manifest.externalTasks.map((task) => task.id));
    const validateRefs = (refs: z.infer<typeof SourceRefSchema>[]) =>
      refs.forEach((ref) => {
        if (!sources.has(ref.sourceId))
          problem(`Unknown source ${ref.sourceId}.`);
      });
    for (const source of manifest.sources)
      for (const prior of source.supersedes)
        if (!sources.has(prior.sourceId) || source.id === prior.sourceId)
          problem(`Invalid superseded source ${prior.sourceId}.`);
    for (const target of [...manifest.sections, ...manifest.externalTasks]) {
      validateRefs(target.sourceRefs);
      const atoms =
        target.condition?.op === "answer"
          ? [target.condition]
          : (target.condition?.conditions ?? []);
      for (const atom of atoms)
        if (!questions.has(atom.questionId))
          problem(`Condition references absent question ${atom.questionId}.`);
    }
    const siblings = new Set<string>();
    for (const section of manifest.sections) {
      if (!components.has(section.componentId))
        problem(`Unknown component ${section.componentId}.`);
      if (section.parentId !== null) {
        const parent = sections.get(section.parentId);
        if (
          !parent ||
          parent.componentId !== section.componentId ||
          parent.kind !== "group"
        )
          problem(`Invalid parent for ${section.id}.`);
      }
      const siblingKey = `${section.componentId}:${section.parentId ?? "root"}:${section.order}`;
      if (siblings.has(siblingKey))
        problem(`Duplicate section order within parent for ${section.id}.`);
      siblings.add(siblingKey);
      const visited = new Set<string>([section.id]);
      let parentId = section.parentId;
      while (parentId !== null) {
        if (visited.has(parentId)) {
          problem(`Cyclic section parent relation at ${section.id}.`);
          break;
        }
        visited.add(parentId);
        parentId = sections.get(parentId)?.parentId ?? null;
      }
      if (
        section.kind === "content" &&
        manifest.sections.some((child) => child.parentId === section.id)
      )
        problem(`Content section ${section.id} cannot have children.`);
      const component = components.get(section.componentId);
      if (
        component &&
        component.limits.pages !== null &&
        section.limits.pages !== null &&
        section.limits.pages > component.limits.pages
      )
        problem(`Nested page limit exceeds component limit for ${section.id}.`);
      if (
        new Set(section.requiredHeadings).size !==
        section.requiredHeadings.length
      )
        problem(`Duplicate required headings for ${section.id}.`);
      for (const heading of section.requiredHeadings) {
        const supported = manifest.sections.some((candidate) => {
          if (
            candidate.heading !== heading ||
            candidate.headingPolicy !== "required"
          )
            return false;
          let parent = candidate.parentId;
          const seen = new Set<string>();
          while (parent !== null && !seen.has(parent)) {
            if (parent === section.id) return true;
            seen.add(parent);
            parent = sections.get(parent)?.parentId ?? null;
          }
          return false;
        });
        if (!supported)
          problem(
            `Required heading ${heading} has no required descendant section in ${section.id}.`,
          );
      }
    }
    for (const component of manifest.components) {
      const root = sections.get(component.rootSectionId);
      if (!root || root.componentId !== component.id || root.parentId !== null)
        problem(`Invalid root for ${component.id}.`);
      if (
        manifest.sections.filter(
          (section) =>
            section.componentId === component.id && section.parentId === null,
        ).length !== 1
      )
        problem(`Component ${component.id} must have exactly one root.`);
      if (
        root &&
        (root.limits.pages !== component.limits.pages ||
          root.limits.words !== component.limits.words)
      )
        problem(
          `Root and aggregate component limits differ for ${component.id}.`,
        );
    }
    for (const rule of manifest.rules) {
      validateRefs(rule.sourceRefs);
      if (rule.targetSectionId && !sections.has(rule.targetSectionId))
        problem(`Unknown rule section ${rule.targetSectionId}.`);
      if (rule.externalTaskId && !tasks.has(rule.externalTaskId))
        problem(`Unknown rule external task ${rule.externalTaskId}.`);
    }
  });
export type TemplateManifest = z.infer<typeof TemplateManifestSchema>;
export type TemplateSection = TemplateManifest["sections"][number];
type DeepReadonly<T> = T extends readonly (infer Item)[]
  ? readonly DeepReadonly<Item>[]
  : T extends object
    ? { readonly [Key in keyof T]: DeepReadonly<T[Key]> }
    : T;
function deepFreeze<T>(value: T): DeepReadonly<T> {
  if (value && typeof value === "object") {
    Object.values(value).forEach(deepFreeze);
    Object.freeze(value);
  }
  return value as DeepReadonly<T>;
}
export function parseTemplateManifest(
  input: unknown,
): DeepReadonly<TemplateManifest> {
  return deepFreeze(TemplateManifestSchema.parse(input));
}

export function evaluateCondition(
  input: unknown,
  answerInput: unknown,
): Applicability {
  const condition = ConditionSchema.parse(input),
    answers = ApplicabilityAnswersSchema.parse(answerInput);
  const atom = (item: z.infer<typeof AnswerConditionSchema>): Applicability => {
    const answer = answers[item.questionId] ?? "unknown";
    return answer === "unknown"
      ? "unresolved"
      : answer === item.equals
        ? "applicable"
        : "not-applicable";
  };
  if (condition.op === "answer") return atom(condition);
  const values = condition.conditions.map(atom);
  if (condition.op === "any")
    return values.includes("applicable")
      ? "applicable"
      : values.includes("unresolved")
        ? "unresolved"
        : "not-applicable";
  return values.includes("not-applicable")
    ? "not-applicable"
    : values.includes("unresolved")
      ? "unresolved"
      : "applicable";
}
export function resolveTemplate(manifestInput: unknown, answerInput: unknown) {
  const manifest = parseTemplateManifest(manifestInput),
    answers = ApplicabilityAnswersSchema.parse(answerInput);
  const cache = new Map<string, Applicability>();
  const sectionState = (id: string): Applicability => {
    const cached = cache.get(id);
    if (cached) return cached;
    const section = manifest.sections.find((item) => item.id === id)!;
    const own = section.condition
      ? evaluateCondition(section.condition, answers)
      : "applicable";
    const parent = section.parentId
      ? sectionState(section.parentId)
      : "applicable";
    const value =
      parent === "not-applicable" || own === "not-applicable"
        ? "not-applicable"
        : parent === "unresolved" || own === "unresolved"
          ? "unresolved"
          : "applicable";
    cache.set(id, value);
    return value;
  };
  const sections = manifest.sections.map((section) => ({
    section,
    applicability: sectionState(section.id),
    required:
      sectionState(section.id) === "unresolved"
        ? null
        : sectionState(section.id) === "applicable" &&
          section.requiredness !== "optional",
  }));
  const externalTasks = manifest.externalTasks.map((task) => ({
    task,
    applicability: task.condition
      ? evaluateCondition(task.condition, answers)
      : "applicable",
  }));
  const coverageFindings: {
    questionId: QuestionId;
    status: "unresolved" | "unsupported" | "requires-review";
    message: string;
  }[] = [];
  for (const questionId of [
    "has-subawards",
    "multiple-submitting-organizations",
    "special-proposal-type",
  ] as const) {
    const answer = answers[questionId] ?? "unknown";
    if (answer !== "no")
      coverageFindings.push({
        questionId,
        status: answer === "yes" ? "unsupported" : "unresolved",
        message:
          answer === "yes"
            ? "This proposal is outside the single-organization standard-research preparation profile; manual sponsor preparation is required."
            : "Confirm this scope question; unknown does not establish supported coverage.",
      });
  }
  const deviations = answers["call-deviations"] ?? "unknown";
  if (deviations !== "no")
    coverageFindings.push({
      questionId: "call-deviations",
      status: deviations === "yes" ? "requires-review" : "unresolved",
      message:
        "Reconcile the actual solicitation and applicable policy notices before confirming a template binding.",
    });
  return {
    templateId: manifest.id,
    templateVersion: manifest.version,
    sections,
    externalTasks,
    coverageFindings,
  };
}
export function exportComponentPlan(
  manifestInput: unknown,
  answerInput: unknown,
) {
  const manifest = parseTemplateManifest(manifestInput),
    resolved = resolveTemplate(manifest, answerInput);
  return [...manifest.components]
    .sort((a, b) => a.order - b.order)
    .map((component) => {
      const root = resolved.sections.find(
        (item) => item.section.id === component.rootSectionId,
      )!;
      const selected = resolved.sections.filter(
        (item) =>
          item.section.componentId === component.id &&
          item.applicability !== "not-applicable",
      );
      const ordered: typeof selected = [];
      const appendChildren = (parentId: string | null) => {
        for (const item of selected
          .filter((item) => item.section.parentId === parentId)
          .sort((a, b) => a.section.order - b.section.order)) {
          ordered.push(item);
          appendChildren(item.section.id);
        }
      };
      appendChildren(null);
      return {
        component,
        applicability: root.applicability,
        sections: ordered,
        aggregateLimits: component.limits,
        measurement: "unknown-until-exact-pdf-render" as const,
      };
    });
}

const reference = (sourceId: string, locator: string) => [
  { sourceId, locator },
];
const unlimited = { words: null, pages: null };
const pages = (limit: number) => ({ words: null, pages: limit });
const priorSupport: Condition = {
  op: "answer",
  questionId: "has-prior-nsf-support",
  equals: "yes",
};
const mentoring: Condition = {
  op: "any",
  conditions: [
    { op: "answer", questionId: "supports-graduate-students", equals: "yes" },
    {
      op: "answer",
      questionId: "supports-postdoctoral-scholars",
      equals: "yes",
    },
  ],
};
const section = (
  id: string,
  componentId: string,
  parentId: string | null,
  order: number,
  heading: string,
  instructions: string,
  overrides: Partial<TemplateSection> = {},
): TemplateSection => ({
  id,
  componentId,
  parentId,
  order,
  kind: "content",
  heading,
  headingPolicy: "suggested",
  instructions,
  requiredness: "required",
  condition: null,
  limits: unlimited,
  requiredHeadings: [],
  sourceRefs: reference("pappg-24-1-chapter-ii", "II.D.2"),
  ...overrides,
});
export const NSF_STANDARD_RESEARCH_TEMPLATE = parseTemplateManifest({
  id: "nsf-standard-research",
  version: 1,
  sponsor: "NSF",
  name: "NSF Research - narrative preparation",
  checkedAt: "2026-10-25",
  policyRefresh: "manual-new-immutable-version",
  renderProfileId: "nsf-letter-times-12-v1",
  coverage: {
    proposalType: "standard-research",
    singleSubmittingOrganization: true,
    subawards: "unsupported",
    multipleSubmittingOrganizations: "unsupported",
    specialProposalTypes: "unsupported",
    submission: false,
    notice:
      "GrantPath preparation structure derived from reviewed NSF guidance, not an NSF-issued form or complete portal package. Confirm the actual solicitation and applicable policy before use.",
  },
  sources: [
    {
      id: "pappg-current-index",
      title: "NSF PAPPG current version and policy notices",
      url: "https://www.nsf.gov/policies/pappg",
      checkedAt: "2026-10-25",
      checkedBy: "Codex official-page review",
      effective:
        "NSF 24-1 proposals submitted or due on or after May 20, 2024; supplements have separate effective dates.",
      excerpt: "Current version: NSF 24-1",
      supersedes: [],
    },
    {
      id: "pappg-24-1-chapter-ii",
      title: "PAPPG 24-1 Chapter II Proposal Preparation Instructions",
      url: "https://www.nsf.gov/policies/pappg/24-1/ch-2-proposal-preparation",
      checkedAt: "2026-10-25",
      checkedBy: "Codex official-page review",
      effective:
        "May 20, 2024, with later notices and reviewed solicitation deviations.",
      excerpt: "Reference information is required.",
      supersedes: [],
    },
    {
      id: "pappg-26-200-supplement-1",
      title: "PAPPG 24-1 Supplement 1",
      url: "https://www.nsf.gov/policies/document/pappg24-1-supplement-1",
      checkedAt: "2026-10-25",
      checkedBy: "Codex official-page review",
      effective: "Financial assistance awarded on or after December 8, 2025.",
      excerpt: "Implementation of Policy Changes",
      supersedes: [
        {
          sourceId: "pappg-24-1-chapter-ii",
          scope:
            "Only the changes explicitly listed by NSF 26-200, not a blanket replacement of the guide.",
        },
      ],
    },
    {
      id: "pappg-26-202-supplement-2",
      title: "PAPPG 24-1 Supplement 2 DMSP policy",
      url: "https://www.nsf.gov/policies/document/pappg24-1-supplement-2",
      checkedAt: "2026-10-25",
      checkedBy: "Codex official-page review",
      effective:
        "Notice January 22, 2026; DMSP Research.gov tool transition April 27, 2026.",
      excerpt:
        "Proposals must include a DMSP created using the tool implemented on Research.gov.",
      supersedes: [
        {
          sourceId: "pappg-24-1-chapter-ii",
          scope:
            "The revised DMSP workflow and other explicitly amended portions of NSF 26-202; the tool transition is April 27, 2026.",
        },
      ],
    },
    {
      id: "nsf-personnel-documents",
      title: "NSF Documents Required for Senior/Key Personnel",
      url: "https://www.nsf.gov/funding/senior-personnel-documents",
      checkedAt: "2026-10-25",
      checkedBy: "Codex official-page review",
      effective:
        "Current page reviewed October 25, 2026; confirm actual solicitation.",
      excerpt:
        "Proposers must use SciENcv to prepare their biographical sketches for proposals to NSF.",
      supersedes: [],
    },
  ],
  questions: [
    {
      id: "supports-graduate-students",
      prompt: "Does this project request support for graduate students?",
      help: "Answer yes/no/unknown from the proposed budget and scope. Unknown leaves mentoring applicability unresolved.",
    },
    {
      id: "supports-postdoctoral-scholars",
      prompt:
        "Does this project request support for postdoctoral scholars who require a mentoring plan?",
      help: "Review II.D.2.i(i), including the senior/key personnel exception. Do not assume an exception without confirming the role.",
    },
    {
      id: "has-prior-nsf-support",
      prompt:
        "Does any PI or co-PI have current NSF funding or an NSF award ending in the past five years?",
      help: "Include current no-cost extensions. Unrelated awards can still require prior-support information; unknown stays unresolved.",
    },
    {
      id: "has-subawards",
      prompt: "Does this proposal include subawards?",
      help: "Subawards require additional sponsor-specific preparation outside this bounded profile.",
    },
    {
      id: "multiple-submitting-organizations",
      prompt: "Will multiple organizations submit this collaborative proposal?",
      help: "This profile supports one submitting organization only.",
    },
    {
      id: "special-proposal-type",
      prompt:
        "Is this a special proposal type rather than a standard research proposal?",
      help: "RAPID, EAGER, equipment, conference, renewal-specific and other special requirements need manual preparation.",
    },
    {
      id: "call-deviations",
      prompt:
        "Does the actual solicitation or an applicable notice change these preparation rules?",
      help: "A recorded source-backed resolution is needed before a future application binding can be confirmed.",
    },
  ],
  components: [
    {
      id: "project-summary",
      order: 0,
      rootSectionId: "project-summary",
      label: "Project Summary",
      delivery: "narrative",
      limits: pages(1),
    },
    {
      id: "project-description",
      order: 1,
      rootSectionId: "project-description",
      label: "Project Description",
      delivery: "narrative",
      limits: pages(15),
    },
    {
      id: "references",
      order: 2,
      rootSectionId: "references",
      label: "References Cited",
      delivery: "narrative",
      limits: unlimited,
    },
    {
      id: "budget-justification",
      order: 3,
      rootSectionId: "budget-justification",
      label: "Budget Justification",
      delivery: "narrative",
      limits: pages(5),
    },
    {
      id: "facilities",
      order: 4,
      rootSectionId: "facilities",
      label: "Facilities Equipment and Other Resources",
      delivery: "narrative",
      limits: unlimited,
    },
    {
      id: "mentoring",
      order: 5,
      rootSectionId: "mentoring",
      label: "Mentoring Plan",
      delivery: "narrative",
      limits: pages(1),
    },
    {
      id: "dmsp-worksheet",
      order: 6,
      rootSectionId: "dmsp-worksheet",
      label: "DMSP Preparation Worksheet",
      delivery: "preparation-worksheet",
      limits: unlimited,
    },
  ],
  sections: [
    section(
      "project-summary",
      "project-summary",
      null,
      0,
      "Project Summary",
      "Prepare the three content groups together as one component. The aggregate rendered PDF must fit one page; no word-to-page heuristic can pass this rule.",
      {
        kind: "group",
        headingPolicy: "component-title",
        limits: pages(1),
        sourceRefs: reference("pappg-24-1-chapter-ii", "II.D.2.b"),
      },
    ),
    section(
      "summary-overview",
      "project-summary",
      "project-summary",
      0,
      "Overview",
      "Describe the proposed activity, objectives and methods. Do not copy a prior project's accomplishments as current facts.",
      { sourceRefs: reference("pappg-24-1-chapter-ii", "II.D.2.b") },
    ),
    section(
      "summary-intellectual-merit",
      "project-summary",
      "project-summary",
      1,
      "Intellectual Merit",
      "Explain the proposed activity's potential to advance knowledge, with evidence and uncertainty retained.",
      { sourceRefs: reference("pappg-24-1-chapter-ii", "II.D.2.b") },
    ),
    section(
      "summary-broader-impacts",
      "project-summary",
      "project-summary",
      2,
      "Broader Impacts",
      "Describe proposed societal benefits; do not present anticipated outcomes as demonstrated.",
      { sourceRefs: reference("pappg-24-1-chapter-ii", "II.D.2.b") },
    ),
    section(
      "project-description",
      "project-description",
      null,
      0,
      "Project Description",
      "Prepare one narrative including applicable prior support within its aggregate 15-page limit. Suggested writing subheadings are not additional sponsor-mandated labels.",
      {
        kind: "group",
        headingPolicy: "component-title",
        limits: pages(15),
        requiredHeadings: ["Broader Impacts"],
        sourceRefs: reference("pappg-24-1-chapter-ii", "II.D.2.d(i)-(iii)"),
      },
    ),
    section(
      "description-objectives",
      "project-description",
      "project-description",
      0,
      "Objectives and Significance",
      "State the proposed work, objectives and expected significance.",
      { sourceRefs: reference("pappg-24-1-chapter-ii", "II.D.2.d(i)") },
    ),
    section(
      "description-context",
      "project-description",
      "project-description",
      1,
      "Scientific Context",
      "Explain the relationship to current knowledge and relevant ongoing work, including other support where applicable.",
      { sourceRefs: reference("pappg-24-1-chapter-ii", "II.D.2.d(i)") },
    ),
    section(
      "description-methods",
      "project-description",
      "project-description",
      2,
      "Proposed Methods",
      "Describe and justify the plan, methods and procedures. Missing pilot measurements remain missing inputs.",
      { sourceRefs: reference("pappg-24-1-chapter-ii", "II.D.2.d(i)") },
    ),
    section(
      "description-evaluation",
      "project-description",
      "project-description",
      3,
      "Evaluation and Timeline",
      "Optional writing structure for assessing progress and sequence. This heading itself is product guidance, not an additional NSF requirement.",
      {
        requiredness: "optional",
        sourceRefs: reference("pappg-24-1-chapter-ii", "II.D.2.d(i)"),
      },
    ),
    section(
      "description-broader-impacts",
      "project-description",
      "project-description",
      4,
      "Broader Impacts",
      "Use a separate actual heading on its own line. Explain proposed broader contributions and plans.",
      {
        headingPolicy: "required",
        sourceRefs: reference("pappg-24-1-chapter-ii", "II.D.2.d(i)"),
      },
    ),
    section(
      "prior-support",
      "project-description",
      "project-description",
      5,
      "Results from Prior NSF Support",
      "When applicable, supply the required award information and actual results. This subpart has a five-page limit inside the same 15-page Project Description, not an extra allowance.",
      {
        requiredness: "conditional",
        condition: priorSupport,
        limits: pages(5),
        sourceRefs: reference("pappg-24-1-chapter-ii", "II.D.2.d(iii)"),
      },
    ),
    section(
      "references",
      "references",
      null,
      0,
      "References Cited",
      "Prepare bibliographic references only. A no-references statement requires researcher confirmation; this component is not space for extra narrative.",
      {
        headingPolicy: "component-title",
        sourceRefs: reference("pappg-24-1-chapter-ii", "II.D.2.e"),
      },
    ),
    section(
      "budget-justification",
      "budget-justification",
      null,
      0,
      "Budget Justification",
      "Justify researcher-supplied budget line items within five pages. No rates, amounts or commitments are inferred; this is not a ledger or budget form.",
      {
        headingPolicy: "component-title",
        limits: pages(5),
        sourceRefs: reference("pappg-24-1-chapter-ii", "II.D.2.f"),
      },
    ),
    section(
      "facilities",
      "facilities",
      null,
      0,
      "Facilities Equipment and Other Resources",
      "Describe directly applicable resources and confirmed availability in narrative form, without quantifiable financial information.",
      {
        headingPolicy: "component-title",
        sourceRefs: reference("pappg-24-1-chapter-ii", "II.D.2.g"),
      },
    ),
    section(
      "mentoring",
      "mentoring",
      null,
      0,
      "Mentoring Plan",
      "When applicable, describe mentoring for supported graduate students and postdoctoral scholars in one combined component of at most one page.",
      {
        headingPolicy: "component-title",
        requiredness: "conditional",
        condition: mentoring,
        limits: pages(1),
        sourceRefs: reference("pappg-24-1-chapter-ii", "II.D.2.i(i)"),
      },
    ),
    section(
      "dmsp-worksheet",
      "dmsp-worksheet",
      null,
      0,
      "DMSP Preparation Worksheet",
      "Preparation only. Complete the official DMSP in the Research.gov tool; review applicable NSF-unit guidance. This worksheet is not an official PDF upload and has no inherited two-page limit.",
      {
        headingPolicy: "component-title",
        sourceRefs: reference(
          "pappg-26-202-supplement-2",
          "Data Management and Sharing Plan; April 27, 2026 transition",
        ),
      },
    ),
  ],
  externalTasks: [
    {
      id: "cover-sheet",
      order: 0,
      label: "Cover Sheet and portal fields",
      instructions:
        "Complete and review official portal fields. GrantPath narrative files do not replace these fields.",
      requiredness: "required",
      condition: null,
      completion: "researcher-recorded-external-action",
      sourceRefs: reference("pappg-24-1-chapter-ii", "II.D.2.a"),
    },
    {
      id: "budget-forms",
      order: 1,
      label: "Official budget forms",
      instructions:
        "Prepare approved budgets for each support year in the sponsor system. The narrative justification does not replace the forms.",
      requiredness: "required",
      condition: null,
      completion: "researcher-recorded-external-action",
      sourceRefs: reference("pappg-24-1-chapter-ii", "II.D.2.f"),
    },
    {
      id: "sciencv-biosketches",
      order: 2,
      label: "SciENcv Biographical Sketches",
      instructions:
        "Use SciENcv for each required senior/key person. Reusable biography prose cannot replace an official SciENcv document or certification.",
      requiredness: "required",
      condition: null,
      completion: "researcher-recorded-external-action",
      sourceRefs: reference(
        "nsf-personnel-documents",
        "Biographical Sketch; How to format",
      ),
    },
    {
      id: "sciencv-support",
      order: 3,
      label: "SciENcv Current and Pending Other Support",
      instructions:
        "Prepare current and pending support through SciENcv for each required senior/key person; independently review overlap and commitments.",
      requiredness: "required",
      condition: null,
      completion: "researcher-recorded-external-action",
      sourceRefs: reference(
        "nsf-personnel-documents",
        "Current and Pending Other Support; How to format",
      ),
    },
    {
      id: "coa-template",
      order: 4,
      label: "Collaborators and Other Affiliations",
      instructions:
        "Complete the prescribed NSF COA template; a narrative biography is not a substitute.",
      requiredness: "required",
      condition: null,
      completion: "researcher-recorded-external-action",
      sourceRefs: reference(
        "nsf-personnel-documents",
        "Collaborators and Other Affiliations",
      ),
    },
    {
      id: "synergistic-activities",
      order: 5,
      label: "Synergistic Activities",
      instructions:
        "Prepare the required separate senior/key personnel document in the prescribed scope.",
      requiredness: "required",
      condition: null,
      completion: "researcher-recorded-external-action",
      sourceRefs: reference(
        "nsf-personnel-documents",
        "Synergistic Activities",
      ),
    },
    {
      id: "dmsp-researchgov",
      order: 6,
      label: "Official Research.gov DMSP",
      instructions:
        "Create and complete the official DMSP using Research.gov. Record its external completion separately from the local worksheet.",
      requiredness: "required",
      condition: null,
      completion: "researcher-recorded-external-action",
      sourceRefs: reference(
        "pappg-26-202-supplement-2",
        "Data Management and Sharing Plan",
      ),
    },
    {
      id: "certifications",
      order: 7,
      label: "Authorized certifications and submission review",
      instructions:
        "The authorized organization/person completes required certifications and reviews submission in the official system. This app does not certify or submit.",
      requiredness: "required",
      condition: null,
      completion: "researcher-recorded-external-action",
      sourceRefs: reference("pappg-24-1-chapter-ii", "II.D.1.d-e"),
    },
    {
      id: "call-specific-attachments",
      order: 8,
      label: "Call-specific attachments and requirements",
      instructions:
        "Researcher must reconcile the actual solicitation, applicable unit guidance and notices. Requiredness of particular extra attachments remains a separate source-backed decision.",
      requiredness: "required",
      condition: null,
      completion: "researcher-recorded-external-action",
      sourceRefs: reference(
        "pappg-current-index",
        "Current policy notices and applicable guide",
      ),
    },
  ],
  rules: [
    {
      id: "description-no-urls",
      kind: "no-urls",
      targetSectionId: "project-description",
      externalTaskId: null,
      message:
        "Flag URLs in the Project Description for source-backed review; no automated exception is assumed.",
      sourceRefs: reference("pappg-24-1-chapter-ii", "II.D.2.d(ii)"),
    },
    {
      id: "references-review",
      kind: "references-confirmation",
      targetSectionId: "references",
      externalTaskId: null,
      message:
        "Researcher confirms bibliographic entries or the validity of a no-references statement.",
      sourceRefs: reference("pappg-24-1-chapter-ii", "II.D.2.e"),
    },
    {
      id: "facilities-no-money",
      kind: "no-financial-information",
      targetSectionId: "facilities",
      externalTaskId: null,
      message:
        "Facilities narrative must not contain quantifiable financial information; researcher review remains required.",
      sourceRefs: reference("pappg-24-1-chapter-ii", "II.D.2.g"),
    },
    {
      id: "reconcile-actual-call",
      kind: "call-reconciliation",
      targetSectionId: null,
      externalTaskId: "call-specific-attachments",
      message:
        "The generic profile cannot establish actual solicitation coverage; bind only after researcher reconciliation.",
      sourceRefs: reference(
        "pappg-current-index",
        "Current guide and policy notices",
      ),
    },
    {
      id: "external-dmsp-remains-external",
      kind: "external-completion",
      targetSectionId: "dmsp-worksheet",
      externalTaskId: "dmsp-researchgov",
      message:
        "A completed local worksheet cannot clear the official Research.gov DMSP task.",
      sourceRefs: reference(
        "pappg-26-202-supplement-2",
        "Data Management and Sharing Plan",
      ),
    },
  ],
});
