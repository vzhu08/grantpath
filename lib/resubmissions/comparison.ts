/** A display comparison only: this does not assess scientific adequacy. */
export const COMPARISON_ALGORITHM_VERSION = "paragraph-lcs-v1" as const;
export const COMPARISON_MAX_PARAGRAPHS = 500;
export const COMPARISON_MAX_CELLS = 250_000;

export interface ParagraphSpan {
  /** UTF-16, end-exclusive offsets into the normalized full text. */
  start: number;
  end: number;
  text: string;
}

export interface ComparisonRun {
  kind: "unchanged" | "added" | "removed" | "changed";
  original: ParagraphSpan[];
  target: ParagraphSpan[];
}

export interface ParagraphComparison {
  algorithmVersion: typeof COMPARISON_ALGORITHM_VERSION;
  originalText: string;
  targetText: string;
  originalParagraphs: ParagraphSpan[];
  targetParagraphs: ParagraphSpan[];
  runs: ComparisonRun[];
  fallback: boolean;
  notice: string | null;
}

/** Same pasted-text newline/BOM semantics as the document adapter. */
export function normalizeComparisonText(text: string): string {
  return text.replace(/^\uFEFF/, "").replace(/\r\n?/g, "\n");
}

/** Blank-line separators are omitted from spans, never from the full text. */
export function paragraphSpans(text: string): ParagraphSpan[] {
  const spans: ParagraphSpan[] = [];
  const separators = /\n[^\S\n]*\n(?:[^\S\n]*\n)*/g;
  let start = 0;
  const append = (end: number) => {
    const paragraph = text.slice(start, end);
    if (paragraph.trim()) spans.push({ start, end, text: paragraph });
  };
  for (const match of text.matchAll(separators)) {
    append(match.index);
    start = match.index + match[0].length;
  }
  append(text.length);
  return spans;
}

export function compareParagraphs(original: string, target: string): ParagraphComparison {
  const originalText = normalizeComparisonText(original);
  const targetText = normalizeComparisonText(target);
  const before = paragraphSpans(originalText);
  const after = paragraphSpans(targetText);
  const result: ParagraphComparison = {
    algorithmVersion: COMPARISON_ALGORITHM_VERSION,
    originalText,
    targetText,
    originalParagraphs: before,
    targetParagraphs: after,
    runs: [],
    fallback: false,
    notice: null,
  };
  if (before.length > COMPARISON_MAX_PARAGRAPHS ||
      after.length > COMPARISON_MAX_PARAGRAPHS ||
      before.length * after.length > COMPARISON_MAX_CELLS) {
    result.fallback = true;
    result.notice = "Comparison too large for paragraph alignment. The complete original and target text remain available side by side.";
    return result;
  }

  const width = after.length + 1;
  const lengths = new Uint16Array((before.length + 1) * width);
  const at = (i: number, j: number) => lengths[i * width + j]!;
  for (let i = before.length - 1; i >= 0; i--) {
    for (let j = after.length - 1; j >= 0; j--) {
      lengths[i * width + j] = before[i]!.text === after[j]!.text
        ? at(i + 1, j + 1) + 1
        : Math.max(at(i + 1, j), at(i, j + 1));
    }
  }
  let i = 0;
  let j = 0;
  let removed: ParagraphSpan[] = [];
  let added: ParagraphSpan[] = [];
  const flush = () => {
    if (!removed.length && !added.length) return;
    result.runs.push({
      kind: removed.length ? (added.length ? "changed" : "removed") : "added",
      original: removed,
      target: added,
    });
    removed = [];
    added = [];
  };
  while (i < before.length || j < after.length) {
    if (i < before.length && j < after.length && before[i]!.text === after[j]!.text) {
      flush();
      const last = result.runs[result.runs.length - 1];
      if (last?.kind === "unchanged") {
        last.original.push(before[i]!);
        last.target.push(after[j]!);
      } else {
        result.runs.push({ kind: "unchanged", original: [before[i]!], target: [after[j]!] });
      }
      i++;
      j++;
    } else if (i < before.length && (j === after.length || at(i + 1, j) >= at(i, j + 1))) {
      // Ties consistently consume the original first; repeated paragraphs are stable.
      removed.push(before[i++]!);
    } else {
      added.push(after[j++]!);
    }
  }
  flush();
  return result;
}

export interface ComparableSection {
  sectionId: string;
  label: string;
  revisionId: string | null;
  text: string;
}

export interface SectionMapping {
  originalSectionIds: string[];
  targetSectionIds: string[];
}

export interface MappedSectionComparison<T extends ComparableSection> {
  originalSections: T[];
  targetSections: T[];
  comparison: ParagraphComparison;
}

/** Explicit IDs support renamed, split and combined sections without positional guesses. */
export function compareSections<T extends ComparableSection>(
  original: readonly T[],
  target: readonly T[],
  mappings: readonly SectionMapping[],
): {
  algorithmVersion: typeof COMPARISON_ALGORITHM_VERSION;
  groups: MappedSectionComparison<T>[];
  originalUnmapped: T[];
  targetUnmapped: T[];
} {
  const index = (sections: readonly T[]) => {
    const byId = new Map<string, T>();
    for (const section of sections) {
      if (!section.sectionId || byId.has(section.sectionId)) throw new Error("Section IDs must be nonempty and unique within each side.");
      byId.set(section.sectionId, section);
    }
    return byId;
  };
  const oldById = index(original);
  const newById = index(target);
  const oldMapped = new Set<string>();
  const newMapped = new Set<string>();
  const resolve = (ids: string[], byId: Map<string, T>, mapped: Set<string>) => {
    if (new Set(ids).size !== ids.length) throw new Error("A section mapping cannot repeat an ID on one side.");
    return ids.map((id) => {
      const section = byId.get(id);
      if (!section) throw new Error("A mapped section is unavailable on its selected side.");
      mapped.add(id);
      return section;
    });
  };
  const groups = mappings.map((mapping) => {
    if (!mapping.originalSectionIds.length && !mapping.targetSectionIds.length) throw new Error("A section mapping must identify at least one section.");
    const originalSections = resolve(mapping.originalSectionIds, oldById, oldMapped);
    const targetSections = resolve(mapping.targetSectionIds, newById, newMapped);
    return {
      originalSections,
      targetSections,
      comparison: compareParagraphs(originalSections.map((section) => section.text).join("\n\n"), targetSections.map((section) => section.text).join("\n\n")),
    };
  });
  return {
    algorithmVersion: COMPARISON_ALGORITHM_VERSION,
    groups,
    originalUnmapped: original.filter((section) => !oldMapped.has(section.sectionId)),
    targetUnmapped: target.filter((section) => !newMapped.has(section.sectionId)),
  };
}
