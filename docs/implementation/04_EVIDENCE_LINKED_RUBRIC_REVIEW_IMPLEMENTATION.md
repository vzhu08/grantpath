# GrantGuide evidence linked rubric review implementation plan

Roadmap item 04 | Implementation specification 1.1 | October 25, 2026

Help a researcher find unclear claims, conflicting facts and gaps in support before submitting a proposal. Review a frozen draft against confirmed criteria and selected evidence, then retain the findings, researcher decisions and revision tasks together. Each finding must explain what to inspect and where to inspect it.

## 1 Release outcome and confirmed decisions

This task covers research and planning. Feature implementation is a subsequent task. The user confirmed a general workflow with NSF first, quantified scores with reasoning and fix recommendations, and personal ownership of criteria and live-use decisions. Optimize the first release for a hackathon demonstration: one review pass, a small understandable scorecard, exact evidence links and a short prioritized fix list.

| Decision | First release | Confirmation |
| --- | --- | --- |
| Sponsor coverage | General manually configured rubrics, with an NSF Research profile. | User confirmed general workflow, NSF first. |
| Results | Criterion scores with explanations, located findings and prioritized fix recommendations. | User explicitly requested quantified scores and reasoning. |
| Human authority | Requesting user owns scope, criteria approval and live-use decisions. | User confirmed both approval responsibilities; no extra teammate required. |
| Runtime | Existing local, single-user, single-process application. | Retain current architecture. |
| AI provider | OpenAI for semantic review. | User selected OpenAI. |
| Local AI authentication | Sign in with ChatGPT using the user's eligible plan allowance; stop when unavailable or exhausted. | User requested account usage with no additional paid usage. Eligibility and actual inference remain unverified. |
| Public-hosting AI authentication | Separately configured server-side OpenAI API key and metered API usage. | User intends to switch at public deployment; no deployment or paid test is authorized now. |
| Delivery | Internal review screen, revision tasks, saved Markdown and JSON report. | Separate from sponsor submissions and official panel reviews. |

A complete example starts with a synthetic proposal containing two inconsistent study sizes, a claim about pilot results unsupported by the selected records and a missing required section. The researcher freezes the saved draft and rubric, inspects located findings, accepts two actions, dismisses a false alarm with a reason, saves revisions and records a resolution. A second run retains the first run and all decisions. A restart preserves both reports; a later evidence edit marks affected decisions for renewed review.

The first release excludes award predictions, panel simulation, autonomous rewriting, open web literature search, vector infrastructure, collaborator accounts and sponsor submission. Figures, equations, study validity and unrepresented attachments have explicit coverage limits. Scores are labeled AI advisory estimates against the displayed rubric. A larger expert evaluation is future validation before scientific-quality claims, rather than a prerequisite to the hackathon demo.

The hackathon cutline is the NSF scorecard, top fixes, passage/evidence inspection, saved run history and a repeatable flawed-to-revised example. Reuse existing snapshots, source viewers and item 03 actions when integrated. Defer a custom rubric designer, advanced matching across reruns, a separate task-management UI and expanded report formats if they threaten that complete demo path. Preserve manual rubric entry and use basic explicit links for the generic core.

## 2 Research and resulting design choices

Sources below were accessed on October 25, 2026. The implementation decisions are engineering proposals; sponsor guidance and published experiments establish the narrower facts in the middle column.

| Source | Relevant finding | Design consequence |
| --- | --- | --- |
| [NSF current PAPPG page](https://www.nsf.gov/policies/pappg) | The current page identifies PAPPG 24-1, lists two supplements and describes replacement guidance as a draft. | Pin the applicable sources and check date. A year number or draft document cannot silently replace a confirmed rubric. |
| [NSF PAPPG III.A](https://www.nsf.gov/policies/pappg/24-1/ch-3-proposal-processing-review) | Intellectual Merit and Broader Impacts both require consideration. Particular programs may add criteria. The review elements cover potential contribution, creativity, rationale and assessment, qualifications and resources. | Preserve the two criteria and their source references. Add confirmed solicitation criteria separately; do not invent equal weights or an overall score. |
| [NSF generative AI notice](https://www.nsf.gov/policies/ai/merit-review) | NSF prohibits reviewers from uploading confidential merit-review material to non-approved AI tools. Proposers remain responsible for accuracy and authenticity and are encouraged to describe their use of generative AI. | Position this feature for an author reviewing authorized proposal material. It does not authorize official reviewers to process confidential third-party proposals. Record AI use to help the author prepare an accurate disclosure. |
| [SAGE grant-review preprint](https://arxiv.org/abs/2609.20829) | The authors evaluated structured, evidence-linked review on 35 nonprofit applications. Agreement was fair against original reviews and higher in a later assisted re-review. | Treat inspectable drafts for expert correction as a useful precedent. Our inference: the assisted round is not independent validation, and this small nonprofit study cannot validate NSF review or our implementation. |
| [Grant proposal quality preprint](https://arxiv.org/abs/2603.14565) | An evaluation using older fellowship applications found weak correlations with expert scores and identifies sample size, age and differing criteria as limitations. | Do not transfer scores or funding predictions from general model performance. Assess the selected domain and rubric directly. |
| [LLM judge bias study](https://arxiv.org/abs/2306.05685) | The authors document position, verbosity and self-enhancement bias in conversational judging. | Include reordered evidence and cosmetic verbosity controls in evaluation. Agreement in conversational preference tasks does not establish grant-review validity. |
| [ALCE citation research](https://aclanthology.org/2023.emnlp-main.398/) | Citation correctness and coverage need evaluation in addition to fluent prose. | Check exact references mechanically, and assess whether the cited material supports the finding separately. A valid quotation is not proof of entailment. |
| [PROBE hallucination benchmark](https://aclanthology.org/2026.findings-acl.2099/) | The benchmark separates claim decomposition, evidence finding, evidence evaluation and localization; evidence finding remains difficult. | Record those stages in the output and evaluate each. A single bounded request can return this structure without introducing several agents or autonomous retrieval. |
| [OWASP prompt injection guidance](https://cheatsheetseries.owasp.org/cheatsheets/LLM_Prompt_Injection_Prevention_Cheat_Sheet.html) | Documents and other external content can contain indirect instructions; permissions and validation must be enforced outside the model. | Supply no tools, fetch capability or write access. Treat the rubric, draft and evidence as data. Validate references, allowed IDs and output before persistence. |
| [OpenAI Structured Outputs](https://developers.openai.com/api/docs/guides/structured-outputs), [AI SDK structured data](https://ai-sdk.dev/docs/ai-sdk-core/generating-structured-data) | Schema-constrained output still needs application handling for refusals, incomplete output and semantic errors. The installed SDK's structured-generation pattern is supported by current v7 documentation. | Reuse the existing structured adapter. Add a review-specific validator and explicit failure states; do not accept partial JSON as completed review. |
| [OpenAI data controls](https://developers.openai.com/api/docs/guides/your-data) | Retention depends on endpoint and account controls; disabling stored response state does not by itself remove abuse-monitoring retention. | Show selected transmission contents and provider before consent. Verify adapter request options and account settings before real use; do not promise zero retention. |
| [Sign in with ChatGPT integration](https://developers.openai.com/cookbook/articles/sign-in-with-chatgpt), [plan usage overview](https://developers.openai.com/siwc/token-sharing-open-source) | Eligible local personal projects can request permission to use a ChatGPT plan for Responses API inference. Remotely hosted use follows separate availability rules. | Use the documented local OAuth flow for the hackathon and a separate API-key mode for public hosting. Account entitlement and remaining allowance require verification. |
| [Plan inference contract](https://developers.openai.com/siwc/token-sharing-open-source/models-and-inference), [preview limitations](https://developers.openai.com/siwc/token-sharing-open-source/preview-limitations) | Plan inference requires streamed, unstored requests and completion handling. Its supported fields differ from normal API-key requests. | Add a dedicated transport behind the same review contract; do not send the current adapter's options unchanged or reuse credentials from the Codex application. |

The NSF profile will offer Intellectual Merit and Broader Impacts with the reviewed policy excerpts, plus researcher-confirmed program additions. Its prompts ask about the identified review elements without turning them into a new official scoring scale. Unsupported scientific novelty or methodological criticism must be a question for expert assessment unless selected context supports a specific concern.

## 3 Repository integration and dependency gaps

Initial inspection used branch `feature/proposal-workflow`, observed HEAD `c69f833`, and local changes present on October 25. A later check found roadmap 01 integrated on main, with schema v2 and its own recorded checks. Tasks 02 and 03 are now proceeding in separate checkouts under the central ownership board. Re-read their final integrated contracts before coding item 04; preserve the current shared-file lease and allocate the next migration version from the actual handoff.

| Existing location | Reuse and required extension |
| --- | --- |
| `lib/schema.ts` | Keep `CriterionSchema` for eligibility. Add distinct review rubric, input, run, finding, decision, task and report contracts. |
| `lib/proposals/workflow.ts`, `lib/proposals/migration.ts` | Reuse canonical serialization, SHA-256 and packet interfaces if integrated and verified. Packet freeze currently captures linked drafting sources; review must also pin separately selected rubric/context evidence. |
| `lib/proposals/blocks.ts` | Reuse the document tree and `visibleText` projection. Add a stable mapping from review text to paragraph, list item and table cell locations. |
| `lib/evidence.ts`, `packages/contracts/src/index.ts` | Reuse source-version and quotation validation; add draft and rubric anchors scoped to the frozen review input. |
| `lib/readiness.ts` | Reuse administrative issues and their fingerprints. Add review rules without merging scientific suggestions into the readiness blocker count. |
| `modules/ai/src/index.ts`, `modules/ai/src/server.ts`, `lib/generation.ts` | Reuse fixture/live conventions and the API-key adapter where compatible. Add a ChatGPT-plan transport with its own OAuth, supported-field and SSE-completion handling. The drafting transport and preview schema are not review contracts. |
| `lib/repository.ts`, `lib/http.ts`, `app/api/workspace/route.ts` | Reuse serialized atomic saves, revision conflicts, loopback/origin checks and bounded JSON intake. Add review graph validation and durable run transitions. |
| `components/drafts.tsx`, `components/common.tsx`, `app/page.tsx` | Preserve dirty buffers and citation display; add the review view and navigation to exact saved passages. |
| `lib/exports.ts`, `tests/domain.test.ts`, `scripts/e2e.mjs` | Add a review report and focused regression coverage. Keep existing proposal exports and manual editing operational. |

Keep reusable review capability code under a new application-owned `modules/review/` with its own README and tests, following the root capability convention. Keep workspace commands, storage bindings and application adapters in `lib/reviews/`; use shared runtime/quotation utilities from `packages/`. This does not change the imported kit module selection or its provenance hashes. If existing scoped instructions assign a different location at implementation time, resolve that placement before the first edit.

The required dependencies are immutable saved text, confirmed rubric criteria and pinned evidence passages. Roadmap 01 can supply richer sections and snapshots; 02 can supply extracted file versions; 03 can receive explicitly imported actions. None requires completing those entire roadmaps first. Provide small adapters for the current text workflow and avoid a competing snapshot or task implementation when the integrated capability already exists.

## 4 Researcher workflow

1. **Choose the saved draft.** Show section labels, revision IDs and unsaved buffers. Require Save, discard explicitly, or return to editing before capture. Missing expected sections remain represented as missing; legacy three-section coverage stays visibly partial for an NSF packet.
2. **Confirm the rubric.** Select a bundled profile or paste authoritative criteria, preserve exact excerpts, review every criterion and confirm solicitation additions or unresolved instructions. Researcher-defined advice remains distinguishable from sponsor criteria.
3. **Select evidence and context.** Choose exact retained versions from this project. Label each record as reported research evidence, planned work, background context or an unverified researcher assertion. Preview what will be reviewed and any exclusions.
4. **Freeze and run.** Create an immutable input. Offer deterministic checks and manual annotation without keys; synthetic demo review uses explicit fixture mode. Live semantic review requires configuration and action-specific consent for the displayed selection.
5. **Inspect the scorecard and fixes.** Show each criterion's score, explanation, supporting passages and highest-priority fixes. Open the draft passage, criterion and evidence together. A criterion can remain unscored when context is insufficient.
6. **Decide and revise.** Accept a finding into a task, edit its interpretation, request expert review or dismiss it with a reason. Draft changes use the existing editor and create ordinary saved revisions. Accepting a finding does not accept a rewrite.
7. **Review the outcome.** Link a saved revision and evidence or record a reasoned no-change decision. Only an explicit researcher decision resolves a task. Run again against a new capture when desired and save an internal report with open issues and coverage limits.

The no-key path supports real deterministic checks, manual findings, decisions, tasks and exports. It does not substitute fixture critiques for semantic analysis of researcher data.

## 5 Review contracts and frozen inputs

### Rubric versions

`ReviewRubricVersion` has a stable rubric ID, immutable version, application/call binding, sponsor or researcher origin, confirmation record and ordered criteria. Each criterion has a stable ID, label, source excerpt or explicit manual origin, applicability, relevant section IDs, a review question and versioned score anchors. Source excerpts pin source ID/version/hash and exact ranges. Use up to eight criteria initially; additional subquestions remain within the relevant criterion. Keep sponsor criteria and the application's advisory scoring scale separately labeled.

Retain disputed or unknown instructions. An unresolved criterion can be recorded and displayed but cannot produce a sponsor-rubric assessment. Confirmed criteria can be reviewed with overall coverage labeled partial. A criterion introduced by the researcher must not be exported as an official requirement. Rubric changes create a new version; call amendments invalidate the current binding's confirmation until reviewed.

### Immutable review input

`ReviewInputSnapshot` retains application/project/call identity and revisions, ordered saved section revisions, canonical review text, represented/missing sections, rubric version, selected source versions and excerpts, context classifications, deterministic rule version and coverage exclusions. Include inherited manual/fixture/live provenance and relevant reuse references. Save the actual contents needed to reproduce the review, not just pointers to mutable current records.

When a verified packet snapshot exists, retain its ID/digest and construct a review-specific overlay for the rubric, selected evidence and coverage. Do not transmit its unrelated source history, old drafts or entire workspace. A text-only adapter produces the same review input shape from saved legacy sections.

Compute SHA-256 over a versioned canonical manifest with fixed object serialization and stable reference ordering; preserve meaningful section order. Exclude its own digest. Keep existing source hashes unchanged for compatibility. The snapshot digest identifies retained inputs; it does not establish an independently certified audit trail.

### Three distinct anchor types

| Anchor | Required identity and validation |
| --- | --- |
| Draft passage | Review-input ID/digest, section ID, revision ID, canonical-text hash, exact quote and UTF-16 end-exclusive range. |
| Criterion | Rubric ID/version, criterion ID and pinned official excerpt or labeled manual definition. |
| Evidence passage | Source ID/version/hash, exact quote/range, selected excerpt ID if applicable, and the declared role of that record. |

Version the text projection as `review-text-v1`. For block documents, build it from the same tree used for editing/export and retain offsets back to list items and table cells. Apply normalization once, preserve the mapping, and validate against the frozen canonical text. Repeated quotations require explicit offsets; do not locate them by the first text match. Never apply old offsets to the current editor buffer or silently reanchor after an edit.

An absent-section finding has a typed missing-section location and the expected requirement reference; it cannot invent a draft quotation. Missing evidence has an empty supporting-evidence list and an explicit reviewed-scope statement. Contradictions require both competing passages or a draft passage and a conflicting evidence passage.

## 6 Deterministic checks and semantic review

### Deterministic checks

Keep administrative results in their existing category: required section presence, known limits, placeholders, invalid/stale citations and unconfirmed requirements. A missing section is a blocker only when an applicable confirmed requirement makes it mandatory. Layout/page results require the existing verified renderer; text review cannot infer page counts.

Add a bounded consistency rule for researcher-confirmed facts such as planned sample size and project dates. A comparable fact records the entity/study, population/cohort, measurement, unit, timepoint and planned/observed status, plus exact spans. Compare values only when these dimensions match. The extractor may propose mappings, but free-form matches such as every occurrence of `n = ...` cannot become authoritative contradictions automatically. Different cohorts, recruitment versus analysis populations and proposed versus observed sizes are negative controls.

For unstructured prose, conflicting numbers are a semantic suggestion until their relationship is confirmed. Deterministic checks can identify a missing reference or declared evidence need; they cannot establish that an uncited result is fabricated or that an existing quotation scientifically supports it.

### One bounded model request

Provide the complete selected draft scope, confirmed criteria, selected evidence/context and explicit coverage limits. Ask for distinct findings and a coverage result for every selected criterion. For each finding return the claim, relevant passage, criterion, evidence relationship, concise rationale, severity, uncertainty and suggested action. Ask for an explanation suitable for the researcher, without storing private chain-of-thought text.

Suggested finding kinds are unclear claim, possible contradiction, support gap, missing discussion and criterion coverage gap. Evidence relationships are supports, conflicts, context only and insufficient in selected material. Suggested severity is minor, material or major; it has no effect on administrative eligibility or readiness. The researcher can correct it with a retained decision.

Criterion results use `concerns identified`, `no concern identified in reviewed scope`, `insufficient information` or `not assessed`. The result must explain the latter two and list covered sections. An empty findings array cannot convert unreviewed criteria into a pass. Low uncertainty does not mean calibrated confidence; record concrete reasons such as absent methods, partial text or unverified assumptions instead of confidence percentages.

### Quantified scores and fix recommendations

Return one advisory integer score from 1 to 5 for each assessable criterion, together with a concise explanation, exact draft references, evidence references where relevant and linked findings. Initial scale anchors are: 1 substantial gaps; 2 limited treatment or support; 3 adequately addressed within reviewed scope; 4 strong and well supported; 5 exceptionally clear, coherent and supported within that scope. These are application-defined anchors, not an NSF panel scale. The user can approve criterion-specific refinements before real use.

Use a null score with an explicit reason for insufficient information or unassessed criteria; do not convert missing context to zero or average it away. Keep coverage visible beside the score. Preserve prior scorecards and compare scores only with their pinned rubric, scope and model versions. No overall composite is needed for the hackathon; per-criterion scores avoid inventing sponsor weights. A later composite must expose its formula and exclusions.

Each recommendation states the problem, why it affects the criterion, the passage to change, the concrete next action and any evidence that must be supplied. Prioritize High, Medium or Low and show the top three fixes first. Suggestions may propose clarifications or evidence needs; they cannot manufacture pilot results or promise a particular score increase. All score explanations are user-facing rationales, without requesting private chain-of-thought.

Do not assert that a pilot result is false when no selected record supports it. Report that its support was not located in the reviewed material and ask for the relevant evidence. Planned experiments and hypothetical examples must remain distinct from claims of completed results. Novelty and study validity require suitable selected context and expert assessment.

### Output validation

Validate strict schema and field/count bounds, then resolve every anchor against the input's allowlist. Check project/application scope, versions, digests, exact quotes and ranges; reject unknown criteria, foreign sources, forged approval fields and incompatible finding/location shapes. Permit model references only to passages actually supplied in the request.

Validate that every requested criterion has exactly one coverage result and every finding links a criterion. Require a score/explanation pair, integer bounds, null-score reasons and valid recommendation links. Reject the whole semantic result on invalid references rather than quietly dropping inconvenient rows and claiming completeness. A valid quote with an irrelevant interpretation can still pass mechanical validation; the human decision and evaluation must address that limitation.

## 7 Run execution and provider boundaries

Persist `ReviewRun` with input digest, mode, rule/prompt/schema versions, OpenAI model, authentication mode (`chatgpt-plan` or `api-key`), start/end timestamps, usage metadata when available and a terminal result or sanitized error. Store normalized validated scores, rationales, recommendations, findings and coverage. A plan-funded run records its funding source rather than fabricating a zero-cost API estimate. Raw prompts are reproducible from the private snapshot; tokens, raw provider responses and sensitive error bodies do not belong in logs.

Use `running`, `succeeded`, `failed`, `cancelled` and `interrupted` states. Persist the run before the provider call and release the repository lock before network I/O. Commit results with a compare-and-set transition from running; an unrelated application edit must not discard valid output for its frozen input. Instead, show that the run reviews an older draft. Cancellation and completion races must have one terminal outcome.

Use an idempotency key scoped to the application and request payload. Retrying the same HTTP request returns the existing run and never makes a second paid call. A deliberately requested rerun has a new operation key, retains the previous result and consumes another explicitly consented request. After restart, mark unfinished runs interrupted and require an explicit retry; do not automatically spend usage.

Proposed starting bounds are eight criteria, twelve semantic findings, at most 90,000 characters for the entire rendered prompt, a 60-second timeout and zero automatic retries. API-key mode can request 6,000 output tokens within the existing module's bounds. The current plan-usage preview rejects `max_output_tokens`, so omit that field and use a 256 KiB response-byte bound plus timeout/cancellation locally; these are not an upstream token-cost ceiling. Validate practical latency/output capacity before enabling real use. Mark finding-limit coverage explicitly and do not present a capped list as exhaustive.

Keep the current 120 KB HTTP-body bound by sending saved IDs, expected revision, selection metadata and consent rather than the full draft. Reject an oversized assembled context before transmission. Offer an explicit smaller review scope, preserving excluded material in the coverage manifest; never silently truncate. Bound run/report counts and total workspace size with a recoverable limit error, initially validating a 25 MiB serialized-store ceiling and 100 runs per application against fixtures. Existing oversized stores remain readable/exportable, and are never truncated or reset.

Share one application-wide live AI concurrency gate with drafting, with a conservative configurable attempt limit. Keep controls server-side. Distinguish missing configuration, rate limit, cancellation, timeout, refusal, invalid output and provider failure where the adapter exposes enough information; otherwise return a safe generic error without inventing a reason. Deterministic results remain available when semantic review fails, with semantic coverage marked unavailable.

Use two explicit OpenAI transports behind the same validated review contract. In local mode, use the documented Sign in with ChatGPT registration/PKCE flow, a persistent opaque host identifier and locally protected server-side credentials. Validate OAuth state, nonce, identity and granted plan-inference scopes; manage expiry/refresh and disconnect. Request the signed-in account's model catalog and verify actual access with a small completed request during implementation. Do not read the Codex application's auth file, reuse its OAuth client identity or scrape a browser session. A suitable official local SDK may simplify the flow, subject to its verified interface and license.

Plan-funded requests use the public Responses endpoint with `store: false`, `stream: true`, context in an input array and instructions in a supported developer/instructions field. Omit the preview's unsupported fields, including the current API-key adapter's output-token and sampling options. Buffer structured output privately and validate only after `response.completed`; failed, incomplete or interrupted streams never become scorecards. Check structured-format compatibility in the initial spike and preserve the common JSON/Zod validation contract if provider-side constraints differ. [Inference contract](https://developers.openai.com/siwc/token-sharing-open-source/models-and-inference), [preview requirements](https://developers.openai.com/siwc/token-sharing-open-source/preview-limitations).

The user authorizes use of included account allowance, with no additional paid usage. Show Using ChatGPT plan and a usage-management link. If eligibility, authorization or allowance is unavailable, stop and offer manual work or the labeled synthetic demo. Do not purchase/top up credits or automatically switch to a saved API key. The account's applicable usage/credit settings must be verified before claiming the no-additional-payment requirement is met; successful sign-in alone does not establish inference entitlement.

For later public hosting, configure the separate API-key transport explicitly using server secrets, with application access controls and usage limits. Switching funding modes preserves review contracts and labels but may change available models, so retain actual model/authentication metadata in each run. The local account connection is not carried to the public server. Reuse the existing live enable switch; credentials remain server-side and sources cannot select endpoints, invoke tools, fetch URLs or alter consent. Verify transport behavior with mocks and then an account-funded smoke test; paid API tests remain excluded.

Fixture mode accepts only wholly synthetic inputs, including rubric and selected context, and remains labeled throughout persistence and export. Manual review of mixed-provenance records remains available with those labels preserved. Live failure never falls back to a fixture.

## 8 Decisions tasks and reruns

Separate immutable `ReviewFindingOccurrence` records from the researcher's `FindingThread`, append-only `FindingDecision` events and linked `ReviewTask` revisions. A generated finding starts Suggested. The researcher may accept it into Open, edit its interpretation, request expert review, dismiss with a reason or identify a duplicate. Preserve the generated original and all rationale.

Tasks record an owner label, uncertain due date, needed action, evidence need, status and relevant section IDs. Owner labels are descriptive in this local app; they do not grant access or send messages. Project due tasks into the in-app agenda, keeping scientific findings out of mandatory document requirements unless an actual confirmed requirement warrants a separate administrative task.

Resolution requires an explicit researcher decision linked to exact saved revisions and relevant evidence, or a reasoned no-change decision. If the action requires a new result, retain it as open until the result and supporting record are entered and reviewed. A saved rewrite, an AI assertion that the issue was fixed, or a checked task box cannot close that evidence need.

Pin resolution dependencies: finding interpretation, criterion/rubric version, affected draft revision IDs, relevant evidence versions/classifications, project/call versions and the disposition. A change marks only affected resolutions Needs review, except shared project/call changes may conservatively affect the run. Administrative owner/due-date changes do not reopen scientific review. Historical anchors stay valid against their retained snapshot even when the current draft changes.

For the exact same input, use deterministic fingerprints to suggest duplicate occurrences. For changed text, offer a proposed thread match; the researcher confirms it. Do not merge by sentence similarity alone or carry a dismissal automatically into changed evidence/rubric context. Reruns never erase decisions, recreate already linked tasks or auto-resolve findings absent from the newest output. Show previous unresolved findings omitted by the new run explicitly.

When roadmap 03 is available, an explicit import creates a linked matrix concern/action retaining `origin: internal AI review`, run/finding IDs and original anchors. Never label that material sponsor reviewer feedback. Without 03, review tasks provide the complete local workflow.

## 9 API UI storage and exports

| Interface | Proposed behavior |
| --- | --- |
| Workspace commands | `saveReviewRubric`, `confirmReviewRubric`, `freezeReviewInput`, `recordFindingDecision`, `saveReviewTask`, `resolveReviewTask`, `saveReviewReport`; existing expected-revision guard. |
| `POST /api/review-runs` | Saved input ID, expected revision, mode, idempotency key and explicit usage confirmation; persist the run, execute one bounded request and return its state. No arbitrary prompts or raw provider credentials. |
| `GET /api/review-runs/:id` | Read durable status and validated results after refresh; local access check and no-store response. |
| `POST /api/review-runs/:id/cancel` | Same-origin bounded request; transition only an active run and abort its in-process controller. Safe terminal-state response on repeat. |
| Report download | Return an identified immutable saved report in Markdown or JSON, never an arbitrary filesystem path. |

Keep review navigation within the selected application. The setup screen previews scope/rubric/evidence and identifies ChatGPT-plan or API-key mode; the result screen starts with the criterion scorecard and top three recommended fixes, followed by separate administrative checks, coverage and detailed findings. A finding panel shows original and current text distinctly and supports keyboard navigation to the retained passage. Opening an old finding cannot place its highlight on a changed current draft. Preserve the current dirty-buffer and revision-conflict behavior, and check desktop and 390 px layouts.

Store the feature collections in the existing repository, validating all reference graphs and serialized size before atomic replacement. Use one next schema version allocated from the integrated state; do not compete with roadmap 01/02/03 migrations. Back up original bytes before the first migration write, validate old and candidate states and make retries idempotent. Preserve legacy citations, snapshots, labels and pending edits. Unsupported future schema versions and corrupt data return a recoverable storage error.

Keep referenced snapshots, rubrics and source versions when archiving or resetting synthetic demo records. Retain mixed-provenance dependencies, prevent dangling links and never synthesize old review decisions during migration. An explicit maintenance/archive design is needed before exceeding the store bounds; no automatic history deletion.

A saved report freezes the reviewed input, run IDs, scores and rationales, recommended fixes, criterion coverage, administrative results, finding occurrences, decisions and linked task/revision evidence as of the save. Export the report digest, OpenAI model/authentication mode, version metadata, missing/excluded material and remaining actions. A later edit creates a new report; old downloads remain reproducible. Escape untrusted text and Markdown metacharacters appropriately; render in-app quotes as text nodes and never execute source HTML.

Markdown and structured JSON are the first-release formats. Use the existing verified renderer for an optional internal PDF later; it must not make an internal review appendix part of the sponsor narrative. Saving or downloading a report does not set Submitted, Ready or scientifically valid.

## 10 Implementation sequence and ownership

One active writer owns each file set. The requesting user owns scope, criteria and live-use approval. The parent orchestrator currently coordinates shared-file leases for tasks 02 and 03; item 04 implementation must receive an exclusive scope before editing those paths. This chat owns this planning specification. A future item 04 lead is technical steward for review contracts, with shared migration/manifest changes coordinated under the active ownership board. A local OAuth SDK could require a scoped dependency change; inspect its actual interface before adding it. Additional agents require an authorized exclusive scope and separate checkout/branch for any concurrent writer.

| Work package | Main files and dependencies | Completion gate |
| --- | --- | --- |
| ER-01 Confirm interfaces and local AI access | This specification, actual integrated schema/workflow, ownership, local OpenAI authentication spike. | Confirmed decisions retained; scope/anchor contracts fixed; account-funded completed inference and no paid fallback verified. |
| ER-02 Rubric and immutable input | `modules/review/src` contracts/projection; `lib/reviews` adapters; schema/migration integration. | Legacy/rich sections, rubric and selected evidence freeze reproducibly; forged/mismatched anchors fail. |
| ER-03 Deterministic review and manual path | Review rules, readiness adapter, decision/task commands. Depends on ER-02. | No-key workflow persists through restart; sample-size comparability controls and missing sections behave correctly. |
| ER-04 Structured AI and run lifecycle | Review score/rationale/fix schema, plan/API-key transports, run routes, shared usage gate. Depends on ER-02 and ER-01 access spike. | Mocked valid/refused/malformed/cancelled/interrupted/idempotent requests preserve inputs and drafts; exhausted account allowance never switches to paid API use. |
| ER-05 Review UI and revisions | Scorecard, top fixes, source highlights and existing revision/action adapters. Depends on ER-03/04. | Scores and reasons are inspectable; accept/dismiss/task/resolve, stale decisions, dirty buffers and rerun history work in the browser. |
| ER-06 Reports and integration | Saved Markdown/JSON reports, optional item 03 adapter, focused regression checks. | Exact saved reports survive edits/restart; existing manual drafting and exports pass. |
| ER-07 Hackathon demonstration and later expert pilot | Small synthetic owner-reviewed acceptance set and account-funded OpenAI run. Expanded held-out domain set is subsequent validation. | Demonstrate located defects, explained scores and actionable fixes; retain experimental labels. Expert validation precedes scientific-quality claims. |

ER-03 and ER-04 have a common input contract; their pure domain work need not wait for every vault/resubmission feature, while shared integration follows the actual lease. For the hackathon, prioritize the complete ER-01 through ER-06 demo path and a small owner-reviewed ER-07 acceptance set. Expanded expert evaluation is required before claiming scientific-quality performance; engineering fixtures do not establish that claim.

## 11 Acceptance cases and evaluation

| Case | Required result |
| --- | --- |
| A01 Confirmed rubric | Official versus custom criteria are visible; stale call confirmation and unresolved criteria cannot become a complete sponsor assessment. |
| A02 Scope and freeze | Saved section revisions and selected evidence stay unchanged after later edits; unsaved buffers never enter a snapshot silently. |
| A03 Missing section | A genuinely required absent section is located by requirement/section identity; partial capture is distinguished from confirmed absence in the application. |
| A04 Conflicting sample sizes | Comparable confirmed facts of 80 and 120 produce a located conflict; different cohorts/timepoints and planned versus observed values do not trigger that deterministic rule. |
| A05 Unsupported pilot claim | The planted claim is flagged as unsupported in the selected records; planned work is not described as a fabricated completed experiment. |
| A06 Useful positive evidence | A matching supporting result reduces the planted support gap; a generic or unrelated citation cannot establish support merely by existing. Semantic behavior is evaluated separately from quotation validity. |
| A07 Exact references | Forged source/version/hash, foreign project, duplicate criterion results, ambiguous repeated quotations and malformed UTF-16 ranges fail validation. Table/list/Unicode anchors open the correct retained location. |
| A08 Abstention and coverage | Missing context yields insufficient information or not assessed. Empty/capped findings and an excluded section cannot produce a full-review pass. |
| A09 Untrusted content | Draft/rubric/evidence instructions to ignore rules, fetch a URL, leak a key or fabricate approval cannot cause an external fetch, write, acceptance or forged human decision. |
| A10 Provider failure | Refusal, invalid output, timeout, cancellation and missing configuration preserve drafts and deterministic results, with semantic coverage unavailable. |
| A11 Run recovery | Duplicate request produces one provider call; explicit rerun produces a new retained run. Restart interrupts active work; cancel/complete races have one terminal state. |
| A12 Decisions across reruns | Accepted/dismissed findings and tasks survive; omission by a new run does not close an issue. Changed input requires reviewed matching and dependency checks. |
| A13 Evidence and resolution | A wording-only revision cannot satisfy a task needing a new result; replacing relevant evidence reopens review, while owner-only edits do not. |
| A14 Persistence and exports | Migration on copied stores preserves data; restart, demo reset and report downloads retain all referenced versions and labels. Saved reports remain byte-reproducible. |
| A15 Original journey | Manual project/call/checklist/drafting/export still works; desktop/mobile, keyboard access and conflict recovery preserve editors. |
| A16 Explained scores | Each assessable criterion has a valid 1-5 score, reason and traceable passages; unassessed criteria retain null. Prior runs retain their scale/model metadata. |
| A17 Useful fixes | Top recommendations explain where, why and what to change, preserve evidence needs and create/link actions only on acceptance. |
| A18 Account funding | Local mode uses its own approved ChatGPT-plan connection; unavailable/limited allowance preserves work and cannot invoke API-key mode. Terminal stream failure cannot save a scorecard. |

For hackathon acceptance, use six to eight short synthetic examples covering a flawed/corrected pair, sample-size comparability controls, unsupported versus planned results, missing sections, insufficient context and adversarial source text. The user reviews whether the displayed score rationales and fixes are useful. Run an actual account-funded case when sign-in/allowance is verified; label fixture-only runs as fixture-only. Capture the three-minute journey from scorecard to evidence to saved revision, then retain a before/after run comparison.

For later scientific-quality validation, build a held-out set of at least 24 synthetic or authorized cases with matching negative controls. Two suitable human reviewers independently annotate material findings, passage locations, support, score-anchor judgments and necessary abstentions before inspecting model output, then adjudicate disagreement. Do not tune on that held-out set. Additional expert staffing is not required for the hackathon demonstration.

Report finding precision/recall by category, exact-anchor validity, criterion coverage, evidence-support judgments, false-positive rates on corrected controls, appropriate abstention, action usefulness and researcher correction effort. Report raw counts and disagreements with percentages; a small pilot cannot establish general scientific validity. Include repeated runs and evidence-order/verbosity controls to expose instability. Pin model, prompt, schema, rubric, source selection and rule versions.

Mechanical acceptance requires all persisted anchors to validate and the relevant lifecycle/security cases to pass. For hackathon acceptance, inspect detection and false alarms on the small set and retain the experimental advisory label. For the later domain pilot, proposed targets are at least 90% precision and 90% recall on material planted issues, no false deterministic conflicts on comparability controls and correct insufficient-information handling for deliberately unanswerable cases. These are future evaluation targets, not current results or a hackathon staffing requirement. Never hide errors behind a high score.

Default tests use deterministic fixtures and mocked transports without external APIs. During implementation run `npm ci`, the new module's documented check, `npm run check`, `npm run test:browser` and the local `npm run dev` smoke path in isolated test data/ports. Run document/extraction/AI module checks when their interfaces change. At an application handoff, also build/start the owned review server and verify its health as required by the repository. Renderer checks are required only for changed renderer behavior or an added PDF report.

## 12 Planning handoff

The sponsor/scoring/approval choices are confirmed. The next implementation step is ER-01: obtain the coordinated file scope, reconcile integrated interfaces and verify the local Sign in with ChatGPT path using eligible included allowance. The user remains the live-use owner; no paid top-up, automatic paid fallback or deployment is authorized. Name additional evaluation reviewers and a domain corpus only when expanding beyond hackathon acceptance into scientific-quality validation.

This specification is a documentation change. Central roadmap/ownership records belong to the parent orchestrator; current application work and the item 03 plan are outside this write scope. Application tests, package installation, data migration, account sign-in/inference, paid provider evaluation, deployment and sponsor submission are not part of this planning update. Documentation checks do not establish that the OpenAI account connection or item 04 feature is implemented.
