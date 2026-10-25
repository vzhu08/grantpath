# Task 03 — Resubmission response matrix release evidence

Status: integrated schema 4 and feature browser/restart acceptance passed. Baseline/vault regression, dev smoke and final private review health verification are in progress; the final release gate remains open.

Human product/scope owner: requesting user. Task 03 implementation/schema steward: this chat. Checkout `C:/Users/vzhu0/.codex/worktrees/f678/grantguide`, branch `feature/resubmission-matrix-03`, starting baseline `4b7d2059957d92d75f18984685a25bb2324a8b54` (workspace schema 2, roadmap 01 complete). The imported implementation specification retains exact SHA-256 `7D995546E39A2D13FBE6D52E1735772A6D867ADC9ED0A224080ECD34367C85A1` from the primary source.

## Hackathon value and judge proof

Researcher problem: reviewer comments get detached from proposed changes, actual evidence and the saved revision being reviewed. The distinctive mechanism connects an exact feedback quotation to shared actions, classified evidence passages, immutable target revision links, a response and a human decision. The focused judge path resolves a supported clarification, leaves an unfinished experiment open, then changes one linked source and reopens only that decision while the saved internal packet remains unchanged.

Technical impressiveness, clarity, impact and novelty are standing priorities. This release uses the existing local application and kit normalization/AI adapters; original work is the resubmission graph, capture truth, cycle separation, dependency invalidation, bounded comparison and frozen response packet. No measured time-saving, funding or market-uniqueness claim is made. Optional NIH profiles, sponsor DOCX/PDF, collaboration, external delivery and live AI tests are deferred. The human subsequently specified a demo tomorrow, October 26, 2026, with an approximate next-24-hours window; no exact cutoff or demo duration was supplied.

## Implemented workflow

- Strict feature schemas, server-assigned IDs/times and bounded retained histories.
- Mutable captures and attested immutable snapshots, coverage exclusions, correction lineage, copied historical research/call support and SHA-256 manifests.
- Atomic attempt/target cycles and operation receipts recovered before stale global revision rejection. Reviewed copies preserve manual/fixture/live origin and need target-context review.
- Feedback-only source namespace; normalized UTF-16 exact range quotations, paragraph coverage, append-only corrections, split/merge lineage and retained conflict decisions.
- Shared actions, explicit new-evidence requirements, honest negative/inconclusive outcomes, pinned target/evidence links and manual response histories.
- Human completion conditions and scientific dependency fingerprints, with administrative owner/due changes excluded from row invalidation.
- Bounded paragraph LCS comparison, stable many-to-many section mappings and complete-text fallback.
- Selective immutable internal Markdown/JSON packets, inert Markdown escaping and safe loopback download handlers.
- Optional suggestion/response previews, exact allowed-range validation, synthetic-only fixtures, per-request live consent, shared process limiter key, 15-minute bound tokens and post-durable-save token effects.

## Integrated storage and application contract

The parent explicitly transferred the shared-file lease after Task 02's checked `d3c252b8a0ab7874e76d32570ab89c5042d9af5e`. Task 03 stacked that source, then incorporated checked main `b4485b6730dac3585a33ebc1e1bfe739af20cc21` and its dependency updates. Main's squash ancestry caused source conflicts; the conflicted main files were verified identical to d3 before retaining the integrated schema 4 versions. Parent-owned central docs/CI and updated manifests were preserved. Task 03 does not author central coordination/status files.

Implemented interfaces for the next task lead:

1. Schema 4 preserves all schema 3 vault collections, Requirement.vault, Source fileOrigin, proposal library/packets/exports and histories. `V3StateSchema` remains available. `migrateV3` adds required `resubmissions` and live application cycle defaults; v1/v2 chain through it. The repository saves the original bytes to a unique exclusive backup first. Frozen proposal payload applications get no new defaults, preserving their old digests.
2. Workspace commands include the dedicated strict `ResubmissionCommandSchema` options. `applyResubmissionCommand` returns an isolated candidate and advances its revision. Create/freeze/packet receipts recover before stale revision rejection. `commitResubmissionPreview(result)` runs only after atomic durable write; failed storage retains an unaccepted preview.
3. `validateResubmissionGraph` runs on reads and every write/internal transaction, including ordinary source/draft/project edits. Broken current feature data fails closed. The new-write serialized cap is 25 MiB; additive migration can preserve an already larger valid store for read/export without deleting data.
4. Ordinary `saveApplication` selects only the initial cycle. Each attempt has a distinct target ID and cycle, recomputed requirements, no inherited Ready/Submitted state or waivers. Reset refuses to discard feature-referenced history. The ordinary application selector displays cycle IDs.
5. Drafting exposes separate Proposal drafting and Resubmission matrix subviews. `/api/resubmissions/view` supplies current row/attempt/document fingerprints, comparison and a de-duplicated action agenda after vault runtime hydration. Reviewed is derived against current dependencies, not the historic state field.
6. `acquireGeneration()` in `lib/resubmissions/limiter.ts` is explicitly shared by existing draft generation and both feature endpoints: one active request, six attempts/minute, 22-second signal. Previews use 50,000-unit prompt bounds, strict selected ranges, synthetic-only fixture contexts, explicit live consent, no tools, 15-minute memory tokens and acceptance-time input fingerprint revalidation.
7. Markdown/JSON download uses only frozen content. Current packets include selected row data, latest human decisions with retained dependency manifests, exact evidence/target copies, original coverage/attestation, sponsor decisions, open/stale/conflict states and separate application readiness. No sponsor attachment is produced.

## Actual verification so far

Commands in this isolated checkout:

| Command | Result |
| --- | --- |
| `npm ci` | Initial sandbox invocation failed (`Exit handler never called`); authorized unsandboxed retry exit 0, 117 packages, audit 0 vulnerabilities. |
| `npm run typecheck` | Exit 0 after independent feature implementation. |
| `npm test -- tests/resubmissions` | Exit 0, 32 tests across 3 suites (domain, comparison, generation). |
| `npm run check` | Intermediate independent core: exit 0, TypeScript, 158 tests across 13 suites, production build. Later UI/integrity additions still require the final integrated repeat. |
| `npm test -- tests/resubmissions` | Later fixture/call-capture/archived-mapping run: exit 0, 35 tests across 4 suites. Subsequent retained-dependency/file-origin/mapping edits await the queued final checks. |
| Selected module example commands | Documents, extraction, AI and recommendations demos exited 0, local/synthetic modes only. The full test run included the selected module suites. |
| Locked `npm ci` after main b448 | Exit 0; 117 packages, audit 0. Updated AI SDK/React/Playwright/Vitest patch versions retained. |
| Filesystem `npm run check` after integration | Exit 0; TypeScript, 197 tests/20 suites and production build. |
| `npm run check` including portable fixes and copy regression | Exit 0; 217 tests/23 suites and production build. Final receipt/reviewer-label checks and focused subview build follow below. |
| `node --import tsx scripts/resubmissions-acceptance.ts` | Exit 0 against production port 3103, isolated `.test-data/resubmissions-05qucr`; actual restart, frozen downloads, preview/HTTP boundaries, 409 buffers, fresh UI capture/cycle/feedback/concern and desktop/mobile checks. |
| Latest focused repository/domain checks | Exit 0, 25 tests; includes corrupt receipt preservation and nonblank actor/reason boundaries. |

The comparison writer used isolated checkout `C:/Users/vzhu0/.codex/worktrees/task03-comparison/grantguide`, branch `feature/resubmission-comparison-03`, exclusive `comparison.ts` and `comparison.test.ts`. Commit `49d9d21e3947ff3f94d16099d30c621db23d46e1` integrated as `a0d098c`; its npm ci, typecheck, 11 tests and whitespace check exited 0. Read-only reviewer `/root/resubmission_integrity_review` supplied executable adversarial cases; the lead fixed coverage union mismatch, downgrade reasons, correction lineage, mixed provenance, retained call support, selected-history disclosure, archived revisions and token commit timing.

The UI writer `/root/resubmission_ui` used `C:/Users/vzhu0/.codex/worktrees/task03-ui/grantguide`, branch `feature/resubmission-ui-03`, exclusive new `components/resubmissions/**`. Commit `089b3d5e7e291a1631ff0fdf27187e78ecf90472` integrated as `625eeb6`; npm ci, final TypeScript and staged whitespace checks exited 0. Offline static React rendering verified the manual forms and labels. No browser/build claim follows from that render. Lead follow-ups added removal of superseded response citations and editable comparison mappings for renamed/archived target sections. Optional AI UI is deferred; bounded endpoints and manual editing remain the intended first release.

Additional files provide a synthetic all-14-section rehearsal workspace, isolated browser/process-restart acceptance, a non-overwriting private review seed and reserved-port dev smoke. The feature browser proof inspected `test-results/resubmissions/{result.json,resubmission-before-change.png,resubmission-desktop.png,resubmission-mobile.png}`. Mobile width was 390 pixels, with no horizontal overflow or uncaught page errors. Initial browser test failures were locator mistakes (a hidden existing dropdown option and a dirty-status header), corrected without changing application conflict behavior.

Verification is sequential with at most two Vitest workers. Windows sandbox hard-link denial produced 14 inherited vault failures; an isolated probe confirmed `EPERM`, matching Task 02. The filesystem-access rerun passed without weakening immutable storage. Peak runs were coordinated with the parent's main hotfix build and infrastructure review; no unrelated processes were stopped.

Independent reviewer proof: two supported rows and one unfinished experiment displayed `[Resolved, Resolved, In progress]`; editing the first linked evidence source displayed `[Needs review, Resolved, In progress]`. Its 27,089-byte packet and original snapshot remained identical through JSON restart/graph validation. This is domain proof, not yet browser/persistence integration evidence.

NSF official current-guide index and Chapter IV.E were rechecked October 25, 2026; source metadata is in `lib/resubmissions/nsf-profile.ts`. It records preparation guidance and required human decisions, not sponsor eligibility.

## Portable repairs assigned by the parent

The independent infrastructure review confirmed three issues in main b448. Each repair was committed separately with base-compatible tests and no Task 03 imports, so the parent could cherry-pick them before schema 4:

- `3a694870e2d8670d4e7a7c8ef5357a248696b37d`: current selected-only and quoted evidence now blocks readiness for missing/corrupt/replaced/excluded originals through unwaivable `vault-evidence-*` issues. Rules version 3.1; five focused tests passed. Legitimate manual sources and historical frozen packets remain valid.
- `f187da549d8516d4e73f4d7d895a77c653db2a74`: malformed UTF-8/JSON upload metadata returns METADATA 400 before storage; three tests passed.
- `5c5f1c952c8d9d14e2fed21006a41a8859dc3e68`: browser-safe structured/legacy API message decoding in full proposal generation/export paths; eleven tests passed.

Known backup limitation reported by infrastructure review: the existing `repository.backup()` copies workspace metadata and vault blobs/extractions, but omits proposal-export artifacts. For a complete restore, stop the app and copy the entire private data directory, including `proposal-exports`, with its matching metadata. A broad backup redesign was deferred; no claim that the narrower utility is a complete proposal-artifact backup is made.

## Pending final verification and handoff

Baseline/proposal and vault browser regression, dev smoke, final locked-main check/build and private review health/build identity verification remain pending. Reservations: review `PORT=3003`, `GRANTPATH_DATA_DIR=.local-data/task-03-review`; browser 3103; dev 3203. All tests use synthetic unique `.test-data` directories. No primary workspace/data or port 3000 server was read into fixtures or modified.

Task 02's vaultRuntimeState/excerpt hydration, serialized internal transaction API, integrity checks, immutable files, ethics and handoffs are preserved. Feature fingerprints also track vault original-file head/integrity/exclusion. Historical links remain readable after file replacement, archive or reclassification; current decisions need renewed review.

RM-01–08 code and feature acceptance are integrated. A01 migration/durable recovery and A18 receipts/conflicts have repository tests; A22 full regression is the remaining browser gate. Optional AI controls are deferred; the bounded endpoints and explicit acceptance workflow are tested while the complete manual workflow is available in the UI. No central API/status/roadmap document is authored by this task.

Live AI, sponsor submission, external delivery, deployment and human applicant evaluation are unrun. Ordinary tests are offline with mocked transports. Markdown/JSON are the only response packet formats; no sponsor DOCX/PDF release is claimed.
