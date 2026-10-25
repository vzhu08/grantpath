# Roadmap 01 renderer verification

PT-01 implements and verifies the canonical export capability before application migration. It does not claim that full NSF templates/reuse are already available in the UI. The user selected the separately researched specification `FULL_PROPOSAL_TEMPLATES.md`.

The validated document tree permits paragraphs, heading levels 1–3, independent ordered/unordered lists and rectangular tables. It rejects unsupported nodes, extra fields, XML-illegal controls and malformed Unicode. One server renderer creates DOCX and converts those exact bytes to PDF. US Letter, one-inch margins, Times New Roman 12 pt, at least 14 pt body spacing; no narrative covers, headers, footers or inserted page numbers. No automatic font shrinking/truncation. Separate ordered lists restart. Table headers repeat and rows expand.

Pinned libraries: docx 9.14.0; pdf-lib 1.17.1; fflate 0.8.3 for test-only OOXML inspection. Locally tested LibreOffice: 26.8.1.1, build bf6ef2662401c7d6dce671ab4deb26ee0af3a7c1. The official signed MSI was verified and administratively extracted into ignored `.local-tools/libreoffice`; no system installation/registration was performed. Fonts were actual installed Times New Roman regular/bold/italic/bold-italic, with SHA-256 recorded per render. Binaries/fonts are not committed or redistributed.

## Run the real export check

Configure absolute `GRANTPATH_LIBREOFFICE_PATH` and actual Times fonts in `GRANTPATH_FONT_DIR` (the four Windows filenames times.ttf/timesbd.ttf/timesi.ttf/timesbi.ttf). `GRANTPATH_EXPORT_DIR` is a trusted server-owned directory, never a browser-supplied path. Then run `npm run test:exports`. Missing renderer/fonts fail visibly. DOCX and input snapshots survive conversion failure, with page count Unknown.

PowerShell example for this checkout's local extraction:

```powershell
$env:GRANTPATH_LIBREOFFICE_PATH=(Resolve-Path '.local-tools/libreoffice/program/soffice.com').Path
$env:GRANTPATH_FONT_DIR='C:\Windows\Fonts'
$env:GRANTPATH_EXPORT_DIR=Join-Path (Get-Location) 'test-results/proposal-rendering/jobs'
npm run test:exports
```

The configured executable is invoked with an argument array, hidden window, isolated per-job profile and no shell-built source arguments. Bounds: one-million-character tree, 20,000-character blocks, 25 MB DOCX/PDF, 60-second conversion, bounded diagnostic output. Timeout/cancellation terminates the owned process tree and records failure. Actual PDF fonts must be embedded Times New Roman; substitution cannot record a page-limit pass. Recheck cancellation after asynchronous phases. Private content is not logged.

## Actual evidence

The mixed heading/list/table/Unicode/placeholder fixture rendered in **1 page** and passed a one-page limit. An intentional overflow rendered in **3 pages** and failed that limit. A repeating-table fixture rendered in **3 pages**, retaining the final row. Letter media boxes are 612×792 PDF points; actual PDF resources use embedded TimesNewRomanPSMT/TimesNewRomanPS-BoldMT. Placeholder and Unicode text survives extraction. Every page was rendered through the packaged document QA renderer and visually inspected: no clipping, overlap, missing table rows or font substitution. A second ordered list restarts at 1.

Each render records input, DOCX and PDF SHA-256, renderer/profile/font identity and real page count in a private job directory. Reproducible logs and QA images are under ignored `test-results/proposal-rendering/`. Default tests inspect OOXML, reject invalid content/font substitution, exercise timeout/cancellation and preserve artifacts on failure; they do not need LibreOffice or call external services.

Next integration: reviewed immutable NSF template manifest, explicit v1→v2 migration/binding, expanded editor/reuse, frozen snapshots and export routes. Per-component limit aggregation, persistent export queue/idempotency, prior-support span measurements and sponsor-specific mappings belong to those next tasks; this spike is not a finished sponsor-package exporter.
