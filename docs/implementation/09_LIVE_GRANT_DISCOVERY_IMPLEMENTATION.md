# 09 — Live NSF grant discovery and manual synchronization

Status: researched implementation specification; application work is **not implemented or authorized by this document**. Source checks and human decisions: October 25, 2026. Inspected code: `4b7d2059957d92d75f18984685a25bb2324a8b54`. Research branch: `research/09-live-grant-discovery`.

## 1. Outcome, human decisions and demo cut

A researcher finds a small set of real NSF opportunities, sees when their metadata was retrieved, follows the official notice, and saves an application through the existing preparation workflow. A later manual refresh identifies an observed change and shows its effect on the saved application without silently replacing reviewed requirements, dates or evidence.

The distinctive proof is **remote version → field change → affected application → researcher decision**, including an outage that leaves the last good record visibly cached. It is not a claim of complete NSF coverage, authoritative eligibility, or continuous monitoring.

The requesting human remains product, scope and approval owner; no additional teammates are assumed. Actual human technical/product/demo role assignments remain with parent coordination and need not be invented for this task.

| Decision | Actual human answer | Consequence |
| --- | --- | --- |
| Geography, funder and source | “U.S., NSF opportunities via Grants.gov (Recommended)” | Implement one adapter for the documented public Grants.gov search/detail APIs; NSF only. |
| Refresh runtime | “we only need it for the next 24hrs (just for the demo tmr) so manual is fine” | Manual refresh is the accepted demo scope. Scheduled refresh, unattended hosting and task07 integration are deferred, not blockers for this cut. |
| Timing | Same answer, received October 25, 2026 | Demo tomorrow, October 26; no exact time is known. Reserve implementation time for integration and rehearsal. |

No consequential source, platform or cost question remains open for this specification. A later change to geography, paid access, unattended operation or coverage requires a human decision. This research did not register accounts, acquire keys, call provider APIs, create an automation, or change application code/data.

**Smallest release:** manually verify 3–5 real source records, permit at most 10 tracked catalog entries, add a bounded `Refresh now` action and an application amendment panel. Discover posted NSF records; retain and recheck tracked records after closure. Use existing deterministic eligibility and topic-overlap explanations. No embeddings or AI calls are needed.

Defer other agencies, EU sources, forecasts as application candidates, attachment downloads, full-notice scraping, complete historical reconstruction, bulk exports, email/reminder delivery, scheduled refresh, multi-user hosting and automatic call/application rewrites. NSF solicitation pages may be opened and manually pasted as authoritative evidence; that is not a second automated source adapter. Do not expand the proposal-template coverage just because discovery finds a different NSF program.

## 2. Inspected baseline and integration seams

Read [selected modules](../kit/SELECTED_MODULES.md), [quickstart](../QUICKSTART.md), [ownership](../OWNERSHIP.md), [human workflow](../HUMAN_AI_TEAM_WORKFLOW.md), [task card](../TASK_CARD.md), [API contract](../API_CONTRACT.md), [status](STATUS.md), local scoped instructions, and the current primary checkout's `AGENTS.md`, `docs/PROJECT_BRIEF.md`, `docs/ROADMAP.md` and `docs/ORCHESTRATION.md` at `C:/Users/vzhu0/PycharmProjects/grantguide`. No scoped `AGENTS.md` was found below `docs/`, `lib/`, `app/`, `modules/` or `packages/` in this snapshot.

The primary documents are newer coordination evidence than historical “02 not started” status text in this checkout. Tasks02/03/04 are implementing separately in lease order **02 → 03 → 04**. Their reported schemas/interfaces are unintegrated here. Inspect their final checked integration before assigning task09's migration number; do not propose another competing schema2→3 migration.

| Actual code | Reuse and necessary change |
| --- | --- |
| [schema](../../lib/schema.ts), [fixtures](../../lib/fixtures.ts) | Current schema2, all 14 supported proposal sections. `Opportunity` has source/revision/history and a human `lastCheckedAt`; `Source` text is limited to 20,000 UTF-16 units. Provenance is `demo` or `researcher`, not a live-data label. Add separate discovery records/origin metadata. |
| [calls](../../lib/calls.ts) | `extractCall` uses labeled lines, not arbitrary API JSON or semantic notice parsing. `matchOpportunities` keeps unknown/conflicting criteria unresolved, excludes known mismatches from ranking, and derives closure from a confirmed deadline. Add provider lifecycle as a separate availability gate. |
| [repository](../../lib/repository.ts) | `saveCall`/`reviewCall` append history and invalidate every application sharing the opportunity. `saveApplication` deduplicates project/opportunity pairs. `internal()` serializes latest-state validation and atomic persistence but advances workspace revision. Network calls must occur outside that queue. |
| [evidence](../../lib/evidence.ts), [proposal checks](../../lib/proposals/checks.ts), [readiness](../../lib/readiness.ts) | Keep exact source version/hash/quote references and stale checks. `lastCheckedAt` means the researcher recorded review; a fetch must never set it. Frozen packets remain immutable. |
| [opportunity UI](../../components/opportunities-panel.tsx), [workspace API](../../app/api/workspace/route.ts), [HTTP boundary](../../lib/http.ts) | Extend the existing Opportunities flow. Preserve dirty editors and 409 recovery. New routes retain loopback, same-origin JSON, bounded-body and no-store behavior. `SafeUrl` is not an outbound-fetch security policy. |
| [recommendations](../../modules/recommendations/README.md), [extraction](../../modules/extraction/README.md), [documents](../../modules/documents/README.md) | Canonical reusable capabilities remain in `modules/`. Grants.gov transport/mapping is app-specific code under `lib/discovery/`. Reuse normalizers and hard-filter-before-ranking behavior; do not modify modules to accommodate a single feed. No jobs/integrations module is installed in this snapshot. |

Task09 has no substantive award, ledger or reporting dependency on tasks05/06/08 and does not design those held features. It does need an exclusive shared-file lease and the actual integrated schema/receipt/reset conventions before application integration. Task07 scheduling is unnecessary for the human-approved manual cut.

## 3. Official research and consequences

All links below were checked October 25, 2026. These are documented facts, not successful application-provider tests. Grants.gov detail responses are explicitly illustrative; field completeness and runtime behavior remain preflight checks.

| Official evidence | Finding and design consequence |
| --- | --- |
| [API guide](https://www.grants.gov/api/api-guide), [search2](https://www.grants.gov/api/common/search2) | Public `POST https://api.grants.gov/v1/api/search2` needs no authentication. Documented samples show filters, result count, record ID, number/title/agency, date strings and status. Pin a validated NSF filter and a bounded result window; do not promise complete pagination or latest-first ordering from samples alone. |
| [fetchOpportunity](https://www.grants.gov/api/common/fetchopportunity) | Public `POST https://api.grants.gov/v1/api/fetchOpportunity`, body `{opportunityId: number}`, needs no authentication. Sample fields include provider revision, synopsis version, description, applicant categories, amount strings, update dates, related documents and history. Validate supported optional fields; no complete amendment/deletion contract is established by the sample. |
| [API terms](https://www.grants.gov/api/terms-conditions) | Information retrieval/display is permitted subject to the terms, attribution and faithful representation. Limits/access can change; uninterrupted service is not promised. Prominently display the required notice below. Keep transformed fields visibly separate from source content. |
| [status codes](https://www.grants.gov/api/status-codes), [API versioning](https://www.grants.gov/api/api-versioning) | `429` recommends exponential backoff. API major versions are in the path; new response fields/values can appear. No numeric quota, fee schedule, latency promise or SLA was found for these public endpoints. Application caps below are engineering limits, not provider entitlements. `402` is documented as request failure, not a price quote. |
| [manage opportunity](https://www.grants.gov/help/grantors/manage-opportunity), [version history](https://grants.gov/help/search-grants/version-history-tab) | Opportunity numbers can change; modifications create new forecast/synopsis versions. Key by provider ID, retain number history and locally observed versions. Do not deduplicate by title/number or claim every intervening amendment was captured. |
| [search statuses](https://www.grants.gov/help/search-grants/search-grants-tab), [problem resolution](https://www.grants.gov/help/manage-workspaces/resolving-problems-and-errors) | Posted, forecasted, closed and archived have distinct meanings. Deletion/package changes are separate events. Bounded-search absence means status unverified; a direct detail 404 means source record unavailable. Neither proves withdrawal or closure. |
| [synopsis fields](https://www.grants.gov/help/grantors/create-synopsis), [package fields](https://www.grants.gov/help/grantors/create-a-single-project-package) | A blank close date can have an explanation; archive date is separately configured. Package availability/grace periods do not establish a sponsor deadline or permission to submit late. Preserve explanations and review contradictions. |
| [NSF getting started](https://www.nsf.gov/funding/getting-started) | NSF announces opportunities on its site and Grants.gov. Conditions and dates remain opportunity-specific. Discovery through Grants.gov does not make its metadata a substitute for the solicitation or establish every NSF program's coverage. |

Required API attribution, shown prominently in the real catalog panel:

> This product uses the Grants.gov API but is not endorsed or certified by the U.S. Department of Health and Human Services.

Other investigated official options are deliberately excluded: [Simpler.Grants.gov](https://simpler.grants.gov/developers) requires a key and documents per-key limits; the [EU portal](https://ec.europa.eu/info/funding-tenders/opportunities/portal/screen/support/apis) documents different public search/facet contracts. [RSS](https://www.grants.gov/connect/rss-feeds) and [daily XML](https://www.grants.gov/help/xml-extract/) would add another ingestion path; replay/completeness guarantees were not established. The XML help table has ambiguous close-date applicability, so it cannot resolve the REST/date contract. No bulk file was downloaded.

### Date examples and the real-catalog prerequisite

The official [NSF 25-515 SaTC solicitation](https://www.nsf.gov/funding/opportunities/nsf-satc-us-national-science-foundation-security-privacy-trust/nsf25-515/solicitation) was opened as current and describes recurring **target dates** with proposals accepted anytime. A target date must not become a hard deadline. The [NSF 26-526 GRFP solicitation](https://www.nsf.gov/funding/opportunities/grfp-nsf-graduate-research-fellowship-program/nsf26-526/solicitation) specifies field-dependent October dates at **8 p.m. Eastern** and a separate reference-letter deadline. It is a counterexample to a universal NSF cutoff, not an added GRFP template promise. Those application dates are already past as of this research date.

These are verified **NSF page examples**, not a delivered verified feed catalog. A candidate Grants.gov SaTC ID `357554` could not be paired conclusively with rendered official detail content: the page yielded a site shell. Do not seed that ID on search/aggregator evidence alone. During later implementation, verify 3–5 provider-ID/title/NSF-agency/number/source-link pairs using a modest public detail response or rendered official page; record checked time, current status, raw date/explanation and authoritative NSF URL. If a record cannot be paired, omit it. An unsupported record is not replaced with a fictional “live” entry.

## 4. Plain user workflow

1. Open Opportunities and choose **Real NSF catalog**. Existing fictional demos and researcher-added calls remain separately labeled. Show coverage (“small NSF sample”), entry count, last refresh outcome and last successful observation; opening the page makes no network call.
2. Select **Refresh now**. Explain that this retrieves public grant metadata; researcher profiles, abstracts, proposal text and local documents stay local. Display progress/result counts and partial/failure reasons.
3. Inspect a card: official link, provider status, metadata observation time, date/explanation and local review state. Topic overlap is a transparent preference, not eligibility. Untested eligibility says **Needs confirmation**.
4. Choose **Prepare application**. First inspect/open the official notice, then use existing call intake/review. Pin the catalog version that prompted this choice. A metadata-only import remains explicitly unreviewed, with unknown call requirements; authoritative call text must be separately supplied/reviewed.
5. After another refresh, open a saved application's **Source changes** panel. Compare observed old/new fields and official links. Acknowledge that version for this application or go to call review. Acknowledgement means “seen,” not “applied,” “eligible” or “source verified.”
6. Applying a reviewed call amendment uses existing `saveCall`/`reviewCall` behavior and affects **all applications sharing that call**. Show that impact before saving. Old versions, citations, drafts, requirements and frozen packets remain inspectable. Do not silently apply a per-app call update to a globally shared opportunity.

A failed refresh leaves cards readable as cached. Use wording such as “Metadata retrieved at …; latest refresh failed” rather than “Current.” A successful HTTP request does not certify the sponsor's notice or cutoff.

Freshness is a display policy, not a sponsor guarantee: show never retrieved, retrieved within the past 24 hours, or older cached data, alongside any latest-attempt failure/partial state. Calculate elapsed time with an injected UTC clock. Detail and status observations have independent ages; a successful search cannot renew unseen details, and a detail fetch cannot renew an unverified status.

## 5. Records, provenance and invariants

Add a bounded `discovery` collection to the actual integrated workspace schema. The names below are proposed contracts; exact Zod definitions belong to the later implementation. Keep network data outside existing human-reviewed `Opportunity` fields until an explicit import/review command.

| Record | Minimum fields and invariants |
| --- | --- |
| `DiscoverySettings` | Provider=`grants-gov`, adapter/normalization version, verified NSF agency-code allowlist, fixed query/status scope, limits version. No arbitrary endpoint, credentials or scheduler setting in this cut. |
| `CatalogEntry` | Local ID, provider ID as decimal string, provider identity namespace, current version ID, number history, first-seen time, last detail observation, separate last status observation, last attempt/outcome, optional linked local opportunity ID. Provider/ID uniqueness is enforced. Missing records are retained. |
| `CatalogVersion` | Entry ID, local sequence, semantic SHA-256, response-body SHA-256, adapter version, observed time/run ID, provider revision/version/update strings if present, supported raw fields and normalized display values, availability observation and exact source links. Immutable after commit. Provider revision is not the local sequence or a timestamp guarantee. |
| `RefreshRun` | Operation ID, canonical request digest, adapter/query version, start/end, requested IDs/result-window/counts, request budget, success/partial/failed/interrupted outcome and bounded structured errors. No secret/token fields from response envelopes. |
| `DiscoveryBinding` | Application ID, catalog entry ID, prompting version ID, optional reviewed catalog version with accepted call/source revisions, optional acknowledged-through version ID. Prompting, seen and incorporated are separate facts. All references resolve; acknowledgement belongs to this application only. A legacy call has no binding unless explicitly linked by confirmed provider identity. |
| `AmendmentNotice` | Application/entry ID, old/new version IDs, observed field changes and review state. Old version may be null only for explicitly unverified legacy-call comparison. Unique `(applicationId, entryId, newVersionId)`; retain source URL and uncertainty. Closed/unavailable contradictions can be notices even if no call text changed. |
| `OperationReceipt` | Operation ID, request digest, outcome/run or import IDs. Replay same ID/body returns the retained result before rejecting an outdated workspace revision; same ID/different body conflicts. Reuse the integrated receipt convention if one exists. |

Keep `demo`/`researcher` provenance meaningful. Add separate `origin` metadata for catalog-imported opportunities and sources, with entry/version, retrieval time and `discovery-metadata` versus `authoritative-call-text` scope. Never label a demo fixture as a live fetch. A manual real-source capture is **cached, manually verified at a recorded time**, not live retrieval.

Preserve exact supported raw values, including missing versus blank versus zero. Do not infer currency from formatting, turn an unknown amount into zero, or use an overall program budget as an individual award ceiling. Applicant codes are organizational categories; they do not prove PI career stage, nationality, institutional eligibility or special restrictions. Unknown codes/text stay visible and unconfirmed. No string-equality conversion from “NSF” to “U.S. applicants only.”

Hash a stable, versioned selected-field representation, excluding fetch times, tokens, field order and run IDs. Keep a separate response-body digest for the received bytes; the digest does not imply all raw bytes were retained. Store supported raw field values needed to reproduce the comparison. Preserve absence/null distinctions. API HTML is inert text, not executable markup or model instructions. Reject oversized supported content visibly instead of silently truncating it into “official” evidence.

Citation hashes retain the existing document-normalization contract; use cryptographic SHA-256 separately for transport/version identity. If metadata is materialized as a local `Source`, label its evidence text as a field projection, preserve exact imported string values, and keep it within the existing 20,000-unit limit. It must not masquerade as the full solicitation. Prefer manual authoritative text intake for requirements and eligibility confirmation.

Do not prune referenced versions, notices, call history or packet snapshots. Proposed demo bounds: 10 tracked entries, 200 retained catalog versions and 8 MiB of serialized discovery content. At a storage bound, stop new ingestion with a visible limit result; preserve existing records. Increasing limits or implementing compaction is later work.

## 6. Adapter, refresh transaction and retry boundaries

Use app-specific `lib/discovery/grants-gov.ts`, pure mapping/diff schemas and an injected HTTP transport/clock. Fixed HTTPS endpoints, normal certificate validation, redirect rejection and a validated numeric provider ID are the entire outbound surface. Never fetch URLs found in descriptions, attachments, call/source URL fields or user input. No API key is required; do not add a paid fallback.

**Proposed demo limits, not published provider quotas:** one active refresh in this local process; one search page of 10 rows; at most five new-record detail candidates per run; all existing tracked entries considered before admitting new ones; at most 40 total requests including retries; at most one request per second; 512 KiB per response; 8 MiB/run; 8-second request timeout and 90-second total run budget. On any limit, finish partial and preserve successful record-level observations. Counts and timing should be measured before the demo; reduce breadth if needed rather than remove bounds.

1. Validate same-origin request, operation ID, intent=`live` and expected workspace revision. In the repository queue, resolve prior receipts, check the active run, then persist the run reservation. Reject a competing distinct run with its active run ID; do not create an unbounded queue.
2. Outside the repository queue, query the verified NSF agency filter for posted records. Check HTTP result **and** the documented envelope error code/errors; a 200 error envelope is failure. Validate ID/title/agency correspondence. Keep a response sample's unknown fields from becoming required business assumptions.
3. Fetch bounded details by provider ID for tracked entries and admitted candidates. A search hit alone is an incomplete discovery observation. For lifecycle updates, use an exact-ID match in a validated search response across posted/closed/archived/forecasted statuses, using the current observed number when necessary. Detail samples do not establish a reliable status field. Recheck changed numbers from detail before a bounded status lookup. If public search cannot resolve that ID/status within the budget, record **status unverified**; never infer closure from absence or a guessed field. Validate this lookup behavior in the source preflight.
4. Normalize supported fields, compute immutable versions/diffs, and stage valid record results. Identical semantic content updates observation metadata, not version count. A fresh detail response must not reset an older, unverified status observation. A body/schema failure for one record preserves its last good content/time and makes the run partial.
5. Re-enter the repository queue, reload latest state, confirm this run still owns the reservation and no newer committed observation supersedes it, then atomically commit catalog results, bindings/notices affected by versions, terminal run and receipt. A run started before a user's application save can create its notice against that newly saved binding at commit time. Never replace state read before the network request.
6. Return the saved run/result. Lost responses are recovered by the operation receipt. Before accepting another run after restart, mark abandoned active runs interrupted. Retrying uses a new explicit run ID; it does not claim the interrupted attempt completed.

Retries: at most two per transient request, still inside total request/time budgets. Honor bounded `Retry-After` and back off with jitter for 429/5xx/network timeouts; if the requested delay exceeds the run budget, stop and tell the user when to retry. Do not retry malformed schema, 400, 401/403 or an unexpected redirect automatically. A 404 is unavailable/review needed. Failures never set a successful-observation timestamp. Do not parse provider tokens as application credentials or log them.

The first result window can be incomplete or reorder during refresh. Record query/window/count and show “bounded sample,” including when `hitCount` exceeds retrieved rows. No deletion, closure or completeness conclusion follows from paging. Do not add undocumented pagination to meet a marketing coverage claim.

## 7. Dates, lifecycle, relevance and application notices

Keep these separate: provider status, metadata freshness, modeled eligibility and researcher review. `posted` is a provider observation, not permission to submit or proof of eligibility. `forecasted` cannot become an announced call. Closed/archived observations remove a record from actionable discovery but retain it and its application links.

Store raw close date/explanation plus a proposed semantic classification: unclassified, deadline, target, window or rolling. Imported classifications are proposals until checked against the official notice. Keep stage/track qualifiers rather than collapse multiple dates to the earliest one. For this cut, the existing `Opportunity.deadline` represents only the researcher's explicitly selected hard deadline/date; leave it unknown for targets, rolling calls, unresolved windows or incompatible stages. Supporting a general recurring-deadline engine is deferred.

Date-only metadata never supplies a cutoff time. Do not use midnight, end-of-day or a generic NSF 5 p.m. default. Exact timestamps must satisfy `DeadlineSchema`'s explicit matching numeric offset/UTC; resolve Eastern time for the actual date, including DST, only with cited source support. The explicit workspace display timezone remains unchanged. Conflicting source/search/detail dates, status/date contradictions, impossible dates or an unknown close-date explanation produce a review-needed result. A target in the past does not close a call.

New catalog eligibility stays unconfirmed. On import, `reviewed=false`, human `lastCheckedAt=null`, unsupported profile dimensions unknown and confirmed deadline unset. Reuse `matchOpportunities` for human-reviewed calls; do not promote an unresolved record because of a keyword/topic score. Maintain a known mismatch as a hard exclusion regardless of topic similarity, funding preference or provider posted status. Display availability separately so a closure badge does not conceal the mismatch explanation.

Changes to title/number, status, raw dates/explanation, applicant restrictions, synopsis content or linked-document descriptors generate field-specific notices for bound applications. Changed attachment descriptors mean “linked material may have changed,” not “full call reviewed.” Repeated identical payloads produce no duplicate notice. A→B→A content is a new observed version if distinct from the current head, even if a prior content hash matches. Acknowledging B cannot acknowledge later C.

Refreshing must not advance call/source/application revisions, clear waivers, change readiness stage, mutate accepted criteria or mark a template confirmed. A pending material amendment adds a deterministic review-needed issue to affected applications at evaluation time; retain acknowledgements separately from resolution. Merely clicking “seen” cannot clear the material issue. Resolve through explicit call review or a reasoned “no application change needed” decision pinned to the exact compared versions; a later material version reopens review. Existing waiver rules cannot turn metadata uncertainty into verified compliance.

## 8. Proposed commands, routes and UI ownership

Exact names may adapt to the integrated command union without changing semantics:

| Surface | Contract |
| --- | --- |
| `GET /api/discovery` | Local, no-store catalog, observation states, recent run and notices; no outbound fetch. Support looking up a run ID after response loss. |
| `POST /api/discovery/refresh` | Bounded JSON `{expectedRevision, operationId, intent:"live"}`. Run the bounded manual operation, return persisted run/result; timeout/error includes a recoverable run ID. No user-supplied URL, arbitrary provider parameters or researcher profile. |
| Workspace `importDiscoveryCall` | `{entryId,versionId,operationId}` plus expected revision. A new linked opportunity pins that metadata version and stays unreviewed. Reuse leaves the existing call/source/origin unchanged; the chosen version is only this application's prompting version until separate review. Return IDs plus that distinction. Never title-match an unrelated call. |
| Workspace `bindDiscoveryApplication` | Validated application/entry/version references after confirmed identity; explicit linking for pre-existing calls. Reuse import origin for new applications. |
| Workspace `acknowledgeDiscoveryNotice` / `resolveDiscoveryNotice` | Exact notice and version IDs; resolution records reviewed call/source revisions or a reasoned no-change decision. Stale decisions return 409. Seen and resolved remain distinct. |

Import/binding must immediately compare the selected/current catalog version with the linked call's reviewed catalog origin. If they differ, create the initial review-needed notice in the same transaction; do not wait for a future refresh. If a confirmed legacy identity has no accepted catalog origin, show an unverified-comparison issue with no invented old version. Reusing a v1 call while selecting v2 must never claim that v2 was incorporated.

Route reads/mutations use existing `assertLocalRequest`, bounded `readJSON`, error handling and repository integrity checks. Also reject cross-site fetch metadata using the existing export-route pattern. Network response sizes are independently bounded before JSON parsing. A fresh workspace read after refresh may cause normal editor 409 conflicts; preserve local buffers and explain reconciliation. Do not overwrite UI state captured before refresh.

Add a small `components/discovery/` panel within Opportunities and application notices within the existing application view. Keep layout/global-style/package changes out unless a concrete missing requirement and shared-file lease justify them. There are no new credentials, external messages, paid requests or cloud services in this design.

## 9. Migration and reference validation

At coding kickoff record the actual integrated SHA/schema and shared-file owner. Allocate the next migration then; retain tasks02/03/04 collections and all 14 section keys. Add empty discovery defaults for old workspaces; do not convert fictional fixtures into real records or link calls by title. Follow existing exclusive byte-identical backup and atomic-write patterns. Unknown/corrupt schemas remain preserved with 503, never reset.

Validate on read **and before write**: unique provider/local identities; version belongs to entry; strictly ordered local sequence; current head exists; notice/binding application and entry exist; compared versions belong to the same entry; source-origin references resolve; acknowledged/resolved version cannot exceed a known head; no missing historical references. Recompute semantic hashes from stored selected fields and adapter version, and reject forged references. A provider update timestamp in the future or lower revision is not sufficient ordering evidence: flag it, do not roll back the accepted head silently.

Use the repository's process-local serialization only for one process/user. Do not share its JSON directory across servers. Reset/demo cleanup must retain real catalog and every record referenced by a surviving application/source/snapshot. Existing task02/03 reset/receipt conventions require inspection, not replacement.

## 10. Bounded implementation tickets and gates

One lead owns shared integration. Independent writers, if useful, need their own checkouts/branches and the exclusive new paths below; read-only reviewers need no write scope. Shared-file edits begin only after the coordinator's actual lease handoff.

| Ticket | Exclusive writer scope | Done when |
| --- | --- | --- |
| D09-1 — source preflight and verified seed set | Lead: task09 source notes/seed manifest in new feature paths | Recheck terms/docs, verify NSF filter, endpoint envelope/nullability/status lookup, pair 3–5 real IDs with official detail/NSF notices, record times. No key/signup required. A failed prerequisite keeps live discovery disabled. |
| D09-2 — pure adapter and diff | Independent writer: new `lib/discovery/{schemas,mapping,diff,grants-gov}.ts` and matching new `tests/discovery/adapter*` only | Synthetic transport, budgets, identity, mapping, date uncertainty, envelope failures and stable/changed hashes pass offline. No edits to modules/shared schemas. |
| D09-3 — persistence, receipts and manual route | Lead: new service/routes plus exclusively leased shared schema/repository/readiness/migration | Atomic refresh/import/notices, old-workspace migration, reference integrity, retry/restart and shared-call semantics pass. No scheduler. |
| D09-4 — compact discovery UI | Optional isolated writer: new `components/discovery/**` and feature-only component tests | Cached/live/manual/demo labels, diff/seen/resolved states, refresh failure and keyboard/empty/mobile states work with mocked props. Lead owns wiring to existing panels. |
| D09-5 — integration and demo proof | Lead; independent read-only integrity reviewer | Feature/browser/restart regression, final build and healthy local review revision verified; report real measurements and unrun prerequisites. |

D09-1 is an execution gate, not something this research claims completed. D09-2 pure code can start after later implementation authorization; D09-3 needs final integrated contracts. Do not spend demo time on a generic ingestion platform, scheduler or broad source abstraction. If source preflight fails, retain the labeled manually verified catalog/manual intake as a checkpoint and report the missing live acceptance; do not claim the adapter works.

## 11. Deterministic acceptance and failure cases

Use synthetic payloads, mocked transport/fake clock and isolated temporary data. Ordinary suites must reject accidental outbound network access. Do not commit third-party full notices into fixtures.

| Case | Required observable result |
| --- | --- |
| Identical search/detail imported twice; lost response replay | One entry/version/import per identity; retained receipt returns same result. No duplicate application or notice. No-op metadata refresh may advance run/workspace metadata, never call/app revisions. |
| Provider number/title changes, same ID | Same catalog entry with prior number and version preserved. A different provider ID sharing the title/number remains separate pending identity review. |
| Envelope error200, malformed JSON/schema, unknown code, oversize/timeout/429/5xx | Bounded retries/budgets, actionable run error, last-good record preserved. No synthetic fallback or successful timestamp on failed data. Partial run refreshes only successfully observed fields/records. |
| Entry absent from bounded page or failed status lookup; direct detail404 | Search absence/lookup failure retains last observed status/time and marks status unverified. A direct detail404 separately marks source record unavailable. Neither infers withdrawn/closed/deletion; last-good data remains. |
| Positive closed/archived observation; search/detail dates disagree | Lifecycle notice and non-actionable/review-needed state. Conflicts stay visible; original accepted deadline/source untouched. |
| Blank date with explanation; target date; two tracks; date-only; DST/exact offset | Unknown/qualified display without invented cutoff. Past target is not closure. Invalid/exact-offset mismatch rejected. Authoritative hard deadline uses existing date semantics only after review. |
| Very high topic overlap with known eligibility mismatch | Never Potential fit or ranked as eligible; mismatch reason remains visible. Applicant99/Other plus extra restrictions stays unconfirmed. Missing amount/currency is unknown, not zero/USD by assumption. |
| Two projects share one opportunity; remote versionB arrives | One notice per bound application. Source/call/app revisions, waivers, stage, drafts, all14 editors and frozen packets remain unchanged. |
| AppA seesB; appB does not; versionC arrives | AppA acknowledgement leaves appB unread and does not resolve material issues. C requires a new decision. Repeated B does not duplicate notices; A→B→A is retained as observed history. |
| Explicit reviewed amendment of shared call | All linked applications receive existing invalidation behavior; old source/call/draft citations and immutable packets remain resolvable. UI disclosed shared impact. No automatic deadline/template confirmation. |
| Reuse linked v1 call while choosing v2; bind a legacy call with unknown origin | Existing call/source/origin stay unchanged. Prompting version is recorded separately; an initial material-review or unverified-comparison issue appears immediately, without needing another refresh. |
| Concurrent manual runs, user save during fetch, late run result | One active owner; no stale-state overwrite; commit uses latest applications and dedupes notices. Dirty buffers survive409. Older run cannot replace newer catalog head. |
| Restart after reservation/response loss, crash before final commit | Active run becomes interrupted; last committed catalog survives; operation receipt resolves committed results; explicit new retry creates no duplicate content/import. |
| Migrated workspace, corrupt reference/hash, demo reset, storage cap | Exact backup; integrated collections/14 sections intact. Invalid state preserved/error, never demo reset. Real/referenced history retained; ingestion stops visibly at cap. |
| Malicious HTML/link/redirect/ID/body/origin/host | Inert text, fixed outbound hosts/no redirects, bounded parser, no arbitrary fetch/file access. Same-origin and loopback controls hold. Profiles/proposals never leave the app. |

## 12. Verification, demo and handoff

Later code verification: `npm ci`; `npm test -- tests/discovery`; applicable [recommendations](../../modules/recommendations/README.md), [extraction](../../modules/extraction/README.md) and [documents](../../modules/documents/README.md) checks for capabilities actually touched; `npm run check`; production browser baseline plus task09 journeys; restart persistence; dev smoke. Test the integrated revision, including tasks02/03/04 regression where present. No live network in ordinary checks.

Use unique `.test-data` directories for automated acceptance. Preserve the normal workspace and port 3000. Ask the coordinator to reserve task09 ports at implementation time; suggested review/browser/dev ports are 3009/3109/3209, not claimed reserved or running here. Review uses private `.local-data/task-09-review` in the task checkout.

For a **completed application task**, build the final code, run `npm run review` with the owned port/data directory, GET `/api/health`, check `service`, instance, build and revision against the final artifact, exercise the actual review UI, and provide the working loopback URL. A local build does not prove live discovery, public deployment or sponsor acceptance. Report real commands/exits and the checked SHA; never present a planned URL as healthy.

Suggested judge proof: display one verified real cached record and official source; manually refresh and display the real observation time/outcome; save an application with its pinned origin; use an explicitly labeled **synthetic amendment replay** to show before/after versions and application review; simulate outage in the synthetic test/replay and show last-good preservation. A real amendment can be used if it actually occurs, but do not modify real catalog history to manufacture it. If public access fails on demo day, label the cached catalog and recorded verification time and demonstrate the deterministic replay separately.

Measure after implementation: source records manually paired, actual successful detail/status observations, duplicate/version/notice counts under replay, refresh duration/request count, and pass/fail for each invariant. Present improvement in preparation time/error rate only if a real comparison is conducted; none is measured here. No market-uniqueness or funding-success claim is supported.

### Research evidence and unrun prerequisites

Lead is the sole document writer. Independent agents were requested as GPT-6.1 Sol / Extra High. The human later superseded the initial Fast preference with Standard speed for future chats/agents; this was relayed to both agents. Parent reports removing the host priority override. No per-thread or in-flight tier change was independently confirmed here.

- `/root/official_sources`: read-only official API/terms/status/date/feed investigation. Reported credential-free endpoints, mutable numbers, no documented public tombstone/full-history guarantee, deadline ambiguity and unverified seed IDs. No file writes/provider API calls. Read-only inspection used no additional checkout, as current primary instructions permit.
- `/root/integration_audit`: read-only current-code and failure-case audit in managed checkout `C:/Users/vzhu0/.codex/worktrees/research09-integration-audit/grantguide`, since archived. Identified shared opportunities, human-only `lastCheckedAt`, 20,000-unit source bound, label/security gaps and atomic-commit requirements. No writer scope.

Both agents also reviewed the draft. Their material findings were incorporated: bounded-page absence is distinct from detail404, and reusing an older reviewed call must preserve its origin and immediately flag an unincorporated catalog version.

Documentation-only validation records relative-link existence, source URLs/open results, exclusive diff scope and coverage of the human-approved cut. API runtime/access, real seed pairing, app tests, builds, browser journeys, local health/review deployment, CI and sponsor behavior were **not run for this specification**. Their absence does not block research completion; they remain explicit later application gates. Parent receives only this document's commit/path and evidence, not unrelated primary WIP.
