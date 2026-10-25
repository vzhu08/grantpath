# 06 — Exact budget planning and a local expenditure ledger

Specification v1.0 · researched October 25, 2026 · documentation only. No application code, application acceptance, financial transmission or deployment was performed here.

## 1. Outcome and human-selected scope

Help a researcher see the difference between the proposal request, funding actually obligated, paid costs, unpaid commitments and a forecast. A small ledger should explain every displayed cent and retain the exact inputs behind an earlier view. The distinctive demo is an import that cannot spend twice, a payment that settles its commitment atomically, a refund that restores the balance, and an amendment that changes the comparison without rewriting history.

The human answered all four consequential task-specific questions directly on October 25, 2026:

| Decision | Verbatim human answer |
| --- | --- |
| Currency, actuals basis and scope | “Synthetic NSF award in USD; paid expenses minus refunds are actuals, unpaid commitments and forecasts stay separate; local ledger CSV/JSON snapshots only, with no institutional or sponsor-report certification (recommended)” |
| Input format | “Use that fixed CSV v1 with a preview and explicit confirmation (recommended)” |
| Indirect planning | “Show a clearly labeled synthetic 10.00% rate on explicitly selected eligible planning lines, rounded once to cents; require human confirmation; do not automatically post indirect expenses (recommended)” |
| CSV export consumer | “Spreadsheet viewing: prefix text cells with “text:” and label the CSV as a display report; keep original values in JSON snapshots; CSV is not for reimport (recommended)” |

The selected input headers and semantics are specified in §7, as presented in the human question. The requesting user is the recorded product/scope/approval owner. Additional actual human technical/research/demo role assignments remain unanswered in the parent record; no worker identity supplies institutional authority. There are **no pending task-specific human product decisions** for this synthetic scope.

The first release is one USD ledger per confirmed task-05 award, four bounded cost groups, explicit date periods, exact manual entries and fixed CSV imports, separately versioned planning/approved-budget context and local allocations of obligated funds, a confirmed synthetic indirect planning assumption, immutable audit events, frozen views and local display CSV/JSON. A paid expense is recorded on its paid date. Refunds and settled monetary credits reduce those paid costs. Unapplied vendor credits are not paid reductions. Unpaid invoices can be represented as commitments, never automatically as paid actuals.

Cuts: no institutional general ledger, accrual accounting, bank/ERP connection, account credentials, tax/payroll/FX engine, purchase approvals, allowability determination, automatic MTDC classification, auto-posted indirect charges, cross-award transfers, sponsor financial form, certification, report submission, public deployment, new AI provider or paid calls. No AI supplies authoritative arithmetic. Optional AI explanations may later quote already verified totals with their snapshot ID; they cannot create transactions, rates or balances and are unnecessary for the demo. The demo is tomorrow, October 26, 2026, with roughly the next 24 hours relevant; no exact cutoff or allotted demo duration is recorded.

## 2. Inspected instructions, actual source and predecessor contract

Research checkout: `C:/Users/vzhu0/.codex/worktrees/1a63/grantguide`, base `4b7d2059957d92d75f18984685a25bb2324a8b54`, branch `research/06-budget-ledger`; clean at kickoff. Lead owns only this file and optional `docs/research/06/**`. A scoped search found only root `AGENTS.md`.

Read root instructions, [selected modules](../kit/SELECTED_MODULES.md), [quickstart](../QUICKSTART.md), [ownership](../OWNERSHIP.md), [human workflow](../HUMAN_AI_TEAM_WORKFLOW.md), [task card](../TASK_CARD.md), [API](../API_CONTRACT.md), [status](STATUS.md), [roadmap §06](../ROADMAP.md), the documents module README and actual source below. Also read current PRIMARY `C:/Users/vzhu0/PycharmProjects/grantguide/AGENTS.md`, `docs/PROJECT_BRIEF.md`, `docs/OWNERSHIP.md`, `docs/ORCHESTRATION.md`, `docs/TASK_CARD.md` and the completed task-05 specification **in place**. No unrelated primary WIP was edited or copied.

Upstream specification: [05 award obligations](05_AWARD_OBLIGATIONS_PROGRESS_REPORTS_IMPLEMENTATION.md), research commit `cf6ab6f07ecded11dd1ec5d7bfd4c3f5a1a714e5`, SHA-256 `A9B9D79613EAD6A70EF408629AD85C7209CAAD443A16989082883F5B6C7C3EF1`, independently verified against the primary file. This relative file is **absent in this research checkout**, and is validated against the collected primary context only; parent must validate the final collected link. Its older “06 held” wording is superseded by the parent's explicit release after independent contract review. Task 08 remains held pending this completed handoff; no task-08 feature was researched or designed here.

| Inspected source/evidence | Consequence for later implementation |
| --- | --- |
| [Schema](../../lib/schema.ts), state version 2 | No ledger, reconciliation, exact money or operation receipts exist in this baseline. Preserve roadmap-01 sections/library/packets/exports. Allocate the next migration from actual integrated predecessors, never a competing fixed version. |
| Profile funding need and call ranges in that schema; extraction `price` in `modules/extraction/src/index.ts` | These are JavaScript numbers for matching/candidate extraction. Never turn them into requested or available money, or parse authoritative amounts through them. |
| NSF template budget justification in `lib/proposals/nsf-template.ts` | Narrative budget justification is not a structured budget or accounting form. New ledger records must have their own schema. |
| [Repository](../../lib/repository.ts) | One-process serialized queue; exclusive temporary file, sync and atomic rename. Global revision rejection occurs before feature receipts today; ledger retry recovery must precede that rejection. Validate the entire reference graph before every ledger commit, not just Zod shapes. No cross-process locking/authenticated institutional actors. |
| Repository loading/migration and `resetDemo` | Preserve corrupt/unknown storage; distinguish absence of the initial workspace from other ENOENT failures. Extend reset dependency closure for award/budget/events/snapshots; never delete something cited by retained researcher records. |
| [Evidence helpers](../../lib/evidence.ts) | Historical version/hash/UTF-16 quote checks can be reused, with explicit same-project/award ownership checks. Exact quotations are provenance, not proof of truth or allowability. |
| `modules/documents/src/server.ts`, installed PapaParse | Raw string parser and physical line provenance exist. The generic normalized JSON-array text is not a transaction schema. Reuse parser primitives without copying the module or accepting its output as posted financial facts. |
| Existing proposal canonicalization | Unversioned key ordering uses `localeCompare`. Use a separately versioned ordinal-key JSON canonicalization for ledger hashes; do not change old packet hashes. |
| [HTTP](../../lib/http.ts), [workspace route](../../app/api/workspace/route.ts), health/local server scripts | Loopback, same-origin JSON, no-store and a 120,000-byte request limit remain authoritative. Review health carries service/build/revision/instance, with explicit owned data/ports. |

### Accepted task-05 logical input: `AwardFinanceContextV1`

Consume `contractVersion='award-contract-v1'`; stable `awardId/applicationId/projectId`; immutable proposed-origin ID/digest; confirmed current full-terms ID/digest; separate local and sponsor status; award/budget periods; approved-budget source/version references; funding facts; unresolved fields; actor/time. The full terms/change graph supplies initial/amendment/administrative-change/correction identity, base lineage, source, issue/effective dates and explicit head selection. The consumer must validate that graph or a checked upstream adapter, rather than accept a browser-posted DTO as truth.

Funding facts distinguish `proposal_requested`, signed `current_action`, nonnegative `obligated_cumulative` and `anticipated_total`, each known exact USD cents or typed unknown. A dollar sign alone is not USD. Task-05 known input magnitude is at most 18 digits, with no exponent, fractional cent or negative zero. Current action is scoped to one sponsor action; it is not automatically carried to another action. **Use the explicit confirmed cumulative obligation, never sum actions or use anticipated funding as available funds.** Unknown remains unknown; zero is a known value. Sponsor active/closed status and a positive balance do not authorize spending.

A cumulative fact carried forward with its original citation also needs explicit review that it remains applicable after the selected action. A new positive/negative action plus only an older cumulative figure is unresolved unless evidence supports the figure as still current; do not repair it by arithmetic or silently reuse it. A sourced date-only extension can legitimately retain unchanged cumulative funding after that review. This is a consumer applicability guard, not another award-intake feature or an unresolved synthetic-scope question.

`approvedBudgetRefs` supplies sources, not approved structured category lines. Task06 must obtain human-reviewed transcription/mapping of those sources or keep the breakdown missing. An approved total project budget can exceed presently obligated funding under incremental funding. Do not force that approved plan to equal cumulative obligation. A separate **local allocation of obligated funds** may sum to cumulative obligation for the remaining calculation, with its own confirmation and label (§5).

Actual exported DTO/types, checked schema/migrations, receipts, concurrency, source retention, amendment/head and reset/restart behavior are mandatory **later code integration gates**. They are not asserted implemented by either specification. Do not implement award intake again or modify task05's scope.

## 3. Opened primary research and applicability

Sources below were actually opened by the lead and/or independent policy reviewer on **2026-10-25**. eCFR current pages reported Title 2 current through **2026-10-22**, last amended August 17, 2026; point-in-time October 25 retrieval failed in the independent pass. Record this availability limit. These are engineering design inputs, not advice about a real award.

| Source/version | Supported point and bounded consequence |
| --- | --- |
| [2 CFR 200.302](https://www.ecfr.gov/current/title-2/subtitle-A/chapter-II/part-200/subpart-D/section-200.302) | Recipient financial management includes identified awards, documented expenditures/obligations and comparisons to budgets. Retain source, scope, basis and reconciliation differences; a local number alone cannot claim compliance. |
| [2 CFR 200.403](https://www.ecfr.gov/current/title-2/subtitle-A/chapter-II/part-200/subpart-E/section-200.403) | Allowability depends on multiple criteria, documentation and applicable conditions. Paid date is not necessarily incurred date. Our paid ledger cannot decide allowability or infer permission from period fit. |
| [2 CFR 200.406](https://www.ecfr.gov/current/title-2/subtitle-A/chapter-II/part-200/subpart-E/subject-group-ECFRea20080eff2ea53/section-200.406) | Applicable credits can reduce award costs. Model a supported paid-cost reduction separately from a new award obligation; retain its original expense link. Broader accounting adjustments are outside this release. |
| [2 CFR 200.414](https://www.ecfr.gov/current/title-2/subtitle-A/chapter-II/part-200/subpart-E/section-200.414), independent reviewer opened current page | Eligible recipients without a current negotiated rate may elect up to 15% MTDC; election is not a universal rate. Do not default a real award's rate from this rule. |
| [2 CFR 200.1](https://www.ecfr.gov/current/title-2/subtitle-A/chapter-II/part-200/subpart-A/section-200.1), independent reviewer opened MTDC definition | Current MTDC has exclusions and a first-$50,000 subaward rule across the subaward's performance period. Group names cannot establish eligibility; no automated MTDC or annual threshold reset is included. |
| [NSF indirect-cost guidance](https://www.nsf.gov/funding/proposal-budget/indirect-costs) | Rate agreements, bases and effective dates matter; existing agreements and award dates can differ. Confirm the source/base/effective period for real use. The demo's 10% is expressly synthetic. |
| [NSF priorities Q&A](https://www.nsf.gov/updates-on-priorities) | NSF describes the separate standard 15% policy, NSF 25-034, as not currently in effect after vacatur. Do not confuse that cap with the elective de minimis provision. Recheck at real use. |
| [PAPPG index](https://www.nsf.gov/policies/pappg) and [award conditions index](https://www.nsf.gov/awards/terms-conditions) | Index lists 24-1 plus supplements effective December 8, 2025 and January 22, 2026; conditions depend on the award notice. Do not replace incorporated terms with the newest webpage. Historical static 10% wording does not validate a current real rate. |
| [RFC 4180](https://www.rfc-editor.org/info/rfc4180/), informational October 2005 | Describes common CSV quoting/header/record conventions, not an Internet standard. Our fixed schema, encoding, dates and amount grammar still need explicit validation. |
| [PapaParse documentation](https://www.papaparse.com/docs), undated live docs for installed major 5 | String parsing supports quoted cells; dynamic typing and auto-renamed duplicate headers need explicit control. `escapeFormulae` adds an apostrophe and is not a lossless/sufficient universal export boundary. |
| [OWASP CSV injection](https://community.owasp.org/attacks/CSV_Injection), live guidance | Spreadsheet cells can interpret formulas; quoting alone is insufficient and resaves can undo escapes. Separate the human-selected prefixed display CSV from raw JSON; make no claim of universal safety after editing/resaving. |
| [Published ECMAScript Number rules](https://262.ecma-international.org/6.0/#sec-number.max_safe_integer), June 2015 historical normative section | Number safe integers stop at 2^53−1. Use exact integer-string/BigInt money. The living TC39 document identifies itself as 2027; do not cite it as a published 2026 edition. |

No actual notice, complete applicable conditions, rate agreement, accounting statement, institution policy, finance official, account or certification was supplied. The task05 conditions-index research did not verify the linked July 2026 GC-1 PDF body. This plan claims no exact sponsor accounting/report fidelity. Recheck current primary guidance and actual award-specific rules before any separately authorized real-award scope.

## 4. User workflow and visible improvements

1. Open **Budget & ledger** on a confirmed award. Show **Synthetic / local planning — USD paid-expense basis**, the selected terms/version and any missing or changed source. A proposal request and anticipated amount have separate labels. Unknown funds show **Unknown**, never `$0.00`.
2. Review the original requested budget and, separately, any sourced sponsor-approved budget plan. Enter a local category/period allocation of currently obligated funds. Unallocated funding stays visible. No silent proportional allocation of an award ceiling or incrementally funded project budget.
3. Review a small planning table: personnel, equipment, other and indirect. Select eligible direct planning line IDs for the synthetic 10.00% assumption and confirm it. Show eligible sum, excluded lines, rate, rounding convention and resulting indirect plan. It does not post spending or prove allowability.
4. Enter a manual transaction, or select a local UTF-8 CSV. Preview every row with source line/record, normalized meaning, links, errors, duplicates and changes to paid/committed/remaining totals. A linked payment shows the exact settlement and any overage. Nothing posts until explicit confirmation.
5. Posting writes the complete batch, receipts and audit records atomically. Reimporting with new filename/order/operation ID still skips already accepted transaction keys. A changed payload for a used key is a conflict that needs a correction; rejected rows stay visible and the batch posts nothing.
6. Inspect a refund or correction through its original event and source. Refunds reduce actuals and do not reopen commitments. Corrections preserve old entries and create explicit cancellation/replacement history.
7. Adopt a reviewed amended budget against the new task05 terms. Compare before/after funding/allocation, retain all actuals and old periods, and review changed mappings. Pending/future award candidates never supply new funds automatically.
8. Choose cutoff/date scope, review reconciliation gaps, and save an immutable **Local ledger snapshot**. Download a display CSV and original-value JSON. A later entry/amendment changes the current view and stale indicator; the old snapshot and downloads remain identical.

Use one bounded screen with a summary row, budget table, transaction list, preview drawer and history/snapshot drawer. Explain negative amounts and evidence through expandable details. Preserve keyboard access, labels, narrow-screen readability and dirty buffers after 409/errors. The mechanism should be understandable in one short walkthrough; do not add a general accounting configuration console.

## 5. Money, budgets, categories, periods and indirect calculations

### Exact representation and formulas

- Currency is explicitly `USD`, scale `2`, immutable per ledger. No FX conversion or mixed-currency posting. Unknown upstream money does not infer USD; the separately human-confirmed ledger choice is USD, and usable funding still needs an explicit supported known USD fact.
- Persist money as canonical base-10 integer strings. Known input/line/event magnitudes are at most **18 digits** of cents. Positive event magnitudes exclude zero; budget lines and known totals may be zero. Canonical zero is `0`; signed derived totals allow `-` only for nonzero magnitude. Reject `-0`, plus signs, exponents, separators, symbols, NaN/infinity and fractional cents.
- Decimal entry grammar is `(?:0|[1-9][0-9]*)(?:\.[0-9]{1,2})?`; pad the fraction to two digits using strings and validate the resulting cents bound. `0.1` becomes `10`; `0.10` is the same semantic value. Never use `Number`, `parseFloat`, `toFixed`, numeric JSON money or `amount * 100` in the authoritative path.
- Use BigInt for all sums/products/division/comparisons; JSON contains strings, never BigInt values. Intermediate products use bounded input BigInts without a premature 24-digit cap. Validate every persisted/returned monetary result to at most **24 magnitude digits**, and reject an overflowing operation atomically. Input caps plus lifetime event/line caps bound work; per-file limits alone do not bound lifetime sums.
- `S = sum(active paid expenses) - sum(active settled refunds/credits)` through the cutoff. `C = sum(open commitments)` at that cutoff. `F` is active forecast amounts selected for their future target scope. `A` is selected confirmed cumulative obligation. `R = A - S - C`; optional **After forecast estimate = R - F**. Forecast does not change S, C or R. Missing A makes R unknown while S/C remain displayable.
- Never clamp negative R/category/period variances to zero. Overcommitment/overspending warnings retain the exact signed value. Known zero and missing funding/allocation stay distinct. AI and the client cannot override server totals.

### Three separate budget meanings

1. **Original requested**: human-transcribed exact lines pinned to task05 frozen origin/evidence and a requested fact, if known. The original context never changes. Later planning revisions/scenarios append versions and are labeled current planning, without replacing the original request. A discrepancy between narrative/fact and entered total is visible and unresolved.
2. **Sponsor-approved budget plan**: optional human-transcribed sourced category/period plan, with its complete scope and source. It may represent the total project budget rather than presently obligated funds. Missing category support stays missing. No scalar money fact generates this table automatically.
3. **Local allocation of obligated funds**: a separately reviewed allocation for remaining calculations, pinned to one confirmed cumulative fact/terms version. Each nonnegative category/period cell plus an explicit **Unallocated** bucket sums exactly to known A. The unallocated residual is proposed arithmetically and confirmed; no hidden balancing line. This is labeled local allocation even when based on an approved plan. For unknown A, allocations may remain draft but cannot claim a reconciled funds distribution or a known R.

Use stable group codes `personnel`, `equipment`, `other`, `indirect`. These are local groupings, not official SF-425 or complete NSF budget codes. Do not infer equipment treatment from a dollar threshold or personnel allowability from the group. Bounded planning lines store label, group, period, exact entered line total and optional calculation/evidence note; personnel totals sum entered personnel lines. Salary × months, fringe, effort and procurement calculations are deferred; the user supplies their exact line totals. Optional source category labels map explicitly to these codes in a versioned mapping table, with actor/time; ambiguous/unknown input codes are rejected for review. Historical mappings are never overwritten.

For each category/period show requested, optional approved plan, local obligated allocation, paid net, open commitments and local remaining. Missing allocation makes that cell's remaining unknown, not zero. Award-wide remaining can still be known. Allocation, paid and commitment **component sums** including Unallocated/historical/unassigned buckets reconcile independently to their award totals. Row remaining values sum to award R only with a complete reviewed allocation/mapping; otherwise the disaggregated remaining total is explicitly unresolved. Example: A1000 entirely Unallocated and Other expense100 gives award R900, Other remaining Unknown and Unallocated allocation1000; do not invent a zero Other allocation or claim those row remainders sum900. Display unallocated funds rather than pretend they are available to a particular category.

### Period semantics

Task05 budget-period IDs pin confirmed inclusive date-only start/end and source, with nonoverlapping active ranges. A changed interval gets a new ID plus supersedes reference. Preserve all historical period IDs. Each paid expense/refund/settled credit belongs to its **own paid/settled date period**; do not infer an incurred date. A commitment belongs to its original obligation period, while its linked payment also pins that original period separately. A payment in P2 may settle a P1 commitment: S increases in P2, C decreases in the P1 bucket, and award totals count the payment only once. This does not imply sponsor carry-forward approval.

Assigned transaction dates must fit the selected period. Reject a mismatch with an explanation, never auto-reassign. An explicit reserved `unassigned` period supports an unknown/outside date mapping; it remains included in award S/C/F, visibly unresolved and excluded from any claim of a fully mapped period. An outside-award paid date is not automatically illegal: paid and incurred dates differ. Keep it in the unassigned bucket with a warning; no allowability judgment. A source period mapping change requires an explicit new mapping/review, never mutation of old events or duplication under both IDs.

Snapshots use date-only cutoff and `dateBasis='America/New_York'` for the selected local demo. Dates are validated actual ISO calendar dates, not UTC-parsed/local-shifted timestamps. A paid/commitment/release/reduction date cannot be future relative to the server's date in that zone; forecasts may be future. There is no precise banking timestamp claim. Store event effective date separately from server recordedAt/ordinal.

### Confirmed synthetic indirect plan

The first release supports the human-selected **synthetic 10.00%** assumption only: `rateBps='1000'` and rational multiplier `1000/10000`. Store assumption ID/version, label, eligible direct line IDs, explicit exclusions, period, source/provenance=`demo`, confirmed actor/time, and rounding policy `aggregate-half-up-cents-v1`. The selected base excludes indirect lines; no indirect-on-indirect recursion. A missing confirmation/base is unknown, not zero. Changing eligible lines or amounts invalidates confirmation.

For nonnegative base cents B, compute once per selected budget version/period: `indirectCents = (B * 1000n + 5000n) / 10000n` with integer division. Sum selected direct lines first; do not round each line. Thus a 5-cent base gives 1 cent; two eligible 5-cent lines together give 1 cent, not 2. This is the chosen synthetic planning convention, not an NSF-mandated transaction rounding rule. Transactions are exact entered cents and never rounded by a rate.

No automatic actual/commitment indirect entry is generated; any separately posted indirect paid expense needs its own exact manual/import event and evidence. A real rate/base/exclusions/effective dates/rounding agreement is a separate future human prerequisite. Neither generic 10% nor elective 15% is presumed applicable to a real award. Automated MTDC, subaward thresholds and negotiated multi-rate periods are deferred.

## 6. Immutable ledger events, settlement and correction rules

Append events; do not edit posted amount/date/category/links in place. A `LedgerEventV1` contains ID, ledger/award/project IDs, stable transaction key, kind, effectiveDate, server recordedAt and ordinal, positive cents, USD, category code/mapping version, paid/origin period refs as applicable, description, provenance, actor attribution, source/import references and canonical payload digest. Optional receipt refs pin a permitted project source version or actual integrated vault file/version; do not fetch URLs, expose raw filesystem paths or copy receipt text into AI context. Missing receipt is explicitly absent, not an invented receipt. Plain entered names are local attribution, not authenticated finance sign-off.

| Type | Stored effect and required references |
| --- | --- |
| `commitment` | Creates a reserve of its positive amount, with stable commitment ID equal to its transaction key. Does not change S. |
| `expense` | Adds full paid amount to S. Optional commitment_id must be same award/USD/category; date >= commitment date. At preview compute settlement `min(paid amount, open at the effective insertion point)`, store that exact settlement cents, and atomically consume only that reserve. Remaining paid excess is labeled overage and explicitly confirmed. Partial payment leaves the remainder open. Unlinked paid expenses have zero settlement. |
| `release` | Requires commitment_id, reduces open by the entered positive amount, has no S effect. Cannot exceed open or precede the commitment. It is cancellation/release of an unpaid reserve, not cash income. |
| `refund` / `credit` | Requires related_transaction_id of a paid expense, same award/USD/category; own settlement date >= expense date. Reduces S only when an actually received/applied paid-cost reduction. Store original paid-period ref plus own date period. Aggregate unreversed reductions cannot exceed active gross expense. An unapplied credit note is not this event; retain as a nonposting note/forecast reduction outside S until actually applied. Never increase A or reopen a commitment automatically. |
| `forecast` | Future planning amount, no S/C/R effect. Active until explicitly cancelled/replaced; posting an expense does not silently remove it. Preview warns of a forecast that may now duplicate a paid cost; user cancels it explicitly before relying on after-forecast estimates. |

`open(commitment, cutoff) = original active amount - stored active settlements - active releases` through cutoff. Enforce `0 <= open <= original`. Settlements are **stored once**, not recalculated on reads from today's open balance. A duplicate expense never generates another settlement. Cross-category settlement is rejected; an explicit correction/new allocation is needed rather than an implicit category transfer.

Validate every effective-date prefix of the **final active event graph**, ordered by `(effectiveDate, recordedOrdinal)`, for commitment and refund capacities. For a new backdated linked expense/release, calculate its proposed allocation at its insertion point, then reject if it makes any retained later allocation impossible. Example: C=100 January 1, expense=100 April 1 already settled; inserting a linked March expense must not steal/rewrite April's settlement. Show the conflict and require an explicit correction/reallocation. Same-date ordering is stable and frozen. CSV new references must already exist or occur in an earlier row; forward references are rejected with a reorder instruction. The preview shows the exact deterministic order and settlement values.

### Corrections are not refunds

An erroneous entry uses an internal `correctLedgerEvents` command with reason, target IDs/digests, cancellation events and optional fresh replacement keys. A reversal/cancellation removes the target's economic effect **at its original effective date** for newly generated views, while retaining the original, cancellation, recorded dates and reason in audit history. It is a disclosed restatement, not a claim that cash was refunded on the correction date. Old frozen snapshots stay unchanged.

There is at most one active cancellation per target, no cancellation-of-cancellation, and no reused transaction key. Correcting again creates a fresh replacement/correction chain. Reject cancelling a commitment/expense while unreversed dependent settlement/release/refund events remain. The UI can preview a bounded atomic dependency cancellation and replacement plan; require explicit confirmation of every affected event. Validate the final active graph after the entire correction, not transient insertion order. Cancelling an expense restores exactly its stored settlement amount to open commitments, subject to the final graph checks; cancelling a refund restores refundable capacity. If the obligation was actually cancelled too, an explicit release/correction records that fact. No automatic reopening on an ordinary refund.

Typed external dependencies are commitment → live expenses with nonzero stored settlement/releases, and expense → live refunds/credits. An expense's own stored settlement cancels with that expense; it is not a separate dependent record that makes the expense impossible to correct. Zero-settlement expense links remain historical context; their source refs are retained, but they consume no reserve. Resolve active cancellation targets before validating the final economic graph.

Zero-posting notes can explain unsupported/unapplied credits; they are separate annotations, not zero-money CSV events. Archive the ledger to hide editing while preserving histories and refs. No cascade delete or physical purge is offered by this release.

## 7. Human-selected fixed CSV v1 and idempotent import

The exact ordered header is:

```csv
transaction_id,date,type,amount,currency,category,period_id,description,commitment_id,related_transaction_id,receipt_ref
```

The human saw and accepted these headers, types and positive-amount convention. Version is selected explicitly as `grantpath-ledger-input-v1`, never inferred from a filename or detected institution. No arbitrary column-mapping wizard is required for this demo.

| Column | Concrete contract |
| --- | --- |
| transaction_id | Required stable case-sensitive ASCII `[A-Za-z0-9_-]{1,100}`. Shared manual/CSV namespace `ledger-v1`, scoped by immutable award ID. Not row number/filename/content hash. |
| date | Required actual `YYYY-MM-DD`, with kind-specific paid/commitment/release/forecast meaning and date rules in §5–6. |
| type | Exactly `expense`, `refund`, `credit`, `commitment`, `release` or `forecast`. No sign-based inference. |
| amount | Strictly positive decimal magnitude under §5, at most two fractional digits; no plus/minus, parentheses, symbols or thousands separators. Effect derives from type. |
| currency | Exactly `USD`; mixed currencies are rejected, no FX or profile default. |
| category | Exactly `personnel`, `equipment`, `other` or `indirect`. A versioned explicit source mapping may be supplied before a future format; v1 does not guess synonyms. |
| period_id | Confirmed immutable task05 period ID retained in the ledger mapping, or explicit `unassigned` with a visible unresolved warning. Assigned date/period mismatch is rejected. |
| description | Required, 1–500 characters after verifying not all whitespace; preserve original spaces/Unicode/newlines as text, never HTML/formula/code. No trim-based dedup. |
| commitment_id | Required for release; optional for expense; blank for other kinds. Resolves existing or earlier-row commitment transaction key in this award. |
| related_transaction_id | Required for refund/credit; blank otherwise. Resolves existing or earlier-row paid expense key in this award. |
| receipt_ref | Optional opaque source-version or integrated vault-version selector, with server-validated same-project ownership. Blank means no receipt supplied. No URL/path fetching. |

Parse **at most 80,000 raw file bytes** using fatal UTF-8 decode; permit a UTF-8 BOM only at byte 0. UTF-16/invalid UTF-8/NUL/embedded BOM are rejected. Delimiter is comma, double quote escape is doubled double quote; accept CRLF or LF records, output CRLF. Support quoted commas/quotes/multiline descriptions with a real parser. A blank record means one empty field from an empty physical record; skip only such records and retain their physical line positions. A row of delimiters/spaces is data and must validate. Header is one raw array: reject duplicate/missing/unknown/reordered names and extra/missing fields; do not allow Papa's auto-renamed headers or greedy whitespace skipping to hide errors. Set `dynamicTyping=false`, no remote/download mode, no delimiter guessing, no formula evaluation.

Limit to **200 parsed nonempty data records**, excluding header, not 200 physical lines. Retain original bytes (bounded base64), SHA-256, parser/format version, display filename, physical start/end line and logical ordinal, raw fields, canonical fields, payload digest, classification and all errors. A structural/encoding/header error rejects the batch; do not salvage shifted columns. Other errors identify exact cells/rows and preserve the input. Server preview/confirmation revalidates every byte/row/reference and bound; a browser's parsed totals are not trusted.

### Duplicate policy and atomic confirmation

- Semantic key is `(awardId, 'ledger-v1', transaction_id)`, independent of manual versus CSV source, filename, file hash, row order and operation ID. Accepted keys remain reserved after correction/cancellation/archival; exact reimport cannot resurrect an old effect.
- Compute SHA-256 of versioned, unambiguous fixed-field structured encoding of kind/date/canonical cents/currency/category/period/description/links/receipt. Resolve references to stable IDs while retaining supplied keys. **Exclude source channel, file/row identity, import/operation ID, actor/time and ingestion provenance from this semantic hash**; retain those separately in source audit/request hashes. The ledger's immutable demo/researcher label still applies to every event and export. Do not concatenate with delimiters, trust client hash or use floating values. Equivalent `1.0` and `1.00` normalize identically; meaningful description changes do not.
- Same key and canonical payload means **Already recorded / skipped**, with retained original/correction status. Same key and different payload means **Conflict**, never overwrite/append under that key. Same key twice within a new file is rejected as an ambiguous duplicate input, even if identical; user removes the duplicate row. Equal date/amount/description under distinct keys is a possible-duplicate warning, not automatic deletion of legitimate repeated expenses.
- After strict byte/schema/ownership checks and resolution of the key's original retained references, classify an identical existing key **before new-posting active-parent/capacity/current-budget checks**. Historical cancelled parents still resolve for a skipped original row; replay must not fail or resurrect it merely because a correction later cancelled the original chain. New keys require active parents and every current posting/context check. Used-key conflicts cannot bypass validation through a correction status.
- Classify every row `ready`, `already_recorded`, or `rejected/conflict`, plus warnings. Any rejected/conflicting row blocks the **whole batch**; valid rows remain previewable. Explicitly fix/repreview rather than commit only a hidden subset. All-ready plus already-recorded rows commit ready rows atomically; an all-duplicate file creates no new financial events. No partial spending if a later row fails.
- `previewLedgerImport` pins ledger revision, workspace revision, terms head ID/digest, selected budget/mapping version, source bytes/hash and deterministic proposed financial effect. Human confirmation includes operation ID and preview digest, not editable totals. The server re-derives/compares the plan in the serialized transaction. If any relevant input changed, return 409 with file/editor retained and require a new preview.
- Durable operation receipts are **separate** from semantic transaction keys. Receipt identity is scoped ledger/command/operation ID plus server canonical request hash, including preview/source/context for import. A matching retry returns original IDs/effect even after another mutation; lookup occurs before ordinary revision rejection. Changed payload under the same operation ID fails 409 even if a client reuses its claimed hash. Never replay an old posting.
- Store batch classification, ready/skipped IDs, rejected row details, exact source and confirmation actor/time. Rejected previews have no financial events; bounded retained previews can be archived after review with their audit/source record preserved. Error buffers must not disappear on 409/413/storage failure.

### Small hand-checkable file and demo

P1 is a synthetic confirmed 2026-01-01–2026-12-31 period. This input uses no real receipts:

```csv
transaction_id,date,type,amount,currency,category,period_id,description,commitment_id,related_transaction_id,receipt_ref
C01,2026-10-20,commitment,300.00,USD,equipment,P1,Equipment order,,,
E01,2026-10-21,expense,200.00,USD,equipment,P1,Partial paid invoice,C01,,
R01,2026-10-22,refund,50.00,USD,equipment,P1,Received partial refund,,E01,
E02,2026-10-23,expense,100.00,USD,equipment,P1,Final paid invoice,C01,,
E03,2026-10-24,expense,100.00,USD,other,P1,Paid supplies,,,
F01,2026-10-26,forecast,80.00,USD,other,P1,Future supplies estimate,,,
```

Original requested lines: personnel `$600`, equipment `$300`, other `$240`, synthetic indirect `$60` on the explicitly selected personnel base `$600`: total `$1,200`. Initial cumulative obligation is `$1,000`; reviewed local allocation personnel `$500`, equipment `$250`, other `$200`, indirect `$50`, with no unallocated residual. An optional approved total-project plan may be `$1,200`; it does not increase obligated funds.

| After action | A | S paid net | C open | R=A−S−C |
| --- | ---: | ---: | ---: | ---: |
| C01 | 1,000.00 | 0.00 | 300.00 | 700.00 |
| E01 settles 200 | 1,000.00 | 200.00 | 100.00 | 700.00 |
| Reimport same E01 | 1,000.00 | 200.00 | 100.00 | 700.00 |
| R01, commitment stays 100 | 1,000.00 | 150.00 | 100.00 | 750.00 |
| E02 settles remaining 100 | 1,000.00 | 250.00 | 0.00 | 750.00 |
| E03; F01 stays separate | 1,000.00 | 350.00 | 0.00 | 650.00 |
| Confirmed amendment: cumulative 1,200; new allocation other +200 | 1,200.00 | 350.00 | 0.00 | 850.00 |

F is `$80`; after-forecast estimates are `$570` before amendment and `$770` after it. The initial equipment allocation is overcommitted by `$50` after C01/E01; the refund restores that category to zero remaining. Freeze S1 before amendment and S2 after; requested origin remains `$1,200`, S1 remains `$650`, S2 shows `$850`, and both explain all inputs. A duplicate of the full file also changes no financial totals. These are specified fixtures, not executed application results.

Independent overage/correction witness in cents: A=`100000`, commitment=`30000`; pay `12000` (settlement `12000`), then pay `25000` (settlement `18000`, explicit overage `7000`). S=`37000`, C=`0`, R=`63000`. Refund `5000` of the second expense: S=`32000`, C=`0`, R=`68000`. Atomically cancel that refund and second expense: S=`12000`, C=`18000`, R=`70000`. The restored commitment is the stored `18000`, not gross `25000`. Repeat with a P1 commitment and P2 second payment to verify separate period meanings.

## 8. Proposed records, provenance and amendment invariants

Names below are logical proposals under a new `state.finance` namespace, finalized against actual predecessors. Canonical feature code belongs under `lib/finance/**`; adapters use canonical kit modules and runtime validation rather than duplicate them.

| Record | Required fields/invariants |
| --- | --- |
| Ledger | Stable ID, one per award (including archived); immutable award/application/project/USD/basis binding; revision/ordinal counter; provenance; current selected budget-version ref; archived flag. |
| BudgetVersion | Immutable full requested/planning/approved-plan/local-allocation payloads with separate roles; parent/supersedes; terms ID/digest, cumulative fact ID, source refs, effective date, lines/mappings/period refs, indirect assumption/review, gaps, actor/time, canonical digest. Requested origin is separately pinned and never replaced. |
| LedgerEvent | §6 fields; immutable financial payload; retained transaction key/digest; stored settlement amount; original commitment/expense refs; origin and paid-period refs; source/import row refs; creation terms/budget refs and local provenance. No floating latest references. |
| Correction | Immutable target/cancellation/replacement IDs/digests, reason, effective and recorded dates, actor/time; graph is acyclic and same-award. Original keys stay reserved. |
| ImportSource/Batch | Raw bounded bytes/hash, parser/schema/mapping/context, raw/canonical row records and errors, preview/confirmation fingerprints, selected event IDs and durable receipt. Accepted source is never overwritten by a later upload. |
| Source comparison | §9 exact compared scope/source/cutoff/basis/event set, differences and local review; not a certification flag. |
| LedgerSnapshot | §9 self-contained immutable payload, content digest, selected histories, exact totals, comparison state, gaps, captured export bytes/hashes/serializer version. |
| Operation receipt | Ledger/command/operation ID, server request hash, original result IDs/effect, completion time; no success receipt before durable atomic commit. Retention must preserve retry identity for every retained event/snapshot. |

Use `finance-json-v1`: JSON-only types, schema-defined omission/null rules, object keys sorted by ordinal Unicode code-unit comparison, UTF-8 encoding, no insignificant whitespace, array order explicitly defined, exact integer strings and ISO dates. No localeCompare, time/locale-dependent formatting, undefined, nonfinite numbers or mutable lookup in hashing. Hash exact selected payload bytes with SHA-256; digest excludes its own field. Preserve old canonicalizers/export serializers rather than reinterpret old versions after upgrade. The baseline evidence content hash remains its existing type; do not relabel it a cryptographic digest.

Every reference must resolve to the correct ledger/award/project and exact retained version/hash; receipt/source ownership alone is not enough. Validate current and historical graph closure, transaction key uniqueness, cancellation graph, period intervals, immutable sequence/order and totals before commit and load. Invalid reference/digest is an actionable integrity failure, never a reason to reset to demo data.

Amendments consume only confirmed applicable task05 heads. A new finance budget version pins the new head and prior budget, shows before/after amounts, requires human review of category/period mapping and never rewrites events, sources, receipts or snapshots. An increment/deobligation changes A only through the newly confirmed cumulative fact, not by adding/subtracting an action again. Unknown cumulative remains unknown even when an action amount is known. Pending/future candidate or administrative extension creates no new funds. Correction of an applied action retains action identity; no duplicate money.

Changed task05 head marks the current finance view **Needs budget review**. Paid facts can still be recorded against explicitly selected retained mappings with current context/gaps disclosed; old allocation cannot be labeled current approved availability. Historical categories/periods stay visible. No automatic remapping, carry-forward, movement of actuals or retroactive deletion occurs. A new allocation must sum known current A, including unallocated, and can yield negative remaining against existing actuals/commitments. Unsupported category details remain missing rather than invented to balance.

## 9. Snapshots, local comparison, cutoff and the 06 → 08 output

### Frozen view and two time axes

A snapshot is assembled server-side from one serialized read and records **knowledge through ledger revision N** and **paid activity through cutoff D**. A late-entered paid cost with date <=D appears in a new restated snapshot; it never changes an earlier one. Store server capturedAt/asOfDate, date basis, cutoff, selected confirmed period or award-wide scope, exact terms/budget versions and applicability mode. Cutoff cannot exceed server as-of date; in period mode require `Pstart <= D <= Pend`. No arbitrary range is supported in v1. Forecast has its own future horizon and separate inclusion list; it never enters historical S/C.

The ordinary mode is **As-of budget comparison**: selected confirmed terms and budget must be effective on/before D, and represent an explicitly reviewed applicable version for D. A later effective head cannot silently serve an earlier cutoff. If historical reading requires selecting a retained confirmed ancestor, validate its full lineage/effective facts and record the reason; an adapter must expose that exact payload, not only latest head. A retroactively effective interpretation gets an explicit restatement note. An optional alternative is explicitly labeled **Paid activity through D compared with selected budget version V**; it cannot claim the budget was in force at D. Do not implement the alternative unless needed; the first mode suffices for the fixture.

A reason alone cannot select an ancestor to bypass a confirmed selected successor already applicable at D. Unresolved/conflicting applicability stays a disclosed gap and cannot receive an unqualified as-of-budget label. Merely confirmed but unselected/future task05 candidates still do not activate themselves.

For selected period [Pstart,Pend] through D, freeze opening cumulative paid totals before Pstart, paid activity in [Pstart,D], and closing cumulative paid totals through D. `opening + period = closing` exactly for gross expenses/reductions/net. Period net paid may be negative when a later-period refund reduces an earlier expense; preserve that signed value rather than cap reductions to the current period's gross. Expense-linked capacity is award-wide across periods. In award-wide mode opening is zero and period activity equals closing cumulative activity; label it award-to-cutoff. Similarly retain opening, increases, settlements/releases and closing commitment totals, with separate commitment-origin and payment-period breakdowns. Award remaining uses cumulative award S and all open C, not just period activity subtracted from a cumulative A. All assigned, historical and unassigned buckets participate in award totals; excluded future events are listed with reasons. No opening “cash balance” is invented: these are cumulative paid-cost totals, not a bank/cash-draw ledger.

Freeze transitive source closure: selected task05 full terms/funding facts/origin refs and necessary source text, budget/mapping/assumption versions, active events and cancellation/dependency audit records, import raw/canonical rows and hashes, selected source/receipt metadata, exact formulas/rounding version, exact signed totals, comparison record, unresolved/excluded lists and local reviewer attribution. Snapshot size bound is checked before save; never keep a digest pointing only to mutable latest state.

### Reconciliation is a scoped local source comparison

The demo defaults to `not_provided / Unreconciled`. The CSV file is input provenance, not independent institutional verification. A local arithmetic check or a checked box cannot establish reconciliation to institutional books. Optional synthetic comparison evidence must be visibly synthetic.

`LedgerComparisonV1` pins a separately defined `finance-view-input-v1` digest: exact terms/budget/mapping refs, selected event IDs/payload digests/cancellation graph, basis/currency/period/cutoff and forecast selection, **excluding comparison, snapshot and export records**. This prevents a circular comparison↔snapshot digest. Store the observed knowledge revision plus source ID/version/hash/label and supplied statement period, USD, paid-expense basis, source opening/period/closing expense and credit totals, exact per-row match mapping and unresolved/unmatched/rejected/duplicate items. Snapshot/receipt-only mutations do not change this financial-input digest; economic/context changes do. Store supported amounts and differences as exact strings. States are `not_provided`, `differences`, or `matched_local_source`, with actor/time/note; the last requires matching input digest/scope/basis/currency/cutoff, itemized coverage and zero disclosed differences. A source with a different basis is `differences / basis_mismatch`, never silently converted. Reversed/orphan rows cannot count as matched active costs. Any changed financial input/source invalidates the current comparison; the frozen old comparison is retained.

No supplied real statement, authority or live comparison exists. `matched_local_source` means only that selected local records match the selected supplied source under the recorded method. It is never `institutionally_certified`, allowability approval or sponsor acceptance. Item-level receipt availability is separate from statement matching. Later real comparison requires an authorized institutional source, its accounting basis/opening balances and a real responsible human; do not invent those prerequisites as completed.

### Logical downstream read contract, not task-08 feature design

Publish a versioned immutable `LedgerSnapshotV1` read shape:

```ts
type LedgerSnapshotV1 = {
  contractVersion: 'ledger-snapshot-v1';
  snapshotId: string; digest: string;
  content: LedgerSnapshotContentV1;
  exports: readonly FrozenExportDescriptor[]; // outside content digest
};
type LedgerSnapshotContentV1 = {
  awardId: string; applicationId: string; projectId: string;
  currency: 'USD'; scale: 2; basis: 'paid_expenses_net_settled_reductions';
  cutoffDate: string; asOfDate: string; dateBasis: 'America/New_York';
  recordedThroughLedgerRevision: number; capturedAt: string;
  period: ConfirmedPeriodRef | { kind: 'award_wide' };
  termsRef: ExactTermsRef; budgetRef: ExactBudgetRef;
  applicabilityMode: 'as_of_budget';
  requested: KnownOrUnknownMoney; obligated: KnownOrUnknownMoney;
  approvedPlan: SourcedBudgetOrUnknown;
  openingPaid: ExactPaidTotals; periodPaid: ExactPaidTotals;
  closingPaid: ExactPaidTotals; commitments: ExactCommitmentMovement;
  forecast: SeparateForecastSelection;
  remaining: KnownOrUnknownSignedMoney;
  breakdowns: readonly CategoryPeriodRow[];
  events: readonly FrozenEvent[]; audit: readonly FrozenAuditRecord[];
  comparison: LedgerComparisonV1;
  unresolved: readonly Gap[]; excluded: readonly ExcludedRecord[];
  provenance: FrozenEvidenceClosure;
};
```

Close every helper type in actual exported schemas: `KnownOrUnknownMoney` has a discriminant/reason or canonical currency/scale/cents; signed money admits negative remaining and period net paid; paid totals distinguish nonnegative gross/settled reductions and signed net; commitment movement distinguishes original/increases, stored settlements/releases and open; breakdowns include allocation basis and historical/unassigned/unallocated flags. No `any`, nullable unknown-as-zero or number-valued money. Caller receives one snapshot ID/digest payload, not a floating ledger query. A later consumer must reject unsupported contract version, bad digest/reference closure, scope/currency/basis/cutoff mismatch and unavailable exact payload. It may retain gaps but cannot relabel them as reconciled/certified.

**Settled planning facts for 08:** stable award binding; exact USD cents; selected paid basis; expense/refund/credit/commitment/release/forecast effects; stored settlement/no-double-count rule; local group/period mapping; three budget meanings; explicit cumulative funding; amendment/correction history; cutoff versus knowledge time; local comparison states; immutable source-complete snapshot and purpose-specific exports. These are output facts of task06, not a sponsor form, line mapping or accounting-basis conversion design.

**Still required before 08 code integration:** actual exported 05/06 types and exact checked SHAs, integrated migration/reference/receipt/concurrency behavior, passing arithmetic/backdating/duplicate/credit/amendment/restart/snapshot/download checks and retained export bytes. Parent must review this completed plan before deciding whether its 08 planning gate is released. **Separate human prerequisites for any actual 08 scope:** sponsor/instrument/template and report period, intended accounting/report basis, real reconciliation source and authorized finance preparer/reviewer/certification choices. Nothing here selects those on the human's behalf. Do not delay independent task06 specification on those later choices or claim they are supplied.

## 10. Commands, HTTP and exports

All names are proposed, not existing API endpoints. Prefer feature commands through the existing workspace serialized mutation boundary; preview/read/export routes are feature scoped.

| Command/route | Boundary |
| --- | --- |
| `createLedger` | Unique award binding; explicit USD/paid basis/provenance; require exact task05 context and operation ID. No award intake. |
| `saveFinanceBudgetVersion` / `selectFinanceBudgetVersion` | Append full roles/mappings/assumption payload, validate sources/sums, explicit human review and expected heads; never mutate original request. |
| `postLedgerEvent` | Manual preview/confirm uses identical validation, semantic keys and settlement projector as CSV. Require expected workspace/ledger/terms/budget context. |
| `POST /api/finance/import-preview` | Same-origin bounded JSON `{ledgerId,formatVersion,csvBytesBase64,expected...}`; server strictly decodes original bytes, checks raw size/fatal UTF-8 and derives the canonical plan. No writes to financial events; return row errors/effects and preview digest. Durable rejected audit capture is an explicit bounded save action. |
| `confirmLedgerImport` | Include original bounded source/context and preview digest, rederive server-side; atomically append source/batch/events/receipt or none. No reliance on expiring in-memory preview state after restart. |
| `correctLedgerEvents` / `cancelForecast` | Explicit retained dependency/correction plan, final graph/prefix validation, fresh keys/reason; no edit/delete or refund-as-correction shortcut. |
| `recordLedgerComparison` | Pin exact scope/source/event set and compute differences, never accept client status or totals unchecked. |
| `freezeLedgerSnapshot` | Server reference closure, applicability/cutoff/knowledge/total checks; gaps visibly retained; durable payload and exports plus receipt in one transaction. |
| `GET /api/finance/snapshots/{id}` | Exact immutable payload and current-input-match flags, no-store and scoped IDs. No dynamic recomputation of a historical snapshot. |
| `GET /api/finance/snapshots/{id}/export?format=json\|csv` | Allowlist format and saved artifact selector only, safe server filename, attachment disposition and nosniff, exact byte length/SHA-256 verification. No arbitrary file/URL/path. |

Preserve existing 120,000 raw request-byte cap, local Host/same-origin and JSON content-type checks. Base64 of 80,000 raw CSV bytes occupies 106,668 ASCII bytes; enforce bounded metadata and the complete JSON body cap too. Strictly validate base64 before decoding; do not pass through a text-reader that strips BOM or changes original bytes. If the envelope exceeds the cap, return actionable 413 and preserve the file, never raise a shared cap silently. Invalid input 400/422, missing scoped ID 404, conflict 409, size 413, content type 415, unreadable/corrupt storage 503. No raw financial data in logs/error traces; log bounded IDs/counts/codes. Server-only disk/hash/parser code stays outside browser imports. All text renders escaped; no imported HTML, formulas or source instructions execute.

### Export purpose and immutable bytes

JSON is the lossless original-value archive of the frozen snapshot. The display CSV is a distinct `grantpath-ledger-display-v1` schema with fixed summary/activity rows, snapshot ID/digest/cutoff/basis/provenance, exact amount strings and reconciliation/gap labels. It is **not** the input CSV schema and is rejected on reimport. Both retain negative derived balances. Do not call the CSV a sponsor report or a machine roundtrip export.

Before CSV serialization prefix **every user-controlled text cell**, including benign descriptions, IDs, category labels and refs, with literal `text:`; fixed trusted labels/enums are allowlisted and numeric cells are generated exclusively from canonical numeric grammar. Force-quote every field, double embedded quotes and emit UTF-8/CRLF. Apply the prefix before CSV encoding so embedded commas, tabs, line breaks, semicolons or fullwidth characters cannot create a fresh unprefixed cell through the supported parser. Raw text stays original in JSON. Do not use Papa's apostrophe escape as a substitute or strip a leading `text:` from imports. Test the actual viewer chosen for implementation if available; do not promise safety in every locale/application or after a user removes prefixes/edits/resaves.

At freeze, persist exact UTF-8 JSON and CSV export bytes (bounded base64/byte length/SHA-256) plus serializer/canonicalizer versions. Define `digest = SHA256(finance-json-v1(content))`; the digest and all export descriptors/bytes are outside that content. The JSON artifact envelope contains only contractVersion, snapshotId, contentDigest and content; it does not embed its own descriptor/hash or export bytes. Generate CSV from the same content, carrying contentDigest in its fixed metadata rows, then store both descriptors/hashes outside content. This avoids both snapshot/export and artifact-self-hash cycles. Exporting the same snapshot twice returns the same verified saved bytes after later edits, restart or serializer upgrade. Missing/corrupt bytes fail visibly; never regenerate with a newer serializer and claim identity. No public links, remote upload or financial transmission follows from a download.

## 11. Migration, concurrency, recovery and capacity

Integrate only after parent supplies actual checked predecessor commits and exclusive shared-file lease. Inspect 02/03/04/05 schema, source retention, mutation receipts and reference/reset behavior. Allocate the next migration from that integrated schema, with new empty finance collections and no promoted Number amounts. Validate pre-migration data and retain an exclusive byte-identical original backup before atomic write. Refuse unknown/newer schema and corrupt graphs without resetting. Retain every previous proposal/vault/resubmission/review/award snapshot and artifact; no broad schema replacement.

Single-user/single-process local storage remains the deployment boundary. All commands check expected ledger/workspace revisions and explicit relevant term/budget/mapping refs. Matching durable receipt recovery precedes global revision rejection; semantic transaction key checks then prevent a different operation from reposting. A stale import/correction/amendment returns 409 with all client input intact; do not auto-rebase money, mapping or settlement decisions. A changed unrelated workspace revision can require refresh/repreview but never silent retry of a financial write. Same-operation changed payload is always conflict.

Source/batch/events/corrections/selected head/snapshot/export bytes/receipt commit together through the repository atomic write. Before acknowledgement, run schema + full graph + effective-prefix + total/capacity checks on a cloned candidate. On failure expose neither success receipt nor partial events. Simulated response loss must recover the saved result. Crash around rename leaves either old or complete new workspace; application startup marks invalid/missing source/artifact state explicitly, never fabricates a successful import. Cleanup only orphan temp data proven unreferenced; do not touch backups or another task's data/processes.

Proposed initial engineering bounds per ledger: 200 budget lines/version; 24 retained period refs; 30 budget versions; 2,000 economic events plus 2,000 cancellation/audit events; 50 retained import sources/batches of <=200 rows each (lifetime event cap still applies); 50 snapshots; 50 source-comparison revisions; descriptions <=500 characters, correction/review notes <=2,000 characters, at most 10 optional receipt refs/event in UI (CSV v1 has one). Check before mutation and return visible capacity errors; never evict cited history or forget duplicate keys/receipts. These limits are engineering proposals, not sponsor limits.

Bound canonical snapshot content to **2 MB**, each saved export to **3 MB**, source raw bytes to **80 KB**, and aggregate retained finance serialization per workspace to **32 MB** including base64/export duplication. Enforce both per-item and aggregate serialized UTF-8 bounds before write; a repeated freeze can hit workspace capacity before 50 snapshots. Show reduction/archive/new-scope options without deleting referenced records. At this cap, benchmark read/preview/freeze latency before claiming performance; large institutions, multi-process storage and retention beyond these bounds require another storage design. A rejected capacity operation preserves the last good workspace and all editors.

## 12. Required future acceptance and failure fixtures

These are later implementation tests, **not executed by this research**. Use synthetic records, fixed clock/date basis, temporary isolated data and no external API calls. Cover substantive invariants rather than tests mirroring trivial implementation details.

| ID | Fixture/action | Required exact evidence |
| --- | --- | --- |
| 06-T01 Money | 0.10 + 0.20; 0.1 vs 0.10; zero/unknown; negative zero, exponent, symbol/comma, fractional cent and 19-digit cents | Exact `30`; equivalent canonical hashes; distinct zero/unknown; invalid forms rejected without posting. |
| 06-T02 Bounds/rate | Max input, many lifetime events, aggregate/product beyond Number safe range, 24-digit output overflow; two 5-cent eligible lines at 10% | BigInt exact intermediates; aggregate indirect `1` cent; no line-round `2`; output/capacity overflow rejects whole command. |
| 06-T03 Basis | Paid expense, unpaid commitment/invoice, unapplied vendor credit, future forecast | Only settled paid costs/reductions enter S; C/F remain separate; no inferred accrual/allowability. |
| 06-T04 Demo | §7 rows, duplicate E01/full file, refund, final settlement and amendment | All seven table totals and F estimates match; initial negative equipment balance shown; original request unchanged. |
| 06-T05 Settlement | Partial/full/overage, repeated expense, release, same-day order, stale open balance | Stored settlement exact; `open>=0`; overage explicit; reserve and paid effect atomic; no duplicate settlement. |
| 06-T06 Backdating | Jan commitment100; April settlement100; insert March linked expense; later releases/refunds | Any invalid effective prefix rejects; April stored settlement never changes; input retained with explicit correction action. |
| 06-T07 Reductions | Refund/credit less/equal/more than original expense; duplicate; before expense; different award/category; refund of a settled expense; P2 refund of P1 expense with no P2 gross | Capacity/date/ownership rules; exact reduction; P2 net can be negative; no A increase or commitment reopening; unapplied credit not S. |
| 06-T08 Corrections | Cancel linked expense/refund/commitment with live dependencies; final atomic dependency chain + replacement; retry; reverse cancellation | Dependency rejection or valid final graph; exact settlement restoration; fresh keys; no reversal-of-reversal/reused key; old snapshot unchanged. |
| 06-T09 Semantic duplicates | Same keys new filename/order/op ID; 1.0 vs1.00; changed description/amount/period; same key twice; identical values under distinct keys; old cancelled key reimport | No second event; changed key payload conflict; within-file duplicate rejected; legitimate distinct keys not erased; cancelled effect not resurrected. |
| 06-T10 CSV parser | UTF-8 BOM, emoji, commas/doubled quotes/multiline; malformed quotes, invalid encoding/NUL, duplicate/unknown/reordered headers, spaces-only row, extra field | Exact row provenance/values, no auto-renamed headers/dynamic typing, structural failures reject whole batch and preserve source. |
| 06-T11 Partial failure | One bad currency/period/link in otherwise valid batch; forward ref; 201 records or >80KB; malformed base64 or envelope >120KB | Every rejected row visible, no partial events/receipt; correct limits/status; buffers survive. |
| 06-T12 Budgets | Requested1200, approved total1200, obligated1000; known current action200 but cumulative unknown; anticipated5000; allocation gaps | A stays1000 or unknown as supported; no action sum/anticipated/default; exact local distribution+Unallocated, missing cells unknown. |
| 06-T13 Amendments | Deobligation, no-cost date extension, future/pending head, correction same action, stale expected head | New reviewed versions only; no replay funding; actuals/history retained; possible negative R shown; stale availability disclosed. |
| 06-T14 Periods | Assigned mismatch, P2 expense settles P1 commitment, changed period ID, out-of-award paid date, leap day and midnight zone | Correct own/origin periods, no double count/carry-forward claim, unassigned totals visible, stable dates and old mappings. |
| 06-T15 Negative balances | A1000, C1300; alternatively S1350 after A1200 | R=`-30000` or `-15000` cents, no clamp. Known zero and missing allocation stay different. |
| 06-T16 Cutoff | Opening100 + period250 = closing350; future event; late entry; future-effective budget against earlier cutoff | Exact opening/activity/closing and separate C movements; frozen knowledge axis; reject misapplied head; new restated snapshot, old unchanged. |
| 06-T17 Comparison | None supplied, synthetic matching source, basis/currency/cutoff mismatch, unmatched/rejected rows, later edit | Unreconciled by default; match only exact selected scope/item coverage; differences visible; old comparison retained, current invalidated; no certification. |
| 06-T18 Receipt concurrency | Lost success response, intervening mutation, changed payload same operation ID with false client hash, two confirms on same key | Matching original result recovered before revision check; changed payload409; only one financial write. |
| 06-T19 Storage/migration | Actual integrated predecessors, missing initial file vs missing source, bad digest/newer schema, write/sync/rename failure, restart | Backups exact; preserved records/artifacts; previous-or-complete write; no fixture reset; same histories/keys/totals after restart. |
| 06-T20 References/reset | Foreign source/vault receipt, missing historical version, demo event cited by researcher snapshot, archive/capacity | Scoped graph rejection; reset refuses/preserves closure; no silent history/key eviction. |
| 06-T21 Export safety/identity | =,+,-,@, controls/whitespace/fullwidth starts, delimiter/quote/newline injection, negative numeric balance; export twice/after upgrade | All arbitrary CSV text starts literal text: inside correctly quoted cells; raw JSON unchanged; numeric grammar strict; same saved bytes/hash; display CSV rejected on import. |
| 06-T22 UI/review | Keyboard/narrow viewport, failed/stale preview, partial settlement/refund/amendment/snapshot, actual restart | No lost dirty/file input, honest synthetic/basis/gap labels, readable history, no uncaught console errors; health identifies final owned build. |

## 13. Later implementation tickets, ownership and verification handoff

Parent assigns exact checked base, exclusive shared-file lease, branch/checkouts and free ports. Human owner remains the requesting user. Separate concurrent writers require isolated checkouts and exact exclusive files; read-only reviewers need no write scope. Do not edit central `OWNERSHIP/TASK_CARD/ORCHESTRATION/API/STATUS/ROADMAP`, root instructions, manifests or migrations without that lease.

| Ticket | Exclusive proposed scope | Exit gate |
| --- | --- | --- |
| F06-1 Exact domain and contract | Domain writer: new `lib/finance/money.ts`, `schema.ts`, `canonical.ts`, `budgets.ts`, `projector.ts`, `integrity.ts`; matching `tests/finance/core*` | Export closed schemas and independent hand arithmetic, period/prefix/settlement/correction invariants. No shared edits. |
| F06-2 Import/snapshot/export | Second isolated writer: new `lib/finance/imports.ts`, `snapshots.ts`, `comparison.ts`, `exports.ts`; matching `tests/finance/import*`, `snapshot*`, `export*` | Consume actual F06-1 exports; exact CSV/dedup/context receipts, complete frozen closure and saved export bytes. Coordinate interface ownership; no overwriting core files. |
| F06-3 UI | Isolated UI writer: new `components/finance/**` only | Budget/ledger/preview/history/snapshot views using actual types; synthetic labels, dirty recovery, negative balances and source inspection. |
| F06-4 Shared integration | Lead/steward exclusively after lease: actual schema/repository/integrity/migration/reset/workspace dispatch, `app/page.tsx`, new `app/api/finance/**`, feature scripts | Actual 05 adapter/read contract, schema allocation, receipts-before-revision, atomic writes and preserved earlier workflows. No duplicate award intake. |
| F06-5 Independent review | Read-only money/CSV and integration/failure reviewers | Attack backdating, double count, reductions, semantic keys, amendment/period scope, reset and immutable bytes; fix concrete findings. |
| F06-6 Final evidence | Lead only, assigned isolated data/ports and heavyweight slot | Required checks, migration/failure/browser/restart, final build, review health/build identity and real local URL. |

Later application verification: `npm ci`; bounded focused `tests/finance` suites; documents module README tests/example if importing its parser and extraction/AI module checks only if actually changed/used; `npm run check`; baseline/proposal and integrated 02–05 browser regressions affected by shared edits plus finance journey; applicable proposal export checks if their shared code changes; dev smoke. Ordinary tests make no external calls. Use existing GitHub Actions for repeatable deterministic checks if the parent authorizes a PR; attach any created PR, inspect actual final CI, never merge failing/superseded code.

The shared RAM-heavy slot is reserved **02 → 03 → 04** until the parent releases it. This research does no installs/build/browser/renderer; future06 heavyweight verification must be explicitly scheduled with the parent. Acceptance uses unique `.test-data` directories, synthetic sources and fixed clocks; review uses a task-specific private `.local-data/task-06-review` and parent-confirmed free ports. Do not use normal local researcher data or port3000, terminate unrelated servers, or infer a port is healthy merely because reserved.

After final code/fixes, build that exact final revision, set owned `PORT`, `GRANTPATH_DATA_DIR`, `APP_REVISION`, run **`npm run review`**, explicitly **GET `/api/health`**, and compare service, build ID, revision and instance to final `.next/BUILD_ID` and the owned server record. Exercise the actual review UI and restart using the same isolated data. Provide its working loopback review URL; build success alone does not establish a running review. A stale or unrelated server does not pass. This later gate is local review, not public deployment or sponsor acceptance.

Handoff must name actual commit(s), integrated schema, changed paths, agent ownership/results, command exits/test counts, source/fixture/live labels, migration backup/ref/concurrency/correction/restart/download evidence, real owned URL and remaining defects/skipped prerequisites. The parent starts task06 application work in a **new chat** only after completed research review under the latest human pipeline authorization. This research chat does not code or launch that implementation itself.

## 14. Demo cutline, evaluation targets and documentation evidence

Keep the full §7 mechanism ahead of optional polish: explicit requested/obligated contexts → six-row preview → repeat import skipped → refund and settled commitment → old snapshot → amendment/new snapshot → identical old downloads. A second short failure example changes E01 amount under the same key and is blocked without changing totals. That is concrete technical evidence and researcher value. Defer ERP/bank/account links, real statements/certification, salary calculators, automatic MTDC/indirect actuals, multi-currency, general import mapping, renderer expansion and AI prose. Do not silently cut exact arithmetic, duplicate safety, negative balances, corrections or immutable history.

Proposed, **unmeasured** evaluation: target zero cent mismatches against the hand table, zero duplicated accepted external keys, zero changed old snapshot/export bytes, zero implicit unknown-as-zero or paid/committed overlaps, and zero missed planted changed-key/currency/period errors. Measure preview/freeze latency at the stated caps on the actual host before claiming responsiveness. A human may time preparing the same synthetic balance manually versus this flow and count corrections under a documented method; no savings/accuracy/novelty claim is established by this plan.

Two independent read-only agents were explicitly requested as GPT-6.1 Sol / Extra High (`xhigh`), with the human's Standard/Fast off preference and no heavy checks or writes. No speed settings or UI workarounds were changed here; active service tier was not independently verified:

- `/root/official_money_csv_review`: opened current primary sponsor/accounting/technical sources, identified indirect-policy applicability traps, independently checked rate arithmetic/capacity and reviewed fixed CSV/prefixed display export semantics.
- `/root/award_code_failure_review`: inspected actual baseline and hash-validated primary05 contract; independently reviewed receipts/semantic dedup, settlement/backdating/correction graphs, approved-plan versus obligated-allocation distinction, cutoff/applicability and saved-byte exports.

Lead is sole file writer. Document-only validation on October 25, 2026 passed: six example data rows with eleven fields; all seven balance equations, two budget totals, forecast amounts, equipment variance and the independent overage/correction witness; required decision/contract/dependency/review-gate coverage; no trailing whitespace/conflict markers; Git scoped diff/whitespace check. Thirteen relative links resolve here, and the fourteenth (task05) resolves only against the explicitly disclosed primary context with the supplied SHA-256. Source/open dates and applicability limits are recorded in §3. Both independent reviewers completed a full draft and targeted reread with **no remaining blocking findings**. Their byte-boundary, hash-cycle, temporal settlement, provenance/dedup, missing-allocation and period-cutoff findings were corrected; historical-head applicability was also clarified. Exact scoped commit/file hash are supplied in the chat handoff. Documentation/source/arithmetic review is not feature acceptance.

No `npm ci`, application tests/check/build/dev/review server, browser/renderer, live AI/provider/financial API call, real import/account linking, purchase, sponsor send/certification or deployment occurred. No implemented ledger, sponsor-compliant balance or healthy local application URL is claimed by this documentation-only task.
