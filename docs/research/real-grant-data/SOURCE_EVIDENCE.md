# Real grant data source evidence

Checked October 25, 2026. Audit summary for the [feasibility report](../REAL_GRANT_DATA_FEASIBILITY.md), not a cached application catalog or executable acceptance fixture. UTC timestamps below are retained as observed; client timezone is America/New_York (UTC−04:00 on this date). No precise hackathon cutoff is inferred.

## Evidence classification and method

- **D — documented:** official page/API policy describes behavior; not a runtime guarantee.
- **O — observed:** a small anonymous request or substantive official page retrieval actually produced the described result.
- **R — reused:** Task 09's committed source preflight, explicitly attributed to its independent checkpoint.
- **I — inferred:** design/cost recommendation from observed/documented evidence, not measured application performance.

Lead performed DOE/public documentation checks. Read-only `/root/official_sources` performed the NIH and RePORTER requests and reported exact times/results; lead separately opened both NIH legacy notices, transition notice, search instructions, API documentation and FAQ to corroborate source semantics. `/root/code_fit_review` independently inspected main and source09 and reviewed the implementation implications. Lead is sole writer. Requests contained only public search criteria/IDs, never researcher data.

PowerShell metadata reads used certificate validation, JSON POST, maximum-redirection 0 and timeouts of 20 seconds for Grants.gov and 25 seconds for RePORTER; no authorization header. Initial sandbox DNS resolution failed; a scoped approved retry outside the restricted network succeeded. The DNS failure is local tooling evidence, not a provider outage. HTTP success was counted only with a usable envelope/data. Bodies/tokens/contact information/full notices were not retained in the repository. Summarized metadata is in [SAMPLE_OBSERVATIONS.json](SAMPLE_OBSERVATIONS.json).

## Official documentation register

All pages opened on 2026-10-25 within the research session; provider publication/update dates are distinguished below. A page with no published update time remains undated. Prices/quotas/reuse terms not established are marked unknown, never unlimited or permanently free.

| Source | Date/version and documented finding | Qualification |
| --- | --- | --- |
| [Grants.gov search2](https://www.grants.gov/api/common/search2) / [detail](https://www.grants.gov/api/common/fetchopportunity) | Undated public v1 API documentation; no authentication required for these calls. | Illustrative schemas differ from real records. Search returned `agency` and `cfdaList`; lifecycle came from search, not a verified detail lifecycle field. |
| [API terms](https://www.grants.gov/api/terms-conditions) | Undated at inspection; allowed information retrieval/display, faithful representation and required application attribution. | Access is conditional, can be limited/terminated, as-available. No numeric quota, latency/completeness guarantee or price schedule established. No separate account terms were accepted or signup performed. |
| [Status codes](https://www.grants.gov/api/status-codes) / [versioning](https://www.grants.gov/api/api-versioning) | v1 path versioning, extensible responses;429/backoff guidance. | Error envelope and boundary validation still required on200. Status-code402 does not document a fee. |
| [NIH transition NOT-OD-25-143](https://grants.nih.gov/grants/guide/notice-files/NOT-OD-25-143.html) | Released August 14, 2025; Grants.gov is single official NOFO source beginning FY2026; Guide remains for policy/informational notices. | Legacy HTML may still be accessible; not a complete current discovery feed. |
| [NIH opportunity finder](https://grants.nih.gov/funding/explore-nih-opportunities) | Page says last updated September 23, 2025; points to Grants.gov. | Reader encountered a JavaScript requirement for the dynamic finder. It was not counted as a verified record dataset. |
| [NIH search/full-announcement instructions](https://www.grants.nih.gov/funding/explore-nih-opportunities/search-tips-for-nih-opportunities) | Last updated December 17, 2025; obtain latest full announcement from Documents and check again before applying. | Review the real attachment; descriptor alone proves no contents. Applicable policy notices may be separately maintained. |
| [NIH RePORTER API](https://api.reporter.nih.gov/?urls.primaryName=V2.0) | V2 project search documentation; bounded project pagination, request-rate recommendation. | Project offset maximum 14,999 differs from publication offset 9,999. Unknown projection names can be silently omitted: actual field validation needed. No daily numeric quota/price established. |
| [RePORT FAQ](https://www.report.nih.gov/faqs) | Weekly refresh with corrections to historic awards; historic funding and project context. | Amounts generally include direct+indirect costs for a fiscal year; parent/subprojects can double-count. Full successful proposals/reviewer scores are not public records here. |
| [NIH reuse FAQ](https://www.nih.gov/about-nih/frequently-asked-questions) | Last reviewed June 30, 2026; most NIH website material is public domain with exceptions. | No blanket dataset-specific license established. Preserve attribution and third-party exceptions; no bulk republication selected. |
| [USAspending endpoints](https://api.usaspending.gov/docs/endpoints) | API endpoints currently require no authorization; detailed awards/transactions and agency queries documented. | Documentation only; no award-body sample. [Data sources page](https://www.usaspending.gov/data-sources) yielded a shell. Quota/cadence/reuse details unresolved for any later implementation. |
| [Simpler developers](https://simpler.grants.gov/developers) / [API wiki](https://wiki.simpler.grants.gov/product/api) | Keys/Login.gov; 60 requests/minute, 10,000/day/key; 30-day inactivity disable. | No key/signup/API call. Different UUID contract; classic-ID crosswalk not checked. Public search/attachment links do not establish anonymous API access. |

## Public request ledger

Request criteria below are exact for lead DOE calls and NIH search; RePORTER criteria are summarized from agent output rather than claimed byte-for-byte request bodies. Response sizes were recorded only when actually available. Every successful Grants.gov response below had HTTP 200 and `errorcode:0`.

| Actor / UTC | Endpoint and public criteria | Observed result |
| --- | --- | --- |
| Source agent / 08:32:22.5550253Z | POST `https://api.grants.gov/v1/api/search2`; `{rows:3,agencies:"HHS-NIH11",oppStatuses:"posted",keyword:""}` | hitCount 376; 3 hits: 357305/PAR-25-274, 357303/PAR-25-268, 356893/PAR-25-144; all posted. Default order, not latest-first/completeness. |
| Source agent / 08:32:44.4993702Z | POST `https://api.grants.gov/v1/api/fetchOpportunity`; opportunityId 357305 | revision 1 / synopsis 2; future catalog close, absent numeric budget as described in report. |
| Lead / 08:32:55.5726602Z | POST search2; `{rows:3,agencies:"DOE",oppStatuses:"posted"}` | hitCount 0; 873 response bytes. Does not prove no DOE opportunities. |
| Source agent / 08:33:36.1858951Z | POST `https://api.reporter.nih.gov/v2/projects/search`; FY2025, NCCIH, R34, exclude_subprojects, limit 2 | HTTP 200; total 12; application IDs 11230310 and 10989919, amounts 269468 and 218700. No current funding/eligibility inference. |
| Lead / 08:33:40.2484631Z | POST fetchOpportunity; `{opportunityId:364136}` | 19,578 response bytes; DOE-ARPAE, revision 0 / synopsis 1, document descriptor. |
| Lead / 08:34:16.7908596Z | POST search2; `{rows:2,agencies:"DOE-ARPAE",oppNum:"DE-FOA-0003630",oppStatuses:"posted\u007cclosed\u007carchived\u007cforecasted"}` | hitCount 1, ID 364136 exact match; 2,330 response bytes. Parent/subagency filter semantics materially differ in this sample. Status separators shown as escaped Unicode for table readability; actual request used pipe characters. |
| Source agent / 08:34:36.4163753Z | POST RePORTER project search; focused application 11230310 and verified projection fields | HTTP 200; one matching record; organization/project/budget dates/FOA in JSON summary. Dictionary names `Organization` / `BudgetStart` worked; `OrgName` / `BudgetStartDate` did not project. Returned search URL malformed `https:/`; don't trust it without validation. |
| Source agent / 08:34:37.5841630Z | POST search2; exact number PA-26-002, all 4 statuses | One posted match 360581. |
| Source agent / 08:34:58.1618685Z | POST fetchOpportunity; opportunityId 360581 | revision 4 / synopsis 3, latest update Oct 19, 2026; revised full-announcement HTML descriptor. Body not retrieved. |
| Source agent / 08:34:58.3155141Z | POST fetchOpportunity; opportunityId 356893 | revision 1 / synopsis 2; future-cycle sample and differing API/HTML posted dates. |

The NIH agency code is observed, not a claim that every NIH institute/notice uses exactly this code. Recheck the selected record roster and reject unsupported agency identities rather than silently broadening. Search hit 357303 was not independently detail-paired; do not treat it as a complete preflight candidate.

## Authoritative text and source-location checks

- [PAR-25-274](https://grants.nih.gov/grants/guide/pa-files/PAR-25-274.html): substantive 729-line HTML received by reader; March 31, 2025 update banner and later policy links. Key Dates and budget qualifications explain the report's conflict example. This is source content inspection, not expert eligibility certification or a complete amendments review.
- [PAR-25-144](https://grants.nih.gov/grants/guide/pa-files/PAR-25-144.html): substantive 1046-line HTML received; selected future cycles in report. API posting October 29, 2024 differs from HTML October 30; retain both sources. Current applicant/clinical/mission conditions remain unreviewed.
- [NIH 360581 official page](https://www.grants.gov/search-results-detail/360581): JavaScript shell in reader. Detail API provided a revised HTML attachment 355301 / folder 81444, reported 231855 bytes. No body download/hash/parse/full-review claim.
- [DOE 364136 official page](https://www.grants.gov/search-results-detail/364136): direct reader produced shell; API pairing is the usable evidence. [DOE eXCHANGE](https://exchange.energy.gov/Default.aspx) reader timed out; no access denial/account requirement was inferred. PDF 355335 descriptor is verified, body is not.
- [RePORTER 11230310](https://reporter.nih.gov/project-details/11230310): valid canonical project URL from the focused API response. No successful-proposal file was requested or received.

Raw date fields summarized as days in the report are not inferred cutoff times. DOE detail uses `Nov 20, 2026 12:00:00 AM EST`; search is `11/20/2026`. NIH source-agent reports close dates as calendar-day values. No offset was created from those summaries.

## Reused Task09 and actual code evidence

At exact checkpoint `8e44755f895562f85c522bea04acf1a10bfedb2e`, committed `docs/implementation/09_LIVE_GRANT_DISCOVERY_RELEASE.md` and `lib/discovery/preflight.ts` report one five-row NSF search, three details and three exact all-status lookups at 06:25:36–41Z. NSF IDs 275109 / 352339 / 352500 pair with their official numbers, posted status and acceptance-anytime explanations. This study did not repeat those known requests.

Code reviewer verified all 22 assigned discovery files matched committed blobs; source 09 HEAD and main `2da6a31` were independently confirmed. It identified NSF-only assumptions, global-adapter hash compatibility, admission preservation, single-deadline limitations, source ownership and exact-version review requirements. No code reviewer network/test/build/server activity occurred.

Task 09's 33 offline cases and strict focused types are its **reported committed checkpoint evidence**; not rerun here. Its final runtime/build/browser/process-restart/local-review/health/migration/reset gates are explicitly pending. This study supplies neither application acceptance nor a verified local deployment.

## Independent draft review and document checks

Source reviewer confirmed the NIH and RePORTER observations, with two corrected wording issues: RePORTER used a 25-second request timeout, and `errorcode:0` is Grants.gov-specific. Code reviewer found no additional blocking issue after two wording corrections: unchanged NSF observations retain the legacy adapter tag/algorithm, and call saves/reviews are repository command discriminants rather than standalone exports. Both reviews were read-only with no additional network requests or tests.

Actual light document validation returned exit 0: all relative Markdown links resolve, no trailing whitespace, JSON parses with five sample summaries, and working-tree scope contains only the three assigned new research files. Final staged `git diff --check` and scope/commit verification are reported with the handoff SHA. Document-only checks cannot establish provider permanence, domain authority or application behavior. No ordinary tests called live providers.
