import { z } from 'zod';
import {
  CitationSchema,
  validateDocument,
  validateCitation,
  type Citation,
  type NormalizedDocument,
} from '../../../packages/contracts/src/index';
export const FieldSchema = z.object({
  key: z.string().regex(/^[a-zA-Z][a-zA-Z0-9_]*$/),
  label: z.string().min(1).max(100),
  aliases: z.array(z.string().min(1).max(100)).max(10).default([]),
  kind: z.enum(['text', 'date', 'price', 'requirement']).default('text'),
  required: z.boolean().default(false),
});
export type ExtractionField = z.input<typeof FieldSchema>;
export const CandidateSchema = z.object({
  raw: z.string(),
  value: z.union([z.string(), z.number()]),
  evidence: CitationSchema,
});
export const FieldResultSchema = z.object({
  key: z.string(),
  label: z.string(),
  kind: FieldSchema.shape.kind,
  status: z.enum(['found', 'missing', 'ambiguous', 'invalid', 'reviewed']),
  value: z.union([z.string(), z.number()]).nullable(),
  candidates: z.array(CandidateSchema),
  issues: z.array(z.string()),
  review: z
    .object({
      editor: z.string(),
      note: z.string(),
      previousValue: z.union([z.string(), z.number()]).nullable(),
      supported: z.boolean(),
    })
    .optional(),
});
export const ExtractionResultSchema = z.object({
  documentId: z.string(),
  documentHash: z.string(),
  fields: z.array(FieldResultSchema),
  mode: z.enum(['local', 'live', 'fixture']),
  method: z.string(),
});
export type ExtractionResult = z.infer<typeof ExtractionResultSchema>;
export const defaultFields: ExtractionField[] = [
  { key: 'organization', label: 'Organization', aliases: ['Company'], kind: 'text' },
  { key: 'deadline', label: 'Deadline', aliases: ['Due date'], kind: 'date' },
  { key: 'budget', label: 'Budget', aliases: ['Price'], kind: 'price' },
  { key: 'requirement', label: 'Requirement', aliases: ['Must'], kind: 'requirement' },
];
function normalize(raw: string, kind: z.infer<typeof FieldSchema>['kind']): string | number {
  const text = raw.trim();
  if (!text) throw new Error('Empty value');
  if (kind === 'price') {
    const numeric = text.replace(/^\$\s*/, '').replace(/,/g, '');
    if (!/^-?\d+(?:\.\d{1,2})?$/.test(numeric))
      throw new Error(
        'Expected a decimal amount, optionally prefixed with $; currency must be supplied by the application',
      );
    const n = Number(numeric);
    if (!Number.isFinite(n)) throw new Error('Invalid amount');
    return n;
  }
  if (kind === 'date') {
    if (
      !/^\d{4}-\d{2}-\d{2}$/.test(text) ||
      Number.isNaN(Date.parse(text)) ||
      new Date(text).toISOString().slice(0, 10) !== text
    )
      throw new Error('Expected a valid unambiguous ISO date YYYY-MM-DD');
  }
  return text;
}
function escape(s: string) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
export function extractFields(
  input: NormalizedDocument,
  specs: ExtractionField[] = defaultFields,
): ExtractionResult {
  const doc = validateDocument(input),
    fields = z.array(FieldSchema).max(30).parse(specs);
  if (new Set(fields.map((f) => f.key)).size !== fields.length)
    throw new Error('Field keys must be unique');
  return ExtractionResultSchema.parse({
    documentId: doc.id,
    documentHash: doc.hash,
    mode: 'local',
    method: 'exact-labeled-fields-v1',
    fields: fields.map((field) => {
      const re = new RegExp(
        `(?:^|\\n)[\\t ]*(?:${[field.label, ...field.aliases].map(escape).join('|')})[\\t ]*:[\\t ]*([^\\n]*)`,
        'gi',
      );
      const candidates: z.infer<typeof CandidateSchema>[] = [],
        issues: string[] = [];
      let match;
      while ((match = re.exec(doc.text))) {
        const raw = match[1]!,
          start = match.index + match[0].length - raw.length,
          end = start + raw.length;
        const segment = doc.segments.find((s) => s.start <= start && s.end >= end);
        const evidence: Citation = {
          documentId: doc.id,
          ...(segment ? { segmentId: segment.id } : {}),
          start,
          end,
          quote: raw,
        };
        try {
          const value = normalize(raw, field.kind);
          if (!validateCitation(evidence, [doc])) throw new Error('Invalid evidence span');
          candidates.push({ raw, value, evidence });
        } catch (error) {
          issues.push(error instanceof Error ? error.message : 'Invalid field');
        }
      }
      const distinct = [...new Set(candidates.map((c) => c.value))];
      const status = issues.length
        ? 'invalid'
        : distinct.length > 1
          ? 'ambiguous'
          : distinct.length === 1
            ? 'found'
            : 'missing';
      if (!candidates.length && field.required)
        issues.push('Required field has no valid source value');
      return {
        key: field.key,
        label: field.label,
        kind: field.kind,
        status,
        value: status === 'found' ? distinct[0] : null,
        candidates,
        issues,
      };
    }),
  });
}
/** Validate untrusted structured model output. Providers cannot claim human review. */
export function validateExtraction(
  output: unknown,
  document: NormalizedDocument,
): ExtractionResult {
  return validateExtractionInternal(output, document, false);
}
function validateExtractionInternal(
  output: unknown,
  document: NormalizedDocument,
  allowHumanReview: boolean,
): ExtractionResult {
  const result = ExtractionResultSchema.parse(output);
  if (result.documentId !== document.id || result.documentHash !== document.hash)
    throw new Error('Extraction source changed');
  for (const field of result.fields) {
    if (!allowHumanReview && (field.status === 'reviewed' || field.review !== undefined))
      throw new Error('Provider output cannot claim human review');
    for (const candidate of field.candidates)
      if (
        !validateCitation(candidate.evidence, [document]) ||
        candidate.raw !== candidate.evidence.quote ||
        normalize(candidate.raw, field.kind) !== candidate.value
      )
        throw new Error(`Unsupported evidence for ${field.key}`);
    if (
      field.status === 'found' &&
      (new Set(field.candidates.map((c) => c.value)).size !== 1 ||
        !field.candidates.some((c) => c.value === field.value))
    )
      throw new Error(`Unsupported value for ${field.key}`);
    if (['missing', 'ambiguous', 'invalid'].includes(field.status) && field.value !== null)
      throw new Error('Unresolved value must be null');
    if (
      field.status === 'reviewed' &&
      (!field.review ||
        field.review.supported !== field.candidates.some((c) => c.value === field.value))
    )
      throw new Error('Reviewed field requires accurate support metadata');
    if (field.status === 'reviewed') {
      if (field.value === null || normalize(String(field.value), field.kind) !== field.value)
        throw new Error('Reviewed value does not match field normalization');
      if (
        field.review!.previousValue !== null &&
        normalize(String(field.review!.previousValue), field.kind) !== field.review!.previousValue
      )
        throw new Error('Previous reviewed value does not match field normalization');
    }
    if (field.status === 'ambiguous' && new Set(field.candidates.map((c) => c.value)).size < 2)
      throw new Error('Ambiguous field requires conflicting evidence');
    if (field.status === 'missing' && field.candidates.length)
      throw new Error('Missing field cannot have valid candidates');
  }
  return result;
}
export function reviewExtraction(
  result: ExtractionResult,
  edit: { key: string; value: string; editor: string; note: string },
  document: NormalizedDocument,
): ExtractionResult {
  validateExtractionInternal(result, document, true);
  const parsed = z
    .object({
      key: z.string(),
      value: z.string().max(10000),
      editor: z.string().min(1),
      note: z.string().min(1),
    })
    .parse(edit);
  const field = result.fields.find((f) => f.key === parsed.key);
  if (!field) throw new Error('Unknown field');
  const value = normalize(parsed.value, field.kind);
  return validateExtractionInternal(
    {
      ...result,
      fields: result.fields.map((f) =>
        f.key !== edit.key
          ? f
          : {
              ...f,
              value,
              status: 'reviewed',
              review: {
                editor: parsed.editor,
                note: parsed.note,
                previousValue: f.value,
                supported: f.candidates.some((c) => c.value === value),
              },
            },
      ),
    },
    document,
    true,
  );
}
/** Render each part as React text, never innerHTML; offsets are UTF-16 end-exclusive. */
export function evidencePreview(document: NormalizedDocument, citation: Citation, context = 80) {
  if (!validateCitation(citation, [document])) throw new Error('Citation does not match source');
  return {
    before: document.text.slice(Math.max(0, citation.start - context), citation.start),
    highlight: document.text.slice(citation.start, citation.end),
    after: document.text.slice(citation.end, citation.end + context),
  };
}
