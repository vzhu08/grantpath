# 05 — Award obligations and annual progress-report preparation

Specification v1.0 · researched October 25, 2026 · **documentation only; application implementation not authorized or performed by this assignment**.

## 1. Outcome, human decision and cutline

Help a researcher answer three questions: what did the award actually require, what happened during this reporting period, and what can honestly be written in the annual report? The distinctive mechanism is a traceable chain from an exact award term, through its amendment history and a dated progress update, to the evidence frozen with a reviewed narrative worksheet. A promised experiment must never become a completed experiment simply because its proposal text exists.

The human answered the task-specific question directly on October 25, 2026:

> NSF standard research award: annual project-report narrative worksheet (recommended for continuity with task 01).

This settles the sponsor/instrument/report target for the first release. It does not select a particular NSF program or real award, authorize coding, confirm award terms, appoint institutional officials, or authorize portal access. The requesting user remains the product/scope/approval owner. Actual technical, research and demo/QA human role assignments remain pending in the parent coordination record; worker accounts do not fill those roles.

**First release:** one award per saved application; pasted award/amendment text; quoted terms proposed for human confirmation; separately retained proposed and approved scope/budget context; source-linked obligations and editable internal milestones; the existing in-app agenda; actual progress records; one NSF annual narrative worksheet; immutable reviewed worksheet snapshots; Markdown narrative plus a separate JSON/internal evidence appendix. Manual operation and deterministic assembly need no credentials. Clearly labeled synthetic inputs supply the automated/demo cases.

**Deliberate cuts:** no financial ledger, spend/balance arithmetic, financial report, cost allowability judgment, institutional certification, sponsor submission, portal automation, reminders, team authorization, file parser/OCR work, automatic award discovery, final annual report, public Project Outcomes Report, DOCX/PDF renderer extension, or multi-sponsor template engine. Tasks 06 and 08 remain held; this document supplies an upstream interface, not their design. Optional live AI prose polishing is deferred until the manual/evidence path works and the human separately authorizes actual access/use. The feature must remain useful without it.

No preparation-time saving, funding improvement, scientific validity or market uniqueness is established by this research. No event deadline has been supplied.

## 2. Inspected baseline and integration constraints

Inspected checkout: `C:/Users/vzhu0/.codex/worktrees/be9c/grantguide`, base commit `4b7d2059957d92d75f18984685a25bb2324a8b54`; research branch `research/05-awards-progress`. The working tree was clean at kickoff. The lead is the sole document writer.

Required context read: [selected modules](../kit/SELECTED_MODULES.md), [quickstart](../QUICKSTART.md), [ownership](../OWNERSHIP.md), [human–AI workflow](../HUMAN_AI_TEAM_WORKFLOW.md), [task card](../TASK_CARD.md), [API contract](../API_CONTRACT.md), [status](STATUS.md), root `AGENTS.md`, and the current primary checkout's `AGENTS.md`, `docs/PROJECT_BRIEF.md`, `docs/ROADMAP.md` §05 and `docs/ORCHESTRATION.md`. A scoped-instruction search found only the root `AGENTS.md` in this checkout. The primary documents contain newer human scope/coordination decisions and were read in place; unrelated primary WIP was neither copied nor changed. Historical status/spec inspection notes are not current feature evidence.

| Actual baseline | Integration consequence |
| --- | --- |
| [State schema](../../lib/schema.ts) is version 2; roadmap 01 supports all 14 NSF proposal sections, reviewed bindings, content reuse, immutable packets and exports. | Preserve every existing section, record and migration. Reports are a distinct object; never repurpose proposal sections. |
| `Source` retains normalized text versions; `Citation` pins source ID/version/hash, exact quote and UTF-16 end-exclusive offsets. [Evidence helpers](../../lib/evidence.ts) validate historical quotations. | Reuse normalization and quote validation. A valid old quote remains historical evidence; a newer source revision prompts review rather than erasing history. |
| [Repository](../../lib/repository.ts) serializes writes in one process, checks workspace revision and saves atomically. `saveSource` allows ten sources per project; each source text is bounded to 20,000 characters. | Keep text-only scope within these limits. Provide a visible source-cap/size error, preserve pasted buffers, and never silently truncate or raise global limits. |
| Requirements are tied to a call; manifest `externalTasks` are tied to proposal-template task IDs. | Neither is a general post-award task store. Add award-owned obligations/milestones and project them into the agenda; do not run `saveRequirement` or re-extraction on award terms. |
| [Checklist](../../components/checklist.tsx) builds agenda items from the call deadline and requirements. [Calendar](../../lib/calendar.ts) supports unknown, date-only and confirmed-offset timestamps. | Extend its agenda input projection with stable award item IDs and reuse date/ICS presentation. Preserve proposal readiness separately. |
| [Generation](../../lib/generation.ts) and draft save bind proposal call/template state and selected latest evidence. | Do not send a progress report through the existing proposal generation/save contract unchanged. Manual report revisions pin their own terms, period and evidence. |
| `Profile.fundingNeed` and opportunity amounts are floating-point planning/matching fields; proposal budgets are narrative/context rather than a structured ledger. | They are not an awarded amount or even necessarily a requested proposal budget. Do not coerce them into approved financial facts. |
| [Local HTTP boundary](../../lib/http.ts), workspace route and health route implement loopback/same-origin restrictions, a 120,000-byte JSON bound, and build/instance metadata. | Preserve this local single-user/process boundary. Names entered in review fields are local attribution, not authenticated institutional identity. |

Tasks 02/03/04 are implementing in other checkouts under the parent-controlled shared-file lease **02 → 03 → 04**. Their reported schemas/interfaces are unintegrated observations, not verified behavior here. This feature can develop independent pure domain work from the existing text primitives, but shared integration must start from the actual checked predecessor revision and an explicit lease assignment. Allocate the next workspace schema number then; **do not prescribe a competing version 2 → 3 migration**. A vault adapter is optional and must consume the actual final source/file interface. Resubmission cycles may inform the originating application context; they must not re-key an award.

## 3. Official research and resulting design decisions

All URLs below were actually opened on **2026-10-25**. Facts are paraphrased; the right column is an engineering proposal. No login or credential was used.

| Primary source and date/version | Supported fact | Design consequence |
| --- | --- | --- |
| [NSF PAPPG index](https://www.nsf.gov/policies/pappg), current listed 24-1; effective May 20, 2024 for proposals | The index lists 24-1 and later supplements, rather than a completed replacement guide. | Store applicable policy versions and access dates; recheck before implementation and real award use. |
| [Supplement 1](https://www.nsf.gov/policies/document/pappg24-1-supplement-1), issued/effective December 8, 2025 | Covered revisions take precedence for applicable financial assistance from the stated date. | A bare `PAPPG 24-1` label does not establish complete current instructions. |
| [Supplement 2](https://www.nsf.gov/policies/document/pappg24-1-supplement-2), issued/effective January 22, 2026 | It changes PAR/Research.gov product handling, including automatic PAR identifiers/metadata and prohibiting direct dataset entry in reports. | Product narratives are preparation notes; no claim that our worksheet fills current portal product fields. |
| [Award conditions index](https://www.nsf.gov/awards/terms-conditions), versions through July 31, 2026 | The notice identifies applicable conditions. July 2026 GC-1 applies to new grants/funding amendments from that date. GC-1 excludes cooperative agreements, individual fellowships and SBIR/STTR. | Human confirms standard-grant applicability and incorporated version; do not silently substitute the newest terms for an older award. |
| [PAPPG VI.B–D](https://www.nsf.gov/policies/pappg/24-1/ch-6-nsf-awards), 24-1 with supplement notices | An award comprises notice/amendments, budget, referenced proposal and incorporated conditions. Budget and award periods differ. A grantee-approved extension uses an AOR-signed notification and electronically recorded revised end date without a numbered amendment. | Pin each component and approval/notification evidence. Permit a sourced administrative change as well as a numbered amendment; an unfulfilled request alone never changes current terms. |
| [PAPPG VII.D.1](https://www.nsf.gov/policies/pappg/24-1/ch-7-award-administration), 24-1 with supplement notices | Annual reports concern the current budget period, include broader impacts and are noncumulative. Submission is stated as no later than 90 days before period end. Report components and PI/co-PI certification are specified. | Freeze the actual reporting period; use the six component headings below. Local review is distinct from sponsor certification/submission. |
| [Standard RPPR instructions](https://www.nsf.gov/policies/research-performance-progress-reports), no visible revision date | Prompts compare goals/milestones with actual progress, cover negative results/unmet goals and delays, and allow explicit nothing-to-report responses where appropriate. | Separate goals, actual work, findings, plans, missing information and human-confirmed absence. These are not interchangeable. |
| [Report progress/outcomes](https://www.nsf.gov/awards/report-your-outcomes), no visible revision date | Annual, final annual and public outcomes reports are distinct; final annual is the final funded year's report and POR is a public summary. | The selected annual worksheet does not inherit POR word limits, publication behavior or closeout meaning. |
| [Request a change](https://www.nsf.gov/awards/request-a-change), no visible revision date | Scope/time/personnel/budget changes have notification/request processes. A no-cost extension supplies time rather than extra funding. | Store proposed changes separately from evidence of approved/recorded changes; changing an internal milestone is not sponsor approval. |

**Research limits that affect implementation:** the current conditions index was readable, but linked GC-1 PDFs and downloadable Research.gov template/help files returned fetch failures/403 during the independent research pass. The July 2026 GC-1 body and an exact current downloadable portal template were not verified. Do not present this document as a transcription of either. The selected product is a source-mapped annual narrative worksheet, not a complete portal form. Before advertising exact template fidelity, the human must supply or inspect the actual current template and applicable award conditions. PAPPG VII.D.1 contains adjacent inconsistent sentences on when an annual report becomes overdue. We retain its stated submission timing as guidance, require a human-confirmed date for the actual award and never label our agenda as Research.gov's authoritative overdue status.

## 4. Plain user workflow

1. In a saved application open **Award & progress**. A short notice distinguishes proposed application work from award terms and actual performance. Select the correct application before recording its award.
2. Paste a notice into project evidence (`other`) or select an existing text source. Review the normalized text, source role/date and exact excerpts. Labeled-line extraction can suggest candidates; manual span selection handles ordinary notices. Missing/unlabeled fields remain unresolved. Imported text cannot confirm itself.
3. Review sponsor award number, recipient, instrument, period, approved-scope references, money facts and incorporated conditions side by side with quotations. Choose **Confirm award record**. The human explicitly confirms transcription/applicability; the UI says this is a local record, not NSF acceptance. No award is inferred from a proposal stage, score, match or funding ceiling.
4. Add quoted reporting obligations and internal milestones; assign a plain responsibility label and review dates. Confirm sponsor obligations individually. Proposed extractions stay in a review list; confirmed dated items appear in the existing agenda with an **Award** label. Unknown dates stay unresolved. Internal milestones remain labeled internal.
5. Add an amendment or documented administrative change against the current confirmed version. Compare changed/unchanged fields; retain the previous version, approval evidence and any changed obligations. A pending request remains pending. Explicitly adopt a confirmed in-force version; do not activate by upload order or wall-clock passage.
6. Select one actual budget/reporting period and record dated updates against approved goals/milestones: completed work, work in progress, delay with reason/recovery plan, no update, or an expressly reported negative/inconclusive result. Link exact evidence; a user log is labeled researcher-reported. Proposal promises cannot substantiate actual results.
7. Assemble an editable **NSF annual narrative worksheet** from this bounded context. The researcher reviews each section and each factual claim, repairs unsupported claims or leaves visible gaps, and records any applicable nothing-to-report decision.
8. Choose **Save reviewed snapshot** to freeze the exact worksheet, terms, updates, evidence and unresolved list. Download narrative Markdown and a separate internal JSON/evidence appendix. Later amendments or evidence corrections show that current inputs differ; the old snapshot remains reproducible. Nothing is submitted or certified to NSF.

## 5. Award identity, statuses and amendment contract

The following is the **proposed logical contract `award-contract-v1` for task 05**, not a claim about current persisted code. It is deliberately sufficient to define an upstream handoff without designing the held ledger.

### 5.1 Identity and originating proposal context

- `awardId`: opaque stable application-generated ID. At most one award per application, including a locally archived award. No ID derives from title, amount, application stage, mutable external number or current resubmission cycle.
- `applicationId` and `projectId`: immutable parent references after confirmation, checked against each other. An award never follows an edited title, cloned application or later cycle automatically. Moving/merging awards is outside this release.
- `sponsor = NSF`, `instrument = standard_grant`, `sponsorAwardNumber`, `recipientName`: human-confirmed and source-linked. Preserve original external number text; duplicate checking uses trimmed/case-normalized number plus sponsor and recipient, without removing meaningful punctuation. Detect a duplicate across applications and require resolution, never silently create another award.
- A number/recipient transcription correction retains `awardId`, old values, reason and source-backed correction event; it cannot switch to a genuinely different award or recipient. Ambiguous transfer/new-award cases stop for human resolution and are outside the one-award release.
- `originContext`: frozen application revision, project revision, call ID/revision/source version and available exact submitted packet/attempt IDs. Copy the relevant originating proposal text/reference into the initial snapshot. If no submitted packet exists, use the explicitly labeled saved proposal context and `submissionEvidence = unknown`; do not invent submission. A mutable profile amount is never promoted automatically.
- The intake editor may hold a proposed candidate before confirmation. Initial confirmation atomically creates the stable award plus its first confirmed terms version. A cancelled/unconfirmed intake does not occupy an award slot, create agenda items or expose approved money. A saved source may remain ordinary evidence.
- `confirmInitialAward` requires a source-supported effective date that is known and not in the future, plus explicit selection of the initial current version. Future/unknown-effective notices remain intake candidates. An award period may start later than the notice's effective date; that does not imply research has begun.

Retain `FrozenOriginSnapshot {id, digest, payload}` in `state.awards.originSnapshots`. Its versioned payload contains the parent IDs/revisions above, capture time, provenance, selected proposal sections with exact draft IDs/text/citations, proposed money facts, optional existing packet/attempt ID and digest, and the normalized text/title/provenance of every source version needed to resolve those references. External submission evidence is either unknown or a human-recorded assertion with exact supporting source and actor/time; a locally frozen packet alone is not proof of external submission. `originContext`/`FrozenOriginRef` points to this immutable ID/digest. Include this payload in a reviewed report snapshot when required by its support graph; never rely solely on a latest application lookup. A source snapshot contains only selected versions, not unrelated project material.

### 5.2 Separate local and external states

| State axis | Values and meaning |
| --- | --- |
| Local award record | `recorded` or `archived`; archival only hides ordinary editing and never deletes history or denotes sponsor closeout. |
| Sponsor lifecycle assertion | `unknown`, `active`, `suspended`, `terminated`, `closed`; all except unknown require source evidence and human attribution in a terms version. No automatic active/closed transition from dates, application submission, report review or a positive amount. |
| Change candidate review | `proposed`, `confirmed`, `rejected`, `withdrawn`; reviewed decisions are append-only events. A confirmed future version can exist without being current. |
| Current terms selection | Explicit `currentConfirmedTermsVersionId`, plus a selection event with actor/time/reason. It must resolve to a confirmed full snapshot belonging to this award. |
| Local narrative | `draft` revisions plus immutable `reviewedSnapshot` records; there is no `submitted`, `certified`, `acceptedByNSF` or inferred `completeAward` state in this release. |

An application retains its current proposal stage enum. Award presence is a separate badge; do not add `Awarded` to that enum as an accidental replacement for cycle/submission meaning.

### 5.3 Terms versions and changes

`AwardTermsVersion` has ID, award ID, version ordinal, base/current-head ID, change kind (`initial`, `numbered_amendment`, `documented_administrative_change`, `transcription_correction`), original sponsor change identifier or explicit absence reason, source document/version/hash references, issue/effective dates, full approved-scope context, award period, budget periods, money facts, approved-budget references, incorporated policy refs, sponsor lifecycle assertion, and confirmation actor/time/note. IDs and published payloads are immutable. Ordinals support history display; they do not prove legal priority.

A confirmed snapshot is a **full effective interpretation**, not an unvalidated patch. Every field has either a new exact citation, an explicit carried-forward link to a confirmed base field with its original citation, or a typed unknown. This prevents an omitted amendment field from becoming blank or zero. A proposal scope reference can supply approved goals only when the notice's incorporation reference is itself pinned and confirmed. It can never supply performance evidence. Store approved goals as `{goalId, text, citations, incorporationRef?}` inside each terms payload; every external goal reference is `{awardId, termsVersionId, goalId}`. Unchanged goals may retain their logical goal ID across versions, but readers must still pin the terms version. Changed/split goals retain explicit predecessor links and never silently retarget old progress.

Confirmation validates all selected citations, relevant source versions, review decisions and the expected base head in one transaction. A source replacement between preview and confirmation returns 409; retain the editor. A newer source flags interpretation review; it never by itself legally supersedes the pinned current terms. Two amendments based on the same old head cannot both silently become current. A stable `sponsorActionId` identifies the actual initial notice/amendment/administrative action within the award; its original sponsor identifier is retained. Duplicate imports resolve to that same action, not a second action. Immutable replacement interpretations may retain the same action ID with `supersedesCandidateId` and a new reviewed candidate/version. The current lineage cannot apply the same action twice; correcting an already-applied interpretation requires an explicit correction event, not replaying it as new funding or a new sponsor amendment. Retain rejected/proposed candidates without overwriting history.

For every noninitial candidate, `baseTermsVersionId` must equal the actual current head both when confirming and when selecting it. If candidate B was confirmed against head 0, then candidate A becomes current, B cannot be selected merely by supplying the fresh expected head A. Create and review a new candidate reconciled against A; do not mutate B's confirmed payload. Reverting a mistaken interpretation likewise requires a new sourced correction version and event, not silently reselecting an older historical version.

`selectCurrentAwardTerms` is explicit, checks the expected current head and confirmation event, and rejects a future effective date. It requires human review of any newer supplied source, pending source correction or conflicting version before recording current applicability. Effective dates may be unknown for stored candidates; unknown applicability cannot become the current in-force interpretation. Retroactive changes require a note and explicit review of affected periods. No timer activates a future amendment. Expiration produces a review notice, not an automatic sponsor lifecycle transition.

Selecting a new head updates the agenda projection and flags affected current worksheet inputs for review. It never changes a proposed budget, old terms, actual progress, reviewed snapshot or earlier completion claim. Removed obligations retain their historical entries and completion evidence. An internal target-date edit is a milestone revision, not an award amendment.

### 5.4 Money-reference boundary supplied to task 06

Task 05 stores quoted financial **facts and references**, not balances or category calculations:

```ts
type MoneyFactV1 = {
  id: string;
  basis: 'proposal_requested' | 'current_action' |
         'obligated_cumulative' | 'anticipated_total';
  value: { state: 'unknown'; raw: string; reason: string } |
         { state: 'known'; currency: 'USD'; scale: 2; minorUnits: string };
  evidence: Citation[]; // exact existing source/version/hash/spans
  periodId: string | null; // null means award-wide, never inferred
  confirmedBy: string;
  confirmedAt: string;
};
```

This bounded NSF release admits a known value only when currency/amount/basis are explicit and human-confirmed. A dollar sign alone does not establish currency. Unsupported currency remains typed unknown; no FX conversion. `minorUnits` is a canonical integer string (`0` or nonzero digit followed by digits, with an optional minus sign only for `current_action`), bounded to 18 magnitude digits. A documented deobligating action may therefore be negative, while cumulative obligation, anticipated total and proposal-requested totals must be nonnegative. Reject negative zero, fractional cents, exponent notation and overflow. Use exact string/BigInt conversion; an explicit zero is distinct from unknown. Format deterministically without JavaScript floating-point arithmetic. These are representation constraints, not assertions of allowability or funds availability.

The extraction module's numeric `price` output may be a displayed candidate only; parse the confirmed original decimal text with an exact decimal-string parser for the authoritative money fact. Never round-trip an amount through a JavaScript number.

Requested context lives separately in `originContext.proposedMoneyFacts` and pins the exact proposal source/draft/packet revision. No requested amount is mandatory for a usable narrative worksheet; absent requested-budget evidence stays unknown. `Profile.fundingNeed`, opportunity maxima and narrative numbers are not default requested budgets.

Refine the shared money shape by location: originating proposed context permits only `proposal_requested`; approved terms `fundingFacts` permits only `current_action`, `obligated_cumulative` or `anticipated_total`. Enforce this in schemas and graph validation rather than rely on a UI filter.

Approved-version `fundingFacts` may distinguish the amount of this action from the total obligated so far and an anticipated future total. Do not add actions automatically, subtract them to create a balance, infer cumulative obligation from an anticipated total, or convert any amount into performance. Enforce at most one confirmed fact per `(basis, periodId)` in a full terms snapshot; conflicting source values require resolution or unknown. `approvedBudgetRefs` separately pin the award budget document/text and its period/scope; one scalar award amount cannot stand in for an approved category budget. Retain budget references even if amounts cannot be parsed.

`current_action` is scoped to that snapshot's `sponsorActionId` and never carries forward from a different action, including a date-only administrative change. If the new action gives no action amount, omit that fact or retain typed unknown with the absence reason; do not infer zero. Cumulative/anticipated facts may explicitly carry forward with their original support. A replacement interpretation of the same action retains that identity; it does not create another amount to add.

The upstream read DTO proposed for a future consumer is:

```ts
type AwardFinanceContextV1 = {
  contractVersion: 'award-contract-v1';
  awardId: string;
  applicationId: string;
  projectId: string;
  currentConfirmedTermsVersionId: string;
  currentTermsDigest: string; // SHA-256 of canonical full terms payload
  sponsorLifecycle: 'unknown' | 'active' | 'suspended' | 'terminated' | 'closed';
  awardPeriod: { start: string; end: string } | null;
  budgetPeriods: readonly BudgetPeriodRef[];
  proposedContextRef: FrozenOriginRef;
  fundingFacts: readonly MoneyFactV1[];
  approvedBudgetRefs: readonly SourceVersionRef[];
  unresolved: readonly string[];
  confirmedBy: string;
  confirmedAt: string;
};
```

`BudgetPeriodRef` includes stable ID, confirmed inclusive date-only start/end, label and evidence. `SourceVersionRef` includes source ID/version/hash and role; `FrozenOriginRef` includes an immutable origin snapshot ID/digest. A period ID may not be reused for a different interval: a changed boundary produces a new ID plus `supersedesPeriodId`. Reject overlapping active budget intervals in the bounded standard-grant interpretation; ambiguous sponsor periods stay unresolved. Reports can store a partial evidence-through date separately from the budget period.

The DTO is derived from one pinned confirmed version in a single repository read. It returns explicit unresolved fields rather than fabricating defaults. Any later consumer must bind its own work to that exact ID/digest and detect a changed head. Status is informational evidence, not permission to spend. This section supplies identity/status/version/amount semantics only; ledger records, currency/category mapping, reconciliation, cutoffs and financial exports are **not designed here**.

## 6. Obligations, milestones and evidence of actual progress

Use a bounded `state.awards` namespace proposed to contain `records`, `originSnapshots`, `termsVersions`, `changeCandidates`, `obligations`, `milestones`, `progressUpdates`, `reports`, `reportSnapshots`, `events` and operation receipts. Choose actual schema names only after inspecting integrated predecessors; preserve the logical invariants above. Keep feature schema/domain code under `lib/awards/`, with `lib/` adapting canonical kit modules rather than copying their normalizer/extraction/AI code.

| Record | Minimum fields and invariants |
| --- | --- |
| Obligation | Stable ID, award ID, originating terms version, revision/history, title/description, kind, source citations, sponsor/internal origin, proposed/confirmed review, responsibility label, date state, applicability/supersession refs, and completion events. A sponsor obligation needs exact applicable term support; an uncited local task is internal. |
| Milestone | Stable ID, award/goal reference, internal target date, title, revision/history, responsibility label. Optional link to a confirmed scope goal; no invented sponsor requirement. Changes preserve original targets. |
| Completion event | Item ID/revision, actor/time, actual date, status, evidence references and note. Completing an obligation requires human assertion plus supporting evidence; `no_update` is the initial state. A completion does not certify legal compliance or finish an entire award. |
| Progress update | Stable ID, award ID, append-only revisions; goal/milestone IDs; activity start/end or observed date; state `in_progress`, `completed`, `delayed`, `not_started`, `no_update`; typed finding `positive`, `negative`, `inconclusive`, `none_reported`; factual text, delay/recovery/next-plan text, exact citations, evidence kind (`artifact`, `researcher_log`, `other`) and author/review attribution. |
| Report | Stable ID and award ID; append-only section revisions, aggregate report revisions and review events as defined below. Revision inputs pin template, period, terms, progress-update revisions and source versions. |
| Reviewed report snapshot | Stable ID, report/revision ID, canonical SHA-256 digest, full frozen payload, review actor/time/note, unresolved list and template/policy metadata. Self-contained sufficient sources/terms/update text remain readable without following mutable latest references. |

Completion and evidence sufficiency are separate. A dated researcher log can support “the researcher reports running the experiment”; an output artifact can support a more specific result after human review. Neither establishes independent scientific validation. A checked box, planned method, review task, proposed result, grant award or generated sentence is never performance evidence.

Match actual work to the selected reporting period by explicit dates, not source creation time. Keep out-of-period records visible as excluded context. For actual-performance claims require activity/observation dates no later than the frozen evidence-through date, and `evidenceThrough <= asOfDate`, with `asOfDate` recorded from the server in the workspace date basis. Evidence-through must be inside the selected budget period and not in the future. Plans may describe future work only under the future-plan claim kind. Updates spanning a boundary require human splitting or an explicit, reviewed allocation of narrative; do not silently count the entire update twice. Partial completion stays partial. Missing activity dates/evidence stay unresolved. A negative or inconclusive result may be a completed activity without a positive finding.

For each reportable factual block, store `{blockId, text, claimKind, supportRefs}`. `claimKind` distinguishes approved goal, actual activity/result, delay, future plan and contextual statement. Goal blocks can cite confirmed scope; actual result blocks must reference a selected, dated progress-update revision and its evidence. Validate linkage/date/type deterministically, then require human review of meaning. Exact quote validation cannot prove entailment. Unsupported free prose can be saved as draft but is flagged and cannot receive an unqualified reviewed status for that factual block. A snapshot may retain disclosed missing items; the UI calls it **Reviewed draft with gaps**, never sponsor-ready.

Close the report reference types explicitly:

- `SupportRef` is a tagged union of `approved_goal {awardId, termsVersionId, goalId}`, `progress_update {awardId, updateId, revisionId}`, `source_quote {citation}`, and `missing {reason}`. Future-plan text references the selected plan/update revision or remains a missing input; a `source_quote` alone cannot satisfy the actual-performance gate. Every resolved reference must belong to the report's bounded context. General header/context facts can cite exact current terms/source without becoming performance.
- A section revision has stable ID, section key, text, ordered factual blocks/support map, mode and creation time. Its text must equal the deterministic visible serialization of its blocks; no uncited second text representation. Prior versions remain immutable.
- `AnnualReportRevision` has stable ID, report ID, ordinal, template ID/version and policy metadata, confirmed budget period ID/range, evidence-through/as-of dates, selected terms IDs/digests, selected progress-update IDs/revision IDs, selected source-version refs, all six exact section revision IDs, ordered unresolved list, creation time and a canonical context/content digest. It is an immutable aggregate appended by `saveAnnualReport`, including when only a period/context changes. Sections can reuse unchanged revision IDs.
- Section review events pin aggregate revision ID, section revision ID and its input fingerprint. Freeze requires the explicitly selected current aggregate revision and matching review fingerprints, then copies its transitive support graph into the snapshot. No report/revision reference may resolve to a floating set of latest sections. Later edits append an aggregate revision; they never revise a reviewed aggregate in place.

Source edits leave referenced historical versions intact. Show separately: invalid reference (block save/freeze), a newer source revision requiring current review, and frozen historical evidence. Selecting an old version deliberately requires an explicit reason/review; it cannot suppress an unrelated newer contradictory source. Corrections to an update create a new revision and mark affected current reports stale. Never rewrite a frozen report's facts or citations.

## 7. Annual worksheet template and honest drafting

Bundle `nsf-annual-narrative-v1` with source URLs, checked date, scope note, version and six sections mapped to NSF guidance:

| Section | Bounded worksheet content | Inputs that stay visibly incomplete |
| --- | --- | --- |
| Accomplishments | Approved goals; actual activities/results against milestones; unmet goals; training/dissemination; next-period plans. Separate observed results from plans and include broader impacts. | Missing result evidence, missing period/activity dates or unsupported completion. |
| Products | Evidence-backed narrative inventory and supplied identifiers; no fabricated publication or dataset. | Current PAR/portal product entry, metadata and deposit checks. |
| Participants/Organizations | User-reviewed narrative contributions from supplied records. | Structured roster, person-months, demographics and portal requirements not collected by this release. |
| Impact | Supported effects and broader-impact activities, with uncertainty. | General success claims without evidence; downstream impact merely predicted in a proposal. |
| Changes/Problems | Delays, negative/inconclusive findings, causes, actual changes and recovery/next actions. | Pending sponsor approval remains pending; a recovery plan is future work. |
| Special Requirement | Only the actual award's confirmed requirements and evidence, or a human-confirmed not-applicable decision. | Unknown applicability remains unknown; no generic default “none.” |

Headings are a mapping, not a reproduction of every portal field. Do not invent universal section word/page limits; show no sponsor limit unless a confirmed award/template source supplies one. Application proposal section limits are irrelevant. A report header stores award number, reporting budget period, evidence-through date, terms version and provenance label. An internal appendix lists unsatisfied structured/portal fields, evidence limitations, policy applicability and missing inputs. It is downloaded separately from the narrative.

Each section starts `missing`, can contain `draft`, and can become `reviewed` or `nothing_to_report_confirmed` with actor/time/reason and input fingerprint. Blank is not nothing-to-report. A required goal prompt cannot be dismissed by a blanket empty response. Changing text, relevant update/term selection or period invalidates affected current reviews. Local review means the named local researcher reviewed this exact draft, not that an institutional official certified it.

The minimum engine deterministically assembles labeled text from confirmed terms/selected progress records and preserves placeholders; the researcher edits prose. No model is needed to propose legal obligations or assert performance. If later authorized, a separate server-only structured prose adapter may use the existing `modules/ai` interface and actual integrated task-04 access layer after inspection. It must receive frozen bounded inputs, return support references, use the same evidence checks, preserve mode/provider/model/prompt metadata, and never auto-save or retry after partial output. No new provider/account decision is made by this document; live failure cannot silently become fixture output.

## 8. Proposed commands, routes and UI ownership

All names in this section are proposals, not existing endpoints. Prefer new discriminated commands through `POST /api/workspace` so writes retain the repository's transaction/expected-revision boundary. Each command validates the current award/application/project, exact references and per-record revision as well as workspace revision.

| Command | Essential behavior |
| --- | --- |
| `confirmInitialAward` | Confirm one reviewed intake; atomically create unique award, full terms snapshot, origin snapshot and event; require source/version fingerprint. |
| `saveAwardChangeCandidate` / `reviewAwardChange` | Save proposed change against exact base; confirm/reject/withdraw with retained decisions. Does not implicitly change current terms. |
| `selectCurrentAwardTerms` | Explicitly select confirmed applicable head with expected prior head and reason; recompute projections/staleness atomically. |
| `saveAwardObligation` / `reviewAwardObligation` | Retain revisions; validate sponsor citations and date derivation; never overwrite proposal requirements. |
| `saveAwardMilestone` / `recordAwardCompletion` | Internal planning versus actual completion, with dates/evidence and history. |
| `saveAwardProgress` | Append update revision; validate selected goal/item and evidence ownership; retain superseded revisions. |
| `saveAnnualReport` / `reviewAnnualSection` | Save exact report context and text/support map; freeze reviewer fingerprints. Deterministic assembly is an explicit preview action. |
| `freezeAnnualReport` | Validate references/context and atomically create immutable reviewed snapshot plus a disclosed unresolved list. Never imply sponsor submission. |
| `archiveAward` | Hide ordinary editing, preserve all references/history; no cascade deletion. |

Read the workspace plus new namespace for ordinary UI. A small `GET /api/awards/templates` may return bundled worksheet metadata. `GET /api/awards/reports/{snapshotId}/export?format=md|json` returns only the allowlisted frozen snapshot's deterministic narrative or internal appendix; loopback, no-store, safe filename, `nosniff`, attachment disposition. JSON carries the digest/full evidence payload. Do not accept arbitrary paths, URLs or filesystem names. If a separate generation route is later authorized, give it the same local security/body/rate/cancellation controls as existing generation; no arbitrary fetch/tools.

**Retry contract:** every task-05 mutation carries an operation ID. The server validates and canonicalizes the complete logical command and computes its SHA-256 payload hash; it never trusts a client-supplied hash. Include command type, target IDs, content, cited versions, expected record/head IDs, explicit confirmations and reasons. Exclude only the operation ID itself, outer workspace `expectedRevision` and transport/client timestamps; include any semantic observation/effective dates. Inside the serialized transaction, first check a durable scoped receipt: same ID/server-computed hash returns the original IDs/result (plus current state) without duplicate history or revision increment; same ID/different payload returns 409. Only a new operation then checks expected revisions. Persist receipt with the successful mutation before returning. Do not make unsafe actions appear safe through client debounce. Reuse integrated predecessor receipts if compatible; otherwise implement a feature-scoped receipt adapter and avoid two unrelated global mechanisms. No receipt expiry in the bounded release without a documented safe retry-window policy.

**UI:** one award panel with notice/amendment history, obligation/milestone list, progress entry and annual worksheet tabs; extend the existing application area rather than introduce a separate dashboard. Reuse `SourceText`, `CitationView`, `DeadlineEditor` and dirty-editor navigation controls where compatible. Keep source quote and interpreted value side by side. On 409 preserve every dirty buffer and require reconcile/reload; never force-overwrite a newer version. Show critical labels in plain language: proposed, confirmed locally, pending amendment, current terms, researcher-reported, missing evidence, delayed, historical snapshot and draft with gaps.

Agenda IDs are stable `award:<awardId>:obligation:<id>` / milestone IDs. Project confirmed applicable outstanding items only; show proposed and superseded items in review/history. A due-date change retains old history; stable ICS UID identifies the same obligation. Use current date-only/offset semantics; a date-only item never gains an invented midnight submission cutoff. Derived `budgetPeriod.end minus 90 calendar days` is only a proposed target until the human confirms applicability and the actual date. Store raw rule citation, base period ID/range, derivation/version and confirmation. Call it **Preparation target passed**, not sponsor-reported delinquency. External delivery is task 07 and is not added here.

## 9. Persistence, migration, security and failure recovery

- Integrate only under an explicit exclusive lease after the exact checked predecessors. Record base SHA and actual latest schema. Add one monotonic migration after existing migrations; no assumed target version. Validate old state first, create an exclusive byte-identical backup, add empty award collections, validate the entire reference graph, then atomically replace storage. No automatic award inference or seed insertion into a real workspace.
- Keep unknown/corrupt schemas, missing parents, invalid quotes, duplicate IDs and wrong digests intact with an actionable error. Never replace unreadable data with synthetic records. Preserve all 14 proposal sections, library/history, vault/resubmission/review collections and frozen exports. Migration/restart tests must use the integrated schema, not only this baseline.
- Validate references on every successful write and on load, including old retained revisions and snapshots. Verify IDs, same-project scope, award ownership, source version/hash/span, period identity, current confirmed head, lineage acyclicity, full carried-forward fields, update/report links and digest. Type schemas alone do not validate this graph.
- Version the canonical digest serialization: recursively sort object keys, preserve array order, use JSON UTF-8 with no extra whitespace, and exclude the digest field itself. Reuse a verified equivalent predecessor helper if available. The existing normalized-text hash is a deterministic non-security identifier; snapshot SHA-256 checks content integrity, not an institutional signature or protection against a local operator rewriting storage.
- Existing `resetDemo` must retain any demo dependency referenced by a non-demo award or a reviewed report; extend the actual integrated retention graph. Prefer refusing reset with a clear reason to deleting referenced provenance. No source/award purge is part of this release.
- Preserve the one-user/one-process JSON repository limitation. Expected revisions are not a multi-process lock or hosted authorization. No service workers, schedulers, accounts, email or API credentials are required. Source URLs are inert references, not automatic downloads; pasted instructions are data, never executable instructions.
- Keep private award text/local exports/logs out of Git; synthetic fixtures only. Render excerpts as escaped text. Use server-only file I/O and any future provider adapter. Limit selected context to the award and its project. Do not expose other-project sources merely because an ID is valid.
- Proposed feature bounds: 20 terms/change versions, 100 obligations, 50 milestones, 100 progress-update records, 20 report records per award; each description/update narrative at most 5,000 characters, at most 20 evidence citations/update, six report sections of at most 10,000 characters each and 60,000 characters total/report revision. Enforce the existing 120,000-byte request cap before parsing, which may reject a large Unicode payload below the character cap. Errors preserve buffers; do not truncate. These are initial engineering limits to validate at implementation, not sponsor limits.
- Frozen payload is assembled server-side, not posted by the browser; require a bounded selected input set and cap canonical snapshot serialization at 2 MB with a visible reduction action. Retained histories may grow; do not evict cited versions silently. Larger awards/workspaces require a separately authorized storage/retention design.
- A failed write records no completion/receipt/snapshot. A lost response can be retried with the same operation ID. Crash/restart must either expose the completed atomic write or the previous state, never an intermediate amendment. Orphan temp files may be cleaned only after confirming they are not referenced; migration backup remains untouched.

| Failure | Required recovery |
| --- | --- |
| Unlabeled/conflicting notice fields or ambiguous currency | Retain candidates/raw text; exact-span manual review or typed unknown; no guessed terms. |
| New amendment is merely requested, future effective or based on stale head | Keep candidate/history; preserve current head; request the human's actual applicability/approval evidence. |
| Corrupt source/history or missing approved-budget document | Preserve storage; block affected confirmation/freeze; narrative may proceed with disclosed missing financial context if no invalid reference is saved. |
| Duplicate intake/retry | Recover existing award via receipt or show external-number duplicate; no second award. |
| Conflicting actual update or later correction | Retain both revisions, require human resolution, mark current report stale, preserve old reviewed snapshot. |
| Out-of-period/undated evidence or only proposal support | Exclude from actual-result support; show gap and allow honest delay/no-update drafting. |
| Oversized source/report/snapshot | Clear bounded-input error; preserve editor; split/select fewer inputs explicitly. |
| No usable report evidence | Manual worksheet with missing fields remains available; no fixture substitution or fabricated success. |

## 10. Dependencies and go/no-go gates

| Gate | Evidence needed | Present state |
| --- | --- | --- |
| Research scope | Human sponsor/report choice; inspect actual baseline | **Met for this document**: NSF standard annual narrative worksheet; code inspected at base SHA. |
| Application dispatch | Human authorizes later task-05 coding, parent assigns exclusive files/shared lease and exact predecessor SHA | **Not supplied by this research request.** No application changes here. |
| Runtime integration | Inspect final 02/03/04 schema, receipts, source retention and generation seams; resolve concrete conflicts | **Pending checked predecessor handoff.** Vault file intake is optional; text domain work does not require it. |
| Real award use | Actual notice, approved scope/budget refs, amendments/administrative changes, applicable conditions, period/due dates, special requirements and human preparer/reviewer confirmation | **Not provided.** Use synthetic data for offline acceptance/demo; do not fabricate institutional roles or real approval. |
| Exact portal/template fidelity | Current actual template and complete applicable conditions checked, including inaccessible documents | **Unverified; outside the worksheet claim.** Escalate to human if requested later. |
| Live AI | Actual permitted server access, explicit human use intent, private-input decision and bounded live verification | **Deferred; no credentials needed for current scope.** |

**Does this release task 06?** This document fixes a logical proposal for award ID, local versus sponsor status, explicit current confirmed full terms version, amendment lineage, frozen origin and exact/unknown money-reference semantics. There is no unresolved sponsor choice. It supplies a reviewable upstream contract, but it is **not an implemented predecessor contract** and does not release the parent's hold on 06. Before dependency-sensitive 06 planning, the parent/human must accept a settled `award-contract-v1` interface and confirm that it is the intended integration contract; if actual predecessor-completion information is still significant, keep 06 held. Before any 06 code integration, actual task-05 implementation evidence is a hard dependency: checked SHA/schema/migration, exported DTO/types, read/receipt/concurrency semantics and passing amendment/reference/restart cases. Unknown money data must remain representable; resolving a particular award's amounts is not a reason to invent defaults. No ledger/snapshot/reconciliation/currency/category/export/cutoff design for 06/08 is included here.

Consequential human decisions still required at future real use are listed in the real-award gate. No unanswered product question currently prevents completing this worksheet specification. Changes to sponsor, report family, institutional authority, delivery, spending or provider access require an actual human answer; another AI cannot supply it.

## 11. Bounded later implementation tickets and exclusive ownership

These are work assignments for a future authorized task, not current edits. Parent assigns actual people/stewards and lease/ports at dispatch. Requesting user is the recorded human scope owner; no additional teammates are assumed. Each concurrent writer gets an isolated checkout/branch and exact exclusive paths. Read-only review agents need no write scope.

| Ticket | Exclusive scope / owner | Acceptance and sequencing |
| --- | --- | --- |
| A05-1 Contract and deterministic core | Domain writer: new `lib/awards/schema.ts`, `identity.ts`, `terms.ts`, `money-facts.ts`, `integrity.ts`, associated `tests/awards/contracts*.test.ts` only | Implement §5–6 identity/full terms/unknown money/quote validation and hand-checked edge cases. No shared schema edits. Publish actual exported contract before downstream work. |
| A05-2 Progress and worksheet | Domain writer or second isolated writer: new `lib/awards/progress.ts`, `reporting.ts`, `templates.ts`, `exports.ts`, scoped tests only | Period/evidence gating, honest assembly, section review fingerprints and immutable export; consume A05-1 contract. Manual path first. |
| A05-3 Feature UI | UI writer: new `components/awards/**` only | Intake/review/amendment/progress/report screens, local labels, source spans, dirty buffer and 409 handling; receive actual core interfaces. No global styles/layout/manifests. |
| A05-4 Shared integration | Task lead/steward exclusively: actual `lib/schema.ts`, repository/integrity/migrations, workspace dispatch, `app/page.tsx`, agenda projection, new `app/api/awards/**`, browser harness | Only after shared-file lease and checked predecessors. Wire receipts and reset retention; preserve all existing workflows. Avoid layout/style/package changes unless a concrete need is assigned. |
| A05-5 Independent evidence review | Read-only reviewer | Attack proposal-as-performance, amendment authority, unknown money, dates, receipts and snapshots; report concrete cases. Lead fixes within owned scopes. |
| A05-6 Final verification/handoff | Lead only, task-specific synthetic data/ports | Focused tests, complete integrated checks, browser/restart, final same-revision build, review server/health identity and exact evidence handoff. |

Keep the distinctive vertical slice ahead of optional polishing: initial notice → confirmed obligation → real update plus one missing result → reviewed worksheet → amendment/evidence change → visible stale state with unchanged old export. Defer file adapters, extra reports and live generation if they threaten completing that chain. Any reduction of required correctness or the chosen outcome goes back to the human, not into a silent cut.

## 12. Deterministic acceptance and failure cases

All ordinary tests use synthetic records, a fixed clock, mocked transports if applicable, unique temporary data directories and no external API calls. The following are **required future cases, not checks run by this documentation task**.

| ID | Setup/action | Exact proof expected |
| --- | --- | --- |
| 05-T01 Identity | Confirm one synthetic notice twice (same operation ID); then attempt another award for the same application | One award/initial terms/event; retry result IDs match; new operation cannot bypass uniqueness. Across applications, duplicate external identity is caught. |
| 05-T02 Proposed versus approved | Proposal requests USD 300,000; notice explicitly obligates USD 240,000 | Original proposed context is byte/content unchanged; separate known facts `30000000` and `24000000` cents; no profile/call amount overwrite. |
| 05-T03 Amount basis | Source has USD 80,000 current action and USD 240,000 anticipated total, no cumulative figure | Distinct bases; cumulative remains unknown; no sum/balance or inference. Explicit zero differs from unknown. |
| 05-T04 Currency/precision | Only dollar sign; conflicting amounts; fractional cent, negative cumulative total, negative zero, exponent and 19-digit value | Unknown or validation failure with raw source retained; no float rounding or guessed USD. Exact known USD 0.10 becomes `10`; a supported USD -100 current action becomes `-10000` without changing other totals. |
| 05-T05 Quote/ownership | Forge hash/quote/offset; cite another project's valid source; use emoji/CRLF normalized text | Reject bad/foreign refs; valid normalized UTF-16 span round-trips; no raw binary offset interpretation. |
| 05-T06 Amendments | Two candidates share base; confirm/select first; try second with old expected head, then fresh expected head but old candidate base | Both stale-base selections fail 409 with editor retained; current head/history intact; new reconciled candidate/explicit review required. Initial current selection is atomic; future/unknown-effective initial notice stays intake. Pending/future amendment never activates automatically. |
| 05-T07 Carry-forward | Amendment changes end date but not amount; supported administrative extension has no numbered amendment; stale candidate is reconciled under the same action ID | Cumulative amount citation survives, prior current-action amount does not carry to a different action, and omitted action amount is absent/unknown. Replacement interpretation retains sponsor identity without duplicate application; documented extension needs evidence; no added money; prior dates/history remain. |
| 05-T08 Status | Mark application Submitted; reach award end; review report; archive award | None of these sets sponsor active/closed, certification or NSF acceptance. Unconfirmed intake adds no agenda/approved money. |
| 05-T09 Honest performance | Proposal promises three experiments; actual log supports one completed, one delayed, third has no evidence | Report actuals support only the completed work; delay/recovery is explicit; third stays missing/no update. No success claim from proposal. |
| 05-T10 Negative results | Dated output records completed experiment with inconclusive result | Completion and outcome remain distinct; report retains inconclusive finding and uncertainty. |
| 05-T11 Period | Out-of-period evidence, update spanning budget boundary, missing observation date and future-dated completed work inside the budget period | Exclude or require explicit split/allocation; future completion cannot satisfy as-of/evidence-through gating; no duplicated period credit; selected period/as-of/evidence-through dates are visible. |
| 05-T12 Nothing to report | Blank section versus human-reviewed absence versus unknown special requirement | Three distinct states; no auto-none or implicit completed portal field. |
| 05-T13 Dates/agenda | End 2027-09-30 gives proposed 90-day target 2027-07-02; source date-only and confirmed offset examples | No target enters confirmed agenda until reviewed; date-only cutoff unknown; calendar UID stable after edit; status is local preparation status. Include leap-year and offset cases. |
| 05-T14 Snapshot | Freeze report; amend terms; correct evidence; export old and new | Old canonical digest/narrative/appendix unchanged; current report shows input difference; relevant reviews invalidated; all old quoted text recoverable. |
| 05-T15 Lost response/retry | Successful mutation followed by simulated response loss; retry after another mutation; reuse ID with changed text and falsely reused client hash | Same ID/server-computed hash returns original operation IDs without replay; changed payload fails regardless of client hash; no duplicate completion/snapshot. |
| 05-T16 Storage failures | Simulate write/rename failure, crash around commit, corrupt/unknown schema, missing reference, invalid digest | Previous or complete state only; no fabricated fixture reset; backup bytes intact; actionable error. Restart retains all award/report histories. |
| 05-T17 Migration/regression | Migrate actual integrated predecessors, including every proposal section, vault selections, resubmission history and review snapshots | New collections empty; prior snapshots/artifacts unchanged; reference graph valid. Refuse incompatible newer schema. |
| 05-T18 Reset/limits/security | Non-demo report cites demo evidence; body/source/snapshot cap; hostile HTML/URL; cross-origin/host request | Reset preserves dependencies/refuses; limits fail before mutation; buffers survive; escaped text/no remote fetch; local boundary enforced. |
| 05-T19 Export | Same frozen ID exported twice; arbitrary path/format/ID attempts | Identical narrative/content digest; separate internal appendix; safe filenames/no path traversal or unscoped data disclosure. |
| 05-T20 Local UI/restart | Full synthetic journey at desktop and narrow viewport, keyboard-only citation inspection, 409 competition and restart | No lost dirty edits, readable labels/no horizontal overflow; same data/snapshot after restart; no console errors. |

No acceptance case proves scientific truth or legal compliance. Human review checks whether each factual sentence says no more than its evidence supports. An exact quote is provenance, not a semantic correctness oracle.

## 13. Future verification, review URL and demo proof

For later application implementation: run `npm ci`; focused `tests/awards` suites; applicable module README commands for documents/extraction (and AI only if used); `npm run check`; existing production browser regression plus the award journey; applicable existing proposal/export checks if shared snapshot/export code changes; and a dev smoke check. Run migrations, failure injection and browser acceptance against isolated synthetic data. Do not test against normal `.local-data` or use the primary port 3000. Parent must reserve available task-specific review/browser/dev ports before running; none is claimed reserved/healthy here.

After final fixes, build the exact final code again, set task-owned `PORT`, `GRANTPATH_DATA_DIR` and `APP_REVISION`, run **`npm run review`**, explicitly **GET `/api/health`**, and compare service, build ID, revision and instance to the final `.next/BUILD_ID` and owned server record. Exercise the actual review UI and restart once with the same isolated data. Provide the working loopback review URL and exact SHA in the application handoff. An earlier build or a healthy unrelated server cannot satisfy this gate. Local review is not public deployment or sponsor submission.

The judge-visible proof uses clearly labeled synthetic data: the researcher sees the requested versus approved amount unchanged in separate contexts; confirms a cited reporting obligation; records one completed experiment with an artifact, one delay and one missing result; produces an honest annual worksheet; then changes a source/amendment and sees the stale-current warning while the reviewed snapshot still exports identically. This connects the researcher benefit to observable provenance, amendment lineage and evidence gating. Rehearse the narrow path and its honest failure case before optional breadth.

**Proposed evaluation, not measured results:** count planted unsupported performance claims incorrectly accepted, stale inputs missed, exact-reference failures, amount-context overwrites and period-leakage errors; target zero in the synthetic deterministic cases. A human may compare preparation time and factual correction count against a documented manual baseline on the same scenario, recording method/sample/limits. Do not report these improvements before actual observation or generalize a small synthetic test to all researchers.

The later handoff records actual command exits/test counts, checked SHA/schema, agent scopes, fixture/live labels, migration/backup/concurrency/restart/browser evidence, remaining defects, skipped prerequisites and owned review URL. Use existing GitHub Actions for repeatable checks if the parent authorizes a PR; never merge a failing or superseded revision. This research task creates no PR, push, merge, automation, deployment or external send beyond its explicitly authorized parent coordination.

## 14. Research evidence and document-only validation

Independent agents, both explicitly requested GPT-6.1 Sol / Extra High (`xhigh`), read-only:

- `/root/award_official_research`: opened official NSF policy/report sources, found July 2026 conditions and 2026 supplements, identified portal/product and overdue wording limits, and mapped the human-selected annual narrative scope. No files edited or live service actions performed.
- `/root/award_integration_review`: inspected actual schema/repository/evidence/agenda/generation code, identified call-coupled checklist/task and proposal-draft constraints, proposed stable award/full-terms/money boundaries and failure cases. No files edited.

The lead wrote only this assigned specification on the research branch. Documentation checks must verify changed-path scope, whitespace, relative links, source URLs/access dates, human decision capture and coverage of the above contracts/gates. Source availability is recorded honestly; unreadable downloadable conditions/templates remain unverified. Parent handoff carries the final scoped commit SHA and file hash.

Document validation on October 25, 2026: all 14 relative file links resolve; nine cited official source URLs were opened; required decision/contract/dependency/review-gate coverage is present; no trailing whitespace or conflict markers were found. Independent policy review found no blocking source/scope defect; integration review identified current-head, signed-action, reference-closure, as-of and retry-hash issues that were corrected in this specification. These are documentation checks and design review, not feature acceptance.

No `npm ci`, app tests, build, browser session, health check, live API call, paid test, real award import, sponsor login/submission, certification or deployment was performed for this documentation-only task. No application feature completion or healthy review URL is claimed. The application review gate in §13 applies when this specification is implemented later.
