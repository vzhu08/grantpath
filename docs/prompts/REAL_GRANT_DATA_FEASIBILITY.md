# Real grant data feasibility dispatch prompt

Status: queued, not dispatched. Launch a **separate research chat alongside the UI redesign**, after that redesign's post-02–09/infrastructure launch gate passes. This research can run while the UI lead holds the frontend lease; neither chat waits for the other's output. It does not release research 11–13 or authorize a new ingestion implementation.

## Prompt for the new researcher

Assess how feasible it is to give **GrantPath real data about different grants**, beyond its existing NSF/Grants.gov discovery slice. Produce an evidence-backed recommendation and a concrete code-aware handoff for a later selected integration. This is research and feasibility work, not an application implementation.

Parent orchestrator: `01a17191-e455-7b93-8c8e-54ebcf12741d`, local `grantguide` project. Launch base: **[ORCHESTRATOR: exact checked merged main SHA, including task 09]**. Existing discovery release evidence: **[ORCHESTRATOR: actual task-09 final SHA/report]**. Time budget: **[ORCHESTRATOR: remaining confirmed hackathon window]**. Own isolated checkout/branch and write scope: only `docs/research/REAL_GRANT_DATA_FEASIBILITY.md` and `docs/research/real-grant-data/**`.

Use **GPT-6.1 Sol / Extra High, Standard speed/Fast off** and useful independent agents. Assign one read-only agent to official source access/data quality and one to current code fit/integration costs; the lead synthesizes and writes the report. Any additional writer needs its own isolated checkout/branch and exclusive files. Relay the hackathon goals and resource/ownership restrictions to every agent.

### Start from the existing product

Read project/scoped instructions, selected modules, quickstart, ownership, human workflow, current task/coordination/status records, `docs/PROJECT_BRIEF.md`, the completed task-09 specification/release, and the actual merged discovery, call intake, evidence and extraction code. Cite exact file paths/interfaces and the inspected revision. Inspect design-system documentation only if it already exists; the redesign is running concurrently, so do not wait for unfinished tokens/components or invent their final contracts.

The human prioritizes **technical impressiveness, clarity, impact and novelty** in a time-constrained hackathon. Focus on a small real-data increment that makes the source-to-researcher-decision workflow convincing. Preserve integration/rehearsal time. Do not propose an exhaustive aggregator or add sources merely to increase a count.

Task 09 already provides a bounded, manually refreshed NSF catalog through Grants.gov, verified record identities, source/version tracking and explicit review before metadata becomes application requirements. Reuse its final acceptance and source evidence. Identify exactly what broader Grants.gov agency coverage can reuse, and what actually needs a different provider or contract. Do not repeat task 09's implementation plan or treat its earlier source checkpoint as the final merged feature.

### Keep three data families distinct

1. **Funding opportunities:** open/forecast/closed notices, instrument and applicant scope, amounts, deadlines/target/rolling dates, official links and amendments. State whether a source covers genuinely actionable calls and what remains unknown.
2. **Award history:** funded projects, recipients, amounts, topics and dates. Explain its useful context without representing old awards as open opportunities, available funding, evidence of eligibility or a prediction of success. Public award metadata does not imply access to successful proposal text or reviewer scores.
3. **Authoritative solicitation material:** full official call text and attachments supporting exact eligibility, requirements, deadlines and amendments. Determine whether reliable structured fields, HTML, PDF, DOCX or manual capture are available, and how retained evidence and human confirmation would work. Discovery metadata alone cannot supply full requirements.

### Evaluate a bounded set of real sources

Start with the current approved U.S./NSF context. Compare broader federal opportunities through Grants.gov with a few additional official sources that materially improve breadth or depth, such as NIH/federal program notices and public award databases. An EU or foundation option may be a useful comparison if official access is straightforward; do not assume expanded geography or paid/private aggregation is selected scope. Pick the strongest candidates autonomously for investigation, not for unapproved implementation.

Use current official API documentation, provider terms and authoritative records. Record source URLs and check times. Verify at least a few representative real records for the leading options with modest, free, read-only requests or page retrieval where permitted. Reuse task-09 evidence when still applicable; avoid bulk downloads or repeated known checks. Distinguish documentation claims, actual observed retrieval and inference. An accessible search page or HTTP 200 shell is not a verified usable dataset.

For each candidate, compare:

- Anonymous/free access versus an account/key, actual documented pricing/quotas, published reuse/attribution terms and access restrictions. Missing documentation means unknown, not unlimited or free forever.
- Countries, funders, disciplines, instruments and record types actually covered; known omissions and whether a bounded sample can support the demo honestly.
- Available fields/full text/attachments, stable identifiers and cross-source deduplication, observed version/amendment behavior, date/status semantics, currency and program-total versus per-award amounts.
- Update cadence, publication lag, observed timestamps and freshness, pagination/completeness limits, transient failure behavior and usable cached/manual fallback.
- Provenance and trust: which fields can be displayed as retrieved metadata, which need authoritative text and researcher review, and how exact source versions remain inspectable.
- Fit with the actual `lib/discovery`, opportunity/call/source schemas and document extraction workflow. Name reusable interfaces, required adapter/mapping work, migration or UI needs and real prerequisite gaps.
- Hackathon implementation effort and demo value, using bounded estimates with assumptions. Separate a same-day minimal slice from later work; do not promise a working integration from research alone.

Do not sign up, buy access, accept account terms, obtain private credentials, submit proposals, contact funders or transmit local researcher/proposal data. Public metadata requests are the research activity; ordinary app tests remain offline. Keep downloaded samples small, sanitized and within the assigned research paths. No app build/install/browser acceptance/server restart, workspace mutation, heavy processing or frontend changes while UI owns that work. Use separate browsing surfaces without disrupting the UI lead's inspection.

### Human questions and handoff

Initial feasibility triage can proceed without a new preference question. Ask the **human** if a must-have funder/geography/instrument or account/cost choice materially changes the recommendation. Use a concise asynchronous question and relay its exact options to the parent; neither the orchestrator nor another agent may answer for the human. Continue independent investigation while a consequential answer is pending, marking dependent recommendations provisional. Elapsed time is not consent.

Deliver `docs/research/REAL_GRANT_DATA_FEASIBILITY.md` with a short verdict, source comparison table, verified sample evidence and limitations, ranked demo-value/effort choices, and one recommended smallest expansion with explicit exclusions. Include a code-aware implementation outline tied to the exact inspected revision, fields/provenance/mapping, failure/freshness states, acceptance checks and remaining human decisions. Keep evidence/source notes under `docs/research/real-grant-data/`; no secrets or unnecessary third-party content.

Review the recommendation with the independent agents. Commit only your assigned documents and provide exact SHA, inspected base, actual checks/requests and skipped prerequisites. Explain briefly in chat **what real data is feasible now, what is difficult or unavailable, and the strongest next improvement**. Send the final handoff and consequential questions to the parent under the human's orchestration authorization; do not message unrelated chats or people.

The UI redesign must proceed independently. A selected later data implementation needs its own exclusive assignment, settled human choices and the accepted UI design system; do not implement every source investigated. This research does not launch or unlock roadmap 11–13. Research has no application deployment claim or new review URL.
