import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  mkdir,
  mkdtemp,
  readFile,
  readdir,
  rm,
  writeFile,
} from "node:fs/promises";
import path from "node:path";
import { createDemo } from "../../lib/fixtures";
import { applyCommand, createRepository } from "../../lib/repository";
import { cite, latest, validCitation } from "../../lib/evidence";
import { readiness } from "../../lib/readiness";
import {
  CommandSchema,
  type Application,
  type ContentItem,
  type State,
} from "../../lib/schema";
import { type ProposalBlock, visibleText } from "../../lib/proposals/blocks";
import { migrateV1 } from "../../lib/proposals/migration";
import {
  activeSectionKeys,
  proposalIssues,
  snapshotInputsMatch,
} from "../../lib/proposals/checks";
import {
  adoptionPreview,
  canonicalStringify,
  sha256,
  validateStateIntegrity,
} from "../../lib/proposals/workflow";
import { type ApplicabilityAnswers } from "../../lib/proposals/nsf-template";

let state: State;
const temporaryRoot = path.resolve(".test-data/proposal-workflow");
const temporaryDirectories: string[] = [];
const confirmedNo: ApplicabilityAnswers = {
  "supports-graduate-students": "no",
  "supports-postdoctoral-scholars": "no",
  "has-prior-nsf-support": "no",
  "has-subawards": "no",
  "multiple-submitting-organizations": "no",
  "special-proposal-type": "no",
  "call-deviations": "no",
};
function run(command: unknown) {
  // A failed transaction must not alter the previously accepted state.
  const result = applyCommand(structuredClone(state), {
    expectedRevision: state.revision,
    command: CommandSchema.parse(command),
  });
  state = result.state;
  return result;
}
const application = (id: string) =>
  state.applications.find((app) => app.id === id)!;
const libraryItem = (id: string) =>
  state.contentLibrary.find((item) => item.id === id)!;
function createApplication(
  projectId = "demo-project",
  opportunityId = "demo-call-1",
) {
  return run({ type: "saveApplication", projectId, opportunityId }).selectedId!;
}
function targetApplication(opportunityId = "demo-call-1") {
  const projectId = run({
    type: "saveProject",
    profile: {
      ...state.projects[0]!.profile,
      title: "Researcher-owned synthetic target",
    },
  }).selectedId!;
  return createApplication(projectId, opportunityId);
}
function saveDraft(
  appId: string,
  key: string,
  content: string | ProposalBlock[],
  sourceIds = ["demo-methods"],
) {
  const section = application(appId).sections.find(
    (section) => section.key === key,
  )!;
  const blocks =
    typeof content === "string"
      ? [{ type: "paragraph" as const, text: content }]
      : content;
  const citations = sourceIds.map((id) => {
    const source = state.sources.find((source) => source.id === id)!;
    return cite(source, latest(source).text.split(/(?<=\.)\s/u)[0]!);
  });
  run({
    type: "saveDraft",
    applicationId: appId,
    sectionKey: key,
    label: section.label,
    wordLimit: section.wordLimit,
    text: visibleText({ blocks }),
    blocks,
    sourceIds,
    citations,
  });
  return application(appId)
    .sections.find((section) => section.key === key)!
    .revisions.at(-1)!;
}
function adopt(appId: string) {
  run({
    type: "adoptTemplate",
    applicationId: appId,
    templateId: "nsf-standard-research",
  });
}
function confirm(appId: string, answers: ApplicabilityAnswers = confirmedNo) {
  run({
    type: "confirmTemplate",
    applicationId: appId,
    answers,
    mappings: [],
    by: "Synthetic researcher",
    note: "Reviewed this synthetic call against the pinned standard template.",
  });
}
function saveContent(
  appId: string,
  key: string,
  options: {
    itemId?: string;
    scope?: string;
    category?: ContentItem["category"];
  } = {},
) {
  return run({
    type: "saveContent",
    applicationId: appId,
    sectionKey: key,
    itemId: options.itemId,
    title: "Synthetic reusable methods",
    category: options.category ?? "methods",
    scope:
      options.scope ??
      "Proposed methods only; no completed results or approval is claimed.",
  }).selectedId!;
}
function approve(itemId: string, revision = 1) {
  run({ type: "approveContent", itemId, revision, by: "Synthetic reviewer" });
}
function insert(appId: string, key: string, itemId: string, revision = 1) {
  run({
    type: "insertContent",
    applicationId: appId,
    sectionKey: key,
    itemId,
    revision,
    confirmContext: true,
    contextNote:
      "Reviewed the proposed method and its uncertainty for this target project.",
  });
}
function editSource(id: string, suffix: string) {
  const source = state.sources.find((source) => source.id === id)!;
  run({
    type: "saveSource",
    id,
    projectId: source.projectId!,
    title: source.title,
    sourceType: source.type,
    text: latest(source).text + suffix,
    url: source.url,
  });
}
function populatedLegacy() {
  const appId = createApplication();
  for (const key of ["summary", "significance", "approach"])
    saveDraft(
      appId,
      key,
      `Exact original ${key}: café 🧪\r\nSecond line with two  spaces.`,
    );
  saveDraft(
    appId,
    "summary",
    "Retained summary revision two: μg/L\n[MISSING: actual pilot data]",
  );
  const firstRequirement = application(appId).requirements[0]!;
  run({
    type: "saveRequirement",
    applicationId: appId,
    requirement: {
      ...firstRequirement,
      review: "confirmed",
      status: "In progress",
      note: "Original review note retained.",
    },
  });
  run({
    type: "waiveIssue",
    applicationId: appId,
    issueId: "review",
    reason: "Synthetic waiver retained for migration verification.",
  });
  run({ type: "setStage", applicationId: appId, stage: "Submitted" });
  const {
    binding: _binding,
    bindingHistory: _history,
    archivedSections: _archives,
    reuseDecisions: _reuse,
    externalTasks: _external,
    ...app
  } = application(appId);
  const old = {
    schemaVersion: 1,
    revision: state.revision,
    projects: structuredClone(state.projects),
    sources: structuredClone(state.sources),
    opportunities: structuredClone(state.opportunities),
    applications: [
      {
        ...app,
        sections: app.sections.map((section) => {
          const { reviews: _reviews, ...savedSection } = section;
          return {
            ...savedSection,
            revisions: section.revisions.map((draft) => {
              const {
                blocks: _blocks,
                representationVersion: _representation,
                bindingRevision: _bindingRevision,
                reusedContent: _content,
                ...original
              } = draft;
              return original;
            }),
          };
        }),
      },
    ],
  };
  return { old, appId };
}
async function temporaryDirectory() {
  await mkdir(temporaryRoot, { recursive: true });
  const directory = await mkdtemp(path.join(temporaryRoot, "acceptance-"));
  temporaryDirectories.push(directory);
  return directory;
}
beforeEach(() => {
  vi.useFakeTimers({ toFake: ["Date"] });
  vi.setSystemTime(new Date("2026-10-25T12:00:00Z"));
  state = createDemo();
});
afterEach(async () => {
  vi.useRealTimers();
  for (const directory of temporaryDirectories.splice(0)) {
    const resolved = path.resolve(directory);
    if (!resolved.startsWith(temporaryRoot + path.sep))
      throw new Error("Refusing cleanup outside the isolated test root.");
    await rm(resolved, { recursive: true, force: true });
  }
});

describe("proposal migration and persisted recovery", () => {
  it("preserves original IDs, exact Unicode/CRLF text, citations, requirements, waivers and stage", () => {
    const { old, appId } = populatedLegacy();
    const before = structuredClone(old);
    const migrated = migrateV1(old),
      app = migrated.applications.find((app) => app.id === appId)!;
    expect(old).toEqual(before);
    expect(migrated.schemaVersion).toBe(2);
    expect(migrated.sources).toEqual(old.sources);
    expect(migrated.projects).toEqual(old.projects);
    expect(migrated.opportunities).toEqual(old.opportunities);
    expect(app.binding?.templateId).toBe("legacy-three-section");
    expect(app.stage).toBe("Submitted");
    expect(app.waivers).toEqual(old.applications[0]!.waivers);
    expect(app.requirementsHistory).toEqual(
      old.applications[0]!.requirementsHistory,
    );
    expect(app.requirements).toEqual(old.applications[0]!.requirements);
    for (const original of old.applications[0]!.sections) {
      const section = app.sections.find(
        (section) => section.key === original.key,
      )!;
      expect(section.label).toBe(original.label);
      expect(section.wordLimit).toBe(original.wordLimit);
      expect(section.revisions.map((draft) => draft.id)).toEqual(
        original.revisions.map((draft) => draft.id),
      );
      for (const draft of original.revisions) {
        const saved = section.revisions.find((saved) => saved.id === draft.id)!;
        expect(saved).toMatchObject(draft);
        expect(saved.blocks).toEqual([{ type: "paragraph", text: draft.text }]);
        expect(visibleText({ blocks: saved.blocks! })).toBe(draft.text);
      }
    }
  });
  it("writes a byte-identical separate backup and does not migrate again after restart", async () => {
    const { old } = populatedLegacy(),
      directory = await temporaryDirectory();
    const originalBytes = Buffer.from(
      "\r\n" + JSON.stringify(old, null, "\t").replace(/\n/g, "\r\n") + "\r\n",
      "utf8",
    );
    const filename = path.join(directory, "workspace.json");
    const earlierBackup = path.join(
      directory,
      "workspace.v1-existing.backup.json",
    );
    await writeFile(filename, originalBytes);
    await writeFile(earlierBackup, "previous independent backup", {
      flag: "wx",
    });
    const migrated = await createRepository(directory).read();
    const files = await readdir(directory);
    const backups = files.filter((name) =>
      /^workspace\.v1-.*\.backup\.json$/.test(name),
    );
    expect(backups).toHaveLength(2);
    const newBackup = backups.find(
      (name) => name !== path.basename(earlierBackup),
    )!;
    expect(await readFile(path.join(directory, newBackup))).toEqual(
      originalBytes,
    );
    expect(await readFile(earlierBackup, "utf8")).toBe(
      "previous independent backup",
    );
    const acceptedBytes = await readFile(filename);
    expect(JSON.parse(acceptedBytes.toString("utf8")).schemaVersion).toBe(2);
    expect(await createRepository(directory).read()).toEqual(migrated);
    expect(await readFile(filename)).toEqual(acceptedBytes);
    expect(
      (await readdir(directory)).filter((name) =>
        name.endsWith(".backup.json"),
      ),
    ).toEqual(backups);
  });
  it.each([
    ["malformed JSON", "{truncated"],
    [
      "unknown future schema",
      JSON.stringify({ schemaVersion: 999, marker: "Do not replace my work" }),
    ],
    [
      "invalid legacy shape",
      JSON.stringify({
        schemaVersion: 1,
        projects: [],
        marker: "Preserve original",
      }),
    ],
  ])(
    "leaves %s untouched and never replaces it with demo state",
    async (_label, raw) => {
      const directory = await temporaryDirectory(),
        filename = path.join(directory, "workspace.json");
      await writeFile(filename, raw);
      await expect(createRepository(directory).read()).rejects.toMatchObject({
        code: "STORAGE_ERROR",
        status: 503,
      });
      expect(await readFile(filename, "utf8")).toBe(raw);
      expect(await readdir(directory)).toEqual(["workspace.json"]);
    },
  );
  it("preserves a legacy workspace when source integrity prevents migration", async () => {
    const { old } = populatedLegacy(),
      directory = await temporaryDirectory();
    old.sources.find(
      (source) => source.id === "demo-methods",
    )!.versions[0]!.text =
      "Changed bytes without updating the retained citation.";
    const raw = JSON.stringify(old),
      filename = path.join(directory, "workspace.json");
    await writeFile(filename, raw);
    await expect(createRepository(directory).read()).rejects.toMatchObject({
      code: "STORAGE_ERROR",
    });
    expect(await readFile(filename, "utf8")).toBe(raw);
  });
});

describe("template adoption and frozen inputs", () => {
  it("previews without mutation, archives every original revision, and creates unreviewed copies", () => {
    const appId = createApplication();
    for (const key of ["summary", "significance", "approach"])
      saveDraft(appId, key, `Original ${key} text with exact quotation.`);
    saveDraft(
      appId,
      "summary",
      "Most recent summary; retain its older revision too.",
    );
    const before = structuredClone(application(appId));
    const preview = adoptionPreview(application(appId));
    expect(application(appId)).toEqual(before);
    expect(preview.mappings).toContainEqual({
      from: "summary",
      to: "summary-overview",
    });
    preview.retained[0]!.label = "Changed preview only";
    expect(application(appId)).toEqual(before);
    adopt(appId);
    const adopted = application(appId);
    expect(adopted.binding?.confirmedAt).toBeNull();
    for (const original of before.sections)
      expect(adopted.archivedSections).toContainEqual(original);
    for (const [from, to] of [
      ["summary", "summary-overview"],
      ["significance", "description-context"],
      ["approach", "description-methods"],
    ]) {
      const prior = before.sections
        .find((section) => section.key === from)!
        .revisions.at(-1)!;
      const copy = adopted.sections
        .find((section) => section.key === to)!
        .revisions.at(-1)!;
      expect(copy.text).toBe(prior.text);
      expect(copy.id).not.toBe(prior.id);
      expect(copy.citations).toEqual(prior.citations);
      expect(
        adopted.sections.find((section) => section.key === to)!.reviews,
      ).toEqual([]);
    }
    run({
      type: "adoptTemplate",
      applicationId: appId,
      templateId: "legacy-three-section",
    });
    expect(application(appId).sections).toEqual(before.sections);
    expect(
      application(appId).archivedSections?.some(
        (section) => section.key === "summary-overview",
      ),
    ).toBe(true);
  });
  it("rejects requirement mappings to another application's records", () => {
    const first = createApplication(),
      second = targetApplication("demo-call-2");
    adopt(first);
    const before = structuredClone(state);
    expect(() =>
      run({
        type: "confirmTemplate",
        applicationId: first,
        answers: confirmedNo,
        mappings: [
          {
            requirementId: application(second).requirements[0]!.id,
            sectionId: "summary-overview",
            note: "Cross-application mapping",
          },
        ],
        by: "Synthetic reviewer",
        note: "This mapping must not be accepted.",
      }),
    ).toThrow(/Map requirements/);
    expect(state).toEqual(before);
  });
  it("freezes unresolved findings with a valid digest and retains exact older project/call/source inputs", () => {
    const appId = createApplication();
    const saved = saveDraft(
      appId,
      "summary",
      "Frozen source-backed draft. [MISSING: real observations]",
    );
    const oldProject = structuredClone(state.projects[0]!),
      oldCall = structuredClone(state.opportunities[0]!);
    run({
      type: "saveProject",
      id: oldProject.id,
      profile: { ...oldProject.profile, title: "Later project title" },
    });
    run({
      type: "reviewCall",
      id: oldCall.id,
      fields: { ...oldCall, funder: "Later source-checked funder" },
    });
    editSource(
      "demo-methods",
      "\nLater source amendment; original text remains retained.",
    );
    const snapshotId = run({
      type: "freezePacket",
      applicationId: appId,
    }).selectedId!;
    const snapshot = state.packetSnapshots.find(
      (snapshot) => snapshot.id === snapshotId,
    )!;
    expect(snapshot.payload.issues.length).toBeGreaterThan(0);
    expect(snapshot.digest).toBe(sha256(canonicalStringify(snapshot.payload)));
    expect(snapshot.payload.project.history).toContainEqual({
      revision: oldProject.revision,
      profile: oldProject.profile,
      at: oldProject.updatedAt,
    });
    expect(
      snapshot.payload.call.history.some(
        (version) =>
          version.revision === oldCall.revision &&
          version.fields.funder === oldCall.funder,
      ),
    ).toBe(true);
    const frozenDraft = snapshot.payload.application.sections
      .find((section) => section.key === "summary")!
      .revisions.at(-1)!;
    expect(frozenDraft).toEqual(saved);
    expect(
      frozenDraft.citations.every((citation) =>
        validCitation(citation, snapshot.payload.sources),
      ),
    ).toBe(true);
    const source = snapshot.payload.sources.find(
      (source) => source.id === "demo-methods",
    )!;
    expect(
      source.versions.some(
        (version) =>
          version.version === saved.selectedSources[0]!.version &&
          version.hash === saved.selectedSources[0]!.hash,
      ),
    ).toBe(true);
    expect(() => validateStateIntegrity(state)).not.toThrow();
    const frozenBytes = canonicalStringify(snapshot);
    saveDraft(
      appId,
      "summary",
      "Subsequent edits must not rewrite a frozen packet.",
    );
    editSource("demo-methods", "\nSecond later amendment.");
    expect(
      canonicalStringify(
        state.packetSnapshots.find((snapshot) => snapshot.id === snapshotId)!,
      ),
    ).toBe(frozenBytes);
    const tampered = structuredClone(state);
    tampered.packetSnapshots[0]!.payload.project.profile.title =
      "Tampered snapshot";
    expect(() => validateStateIntegrity(tampered)).toThrow(/digest/);
  });
});

describe("reviewed reusable content and target provenance", () => {
  it("rejects unapproved revisions and an insertion without explicit target-context confirmation", () => {
    const origin = createApplication(),
      target = targetApplication();
    saveDraft(
      origin,
      "summary",
      "Proposed method; approvals and results remain unknown.",
    );
    const itemId = saveContent(origin, "summary"),
      before = structuredClone(state);
    expect(() => insert(target, "summary", itemId)).toThrow(/approve/i);
    expect(state).toEqual(before);
    approve(itemId);
    expect(() =>
      run({
        type: "insertContent",
        applicationId: target,
        sectionKey: "summary",
        itemId,
        revision: 1,
        confirmContext: false,
        contextNote: "No context approval was given.",
      }),
    ).toThrow();
  });
  it("pins scope/category and approval to an immutable library revision", () => {
    const appId = createApplication();
    saveDraft(
      appId,
      "summary",
      "Original proposed procedure with limited reuse context.",
    );
    const itemId = saveContent(appId, "summary", {
      scope: "Methods only for freshwater sensor work.",
      category: "methods",
    });
    approve(itemId);
    const approved = structuredClone(libraryItem(itemId).versions[0]!);
    saveDraft(
      appId,
      "summary",
      "A separately reviewed proposed facilities description.",
      ["demo-team"],
    );
    saveContent(appId, "summary", {
      itemId,
      scope: "Facilities availability requires separate project confirmation.",
      category: "facilities",
    });
    expect(libraryItem(itemId).versions[0]).toEqual(approved);
    expect(libraryItem(itemId).versions[0]!.scope).toBe(
      "Methods only for freshwater sensor work.",
    );
    expect(libraryItem(itemId).versions[0]!.category).toBe("methods");
    expect(libraryItem(itemId).versions[1]!.approvedAt).toBeNull();
    const target = targetApplication();
    expect(() => insert(target, "summary", itemId, 2)).toThrow(/approve/i);
  });
  it("copies cross-project support without relabeling demo evidence or changing exact quote versions", () => {
    const origin = createApplication(),
      target = targetApplication();
    saveDraft(
      origin,
      "summary",
      "Proposed synthetic sampling workflow; no measurements have been collected.",
    );
    const itemId = saveContent(origin, "summary");
    approve(itemId);
    const sourceBefore = structuredClone(
      state.sources.find((source) => source.id === "demo-methods")!,
    );
    insert(target, "summary", itemId);
    const draft = application(target)
      .sections.find((section) => section.key === "summary")!
      .revisions.at(-1)!;
    const copied = state.sources.find(
      (source) => source.id === draft.citations[0]!.sourceId,
    )!;
    expect(copied.id).not.toBe(sourceBefore.id);
    expect(copied.projectId).toBe(application(target).projectId);
    expect(copied.provenance).toBe("demo");
    expect(copied.copyOrigin).toMatchObject({
      sourceId: sourceBefore.id,
      projectId: sourceBefore.projectId,
      itemId,
      revision: 1,
    });
    expect(copied.versions).toEqual(sourceBefore.versions);
    expect(draft.citations[0]).toMatchObject({
      quote: libraryItem(itemId).versions[0]!.citations[0]!.quote,
      version: 1,
      hash: latest(sourceBefore).hash,
    });
    expect(
      draft.citations.every((citation) =>
        validCitation(citation, state.sources),
      ),
    ).toBe(true);
    expect(draft.reusedContent).toContainEqual(
      expect.objectContaining({ itemId, revision: 1 }),
    );
    expect(
      state.sources.find((source) => source.id === sourceBefore.id),
    ).toEqual(sourceBefore);
  });
  it("applies updated structured blocks and new citations while retaining unrelated target content", () => {
    const origin = createApplication(),
      target = targetApplication();
    const oldBlocks: ProposalBlock[] = [
      { type: "heading", level: 2, text: "Proposed calibration" },
      {
        type: "table",
        headers: ["Method", "State"],
        rows: [["Paired references", "Proposed"]],
      },
    ];
    saveDraft(origin, "summary", oldBlocks);
    const itemId = saveContent(origin, "summary");
    approve(itemId);
    const prefix: ProposalBlock[] = [
      {
        type: "paragraph",
        text: "Independent target context stays in this section.",
      },
    ];
    saveDraft(target, "summary", prefix, []);
    insert(target, "summary", itemId);
    const oldDraft = structuredClone(
      application(target)
        .sections.find((section) => section.key === "summary")!
        .revisions.at(-1)!,
    );
    const oldQuote = libraryItem(itemId).versions[0]!.citations[0]!.quote;
    const newBlocks: ProposalBlock[] = [
      { type: "heading", level: 2, text: "Updated proposed calibration" },
      {
        type: "list",
        ordered: true,
        items: [
          "Confirm bench access.",
          "Record unsuccessful calibration runs.",
        ],
      },
    ];
    saveDraft(origin, "summary", newBlocks, ["demo-team"]);
    saveContent(origin, "summary", { itemId });
    approve(itemId, 2);
    const newQuote = libraryItem(itemId).versions[1]!.citations[0]!.quote;
    run({
      type: "resolveReuse",
      applicationId: target,
      sectionKey: "summary",
      itemId,
      action: "apply",
      reason:
        "Reviewed the updated proposed method and its new source for this target.",
    });
    const section = application(target).sections.find(
        (section) => section.key === "summary",
      )!,
      updated = section.revisions.at(-1)!;
    expect(updated.blocks).toEqual([...prefix, ...newBlocks]);
    expect(updated.text).toBe(
      visibleText({ blocks: [...prefix, ...newBlocks] }),
    );
    expect(updated.citations.map((citation) => citation.quote)).toContain(
      newQuote,
    );
    expect(updated.citations.map((citation) => citation.quote)).not.toContain(
      oldQuote,
    );
    expect(
      updated.citations.every((citation) =>
        validCitation(citation, state.sources),
      ),
    ).toBe(true);
    expect(updated.reusedContent).toContainEqual(
      expect.objectContaining({ itemId, revision: 2 }),
    );
    expect(
      section.revisions.find((revision) => revision.id === oldDraft.id),
    ).toEqual(oldDraft);
  });
  it("requires renewed review when original evidence changes and expires a keep decision after another change", () => {
    const origin = createApplication(),
      target = targetApplication();
    adopt(target);
    confirm(target);
    saveDraft(
      origin,
      "summary",
      "Proposed method remains conditional on current source review.",
    );
    const itemId = saveContent(origin, "summary");
    approve(itemId);
    insert(target, "summary-overview", itemId);
    const finding = `reuse-update-summary-overview-${itemId}`;
    editSource("demo-methods", "\nFirst source amendment.");
    expect(
      proposalIssues(state, application(target)).some(
        (issue) => issue.id === finding,
      ),
    ).toBe(true);
    const copiedText = application(target)
      .sections.find((section) => section.key === "summary-overview")!
      .revisions.at(-1)!.text;
    run({
      type: "resolveReuse",
      applicationId: target,
      sectionKey: "summary-overview",
      itemId,
      action: "keep",
      reason:
        "The pinned methods remain appropriate after comparing this amendment.",
    });
    expect(
      proposalIssues(state, application(target)).some(
        (issue) => issue.id === finding,
      ),
    ).toBe(false);
    editSource("demo-methods", "\nSecond independent source amendment.");
    expect(
      proposalIssues(state, application(target)).some(
        (issue) => issue.id === finding,
      ),
    ).toBe(true);
    expect(
      application(target)
        .sections.find((section) => section.key === "summary-overview")!
        .revisions.at(-1)!.text,
    ).toBe(copiedText);
  });
  it("retains inserted history after retirement but blocks a new insertion", () => {
    const origin = createApplication(),
      target = targetApplication();
    saveDraft(
      origin,
      "summary",
      "A proposed method with retained historical support.",
    );
    const itemId = saveContent(origin, "summary");
    approve(itemId);
    insert(target, "summary", itemId);
    const retained = structuredClone(
      application(target).sections[0]!.revisions,
    );
    run({ type: "retireContent", itemId });
    expect(application(target).sections[0]!.revisions).toEqual(retained);
    expect(() => insert(target, "significance", itemId)).toThrow(/Retired/);
  });
});

describe("template readiness, external completion and page uncertainty", () => {
  it("keeps official external tasks incomplete until explicitly recorded and stales them on a new binding", () => {
    const appId = createApplication();
    adopt(appId);
    confirm(appId);
    const finding = "external-dmsp-researchgov";
    expect(
      proposalIssues(state, application(appId)).some(
        (issue) => issue.id === finding,
      ),
    ).toBe(true);
    run({
      type: "setExternalTask",
      applicationId: appId,
      id: "dmsp-researchgov",
      status: "Ready",
      by: "Synthetic researcher",
      note: "Researcher reports completing the official Research.gov tool.",
    });
    expect(
      proposalIssues(state, application(appId)).some(
        (issue) => issue.id === finding,
      ),
    ).toBe(false);
    expect(application(appId).stage).not.toBe("Submitted");
    const recordedBinding = application(appId).externalTasks!.find(
      (task) => task.id === "dmsp-researchgov",
    )!.bindingRevision;
    confirm(appId);
    expect(application(appId).binding!.revision).toBeGreaterThan(
      recordedBinding,
    );
    expect(
      proposalIssues(state, application(appId)).some(
        (issue) => issue.id === finding,
      ),
    ).toBe(true);
    expect(() =>
      run({
        type: "setExternalTask",
        applicationId: appId,
        id: "foreign-external-task",
        status: "Ready",
        by: "Synthetic researcher",
        note: "This task does not belong to the pinned template.",
      }),
    ).toThrow(/pinned template/);
  });
  it("preserves unknown applicability, excludes a confirmed no, and restores work after a yes", () => {
    const appId = createApplication();
    adopt(appId);
    expect(activeSectionKeys(application(appId)).has("mentoring")).toBe(true);
    expect(
      proposalIssues(state, application(appId)).some(
        (issue) => issue.id === "condition-mentoring",
      ),
    ).toBe(true);
    confirm(appId);
    expect(activeSectionKeys(application(appId)).has("mentoring")).toBe(false);
    expect(
      readiness(state, application(appId)).issues.some(
        (issue) => issue.id === "empty-mentoring",
      ),
    ).toBe(false);
    confirm(appId, { ...confirmedNo, "supports-graduate-students": "yes" });
    expect(activeSectionKeys(application(appId)).has("mentoring")).toBe(true);
    expect(
      readiness(state, application(appId)).issues.some(
        (issue) => issue.id === "empty-mentoring",
      ),
    ).toBe(true);
  });
  it("does not require an explicitly optional writing subpart to be filled", () => {
    const appId = createApplication();
    adopt(appId);
    confirm(appId);
    expect(
      application(appId).binding!.manifest!.sections.find(
        (section) => section.id === "description-evaluation",
      )!.requiredness,
    ).toBe("optional");
    expect(
      readiness(state, application(appId)).issues.some(
        (issue) =>
          issue.id === "empty-description-evaluation" &&
          issue.severity === "blocker",
      ),
    ).toBe(false);
  });
  it("marks call reconciliation stale after a source-reviewed call amendment", () => {
    const appId = createApplication();
    adopt(appId);
    confirm(appId);
    expect(
      proposalIssues(state, application(appId)).some(
        (issue) => issue.id === "template-confirmation",
      ),
    ).toBe(false);
    const call = state.opportunities[0]!;
    run({
      type: "reviewCall",
      id: call.id,
      fields: { ...call, funder: "Amended synthetic funder label" },
    });
    expect(
      proposalIssues(state, application(appId)).some(
        (issue) => issue.id === "template-confirmation",
      ),
    ).toBe(true);
  });
  it("keeps page counts Unknown without an artifact and invalidates measured inputs after a source edit", () => {
    const appId = createApplication();
    adopt(appId);
    confirm(appId);
    saveDraft(
      appId,
      "summary-overview",
      "A short statement is not a page-count measurement.",
    );
    expect(
      proposalIssues(state, application(appId)).find(
        (issue) => issue.id === "pages-project-summary",
      )!.message,
    ).toContain("Unknown");
    const snapshotId = run({
      type: "freezePacket",
      applicationId: appId,
    }).selectedId!;
    const snapshot = state.packetSnapshots.find(
      (snapshot) => snapshot.id === snapshotId,
    )!;
    // Synthetic metadata tests input freshness only. It does not claim renderer verification.
    state.proposalExports.push({
      id: "fixture-export",
      snapshotId,
      jobKey: "fixture-key",
      status: "succeeded",
      createdAt: new Date().toISOString(),
      finishedAt: new Date().toISOString(),
      artifacts: [],
      errors: [],
      renderer: "synthetic freshness fixture",
      runtimeRendererMatch: true,
      measurements: [
        {
          componentId: "project-summary",
          pages: 1,
          limit: 1,
          passed: true,
          fingerprint: "synthetic-only",
          note: "No renderer called by this test.",
        },
      ],
    });
    expect(snapshotInputsMatch(snapshot, state, application(appId))).toBe(true);
    expect(
      proposalIssues(state, application(appId)).some(
        (issue) => issue.id === "pages-project-summary",
      ),
    ).toBe(false);
    state.proposalExports[0]!.runtimeRendererMatch = false;
    expect(
      proposalIssues(state, application(appId)).some(
        (issue) => issue.id === "pages-project-summary",
      ),
    ).toBe(true);
    state.proposalExports[0]!.runtimeRendererMatch = true;
    editSource(
      "demo-methods",
      "\nAn amended selected source invalidates the old measurement.",
    );
    expect(snapshotInputsMatch(snapshot, state, application(appId))).toBe(
      false,
    );
    expect(
      readiness(state, application(appId)).issues.some(
        (issue) => issue.id === "sources-summary-overview",
      ),
    ).toBe(true);
    expect(
      proposalIssues(state, application(appId)).find(
        (issue) => issue.id === "pages-project-summary",
      )!.message,
    ).toContain("Unknown");
    expect(snapshot.digest).toBe(sha256(canonicalStringify(snapshot.payload)));
  });
});
