import { z } from "zod";
const xmlText = (limit: number) =>
  z
    .string()
    .max(limit)
    .refine((value) => {
      for (const char of value) {
        const point = char.codePointAt(0)!;
        if (!(
          point === 9 ||
          point === 10 ||
          point === 13 ||
          (point >= 32 && point <= 0xd7ff) ||
          (point >= 0xe000 && point <= 0xfffd) ||
          (point >= 0x10000 && point <= 0x10ffff)
        ))
          return false;
      }
      return true;
    }, "Text contains an XML-illegal control character or malformed Unicode. Correct it explicitly before exporting; nothing was removed.");
const plain = xmlText(20_000);
export const ProposalBlockSchema = z.discriminatedUnion("type", [
  z.object({ type: z.literal("paragraph"), text: plain }).strict(),
  z
    .object({
      type: z.literal("heading"),
      level: z.union([z.literal(1), z.literal(2), z.literal(3)]),
      text: plain.min(1),
    })
    .strict(),
  z
    .object({
      type: z.literal("list"),
      ordered: z.boolean(),
      items: z.array(plain.min(1)).min(1).max(100),
    })
    .strict(),
  z
    .object({
      type: z.literal("table"),
      headers: z.array(xmlText(2000)).min(1).max(12),
      rows: z.array(z.array(xmlText(2000)).min(1).max(12)).max(200),
    })
    .strict()
    .refine(
      (table) => table.rows.every((row) => row.length === table.headers.length),
      "Simple tables must be rectangular.",
    ),
]);
export const ProposalDocumentSchema = z
  .object({ blocks: z.array(ProposalBlockSchema).min(1).max(1000) })
  .strict()
  .refine(
    (doc) => JSON.stringify(doc).length <= 1_000_000,
    "A proposal document may contain at most 1,000,000 characters.",
  );
export type ProposalBlock = z.infer<typeof ProposalBlockSchema>;
export type ProposalDocument = z.infer<typeof ProposalDocumentSchema>;
export function visibleText(doc: ProposalDocument) {
  return doc.blocks
    .flatMap((block) =>
      block.type === "table"
        ? [...block.headers, ...block.rows.flat()]
        : block.type === "list"
          ? block.items
          : [block.text],
    )
    .join("\n");
}

export const textBlocks = (text: string): ProposalBlock[] => [
  { type: "paragraph", text },
];
