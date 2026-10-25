import { createHash, randomUUID } from "node:crypto";
import { KitError } from "../../packages/runtime/src/index";
import { latest, validCitation } from "../evidence";
import { readiness } from "../readiness";
import {
  StateSchema,
  type State,
  type Command,
  type Application,
  type DraftRevision,
  type DraftSection,
  type ProposalBinding,
} from "../schema";
import { textBlocks, visibleText } from "./blocks";
import {
  NSF_STANDARD_RESEARCH_TEMPLATE,
  resolveTemplate,
  TemplateManifestSchema,
} from "./nsf-template";
const id = (prefix: string) => `${prefix}-${randomUUID()}`;
const kinds = [
  "adoptTemplate",
  "confirmTemplate",
  "reviewSection",
  "saveContent",
  "approveContent",
  "retireContent",
  "insertContent",
  "resolveReuse",
  "freezePacket",
] as const;
export type ProposalCommand = Extract<
  Command,
  { type: (typeof kinds)[number] }
>;
export const isProposalCommand = (
  command: Command,
): command is ProposalCommand =>
  kinds.includes(command.type as (typeof kinds)[number]);
const error = (message: string): never => {
  throw new KitError("PROPOSAL_INPUT", message, 422);
};
function record<T extends { id: string }>(list: T[], key: string): T {
  return (
    list.find((r) => r.id === key) ??
    error(
      "The selected proposal record is unavailable. Reload and review its current version.",
    )
  );
}
export function legacyBinding(
  app: Application,
  callRevision: number,
  sourceVersion: number,
): ProposalBinding {
  return {
    templateId: "legacy-three-section",
    templateVersion: 1,
    revision: 1,
    manifest: null,
    callRevision,
    callSourceVersion: sourceVersion,
    answers: {},
    mappings: [],
    confirmedAt: null,
    confirmedBy: "",
    confirmationNote: "",
  };
}
export function canonicalStringify(value: unknown): string {
  if (value === null || typeof value !== "object") return JSON.stringify(value);
  if (Array.isArray(value))
    return "[" + value.map(canonicalStringify).join(",") + "]";
  return (
    "{" +
    Object.entries(value)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([key, v]) => JSON.stringify(key) + ":" + canonicalStringify(v))
      .join(",") +
    "}"
  );
}
export const sha256 = (value: string | Uint8Array) =>
  createHash("sha256").update(value).digest("hex");
export function validateStateIntegrity(state: State) {
  for (const list of [
    state.projects,
    state.sources,
    state.opportunities,
    state.applications,
    state.contentLibrary,
    state.packetSnapshots,
    state.proposalExports,
  ])
    if (new Set(list.map((r) => r.id)).size !== list.length)
      error("Duplicate stable record identifiers in storage.");
  for (const source of state.sources) {
    if (
      source.projectId &&
      !state.projects.some((p) => p.id === source.projectId)
    )
      error("A source project is unavailable.");
    if (
      new Set(source.versions.map((v) => v.version)).size !==
      source.versions.length
    )
      error("Duplicate source versions in storage.");
  }
  for (const app of state.applications) {
    if (
      !state.projects.some((p) => p.id === app.projectId) ||
      !state.opportunities.some((c) => c.id === app.opportunityId)
    )
      error("Application parent references are unavailable.");
    if (new Set(app.sections.map((s) => s.key)).size !== app.sections.length)
      error("Draft section IDs must be unique.");
    for (const section of [...app.sections, ...(app.archivedSections ?? [])])
      for (const draft of section.revisions)
        if (draft.citations.some((c) => !validCitation(c, state.sources)))
          error("A saved draft citation is invalid; storage was not replaced.");
    if (
      app.binding?.templateId === "nsf-standard-research" &&
      !app.binding.manifest
    )
      error("The pinned NSF manifest is missing.");
    for (const mapping of app.binding?.mappings ?? [])
      if (
        !app.requirements.some((r) => r.id === mapping.requirementId) ||
        (mapping.sectionId &&
          !app.sections.some((s) => s.key === mapping.sectionId))
      )
        error("A template requirement mapping is invalid.");
  }
  for (const snapshot of state.packetSnapshots)
    if (sha256(canonicalStringify(snapshot.payload)) !== snapshot.digest)
      error("A frozen packet digest does not match its retained inputs.");
  return state;
}
function touch(app: Application, at: string) {
  app.revision++;
  app.updatedAt = at;
  app.waivers = [];
  if (app.stage === "Ready for review") app.stage = "Preparing";
}
function copiedRevision(
  app: Application,
  state: State,
  text: string,
  previous?: DraftRevision,
): DraftRevision {
  const project = record(state.projects, app.projectId),
    call = record(state.opportunities, app.opportunityId);
  return {
    id: id("draft"),
    text,
    blocks: textBlocks(text),
    representationVersion: 1,
    citations: previous?.citations ?? [],
    selectedSources: previous?.selectedSources ?? [],
    projectRevision: project.revision,
    callRevision: call.revision,
    callSourceVersion: call.sourceVersion,
    bindingRevision: app.binding?.revision ?? null,
    reusedContent: previous?.reusedContent ?? [],
    missingInputs: previous?.missingInputs ?? [],
    mode: "manual",
    promptVersion: "proposal-adoption-1",
    createdAt: new Date().toISOString(),
  };
}
export function adoptionPreview(app: Application) {
  return {
    from: app.binding?.templateId ?? "legacy-three-section",
    to: "nsf-standard-research",
    mappings: [
      { from: "summary", to: "summary-overview" },
      { from: "significance", to: "description-context" },
      { from: "approach", to: "description-methods" },
    ],
    retained: app.sections.map((s) => ({
      key: s.key,
      label: s.label,
      revisions: s.revisions.length,
    })),
    notice:
      "Copies become new revisions needing review. Original sections and all revisions remain archived. A generic template does not confirm a particular solicitation.",
  };
}
export function applyProposalCommand(
  state: State,
  c: ProposalCommand,
  at: string,
): string | undefined {
  if (c.type === "approveContent" || c.type === "retireContent") {
    const item = record(state.contentLibrary, c.itemId);
    if (c.type === "retireContent") item.retiredAt = at;
    else {
      const version =
        item.versions.find((v) => v.revision === c.revision) ??
        error("Content revision not found.");
      if (item.retiredAt)
        error("Retired content cannot be approved for a new insertion.");
      version.approvedBy = c.by;
      version.approvedAt = at;
    }
    return item.id;
  }
  const app = record(state.applications, c.applicationId),
    call = record(state.opportunities, app.opportunityId);
  app.binding ??= legacyBinding(app, call.revision, call.sourceVersion);
  app.bindingHistory ??= [];
  app.archivedSections ??= [];
  app.reuseDecisions ??= [];
  if (c.type === "adoptTemplate") {
    if (c.templateId === app.binding.templateId) return app.id;
    app.bindingHistory.push(structuredClone(app.binding));
    app.archivedSections.push(...structuredClone(app.sections));
    const old = app.sections;
    if (c.templateId === "legacy-three-section") {
      app.sections = ["summary", "significance", "approach"].map(
        (key, index) => {
          const saved = [...app.archivedSections!]
            .reverse()
            .find((s) => s.key === key);
          return saved
            ? structuredClone(saved)
            : {
                key,
                label: ["Project summary", "Significance", "Approach overview"][
                  index
                ]!,
                wordLimit: [250, 500, 750][index]!,
                revisions: [],
              };
        },
      );
      app.binding = {
        ...legacyBinding(app, call.revision, call.sourceVersion),
        revision: app.binding.revision + 1,
      };
    } else {
      app.binding = {
        ...legacyBinding(app, call.revision, call.sourceVersion),
        templateId: "nsf-standard-research",
        revision: app.binding.revision + 1,
        manifest: TemplateManifestSchema.parse(NSF_STANDARD_RESEARCH_TEMPLATE),
      };
      const mappings: Record<string, string> = {
        summary: "summary-overview",
        significance: "description-context",
        approach: "description-methods",
      };
      app.sections = NSF_STANDARD_RESEARCH_TEMPLATE.sections
        .filter((s) => s.kind === "content")
        .map((def) => {
          const prior = old
            .find((s) => mappings[s.key] === def.id)
            ?.revisions.at(-1);
          return {
            key: def.id,
            label: def.heading,
            wordLimit: def.limits.words,
            revisions: prior
              ? [copiedRevision(app, state, prior.text, prior)]
              : [],
            reviews: [],
          };
        });
    }
    touch(app, at);
    return app.id;
  }
  if (c.type === "confirmTemplate") {
    if (app.binding.templateId !== "nsf-standard-research")
      error("Select the NSF template before recording its confirmation.");
    for (const mapping of c.mappings)
      if (
        !app.requirements.some((r) => r.id === mapping.requirementId) ||
        (mapping.sectionId &&
          !app.sections.some((s) => s.key === mapping.sectionId))
      )
        error("Map requirements only to sections in this application.");
    app.bindingHistory.push(structuredClone(app.binding));
    app.binding = {
      ...app.binding,
      revision: app.binding.revision + 1,
      answers: c.answers,
      mappings: c.mappings,
      confirmedAt: at,
      confirmedBy: c.by,
      confirmationNote: c.note,
      callRevision: call.revision,
      callSourceVersion: call.sourceVersion,
    };
    for (const mapping of c.mappings) {
      const req = app.requirements.find((r) => r.id === mapping.requirementId)!;
      if (req.category === "section") req.sectionKey = mapping.sectionId;
    }
    touch(app, at);
    return app.id;
  }
  if (c.type === "freezePacket") {
    const project = record(state.projects, app.projectId);
    const report = readiness(state, app);
    const used = new Set([
      call.sourceId,
      ...app.sections.flatMap(
        (s) => s.revisions.at(-1)?.selectedSources.map((r) => r.sourceId) ?? [],
      ),
      ...app.sections.flatMap(
        (s) => s.revisions.at(-1)?.citations.map((r) => r.sourceId) ?? [],
      ),
      ...app.requirements.flatMap((r) =>
        r.citation ? [r.citation.sourceId] : [],
      ),
    ]);
    const payload = {
      application: structuredClone({ ...app, requirementsHistory: [] }),
      project: structuredClone({ ...project, history: [] }),
      call: structuredClone({ ...call, history: [] }),
      sources: structuredClone(state.sources.filter((s) => used.has(s.id))),
      library: structuredClone(
        state.contentLibrary.filter((item) =>
          app.sections.some((s) =>
            s.revisions
              .at(-1)
              ?.reusedContent?.some((ref) => ref.itemId === item.id),
          ),
        ),
      ),
      issues: report.issues,
      rulesVersion: report.rulesVersion,
    };
    if (canonicalStringify(payload).length > 1_000_000)
      error(
        "This frozen packet exceeds 1,000,000 characters. Reduce retained selected evidence or section content before freezing.",
      );
    const snapshot = {
      id: id("packet"),
      applicationId: app.id,
      createdAt: at,
      digest: sha256(canonicalStringify(payload)),
      payload,
    };
    state.packetSnapshots.push(snapshot);
    return snapshot.id;
  }
  const section =
    app.sections.find((s) => s.key === c.sectionKey) ??
    error("Section not found in this application.");
  const current = section.revisions.at(-1);
  if (c.type === "reviewSection") {
    if (!current || current.id !== c.revisionId)
      error(
        "The draft changed before review. Inspect its current saved revision first.",
      );
    section.reviews ??= [];
    section.reviews.push({ revisionId: current!.id, by: c.by, at });
    touch(app, at);
    return section.key;
  }
  if (c.type === "saveContent") {
    if (!current?.text.trim())
      error("Save a nonempty section before creating reusable content.");
    const item = c.itemId
      ? record(state.contentLibrary, c.itemId)
      : {
          id: id("content"),
          projectId: app.projectId,
          title: c.title,
          category: c.category,
          scope: c.scope,
          retiredAt: null,
          createdAt: at,
          versions: [],
        };
    if (item.projectId !== app.projectId)
      error(
        "Revise content from its source project. Cross-project use is a reviewed copy.",
      );
    const refs = new Set([
      ...current!.selectedSources.map((s) => s.sourceId),
      ...current!.citations.map((s) => s.sourceId),
    ]);
    item.title = c.title;
    item.category = c.category;
    item.scope = c.scope;
    item.versions.push({
      revision: item.versions.length + 1,
      text: current!.text,
      blocks: structuredClone(current!.blocks ?? textBlocks(current!.text)),
      citations: structuredClone(current!.citations),
      sources: structuredClone(state.sources.filter((s) => refs.has(s.id))),
      originApplicationId: app.id,
      originSectionKey: section.key,
      originRevisionId: current!.id,
      approvedBy: "",
      approvedAt: null,
      createdAt: at,
    });
    if (!c.itemId) state.contentLibrary.push(item);
    return item.id;
  }
  const item = record(state.contentLibrary, c.itemId);
  if (c.type === "resolveReuse") {
    const reference =
      current?.reusedContent?.find((r) => r.itemId === item.id) ??
      error("This draft does not use that library item.");
    const newest = item.versions.at(-1)!;
    if (c.action === "keep")
      app.reuseDecisions.push({
        itemId: item.id,
        sectionKey: section.key,
        seenRevision: newest.revision,
        reason: c.reason,
        at,
      });
    else {
      if (!newest.approvedAt)
        error(
          "Approve the updated library revision before proposing an update.",
        );
      const old = item.versions.find((v) => v.revision === reference.revision)!;
      if (!current!.text.includes(old.text))
        error(
          "The copied content was edited. Compare versions and apply the revised text manually; automatic replacement would lose your edits.",
        );
      const next = copiedRevision(
        app,
        state,
        current!.text.replace(old.text, newest.text),
        current!,
      );
      next.reusedContent = current!.reusedContent!.map((ref) =>
        ref.itemId === item.id
          ? { ...ref, revision: newest.revision, contextNote: c.reason }
          : ref,
      );
      section.revisions.push(next);
    }
    touch(app, at);
    return section.key;
  }
  if (item.retiredAt)
    error(
      "Retired content remains available in history but cannot be inserted again.",
    );
  const version =
    item.versions.find((v) => v.revision === c.revision) ??
    error("Reusable content revision is unavailable.");
  if (!version.approvedAt)
    error(
      "The researcher must approve this exact library revision before reuse.",
    );
  const sourceMap = new Map<string, string>();
  for (const original of version.sources) {
    if (original.projectId === null || original.projectId === app.projectId) {
      sourceMap.set(original.id, original.id);
      continue;
    }
    if (state.sources.filter((s) => s.projectId === app.projectId).length >= 10)
      error(
        "This target project already has ten evidence notes. Select target evidence or reduce notes before copying cross-project support.",
      );
    const clone = structuredClone(original);
    clone.id = id("reuse-source");
    clone.projectId = app.projectId;
    clone.title = "Reviewed reuse evidence: " + original.title;
    clone.provenance = "researcher";
    state.sources.push(clone);
    sourceMap.set(original.id, clone.id);
  }
  const text = (current?.text ? current.text + "\n\n" : "") + version.text;
  if (text.length > 20_000)
    error("This insertion would exceed the section text limit.");
  const next = copiedRevision(app, state, text, current);
  next.blocks = [
    ...(current?.blocks ?? textBlocks(current?.text ?? "")),
    ...structuredClone(version.blocks),
  ];
  next.text = visibleText({ blocks: next.blocks });
  next.citations = [
    ...(current?.citations ?? []),
    ...version.citations.map((ref) => ({
      ...ref,
      sourceId: sourceMap.get(ref.sourceId) ?? ref.sourceId,
    })),
  ];
  const selected = [
    ...(current?.selectedSources ?? []),
    ...version.sources
      .filter((s) => s.projectId !== null)
      .map((s) => ({
        sourceId: sourceMap.get(s.id)!,
        version: latest(s).version,
        hash: latest(s).hash,
      })),
  ];
  next.selectedSources = [
    ...new Map(selected.map((s) => [s.sourceId, s])).values(),
  ];
  next.reusedContent = [
    ...(current?.reusedContent ?? []),
    { itemId: item.id, revision: version.revision, contextNote: c.contextNote },
  ];
  section.revisions.push(next);
  touch(app, at);
  return section.key;
}
