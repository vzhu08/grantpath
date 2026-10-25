# API contract

Canonical runtime schemas: lib/schema.ts; fixtures: lib/fixtures.ts.

- GET /api/workspace: current schemaVersion=2 state; no-store. Initializes only absent storage with synthetic demo records. Existing v1 files are validated and receive an exclusive byte-identical backup before atomic migration. Corrupt and unknown schemas are preserved.
- POST /api/workspace: {expectedRevision, command}; command is a discriminated schema. Returns {state, selectedId?}. Same-origin JSON, loopback host, 120 KB byte bound. Serialized atomic writes. Revision conflicts return 409 and preserve client buffers. Invalid inputs 400, absent IDs 404, oversized bodies 413, wrong content type 415, unreadable storage 503. Never reset corrupt data.
- POST /api/generate: application/section/evidence IDs, expected revision, explicit fixture/live mode and usage consent. Returns a validated proposal preview and expiring server token; never saves a draft. No arbitrary tools or fetches from source content. 50,000-character full prompt, 120 KB raw body, timeout/cancellation and process rate limit. Live failure never falls back to fixtures.

Quotes identify source ID, version/hash and normalized UTF-16 end-exclusive offsets. Dates are unresolved, confirmed date-only, or confirmed timestamp with explicit matching offset. Date-only cutoff remains unknown. Provider keys and file I/O never enter client imports. The JSON repository is for one process and one user; hosted/multi-process access is outside scope.

## Proposal preparation

Workspace commands add `adoptTemplate`, `confirmTemplate`, `reviewSection`, `setExternalTask`, `saveContent`, `approveContent`, `retireContent`, `insertContent`, `resolveReuse` and `freezePacket`. Draft saves accept paragraphs, headings, lists and rectangular tables with exact visible-text agreement. Approval, insertion and update decisions pin exact revisions. Template adoption archives starter drafts. Library insertions preserve source provenance and require explicit target-context review. Waivers cannot establish supported scope, applicability or page compliance.

- `GET /api/proposal-templates`: bundled reviewed manifests, sources, policy dates and coverage. No remote refresh.
- `POST /api/proposal-exports`: `{snapshotId,expectedRevision,retry?}` returns HTTP 202 `{state,exportId}`. Frozen inputs are immutable. Matching snapshot/renderer jobs are idempotent; an explicit retry of failure creates a new retained record.
- `GET /api/proposal-exports/{id}`: `{export,snapshotId,currentInputsMatch,currentRendererMatch}`. A changed font, renderer, source or draft cannot clear current page checks.
- `DELETE /api/proposal-exports/{id}`: same-origin JSON `{expectedRevision}` cancels queued/running work, preserving completed artifacts and snapshot.
- `GET /api/proposal-exports/{id}/{artifactId}`: allowlisted saved artifact after scope/path/byte-length/SHA-256 verification. Attachment disposition and `nosniff`; no arbitrary paths.

One export runs at a time, with at most four active/queued jobs. Component artifacts are capped at 25 MB and packets at 200 MB. Completed artifacts remain immutable; interrupted jobs become visibly failed/retryable after service restart. Each conversion uses an isolated LibreOffice profile and a 60-second bound. PDFs use the exact generated DOCX and required font files. Missing/failed rendering retains DOCX, reports and the snapshot while PDF/page measurements stay Unknown. The separate internal report and manifest contain warnings; they are never inserted into sponsor narratives. DMSP output is a preparation worksheet, with the official Research.gov task tracked separately.
