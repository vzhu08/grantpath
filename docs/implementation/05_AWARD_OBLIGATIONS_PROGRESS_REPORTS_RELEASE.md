# Task 05 — award obligations and annual worksheet release

Status: **implemented, integrated and locally verified** on October 25, 2026. Source-backed award terms, explicit amendments, honest actual progress, reviewed drafts with gaps and immutable Markdown/JSON exports work locally. No sponsor submission or certification is recorded.

## Checked revision and working review

- Checkout: `C:/Users/vzhu0/.codex/worktrees/2123/grantguide`; branch `feature/05-awards-progress`.
- Final application: **`6c7ad9118130bb7d2388a1b9d30c35b7442e64cb`**. A final release-note-only commit records this evidence; application code is frozen at that revision.
- Final production build: **`nGNJFMjUnaTg-QjKGO56i`**. Final types/build and all production browser checks used that application code. The complete test suite on that exact application revision passed **253 tests / 30 suites**.
- Working local URL: **http://127.0.0.1:3005**. Select **Draft & readiness → Award & progress** in the saved synthetic application.
- Private data: `.local-data/task-05-review` inside this checkout, seeded with exclusive creation and no overwrite. It contains one synthetic award and reviewed worksheet snapshot. Primary data and port 3000 were untouched.
- Explicit health GET: service `grantpath`, revision `6c7ad9118130bb7d2388a1b9d30c35b7442e64cb`, build `nGNJFMjUnaTg-QjKGO56i`, instance `ca5b0e15-3a6d-4cef-9700-63c16015e20b`. Build/revision/instance matched `.next/BUILD_ID` and the owned server record. `/api/ready` returned `ready`; workspace schema is **5**.
- Actual 3005 UI was inspected read-only. No POST occurred; private workspace bytes were unchanged. A metadata-only restart of the verified owned server also preserved those bytes.

Exact checked Task 03 main **`2da6a3104663d602424256217b19f2eba58c6996`** is an ancestor. The lead first stacked frozen Task 03 `506ce80619cbdfa6613b075c66cfc5e487cf23b0`, then merged checked main as `dcfeaf4`. The sole add/add conflict, parent-owned `scripts/resubmissions-acceptance.ts`, was taken exactly from checked main. No Task 04 runtime/domain/API input was required for the manual worksheet.

The supplied specification remains unchanged: SHA-256 **`A9B9D79613EAD6A70EF408629AD85C7209CAAD443A16989082883F5B6C7C3EF1`**. Its historical research-only authorization/deadline text is superseded by implementation dispatch and the approximate October 26 demo context.

## Researcher value and visible proof

The researcher can distinguish the proposed request, confirmed award facts, actual period activity and missing work. Exact normalized quotations connect immutable full terms/amendment lineage to dated progress revisions and the evidence frozen with a reviewed annual worksheet.

Synthetic proof keeps requested **USD 300,000** separate from approved cumulative **USD 240,000**, preserving proposal/profile context. It records completed work with an inconclusive finding, a delayed experiment and a third goal with no update. A documented extension changes time without copying an old action amount or inventing money. A competing interpretation based on an old head fails 409 even with a refreshed expected head. Amendments/source/progress corrections expose current review needs while old Markdown/JSON remain identical through actual process restart.

The UI exposes source/candidate inspection, full proposed terms and period comparison, current/historical terms, obligations/internal milestones, progress corrections, six sections with typed support, exact saved-section review, explicit absence decisions and historical downloads. It pins editor terms/source versions, preserves dirty buffers, and returns recovered IDs to the initiating editor after a lost response. Archived records retain report downloads. Agenda items use stable IDs/ICS UIDs, unknown cutoff semantics and **Preparation target passed** wording.

## Actual upstream contract for Task 06

`lib/awards/schema.ts` exports `AwardFinanceContextV1`, `MoneyFactV1`, `BudgetPeriodRef`, `SourceVersionRef`, `FrozenOriginRef` and `AwardsStateSchema`. Schema-file SHA-256: **`64110246B1AED659164F6A8A01CBC83E23763DF13A332738A2195ECA97BC673F`**.

`awardFinanceContext(awards, awardId)` derives a cloned DTO from one pinned confirmed terms ID/digest. `GET /api/awards/{awardId}/finance-context` uses one repository read; optional `expectedHead` returns 409 on change. Unknown amounts/currencies/bases remain explicit. Known USD uses canonical integer minor-unit strings; only current action permits negatives. No balance, sum, category budget, spend permission or performance is inferred.

Origin preserves actual application cycle/origin-attempt metadata. An attempt's snapshot identifies the **preceding submission**, never proof its target was submitted. Only an explicitly selected same-project attested snapshot whose original application equals the awarded application is copied, including coverage, attestation, sections, evidence and its own predecessor digest. Local proposal packets, attested submitted snapshots and response packets remain distinct. A local packet alone does not prove external submission.

Actual persisted schema/receipt/amendment/reference/restart evidence is now supplied for the parent to release Task 06 integration. No Task 06 ledger or Task 08 report logic is implemented here.

## Persistence and boundaries

- Migration **4 → 5** preserves `V4StateSchema`; old 1/2/3 paths chain into it. Only empty award collections are added. All 14 proposal sections, vault selections/history, submission/response histories and frozen payload digests remain intact. Original raw bytes receive an exclusive byte-identical backup before atomic replacement. Unknown/corrupt schemas fail without reset.
- Existing strict transport stays `{expectedRevision, command}`. Award command transport is `{type: awardMutation, operationId, action: AwardCommand}`. Server canonical command receipts are checked **before** stale workspace/record/head rejection. Replay returns original IDs/current state without another write or revision increment. Namespace, receipt and revision commit together.
- Award/predecessor graphs are validated on load, every durable write, internal transactions and ordinary dispatch. Same-project scope, exact UTF-16/hash/quote spans, periods, action/interpretation lineage, support types and canonical digests fail closed. Reset refuses retained dependencies. No side store or silent pruning; the existing 25 MiB whole-store write cap remains.
- Full terms carry supported fields explicitly. Replaced goal/period predecessor lineage carries through later versions without requiring removed predecessors in the immediate active inventory. Reused IDs cannot change lineage. Current-action facts cannot carry between actions, even under fresh fact IDs.
- Actual claims require selected dated progress/evidence with reporting-period/evidence-through/server-as-of gating. Allocations use their reviewed period-specific narrative. Delay dates obey the gate; recovery plans remain future work. Proposal text or a quote alone cannot satisfy actual performance.
- Immutable aggregates pin all six section IDs, policy metadata, period, terms and update/source versions. Reviews pin fingerprints; snapshots close terms/base/candidate/item-supersession dependencies with sufficient source copies. Snapshot size uses UTF-8 bytes and a 2 MB cap. Markdown reuses inert predecessor escaping; JSON is a separate evidence appendix. IDs/formats/filenames are allowlisted with loopback/no-store/nosniff boundaries.

## Real checks and artifacts

Ordinary checks used synthetic fixtures/mocks and no provider APIs. Heavy jobs were sequential; Vitest used at most two workers. Acceptance used unique `.test-data` directories. No unrelated process was terminated.

| Command/check | Actual result |
| --- | --- |
| `npm ci` | Initial sandbox EPERM; normal-filesystem retry exit 0, 117 packages, audit 0 vulnerabilities. |
| `npm run typecheck`; focused award suites during integration | Passed, including nine actual repository/migration/fault/restart cases. One storage case needed a bounded 30-second allowance rather than the default five seconds on this host; assertions were retained. |
| `npm run check` at `2967b974001ff36d864fad4c0ae55be1cb04fa28` | Exit 0: types, **253 tests / 30 suites**, production build. |
| `npm run build` at final application `6c7ad9118130bb7d2388a1b9d30c35b7442e64cb` | Exit 0, including types; build `nGNJFMjUnaTg-QjKGO56i`. Final delta exposes read-only saved-candidate inspection and corrects harness/dev invocation. |
| `npm test` at exact final application | Exit 0: **253 tests / 30 suites**. |
| Documents and extraction README example commands | Both `node --import tsx modules/{documents,extraction}/examples/demo.ts` exited 0; module test suites are included in the full run. |
| `GRANTPATH_TEST_PORT=3105 node --import tsx scripts/awards-acceptance.ts` | Exit 0 against final build: HTTP/UI/restart, six UI reviews/freeze/download, raw Host/origin/body limits, stale-base 409, dirty-buffer/lost-response recovery, keyboard citation/candidate inspection, desktop/390px and zero page/console errors. |
| `GRANTPATH_TEST_PORT=3105 GRANTPATH_REVIEW_TEST_PORT=3205 npm run test:browser` | Exit 0: baseline/proposal journey, exports, dirty editors, process restart and owned review-helper reuse. |
| `GRANTPATH_TEST_PORT=3105 node scripts/vault-browser.mjs` | Exit 0: immutable upload/version/parser/handoff regression. |
| `GRANTPATH_TEST_PORT=3103 node --import tsx scripts/resubmissions-acceptance.ts` | Exit 0; unchanged checked-main harness, verified-free required predecessor test port, fresh isolated data. Normal 3003 server untouched. |
| Same predecessor command with `GRANTPATH_PACKET_ONLY=true` | Exit 0: ordered frozen Markdown/JSON through actual restart. |
| `node scripts/awards-dev-smoke.mjs` | Exit 0 through actual `npm run dev -- --port 3205`: isolated schema 5, page, health and annual-template route. |
| Private non-overwriting seed; `PORT=3005 GRANTPATH_DATA_DIR=.local-data/task-05-review APP_REVISION=<final application SHA> npm run review` | Exit 0. Explicit health/readiness/build/revision/instance verification and actual read-only review UI passed. |

Meaningful browser fixes: stale feedback during a new save; reviewed historical evidence incorrectly disabling review; original-editor ID recovery after lost responses; date-only intake identity/end-date support. The Host probe now uses raw HTTP, and loss injection waits for the completed abort. The dev harness invokes the already-correct package command. An empty deployment-revision environment variable was removed before restarting only the verified owned review server; final identity matches and data bytes stayed unchanged.

Ignored `test-results/awards/` evidence includes final check/test/build logs; `acceptance.log`, `result.json`, `immutability-evidence.json`; desktop/worksheet/mobile PNGs and `ui-narrative.md`; baseline/vault/resubmission/ordered-restart logs; `dev-smoke.json`; `review-health.json`, `review-ui.json`, `review-3005.png`. Desktop/narrow images were visually inspected; no horizontal overflow. Predecessor artifacts retain existing `test-results/` paths.

Final isolated award case: `.test-data/awards-rL15iJ`. First frozen snapshot: `award-report-snapshot-d3f6379a-0844-4d4c-bbf2-e95b371135ec`; canonical digest `7ad35b851608c97390842bf3668bc6a064892e256a3c140b48242c3fa2446358`. Retained post-restart Markdown SHA-256: `cf7577e6717a5720e649a4a0426f2340ea40e4d24c82d2f0bfdcc259e611c0b7`; JSON SHA-256: `c3a8ea9495e4d36b3d7885c43737ecb6ccc070deef1ec275f56e917c86167d39`. Acceptance compared original bytes before amendment/correction and after actual restart. The evidence file records all three snapshot digests/export hashes.

## Independent review, scope and lease release

Read-only `/root/award_contract_review` audited specification, core, actual Task 03 seams and integrated migration/repository/origin/UI. It wrote no files and ran no heavy checks. Findings fixed: allocation leakage, delay dates, incomplete snapshot closure, retry IDs, action-money reuse, cycles/agenda supersession, archive downloads and three-version lineage carry. It confirmed no new source-level blocker in integrated seams. Parent independently reviewed exact `14c80c9` for migration/backup, atomic receipts, graph/reset retention and finance identity/source closure, reporting no new P0/P1. Real checks above supply runtime evidence beyond these static reviews.

Lead was sole writer. Requested model/effort and Standard/Fast off were relayed; no tier/UI workaround. Initial checkpoints: `1bc24c4`, `9524c97`, `769c75b`, `5c334f5`; integration `14c80c9`; correctness `8cae4a7`, `2967b97`; final app `6c7ad91`. No push, PR or main merge was performed by this task.

Relative to checked main, new award libraries/components/routes/tests/scripts and this release note are added. Shared integration changes: `lib/{schema,repository,fixtures}.ts`, `lib/resubmissions/migration.ts`, `app/page.tsx`, `components/checklist.tsx`, four existing schema-version regression files and two predecessor dev-smoke schema expectations. No Task 05-authored delta to manifests/lockfile, layout/global styles, parent central docs/CI/AGENTS/kit metadata, or the parent's resubmission acceptance harness. The copied spec matches collected main.

**Task 05 releases shared source and heavy-verification leases to the parent at this final handoff.** No shared code edit or heavy check remains. Healthy owned 3005 review stays available. Parent can transfer next lease to 06 after final-delta/CI review; no 04 dependency is imposed.

## Limits and later inputs

This is a standard NSF research-award **annual narrative preparation worksheet**, not final/POR, financial accounting, an exact portal form, institutional certification, automatic reporting or live AI polishing. GC-1 body/downloadable portal fidelity remains unverified and visible in coverage notes. Actual award terms/period/official actors remain real-use inputs. Synthetic acceptance establishes no scientific truth, legal compliance, time saving or market superiority.

No credentials, paid usage, live provider calls, sponsor login/submission, email/push or public deployment. File/OCR adapters, extra report families and provider polishing stay deferred. No required local gate is knowingly skipped. Linux CI/merge and parent main refresh are next parent integration steps, not claimed completed here.
