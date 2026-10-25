# AimFit 12 — methods, sources and independent reference plan

Research date: October 25, 2026. Documentation only. Read with the [implementation specification](../../implementation/12_AIMFIT_IMPLEMENTATION.md). Human-selected family: two independent equal-size groups, continuous outcome/common SD, nonclinical planning. Human-selected validation: deterministic demo compared with official R; no scientific-validation claim.

## Source register

Opened primary sources on October 25, 2026. Where a page has no publication/update date, the access date is the evidence date; do not invent freshness. Moving R-devel/trunk URLs must be pinned by runtime/source hashes when implementation generates its actual oracle.

| Source and version/date shown | Use and boundary |
| --- | --- |
| [R stats `power.t.test`](https://stat.ethz.ch/R-manual/R-devel/library/stats/html/power.t.test.html), page footer stats4.6.0; publication date not stated | Per-group n, two-sample/two-sided options and explicit strict-tail convention. Reference outputs must retain an executed R version. |
| [R Core `power.R`](https://svn.r-project.org/R/trunk/src/library/stats/R/power.R), copyright1995–2021; trunk publication date not stated | Primary implementation of the reference power equation. Study its behavior; do not copy licensed implementation into product code without the required license review/attribution. |
| [R `TDist`](https://stat.ethz.ch/R-manual/R-devel/library/stats/html/TDist.html), stats4.6.0 | Noncentral-t distribution and moderate-noncentrality/tail-accuracy cautions. |
| [NIST two-sample t-test](https://www.itl.nist.gov/div898/handbook/eda/section3/eda353.htm), page update date not stated | Equal-variance pooled test/df and distinction from unequal-variance design. This is a test definition, not validation of any proposed study. |
| [R `t.test`](https://stat.ethz.ch/R-manual/R-patched/library/stats/html/t.test.html), opened page footer stats4.5.1 | `var.equal=TRUE` is explicit pooled variance; default Welch behavior is a different model. |
| [SciPy1.15.3 `nct`](https://docs.scipy.org/doc/scipy-1.15.3/reference/generated/scipy.stats.nct.html), documentation copyright2008–2025 | Independent library for research candidate calculations; noncentral CDF/survival/quantiles use Boost Math. No installed production-runtime claim. |
| [SciPy1.15.3 `t`](https://docs.scipy.org/doc/scipy-1.15.3/reference/generated/scipy.stats.t.html), same documentation generation | Central quantile for nominal planning half-width. |
| [SAS/STAT14.1 TWOSAMPLEMEANS methods](https://support.sas.com/documentation/cdl/en/statug/68162/HTML/default/statug_power_details74.htm), documentation version14.1; page date not stated | Independent equivalent noncentral-F definition for exact two-sided equal-variance power. |
| [Minitab official example](https://support.minitab.com/en-us/minitab/help-and-how-to/statistics/power-and-sample-size/how-to/hypothesis-tests/power-and-sample-size-for-2-sample-t/before-you-start/example/), copyright2026; update date not stated | Published independent numerical checkpoint delta5/SD10/alpha.05/target.90:86 per group and power.903230. |
| [NIST TN2106, section3.1.2.1](https://nvlpubs.nist.gov/nistpubs/TechnicalNotes/NIST.TN.2106.pdf), September2020 | Pooled mean-difference interval; equal n reduces its standard error to pooled SD times sqrt(2/n). |
| [University of Zurich section5.2.3](https://biostat.pages.uzh.ch/sta404/clin-biostats/05-sign.html#adjusting-for-loss-to-follow-up), page date not stated | Divide by retention for expected attrition adjustment; this teaching source's clinical context is not clinical-scope authorization. |

The substantive design decision is the human's. Formula sources do not supply a meaningful effect, SD, recruitment rate, attrition or cost for a real study. Those remain explicit sourced/manual assumptions. No market-uniqueness, expert-acceptance or improved award-rate evidence was collected.

## Method and reference conventions

Use two-sided pooled t-test planning power at an assumed nonzero mean difference. The selected production and oracle paths must count both rejection tails. Record alpha0.05, n per group, common within-group SD, effect units/magnitude and independent observations. Do not use `power.t.test` defaults for strictness, substitute one-sided tests or interpret its fractional solved n as a recruitable count. The product chooses a supported integer and verifies its predecessor.

The nominal width diagnostic substitutes assumed common SD into the two-group t interval's half-width. It is not a guaranteed width, expected realized width or precision assurance. Attrition inflation is a separate expected-retention convention, calculated per arm using integers. Power is conditional on the analyzable count, not inflated recruitment. Money never uses statistical binary64 arithmetic.

Initial supported n is2..1000 and standardized effect0.05..2, **intersected with lambda<=35**, fixed alpha.05. This keeps oracle noncentrality inside R's documented moderate-accuracy range; not every corner of the rectangular n/effect ranges is supported. An implementation must probe that declared intersection for finite stable results; the range is only proposed until real numerical checks pass. Numerical failure is distinct from unsupported range or an unaffordable target. A wide root bracket caused a SciPy NaN in independent research; bounded integer search/adaptive finite bracketing must fail visibly if a primitive is nonfinite. Do not “repair” a failure by increasing the effect or using a normal approximation.

## Independently calculated research candidates

Read-only methods agent used existing `C:/Users/vzhu0/AppData/Local/Programs/Python/Python312/python.exe`: Python3.12.10, SciPy1.15.3, NumPy2.1.3. No install, source edit, application test or R execution. These numbers are **research candidates**, not R-validated implementation fixtures. Production must regenerate/compare rather than copy the table and claim validation.

For delta5 points, SD10 points, alpha.05, `df=2n-2`, `lambda=.5*sqrt(n/2)`, SciPy `nct.sf(critical,df,lambda)+nct.cdf(-critical,df,lambda)`:

| n per group | Both-tail power candidate | Nominal half-width candidate |
| --- | --- | --- |
| 2 | 0.06150785655741482 | 43.02652729696143 |
| 10 | 0.1850956562911849 | 9.395608994812671 |
| 20 | 0.3379390289250412 | 6.401696439914065 |
| 30 | 0.4778965207601646 | 5.168412319937804 |
| 40 | 0.5981469011410999 | 4.451669378669142 |
| 50 | 0.6968934055617443 | 3.968934908853385 |
| 63 | 0.7951683381304625 | 3.526565746997695 |
| 64 | 0.8014595579287106 | 3.498358831049921 |
| 85 | 0.8998940794187729 | 3.028261846207326 |
| 86 | 0.9032299799913841 | 3.010347257256072 |
| 87 | 0.90646466734084086 | 2.9927469360081007 |
| 100 | 0.9404272037727013 | 2.788853862389480 |

At n64: delta0/SD10 yields candidate power0.05000000000264912 (central-null edge only); delta4/SD10 yields0.6123849703861795; delta5/SD12 yields0.6476881983401355 and nominal half-width4.198030597259905. Scaling delta and SD together preserves power. Candidate minimum n for target.8 is64, predecessor63 fails; target.9 is86, predecessor85 fails. Integer boundaries, not root rounding, are the product acceptance condition.

Independent published check: Minitab's official example reports n86/group and power0.903230 at the same delta5/SD10/alpha.05 for target.90. It agrees with the research candidate when rounded to six decimal places. This supports one reference case; it does not replace the selected official R execution gate or validate the product.

Combined-target research candidate: power>=.90 **and** nominal half-width<=3.0 points require n87/group. n86 passes power but fails width3.010347257256072; n87 passes both. Require any optional width target to be strictly positive in outcome units. Independently confirm this joint minimum with R; do not reuse the power-only minimum86. A power or width comparison within its declared tolerance needs explicit numerical-boundary review.

Independent exact arithmetic, not a scientific source claim: fixed400000 cents, per-recruit10000 cents, attrition2000bps. n50 requires `ceil(500000/8000)=63` recruits/arm,126 total and1660000 cents. n64 requires80/arm,160 total and2000000 cents. At3000bps, n50 requires72/arm,144 total and1840000 cents. At per-recruit12000 cents and2000bps, n50 costs1912000 cents. Zero attrition, cap equality and one-cent-over cases must be separately checked. A dollar table must not hide cent-level errors.

## Official R oracle to execute later

**Not executed during research:** neither `Rscript` nor `R` was available on PATH in the methods agent's inspection. No installation was authorized/performed here. This is an execution gate for AF-01, not a reason to pretend references passed. Use an approved isolated environment or required CI step with a pinned R release; capture `R.version.string`, `packageVersion("stats")`, `sessionInfo()`, script hash and exact output hash. Pin the actual script/output as fixtures so ordinary tests need no network or installed R. A new reference version cannot silently rewrite old run identity.

The following is a proposed self-contained reference script, not a new application API. It deliberately calculates fixed integer n using the official function and verifies target boundaries without accepting a fractional sample size:

```r
options(digits = 17)
print(R.version.string)
print(packageVersion("stats"))
print(sessionInfo())
ref_power <- function(n, delta = 5, sd = 10) {
  power.t.test(n = n, delta = delta, sd = sd, sig.level = .05,
               type = "two.sample", alternative = "two.sided",
               strict = TRUE)$power
}
ns <- c(2L, 10L, 20L, 30L, 40L, 50L, 63L, 64L, 85L, 86L, 87L, 100L)
out <- data.frame(
  n_per_group = ns,
  power = vapply(ns, ref_power, numeric(1)),
  nominal_half_width = qt(.975, df = 2 * ns - 2) * 10 * sqrt(2 / ns)
)
write.table(out, row.names = FALSE, sep = ",", quote = FALSE)
grid <- 2L:1000L
p <- vapply(grid, ref_power, numeric(1))
stopifnot(all(is.finite(p)), all(diff(p) >= -1e-10))
stopifnot(min(grid[p >= .8]) == 64L, min(grid[p >= .9]) == 86L)
width <- qt(.975, df = 2 * grid - 2) * 10 * sqrt(2 / grid)
stopifnot(all(is.finite(width)), all(diff(width) < 0))
stopifnot(min(grid[p >= .9 & width <= 3.0]) == 87L)
stopifnot(abs(ref_power(64, delta = 0) - .05) <= 1e-8)
print(c(delta4_sd10 = ref_power(64, 4, 10),
        delta5_sd12 = ref_power(64, 5, 12)))
stopifnot(abs(ref_power(64, 50, 100) - ref_power(64, 5, 10)) <= 1e-10)
```

Add fixed reference cases at effect-ratio bounds, n bounds, input rejection, nominal-width target and engine-failure handling. Capture warning/error status, not just stdout. The grid monotonic check above is a reference expectation; a failed check cannot be ignored to preserve a binary-search implementation. Test the intended engine on a bounded grid spanning n and standardized effect, with exact integer target decisions on threshold neighbors.

Proposed initial comparisons: power absolute error<=1e-7; nominal half-width absolute error<=`max(1e-8,1e-7*abs(referenceWidth))`; probability range0..1 with no unreported clipping; exact equality for chosen integer n, recruits and all cents. Require visible review for a power or width target within its corresponding comparison tolerance of a computed boundary; do not silently classify it using rounded UI values. The actual tolerances/range must be justified after R/engine comparison, with no arbitrary weakening to make a failing case pass. Compare generated fixtures across independent implementations and inspect all mismatches. Passing numerical references validates only the declared arithmetic/model implementation, not scientific appropriateness.

## Research inspection record and review

- Methods review: independent read-only `aimfit_methods` agent, GPT-6.1 Sol/xhigh, Standard/Fast off requested. Official-source research and lightweight candidate calculation only.
- Code/invariants review: independent read-only `aimfit_code_review` agent, same requested settings. Checked main2da6a3104663d602424256217b19f2eba58c6996/schema4 and unintegrated06 checkpoint4f01d55dec629dd7dac3ace3887c6d795680cfc7.
- Important correction incorporated:06 line totals have no unit-cost semantics; finance canonical JSON rejects fractional numeric values; actual whole-workspace cap is25MiB; source hashes need their original upstream algorithm retained.
- Lead is the only document writer. No production code, central coordination documents, manifests, normal data or servers were edited.
- Later reconciliation/release evidence belongs in the implementation specification; this research is not a build/deployment or a source-only feature-completion claim.
- Final independent methods and code/integrity checkpoint reviews approved the bounded research after their requested fixes. Local Markdown link targets and fenced blocks were checked; all external sources in the register were opened, with the attrition and pooled-interval passages inspected. Final staged whitespace/scope results and exact commit are reported in the chat handoff. R execution, application checks and deployment remain unperformed by design.
