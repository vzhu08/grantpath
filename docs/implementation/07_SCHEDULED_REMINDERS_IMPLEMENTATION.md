# Task 07 — Website reminder banners for the hackathon demo

Status: **research and implementation specification only; no application feature implemented**. Prepared 2026-10-25. The human explicitly selected an in-page banner and deferred delivery after the website closes. The original roadmap 07 external-reminder outcome remains deferred. This document is the narrowed demo contract for later coding, not evidence of runtime completion or authorization to start implementation.

## 1. Human decisions and intended outcome

The requesting user is the product, scope and approval owner. No additional human teammates or decision rights are inferred from worker accounts. Actual technical/product/demo role assignments remain a parent coordination matter and do not block this research.

Direct human answers in this research chat, in order:

1. Channel intent: “web push as in a banner or push notification just on the website is good, just needed for hackathon demo”.
2. Permissible operating commitment: “Local service on my awake, networked computer; reminders stop while it sleeps (recommended for current local app)”.
3. Clarified acceptance boundary: **“Banner inside the open website is enough; defer closed-website delivery (recommended for your demo scope)”**.

Decision 3 settles the banner versus Web Push ambiguity. Build no Push API integration, service worker, email channel, provider account, hosted database or separate background sender for this demo. The local app server still has to run for workspace reads/saves. No external-delivery runtime commitment is needed for this cut. There are **no outstanding consequential human questions for this narrowed specification**. Any later expansion to closed-site notifications requires a new human choice of channel, runtime, identity, costs and delivery expectations.

Researcher problem: an agenda requires the researcher to look for approaching dates. An unobtrusive banner brings the selected application's relevant, confirmed dates into the preparation flow and links directly to the underlying deadline or internal target. The distinctive mechanism is a persisted temporal generation: dismissing an old deadline cannot silently hide a changed or restored deadline.

Proposed user flow:

1. In Application plan, turn on **Website reminders** for the selected application. Explain: “Shown while GrantPath is open. Reopening checks dates again. No notifications are sent after the website closes.” Default is off in existing workspaces.
2. Select **1 day** or **7 days** before dates. Preview exact-time deadlines as elapsed 24/168 hours; date-only targets use 1/7 calendar days in the displayed workspace timezone. No hidden interpretation of “day”.
3. See one persistent banner summary for due reminders, with application name, sponsor deadline versus internal target, exact source/date wording, “Due since …” or “Today — cutoff time unknown”, and **Open date**, **Snooze 15 minutes**, **Dismiss this reminder**.
4. Pause all website reminders or disable this application's reminders. Dismissal never marks a task Ready, submits an application or changes a deadline.
5. Refresh, change tabs or restart the local server. Saved preferences and acknowledgements survive. On reopening/focus, current committed dates are evaluated again. No claim is made about what was displayed while the page was closed or suspended.

## 2. Inspected baseline, provenance and dependencies

Code baseline: `4b7d2059957d92d75f18984685a25bb2324a8b54`, main at task dispatch; research branch `research/07-scheduled-reminders`. Workspace schema is **2**, and roadmap 01 already supports **14 proposal sections**, versioned evidence and immutable packets. Historical notes about three fixed sections, schema 1 or a pending renderer are not current interface facts.

Read before writing: root `AGENTS.md`, [selected modules](../kit/SELECTED_MODULES.md), [quickstart](../QUICKSTART.md), [ownership](../OWNERSHIP.md), [human workflow](../HUMAN_AI_TEAM_WORKFLOW.md), [task card](../TASK_CARD.md), [API contract](../API_CONTRACT.md), [actual status](STATUS.md), and [roadmap](../ROADMAP.md). Scoped `AGENTS.md` search found only the root instructions. Also read the current authoritative primary checkout's `AGENTS.md`, `docs/PROJECT_BRIEF.md`, `docs/ROADMAP.md` and `docs/ORCHESTRATION.md` at `C:/Users/vzhu0/PycharmProjects/grantguide`; these contain newer uncommitted scope/coordination and were not copied or edited.

Primary-document SHA-256 provenance, in that order: `0AE390445F568F5C257A346FA13B10C07A0456B83451F08E8F7CF9066CE0BAB0`, `5AFDB010C999EA09B7D1AD859634C1303153FBFC2E7EF16A56CE4B6B451E1788`, `9B741F9E7770658484D82372142E0D81860E889729998F321002D18C4B946F8B`, `972155F8D8F2AF9D3180AB183DE2BBC257F46FB28097F87004FB159D0C5E6A87`. They record the time-constrained priorities: technical impressiveness, clarity, impact and novelty; no actual event deadline has been supplied.

| Inspected code | Actual behavior and implementation consequence |
| --- | --- |
| [DeadlineSchema](../../lib/schema.ts), [dates](../../lib/dates.ts) | `unknown`, confirmed `date`, or confirmed `exact` with a matching fixed UTC offset. Deadline `zone` is **not** an IANA timezone. Workspace date comparisons explicitly use `America/New_York`. Preserve these meanings. |
| [Calendar](../../lib/calendar.ts) | Date-only remains upcoming throughout its local date; exact becomes overdue strictly after its instant. ICS has stable UIDs, all-day exclusive ends and exact UTC serialization. It supplies neither alarms nor synchronized updates. Keep it working. |
| [Checklist](../../components/checklist.tsx) | Agenda contains sponsor deadline and requirement internal targets. `responsible` is plain text, not an identity, recipient or opt-in. Reminder completion filtering is a new projection, not a change to existing agenda contents. |
| [Repository](../../lib/repository.ts) | Process-local serialized JSON writes through temporary-file sync/rename; optimistic revision checks; `internal()` always increments revision. No interprocess lock. Pure reminder evaluation must not call a mutation/internal write. |
| [Workspace UI](../../app/page.tsx) | Initial fetch occurs on mount. `load(false)` retains updated state separately when editors are dirty. Refresh reminders without replacing unsaved buffers. |
| [HTTP boundary](../../lib/http.ts), [workspace route](../../app/api/workspace/route.ts) | Loopback Host, same-origin JSON mutations, schema/body bounds and revision conflicts. This is the current local-owner trust boundary, not hosted authentication. |

Tasks 02/03/04 are being implemented elsewhere in shared-file order 02 → 03 → 04. Contract milestones and source presence are **unintegrated awareness**, not verified feature behavior. Task 07 does not need their completion to define this banner, but later edits to shared files must wait for the assigned lease and inspect the exact checked integration SHA/schema. Allocate migration **N → N+1 at that time**, preserving all intervening migrations; do not reserve a competing 2 → 3 migration.

Use only existing sponsor deadlines and requirement internal targets for v1. Optional task 02 ethics, task 03 response actions and task 04 review action dates are future adapters after their real interfaces exist; none is a prerequisite. No dependency on tasks 05, 06, 08, 09 or team workspaces/task 10. This document does not design those features.

## 3. Scope and hackathon cutline

In scope: one local owner; selected application banner plus a count of its active reminders; per-application opt-in and lead choice; global pause; persisted snooze/dismiss; source-linked confirmed dates; stale-target validation; deterministic clock/date behavior; reopen/restart recovery; original workflow regression.

Defer: delivery after the page closes, OS notifications, Web Push subscriptions, permission prompts, email/SMS, external outbox/provider, hosted worker/database/authentication, cross-device sync, calendar OAuth/bidirectional sync, recurrence, quiet hours, arbitrary lead schedules, digests, attachments in notifications, AI-generated reminders, and expanded action-date adapters. No operating-system service installation is needed. This cut saves setup and verification effort; it does not satisfy the original closed-app roadmap acceptance.

Keep the banner on the existing four-step application journey. Do not add a notification center, team/account model or general job framework. Show at most three reminder rows with an accessible “View all dates in Application plan” control to the existing agenda; sort overdue first, then earliest due threshold and stable target ID. Show source uncertainty near the date, not in a generic warning wall.

## 4. Official research and design consequences

Sources below were opened and checked **2026-10-25**. Provider prices and platform limits are snapshots; engineering choices are proposals. The deferred [external-delivery research](../research/07/EXTERNAL_DELIVERY_RESEARCH.md) preserves investigated alternatives without importing them into this demo.

| Primary source | Supported fact | Consequence for this plan |
| --- | --- | --- |
| [WHATWG HTML timers](https://html.spec.whatwg.org/multipage/timers-and-user-prompts.html#timers), living standard dated 2026-10-22 when checked | Browser timers do not guarantee exact execution time. | Use time comparisons on every evaluation, never count timer ticks as elapsed time or promise an exact alert instant. |
| [Chrome timer throttling](https://developer.chrome.com/blog/timer-throttling-in-chrome-88/), published 2021 | Hidden-page timers can be throttled. | Re-evaluate on visibility/focus and reopening. This source establishes a limitation, not an up-to-date universal throttling interval for every browser. |
| [W3C Push API](https://w3c.github.io/push-api/), editor's draft checked on research date | Actual push uses an application server/push service, subscriptions and permission; events can reach a service worker when the page is inactive. | An in-page banner must not be named or demonstrated as Web Push. Those prerequisites are unnecessary for the chosen demo. Draft features are not assumed implemented. |
| [TC39 timezone guidance](https://tc39.es/proposal-temporal/docs/timezone.html), checked on research date | An exact instant differs from wall time; DST can repeat/skip local clock times. | Exact leads use elapsed durations. Date-only leads compare calendar dates in the existing workspace timezone. No invented local cutoff or new IANA deadline contract. This conceptual source does not mandate adding a Temporal dependency. |
| [WAI-ARIA 1.2 `status`](https://www.w3.org/TR/wai-aria-1.2/#status), Recommendation 2023-06-06 | Advisory live-region content should not take focus. | Announce changes politely once; avoid a repeated assertive alert or automatic focus jump while drafting. |

No user-need study, measured time savings, funding effect or market-uniqueness claim follows from these sources. The proposed value is observable date awareness with version-safe acknowledgement.

## 5. Exact date and reminder semantics

Use the saved `DeadlineSchema` without changing its domain meaning. Render the existing workspace timezone explicitly as **America/New_York**; do not infer it from execution-host/browser timezone. Changing the workspace timezone itself is outside this cut.

| Input | Reminder becomes eligible | Presentation and overdue rule |
| --- | --- | --- |
| Unknown/unconfirmed/stale date | Never eligible for a scheduled reminder | Existing agenda keeps uncertainty; settings show “Confirm date first”. No fabricated trigger. |
| Confirmed exact instant `D` | `now >= D - leadDays × 24 elapsed hours`, with leadDays 1 or 7 | Show original timestamp/source offset and workspace display time. At `now == D`, say “Due now”; only `now > D` is overdue, matching existing agenda semantics. |
| Confirmed date-only `Y-M-D` | Workspace `localDate(now) >= Y-M-D minus leadDays calendar dates` | Before due date: “Due [date] — cutoff time unknown”. On date: “Today — cutoff time unknown”. Overdue only once local date is later. Never treat midnight or 23:59 as sponsor cutoff. |

Subtract date-only calendar days using strict ISO calendar arithmetic, not millisecond subtraction through local `Date` construction. For exact timestamps use their saved instant; fixed-offset `zone` must still match `at`. Across spring/fall DST, an exact 24-hour lead may have a different local clock hour from the deadline. Show that in preview. Date-only reminder eligibility spans whole local dates and introduces no ambiguous 02:30 conversion.

An eligible reminder remains visible until dismissed, snoozed, disabled, paused, completed, removed or invalidated. No automatic daily retrigger. Snooze is exactly 15 elapsed minutes from server acceptance; show its absolute end time. Once it expires, the same occurrence can reappear; no new occurrence is created. Re-evaluate source/completion state before showing it again.

Sponsor targets require a confirmed deadline on the current saved call/source binding. Requirement targets must be individually `review: confirmed` and have a confirmed due value. For a cited requirement, its exact citation must validate and match the current call source version; otherwise its reminder is stale until reviewed. A manually confirmed internal target with no citation remains explicitly manual and does not acquire a fabricated sponsor-source dependency. A requirement marked `Ready` suppresses its preparation reminder. An application marked `Submitted` suppresses its sponsor/preparation reminders. These are researcher-recorded states, not proof of external completion. Returning to an incomplete state creates a new temporal generation so a previous dismissal cannot hide newly required work.

Pause/disable suppresses visibility without erasing acknowledgements or changing deadlines. Resume displays currently eligible, undismissed reminders; previously dismissed occurrences stay dismissed. A deliberate lead-time change creates new schedule generations and previews that acknowledgements will reset. Edits to ordinary draft prose or a target title do not revive reminders.

## 6. Proposed records, invariants and migration

Names below are proposed, not exports that already exist. Add a bounded `reminders` namespace to the actual future workspace schema, with its own `formatVersion: 1`:

| Record | Minimum fields and purpose |
| --- | --- |
| Settings | `paused`, settings revision; initialize `paused: false` with no enabled application policies, so all reminders are off until opt-in. The local owner is the current workspace; no email, person/account mapping or recipient field. |
| ApplicationPolicy | stable ID, application ID, `enabled`, `leadDays: 1 | 7`, policy revision, timestamps, provenance `demo | researcher`. Enabling is an explicit user command. |
| TemporalTarget | policy ID; target kind `sponsor | requirement`; application/opportunity/requirement IDs as appropriate; monotonic `generation`; canonical relevant-input fingerprint; active/unresolved/stale/completed/removed status; source binding; updated time. Retain bounded generation history (`generation`, fingerprint, reason, time) and tombstones when a target is removed. |
| Acknowledgement | unique occurrence ID, target ID, temporal generation, action `dismiss | snooze`, optional `snoozeUntil`, recorded time. Store one current acknowledgement per occurrence and bounded prior action history. Acknowledgement is a user action, not proof of reading. |
| OperationReceipt | operation ID, canonical command hash, committed action/result identity and time; use an existing integrated receipt facility if compatible. Repeated successful operations recover their result without replaying the action. |

Occurrence identity is derived from stable target ID + temporal generation. A content hash alone is insufficient: dismiss deadline A → change to B → restore A must produce a **new** occurrence. Generation increases on meaningful date/kind/confirmation/source binding, relevant completion/reopening or lead changes. Keep it stable through unrelated global revision changes, title edits and draft saves. Requirements currently have no individual revision; do not reference a nonexistent `requirement.revision`.

Reconcile temporal targets **inside every relevant serialized commit**, including commands with early returns, re-extraction, reset and relevant internal operations. Reconciliation sees the saved before/after state and updates generations atomically with the domain change. A read-only/timer reconciliation cannot detect the A → B → A history if both changes happen between reads. A centralized pure `reconcileTargets(before, after, now)` invoked by the persistence owner is preferable to scattered UI hooks.

Only authoritative saved inputs participate: target IDs, canonical deadline, review/current-source binding, relevant completion state, lead policy. Retain source ID/version/hash when applicable; manual confirmed dates retain their recorded manual origin and raw text without inventing a quotation. Normalize the fingerprint deterministically; include fingerprint format version. A current date from one application cannot acknowledge another application's target.

Reference validation must reject duplicate IDs, duplicate occurrence acknowledgements, cross-application policy/target links, dangling active targets, invalid fingerprints, invalid snooze instants and acknowledgements for generations absent from retained target history. Validate ordered generation history and its agreement with the current generation on load; compare before/after generations for monotonicity on writes. Tombstones/history use retained identity metadata instead of pretending removed records still exist. Schema validation alone does not prove reference integrity; run the graph validator on load and every write. UI cannot submit arbitrary replacement reminder state or server timestamps.

Proposed demo limits: 50 application policies, 5,000 target/tombstone records, 10,000 retained generation entries, 10,000 acknowledgement history entries and 10,000 operation receipts; no silent pruning or wraparound. A limit failure preserves the prior state and asks for deliberate maintenance, rather than losing dismissal history. Ordinary poll/evaluation cannot grow storage. Reassess these bounds against the eventual integrated workspace before coding.

Migration gate: inspect actual checked schema N; create an exclusive byte-identical backup of existing bytes; validate N; add empty disabled reminder namespace; derive no consent from prior agenda/ICS use; validate N+1 and all references; atomically write. Preserve corrupt/unknown files and report failure. Migration must be idempotent and preserve all roadmap 01–04 data/history. Test backup/write failure and restoration in isolated directories. A newer schema must never be treated as missing storage. Existing repository recovery behavior must be re-inspected after predecessor integration.

Demo reset must remove/tombstone only affected demo policies/targets and acknowledgements according to their retained generation identity, while preserving researcher policies referencing protected demo calls. Recreated demo IDs must get a fresh target identity/generation epoch; never inherit previous demo dismissal by ID coincidence. Preserve frozen packet and reusable-content reset guards. No external send records exist in this banner scope.

## 7. Proposed commands, UI integration and concurrency

Reuse `POST /api/workspace { expectedRevision, command }`, its body bounds and existing same-origin controls. Suggested commands:

- `setReminderPolicy { applicationId, enabled, leadDays, operationId }`.
- `setReminderPause { paused, operationId }`.
- `acknowledgeReminder { applicationId, targetId, generation, occurrenceId, action: dismiss | snooze, operationId }`.

The server computes eligibility, occurrence identity, timestamps and snooze end. Validate the submitted occurrence against **current committed state** before accepting it. Global revision 409 protects the first stale action; a refreshed retry must also preserve its original target/generation. Never silently dismiss the new deadline instead. Return the current validated workspace on success; conflict messages retain dirty editors.

Persist a bounded receipt for successful operation IDs or use the integrated receipt mechanism after inspecting its actual contract. The receipt hash covers the canonical command payload, excluding transport `expectedRevision`. For an exact successful retry, receipt lookup precedes revision and current-occurrence rejection: return the original action identity/snooze end together with freshly read validated workspace state rather than an obsolete whole-workspace snapshot. Changed command payload with the same operation ID is rejected. This avoids extending a snooze after a lost-response retry. Receipt retention and limits must cover retained acknowledgement history; do not delete receipts in a way that replays an old action as new. Default network behavior: one in-flight command; no blind automatic retry on 409; show recoverable failure. An explicit retry reuses its operation ID/payload; after an unapplied conflict it may refresh `expectedRevision` but cannot retarget the occurrence.

Evaluation is a pure projection such as `evaluateWebsiteReminders(state, now)`. It does not call `repository.internal`, bump revisions, claim jobs, mark “delivered” or save transient render timestamps. The banner's clock can tick every 30 seconds while visible; evaluate immediately on mount, successful relevant save, focus and visibility return. Update `now` from the clock each time; no long timeout until a distant date. Clean up listeners/timers and prevent overlapping refresh requests.

Refresh committed state on focus/visibility and on the visible 30-second refresh cycle through the existing dirty-buffer-safe path. Use the freshest committed `latestState ?? state` for banner decisions while preserving draft inputs; do not apply latest state wholesale to dirty forms. The reminder mutation adapter must likewise use that committed state's revision. Existing page mutation code uses `state.revision` and replaces `state` on success, so it cannot be reused unchanged: when editors are dirty, preserve their baseline/buffers and place the successful reminder response in the committed-state slot. Subsequent draft saves retain their normal conflict/reconciliation rules. A stale/unavailable refresh labels the banner “Saved data could not be refreshed”; disable acknowledgement until its target is validated by the server. Never treat unsaved date edits as the saved schedule. Multi-tab changes converge on refresh; do not promise instantaneous cross-tab UI suppression.

Mount the banner in the workspace/application view using a new feature component. Keep existing dirty-editor registration and navigation guards when **Open date** changes tabs or applications. Reminder actions must not discard unsaved text. Use a polite status summary for newly changed reminder content, semantic buttons and keyboard focus; a persistent list should not announce every timer tick or steal focus. Avoid auto-dismiss animation or an inaccessible transient toast. At 390px width, all content/actions remain reachable without horizontal scrolling.

Keep canonical reusable reminder schema/projection/generation logic in a new `modules/reminders/src/**` capability if that fits the final repository conventions. Application source normalization, persistence commands and HTTP/UI adapters belong in `lib/reminders/**`, `components/reminders/**` and `app/`. No reminder dependency belongs in document/extraction/AI modules. Do not import filesystem or server adapters into client code, and do not import a hypothetical kit jobs/integrations module that is absent from this snapshot.

No new public route, scheduler trigger, process lock, external outbox, webhook or provider secret is required for this scope. Retain the repository's one-process/one-local-owner limitation; never launch a second writer against the same normal data directory for tests or review.

## 8. Failure and recovery behavior

| Failure/race | Required behavior |
| --- | --- |
| Browser hidden, suspended, closed or host sleeps | No delivery guarantee. On next visible load/focus compare current saved dates against current time; show “Due since …”, never assert that a notification was sent while closed. |
| Clock changes | Recompute eligibility. Persisted dismissals do not expire because time moves backward; snooze uses its stored absolute instant. Treat large observed clock jumps as a timing limitation, not a reason to mutate dates. |
| Date edited/unknown/source replaced during dismissal | Server rejects stale occurrence or suppresses invalid date; new generation cannot inherit the old action. |
| Requirement re-extracted, completed or removed | Retain temporal history/tombstone; no orphan active banner or automatic ID remapping. |
| Concurrent tabs / lost response | Revision conflict preserves buffers; same successful operation ID recovers the prior acknowledgement without duplicating or moving snooze. |
| Storage unreadable, invalid schema or save failure | Preserve data; show load/save error. Never pretend pause/dismiss was saved or reset to fixtures. |
| Banner marked dismissed while still visible in another tab | Next successful refresh suppresses it. A stale action must validate again; no exactly-once visual-display claim across tabs. |
| All reminders paused/disabled | No visible due banners; settings clearly show pause. Resume performs current evaluation and respects earlier dismissals. |

Titles/notes are untrusted text rendered through normal React escaping. No HTML injection, external URL fetching, executable schedule text or AI invocation. **Open date** uses validated internal IDs. Keep fixture/researcher provenance on records and in demos. The local-owner boundary assumes access to the running loopback workspace; do not present it as a hosted account security design.

## 9. Bounded implementation tickets and gates

These are future tickets. Parent must explicitly authorize application work and assign the shared-file lease. The requesting user owns consequential scope decisions; the task lead is steward for the new reminder contract/migration. Parent records the actual technical/demo human owners independently of agents.

| Ticket | Exclusive writer scope | Concrete result / gate |
| --- | --- | --- |
| R07-0 — Rebase and contract inspection | Lead, read-only first | Record exact checked integration SHA, schema N, receipt/reset/source interfaces and lease transfer. Stop dependent integration if those facts are missing. |
| R07-1 — Pure reminder capability | Isolated agent checkout: only new `modules/reminders/**` and its tests | Projection, date semantics, semantic fingerprints/generations and offline edge cases; no shared edits. |
| R07-2 — Persistence and migration | Lead only: `lib/reminders/**`, necessary shared schema/repository/validator/migration files | Disabled migration, graph integrity, atomic target reconciliation, operation receipts and reset protection. Existing schema/history preserved. |
| R07-3 — Banner component | Separate isolated agent checkout: only new `components/reminders/**` | Accessible component/settings using a supplied typed adapter; no page/global-style/shared-contract edits. Lead integrates after contract acceptance. |
| R07-4 — App integration and acceptance | Lead: `app/page.tsx`, needed existing UI/styles, scoped acceptance script/tests and release notes | Dirty-safe refresh/actions, restart/multi-tab proof, original-workflow regression and final local review. Shared manifests/layout/styles only with actual need and exclusive stewardship. |

Use useful independent read-only review for state/date/UX risks. Any concurrent writer must have its own checkout/branch and exact exclusive paths. Keep provider work, broad action-date adapters and optional notification-center UI out of these tickets. Use ordinary CI for repeatable deterministic checks; do not merge a failing or superseded revision.

Go/no-go: human banner scope is settled; no credentials or paid test needed. Coding requires new authorization, stable integrated shared contracts and ownership. Future external delivery has a separate human decision gate and is not a hidden acceptance criterion for this cut.

## 10. Deterministic acceptance and local-review handoff

All automated acceptance uses synthetic data in unique isolated `.test-data` directories, mocked clock and no external network calls. Do not change the normal `.local-data` workspace or existing port 3000 server. Reserve actual review/browser/dev ports with the parent when coding; no port or URL is claimed healthy by this research.

| Case | Expected evidence |
| --- | --- |
| Opt-in/default off | Old/migrated workspaces show no banners until explicitly enabled; agenda/ICS remain available. |
| Exact trigger at before/equal/after | Before threshold hidden; equal eligible; at deadline Due now; strictly later overdue. 24/168 elapsed-hour arithmetic is exact. |
| Date-only and timezone | At `2027-02-15T01:00:00Z`, New York is still February 14; date-only due/overdue labels use the workspace date and never invent a cutoff. |
| DST | New York `2027-03-14T17:00:00-04:00` minus 24h is `2027-03-13T21:00:00Z`; `2026-11-01T17:00:00-05:00` minus 24h is `2026-10-31T22:00:00Z`. Date-only leads subtract dates across those boundaries. |
| A → B → A and reconfirmation | Dismiss A; change to B; restore A: new generation visible. Exact → unknown → confirmed cannot inherit old dismissal. |
| Unrelated edits | Draft/title changes do not create a new occurrence or revive a dismissal. Relevant source/confirmation changes do. |
| Completion/reopening | Ready/Submitted suppresses applicable preparation reminders; reversing completion creates a new generation. No sponsor receipt inferred. |
| Snooze/refresh/restart | Same occurrence hidden until stored snooze end, reappears at expiry; dismissal remains; no duplicate rows; server restart preserves both. |
| Pause/resume | No banner while paused; resume shows eligible undismissed occurrences, leaves dismissed ones suppressed. |
| Two tabs and stale retry | 409 preserves buffers; old occurrence cannot acknowledge edited target; lost-response operation retry returns original action/snooze end. |
| Reopen after trigger | Reload/focus evaluates current due targets immediately; UI makes no background delivery claim. |
| Dirty editor | Unsaved narrative/date input survives timer/focus refresh and reminder navigation; banner uses saved state. |
| Source/re-extraction/reset | Removed/stale targets suppressed, researcher records and frozen histories preserved, recreated demo IDs cannot reuse old acknowledgement epoch. |
| Failure/validation | Corrupt/unknown files unchanged; migration backup failure prevents write; invalid cross-app acknowledgement rejected; save error never appears successful. |
| Accessibility/regression | Keyboard and mobile banner controls, polite announcement behavior, agenda/ICS bytes/meaning, all 14 sections, dirty buffers and immutable packet/download/restart paths remain correct. |

For a later completed application task: run `npm ci`, focused reminder/domain/migration/receipt tests, `npm run check`, applicable imported-module README checks, production browser regression/feature journey and a dev smoke check. `npm run check` already includes a build; after the final code change, ensure the final production build is the one used for review. Start `npm run review` with the parent's reserved `PORT` and isolated `GRANTPATH_DATA_DIR`, GET `/api/health`, match returned build/instance to the final `.next/BUILD_ID`/owned review server, and provide the working `http://127.0.0.1:<verified-port>` URL. Record exact commands/exits, test counts, migration/backup and browser/restart evidence; no local build establishes hosted deployment.

Demo proof: enable reminders on a synthetic application, show the source-linked due banner, dismiss it, edit the saved deadline and show the fresh occurrence, then refresh/restart to demonstrate retained acknowledgement. Include an unknown date that correctly does not trigger. A test-controlled clock may shorten the automated scenario; label any rehearsal clock/demo input explicitly and never change normal workspace/system time. Judge-visible value is version-safe attention to dates, not the timer animation.

Evaluation targets, **not measured results**: stale dismissal suppression count, duplicate acknowledgement count under retries, evaluated-trigger-to-visible latency in the foreground, successful recovery after reopen/restart, and whether a researcher can distinguish internal targets from sponsor deadlines. Expected deterministic safety cases must pass; timing measurements are reported only after running them. No time-saved or award-rate claims.

## 11. Research verification and handoff

Read-only agents `/root/reminder_provider_research` and `/root/reminder_integration_review` ran GPT-6.1 Sol with Extra High reasoning. The first checked official scheduler/provider/cost guarantees and prerequisites; the second inspected actual contracts, dirty-buffer behavior, temporal-generation and reset races. Lead is the only document writer. Provider research remains deferred after the human's explicit banner selection.

Documentation validation for this task: a PowerShell Markdown-link resolution check passed with **18 relative links and zero broken links** (exit 0); `git diff --check` passed (exit 0). Official sources above and the research note were opened on 2026-10-25, source/code provenance is recorded, required coverage and scope were reviewed, and the diff is restricted to this document and task-07 research notes. Final staged checks and commit SHA accompany the chat handoff.

Not performed for this documentation-only task: dependency installation, application builds/tests/browser/restart/health verification, external API or push sends, notification permission/recipient registration, account setup, service installation, paid tests, automations, deployment or submission. No runtime review URL exists for the proposed feature. A later code handoff must supply its own measured evidence.
