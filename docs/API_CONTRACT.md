# API contract v1

Canonical runtime schemas: lib/schema.ts; fixtures: lib/fixtures.ts.

- GET /api/workspace: current schemaVersion=1 state; no-store. Initializes only absent storage with synthetic demo records.
- POST /api/workspace: {expectedRevision, command}; command is a discriminated schema. Returns {state, selectedId?}. Same-origin JSON, loopback host, 120 KB byte bound. Serialized atomic writes. Revision conflicts return 409 and preserve client buffers. Invalid inputs 400, absent IDs 404, oversized bodies 413, wrong content type 415, unreadable storage 503. Never reset corrupt data.
- POST /api/generate: application/section/evidence IDs, expected revision, explicit fixture/live mode and usage consent. Returns a validated proposal preview and expiring server token; never saves a draft. No arbitrary tools or fetches from source content. 50,000-character full prompt, 120 KB raw body, timeout/cancellation and process rate limit. Live failure never falls back to fixtures.

Quotes identify source ID, version/hash and normalized UTF-16 end-exclusive offsets. Dates are unresolved, confirmed date-only, or confirmed timestamp with explicit matching offset. Date-only cutoff remains unknown. Provider keys and file I/O never enter client imports. The JSON repository is for one process and one user; hosted/multi-process access is outside scope.
