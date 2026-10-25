import { readiness } from "./readiness";
import { deadlineLabel } from "./calendar";
import { type Application, type State } from "./schema";
export function exportPacket(state: State, app: Application) {
  const project = state.projects.find((p) => p.id === app.projectId)!;
  const call = state.opportunities.find((c) => c.id === app.opportunityId)!;
  const review = readiness(state, app);
  const lines = [
    `# ${project.profile.title}`,
    "",
    `Application: ${call.title} — ${call.funder}`,
    `Stage: ${app.stage}; application revision ${app.revision}`,
    `Data: ${app.provenance === "demo" || call.provenance === "demo" ? "DEMO / synthetic call or project" : "Researcher-provided; not independently verified"}`,
    `Sponsor deadline: ${deadlineLabel(call.deadline)}`,
    "",
    "> Researcher review required. This starter packet does not establish sponsor completeness, scientific merit, ethics approval or submission.",
    "",
    "## Current draft",
  ];
  for (const section of app.sections) {
    const revision = section.revisions.at(-1);
    lines.push(
      "",
      `### ${section.label}`,
      "",
      revision?.text || "[MISSING: draft section]",
      "",
      `Word limit: ${section.wordLimit ?? "unknown"}; mode: ${revision?.mode ?? "manual"}; saved revisions: ${section.revisions.length}.`,
    );
    if (revision)
      lines.push(
        `Input snapshot: project r${revision.projectRevision}; call r${revision.callRevision}, source v${revision.callSourceVersion}; prompt ${revision.promptVersion}.`,
        ...revision.missingInputs.map((x) => `- [MISSING INPUT] ${x}`),
      );
  }
  lines.push(
    "",
    "## Application checklist",
    "",
    `Whole-call review: ${app.requirementsReviewed ? "researcher recorded complete" : "INCOMPLETE"}; source v${app.requirementsSourceVersion}.`,
  );
  for (const req of app.requirements)
    lines.push(
      `- [${req.status === "Ready" ? "x" : " "}] ${req.description} | ${req.category} | ${req.obligation} | ${req.review} | ${req.origin}${req.manual ? " / user-entered override" : ""} | ${req.status}`,
      `  Due: ${deadlineLabel(req.due)}; responsible: ${req.responsible || "unassigned"}; reference: ${req.reference || "none"}; note: ${req.note || "none"}.`,
    );
  for (const history of app.requirementsHistory) {
    lines.push(
      "",
      `### Prior checklist snapshot: source v${history.sourceVersion}, ${history.at}`,
    );
    for (const item of history.items)
      lines.push(
        `- ${item.description} | ${item.status} | ${item.review} | note: ${item.note || "none"}`,
      );
  }
  lines.push(
    "",
    "## Readiness issues",
    "",
    `${review.blockers} active blockers; ${review.warnings} active warnings. Rules: ${review.rulesVersion}.`,
  );
  for (const issue of review.issues)
    lines.push(
      `- ${issue.severity.toUpperCase()} ${issue.location}: ${issue.message} Fix: ${issue.fix}${issue.waived ? ` WAIVED by researcher: ${issue.waived}` : ""}`,
    );
  lines.push(
    "",
    "## Source appendix",
    "",
    "Quotations establish provenance, not independent verification of a claim. Offsets use normalized UTF-16, end-exclusive coordinates.",
  );
  const citations = [
    ...app.requirements.flatMap((r) => (r.citation ? [r.citation] : [])),
    ...app.sections.flatMap((s) => s.revisions.at(-1)?.citations ?? []),
  ];
  for (const [i, c] of citations.entries()) {
    const source = state.sources.find((s) => s.id === c.sourceId);
    lines.push(
      "",
      `### Reference ${i + 1}: ${source?.title ?? "INVALID SOURCE"}`,
      `Source ${c.sourceId}, v${c.version}, hash ${c.hash}, offsets [${c.start}, ${c.end}); provenance ${source?.provenance ?? "unknown"}.`,
      `URL (not fetched or verified): ${source?.url || "none"}`,
      "",
      ...c.quote.split("\n").map((line) => `> ${line}`),
    );
  }
  lines.push("", "## Retained input snapshots");
  for (const section of app.sections)
    for (const ref of section.revisions.at(-1)?.selectedSources ?? []) {
      const source = state.sources.find((s) => s.id === ref.sourceId),
        version = source?.versions.find((v) => v.version === ref.version);
      lines.push(
        "",
        `### ${source?.title ?? ref.sourceId} v${ref.version} / ${ref.hash}`,
        "",
        version?.text ?? "[MISSING: source snapshot]",
      );
    }
  return lines.join("\n") + "\n";
}
