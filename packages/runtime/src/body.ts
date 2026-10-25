import { KitError } from './index';
/** Bounds raw bytes before decoding/parsing, including chunked bodies without Content-Length. */
export async function readRequestBytes(
  request: Request,
  maxBytes = 400_000,
  timeoutMs = 15_000,
): Promise<Uint8Array> {
  if (!Number.isInteger(maxBytes) || maxBytes < 1 || timeoutMs < 1)
    throw new Error('Invalid request bounds');
  if (Number(request.headers.get('content-length') ?? 0) > maxBytes)
    throw new KitError('TOO_LARGE', `Request exceeds ${maxBytes} bytes`, 413);
  const reader = request.body?.getReader();
  if (!reader) return new Uint8Array();
  const signal = AbortSignal.any([request.signal, AbortSignal.timeout(timeoutMs)]);
  const chunks: Uint8Array[] = [];
  let size = 0;
  try {
    while (true) {
      signal.throwIfAborted();
      let abort = () => {};
      const part = await Promise.race([
        reader.read(),
        new Promise<never>((_, reject) => {
          abort = () => reject(signal.reason);
          signal.addEventListener('abort', abort, { once: true });
          if (signal.aborted) abort();
        }),
      ]).finally(() => signal.removeEventListener('abort', abort));
      if (part.done) break;
      size += part.value.byteLength;
      if (size > maxBytes)
        throw new KitError('TOO_LARGE', `Request exceeds ${maxBytes} bytes`, 413);
      chunks.push(part.value);
    }
  } catch (e) {
    void reader.cancel().catch(() => {});
    if (signal.aborted)
      throw new KitError('REQUEST_TIMEOUT', 'Request was cancelled or exceeded its deadline', 408);
    throw e;
  }
  const bytes = new Uint8Array(size);
  let offset = 0;
  for (const chunk of chunks) {
    bytes.set(chunk, offset);
    offset += chunk.byteLength;
  }
  return bytes;
}
export async function readJSON<T>(
  request: Request,
  schema: { parse: (value: unknown) => T },
  maxBytes = 400_000,
): Promise<T> {
  const bytes = await readRequestBytes(request, maxBytes);
  let value: unknown;
  try {
    value = JSON.parse(new TextDecoder('utf-8', { fatal: true }).decode(bytes));
  } catch {
    throw new KitError('INVALID_JSON', 'Expected valid UTF-8 JSON', 400);
  }
  return schema.parse(value);
}
