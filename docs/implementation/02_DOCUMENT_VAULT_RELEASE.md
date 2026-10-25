# Task 02 — Document Vault release

Local feature branch: `feature/document-vault-02`. Base: `4b7d2059957d92d75f18984685a25bb2324a8b54`. Implementation date: October 25, 2026. Demo target: tomorrow October 26, approximately the next 24 hours; exact cutoff not supplied. Requesting user is product/scope owner; Task 02 lead is implementation steward. Parent retains central roadmap, task, ownership and API documentation.

## Researcher outcome and hackathon demonstration

The researcher problem is a missing attachment or the wrong version reaching a sponsor portal. The distinctive working mechanism connects a reviewed requirement to immutable original bytes, a review of that exact version against current instructions, and an immutable preparation handoff. Replacing a CV retains v1 and its saved selections, makes the review need visible, and requires an explicit decision to use v2 or retain v1. The judge can compare SHA-256 values before and after restart, rather than relying on a file-manager screenshot. Impact and novelty remain evaluation goals; no measured applicant time saving or market uniqueness is claimed.

Focused path: Project & evidence → Documents → upload synthetic CV; Application plan → confirm file-upload delivery/phase/format → choose version → review original; replace CV → observe pinned old version and review issue; save/download handoff → verify original hash and unchanged snapshot. Future-phase ethics records remain visible without blocking the application phase. Copyable answers use each explicitly mapped portal requirement's label and confirmed limit. Internal notes remain separate from sponsor attachments.

Reused kit capabilities: `modules/documents` normalization/PDF.js/Mammoth ingestion, existing evidence/citation contracts, local runtime request/error helpers and existing proposal generation/rendering. Original integration: immutable vault storage/admission, parse orchestration, version-bound reviews and origins, phase-aware requirement/ethics checks, recovery/migration, frozen handoff and connected UI.

## Implemented scope

- Workspace schema **3**, additive collections `documents`, `documentVersions`, `parseAttempts`, `attachmentSelections`, `ethicsRecords`, `ethicsTasks`, `handoffs`, `operationReceipts`. Optional `Requirement.vault` and source-version `fileOrigin` preserve historical packet payloads and all 14 proposal sections.
- Explicit schema 1/2 validation and exclusive byte-identical pre-migration backup, atomic metadata replacement, idempotent subsequent reads. Missing metadata beside vault/backups fails closed; invalid metadata never initializes replacement demo data.
- Raw bounded binary upload, metadata at most 4,096 encoded bytes, 15-second body deadline and cancellation, exact declared-length comparison. Filename/UTF-8/PDF/DOCX/MIME checks precede parsing. DOCX rejects malformed ZIPs, macro/embedded payloads, external relationships, CRC/size/header inconsistencies and expansion abuse.
- Immutable originals in private `vault/blobs/<version-id>.bin`; staged file sync and exclusive same-volume hard-link publication prevent overwrite on Windows. Metadata commit follows publication; a failure leaves a recoverable unreferenced blob. IDs generate server paths; symlinks/arbitrary paths fail. All reads verify length and SHA-256.
- One disposable parsing worker, four waiting slots, 20-second hard termination, **384 MB old-generation + 32 MB young-generation heap bounds**. No OCR or document-triggered external access. Original retained for no-text, partial, failed and over-limit extraction; retries append immutable attempts. Worker diagnostics are drained without logging passages or filenames.
- Reviewed exact excerpts, full-artifact SHA-256 and UTF-16 offsets bridge into existing citation hashes. File replacement independently stales evidence, even with unchanged text. Re-review creates a new source version; manual edits retain origin history with a manual label. Ethics content is excluded at promotion and generation, including category/support changes after promotion. Ten-source and 50,000-character prompt limits remain.
- Explicit file-version selection/review, metadata search/archive/history, required MIME/size/page checks, manual format review, phase and date distinctions. Runtime byte checks gate readiness/reviews/handoffs/downloads; vault integrity issues cannot be waived. No upload, parse, copy or download auto-marks Ready or Submitted.
- Append-only manual ethics revisions, scope/phase/status/basis/support confirmation, unknown/no-expiry/date distinctions, inclusive expiry dates in America/New_York, deduplicated active agenda tasks with retained history and ICS. Relevant edits invalidate confirmation; linked requirement timing must agree. Finite before-research validity uses the known project start when no separate required date was recorded.
- Immutable per-application handoffs freeze requirement/review summaries, versions/hashes, mapped answers and evidence, warnings and later-phase records. Original downloads, internal JSON/Markdown manifests and copyable answers are separate. Current changes mark a handoff older without rewriting it.
- Same local request boundary for metadata/text/bytes; cross-site Fetch Metadata rejected on reads and writes; same-origin mutations, no CORS, no-store and nosniff attachment downloads. Demo reset cannot orphan retained researcher data. Repository `backup()` copies metadata plus verified blobs/artifacts under the same serialized lock; restoration is tested.

## Limits and configuration

`GRANTPATH_DATA_DIR` chooses the entire workspace. Review uses `.local-data/task-02-review`, port 3002; acceptance uses unique `.test-data` directories on port 3102, helper/dev smoke uses 3202. Normal primary workspace/data/port 3000 were not modified.

Limits: 10,000,000 input bytes; 250,000,000 physical blob/staging bytes; 50,000,000 extraction-artifact bytes; 100 documents/project; 20 versions/document; 100 PDF pages; 200,000 UTF-16 units/artifact; 2,000 DOCX entries and 50,000,000 declared/actual expanded bytes. Receipts are retained seven days. Orphan cleanup has a one-hour grace and never deletes referenced originals/artifacts. Archive is not deletion; originals remain until the local workspace is explicitly removed.

This local release requires the source tree and a full `npm ci` installation (the worker loads the imported TypeScript ingestion adapter using `tsx`). A worker thread is a resource bound, not an OS security sandbox. The app is for one trusted local OS user/process. Hosted membership/object authorization, private hosted storage, malware policy, stronger parser isolation, encryption/key handling and retention/deletion controls remain prerequisites for hosted use. No hosted protection, institutional approval, malware certification, scientific validation, sponsor submission or deployment is claimed.

## Verification record

Commands and final browser/health results are completed below before handoff. Earlier failed attempts are retained here for honesty: sandbox `npm ci` failed with npm exit-handler error; isolated-cache elevated `npm ci --cache .local-tools/npm-cache --no-audit --no-fund` passed (117 locked packages). Sandbox hard-link publication was denied; elevated filesystem tests passed without weakening storage. Initial production build exposed Next-generated route parameter type errors; declarations were fixed. Missing-metadata regression cleanup was corrected after its expected fail-closed state also stopped the test teardown.

- `npm run check`: latest final offline suite **152/152**; TypeScript, all 152 tests across 14 suites, and the production build passed, exit 0. Final `npm run build` also passed after the dev-script compatibility fix; application source is unchanged. Test runner bounds file concurrency to two workers without skipping cases or changing test deadlines. A redundant run overlapped build tracing under low free RAM and timed out; final checks are sequential.
- `npm test -- tests/vault`: **19/19** before the added missing-metadata regression; covered persisted PDF CV slice, byte/hash restart, v1 pinning, concurrency/receipts, immutable handoff, Unicode/file origin/manual history, phase-aware ethics, reset and graph protection.
- `npm test -- tests/documents`: **12/12** (two route-boundary cases plus ten imported ingestion tests).
- `node node_modules/vitest/vitest.mjs run modules/documents/tests`: **10/10**, exit 0.
- `node --import tsx modules/documents/examples/demo.ts`: exit 0, synthetic local normalization output.
- Isolated storage subagent tests: **22/22** vault/ingestion; final focused storage/admission 8/8 and parser 4/4. Timeout/queue termination, CRC/ZIP controls, atomic failure injection, quotas, tampering and orphan retention covered.
- Synthetic near-limit measurements in the isolated storage checkout: TXT 200,000 UTF-16 units, 655 ms, sampled worker heap 17,779,224 B; DOCX 195,100 units, 737 ms, heap 24,561,696 B; 100-page PDF, 2,469 ms, heap 138,349,744 B. An earlier cold PDF import sampled about 237 MB, motivating the 384 MB bound. These are observed local measurements, not throughput or peak RSS guarantees.
- Baseline/proposal browser regression previously passed with zero page errors, actual process restart, keyboard, 390px viewport, citations, preserved editor conflicts, fixture/live recovery and DOCX-preserving missing-renderer behavior. It is repeated on the final build below. Vault browser, dev smoke and final review health follow.

Acceptance evidence is synthetic and isolated. Injected storage failure/quota tests substitute for deliberately filling the operator's disk. A real sudden OS/power failure, native OCR, hostile-file OS containment, live AI, external calendar import, real sponsor rules/portal rendering and applicant usability evaluation were not performed. Manual drafting and external original inspection remain available after extraction failure. Optional ZIP, OCR, cloud sync, external reminders and sponsor portal automation are deferred.

## Parallel work and central-document handoff

Read-only `/root/vault_review` reviewed migration/reset/origin/readiness/handoff risks. Isolated writers `/root/vault_storage` (`codex/vault-storage`) and `/root/vault_ui` (`codex/vault-ui`) had exclusive new file sets; scoped commits were cherry-picked into this lead branch before integration. All subagents received the standing hackathon priorities. Global layout/styles, lockfile, modules/packages, `.github/**`, AGENTS and parent-owned central docs were not edited. The existing dev script needed one explicit `--webpack` flag to match its already-configured engine; no dependency changed.

Parent updates to apply from this release: API workspace version 3 and vault routes/commands; roadmap item 02 implemented/checked only after final evidence below; source revision/cherry-pick list; Task 03 begins schema 4 on this complete revision; retain all collections and optional historical fields; shared lease release only at final checked handoff. No merge/automerge/deployment authorization is inferred.

## Final verification supplement

The upload-refresh screenshot review found that a saved replacement could leave the prior file version displayed because refresh captured an older dirty flag. `app/page.tsx` now reads a synchronously updated editor registry ref and clears consumed comparison state only when no other editor is dirty. Read-only review confirmed other unsaved buffers remain protected. The vault browser journey now asserts v2 becomes visible without reload and no stale-state banner remains. This is part of the core judge-visible replacement/re-review mechanism.

The parent reviewed operation receipt and ethics task graph references independently. Final validation rejects missing task parents/revisions, duplicate active task kinds, duplicate receipt keys and unresolved kind-specific receipt resources. The corruption regression verifies failed writes preserve saved metadata and corrupt existing metadata is retained with a storage error.

New repeatable acceptance commands for parent CI wiring: `GRANTPATH_TEST_PORT=3102 node scripts/vault-browser.mjs`, `node scripts/vault-dev-smoke.mjs`. Existing `npm run test:browser` remains the complete baseline/proposal regression. All source/API code changes are scoped to the feature and shared lease; no workflow file was edited and no CI run/PR/merge is claimed from local checks.

Application test revision: `7c0558a` (152 tests and complete build). Final checked code revision: `6a8360cccefe792197323ed1f2fe6aa34f3d70af` (adds only the verified dev command flag). Final production build ID: `gSTs2gM9dcPGB89b5e6T4`.

## Changed files

- `app/api/applications/[id]/handoffs/[snapshotId]/[versionId]/download/route.ts`
- `app/api/applications/[id]/handoffs/[snapshotId]/route.ts`
- `app/api/applications/[id]/handoffs/route.ts`
- `app/api/documents/[id]/versions/[versionId]/download/route.ts`
- `app/api/documents/[id]/versions/[versionId]/parse/route.ts`
- `app/api/documents/[id]/versions/[versionId]/route.ts`
- `app/api/documents/[id]/versions/[versionId]/text/route.ts`
- `app/api/documents/route.ts`
- `app/api/generate/route.ts`
- `app/api/workspace/route.ts`
- `app/page.tsx`
- `components/checklist.tsx`
- `components/common.tsx`
- `components/documents/attachment-picker.tsx`
- `components/documents/vault-panel.tsx`
- `components/ethics/ethics-panel.tsx`
- `components/handoffs/handoff-panel.tsx`
- `components/project-panel.tsx`
- `lib/evidence.ts`
- `lib/exports.ts`
- `lib/fixtures.ts`
- `lib/generation.ts`
- `lib/http.ts`
- `lib/proposals/migration.ts`
- `lib/proposals/workflow.ts`
- `lib/readiness.ts`
- `lib/repository.ts`
- `lib/schema.ts`
- `lib/vault/admission.ts`
- `lib/vault/domain.ts`
- `lib/vault/migration.ts`
- `lib/vault/parse-worker.mjs`
- `lib/vault/parser.ts`
- `lib/vault/schema.ts`
- `lib/vault/service.ts`
- `lib/vault/storage.ts`
- `package.json`
- `scripts/e2e.mjs`
- `scripts/test.mjs`
- `scripts/vault-browser.mjs`
- `scripts/vault-dev-smoke.mjs`
- `tests/documents/routes.test.ts`
- `tests/domain.test.ts`
- `tests/proposals/workflow.test.ts`
- `tests/vault/parser.test.ts`
- `tests/vault/storage.test.ts`
- `tests/vault/workflow.test.ts`
- `docs/implementation/02_DOCUMENT_VAULT_RELEASE.md`

Final browser checks (exit 0): `GRANTPATH_TEST_PORT=3102 node scripts/vault-browser.mjs` and `GRANTPATH_TEST_PORT=3102 GRANTPATH_REVIEW_TEST_PORT=3202 npm run test:browser`. Both use new isolated data, launch production Chromium journeys, and perform real process restart. Zero page errors; 390px viewport has no horizontal overflow. The vault journey includes visible latest-v2 refresh without reload, exact excerpt promotion/draft reference, two explicit attachment reviews, later-phase ethics, frozen answers/files/warnings, v1 pinning and original SHA-256 downloads before/after restart. Artifacts: `test-results/vault-browser-result.json`, `vault-desktop.png`, `vault-mobile.png`, baseline `browser-result.json`, `proposal-browser-result.json` and screenshots.

Dev smoke (exit 0): `node scripts/vault-dev-smoke.mjs`, internally `npm run dev -- --port 3202`, private `.test-data/vault-dev-*`, verified `/api/health` and schema-3 workspace. Initial dev attempt correctly exposed Next 16 Turbopack rejecting the existing webpack config. `package.json` now explicitly selects webpack; the retry passed. The smoke helper stopped its own process tree, and generated `next-env.d.ts` dev references were restored to their original production form. `package-lock.json` and dependencies remain unchanged.

Live application parse probe: synthetic 100-page PDF parsed in 3808.0 ms; sampled worker heap 248,815,840 bytes. `/api/health` returned 200 in 6.7 ms while the parse was active (`parsingAtProbe=True`). This is one local observation, not a general latency guarantee. The performance fixture is archived in the private review seed.

## Final review and ownership release

`PORT=3002 GRANTPATH_DATA_DIR=.local-data/task-02-review APP_REVISION=6a8360cccefe792197323ed1f2fe6aa34f3d70af npm run review` passed, exit 0. Persistent URL: http://127.0.0.1:3002 . Select **Vault acceptance synthetic researcher** for the prepared demo. The review workspace was copied only from the completed synthetic `.test-data/vault-browser-*` journey after its server stopped; existing primary data was not used or overwritten.

An independent explicit fetch verified `/api/health` HTTP 200, service `grantpath`, build `gSTs2gM9dcPGB89b5e6T4`, code revision `6a8360cccefe792197323ed1f2fe6aa34f3d70af`; `/api/ready` HTTP 200; schema 3; three documents (one archived performance fixture); one immutable handoff; both saved sponsor file downloads matched their manifest SHA-256 values. A cross-site read returned 403. Evidence: `test-results/vault-review-health.json`. The local URL is running; this is not a hosted deployment or sponsor submission.

No known release-blocking defects remain. Hosted/multi-process security, OCR, live AI, applicant impact evaluation, external calendar import and real sponsor portal validation remain unverified/deferred as stated above. Actual LibreOffice/font integration commands from roadmap 01 were not repeated because no renderer implementation changed; baseline acceptance deliberately verifies the configured-renderer-unavailable path and preserves DOCX plus source snapshots. GitHub CI, PR publication and main integration belong to the parent; none is claimed from this local release.

**Shared-file lease released after these final checks.** Task 02 will not edit shared application/library/scripts/manifests/contracts files after handoff without re-coordination. Task 03 may integrate the exact final branch/commit supplied to the parent and advance schema 3 to 4 while retaining every vault collection, original, origin, review and handoff. Task 02 feature ownership is available for parent integration; the persistent review server remains reserved on port 3002.
