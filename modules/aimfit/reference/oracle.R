# Operator validation only; base R/stats, no added packages or network.
# Rscript --vanilla modules/aimfit/reference/oracle.R <exact-pinned-R-version>
# stdout: closed CSV. stderr: version/session manifest. Warnings fail this gate.
args <- commandArgs(trailingOnly = TRUE)
if (length(args) != 1L || as.character(getRversion()) != args[[1L]]) stop("Pinned R version required")
options(digits = 17, warn = 2)
cat(R.version.string, "\n", file = stderr())
cat("stats ", as.character(packageVersion("stats")), "\n", file = stderr())
capture.output(sessionInfo(), file = stderr())

ref <- function(n, delta, sigma) {
  power.t.test(n = n, delta = delta, sd = sigma, sig.level = .05,
               type = "two.sample", alternative = "two.sided", strict = TRUE)$power
}
rows <- list()
add <- function(case_id, ns, delta, sigma) {
  power <- vapply(ns, ref, numeric(1), delta = delta, sigma = sigma)
  width <- qt(.975, df = 2 * ns - 2) * sigma * sqrt(2 / ns)
  stopifnot(all(is.finite(power)), all(power >= 0 & power <= 1), all(is.finite(width)),
            all(diff(power) >= -1e-10), all(diff(width) < 0))
  rows[[length(rows) + 1L]] <<- data.frame(case_id = case_id,
    r_version = as.character(getRversion()), stats_version = as.character(packageVersion("stats")),
    n_per_arm = ns, delta = delta, sigma = sigma, power = power, nominal_half_width = width)
}
# Exact envelope maxima for these selected ratios; not floating-point inferred.
specs <- list(c("r005",1,20,1000),c("r010",1,10,1000),c("r025",1,4,1000),
              c("r050",5,10,1000),c("r100",1,1,1000),c("r175",7,4,800),c("r200",2,1,612))
for (s in specs) add(s[[1]],2L:as.integer(s[[4]]),as.numeric(s[[2]]),as.numeric(s[[3]]))
add("sensitivity_delta4",64L,4,10)
add("sensitivity_sd12",64L,5,12)
add("scaled",64L,50,100)
add("null_oracle_only",64L,0,10)
out <- do.call(rbind,rows)
baseline <- out[out$case_id == "r050",]
stopifnot(min(baseline$n_per_arm[baseline$power >= .8]) == 64L,
          min(baseline$n_per_arm[baseline$power >= .9]) == 86L,
          min(baseline$n_per_arm[baseline$power >= .9 & baseline$nominal_half_width <= 3]) == 87L,
          abs(out$power[out$case_id == "null_oracle_only"] - .05) <= 1e-8)
out$power <- sprintf("%.17g",out$power)
out$nominal_half_width <- sprintf("%.17g",out$nominal_half_width)
write.table(out, file = stdout(), sep = ",", quote = FALSE, row.names = FALSE, na = "ERROR")
