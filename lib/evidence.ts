import { normalizeText } from "../modules/documents/src/index";
import { validateCitation } from "../packages/contracts/src/index";
import {
  CitationSchema,
  type Citation,
  type Source,
  type State,
} from "./schema";

export const latest = (source: Source) =>
  source.versions[source.versions.length - 1]!;
export function sourceDocument(
  source: Source,
  version = latest(source).version,
) {
  const saved = source.versions.find((v) => v.version === version);
  if (!saved) throw new Error("The referenced source version is unavailable.");
  return normalizeText({
    id: source.id,
    filename: source.title + ".txt",
    text: saved.text,
  });
}
export function cite(
  source: Source,
  quote: string,
  version = latest(source).version,
): Citation {
  const doc = sourceDocument(source, version);
  const start = doc.text.indexOf(quote);
  if (!quote || start < 0)
    throw new Error(
      "Paste an exact nonempty quote from the normalized source.",
    );
  return {
    sourceId: source.id,
    version,
    hash: doc.hash,
    quote,
    start,
    end: start + quote.length,
  };
}
export function validCitation(value: unknown, sources: Source[]): boolean {
  const parsed = CitationSchema.safeParse(value);
  if (!parsed.success) return false;
  const c = parsed.data;
  const source = sources.find((s) => s.id === c.sourceId);
  if (!source) return false;
  const version = source.versions.find((v) => v.version === c.version);
  return (
    !!version &&
    version.hash === c.hash &&
    validateCitation(
      { documentId: c.sourceId, quote: c.quote, start: c.start, end: c.end },
      [sourceDocument(source, c.version)],
    )
  );
}
export function citationStale(c: Citation, state: State) {
  const source = state.sources.find((s) => s.id === c.sourceId);
  return (
    !source ||
    latest(source).version !== c.version ||
    latest(source).hash !== c.hash
  );
}
export function newSource(input: {
  id: string;
  projectId: string | null;
  title: string;
  type: Source["type"];
  text: string;
  url?: string;
  provenance: Source["provenance"];
}): Source {
  const at = new Date().toISOString();
  const doc = normalizeText({
    id: input.id,
    filename: input.title + ".txt",
    text: input.text,
  });
  return {
    id: input.id,
    projectId: input.projectId,
    title: input.title,
    type: input.type,
    url: input.url ?? "",
    provenance: input.provenance,
    createdAt: at,
    updatedAt: at,
    versions: [{ version: 1, hash: doc.hash, text: doc.text, createdAt: at }],
  };
}
