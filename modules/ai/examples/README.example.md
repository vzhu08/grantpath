# Optional AI processing in the web starter

This is a small browser → validated server route → adapter → labeled result example. It is available only when the `ai` module is selected; the base starter keeps its real local text transformation and does not require AI packages or credentials.

Mount the named client component `AIProcessingWidget` from `modules/ai/examples/widget.tsx` at `/ai`. Its optional `endpoint` prop defaults to `/api/kit/ai`. Re-export `POST` from `modules/ai/examples/route.ts` in your Next App Router API route and use the Node runtime. Preserve the shared runtime files `body.ts`, `demo-reset.ts`, and `index.ts`. Keep the server route and provider adapter out of browser imports.

For an exported project, `app/ai/page.tsx` can contain:

```tsx
import { AIProcessingWidget } from '../../modules/ai/examples/widget';

export default function AIPage() {
  return <AIProcessingWidget />;
}
```

Open the local app using `localhost`, `127.0.0.1`, or `[::1]`. Enter an idea and select **Try fixture**. The route uses `FakeAI` by default and returns a fixed, explicitly labeled sample, without analyzing the input or making a provider call. Empty input, malformed JSON, excess input, a wrong origin, and a busy server return visible errors. Cancel aborts the browser request; unmount also cleans it up. Plain text output is rendered through React, never injected as HTML.

For an intentionally authorized live test, configure the server with `RUN_LIVE_AI=true`, `AI_PROVIDER=openai` or `anthropic`, an explicit `AI_MODEL` available to your account, and its matching `OPENAI_API_KEY` or `ANTHROPIC_API_KEY`. Model IDs have no silent default. Restart the local app after environment changes. Select **Live**, read and check the usage-consent box, then select **Summarize live**. Consent clears after each attempt or input change. Keys stay on the server; neither keys nor raw provider errors are returned or logged by this example. The existing [AI module README](../README.md) describes provider prerequisites and current official references.

The request is `{ text: string, mode?: 'fixture' | 'live', confirmUsage?: boolean }`, with `fixture` and `false` defaults. The route requires a loopback host and a matching `Origin`; live also requires `confirmUsage: true` and the server configuration above. Success returns the module's `Generation` metadata plus `{ limits: { liveCallsRemaining: number } }`. Errors use the shared API error shape with a safe message and request ID. Responses use `Cache-Control: no-store`.

Bounds are 2,000 input characters, 16,384 raw JSON bytes, 128 generated tokens, a 15-second generation deadline, zero provider retries, one concurrent generation, and at most three live attempts per process. The shared body reader separately imposes a 15-second read deadline. Failed, timed-out, and cancelled live attempts consume the three-attempt budget. Fixture calls do not consume it and remain available afterward. The process budget survives development hot reload; restarting the server creates a new budget. Multiple server processes have independent budgets. Cancellation is best effort once provider usage has started, and charges can still apply. Live cost is reported as unknown because no dated price table is supplied.

This intentionally local example is not a deployed usage-control system. Before exposing AI routes remotely, replace loopback access with application authentication, per-user authorization, shared rate/budget limits, and your retention policy. The component stores input/results only in its current React state and this route does not persist them. A provider may have its own retention policy.

Verification: strict TypeScript, scoped ESLint/Prettier, 29 fixture/validation route checks with external fetch blocked, and headless Chromium checks for fixture output, empty input, live-consent gating/reset, safe errors, malformed responses, cancellation, and duplicate-submit prevention passed. No live provider calls were made. The generator owns app-page/API mounting and exported-app checks.
