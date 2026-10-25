import { describe, it, expect } from 'vitest';
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { ingestDocument } from '../src/server';
import { normalizeText } from '../src/index';
import sharedDocuments from '../../../packages/contracts/fixtures/documents.json';
import { validateCitation, validateDocument } from '../../../packages/contracts/src/index';
const fixture = async (name: string) => ({
  filename: name,
  bytes: new Uint8Array(
    await readFile(fileURLToPath(new URL(`../fixtures/${name}`, import.meta.url))),
  ),
});
describe('document ingestion', () => {
  it('preserves Unicode UTF-16 offsets and headings', () => {
    const d = normalizeText({ filename: 'x.md', text: '# 🌿 Garden\r\nBudget: $5' });
    expect(d.segments[1]!.start).toBe(12);
    expect(d.segments[1]!.section).toBe('🌿 Garden');
    expect(
      validateCitation(
        {
          documentId: d.id,
          segmentId: d.segments[1]!.id,
          start: 12,
          end: d.text.length,
          quote: 'Budget: $5',
        },
        [d],
      ),
    ).toBe(true);
  });
  it('extracts text PDFs and page provenance', async () => {
    const d = await ingestDocument(await fixture('text.pdf'));
    expect(d.text).toContain('Community gardens');
    expect(d.segments[0]!.page).toBe(1);
    expect(d.metadata.engine).toBe('pdfjs');
  });
  it('extracts real DOCX paragraphs', async () => {
    const d = await ingestDocument(await fixture('brief.docx'));
    expect(d.text).toContain('River City Lab');
    expect(d.segments[1]!.section).toBe('Paragraph 2');
  });
  it('parses quoted CSV cells with row provenance', async () => {
    const d = await ingestDocument(await fixture('table.csv'));
    expect(d.text).toContain('Reusable, local');
    expect(d.segments[1]!.row).toBe(2);
  });
  it('requires OCR only for scanned PDF and supports explicit adapter', async () => {
    const input = await fixture('scanned.pdf');
    await expect(ingestDocument(input)).rejects.toMatchObject({ code: 'OCR_REQUIRED' });
    const d = await ingestDocument(input, {
      ocr: async () => ({
        pages: [{ page: 1, text: 'Synthetic scanned result' }],
        engine: 'fixture-ocr',
      }),
    });
    expect(d.metadata.engine).toBe('fixture-ocr');
    expect(d.text).toContain('scanned result');
  });
  it('handles empty and rejects malformed, unsupported, oversize and invalid encoding', async () => {
    expect((await ingestDocument({ filename: 'x.txt', bytes: new Uint8Array() })).text).toBe('');
    await expect(ingestDocument(await fixture('malformed.pdf'))).rejects.toMatchObject({
      code: 'CORRUPT_DOCUMENT',
    });
    await expect(
      ingestDocument({ filename: 'bad.exe', bytes: new Uint8Array([1]) }),
    ).rejects.toMatchObject({ code: 'UNSUPPORTED_TYPE' });
    await expect(
      ingestDocument({ filename: 'bad.txt', bytes: new Uint8Array([255]) }),
    ).rejects.toMatchObject({ code: 'INVALID_ENCODING' });
    await expect(ingestDocument(await fixture('text.pdf'), { maxBytes: 2 })).rejects.toMatchObject({
      code: 'FILE_TOO_LARGE',
    });
  });
  it('stable content hashes support incremental ingestion', async () => {
    const a = await ingestDocument(await fixture('project.md')),
      b = await ingestDocument(await fixture('project.md'));
    expect(a.hash).toBe(b.hash);
    expect(a.id).toBe(b.id);
  });
  it('honors cancellation before parsing', async () => {
    await expect(
      ingestDocument(await fixture('text.pdf'), { signal: AbortSignal.abort() }),
    ).rejects.toThrow();
  });
  it('preserves physical source lines through empty CSV records and quoted multiline cells', async () => {
    const text = 'name,notes\r\n\r\nAlice,"first\r\nsecond"\r\n   ,  \r\nBob,ready\r\n';
    const document = await ingestDocument({
      filename: 'rows.csv',
      bytes: new TextEncoder().encode(text),
    });
    expect(document.segments.map((segment) => segment.row)).toEqual([1, 3, 6]);
    expect(document.text).toContain('first\\r\\nsecond');
    for (const segment of document.segments)
      expect(
        validateCitation(
          {
            documentId: document.id,
            segmentId: segment.id,
            start: segment.start,
            end: segment.end,
            quote: document.text.slice(segment.start, segment.end),
          },
          [document],
        ),
      ).toBe(true);
  });
  it('matches the canonical cross-language Unicode document and exact citation spans', async () => {
    for (const fixture of sharedDocuments.cases) {
      const document = await ingestDocument({
        filename: fixture.input.filename,
        bytes: new TextEncoder().encode(fixture.input.text),
      });
      expect(document).toMatchObject(fixture.document);
      for (const citation of fixture.citations)
        expect(validateCitation(citation, [document])).toBe(true);
      expect(validateCitation({ ...fixture.citations[0]!, end: 1 }, [document])).toBe(false);
      expect(() =>
        validateDocument({
          ...document,
          segments: [{ ...document.segments[0]!, end: fixture.invalidEndOffset }],
        }),
      ).toThrow();
    }
  });
});
