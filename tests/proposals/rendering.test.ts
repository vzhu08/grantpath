import { describe, expect, it } from "vitest";
import {
  createProposalDocx,
  ProposalDocumentSchema,
  RENDER_PROFILE,
  visibleText,
  rendererIdentity,
  validatePdfFonts,
  runRendererProcess,
  renderProposal,
} from "../../lib/proposals/rendering";
import { PDFDocument, StandardFonts } from "pdf-lib";
import { mkdir, mkdtemp, readFile } from "node:fs/promises";
import path from "node:path";
import { fidelityFixture } from "../../lib/proposals/render-fixtures";
import { unzipSync, strFromU8 } from "fflate";
describe("canonical proposal document tree", () => {
  it("preserves heading/list/table structure and page layout without cover or page numbers", async () => {
    const bytes = await createProposalDocx(fidelityFixture),
      zip = unzipSync(bytes),
      xml = strFromU8(zip["word/document.xml"]!);
    expect(xml).toContain('w:w="12240"');
    expect(xml).toContain('w:h="15840"');
    expect(xml).toContain('w:top="1440"');
    expect(xml).toContain("Heading1");
    expect(xml).toContain("Heading2");
    expect(xml).toContain("w:tblHeader");
    expect(xml).toContain("w:numPr");
    expect(xml).toContain('w:lineRule="atLeast"');
    expect(xml).toContain("[MISSING: actual measurements]");
    expect(Object.keys(zip).some((k) => /word\/(header|footer)/.test(k))).toBe(
      false,
    );
    expect(RENDER_PROFILE.font).toBe("Times New Roman");
  });
  it("rejects unsupported content, extra attributes and nonrectangular tables", () => {
    expect(
      ProposalDocumentSchema.safeParse({
        blocks: [{ type: "html", text: "<script>unsafe</script>" }],
      }).success,
    ).toBe(false);
    expect(
      ProposalDocumentSchema.safeParse({
        blocks: [{ type: "paragraph", text: "x", image: "remote" }],
      }).success,
    ).toBe(false);
    expect(
      ProposalDocumentSchema.safeParse({
        blocks: [{ type: "table", headers: ["A", "B"], rows: [["only one"]] }],
      }).success,
    ).toBe(false);
  });
  it("counts visible text including headings and table cells without guessing pages", () => {
    const text = visibleText(fidelityFixture);
    expect(text).toContain("Broader Impacts");
    expect(text).toContain("μg/L");
    expect(text).toContain("[MISSING: actual measurements]");
    expect(fidelityFixture).not.toHaveProperty("estimatedPages");
  });
  it("reports missing renderer/fonts without silently substituting", async () => {
    await expect(
      rendererIdentity({
        executable: "missing-libreoffice-executable",
        fontFiles: ["missing-times.ttf"],
        outputRoot: ".test-data/exports",
      }),
    ).rejects.toThrow(/unavailable/);
  });
  it("rejects XML-illegal controls and malformed surrogates instead of dropping them", () => {
    for (const text of ["bad\u0000text", "bad\u000btext", "bad\ud800text"])
      expect(
        ProposalDocumentSchema.safeParse({
          blocks: [{ type: "paragraph", text }],
        }).success,
      ).toBe(false);
    expect(
      ProposalDocumentSchema.safeParse({
        blocks: [
          {
            type: "paragraph",
            text: "Literal <script> text & normal 😀 Unicode",
          },
        ],
      }).success,
    ).toBe(true);
  });
  it("restarts numbering for separate ordered lists", async () => {
    const bytes = await createProposalDocx({
      blocks: [
        {
          type: "list",
          ordered: true,
          items: ["First list one", "First list two"],
        },
        { type: "paragraph", text: "Between lists" },
        {
          type: "list",
          ordered: true,
          items: ["Second list one", "Second list two"],
        },
      ],
    });
    const xml = strFromU8(unzipSync(bytes)["word/document.xml"]!);
    const ids = [...xml.matchAll(/<w:numId w:val="(\d+)"\/>/g)].map(
      (m) => m[1],
    );
    expect(ids).toHaveLength(4);
    expect(ids[0]).toBe(ids[1]);
    expect(ids[2]).toBe(ids[3]);
    expect(ids[0]).not.toBe(ids[2]);
  });
  it("rejects actual PDF font substitution before recording a page-limit pass", async () => {
    const pdf = await PDFDocument.create(),
      font = await pdf.embedFont(StandardFonts.Helvetica);
    pdf.addPage().drawText("Wrong font", { font });
    const loaded = await PDFDocument.load(await pdf.save());
    expect(() => validatePdfFonts(loaded)).toThrow(/Times New Roman/);
  });
  it("bounds local renderer processes and honors cancellation", async () => {
    await expect(
      runRendererProcess(
        process.execPath,
        ["-e", "setInterval(()=>{},1000)"],
        100,
      ),
    ).rejects.toThrow(/deadline/);
    const controller = new AbortController();
    const pending = runRendererProcess(
      process.execPath,
      ["-e", "setInterval(()=>{},1000)"],
      5000,
      controller.signal,
    );
    controller.abort();
    await expect(pending).rejects.toThrow(/cancelled/);
  }, 20000);
  it("preserves exact DOCX and input after renderer configuration failure", async () => {
    await mkdir(".test-data/exports", { recursive: true });
    const root = await mkdtemp(path.resolve(".test-data/exports/failure-"));
    const result = await renderProposal(fidelityFixture, {
      config: {
        executable: "missing-renderer",
        fontFiles: [],
        outputRoot: root,
      },
    });
    expect(result.status).toBe("failed");
    expect(result.pages).toBeNull();
    expect(result.withinPageLimit).toBeNull();
    expect((await readFile(result.docxPath)).byteLength).toBeGreaterThan(100);
    expect(
      JSON.parse(
        await readFile(path.join(result.directory, "input.json"), "utf8"),
      ),
    ).toEqual(fidelityFixture);
  });
});
