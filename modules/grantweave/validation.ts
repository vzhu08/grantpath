import { createHash } from "node:crypto";
import { InputSchema, SOLVER_VERSION, type Input } from "./schema";

export const ascii = (a: string, b: string) => a < b ? -1 : a > b ? 1 : 0;
// Input arrays are semantic sets; result witness arrays retain traversal order.
export function canonical(value: unknown, sortArrays = false): string {
  if (Array.isArray(value)) { const items = value.map((v) => canonical(v, sortArrays)); return `[${(sortArrays ? items.sort(ascii) : items).join(",")}]`; }
  if (value && typeof value === "object") return `{${Object.entries(value).sort(([a], [b]) => ascii(a, b)).map(([k, v]) => `${JSON.stringify(k)}:${canonical(v, sortArrays)}`).join(",")}}`;
  return JSON.stringify(value);
}
export const sha256 = (s: string) => createHash("sha256").update(s, "utf8").digest("hex");
export type Issue = { code: string; refs: string[]; detail: string };
export type Validation = { status: "invalid_model" | "needs_input"; issues: Issue[] } | { status: "ready"; input: Input; fingerprint: string };

export function validateInput(raw: unknown): Validation {
  try {
    if (Buffer.byteLength(JSON.stringify(raw), "utf8") > 2_000_000) return { status: "invalid_model", issues: [{ code: "size", refs: [], detail: "Core input exceeds 2,000,000 UTF-8 bytes" }] };
  } catch { return { status: "invalid_model", issues: [{ code: "json", refs: [], detail: "Input must be JSON serializable" }] }; }
  const parsed = InputSchema.safeParse(raw);
  if (!parsed.success) return { status: "invalid_model", issues: parsed.error.issues.map((v) => ({ code: "shape", refs: [v.path.join(".")], detail: v.message })) };
  const input = parsed.data, m = input.model;
  const invalid: Issue[] = [], missing: Issue[] = [];
  const fail = (code: string, detail: string, ...refs: string[]) => invalid.push({ code, detail, refs });
  const need = (detail: string, ...refs: string[]) => missing.push({ code: "unconfirmed_or_unknown", detail, refs });
  const unique = (values: string[], scope: string) => { if (new Set(values).size !== values.length) fail("duplicate", `Duplicate identity in ${scope}`, scope); };
  for (const key of ["sources", "claims", "packages", "costs", "funding", "effort", "resources", "existingSupport", "restrictions"] as const) unique(m[key].map((x) => x.id), key);
  unique(m.costs.map((x) => x.economicId).concat(m.existingSupport.map((x) => x.economicId)), "economic costs (new and already covered)");
  unique(m.dependencies.map((x) => x.key), "dependencies");
  unique(m.completenessClaimIds, "completeness claims");
  const packageIds = new Set(m.packages.map((x) => x.id)), fundingIds = new Set(m.funding.map((x) => x.id));
  const claims = new Map(m.claims.map((x) => [x.id, x]));
  const ref = (ids: string[], allowed: Set<string>, scope: string) => { unique(ids, scope); for (const v of ids) if (!allowed.has(v)) fail("reference", `Missing reference ${v}`, scope); };
  const claimRef = (claimId: string) => { if (!claims.has(claimId)) fail("reference", "Missing claim", claimId); };
  for (const c of m.claims) {
    const s = m.sources.find((v) => v.id === c.sourceId);
    if (!s || c.start >= c.end || c.start >= s.text.length || c.end > s.text.length || s.text.slice(c.start, c.end) !== c.quote) fail("citation", "Invalid UTF-16 source quotation", c.id);
    if (c.status === "synthetic_confirmed" && s?.kind !== "synthetic") fail("authority", "Synthetic confirmation requires synthetic source", c.id);
    if (m.label === "confirmed_assumptions" && s?.kind === "synthetic") fail("authority", "Synthetic sources require synthetic model label", c.id);
    if (c.status === "proposed" || c.status === "unknown") need("Claim requires confirmation", c.id);
  }
  for (const s of m.sources) {
    if (sha256(s.text) !== s.sha256) fail("source_digest", "Source body digest mismatch", s.id);
    if (m.label !== "synthetic" && s.kind === "synthetic") fail("authority", "Synthetic source cannot lose its label", s.id);
  }
  for (const c of m.completenessClaimIds) claimRef(c);
  for (const p of m.packages) {
    claimRef(p.claimId); ref(p.predecessors, packageIds, p.id);
    for (const [kind, demands] of [["effort", p.effort], ["resources", p.resources]] as const) {
      ref(demands.map((x) => x.capacityId), new Set(m[kind].map((x) => x.id)), `${p.id}:${kind}`);
      for (const d of demands) {
        const cap = m[kind].find((x) => x.id === d.capacityId);
        if (cap && (cap.month < p.interval.start.slice(0, 7) || cap.month > p.interval.end.slice(0, 7))) fail("demand_month", "Demand outside work interval", p.id, d.capacityId);
      }
    }
  }
  const visiting = new Set<string>(), visited = new Set<string>();
  const visit = (id: string): void => { if (visiting.has(id)) { fail("cycle", "Dependency cycle", id); return; } if (visited.has(id)) return; visiting.add(id); for (const v of m.packages.find((p) => p.id === id)?.predecessors ?? []) visit(v); visiting.delete(id); visited.add(id); };
  for (const p of m.packages) visit(p.id);
  for (const c of m.costs) {
    claimRef(c.claimId); if (!packageIds.has(c.packageId)) fail("reference", "Missing cost package", c.id);
    const p = m.packages.find((v) => v.id === c.packageId);
    if (p && (c.incurredOn < p.interval.start || c.incurredOn > p.interval.end)) fail("cost_date", "Cost outside associated activity", c.id);
  }
  for (const kind of ["effort", "resources"] as const) {
    unique(m[kind].map((x) => `${x.subjectId}:${x.month}`), kind);
    if (new Set(m[kind].map((x) => x.subjectId)).size > 6) fail("limit", `At most six ${kind} subjects`);
    for (const c of m[kind]) {
      claimRef(c.claimId); if (c.capacity === null || c.outside === null) need("Unknown work capacity or outside load", c.id);
      if (kind === "effort" && (c.unit !== "basis_points_of_month_capacity" || (c.capacity !== null && c.capacity > 10_000))) fail("effort_unit", "Effort uses at most 10,000 monthly basis points", c.id);
      if (m[kind].some((v) => v.subjectId === c.subjectId && v.unit !== c.unit)) fail("unit", "Inconsistent subject units", c.id);
    }
  }
  const months = new Set([...m.effort, ...m.resources].map((x) => x.month).concat(m.costs.map((x) => x.incurredOn.slice(0, 7))));
  if (months.size > 12) fail("limit", "At most twelve modeled months");
  for (const f of m.funding) {
    claimRef(f.claimId);
    if ((f.kind === "secured") !== (f.basis === "confirmed_eligible_residual")) fail("funding_basis", "Funding kind and amount basis disagree", f.id);
    if (f.currency === null || f.capacityCents === null || f.packageIds === null || f.categories === null || f.budgetWindow === null || f.performanceWindow === null) need("Unknown funding terms/capacity", f.id);
    if (f.packageIds) ref(f.packageIds, packageIds, f.id);
    if (f.categories) { unique(f.categories.map((x) => x.category), f.id); if (f.categories.some((x) => x.capCents === null)) need("Unknown category cap", f.id); }
    unique(f.periodCaps.map((x) => x.id), `${f.id}:periods`);
    for (const p of f.periodCaps) { claimRef(p.claimId); if (p.capCents === null) need("Unknown period cap", f.id, p.id); }
    const periods = [...f.periodCaps].sort((a, b) => ascii(a.interval.start, b.interval.start));
    for (let i = 1; i < periods.length; i++) if (periods[i].interval.start <= periods[i - 1].interval.end) fail("unsupported_period_overlap", "Overlapping period caps unsupported", f.id);
  }
  for (const s of m.existingSupport) { claimRef(s.claimId); ref(s.packageIds, packageIds, s.id); if (!fundingIds.has(s.sourceId)) fail("reference", "Missing existing support source", s.id); else if (m.funding.find((f) => f.id === s.sourceId)!.kind !== "secured") fail("support_basis", "Existing support requires a secured source", s.id); }
  for (const r of m.restrictions) {
    claimRef(r.claimId);
    if (r.kind === "scoped_support_exclusion") { ref(r.sourceIds, fundingIds, r.id); ref(r.packageIds, packageIds, r.id); }
    else { if (!fundingIds.has(r.sourceId) || !m.costs.some((c) => c.id === r.costId)) fail("reference", "Invalid disallowed cost/source", r.id); }
  }
  ref(input.branch.outcomes.map((x) => x.sourceId), new Set(m.funding.filter((x) => x.kind === "hypothetical").map((x) => x.id)), "branch");
  for (const f of m.funding.filter((x) => x.kind === "hypothetical")) if (!input.branch.outcomes.some((x) => x.sourceId === f.id)) need("Missing hypothetical outcome", f.id);
  if (invalid.length) return { status: "invalid_model", issues: invalid };
  if (missing.length) return { status: "needs_input", issues: missing };
  const normalized = InputSchema.parse(JSON.parse(canonical(input, true)));
  return { status: "ready", input: normalized, fingerprint: sha256(canonical({ input: normalized, solverVersion: SOLVER_VERSION })) };
}
