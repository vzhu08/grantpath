import { z } from 'zod';
import { validateDocument, type NormalizedDocument } from '../../../packages/contracts/src/index';

/** Deterministic content identifier, not a cryptographic security primitive. */
export function contentHash(text: string): string {
  let a = 2166136261,
    b = 0x9e3779b9;
  for (let i = 0; i < text.length; i++) {
    a = Math.imul(a ^ text.charCodeAt(i), 16777619);
    b = Math.imul(b ^ text.charCodeAt(i), 2246822519);
  }
  return [a, b].map((n) => (n >>> 0).toString(16).padStart(8, '0')).join('');
}
const TextInput = z.object({
  filename: z.string().min(1),
  text: z.string().max(5_000_000),
  id: z.string().min(1).optional(),
  mimeType: z.string().optional(),
});
export function normalizeText(input: z.input<typeof TextInput>): NormalizedDocument {
  const { filename, text: original, id, mimeType = 'text/plain' } = TextInput.parse(input);
  const text = original.replace(/^\uFEFF/, '').replace(/\r\n?/g, '\n');
  const hash = contentHash(text),
    documentId = id ?? `doc-${hash}`;
  let section: string | undefined;
  const segments = [];
  const re = /[^\n]+(?:\n|$)/g;
  let match;
  while ((match = re.exec(text))) {
    const heading = /^#{1,6}\s+(.+)/.exec(match[0]);
    if (heading) section = heading[1]!.trim();
    segments.push({
      id: `${documentId}:s${segments.length}`,
      start: match.index,
      end: match.index + match[0].length,
      ...(section ? { section } : {}),
    });
  }
  return validateDocument({
    id: documentId,
    filename,
    mimeType,
    hash,
    text,
    segments,
    metadata: {
      offsetEncoding: 'utf-16',
      mode: 'local',
      hashAlgorithm: 'fnv-pair',
      warnings: text.trim() ? [] : ['EMPTY_DOCUMENT'],
    },
  });
}
export type { NormalizedDocument } from '../../../packages/contracts/src/index';
