# NSF proposal preparation release

Roadmap item 01 adds a complete local workflow for the supported standard NSF Research narrative profile. Researchers adopt a pinned template, reconcile it with their actual call, write supported components, approve reusable content and freeze exact inputs for export. This is preparation software; external sponsor tasks and scientific review remain explicit.

## What ships

The template has 14 editable content sections grouped into Project Summary, Project Description, References Cited, Budget Justification, Facilities, conditional Mentoring Plan and a DMSP preparation worksheet. Summary and Description subparts share their aggregate page limits. Prior support has a nested limit within Description. Unknown applicability remains unresolved. Source excerpts, source dates and the actual call are visible during confirmation. The official Research.gov DMSP task is separate from its worksheet.

Authoring supports paragraphs, headings, lists and rectangular tables. Saved revisions retain exact evidence versions and quotations. Researchers review exact revisions; subsequent edits need another review. Section navigation retains unsaved buffers, conflicts preserve local edits and freezing requires saved inputs. The three-section starter workflow remains available, with its previous revisions preserved during adoption and switching.

The content library retains immutable text, blocks, category, scope and evidence snapshots per revision. Approval is explicit and locally attributed. Insertion requires target-context review, preserves demo/researcher provenance and creates an independent draft revision. Updates offer keep-with-reason or a proposed new revision. Automatic replacement refuses edited block structures. Retiring an item prevents new insertion while keeping historical uses.

Frozen packets retain project/call/source/template/library inputs and issues with a canonical SHA-256 digest. Exports use those exact inputs. Each applicable component has its own editable DOCX and measured PDF; the internal review report, manifest and snapshot stay separate. Later edits cannot rewrite old packets or artifacts. Downloads verify byte length and SHA-256. Failed, cancelled and interrupted jobs preserve their records and available files and require explicit retry.

## Rendering and limits

The canonical renderer generates DOCX with pinned `docx` 9.14.0, then converts those exact bytes with configured LibreOffice. The profile uses Letter, one-inch margins, Times New Roman 12 pt and at least 14 pt line spacing, without page numbers, covers or source appendices. Actual embedded fonts, renderer identity and output hashes are recorded. Content is never silently shrunk or truncated to meet a page limit.

Page counts come from actual PDFs. Nested prior-support spans use unique ordered sponsor headings and count touched pages inclusively; ambiguous/missing anchors remain Unknown. Current readiness invalidates measurements after content, source, binding, renderer or font changes. A waiver cannot turn unsupported scope, unknown applicability or page compliance into a pass.

Set `GRANTPATH_LIBREOFFICE_PATH` to the trusted executable and `GRANTPATH_FONT_DIR` to the four actual Times New Roman TTF files. `GRANTPATH_EXPORT_DIR` controls private rendering jobs; use a short workspace path on Windows because LibreOffice's profile files can exceed Windows path limits. Without valid configuration, DOCX and review metadata remain available while PDFs/pages stay Unknown. Nothing is uploaded for conversion.

Bounds: 32 sections, 20,000 UTF-16 units per section, 120 KB mutation body, 1,000,000-unit frozen packet, one running export and four active/queued jobs, 60 seconds per conversion, 25 MB per artifact and 200 MB per packet. The full job has a ten-minute cancellation deadline. One local process owns each data directory.

## Migration and recovery

Schema 2 validates schema 1 and writes an exclusive timestamped byte-identical `workspace.v1-*.backup.json` before atomic replacement. IDs, text, source hashes/offsets, histories and waivers survive; starter drafts gain a legacy binding and text-compatible blocks. Reopening does not migrate again. Corrupt, unknown or failed migration data is preserved with an actionable error.

Restore rehearsal uses isolated fixtures. Stop the owned server, back up the entire current data directory, and use the preserved v1 bytes only with the matching v1 application revision. New v2 work must be reconciled separately; this is not a lossless downgrade. Never run v1 code against the v2 workspace. Normal local data and renderer artifacts remain outside Git.

## Verification

`npm run check` covers types, pure manifest/workflow/export tests and the production build. `npm run test:browser` covers the baseline plus full proposal editing, reuse, conflict recovery, frozen exports/downloads, source-change staleness and reload/restart persistence. Ordinary browser acceptance deliberately disables the installed renderer to verify honest DOCX preservation and Unknown PDF/page states without machine-specific prerequisites.

`npm run test:exports` checks actual canonical rendering, one-page fidelity, intentional overflow and a multi-page table. `npm run test:proposal-workflow` exercises real full-packet conversion, hashes, embedded fonts, seven components, nested prior-support spans, separate review outputs, idempotency, changed-input staleness and restart recovery. Both are explicit local renderer checks and make no paid/provider requests. Inspect rendered pages as well as automated output; results live under ignored `test-results/`.

The user requested stopping after item 01. The document-vault specification for item 02 is retained but application work for it has not begun. File uploads, ethics records and handoff attachments remain future work. Hosted authentication, general sponsor coverage, figures/equations, subawards, OCR, sponsor submission and external messages are outside this release.
