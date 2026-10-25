# Architecture

Four connected browser steps share `lib/schema.ts`. Pure helpers implement evidence, matching, readiness and file serialization. Server-only repository/provider modules never enter client imports. Bounded same-origin JSON calls reach `app/api/workspace`; `lib/repository.ts` validates revisions, serializes writes and atomically replaces private JSON. One process per data directory is required.

Project/call/source/checklist/draft histories preserve versioned inputs. Readiness is derived; changed evidence leaves dependent records stale. Waivers match finding fingerprints and relevant saves invalidate them. Independent editor dirty tracking and stable identities preserve buffers during conflict recovery; saves disable editable controls.

`app/api/generate` checks local origin, limits and saved input revision, then validates structured output and exact quotations. It returns an expiring preview token. Acceptance is a normal revision-checked save. The adapter has no tools/arbitrary retrieval, keeps keys server-only and logs no private requests/responses. Live errors never become fixture output.

Client Markdown exports contain saved drafts, requirements, unresolved findings and a separate source appendix. ICS exports one event, with all-day exclusive next-day ends or validated UTC timestamps. Date-only agenda comparisons use America/New_York as the explicit workspace date basis; no cutoff time is invented. HTTP(S) URLs are stored without fetching; sources render as safe text.

Local single-user assumptions exclude simultaneous server processes, hosted deployment and institutional collaboration. See the roadmap for their separate storage/authorization/operational work.
