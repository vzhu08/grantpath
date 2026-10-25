# Document ingestion

## 1. What problem does this solve, and when should I use it?

Normalize TXT, Markdown, PDF, DOCX, CSV and optional OCR into one evidence-addressable document. Use it before retrieval/extraction when filenames, page/row references and exact source support matter. Ingestion is local; provider credentials are unnecessary.

## 2. What is the smallest working example?

```sh
node --import tsx modules/documents/examples/demo.ts
```

```ts
import { ingestDocument } from './modules/documents/src/server';
const document = await ingestDocument({
  filename: 'notes.txt',
  bytes: new TextEncoder().encode('Budget: $20'),
});
```

The browser-safe `normalizeText({filename,text,id?,mimeType?})` handles pasted text/Markdown. `contentHash` is a deterministic non-security identifier.

## 3. How do I add it to a fresh project or an existing project?

Select `documents` with `kit create` or review `kit add --target <path> --modules documents`, then explicitly apply. Copy the module with packages/contracts and packages/runtime for manual integration. Install manifest versions. Server parsing belongs in an API route or worker, never a browser bundle. Existing upload UI can POST raw bytes or a bounded multipart body to its server route.

## 4. What does the API accept and return?

`ingestDocument({filename,bytes,id?,mimeType?},{maxBytes?,maxPages?,ocr?,signal?})` returns the canonical `NormalizedDocument`: id, filename, MIME, SHA-256 input hash, text, segments and metadata. PDF segments reference page, CSV segments the physical source start line (including blank lines and quoted multiline cells), DOCX paragraphs section, Markdown headings section. UTF-16 end-exclusive offsets index **normalized extracted text**, not original binary positions. CSV text uses JSON arrays so quoted cell boundaries are retained. Empty/whitespace-only CSV records are omitted from normalized text without renumbering later source references. Empty text returns an empty document with a warning. OCRAdapter accepts bytes/MIME/filename/signal and returns `{pages:[{page,text}],engine}`. `pythonOCR({python,worker,timeoutMs?})` in `src/ocr-server.ts` runs the optional worker in a bounded subprocess and removes temporary files.

## 5. What prerequisites, environment variables, or credentials are needed?

Node >=22 and manifest packages. No credentials. OCR additionally requires Python 3.12, `uv sync --extra ocr` under starters/python and system Tesseract. Configure absolute Python executable/worker paths yourself; the module installs no native software. PDF text extraction runs first; OCR is requested only for image inputs or wholly textless PDFs.

## 6. What changes must I make to routes, schema, storage, or UI?

Add an authenticated upload route when handling private content; bound the request body **before** parsing. Defaults: 10 MB input, 100 PDF pages, 5 million extracted UTF-16 units, 50 MB advertised DOCX expansion. Store source bytes only with explicit retention policy; persist normalized output/hash for incremental ingestion. Show filename, warnings and OCR_REQUIRED recovery. Keep extracted text as text nodes. No database migration is required.

## 7. How do I verify it and handle expected failures?

```sh
npx vitest run modules/documents/tests
node --import tsx modules/documents/examples/demo.ts
```

Tests cover real PDF/DOCX/CSV parsing, malformed PDF, empty input, encoding, size, Unicode offsets, cancellation and scanned PDF OCR contract. A shared canonical BOM/CRLF/emoji fixture in packages/contracts/fixtures/documents.json is consumed by both TypeScript ingestion and Python API tests. All fixtures are synthetic; scanned.png/scanned.pdf contain raster text. The injected OCR test is a fixture, not a native OCR run. Errors include UNSUPPORTED_TYPE (415), FILE_TOO_LARGE (413), CORRUPT_DOCUMENT/INVALID_ENCODING/OCR_REQUIRED (422). Route KitError through the shared errorResponse helper; show actionable recovery without exposing internal stack traces.

Implementation: implemented. Local: module tests passed on 2026-10-09 against pinned package-lock versions. Exported project: passed 2026-10-09 in the standalone full recipe (clean install, types, module tests, build and local HTTP). Live/provider: not run — no external provider required; optional native OCR not run. Source revision: base 0fcd52a plus this module's implementation commit.

## 8. What does it depend on, and what are its limits?

PDF.js 6.4.299, Mammoth 1.13.0, PapaParse 5.7.0, Zod/shared contracts/runtime. PDF reading order and DOCX paragraph text do not reconstruct complex page layouts, table cells, headers or formatting. Mixed text/scanned PDFs produce warnings; select OCR explicitly for missing pages. UTF-8 text only. Hash identity changes with input bytes; supply a stable id when replacing a document. Parsing is asynchronous but CPU work still belongs in a separate worker for untrusted or large workloads. DOCX ZIP central-directory sizes are checked, but this is not an OS sandbox; enforce process/memory limits for hostile files. Mammoth is called as a library, never its CLI; its CLI's inherited sprintf dependency has a known upstream audit finding recorded in the root dependency report.

Original code and synthetic fixtures: MIT. Third-party licenses remain with their packages. Official references verified 2026-10-09: [PDF.js](https://mozilla.github.io/pdf.js/examples/), [Mammoth](https://github.com/mwilliamson/mammoth.js), [PapaParse](https://www.papaparse.com/docs).
