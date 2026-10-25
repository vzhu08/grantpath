# AI utilities

## 1. What problem does this solve, and when should I use it?

Use one bounded interface for server-side OpenAI or Anthropic generation, structured extraction, streaming, a read-only typed tool example, and optional OpenAI embeddings. Keep `src/index.ts` in browser code and `src/server.ts` on the server. The `FakeAI` adapter is visibly a fixture; it is useful for UI work, deterministic evaluation, and offline demos.

## 2. What is the smallest working example?

From the project root, run `node --import tsx modules/ai/examples/demo.ts`. It renders a versioned prompt, validates a structured fixture and streams sample text without keys. Import `FakeAI` and call `generate({prompt:'Summarize this'})`. Every response identifies its mode/provider/model.

A [browser/server processing example](examples/README.example.md) is mounted at /ai when this module is selected for a new project. Fixture mode is the default; optional live usage requires both server configuration and per-request consent.

## 3. How do I add it to a fresh project or an existing project?

Select `ai` with the kit CLI, or copy this module and the shared package layout using the integration plan. Install the exact manifest dependencies. Register any API route in your application's server layer, validate input there, authenticate the caller and pass its abort signal. A browser must call that route instead of importing `server.ts`. Existing projects should review dependency versions and route names before applying changes.

## 4. What does the API accept and return?

`GenerationRequest` takes a nonempty prompt up to 100,000 characters, optional AbortSignal, and `maxOutputTokens` from 1–8192 (512 default). `generate` returns text, mode, provider, model, token usage, latency and cost. `stream` yields deltas; `streamWithMetadata` returns `{chunks,result}` (consume chunks before awaiting result). `structured(request,zodSchema)` uses SDK7 `Output.object` and validates again at the boundary. `runTools(request,maxSteps)` allows only the typed, side-effect-free `add` tool and 1–5 model steps; its returned steps expose calls/results. `embed(texts)` supports 1–128 bounded values with a configured OpenAI embedding model. The fixture embeds empty lists and empty strings for edge testing, using lexical hash vectors, not semantic embeddings.

`renderPrompt(template,input)` validates required variables and returns prompt ID/version. `generateWithFallback` requires an explicit policy, returns `fallbackUsed`, never falls back on caller cancellation, and never substitutes a live failure automatically. Streaming is not retried at the application layer after output starts. In-flight cancellation and timeout reject the stream; ending iteration early aborts the upstream call. SDK retries default to one and can be set to 0–3, with SDK retry backoff; provider retries may consume usage.

## 5. What prerequisites, environment variables, or credentials are needed?

Node 22+, npm dependencies, no keys for fixtures. Live: `AI_PROVIDER`, `AI_MODEL`, and `OPENAI_API_KEY` or `ANTHROPIC_API_KEY`; optional `AI_EMBEDDING_MODEL`. `examples/live.ts` additionally requires `RUN_LIVE_AI=true`. Keys are passed explicitly to provider factories, never read at import time.

Model examples checked in official documentation on 2026-10-09: OpenAI `gpt-6-astra`, Anthropic `claude-opus-5-5`. Model availability/capabilities depend on the account; examples do not select one silently. Recheck the [OpenAI model reference](https://developers.openai.com/api/docs/models) and [Claude model reference](https://platform.claude.com/docs/en/models/overview) before a live run. No live request was made.

## 6. What changes must I make to routes, schema, storage, or UI?

No migration or implicit route. Mount a protected POST route and limit body size/rate and per-user usage. Show fixture/live status, partial-stream loading, cancelled/error states and unknown cost explicitly. Do not cache private prompts across users. For structured output, render only validated final output; partial text is provisional. Store prompt version and provider/model with evaluation records, but do not automatically retain private prompts.

## 7. How do I verify it and handle expected failures?

`node node_modules/vitest/vitest.mjs run modules/ai/tests` and `npm run typecheck`. Tests cover prompt variables, fixture streaming/cancellation, cost unknowns, explicit fallback, real SDK HTTP shape for both providers, structured parsing, typed tool execution and bounded upstream failure. Mocked HTTP is not live verification. Bad keys/model IDs, 429/503, cancelled streams and invalid structured output are errors; show recovery actions. Supply a dated price table only after checking provider prices: `{asOf:'YYYY-MM-DD',inputPerMillion,outputPerMillion}`. Unknown usage or absent table returns `null`, not zero; fixture cost is zero. Price estimates omit provider-specific caching/batch/tool surcharges unless you extend the table.

## 8. What does it depend on, and what are its limits?

AI SDK 7.0.136, OpenAI adapter 4.0.91, Anthropic adapter 4.0.78, Zod 4.6.5. Read version-matched SDK docs before updates. Both providers support the exposed SDK features only where the selected model does; capability flags indicate available adapter methods, not a guarantee for every model ID. Anthropic embeddings are intentionally unsupported. No arbitrary tools, browser secrets, or automatic provider fallback. [SDK text](https://ai-sdk.dev/docs/ai-sdk-core/generating-text), [structured output](https://ai-sdk.dev/docs/ai-sdk-core/generating-structured-data), [tools](https://ai-sdk.dev/docs/ai-sdk-core/tools-and-tool-calling). Original source and synthetic fixtures: MIT. Provider SDK licenses remain their own.

Implementation: implemented. Local verification: see tests and final build report; no paid calls. Exported-project verification: passed 2026-10-09 in the standalone full recipe (clean npm ci, types, module tests, production build and local HTTP). Live provider verification: not run; requires configured accounts and operator authorization.

Verification record (2026-10-09, Node 22.23.2): 13 module tests passed, strict TypeScript and scoped ESLint passed, and the local demo ran successfully. Provider transports were mocked; no live usage occurred.
