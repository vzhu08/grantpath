import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import {
  BlockPreview,
  ProposalBlockEditor,
} from "../../components/proposal-block-editor";
import {
  ProposalPanel,
  adoptionPreview,
  sectionStatus,
  snapshotMatchesApplication,
} from "../../components/proposal-panel";
import { createApplication, createDemo } from "../../lib/fixtures";
import { applyProposalCommand } from "../../lib/proposals/workflow";
import { textBlocks, type ProposalBlock } from "../../lib/proposals/blocks";
import type { DraftRevision, DraftSection } from "../../lib/schema";

function fixture() {
  const state = createDemo();
  const app = createApplication(
    state.projects[0]!,
    state.opportunities[0]!,
    state,
    "ui-application",
  );
  state.applications.push(app);
  return { state, app };
}
function fullProposal() {
  const result = fixture();
  applyProposalCommand(
    result.state,
    {
      type: "adoptTemplate",
      applicationId: result.app.id,
      templateId: "nsf-standard-research",
    },
    "2026-10-25T00:00:00.000Z",
  );
  return result;
}
const revision = (id: string): DraftRevision => ({
  id,
  text: "Reviewed research content",
  citations: [],
  selectedSources: [],
  projectRevision: 1,
  callRevision: 1,
  callSourceVersion: 1,
  missingInputs: [],
  mode: "manual",
  promptVersion: "manual",
  createdAt: "2026-10-25T00:00:00.000Z",
  blocks: textBlocks("Reviewed research content"),
  representationVersion: 1,
  bindingRevision: 1,
  reusedContent: [],
});

describe("proposal UI contracts", () => {
  it("renders structured headings, lists and tables as escaped semantic content", () => {
    const blocks: ProposalBlock[] = [
      { type: "heading", level: 1, text: "Methods & evaluation" },
      {
        type: "paragraph",
        text: '<script>alert("unsafe")</script> α water 🧪',
      },
      {
        type: "list",
        ordered: false,
        items: ["Collect samples", "Measure uncertainty"],
      },
      {
        type: "table",
        headers: ["Milestone", "Month"],
        rows: [
          ["Pilot", "3"],
          ["Evaluation", "9"],
        ],
      },
    ];
    const html = renderToStaticMarkup(createElement(BlockPreview, { blocks }));
    expect(html).toContain("<h3>Methods &amp; evaluation</h3>");
    expect(html).toContain(
      "<ul><li>Collect samples</li><li>Measure uncertainty</li></ul>",
    );
    expect(html).toContain('<th scope="col"');
    expect(html).toContain("<tbody><tr><td");
    expect(html).toContain("&lt;script&gt;");
    expect(html).not.toContain("<script>");
    expect(html).toContain("α water 🧪");
  });

  it("offers ordinary content controls with accessible table-cell names and busy protection", () => {
    const html = renderToStaticMarkup(
      createElement(ProposalBlockEditor, {
        blocks: [{ type: "table", headers: ["Year"], rows: [["2027"]] }],
        onChange: vi.fn(),
        disabled: true,
      }),
    );
    expect(html).toContain('<fieldset disabled=""');
    expect(html).toContain("Table 1 row 1 column 1");
    expect(html).toContain("Table 1 column 1 heading");
    expect(html).toContain("Simple table");
    expect(html).toContain("Add content block");
    expect(html).not.toContain("JSON editor");
  });

  it("previews starter mappings without changing any saved input", () => {
    const { app } = fixture(),
      before = JSON.stringify(app);
    app.sections[0]!.revisions.push(revision("starter"));
    const withDraft = JSON.stringify(app),
      preview = adoptionPreview(app);
    expect(preview.map((row) => row.to)).toEqual([
      "summary-overview",
      "description-context",
      "description-methods",
    ]);
    expect(preview[0]).toMatchObject({ revisions: 1, words: 3 });
    expect(JSON.stringify(app)).toBe(withDraft);
    expect(withDraft).not.toBe(before);
  });

  it("requires a new review after the saved section revision changes", () => {
    const section: DraftSection = {
      key: "summary-overview",
      label: "Overview",
      wordLimit: null,
      revisions: [],
      reviews: [],
    };
    expect(sectionStatus(section)).toBe("Missing");
    section.revisions.push(revision("r1"));
    expect(sectionStatus(section)).toBe("Needs review");
    section.reviews!.push({
      revisionId: "r1",
      by: "Researcher",
      at: "2026-10-25",
    });
    expect(sectionStatus(section)).toBe("Reviewed");
    section.revisions.push(revision("r2"));
    expect(sectionStatus(section)).toBe("Needs review");
  });

  it("never labels a frozen measurement current after evidence or binding changes", () => {
    const { state, app } = fullProposal();
    const snapshotId = applyProposalCommand(
      state,
      { type: "freezePacket", applicationId: app.id },
      "2026-10-25T00:00:00.000Z",
    );
    const snapshot = state.packetSnapshots.find(
      (item) => item.id === snapshotId,
    )!;
    expect(snapshotMatchesApplication(snapshot, app, state)).toBe(true);
    app.binding!.revision += 1;
    expect(snapshotMatchesApplication(snapshot, app, state)).toBe(false);
    app.binding!.revision -= 1;
    const source = state.sources.find(
      (source) => source.id === snapshot.payload.call.sourceId,
    )!;
    source.versions.push({
      ...source.versions.at(-1)!,
      version: source.versions.at(-1)!.version + 1,
      text: "Changed sponsor call",
      hash: "changed",
    });
    expect(snapshotMatchesApplication(snapshot, app, state)).toBe(false);
    expect(
      snapshot.payload.sources.find((item) => item.id === source.id)!.versions,
    ).toHaveLength(1);
  });

  it("exposes all NSF content sections, source metadata and explicit external task records without network calls", () => {
    const { state, app } = fullProposal();
    const mutate = vi.fn();
    const html = renderToStaticMarkup(
      createElement(ProposalPanel, {
        state,
        app,
        mutate,
        busy: false,
        dirty: vi.fn(),
      }),
    );
    expect(html).toContain("Section navigator");
    for (const section of app.sections)
      expect(html).toContain(`section-${app.id}-${section.key}`);
    expect(app.sections).toHaveLength(14);
    expect(html).toContain("Policy sources, effective dates and excerpts");
    expect(html).toContain("NSF Standard Research");
    expect(html).toContain("Record researcher task status");
    expect(html).toContain("DMSP");
    expect(html).toContain("Freeze saved inputs and generate packet");
    expect(html).toContain("Unknown / not reviewed");
    expect(html).toContain("Fictional demonstration application");
    expect(mutate).not.toHaveBeenCalled();
  });
});
