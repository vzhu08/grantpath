# GrantWeave reference cases and proposed demo terms

Research date: October 25, 2026. These are hand-checked synthetic planning examples, not real NSF calls, awards, grants advice or scientific validation. No application solver has been implemented or exercised. On this date the human selected a synthetic NSF-style demo, the three-package computational plan, fixed dated indivisible cost items and all packages required, then answered **“Use this fixture and its stated restrictions (recommended)”** to the concrete $12,000/A-$7,000/B-$5,000/C-$4,000 fixture and its separate invented overlap variant. This confirms the demonstration model, not real NSF terms or permission.

## 1. Closed example inputs

All amounts below are USD. Persisted money would be exact integer cents; dollars here aid checking. Work dates are fixed in 2027, with inclusive calendar-date intervals. There is no pre-award, carry-forward, indirect-cost or cost-sharing assumption. Each item is new future demand; none is already paid, committed or funded elsewhere. Existing support and other duties are explicitly declared in this synthetic closed example.

| Package | Fixed dates | Cost items | PI effort in that month | Dependency |
| --- | --- | --- | --- | --- |
| W1 Prepare an existing dataset | Jan 1–31 | P1 personnel $2,000; O1 other $1,000 | 2,000 basis points of monthly capacity | None |
| W2 Run a computational analysis | Feb 1–28 | P2 personnel $2,000; O2 other/compute $3,000 | 3,000 basis points | W1 finishes before W2 starts |
| W3 Validate/report results | Mar 1–31 | P3 personnel $2,000; O3 other $2,000 | 2,000 basis points | W2 finishes before W3 starts |

Total: personnel $6,000 + other $6,000 = **$12,000**. Package totals are $3,000/$5,000/$4,000. Effort is effort required for the work, including unpaid effort; salary amounts do not determine it. Outside duties consume January/February/March 7,000/6,500/7,500 basis points of the same 10,000 monthly capacity. Resulting loads are 9,000/9,500/9,500. A compute resource has February capacity 50 slot-hours, existing reservations 10 and W2 demand 40; equality binds.

For exact date tests, P1/O1 have an assumed incurred date of Jan31, P2/O2 Feb28 and P3/O3 Mar31, 2027. Work intervals remain the complete package intervals above. Sources' eligible budget and performance windows coincide in this fixture; a real award may have different windows and would require both to be represented.

### Fixture source paragraphs

These paragraphs are the local synthetic sources for confirmation and citation tests. Their labels identify fixture rules, not official policies. The implementation must import their exact text as versioned demo sources, then create exact quotations/offsets; this document does not invent runtime citation IDs or hashes.

- **DEMO-A-1:** A is an already awarded synthetic source. Its confirmed remaining capacity eligible for these new costs is $7,000, within January 1 through March 31, 2027. Personnel and other are allowed for W1, W2 and W3. The remaining other-category cap is $3,000. This is a local planning capacity after existing paid costs and commitments, not a bank balance or spending authorization.
- **DEMO-B-1:** B is a hypothetical award with a scenario amount of $5,000, conditional on receipt on the assumed terms. Only W2 costs are eligible, during February 1 through March 31, 2027. Personnel is capped at $2,000 and other at $3,000. A rejected/not-awarded B supplies zero conditional capacity. No call maximum is copied into this amount.
- **DEMO-C-1:** C is a hypothetical award with a scenario amount of $4,000, conditional on receipt on the assumed terms. Only other-category costs for W2 and W3 are eligible, during January 1 through March 31, 2027. A rejected/not-awarded C supplies zero conditional capacity. No call maximum is copied into this amount.
- **DEMO-IDENTITY-1:** P1/O1/P2/O2/P3/O3 are six distinct economic costs. Each must be assigned wholly once to one eligible source. Duplicating a row, renaming an item or changing its category label does not create a new cost.
- **DEMO-OVERLAP-1:** For the overlap variant only, A and B may not jointly support the scoped science comprising W1–W3. This is a synthetic user-confirmed restriction on combined support, even if all charged cost identities are distinct. It is not a finding that the example has scientific overlap, and is not a general NSF rule.

The default case enables A/B/C rules and cost identity; it does **not** enable DEMO-OVERLAP-1. Hypothetical B/C outcomes are scenario assumptions, not award facts. No standing external support for these six costs exists in this fixture. The outside duties/resource reservation above are existing non-money constraints.

## 2. Required acceptance/reference cases

Each variant starts afresh from the default unless explicitly stated. Other rules stay fixed. A constraint failure names its input/rule and exact operand values. There is no need to guess an optimal solution to validate the following witnesses/proofs.

| ID | Change and expected result | Hand check / explanation |
| --- | --- | --- |
| F1 | B and C assumed awarded: conditional **feasible** | A pays P1/O1/P3/O3 = $7,000, including other $3,000; B pays P2/O2 = $5,000 with personnel $2,000/other $3,000; C pays $0. All dates, dependencies and capacity checks pass. A total/other, B total/personnel/other and compute resource bind. Secured money remains $7,000. |
| F2 | B assumed awarded, C failed: conditional **feasible** | Same witness as F1. C being present in the selection never forces its use. |
| F3 | B failed, C assumed awarded: **infeasible under this branch** | A+C capacity = $11,000 < $12,000 required. Exact monetary shortfall is at least $1,000; this lower bound is not a claim that $1,000 with any terms would fix the plan. |
| F4 | Both hypothetical sources fail / secured-only: **infeasible** | A has $7,000 against $12,000 demand: $5,000 necessary monetary shortfall. Failure does not delete W2 or call it completed. |
| D1 | Move B/C eligible windows to Apr 1–Jun 30; both assumed awarded: **infeasible** | Conditional total capacity is still $16,000. Every demand item occurs Jan–Mar; B/C have no eligible item. A alone cannot cover $12,000. Application deadlines do not substitute for eligible cost dates. |
| X1 | Submit a candidate witness assigning P2 to both A and B: **invalid witness** | Sum of assignments for P2 is 2, required exactly 1. Never count the extra $2,000 as extra scope. This rejects a proposed allocation; it does not prove the underlying default problem infeasible. Renaming the duplicate with the same economic cost ID also fails. |
| E1 | Raise outside February PI duty to 8,000 basis points: **infeasible** | W2 needs 3,000, hence 11,000 > 10,000. Splitting salary or selecting another funder cannot free the researcher's time. No NSF two-month salary rule is used as an effort cap. |
| C1 | Set A's remaining other-category cap to $0: **infeasible** | O1 is W1 other $1,000. B supports only W2; C supports only W2/W3; A has no other capacity. O1 has no eligible source despite aggregate $16,000 capacity. Relabeling O1 personnel is prohibited. |
| O1 | Enable DEMO-OVERLAP-1 with B/C assumed awarded: **infeasible** | Using A and B together is forbidden for the scoped work. Without that pair the largest possible capacity is A+C = $11,000; B+C = $9,000. Both are below $12,000. Distinct cost IDs do not overcome the scoped science restriction. |
| O2 | From O1, create a separately versioned counterfactual removing only DEMO-OVERLAP-1: conditional **feasible** | F1 is the exact witness. This demonstrates sensitivity to the modeled restriction; it does not grant permission to ignore a real condition. The original O1 scenario and rule remain retained. |
| ES1 | Separate focused model: A already supports scoped science, with zero new allocation: **infeasible** under a confirmed A+B scoped-support exclusion | There is one required new $2,000 item eligible only for hypothetical B; B is assumed awarded $2,000, C has failed, A has zero residual capacity. A already paid a different $1,000 cost for the same confirmed restricted scope, retained as existing support rather than new demand. A's support indicator is1 even though all new assignments to A are0; B's required indicator is1, violating the exclusion. This is not duplicate charging of the same cost. |
| R1 | Change W2 compute demand from 40 to 41 slot-hours: **infeasible** | Existing 10 + new 41 = 51 > 50. Money cannot supply an undeclared additional resource. |
| T1 | W2 starts Jan 15 while W1 still ends Jan 31: **infeasible** | The fixed finish-before-start dependency fails. Moving an item to another funding source does not reschedule the work. A dependency cycle is an invalid plan, rather than solver infeasibility. |

F3/F4 and O1 use necessary upper bounds over all allocations, so the infeasibility arguments do not rely on an arbitrary failed witness. D1/C1 eliminate domains directly; E1/R1/T1 fail funding-independent required constraints. ES1 has one possible new assignment and confirmed pre-existing scoped support; the restriction excludes it. These are complete proofs for these tiny closed models, not evidence about actual grant compatibility.

## 3. Integrity and result-state cases

| ID | Expected behavior |
| --- | --- |
| U1 | Missing A capacity/currency, unconfirmed eligibility, unknown scope permission, missing cost-date window or unreviewed external-support completeness produces **needs input**. Unknown is never zero, unlimited or permission. |
| U2 | Exhaustive search finds no witness: **infeasible under encoded confirmed assumptions**. A deterministic node limit reached without a witness or complete proof gives **unknown**, even for a problem independently known to be infeasible. |
| U3 | A verified witness found before the node limit: **feasible**, with alternatives search incomplete. No optimality, complete alternative list or unique-cause claim. |
| U4 | Same semantic input/order-normalized IDs/solver version gives the same fingerprint and deterministic traversal. Changing a cap, source version, award head, ledger closure, cost identity, effort baseline or restriction confirmation changes the fingerprint. |
| U5 | Amending A, editing a source, recording a new commitment or losing a referenced file marks affected current results stale. The frozen F1 result and old download remain byte-identical. |
| U6 | Crash before atomic save leaves no partial result/receipt. An uncertain client retry with the exact operation input recovers one saved result; changed input under that operation key conflicts. Restart never asserts a solver ran if no completed saved result exists. |
| U7 | Unsupported model size/currency/split cost/overlapping category periods yields an explicit validation/unsupported result; no rounded, truncated or silently simplified model. |
| U8 | Frozen JSON/Markdown bytes, length, SHA-256 and serializer version survive restart and a newer application formatter. Downloads verify the saved bytes; corrupt/missing content is unavailable, never silently regenerated. |

## 4. Later numerical verification

Before implementation acceptance, a separately written tiny brute-force oracle must compare all assignments for F1 and variants against the implementation's constraint evaluator; a returned witness must also pass an independent full checker. Here at most 3^6 = 729 complete assignments exist per branch before pruning. Add seeded small generated instances and reorder-invariance cases, without external API calls. Do not use this hand-check document as evidence that those tests have already run.
