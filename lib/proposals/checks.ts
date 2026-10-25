import { contentHash } from "../../modules/documents/src/index";
import { latest } from "../evidence";
import type {
  Application,
  ContentItem,
  PacketSnapshot,
  State,
} from "../schema";
import { resolveTemplate, exportComponentPlan } from "./nsf-template";
export function snapshotInputsMatch(
  snapshot: PacketSnapshot,
  state: State,
  app: Application,
) {
  const p = snapshot.payload,
    project = state.projects.find((r) => r.id === app.projectId),
    call = state.opportunities.find((r) => r.id === app.opportunityId);
  return (
    p.application.id === app.id &&
    p.project.revision === project?.revision &&
    p.call.revision === call?.revision &&
    p.call.sourceVersion === call?.sourceVersion &&
    p.application.binding?.revision === app.binding?.revision &&
    app.sections.every(
      (section) =>
        p.application.sections
          .find((s) => s.key === section.key)
          ?.revisions.at(-1)?.id === section.revisions.at(-1)?.id,
    ) &&
    p.sources.every((source) => {
      const now = state.sources.find((s) => s.id === source.id);
      return (
        !!now &&
        latest(now).version === latest(source).version &&
        latest(now).hash === latest(source).hash
      );
    })
  );
}
export function contentSourceFingerprint(item: ContentItem, state: State) {
  return contentHash(
    JSON.stringify(
      item.versions
        .at(-1)!
        .sources.map((source) => {
          const now = state.sources.find((s) => s.id === source.id);
          return [
            source.id,
            now ? latest(now).version : null,
            now ? latest(now).hash : null,
          ];
        })
        .sort(),
    ),
  );
}
export function activeSectionKeys(app: Application) {
  if (!app.binding?.manifest) return new Set(app.sections.map((s) => s.key));
  return new Set(
    resolveTemplate(app.binding.manifest, app.binding.answers)
      .sections.filter(
        (s) =>
          s.section.kind === "content" && s.applicability !== "not-applicable",
      )
      .map((s) => s.section.id),
  );
}
export type ProposalIssue = {
  id: string;
  severity: "blocker" | "warning";
  location: string;
  message: string;
  fix: string;
};
export function proposalIssues(
  state: State,
  app: Application,
): ProposalIssue[] {
  if (!app.binding?.manifest) return [];
  const binding = app.binding,
    manifest = binding.manifest!,
    call = state.opportunities.find((c) => c.id === app.opportunityId)!;
  const issues: ProposalIssue[] = [],
    add = (
      id: string,
      location: string,
      message: string,
      fix: string,
      severity: ProposalIssue["severity"] = "blocker",
    ) => issues.push({ id, severity, location, message, fix });
  if (
    !binding.confirmedAt ||
    binding.callRevision !== call.revision ||
    binding.callSourceVersion !== call.sourceVersion
  )
    add(
      "template-confirmation",
      "Template binding",
      "The actual call/template reconciliation is missing or stale.",
      "Review applicability, source rules and requirement mappings, then confirm the binding.",
    );
  const resolved = resolveTemplate(manifest, binding.answers);
  for (const finding of resolved.coverageFindings)
    add(
      "scope-" + finding.questionId,
      "Template coverage",
      finding.message,
      "Record the supported scope or a source-backed manual preparation decision. A waiver cannot make an unsupported package supported.",
    );
  for (const { section, applicability } of resolved.sections)
    if (section.kind === "content" && applicability === "unresolved")
      add(
        "condition-" + section.id,
        section.heading,
        "Applicability is unknown.",
        "Answer the template applicability question; unknown cannot silently exclude this component.",
      );
  const active = activeSectionKeys(app);
  for (const section of app.sections.filter((s) => active.has(s.key))) {
    const draft = section.revisions.at(-1);
    if (!draft) continue;
    if (!section.reviews?.some((r) => r.revisionId === draft.id))
      add(
        "section-review-" + section.key,
        section.label,
        "This saved proposal revision needs researcher review.",
        "Inspect content/support and explicitly mark this exact revision reviewed.",
      );
    if (draft.bindingRevision !== binding.revision)
      add(
        "binding-input-" + section.key,
        section.label,
        "The template binding changed after this draft revision.",
        "Review the new rules/mapping and save a new section revision.",
      );
    if (
      draft.blocks &&
      !draft.blocks.some((b) =>
        b.type === "paragraph"
          ? !!b.text.trim()
          : b.type === "list"
            ? b.items.some((x) => x.trim())
            : b.type === "table"
              ? b.rows.length > 0
              : false,
      )
    )
      add(
        "body-" + section.key,
        section.label,
        "The section has headings but no narrative content.",
        "Add substantive supported text or record an honest missing input.",
      );
    if (
      section.key.startsWith("description-") &&
      /https?:\/\/|\bwww\./i.test(draft.text)
    )
      add(
        "urls-" + section.key,
        section.label,
        "A URL appears in the Project Description.",
        "Review the actual sponsor rule and remove the URL or document an applicable sourced exception.",
      );
    for (const ref of draft.reusedContent ?? []) {
      const item = state.contentLibrary.find((r) => r.id === ref.itemId),
        version = item?.versions.find((v) => v.revision === ref.revision);
      if (!item || !version) {
        add(
          "reuse-missing-" + section.key + "-" + ref.itemId,
          section.label,
          "A reusable-content revision is missing.",
          "Restore the retained revision before using this draft.",
        );
        continue;
      }
      const newest = item.versions.at(-1)!;
      const kept = app.reuseDecisions?.some(
        (d) =>
          d.itemId === item.id &&
          d.sectionKey === section.key &&
          d.seenRevision === newest.revision &&
          d.sourceFingerprint === contentSourceFingerprint(item, state),
      );
      const sourceChanged = version.sources.some((source) => {
        const now = state.sources.find((s) => s.id === source.id);
        return (
          !now ||
          latest(now).hash !== latest(source).hash ||
          latest(now).version !== latest(source).version
        );
      });
      if ((newest.revision !== ref.revision || sourceChanged) && !kept)
        add(
          "reuse-update-" + section.key + "-" + item.id,
          section.label,
          "Reusable content or its original supporting source changed.",
          "Compare exact revisions; keep the pinned copy with a reason or apply a reviewed update.",
        );
      if (!version.approvedAt)
        add(
          "reuse-approval-" + section.key + "-" + item.id,
          section.label,
          "The referenced reusable-content revision was not approved.",
          "Review and approve its exact permitted scope.",
        );
      if (item.retiredAt)
        add(
          "reuse-retired-" + section.key + "-" + item.id,
          section.label,
          "This draft retains content from a retired library item.",
          "Inspect its historical scope and support.",
          "warning",
        );
    }
  }
  for (const { task, applicability } of resolved.externalTasks) {
    if (applicability === "not-applicable") continue;
    const status = app.externalTasks?.find(
      (r) => r.id === task.id && r.bindingRevision === binding.revision,
    );
    if (applicability === "unresolved" || status?.status !== "Ready")
      add(
        "external-" + task.id,
        task.label,
        applicability === "unresolved"
          ? "External-task applicability is unknown."
          : "This official external task is not recorded complete for this binding.",
        "Complete it in the authorized system and record its status. Local narrative checks cannot certify it.",
      );
  }
  const jobs = state.proposalExports
    .filter((job) =>
      state.packetSnapshots.some(
        (snapshot) =>
          snapshot.id === job.snapshotId &&
          snapshotInputsMatch(snapshot, state, app),
      ),
    )
    .reverse();
  for (const group of exportComponentPlan(manifest, binding.answers).filter(
    (group) => group.applicability !== "not-applicable",
  )) {
    const limits = [
      { id: group.component.id, limit: group.aggregateLimits.pages },
      ...group.sections
        .filter(
          (s) =>
            s.section.limits.pages !== null &&
            s.section.id !== group.component.rootSectionId,
        )
        .map((s) => ({ id: s.section.id, limit: s.section.limits.pages })),
    ];
    for (const constraint of limits) {
      if (constraint.limit === null) continue;
      const measurement = jobs
        .flatMap((job) => job.measurements)
        .find((m) => m.componentId === constraint.id);
      if (!measurement || measurement.pages === null)
        add(
          "pages-" + constraint.id,
          group.component.label,
          "Actual rendered page count is Unknown or stale.",
          "Freeze the saved inputs and render the exact PDF. Word counts do not establish page compliance.",
        );
      else if (measurement.pages > constraint.limit)
        add(
          "pages-" + constraint.id,
          group.component.label,
          `Rendered ${measurement.pages} pages exceeds the ${constraint.limit}-page limit.`,
          "Revise and re-render; fonts or content must never be silently shrunk/truncated.",
        );
    }
  }
  return issues;
}
