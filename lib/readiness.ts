import {
  attachmentIssues,
  phaseApplies,
  ethicsFingerprint,
  sourceFileExcluded,
} from "./vault/domain";
import type { Phase } from "./vault/schema";
import { activeSectionKeys, proposalIssues } from "./proposals/checks";
import { matchOpportunities } from "./calls";
import { citationStale, latest, validCitation } from "./evidence";
import { type Application, type State } from "./schema";
import { contentHash } from "../modules/documents/src/index";

export type Issue = {
  id: string;
  fingerprint: string;
  severity: "blocker" | "warning";
  location: string;
  message: string;
  fix: string;
  waived: string | null;
};
export const wordCount = (text: string) =>
  text.trim() ? text.trim().split(/\s+/u).length : 0;
export function readiness(
  state: State,
  app: Application,
  phase: Phase = "application",
) {
  const issues: Issue[] = [];
  const add = (
    id: string,
    severity: Issue["severity"],
    location: string,
    message: string,
    fix: string,
    context?: unknown,
  ) => {
    const fingerprint = contentHash(
      JSON.stringify({ severity, location, message, fix, context }),
    );
    issues.push({
      id,
      fingerprint,
      severity,
      location,
      message,
      fix,
      waived: /^(scope-|condition-|pages-|vault-)/.test(id)
        ? null
        : (app.waivers.find(
            (w) => w.issueId === id && w.fingerprint === fingerprint,
          )?.reason ?? null),
    });
  };
  const project = state.projects.find((p) => p.id === app.projectId)!;
  const call = state.opportunities.find((c) => c.id === app.opportunityId)!;
  const match = matchOpportunities(project, [call])[0]!;
  if (match.status !== "Potential fit")
    add(
      "eligibility",
      "blocker",
      "Opportunity",
      `${match.status}: ${[...match.reasons, ...match.unresolved].join(" ")}`,
      "Review call eligibility against known project facts.",
    );
  if (call.deadline.kind === "unknown")
    add(
      "deadline",
      "blocker",
      "Sponsor deadline",
      call.deadline.reason,
      "Confirm a source-supported date and, for timed deadlines, its offset.",
    );
  if (
    !app.requirementsReviewed ||
    app.requirementsSourceVersion !== call.sourceVersion
  )
    add(
      "review",
      "blocker",
      "Checklist",
      "Call requirement review is incomplete or stale. Empty extraction does not prove there are no requirements.",
      "Inspect the whole call, add missing requirements and confirm the review.",
    );
  for (const req of app.requirements) {
    const location = req.description;
    if (req.origin === "sponsor" && req.review !== "confirmed")
      add(
        `req-review-${req.id}`,
        "blocker",
        location,
        "Proposed requirement needs researcher confirmation.",
        "Review the source quote and confirm or correct this item.",
      );
    if (req.obligation === "unknown")
      add(
        `req-obligation-${req.id}`,
        "blocker",
        location,
        "Required or optional status is unknown.",
        "Confirm the obligation from the source.",
      );
    if (req.origin === "sponsor" && !req.citation)
      add(
        `req-unsupported-${req.id}`,
        "warning",
        location,
        "This requirement is an unsupported user-entered override.",
        "Add exact source support or retain the visible manual label.",
      );
    if (req.citation && !validCitation(req.citation, state.sources))
      add(
        `req-invalid-${req.id}`,
        "blocker",
        location,
        "Source reference is invalid.",
        "Replace the reference with an exact quote from a retained source version.",
      );
    else if (req.citation && citationStale(req.citation, state))
      add(
        `req-stale-${req.id}`,
        "blocker",
        location,
        "The call source has changed since this requirement was extracted.",
        "Re-extract and review the new call, preserving the old record in the export/history.",
      );
    if (
      req.linkedSourceId &&
      !state.sources.some(
        (s) => s.id === req.linkedSourceId && s.projectId === app.projectId,
      )
    )
      add(
        `req-link-${req.id}`,
        "blocker",
        location,
        "Linked evidence is unavailable for this project.",
        "Choose an evidence note in this project.",
      );
    if (req.obligation === "required" && req.category !== "section") {
      for (const [i, message] of attachmentIssues(
        state,
        app,
        req,
        phase,
      ).entries())
        add(
          `vault-${req.id}-${i}`,
          "blocker",
          location,
          message,
          "Review the phase, selected file and constraints.",
          {
            vault: req.vault,
            selection: state.attachmentSelections
              .filter(
                (s) => s.applicationId === app.id && s.requirementId === req.id,
              )
              .at(-1),
          },
        );
    }
    const today = new Intl.DateTimeFormat("en-CA", {
      timeZone: "America/New_York",
    }).format(new Date());
    if (
      req.vault &&
      !phaseApplies(req.vault.phase, phase, req.vault.requiredDate, today)
    )
      continue;
    if (req.obligation === "required" && req.vault?.ethicsRecordId) {
      const e = state.ethicsRecords
        .find((e) => e.id === req.vault!.ethicsRecordId)
        ?.revisions.at(-1);
      if (
        !e ||
        e.phase !== req.vault.phase ||
        e.requiredDate !== req.vault.requiredDate
      )
        add(
          `vault-ethics-link-${req.id}`,
          "blocker",
          location,
          "Linked ethics timing differs from the confirmed requirement.",
          "Review and align the requirement timing and ethics scope confirmation.",
        );
    }
    if (req.obligation === "required" && req.review === "confirmed") {
      if (req.category === "section") {
        const section = app.sections.find((s) => s.key === req.sectionKey);
        const revision = section?.revisions.at(-1);
        if (!section || !revision?.text.trim())
          add(
            `req-section-${req.id}`,
            "blocker",
            location,
            "Required sponsor section is empty or has no mapping to a starter section.",
            "Map this requirement to a proposal section and draft it.",
          );
        else if (req.wordLimit && wordCount(revision.text) > req.wordLimit)
          add(
            `req-limit-${req.id}`,
            "blocker",
            location,
            `Draft exceeds the sponsor requirement limit of ${req.wordLimit} words.`,
            "Reduce the draft to the confirmed sponsor limit.",
          );
      } else if (req.status !== "Ready")
        add(
          `req-missing-${req.id}`,
          "blocker",
          location,
          `Required ${req.category} is ${req.status.toLowerCase()}.`,
          "Record document/task progress; Ready is a researcher status, not certification.",
        );
    }
  }
  const today = new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/New_York",
  }).format(new Date());
  for (const record of state.ethicsRecords.filter(
    (r) => r.projectId === app.projectId,
  )) {
    const e = record.revisions.at(-1)!;
    if (!phaseApplies(e.phase, phase, e.requiredDate, today)) continue;
    const relevantDate =
      e.requiredDate ||
      (e.phase === "before-research" ? project.profile.startDate : "") ||
      today;
    if (
      e.phase === "unknown" ||
      !e.confirmation ||
      e.confirmation.fingerprint !== ethicsFingerprint(e, state) ||
      !["approved", "exempt", "not-applicable"].includes(e.status) ||
      e.expiry.kind === "unknown" ||
      e.supportingVersionIds.some(
        (id) =>
          state.documentVersions.find((v) => v.id === id)?.integrity !==
          "available",
      ) ||
      (e.expiry.kind === "date" &&
        (e.expiry.date < today || e.expiry.date < relevantDate))
    )
      add(
        `vault-ethics-${record.id}`,
        "blocker",
        e.category,
        `Ethics scope, status, timing or expiry needs review (revision ${e.revision}).`,
        "Record and confirm current scope and supporting versions; no institutional certification is inferred.",
      );
  }
  const activeKeys = activeSectionKeys(app);
  for (const section of app.sections.filter((section) =>
    activeKeys.has(section.key),
  )) {
    const revision = section.revisions.at(-1),
      location = section.label;
    if (!revision?.text.trim()) {
      if (
        app.binding?.manifest?.sections.find((s) => s.id === section.key)
          ?.requiredness === "optional"
      )
        continue;
      add(
        `empty-${section.key}`,
        "blocker",
        location,
        "Draft section is empty.",
        "Write and save this section.",
      );
      continue;
    }
    if (
      /\[[^\]]*(?:TODO|MISSING|CONFIRM|INPUT|NEEDED|PLACEHOLDER)[^\]]*\]|\b(?:TODO|TBD|INSERT HERE)\b|\{\{[^}]+\}\}/i.test(
        revision.text,
      )
    )
      add(
        `placeholder-${section.key}`,
        "blocker",
        location,
        "Unresolved placeholder remains in the draft.",
        "Supply the missing fact or explain the limitation honestly.",
      );
    if (section.wordLimit && wordCount(revision.text) > section.wordLimit)
      add(
        `words-${section.key}`,
        "blocker",
        location,
        `${wordCount(revision.text)} words exceeds the ${section.wordLimit} word limit.`,
        "Shorten the section or confirm an updated limit.",
      );
    if (
      revision.projectRevision !== project.revision ||
      revision.callRevision !== call.revision ||
      revision.callSourceVersion !== call.sourceVersion
    )
      add(
        `inputs-${section.key}`,
        "blocker",
        location,
        "Project facts or confirmed call inputs changed after this draft was saved.",
        "Review the changed inputs, then save a reviewed draft revision.",
      );
    if (
      revision.selectedSources.some((ref) => {
        const source = state.sources.find((s) => s.id === ref.sourceId);
        return (
          !source ||
          latest(source).version !== ref.version ||
          latest(source).hash !== ref.hash
        );
      })
    )
      add(
        `sources-${section.key}`,
        "blocker",
        location,
        "Selected evidence changed after this draft was saved; the earlier snapshot is retained.",
        "Review the updated evidence and save a new revision.",
      );
    // Current readiness must apply the same original-file policy as generation
    // to both selected-only evidence and explicit quotations. Historical drafts
    // and frozen packets retain their exact references independently.
    const fileEvidenceProblems=[...revision.selectedSources,...revision.citations].flatMap(ref=>{
      const source=state.sources.find(s=>s.id===ref.sourceId);
      if(!source)return [];
      const origin=source.versions.find(v=>v.version===ref.version&&v.hash===ref.hash)?.fileOrigin??latest(source).fileOrigin;
      if(!origin)return [];
      const document=state.documents.find(d=>d.id===origin.documentId),original=state.documentVersions.find(v=>v.id===origin.documentVersionId),currentHead=document?.versionIds.at(-1),excluded=sourceFileExcluded(source,state);
      if(!excluded&&(origin.manualEdit||(currentHead===origin.reviewedHeadId&&original?.integrity==="available")))return [];
      return [{sourceId:source.id,version:ref.version,hash:ref.hash,documentVersionId:origin.documentVersionId,reviewedHeadId:origin.reviewedHeadId,currentHead:currentHead??null,integrity:original?.integrity??"missing",manualEdit:origin.manualEdit,excluded}];
    });
    if(fileEvidenceProblems.length)add(`vault-evidence-${section.key}`,"blocker",location,"An original file supporting selected or quoted evidence is missing, corrupt, replaced or excluded from research evidence.","Restore the verified original or review the current file and promote a supported excerpt, then review the draft.",{references:fileEvidenceProblems});
    if (revision.citations.some((c) => !validCitation(c, state.sources)))
      add(
        `citations-${section.key}`,
        "blocker",
        location,
        "A draft source reference does not resolve.",
        "Replace the invalid citation.",
      );
    else if (revision.citations.some((c) => citationStale(c, state)))
      add(
        `citations-stale-${section.key}`,
        "blocker",
        location,
        "A cited source version is stale.",
        "Inspect the old and current source, then revise the draft.",
      );
    if (revision.missingInputs.length)
      add(
        `missing-inputs-${section.key}`,
        "blocker",
        location,
        `Unresolved drafting inputs: ${revision.missingInputs.join("; ")}`,
        "Resolve the input requests in a reviewed manual revision.",
      );
    if (!revision.citations.length)
      add(
        `no-citations-${section.key}`,
        "warning",
        location,
        "This section has no linked source quotations.",
        "Select supporting evidence and inspect the claims.",
      );
  }
  if (call.lastCheckedAt === null)
    add(
      "freshness",
      "warning",
      "Call source",
      "The researcher has not recorded a source check.",
      "Compare the saved call with its official source and record review.",
    );
  for (const issue of proposalIssues(state, app))
    add(issue.id, issue.severity, issue.location, issue.message, issue.fix);
  return {
    rulesVersion: "grantpath-readiness-3.1",
    applicationRevision: app.revision,
    evaluatedAt: new Date().toISOString(),
    issues,
    blockers: issues.filter((i) => i.severity === "blocker" && !i.waived)
      .length,
    warnings: issues.filter((i) => i.severity === "warning" && !i.waived)
      .length,
  };
}
