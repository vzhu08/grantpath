import { type ProposalDocument } from "./rendering";
export const fidelityFixture: ProposalDocument = {
  blocks: [
    {
      type: "heading",
      level: 1,
      text: "Research proposal renderer verification",
    },
    {
      type: "paragraph",
      text: "This synthetic document tests narrative export fidelity. It contains no real research results or funding commitment. [MISSING: researcher-confirmed study size] remains visible.",
    },
    { type: "heading", level: 2, text: "Proposed methods" },
    {
      type: "list",
      ordered: false,
      items: [
        "Compare paired sensor and laboratory reference measurements.",
        "Keep uncertainty and missing inputs explicit.",
      ],
    },
    {
      type: "list",
      ordered: true,
      items: [
        "Confirm site access before proposed sampling.",
        "Review resulting measurements without assuming favorable findings.",
      ],
    },
    {
      type: "table",
      headers: ["Activity", "Status", "Evidence"],
      rows: [
        ["Calibration comparison", "Proposed", "Methods note v1"],
        ["Pilot results", "Unknown", "[MISSING: actual measurements]"],
        ["Unicode units", "μg/L, ± 0.5 °C", "Café naïve β"],
      ],
    },
    { type: "heading", level: 2, text: "Broader Impacts" },
    {
      type: "paragraph",
      text: "The synthetic project may support more accessible environmental measurement. This statement is proposed impact, not a demonstrated outcome.",
    },
    {
      type: "list",
      ordered: true,
      items: [
        "This separate ordered list must restart at one.",
        "Its second item must be numbered two.",
      ],
    },
  ],
};
export const overflowFixture: ProposalDocument = {
  blocks: [
    { type: "heading", level: 1, text: "Intentional summary page overflow" },
    ...Array.from({ length: 24 }, (_, i) => ({
      type: "paragraph" as const,
      text: `Paragraph ${i + 1}. The proposed project will evaluate measurement reliability under documented assumptions. This repeated synthetic prose intentionally exceeds a one-page component limit. The renderer must report the actual excess without shrinking the font, truncating content or hiding the unresolved input [MISSING: study size].`,
    })),
  ],
};
export const tableFixture: ProposalDocument = {
  blocks: [
    { type: "heading", level: 1, text: "Table pagination verification" },
    {
      type: "paragraph",
      text: "Synthetic repeated records verify repeated headers, expanded row heights and the final row.",
    },
    {
      type: "table",
      headers: ["Record", "Proposed action", "Unresolved input"],
      rows: Array.from({ length: 28 }, (_, i) => [
        String(i + 1),
        `Review measurement site ${i + 1} and the proposed calibration procedure.`,
        i === 27
          ? "FINAL ROW PRESERVED [MISSING: access confirmation]"
          : "Site access remains unknown.",
      ]),
    },
  ],
};
