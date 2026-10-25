# Task 05 — isolated implementation checkpoint

Status: **independent feature code checked; shared application integration pending**. This is not a completed application release, migration, browser acceptance, or healthy review-server claim.

Lead checkout: `C:/Users/vzhu0/.codex/worktrees/2123/grantguide`; branch `feature/05-awards-progress`; starting revision `4b7d2059957d92d75f18984685a25bb2324a8b54`. Commands explicitly use this checkout. The copied implementation specification has SHA-256 `A9B9D79613EAD6A70EF408629AD85C7209CAAD443A16989082883F5B6C7C3EF1`, matching the supplied research handoff. Its historical research-only authorization/deadline text is superseded by the implementation assignment and approximate October 26 demo context.

Initial local feature checkpoint: `1bc24c496a4e30a6ca95b8a9bf52440ecb8acae4`. A subsequent independent-review fix preserves unchanged replacement period/goal predecessor lineage across a third terms version while rejecting changed lineage under reused IDs. Finance contract schema SHA-256: `98989CA42E78E651BE816AF52ECBEE07335EBFF3679089F0553D61AD1CCE1830`.

## Researcher benefit and implemented mechanism

The feature separates the proposal request from the award's confirmed facts, then connects approved goals to dated actual updates and an editable annual narrative worksheet. It preserves negative/inconclusive results, delays and missing work. A reviewed snapshot closes its terms, change interpretations, item predecessors, progress revisions and exact quoted source versions; later current-input changes cannot rewrite that export.

Implemented only in assigned NEW paths:

- `lib/awards/**`: independent composable schemas; exported `AwardFinanceContextV1`, exact/unknown USD facts and formatting; source ownership/span checks; frozen originating proposal capture; source-backed full terms/carry-forward rules; amendment identity/base/head validation; item/progress history and agenda projection; deterministic annual preview; immutable aggregate/section reviews; closed report snapshots; canonical SHA-256 and UTF-8 byte bounds; allowlisted Markdown/internal JSON exports; graph/reset validation; serialized repository adapter seam.
- `components/awards/**`: application-scoped notice/amendment, item, progress and worksheet panels using the existing fields, citation/source/deadline views and dirty-editor registry. Source selection is pinned in intake; confirmation is explicit. Lost-response retries deliver recovered IDs back to the initiating editor. Archived report downloads remain available.
- `app/api/awards/**`: local-only template, pinned finance-context and immutable snapshot-export read routes. Persistence-dependent routes explicitly fail with 503 until the shared namespace is integrated; they do not use side storage or fabricate data.
- `tests/awards/**`: synthetic contract/amendment/progress/report/agenda/limits/reference-closure cases. No external service calls.

The actual finance contract is exported from `lib/awards/schema.ts`; `awardFinanceContext(awards, awardId)` in `lib/awards/terms.ts` derives one cloned DTO from the pinned confirmed terms ID/digest. The DTO is source-implemented and checked, but the required downstream 06 persistence/migration/restart handoff is **not yet satisfied**.

## Independent review

Read-only agent `/root/award_contract_review` audited the specification and then actual implementation. It ran no installs, tests, browser or build and edited no files. Its useful findings led to fixes for allocated-period narrative leakage, future/out-of-period delays, incomplete supersession/snapshot closure, lost-response editor IDs, prior action money reused with a fresh ID, item cycles/agenda supersession and archived downloads.

The final source pass confirmed those fixes and found the three-version period/goal carry-forward defect above. The lead corrected it and added a regression; the reviewer then confirmed that the source fix addresses its concrete blocker. This is source-level review, not browser or integrated application acceptance.

The lead is the only writer. Requested GPT-6.1 Sol / Extra High and Standard / Fast off were relayed to the reviewer; no tier/UI configuration change was attempted. Parent resource and shared-file gates remained authoritative.

## Actual lightweight verification

Final independent checkpoint checks on October 25, 2026:

- Scoped TypeScript: exit **0**, covering new award libraries/components/routes/tests and their imported dependencies. Used existing primary checkout dependencies through an ignored temporary paths configuration; this is **not** the full application `npm run typecheck`.
- Focused Vitest: exit **0**, **18 tests / 5 files**, `maxWorkers: 1`, `fileParallelism: false`. Used existing primary dependencies through an ignored resolver configuration. One worker at a time; no install, full check, build or browser run.
- Evidence retained only in ignored `test-results/awards-checkpoint/typecheck.txt` and `tests.txt`. Temporary configuration is in ignored `tmp/awards-check/`; isolated runner temp files are in `.test-data/award-temp`.

Exact final commands:

```powershell
node --max-old-space-size=512 C:/Users/vzhu0/PycharmProjects/grantguide/node_modules/typescript/bin/tsc --project tmp/awards-check/tsconfig.json --pretty false
$env:TEMP = (Resolve-Path .test-data/award-temp).Path
$env:TMP = $env:TEMP
node --max-old-space-size=512 C:/Users/vzhu0/PycharmProjects/grantguide/node_modules/vitest/vitest.mjs run --config tmp/awards-check/vitest.config.mjs
```

Checked cases include duplicate/lost-response receipts after a later mutation; altered retry payload; requested USD 300,000 versus approved USD 240,000; exact 0.10/negative-action/unknown/overflow validation; foreign/forged/normalized Unicode evidence; future initial/change effective dates; two candidates on the same base with refreshed-head rejection; no carry of old action money; reused period-ID rejection; replacement period/goal lineage carried through three versions; completed inconclusive, delayed and missing work; future/undated/out-of-period/boundary-allocation gating; six exact section reviews; old export identity after a progress correction and JSON serialization; recomputed-digest invalid support rejection; superseded-item snapshot closure; stable agenda identity and cycle rejection; reset dependency refusal; snapshot UTF-8 byte bounds and export format allowlisting.

## Required shared seams — do not integrate before lease

No pre-existing app/component/lib/script/test/module/package file, root schema/config/manifest/lockfile, migration, or parent-owned central document was edited. No workspace schema number was allocated.

After the parent transfers the explicit shared-file lease and exact checked predecessor SHA (02 → 03 → 04 → 05):

1. Stack that exact predecessor and inspect actual schemas, source retention, receipts, submitted packet/attempts and canonical helpers. Reconcile the existing `captureOrigin` adapter with actual Task 03 submission/cycle IDs; a local packet is not external-submission evidence. Reuse compatible predecessor receipt/digest primitives instead of introducing competing global stores.
2. Compose `AwardsStateSchema` into the actual workspace schema and seed only empty collections. Allocate the next monotonic migration then. Validate old state first, preserve a byte-identical exclusive backup, validate the complete reference graph and atomically replace. Preserve all 14 proposal sections, vault selections/history, resubmission history, review snapshots and existing exports. Refuse newer/corrupt schemas without reset.
3. Add `AwardCommandSchema`/operation ID to the actual bounded workspace mutation envelope. In the serialized transaction dispatch awards **before** the general expected-revision rejection so a saved operation receipt can recover after unrelated writes. `applyAwardWorkspaceMutation` supplies the integration seam: non-replay increments workspace revision once; replay returns original result IDs and current state without another mutation. Commit namespace, receipt and workspace revision together; surface `AwardError.status` through the local error boundary.
4. Call `validateAwardsIntegrity` on load and every write, including writes outside awards. Extend the integrated reset-retention graph with `assertAwardResetSafe`; refuse a reset rather than deleting referenced application/evidence. Test write/rename failure, crash/restart and backup integrity using the real integrated repository.
5. Mount `AwardPanel` inside the selected application, keyed by application ID and participating in existing dirty navigation. Bridge `mutateAward` to the bounded same-origin workspace route and return `operationResult.resultIds`. Refresh saved data without overwriting dirty award forms. Connect `awardAgenda` to the existing agenda/ICS with Award/internal labels and **Preparation target passed** wording; retain date-only unknown cutoff semantics.
6. Complete new finance/export route acceptance against the real namespace; no arbitrary paths, URLs or filesystem inputs. Review all browser transitions, source corrections and 409 reconciliation, including exact-retry completion callbacks. Any concrete integration differences must be fixed under the lease, then rechecked.

## Gates still pending

Parent has not supplied Task 04's final checked predecessor SHA or transferred the shared integration/heavy verification slot. The feature cannot be truthfully called integrated, migrated or running until that happens. This checkpoint does not release Task 06 code integration.

Still required after transfer: `npm ci`; applicable documents/extraction README checks; final focused suites and `npm run check` production build; isolated predecessor migration/full regression, write/rename/crash/restart cases; desktop/narrow/keyboard/409 browser acceptance; dev smoke; final same-revision `npm run review`; explicit `GET /api/health` with build/revision/instance comparison; actual working local URL. No screenshot, on-disk restart proof, full-app check, health response or healthy URL exists for this checkpoint.

Reserved settings: review `PORT=3005`, `GRANTPATH_DATA_DIR=.local-data/task-05-review` **inside this lead checkout**; browser `GRANTPATH_TEST_PORT=3105`; dev `3205`. Primary `.local-data`, primary port 3000 and unrelated processes remain untouched. Heavy installs/full checks/builds/browser/renderer work wait for the parent's slot.

No live AI, paid usage, credentials, public deployment, sponsor login/submission/certification, email/push sends, Git push, PR or merge was performed. GC-1 body/downloadable portal fidelity remains unverified. This is a manual annual narrative preparation worksheet, not final/POR, financial accounting, a sponsor-ready exact form or automatic reporting. Optional file adapters, live prose polishing and broader sponsor/report support remain deferred.

Shared-file lease: **never acquired in this checkpoint; no shared-file release claimed**. Next required action is the parent's exact predecessor/lease/resource transfer, followed by integration and the remaining acceptance gates.
