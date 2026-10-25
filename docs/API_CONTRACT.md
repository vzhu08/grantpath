# API contract

Canonical runtime schemas: lib/schema.ts; fixtures: lib/fixtures.ts.

- GET /api/workspace: current schemaVersion=3 state; no-store. Initializes only genuinely absent storage with synthetic demo records. Existing v1/v2 files are validated and receive an exclusive byte-identical backup before atomic migration. Missing metadata beside vault/backups, corrupt state and unknown schemas fail closed and are preserved.
- POST /api/workspace: {expectedRevision, command}; command is a discriminated schema. Returns {state, selectedId?}. Same-origin JSON, loopback host, 120 KB byte bound. Serialized atomic writes. Revision conflicts return 409 and preserve client buffers. Invalid inputs 400, absent IDs 404, oversized bodies 413, wrong content type 415, unreadable storage 503. Never reset corrupt data.
- POST /api/generate: application/section/evidence IDs, expected revision, explicit fixture/live mode and usage consent. Returns a validated proposal preview and expiring server token; never saves a draft. No arbitrary tools or fetches from source content. 50,000-character full prompt, 120 KB raw body, timeout/cancellation and process rate limit. Live failure never falls back to fixtures.

Quotes identify source ID, version/hash and normalized UTF-16 end-exclusive offsets. Dates are unresolved, confirmed date-only, or confirmed timestamp with explicit matching offset. Date-only cutoff remains unknown. Provider keys and file I/O never enter client imports. The JSON repository is for one process and one user; hosted/multi-process access is outside scope.

## Document vault and handoffs

Schema 3 adds document/version/parse, attachment selection, manual ethics/task, handoff and operation-receipt collections. Source versions may retain exact reviewed `fileOrigin`; requirements may retain delivery/phase/constraints. Historical proposal snapshots keep their original payloads and digests. Workspace metadata commands cover document metadata/archive, attachment selection/review, reviewed-excerpt promotion and ethics save/confirmation. All references are validated on reads/writes; changing a version never silently relinks a selection.

- `POST /api/documents`: raw bounded binary body; base64url JSON `X-Upload-Metadata` up to 4,096 encoded bytes, including project/replacement IDs, expected revision and idempotency key. Input cap 10,000,000 bytes, 15-second body deadline; extension/MIME/content structure and quotas checked before immutable publication. Exact replay recovers before stale revision checks; changed input under a key conflicts.
- `GET /api/documents/{id}/versions/{versionId}` and `/text?attemptId=...`: project-scoped metadata and bounded immutable extraction. `POST .../parse` queues a bounded append-only retry. One parsing worker/four waiting slots/20-second termination; failure retains original bytes.
- `GET .../download`: verifies selected original bytes against size/SHA-256, uses attachment/no-store/nosniff and no arbitrary paths. Cross-site reads are rejected.
- `POST /api/applications/{id}/handoffs`: same-origin JSON expected revision, phase and retry key; freezes instructions, exact selected versions/hashes, reviews, mapped answer text, warnings and later-phase tasks.
- `GET /api/applications/{id}/handoffs/{snapshotId}`: saved manifest and original-file download targets. Snapshot/version-specific downloads preserve old bytes after replacement; invalid bytes remain unavailable rather than becoming waived into a green result.

Attachment parsing, human relevance/format review and manual ethics confirmation are independent. Future-phase ethics does not block current submission; finite before-research expiry considers the explicit required date or known project start. Readiness and generation use current physical integrity and reviewed-source-head checks. Archive retains referenced originals; demo reset cannot orphan researcher work. No sponsor submission or institutional approval occurs. See [checked release](implementation/02_DOCUMENT_VAULT_RELEASE.md) for exact bounds, checks and limitations.

Operational backup limit: the current repository helper copies workspace metadata and vault blobs/extractions; it does not yet copy completed proposal-export artifacts. For a full local restore, stop the app and preserve the complete data directory and any separately configured export output directory. A metadata/vault-only helper backup must not be represented as a complete proposal-artifact backup.

## Proposal preparation

Workspace commands add `adoptTemplate`, `confirmTemplate`, `reviewSection`, `setExternalTask`, `saveContent`, `approveContent`, `retireContent`, `insertContent`, `resolveReuse` and `freezePacket`. Draft saves accept paragraphs, headings, lists and rectangular tables with exact visible-text agreement. Approval, insertion and update decisions pin exact revisions. Template adoption archives starter drafts. Library insertions preserve source provenance and require explicit target-context review. Waivers cannot establish supported scope, applicability or page compliance.

- `GET /api/proposal-templates`: bundled reviewed manifests, sources, policy dates and coverage. No remote refresh.
- `POST /api/proposal-exports`: `{snapshotId,expectedRevision,retry?}` returns HTTP 202 `{state,exportId}`. Frozen inputs are immutable. Matching snapshot/renderer jobs are idempotent; an explicit retry of failure creates a new retained record.
- `GET /api/proposal-exports/{id}`: `{export,snapshotId,currentInputsMatch,currentRendererMatch}`. A changed font, renderer, source or draft cannot clear current page checks.
- `DELETE /api/proposal-exports/{id}`: same-origin JSON `{expectedRevision}` cancels queued/running work, preserving completed artifacts and snapshot.
- `GET /api/proposal-exports/{id}/{artifactId}`: allowlisted saved artifact after scope/path/byte-length/SHA-256 verification. Attachment disposition and `nosniff`; no arbitrary paths.

One export runs at a time, with at most four active/queued jobs. Component artifacts are capped at 25 MB and packets at 200 MB. Completed artifacts remain immutable; interrupted jobs become visibly failed/retryable after service restart. Each conversion uses an isolated LibreOffice profile and a 60-second bound. PDFs use the exact generated DOCX and required font files. Missing/failed rendering retains DOCX, reports and the snapshot while PDF/page measurements stay Unknown. The separate internal report and manifest contain warnings; they are never inserted into sponsor narratives. DMSP output is a preparation worksheet, with the official Research.gov task tracked separately.
