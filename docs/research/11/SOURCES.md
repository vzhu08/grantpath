# GrantWeave official-source and method register

Reviewed October 25, 2026. Engineering research for a synthetic NSF-style demonstration. Sources inform a typed model; actual award applicability, permitted combinations, scientific scope and budget interpretation still need human confirmation. No grants-administrator authority or scientific validation is assumed. No external call/source text was written into normal workspace data.

## Domain sources

| Source and date/version context | Supported conclusion and design consequence |
| --- | --- |
| [NSF PAPPG 24-1 landing page](https://www.nsf.gov/policies/pappg/24-1), dated Jan 22, 2024; proposal effective date May 20, 2024; retrieved Oct 25, 2026 | The page identifies supplements 26-200/26-202 for awards on/after Dec 8, 2025/Jan 22, 2026. Solicitations and incorporated award conditions matter; identify the applicable package rather than treating a generic current page as every award's terms. This research has not audited every supplement or real award. |
| [NSF Current and Pending (Other) Support FAQ](https://www.nsf.gov/funding/senior-personnel-documents/faq/current-pending), retrieved Oct 25, 2026; page retains historical SciENcv transition wording | Capacity and possible overlap require current/pending support context. Person-month effort can differ from salary support; count unpaid modeled work and outside commitments. The FAQ is interpretive context, not a complete current award rule set. |
| [2 CFR 200.403](https://www.ecfr.gov/current/title-2/section-200.403), eCFR Title2 current through Oct 22, 2026, last amended Aug 17, 2026 | Cost type/amount limitations, documentation, consistent treatment and budget-period restrictions matter. Do not infer category eligibility or spending authority from an unspent total. Model explicit fixed cost dates; pre-award/closeout exceptions are excluded from the first demo. |
| [2 CFR 200.405](https://www.ecfr.gov/current/title-2/section-200.405), same eCFR currency | Allocation concerns benefit and documented basis. Costs cannot simply move to overcome deficiencies/restrictions. Some shared allocations may be legitimate; this release's indivisible-item restriction is a product scope limit, not a statement that all shared-cost allocation across awards is forbidden. No automatic label changes or invented proportional benefit. |
| [2 CFR 200.458](https://www.ecfr.gov/current/title-2/section-200.458), same eCFR currency | Pre-award costs require applicable approval/conditions. The demo assumes none, rather than inferring permission from a predicted start date or award ceiling. Real extensions/authorizations would need separate reviewed dated rules. |

The eCFR describes itself as authoritative but unofficial, distinct from the official legal edition. Initial guessed long eCFR subject-group URLs were inaccessible; canonical section links above were successfully opened and redirected to current content. Retrieved currency was Oct22, not a representation that every Oct25 change had been consolidated. Before real-award implementation, re-open the actual effective terms and retain local versioned text/digests in the authorized workspace.

Source-language policy: this research paraphrases; the implementation should retain brief exact quotations with source/version/hash and validated UTF-16 offsets. A web link alone is not an immutable restriction. A researcher confirmation records an interpretation and its scope; it does not become sponsor or institutional approval.

## Exact solver methods

| Primary source, retrieved Oct 25, 2026 | Supported fact / decision |
| --- | --- |
| [Google OR-Tools CP-SAT guide](https://developers.google.com/optimization/cp/cp_solver) | Integer constraints and distinct feasible/infeasible/unknown/model-invalid statuses are supported. A limit without a proof is unknown. A native OR-Tools runtime is unnecessary for the selected tiny TypeScript finite-domain model; the proposed custom enumerator must independently establish its own correctness. |
| [Google OR-Tools MIP example](https://developers.google.com/optimization/mip/mip_example) | Integer linear models and mixed-integer models have established solvers. These are credible future choices for larger or split-allocation models, with added runtime/adapter work. This is not a performance benchmark against the proposed demo algorithm. |
| [Google OR-Tools solver-selection guide](https://developers.google.com/optimization/mip) | MIP and Boolean-oriented constraint programming have different strengths. A dependency choice follows this release's bounded model and delivery constraints, not an unsupported universal fastest-solver claim. |
| [Official OR-Tools CP model protocol](https://github.com/google/or-tools/blob/stable/ortools/sat/cp_model.proto), moving `stable` branch at retrieval | A sufficient assumption set for infeasibility need not be irreducible or minimum. GrantWeave should not advertise a globally smallest, unique or legally authoritative cause. Any later dependency must pin an exact release/revision; this moving research link is not a reproducibility pin. |

Finite-domain depth-first enumeration with monotone pruning is the proposed method, an engineering choice by the research team. It is exact for fully searched admitted instances, but exponential. At five sources and twelve items there can be 244,140,625 leaves before pruning. Use a deterministic work budget and honest incomplete-search states. Numeric checks use exact cents and integer effort/resource units; no floating-point finance or AI arithmetic.

## Applicability exclusions

The first release does not implement NIH or mixed-sponsor rules, an institution's accounting policy, NSF solicitation-specific simultaneous-submission rules, the NSF senior-personnel salary policy, automatic MTDC/indirect computations, pre-award permissions, cost sharing or certification. They must not be smuggled into generic effort/category/overlap rules. A restriction on simultaneous submission, a restriction on accepting awards, a restriction on funding a scoped activity and a prohibition on charging one cost twice are distinct predicates/stages.

Official research alone cannot establish that a particular pair of scientific aims overlaps or is permitted to coexist. The synthetic restriction in [reference cases](REFERENCE_CASES.md) is explicitly invented demonstration text. A real workflow requires source-linked, user-confirmed applicability and recorded unresolved questions before a compatibility conclusion.
