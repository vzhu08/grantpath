import { z } from 'zod';
import { readJSON } from '../../../packages/runtime/src/body';
import { demoOrigin } from '../../../packages/runtime/src/demo-reset';
import { errorResponse, KitError } from '../../../packages/runtime/src/index';
import { FakeAI, renderPrompt, summaryPrompt } from '../src/index';
import { createLiveAI } from '../src/server';

const inputSchema = z
  .object({
    text: z.string().max(2_000).trim().min(1),
    mode: z.enum(['fixture', 'live']).default('fixture'),
    confirmUsage: z.boolean().default(false),
  })
  .strict();

type DemoState = { liveCalls: number; inFlight: boolean };
const globals = globalThis as typeof globalThis & { kitDemoAIExample?: DemoState };
// Keep the budget across development hot reloads. This is one process, not a deployment quota.
const state = (globals.kitDemoAIExample ??= { liveCalls: 0, inFlight: false });
const maxLiveCalls = 3;

/** Mount as POST /api/kit/ai in a Node server. Never import this module into client code. */
export async function POST(request: Request): Promise<Response> {
  try {
    if (request.headers.get('origin') !== demoOrigin(request))
      throw new KitError('ORIGIN', 'Use this example from the same local app.', 403);
    if (
      request.headers.get('content-type')?.split(';', 1)[0]?.trim().toLowerCase() !==
      'application/json'
    )
      throw new KitError('CONTENT_TYPE', 'Send application/json.', 415);

    const input = await readJSON(request, inputSchema, 16_384);
    if (request.signal.aborted) throw new KitError('CANCELLED', 'The request was cancelled.', 408);
    if (state.inFlight)
      throw new KitError('BUSY', 'Another AI request is running. Wait for it to finish.', 429);

    let adapter;
    if (input.mode === 'live') {
      if (!input.confirmUsage)
        throw new KitError(
          'CONSENT_REQUIRED',
          'Confirm provider usage before each live request.',
          403,
        );
      if (process.env.RUN_LIVE_AI !== 'true')
        throw new KitError('LIVE_DISABLED', 'Live mode is disabled on this server.', 403);
      const provider = process.env.AI_PROVIDER ?? 'openai';
      const model = process.env.AI_MODEL?.trim();
      const apiKey =
        provider === 'openai'
          ? process.env.OPENAI_API_KEY?.trim()
          : provider === 'anthropic'
            ? process.env.ANTHROPIC_API_KEY?.trim()
            : undefined;
      if (!model || !apiKey)
        throw new KitError(
          'LIVE_CONFIGURATION',
          'Set AI_PROVIDER to openai or anthropic, AI_MODEL, and the matching provider key on the server.',
          503,
        );
      if (state.liveCalls >= maxLiveCalls)
        throw new KitError(
          'LIVE_LIMIT',
          'This local process has used its three live attempts. Fixture mode is still available.',
          429,
        );
      adapter = createLiveAI({
        provider: provider as 'openai' | 'anthropic',
        apiKey,
        model,
        timeoutMs: 15_000,
        maxRetries: 0,
      });
    } else {
      adapter = new FakeAI(
        'Fixture preview: turn your idea into one clear user need, one working flow, and one measurable result. This fixed sample does not analyze your input.',
      );
    }

    const prompt = renderPrompt(summaryPrompt, { source: input.text, style: 'brief' });
    const signal = AbortSignal.any([request.signal, AbortSignal.timeout(15_000)]);
    state.inFlight = true;
    if (input.mode === 'live') state.liveCalls++;
    try {
      const result = await adapter.generate({ prompt: prompt.text, maxOutputTokens: 128, signal });
      signal.throwIfAborted();
      return Response.json(
        { ...result, limits: { liveCallsRemaining: Math.max(0, maxLiveCalls - state.liveCalls) } },
        { headers: { 'cache-control': 'no-store' } },
      );
    } catch {
      // Neither provider messages nor request/key details cross this boundary.
      throw new KitError(
        signal.aborted ? 'CANCELLED_OR_TIMEOUT' : 'GENERATION_FAILED',
        signal.aborted
          ? 'Generation was cancelled or exceeded 15 seconds. Any live attempt still counts toward the limit.'
          : 'Generation failed. Check server configuration or use fixture mode. A live attempt still counts toward the limit.',
        signal.aborted ? 408 : 502,
      );
    } finally {
      state.inFlight = false;
    }
  } catch (error) {
    return errorResponse(error);
  }
}
