import { describe, expect, it, vi } from 'vitest';
import { z } from 'zod';
import {
  FakeAI,
  estimateCost,
  generateWithFallback,
  renderPrompt,
  summaryPrompt,
} from '../src/index';
import { createLiveAI } from '../src/server';
const anthropicBody = (
  content: unknown[] = [{ type: 'text', text: 'Hello fixture' }],
  stop = 'end_turn',
) => ({
  id: 'msg_fixture',
  type: 'message',
  role: 'assistant',
  model: 'fixture-model',
  content,
  stop_reason: stop,
  stop_sequence: null,
  usage: { input_tokens: 10, output_tokens: 3 },
});
describe('AI contracts', () => {
  function hangingStream(onAbort: () => void = () => {}): typeof fetch {
    return async (_url, init) =>
      new Response(
        new ReadableStream<Uint8Array>({
          start(controller) {
            const encoder = new TextEncoder();
            for (const event of [
              { type: 'message_start', message: { ...anthropicBody([]), stop_reason: null } },
              { type: 'content_block_start', index: 0, content_block: { type: 'text', text: '' } },
              {
                type: 'content_block_delta',
                index: 0,
                delta: { type: 'text_delta', text: 'partial' },
              },
            ])
              controller.enqueue(
                encoder.encode(`event: ${event.type}\ndata: ${JSON.stringify(event)}\n\n`),
              );
            init?.signal?.addEventListener(
              'abort',
              () => {
                onAbort();
                controller.error(init.signal?.reason);
              },
              { once: true },
            );
          },
        }),
        { headers: { 'content-type': 'text/event-stream' } },
      );
  }
  it('rejects partial streams on in-flight cancellation and deadline instead of reporting success', async () => {
    for (const mode of ['cancel', 'timeout']) {
      const abort = new AbortController();
      const chunks: string[] = [];
      const ai = createLiveAI({
        provider: 'anthropic',
        apiKey: 'fixture',
        model: 'fixture-model',
        fetcher: hangingStream(),
        timeoutMs: mode === 'timeout' ? 75 : 1000,
        maxRetries: 0,
      });
      const operation = (async () => {
        for await (const chunk of ai.stream({ prompt: 'stream', signal: abort.signal })) {
          chunks.push(chunk);
          if (mode === 'cancel') abort.abort(new Error('User cancelled streaming'));
        }
      })();
      await expect(operation).rejects.toThrow(
        mode === 'cancel' ? 'User cancelled streaming' : /timeout/i,
      );
      expect(chunks).toEqual(['partial']);
    }
  });
  it('aborts upstream generation when the stream consumer exits early', async () => {
    let aborted = false;
    const ai = createLiveAI({
      provider: 'anthropic',
      apiKey: 'fixture',
      model: 'fixture-model',
      fetcher: hangingStream(() => {
        aborted = true;
      }),
    });
    for await (const chunk of ai.stream({ prompt: 'stream' })) {
      expect(chunk).toBe('partial');
      break;
    }
    expect(aborted).toBe(true);
  });
  it('renders versioned prompts and rejects missing or extraneous variables', () => {
    expect(renderPrompt(summaryPrompt, { source: 'Evidence', style: 'brief' })).toMatchObject({
      promptVersion: '1.0.0',
      text: expect.stringContaining('<source>Evidence</source>'),
    });
    expect(() => renderPrompt(summaryPrompt, { style: 'brief' })).toThrow();
    expect(() =>
      renderPrompt(summaryPrompt, { source: 'x', style: 'brief', hidden: 'x' }),
    ).toThrow();
  });
  it('makes fixtures visible, validates structured values, and streams the same text', async () => {
    const ai = new FakeAI('Fixture answer');
    const result = await ai.generate({ prompt: 'x' });
    expect(result.mode).toBe('fixture');
    const chunks: string[] = [];
    for await (const chunk of ai.stream({ prompt: 'x' })) chunks.push(chunk);
    expect(chunks.join('')).toBe(result.text);
    await expect(
      ai.structured({ prompt: 'x' }, z.object({ count: z.number() }), { count: 'wrong' }),
    ).rejects.toThrow();
    await expect(ai.generate({ prompt: '' })).rejects.toThrow();
  });
  it('supports empty embeddings and cancellation', async () => {
    const ai = new FakeAI();
    expect((await ai.embed([])).embeddings).toEqual([]);
    const vectors = (await ai.embed(['hello world', 'hello world', ''])).embeddings;
    expect(vectors[0]).toEqual(vectors[1]);
    expect(vectors[2].every((n) => n === 0)).toBe(true);
    const abort = new AbortController();
    abort.abort();
    await expect(ai.generate({ prompt: 'hello', signal: abort.signal })).rejects.toThrow();
  });
  it('keeps unknown cost unknown and makes fallback explicit', async () => {
    expect(estimateCost({ inputTokens: 10 })).toBeNull();
    expect(
      estimateCost(
        { inputTokens: 1_000_000, outputTokens: 500_000 },
        { asOf: '2026-10-09', inputPerMillion: 2, outputPerMillion: 4 },
      ),
    ).toBe(4);
    const bad = {
      generate: async () => {
        throw new Error('Unavailable');
      },
      stream: new FakeAI().stream,
    };
    await expect(generateWithFallback(bad, { prompt: 'x' })).rejects.toThrow('Unavailable');
    expect(
      (
        await generateWithFallback(
          bad,
          { prompt: 'x' },
          { adapter: new FakeAI(), shouldFallback: () => true },
        )
      ).fallbackUsed,
    ).toBe(true);
  });
  it('calls Anthropic through the real SDK and preserves usage', async () => {
    const fetcher = vi.fn<typeof fetch>(async () => Response.json(anthropicBody()));
    const ai = createLiveAI({
      provider: 'anthropic',
      apiKey: 'fixture-key',
      model: 'fixture-model',
      fetcher,
    });
    const result = await ai.generate({ prompt: 'Hello' });
    expect(result).toMatchObject({
      text: 'Hello fixture',
      mode: 'live',
      usage: { inputTokens: 10, outputTokens: 3 },
      costUsd: null,
    });
    expect(String(fetcher.mock.calls[0]?.[0])).toContain('api.anthropic.com');
  });
  it('calls OpenAI Responses through the real SDK', async () => {
    const ai = createLiveAI({
      provider: 'openai',
      apiKey: 'fixture-key',
      model: 'fixture-model',
      fetcher: async () =>
        Response.json({
          id: 'resp_fixture',
          object: 'response',
          created_at: 0,
          status: 'completed',
          model: 'fixture-model',
          output: [
            {
              id: 'msg_fixture',
              type: 'message',
              role: 'assistant',
              status: 'completed',
              content: [{ type: 'output_text', text: 'OpenAI fixture', annotations: [] }],
            },
          ],
          usage: {
            input_tokens: 5,
            output_tokens: 2,
            total_tokens: 7,
            input_tokens_details: { cached_tokens: 0 },
            output_tokens_details: { reasoning_tokens: 0 },
          },
        }),
    });
    expect((await ai.generate({ prompt: 'Hello' })).text).toBe('OpenAI fixture');
  });
  it('validates provider structured output and rejects unsupported embeddings', async () => {
    const ai = createLiveAI({
      provider: 'anthropic',
      apiKey: 'test',
      model: 'fixture-model',
      fetcher: async () =>
        Response.json(
          anthropicBody(
            [{ type: 'tool_use', id: 'json1', name: 'json', input: { count: 2 } }],
            'tool_use',
          ),
        ),
    });
    expect(
      (await ai.structured({ prompt: 'Return count' }, z.object({ count: z.number() }))).output
        .count,
    ).toBe(2);
    await expect(ai.embed(['x'])).rejects.toThrow('Embeddings require OpenAI');
  });
  it('executes only the typed allowed tool with a bounded turn count', async () => {
    let calls = 0;
    const ai = createLiveAI({
      provider: 'anthropic',
      apiKey: 'test',
      model: 'fixture-model',
      maxRetries: 0,
      fetcher: async () =>
        Response.json(
          ++calls === 1
            ? anthropicBody(
                [{ type: 'tool_use', id: 'tool1', name: 'add', input: { a: 2, b: 3 } }],
                'tool_use',
              )
            : anthropicBody([{ type: 'text', text: '5' }]),
        ),
    });
    const result = await ai.runTools({ prompt: 'Add 2 and 3' }, 2);
    expect(result.steps[0].toolResults[0]).toMatchObject({ output: { sum: 5 } });
    expect(calls).toBe(2);
    await expect(ai.runTools({ prompt: 'x' }, 10)).rejects.toThrow();
  });
  it('bounds provider retries and reports errors without silently using fixtures', async () => {
    let calls = 0;
    const ai = createLiveAI({
      provider: 'anthropic',
      apiKey: 'test',
      model: 'fixture-model',
      maxRetries: 0,
      fetcher: async () => {
        calls++;
        return Response.json(
          { type: 'error', error: { type: 'overloaded_error', message: 'unavailable' } },
          { status: 503 },
        );
      },
    });
    await expect(ai.generate({ prompt: 'x' })).rejects.toThrow();
    expect(calls).toBe(1);
  });
  it('streams actual Anthropic SSE through the SDK and propagates stream failures', async () => {
    const events = [
      { type: 'message_start', message: anthropicBody([]) },
      { type: 'content_block_start', index: 0, content_block: { type: 'text', text: '' } },
      { type: 'content_block_delta', index: 0, delta: { type: 'text_delta', text: 'Streamed ' } },
      { type: 'content_block_delta', index: 0, delta: { type: 'text_delta', text: 'fixture' } },
      { type: 'content_block_stop', index: 0 },
      {
        type: 'message_delta',
        delta: { stop_reason: 'end_turn', stop_sequence: null },
        usage: { output_tokens: 3 },
      },
      { type: 'message_stop' },
    ];
    const ai = createLiveAI({
      provider: 'anthropic',
      apiKey: 'fixture',
      model: 'fixture-model',
      fetcher: async () =>
        new Response(
          events
            .map((event) => `event: ${event.type}\ndata: ${JSON.stringify(event)}\n\n`)
            .join(''),
          { headers: { 'content-type': 'text/event-stream' } },
        ),
    });
    const chunks: string[] = [];
    for await (const chunk of ai.stream({ prompt: 'stream' })) chunks.push(chunk);
    expect(chunks.join('')).toBe('Streamed fixture');
    const stream = ai.streamWithMetadata({ prompt: 'stream' });
    const text: string[] = [];
    for await (const chunk of stream.chunks) text.push(chunk);
    expect(await stream.result).toMatchObject({ text: text.join(''), usage: { outputTokens: 3 } });
    const failed = createLiveAI({
      provider: 'anthropic',
      apiKey: 'fixture',
      model: 'fixture-model',
      maxRetries: 0,
      fetcher: async () => new Response('bad', { status: 503 }),
    });
    await expect(
      (async () => {
        for await (const _chunk of failed.stream({ prompt: 'stream' })) {
          /* Must surface the SDK error rather than an empty success. */
        }
      })(),
    ).rejects.toThrow();
  });
  it('uses OpenAI embeddings with bounded input and honors pre-aborted provider calls', async () => {
    const ai = createLiveAI({
      provider: 'openai',
      apiKey: 'fixture',
      model: 'fixture-model',
      embeddingModel: 'fixture-embedding',
      fetcher: async () =>
        Response.json({
          object: 'list',
          model: 'fixture-embedding',
          data: [{ object: 'embedding', index: 0, embedding: [0.2, 0.8] }],
          usage: { prompt_tokens: 2, total_tokens: 2 },
        }),
    });
    expect((await ai.embed(['sample'])).embeddings).toEqual([[0.2, 0.8]]);
    await expect(ai.embed([])).rejects.toThrow();
    const controller = new AbortController();
    controller.abort(new Error('Cancelled by user'));
    await expect(ai.generate({ prompt: 'never send', signal: controller.signal })).rejects.toThrow(
      'Cancelled',
    );
  });
});
