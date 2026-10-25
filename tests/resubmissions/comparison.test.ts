import { describe, expect, it } from "vitest";
import {
  COMPARISON_ALGORITHM_VERSION,
  compareParagraphs,
  compareSections,
  paragraphSpans,
} from "../../lib/resubmissions/comparison";

describe("resubmission paragraph comparison", () => {
  it("aligns exact paragraphs and keeps changes, additions and removals", () => {
    const result = compareParagraphs("Old\n\nAnchor\n\nRemoved\n\nEnd", "New\n\nAnchor\n\nEnd\n\nAdded");
    expect(result.runs.map((run) => run.kind)).toEqual(["changed", "unchanged", "removed", "unchanged", "added"]);
    expect(result.runs[0]!.original[0]!.text).toBe("Old");
    expect(result.runs[0]!.target[0]!.text).toBe("New");
    expect(result.algorithmVersion).toBe(COMPARISON_ALGORITHM_VERSION);
    expect(result.fallback).toBe(false);
  });

  it("keeps UTF-16 offsets after canonical BOM/newline normalization", () => {
    const result = compareParagraphs("\uFEFF😀 first\r\nline\r\n \r\nSecond\rThird", "😀 first\nline\n\nChanged");
    expect(result.originalText).toBe("😀 first\nline\n \nSecond\nThird");
    for (const paragraph of result.originalParagraphs) {
      expect(result.originalText.slice(paragraph.start, paragraph.end)).toBe(paragraph.text);
    }
    expect(result.originalParagraphs[1]!.start).toBe("😀 first\nline\n \n".length);
    expect(result.originalParagraphs[0]!.end).toBe(13);
  });

  it("retains all full-text whitespace while exposing nonempty paragraphs", () => {
    const text = "\n\n  First  \nline\n\t\n\nSecond\n\n\n";
    const result = compareParagraphs(text, text);
    expect(result.originalText).toBe(text);
    expect(result.targetText).toBe(text);
    expect(result.runs).toHaveLength(1);
    expect(result.runs[0]!.kind).toBe("unchanged");
    expect(paragraphSpans(" \n\n\t\n")).toEqual([]);
  });

  it("treats within-paragraph whitespace changes as changes", () => {
    expect(compareParagraphs("Keep  spaces", "Keep spaces").runs[0]!.kind).toBe("changed");
    expect(compareParagraphs("a\nb", "a b").runs[0]!.kind).toBe("changed");
  });

  it("is stable for repeated identical paragraphs and tie alignments", () => {
    const expected = compareParagraphs("A\n\nB\n\nA", "A\n\nA\n\nB");
    for (let run = 0; run < 5; run++) expect(compareParagraphs("A\n\nB\n\nA", "A\n\nA\n\nB")).toEqual(expected);
    expect(expected.runs.map((run) => run.kind)).toEqual(["unchanged", "removed", "unchanged", "added"]);
    expect(expected.runs[2]!.original[0]!.start).toBe(6);
    expect(expected.runs[2]!.target[0]!.start).toBe(3);
  });

  it("handles empty sides and keeps hostile text as inert strings", () => {
    expect(compareParagraphs("", "").runs).toEqual([]);
    expect(compareParagraphs("old", "").runs[0]!.kind).toBe("removed");
    const text = "<script>alert(1)</script>\n\n![remote](https://example.invalid/x)";
    const result = compareParagraphs("", text);
    expect(result.runs[0]!.kind).toBe("added");
    expect(result.targetText).toBe(text);
  });

  it("includes every paragraph exactly once in a non-fallback alignment", () => {
    const result = compareParagraphs("A\n\nB\n\nC\n\nD", "B\n\nX\n\nD\n\nE");
    expect(result.runs.flatMap((run) => run.original)).toEqual(result.originalParagraphs);
    expect(result.runs.flatMap((run) => run.target)).toEqual(result.targetParagraphs);
  });

  it("allows the cap exactly and falls back above it without losing text", () => {
    const fiveHundred = Array.from({ length: 500 }, (_, i) => `paragraph ${i}`).join("\n\n");
    const exact = compareParagraphs(fiveHundred, fiveHundred);
    expect(exact.fallback).toBe(false);
    expect(exact.runs[0]!.original).toHaveLength(500);
    const oversized = fiveHundred + "\n\nlast 😀";
    const result = compareParagraphs(oversized, fiveHundred);
    expect(result.fallback).toBe(true);
    expect(result.notice).toContain("complete original and target");
    expect(result.runs).toEqual([]);
    expect(result.originalText).toBe(oversized);
    expect(result.targetText).toBe(fiveHundred);
    expect(result.originalParagraphs).toHaveLength(501);
  });
});

describe("resubmission explicit section mappings", () => {
  const section = (sectionId: string, label: string, text: string) => ({ sectionId, label, text, revisionId: `rev_${sectionId}` });

  it("uses stable IDs for renamed, split and combined sections and shows unmapped sides", () => {
    const original = [section("old", "Old name", "A\n\nB"), section("unmapped_old", "Appendix", "O")];
    const target = [section("new_b", "Renamed second", "B"), section("new_a", "Renamed first", "A"), section("unmapped_new", "New section", "N")];
    const result = compareSections(original, target, [{ originalSectionIds: ["old"], targetSectionIds: ["new_a", "new_b"] }]);
    expect(result.groups[0]!.comparison.runs[0]!.kind).toBe("unchanged");
    expect(result.groups[0]!.targetSections.map((s) => s.sectionId)).toEqual(["new_a", "new_b"]);
    expect(result.originalUnmapped.map((s) => s.sectionId)).toEqual(["unmapped_old"]);
    expect(result.targetUnmapped.map((s) => s.sectionId)).toEqual(["unmapped_new"]);
    expect(result.groups[0]!.originalSections[0]!.revisionId).toBe("rev_old");
    const combined = compareSections(target, original, [{ originalSectionIds: ["new_a", "new_b"], targetSectionIds: ["old"] }]);
    expect(combined.groups[0]!.comparison.runs[0]!.kind).toBe("unchanged");
  });

  it("does not infer mappings from label or array position", () => {
    const result = compareSections([section("old", "Same label", "A")], [section("new", "Same label", "B")], []);
    expect(result.groups).toEqual([]);
    expect(result.originalUnmapped).toHaveLength(1);
    expect(result.targetUnmapped).toHaveLength(1);
  });

  it("supports explicit one-sided mappings and rejects unavailable/ambiguous IDs", () => {
    const sections = [section("a", "A", "A")];
    expect(compareSections(sections, [], [{ originalSectionIds: ["a"], targetSectionIds: [] }]).groups[0]!.comparison.runs[0]!.kind).toBe("removed");
    expect(() => compareSections(sections, [], [{ originalSectionIds: ["missing"], targetSectionIds: [] }])).toThrow("unavailable");
    expect(() => compareSections([...sections, ...sections], [], [])).toThrow("unique");
    expect(() => compareSections(sections, [], [{ originalSectionIds: ["a", "a"], targetSectionIds: [] }])).toThrow("repeat");
    expect(() => compareSections(sections, [], [{ originalSectionIds: [], targetSectionIds: [] }])).toThrow("at least one");
  });
});
