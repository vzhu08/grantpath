# GrantPath project goals

Product owner: the requesting user. Implementation and integration: Codex lead. Local execution only.

## Hackathon objective

GrantPath is a **time-constrained hackathon project aiming for technical impressiveness, clarity, impact and novelty**. This is a standing development priority for humans, task leads and subagents, including the current tasks 02 and 03. Optimize for a compelling, working demonstration within the available time. A larger feature list is not the objective.

- **Technical impressiveness:** show a substantive mechanism working end to end. Exact source references, immutable submission/file versions, targeted stale-decision detection and a traceable revision chain can demonstrate engineering depth. Explain and exercise the mechanism; code volume or a collection of API calls alone is not evidence of technical achievement.
- **Clarity:** make the user's problem, input, result and differentiator understandable in a short judge walkthrough. Keep the main path focused, use plain labels and make the useful result visible quickly. Reveal technical detail when it explains why the result can be trusted.
- **Impact:** address a concrete researcher problem such as missing attachments, wrong versions, overlooked feedback or unsupported response claims. Demonstrate observable improvements with realistic synthetic or authorized data. Preparation time, error counts and correction effort are useful evaluation targets; report measurements only after they exist.
- **Novelty:** emphasize the distinctive connection between evidence, requirements, review feedback, revisions and researcher decisions. Demonstrate why that connection adds value beyond file storage or generated prose. Distinguish original project work from reused kit/provider capabilities; differentiation is a design goal, not a claim of proven market uniqueness.

The target demonstration connects a selected application and its supporting evidence to a concrete preparation or revision decision. For task 02, show how a replacement file preserves the original selection and exposes review needs. For task 03, show concern → action → evidence → revision → response, including an unfinished experiment that correctly stays open. These are intended demo outcomes; consult [actual implementation status](implementation/STATUS.md) before claiming they work.

## Decisions under the time constraint

Choose the smallest complete slice with the strongest judge-visible value for the remaining implementation, integration and demonstration effort. Prioritize the critical path, a clear result and a meaningful failure/recovery example. Use existing working capabilities before adding dependencies or general frameworks. Defer secondary screens, speculative integrations, broad configuration and infrastructure for future hosted use when they do not improve the current demonstration.

Reserve time for integration, verification, a fresh-session walkthrough and rehearsal. Keep a known-good local build. Required data integrity, boundary validation, regression checks and accurate provenance remain part of a credible demo. If required scope threatens completion, bring a specific cut and its demo/acceptance impact to the parent orchestrator; do not silently drop a promised outcome or replace working behavior with an unlabeled simulation.

At task planning, review and handoff, briefly state the researcher problem solved, the distinctive technical mechanism, the judge-visible proof and any optional work deferred. Use this as a decision lens, not a new approval ceremony for routine work. The human later clarified a demo tomorrow, October 26, 2026, with roughly the next 24 hours relevant. Exact cutoff time, judging rubric and allotted demo duration remain unrecorded; do not invent a precise deadline from this approximate window or the kit examples.

Human-approved demo cuts: task 07 needs banners inside the open website, with closed-website delivery deferred; task 09 needs manual NSF/Grants.gov refresh, with scheduled refresh deferred rather than a demo release blocker. Preserve the broader roadmap as later goals and label the narrower completed behavior accurately.

## Current authorized scope

Roadmap 01 is implemented; tasks 02–04 have active independent implementation chats. The user subsequently authorized a standing pipeline for selected tasks 05–09: once research handoff is complete and reviewed, start a **new implementation chat for each task**. Research 05, 07 and 09 is complete and their implementation chats are dispatched. Task 06 research is now unlocked by the reviewed logical award contract from 05; task 08 remains held for 06's settled ledger contract. Missing implementation-dependent facts still block dependent integration. Their ownership, dependency order and handoff gates are in [ORCHESTRATION.md](ORCHESTRATION.md). Unselected roadmap items remain future options, not permission to expand scope.

Use useful independent agents by default in this orchestrator and every future orchestrated chat unless the human specifies otherwise. At the end of a completed application task, deploy the final build locally, verify the owned review server's health/build identity and provide its working URL. Preserve the normal workspace and existing local servers; this is not public deployment authorization.

No additional human teammates are assumed. Preserve uncertainty, versioned evidence and manual operation without API credentials. No external submissions, messages, deployment or paid tests follow from the hackathon objective. Existing ownership, validation and review-link requirements remain authoritative.

## Historical first-build scope

Deliver one connected research-grant preparation journey: profile and text evidence, six fictional calls plus manually pasted calls, sourced checklist/agenda/calendar export, three editable draft sections and deterministic readiness checks. Preserve uncertainty and source versions. No external submissions, messages, deployment or publication.

The implementation PDF is the accepted first-build brief. Later task authorization is recorded above and in the task board. The kit's generic team/deployment templates are reference material, superseded by this project scope.
