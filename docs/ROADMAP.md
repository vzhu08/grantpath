# GrantPath future capabilities

Status: **future goals, not implemented scope**. Audience: researchers, human maintainers and coding agents. This is a dependency-aware planning backlog, not authorization to expand the first build or a promise of delivery dates.

Source: [the supplied future-capabilities roadmap](reference/GrantPath_Future_Capabilities_Roadmap.pdf). The companion [implementation brief](reference/GrantPath_Codex_Implementation_Prompt.pdf) defines iteration one. The user explicitly requested that this roadmap be saved in project docs after the initial build. Its original document is preserved alongside this actionable guide.

The baseline is a single-user local app with project/text evidence, exactly six fictional calls plus pasted calls, explainable eligibility, sourced requirements/document statuses, agenda and one-event ICS export, three editable proposal sections, optional bounded AI and deterministic readiness checks. Consult [verification](implementation/STATUS.md) for what was actually tested; a planned baseline is not evidence of implementation.

## How humans and agents should use this backlog

Apply the standing [hackathon project goals](PROJECT_BRIEF.md): technical impressiveness, clarity, impact and novelty within a fixed event time budget. This backlog is not an event completion checklist or a mandatory implementation order. Choose a bounded, distinctive demonstration whose researcher value and technical mechanism judges can see; weigh remaining effort, integration risk and rehearsal time before adding breadth. Reuse working foundations, defer low-value generalization and preserve a credible end-to-end path. Implementation 02–04 is authorized; for selected 05–09 the user authorized a new implementation chat after each reviewed research handoff. Research 05/07/09 is complete and implementation dispatched; 06 research is unlocked, 08 held for 06. Prerequisite information, human decisions and exclusive integration gates remain required.

Choose one bounded addition for an explicitly authorized release. Check its dependencies against the current code and verified behavior. Keep source versions and accepted edits connected across the workflow. Make uncertainty and failure visible. Separate deterministic arithmetic from AI suggestions. Do not ship extra modules simply to fill navigation. Use synthetic or authorized data for demos.

Every release must demonstrate a complete persisted workflow, traceable inputs, missing-data/stale-source/failure cases, and regression checks for the original manual journey. A plan is not an experiment; a cached demo feed is not live; an exported report is not certified. Evaluate time saved and corrections needed. Award-rate improvement requires longitudinal evaluation with appropriate comparisons, not a model grade.

The order below ranks feasibility of the described bounded versions, not effort estimates or market novelty. Domain expertise can justify swapping GrantWeave and AimFit. Do not build every ordinary feature as a prerequisite to testing one bounded novel concept.

| Order | Future goal                                  | Feasibility / main prerequisite                            |
| ----- | -------------------------------------------- | ---------------------------------------------------------- |
| 01    | Full proposal templates and reusable content | High; versioned drafts and export renderer                 |
| 02    | Document vault and manual ethics records     | High; safe parsing and protected file storage              |
| 03    | Resubmission response matrix                 | High; submitted snapshots, sources and tasks               |
| 04    | Evidence-linked AI rubric review             | High for a bounded assistive version; frozen drafts/rubric |
| 05    | Award obligations and progress reports       | Moderate; approved award terms and actual progress         |
| 06    | Budget planning and expenditure ledger       | Moderate; exact deterministic money/versioning             |
| 07    | Scheduled reminders outside the app          | Moderate; deployed scheduler/outbox/delivery provider      |
| 08    | Sponsor financial-report preparation         | Moderate; reconciled ledger and sponsor template           |
| 09    | Live opportunity discovery                   | Moderate to difficult; one official feed adapter           |
| 10    | Team workspaces and institutional connectors | Difficult; authorization/storage migration and access      |
| 11    | GrantWeave                                   | Difficult; confirmed compatibility constraints and solver  |
| 12    | AimFit                                       | Difficult, domain dependent; validated study/cost model    |
| 13    | Bootstrap                                    | Most demanding; scientifically valid gap-to-evidence model |

## 01 — Full proposal templates and reusable content

**Outcome:** complete a narrative packet for one or two supported sponsor templates, beyond the three starter sections. **Inputs:** researcher-confirmed call/template, section order and limits, approved facts, reusable bios/facilities text and prior accepted revisions.

**Bounded release:** add section-level requirements, provenance-aware reusable content, controlled updates across applications, and DOCX/PDF export with validated layout. Human review is required when reusing text; results or approvals from one project cannot automatically become facts about another. Output a versioned packet, unresolved-input list and section-to-call mapping.

**Dependencies:** existing draft/version model, call requirements and a reliable export renderer. **Acceptance:** correct section order/headings/limits; traceable reused content; changed sources mark affected sections stale; exports preserve tables/headings and unresolved warnings. **Limit:** a supported template does not imply support for every sponsor form, attachment package or portal.

## 02 — Document vault and manual ethics records

**Outcome:** link required attachments and claims to specific file versions and expose missing or expired records. **Inputs:** PDF/TXT/DOCX files, categories, project/application, owner, version/date, and manually confirmed approval scope/status/expiry.

**Bounded release:** allowlisted size-limited uploads, text extraction, searchable metadata, requirement-to-file links and revision history. Track IRB, animal-study, data-use, training and conflict-of-interest records as user-confirmed statuses. Add OCR only after ordinary parsing works, with visible uncertainty and metadata review. Output an inventory, supported claim links, stale/missing notices and expiry tasks.

**Dependencies:** safe parsers, protected file storage, version records and access checks before hosting. **Acceptance:** replacement preserves referenced versions; unreadable files remain in inventory but cannot supply drafting evidence; expired records retain their specific scope/date without a fabricated project-wide prohibition; a human confirms approval. **Limit:** tracking cannot issue ethics approval or determine legal compliance. Formal institutional integration belongs to 10; sensitive study data requires a suitable privacy/storage design.

## 03 — Resubmission response matrix

**Outcome:** turn a rejected application into a traceable revision plan. **Inputs:** the exact submitted proposal, reviewer comments/summary statement, target call and current project facts.

**Bounded release:** paste comments; propose distinct concerns supported by exact quotations; let the researcher accept tasks, owners, affected sections and evidence needs. Link revisions to concerns and export an editable response. Represent concern → action → evidence → revision → response, with unresolved state until a researcher records completion. Distinguish formal resubmission from applying to a different program.

**Dependencies:** frozen proposals, source references, tasks and drafting. Pasted text is sufficient; file support can use 02. **Acceptance:** every concern resolves to the original comment; cosmetic rewriting does not close an evidence gap; no completed experiment is claimed without a recorded result; old/new versions are comparable. **Limit:** resolving comments cannot guarantee funding, and conflicting suggestions/call conditions require a decision.

Implementation plan: [Resubmission response matrix specification](implementation/03_RESUBMISSION_RESPONSE_MATRIX_IMPLEMENTATION.md) - general workflow, NSF first; researched plan, feature implementation pending.

## 04 — Evidence-linked AI rubric review

**Outcome:** identify unclear claims, inconsistent facts and weak support. **Inputs:** frozen draft, actual call rubric, selected scientific context and evidence records.

**Bounded release:** one structured review pass plus deterministic checks. Return criterion-level findings with draft spans, rationale, severity, uncertainty and suggested actions. Persist accepted/dismissed findings and revision tasks. Prefer statuses; any optional numeric grade must show its rubric and tool-generated nature, retain prior runs and never imply award probability. Keep administrative blockers separate from scientific suggestions.

**Dependencies:** stable snapshots, confirmed criteria and evidence retrieval; a domain-expert evaluation set before scientific-quality claims. **Acceptance:** detect planted contradictory sample sizes, unsupported pilot results and missing sections; locate relevant passages; admit insufficient evidence; reruns preserve accepted findings. **Limit:** plausible critique is not calibrated peer review, scientific validity or a likely panel score.

Implementation plan: [Evidence linked rubric review specification](implementation/04_EVIDENCE_LINKED_RUBRIC_REVIEW_IMPLEMENTATION.md) - v1.1 with confirmed NSF-first workflow, scored criteria/reasons/fixes, requesting-user approval ownership and local ChatGPT-plan allowance mode. Implementation is now authorized in a separate chat; account access and feature acceptance remain to be verified.

## 05 — Award obligations and progress-update drafting

**Outcome:** manage notice-of-award obligations and draft evidence-backed progress reports. **Inputs:** award agreement, approved scope/budget, reporting template, milestone plan and actual research updates.

**Bounded release:** one award per application, quoted proposed obligations with human confirmation, editable milestones and one narrative report template. Preserve proposed, approved and amended scope/budget separately. Use the existing agenda initially. Output reporting dates, responsibilities, obligations and an honest account of completed, delayed or unreported work.

**Dependencies:** source/document versions, tasks, facts and drafting; text-only award intake can precede the vault. **Acceptance:** imports do not overwrite proposed budgets; delayed milestones are described honestly; unsupported results remain missing; accepted reports retain evidence snapshots. **Limit:** a proposal does not prove performance. Sponsor submission, certification and acceptance remain human actions. Financial reporting is 08.

## 06 — Budget planning and expenditure ledger

Task 05's completed [award specification](implementation/05_AWARD_OBLIGATIONS_PROGRESS_REPORTS_IMPLEMENTATION.md) now supplies the parent-reviewed logical research boundary. Task 06 planning is dispatched; actual checked award DTO/migration/receipt/amendment/restart behavior is still required before code integration.

**Outcome:** track requested, awarded, spent, committed and remaining amounts by category/period. **Inputs:** proposal budget, approved award/amendments, category/rate assumptions, transactions, commitments and a defined CSV format.

**Bounded release:** one currency per award, explicit periods/category mappings, integer minor-unit or exact decimal money, deterministic personnel/equipment/other totals. Separate actuals, commitments and forecasts. Include optional receipt links, duplicate detection and an audit trail. The user confirms indirect-cost bases/rates. Output proposal budgets and budget-versus-actual/remaining balances; amendments preserve transaction history.

**Dependencies:** award records, deterministic calculations and versioning; reconcile with an institutional source before authoritative balances. **Acceptance:** repeat imports never double-count; rejected rows remain visible; refunds/credits work; totals reconcile exactly; negative balances remain visible; amendments retain before/after values; an expense is not counted again as a commitment. **Limit:** a project ledger is not institutional accounting. A positive balance does not prove allowability or legal availability.

## 07 — Scheduled reminders outside the app

**Human-approved hackathon cut:** banners inside the open website are sufficient for the October 26 demo. Closed-website delivery is deferred, not completed by a banner. Research now targets durable in-app reminder state and preserves agenda/ICS; the broader external-delivery goal below remains later scope.

Completed [implementation specification](implementation/07_SCHEDULED_REMINDERS_IMPLEMENTATION.md); separate implementation chat dispatched. [External-delivery research](research/07/EXTERNAL_DELIVERY_RESEARCH.md) is retained as deferred evidence, not current demo infrastructure.

**Outcome:** receive a reminder while the app is closed. **Inputs:** confirmed deadlines, lead times, timezone, explicit recipient/channel and opt-in preferences.

**Bounded release:** one channel such as email; one periodic scheduler; durable outbox, idempotency keys, bounded retries, unsubscribe/pause and visible delivery state. Distinguish provider acceptance from proven delivery. Output schedules, failure/delivery history and recoverable retries. Preserve ICS and the in-app agenda.

**Dependencies:** deployed worker/scheduler, durable storage, identity and configured delivery provider. **Acceptance:** repeated runs do not duplicate reminders; deadline edits update/cancel pending sends; failures are visible; timezone/DST tests preserve timing; withdrawn opt-in prevents future sends. **Limit:** browser timers cannot provide reliable background jobs. Do not promise reminders before infrastructure/credentials exist. Calendar OAuth/bidirectional sync belongs to 10.

## 08 — Sponsor financial-report preparation

**Outcome:** prepare a reconciled financial draft in one sponsor format. **Inputs:** approved amendments, reconciled transactions, reporting period, sponsor mappings and authorized adjustments.

**Bounded release:** one explicit CSV/XLSX/document template. Compute numbers deterministically; use AI only to explain verified variances. Define accounting basis and cutoff. Retain reconciliation state, review approval and an immutable ledger snapshot. Output draft totals, traceable adjustments and variance narrative marked for finance review.

**Dependencies:** 06 ledger, budget versions/exports, actual sponsor requirements and institutional review. **Acceptance:** totals match the selected snapshot; category mapping loses no transactions; period edits recalculate correctly; unsupported adjustments are excluded/flagged; later transactions do not silently change saved reports. **Limit:** a generated report is not audited, universally sponsor-ready or a GAAP reporting system. Authorized finance staff review/certify; submission automation is separate.

## 09 — Live grant discovery and feed synchronization

**Human-approved hackathon cut:** U.S. NSF opportunities via Grants.gov, refreshed manually. The human confirmed manual refresh is sufficient for the next roughly 24 hours and tomorrow's demo. Scheduled refresh is deferred rather than a blocker for this accepted demo scope; the broader synchronization goal below remains later scope.

Completed [implementation specification](implementation/09_LIVE_GRANT_DISCOVERY_IMPLEMENTATION.md); separate implementation chat dispatched. Real public API access/terms and provider-ID seed pairings remain implementation preflight gates, not research-verified runtime claims.

**Outcome:** discover new/amended opportunities without manually maintaining the catalog. **Inputs:** one documented official feed/API, researcher profiles, source metadata and ingestion settings.

**Bounded release:** start with a small manually verified real catalog, then one source-specific API adapter with caching, deduplication, versions and scheduled refresh. Verify access and terms at implementation time. Distinguish discovery metadata from authoritative call text; detect amendments/closures/deadline changes. Reuse tri-state eligibility and transparent relevance. Output source-linked changes, freshness and saved-application amendment alerts.

**Dependencies:** existing matching, bounded ingestion jobs, adapter/credentials and parsing for supported notices. **Acceptance:** idempotent imports; amendments update the same opportunity and retain old versions; outages cannot relabel cached records current; contradictory dates require review; topic similarity never overrides a known eligibility mismatch. **Limit:** one feed does not cover all funders; comprehensive scraping/coverage and continuously correct eligibility remain separate problems.

## 10 — Team workspaces and institutional connectors

**Hackathon decision:** the human explicitly skipped task 10 because its improvement does not justify the effort. Retain the description as later backlog; do not dispatch it or make it a prerequisite for the bounded local demo.

**Outcome:** collaborate with investigators/research offices and reduce repeated entry. **Inputs:** authenticated identities/roles, memberships, audit policy and actual permission for a selected external system.

**Bounded release:** first private owner/editor/viewer workspaces with server-enforced access, comments, review requests and conflict-safe edits. Then one read-only connector with an explicit source of truth. Drive, accounting, calendar OAuth and IRB-system sync are separate releases. Output permission-aware applications, audit history and controlled sync with visible conflicts/errors.

**Dependencies:** migrate local storage to a multi-tenant authorization design, manage tokens/credentials, audit records and obtain institutional access. **Acceptance:** changing record IDs never exposes another workspace; revocation blocks access; retries do not duplicate imports; stale external data cannot overwrite newer accepted changes; failures preserve local work. **Limit:** institutions may have no public API; contracts/access/privacy can dominate effort. Formal ethics approval remains institutional.

## 11 — GrantWeave: compatible funding combinations

**Latest research authorization:** start now under the human's newer instruction, before the UI redesign. Research domain restrictions/solver methods/current code now; actual award/budget/provenance integration sections remain provisional until required checked contracts are merged/re-inspected. Do not invent exports or call the implementation handoff ready with unmet gates. Frontend code may change; describe required behavior without freezing layout/components.

**Decision:** can three to five particular calls/awards jointly support a researcher-confirmed work plan, and which restrictions bind? Output feasible alternatives or unsatisfied constraints, never treat summed maxima as secured funds.

**Inputs:** a few work packages with scientific scope, categories, dates, effort and existing support; selected calls/awards; exact source-linked confirmed restrictions; dependencies between packages. **Bounded release:** a typed constraint schema and exact deterministic solver over small instances. Model categories, caps, dates, effort capacity, mutually exclusive costs and user-confirmed overlap rules. Parsed terms require confirmation before becoming constraints. Compare a few scenarios, show unfunded gaps and explain infeasibility; separate awarded money from hypothetical awards and failed-funding branches. No applications or money transfers.

**Dependencies:** mature call/award/budget schemas, provenance and explicit work packages; grants-administrator review. A live feed is optional. Inspect kit analytics allocation utilities without assuming they implement the domain. **Acceptance:** reject abundant total funding with incompatible dates; prevent double-allocation; enforce personnel effort; distinguish scientific overlap from renamed expense labels; show a hand-checked feasible alternative when a restriction is removed; save assumptions.

**Limit:** feasibility holds only under encoded confirmed assumptions. Arithmetic cannot certify scientific overlap/multiple-award permission, and relabeling aims/costs cannot evade duplication. Expand portfolio size/uncertainty only after bounded reliability. **Success measure:** verified constraints and explanations a grants officer can understand and correct, before claims about funding outcomes.

## 12 — AimFit: study design under a funding ceiling

**Latest research authorization:** start now, before the UI redesign. Investigate design families/reference methods/current code and ask human statistical choices; actual cost/budget/versioned-assumption integration sections remain provisional until checked contracts are merged/re-inspected. The doc must cite real code interfaces and distinguish proposed contracts. Frontend code may change.

**Decision:** which affordable study options still address the research question, and which conclusions can each support? Expose scope changes and infeasible targets.

**Inputs:** one validated design family, researcher-defined question, source-linked effect/precision assumptions, fixed/per-unit costs, attrition/resources, cap, timeline and approved alternatives. **Bounded release:** choose a design family with a statistics adviser, implement validated numerical calculations, independently compare reference cases and enumerate a small acceptable set of variants. Output costed options, sample/resource choices, sensitivity, unmet targets and corresponding claim changes. AI may explain/draft revisions, never invent effects or supply authoritative arithmetic. Researcher approval precedes application updates.

**Dependencies:** reliable cost model, provenance, versioned assumptions/proposal revisions and domain/statistical validation. Live discovery and institutional integration are not prerequisites. **Acceptance:** match references; vary effect, precision, variance and costs; report no feasible design; never retain unattainable precision claims after budget cuts; preserve originals and accepted alternatives; expert review checks meaningful comparisons.

**Limit:** power/affordability do not prove merit, validity or feasibility. Never optimize repeatedly on observed outcomes to manufacture significance. Recruitment, ethics, equipment and time can bind. Trials, wet labs and arbitrary redesign need separate validated models. **Success measure:** numerical correctness and expert acceptance; researchers can explain assumptions and permissible conclusions.

## 13 — Bootstrap: cheapest credible preliminary-evidence plan

**Latest research authorization:** start now, before the UI redesign, using actual merged evidence/resubmission gaps and researching human-approved candidate/workflow choices. Unmerged review/resource-cost integration sections remain provisional until checked contracts are inspected. Optional GrantWeave/AimFit scenarios are not mandatory predecessors. Frontend code may change; do not freeze its implementation plan.

**Decision:** which next affordable piece of evidence is worth obtaining to address a specific proposal gap? Optimize useful evidence rather than favorable findings.

**Inputs:** application, explicit concerns/questions, existing evidence, expert-approved candidate experiments/analyses, cost/duration ranges, resources and seed-funding scenarios. **Bounded release:** one computational research workflow and a reviewed catalog. Start with planning on known inputs: rank candidates against confirmed gaps, show uncertainty, let users reject weak links. Output costs, dependencies, uncertainty, relevance and resource/funding prerequisites. Later allow one predefined analysis on suitable public data in isolation with versioned code/inputs/logs/outputs. Never perform arbitrary autonomous experiments. Update evidence only after real work, keeping negative/inconclusive results.

**Dependencies:** evidence/version tracking, concerns from review/resubmission, cost planning and scientific validation. GrantWeave/AimFit can supply bounded scenarios without becoming general systems. **Acceptance:** actions address declared gaps within real resources; uncertain gap-to-test relationships remain visible; include setup costs and failed-funding branches; retain unsuccessful analyses; draft pilot claims only from actual outputs; recompute after cost changes or rejected seed grants; experts validate relevance before trusting optimization.

**Limit:** a correct optimizer with an invalid scientific model gives a bad plan. Cost claims need sources/dates/ranges. Minimum cost is only within supplied candidates, not a global scientific optimum. Never promise supportive findings or awards; add new analysis families only with reproducibility and independent evaluation. **Success measure:** expert agreement on relevance/feasibility/value, reproducible execution and faithful claims. A useful negative finding is evidence.

## Shared foundations and kit reuse

Templates/resubmission/rubric review extend frozen drafts and evidence. Awards add approved terms and real progress. The ledger supplies finance reports and novel planning tools. Reminders require operational infrastructure. Discovery requires an official source adapter. Collaboration needs storage/authorization before connectors. GrantWeave needs confirmed constraints; AimFit validated costs/designs; Bootstrap trustworthy gap-to-evidence links. Build only dependencies needed for the selected release.

At each release inspect actual kit interfaces/revision before reuse: documents/extraction/retrieval for bounded source search; exports for report generation and formula-safe spreadsheets; integrations/jobs for bounded adapters/work, with application scheduling and persistence still required; research/recommendations for safe discovery/ranking; analytics for exact calculations and only supported constraints; supabase as candidate primitives, not a finished authorization design; ai for explicit fixture/live structured generation, with domain evidence validation still separate.

Reference kit planning revision: `22a5f44a27375e88ac2cd1754f6976704f725bc5`. Recheck current code when implementing. Feasibility rankings are judgments; the three named concepts make no claim of market/research uniqueness. See [agent handoff](AGENT_HANDOFF.md) before starting a future task.
