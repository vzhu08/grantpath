import { z } from 'zod';

export const ModeSchema = z.enum(['local', 'fixture', 'replay', 'live']);
export type Mode = z.infer<typeof ModeSchema>;
export const ApiErrorSchema = z.object({
  error: z.object({
    code: z.string().min(1),
    message: z.string(),
    requestId: z.string().min(1),
    retryable: z.boolean(),
    details: z.record(z.string(), z.unknown()).optional(),
  }),
});
export const SegmentSchema = z.object({
  id: z.string().min(1),
  start: z.number().int().nonnegative(),
  end: z.number().int().nonnegative(),
  page: z.number().int().positive().optional(),
  section: z.string().optional(),
  row: z.number().int().positive().optional(),
});
export const DocumentSchema = z.object({
  id: z.string().min(1),
  filename: z.string().min(1),
  mimeType: z.string(),
  hash: z.string(),
  text: z.string(),
  segments: z.array(SegmentSchema),
  metadata: z.record(z.string(), z.unknown()).default({}),
});
export type NormalizedDocument = z.infer<typeof DocumentSchema>;
export type DocumentSegment = z.infer<typeof SegmentSchema>;
export const CitationSchema = z.object({
  documentId: z.string(),
  segmentId: z.string().optional(),
  start: z.number().int().nonnegative(),
  end: z.number().int().nonnegative(),
  quote: z.string(),
  label: z.string().optional(),
});
export type Citation = z.infer<typeof CitationSchema>;
export const JobSchema = z.object({
  id: z.string(),
  state: z.enum(['queued', 'running', 'succeeded', 'failed', 'cancelled']),
  progress: z.number().min(0).max(1),
  attempts: z.number().int().nonnegative(),
  result: z.unknown().optional(),
  error: z.string().optional(),
  createdAt: z.string(),
  updatedAt: z.string(),
});
export type Job = z.infer<typeof JobSchema>;
export const PaginationSchema = z.object({
  page: z.number().int().positive(),
  pageSize: z.number().int().min(1).max(100),
  total: z.number().int().nonnegative(),
});
export const TransformRequestSchema = z.object({
  text: z.string().max(100_000),
  operation: z.enum(['normalize', 'stats']).default('normalize'),
});
export const TransformResultSchema = z.object({
  text: z.string(),
  words: z.number().int().nonnegative(),
  characters: z.number().int().nonnegative(),
  mode: z.literal('local'),
});
export type TransformResult = z.infer<typeof TransformResultSchema>;

export function validateDocument(value: unknown): NormalizedDocument {
  const doc = DocumentSchema.parse(value);
  const ids = new Set<string>();
  for (const s of doc.segments) {
    if (s.end < s.start || s.end > doc.text.length || ids.has(s.id))
      throw new Error('Invalid document segment range or duplicate ID');
    ids.add(s.id);
  }
  return doc;
}
export function validateCitation(citation: Citation, documents: NormalizedDocument[]): boolean {
  const c = CitationSchema.safeParse(citation);
  if (!c.success) return false;
  const d = documents.find((x) => x.id === c.data.documentId);
  if (
    !d ||
    c.data.end <= c.data.start ||
    c.data.end > d.text.length ||
    d.text.slice(c.data.start, c.data.end) !== c.data.quote
  )
    return false;
  return (
    !c.data.segmentId ||
    d.segments.some(
      (s) => s.id === c.data.segmentId && s.start <= c.data.start && s.end >= c.data.end,
    )
  );
}
