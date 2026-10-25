# Bootstrap core

Bootstrap costs a finite set of future work that could address researcher-selected proposal gaps. It exhaustively searches dependency/product closures and exposes a partial plan or missing input when a complete plan cannot be justified. This implementation is **synthetic demo planning only; scientific relevance is not validated**. It executes no analysis, creates no observed evidence, closes no task-03 concern and grants no financial authority.

## Public entrypoints

Import from `modules/bootstrap/src/index.ts` in server-side TypeScript. Dependencies are the existing Zod 4 and Node crypto/Buffer; no provider, network, installer, database or Python process is used.

```ts
import {
  parsePlanningInput, planBootstrap, freezePlan, exportPlanJson,
  parsePlanJson, exportPlanMarkdown, assessPlan,
} from "./modules/bootstrap/src/index";

// Text comes from a caller-owned manual input form/import, never a silent demo fallback.
const input = parsePlanningInput(manuallySuppliedJson);
const preview = planBootstrap(input);
const snapshot = freezePlan(input, {
  id: "plan-1", createdAt: input.asOf,
  createdBy: "Researcher", priorPlanId: null,
});
const bytes = exportPlanJson(snapshot);
const historical = parsePlanJson(bytes); // verifies digests AND recomputes the result
const markdown = exportPlanMarkdown(historical);
// Host must supply newly validated/hydrated input; null means unavailable.
const assessment = assessPlan(historical, currentHostInput, evaluationTimestamp);
```

`PlanningInput` and `PlanningResult` are inferred from closed exported schemas. `validateInput(unknown)` validates graph/cross-record invariants as well as fields and returns an independent normalized copy. `parsePlanningInput(string)` checks UTF-8 capacity before JSON parsing. Invalid inputs throw a correctable validation error; legitimate infeasibility/uncertainty is a result. Schema-only parsing does **not** replace `validateInput` or `planBootstrap`.

## Caller contract

All objects are strict; unexpected fields fail. Inputs have `schemaVersion: 1`, `mode: "synthetic-demo-planning-only"`, a project ID and explicit ISO calculation timestamp. No workspace revision is accepted as a domain currentness key.

| Field | Required meaning |
| --- | --- |
| `catalog` | ID/version; fixed normalized single-channel microarray/limma family and synthetic scientific-status label; 1–12 uniquely keyed future nodes, 1–16 products and at most 64 relevance decisions. |
| `gaps` | 1–8 copied accepted/confirmed concerns from one project/application/active attempt, including exact retained feedback text/hash/UTF-16 quotation, concern/target fingerprints, selected unstarted action IDs/revisions/owner/deadline, confirmer/date and required flag. At least one required gap. |
| `resources` | Explicitly synthetic USD cash, effort/serial elapsed/compute minutes, RAM/scratch MiB; each `{value: integer-or-null, basis}`; versioned basis/as-of/valid-until. |
| `funding` | At most 8 versioned confirmed/pending/denied/withdrawn sources with amount, scope, relative availability, dated basis and condition. |
| `hypotheticalFundingIds` | Explicit set of pending sources for **one combined hypothetical branch** alongside the confirmed branch; no funding probability or automatic selection. |

Every node has a version, unique `sharedKey`, common-data dependence key, description/nonclaims, ordinary DAG dependencies, `requiredTogether`, exclusion groups, applicability/access/reviewer states, four intervals (`cashCents`, `elapsedMinutes`, `effortMinutes`, `computeMinutes`), RAM/scratch reservations and dated provenance. A shared prerequisite is **one node**, referenced by multiple consumers; duplicate shared keys are rejected. Started, partly incurred, sunk and completed work are unsupported and rejected rather than priced as free or restoring money.

Each interval is `{low, high, reason}`, with nonnegative integer endpoints or explicit nulls; null is unknown. Per-input quantities are bounded by 1 billion; aggregate arithmetic is safe under the closed 12-node/8-source limits. Upper bounds determine robust feasibility. Dated bounds describe assumptions, not confidence intervals. Cash, elapsed, effort and compute reservations sum across the one serial lane; RAM and scratch are **per-node peak reservations**. A node's scratch reservation must include retained outputs from earlier work; this does not solve storage scheduling or parallel scheduling.

Products list all required nodes. `requiredTogether` adds mandatory deliverables to the closure: for example D requires I, while I ordinarily depends on D. Only the ordinary dependency graph must be acyclic; product co-requirement cycles are finite closures. Product IDs alone have no evidence status. Gap coverage requires an accepted direct link explicitly qualified `demo-assumed-direct`, with all product nodes present and current copied source status. Weak/none/rejected links do not cover gaps; unknown/unreviewed links remain potential coverage needing input. A second uncertain link cannot cancel another accepted direct link to the same gap.

Manual copies are validated assertions, **not independently verified host records**. Physical source file identity/hash/integrity and latest source head are distinct from the frozen historic quotation/hash. `lib/bootstrap/ports.ts` defines the future read port and an explicit unavailable implementation. A later host adapter must recheck actual 03 versions/citations, vault bytes/currentness and workspace scope; no such adapter is implemented here. No 04/05/06/11/12 runtime is assumed.

Repeated copies must also agree internally: a `(sourceId, version)` identifies one retained full text/hash and physical origin; one source ID has one current head/exclusion state; one physical document-version ID has one immutable byte hash and current integrity state within the project/attempt. Distinct exact quotation ranges over that same retained text are allowed, as are distinct historical source versions. Different sources may reference the same consistent file version. Repeated current action IDs must carry identical revision/kind/owner/deadline/state copies. Contradictory copies fail validation even in optional gaps or redigested snapshots; no first-copy wins rule is used.

## Result and guarantees

The solver enumerates all at most 4,096 raw subsets, computes/deduplicates dependency plus product closures, rejects exclusion/known resource failures and charges each selected node once. Complete plans rank by cash upper, elapsed upper, effort upper, then sorted node IDs. Stable set normalization and code-unit sorting make input-array/JSON-key permutations identical.

Each funding branch exposes `completeStatus` (`robust-complete`, `no-robust-complete`, `needs-input`), an overall `outcome` (`complete`, `partial`, `infeasible`, `needs-input`) and `minimumStatus` (`proven-minimum`, `best-known`, `none`). Proofs apply only to the supplied catalog and assumptions. An unresolved alternative that could complete coverage prevents a categorical infeasibility/minimum claim unless independent current bounds rule it out. Lower bounds on its possible upper objective can establish that it cannot improve the known result; expired numbers cannot serve as proof bounds. Zero-cost extra nodes can affect the final ID tie order, so uncertainty there conservatively retains `best-known`. Unknown coverage of an extra target preserves known partial coverage of other targets. `best-known` does not certify an optimum.

Partials preserve exact covered/uncovered required-gap sets. Dominance requires coverage-set containment and no worse cash/elapsed/effort upper bounds, with a strict resource or coverage improvement. Equal-size different-gap sets cannot dominate each other. At most 8 partials are returned with full frontier count/truncation. At most 32 rejected/uncertain closure diagnostics are returned with total count/truncation. Coverage notes explain absent, weak and rejected links. No empty-coverage plans are offered. Complete supersets of the selected complete plan are not all returned; the bounded result is a decision summary, not a full search trace.

Pending support is counted only in the explicitly hypothetical branch; denial/withdrawal, late or restricted support contributes nothing. Unknown funding is not counted as certain money; a bundle fitting guaranteed known cash can still be feasible, while a bundle requiring unknown money needs input. Every hypothetical result remains conditional even if its money is unusable or unnecessary.

Branches expose both `guaranteedCashCents` under their assumptions and `maximumPossibleCashCents` (null if unbounded/unknown). `availableCashCents` is null when total availability needs input; the guaranteed portion remains visible.

## Immutable helpers and limits

Input limit: **80,000 UTF-8 bytes**, checked on raw JSON before parsing and on direct values before schema validation. Frozen export limit: **256,000 bytes**, with no silent truncation. These are core boundaries, not approved host request/storage quotas; shared integration must reconcile them with the existing 120,000-byte request and 25 MiB workspace bounds. No durable-save/history quota is implemented.

`freezePlan` copies inputs, recomputes authoritative results and deeply freezes them. Canonical JSON sorts plain-object keys, retains canonical strings, sorts semantic sets by code-unit ID and permits only safe integer numbers. Payload SHA256 excludes ID/creator/creation timestamp; envelope SHA256 includes those metadata and lineage. `parsePlanJson`/exports validate digests and recompute exact outputs, rejecting redigested forged totals too. These hashes establish content consistency, not signatures or source authenticity. JSON round trips retain exact canonical bytes.

`assessPlan` returns a separate current/stale/missing/unknown assessment. It compares per-record dependency digests (gap, node, product, link, resource, funding), checks explicit evaluation time against expiry and source-head/file integrity, and includes action owner/deadline. The calculation timestamp alone does not stale a plan. Invalid/missing current intake never rewrites the saved snapshot. The copied selected concern fingerprint may conservatively stale a plan for broader 03 changes. Unselected concerns and global workspace revisions do not participate. Markdown escapes source data and retains synthetic/nonexecution/conditional labels, open gaps, bounds, dated bases, nonclaims and bounded failure diagnostics; JSON is the complete copied record.

## Offline verification

With existing dependencies available, run a single worker:

```sh
node node_modules/vitest/vitest.mjs run --config scripts/bootstrap-vitest.config.mjs --configLoader native
node node_modules/typescript/bin/tsc -p scripts/bootstrap-tsconfig.json
```

`tests/bootstrap/reference-input.ts` contains **offline synthetic unit/reference inputs only**. It is never imported by product code. Hand cases establish $100–200/180–360-minute G1 closure and $125–250/210–420-minute full closure; $210 confirmed cash gives a partial, hypothetical +$60 supports a conditional full, and raising D's upper cost by $30 yields $230 partial/$280 full. Independent small-instance enumeration, non-greedy setup cases, failure/unknown boundaries, set dominance, permutation checks, exact immutable roundtrips and currentness tests check the mechanism. Actual versions/exits/review findings belong in `docs/implementation/13_BOOTSTRAP_RELEASE.md`.

Shared persistence/receipts/migration/routes, authoritative host/physical-source adapters, combined application checks/CI, frontend and final local review build/health/URL are pending separately assigned integration work. This core has no server or frontend fixtures and makes no application deployment/scientific validation claim.
