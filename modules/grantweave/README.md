# GrantWeave core v1

GrantWeave checks whether fixed required research work can be funded by whole dated cost items under explicit conditional assumptions. It can expose a plan that looks affordable but fails dates, categories, work capacity or scoped support restrictions. This is a pure engine milestone: no application routes, persistence, award/ledger adapter, frontend or product fixtures are installed.

Public server-side entrypoint: `modules/grantweave/index.ts`. Uses the existing Zod dependency and Node crypto; no solver dependency, credentials, network or financial mutations. All exported boundary functions accept `unknown` and validate it. `Input`/`Model`/`Witness`/`SolveResult` are the actual feature contracts; they do not pretend to be host DTOs.

| Entrypoint | Contract |
| --- | --- |
| `validateInput(raw)` | Closed schema, graph/economic identity/source integrity/completeness validation. Returns `ready` with copied normalized input and SHA-256 fingerprint, `needs_input`, or `invalid_model`. |
| `solve(raw)` | Validates, compiles domains, prechecks complete necessary conditions, runs deterministic bounded finite-domain DFS, independently checks every returned witness. Versioned JSON result; never throws an ordinary solver failure to the caller. |
| `validateWitness(rawInput, candidate)` | Validates the model and candidate, then scans original records and recomputes all constraints independently of DFS state. Invalid candidate does not make the model infeasible. |
| `createSnapshot(raw)` | Solves a ready input and freezes exact internal JSON/Markdown content, UTF-8 lengths, SHA-256 hashes and serializer identity in memory. Does not save anything. |
| `readFrozenExport(saved, format)` | Verifies saved schema/content hashes/closure identity/branch/label/limits, all feasible witnesses with original constraint sums, and infeasibility against the pinned bounded engine. Returns original saved text; never reformats or regenerates it. |
| `assessCurrentness(captured, observed)` | Compares caller-supplied dependency manifests: `unchanged`, `stale`, or `unavailable`. Missing keys are unavailable, unrelated keys ignored. Does not read or establish upstream authority/currentness. |

## Concrete caller example

This deliberately small synthetic example demonstrates the complete wire shape. It is documentation, not product-injected data. A real caller constructs reviewed core assumptions from an authoritative adapter after GW-0 reconciliation.

```ts
import { createHash } from "node:crypto";
import { solve, createSnapshot, validateWitness, type Input } from "./modules/grantweave/index";

const text = "Synthetic test: one required January activity and one new one-cent personnel cost. Source A has one cent eligible capacity for that work. No other work demands, existing support, additional caps or restrictions apply.";
const interval = { start: "2027-01-01", end: "2027-01-31" };
const input: Input = {
  contractVersion: "grantweave.input.v1",
  model: {
    id: "small_example", version: "v1", label: "synthetic",
    sources: [{ id: "s", version: "v1", kind: "synthetic", text,
      sha256: createHash("sha256").update(text, "utf8").digest("hex") }],
    claims: [{ id: "assumption", sourceId: "s", status: "synthetic_confirmed",
      start: 0, end: text.length, quote: text, interpretation: "Closed synthetic planning assumptions",
      actor: "example_author", recordedAt: "2026-10-25T12:00:00Z" }],
    packages: [{ id: "work", label: "Required activity", required: true, interval,
      predecessors: [], effort: [], resources: [], claimId: "assumption" }],
    costs: [{ id: "invoice", economicId: "underlying_invoice", packageId: "work",
      category: "personnel", amountCents: "1", incurredOn: "2027-01-31", claimId: "assumption" }],
    funding: [{ id: "A", kind: "secured", basis: "confirmed_eligible_residual",
      currency: "USD", scale: 2, capacityCents: "1", packageIds: ["work"],
      categories: [{ category: "personnel", capCents: "1" }],
      budgetWindow: interval, performanceWindow: interval, periodCaps: [], claimId: "assumption" }],
    effort: [], resources: [], existingSupport: [], restrictions: [],
    completenessClaimIds: ["assumption"], dependencies: [],
  },
  branch: { id: "secured_only", version: "v1", outcomes: [] },
  limits: { maxNodes: 50000, maxWitnesses: 3 },
};
const result = solve(input);
if (result.status === "feasible") {
  const independentlyChecked = validateWitness(input, result.witnesses[0].witness);
  // Returns valid_witness; source A is used exactly once for one cent.
}
const frozen = createSnapshot(input); // Returns exact in-memory paired export content.
// Later host integration must atomically retain frozen.snapshot and its receipt.
```

The approved $12,000/A-$7,000/B-$5,000/C-$4,000 reference is only in `tests/grantweave/reference.ts`. Its source paragraphs are synthetic. It is never silently supplied to product callers. Explicit B/C outcomes are `assumed_awarded`, `failed`, or `not_assumed`; every hypothetical source requires exactly one outcome. A selected source can remain unused. A hypothetical amount is its explicit scenario amount, never a call maximum. Existing support requires a secured source, even when residual capacity is zero.

## Model and authority boundaries

Strict nested objects reject extra keys and unsupported predicates. IDs and references are bounded ASCII; sources retain version, exact supplied text and SHA-256. Claims retain exact end-exclusive UTF-16 quotation offsets, actor/time, interpretation and confirmation status. Text is not silently normalized; future adapters must pin the actual normalized upstream text and preserve its original hash algorithm/version separately. Core dependency digests are SHA-256 fingerprints of caller-defined captured closures, not a relabeling of upstream FNV hashes.

`synthetic_confirmed` requires a synthetic source. Any synthetic source keeps the overall model `synthetic`. `confirmed_assumptions` is still conditional on user-supplied assumptions, not source-verified authority. Confirmation does not certify actual spending permission, a grant, science or an institution. Claims in `proposed`/`unknown` status and explicit unknown (`null`) terms yield `needs_input`; absence is not permission. Completeness claims explicitly attest that support, restrictions, outside work and all modeled terms are declared. An empty list is a confirmed empty scope, not inferred absence. The core checks consistency and exact quotation integrity, not whether a person is entitled to make an attestation.

Each new economic cost is unique and disjoint from already paid/committed/external economic identities. Partially covered/split costs are unsupported. All packages are required. Budget windows contain cost dates inclusively; performance windows contain the full activity interval. Category caps and dated period caps constrain total capacity additionally; they are never added as independent money. Period caps may not overlap for one source. No additional period cap is an explicit reviewed empty list. Resource aggregation uses typed whole monthly units; it does not resolve conflicts within a month.

People use `basis_points_of_month_capacity` with capacity at most 10,000; resources use an explicit consistent unit per subject. Each demand references a declared monthly capacity with declared outside load. Required work is counted once independently of funding allocations, including unpaid effort. Dependencies must form a DAG and use strictly finish-before-start dates. Scoped support exclusions activate on intersecting work/science intervals and explicit package IDs, including pre-existing support with zero new allocation. They implement support-stage restrictions only; coholding/submission rules require separate future predicates and are rejected now.

Admission bounds: 1–5 funding sources, 1–6 packages, 1–12 positive cost atoms, 12 modeled cost/capacity months, 6 people and 6 resources, 40 restrictions, 40 sources, 80 claims, 80 dependency keys. Cents are canonical nonnegative decimal strings of at most 18 digits, positive for costs; all money sums use BigInt and return strings. Fractional cents, signed capacities, numeric/unsafe money, FX, arbitrary splitting, optional scope optimization and overlapping period caps are rejected. Core JSON input is bounded to 2,000,000 UTF-8 bytes; each frozen export to 2,000,000 bytes. These are core bounds, not reconciled host request/storage/retention limits.

## Solver states and reproducibility

`feasible` means at least one independently checked assignment under this branch and encoded assumptions. `infeasible` requires a complete direct proof or exhaustive admitted search. `unknown` means the deterministic work limit stopped search without a witness/proof. `needs_input` is incomplete/unconfirmed information; `invalid_model` is bad structure, references, identity or unsupported scope. `error` gives no conclusion and discards partial accepted witnesses.

One node is a recursive partial assignment entered, including root. Sound monotone violations prune candidate children before entry; there is no claim that nodes count every candidate check. The solver stops before exceeding `maxNodes` (1–50,000), retaining up to `maxWitnesses` (1–3) in traversal order. Items sort by compiled domain size, then ASCII ID; sources sort by ASCII ID. Reaching the witness cap conservatively reports `searchComplete=false`, even if the last retained witness happened to be the final possible leaf. A complete direct proof reports `searchComplete=true`, `nodes=0`; it does not claim enumeration took place. No optimality, best-witness, minimum conflict or guaranteed completion claim is made.

Input arrays are normalized as semantic sets, object keys by ASCII. The SHA-256 fingerprint includes the entire normalized input, branch, source bodies/versions/confirmations, dependency captures, limits and solver version. Result witness arrays preserve traversal order. Explanations retain exact cap/usage/slack and claim IDs; zero slack identifies a binding cap. An aggregate capacity shortfall is only a necessary monetary lower bound, not a promise that arbitrary extra funds fix all restrictions. Exhaustive failures retain the full fixed model and a sufficient set of all claims explicitly labeled non-minimal.

Use `assessCurrentness` against freshly captured authoritative observations before treating a result as current. An unchanged manifest says only that the caller supplied matching keys/versions/digests. Lost physical evidence must appear as a missing observation; stale observations must block a current conclusion in the future host. Frozen exports remain historical. Hashes detect byte corruption; they are not signatures or authentication for hostile imports. Export reading recomputes feasible constraint sums. A saved infeasibility conclusion is rechecked with this pinned bounded engine because exhaustive absence cannot be validated from sums alone; this can consume the input's search budget and belongs outside a host transaction. The reader never applies a newer formatter or rewrites saved bytes. Support for a future version must retain this version's reader/serializer/engine; unknown versions fail visibly.

## Validation and remaining integration

Focused, offline tests: `node node_modules/vitest/vitest.mjs run --config scripts/grantweave-vitest.config.ts --configLoader native`. The feature config uses one worker, serial files and its own ignored `.test-data/grantweave/vite` cache. Typecheck command and actual executed evidence are in `docs/implementation/11_GRANTWEAVE_RELEASE.md`. No test makes external API calls. The independent exhaustive oracle imports only a type, scans all complete assignments and does not share search domains, pruning or production evaluator helpers. It checks the approved reference, generated cases and returned witnesses against hand-derived solution counts.

GW-0 still requires actual checked/merged 05/06 contracts and money/head/cutoff/category/residual-capacity reconciliation. The host must validate/capture upstream provenance and physical evidence, preserve original historical hashes, run bounded solving outside its serialized transaction, recapture current inputs, then atomically save immutable result/exports/receipt with conflict/retry/retention validation. This core does not implement any of those application behaviors. Local CI/build/review/health and the future frontend remain separately gated. Later frontend must follow the accepted design system and exclusive ownership; there is no deployed GrantWeave URL at this milestone.
