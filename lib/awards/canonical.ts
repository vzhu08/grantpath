import { createHash } from "node:crypto";

export const CANONICAL_VERSION = "sorted-json-utf8-v1" as const;
export function canonicalJson(value: unknown): string {
  if (value === null || typeof value === "string" || typeof value === "boolean") return JSON.stringify(value);
  if (typeof value === "number" && Number.isFinite(value)) return JSON.stringify(value);
  if (Array.isArray(value)) return `[${value.map(canonicalJson).join(",")}]`;
  if (typeof value === "object" && Object.getPrototypeOf(value) === Object.prototype)
    return `{${Object.keys(value).sort().map(k => `${JSON.stringify(k)}:${canonicalJson((value as Record<string, unknown>)[k])}`).join(",")}}`;
  throw new Error("Canonical payload contains an unsupported value.");
}
export const contentDigest = (value: unknown) => createHash("sha256").update(canonicalJson(value), "utf8").digest("hex");
export function boundedSnapshot(value: unknown) {
  const text = canonicalJson(value);
  if (Buffer.byteLength(text, "utf8") > 2_000_000) throw new Error("Snapshot exceeds 2 MB. Select fewer inputs; your draft is preserved.");
  return text;
}
