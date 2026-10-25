import { describe, it, expect, afterEach } from "vitest";
import { mkdir, mkdtemp, readFile, writeFile, rm } from "node:fs/promises";
import path from "node:path";
import { PDFDocument, StandardFonts } from "pdf-lib";
import { parseFile } from "../../lib/vault/parser";
import { storage, sha256 } from "../../lib/vault/storage";
import type { DocumentVersion } from "../../lib/vault/schema";
const roots: string[] = [];
async function directory() {
  const root = path.resolve(".test-data");
  await mkdir(root, { recursive: true });
  const dir = await mkdtemp(path.join(root, "vault-parser-"));
  roots.push(dir);
  return dir;
}
afterEach(async () => {
  for (const dir of roots.splice(0)) {
    if (!dir.startsWith(path.resolve(".test-data") + path.sep))
      throw Error("Unsafe cleanup");
    await rm(dir, { recursive: true, force: true });
  }
});
async function saved(
  dir: string,
  id: string,
  bytes: Uint8Array,
  filename = "cv.txt",
  mime = "text/plain",
): Promise<DocumentVersion> {
  await storage(dir).put(id, bytes);
  return {
    id,
    documentId: "doc-one",
    version: 1,
    filename,
    mime,
    bytes: bytes.length,
    sha256: sha256(bytes),
    createdAt: new Date().toISOString(),
    documentDate: null,
    integrity: "unchecked",
  };
}
describe("bounded disposable parsing", () => {
  it("normalizes BOM/CRLF and preserves emoji UTF-16 offsets and original bytes", async () => {
    const dir = await directory(),
      bytes = new TextEncoder().encode("\uFEFFMethod\r\n😀 evidence"),
      v = await saved(dir, "file-unicode", bytes),
      result = await parseFile(dir, v);
    expect(result.status).toBe("parsed");
    expect(result.text).toBe("Method\n😀 evidence");
    expect(result.text.slice(7, 9)).toBe("😀");
    expect(await storage(dir).read(v)).toEqual(Buffer.from(bytes));
    expect(result.peakMemoryBytes).toBeGreaterThan(0);
    expect(result.durationMs).toBeGreaterThan(0);
  }, 30000);
  it("extracts PDF and DOCX fixtures and flags partial and scanned PDFs", async () => {
    const dir = await directory(),
      pdf = await PDFDocument.create(),
      font = await pdf.embedFont(StandardFonts.Helvetica);
    pdf.addPage().drawText("Synthetic CV evidence", { font });
    pdf.addPage();
    const mixed = await saved(
        dir,
        "file-mixed",
        await pdf.save(),
        "mixed.pdf",
        "application/pdf",
      ),
      partial = await parseFile(dir, mixed);
    expect(partial.status).toBe("partial");
    expect(partial.pages).toBe(2);
    expect(partial.warnings).toContain("PARTIAL_TEXT");
    expect(partial.text).toContain("Synthetic CV");
    const scanned = await saved(
        dir,
        "file-scanned",
        await readFile("modules/documents/fixtures/scanned.pdf"),
        "scanned.pdf",
        "application/pdf",
      ),
      noText = await parseFile(dir, scanned);
    expect(noText.status).toBe("no-text");
    expect(noText.warnings).toContain("OCR_REQUIRED");
    expect(await storage(dir).read(scanned)).toHaveLength(scanned.bytes);
    const docx = await saved(
        dir,
        "file-docx",
        await readFile("modules/documents/fixtures/brief.docx"),
        "brief.docx",
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      ),
      parsed = await parseFile(dir, docx);
    expect(parsed.status).toBe("parsed");
    expect(parsed.text.length).toBeGreaterThan(0);
    expect(
      parsed.segments.some((s) => s.section?.startsWith("Paragraph")),
    ).toBe(true);
  }, 60000);
  it("retains malformed, over-page and over-text originals with explicit failures", async () => {
    const dir = await directory(),
      bad = await saved(
        dir,
        "file-malformed",
        new TextEncoder().encode("%PDF-1.7\ninvalid\n%%EOF"),
        "bad.pdf",
        "application/pdf",
      );
    expect((await parseFile(dir, bad)).status).toBe("failed");
    expect(await storage(dir).read(bad)).toHaveLength(bad.bytes);
    const pdf = await PDFDocument.create();
    for (let n = 0; n < 101; n++) pdf.addPage();
    const many = await saved(
      dir,
      "file-pages",
      await pdf.save(),
      "many.pdf",
      "application/pdf",
    );
    expect((await parseFile(dir, many)).status).toBe("limit-exceeded");
    const near = await saved(
      dir,
      "file-near",
      new TextEncoder().encode("a".repeat(200000)),
    );
    expect((await parseFile(dir, near)).text).toHaveLength(200000);
    const huge = await saved(
        dir,
        "file-text-limit",
        new TextEncoder().encode("a".repeat(200001)),
      ),
      result = await parseFile(dir, huge);
    expect(result.status).toBe("limit-exceeded");
    expect(result.text).toBe("");
    expect(await storage(dir).read(huge)).toHaveLength(200001);
  }, 60000);
  it("terminates an unresponsive worker and caps the waiting queue", async () => {
    const dir = await directory(),
      v = await saved(
        dir,
        "file-timeout",
        new TextEncoder().encode("synthetic"),
      ),
      workerPath = path.join(dir, "hang.mjs");
    await writeFile(workerPath, "while(true) {}\n");
    const started = performance.now();
    const result = await parseFile(dir, v, { timeoutMs: 100, workerPath });
    expect(result.status).toBe("limit-exceeded");
    expect(result.warnings).toContain("PARSE_TIMEOUT");
    expect(performance.now() - started).toBeLessThan(5000);
    const outcomes = await Promise.allSettled(
      Array.from({ length: 6 }, () =>
        parseFile(dir, v, { timeoutMs: 100, workerPath }),
      ),
    );
    expect(outcomes.filter((o) => o.status === "rejected")).toHaveLength(1);
    expect(outcomes.filter((o) => o.status === "fulfilled")).toHaveLength(5);
  }, 15000);
});
