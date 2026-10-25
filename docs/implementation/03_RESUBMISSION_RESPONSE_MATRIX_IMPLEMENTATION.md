# GrantGuide Resubmission Response Matrix

Roadmap item 03 | Implementation specification v1.0 | October 25, 2026

Turn reviewer feedback into a revision plan whose original comments, actions, evidence, proposal changes and responses can be inspected together. A completed row records a researcher's review decision; it does not establish scientific validity or a likelihood of funding.

## 1 Release outcome and decisions

The user selected **a general workflow, NSF first**. Deliver the core workflow for any manually entered opportunity, with an NSF preparation profile and a synthetic NSF-like demonstration. NIH research below establishes important differences; a validated NIH A1 profile is a later release.

This request authorizes research and an implementation document. Feature development is a subsequent task. The requesting user is the product and scope owner; Codex is the implementation steward under the current ownership board. No additional human teammates are assumed. A task's owner is a descriptive label, not a user account, permission grant or notification recipient.

| Decision | First release |
| --- | --- |
| Runtime | Existing local, single-user, single-process application; manual use needs no API key. |
| Intake | Researcher-confirmed submitted text and pasted reviewer/panel comments. File ingestion is optional integration with roadmap 02. |
| Revision planning | Accepted concerns, linked actions, evidence needs, section mappings and human completion decisions. |
| Drafting | A separate target application, retained draft revisions, old/new comparison and an editable response document. |
| AI | Optional concern suggestions and response previews, each explicitly requested and accepted. Manual planning remains complete. |
| Delivery | Saved internal review packet in Markdown and structured JSON. Sponsor attachments require separately confirmed instructions. |

### Observable completion

A researcher captures the narrative actually submitted, imports two reviews and a panel summary, accepts four distinct concerns, records one conflicting recommendation, assigns actions and links evidence. They revise a separate application, compare the old and new passages, write responses and record completion for supported rows. An unfinished experiment stays open. Restarting preserves the original submission, feedback, decisions and saved exports. Editing linked evidence afterward visibly invalidates the affected completion decisions without changing the historical packet.

### Boundaries

Defer portal submission, appeals/reconsideration, experiment execution, scientific scoring, funding prediction, live discovery, collaborator accounts, emails and reminders. Preserve the existing application journey. This feature can plan a resubmission without implementing the entire vault or full proposal-template roadmap first.

<!-- pagebreak -->

## 2 Research findings and product consequences

Official sources were checked on October 25, 2026. The rows below summarize sponsor rules. The subsequent schemas, limits, screens and acceptance gates are proposed engineering decisions.

| Finding | Consequence |
| --- | --- |
| NSF's current-guide page identifies PAPPG 24-1 and lists Supplements 1 and 2. A replacement guidance document is described as a draft. [S1](https://www.nsf.gov/policies/pappg) | Pin the checked guide and applicable notices; do not infer a newer effective guide from a year number or draft. |
| NSF IV.E requires substantial revision, consideration of major review concerns and attention to program-specific moratoria. NSF treats a revised proposal as a new proposal under its standard review procedures. [S2](https://www.nsf.gov/policies/pappg/24-1/ch-4-non-award-decisions-transactions) | Keep proposal lineage separate from the sponsor's application type. Record program restrictions and a human explanation of substantive changes. A text-diff percentage cannot certify this requirement. |
| NIH permits one A1 following an A0, requires the prior summary statement, normally uses a 37-month window, and requires an eligible opportunity. Some changes of opportunity can remain resubmissions; other changes require a new application. [S3](https://www.grants.nih.gov/grants-process/submit/submission-policies/resubmission-applications) | A different call does not automatically determine formal application type. Preserve original and target identifiers and require a checked sponsor decision. Do not add a universal A1 counter or timing gate to the general workflow. |
| NIH requires a resubmission introduction addressing criticism and summarizing changes, and prohibits marking changes within application attachments. Its page-limit table has activity-specific exceptions to the usual one-page introduction. [S3](https://www.grants.nih.gov/grants-process/submit/submission-policies/resubmission-applications), [S4](https://www.grants.nih.gov/grants-process/write-application/how-to-apply-application-guide/page-limits) | Keep internal comparisons separate from clean sponsor text. An internal response matrix is not an official introduction or a universally permitted upload. |
| OWASP describes indirect prompt injection through external content and recommends enforcing permissions and output validation outside the model. Prompt delimiters alone do not establish a security boundary. [S5](https://cheatsheetseries.owasp.org/cheatsheets/LLM_Prompt_Injection_Prevention_Cheat_Sheet.html) | Treat comments and proposals as untrusted text; provide no model tools or write access. Validate quotation scope and structured output, then require explicit acceptance. |

### NSF preparation profile

Profile ID `nsf-resubmission-preparation`, version 1. Ask the researcher to confirm the original proposal/program, target solicitation and deadline, decline/review status, applicable waiting-period instructions and where a response or change summary belongs, if anywhere. Save the instruction excerpts, official URLs, date checked and decision rationale. Unknowns remain visible.

Require an explanation of the substantive changes for internal review. Do not automatically create a response-to-reviewers sponsor attachment, impose a universal waiting period or infer eligibility from completion of the matrix. Consult the current solicitation and applicable notices before each real use. These are application design choices based on the sources, not an NSF-issued form.

<!-- pagebreak -->

## 3 Researcher workflow

### Capture the original submission

Offer two explicit starting paths: capture saved GrantGuide drafts that the researcher confirms match the submission, or paste the exact submitted narrative section by section. Show saved revision IDs and the captured text before freezing. Capture requires a statement confirming the match, a submission date or explicit unknown, sponsor/application identifiers when known, and the coverage of the captured material.

The initial app has only three starter sections. Capturing those sections must display partial coverage; it cannot silently become a complete submitted proposal. A pasted capture may contain other sections with stable IDs and ordered labels. Layout, figures, tables and attachments that are absent from text remain explicitly unrepresented. The researcher can plan from a partial capture, but the review packet states the limitation and completeness cannot be asserted.

Freezing creates a new immutable submission snapshot. Later corrections create a replacement snapshot with a reason and a supersedes link. Never replace its contents in place, or silently capture the current draft when only the stage says Submitted.

### Enter feedback and inspect coverage

After freezing, select a target call and create an attempt. This atomically creates its blank or reviewed-copy target application; drafting can happen later. The attempt gives feedback and decisions an explicit scope before any reviewer text is saved.

Paste each reviewer critique or panel summary as a separate feedback source. Preserve a reviewer label such as Reviewer 1 or Panel; do not infer reviewer identity. Show the canonical text and version. The researcher selects exact passages and creates concerns manually, or requests optional suggestions for selected passages.

Accept, edit, split, merge or dismiss each suggestion. Every accepted concern retains at least one original passage. Merging retains all distinct supporting passages and labels; splitting retains the parent relationship. A rejected extraction suggestion is not a decision to ignore a real scientific concern.

Before marking feedback reviewed, inspect every nonempty paragraph. Each paragraph must have at least one reviewed range or an explicit disposition such as positive comment, administrative text or no action with a reason. This is a coverage aid, not proof that every issue was understood. Overlapping ranges are allowed. Added or corrected feedback requires renewed coverage review for that version.

### Plan actions and resolve conflicts

For each concern record an interpretation, importance chosen by the researcher, intended response, affected sections, owner label and actions. An action declares whether it needs clarification, an existing-evidence reference, new analysis, new data, a scope change or an administrative correction. Optional due dates use the existing uncertain-date model and appear in the in-app agenda.

If reviewers disagree, link the concerns in a conflict group, preserve both quotations and record a decision with its rationale and any call constraint. Do not choose by reviewer count or let AI discard the less convenient comment. A recommendation can be declined with an explicit explanation; the UI must distinguish this from an implemented change.

### Revise, respond and review

Create a separate target application, map old sections to target sections and link actions to exact saved revisions and evidence passages. Open the original and target side by side. Write one response per concern; optionally preview an AI draft based on selected accepted records. Only the researcher records completion after reviewing the evidence, revisions and response together.

The final view lists open concerns, evidence gaps, conflicts and stale decisions, then saves an internal packet. A download does not mark an application Submitted or a concern resolved.

<!-- pagebreak -->

## 4 Current code and dependency gaps

Inspection baseline rechecked at Git commit `5eb119f` on October 25, 2026. Roadmap 01 renderer and NSF-template work exists under `lib/proposals/`, with associated tests and an export-verification script; the workspace contract still has schema version 1 and three fixed sections. Preserve that work. Re-read these interfaces immediately before implementation and check dependency verification separately from the existence of code or another roadmap plan.

| Existing location | Integration required |
| --- | --- |
| `lib/schema.ts` | Current state schema is version 1; exactly three section keys, source/draft text bounded at 20,000 UTF-16 units, and four application stages. Add separate capture, feedback, attempt and review records. |
| `lib/repository.ts` | Serialized atomic JSON writes and global expected-revision conflicts are reusable. Add graph validation, migration and bounded commands. Current `saveApplication` reuses a project/call pair and cannot create a new submission cycle. |
| `lib/evidence.ts` | Exact saved source version/hash/offset validation is reusable. `cite()` chooses the first matching occurrence; add explicit range selection for repeated comments. |
| `modules/documents/src/index.ts` | Normalization removes an initial BOM and converts CRLF/CR to LF. It preserves other whitespace and uses a noncryptographic `fnv-pair` content identifier. Keep those citation semantics. |
| `modules/extraction/` | Labeled-line extraction and evidence validation are available. They do not implement semantic reviewer-concern extraction. Build the latter as an application adapter. |
| `lib/generation.ts`, `app/api/generate/route.ts` | Existing structured draft previews, fixture/live distinction, consent and expiring tokens establish a pattern. Add distinct concern/response schemas and share the request limiter. |
| `components/drafts.tsx`, `app/page.tsx` | Existing editors preserve dirty buffers on revision conflict. Add application-cycle selection and a Resubmission subview under application drafting/review. |
| `components/checklist.tsx`, `lib/readiness.ts`, `lib/exports.ts` | Add derived action agenda items, separate response-review issues and saved packet exports. Existing checklist Ready and issue waivers must not resolve a concern. |

### Dependencies that this release supplies

The baseline lacks immutable submitted snapshots, per-review feedback sources, resubmission actions and concern-to-revision links. Implement those here. Reuse existing evidence sources for research facts and existing drafts for target writing. Do not store reviewer comments as research evidence or consume the project's ten-source allowance for feedback.

### Optional roadmap integrations

Roadmap 01 can supply template section IDs and a verified DOCX/PDF renderer. Roadmap 02 can supply pinned file versions and extraction provenance. Use adapters for those capabilities when actually available. Pasted text, general section mappings, Markdown and JSON satisfy the first release independently. Roadmap 04 review findings may later seed concerns through an explicit import, keeping their origin distinct from sponsor feedback.

<!-- pagebreak -->

## 5 Proposed records and reference rules

Add a feature schema in `lib/resubmissions/schema.ts`, re-exported through the workspace contract. Names below are proposed. All persisted objects have validated IDs, provenance, created/updated timestamps and revision history where mutable. The server assigns IDs, timestamps and audit events.

| Record | Required content |
| --- | --- |
| SubmissionCapture | Project ID, optional original application ID, capture method, ordered mutable sections, source draft references, coverage inventory and researcher attestation draft. |
| SubmissionSnapshot | Frozen capture content; schema/normalization versions; original call/profile copies where available; exact research-evidence versions referenced by captured drafts; submission metadata, attestation, coverage, digest and optional supersedes ID/reason. |
| FeedbackSource | Attempt ID, project ID, kind (individual review, panel summary, decision or program guidance), descriptive label, optional checked URL and append-only normalized text versions. Guidance is not automatically a reviewer concern. |
| ResubmissionAttempt | Project ID, submitted snapshot ID, target application ID, revision, working/reviewed/archived state, prior-attempt link, sponsor profile/version, classification decisions and review fingerprints. A response-document draft stores ordered concern IDs, opening/closing revision histories and document-review fingerprint. |
| Concern | Attempt ID, revision, interpretation, one or more feedback citations, human importance, disposition, lifecycle state, section mappings, conflict links, origin and merge/split history. |
| RevisionAction | Concern IDs within one attempt, description, owner label, optional due date, action kind, evidence requirement, state, result summary and pinned evidence/revision links. Many concerns may share one action. |
| ConcernResponse | Concern ID, append-only text revisions, citations, missing inputs, manual/fixture/live origin, optional accepted-preview metadata and human completion decisions. |
| ResponsePacketSnapshot | Immutable copies of selected submission/target text, relevant feedback and evidence, matrix rows, decisions, issues, source labels, manifest version and SHA-256 digest. |

### Distinct kinds of reference

Feedback quotations use the existing citation field shape: `sourceId`, `version`, `hash`, `quote`, `start`, `end`. Resolve them only against feedback sources belonging to the same attempt. Reuse the shared exact-range validator with a normalized feedback document; do not pass them to the ordinary scientific-evidence selector.

Evidence references resolve to ordinary project sources at an exact saved version. A link records the supported claim, result date when relevant and whether the researcher classifies it as an observed result, existing fact or proposed work. A user assertion is labeled accordingly. Model output cannot change proposed work into an observed result.

Revision links identify target application, stable section ID, draft revision ID, text digest and an optional exact range. Original-section links resolve into the frozen submission snapshot. Every reference is checked on the server for existence, ownership, version/hash and range; Zod shape checks alone are insufficient.

### Stable section identities

Use an adapter returning ordered `{sectionId, label, revisionId, text, citations}` records. The baseline adapter supports summary/significance/approach; a future template adapter supports its own stable IDs. Captured old sections may have no target match. Persist explicit unmapped, one-to-many and many-to-one mappings; never map by array position or a renamed label alone.

### Digests and historical truth

Retain `fnv-pair` for existing citation compatibility. Separately compute SHA-256 over a canonical UTF-8 manifest for frozen snapshots. Specify fixed property order, sorted reference collections, meaningful section order, normalized text and an explicit manifest version; exclude the digest field itself. Preserve every text value needed to reproduce the packet. Digests detect accidental differences; local editable files and descriptive actor labels do not provide tamper-proof institutional auditing.

<!-- pagebreak -->

## 6 Lifecycle, completion and invalidation

Keep the underlying researcher's decision history immutable. Derive the current displayed state from the latest decision and its dependencies; a new save never erases an earlier completion event.

| State | Meaning and allowed transition |
| --- | --- |
| Suggested | Unaccepted manual or model interpretation. Accept/edit into Open, dismiss the suggestion, or split/merge with recorded lineage. |
| Open | Accepted concern with an explicit disposition and plan. Adding work moves it to In progress. |
| In progress | Actions exist; some required work or review remains. Request review when the completion conditions are met. |
| Awaiting review | The author considers the row ready. Only an explicit researcher decision can resolve it. |
| Resolved | Latest completion decision matches current dependencies. Show resolution kind: changed, clarified or recommendation not adopted. |
| Needs review | A dependency of a prior completion decision changed, or feedback was superseded. Re-review and record a new decision. |

Rejected extraction suggestions and duplicate/superseded concerns are retained with reasons and successor IDs; they are not counted as scientifically resolved. No hard deletion of referenced concerns, sources or snapshots. Archive records and preserve their references. Validate merge/split/duplicate graphs against self-reference and cycles.

### Conditions for human completion

A row needs a valid original quotation, a researcher-confirmed interpretation and disposition, reviewed action outcomes, an accepted response revision and current relevant links. A changed or clarified response normally identifies the exact target passage. If no proposal edit is appropriate, require an explicit no-edit explanation. A recommendation not adopted requires a rationale and conflict/call decision where relevant; do not describe it as implemented.

An action declared to need new evidence remains incomplete without a recorded result and supporting source passage. Cosmetic text edits, future-tense promises, a checked task box and the presence of any citation do not satisfy that condition. A negative or inconclusive result is valid evidence when described faithfully. Only a researcher can assess whether the source actually supports the response; deterministic validation checks its presence, provenance and selected classification.

Changing an evidence requirement to not needed requires a new reasoned disposition and re-review, with the old need retained in history. The tool must not silently downgrade evidence needs to make a row complete. Clarifying an existing passage can resolve an interpretation problem without requiring a new experiment.

### Dependency fingerprint

For each completion decision pin concern revision and feedback citations; action revisions/outcomes; selected evidence versions/classifications; mapped target revision IDs; response revision; relevant project revision; target call revision and sponsor-rule decisions. Compute a versioned fingerprint from these values.

A newer version of a linked evidence source, a replacement feedback version, a change in a mapped draft section, a project-fact edit, target-call change or revised response marks the affected decision Needs review. Unrelated source/section changes do not reopen unrelated concerns. A call or project edit may conservatively reopen the whole attempt where its scope is shared. Changing owner/due date alone is administrative and need not invalidate a scientific completion decision.

Old feedback quotations and original submission snapshots remain valid historical references. A newer version makes a decision require review, not an invalid historical quotation. Accepting a feedback correction explicitly reanchors or confirms affected concerns against the new version; never guess replacement offsets.

### Conflicts and attempt review

Linked contradictory recommendations require a recorded group decision before affected rows resolve. The attempt can be marked Reviewed only when all accepted active concerns have current completion decisions, coverage is reviewed, target classification is confirmed and no unresolved conflict remains. Call this internal review completion, separate from application readiness and sponsor eligibility. Archiving a partial attempt is allowed and retains open issues.

<!-- pagebreak -->

## 7 Application cycles and persistence contract

### Preserve the original application

Add `cycleId` and `originAttemptId` to applications. Migrated applications receive `cycleId: initial` and `originAttemptId: null`. Ordinary `saveApplication` keeps its current open-or-create behavior for the initial project/call pair. A dedicated `createResubmissionAttempt` command creates a separate target cycle for the selected project and call, even when the call is unchanged.

Creating an attempt and target is one atomic repository command. Assign a fresh application ID and cycle ID, return both IDs and distinguish applications by cycle in selectors. Repeated commands with the same scoped idempotency key return the existing pair; changing the payload for that key is a conflict. Do not accidentally reuse or overwrite a submitted application.

Let the researcher choose blank target sections or a reviewed copy from the frozen snapshot. Copy into supported target sections only after the mapping preview. Copied content gets new draft revision IDs with explicit inherited-origin metadata and the original manual/fixture/live provenance retained. Do not import an old generated revision as newly verified manual writing. Recompute requirements from the target call; do not copy Ready statuses, waivers or the Submitted stage.

### Lineage and formal type are separate

Record `relationship` as same program, different program or unknown. Independently record sponsor application type as new, formal resubmission or unresolved, plus citation/manual rationale, researcher confirmation and check date. NSF-first defaults are proposed values requiring confirmation, not facts inferred from a funder name. A changed call invalidates this confirmation.

Prior attempts can be linked into a chain. Each new attempt selects an exact submitted snapshot; it cannot use another attempt's current working draft as if submitted. Check project consistency and reject cycles. The first release supports one active target per attempt; replacing the target creates a successor attempt with retained history.

### Persistence and graph validation

Keep all metadata and pasted content in the existing workspace store for this local release. Apply commands to an isolated candidate state, validate the entire changed reference graph and serialized-size bound, then atomically write. Revision conflicts preserve client buffers. No auxiliary file write may be treated as a committed workspace save.

Extend demo reset protection to snapshots, targets, feedback, actions and packet references. Researcher records must retain every synthetic dependency they explicitly reference, with visible mixed provenance. Avoid leaving dangling records when synthetic records are replaced. Neither a reset nor an archive may rewrite frozen content.

### Migration without roadmap collisions

The inspected baseline is schema version 1; roadmap 01 and 02 both propose additional schema changes. Allocate the next version from the actual integrated repository at implementation time. Do not independently ship competing v1-to-v2 migrations.

Preserve the original file byte-for-byte in a server-owned, uniquely named backup before the first migrated write; validate both original and candidate schemas. Add empty feature collections and default application cycle metadata without inferring submission snapshots, decisions, human names or sponsor classifications. Migration is serialized, repeatable and tested on fixture copies. Unsupported future versions and corrupt data return a recoverable storage error, never demo reset. For rollback, stop the app and restore the backup using the matching prior code; do not feed the new store to an old binary.

<!-- pagebreak -->

## 8 Commands and HTTP boundaries

Continue using `POST /api/workspace` with `{expectedRevision, command}`. All feature commands enforce the same loopback, exact-origin, JSON, no-store and 120,000-byte body controls. Validate feature payloads strictly, including nested objects and graph references. The command families below define their intent; implement dedicated discriminated schemas rather than a generic patch endpoint.

| Command family | Required inputs and atomic behavior |
| --- | --- |
| `createSubmissionCapture`, `saveCaptureSection` | Project/original application, capture method and bounded section content or exact saved revision ID. The server copies selected saved content. Saving changes only the mutable capture. |
| `freezeSubmissionSnapshot` | Capture ID/revision, coverage, attestation and client operation ID. Validate all sections, copy pinned dependencies and create an immutable snapshot. Corrections require a new capture/supersedes reason. |
| `createResubmissionAttempt` | Submitted snapshot, target call, profile, blank/copy choice and idempotency key. Create attempt and target application together. |
| `saveFeedbackSource`, `reviewFeedbackCoverage` | Attempt, label/kind, source ID if editing, text or coverage decisions. Append text versions and record review against an exact version. |
| `saveConcern`, `decideConcernSuggestion` | Attempt, concern/revision when present, interpretation, original citation ranges and acceptance/disposition. Suggestions cannot supply a human completion field. |
| `splitConcern`, `mergeConcerns`, `recordConflictDecision` | Same-attempt IDs, retained citations, successor links and human reason. Update related references and invalidation together. |
| `saveRevisionAction`, `recordActionOutcome` | Concern IDs, action fields, result classification, evidence/revision links and explanatory outcome. Validate completion prerequisites; no generated task duplicates. |
| `saveConcernResponse`, `recordConcernCompletion` | Concern and response revision; manual response or preview token; completion kind/reason and expected dependency fingerprint. Reject stale completion with 409. |
| `confirmAttemptContext`, `reviewAttempt`, `archiveAttempt` | Sponsor classification/rule decisions, current fingerprint or archive reason. Never alter the target's Submitted stage. |
| `saveResponsePacket` | Attempt, export scope and current expected revision. Server derives a complete frozen packet from saved records and returns a packet ID. Unresolved packets are allowed and visibly labeled. |

### Read and generation endpoints

`POST /api/resubmissions/suggest` accepts attempt ID, selected feedback source versions/ranges, fixture/live mode, consent and expected workspace revision. Return a bounded, schema-validated preview and server token. No accepted concerns or actions are created until the researcher accepts chosen rows through a workspace command.

`POST /api/resubmissions/respond` accepts concern ID, selected action/evidence/revision IDs and the same mode/consent/revision controls. Return a response preview with missing inputs and an expiring token. The server assembles authoritative selected inputs; arbitrary client prompts are not accepted.

Use `saveResponseDocument` for the attempt's concern order, opening/closing revisions and assembled-document review decision. It does not change concern completion states. Accept a concern preview's reviewed selection in one atomic batch, retaining accepted and explicitly dismissed candidate decisions, then consume its token. Partial saves must not strand the remaining selected candidates behind a consumed token.

`GET /api/resubmissions/packets/:id?format=md` or `format=json` returns only the saved packet. Check local access and project/attempt ownership; use safe server-created filenames and attachment headers. Unknown IDs return 404. Repeated downloads do not refresh the snapshot from current state. The first release has no import-JSON endpoint.

### Conflicts, retries and errors

Use the existing global workspace revision in addition to entity revisions/fingerprints for meaningful error messages. For retryable create/freeze/packet operations store up to 200 idempotency receipts per project with command name, canonical input digest and result IDs; reject further entries with a retention action instead of silently expiring them. Check an existing receipt before the stale expected-revision check so an uncertain successful request can recover its original result. Retrying changed content under the same key returns 409.

Use 400 for invalid graph/input, 403 for origin/scope violations, 404 for unavailable IDs, 409 for stale revisions or idempotency conflicts, 413 for bounds, 415 for content type, 422 for invalid generated output, 429 for generation limits and 503 for storage failure. Cancellation/timeout returns the existing 408 behavior. Failed commands do not partially save. Client text survives failures and must never be replaced by a freshly loaded state without reconciliation.

<!-- pagebreak -->

## 9 Optional suggestions and grounded response drafting

### Concern extraction

Suggest concerns only from explicitly selected feedback ranges. Input includes source/version/hash, exact range, reviewer label and optionally selected original-proposal context. Separate the verbatim quotation from the proposed interpretation, category, likely evidence need and unresolved questions. Do not invent an importance score, reviewer identity, consensus or a suggested completed state.

The model returns at most 15 candidate concerns, each with one or more selected-source citations and an interpretation up to 1,000 characters. The server verifies schema, allowed source namespace, selected bounds and exact normalized substring. Repeated quotations must use the chosen occurrence's offsets. Reject invalid output as a preview error; do not silently repair quotations or accept the nearest text match. Human review judges whether an interpretation is warranted by a valid quotation.

### Response previews

Draft only from the accepted concern, selected action outcomes, selected evidence and exact target revisions. Include prior-submission context only when deliberately selected. Output response text, supporting evidence references, target passage references and missing inputs. Distinguish planned work from completed work; preserve negative/inconclusive results and disagreement with a recommendation. Unrecorded experiments remain placeholders or proposed actions.

Record prompt version, input fingerprint, mode/provider/model and generation time with accepted output. Keep usage/cost unknown when unavailable. Do not log full private prompts or raw reviewer content. Explicit acceptance saves a new response revision; editing that text retains its generation origin and records the human edit.

### Execution controls

Use the existing server-only AI adapter with an application-specific structured-output boundary. Neither endpoint can browse, fetch URLs, run code, modify sources or invoke tools. A response preview cannot assign owners, complete actions or resolve concerns. Pasted instructions embedded in comments remain data; escaping, schema validation and action isolation enforce the boundary outside the prompt. [S5]

Share one process-wide generation limiter across the existing draft endpoint and both new endpoints: one active request, six attempts per minute, 22-second timeout and caller cancellation. Keep the complete serialized prompt within 50,000 UTF-16 units; do not silently truncate. Start with 3,000 maximum output tokens for concerns and 2,200 for a single response; incomplete structured output is an error, with manual editing available.

Preview tokens expire after 15 minutes, are bounded in memory and bind operation kind, attempt/concern, allowed output and exact input revision/fingerprint. Validate them on acceptance, consume on successful acceptance and reject replay. Process restart loses previews, not accepted work. A live error never falls back to a fixture. Fixture generation accepts synthetic contexts only; mixed or researcher content uses manual mode or explicitly authorized live mode.

### Meaning of evidence

Exact quotation validation proves where words came from. It cannot prove a claim is true, that an experiment was conducted, or that a proposed response satisfies the reviewer. Completion records therefore state who reviewed the row, the selected result classification, what was reviewed and remaining limitations. No AI confidence number substitutes for that decision.

<!-- pagebreak -->

## 10 Comparison, responses and export behavior

### Old/new comparison

Compare the immutable submitted narrative to an explicit saved target revision. Use section mapping, headings and plain-text paragraphs. Show unchanged, added, removed and changed content; preserve the full original and target text beside any compact diff. Unmapped sections are visible on both sides.

For bounded deterministic comparison, split on blank lines while retaining character ranges, align exact paragraph matches with a longest-common-subsequence algorithm and render unmatched runs side by side. Cap alignment at 500 paragraphs per side or 250,000 matrix cells; above the cap show the complete two-pane text and a comparison-too-large notice. The full-text fallback must remain usable. This is a display algorithm, not a scientific assessment of substantial revision. Persist the algorithm version and selected revisions in saved packets.

Do not automatically carry a target span forward after edits. It remains attached to its historical revision until the researcher selects a new passage. A newer target revision triggers Needs review for affected rows. For incomplete captures or unsupported figures/tables, state precisely what the comparison excludes.

### Response editor

Each concern displays its original quotation, interpretation, action outcomes, supporting passages, linked target passages and response text. Retain manual revisions. Offer a researcher-controlled order for the assembled response, with reviewer/panel grouping available. Shared actions can appear in multiple rows without duplicate task records.

Support a separate free-text opening/closing narrative for the response document, with the same revision history and source rules. A change to it invalidates the assembled-document review, not unrelated row decisions. Sponsor delivery instructions remain adjacent to the editor. Without confirmed instructions, label the result Internal response draft.

### Frozen internal packet

Save a versioned packet containing original/target identifiers and lineage; capture coverage/attestation; sponsor-rule decisions; matrix; exact feedback quotations; action outcomes; evidence gaps and citations; selected old/new passages and revision IDs; accepted responses; open/stale/conflicting rows; current readiness results; mode/provenance labels; and a manifest with all included content versions and digest.

Save self-contained text copies for every included reference so downloads survive later archives or edits. Include only feedback/evidence actually selected for the packet, not every project source. The user previews disclosure scope before saving. A stale decision is exported as stale even if it was once completed. Old packets remain unchanged after new work.

### First-release formats

Markdown is the editable human document, using a numbered concern section for long text rather than an enormous table. JSON is a structured snapshot for inspection and future migration, with a format version and stable IDs. Escape Markdown metacharacters in quoted user text, indent quotations and omit active remote image embeds or raw HTML from generated structure. Render previews as text; do not execute arbitrary document HTML. JSON export does not imply supported re-import.

DOCX/PDF are optional follow-on formats through the roadmap 01 renderer after its checks pass. A clean sponsor response/introduction is a separate export profile, requiring confirmed destination, scope and layout rules. Never append internal comments, change markup or provenance pages to a purported sponsor attachment. No format certifies sponsor acceptance. The PDF accompanying this specification documents the plan; it is not a feature-generated response packet.

<!-- pagebreak -->

## 11 Bounds, security and recovery

These are proposed initial application limits, not sponsor restrictions. UTF-16 text bounds and HTTP byte bounds are independent; return a useful error when either is exceeded.

| Resource | Initial bound and behavior |
| --- | --- |
| Submission capture | 20 ordered sections; 20,000 UTF-16 units per section; 100,000 total narrative units. Save sections individually. Reject oversized content without truncation and explain partial coverage. |
| Feedback per attempt | 10 sources; 20 versions per source; 20,000 units per version; 100,000 total units across current versions. Split long reviews into labeled parts. Historical versions also count against workspace capacity. |
| Matrix | 100 active concerns, 200 total retained concerns, 200 actions, 20 citations per concern and 10 evidence/revision links per action. Reject excess rather than dropping history. |
| User text | Interpretation 1,000; action/rationale/result 3,000; each response/opening/closing revision 20,000; owner 100. Allow explicit empty/missing values during drafting, not false defaults. |
| History and snapshots | 100 revisions/events per mutable feature record, 50 submission snapshots and 50 saved response packets per project, 20 attempts per project. Explain archive/export options at the limit; archive alone does not free retained-history capacity. |
| Workspace | Proposed 25 MiB serialized UTF-8 cap for new writes. Preflight existing stores; an already larger valid store remains readable and exportable. Require a separately planned capacity change rather than destructive pruning. |
| HTTP and AI | Existing 120,000-byte JSON request limit; 50,000-unit complete prompt; bounded outputs, tokens, timeout and shared limiter as in section 9. |

Recheck storage growth with realistic fixtures before fixing these defaults in code. No automatic deletion, compression migration or hidden history truncation belongs in a limit handler. When history or receipts are full, users can export/archive and start a new project, or the maintainer can explicitly revise capacity after measuring it.

### Local data controls

Preserve loopback binding, exact same-origin mutations, server-only keys and path construction. Resolve project/attempt ownership even for local records to prevent accidental cross-project linkage. Use descriptive actor labels with a visible local-user default; these are not authenticated institutional identities. Escape all source/model strings in UI components and prevent remote media loads in document previews.

Reviewer text may contain unpublished research or personal information. Pasting stores it locally; it does not select it for live generation. Preview the selected content and require per-request consent before using a configured provider. Avoid unneeded reviewer names. Keep raw source content out of logs and browser analytics. Existing local storage is not encrypted or an institutional sensitive-data service; deployment or multi-user use needs its own design.

### Recovery

Test restart after accepted saves, interrupted atomic writes, missing historical references and corrupt storage on temporary copies. Broken graph references produce visible storage errors and recovery instructions, never a substituted latest source or fabricated empty snapshot. Preserve the original data and backup for diagnosis. A discarded AI preview is recoverable by regenerating; a failed preview cannot destroy a manual response buffer.

<!-- pagebreak -->

## 12 Implementation sequence and ownership

Use one active writer. The requesting user remains the human product/approval owner; the implementation lead is steward for schema/contracts/migrations and integration. Reconfirm a different owner only if the actual team changes. Do not introduce subagents, shared branches or new team approval machinery for this plan.

| Ticket | Deliverable and exit evidence |
| --- | --- |
| RM-01: contracts and migration | Reinspect current branch/schema; settle roadmap 01/02 interfaces; add feature schemas, reference validation, bounded histories and safe migration. Old fixtures round-trip with all content unchanged. |
| RM-02: submission truth | Capture UI, explicit attestation/coverage, frozen snapshots, corrected-snapshot lineage and exact-range references. Later draft/evidence edits cannot change frozen text. |
| RM-03: revision cycles | Atomic attempt/target creation, idempotency receipts, cycle selection and blank/reviewed-copy paths. Repeated same-call cycles coexist with original application data. |
| RM-04: manual matrix | Feedback intake/coverage, concerns, split/merge/conflict decisions, actions, source/revision links and agenda projection. The complete manual scenario works without keys. |
| RM-05: completion and staleness | Response revisions, researcher completion, dependency fingerprints and distinct attempt review/readiness. Required evidence gaps cannot be closed by cosmetic rewriting. |
| RM-06: comparison and packets | Bounded comparison, explicit unmapped sections, frozen Markdown/JSON packets and safe download. Historical packets reproduce after source updates and restart. |
| RM-07: optional AI | Shared limiter, separate suggestion/response previews, strict validation/consent, token replay protection and mocked-provider tests. Manual behavior stays complete after provider failure. |
| RM-08: NSF profile and release | Checked NSF guidance metadata, realistic synthetic fixture, full regression/browser journey, usability review and actual handoff evidence. Renderer integration is optional and separately gated. |

### File ownership for implementation

Proposed new files: `lib/resubmissions/{schema,snapshots,feedback,matrix,comparison,generation,exports}.ts`, `components/resubmissions/`, routes under `app/api/resubmissions/`, and `tests/resubmissions/`. Application-specific behavior lives in `lib`; reusable imported module code remains in `modules` and shared runtime validation in `packages`.

Shared edits: `lib/schema.ts`, `lib/repository.ts`, `lib/readiness.ts`, the agenda projection in the relevant component, `app/page.tsx`, existing generation-limiter wiring, browser acceptance and contract/status documentation. Avoid changing layout, global styles or manifests unless the integrated UI or a measured dependency actually requires it. Any necessary shared changes remain owned by the single lead writer.

### First implementation slice

Start RM-01/RM-02 on synthetic data: migrate a copied v1 workspace, capture three saved sections as explicitly partial, paste an additional section, freeze with attestation, edit the original drafts, restart and prove the frozen text/citations remain identical. Do not begin with model prompts or an official sponsor export. This slice validates the foundation needed to trust every later matrix row.

<!-- pagebreak -->

## 13 Acceptance and failure matrix

These are required future feature checks. They have not been run by writing this plan. Use synthetic, deliberately contradictory fixtures and mocked transports; ordinary tests make no external API calls.

| Case | Required observable result |
| --- | --- |
| A01 Existing workspace migration | Original records/text/history preserved; empty new collections; no invented submitted snapshot. Backup, repeat-run and unsupported-version paths verified. |
| A02 Partial original | Three starter sections cannot be represented as a complete sponsor proposal. Coverage limitations survive export and restart. |
| A03 Immutable submission | Draft/profile/call/source edits cannot change captured original text or referenced evidence. Correction creates a new snapshot with lineage. |
| A04 Same-call second cycle | Original and target have different IDs and histories. Ordinary open/create remains stable; idempotent retry returns the same target. |
| A05 Different-program application | Lineage preserved; formal type remains separately confirmed. A new opportunity alone cannot silently classify a formal resubmission. |
| A06 Quotation integrity | Repeated identical phrases retain selected offsets; BOM/newline and non-BMP Unicode cases match normalized UTF-16 ranges. Wrong hash/version/range rejected. |
| A07 Feedback isolation | Cross-attempt/project quotations and reviewer-text-as-scientific-evidence rejected. Historical versions remain readable. |
| A08 Coverage and correction | Added paragraph/corrected version invalidates coverage; omitted nonempty paragraphs stay visible. Reanchoring requires researcher action. |
| A09 Atomic split/merge | Retained quotes/lineage and action links remain correct; cross-attempt merge, self-links and cycles fail without partial save. |
| A10 Conflicting reviewers | Both recommendations remain inspectable. A reasoned human decision is needed before dependent rows resolve. |
| A11 Evidence-gap trap | Editing wording or checking a task cannot complete a new-data action without recorded results. Negative findings can be linked and described honestly. |
| A12 Clarification and disagreement | Existing supported clarification or reasoned non-adoption can resolve with the correct label; neither falsely claims an experiment or implemented change. |
| A13 Many-to-many links | One shared action can support several concerns without duplicate agenda tasks. Section mapping handles renamed, split and unmapped sections. |
| A14 Staleness | Linked draft/source/response edits invalidate affected decisions; unrelated edits do not. Old packets retain the old decision and input copies. |
| A15 Human decision boundary | Model fields/tokens cannot set completion, fake an actor or bypass evidence prerequisites. Checklist Ready/waivers do not resolve concerns. |
| A16 AI failure paths | Invalid quote, injected instructions, malformed/truncated JSON, no key, cancellation, timeout and rate limit preserve manual buffers; no live-to-fixture fallback. |
| A17 Preview binding | Wrong operation/attempt, changed input, expired token, replay and process-restart acceptance fail visibly; saved work remains. |
| A18 Concurrency and retry | Competing tabs return 409 with both buffers retained. Lost-success retries recover create/freeze/packet results before revision checks; changed payload conflicts. |
| A19 Deterministic comparison | Known additions/removals and mappings display correctly; large paragraph inputs use full-text fallback without losing text. No percentage implies scientific adequacy. |
| A20 Packet integrity | Markdown/JSON retain selected text, missing/stale/conflict states, provenance and digest. Downloads after edits/restart reproduce the saved artifact content. |
| A21 Security and bounds | Origin/content-type/body limits, cross-project IDs, malicious HTML/remote images and limit exhaustion fail safely. No secrets or raw reviewer content in logs/client bundles. |
| A22 Regression journey | Original manual drafting, evidence citations, fictional-call labels, dirty editors, readiness, ICS/Markdown and actual process restart still pass. |

<!-- pagebreak -->

## 14 Verification, evaluation and handoff

### Implementation checks

At feature implementation, use the repository's actual lockfile and documented commands: `npm ci`, `npm run check`, `npm run dev` and `npm run test:browser`. Preserve ongoing local modifications and coordinate package installation with the manifest owner. Run the feature suite with `npm test -- tests/resubmissions`; use temporary storage and the existing browser-test port isolation. If imports change, run the selected module README checks, including `npx vitest run modules/extraction/tests` and `node node_modules/vitest/vitest.mjs run modules/ai/tests`.

If DOCX/PDF response export is added, verify the available renderer first using the current roadmap 01 commands, including `npm run test:exports` if retained. Inspect rendered pages with long quotations, tables, Unicode, page limits and intentional overflow. An unavailable renderer leaves Markdown/JSON available and DOCX/PDF explicitly unsupported.

### Manual release journey

1. Start with a clean synthetic project and confirm the baseline manual application path still works.
2. Capture an attested, explicitly scoped original submission, create a same-call target cycle/attempt and enter independent reviewer/panel sources.
3. Review every feedback paragraph; accept, split and merge concerns; create a conflict and record a decision.
4. Open the separate target, assign actions and link exact evidence/target revisions. Keep a proposed experiment unresolved.
5. Compare old/new text, resolve a clarification and record an honest decision not to adopt one recommendation.
6. Save/export an unresolved internal packet. Restart and compare the saved content/digest. Edit a linked source and observe targeted Needs review.
7. Finish remaining legitimate work, re-review, export a new packet and inspect keyboard use, mobile layout and error recovery. Save actual screenshots, results and limitations.

### Evaluate useful behavior

Ask three to five applicants or research-office staff to turn synthetic or authorized, redacted feedback into a revision plan using their current process and the prototype. Record planning time, missed concerns, quotation mistakes, unsupported closure decisions, wrong target versions, duplicate work and corrections. Ask a domain reviewer to assess whether actions and responses address the selected comments. Report actual observations; no time-saving or funding-outcome claim has been measured.

For an optional AI evaluation, have human reviewers annotate a bounded set of feedback passages and acceptable concern interpretations before testing. Measure missed concerns, unsupported interpretations, false merges, valid citation rate and correction effort separately. Exact citation validity is not semantic accuracy. No default live evaluation or paid test is authorized by this documentation task.

### Handoff evidence

Record implemented tickets and actual integrated revision; migration backup/recovery result; exact commands and exits; fixture/live mode; browser journey and restart evidence; open defects; unsupported capture types; source check dates and unrun prerequisites. Update `docs/API_CONTRACT.md` and `docs/implementation/STATUS.md` only when the feature behavior and checks actually exist. Do not turn this specification into an implementation-complete status.

<!-- pagebreak -->

## 15 Sources, settled decisions and document status

### Primary research sources

- **S1:** [NSF PAPPG current-guide index](https://www.nsf.gov/policies/pappg), including its current version, draft replacement and listed policy supplements. Supplemental pages inspected: [Supplement 1](https://www.nsf.gov/policies/document/pappg24-1-supplement-1) and [Supplement 2](https://www.nsf.gov/policies/document/pappg24-1-supplement-2). Applicability must be checked for the actual proposal; no automatic policy-refresh service is proposed.
- **S2:** [NSF PAPPG 24-1, Chapter IV.E: Resubmission](https://www.nsf.gov/policies/pappg/24-1/ch-4-non-award-decisions-transactions), the source for the NSF-specific workflow distinction.
- **S3:** [NIH Resubmission Applications](https://www.grants.nih.gov/grants-process/submit/submission-policies/resubmission-applications), used to distinguish formal NIH A1 processes from a general revision workflow.
- **S4:** [NIH attachment page limits](https://www.grants.nih.gov/grants-process/write-application/how-to-apply-application-guide/page-limits), used to identify activity-specific introduction limits and the importance of applicable instructions.
- **S5:** [OWASP LLM Prompt Injection Prevention Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/LLM_Prompt_Injection_Prevention_Cheat_Sheet.html), used for the untrusted-content and application-enforced action boundary.

Sources support the factual findings in section 2. Product behavior elsewhere is a proposed design, not a claim that sponsors endorse this tool. Recheck policy before implementing an official sponsor export or applying it to a live opportunity. No full reviewer comments from real applications were collected in this task.

### Repository sources

The governing requirement is [roadmap 03](../ROADMAP.md), with its original [future-capabilities reference](../reference/GrantPath_Future_Capabilities_Roadmap.pdf). Read [ownership](../OWNERSHIP.md), [task card](../TASK_CARD.md), [API contract](../API_CONTRACT.md), [actual implementation status](STATUS.md) and [agent handoff](../AGENT_HANDOFF.md) before coding.

Related plans: [NSF proposal templates](FULL_PROPOSAL_TEMPLATES.md) and [document vault](02_DOCUMENT_VAULT_IMPLEMENTATION.md). Actual interfaces inspected are enumerated in section 4. Module references: [documents](../../modules/documents/README.md), [extraction](../../modules/extraction/README.md) and [AI](../../modules/ai/README.md).

### Decisions ready for implementation

General workflow, NSF first; text intake; local single-user storage; separate immutable submitted baseline and target cycle; manual completion with explicit evidence needs; optional bounded suggestions; internal Markdown/JSON packets; no required vault, hosted service or renderer. No further clarification is required to begin the bounded implementation once the user requests it.

A specific real target solicitation, actual submitted text, reviewer feedback, authenticated team roles or permission for external delivery are not supplied. They are inputs to a real application's setup, not prerequisites for implementing/testing the synthetic local workflow. A future NIH A1 profile or official response attachment needs its own scoped policy and layout validation.

### Work performed for this document

Completed: repository/instruction review, current NSF/NIH and OWASP source research, sponsor-scope clarification and implementation specification. The accompanying PDF is a rendering of this plan. Document QA checked all 12 relative references, the 22 acceptance cases, eight implementation tickets, PDF text bounds and rendered page layouts. Feature implementation, storage migration, package installation, app regression tests, paid provider requests, sponsor submission and deployment were not performed for this documentation task.
