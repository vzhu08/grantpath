import { createHash } from "node:crypto";

/** aimfit-json-v1: ordinal object keys; safe integer counters; decimals are strings. */
export function canonicalJson(value: unknown): string {
  if (value === null || typeof value === "string" || typeof value === "boolean") return JSON.stringify(value);
  if (typeof value === "number" && Number.isSafeInteger(value) && !Object.is(value, -0)) return String(value);
  if (Array.isArray(value)) {
    const keys = Object.keys(value);
    if (keys.length !== value.length || !keys.every((key,i) => key === String(i)) || Object.getOwnPropertySymbols(value).length) throw new Error("Sparse/extended arrays are not JSON input");
    return `[${value.map(canonicalJson).join(",")}]`;
  }
  if (typeof value === "object" && Object.getPrototypeOf(value) === Object.prototype) {
    if (Object.getOwnPropertySymbols(value).length) throw new Error("Symbol keys are not JSON input");
    return `{${Object.keys(value).sort().map(k => `${JSON.stringify(k)}:${canonicalJson((value as Record<string, unknown>)[k])}`).join(",")}}`;
  }
  throw new Error("aimfit-json-v1 rejects undefined, fractional numbers and non-JSON values");
}
export function digest(value: unknown): string { return createHash("sha256").update(canonicalJson(value), "utf8").digest("hex"); }
export function clone<T>(value: T): T { return JSON.parse(canonicalJson(value)) as T; }
export function deepFreeze<T>(value: T): Readonly<T> {
  if (value && typeof value === "object") { Object.values(value).forEach(deepFreeze); Object.freeze(value); }
  return value;
}
export function decimalFraction(value: string): [bigint, bigint] {
  const [whole, part = ""] = value.split(".");
  return [BigInt(whole + part), 10n ** BigInt(part.length)];
}
/** Explicit normalization helper; callers retain the original upstream payload/hash separately. */
export function normalizeDecimal(value: string): string {
  if (!/^(0|[1-9]\d*)(\.\d+)?$/.test(value)) throw new Error("Expected a nonnegative plain decimal");
  return value.includes(".") ? value.replace(/0+$/, "").replace(/\.$/, "") : value;
}
