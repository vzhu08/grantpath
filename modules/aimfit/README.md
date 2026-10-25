# AIMFIT core v1

AIMFIT exposes the cost of a smaller study without retaining its original power claim. It compares at most three researcher-confirmed equal-size variants and seven confirmed scenarios (baseline included). This is nonclinical conditional planning for two independent normal-outcome groups with common variance, equal allocation, zero-difference null, alpha .05, and both rejection tails. It does not analyze outcomes or establish scientific validity, causality, recruitment, allowable funds or award probability.

This independent core has no frontend, persistence, host API or finance adapter. `lib/aimfit/ports.ts` returns actual adapter unavailability. AF-00 must inspect checked merged 05/06 before host wiring; ledger line totals never become per-recruit prices. No fixture is injected when a runtime/adapter is missing.

## Public entrypoints

Import `modules/aimfit/src/index.ts` from a trusted server caller. It uses existing Zod and Node built-ins; no new JavaScript dependency is needed.

| Entrypoint | Contract |
| --- | --- |
| `AssumptionSet.parse(raw)` | Strict versioned closed input. Rejects extra keys, invalid decimal forms, duplicate variants/scenarios, wrong project, malformed USD cents and inconsistent source/proposal references. |
| `planAimFit(raw, numericalPort?)` | Validates, computes exact costs/counts/constraints, optionally invokes a numerical port, returns detached deeply frozen JSON data. Missing port returns `calculation_unavailable`, preserving costs and inputs. |
| `createPythonPort(operatorConfig)` | Pinned trusted executable/script hashes; one child, no queue, bounded JSON, explicit environment, no shell or request-supplied paths. |
| `exactCost`, `supported`, `compareTargets` | Exact per-arm attrition/cents, rational envelope and tolerance-aware target facets. Scientific binary64 values never carry money. |
| `freezeRun`, `readRun`, `exportRun` | Frozen retained inputs/results and SHA-256; exact JSON/Markdown export bytes. Reopen validates digest and deterministic derived facets without launching Python. Integrity checks do not establish source/scientific authority. |
| `currentness`, `currentnessForLink` | Targeted scientific, cost/resource, evidence, proposal and budget drift. Missing current heads/engine identity remain unresolved. Authorized after revision is reconciled explicitly; later edits require review. |
| `claimChange`, `acceptPreview`, `linkAcceptedRevision` | Selected result/shortfall data; explicit literal replacement acceptance; exact before→after copies. These helpers perform no host writes or durable operations. |

```ts
import {
  planAimFit, freezeRun, exportRun, createPythonPort,
  type RuntimeConfig,
} from "./modules/aimfit/src/index";

// raw is a real caller-owned AssumptionSet payload; config is operator-only.
export async function calculatePlanningSnapshot(raw: unknown, config?: RuntimeConfig) {
  const plan = await planAimFit(raw, config ? createPythonPort(config) : undefined);
  const run = freezeRun(plan);
  return { run, download: exportRun(run, "json") };
}
```

Construct inputs from explicitly confirmed assumptions, never inferred prices/effects. Each confirmed quantity carries manual, synthetic or source provenance with actor/review time/rationale. Unknown quantities carry a reason. Optional constraints explicitly choose confirmed, unknown or not_modelled. `costs` has separate fixed/perRecruit line arrays, all-in completeness and stated exclusions. Each cents string is nonnegative canonical USD cents, at most 18 digits. Confirmed zero is permitted; omission is unknown. Costs apply to every recruit, including attrition. No hidden indirect rate or currency conversion exists.

Scientific inputs are canonical positive decimal strings, <=12 total digits and <=6 fractional digits; targets are .60–.95. `5.0`, exponent notation, negative zero and locale separators are rejected. `normalizeDecimal` is an explicit helper, never a hidden rewrite of captured upstream content. `aimfit-json-v1` uses ordinal key ordering, safe integer counters and string decimals. It rejects fractional numeric values/nonfinite values/undefined/sparse arrays. Source upstream hash algorithm/value and exact UTF-16 quotation are preserved separately from AIMFIT SHA-256. Source references require matching evidence dependencies; actual full-source/quotation integrity remains the host adapter's responsibility. `proposalRevisions` retains exact selected text; optional proposal dependencies use `proposalDependency(copy)` rather than invented host hash semantics.

`planAimFit` returns independent affordability, cost completeness, resource, timeline, power and nominal-width facets. A cheaper candidate may fail power. `not_modelled` is an explicit exclusion. Confirmed weekly throughput is total capacity with equal final group counts; an odd rate need not recruit equal numbers in every individual week. Duration is sequential whole weeks: setup + ceil(total recruits / total weekly rate) + follow-up + analysis. No overlap/recruitment-success forecast is assumed.

All numerical results currently have `computed_unverified` and `referenceStatus: r-pending`. Even `conditionalTargetsMet=true` is diagnostic arithmetic under these unverified assumptions, never a validated release/approval. Boundary comparisons within power 1e-7 or width max(1e-8, relative1e-7) remain `boundary_review`. Aggregate outcomes distinguish missing inputs, unsupported variants, runtime failure, unaffordable variants, target/resource failures, boundary review and reference pending. The minimum over the supported range is diagnostic and does not add a fourth permitted variant.

## Numerical method and runtime gate

Pinned candidate runtime: CPython 3.12.10, NumPy 2.1.3, SciPy 1.15.3, x64 Windows/Linux only. No runtime is bundled or installed by this module. The operator config supplies absolute trusted `pythonPath`, `workerPath`, `cwd`, expected executable/script SHA-256 and a deadline <=10 seconds. Hashes/platform/versions are retained in every computed run. `-I -B` excludes user site/PYTHONPATH and bytecode writes; child environment excludes provider credentials. The trusted worker has no network, dynamic request imports, file-writing or descendant-process code. This is not an OS network/process sandbox; packaged dependency identity, confinement and host lifecycle remain AF-01 release work. Timeout resolves immediately, attempts to kill only the owned child, and holds the process lease until close; stuck termination leaves later calls busy.

For n per group, df=2n−2 and lambda=(delta/sigma)*sqrt(n/2). Power is SF(c,df,+lambda)+SF(c,df,−lambda), c=t-quantile(.975,df). Symmetry makes the second SF exactly the opposite rejection tail. This fixed formula avoids SciPy's observed NaNs from directly evaluating CDF(−c,df,+lambda); there is no conditional fallback, clipping or normal approximation. Nominal half-width is c*sigma*sqrt(2/n), conditional on assumed SD, not guaranteed realized precision.

The proposed envelope is n2–1000, effect/SD .05–2, intersected with lambda<=35. Exact rational arithmetic enforces n*(delta/sigma)^2<=2450. E.g., ratio2 supports at most n612. The worker evaluates the bounded supported grid, checks finiteness/range/monotonicity, and returns only confirmed variants plus a minimum/predecessor or explicit exhaustion/boundary status. Outputs serialize binary64 through 17 significant digits expanded to plain decimal, with no display rounding. A primitive warning, nonfinite value or timeout is unavailable. The entire proposed envelope remains subject to official R validation; it is not a scientific recommendation.

Method sources: [official R power.t.test](https://stat.ethz.ch/R-manual/R-devel/library/stats/html/power.t.test.html) (`strict=TRUE`, n/group), [R numerical limitations](https://stat.ethz.ch/R-manual/R-devel/library/stats/html/TDist.html), [SciPy 1.15.3 noncentral t](https://docs.scipy.org/doc/scipy-1.15.3/reference/generated/scipy.stats.nct.html). No R implementation code is copied. CPython/NumPy/SciPy and their dependencies retain their own licenses; review redistribution notices/artifact hashes before packaging them.

## Checks and official R handoff

Ordinary offline checks, existing compatible dependencies, one worker:

```powershell
node node_modules/vitest/vitest.mjs run tests/aimfit --maxWorkers=1 --no-file-parallelism --configLoader runner --no-cache
$files=@(rg --files modules/aimfit lib/aimfit tests/aimfit -g '*.ts')
node node_modules/typescript/bin/tsc --ignoreConfig --noEmit --incremental false --strict --skipLibCheck --target ES2022 --module esnext --moduleResolution bundler --esModuleInterop --types node @files
```

`runtime.test.ts` is skipped unless the operator sets `AIMFIT_PYTHON` to the trusted exact-version executable. Its one opt-in test launches one worker containing seven bounded grids. `tests/aimfit/inputs.ts` contains synthetic unit/port inputs only; the research candidate numbers exercise contract logic and are not an accepted numerical oracle. `process.test.ts` uses fake streams to test timeout, warnings, output capacity, busy leases and late close; no subprocess is launched there. Python control-flow tests use `python -I -B tests/aimfit/numeric_protocol_test.py` in the pinned environment.

AF-01 official oracle must run in a separately authorized pinned environment:

```text
Rscript --vanilla modules/aimfit/reference/oracle.R <exact-R-version> > oracle.csv 2> r-session.txt
python -I -B scripts/aimfit-compare-oracle.py oracle.csv <same-R-version>
```

No added R package is required. The parent selects/pins the actual official R release, provisioning action/image by immutable identity, and supplies its exact version; the script refuses a mismatch. Capture R runtime/platform/stats/session metadata, provisioning identity, script hashes, exact CSV/output hashes, dependency lock/artifact identity and process/timing evidence. Warnings fail. CSV has 6,409 exact cases covering seven full intersected integer grids, sensitivity, common scaling and a null-only primitive edge. The comparator enforces a closed bounded file/schema/set, exact minima64/86/joint87, power abs<=1e-7 and width abs<=max(1e-8,1e-7*reference width). These are proposed tolerances, not permission to weaken mismatches. Ordinary tests should eventually consume immutable captured R fixtures offline. Neither script has yet been executed against R; promotion requires an explicit new version/reference manifest and repeatable packaged runtime preflight.

## Host integration still required

`currentness` needs current validated assumptions, every referenced current head, and explicit current engine identity; it never fetches them. `acceptPreview` binds a retained before revision, selected run/candidate digests and explicit shortfall/R-pending acknowledgements. Literal text is human-reviewed; the core cannot prove that arbitrary prose honors permitted claims. `linkAcceptedRevision` requires a preview actually accepted in this process and an exact caller-supplied after revision. `currentnessForLink` recognizes only that authorized after copy. No copy represents proof of a host append, durable receipt, verified source quotation, or current proposal head.

AF-00/host integration must revalidate ownership/current heads in a serialized transaction, implement durable receipt recovery before mutable checks, retain all original versions/exports, connect targeted stale findings to readiness, and preserve links through ordinary saves. Add no parallel JSON store. Frontend waits for its explicit lease and accepted design system. Full application build/review/health/URL belongs to that later assignment.
