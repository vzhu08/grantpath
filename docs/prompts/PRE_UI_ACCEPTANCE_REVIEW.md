# Combined acceptance before UI redesign

The human explicitly requested: **make sure previous tasks look good before implementing UI stuff**. This is a required combined functional and rendered-quality gate before the whole-product redesign starts, in addition to each feature's checks and the earlier infrastructure review.

Review lead: existing independent chat `01a171d9-b270-72d2-8d9b-73364c6a3834`. Human owner: requesting user. Parent owns integration and assigns fixes. Reuse this chat and its useful read-only agents; do not launch another duplicate review. Keep GPT-6.1 Sol/xhigh and Standard/Fast off.

## Timing and ownership

- Prepare a code/test-backed matrix now from actual checked main and known feature handoffs. Unmerged features remain explicitly unverified.
- Current shared/heavy implementation priority is05→06→08, followed by remaining selected02–09 work. The reviewer has no application write or heavy-resource lease now.
- Run final combined acceptance only when all selected02–09 features are checked and merged, the parent supplies the exact latest main/build, and the reviewer receives the heavy slot. The UI redesign is still paused.
- Lead exclusively owns new `docs/reviews/PRE_UI_ACCEPTANCE.md` and small sanitized text/JSON under `docs/reviews/pre-ui-evidence/**`. Source fixes, manifests, migrations and central records belong to their assigned writers/parent. Any extra writer needs a separate checkout/branch and exclusive paths.
- Use isolated synthetic acceptance data and reserved port3120. Keep screenshots/logs/downloads under ignored `test-results/pre-ui`. Never automate acceptance against normal port3000 workspace records. Read-only primary health/page identity checks are separate.
- Preserve other servers/data. Stop only a verified owned instance/PID. No paid/provider/AI calls, account changes, public deployment or sponsor actions follow from this review. Ordinary acceptance is offline; reuse existing live-preflight evidence where applicable.

## Required connected coverage

Inspect actual frontend behavior and backend persistence together, not merely the existence of components/routes. Reuse meaningful existing feature/regression checks and add only missing combined cases against real current contracts.

| Surface | Connected proof |
| --- | --- |
| Proposal/evidence foundation | Profile/call/source versions, all supported editors, exact citations, requirement confirmation, readiness, source changes and frozen exports remain coherent. |
| 02 vault | Import/extract/review, file replacement, exact origins, attachments/ethics and immutable original-byte handoffs. Missing/corrupt/stale originals cannot become supported current evidence. |
| 03 resubmission | Submitted original, distinct target, reviewer quote→concern→action→evidence→revision→response, unfinished work and targeted review invalidation; frozen ordered packets survive changes/restart. |
| 04 rubric review | Connected entry/run/decision/task views, exact passage inspection and honest fixture/manual/live/insufficient/failed states; no inference that a working health endpoint proves semantic review. Reuse its own actual accepted model test evidence rather than making new provider calls. |
| 05 awards/progress | Confirmed source terms/amendments, proposed versus approved facts, reporting period/milestones, actual progress and reviewed worksheet snapshots; retry and historical-source review are usable. |
| 06 finance | Exact currency/category/period scope, preview-confirmed import, duplicates, paid/committed/forecast distinctions, refunds/settlements/corrections, changed terms, snapshots and retained bytes. |
| 08 financial reports | Real ledger snapshot/mapping/currentness integration, explicit reconciliation/gaps/authority, no dropped or duplicated transactions, immutable saved reports and exports. |
| 07 reminders | Open-site banners reflect actual agenda/deadline generations; snooze/dismiss/pause and changed-date behavior persist without claiming closed-site delivery. |
| 09 discovery | Fixture/manual/cached/public labels, refresh/failure/partial states, real call/source bindings and explicit authoritative-text review. No network-dependent ordinary test or metadata-only eligibility claim. |

Exercise cross-feature state changes, imports and dependency graphs; strict API/body/origin boundaries; migration/backup and reset/retention; durable retries, lost responses and409 recovery; real process restart; exact downloaded bytes; navigation/context and dirty-buffer preservation. Findings must name actual source/API boundaries and a reproducible trigger.

## Rendered workflow and usability

Inspect real screenshots and behavior on a laptop/projector viewport around1440px, a390px mobile viewport, keyboard navigation and long-content cases. Check readable content, visible controls/focus, overflow, selected application/version/context and an understandable next action. Exercise loading, empty, validation, conflict, error and successful-save states. Buttons and links must reach working behavior; API errors must be useful.

Material workflow/readability failures are fixes before redesign, not reasons to declare an unfinished feature good. Record low-impact cosmetic observations for the upcoming design pass rather than starting palette/type/layout redesign during acceptance. Required scope is the completed02–09 application, not future11–13 or the later NIH expansion.

## Verdict and UI launch gate

Deliver an exact-revision/build **GO / NO-GO** report with real commands/exits, screenshot/browser evidence, covered and skipped paths with reasons, findings/severity/owners and remaining limitations. Passing unit tests or a build alone cannot establish this verdict.

All release-blocking functional/data/contract/regression findings and material demo-workflow defects must be fixed by assigned owners and rechecked before GO. Parent triages truly non-blocking cosmetic items into redesign scope. Verify final local production review health/readiness and build identity, then release review ownership.

The orchestrator must not launch the redesign until GO is current and all other UI-launch gates pass. Material application changes after review require the affected checks/verdict to be refreshed. Documentation-only changes with recorded identical application source do not require repeating an unchanged full suite.
