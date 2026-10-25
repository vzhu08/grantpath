# 12 — AimFit: study design under a funding ceiling

Research specification v0.9 · October 25, 2026 · **review checkpoint, not ready for integrated coding**.

This is documentation research. No application code, numerical implementation validation, application tests, build, server, deployment, live AI or real-study analysis was performed. Both consequential human choices below are settled. Actual checked budget/runtime reconciliation and numerical execution gates remain open.

## 1. Researcher benefit, chosen family and limits

AimFit helps a researcher answer: “Given my stated question, assumptions and ceiling, which of the study options I am willing to consider can I afford, and what target would I give up?” Its useful mechanism connects deterministic power and cost calculations to exact supporting assumptions and a preserved proposal revision. A cheaper option cannot keep the original power claim automatically. A changed price or variance exposes the affected decision for review.

The requesting user answered these questions directly in this research chat on October 25, 2026:

| Choice | Verbatim human answer |
| --- | --- |
| Single study family | “Two independent groups, continuous outcome, equal allocation and variance; nonclinical planning demo (Recommended)” |
| Validation scope | “Deterministic planning demo checked against official R references; no claim of scientific validation (Recommended)” |

No statistics adviser or additional human teammate is assumed. The requesting user owns product/scope and acceptance of their proposal changes. The roadmap's broader adviser/expert-acceptance goal is narrowed by the direct validation choice: this release demonstrates reference-checked planning arithmetic; it cannot claim scientific validation or expert acceptance. A future real study requires appropriate scientific/design review.

The bounded release has one continuous primary outcome, two independent groups, equal analyzable sample size and common within-group standard deviation, a two-sided pooled t-test planning model, a zero mean-difference null, fixed alpha 0.05 and a researcher-specified meaningful mean difference. It compares at most three explicitly confirmed sample-size variants. It does not analyze observed outcomes. Every run records outcome units, population, contrast, measurement occasion, the independent normal-outcome model with common variance, and the intended interpretation. The power expression is exact under that model; using it for approximately normal outcomes adds a modeling approximation. These are assumptions to review, not conditions the app can establish from prose.

Scope excludes clinical/wet-lab planning, paired/clustered/repeated measures, unequal allocation or variances, proportions/survival/count outcomes, multiple endpoints/multiplicity, sequential/adaptive testing, causal-identification assessment, recruitment prediction, ethics approval, external discovery, institutional integration and GrantWeave. Do not infer causality from two-group arithmetic, replace SD with standard error, or silently switch to Welch's test. No live AI is required. A local planning tool establishes neither secured funds, allowability, merit, achievable recruitment nor funding probability.

The demo is October 26, 2026; exact cutoff and allotted duration remain unknown. Favor a small saved comparison, an honest infeasible target and one accepted revision with stale-cost recovery. Defer general optimizers, many families, continuous sliders and new hosted infrastructure.

## 2. Inspected baseline and authority

Research checkout: `C:/Users/vzhu0/.codex/worktrees/80d1/grantguide`; branch `codex/research-12-aimfit`; base/inspected checked main **`2da6a3104663d602424256217b19f2eba58c6996`**, workspace schema **4**. The lead read local/scoped instructions, project brief, selected modules, quickstart, ownership, human workflow, task card, API contract, implementation status and roadmap 12. No nested `AGENTS.md` was found under the inspected `docs`, `lib`, `modules` or `packages` trees.

Current primary `C:/Users/vzhu0/PycharmProjects/grantguide/{AGENTS.md,docs/ORCHESTRATION.md,docs/OWNERSHIP.md,docs/TASK_CARD.md}` explicitly releases research now and supersedes this checkout's historical wait-for-UI/reconciled-runtime research-launch rule. This does not release application editing, the 05→06→08 shared/heavy lease, or a ready-to-code claim on guessed contracts. Parent owns central documents and integration.

At inspected main, proposal/vault/resubmission workflows are merged. Award 05, ledger 06, rubric 04 and discovery 09 are not merged runtime. [Budget specification 06](06_BUDGET_LEDGER_IMPLEMENTATION.md) is a researched logical boundary, not proof of connected runtime. The separate inspected **unintegrated** finance source checkpoint is **`4f01d55dec629dd7dac3ace3887c6d795680cfc7`**, associated with managed `09f2/grantguide`; it was read through `git show` from the shared object database, without changing that checkout. Its `lib/finance/**` modules exist; finance routes/shared migration/repository wiring are absent at that checkpoint. These facts must be re-inspected against checked merged 06 before integration.

Frontend code **will/may change** during the forthcoming whole-product redesign. This document specifies user decisions, information priority and integrity outcomes. It reserves no navigation, component props, layout, CSS, inspector or existing frontend files. Later frontend implementation must read the accepted merged `docs/DESIGN_SYSTEM.md` and `docs/UI_COMPONENT_MAP.md`; neither is an accepted baseline at this research inspection. UI redesign is not a research prerequisite and must not wait on AimFit.

## 3. Primary sources and method decision

The dated [source and numerical-reference note](../research/12/METHODS_AND_REFERENCES.md) records opened official sources, conventions, independently calculated candidate values and the not-yet-executed official R oracle. Read it with this document.

- [R `power.t.test`](https://stat.ethz.ch/R-manual/R-devel/library/stats/html/power.t.test.html) defines `n` per group. Set `type="two.sample"`, `alternative="two.sided"` and **`strict=TRUE` explicitly**; the default omits opposite-tail rejections. Preserve the reference R version and output rather than treating a moving documentation URL as a frozen oracle.
- [Official R implementation](https://svn.r-project.org/R/trunk/src/library/stats/R/power.R) supplies the two-tail noncentral-t calculation used for the reference plan. [R t-distribution documentation](https://stat.ethz.ch/R-manual/R-devel/library/stats/html/TDist.html) also describes numerical limitations. Do not silently use a normal approximation when the requested calculation fails.
- [NIST's two-sample t-test](https://www.itl.nist.gov/div898/handbook/eda/section3/eda353.htm) supports the pooled equal-variance contrast and rejection region. [R `t.test`](https://stat.ethz.ch/R-manual/R-patched/library/stats/html/t.test.html) distinguishes pooled and Welch variance handling; its default is not this selected family.
- [SciPy 1.15.3 `nct`](https://docs.scipy.org/doc/scipy-1.15.3/reference/generated/scipy.stats.nct.html) and [central `t`](https://docs.scipy.org/doc/scipy-1.15.3/reference/generated/scipy.stats.t.html) expose a practical deterministic calculation engine. The noncentral implementation uses Boost routines. An independent agent used existing SciPy for research reference candidates; **those values have not been compared with an executed R oracle**.
- [SAS/STAT 14.1 methods](https://support.sas.com/documentation/cdl/en/statug/68162/HTML/default/statug_power_details74.htm) independently describe exact equal-variance power through noncentral F. [Minitab's published example](https://support.minitab.com/en-us/minitab/help-and-how-to/statistics/power-and-sample-size/how-to/hypothesis-tests/power-and-sample-size-for-2-sample-t/before-you-start/example/) supplies a concrete cross-check: delta5, SD10, alpha0.05 and target0.90 produce 86/group and power0.903230. This is published reference evidence, not execution of our engine.
- [NIST TN2106, September 2020, section3.1.2.1](https://nvlpubs.nist.gov/nistpubs/TechnicalNotes/NIST.TN.2106.pdf) supplies the pooled mean-difference interval underlying the nominal width. [University of Zurich's attrition section](https://biostat.pages.uzh.ch/sta404/clin-biostats/05-sign.html#adjusting-for-loss-to-follow-up) describes dividing by retention. Its clinical teaching context does not broaden this demo to clinical design.

A one-proportion precision model would answer a different question, and a paired model requires the SD of within-pair differences. Neither can be substituted because it yields a smaller sample. The human selected the independent two-group family; do not implement all alternatives.

Recommended numerical implementation spike: a narrow, server-only, version-pinned local Python/SciPy runner, independently compared with official R. This is an engineering recommendation, not an installed application capability. The research host has Python 3.12.10/SciPy 1.15.3/NumPy 2.1.3 available; this does not establish a reproducible application runtime or CI dependency. Before committing to it, the implementation lead must verify an isolated reproducible runtime, licensing, packaging, supported inputs, cold-start latency and required CI execution with the parent. Pin the selected versions and executable identity; never discover an arbitrary Python from untrusted input. If this cannot be made reliable inside the hackathon budget, report that concrete gate; do not ship approximate arithmetic with a validated label. A different engine must pass the same independent oracle suite before adoption.

## 4. Assumptions a researcher must confirm

Each value is a typed, versioned assumption with units, role, provenance and a review decision. An absent value is `unknown` with a reason, not zero, a default effect or an AI estimate. A literature effect is not automatically the meaningful difference for this question. A synthetic fixture note is honest demo provenance, not scientific evidence.

| Input | Meaning and validation |
| --- | --- |
| Question and contrast | Population, group definitions, primary outcome/units, measurement occasion and the comparison the researcher wants to plan. Exact proposal section/revision/passage may be selected; no NLP inference is authoritative. |
| Effect `delta` | Positive meaningful difference in outcome units, chosen prospectively with source or explicit assumption rationale. Store direction separately; the two-sided calculation uses magnitude. Zero effect is an oracle edge case, not a solvable meaningful-effect target. |
| Common SD `sigma` | Positive within-group SD in the same units; record evidence population/measurement and any transportability uncertainty. Variance, if displayed, is derived `sigma²`, not a second independently editable conflicting input. |
| Statistical target | Alpha is fixed 0.05/two-sided in v1. Target power is explicitly chosen in `[0.60,0.95]`; fixture uses 0.80. A strictly positive nominal half-width may be a separate optional target in outcome units, clearly distinguished from power; success requires `nominal_half_width <= target`. Missing precision target means diagnostic only. |
| Attrition `a` | Expected fraction without analyzable primary outcome, common to both groups; integer basis points in `[0,5000]`. It inflates recruitment, not the effect or power formula. Preserve its source and uncertainty. Differential/informative loss is unsupported and requires separate review. |
| Costs | Exact USD cents for fixed costs and total variable cost per recruited participant, charged even if that participant later drops out. No automatically inferred overhead, receipt price, salary or missing cost. Confirm inclusions/exclusions and expiry/check date. |
| Ceiling | Exact hypothetical planning cap and its source. Explicitly distinguish a manually stated scenario ceiling, proposal-request plan and a selected award/finance context. No default from `ProfileSchema.fundingNeed`, a call maximum or summed grant maxima. |
| Resources/time | Optional explicit maximum recruits, balanced recruitment throughput per whole week, setup/follow-up/analysis weeks and maximum duration. Each constraint is `not_modelled` (visibly outside the result), `unknown` (required but missing/unconfirmed), or `confirmed`. These are planning limits, never a forecast of successful recruitment. Unknown necessary constraints make feasibility unresolved. |
| Permitted variants | Up to three specific integer analyzable `n` values per group, each with an explanation of what changes and what remains the same. Confirm the set before calculation; the fixture proposes 40/50/64, it is not a universal researcher-approved set. |

For operational planning, every assumption must retain an exact source quotation/version/hash where available, or an explicit manual/synthetic assumption with rationale and local attribution. The external methods citations establish formulas only; they do not justify any particular effect, SD, attrition or price. Do not fetch arbitrary source URLs automatically. Avoid participant-level/sensitive data entirely.

Proposed initial numerical envelope, to be validated by the engine spike: `2 <= n <= 1000` analyzable per group; `0.05 <= delta/sigma <= 2`; **noncentrality `lambda <= 35`**; fixed alpha 0.05; at most three variants and seven sensitivity scenarios total. The noncentrality bound keeps the planned oracle inside R's documented moderate range; this is an intersected envelope, not every n/effect combination in a rectangle. Outcome magnitudes use positive canonical decimal strings with at most six fractional digits and at most twelve digits total; reject exponents, NaN, infinities, negative zero and locale separators. Scale/unit changes must preserve `delta/sigma`. These are engineering limits, not scientific recommendations. Inputs outside the tested envelope are `unsupported`, not infeasible. Minimum `n=2` is a mathematical boundary, not a recommendation for a study.

## 5. Deterministic calculations and decisions

For analyzable **per-group** integer `n`, common SD `sigma` and effect magnitude `delta`:

```text
df = 2*n - 2
critical = central_t_quantile(1 - alpha/2, df)
lambda = (delta/sigma) * sqrt(n/2)
power = noncentral_t_survival(critical, df, lambda)
      + noncentral_t_cdf(-critical, df, lambda)
nominal_half_width = critical * sigma * sqrt(2/n)
```

The both-tail power concerns rejection of equality, including the opposite direction; it is not the probability of a correct-direction conclusion. The half-width is a **nominal planning width under the assumed SD**, using the pooled standard error formula. A realized interval's width depends on the observed pooled SD. This is neither guaranteed width nor assurance probability, and the app must not label it “achieved precision.” Do not compare a one-group precision formula with this two-group result.

Find the smallest supported integer `n` meeting target power (and an optional half-width target) by a bounded integer search with validated monotonic checks. Re-evaluate the selected integer and its predecessor against full-precision results; never round a root to the nearest integer or compare rounded percentages. Require exact integer agreement against the reference fixture. No root at `delta=0` can achieve the permitted power targets. Unsupported `n>1000` is “target beyond supported range,” not proof that no scientific design exists. Nonfinite results, convergence failures, numerical warnings or timeout are `calculation_unavailable`. They must not become `no_feasible_design` or trigger a hidden normal approximation. For either power or width, explicitly flag a boundary within its recorded numerical comparison tolerance for reference review before claiming the target met or unmet.

For attrition basis points `aBps` and target analyzable n:

```text
retentionNumerator = 10000 - aBps
recruitsPerGroup = ceil(n * 10000 / retentionNumerator)
totalRecruits = 2 * recruitsPerGroup
costCents = fixedCents + totalRecruits * perRecruitCents
```

Use integer/rational arithmetic for ceilings, counts and money, with `ceil(x/y)=(x+y-1)//y` for positive integers. Input money uses nonnegative canonical integer cents strings of at most18 digits; fixed and per-recruit costs may be zero only if explicitly confirmed. Derived cents are bounded to24 digits with overflow/capacity rejection, never truncation. Inflate each group separately, then double. Never round a total and split it into unequal arms. This is expected-retention inflation, not a probability guarantee of n completers. Power is conditional on n analyzable in each group; it is not calculated at the inflated recruited count. All cost quantities are recruited count in this model. Completion-only costs, noninteger hours, tiered purchases and variable costs differing by group are unsupported in v1.

If confirmed, minimum planned duration in whole weeks is `setupWeeks + ceil(totalRecruits / totalRecruitmentPerWeek) + followupWeeks + analysisWeeks`. This deliberately conservative sequential model assumes balanced allocation and no overlapping phases. Show the convention. It cannot establish a calendar recruitment rate. A confirmed cap on recruits is checked against `totalRecruits`, not analyzable count. Unspecified required throughput/duration makes timeline `unknown`; it does not silently pass.

Do not attach 06's synthetic 10% indirect assumption automatically. The example's costs are explicitly all-in with no extra indirect calculation. If a later approved budget adapter supplies indirect lines, retain exact eligible-base/rate/version/aggregate-rounding provenance, exclude duplicates, and reconcile all-in totals. Missing necessary costs or unresolved currency/base semantics make affordability unknown. USD-only v1 has no exchange rates.

Each candidate returns independent facets: input validity, cost completeness, cost within cap, resource within cap, timeline within cap, target power met, optional nominal-width target met, assumption review and source currentness. `affordable` can be true while `target_met` is false. Only fully known confirmed required constraints may produce `meets_all_planning_targets`; show any `not_modelled` constraints as exclusions beside that conditional result, never as passed checks. This is still conditional planning, not scientific approval. A deterministic stable ordering can put target-meeting choices first, then ascending cost and n; never present a utility score as scientific superiority.

Distinguish: `inputs_needed`; `unsupported_family_or_range`; `calculation_unavailable`; `no_affordable_candidate`; `affordable_but_target_unmet`; and `planning_targets_met`. A no-feasible statement must say whether it covers only the confirmed finite set or the supported model range. For this monotone fixed-plus-linear cost family, an integer minimum target n and its exact inflated cost can certify “target unaffordable within this model,” provided all required inputs are confirmed. It cannot rule out other families or unapproved changes.

## 6. Concrete synthetic walkthrough and claims

Fixture question: compare mean scores for two independently allocated nonclinical interface groups at one measurement occasion. All scores, prices and rates below are **synthetic assumptions**; none is an observed pilot result. Effect 5 points, common SD 10 points, two-sided alpha 0.05, target power 0.80, attrition 20%, fixed all-in cost $4,000, $100 per recruited participant, ceiling $18,000. The researcher confirms the candidate set n=40/50/64 per group.

Candidate numerical values below were independently computed with existing SciPy for research; **R comparison and production validation remain pending**. Exact cost/recruit arithmetic is separately hand-checkable.

| Analyzable per group | Recruits per group / total | Cost | Conditional power | Nominal half-width | Decision at $18,000 |
| --- | --- | --- | --- | --- | --- |
| 40 | 50 / 100 | $14,000 | 0.598147 | 4.451669 points | Affordable; 0.80 target unmet |
| 50 | 63 / 126 | $16,600 | 0.696893 | 3.968935 points | Affordable; 0.80 target unmet |
| 64 | 80 / 160 | $20,000 | 0.801460 | 3.498359 points | Power target met; $2,000 above cap |

The reference candidate minimum at the stated effect/SD is n=64; n=63 has candidate power 0.795168. Lowering n to 50 cannot retain “80% power to detect a 5-point difference.” Permissible saved planning wording states approximately 69.7% conditional power under the selected assumptions and wider nominal precision, with the unmet target explicit. It cannot state that a future study will find a difference, demonstrate equivalence, validate the outcome or deliver a causal conclusion. Nonsignificance is not evidence of no effect.

A separate combined-target fixture prevents conflating power and precision: at delta5/SD10, target power0.90 and nominal half-width<=3.0 points, n86 meets power but fails width (3.010347). Candidate minimum n87 has power0.906465 and width2.992747; R must establish this combined minimum and its predecessor before implementation validation. It is outside the walkthrough's confirmed three-candidate set and does not silently add a fourth proposal variant.

Optional confirmed resource fixture: maximum 140 recruits, total balanced throughput 20 recruits/week, setup/follow-up/analysis 2/2/2 weeks and a 13-week ceiling. Planned durations are 11/13/14 weeks respectively; n64 also exceeds recruit and time limits. Keep resource failures separate from the funding failure. Raising only the cap does not repair those constraints.

Demonstrate these transitions: save the original assumptions and proposal; inspect the affordable n50 alternative and its weakened target claim; explicitly accept a revised planning paragraph; change per-recruit cost from $100 to $120. The retained n50 run still says $16,600 historically, while a new cost version computes $19,120 and invalidates current affordability/acceptance. Do not rewrite the accepted paragraph automatically. Reopening the old run shows its old evidence and review state, alongside current drift.

Sensitivity is a small confirmed scenario table, not repeated search for a pleasing result. Default proposed scenarios vary one factor at a time: delta 4 versus 5; SD 12 versus 10; per-recruit cost $120 versus $100; attrition 30% versus 20%; cap $20,000 versus $18,000; one combined pessimistic scenario if the researcher confirms it. Include baseline in the maximum seven scenarios. At n64, candidate power falls to 0.612385 for delta4/SD10, and to 0.647688 for delta5/SD12; the latter nominal half-width is 4.198031. At n50/30% attrition, recruit 72/group and cost $18,400. No scenario changes the original target, question or accepted assumptions silently. No tuning on observed outcomes, repeated significance seeking or post-hoc power display exists in this release.

## 7. Actual seams and missing adapters

| Inspected code | Reuse boundary / missing work |
| --- | --- |
| `lib/schema.ts`: `DraftRevisionSchema`, `PacketPayloadSchema` | Real immutable revision identities, source selections and frozen packets; no structured study assumptions or sample/resource fields. Do not parse profile free text into authoritative values. |
| `lib/proposals/workflow.ts`: `canonicalStringify`, `validateStateIntegrity`, `freezePacket` branch | Pattern for retained input closure/digest; historical digests must remain unchanged. Its locale-based key sorting is an existing versioned behavior, not a new cross-runtime canonicalizer. |
| `lib/evidence.ts`: `validCitation`, `citationStale`; `lib/resubmissions/context.ts`: `evidenceCopy`, `revisionCopy` | Exact normalized source version/hash/UTF-16 range and current/archived draft lookup. Add explicit same-project checks; generic citation validity alone does not establish project ownership. |
| `modules/documents/src/index.ts`; `lib/vault/domain.ts`: `sourceFileStale` | Normalized source hash is fnv-pair; vault has SHA-256 bytes/integrity. Preserve upstream hash type separately from AimFit SHA-256. Replacement/stale origin remains reviewable. |
| `lib/repository.ts`; `lib/resubmissions/workflow.ts`: receipt recovery | Serialized one-process writes and receipt-before-revision pattern; add AimFit dispatch/graph/reset retention only under the shared lease. `repository.internal` alone is not durable idempotent acceptance. |
| `lib/proposals/checks.ts`: `snapshotInputsMatch` | Useful currentness pattern, but does not include AimFit assumptions/costs. Need a separate dependency digest/checker. |
| `lib/http.ts`; `app/api/workspace/route.ts` | Preserve local same-origin JSON/120,000-byte bounds and errors. |
| Unmerged 06: `schema.ts`, `budgets.ts`, `money.ts`, `workflow.ts` | Exact USD cents, versioned plan totals, `ExpectedContextSchema`, `FinanceEnvironment`, `expectContext`, capacity callback. **No unit-price/participant semantics** in `LineSchema`; its cents are whole-line totals. |
| Unmerged 06: `snapshots.ts`, `exports.ts`, `comparison.ts` | Retained ledger snapshot/export validation and scoped financial input digest. A paid-history snapshot is award-bound and is not a study cost catalog or an automatically available pre-award cap. |
| `modules/recommendations/src/index.ts` | Generic filtering/utility/voting, not power or study validity. There is no `modules/analytics`; do not claim an imported domain solver. |

**Provisional 06 adapter:** copy exact, confirmed planning-cap/whole-line context with a typed role, stable IDs/digests, USD/scale2, current award/budget/mapping heads where applicable, evidence closure and unresolved flags. A human creates distinct fixed/per-recruit assumptions and explicitly relates them to plan lines; the adapter never divides a line by an inferred n. Budget-request totals, approved plans, obligations, local remaining and forecasts keep their separate meanings. Do not copy an award remaining balance as available study funds without an explicit stated scenario choice, cutoff and context. Adapter exports, read route, amendment behavior and completeness/currentness semantics must be reconciled at checked merged 06. There is no settled AimFit-ready cost DTO today.

## 8. Conceptual contracts — not existing exports

Names, schemas, routes, persistence collections, migrations and sizes in this section are **PROVISIONAL engineering proposals**, to reconcile before integrated coding. No existing application imports these names.

| Record | Required immutable content |
| --- | --- |
| `AimFitAssumptionSetV1` | Project/application; question/units/contrast; family and method versions; canonical effect/SD/target/optional width; attrition basis points; fixed/per-recruit exact costs; typed ceiling and resource/time assumptions; permitted candidates/sensitivities; explicit inclusions/exclusions; source/quote or manual/synthetic rationale; review attribution/time; parent assumption version. |
| `AimFitRunV1` | Exact assumption-set payload/digest, relevant proposal revision copies, source closure, optional exact finance context, method/engine/runtime/reference-suite identities, all candidates/sensitivity outputs and unmet constraints, integer/rounding/search policy, capture time, provenance and content digest. Original inputs are embedded/retained, not a digest of mutable lookups. |
| `AimFitDecisionV1` | Exact run/candidate/result digests; accept/decline reason, acknowledged target changes/unmet constraints, relevant source and target heads, local actor/time and optional superseded decision. An accepted choice need not meet targets; that shortfall must be explicitly acknowledged. |
| `AimFitApplicationUpdateV1` | Exact decision/run, selected section/revision before, user-reviewed replacement text/blocks, appended revision after, active claim linkage, claim comparison and durable operation receipt. A decision alone does not update a proposal. |
| Frozen JSON/Markdown export | Original assumptions/results/decisions/provenance, explicit demo/conditional-planning labels, gaps and engine identity; saved exact bytes/length/SHA-256 outside the content digest. No participant data, CSV or rendered sponsor packet is needed. |

Use versioned `aimfit-json-v1`: ordinal key ordering, JSON string escaping, ordered arrays, no undefined/nonfinite values, safe integer numeric counters only, and canonical decimal **strings** for scientific inputs and stored outputs. Record binary64 runtime/method and deterministic output formatting; round only for display. Money is integer cents strings operated on by BigInt, never routed through scientific floats. Do not modify proposal or finance canonicalization. Finance's `finance-json-v1` rejects fractional numeric values; blindly reusing it for alpha/power would fail. Preserve upstream hashes and independently SHA-256 the captured AimFit content. Content excludes currentness, receipt/export descriptors and its own digest to avoid cycles. A new engine/reference suite creates a new run; never recompute an old exported result under a newer engine.

Proposed commands: save/confirm assumption version; calculate/save run; record decision; preview/apply reviewed proposal update; freeze/read export; archive scenario. Calculations can be synchronous bounded requests; avoid an asynchronous job framework for this demo. A run is saveable only after server-side validation and deterministic computation; client values/results are never authoritative. HTTP suggestions are `POST /api/aimfit/calculate`, scoped saved-run reads/exports, and strict workspace commands for durable changes. Exact names/contracts await integration lease and reconciliation. Text is escaped; no formulas, shell snippets, HTML, URLs or source instructions execute.

The proposed runner protocol uses a trusted executable/script, argument array without a shell, bounded versioned JSON stdin/stdout, no inherited provider credentials, no network and no arbitrary paths/imports supplied by a request. Proposed bounds: one active child, at most two waiting requests, 10-second wall deadline, 64 KiB each stdin/stdout and bounded stderr codes. Terminate only the owned process tree on cancellation/timeout. No process per candidate. Validate strict output schema, declared versions, finite probability/width and expected candidate identities. Missing runtime/dependency or version mismatch yields `calculation_unavailable`, preserving user inputs. Runtime lifecycle/security/performance must be proved before enabling this path.

## 9. Acceptance, invalidation and safe updates

Persist assumptions, runs and decisions append-only. A reviewed original proposal remains intact. Selecting a candidate shows the old/new planned n, recruits, cost, power/width and scope/claim changes. Applying revised text requires a separate explicit review and acceptance of exact section revision IDs and a literal replacement preview. Append new revisions; do not replace existing text, set scientific evidence complete or mark an application Ready automatically. If multiple selected passages depend on the old target, show their coverage and require review; do not claim an NLP sweep found every claim. Export stale/unreviewed dependencies as warnings.

The server rechecks project ownership, exact dependencies, candidate digest and expected current heads inside the serialized acceptance transaction. An unrelated global revision can cause 409/reload without scientifically invalidating unchanged assumptions. The user retains text and choices. Never auto-rebase money, source reviews or proposal edits. Exact durable operation recovery occurs before stale expected-revision rejection or mutable dependency/current-head checks: hash the canonical validated original request, then the same operation ID/request digest returns original record/revision IDs with no write; changed payload under that ID conflicts. Recording a decision commits decision+receipt atomically. Applying an existing decision commits update+new draft revisions+claim linkages+receipt atomically. Saving a calculated run commits the server-derived run+receipt atomically after rechecking its captured dependency digest; no client-supplied power/totals are accepted. Recover a completed calculation receipt before requiring the numerical runtime again. Do not consume a preview token before persistence.

Preserve the run's original proposal inputs permanently. A committed application update records exact before→after revision relations; its active claim link expects the recorded **after** revision. This authorized update does not invalidate itself. A later revision requires targeted proposal-context review; text similarity cannot establish renewed approval. Existing draft revision schemas have no AimFit claim link today, so its representation and shared integration must be added under the lease rather than assumed.

Persist the accepted decision→appended revision linkage through ordinary proposal saves. Changed assumptions, costs, cap or context produce a targeted unresolved planning finding in actual proposal readiness and a visible warning in export/internal manifests. A stale linked claim cannot support current Ready-for-review status or be cleared by a waiver asserting an unsupported fact. Draft exports may retain original text with explicit unresolved internal warnings; no silent rewriting or inserted sponsor-narrative disclaimers. An ordinary section save explicitly preserves, supersedes or removes the linkage with a recorded review decision; it cannot silently detach it. Keep prior linked revisions/decisions and frozen packets unchanged. Review and export adapters must preserve this behavior across both AimFit and ordinary proposal edits.

Currentness is derived outside immutable content and reports the precise changed dependencies:

| Change | Current decision outcome |
| --- | --- |
| Effect, SD, target, attrition, family/method/engine or candidate set | Needs recalculation; preserve prior run/decision. |
| Fixed/unit cost, included cost, cap or resource/time assumption | Needs affordability/resource review and a new result; accepted attainable-target wording cannot remain current automatically. |
| Selected source head/hash, underlying vault replacement/integrity or assumption confirmation | Needs assumption/evidence review. Exact old support still opens if intact. |
| Referenced proposal section, relevant project/call/template context | Needs proposal-context review before applying an update; unrelated section edits need not trigger scientific recalculation. |
| Referenced award/budget/mapping/ceiling source changes | Needs budget review, even if the old ledger snapshot itself validates. Inspect actual merged 06 current-head adapter. |
| Snapshot/export/receipt-only mutation | No scientific-input digest change. |
| Missing historical payload, wrong-project reference, bad digest/bytes | Unavailable/corrupt; cannot be cleared by a stale-source checkbox. |

Reject reset/delete that would orphan any retained assumption/run/decision/revision/export/source closure, including synthetic records. Archive hides editing but retains data and receipts. A source update does not rewrite historical hashes. Reconfirming a changed source requires a new reviewed assumption version; no blanket “ignore all changes.”

## 10. Persistence, capacity, failures and restart

Allocate the next schema version from the actual merged baseline, **not “schema 5” now**. Reconcile migrations and graph validators for all then-merged features. Preserve historical proposal payloads/digests, source/vault bytes, ledger/review/resubmission records and exports. Validate before migration; write an exclusive byte-identical backup before an atomic new state. Unknown schema/corruption fails closed without demo reset. The one-user/one-process JSON repository remains the deployment boundary.

At inspected main the actual whole serialized-workspace cap is **25 MiB / 26,214,400 bytes**, distinct from request/individual artifact limits. Do not inherit an older spec's larger proposal. Provisional AimFit engineering bounds: 10 scenarios/project, 20 assumption versions/scenario, 20 runs/scenario, 40 decisions/updates per scenario, 200 durable receipts/project, at most three variants and seven total sensitivity scenarios/run, 20 evidence refs/assumption set, 2,000-character rationale and 500-character labels. Proposed closed run content <=128 KiB UTF-8; each of two saved export artifacts <=256 KiB. Reconcile actual aggregate capacity before setting final values. Limits must be enforced before atomic write; never prune cited versions or receipts to make space. Return actionable 413 with the last good state and editor intact.

Old saved results/exports survive runtime absence and process restart. A calculation interrupted before a durable save leaves no success run/receipt. A lost response after a saved update recovers from its receipt. Temp-file/rename faults leave the old or complete new state; missing/corrupt retained result/export bytes fail visibly, never regenerate and call identical. Compare saved export bytes and SHA-256 after restart. Include AimFit state/artifacts in reset-reference checks and backups; the current metadata/vault backup helper is not a proven complete proposal-artifact backup, so implementation must document actual coverage. No routine research check uses normal `.local-data` or port 3000.

## 11. Deterministic acceptance and reference gates

This is a plan for actual checks, not a passing-test claim. Use fixtures/mock transports offline in ordinary tests. Capture official R outputs once in an authorized reproducible validation environment; keep R version/script/output hashes and an independently generated SciPy/production comparison. Ordinary tests read committed reference fixtures, without network or live AI. [Reference note](../research/12/METHODS_AND_REFERENCES.md) specifies numerical cases and tolerances.

| Gate | Required evidence |
| --- | --- |
| Numerical definition | Both rejection tails; power at delta0 equals alpha within tolerance; n is per-group; consistent pooled df/SD; nominal width label; reject unsupported family. |
| Integer/reference boundaries | Official R cases n2/10/20/40/50/63/64/85/86/87/100; selected minimum64 for 0.80 and86 for0.90 at delta5/SD10; combined power0.90/positive nominal-width<=3.0 requires candidate87 because86 fails width. Verify predecessor fails and both tolerance-boundary states; exact integer agreement, not rounded root. R execution remains pending today. |
| Sensitivity | Official reference for delta4/SD10 and delta5/SD12; common scaling of outcome units preserves power; SD/cost/attrition/cap/resource changes affect the correct facets. |
| Attrition/cost | n50/20%→63 per arm/126 total/$16,600; n64→80/160/$20,000; n50/30%→72/144/$18,400; all-cents exact; per-arm rounding; zero attrition; exact equality to cap; one-cent-over failure. |
| Infeasibility taxonomy | Unknown cost or source, no affordable candidate, affordable below-target candidate, supported-range exhaustion, engine error and timeout remain distinguishable. Optional constraints unknown cannot become green. |
| Claims/approval | Budget cuts cannot retain 80% wording at n50; original revisions preserved; decline changes nothing; explicit accepted lower-power tradeoff has acknowledged shortfall; no simulated experiment/result or causal/funding claim. |
| Currentness/linkage | Apply once→after-revision claim link is current; later ordinary section edit→targeted context review with linkage retained until explicit review decision. Changed linked costs/SD/cap surface unresolved readiness/export warnings; original run/packets unchanged. Targeted drift for every source/vault/finance head; unrelated/receipt-only changes do not invalidate scientific inputs. |
| Durable operations | Exact replay after response loss and unrelated save returns original IDs without new revisions; changed payload conflicts; stale/new acceptance returns409 with buffers retained; rejected writes have no partial decisions. |
| Integrity/restart | Migration backup and old digests; malformed/cross-project/missing closure/corrupt exports fail; atomic fault/capacity/reset cases; run/decision/export bytes identical after actual restart. |
| Integration/UI | Checked upstream reconciliation; production browser path with isolated synthetic data, keyboard/narrow viewport and dirty-editor recovery; existing proposal/vault/resubmission/finance journeys still pass. Follow accepted design-system/component map. |

## 12. Implementation tickets, ownership and remaining gates

1. **AF-00 — Reconcile checked predecessors (before integrated coding).** Parent supplies actual checked merged 05/06 SHAs. Reinspect exact money/budget/cap/source/current-head schemas, routes, amendments, migration/receipt/retention/reset/capacity behavior and runtime acceptance. Record the addendum below. Source checkpoint4f01d55 is insufficient. No need to wait for discovery, GrantWeave or rubric04 merely for this chosen family.
2. **AF-01 — Numerical proof and runtime preflight.** In an isolated checkout/environment, execute official R oracle and compare independent production engine over the supported envelope. Capture versions, hashes, failure/timing/resource cases. Set tolerances and packaged runtime. Stop the numerical-release claim if comparisons fail; do not broaden methods. No app scientific-validity claim results from passing this ticket.
3. **AF-02 — Pure domain slice.** Add new `modules/aimfit/**` for closed method/assumption/candidate schemas, exact count/cost/resource logic, finite enumeration and sensitivity; new `lib/aimfit/**` for source/proposal/finance adapters, runner and currentness. These are proposed exclusive paths, not existing exports. Keep scientific floats out of money, hashes versioned and fixture labels intact.
4. **AF-03 — Persistence boundary.** Under an exclusive shared lease, add schemas/migration/command dispatch/graph/reset/backup integration, immutable runs/exports, persistent claim linkage/readiness/export integration and durable receipts. Parent/shared steward owns pre-existing shared files, manifests and CI. Writing subagents require separate checkouts and literal exclusive paths; read-only reviewers need no write scope.
5. **AF-04 — Reviewed proposal change.** Preview exact n/target/claim changes, explicit acceptance and appended proposal revisions. Reconcile existing blocks/citations/reviews/readiness behavior; inspect all selected passages with original target claims. Do not mark experiment evidence complete.
6. **AF-05 — Frontend after accepted UI baseline.** Implement outcomes from sections4–9 using the actual merged design system/component map. No UI file reservations are made by this research. Keep calculations/assumption provenance/unknown or unmet targets visible, then reveal detail as needed.
7. **AF-06 — Independent acceptance and release.** Run focused offline domain/reference/integration checks, then required install/module checks/typecheck/full check/build/regression/browser/restart checks in the parent's host resource slot. Build final revision, run `npm run review` with task-specific isolated data/port, verify loopback health/build identity and provide the working review URL. Let required exact-revision CI pass; parent integrates incrementally. Preserve normal workspace and existing servers. Local review is not public deployment.

Use useful read-only agents for independent numerical/reference and integrity reviews; numerical writer and application adapter writer may run concurrently only in separate isolated checkouts with exclusive paths. Keep Standard/Fast off and the requested model/effort. Do not install/run heavy checks or start implementation from this research chat.

### Mandatory later reconciliation addendum

Status: **not yet supplied**. Before “ready for integrated coding,” append the checked merged main/05/06 SHAs, actual exports and exact DTO shapes, typed cap source and source-completeness rules, unit-cost relation (explicitly new AimFit assumptions), current-head behavior, migration allocation, receipt lookup order, retained graph/reset/backup rules, request/snapshot/aggregate capacity and observed runtime/restart evidence. Record any changed assumptions and re-review this spec against those SHAs. Later UI code additionally needs the accepted UI baseline. Numerical production-release readiness separately requires AF-01's real R comparisons; research candidate values are insufficient.

There are no unanswered task-specific human family/validation choices. A real study still needs its own source-linked question/effect/SD/cost/attrition/resource assumptions and explicit in-app acceptance; research has supplied none as real evidence. Until the runtime addendum, this is a completed independent research checkpoint, not an approved integrated implementation handoff.

### Independent checkpoint review

Read-only `aimfit_methods` approved the final method checkpoint after correcting the normal-model statement, adding the lambda35 envelope, and checking the combined n87 power/width fixture and both boundary tolerances. Read-only `aimfit_code_review` approved the integrity checkpoint after adding before→after active claim linkage, ordinary-save/readiness/export integration, optional-constraint states and per-command durable recovery. Both used the requested GPT-6.1 Sol/xhigh with Standard/Fast off preference. Approval is of this research checkpoint; it does not close the runtime, R execution or frontend implementation gates. The lead alone wrote the two assigned documents.
