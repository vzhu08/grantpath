import { describe, expect, it } from "vitest";
import {
  ApplicabilityAnswersSchema,
  ConditionSchema,
  NSF_STANDARD_RESEARCH_TEMPLATE,
  TemplateManifestSchema,
  evaluateCondition,
  exportComponentPlan,
  parseTemplateManifest,
  resolveTemplate,
  type ApplicabilityAnswers,
} from "../../lib/proposals/nsf-template";

const copy = () => TemplateManifestSchema.parse(NSF_STANDARD_RESEARCH_TEMPLATE);
const noExceptions: ApplicabilityAnswers = {
  "supports-graduate-students": "no",
  "supports-postdoctoral-scholars": "no",
  "has-prior-nsf-support": "no",
  "has-subawards": "no",
  "multiple-submitting-organizations": "no",
  "special-proposal-type": "no",
  "call-deviations": "no",
};
describe("reviewed NSF template manifest", () => {
  it("is immutable, source-dated and bounded to preparation for one organization", () => {
    const manifest = NSF_STANDARD_RESEARCH_TEMPLATE;
    expect(TemplateManifestSchema.safeParse(manifest).success).toBe(true);
    expect(Object.isFrozen(manifest)).toBe(true);
    expect(Object.isFrozen(manifest.sections[0])).toBe(true);
    expect(
      manifest.sources.every(
        (source) =>
          source.checkedAt === "2026-10-25" &&
          new URL(source.url).hostname === "www.nsf.gov",
      ),
    ).toBe(true);
    expect(manifest.coverage).toMatchObject({
      singleSubmittingOrganization: true,
      subawards: "unsupported",
      multipleSubmittingOrganizations: "unsupported",
      specialProposalTypes: "unsupported",
      submission: false,
    });
    expect(() => {
      (manifest.sections as unknown as { heading: string }[])[0]!.heading =
        "Silently changed";
    }).toThrow();
    expect(parseTemplateManifest(copy())).toEqual(manifest);
  });
  it("keeps summary groups under one page and prior support inside the aggregate 15-page description", () => {
    const plans = exportComponentPlan(NSF_STANDARD_RESEARCH_TEMPLATE, {
      ...noExceptions,
      "has-prior-nsf-support": "yes",
    });
    const summary = plans.find(
      (plan) => plan.component.id === "project-summary",
    )!;
    expect(summary.aggregateLimits).toEqual({ pages: 1, words: null });
    expect(summary.sections.map((item) => item.section.id)).toEqual([
      "project-summary",
      "summary-overview",
      "summary-intellectual-merit",
      "summary-broader-impacts",
    ]);
    expect(
      summary.sections
        .slice(1)
        .every((item) => item.section.limits.pages === null),
    ).toBe(true);
    const description = plans.find(
      (plan) => plan.component.id === "project-description",
    )!;
    expect(description.aggregateLimits).toEqual({ pages: 15, words: null });
    expect(
      description.sections.find((item) => item.section.id === "prior-support")!
        .section.limits.pages,
    ).toBe(5);
    expect(description.measurement).toBe("unknown-until-exact-pdf-render");
    expect(plans.some((plan) => plan.component.id === "prior-support")).toBe(
      false,
    );
  });
  it("requires an actual Broader Impacts heading but labels optional writing guidance honestly", () => {
    const description = NSF_STANDARD_RESEARCH_TEMPLATE.sections.find(
      (section) => section.id === "project-description",
    )!;
    const broader = NSF_STANDARD_RESEARCH_TEMPLATE.sections.find(
      (section) => section.id === "description-broader-impacts",
    )!;
    const evaluation = NSF_STANDARD_RESEARCH_TEMPLATE.sections.find(
      (section) => section.id === "description-evaluation",
    )!;
    expect(description.requiredHeadings).toEqual(["Broader Impacts"]);
    expect(broader.headingPolicy).toBe("required");
    expect(evaluation).toMatchObject({
      headingPolicy: "suggested",
      requiredness: "optional",
    });
  });
  it("keeps unknown conditional work present and distinguishes explicit no from unknown", () => {
    const unresolved = resolveTemplate(NSF_STANDARD_RESEARCH_TEMPLATE, {});
    for (const id of ["prior-support", "mentoring"])
      expect(
        unresolved.sections.find((item) => item.section.id === id),
      ).toMatchObject({ applicability: "unresolved", required: null });
    expect(
      exportComponentPlan(NSF_STANDARD_RESEARCH_TEMPLATE, {}).find(
        (plan) => plan.component.id === "mentoring",
      )!.sections,
    ).toHaveLength(1);
    const absent = resolveTemplate(
      NSF_STANDARD_RESEARCH_TEMPLATE,
      noExceptions,
    );
    expect(
      absent.sections.find((item) => item.section.id === "mentoring")!
        .applicability,
    ).toBe("not-applicable");
    const present = resolveTemplate(NSF_STANDARD_RESEARCH_TEMPLATE, {
      ...noExceptions,
      "supports-graduate-students": "yes",
    });
    expect(
      present.sections.find((item) => item.section.id === "mentoring"),
    ).toMatchObject({ applicability: "applicable", required: true });
  });
  it("implements bounded three-valued any/all logic without eval or missing-question defaults", () => {
    const any = {
      op: "any",
      conditions: [
        {
          op: "answer",
          questionId: "supports-graduate-students",
          equals: "yes",
        },
        {
          op: "answer",
          questionId: "supports-postdoctoral-scholars",
          equals: "yes",
        },
      ],
    };
    expect(evaluateCondition(any, { "supports-graduate-students": "no" })).toBe(
      "unresolved",
    );
    expect(
      evaluateCondition(any, { "supports-graduate-students": "yes" }),
    ).toBe("applicable");
    expect(
      evaluateCondition(
        { ...any, op: "all" },
        { "supports-graduate-students": "no" },
      ),
    ).toBe("not-applicable");
    expect(
      ConditionSchema.safeParse({
        op: "eval",
        expression: "process.env.SECRET",
      }).success,
    ).toBe(false);
    expect(
      ConditionSchema.safeParse({
        op: "answer",
        questionId: "invented-question",
        equals: "yes",
      }).success,
    ).toBe(false);
    expect(
      ApplicabilityAnswersSchema.safeParse({ "invented-question": "no" })
        .success,
    ).toBe(false);
  });
  it("represents DMSP as an unlimited preparation worksheet and separate official external task", () => {
    const dmsp = NSF_STANDARD_RESEARCH_TEMPLATE.components.find(
      (component) => component.id === "dmsp-worksheet",
    )!;
    expect(dmsp).toMatchObject({
      delivery: "preparation-worksheet",
      limits: { pages: null, words: null },
    });
    expect(
      NSF_STANDARD_RESEARCH_TEMPLATE.externalTasks.find(
        (task) => task.id === "dmsp-researchgov",
      ),
    ).toMatchObject({
      requiredness: "required",
      completion: "researcher-recorded-external-action",
    });
    expect(
      NSF_STANDARD_RESEARCH_TEMPLATE.rules.some(
        (rule) =>
          rule.kind === "external-completion" &&
          rule.targetSectionId === "dmsp-worksheet" &&
          rule.externalTaskId === "dmsp-researchgov",
      ),
    ).toBe(true);
    expect(
      NSF_STANDARD_RESEARCH_TEMPLATE.sources.find(
        (source) => source.id === "pappg-26-202-supplement-2",
      )!.effective,
    ).toContain("April 27, 2026");
  });
  it("preserves SciENcv/COA/certification tasks outside local narrative completeness", () => {
    const ids = resolveTemplate(
      NSF_STANDARD_RESEARCH_TEMPLATE,
      noExceptions,
    ).externalTasks.map((item) => item.task.id);
    expect(ids).toEqual(
      expect.arrayContaining([
        "sciencv-biosketches",
        "sciencv-support",
        "coa-template",
        "certifications",
        "dmsp-researchgov",
      ]),
    );
    expect(
      NSF_STANDARD_RESEARCH_TEMPLATE.externalTasks.every(
        (task) => task.completion === "researcher-recorded-external-action",
      ),
    ).toBe(true);
  });
  it("flags unsupported or unconfirmed scope rather than treating the generic profile as universal", () => {
    expect(
      resolveTemplate(NSF_STANDARD_RESEARCH_TEMPLATE, noExceptions)
        .coverageFindings,
    ).toEqual([]);
    expect(
      resolveTemplate(NSF_STANDARD_RESEARCH_TEMPLATE, {}).coverageFindings,
    ).toHaveLength(4);
    expect(
      resolveTemplate(NSF_STANDARD_RESEARCH_TEMPLATE, {
        ...noExceptions,
        "has-subawards": "yes",
      }).coverageFindings[0],
    ).toMatchObject({ questionId: "has-subawards", status: "unsupported" });
    expect(
      resolveTemplate(NSF_STANDARD_RESEARCH_TEMPLATE, {
        ...noExceptions,
        "call-deviations": "yes",
      }).coverageFindings[0]!.status,
    ).toBe("requires-review");
  });
});
describe("manifest integrity boundaries", () => {
  it("rejects duplicate IDs, sibling order and absent sources", () => {
    const duplicate = copy();
    duplicate.sections.push(duplicate.sections[0]!);
    expect(TemplateManifestSchema.safeParse(duplicate).success).toBe(false);
    const order = copy();
    order.sections[2]!.order = order.sections[1]!.order;
    expect(TemplateManifestSchema.safeParse(order).success).toBe(false);
    const source = copy();
    source.sections[0]!.sourceRefs[0]!.sourceId = "missing-source";
    expect(TemplateManifestSchema.safeParse(source).success).toBe(false);
  });
  it("rejects invalid and cyclic parents, components and required heading mappings", () => {
    const parent = copy();
    parent.sections[1]!.parentId = "references";
    expect(TemplateManifestSchema.safeParse(parent).success).toBe(false);
    const cycle = copy();
    cycle.sections[0]!.parentId = "project-summary";
    expect(TemplateManifestSchema.safeParse(cycle).success).toBe(false);
    const component = copy();
    component.sections[1]!.componentId = "missing-component";
    expect(TemplateManifestSchema.safeParse(component).success).toBe(false);
    const heading = copy();
    heading.sections.find(
      (section) => section.id === "description-broader-impacts",
    )!.headingPolicy = "suggested";
    expect(TemplateManifestSchema.safeParse(heading).success).toBe(false);
  });
  it("rejects inconsistent limits, unknown condition references and unsupported expressions", () => {
    const limit = copy();
    limit.sections.find(
      (section) => section.id === "prior-support",
    )!.limits.pages = 16;
    expect(TemplateManifestSchema.safeParse(limit).success).toBe(false);
    const rootLimit = copy();
    rootLimit.components[0]!.limits.pages = 2;
    expect(TemplateManifestSchema.safeParse(rootLimit).success).toBe(false);
    const question = copy();
    question.questions = question.questions.filter(
      (item) => item.id !== "has-prior-nsf-support",
    );
    expect(TemplateManifestSchema.safeParse(question).success).toBe(false);
    const expression = copy() as unknown as {
      sections: { condition: unknown }[];
    };
    expression.sections.find((_, i) => i === 10)!.condition = {
      op: "eval",
      expression: "true",
    };
    expect(TemplateManifestSchema.safeParse(expression).success).toBe(false);
  });
  it("rejects nonofficial source URLs, extra keys and unsafe identifiers", () => {
    const source = copy();
    source.sources[0]!.url = "https://example.test/nsf";
    expect(TemplateManifestSchema.safeParse(source).success).toBe(false);
    const id = copy();
    id.sections[0]!.id = "../../escape";
    expect(TemplateManifestSchema.safeParse(id).success).toBe(false);
    expect(
      TemplateManifestSchema.safeParse({ ...copy(), arbitraryTool: "fetch" })
        .success,
    ).toBe(false);
  });
});
