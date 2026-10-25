# GrantPath: NSF Proposal Templates and Reusable Content

Implementation specification v1.0 | October 25, 2026

Status: researched implementation plan; baseline assumed complete; NSF selected by the user. Product implementation is not authorized by the documentation request.

## 1. The next release

*Decision and implementation readiness*

Build **full proposal templates and reusable content**, roadmap item 01. The user selected **NSF Research proposal** as the first template family. Treat the baseline as finished; completing or redesigning the baseline is outside this plan.

### Do we have enough information?

**Yes, for a bounded implementation.** The roadmap supplies the outcome and safeguards; the repository supplies versioned evidence, draft revisions, requirements, persistence and readiness interfaces. Official NSF guidance supplies a first template. The decisions below close the remaining engineering choices.

**A specific live solicitation is not yet selected.** Ship an explicitly labeled standard NSF Research preparation template. Require a researcher to reconcile it with the actual opportunity before recording template confirmation for an application. Do not imply coverage of every NSF program or a complete portal submission.

### Release outcome

A researcher selects the NSF template, confirms applicable requirements, prepares all supported narrative components, reuses reviewed content without losing provenance, and downloads editable DOCX files and rendered PDFs with a separate review report and immutable input snapshot.

| Decision | Bounded release |
| --- | --- |
| Template | One standard NSF Research profile; single submitting organization; no subawards or special proposal types. |
| Storage | Keep the completed baseline local, single user and single process. No authentication or hosted-storage expansion. |
| Authoring | Template-driven sections; plain text, headings, lists and simple tables; existing fixture/live AI distinction. |
| Delivery | Separate narrative files plus a clearly labeled internal review packet. No submission, certification or external sends. |

### Authorization and ownership

This document is research and a proposed implementation contract. The current request authorizes documentation, not product implementation. The requesting user is the product/scope owner; Codex is the proposed implementation steward. Confirm any different human approval owner before implementation. Use one writer; no agents or concurrent file claims are assumed.

## 2. What the research changes

*NSF source hierarchy and current policy*

Research checked October 24-25, 2026. NSF currently identifies **PAPPG 24-1** as its current guide and lists Supplements 1 and 2. Preserve the effective dates and sources; do not select an imagined newer annual guide. [S1]

### The important correction: DMSP

Supplement 2 replaces the older two-page DMSP upload rule with a **Research.gov tool**, released April 27, 2026. Some NSF overview pages still describe the former PDF workflow. The newer notice controls this design; provide a preparation worksheet and an external-completion checklist item, not a purported official DMSP upload. [S4, S8]

| Verified rule | Template treatment | Source |
| --- | --- | --- |
| Project Summary: up to 1 page | Overview, Intellectual Merit and Broader Impacts content. | S2 |
| Project Description: up to 15 pages | Include a standalone Broader Impacts heading; prior-support content is inside this limit. | S2, S5 |
| Budget Justification: up to 5 pages | Narrative only; user supplies approved line items. | S6 |
| Mentoring Plan: up to 1 page if applicable | Ask whether graduate students or postdoctoral scholars receive support; unknown stays unresolved. | S2 |
| Separate uploaded files; portal pagination | No inserted cover pages, provenance appendices or page numbers in narrative files. | S2 |
| DMSP prepared in Research.gov | Worksheet has no inherited two-page validation rule. | S4 |

### Resolve rules explicitly

At application setup retain the guide, supplements, relevant unit guidance and actual solicitation as versioned requirement sources. Apply explicit solicitation deviations within their scope, while respecting superseding notices. Conflicting or unclear coverage produces a visible decision for the researcher; no model silently selects a rule.

The app implementation must ship reviewed source excerpts with exact references and review dates. A stored URL is not a live verification. Policy refresh is manual in this release; updated templates are immutable new versions and never change existing applications automatically.

## 3. The first template

*Supported components and clear coverage boundaries*

Template ID: **nsf-standard-research**; initial immutable version: **1**. Template display name: **NSF Research - narrative preparation**. Its section IDs are stable identifiers, not labels or array positions. This is a GrantPath structure derived from cited guidance, not an NSF-issued form.

| Component / stable ID | Requiredness and limit | Release behavior |
| --- | --- | --- |
| Project Summary / project-summary | Required; 1 page [S2] | Three editable content groups under one file/page limit. |
| Project Description / project-description | Required; 15 pages [S2] | Suggested objectives, context, methods, evaluation and timeline; required Broader Impacts heading. |
| Prior Support / prior-support | Conditional; up to 5 pages within the 15 [S5] | Nested in Project Description; applicability confirmed by researcher. |
| References Cited / references | Required component [S5] | Bibliographic entries only; user confirms any no-references statement. |
| Budget Justification / budget-justification | Required; 5 pages [S6] | Draft from researcher-entered budget facts; no ledger or invented rates. |
| Facilities / facilities | Required component [S5] | Narrative resource text; no quantifiable financial information. |
| Mentoring Plan / mentoring | Conditional; 1 page [S2] | One component when applicable; unknown applicability blocks completion. |
| DMSP worksheet / dmsp-worksheet | Required portal task [S4] | Local preparation only; manually complete official Research.gov tool. |

### External items remain visible

Track cover sheet/portal fields, budget forms, required personnel documents, certifications, and any call-specific attachments as external checklist items. Biosketches and Current and Pending Support use SciENcv; a reusable biography cannot replace them. COA uses its prescribed template. [S7]

### Stop at the supported boundary

Flag subawards, multi-organization collaboration, special proposal types, unsupported figures/equations or unusual attachments for manual preparation. The user can continue drafting, but GrantPath cannot mark the entire sponsor package supported. Scientific facts, faculty records and a live solicitation must come from the researcher, not synthetic demo content.

## 4. The researcher journey

*A complete workflow with visible review states*

### 1. Select and confirm

Open an application and choose the template. Show supported components, external tasks, source dates and the opportunity being used. Ask about special proposal type, subawards/collaboration, supported trainees, any PI/co-PI current NSF support or NSF award ending in the past five years, and call deviations. [S5] Answers are yes/no/unknown. Unknown does not mean not applicable.

### 2. Review the mapping

Present the call requirement beside the proposed template section. Confirm, adjust or leave unmapped. Record the citation, decision, actor label and timestamp. Suggested subheadings are identified as writing guidance; only sourced requirements appear as sponsor obligations.

### 3. Write each component

A section navigator shows Missing, Drafting, Needs review and Reviewed states. The editor shows instructions, applicability, authoritative limits, selected evidence, reusable-content references, current counts and the most recent rendered page count. Word counts assist writing; page-limited sections remain unmeasured until rendered.

### 4. Reuse with context

Preview a library item, its source project, exact revision, confirmed scope and citations. Insert as a proposed copy into the selected section. The researcher reviews project-specific details and accepts a new draft revision. Do not silently edit other applications when library content changes.

### 5. Freeze and export

Save a packet snapshot after the user selects the sections and confirms unsaved edits are handled. Generate all files from that snapshot. Present artifact checks and unresolved items together. A later edit creates a new snapshot/export, preserving the previous one.

### Supported content model

Use a small validated document tree: paragraph, heading, ordered/unordered list and simple rectangular table. Preserve heading hierarchy and table cells in DOCX/PDF. Raw HTML, embedded scripts, floating text boxes, macros, external images and arbitrary DOCX template imports are outside this release. Unsupported content is flagged before export; never silently discarded.

Keep existing text drafts compatible. AI previews remain optional and section-scoped. Include the template instructions and exact selected evidence, validate output, and require acceptance before saving. Fixture mode stays visibly synthetic; a failed live request never becomes fixture text.

## 5. Data and version model

*Application-specific contracts, not a shared-kit rewrite*

Extend application contracts in **lib/schema.ts** and add focused modules under **lib/proposals/**. Keep imported modules and shared normalization/citation contracts intact. The inspected schema uses three enumerated section keys and schemaVersion 1; replace those assumptions through an explicit migration.

| Record | Required fields / invariant |
| --- | --- |
| TemplateVersion | id, version, sponsor, supported proposal type, sourceRefs, checkedAt, applicability questions, section definitions, rule set, render profile. Immutable after publication. |
| TemplateBinding | Application ID; template ID/version; confirmed call revision/source version; applicability answers; resolved rules; requirement mappings; confirmer/time. Copy a resolved manifest into the application. |
| SectionDefinition | Stable ID, export component ID, parent ID, order, heading, instructions, required/conditional/optional status, typed condition, independent word/page limits and required headings. |
| DraftRevision | Existing text, source versions, quotations, missing inputs and mode; add validated blocks, template/rules revision, reused-content refs and review decisions. Revision IDs never change. |
| ContentItem / Revision | Stable item ID; immutable revisions; category; permitted reuse scope; citations and source/version IDs; approval/review record; retired status. |
| PacketSnapshot | Exact resolved template, applicability, project/call/source versions, selected draft revisions, reuse refs and readiness result. Append-only and self-contained. |
| ExportRecord | Snapshot ID/digest; status; format; renderer/font versions; per-component page counts; output hashes; failure details; created time. Immutable completed outputs. |

### Integrity is more than shape validation

Require unique section IDs and order within each parent, acyclic parent relations, valid requirement mappings and valid evidence/reuse references within the local owner scope. Conditional expressions use a small typed operator set; never eval source or template text. Preserve normalized UTF-16 quotation offsets.

Content hashes used by existing text evidence are identity aids, not cryptographic integrity guarantees. Use server SHA-256 over a canonical serialized packet for packet digests and binary artifact hashes. Do not reinterpret the old evidence hash or invalidate retained quotations.

## 6. Preserve existing work

*Schema migration and template adoption*

### Automatic storage migration: v1 to v2

- Read and validate v1 before changes. Write a private, timestamped byte-for-byte backup next to the workspace; migration failure leaves the original untouched.

- Create a legacy-three-section template binding. Preserve the original summary, significance and approach IDs, text, limits, all draft IDs/revisions, source hashes/offsets, history, waivers and application stage.

- Convert legacy text to paragraph blocks without changing its characters or inventing structure. Retain the original text for citation/history compatibility. New records explicitly identify the content representation version.

- Validate v2 shape and referential integrity, then perform the existing atomic replacement. Reopening a migrated file must not migrate again. Unknown future schemas fail visibly; never seed demo data over a migration error.

### NSF adoption is a separate user action

Preview a mapping: existing summary to the Project Summary overview; significance and approach to proposed Project Description subsections. Both may need changes to meet the new instructions. Copy into new revisions marked Needs review. Do not label old text as a finished NSF component.

Keep every old section and source revision accessible. Unmapped material is retained under archived/unmapped content and excluded from the sponsor export unless explicitly mapped. Never drop a draft because a template has fewer or differently named sections.

### Future template changes

Existing applications remain pinned. Show a diff between the bound version and a newer template: headings, limits, applicability, sources and mappings. Adoption creates a new binding revision; removed sections remain archived. A call amendment or policy-source change invalidates confirmation and current review state without rewriting text.

### Safe rollback

Do not write v2 state through v1 code. Recovery uses the preserved v1 backup with the matching old application version. Document a restore rehearsal using synthetic data. If work has continued after migration, export that v2 state before recovery and reconcile it explicitly; rollback is not a lossless downgrade.

## 7. Reusable content without drift

*Reviewed copies with dependency tracking*

Keep the library local and single-owner. Useful categories include methods, facilities, project-team descriptions and internal biography prose. The initial version uses exact versioned text/blocks rather than automatic semantic retrieval or cross-user sharing.

### Library lifecycle

- Save selected content as a draft library revision. Retain its origin application/section/draft IDs, supporting source versions, original context, review date and permitted reuse scope.

- The researcher reviews and approves a revision for reuse. Approval is a local assertion with an actor label and timestamp, not authenticated institutional certification. Editing creates a new unapproved revision.

- Insert only after preview and target-application review. Save a copied revision plus the exact content-item revision reference and a reuse decision. Text is independent after insertion; provenance remains attached.

- When an upstream item or supporting source changes, show affected applications and a diff. Offer Keep and justify, Apply as proposed revision, or Retire from library. No bulk replacement bypasses per-application review.

### Claims have context

Prior results, collaborator commitments, ethics approvals, site access and facility availability are project-specific unless the researcher explicitly confirms otherwise. An old approval cannot prove a new project is approved. Retain uncertainty and date/scope limits; do not strip them to make reused text sound definitive.

### Dependency rules

A saved draft references the exact evidence and content revisions it used. A source change marks affected drafts stale. A library change marks its linked uses for review; choosing Keep records why the pinned version is still appropriate. Removing a reference cannot erase the historical chain. Retiring an item prevents new insertions but preserves past snapshots.

Use the existing source/version citation validator for evidence; a content-item reference is additional provenance and does not itself prove a factual claim. Copying to another project preserves an authorized immutable evidence snapshot or requires selecting target-project evidence, so it cannot create a dangling or out-of-scope source reference.

## 8. Readiness and limits

*Deterministic findings with explicit measurement state*

Extend the completed baseline readiness engine. Administrative findings remain separate from AI suggestions about scientific content. Never present a tool check as funding probability, institutional approval or a guarantee of NSF acceptance.

| Rule group | Deterministic behavior |
| --- | --- |
| Template and call | Require a pinned template and confirmed call mapping; new call/source/binding revisions mark that confirmation stale. |
| Applicability | Unknown stays unresolved. A false condition excludes a component only with a recorded answer; later answer changes restore the requirement. |
| Structure | Required component present; required headings exist as actual heading nodes; section order and export grouping match the resolved manifest. |
| Evidence and reuse | Flag invalid or changed sources, missing inputs, unresolved placeholders and unreviewed reused content; retain prior waivers/history. |
| Words | Count normalized visible text in paragraphs, headings, lists and tables. Apply only an explicit word limit; do not convert pages into words. |
| Pages | Evaluate the exact rendered PDF for each export component. Project Description subparts share one aggregate limit. Unrendered, failed or stale measurements are Unknown. |
| External items | Track researcher-recorded completion independently. Local narrative completeness cannot clear SciENcv, DMSP or certification tasks. |

### Page constraints need artifacts

Store a page-measurement fingerprint covering content, template/rules, font files and renderer version. Any change invalidates it. Count real PDF pages and inspect for clipping and table overflow. For nested limits such as prior support, measure the rendered pages touched by that group; missing span markers mean Unknown. Later Word edits or alternate fonts can repaginate the editable DOCX.

### Overrides do not rewrite requirements

Keep reasoned readiness waivers tied to the exact issue fingerprint. Show waived findings in the review report. A waiver cannot change a sourced sponsor limit, convert an Unknown measurement into Pass, or label an unsupported package complete. Actual deviations require a separately reviewed rule/source record.

Add deterministic checks for prohibited URLs in the Project Description and missing references where explicitly linked. Do not claim automatic detection of all unsupported scientific assertions, complete citation correctness or every sponsor policy.

## 9. Reliable DOCX and PDF

*One document model, one measured export pipeline*

### Recommended implementation

Build DOCX on the server using the **docx** package, then convert those exact bytes to PDF using a configured **LibreOffice** headless worker. The package documents OOXML packing and section layout; LibreOffice documents batch conversion and isolated profiles. Exact package/runtime versions must be pinned and recorded after the first renderer spike. [S9-S11]

Use one validated document tree for editor content, DOCX generation, word counts and review extraction. Avoid two independent layout implementations. Playwright PDF is a possible later HTML renderer, but does not remove the need to check DOCX fidelity. [S12]

### Render profile

Choose US Letter portrait, one-inch margins, Times New Roman 12 pt, at least 14 pt body line spacing, one column and simple tables. These are conservative product choices within the researched NSF formatting constraints. Require the actual font; no silent substitute. Do not insert page numbers or margin headers into narrative upload files. [S2]

### Output bundle

- One DOCX and one PDF per supported, applicable narrative component. Summary subgroups stay in one file; Project Description subsections stay in one file. DMSP output is named Preparation worksheet, not official submission.

- A separate review-report PDF with missing inputs, stale sources, waived findings, unsupported/external items, per-file page counts and exact snapshot ID. A manifest links every artifact, hash, component and readiness result.

- Retain the existing internal review/Markdown export. A combined preview may be provided, clearly marked Internal review; its appendix and cover are never included in the per-component page measurement.

### Warnings remain in the exported packet

Unresolved text placeholders stay visible in draft component files. Companion review warnings are mandatory and cannot be omitted from a bundle. Mark output status Draft with unresolved items, or Narrative checks passed; neither means submitted. Never shrink fonts, remove warnings or silently truncate content to pass limits.

If conversion fails, preserve the snapshot and DOCX. Show PDF unavailable and page count Unknown; do not substitute a differently laid out PDF and call it verified. This machine currently has no LibreOffice at the checked standard install paths or on PATH. Installing/configuring the renderer is a release prerequisite, not completed work.

## 10. APIs and execution bounds

*Reuse local protections and optimistic concurrency*

All route names and commands here are proposed additions. Preserve the baseline loopback-only, same-origin checks, JSON validation, serialized mutation queue, revision conflicts and private server-side credentials. Do not expose file paths or accept arbitrary filesystem/renderer arguments.

| Boundary | Proposed contract |
| --- | --- |
| Template catalog | GET /api/proposal-templates returns the reviewed bundled versions and coverage. No remote fetch is implied. |
| Binding / sections | POST /api/workspace with expectedRevision and commands preview/adoptTemplate, confirmTemplate, saveSection. Section IDs resolve within the selected application. |
| Reusable content | Workspace commands saveContentRevision, approveContentRevision, insertContent, resolveReuseUpdate. Every accepted insertion creates a target draft revision. |
| Freeze | Workspace command createPacketSnapshot: require saved revisions, resolve all referenced data, persist the immutable snapshot and return its ID/digest. |
| Export | POST /api/proposal-exports takes snapshotId and format; returns exportId/status. GET status or allowlisted artifact ID returns only that export, no arbitrary paths. |
| AI generation | Existing generation boundary gains stable section ID, template binding revision and expectedRevision. Treat template, library and evidence text as data; no arbitrary tools or URL retrieval. |

### Concrete starting limits

Keep the baseline mutation body bound at 120 KB and each saved draft section at 20,000 UTF-16 units. Bound a template to 32 sections and a saved packet to 1,000,000 units. Longer narrative components use several editable subparts sharing one export/page limit. Measure prompt bytes/characters separately and retain existing AI usage limits. Reject oversized input before parsing and never truncate a proposal.

Export one job at a time in this single-process release. Persist queued/running/succeeded/failed states; after restart mark interrupted jobs failed/retryable. Use a snapshot+format+renderer-profile digest for idempotency. Set a proposed 60-second conversion timeout and a 25 MB artifact bound; validate and adjust using representative fixtures before release.

Use a private per-job directory, a unique LibreOffice profile, fixed executable path and argument-array subprocess invocation. No shell-built commands or network resources in generated documents. Clean only resolved job directories inside the export root. Cancellation/failure preserves snapshots and records the error without logging private proposal text.

## 11. Implementation sequence

*Serial task cards with observable completion gates*

Proposed human owner for all tasks: requesting user; implementation steward: Codex. Confirm owners if a different teammate will approve the work. One writer runs these tasks in dependency order. No deployment or live/paid AI test is required for this release.

| Task / dependencies | Allowed scope | Completion gate |
| --- | --- | --- |
| PT-01: renderer spike / none | New lib/proposals/rendering spike; synthetic fixtures; package manifests with user as proposed steward. | Pin docx; configure LibreOffice/fonts; render one heading/list/table document and an intentional page overflow. Record versions and fidelity limits. |
| PT-02: template + schema / PT-01 | lib/schema.ts; lib/proposals/templates and validation; reviewed policy fixtures. | Manifest encodes page vs word limits, conditions, external tasks and current DMSP handling. Invalid manifests fail. |
| PT-03: migration + binding / PT-02 | lib/repository.ts; lib/fixtures.ts; lib/proposals/migrations; app/api/workspace. | v1 data migrates idempotently with backup and unchanged revisions. User adoption previews mappings and archives unmapped content. |
| PT-04: editor + reuse / PT-03 | Existing application editor and new scoped proposal components; content library and generation boundary. | All supported components editable; reviewed reuse and update diffs persist; fixture/live labels remain explicit. |
| PT-05: readiness + exports / PT-04 | lib/readiness.ts; lib/exports.ts; lib/proposals snapshots/export worker; proposed export routes. | Exact snapshots produce separate DOCX/PDF files and mandatory review report. Changed inputs invalidate measurements. |
| PT-06: acceptance + handoff / PT-05 | tests/proposals; browser fixtures; docs/API_CONTRACT.md, TEST_PLAN.md, ACCEPTANCE.md and handoff. | Migration, failure, page-limit and fresh-session journeys pass; artifacts inspected; all skipped prerequisites recorded. |

### Shared files and integration

Before editing, re-read scoped instructions and the completed baseline interfaces. Claim the schema, package files, routes and editor files in the task board. The user is proposed human owner for shared manifests/contracts/migrations; Codex is proposed steward. Avoid layout/global-style changes unless needed and claimed. Adapt to existing component paths rather than rebuilding the baseline.

The first task is a capability spike, not the finished feature. Do not call the release complete until PT-06 covers a full persisted workflow and verified exports. If the canonical renderer cannot be installed, report that prerequisite; completing only DOCX is a partial milestone.

## 12. Acceptance matrix

*Meaningful fixture tests and a full browser journey*

| Case | Required observable result |
| --- | --- |
| A01. Template structure | Summary content groups share 1 page; description subparts share 15; actual heading nodes and correct order survive export. |
| A02. Conditional requirements | Yes/no/unknown trainee and prior-support answers change applicability correctly; unknown never silently removes work. |
| A03. Updated DMSP policy | No default two-page PDF-upload rule; worksheet and Research.gov task remain distinct. |
| A04. Requirement conflict | Call deviation or contradictory policy source requires a recorded resolution; source amendment marks confirmation stale. |
| A05. Migration | Synthetic populated v1 state retains exact text, draft/source IDs, offsets, history and waivers; backup exists; a second load makes no change. |
| A06. Adoption and switching | Preview is non-mutating; accepting creates revisions; unmapped/removed sections remain available; no data loss. |
| A07. Reuse scope | Old pilot or approval text is not accepted as a new-project fact; insertion retains context, source and revision references. |
| A08. Controlled updates | Library/source edit marks only affected uses for review; accepting one update cannot overwrite another application. |
| A09. Snapshot stability | Edits after freeze leave old text, rules, warnings and exports unchanged; same job key returns the existing export record. |
| A10. Limit boundaries | Real rendered at-limit and one-page-over fixtures pass/fail correctly. Word heuristics cannot pass page checks; renderer failure yields Unknown. |
| A11. Fidelity | Heading hierarchy, a table crossing pages, Unicode, long tokens and placeholders survive DOCX/PDF without clipping or hidden text. |
| A12. External requirements | Review report preserves incomplete SciENcv/DMSP/portal tasks; local readiness never certifies sponsor submission. |
| A13. Failures and concurrency | 409 preserves editor buffers; corrupt storage remains untouched; cancelled/failed/restarted exports remain visible and retryable. |
| A14. Bounds and isolation | Oversize, path traversal, invalid section/source IDs and unsafe content are rejected; no ordinary test contacts external APIs. |

### Fresh-session scenario

Start with a synthetic project and reviewed NSF-like call fixture. Adopt the template, confirm conditions, reuse facilities text, save every component, render, resolve an overflow and download the bundle. Restart the app, reopen the application and old snapshot, change supporting evidence, and verify the current draft becomes stale while the saved packet remains unchanged.

## 13. Release and handoff

*What is ready, what is still a prerequisite*

### Enough to start

The feature boundary, selected sponsor family, workflow, data/version model, migration policy, rendering approach, task sequence and acceptance contract are specified. Start PT-01 after this plan is accepted for implementation. No additional product interview is necessary to begin that bounded task.

| Remaining input | Owner / when needed | Default or consequence |
| --- | --- | --- |
| Actual program / solicitation | Researcher; before confirming an application template. | Generic practice template is usable meanwhile; call-specific readiness is unresolved. |
| Real project facts, budget and personnel data | Researcher; during application preparation. | Use synthetic fixtures for development; no guessed factual claims or rates. |
| Renderer and font installation | Local operator + implementation steward; PT-01. | LibreOffice was not found at checked paths; conversion and PDF fidelity remain unverified. |
| Package/runtime versions | Manifest steward; PT-01. | Pin only after the spike; document the exact tested renderer, library and font versions. |
| Special-case proposals or visuals | Product owner; if requested. | Expose unsupported scope and manual tasks; separate follow-up release. |

### Verification commands for implementation

From the project root: **npm ci**; **npm run check**; **npx vitest run tests/proposals**; relevant imported-module checks from their READMEs; then **npm run dev** and the browser scenario. Add a documented **npm run test:exports** command for real installed-renderer checks; separate its prerequisites from fixture-only tests.

Inspect rendered pages at normal reading size and boundary cases at full resolution. Record per-file page counts, artifact hashes, font/renderer versions, test exit codes, failure examples and the exact build inspected. Re-running an old fixture suite is not proof of the new export workflow.

### Evidence for this document

Completed: official-source research, roadmap/interface review, sponsor selection, plan authoring and document QA. Not performed: feature implementation, migration on user data, exporter spike, package installation, paid model calls, live Research.gov login, submission or deployment. No baseline completeness audit is used as a prerequisite in this plan.

Handoff must distinguish: implemented, fixture verified, renderer verified, manually reviewed and externally completed. Measure time to a reviewable packet, corrections after reuse, unsupported-claim findings and export defects. Do not infer award-rate improvement from a demo or model score.

## 14. Sources and implementation handoff

*Primary sources checked October 24-25, 2026*

Source IDs throughout this document refer to the official pages below. Technical architecture, proposed limits and task boundaries are product/engineering decisions, not statements issued by NSF.

- **[S1] [NSF PAPPG landing and current policy notices](https://www.nsf.gov/policies/pappg)**. Current-guide selection and supplements; recheck before implementation.

- **[S2] [PAPPG 24-1, Chapter II: Proposal Preparation](https://www.nsf.gov/policies/pappg/24-1/ch-2-proposal-preparation)**. Base structure, format and component rules; read with later notices.

- **[S3] [PAPPG 24-1 Supplement 1 / NSF 26-200](https://www.nsf.gov/policies/document/pappg24-1-supplement-1)**. Effective December 8, 2025; policy changes including data sharing.

- **[S4] [PAPPG 24-1 Supplement 2 / NSF 26-202](https://www.nsf.gov/policies/document/pappg24-1-supplement-2)**. DMSP tool change and April 27, 2026 transition; supersedes old upload rule.

- **[S5] [NSF proposal preparation checklist](https://www.nsf.gov/policies/pappg/24-1/ch-2-exhibit-1)**. Component checks; older DMSP portions must be reconciled with S4.

- **[S6] [NSF: Preparing Your Proposal](https://www.nsf.gov/funding/preparing-proposal)**. General component overview and budget-justification guidance.

- **[S7] [NSF: Documents Required for Senior/Key Personnel](https://www.nsf.gov/funding/senior-personnel-documents)**. SciENcv, COA and external personnel-document boundary.

- **[S8] [NSF ENG Data Management and Sharing Plan Guidance](https://www.nsf.gov/eng/data-management-sharing-plans)**. Corroborates the 2026 Research.gov tool; unit-specific content is not universal.

- **[S9] [docx: Packer API](https://docx.js.org/api/classes/index.Packer.html)**. Server DOCX packing; versions still need pinning during PT-01.

- **[S10] [docx: SectionProperties API](https://docx.js.org/api/classes/index.SectionProperties.html)**. Page size, margins and section layout.

- **[S11] [LibreOffice: command-line parameters](https://help.libreoffice.org/latest/en-US/text/shared/guide/start_parameters.html)**. Headless conversion, output directories and isolated profile configuration.

- **[S12] [Playwright: page.pdf API](https://playwright.dev/docs/api/class-page#page-pdf)**. Alternative HTML-to-PDF path considered; not the selected first renderer.

### Local inputs and interface references

GrantPath_Future_Capabilities_Roadmap.pdf, pages 1-2 and 10 (user-provided reference). Repository: docs/PROJECT_BRIEF.md, docs/API_CONTRACT.md, docs/implementation/PLAN.md; lib/schema.ts, repository.ts, fixtures.ts, evidence.ts, calls.ts, readiness.ts and exports.ts; modules/documents/README.md and modules/ai/README.md. Reconcile these interfaces with the finished baseline before edits.

**First implementation handoff:** Accept this bounded plan, claim PT-01, verify the canonical renderer and fonts with synthetic heading/list/table and page-overflow fixtures, then record the exact dependency versions before changing the application schema. Preserve source labels and all existing user work.
