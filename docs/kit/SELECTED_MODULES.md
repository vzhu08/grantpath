# Selected capabilities

Snapshot starter: web. Source revision is in kit.project.json. Module-guide creation/adoption CLI commands run from the source toolkit checkout; source examples and test commands run here. Imports keep the original modules/ and packages/ layout; no connection to the source checkout is required.

## Document ingestion

[Module guide](../../modules/documents/README.md) · entry: `modules/documents/src/index.ts`

Normalize text, Markdown, PDF, DOCX and CSV with exact provenance and optional isolated OCR.

Integration: Read the eight-question README and select this module with kit create or kit add. Keep server entrypoints in server routes; validate incoming boundaries and show local/live mode.

Checks: `npx vitest run modules/documents/tests`; `node --import tsx modules/documents/examples/demo.ts`. Live status: not run — requires operator test credentials and authorization.

## Structured extraction

[Module guide](../../modules/extraction/README.md) · entry: `modules/extraction/src/index.ts`

Configurable labeled fields with validated values, exact evidence, ambiguity states and review history.

Integration: Read the eight-question README and select this module with kit create or kit add. Keep server entrypoints in server routes; validate incoming boundaries and show local/live mode.

Checks: `npx vitest run modules/extraction/tests`; `node --import tsx modules/extraction/examples/demo.ts`. Live status: not run — requires operator test credentials and authorization.

## Recommendations and group decisions

[Module guide](../../modules/recommendations/README.md) · entry: `modules/recommendations/src/index.ts`

Explainable filtering, weighted utility and deterministic group voting.

Integration: Read the README and run the local example first. Preserve module/shared package layout and install the listed dependencies. Use server adapters only from authenticated bounded handlers; never expose provider keys in browser bundles.

Checks: `node --import tsx modules/recommendations/examples/demo.ts`; `npx vitest run modules/recommendations/tests`. Live status: not run — requires operator test credentials and authorization.

## AI generation and embeddings

[Module guide](../../modules/ai/README.md) · entry: `modules/ai/src/index.ts`

Server-only OpenAI and Anthropic text, structured output, streaming, tools and embeddings with deterministic fixtures.

Integration: Read the module README and choose local or explicit live adapter. Install manifest packages and preserve shared package imports. Register application routes and authorization explicitly; run module checks.

Checks: `node node_modules/vitest/vitest.mjs run modules/ai/tests`; `node --import tsx modules/ai/examples/demo.ts`. Live status: not run — requires operator test credentials and authorization.

## Updating

Review source revision and hashes in kit.project.json. Keep customizations in version control. Re-run the kit plan command from an updated toolkit and compare before applying; changed imported files cause conflicts. Never assume a fresh import safely merges your edits.
