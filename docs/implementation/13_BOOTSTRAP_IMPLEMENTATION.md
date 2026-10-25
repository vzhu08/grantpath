# 13 — Bootstrap: an affordable preliminary-evidence plan

Research specification v1.0 · October 25, 2026 · **documentation only; no feature or experiment implemented**.

Bootstrap helps a researcher decide which next analysis could address an explicit proposal gap with the resources they actually have. Its mechanism is an exact, bounded search over a reviewed candidate catalog, with shared prerequisites, dated cost ranges and funding branches. It preserves the difference between planning to obtain evidence and having obtained it. “Cheapest” means cheapest within the supplied admissible catalog and declared constraints; it is not a global scientific optimum.

The accepted hackathon scope is a **scientifically unvalidated, synthetic planning demonstration**. A correct optimizer cannot establish the scientific relevance of its inputs. The human explicitly deferred scientific validation; no expert approval, measured saving, pilot result, favorable finding or improved funding probability is claimed.

## 1. Human decisions, authority and cutline

The requesting user answered these questions directly in this research chat on October 25, 2026:

| Choice | Verbatim human answer | Consequence |
| --- | --- | --- |
| Computational workflow | “Public gene-expression reanalysis (Recommended)” | Research one narrow processed-microarray reanalysis family, rather than an arbitrary experiment generator. |
| Scientific relevance validation | “Use a clearly labeled demo catalog; defer scientific validation (Recommended for hackathon)” | Catalog and relevance links remain demo assumptions. Product approval does not become scientific endorsement. Real scientific use requires later qualified review. |
| Resource inputs | “Clearly labeled synthetic budget/time/funding scenarios (Recommended)” | All worked dollars, hours, capacity and seed support below are invented reference inputs, not prices, estimates or available awards. |

No consequential question remains pending for this narrowed demonstration. A different analysis family, real budgets, execution or scientific use needs its own confirmed inputs. No additional human teammate or expert is assumed. Later review may be done by the requesting user if appropriately qualified, or by a reviewer they identify; an agent cannot supply that approval.

The demo is October 26, 2026; exact cutoff and presentation duration were not supplied. Prioritize one complete plan/failure/recovery path and leave time for integration and rehearsal. Research launch was explicitly authorized before UI redesign and remaining implementations finish; the older wait-for-UI research rule is superseded by the current primary instructions. This does not change the implementation priority 05 → 06 → 08.

**First release:** select researcher-confirmed task-03 gaps; inspect a small bundled synthetic catalog; accept or reject candidate-to-gap links for demonstration; enter bounded resource assumptions; solve; inspect complete/partial/infeasible/unknown outcomes; save immutable plans; change a cost or funding decision and inspect staleness. Manual operation requires no credentials or AI. Preserve the original concern, evidence and proposal histories.

**Deferred:** real scientific validation; data discovery/import; experiments; executing R; arbitrary/generated code; automatic pilot claims or proposal edits; live cloud pricing; grant applications; seed-grant discovery/eligibility; procurement/accounting; wet labs, clinical decisions, causal claims, cross-study meta-analysis, RNA-seq/single-cell models and general scheduling. Tasks 11/12, live discovery, rubric review 04 and ledger 06 are optional later adapters, not compulsory predecessors of manual task-03 planning.

## 2. Inspected baseline and source of truth

Research checkout: `C:/Users/vzhu0/.codex/worktrees/b22b/grantguide`; branch `codex/13-bootstrap-research`; exact inspected merged base **`2da6a3104663d602424256217b19f2eba58c6996`**, workspace schema **4**. The worktree was initially clean/detached. Lead owns only this file and `docs/research/13/**`; two independent agents are read-only. Git branch metadata required the normal managed-worktree filesystem escalation; no application files were changed.

Read root/scoped instructions (only root `AGENTS.md` found), [project brief](../PROJECT_BRIEF.md), [selected modules](../kit/SELECTED_MODULES.md), [quickstart](../QUICKSTART.md), [ownership](../OWNERSHIP.md), [human workflow](../HUMAN_AI_TEAM_WORKFLOW.md), [task card](../TASK_CARD.md), [API](../API_CONTRACT.md), [status](STATUS.md), [roadmap](../ROADMAP.md), and current primary `C:/Users/vzhu0/PycharmProjects/grantguide/{AGENTS.md,docs/ORCHESTRATION.md,docs/OWNERSHIP.md,docs/TASK_CARD.md}`. Primary records contain the newer research-start override and live leases missing from this old-main snapshot. Do not copy their unrelated WIP or interpret a coordination branch as checked runtime.

| Actual merged seam | Observed behavior and Bootstrap implication |
| --- | --- |
| [StateSchema](../../lib/schema.ts), [repository](../../lib/repository.ts) | Schema 4 includes proposal/vault/resubmission state, no Bootstrap namespace. Writes are serialized and atomic; expected revisions protect competing saves. New serialized writes have a 25 MiB bound; migration can preserve larger valid old stores. Allocate any additive migration from the eventual checked main, not a guessed schema 5. |
| [ConcernFields, Concern, ActionFields, RevisionAction](../../lib/resubmissions/schema.ts) | Accepted status, confirmed interpretation, exact feedback citations, action kind/evidence requirement and histories exist. A concern alone does not provide a scientifically validated gap-to-analysis mapping. |
| [concernActions, concernDependencies, concernFingerprint, actionIssues, completionIssues, concernState](../../lib/resubmissions/matrix.ts) | Derived state and exact dependencies already exist. `new-data`/`new-analysis` require reviewed actual observed/negative/inconclusive outcomes and an exact project evidence passage classified `observed-result`; proposed work or assertion cannot close them. Planning must leave these checks intact. |
| [resubmissionView](../../lib/resubmissions/view.ts), [view route](../../app/api/resubmissions/view/route.ts) | Returns current derived issues/fingerprints after route-level current vault integrity hydration. Use current validated state, not a copied historical completion flag, to show intake eligibility/staleness. |
| [exactCitation, evidenceCopy, revisionCopy, attemptFor](../../lib/resubmissions/context.ts), [graph validation](../../lib/resubmissions/validation.ts) | References must match project, exact saved version/hash/normalized UTF-16 end-exclusive range. Reviewer feedback and scientific evidence occupy separate namespaces. Archived attempts are not writable. Bad hashes or cross-project references fail closed. |
| [submission snapshots](../../lib/resubmissions/snapshots.ts), [proposal workflow](../../lib/proposals/workflow.ts), [vault domain](../../lib/vault/domain.ts) | Frozen submissions, proposal packets and handoffs retain original payloads/versions. File replacement cannot silently relink evidence; current file integrity matters separately from metadata. Preserve their digests and all historical downloads. |
| [workspace route](../../app/api/workspace/route.ts), [HTTP guards](../../lib/http.ts) | Existing workspace writes use same-origin loopback JSON and a 120,000-byte request bound. Planning metadata must fit validated bounds; do not embed an expression matrix or large logs in a command. |
| [recommendations](../../modules/recommendations/src/index.ts), [README](../../modules/recommendations/README.md) | `rankCandidates` provides generic hard filtering/relative utility/votes. It has no dependency-closed bundle search, shared setup accounting, scientific relevance model or funding branches. Its min/max utilities vary when the candidate pool changes. Do not call it a finished Bootstrap solver. `modules/analytics` is absent. |

`scientificAction` deliberately excludes owner/due from task-03 scientific completion fingerprints. Bootstrap's resource/deadline fingerprint must include them when they affect availability or feasibility; do not change task-03's rule to meet Bootstrap's different purpose.

### Unmerged checkpoints: evidence of possible seams, not runtime

Read [04 specification](04_EVIDENCE_LINKED_RUBRIC_REVIEW_IMPLEMENTATION.md) and [06 specification](06_BUDGET_LEDGER_IMPLEMENTATION.md). The code reviewer separately inspected task-04 source checkpoint **`a3bc6bf1d3d139dec8efb1dff71ad3a0020fb0fc`** in `a92b/grantguide` and task-06 checkpoint **`4f01d55dec629dd7dac3ace3887c6d795680cfc7`** in `09f2/grantguide`. These SHAs are independent source checkpoints, not merged functionality at this research baseline.

- 04 has pure-module `ReviewSupportNeedSchema`/`ReviewFindingSchema` and decision/task records, but its inspected `freezeReviewInput` adapter passes empty `facts` and `supportNeeds`. An exported type does not establish integrated confirmed scientific-gap intake. Any later import must pin a checked merged review run, anchor, researcher decision and current status.
- 06 has finance-local `CoreLedger`, `Money`, `Plan` and `projectLedger`, not a scientific resource-cost model. Unknown money is not zero; obligated cash, actuals, commitments and selected forecasts differ. A ledger balance is neither unrestricted seed support nor compute/staff capacity. Do not infer a numeric budget from a source citation or copy a ledger forecast into spendable cash.
- 05/06/04/09 were not merged runtime at launch. This release uses explicitly entered synthetic resources and task-03 gaps, so it does not need them to finish independent research. A later reconciliation addendum pinned to merged predecessor SHAs is required before implementing any dependent adapter. Reinspect even the manual 01/02/03 seams against the implementation branch's actual checked base.

## 3. Domain evidence and bounded workflow

Official documentation and primary methods were researched on October 25, 2026; exact links, dates, access limitations and claim boundaries are in [source register](../research/13/SOURCES.md). The following are method-informed design choices, not evidence that the demo catalog is scientifically validated.

Use **one public, processed, already normalized single-channel microarray GEO Series/platform**, one prespecified two-group contrast and a pinned limma workflow. NCBI describes the processed-data microarray path and warns that accessibility alone does not make samples comparable or adequate. This supports an admissibility gate, not unrestricted ingestion. [NCBI GEO2R documentation](https://www.ncbi.nlm.nih.gov/geo/info/geo2r.html).

Linear models support prespecified contrasts and explicit design terms; model interpretation depends on the design. Keep biological replicates distinct from technical measurements and reject unestimable contrasts. Do not try to repair complete group/batch confounding by automated preprocessing. [Ritchie et al., 2015](https://doi.org/10.1093/nar/gkv007); [Law et al., 2020, design matrices](https://doi.org/10.12688/f1000research.27893.1).

Proposed future method: inspect metadata and distributions; freeze group labels, feature universe, model and contrast; fit the approved limma model; report effect estimates, uncertainty and declared multiplicity adjustment; perform only one prespecified sensitivity check; retain all outputs. The official manual distinguishes exploratory batch-effect removal from model fitting, so batch terms belong in the approved model. Crossing an adjusted-p-value threshold is not a planner objective. [limma reference manual](https://bioconductor.org/packages/release/bioc/manuals/limma/man/limma.pdf). An analysis with no discoveries or large p-values does not establish absence of an effect or equivalence; retain estimates and uncertainty rather than calling an imprecise comparison evidence of no effect. [ASA statement, 2016](https://www.amstat.org/asa/files/pdfs/p-valuestatement.pdf).

### Suitability checklist for later real use, not a claim of checked data

Require a named biological question, estimand/contrast, species/tissue/context match, one documented processing scale, compatible platform annotation, independent biological replication reviewed for the intended inference, sample/group mapping and missing-data policy. Review batch/covariate metadata, residual information and design estimability. There is no universally sufficient sample count. Unknown replication, privacy/access restrictions, incompatible data scales, irrecoverable confounding or missing decisive metadata blocks inferential candidates or leaves them unrankable.

No accession or real dataset was selected, downloaded or validated in this research. For the demo, the dataset is an explicitly fictional metadata record; an invented accession must never look like a verified GEO record. Preprocessing, platform, normalization and sample suitability are demo assumptions. The reference workflow excludes raw reads, two-channel/loop designs, repeat-measures models, cross-Series comparisons, new wet-lab validation and arbitrary gene-set fishing. Those need new reviewed models.

## 4. Candidate catalog and relevance decisions

The first catalog is bundled, small and visibly labeled **“Synthetic demo catalog — scientific relevance not validated.”** The requesting user's approval allows this demonstration; it does not make the following task descriptions expert-approved. A future real catalog requires a qualified reviewer to approve both the method template and each candidate-to-gap link for the particular dataset/question, with identity, date, rationale, qualifications/context, limitations and exact versions retained.

| ID | Planning action/product | Dependency | Intended relevance and limit |
| --- | --- | --- | --- |
| S | Establish a pinned local analysis environment and input/annotation manifest | None | Shared setup; no biological evidence by itself. Include installation, data access, storage and environment checks. |
| Q | Metadata/processing audit and quality diagnostics | S | Can determine whether the proposed comparison is interpretable or should stop. Does not prove a hypothesis or fix missing metadata. |
| V | Human design/relevance review before modeling | Q | Reviews population/contrast/replication/estimability and candidate links. The demo simulates this step; no actual expert review is implied. |
| D | Prespecified two-group effect-estimation analysis | V | Could address G1: absence of a transparent estimate for the declared contrast. Negative or imprecise results are valid outputs. Does not establish causation or external replication. |
| R | One prespecified same-data sensitivity assessment | D | Could address G2: uncertainty about dependence on one declared modeling choice. An expert must specify the alternative before outcomes are inspected. Same-data robustness is not independent confirmation. |
| I | Interpretation, limitations and reproducibility review | D, plus R if selected | Required to interpret each selected inferential product; counted once as shared review under the stated fixture assumptions. Actual review adequacy is a later scientific gate. |

I is a required prerequisite of declaring either G1 or G2 a **planned deliverable**; model this as a product rule in addition to the analysis DAG, not the impossible cycle D → I → D. G1 coverage requires D and I; G2 requires R and I, with dependency closure. Q/V/S are enabling work, not additional independent evidence units. All products share the same underlying dataset and have that dependence explicitly recorded.

A candidate-to-gap relation has one of: `direct`, `weak`, `unknown`, `none`, `rejected`. These are proposed domain labels, not current app enums. A human records rationale and scope for every accepted link. Weak/unknown links remain visible but **cannot satisfy required coverage**. Rejected candidates/links retain reasons and revision history; they are not silently removed. No embedding or AI confidence score can promote a link to direct. Real `direct` requires scientific approval; the demo uses a separate `demo-assumed-direct` qualification and can only generate demo plans.

Example non-addressable G3: “independent prospective validation in the target population.” Every catalog link to G3 is none/weak; the honest result is no complete plan for G3. Changing wording, adding more plots or reusing the same data does not supply independence. A data-suitability failure may itself be a useful finding, while leaving the original biological gap unresolved.

## 5. Cost, time, capacity and seed support

Keep cash, active human effort, elapsed duration, compute reservation, RAM, storage and access/reviewer availability separate. Cost lines identify shared key/version, quantity/unit, integer USD cents interval, source/basis, as-of date, validity/review date, work status, payer/restriction and uncertainty reason. Missing cost is unknown, not zero. Unknown required duration/capacity also prevents a robust feasibility claim.

V1 supports only **future, unstarted work**. All cost/time lines in a selected closure are remaining required work. Reject completed/sunk/partially incurred nodes as unsupported inputs rather than double-charging them or silently assuming free reuse. A failed seed decision in this fixture happens before any work; no incurred expense is being erased. Later replanning after actual work must separately retain lifecycle incurred costs, already committed amounts, verified completed prerequisites and remaining available cash/effort; it must not subtract the same expense twice or restore spent setup funds when seed support fails. That accounting extension is outside v1 and needs a new reviewed contract.

For real use, software license evidence can justify a zero license fee, not zero labor or infrastructure cost. Existing hardware still consumes capacity; donated review time must be available and separately recorded. Include acquisition, cleanup, setup, annotation, storage/egress if any, failures/rework allowance, interpretation and future rerun effort where applicable. Shared items count once only when version/scope/resource context genuinely match. Incompatible environments or different data preparation cannot share a key merely because names match.

Use source/date/range and uncertainty analysis as cost-estimation discipline, rather than claiming GAO validates this small model. [GAO cost guide, March 12, 2020](https://www.gao.gov/products/gao-20-195g). Official limma metadata records GPL licensing; this research found no defensible source for the researcher's labor rate, local processing time or reviewer availability. Consequently these are synthetic values below and unknown in a real plan until supplied or measured. [limma package record](https://bioconductor.org/packages/release/bioc/html/limma.html).

### Synthetic reference inputs, fixture `bootstrap-demo-v1`

These values were authored October 25, 2026 as **invented arithmetic test vectors** after the human selected synthetic resources. They are not dated market quotes or empirical scientific runtimes. No source is being used to substantiate their numeric values.

| Node | Cash low–high, USD | Active effort low–high, minutes | Serial elapsed low–high, minutes |
| --- | ---: | ---: | ---: |
| S | 20–40 | 30–60 | 30–60 |
| Q | 15–30 | 30–60 | 30–60 |
| V | 20–40 | 30–60 | 30–60 |
| D | 30–60 | 60–120 | 60–120 |
| I | 15–30 | 30–60 | 30–60 |
| R | 25–50 | 30–60 | 30–60 |

S/Q/V/D/I totals **$100–$200, 180–360 minutes**; adding R totals **$125–$250, 210–420 minutes**. I's allowance is assumed adequate for either product set only in this fixture; a real catalog must price its actual scope. One researcher and one available workstation are assumed; all nodes run serially. A fictional workstation supplies 8 GiB RAM/10 GiB scratch; D/R each reserve 4 GiB/2 GiB, S/Q/I/V no more. These are capacity test values, not measured requirements. Include review steps in the same bounded time window; availability cannot be inferred from a monetary allocation.

Base resource scenario: **$210 confirmed unrestricted synthetic cash, 480 active minutes, 480 elapsed minutes**, workstation/reviewer available. Required targets G1 and G2. Pending seed support: **+$60**, available before the window only in the hypothetical funded branch. No deadline timestamp, real award or institutional permission is implied by this relative eight-hour fixture.

| Funding branch | Spendable inputs | Required-G1/G2 result |
| --- | --- | --- |
| Confirmed base / seed denied / seed withdrawn | $210; 480 minutes | Full plan's $250 upper bound fails. Show no robust complete plan; explicit partial G1 plan costs $100–$200 / 180–360 minutes, with G2 still unaddressed. |
| Seed pending | Confirmed $210; separate hypothetical $270 branch | Current full plan remains infeasible. Show conditional full plan only with the seed amount, availability date, restriction and approval assumptions displayed. |
| Seed confirmed and available for this scope | $270; same time/capacity | Full plan $125–$250 / 210–420 minutes is robust against the supplied bounds. “Robust” refers only to these assumptions, not every real-world uncertainty. |
| Seed delayed/restricted/unavailable | Treat unusable amount as zero available | Recompute; do not count money merely because it was awarded, requested or is expected later. |

No seed application is submitted. New funding applications have costs and lead times; do not treat applying as a free guaranteed bridge. Real sources must be explicitly allowed/available for the intended activity, with confirmation retained. Funding probabilities and expected grant income are excluded. No borrowing across awards, guaranteed external funding, automatic ledger posting or financial authority follows from the plan.

## 6. Deterministic selection mechanism

Implement a small pure solver rather than a general AI optimizer. Proposed v1 bounds: **12 total nodes including prerequisites, 8 gaps, one currency, one serial researcher/workstation lane**. These are engineering proposals requiring capacity checks against the eventual runtime; they are not existing API guarantees.

1. Validate IDs, intervals, integer cents/minutes, safe integer sums, units, versions, exact gap references, acyclic dependencies, product rules, exclusion groups and scope labels. Reject NaN, negative, fractional cents, inverted bounds, unknown nodes, incompatible shared-key definitions or an over-limit instance. Validate bytes before parsing and domain size after parsing.
2. Filter rejected/inapplicable candidates and links; report every reason. Unknown required suitability, scientific approval, quote, duration or resource makes the affected bundle **unrankable/needs input**, not a cheap zero. Fully known independent bundles can still be ranked. If an unresolved alternative could be cheaper, the result is only **best known feasible**, not a certified minimum across the supplied catalog. In demo mode only explicitly qualified demo links may cover demo gaps. Mixing real gaps/resources with a simulated scientific catalog cannot produce a scientific plan.
3. Enumerate at most 2^12 = 4,096 subsets. Close dependencies, add required interpretation products, reject illegal/incomplete closures, and deduplicate by sorted node IDs. Reject mutually exclusive alternatives; one shared node/version is charged once. Do not use a greedy per-analysis price sort that ignores setup.
4. Derive covered gaps from approved direct product rules, not the number of selected tests or expected significance. For a **complete** plan require every researcher-selected required gap. Keep all other gaps explicitly outside this plan's claim.
5. Sum low/high cash and effort across unique nodes, and conservatively sum serial elapsed intervals. Check upper endpoints against confirmed available cash, effort, elapsed window and per-node capacity/access/reviewer requirements. Include a dated resource availability start/finish if real calendar constraints are later supplied; the initial fixture uses a relative window. Do not imply parallel optimal scheduling. Unknown correlation is retained; intervals are not confidence intervals or probability distributions.
6. Rank feasible complete bundles lexicographically by **cash upper bound, elapsed upper bound, active-effort upper bound, sorted node-ID string**. Display low–high totals and assumptions alongside that order. No weighted “credibility score,” predicted favorable result or funding chance. Cheaper identical-coverage alternatives remain inspectable with exclusions/tradeoffs.
7. If no known complete robust bundle exists and a relevant unresolved alternative could complete it, return **needs input**, not a proof of infeasibility. Claim **no robust complete bundle within the supplied catalog/bounds** only when all potentially relevant alternatives are classified or independently ruled out by known constraints. Show binding constraints and an explicitly partial nondominated frontier. Bundle A dominates B only if A covers a superset of B's required-gap set, has no greater cash/elapsed/effort upper bounds and improves at least one dimension strictly (a proper coverage superset counts). Thus cheap {G1} cannot dominate {G2} merely by having the same gap count. Do not offer empty-coverage bundles as evidence plans. Display at most 8 partial options in stable order and show the full frontier count/truncation. Never present a partial plan as meeting the original target. A human may save a reduced target as a new plan; the original gap and request remain open.
8. Solve confirmed and hypothetical funding branches independently using identical candidate/gap versions. Never blend their money or silently pick the funded branch. Re-evaluate after a changed cost, funding rejection, access failure or resource loss.

This is deterministic resource-constrained bundle selection, not Bayesian value of information: outcome distributions/utilities are unavailable and inventing them would create false precision. Range-upper-bound feasibility is deliberately conservative; do not optimize the low endpoint and hide the high endpoint. A deadline or budget is a hard constraint only when explicitly confirmed. Reject unsupported instances rather than dropping inconvenient constraints.

## 7. Researcher walkthrough and information priorities

1. First create a **new isolated future demo fixture** or manually set up a synthetic task-03 attempt with fake gene-expression feedback, accepted/confirmed G1/G2 concerns and unresolved `new-analysis` work. These records do not exist in the merged demo: [current03 demo](../../lib/resubmissions/demo.ts) concerns sensor field validation and `new-data`. Preserve that demo and the normal workspace; use a dedicated acceptance/review data directory. Open the new attempt and select G1/G2; see exact original quotation, saved interpretation, existing evidence, target application and unresolved state. A gap selector is not scientific validation. If no eligible gap exists, explain what must be confirmed in the existing workflow.
2. Read the demo catalog label. Inspect the proposed analysis/product, dependence, evidence it could provide, what it cannot establish, range/basis and resource prerequisites. Accept/reject individual relevance links with a reason; weak/unreviewed links remain unrankable.
3. Confirm the synthetic $210/eight-hour inputs and pending seed scenario. Solve: no robust complete plan; G1-only partial plan is visible with G2 open and shared setup charged once. This demonstrates honest infeasibility rather than a manufactured favorable recommendation.
4. Inspect the separate hypothetical funded branch: $250 maximum fits $270 and seven hours fits eight. Save that **conditional demo plan**, including the precise condition that seed money must become confirmed/available. Nothing is run, no evidence is created, and no task-03 concern is closed.
5. Deny seed support or raise D's high cost. The current assessment becomes stale/infeasible and requires recomputation. Download the prior immutable plan and see its old assumptions unchanged. A new plan references its predecessor and the changed inputs.
6. Show that negative/inconclusive output would remain a valid later result, while a planning document alone leaves the action unresolved. The first release displays this distinction; it does not invent a result to demonstrate it.

**Frontend warning:** whole-product redesign is forthcoming and frontend code may change. Prioritize the decision, original gap, scientific/demo status, cost range, covered/uncovered goals, binding constraints and conditional funding before technical detail. Preserve keyboard access, readable warnings, editable rejection reasons, conflict buffers and saved history. These are interaction requirements, not navigation/layout/component/file/CSS prescriptions. Do not freeze component props or an inspector architecture. Later frontend implementation must read the accepted merged `docs/DESIGN_SYSTEM.md` and `docs/UI_COMPONENT_MAP.md`; neither is an accepted baseline in this checkout.

## 8. Conceptual contracts — PROPOSED, not exported DTOs

All names in this section are explanatory concepts. There is no existing `BootstrapPlan` export, endpoint, repository method or migration. Final wire names, strict schemas, storage locations, migration number, quotas, retention and route/error details are **PROVISIONAL until checked-base reconciliation and the shared-file lease**.

| Concept | Required content |
| --- | --- |
| Gap copy | Project/application/attempt IDs; exact concern ID/revision/status/fields; task-03 concern fingerprint; selected action IDs/versions; exact feedback citations/copies; related evidence versions/hashes/file-origin status; target draft revision/selection; explicit question and required/optional target; manual confirmation and scientific/demo qualification. |
| Candidate revision | Family/template version, immutable description/products/nonclaims, applicability gates, dependency/product/exclusion rules, shared keys, common-data dependence, cost/time/capacity interval lines, provenance and catalog/reviewer decision versions. Rejection and uncertainty are first-class values. |
| Relevance decision | Gap and candidate versions; direct/weak/unknown/none/rejected; scientific-approved versus demo-assumed qualification; reviewer/rationale/date; remaining limitations; changed-source review required. |
| Resource/funding revision | Currency, available cash/time/capacity, restriction/availability windows, confirmed/pending/denied/withdrawn state, actual input basis/date/validity, synthetic/researcher provenance and explicit scenarios. No current ledger balance is assumed. |
| Plan snapshot | Copies of all inputs and human decisions, required targets, solver/policy/version, selected nodes/products, unique cost breakdown, binding constraints, uncovered gaps, exclusions, branch conditions, uncertainties, result status and deterministic digest. Also created-at/by, prior-plan ID and independent labels for simulated catalog/data/resources versus actual execution. |
| Current assessment | Compare saved dependency digest to validated current inputs; current/stale/missing/unknown status and changed fields. This is derived separately, never a mutation of the old snapshot's result. |

Hash a canonical, versioned payload with explicit sort/order rules, finite integer quantities and normalized string rules; freeze the exact copies used. Include solver version, catalog/link/quote versions, resource/funding state and availability, gap scientific/demo qualification, selected action owner/deadline when relevant, source/file integrity and target context. Distinguish payload digest from an envelope's creation timestamp/ID. Retain originals to reconstruct the calculation, not just a hash pointing at mutable records.

Task-03's concern fingerprint includes response/target/context dependencies, some broader than this planner needs. V1 may conservatively mark a plan for review when it changes; do not claim perfect targeted invalidation. An unrelated unselected concern edit must not invalidate solely because workspace revision changed. Always use the current workspace revision for writes, separately from domain dependency fingerprints.

**No write-through:** solving/saving/rejecting a Bootstrap plan cannot set a task-03 action reviewed, create an `observed-result`, complete a response, change a frozen submission, revise a proposal or award money. If a later user wants an action/task from a plan, require a separate explicit existing-workflow action classified proposed work, preserving the original intake and all completion checks.

## 9. Persistence, boundaries, staleness and failure

Propose app-local `lib/bootstrap/**` adapters and a pure capability under `modules/bootstrap/**`, with a new feature namespace integrated through the actual repository. Exact paths/export names are future ticket proposals only. Keep server validation authoritative and current vault-integrity hydration consistent with existing reads. Do not create a parallel mutable JSON store that bypasses revision control, migration, graph validation or backups.

Tentative capacity budget: 12 nodes/8 gaps per solve, 50 KiB frozen payload, request envelope below the existing 120,000 raw-byte cap, and 50 retained plan snapshots per project. Check the total serialized workspace's existing bound as well. These numbers need reconciliation with worst-case citations/copies/escaping and existing history limits; reject an oversized request before work and an oversized durable state before publication. Never truncate evidence, remove old versions or silently raise shared limits. Reaching capacity is a correctable 413-style error with export/new-project guidance; final error DTOs remain provisional.

Persistence should use expected workspace revision plus a durable operation ID/input digest for snapshot save/rejection decisions. Exact successful retry returns the original snapshot without duplication even after a lost response; changed input under the key conflicts. Recheck source versions/fingerprints inside the write lock. A preview calculated against stale inputs cannot become a current saved plan. Validation/receipt recovery/atomic write behavior must be reconciled with the real repository rather than assumed from a new namespace.

Migration must be additive with a byte-identical backup, fail closed on corrupt/unknown schema, and preserve proposal/vault/resubmission frozen payload bytes/digests. Plan histories are append-only; corrections/supersession create new records. Prevent demo reset/archive from orphaning plans or referenced source history. Retention/export/delete scope is provisional: v1 retains referenced inputs and all snapshots, offers safe local JSON/Markdown copies, and does not implement destructive history deletion. A complete backup must include every configured artifact directory; the existing metadata/vault helper is not a complete proposal-export backup.

Solving is synchronous/pure/bounded; there is no analysis job to restart. An interrupted solve saves no completed plan. An acknowledged durable snapshot survives app restart exactly; an interrupted save either publishes one validated record or none, recoverable by receipt. Corrupt saved data remains preserved and unavailable until repaired/restored, never reset to fixtures. Downloads verify saved digests and scoped IDs, have attachment/no-store/nosniff behavior, do not read arbitrary paths, and escape source text as data. No remote fetches are triggered by source content or a saved URL.

| Change/failure | Required response |
| --- | --- |
| Feedback corrected, concern superseded/rejected, linked action/evidence/target changed | Retain old plan; show needs review/missing intake and exact cause. Require reselection/reconfirmation; no silent replacement. |
| Source file lost/corrupt/excluded or current evidence no longer matches | Mark current suitability unknown/stale; original snapshot stays downloadable as historical planning data, never as proof of current physical integrity. |
| Cost interval/date/basis, reviewer decision, resource capacity, owner availability or seed status changed | Invalidate affected assessment; recompute with changed upper bounds/current restrictions. Cost expiry requires review even without a numeric edit. |
| Unknown price/time, funding date, scientific relation or resource availability | Needs input/unrankable, with reason; cannot become $0 or certain feasibility. |
| No complete plan within known constraints | Infeasible for declared targets; expose binding budget/time/access/coverage constraints and separate partial options. Do not relax targets automatically. |
| Competing save or stale preview | Conflict; preserve local edits, reload and reconcile. Do not overwrite another saved decision. |
| Cyclic/ambiguous dependencies, unknown IDs, interval overflow, over-capacity | Fail validation before publication; preserve existing state. |
| Quote/candidate retracted or human relevance rejection | Retain rejection reason and previous plan; remove rejected link from current coverage and re-solve. |

## 10. Deterministic reference and acceptance cases

These are implementation requirements, not tests run by this research chat. Use isolated synthetic data and exact source hashes; ordinary tests make no external calls. Numeric reference totals were independently checked as arithmetic during research.

| Case | Exact expected behavior |
| --- | --- |
| A1 Base full target | `bootstrap-demo-v1`, G1/G2 required, $210/480 minutes: complete robust result infeasible; G1 partial S/Q/V/D/I totals low/high $100/$200 and 180/360 minutes; G2 remains open. |
| A2 Shared setup | Full S/Q/V/D/R/I totals $125/$250 and 210/420 minutes. S/Q/V/I appear and are charged once, with dependencies/product rules satisfied. No independence multiplier for same-data products. |
| A3 Funding branches | Pending +$60 gives a separate conditional $270 branch: full plan fits supplied maxima. Denied/withdrawn/delayed/restricted support is unavailable; confirmed-base branch remains infeasible for full target. A saved conditional plan cannot become unconditional on restart. |
| A4 Changed upper cost | Increase D high $60 → $90: full maximum $280 exceeds $270; partial G1 maximum $230 exceeds $210. Retain old $250/$200 snapshots, mark assessment stale and show changed line. No old assertion of affordability remains current. |
| A5 Time/capacity | Full plan with 390 elapsed minutes is infeasible (420 required) although cash may fit. A 2 GiB workstation cannot run D/R's synthetic 4 GiB requirement. Missing reviewer availability yields unknown, not available. |
| A6 Empty/weak catalog | Reject D→G1 or mark R→G2 weak: required coverage fails. Unknown R→G2 yields needs-input if it could complete coverage. G3 external-validation target has no admissible coverage. Empty required-target list is a selection-needed state, not success on an empty bundle. |
| A7 Non-greedy optimum | Independent arithmetic-only mini-catalog: P-alone covers one gap for $70 inclusive; B needs setup T=$60 plus B=$20. Select P=$70, despite B's smaller sticker price. For two gaps B and C=$20 sharing T, choose T+B+C=$100 over P+P2=$140. Fixed costs, available time/capacity equal; no scientific claims attached. |
| A8 Stable objective | Equal complete coverage/cash: prefer smaller elapsed high, then smaller effort high, then sorted ID sequence. Reordering input arrays/JSON keys yields identical selected bundle/digest under canonical rules. Do not use locale-sensitive sorting. |
| A9 Input rejection | Negative/fractional cents, NaN, invalid/inverted intervals, mixed currency, duplicate IDs, dependency cycles, incompatible shared keys, missing prerequisite, unsafe sums, >12 nodes or >8 gaps fail explicitly. No partial state write. |
| A10 Stale provenance | Change exact feedback/source hash/selected concern/target, reject relevance or expire a cost review: old snapshot/digest unchanged; assessment needs review with reasons. Unselected unrelated concern edit does not invalidate solely from workspace revision. |
| A11 Completion boundary | Save/select/export a full plan while task-03 `new-analysis` has only proposed work: its action remains open and completion fails. Real reviewed negative/inconclusive source results may later pass existing03 checks, but the planner does not create them. |
| A12 Scope/integrity | Cross-project concern/evidence, feedback used as scientific result, altered quotation/range or archived attempt intake fail. File replacement preserves the old version and exposes review need. |
| A13 Retry/restart | Lost save response + exact operation replay returns one original snapshot. Changed payload/key conflicts; concurrent revision conflict preserves edits. Restart retains byte-identical payload/digest, conditional labels and rejected candidates. |
| A14 Migration/retention | Migrate a schema4 fixture only after selecting the real next schema. Old01/02/03 frozen payload digests unchanged; byte backup matches original; corruption/oversize/capacity cannot erase history or regenerate demo data. |
| A15 Presentation/export | Every plan/export shows catalog scientific status, synthetic/real input labels, branch conditions, selected/uncovered gaps, ranges/bases/dates, exclusions and non-execution status. No “pilot demonstrated,” scientific endorsement or funding prediction appears. Source text renders inertly. |
| A16 Unknown alternatives | Known complete bundle K costs $70; unknown-cost alternative U could cover the same gap: offer K as best known feasible, without a catalog-wide minimum claim. If K is absent and U could complete coverage, return needs-input rather than infeasible. Known independently impossible U cannot block a proven result. |
| A17 Partial sets | Two feasible partial bundles cover {G1} and {G2}; the cheaper one does not dominate the other. Retain both unless another option satisfies the exact set/resource dominance rule. Report truncation when >8 nondominated options exist. |
| A18 Work status | Mark S already incurred/completed: v1 rejects that unsupported instance without altering the old plan or replenishing cash. Do not silently count S twice or assume it is free. Future remaining-cost accounting needs a separate contract. |

Compare enumeration against a small independently written exhaustive reference oracle for subset/closure/cost cases, with hand-derived cases A1–A8. Metamorphic checks: increasing costs or removing funding cannot create a newly feasible identical bundle; adding irrelevant candidates cannot change fixed-input arithmetic; rejecting a required direct link cannot improve coverage. These are meaningful tests of the mechanism, not mirrors of its implementation.

Scientific evaluation is a separate release gate for real use: a qualified reviewer checks relevance, applicability, feasible work scope, nonclaims and dependence for each proposed link; disagreements remain rejected/weak/unknown. Report agreement/rejection counts and reasons only after actual evaluation. Solver correctness is not substitute evidence. No such evaluation occurred here.

## 11. Optional future execution and claim provenance

Execution is not first-release scope and is not authorized by this research or planning approval. A later explicit assignment may implement **one fixed reviewed script** on a selected suitable public dataset; no user/source/AI-supplied executable code or arbitrary shell command is accepted. Establish scientific review, permitted data use and an isolated resource/runtime budget before any run. A nonpositive, inconclusive, failed or unsuitable run is retained rather than rerun opportunistically until significant.

Required run record: plan snapshot/digest, specific GSE/GSM/GPL IDs and retrieval date, input bytes/SHA-256 and annotation version, documented normalization, sample exclusions/group mapping, frozen design/contrast/multiplicity policy/sensitivity rule, pinned script commit/container image digest/R/Bioconductor/package versions, resource limits, start/end/exit status, full bounded stdout/stderr, output manifest/hashes and human interpretation/limitations. Platform floating-point differences need predefined tolerances for estimates/uncertainty and exact structural checks; never promise byte-identical PDFs across all environments. Store enough local authorized input/environment evidence to rerun offline or explain why a remote change prevents it.

No execution DTO, worker, route, input cap, retention quota or dataset download seam exists for Bootstrap. Reconcile those exact details before implementing; [current vault admission](../../lib/vault/admission.ts) allows PDF/TXT/Markdown/DOCX up to 10,000,000 bytes, not expression CSV ingestion or analysis. Scientific text sources are also limited (currently 10/project and 20,000 text units/source); catalog candidates/plans must not consume result-source slots merely by existing. Pin compatible software versions at execution time: the observed limma release page on the research date reports 3.68.5, but that is researched metadata, not an installed/tested environment. No benchmark or runtime is established here.

Actual completed work can create a separately reviewed result source/version through existing evidence workflows, preserving observed/negative/inconclusive classification and provenance to the exact run. A proposal/response claim requires human acceptance of exact outputs and permitted interpretation; it must cite that result passage and saved run, not a costed plan. Failed setup has logs/limitations but cannot masquerade as an observed biological result. No automatic scientific completion, proposal rewriting, sponsor claim, submission or funding guarantee.

## 12. Implementation tickets and reconciliation gates

These are future ticket scopes, not authority to edit them in this research chat. Parent assigns an isolated implementation checkout, exclusive files/shared lease and checked base. Useful agents remain read-only unless independently scoped in separate checkouts.

| Ticket | Small deliverable | Acceptance/dependency |
| --- | --- | --- |
| B13-0 Reconcile checked base | Record actual merged01/02/03 and current schema/repository bounds, exact UI-baseline SHA if frontend starts, current leases, retained data and backup assumptions. | Add pinned reconciliation notes; no schema/route/export invented from this draft. 04/06/11/12 adapters stay excluded. |
| B13-1 Pure catalog/solver | Proposed `modules/bootstrap/**`: strict bounded inputs, synthetic catalog, dependency/product rules, branch solves, exact arithmetic, complete/partial/unknown explanations. | A1–A9/reference oracle; no network/LLM/execution dependencies. Do not wrap generic recommendation utilities as a domain solver. |
| B13-2 Manual03 intake | Proposed `lib/bootstrap/**`: validated current concern/action copies, explicit demo relevance decisions and resource assumptions, domain fingerprints. | A6/A10–A12; read existing03 source, no completion write-through. |
| B13-3 Durable history | Future schema/command/repository integration plus additive migration, receipts, graph validation, immutable snapshots and safe local JSON/Markdown. | A10/A12–A15; shared-file lease and checked-base-specific DTO/route/quota/retention review required. No fixed migration number now. |
| B13-4 Interaction | Use accepted design system/component map to implement the decisions in §7, accessible errors/ranges/history and branch visibility. | First confirm merged design baseline and frontend ownership. This draft gives no component/file/layout plan. |
| B13-5 Integration/demo | Isolated end-to-end planning/funding-rejection/cost-change/restart journey; run scoped and required full checks after owning the heavy slot. | Build final code, run `npm run review`, verify loopback health and exact revision/build identity, return working review URL. Parent integrates checked revision via CI/branch gates. No public deployment. |
| Later adapters | Optional04 confirmed findings,06 resource/budget snapshot,11/12 scenarios, or fixed execution. | Separate spec/addendum pinned to each actual checked merged SHA and human decisions; never treat them as already integrated. |

**Research checkpoint status:** human choices for the synthetic planning scope are settled; no application implementation, application checks/build/browser acceptance, experiment, deployment or live-account action occurred. The source review and official-method research support a bounded implementation design, subject to independent document review and the pinned checked-base reconciliation above. Scientific relevance remains deliberately unvalidated. The accepted UI baseline and exclusive implementation/shared-file lease are required before dependent frontend/integration coding; UI redesign is not a prerequisite to completing this research.

Validation and independent-review outcomes, final document hashes, scoped commit/base and remaining gates are recorded in [research handoff](../research/13/HANDOFF.md). Parent decides when to dispatch the separate implementation chat under the standing pipeline; this chat does not start it.
