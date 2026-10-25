import { createOpenAI } from '@ai-sdk/openai';
import { createAnthropic } from '@ai-sdk/anthropic';
import {
  generateText,
  streamText,
  embedMany,
  Output,
  isStepCount,
  tool,
  type LanguageModel,
  type LanguageModelUsage,
} from 'ai';
import { z } from 'zod';
import {
  GenerationRequestSchema,
  estimateCost,
  type GenerationRequest,
  type Generation,
  type Price,
} from './index';

export type AIConfig = {
  provider: 'openai' | 'anthropic';
  apiKey: string;
  model: string;
  embeddingModel?: string;
  timeoutMs?: number;
  maxRetries?: number;
  price?: Price;
  fetcher?: typeof fetch;
};
export function createLiveAI(config: AIConfig) {
  z.object({
    provider: z.enum(['openai', 'anthropic']),
    apiKey: z.string().min(1),
    model: z.string().min(1),
    timeoutMs: z.number().int().min(1).max(120_000).optional(),
    maxRetries: z.number().int().min(0).max(3).optional(),
  }).parse(config);
  const provider =
    config.provider === 'openai'
      ? createOpenAI({ apiKey: config.apiKey, fetch: config.fetcher })
      : createAnthropic({ apiKey: config.apiKey, fetch: config.fetcher });
  const model: LanguageModel = provider(config.model);
  function options(request: GenerationRequest) {
    request.signal?.throwIfAborted();
    const input = GenerationRequestSchema.parse(request);
    return {
      model,
      ...input,
      abortSignal: request.signal,
      timeout: config.timeoutMs ?? 30_000,
      maxRetries: config.maxRetries ?? 1,
    };
  }
  function metadata(text: string, usage: LanguageModelUsage, start: number): Generation {
    return {
      text,
      mode: 'live',
      provider: config.provider,
      model: config.model,
      usage: { inputTokens: usage.inputTokens, outputTokens: usage.outputTokens },
      latencyMs: performance.now() - start,
      costUsd: estimateCost(usage, config.price),
      priceDate: config.price?.asOf,
    };
  }
  return {
    capabilities: {
      text: true,
      stream: true,
      structured: true,
      tools: true,
      embeddings: config.provider === 'openai' && !!config.embeddingModel,
    },
    async generate(request: GenerationRequest) {
      const start = performance.now();
      const result = await generateText(options(request));
      return metadata(result.text, result.usage, start);
    },
    async *stream(request: GenerationRequest) {
      const consumer = new AbortController();
      let abortReason: unknown;
      const result = streamText({
        ...options({
          ...request,
          signal: AbortSignal.any([consumer.signal, ...(request.signal ? [request.signal] : [])]),
        }),
        onAbort: ({ reason }) => {
          abortReason = reason;
        },
        // Errors are surfaced to the caller, not logged with provider request bodies.
        onError: () => {},
      });
      let finished = false;
      try {
        for await (const part of result.fullStream) {
          if (part.type === 'error') throw part.error;
          if (part.type === 'abort')
            throw (
              abortReason ??
              request.signal?.reason ??
              new DOMException(part.reason ?? 'Generation aborted', 'AbortError')
            );
          if (part.type === 'text-delta') yield part.text;
        }
        request.signal?.throwIfAborted();
        finished = true;
      } finally {
        if (!finished) consumer.abort(new DOMException('Stream consumer stopped', 'AbortError'));
      }
    },
    /** Use when the caller needs usage/cost after streaming; consume chunks before awaiting result. */
    streamWithMetadata(request: GenerationRequest) {
      const start = performance.now();
      const result = streamText({ ...options(request), onError: () => {} });
      return {
        chunks: result.textStream,
        result: Promise.all([result.text, result.usage]).then(([text, usage]) =>
          metadata(text, usage, start),
        ),
      };
    },
    async structured<T>(request: GenerationRequest, schema: z.ZodType<T>) {
      const start = performance.now();
      const result = await generateText({ ...options(request), output: Output.object({ schema }) });
      return { ...metadata(result.text, result.usage, start), output: schema.parse(result.output) };
    },
    async embed(texts: string[], signal?: AbortSignal) {
      signal?.throwIfAborted();
      z.array(z.string().min(1).max(100_000)).min(1).max(128).parse(texts);
      if (config.provider !== 'openai' || !config.embeddingModel)
        throw new Error('Embeddings require OpenAI and an explicitly configured embeddingModel');
      const result = await embedMany({
        model: createOpenAI({ apiKey: config.apiKey, fetch: config.fetcher }).embeddingModel(
          config.embeddingModel,
        ),
        values: texts,
        maxParallelCalls: 2,
        maxRetries: config.maxRetries ?? 1,
        abortSignal: AbortSignal.any([
          AbortSignal.timeout(config.timeoutMs ?? 30_000),
          ...(signal ? [signal] : []),
        ]),
      });
      return {
        mode: 'live' as const,
        model: config.embeddingModel,
        embeddings: result.embeddings,
        usage: result.usage,
      };
    },
    async runTools(request: GenerationRequest, maxSteps = 3) {
      z.number().int().min(1).max(5).parse(maxSteps);
      const start = performance.now();
      const result = await generateText({
        ...options(request),
        stopWhen: isStepCount(maxSteps),
        tools: {
          add: tool({
            description: 'Add two finite numbers. This read-only tool has no external effects.',
            inputSchema: z.object({ a: z.number().finite(), b: z.number().finite() }),
            execute: async ({ a, b }) => ({ sum: a + b }),
          }),
        },
      });
      return {
        ...metadata(result.text, result.usage, start),
        steps: result.steps.map((step) => ({
          toolCalls: step.toolCalls,
          toolResults: step.toolResults,
          text: step.text,
        })),
        maxSteps,
      };
    },
  };
}
