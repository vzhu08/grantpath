import { spawn } from 'node:child_process';
import { mkdtemp, writeFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { z } from 'zod';
import type { OCRAdapter } from './server';
/** Optional isolated Python process. Supply an absolute installed worker path and executable. */
export function pythonOCR(options: {
  python: string;
  worker: string;
  timeoutMs?: number;
}): OCRAdapter {
  return async ({ bytes, mimeType, signal }) => {
    const dir = await mkdtemp(join(tmpdir(), 'kit-ocr-'));
    const input = join(dir, mimeType === 'application/pdf' ? 'input.pdf' : 'input.image');
    try {
      await writeFile(input, bytes, { mode: 0o600 });
      const output = await new Promise<string>((resolve, reject) => {
        const controller = new AbortController();
        const combined = AbortSignal.any([controller.signal, ...(signal ? [signal] : [])]);
        const child = spawn(options.python, [options.worker, input], {
          signal: combined,
          stdio: ['ignore', 'pipe', 'pipe'],
          env: { ...process.env, OMP_THREAD_LIMIT: '1' },
        });
        const timer = setTimeout(
          () => controller.abort(new Error('OCR timeout')),
          options.timeoutMs ?? 60_000,
        );
        let stdout = '',
          stderr = '';
        child.stdout.on('data', (data) => {
          stdout += String(data);
          if (stdout.length > 5_000_000) controller.abort(new Error('OCR output limit'));
        });
        child.stderr.on('data', (data) => {
          stderr = (stderr + String(data)).slice(-2000);
        });
        child.on('error', (error) => {
          clearTimeout(timer);
          reject(error);
        });
        child.on('close', (code) => {
          clearTimeout(timer);
          if (code === 0) resolve(stdout);
          else reject(new Error(`OCR failed (${code}): ${stderr}`));
        });
      });
      return z
        .object({
          pages: z
            .array(z.object({ page: z.number().int().positive(), text: z.string() }))
            .max(100),
          engine: z.string(),
        })
        .parse(JSON.parse(output));
    } finally {
      await rm(dir, { recursive: true, force: true });
    }
  };
}
