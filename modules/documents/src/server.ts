import { createHash } from 'node:crypto';
import { z } from 'zod';
import Papa from 'papaparse';
import mammoth from 'mammoth';
import { normalizeText } from './index';
import { validateDocument, type NormalizedDocument } from '../../../packages/contracts/src/index';
import { KitError } from '../../../packages/runtime/src/index';

export type OCRAdapter = (input: {
  bytes: Uint8Array;
  mimeType: string;
  filename: string;
  signal?: AbortSignal;
}) => Promise<{ pages: { page: number; text: string }[]; engine: string }>;
const Input = z.object({
  filename: z.string().min(1).max(255),
  bytes: z.instanceof(Uint8Array),
  id: z.string().min(1).optional(),
  mimeType: z.string().optional(),
});
const types: Record<string, string> = {
  txt: 'text/plain',
  md: 'text/markdown',
  csv: 'text/csv',
  pdf: 'application/pdf',
  docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  png: 'image/png',
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
};
export async function ingestDocument(
  input: { filename: string; bytes: Uint8Array; id?: string; mimeType?: string },
  options: { maxBytes?: number; maxPages?: number; ocr?: OCRAdapter; signal?: AbortSignal } = {},
): Promise<NormalizedDocument> {
  const { filename, bytes, id } = Input.parse(input);
  const { maxBytes = 10_000_000, maxPages = 100, signal } = options;
  if (
    !Number.isSafeInteger(maxBytes) ||
    maxBytes < 1 ||
    !Number.isSafeInteger(maxPages) ||
    maxPages < 1
  )
    throw new KitError('INVALID_LIMIT', 'Positive limits required');
  signal?.throwIfAborted();
  if (bytes.length > maxBytes)
    throw new KitError('FILE_TOO_LARGE', `File exceeds ${maxBytes} bytes`, 413);
  const ext = filename.toLowerCase().split('.').pop()!;
  const mimeType = input.mimeType ?? types[ext];
  if (!mimeType || !Object.values(types).includes(mimeType))
    throw new KitError('UNSUPPORTED_TYPE', 'Use TXT, Markdown, CSV, PDF, DOCX, PNG or JPEG', 415);
  if (bytes.length === 0) return normalizeText({ filename, text: '', id, mimeType });
  const hash = createHash('sha256').update(bytes).digest('hex'),
    documentId = id ?? `doc-${hash.slice(0, 24)}`;
  const units: { text: string; page?: number; row?: number; section?: string }[] = [];
  const warnings: string[] = [];
  let engine = 'text';
  const ocr = async () => {
    if (!options.ocr)
      throw new KitError(
        'OCR_REQUIRED',
        'No extractable text. Configure the optional OCR adapter.',
        422,
      );
    const result = await options.ocr({ bytes, mimeType, filename, signal });
    if (result.pages.length > maxPages)
      throw new KitError('TOO_MANY_PAGES', 'OCR page limit exceeded', 413);
    engine = result.engine;
    for (const p of result.pages)
      units.push({
        text: z.string().parse(p.text),
        page: z.number().int().positive().parse(p.page),
      });
  };
  try {
    if (mimeType.startsWith('image/')) await ocr();
    else if (mimeType === 'application/pdf') {
      if (Buffer.from(bytes.subarray(0, 5)).toString() !== '%PDF-')
        throw new KitError('CORRUPT_DOCUMENT', 'Invalid PDF header', 422);
      const { getDocument } = await import('pdfjs-dist/legacy/build/pdf.mjs');
      const task = getDocument({ data: Uint8Array.from(bytes), useSystemFonts: true });
      const cancel = () => {
        void task.destroy();
      };
      signal?.addEventListener('abort', cancel, { once: true });
      try {
        const pdf = await task.promise;
        if (pdf.numPages > maxPages)
          throw new KitError('TOO_MANY_PAGES', `PDF exceeds ${maxPages} pages`, 413);
        for (let p = 1; p <= pdf.numPages; p++) {
          signal?.throwIfAborted();
          const page = await pdf.getPage(p);
          const content = await page.getTextContent();
          const text = content.items
            .map((item) => ('str' in item ? item.str + (item.hasEOL ? '\n' : ' ') : ''))
            .join('')
            .trim();
          units.push({ text, page: p });
          page.cleanup();
        }
        engine = 'pdfjs';
      } finally {
        signal?.removeEventListener('abort', cancel);
        await task.destroy();
      }
      if (!units.some((p) => p.text.trim())) {
        units.length = 0;
        await ocr();
      } else if (units.some((p) => !p.text.trim()))
        warnings.push('Some pages have no text; mixed scanned pages require explicit OCR.');
    } else if (mimeType === types.docx) {
      // Reject oversized ZIP inflation before mammoth allocates expanded entries.
      const b = Buffer.from(bytes);
      let expanded = 0,
        entries = 0;
      for (let i = 0; i + 46 <= b.length; i++)
        if (b.readUInt32LE(i) === 0x02014b50) {
          expanded += b.readUInt32LE(i + 24);
          entries++;
        }
      if (!entries || expanded > 50_000_000 || entries > 2000)
        throw new KitError('CORRUPT_DOCUMENT', 'Invalid or excessively expanded DOCX archive', 422);
      const result = await mammoth.extractRawText({ buffer: b });
      units.push(
        ...result.value
          .split(/\n\n+/)
          .filter(Boolean)
          .map((text, n) => ({ text, section: `Paragraph ${n + 1}` })),
      );
      warnings.push(...result.messages.map((m) => m.message));
      engine = 'mammoth';
    } else {
      let text: string;
      try {
        text = new TextDecoder('utf-8', { fatal: true }).decode(bytes);
      } catch {
        throw new KitError(
          'INVALID_ENCODING',
          'Upload UTF-8 text; convert other encodings before ingestion.',
          422,
        );
      }
      if (mimeType === 'text/csv') {
        let physicalLine = 1,
          cursor = 0;
        const errors: Papa.ParseError[] = [];
        Papa.parse<string[]>(text, {
          skipEmptyLines: false,
          step(result) {
            const row = physicalLine;
            // Papa's cursor is a source character offset, including quoted newlines.
            physicalLine += (text.slice(cursor, result.meta.cursor).match(/\r\n|\r|\n/g) ?? [])
              .length;
            cursor = result.meta.cursor;
            errors.push(...result.errors.filter((error) => error.code !== 'UndetectableDelimiter'));
            if (result.data.join('').trim()) units.push({ text: JSON.stringify(result.data), row });
          },
        });
        if (errors.length) throw new KitError('CORRUPT_DOCUMENT', errors[0]!.message, 422);
        engine = 'papaparse';
      } else {
        const result = normalizeText({ filename, text, id: documentId, mimeType });
        return validateDocument({
          ...result,
          hash,
          metadata: {
            ...result.metadata,
            byteLength: bytes.length,
            hashAlgorithm: 'sha256',
            engine,
          },
        });
      }
    }
  } catch (error) {
    if (signal?.aborted) throw signal.reason;
    if (error instanceof KitError) throw error;
    throw new KitError(
      'CORRUPT_DOCUMENT',
      `Cannot extract ${filename}: ${error instanceof Error ? error.message : 'invalid data'}`,
      422,
    );
  }
  signal?.throwIfAborted();
  let text = '';
  const segments = units.map((unit, n) => {
    const start = text.length;
    text += unit.text;
    const end = text.length;
    text += '\n';
    const { text: _text, ...refs } = unit;
    return { id: `${documentId}:s${n}`, start, end, ...refs };
  });
  if (!text.trim()) warnings.push('EMPTY_DOCUMENT');
  if (text.length > 5_000_000)
    throw new KitError('TEXT_TOO_LARGE', 'Extracted text exceeds 5 million UTF-16 code units', 413);
  return validateDocument({
    id: documentId,
    filename,
    mimeType,
    hash,
    text,
    segments,
    metadata: {
      mode: 'local',
      engine,
      warnings,
      byteLength: bytes.length,
      hashAlgorithm: 'sha256',
      offsetEncoding: 'utf-16',
    },
  });
}
