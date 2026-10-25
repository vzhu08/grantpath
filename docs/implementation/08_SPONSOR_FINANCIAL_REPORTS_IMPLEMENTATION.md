# 08 — Sponsor financial-report preparation: internal NSF financial-review draft

Specification v1.0 · researched October 25, 2026 · documentation only. This assignment implements no application feature, performs no application acceptance and launches no implementation chat.

## 1. Researcher outcome and settled human choices

Prepare one readable financial-review draft whose amounts can be traced to an explicitly selected, immutable ledger snapshot. The researcher can inspect opening costs, period activity, cumulative closing costs, comparison differences and missing mappings, then retain exactly what they reviewed. A later correction produces a new report; it cannot silently revise an earlier download. This connects award evidence, dated economic activity and a retained review decision, beyond a spreadsheet total or generated narrative. No time saving, financial validity or market uniqueness has been measured.

The human answered these three questions directly in task 08 chat `01a171de-3ce8-7e33-ac25-cb1711eca108` on October 25, 2026:

| Decision | Verbatim human answer |
| --- | --- |
| Sponsor/instrument and exact target | “Synthetic NSF standard-grant internal financial-review CSV v1; draft only, no official form or submission (recommended)” |
| Period and scope | “One confirmed budget period through a selected cutoff; show opening, period activity and cumulative closing from the exact ledger snapshot (recommended)” |
| Basis, comparison and actual authority | “Synthetic paid-expenses-minus-settled-reductions only; synthetic comparison statement; I prepare/review locally as product owner, with no institutional finance or certification authority claimed (recommended)” |

These answers select the synthetic internal format described below, not an official NSF form. The requesting user is the local preparer/reviewer and product/scope owner; the same person may perform both local actions. No fictional finance official, separation-of-duties claim, authenticated institutional role, signature or certification is introduced. There are **no pending consequential task 08 product questions for this synthetic scope**. Exact fixture dates and IDs below are engineering fixtures, not a real reporting election.

First release: one bundled `grantpath-nsf-internal-financial-review-csv-v1` format, one confirmed budget period through cutoff, one exact task 06 snapshot, deterministic USD cents, explicit fixed local-group mapping, the snapshot's synthetic source comparison, manual supported variance notes, immutable locally reviewed draft and saved display-CSV bytes with a separate lossless JSON evidence appendix. The JSON is an archive of the same report, not a second sponsor template.

Cuts: no SF-425 filling, ACM$/Research.gov compatibility or portal use, real accounting-policy conversion, institutional reconciliation/certification, submission, cash draw requests, bank/ERP/account connections, program-income or cost-sharing engine, tax/payroll/FX, automatic indirect charges, report-only monetary adjustments, multi-sponsor/template engine, AI generation, PDF/XLSX renderer, public deployment, scheduled jobs or roadmap 10–13. A later real-award request needs actual sponsor/instrument/template/version, scope, reporting basis, reconciliation source and authorized human finance roles before it can be specified. None is inferred from this demo.

The hackathon demonstration is October 26, 2026, with roughly 24 hours relevant at dispatch; exact cutoff and demo duration were not supplied. Favor the small complete mechanism and integration/rehearsal over extra formats.

## 2. Inspected baseline and upstream status

Lead checkout: `C:/Users/vzhu0/.codex/worktrees/9077/grantguide`; branch `research/08-financial-reports`; clean starting HEAD and local main `b4485b6730dac3585a33ebc1e1bfe739af20cc21`. Lead is sole writer of this new file and optional `docs/research/08/**`; reviewers are read-only. A scoped search found only root `AGENTS.md`. Required project brief, selected modules, quickstart, ownership, task card, orchestration, human workflow, API/status and roadmap 08 were read. Historical “08 held” and schema 2 notes in older documents are superseded only for research by the explicit dispatch and actual baseline inspection.

| Actual inspected interface | Consequence |
| --- | --- |
| [StateSchema](../../lib/schema.ts), schema 3; [status](STATUS.md) | Roadmap 01 and vault 02 are integrated. This HEAD has no award, ledger or financial-report collections/routes. Independent 03–06 work is not verified runtime here. |
| [Repository](../../lib/repository.ts), `createRepository`, `write`, `load`, `internal`, `resetDemo` | One-process serialized operations and atomic temp/sync/rename exist. Full feature graph validation, receipt-before-revision behavior and retained-data/reset coverage must be extended under the future lease. The current `internal` checks expected workspace revision before executing its callback. |
| [Vault receipts](../../lib/vault/schema.ts), [service](../../lib/vault/service.ts) | Existing receipts cover upload/parse/handoff and expire after seven days. They are not the lifetime financial/report retry contract. Inspect actual 05/06 adapters instead of guessing compatibility. |
| [HTTP](../../lib/http.ts), [workspace API](../../app/api/workspace/route.ts) | Loopback Host, cross-site rejection, same-origin JSON mutations, no-store and 120,000 raw request-byte cap remain authoritative. No hosted authorization or multi-process lock exists. |
| [Evidence](../../lib/evidence.ts), [proposal workflow](../../lib/proposals/workflow.ts), [saved artifact service](../../lib/proposals/export-service.ts) | Reuse validated historical evidence concepts and verified-byte download controls. Existing proposal canonicalization uses `localeCompare`; do not change its old digests or assume it equals the proposed finance canonicalizer. |
| Repository missing-state sentinel and `backup` | Current absence detection recognizes vault/backups/temp; backup copies workspace/vault data. Do not claim all external proposal artifacts are covered. This release proposes inline retained report bytes; verify all integrated predecessor artifact/backup closure before migration. |

Logical upstream documents are present in this checkout: [05 award context](05_AWARD_OBLIGATIONS_PROGRESS_REPORTS_IMPLEMENTATION.md), especially §5.4 `AwardFinanceContextV1`; [06 budget ledger](06_BUDGET_LEDGER_IMPLEMENTATION.md), especially **§9 in full**. Parent accepted 06 research at `a6d6b5bd5211214e01f4d8bd501e58ed6ee855fd`; Git comparison confirms that 06 document is unchanged at this HEAD. Local on-disk SHA-256: 05 `FD56E684A01E5D4C87A304DA86CD026B370E7C84C982C74A8BF58801935B2E62`; 06 `E0B5C110919272241CCFA8FE86BAA7D9CBF92B8ECCBFE8CB27A2E42A758D6DD7`. Byte hashes can differ from earlier checkout hashes because of checkout line endings; compare Git content as well as exact delivered bytes.

**Logical research prerequisites are met; runtime integration prerequisites are not.** `award-contract-v1`, `ledger-snapshot-v1`, comparison, helper types, migration and export behavior below are accepted design inputs, not actual runtime exports. Do not reimplement 05 intake, 06 economics or a new ledger inside 08. Before code integration satisfy §10 against checked exported types and observed behavior.

## 3. Opened primary sources and applicability limits

Sources were actually opened by lead and/or the independent official-source reviewer on **2026-10-25**. Source facts are separated from engineering proposals; the internal CSV layout is our design, not a copied sponsor form.

| Official source/version | Verified fact | Bounded design consequence |
| --- | --- | --- |
| [NSF PAPPG index](https://www.nsf.gov/policies/pappg), current listed 24-1 | The index lists 24-1 plus supplements effective December 8, 2025 and January 22, 2026. | Retain checked/applicable versions; a draft replacement is not automatically current policy. |
| [PAPPG 24-1 VIII.B/E](https://www.nsf.gov/policies/pappg/24-1/ch-8-financial-requirements-payments) | ACM$ replaced FFR expenditure reporting. NSF obtains final award financial data from ACM$ rather than requiring an FFR for each award. Sponsor obligations, recipient obligations and payments are distinct. | Use the selected internal-draft label; make no NSF submission/ACM$ field-fidelity claim. Local remaining is not cash on hand or a payment request. |
| [Supplement 1, NSF 26-200](https://www.nsf.gov/policies/document/pappg24-1-supplement-1), effective 2025-12-08; [Supplement 2, NSF 26-202](https://www.nsf.gov/policies/document/pappg24-1-supplement-2), effective 2026-01-22 | Supplements take precedence where applicable; Supplement 1 revises remittance provisions. | Recheck applicable award conditions before real use; do not reproduce old payment instructions. No remittance functionality is built. |
| [NSF conditions index](https://www.nsf.gov/awards/terms-conditions), includes GC-1 July 31, 2026 | Notice identifies applicable conditions; current versions have effective-date scope. | Pin evidence of incorporation, not the newest webpage by default. July 2026 GC-1 body was not verified in this pass. |
| [Grants.gov SF-425 v3.0 instructions](https://apply07.grants.gov/apply/forms/instructions/SF425_3_0-V3.0-Instructions.pdf), five pages, OMB 4040-0014, expires 2028-06-30 | Separate fields cover federal cash, authorized funds, expenditures, unliquidated obligations, recipient share, program income, indirect expense and an authorized certifying official. | Paid invoices and local commitments cannot supply all those meanings. No blank-to-zero defaults or official-form claim. Form-level optionality is not agency permission to omit facts. |
| [2 CFR 200.1](https://www.ecfr.gov/current/title-2/section-200.1), expenditures/obligations definitions | Cash/accrual expenditure definitions cover facts beyond ordinary paid invoices; obligations and advances have separate meanings. | Name our exact paid-cost basis. Do not relabel it cash/GAAP/accrual accounting or convert commitments into sponsor unliquidated obligations. |
| [2 CFR 200.302](https://www.ecfr.gov/current/title-2/subtitle-A/chapter-II/part-200/subpart-D/section-200.302) | Financial management requires supported award records, financial disclosure and budget comparison. | Preserve source/version, scope and differences; local arithmetic does not establish compliant books. |
| [2 CFR 200.415](https://www.ecfr.gov/current/title-2/section-200.415) | Required financial certification is by an official authorized to legally bind the recipient. | Local product-owner review supplies no certification authority. No copied attestation/signature block. |
| [2 CFR 200.334](https://www.ecfr.gov/current/title-2/subtitle-A/chapter-II/part-200/subpart-D/section-200.334) | Retention has event-based periods and exceptions. | Do not implement a timer deleting evidence after three years or claim this bounded local app meets institutional retention policy. |

eCFR displayed Title 2 current through **October 22, 2026**, last amended August 17, 2026; this is the source's currency limit, not verification through October 25. The Grants.gov index's dynamic form table was absent in retrieved content. [SF-425 form PDF](https://apply07.grants.gov/apply/forms/sample/SF425_3_0-V3.0.pdf) exposed only an Adobe Reader compatibility wrapper to the reviewer; version/expiry/field facts above come from the separately readable official instructions. Linked NSF current conditions/FAQ PDFs and the Program Income worksheet download were unavailable to the reviewer. No exact form layout or unavailable body is certified by this research.

The reviewer also opened the [Research.gov Program Income instructions](https://www.research.gov/research-web/content/programincome): program-income-specific facts are required; paid expenses/refunds do not establish zero income. This report does not implement that worksheet. No real notice, institutional statement, accounting policy, indirect-rate agreement or official finance authority was supplied. Preserve “not collected / outside this internal format” for sponsor cash, recipient share, program income and actual rate certification; do not imply “none.”

## 4. Smallest workflow and visible UI

1. Within the selected application's Award/Budget area, open **Financial-review draft**. Show **Synthetic NSF standard-grant internal financial-review CSV v1**, **Draft only — no official form or submission**, and the paid-cost basis before amounts.
2. Select one exact saved ledger snapshot by ID/digest. Show award number/identity, confirmed budget period/range, cutoff, knowledge-through ledger revision, captured/as-of dates, terms/budget versions and source label. Require the checked upstream adapter to verify synthetic/demo provenance for the selected award/ledger financial records and comparison evidence; reject researcher or mixed financial records rather than relabel them synthetic. Official policy evidence retains its own source provenance. Reject another award/project, unsupported contract or invalid digest. If none exists, offer the actual 06 snapshot workflow; never create an unlabeled simulated report.
3. Show opening cumulative paid costs, period gross/reductions/net, cumulative closing, separate open commitments/forecasts and obligated-funding context. Expand a line to its frozen contributing event IDs, source rows and cancellation history. A positive balance is no approval to spend.
4. Review the fixed local-group mapping and comparison. The human-selected synthetic statement is created/compared through 06, with itemized coverage and exact differences; 08 inherits its frozen result. Show **Synthetic comparison statement** alongside `Unreconciled`, `Differences` or **Matches selected synthetic source**. A missing source is still usable as an explicitly gapped draft, never a match.
5. Add optional short variance/review notes tied to exact report lines/events/gaps. Unsupported proposed monetary adjustments stay nonposting issues. To correct money, go to 06, append the supported event/correction, repeat comparison and create/select a new snapshot. No editable computed-total cell exists.
6. Save an immutable draft revision; review that exact revision's scope, mapping, comparison and notes. Choose **Save locally reviewed draft** with a local actor label, acknowledgment of displayed gaps and a note. Display **Local product-owner review; no institutional finance or certification authority claimed**. Review does not clear discrepancies.
7. Download retained CSV and separate JSON evidence appendix. Reopen after restart and download the same bytes. A new ledger head or amendment shows **Newer financial inputs exist**; the historical snapshot/review remains readable. Explicitly selecting a newer snapshot appends a draft revision and requires fresh review.

Use the existing application layout and dirty-editor patterns. One panel with scope/totals, expandable trace and review/history is sufficient. Preserve selection and unsaved notes on 409/navigation; do not auto-rebase financial context. At 390 px and with keyboard use, labels, negative numbers, missing values and source links must remain readable. No second dashboard or onboarding flow.

## 5. Deterministic basis, cutoff and mapping

Consume 06 `basis='paid_expenses_net_settled_reductions'`, `currency='USD'`, `scale=2`, `applicabilityMode='as_of_budget'`. Money uses canonical integer strings/BigInt only: 18-digit input magnitude and 24-digit derived magnitude bounds inherited from 06; zero differs from unknown, negative signed period net/remaining is retained, no `Number`, `parseFloat`, `toFixed` or floating arithmetic.08 sums/validates inherited line components but never changes stored settlements or reprojects a different economic history.

The selected snapshot must carry one exact confirmed period `[Pstart,Pend]` and `Pstart <= cutoff D <= Pend`, `D <= server asOfDate`, `dateBasis='America/New_York'`. Take opening before Pstart, activity in `[Pstart,D]`, cumulative closing through D and knowledge-through revision directly from the frozen contract. Editing period/cutoff selects a newly validated 06 snapshot; do not filter an existing snapshot client-side, fabricate opening totals or support arbitrary date ranges. A late-entered or corrected pre-cutoff event requires a new restated snapshot/review, retaining recorded time and economic date separately.

Selected terms/budget must be reviewed applicable on/before D. A later effective budget cannot silently be applied to an older cutoff. Retained ancestor selection must obey 06 lineage/applicability guards; a reason cannot bypass a selected applicable successor. Unresolved applicability stays a gap.08 does not add the optional “activity compared with selected later budget” mode.

| Quantity | Deterministic meaning and label |
| --- | --- |
| Each paid triple | `net = gross expenses - settled reductions`; `opening + period = closing` independently for gross, reductions and signed net. Refunds in a later period may make that period's net negative. |
| Award closing remaining | `R = confirmed cumulative obligation A - award cumulative net paid S - all award open commitments C`. Never subtract only selected-period activity from A. IfA is unknown, R stays unknown. Label **Local remaining after open commitments**. |
| Commitment movement | Inherit opening/increases/stored settlements/releases/closing and both origin-period and paid-period dimensions; each economic effect counted once. Open commitments are not paid costs or a sponsor-form obligation determination. |
| Forecast | Separate selection/horizon and amount. Never enters paid, comparison-to-paid orR. Optional after-forecast estimate uses 06's explicitly labeled value; no new forecast calculator. |
| Requested/approved/local allocation | Preserve all three roles. Original request is historical; approved total-project plan may exceed obligated A. Only the exact reviewed local allocation supplies local row remaining, with Unallocated retained. Missing category allocation means unknown row remaining. |
| Indirect | Show only exact posted paid indirect events as actuals. A synthetic 10% planning assumption is separately labeled and never multiplied into report actuals. |

Bundle fixed mapping manifest `nsf-internal-local-groups-v1`: `personnel→personnel`, `equipment→equipment`, `other→other`, `indirect→indirect`. These are local groups, not official NSF/SF-425 categories. Human confirms that exact manifest against the selected snapshot; no splitting/percent allocation or arbitrary mapping wizard. Pin manifest version/digest and the source category/mapping versions in the report revision. A new manifest creates a new report revision, never reinterprets an old export.

Coverage is dimension-aware: historical and unassigned period flags stay attached to their group rows; **Unallocated** is an allocation-only bucket, never an invented expense category. An explicitly supported upstream unresolved-classification variant, if one exists in the checked contract, stays visibly unmapped with preserved amounts. An unsupported group enum is an integrity rejection; the four-group v1 does not admit arbitrary legacy codes or require another category. Every inherited included active paid expense/reduction through cutoff D has exactly one posting contribution in the award cumulative trace and one applicable opening-or-period bucket. Closing/net/subtotal lines reference those components rather than post the event again. A prior-period parent may appear as context for a current refund without reposting its cost. Already-known paid events after D remain excluded context with their frozen reasons and zero report effect. Commitment/forecast rows have separate trace sets. Cancelled records appear in audit/exclusions and never in active economic totals. All included historical/unassigned costs remain in award totals; period membership follows frozen dates, not omission from a current mapping. Missing/duplicated trace coverage or mismatched component sums is an integrity failure; supported unresolved classification is a disclosed gap with preserved amounts.

Exact category rows show gross/reductions/net and comparison values, not a single total hiding offsetting errors. Show award cumulative totals separately from selected-period group detail. Row remaining sums to award R only if the allocation/mapping is complete; otherwise show the reason it cannot be reconciled. No percentage variance is needed. A deterministic note may say “Local equipment allocation 250.00; closing net paid 250.00; remaining 0.00,” with exact refs. A human's explanation of cause is labeled local/unverified unless supported; it cannot modify numbers or certify allowability.

## 6. Comparison, gaps and adjustment bounds

Reuse the frozen `LedgerComparisonV1`: `not_provided`, `differences`, `matched_local_source`; exact `finance-view-input-v1` digest, source ID/version/hash/label, supplied scope/basis/USD/cutoff, opening/activity/closing gross/reduction/net, row matches, unmatched/rejected/duplicate items, actor/time/note and exact differences. The report displays that inherited state and never stores a free-form `reconciled=true`.

For the selected demo, comparison evidence is **synthetic**, separately defined and labeled. It is not independent institutional verification.06 performs comparison; 08 verifies digest/scope/currency/basis/cutoff and itemized coverage and records its frozen result. Equal net totals alone cannot establish a match when gross/reduction totals, rows or scope differ. Basis mismatch is `differences / basis_mismatch`, never converted automatically. Missing statement is `not_provided`; missing category/period data, unsupported adjustments, missing receipts and unknown funding stay distinct gap codes. Source matching and receipt availability are different checks.

A report/review/snapshot/export/receipt-only mutation must not change 06's financial-input digest or spuriously invalidate comparison. Economic/context changes do change it. For a newer ledger revision, show the current mismatch separately; do not replace the old report's frozen comparison or relabel its historical source match. Frozen reports may retain differences and be **Locally reviewed draft with gaps**. There is no sponsor-ready/institutionally-reconciled state.

No 08 command posts money or supplies an adjustment amount used in totals. An adjustment request stores only explanatory text, a reason, affected exact line/event refs and optional evidence; `effect='none'`, `resolution='open'|'superseded_by_ledger_snapshot'`. Supported corrections/refunds/credits are task 06 events/correction chains; report content retains their IDs/digests and restatement notes. New evidence/snapshot can resolve a new revision's issue, not edit the prior issue history. An unsupported adjustment never balances the report, and an ordinary refund never becomes an award increase or commitment reopening.

AI is deferred. Any later separately authorized explanation adapter may only describe verified frozen variances with support refs; it cannot calculate authoritative amounts, propose hidden balancing entries, choose accounting policy, invent explanations or certify output.

## 7. Proposed logical records and exact reference contract

Names here are proposals under a distinct `state.financialReports` namespace, finalized against actual 05/06 code. No change to their logical contracts is required for research. Runtime schemas must close every helper; no `any`, floating latest reference, number-valued money or unknown-as-null/zero.

```ts
type FinancialReportRevisionV1 = {
  contractVersion: 'financial-review-revision-v1';
  id: string; reportId: string; ordinal: number;
  awardId: string; applicationId: string; projectId: string;
  templateRef: ExactBundledTemplateRef;
  ledgerSnapshotRef: { contractVersion: 'ledger-snapshot-v1'; id: string; digest: string };
  mappingRef: ExactBundledMappingRef;
  comparisonInputDigest: string;
  notes: readonly SupportedLocalNote[];
  issues: readonly NonpostingIssue[];
  derivedLines: readonly ExactReportLine[];
  gaps: readonly ReportGap[];
  provenance: 'demo';
  createdBy: LocalActor; createdAt: string;
  inputDigest: string; // defined immutable input payload, not this whole record
};
type FinancialReviewSnapshotV1 = {
  contractVersion: 'financial-review-snapshot-v1';
  snapshotId: string; contentDigest: string;
  content: FinancialReviewContentV1;
  exports: readonly SavedReportExport[]; // bytes/descriptors outside content digest
};
```

`Report` holds stable ID/immutable award/application/project binding, append-only revision IDs, explicit current revision and archived flag. `FinancialReviewContentV1` contains exact selected revision payload, copied template/mapping manifests, **embedded verified ledger snapshot content with its original ID/digest/contract version**, upstream export descriptors/retention refs, derived lines/trace membership, comparison, gaps/exclusions, notes/issues, review identity/time/note/acknowledgments and `authority='local_product_owner_only'`. No source closure depends on mutable latest lookups. Its embedded 06 content retains the full selected award terms/facts/origin/source text, budget/mappings, events/cancellations/import rows/receipts and formulas required by 06 §9. Retain referenced upstream saved bytes through normal retention; report JSON need not base64-copy those artifacts again.

Close helpers as follows:

- `ExactBundledTemplateRef`/`ExactBundledMappingRef`: stable ID, version, SHA-256, scope and copied immutable payload. No user-selected URL execution or automatic remote update. Store policy/source checked dates separately from any actual award applicability.
- `ExactReportLine`: stable schema line code; scope (`opening`, `period`, `closing`, `award_context`, `commitment`, `forecast`, `comparison`); group/period/flags; discriminated known cents or unknown reason; quantity/formula version; ordered exact event/component/source refs. `gross`, `reductions`, `net` are separate codes. Sort by fixed schema order, group code, exact period ID and event ordinal; no locale-sensitive order.
- `SupportedLocalNote`: ID, bounded text, line/event/gap refs in this revision, evidence refs or explicit `support='local_unverified'`, actor/time. It does not become a computed amount. Text is escaped and amounts in narrative do not override line values.
- `ReportGap`: code, affected exact refs, reason and preserved known/unknown data; distinction among integrity failure (block), unresolved classification/source difference (retain) and outside-format information. A missing required reference is never downgraded to a warning.
- `LocalActor`: human-entered bounded label and role `product_owner`; not authenticated institution identity. Review explicitly acknowledges every current gap code/ref set and the internal draft-only/basis/synthetic-comparison labels. The review result is `locally_reviewed_draft` or `locally_reviewed_draft_with_gaps`.
- `SavedReportExport`: allowlisted format, serializer version, UTF-8 byte length, SHA-256, strict bounded base64 bytes, safe filename/media type. No filesystem path supplied by clients. Preserve both artifacts for every retained review snapshot.

Use 06's actual checked `finance-json-v1` canonicalizer if its ordinal Unicode key ordering/JSON omission rules match the contract; otherwise a separately versioned equivalent scoped to 08. No modification of existing packet hashes. Define revision `inputDigest` over exact template/mapping/snapshot refs plus immutable notes/issues and provenance, excluding derived lines, reviews, receipts, mutable heads and the digest itself; recompute derived lines deterministically. Define snapshot `contentDigest=SHA256(canonical(content))`, excluding own digest/descriptors/bytes. JSON artifact envelope is only `{contractVersion,snapshotId,contentDigest,content}`. CSV carries the same contentDigest; neither artifact embeds its own hash. Avoid snapshot↔comparison and artifact self-hash cycles. Content hashes detect accidental corruption; they are not an institutional signature or protection against a local operator rewriting files.

## 8. Commands, API, immutable exports and security

All routes/commands are proposed, not existing endpoints. Reuse the checked repository mutation queue and actual 05/06 receipt adapter; no parallel financial store or scheduler.

| Command/route | Required behavior |
| --- | --- |
| `POST /api/financial-reports/preview` | Bounded same-origin JSON with award ID, exact ledger snapshot ref, template/mapping refs and notes/issues. Server loads/validates canonical retained context and derives lines/gaps/inputDigest. No posted financial/report state. |
| `saveFinancialReportRevision` | Expected workspace/report revision/current revision plus operation ID and exact preview inputs/digest. Recompute, validate ownership/coverage and append immutable revision; no client-authoritative totals. Create stable report on first save. Same snapshot may intentionally support multiple documented drafts; no accidental retry duplicates. |
| `freezeFinancialReview` | Exact current revision ID/inputDigest, expected revisions, review label/note/gap acknowledgment and operation ID. Revalidate retained snapshot, graph, byte integrity, sums, mapping, comparison and current context flags; atomically save reviewed content, exact CSV/JSON bytes and receipt or none. |
| `archiveFinancialReport` | Append archival decision/hide editing; retain every revision/snapshot/artifact/ref. No delete endpoint. |
| `GET /api/financial-reports/{reportId}/snapshots/{snapshotId}` | Scoped immutable content plus separately derived current-input status. Historical content never recomputed from current ledger. |
| `GET .../export?format=csv\|json` | Serve the selected saved verified bytes only; safe server filename, attachment, no-store/nosniff, loopback/cross-site guards. No arbitrary path, URL, unscoped ID or silent regeneration. |

Each mutation's server-computed request hash includes command, target IDs, exact revision/head refs, content/notes/issues, preview fingerprint, confirmations/gap sets and semantic dates; exclude only operation ID, outer workspace expectedRevision and transport timestamps. After strict schema/scope validation, recover matching durable receipt **before revision/current-head rejection**. Same operation/hash returns original saved IDs/result without a second write or revision bump; same operation/different hash conflicts 409 regardless of supplied client hash. Persist receipts with results, no financial-history receipt eviction. New operations check all expected revisions and relevant refs. A lost response after later edits must recover the original result; no hidden rebase or auto-confirm.

Current financial-input match is separate from frozen identity. Saving/freezing against an older retained snapshot requires explicit historical-snapshot acknowledgment and a note; it can only be labeled historical. Current mismatch is recomputed on preview/freeze/load from the actual 06 current-input projection, never from global workspace revision alone. An unrelated report/receipt mutation cannot make money stale. If actual 06 cannot supply that projection, currentness is **Unknown**, not “matches”; resolve adapter semantics before claiming currentness in acceptance. Invalid/missing embedded payload/digest/graph blocks freeze regardless of acknowledgment.

The sole CSV template is a fixed rectangular **display report**, UTF-8 without BOM, comma/doubled-quote quoting, CRLF and all fields quoted. Exact ordered headers:

```csv
row_type,code,label,scope,group,period_id,amount_usd,value_state,reference,note
```

Rows occur in fixed sections: metadata/limitations, award/budget context, opening/period/closing paid detail, separate commitment/forecast, comparison details, gaps/issues/review notes, trace. `amount_usd` is a server-generated signed two-decimal string for known cents, blank only when `value_state='unknown'|'not_applicable'`; unknown reason is retained. Never use blank/0 interchangeably. Trace rows identify exact event/component refs and their scope; detail/subtotals are explicitly coded to prevent treating all rows as additive transactions. Metadata includes report/review revision, snapshot IDs/digests, period, cutoff, economic/knowledge axes, basis, synthetic label, mapping/template versions, comparison status and review authority. The fixed ten columns apply to every section. It is neither input 06 CSV nor a portal import and must be rejected by 06's import header rules.

Prefix every user-controlled text cell with literal `text:` **before** CSV quoting, including labels/IDs/refs/notes and strings that already start `text:`. Fixed trusted codes/enums are allowlisted; only canonical generated money uses numeric cells. Preserve original text in JSON. Test commas/quotes/newlines/tabs/formula prefixes/fullwidth characters; quoting alone is insufficient. Make no universal spreadsheet/resave safety claim. Reuse the human-selected 06 display-prefix convention; no raw formula-capable spreadsheet export.

At freeze serialize and save exact UTF-8 CSV and JSON bytes, descriptors and versions outside content digest, inline base64 with the atomic workspace transaction. Reads verify strict decode, length and SHA-256. Repeated download remains byte-identical after later edits, restart or serializer upgrade. Missing/corrupt bytes yield actionable failure; never rerender using current code and claim original identity. Both downloads always say internal draft and synthetic comparison. No public link/upload/send follows from download.

Keep the 120,000-byte JSON body limit, same-origin Content-Type checks, server-only hashing/storage and escaped text. Fetch no source URL, execute no imported instructions, expose no raw paths or private financial text in logs. Log bounded IDs/codes/counts only. Invalid input 400/422, scoped absence 404, conflict 409, size 413, content type 415, preserved unreadable storage 503. No credentials/accounts/providers required; no change to task 04 access or existing manual workflows.

## 9. Storage, failure recovery and bounded retention

Proposed initial caps per award: 10 report records, 50 total draft revisions and 20 reviewed snapshots; 20 notes/issues per revision, each <= 2,000 characters; local actor label <= 100 characters. Use upstream 06 event/source caps without lowering them invisibly. Bound canonical reviewed content to 3 MB and each export to 4 MB; aggregate serialized 08 namespace including base64/history <=32 MB/workspace, accounted separately from 06's 32 MB and existing workspace data. Check the full serialized candidate and request byte limits before commit; report actual host behavior before claiming performance. Repeated freezes may reach capacity early. Reject visibly with all buffers/last state preserved; never truncate or evict evidence, duplicate keys, receipts or earlier artifacts. These are engineering limits, not sponsor rules.

Immutable byte artifacts are inline in this proposal, keeping report commit/backup atomic. If actual integrated storage requires external artifacts instead, settle verified atomic publication/descriptor commit, missing-metadata sentinel, full backup/restore and orphan-cleanup behavior with parent before changing this design; do not silently introduce another store. No purge or retention timer. Archive does not free retained capacity.

| Failure | Required recovery/result |
| --- | --- |
|05/06 contract unavailable, unsupported version or foreign award/project | No fixture fallback. Preserve inputs and show exact missing prerequisite; reject foreign payloads. |
|Bad snapshot digest, missing historical source/event, duplicate coverage or arithmetic mismatch | Integrity error; block save/freeze/download as appropriate, preserve data/bytes for diagnosis. Do not create a successful receipt. |
|Unmapped/unassigned activity, unknown funding/allocation, missing receipts or comparison differences | Amounts remain visible; affected labels/gaps persist in review and exports. No auto-zero, drop or green reconciliation. |
|New paid activity, amendment or comparison source after preview | Preserve editor; 409 for stale write refs; explicit new/historical snapshot selection and review. Old reviewed output remains unchanged. |
|Unsupported requested adjustment | Nonposting issue; excluded from amounts; resolve only through 06 supported correction/new snapshot. |
|Write/sync/rename failure or crash near commit | Previous complete state or complete report+bytes+receipt; no partial review/export. Retry same operation recovers exactly after restart. |
|Corrupt/newer schema, missing metadata beside retained data or missing artifacts | Preserve originals and backups; fail closed, never initialize synthetic workspace over retained data. Restore matching data/metadata together. |
|Archive/reset or upstream source deletion would orphan a retained report | Refuse or preserve transitive closure including upstream snapshot/bytes; no cascade deletion. |
|Output too large, invalid encoding or download digest mismatch | Actionable bounds/integrity error; retain editor and original bytes, no silent shortening/regeneration. |

Every successful write and load validates typed schema plus full current/historical graph, ownership, exact source/period identities, digest/formula/coverage, revision lineage and saved-byte integrity. Extend actual integrated reset/backup/retention closure for report→ledger snapshot→award/budget/source/event/artifact dependencies. No lock/revision token is represented as multi-user access control. Storage remains one user/one process on loopback.

## 10. Migration and code integration gates

Research uses the settled logical interface now; it does not wait for future runtime checks. Parent review of this completed document and direct human choices is the handoff gate for a **new** implementation chat. This research chat cannot launch that chat itself. Before 08 CODE integration, parent must provide actual checked 05/06 SHAs, actual exported closed schemas and an exclusive shared-file lease. No guessed schema number, runtime export name or passing predecessor claim.

Mandatory evidence checklist before dependent code integration:

- Actual 05 `AwardFinanceContextV1`/terms/history/origin exports: same award/application/project, exact known/unknown USD facts and cumulative funding, period identity/ranges, applicable confirmed full terms, action/correction lineage and source retention. Passing amendment/reference/restart tests; no proposal amount promotion.
- Actual 06 `LedgerSnapshotV1`/helper schemas, digest canonicalizer and retained artifact descriptors/bytes; exact accepted cents/signs, committed/paid/forecast separation, stored settlement and credit/correction invariants. Passing arithmetic, backdating/prefix, duplicate/manual-CSV-key, credit/refund, amendment, period/opening/activity/closing and historical-applicability checks.
- Checked comparison source/input-digest/coverage/currentness adapter, including report/export-only mutation invariance and basis mismatch. Synthetic statement provenance is explicit; no real reconciliation claim.
- Actual migration chain, graph-on-load/write, expected revisions, durable server-hashed receipt recovery before conflict, source/reset/archive/backup closure, storage failure/restart/snapshot and verified repeat-download checks. Retained original exports are available after restarts/upgrades.

If an interface differs, use a narrow checked adapter or bring the concrete mismatch to parent; never invent upstream values/types or edit another task's contract. A pure 08 test pass cannot satisfy these upstream gates.

With the lease, inspect latest integrated 03/04/05/06 schema; validate old workspace/graph, create an exclusive byte-identical backup, append empty 08 collections in the next monotonic migration and validate before atomic replace. Preserve every existing proposal/vault/resubmission/review/award/ledger record and frozen artifact. No auto-created report in a real workspace, no fresh demo seed during migration and no broad shared-schema replacement. Test migration at that actual predecessor revision and corrupt/unknown schema refusal. Parent remains main/integration owner; this research makes no push/PR/merge/deployment.

## 11. Meaningful future acceptance fixtures

All ordinary tests are offline synthetic fixtures with fixed clock, exact strings and unique temporary data directories. Cases below are required future acceptance, **not executed application results**.

Hand-checkable principal fixture reuses 06 §7: synthetic confirmed P1 `2026-01-01..2026-12-31`, cutoff `2026-10-25`, America/New_York, explicit knowledge revision N. E01=200.00, E02=100.00 equipment and E03=100.00 other; R01=50.00 settled reduction of E01. Opening gross/reductions/net=0; period and cumulative gross 400.00, reductions 50.00, net 350.00; equipment net 250.00 and other 100.00. Commitment 300.00 is fully settled, closing open C=0; forecast 80.00 remains separate. A=1,000.00 gives R=650.00. A separately confirmed effective/applicable amendment snapshot A=1,200.00 gives R=850.00 while the original reviewed report remains 650.00. Synthetic comparison statement itemizes the same three paid expenses and one reduction; it is separately specified fixture evidence, not a copied import renamed independent books.

| ID | Setup/action | Required proof |
| --- | --- | --- |
|08-T01 Baseline trace | Save/review principal fixture and inspect/export each amount | Exact 400/50/350 and group 250/100, R=650; each contributing event once, commitment settlement not an expense twice; forecast excluded. Identical exact inputs give identical projection/inputDigest. A new review's identity/time legitimately changes contentDigest; repeated download of one saved review does not. |
|08-T02 Nonzero opening/negative period | Independent fixture P1 ends 2026-09-30; P2 begins 10-01; Eprior 100.00 paid 09-30, Rlater 20.00 settled 10-02, cutoff 10-25 | P2 opening 100.00; period gross 0/reductions 20/net-20; closing 80.00; exact opening + period = closing by component. Parent expense is context only, no second posting. |
|08-T03 Cross-period settlement | P1 commitment 300; P2 expense 120 stores settlement 120; no other effect | P2 paid 120 once, commitment-origin open 180; separate origin/payment dimensions. No cash/share/sponsor carry-forward assertion. |
|08-T04 Mapping coverage | Include historical/unassigned paid records and unallocated funds; try unknown group enum and dropped/duplicated trace row; exercise unresolved-classification variant only if explicitly supported upstream | Included award totals preserve all; explicit gap rows, allocation-only Unallocated; no catch-all other. Unknown enum/integrity mismatch blocks; supported classification gaps remain reviewable without expanding 06. |
|08-T05 Unknown/negative | Unknown A, missing group allocation, known zero, A=100/S=150/C=0, reduction exceeds current-period gross | R unknown vs known 0 distinct; negative R=-50 retained; missing group remaining unknown; signed period net retained. JSON money strings only. |
|08-T06 Comparison | Matching synthetic source; same net but gross/reduction mismatch; missing/unmatched row; duplicate/reversed row; wrong currency/basis/cutoff | Only exact scoped/itemized match shown as selected synthetic source match; every other case remains differences/unreconciled with reasons. Review never clears gaps. |
|08-T07 Financial-input invariance | Save report/review/export/receipt then add economic entry or replace comparison evidence | First actions do not change 06 financial-input digest/comparison applicability; economic/source change does. Global revision alone is not staleness. |
|08-T08 Cutoff/applicability | Edit period/cutoff, future cutoff, later-effective budget, retained ancestor bypass, unselected/future amendment | New validated snapshot required; future/invalid scope rejected; applicable successor cannot be bypassed by note; unresolved applicability disclosed. |
|08-T09 Restatement/history | Freeze then late-enter pre-cutoff expense/correction; choose new snapshot | New knowledge revision/report review, explicit restatement, old contentDigest/CSV/JSON unchanged after refresh/restart. Original requested context unchanged. |
|08-T10 Adjustment/indirect | Ask to add unsupported 25.00; change synthetic 10% planning assumption; unpaid vendor credit; actual posted indirect 5.00 | Unsupported adjustment excluded/nonposting; planning/unapplied credit do not change paid totals; only actual supported paid event contributes 5.00. No inferred accounting basis. |
|08-T11 Review/currentness | Change notes/snapshot/mapping after review; select historic snapshot while newer financial inputs exist | New revision loses current review; old review intact. Historical acknowledgment required; CurrentnessUnknown never advertised as match. Product-owner review never becomes certification. |
|08-T12 Receipt/concurrency | Two freezes, response lost after success, intervening mutation, same operation ID changed note with forged client hash | Matching receipt recovers original IDs/bytes before stale check without duplicate history; changed payload 409; new stale operation 409 preserves buffers. |
|08-T13 Integrity/ownership | Foreign project/award snapshot/ref; forged digest/unknown contract; missing transitive source/cancel target; invalid graph on load | Explicit rejection, no mutable latest fallback or partial successful snapshot. |
|08-T14 CSV boundary | Unicode/emoji, comma/quote/newline/tab, =,+,-,@, fullwidth text, existingtext: prefix; signed generated amounts | Ten fields every logical row, quoted/prefixed user text, exact two-decimal numeric cells, original text in JSON. Input 06 rejects this display schema. No raw formula-capable export. |
|08-T15 Saved bytes | Download twice; serializer version upgrade/restart; truncate/alter byte, invalid base64/length; path/format/unscoped ID attacks | Original byte-identical artifacts/hashes when intact; fail visibly on corruption, no regeneration/path access. JSON/content hash has no circular dependency. |
|08-T16 Migration/recovery | Actual predecessor workspace; write/sync/rename failure; crash; corrupt/newer schema; missing metadata beside retained data; backup/restore | Exact backup, prior-or-complete transaction, no fixture reset; all prior artifacts/history and receipts survive. |
|08-T17 Retention/security/caps | Demo source cited by retained report; archive/reset; oversize input/history/artifacts; hostile HTML/URL; cross-origin/Host | Refuse/preserve closure; capacity precommit with buffers intact; escaped text/no fetch; local boundary enforced. No silent receipt/history expiry. |
|08-T18 Connected UI | Actual 05→06→08 journey, trace/source inspection, dirty conflict, 390 px, keyboard, process restart and old/new downloads | Genuine connected feature on final build; same reviewed results after restart; no lost edits, misleading labels or uncaught browser errors. |
|08-T19 Excluded/provenance | Snapshot knows Eearly 100 through D plus Elater 25 after D at revision N; then select researcher/mixed financial provenance under a synthetic label | Only Eearly contributes 100; Elater remains excluded with date/reason and zero effect. Synthetic selection rejects researcher/mixed financial records; no hardcoded demo relabeling. |

The fixtures test exactness/provenance and honest limits; none establishes scientific validity, allowability, financial audit, sponsor acceptance or institutional reconciliation. Evaluation targets are unmeasured: zero cent mismatches, lost/doubled active records, changed historical bytes, hidden unknowns or mislabeled comparison states in these fixtures. Measure host latency/correction counts or manual preparation time only with a recorded method before claiming improvements.

## 12. Later exclusive implementation tickets

Parent assigns actual checked base, isolated branch/checkouts, human owner/stewards, resource slot and free ports. Each concurrent writer owns only literal paths in its own checkout/branch; lead alone integrates shared files. Read-only reviewers need no write scope.

| Ticket | Exclusive proposed paths | Exit gate |
| --- | --- | --- |
|08-1 Contract/projection | `lib/financial-reports/schema.ts`, `lib/financial-reports/template.ts`, `lib/financial-reports/mapping.ts`, `lib/financial-reports/projector.ts`, `lib/financial-reports/integrity.ts`, `lib/financial-reports/upstream.ts`; `tests/financial-reports/contracts.test.ts`, `tests/financial-reports/projector.test.ts` | Closed actual 05/06 adapter types, exact coverage/sums, period/basis labels, no new ledger. Publish interface before UI/export writer. |
|08-2 Retained review/export | `lib/financial-reports/revisions.ts`, `lib/financial-reports/snapshots.ts`, `lib/financial-reports/exports.ts`; `tests/financial-reports/snapshots.test.ts`, `tests/financial-reports/exports.test.ts` | Consume 08-1; immutable review/fingerprints, same-byte saved exports, no hash cycles/unchecked totals. |
|08-3 UI | `components/financial-reports/financial-report-panel.tsx`, `components/financial-reports/report-trace.tsx`, `components/financial-reports/report-history.tsx` | Exact snapshot selection, readable scope/gaps/trace, local review, dirty 409 behavior. No global layout/styles/package edits. |
|08-4 Shared integration, lead only after lease | Existing `lib/schema.ts`, `lib/repository.ts`, `app/page.tsx`, `app/api/workspace/route.ts`; new `lib/financial-reports/migration.ts`, `app/api/financial-reports/**`, `scripts/financial-reports-*`, `tests/financial-reports/integration.test.ts` | Parent assigns exact checked registration/validation paths after inspection. Today proposal/vault validators and migrations live in their feature directories, not generic `lib/integrity.ts` or `lib/migrations.ts`; no implicit edit to predecessors. Wire mutation/receipt dispatch, monotonic migration, retention/backup/reset and actual 06 adapter. No concurrent shared writer. |
|08-5 Independent review | Read-only money/source and graph/failure reviewers | Attack hidden drop/double-count, period/snapshot substitution, comparison inflation, currentness, CSV and retained bytes. Lead fixes concrete findings. |
|08-6 Release evidence | Lead: `docs/implementation/08_SPONSOR_FINANCIAL_REPORTS_RELEASE.md` plus assigned feature tests/scripts | Full actual checks/local review handoff; propose central contract/status updates to parent, do not edit central docs without assignment. |

`AGENTS.md`, `.github/**`, `kit.project.json`, manifests/lockfile, global layout/styles and central ownership/task/orchestration/API/status/roadmap/project brief/README remain outside these tickets unless parent explicitly grants exact scope. No new dependency is expected for the fixed CSV/JSON slice.

## 13. Smallest complete demo and later release verification

Judge path: select a synthetic award's frozen P1 snapshot → see 400 gross/50 reductions/350 net, separate C/F and R=650 → expand equipment 250 to E01/E02/R01 and inspect synthetic statement coverage → retain product-owner review/download → supported amendment or late correction yields a new snapshot/draft while old CSV/JSON remain identical. A short mismatch case leaves a one-cent statement difference visible after review. This demonstrates a meaningful mechanism with clear researcher value; no general sponsor engine or model call is necessary.

Before later application completion, parent allocates the RAM-heavy slot (owned by 03 at research dispatch), checked predecessors/shared lease and isolated acceptance/review directories. Run `npm ci`, focused `tests/financial-reports` suites, applicable reused-module README checks, `npm run check`, affected baseline/proposal/vault/resubmission/review/award/finance browser regressions and the connected 08 journey, migration/failure/restart/download checks and dev smoke. No network in ordinary tests. Additional renderer checks are needed only if shared rendering changed; none is planned. Preserve normal researcher data/primary port 3000; use unique `.test-data` and private `.local-data/task-08-review` in the implementation checkout with parent-confirmed free ports.

After all final fixes, build the exact final code revision, set owned `PORT`, `GRANTPATH_DATA_DIR`, `APP_REVISION` and instance identity, run **`npm run review`**, then GET **`/api/health`** and compare service/build/revision/instance with `.next/BUILD_ID` and the owned server record. Check actual storage readiness as supported by the integrated predecessor, exercise the real UI/download and restart with the same isolated data. Return the verified working loopback URL and exact revision; a reserved port, successful pure test or build is not a running release. Local review authorizes no public deployment or financial transmission.

Future handoff includes exact SHAs/schema, changed paths/agent scopes, commands/exits/test evidence, migration backup/graph/receipts/concurrency/restart/export evidence, fixture labels, known defects/skipped prerequisites and actual review identity/URL. Parent owns main and any subsequent CI/branch-gated integration; never integrate failing or superseded code. Preserve time for that integration and rehearsal.

## 14. Research review and document-only evidence

Read-only agents, both explicitly GPT-6.1 Sol / Extra High (`xhigh`), received Standard/Fast off and no-heavy-work instructions:

- `/root/official_sources_review`: opened official NSF/form/regulation sources, distinguished ACM$ from SF-425, paid costs from accounting bases, actual certification from local review and documented inaccessible-source limits. No files changed.
- `/root/ledger_contract_review`: inspected actual schema 3/receipt/queue/storage/export code and logical 05/06 contracts; identified receipt expiry/revision ordering, backup/reset closure, dimension-aware mapping and comparison-input invariance boundaries. No files changed.

Lead edits only this assigned new document. Documentation validation covers scoped Git diff/whitespace, relative links, source/check dates, direct human answers, helper/contract/acceptance consistency and independent hand arithmetic. Final commit/file hash and actual validation results are supplied in the chat handoff. No settings investigation or speed override occurred; active service tier is not independently verified by a prompt.

Document-only validation on October 25, 2026: all 12 relative file links resolve; 12 distinct official source URLs have opened-source evidence with availability/currency limits above; the three direct human answers are retained; 19 future acceptance cases cover the specified contract; the fixed CSV header has ten fields; nine independent BigInteger fixture equations passed. No trailing whitespace or conflict markers were found. Both reviewers read the full draft and reported no remaining blocking findings after the contract review's cutoff, category and synthetic-provenance fixes. Scoped Git whitespace/commit evidence is reported with the final hash. These checks validate the handoff document, not implemented financial behavior.

No npm install/check/build/dev/review, application/browser/renderer suite, loopback health probe, real finance import, financial account connection, provider call, purchase, sponsor certification/submission, public deployment, push/PR/merge or new automation was performed by this research. Documentation checks and official-source review do **not** prove application acceptance. Parent may start a new 08 implementation chat only after reviewing this completed handoff; actual 05/06 runtime gates remain mandatory before dependent code integration.
