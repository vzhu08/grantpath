import { MoneyFactV1Schema, type MoneyFactV1 } from "./schema";

/** Exact decimal conversion. Currency and basis must be confirmed separately. */
export function parseUsdMinorUnits(decimal: string, basis: MoneyFactV1["basis"]): string {
  if (!/^-?(?:0|[1-9]\d*)(?:\.\d{1,2})?$/.test(decimal)) throw new Error("Use an exact decimal USD amount with at most two fractional digits, without commas or exponents.");
  const negative = decimal.startsWith("-");
  const [whole, fraction = ""] = (negative ? decimal.slice(1) : decimal).split(".");
  const magnitude = (BigInt(whole!) * 100n + BigInt(fraction.padEnd(2, "0"))).toString();
  if ((negative && magnitude === "0") || magnitude.length > 18 || (negative && basis !== "current_action"))
    throw new Error("Amount exceeds the bound, is negative zero, or uses a negative total.");
  return `${negative ? "-" : ""}${magnitude}`;
}
export function formatMoneyFact(input: MoneyFactV1): string {
  const fact = MoneyFactV1Schema.parse(input);
  if (fact.value.state === "unknown") return `Unknown (${fact.value.reason})`;
  const negative = fact.value.minorUnits.startsWith("-");
  const digits = fact.value.minorUnits.replace(/^-/, "").padStart(3, "0");
  return `${negative ? "-" : ""}USD ${digits.slice(0, -2).replace(/\B(?=(\d{3})+(?!\d))/g, ",")}.${digits.slice(-2)}`;
}
