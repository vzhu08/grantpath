import { Worker } from "node:worker_threads";
import path from "node:path";
import { z } from "zod";
import { KitError } from "../../packages/runtime/src/index";
import { storage, MAX_TEXT_UNITS } from "./storage";
import {
  SegmentSchema,
  type DocumentVersion,
  type ParseAttempt,
} from "./schema";
const ResultSchema = z.object({
  status: z.enum(["parsed", "partial", "no-text", "failed", "limit-exceeded"]),
  warnings: z.array(z.string().max(500)).max(100),
  text: z.string().max(MAX_TEXT_UNITS),
  segments: z.array(SegmentSchema).max(10000),
  pages: z.number().int().positive().max(100).nullable(),
  parser: z.string().max(500),
});
export type ParseResult = z.infer<typeof ResultSchema> & {
  durationMs: number;
  peakMemoryBytes: number;
};
type Queue = { active: boolean; waiting: Array<() => void> };
const globalQueue = globalThis as typeof globalThis & {
  grantpathVaultParseQueue?: Queue;
};
const queue = (globalQueue.grantpathVaultParseQueue ??= {
  active: false,
  waiting: [],
});
async function slot<T>(run: () => Promise<T>): Promise<T> {
  if (queue.active) {
    if (queue.waiting.length >= 4)
      throw new KitError(
        "PARSE_QUEUE_FULL",
        "Four files are already waiting. Retry parsing after the current work finishes.",
        429,
      );
    await new Promise<void>((resolve) => queue.waiting.push(resolve));
  } else queue.active = true;
  try {
    return await run();
  } finally {
    const next = queue.waiting.shift();
    if (next) next();
    else queue.active = false;
  }
}
type Options = { timeoutMs?: number; workerPath?: string };
/** Disposable heap-bounded parser. Queued calls never hold the repository write queue. */
export async function parseFile(
  directory: string,
  version: DocumentVersion,
  options: Options = {},
): Promise<ParseResult> {
  return slot(async () => {
    const bytes = await storage(directory).read(version),
      started = performance.now();
    return new Promise<ParseResult>((resolve) => {
      let output: z.infer<typeof ResultSchema> | undefined,
        metrics = { durationMs: 0, peakMemoryBytes: 0 },
        complete = false,
        timedOut = false;
      const failed = (
        code: string,
        status: ParseAttempt["status"] = "failed",
      ): ParseResult => ({
        status: status as ParseResult["status"],
        warnings: [code],
        text: "",
        segments: [],
        pages: null,
        parser: "documents-local-v1",
        durationMs: performance.now() - started,
        peakMemoryBytes: metrics.peakMemoryBytes,
      });
      const finish = (result: ParseResult) => {
        if (complete) return;
        complete = true;
        clearTimeout(timer);
        resolve(result);
      };
      let worker: Worker;
      try {
        worker = new Worker(
          options.workerPath ??
            path.resolve(process.cwd(), "lib/vault/parse-worker.mjs"),
          {
            workerData: {
              root: process.cwd(),
              filename: version.filename,
              mime: version.mime,
              id: version.id,
              bytes,
            },
            resourceLimits: {
              maxOldGenerationSizeMb: 384,
              maxYoungGenerationSizeMb: 32,
              stackSizeMb: 4,
            },
            execArgv: [],
            stdout: true,
            stderr: true,
          },
        );
      } catch {
        resolve(failed("WORKER_START_FAILED"));
        return;
      }
      // Parser diagnostics may contain filenames or passages. Drain and discard, never log them.
      worker.stdout?.resume();
      worker.stderr?.resume();
      const timer = setTimeout(
        () => {
          timedOut = true;
          void worker
            .terminate()
            .then(() => finish(failed("PARSE_TIMEOUT", "limit-exceeded")));
        },
        Math.min(20_000, Math.max(1, options.timeoutMs ?? 20_000)),
      );
      worker.on("message", (message) => {
        if (message?.metrics) {
          const parsed = z
            .object({
              durationMs: z.number().nonnegative(),
              peakMemoryBytes: z.number().nonnegative(),
            })
            .safeParse(message.metrics);
          if (parsed.success) metrics = parsed.data;
          return;
        }
        const parsed = ResultSchema.safeParse(message);
        if (
          parsed.success &&
          parsed.data.segments.every(
            (s) => s.end >= s.start && s.end <= parsed.data.text.length,
          )
        )
          output = parsed.data;
      });
      worker.once("error", () => finish(failed("WORKER_FAILED")));
      worker.once("exit", (code) =>
        finish(
          timedOut
            ? failed("PARSE_TIMEOUT", "limit-exceeded")
            : code === 0 && output
              ? {
                  ...output,
                  ...metrics,
                  durationMs: performance.now() - started,
                }
              : failed("WORKER_FAILED"),
        ),
      );
    });
  });
}
