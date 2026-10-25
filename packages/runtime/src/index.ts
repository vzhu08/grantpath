import { TransformRequestSchema, TransformResultSchema } from '../../contracts/src/index';

export class KitError extends Error {
  constructor(
    public code: string,
    message: string,
    public status = 400,
    public retryable = false,
  ) {
    super(message);
    this.name = 'KitError';
  }
}
export function transformText(input: unknown) {
  const { text, operation } = TransformRequestSchema.parse(input);
  const cleaned =
    operation === 'normalize'
      ? text
          .replace(/\r\n?/g, '\n')
          .replace(/[\t ]+/g, ' ')
          .split('\n')
          .map((s) => s.trim())
          .join('\n')
          .trim()
      : text;
  return TransformResultSchema.parse({
    text: cleaned,
    words: cleaned.trim() ? cleaned.trim().split(/\s+/u).length : 0,
    characters: cleaned.length,
    mode: 'local',
  });
}
export function errorResponse(error: unknown, requestId = crypto.randomUUID()): Response {
  const known = error instanceof KitError;
  const invalid = error instanceof Error && error.name === 'ZodError';
  return Response.json(
    {
      error: {
        code: known ? error.code : invalid ? 'INVALID_INPUT' : 'INTERNAL_ERROR',
        message: known
          ? error.message
          : invalid
            ? 'Invalid input. Check the request schema.'
            : 'The request failed.',
        requestId,
        retryable: known && error.retryable,
      },
    },
    {
      status: known ? error.status : invalid ? 400 : 500,
      headers: { 'x-request-id': requestId, 'cache-control': 'no-store' },
    },
  );
}
export function requireEnv(
  names: string[],
  env: Record<string, string | undefined>,
): Record<string, string> {
  const missing = names.filter((n) => !env[n]);
  if (missing.length)
    throw new KitError(
      'CONFIGURATION',
      `Missing environment variables: ${missing.join(', ')}`,
      503,
    );
  return Object.fromEntries(names.map((n) => [n, env[n]!]));
}

/** Instance-local, user-scoped LRU cache. Never share a scope between users. */
export class BoundedCache<T> {
  private entries = new Map<string, { value: T; expires: number }>();
  constructor(
    public maxEntries = 100,
    public ttlMs = 60_000,
    private now = Date.now,
  ) {
    if (!Number.isInteger(maxEntries) || maxEntries < 1 || ttlMs <= 0)
      throw new Error('Invalid cache bounds');
  }
  private key(scope: string, key: string) {
    if (!scope) throw new Error('Cache scope required');
    return JSON.stringify([scope, key]);
  }
  get(scope: string, key: string): T | undefined {
    const k = this.key(scope, key),
      entry = this.entries.get(k);
    if (!entry) return undefined;
    this.entries.delete(k);
    if (entry.expires <= this.now()) return undefined;
    this.entries.set(k, entry);
    return entry.value;
  }
  set(scope: string, key: string, value: T) {
    const k = this.key(scope, key);
    this.entries.delete(k);
    this.entries.set(k, { value, expires: this.now() + this.ttlMs });
    while (this.entries.size > this.maxEntries)
      this.entries.delete(this.entries.keys().next().value!);
  }
  invalidate(scope: string) {
    for (const key of this.entries.keys())
      if ((JSON.parse(key) as string[])[0] === scope) this.entries.delete(key);
  }
  clear() {
    this.entries.clear();
  }
}

export type HttpOptions = RequestInit & {
  timeoutMs?: number;
  retries?: number;
  fetcher?: typeof fetch;
  maxResponseBytes?: number;
};
export async function httpJson<T>(
  url: string | URL,
  schema: { parse: (value: unknown) => T },
  options: HttpOptions = {},
): Promise<T> {
  const {
    timeoutMs = 15_000,
    retries = 0,
    fetcher = fetch,
    maxResponseBytes = 2_000_000,
    ...init
  } = options;
  const method = (init.method ?? 'GET').toUpperCase();
  if (!Number.isInteger(retries) || retries < 0 || retries > 3)
    throw new KitError('INVALID_RETRIES', 'Retries must be 0–3');
  if (retries && !['GET', 'HEAD', 'OPTIONS'].includes(method))
    throw new KitError('UNSAFE_RETRY', 'Only read-only requests can retry automatically');
  const signal = AbortSignal.any([
    AbortSignal.timeout(timeoutMs),
    ...(init.signal ? [init.signal] : []),
  ]);
  for (let attempt = 0; ; attempt++) {
    signal.throwIfAborted();
    const response = await fetcher(url, { ...init, signal });
    if (!response.ok) {
      await response.body?.cancel();
      if (attempt < retries && [429, 502, 503, 504].includes(response.status)) {
        await new Promise<void>((resolve, reject) => {
          const cancel = () => {
            clearTimeout(timer);
            reject(signal.reason);
          };
          const timer = setTimeout(
            () => {
              signal.removeEventListener('abort', cancel);
              resolve();
            },
            Math.min(1000, 100 * 2 ** attempt),
          );
          signal.addEventListener('abort', cancel, { once: true });
          if (signal.aborted) cancel();
        });
        continue;
      }
      throw new KitError(
        'UPSTREAM_ERROR',
        `Upstream returned HTTP ${response.status}`,
        502,
        response.status >= 500 || response.status === 429,
      );
    }
    if (!response.body)
      throw new KitError('EMPTY_RESPONSE', 'Upstream returned no response body', 502);
    const reader = response.body.getReader();
    const chunks: Uint8Array[] = [];
    let size = 0;
    try {
      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        size += value.length;
        if (size > maxResponseBytes)
          throw new KitError('RESPONSE_TOO_LARGE', 'Response exceeded byte limit', 502);
        chunks.push(value);
      }
    } catch (e) {
      await reader.cancel();
      throw e;
    }
    const body = new Uint8Array(size);
    let at = 0;
    for (const c of chunks) {
      body.set(c, at);
      at += c.length;
    }
    return schema.parse(JSON.parse(new TextDecoder().decode(body)));
  }
}
