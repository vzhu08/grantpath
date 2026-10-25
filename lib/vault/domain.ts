import { contentHash, normalizeText } from "../../modules/documents/src/index";
import { KitError } from "../../packages/runtime/src/index";
import type {
  State,
  Command,
  Requirement,
  Application,
  Source,
} from "../schema";
import type { Phase } from "./schema";
const fail = (message: string, status = 422): never => {
  throw new KitError("VAULT_INPUT", message, status);
};
const uid = (prefix: string) => `${prefix}-${crypto.randomUUID()}`;
export const vaultKinds = [
  "editDocumentMetadata",
  "archiveDocument",
  "selectAttachment",
  "reviewAttachment",
  "promoteFileExcerpt",
  "saveEthicsRecord",
  "confirmEthicsRecord",
] as const;
export type VaultCommand = Extract<
  Command,
  { type: (typeof vaultKinds)[number] }
>;
export const isVaultCommand = (c: Command): c is VaultCommand =>
  vaultKinds.includes(c.type as (typeof vaultKinds)[number]);
export function record<T extends { id: string }>(items: T[], id: string): T {
  return (
    items.find((x) => x.id === id) ??
    fail("The selected vault record is unavailable. Reload saved data.", 404)
  );
}
export const requirementFingerprint = (r: Requirement) =>
  contentHash(
    JSON.stringify({
      description: r.description,
      obligation: r.obligation,
      review: r.review,
      citation: r.citation,
      vault: r.vault ?? null,
    }),
  );
export const ethicsFingerprint = (
  r: State["ethicsRecords"][number]["revisions"][number],
  state?: State,
) =>
  contentHash(
    JSON.stringify({
      ...r,
      confirmation: null,
      heads: state
        ? r.supportingVersionIds.map((id) => {
            const f = state.documentVersions.find((v) => v.id === id);
            return state.documents
              .find((d) => d.id === f?.documentId)
              ?.versionIds.at(-1);
          })
        : [],
    }),
  );
export function sourceFileExcluded(source: Source, state: State) {
  const o = source.versions.at(-1)?.fileOrigin;
  if (!o) return false;
  const d = state.documents.find((d) => d.id === o.documentId);
  return (
    !d ||
    /ethic|approval|irb|animal|data-use/i.test(d.category) ||
    state.ethicsRecords.some((r) =>
      r.revisions.some((e) =>
        e.supportingVersionIds.includes(o.documentVersionId),
      ),
    )
  );
}
export function sourceFileStale(source: Source, state: State) {
  const o = source.versions.at(-1)?.fileOrigin;
  if (!o) return false;
  return (
    !o.manualEdit &&
    state.documents.find((d) => d.id === o.documentId)?.versionIds.at(-1) !==
      o.reviewedHeadId
  );
}
export function validateVaultState(state: State): State {
  for (const list of [
    state.documents,
    state.documentVersions,
    state.parseAttempts,
    state.attachmentSelections,
    state.ethicsRecords,
    state.handoffs,
    state.ethicsTasks,
  ])
    if (new Set(list.map((x) => x.id)).size !== list.length)
      fail("Duplicate vault identifiers in storage.");
  for (const d of state.documents) {
    record(state.projects, d.projectId);
    if (
      d.versionIds.length < 1 ||
      new Set(d.versionIds).size !== d.versionIds.length
    )
      fail("Invalid document history.");
    d.versionIds.forEach((id, i) => {
      const v = record(state.documentVersions, id);
      if (v.documentId !== d.id || v.version !== i + 1)
        fail("Invalid immutable file version sequence.");
    });
  }
  for (const v of state.documentVersions)
    if (!record(state.documents, v.documentId).versionIds.includes(v.id))
      fail("Unlinked file version.");
  for (const p of state.parseAttempts)
    record(state.documentVersions, p.documentVersionId);
  for (const s of state.attachmentSelections) {
    const a = record(state.applications, s.applicationId),
      v = record(state.documentVersions, s.documentVersionId);
    if (record(state.documents, v.documentId).projectId !== a.projectId)
      fail(
        "Attachment belongs to another project.",
      ); /* historic requirement IDs remain retained after re-extraction */
  }
  for (const s of state.sources)
    for (const v of s.versions) {
      const o = v.fileOrigin;
      if (!o) continue;
      const d = record(state.documents, o.documentId),
        f = record(state.documentVersions, o.documentVersionId),
        p = record(state.parseAttempts, o.parseAttemptId);
      if (
        d.projectId !== s.projectId ||
        f.documentId !== d.id ||
        p.documentVersionId !== f.id ||
        p.artifactSha256 !== o.artifactSha256 ||
        !d.versionIds.includes(o.reviewedHeadId) ||
        o.end <= o.start ||
        o.end > p.textLength
      )
        fail("File evidence origin is invalid.");
    }
  for (const r of state.ethicsRecords) {
    record(state.projects, r.projectId);
    r.revisions.forEach((v, i) => {
      if (v.revision !== i + 1) fail("Invalid ethics revision sequence.");
      for (const id of v.supportingVersionIds) {
        const f = record(state.documentVersions, id);
        if (record(state.documents, f.documentId).projectId !== r.projectId)
          fail("Ethics support belongs to another project.");
      }
    });
  }
  const activeTaskKeys = new Set<string>();
  for (const task of state.ethicsTasks) {
    const parent = record(state.ethicsRecords, task.recordId);
    if (!parent.revisions.some((r) => r.revision === task.revision))
      fail("Ethics task revision is unavailable.");
    if (task.active) {
      const key = `${task.recordId}:${task.kind}`;
      if (
        task.revision !== parent.revisions.at(-1)!.revision ||
        activeTaskKeys.has(key)
      )
        fail(
          "Active ethics tasks must pin the current revision once per kind.",
        );
      activeTaskKeys.add(key);
    }
  }
  if (
    new Set(state.operationReceipts.map((r) => r.key)).size !==
    state.operationReceipts.length
  )
    fail("Duplicate operation receipt keys in storage.");
  for (const receipt of state.operationReceipts) {
    if (receipt.kind === "upload")
      record(state.documentVersions, receipt.resourceId);
    else if (receipt.kind === "parse")
      record(state.parseAttempts, receipt.resourceId);
    else record(state.handoffs, receipt.resourceId);
  }
  for (const a of state.applications)
    for (const r of a.requirements)
      if (
        r.vault?.ethicsRecordId &&
        record(state.ethicsRecords, r.vault.ethicsRecordId).projectId !==
          a.projectId
      )
        fail("Ethics reference belongs to another project.");
  for (const h of state.handoffs) {
    if (record(state.applications, h.applicationId).projectId !== h.projectId)
      fail("Invalid handoff parent.");
    for (const f of h.files) {
      const v = record(state.documentVersions, f.documentVersionId);
      if (
        v.documentId !== f.documentId ||
        record(state.documents, f.documentId).projectId !== h.projectId ||
        v.sha256 !== f.sha256 ||
        v.bytes !== f.bytes
      )
        fail("Invalid immutable handoff file.");
    }
  }
  return state;
}
export function applyVaultCommand(
  state: State,
  c: VaultCommand,
  at: string,
  excerpt?: string,
): string | undefined {
  if (c.type === "editDocumentMetadata") {
    Object.assign(record(state.documents, c.documentId), {
      title: c.title,
      category: c.category,
      owner: c.owner,
      tags: c.tags,
    });
  } else if (c.type === "archiveDocument")
    record(state.documents, c.documentId).archivedAt = c.archived ? at : null;
  else if (c.type === "selectAttachment") {
    const a = record(state.applications, c.applicationId),
      r = record(a.requirements, c.requirementId),
      v = record(state.documentVersions, c.documentVersionId),
      d = record(state.documents, v.documentId);
    if (d.projectId !== a.projectId)
      fail("Choose a document in this application's project.", 403);
    if (d.archivedAt) fail("Unarchive the document before selecting it.");
    if (r.vault?.delivery !== "file-upload")
      fail("Confirm file-upload delivery before selecting a file.");
    state.attachmentSelections.push({
      id: uid("selection"),
      applicationId: a.id,
      requirementId: r.id,
      documentVersionId: v.id,
      selectedAt: at,
      review: null,
    });
    a.revision++;
    a.updatedAt = at;
  } else if (c.type === "reviewAttachment") {
    const a = record(state.applications, c.applicationId),
      s = record(state.attachmentSelections, c.selectionId),
      r = record(a.requirements, s.requirementId),
      v = record(state.documentVersions, s.documentVersionId),
      d = record(state.documents, v.documentId);
    if (s.applicationId !== a.id || d.projectId !== a.projectId)
      fail("Attachment is not in this application.", 403);
    if (
      c.decision === "accepted" &&
      state.parseAttempts
        .filter((p) => p.documentVersionId === v.id)
        .at(-1)
        ?.warnings.some((w) =>
          /CORRUPT_DOCUMENT|INVALID_PDF|PasswordException/.test(w),
        )
    )
      fail(
        "The original is structurally unreadable. Supply a valid replacement before accepting it.",
      );
    if (
      c.decision === "accepted" &&
      (!c.readable ||
        !c.relevant ||
        !c.manualRulesChecked ||
        v.integrity !== "available")
    )
      fail(
        "Verify readable, relevant original bytes and all manual rules before accepting.",
      );
    const updated = { ...s, id: uid("selection"), selectedAt: at };
    updated.review = {
      decision: c.decision,
      readable: c.readable,
      relevant: c.relevant,
      manualRulesChecked: c.manualRulesChecked,
      reason: c.reason,
      by: c.by,
      at,
      fingerprint: requirementFingerprint(r),
      reviewedHeadId: d.versionIds.at(-1)!,
    };
    state.attachmentSelections.push(updated);
    a.revision++;
    a.updatedAt = at;
  } else if (c.type === "promoteFileExcerpt") {
    record(state.projects, c.projectId);
    const v = record(state.documentVersions, c.documentVersionId),
      d = record(state.documents, v.documentId),
      p = record(state.parseAttempts, c.parseAttemptId);
    if (d.projectId !== c.projectId || p.documentVersionId !== v.id)
      fail("Evidence must belong to this project.", 403);
    if (
      /ethic|approval|irb|animal|data-use/i.test(d.category) ||
      state.ethicsRecords.some((r) =>
        r.revisions.some((e) => e.supportingVersionIds.includes(v.id)),
      )
    )
      fail("Ethics files cannot be promoted for generation.");
    if (
      !["parsed", "partial"].includes(p.status) ||
      !p.artifactSha256 ||
      v.integrity !== "available" ||
      !excerpt ||
      c.end <= c.start ||
      c.end - c.start > 20000 ||
      c.end > p.textLength
    )
      fail("Choose an exact reviewed passage from a successful extraction.");
    let source = c.sourceId ? record(state.sources, c.sourceId) : undefined;
    if (
      source &&
      (source.projectId !== c.projectId ||
        source.versions.at(-1)?.fileOrigin?.documentId !== d.id)
    )
      fail("Choose the original file evidence source in this project.");
    if (!source) {
      if (state.sources.filter((s) => s.projectId === c.projectId).length >= 10)
        fail("The project has ten evidence sources. No note was removed.");
      source = {
        id: uid("source"),
        projectId: c.projectId,
        title: c.title,
        type: "other",
        url: "",
        provenance: "researcher",
        createdAt: at,
        updatedAt: at,
        versions: [],
      };
      state.sources.push(source);
    }
    const n = normalizeText({
      id: source.id,
      filename: "excerpt.txt",
      text: excerpt!,
    });
    if (n.text !== excerpt)
      fail(
        "Select normalized text exactly, without surrounding whitespace that changes normalization.",
      );
    source.versions.push({
      version: (source.versions.at(-1)?.version ?? 0) + 1,
      hash: n.hash,
      text: n.text,
      createdAt: at,
      fileOrigin: {
        documentId: d.id,
        documentVersionId: v.id,
        parseAttemptId: p.id,
        artifactSha256: p.artifactSha256!,
        start: c.start,
        end: c.end,
        reviewedHeadId: d.versionIds.at(-1)!,
        reviewedBy: c.by,
        reviewedAt: at,
        reason: c.reason,
        manualEdit: false,
      },
    });
    source.updatedAt = at;
    return source.id;
  } else if (c.type === "saveEthicsRecord") {
    record(state.projects, c.projectId);
    let r = c.id ? record(state.ethicsRecords, c.id) : undefined;
    if (r && r.projectId !== c.projectId)
      fail("Ethics record is in another project.", 403);
    if (!r) {
      r = { id: uid("ethics"), projectId: c.projectId, revisions: [] };
      state.ethicsRecords.push(r);
    }
    if (
      ["exempt", "not-applicable"].includes(c.record.status) &&
      (!c.record.basis.trim() || !c.record.reference.trim())
    )
      fail("Exempt or not-applicable requires a recorded basis and reference.");
    for (const id of c.record.supportingVersionIds) {
      const v = record(state.documentVersions, id);
      if (record(state.documents, v.documentId).projectId !== c.projectId)
        fail("Supporting file belongs to another project.", 403);
    }
    r.revisions.push({
      ...c.record,
      revision: r.revisions.length + 1,
      at,
      confirmation: null,
    });
    syncEthicsTasks(state, r.id, at);
    return r.id;
  } else if (c.type === "confirmEthicsRecord") {
    const r = record(state.ethicsRecords, c.recordId),
      v = r.revisions.at(-1)!;
    if (v.phase === "unknown" || !v.scope.trim() || !v.institution.trim())
      fail("Confirm scope, institution and required phase first.");
    v.confirmation = { by: c.by, at, fingerprint: ethicsFingerprint(v, state) };
    syncEthicsTasks(state, r.id, at);
  }
}
export function syncEthicsTasks(state: State, recordId: string, at: string) {
  const r = record(state.ethicsRecords, recordId),
    v = r.revisions.at(-1)!;
  state.ethicsTasks
    .filter((t) => t.recordId === r.id)
    .forEach((t) => (t.active = false));
  for (const kind of [
    "review",
    ...(v.expiry.kind === "date" ? ["expiry"] : []),
  ] as ("review" | "expiry")[]) {
    state.ethicsTasks.push({
      id: uid("ethics-task"),
      recordId,
      revision: v.revision,
      kind,
      title: `${v.category}: ${kind} (${v.phase})`,
      date:
        kind === "expiry" && v.expiry.kind === "date"
          ? v.expiry.date
          : v.requiredDate,
      active: true,
      at,
    });
  }
}
export function phaseApplies(
  phase: Phase,
  selected: Phase,
  requiredDate: string | null,
  today: string,
) {
  if (phase === "unknown" || selected === "unknown") return true;
  if (phase === "specific-date") return !requiredDate || requiredDate <= today;
  const order = ["application", "pre-award", "before-research"];
  return order.indexOf(phase) <= order.indexOf(selected);
}
export function attachmentIssues(
  state: State,
  app: Application,
  r: Requirement,
  phase: Phase = "application",
  today = new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/New_York",
  }).format(new Date()),
): string[] {
  const v = r.vault;
  if (!v)
    return r.category !== "section" && r.obligation === "required"
      ? ["Delivery method and required phase need review."]
      : [];
  if (!phaseApplies(v.phase, phase, v.requiredDate, today)) return [];
  const issues: string[] = [];
  if (v.phase === "unknown" || (v.phase === "specific-date" && !v.requiredDate))
    issues.push("Required phase or date is unknown.");
  if (v.delivery === "unknown") issues.push("Delivery method is unknown.");
  if (v.delivery !== "file-upload") return issues;
  const s = state.attachmentSelections
    .filter((s) => s.applicationId === app.id && s.requirementId === r.id)
    .at(-1);
  if (!s) return [...issues, "No file version is selected."];
  const f = state.documentVersions.find((f) => f.id === s.documentVersionId),
    d = state.documents.find((d) => d.id === f?.documentId);
  if (!f || !d || d.projectId !== app.projectId || f.integrity !== "available")
    return [
      ...issues,
      "Original bytes are missing, unchecked, corrupt or outside this project.",
    ];
  if (v.allowedMime.length && !v.allowedMime.includes(f.mime))
    issues.push("Selected file does not match the required format.");
  if (v.maxBytes && f.bytes > v.maxBytes)
    issues.push("Selected file exceeds the byte limit.");
  const p = state.parseAttempts
    .filter((p) => p.documentVersionId === f.id)
    .at(-1);
  if (v.maxPages && (!p?.pages || p.pages > v.maxPages))
    issues.push("PDF page limit is exceeded or unchecked.");
  if (
    !s.review ||
    s.review.decision !== "accepted" ||
    s.review.fingerprint !== requirementFingerprint(r)
  )
    issues.push("File review is absent, rejected or instructions changed.");
  else if (s.review.reviewedHeadId !== d.versionIds.at(-1))
    issues.push(
      "A newer version exists; explicitly review the pinned selection again.",
    );
  return issues;
}
