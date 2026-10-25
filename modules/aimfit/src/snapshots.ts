import { z } from "zod";
import { AssumptionSet, EngineIdentity, FailureCode, RevisionCopy, proposalDependency, type AimFitInput, type NumericResult } from "./contracts";
import { canonicalJson, clone, deepFreeze, digest } from "./canonical";
import { planAimFit, isComputedPlan, type Plan } from "./planning";

const hash = z.string().regex(/^[a-f0-9]{64}$/);
const id = z.string().regex(/^[A-Za-z0-9_-]{1,100}$/);
const literalText = z.string().min(1).max(20000);
export type RunSnapshot = { version: "aimfit-run-v1"; content: Plan; sha256: string };
export function freezeRun(plan: Readonly<Plan>): Readonly<RunSnapshot> {
  if (!isComputedPlan(plan)) throw new Error("Freeze requires a computed or reopened plan");
  const content = clone(plan);
  if (digest(AssumptionSet.parse(content.input)) !== content.inputDigest) throw new Error("Input digest mismatch");
  if (Buffer.byteLength(canonicalJson(content),"utf8") > 131072) throw new Error("Run capacity exceeded");
  return deepFreeze({ version: "aimfit-run-v1",content,sha256: digest(content) });
}
/** Integrity validation, not authority/scientific validation. No runtime needed to reopen a run. */
export async function readRun(raw: unknown): Promise<Readonly<RunSnapshot>> {
  const envelope = z.object({ version: z.literal("aimfit-run-v1"),content: z.unknown(),sha256: hash }).strict().parse(raw);
  if (digest(envelope.content) !== envelope.sha256) throw new Error("Corrupt run digest");
  const saved = envelope.content as Plan;
  const input = AssumptionSet.parse(saved.input);
  const result: NumericResult | null = saved.engine ? { version: "aimfit-numeric-v1",engine: saved.engine,
    scenarios: saved.scenarios.filter(s => s.search !== null).map(s => ({ id: s.id,search: s.search!,points: s.candidates.filter(c => c.numerical !== null).map(c => c.numerical!) })) } : null;
  const failure = saved.numericalFailure === null ? null : FailureCode.parse(saved.numericalFailure);
  const derived = await planAimFit(input,result ? { async calculate() { return { status: "computed_unverified",result }; } } : failure ? { async calculate() { return { status: "unavailable",code: failure }; } } : undefined);
  if (canonicalJson(derived) !== canonicalJson(saved)) throw new Error("Invalid run content");
  return freezeRun(derived);
}

export type Drift = { status: "current" | "stale" | "unresolved"; findings: { key: string; action: "recalculate" | "cost-resource-review" | "evidence-review" | "proposal-context-review" | "budget-review" | "current-head-needed" }[] };
export function currentness(run: Readonly<RunSnapshot>, currentRaw: unknown, heads: AimFitInput["dependencies"], currentEngine: NumericResult["engine"] | null | "unavailable" = "unavailable"): Drift {
  if (run.sha256 !== digest(run.content)) throw new Error("Corrupt run");
  const current = AssumptionSet.parse(currentRaw), old = run.content.input;
  if (current.projectId !== old.projectId || current.applicationId !== old.applicationId) throw new Error("Wrong project/application");
  const parsedHeads = z.array(AssumptionSet.shape.dependencies.element).max(100).parse(heads);
  if (new Set(parsedHeads.map(x => x.key)).size !== parsedHeads.length || parsedHeads.some(x => x.projectId !== old.projectId)) throw new Error("Invalid current heads");
  const findings: Drift["findings"] = [];
  if (currentEngine !== null && currentEngine !== "unavailable") EngineIdentity.parse(currentEngine);
  if (run.content.engine && currentEngine === "unavailable") findings.push({ key: "numerical-engine",action: "current-head-needed" });
  else if (run.content.engine && canonicalJson(currentEngine) !== canonicalJson(run.content.engine)) findings.push({ key: "numerical-engine",action: "recalculate" });
  if (canonicalJson(current.question) !== canonicalJson(old.question) || canonicalJson(current.variants) !== canonicalJson(old.variants)) findings.push({ key: "question-or-variants",action: "recalculate" });
  if (canonicalJson(current.proposalRevisions) !== canonicalJson(old.proposalRevisions)) findings.push({ key: "proposal-revisions",action: "proposal-context-review" });
  if (current.family !== old.family) findings.push({ key: "family",action: "recalculate" });
  if (current.scenarios.length !== old.scenarios.length || current.scenarios.some(s => !old.scenarios.some(o => o.id === s.id))) findings.push({ key: "scenario-set",action: "recalculate" });
  for (const o of old.scenarios) {
    const n = current.scenarios.find(s => s.id === o.id); if (!n) continue;
    if (canonicalJson(n.numerical) !== canonicalJson(o.numerical)) findings.push({ key: `${o.id}:numerical`,action: "recalculate" });
    for (const key of ["costs","ceiling","resourceLimit","timeline","attritionBps"] as const) if (canonicalJson(n[key]) !== canonicalJson(o[key])) findings.push({ key: `${o.id}:${key}`,action: "cost-resource-review" });
  }
  for (const dep of old.dependencies) {
    const now = parsedHeads.find(x => x.key === dep.key);
    if (!now) findings.push({ key: dep.key,action: "current-head-needed" });
    else if (canonicalJson(dep) !== canonicalJson(now)) findings.push({ key: dep.key,action: ({ science: "recalculate",cost: "cost-resource-review",evidence: "evidence-review",proposal: "proposal-context-review",budget: "budget-review" } as const)[dep.kind] });
  }
  if (canonicalJson(current.dependencies) !== canonicalJson(old.dependencies) && !findings.length) findings.push({ key: "dependency-set",action: "evidence-review" });
  return { status: findings.some(x => x.action !== "current-head-needed") ? "stale" : findings.length ? "unresolved" : "current",findings };
}

export function claimChange(run: Readonly<RunSnapshot>, scenarioId: string, candidateId: string) {
  const scenario = run.content.scenarios.find(s => s.id === scenarioId), selected = scenario?.candidates.find(c => c.id === candidateId);
  if (!selected) throw new Error("Unknown candidate");
  const assumptions = run.content.input.scenarios.find(s => s.id === scenarioId)!;
  const shortfalls = (["affordability","resource","timeline","power","nominalWidth"] as const).filter(k => selected[k] === "unmet" || selected[k] === "unknown" || selected[k] === "boundary_review");
  return deepFreeze({ runDigest: run.sha256,scenarioId,candidateDigest: digest(selected),candidateId,
    originalTargetPower: assumptions.numerical.targetPower,selected: clone(selected),
    requiredAcknowledgements: ["r-reference-pending", ...shortfalls],
    permitted: ["Conditional power under the stated assumptions, explicitly R-pending", "Nominal half-width under assumed SD", "Exact hypothetical planning cost and stated exclusions"],
    forbidden: ["Scientific validity or causal identification", "Guaranteed recruitment or realized interval width", "Probability of funding or secured/allowable funds", ...(selected.power !== "met" ? ["Original target-power claim"] : [])] });
}

export const Acceptance = z.object({ version: z.literal("aimfit-accept-v1"),accepted: z.literal(true),runDigest: hash,scenarioId: id,candidateId: id,candidateDigest: hash,
  before: RevisionCopy,replacementText: literalText,acknowledged: z.array(z.string().min(1).max(100)).max(10),actor: id,acceptedAt: z.iso.datetime(),reason: z.string().min(1).max(2000) }).strict();
export type AcceptancePreview = z.infer<typeof Acceptance>;
const acceptedPreviews = new WeakSet<object>();
export const ClaimLink = z.object({ version: z.literal("aimfit-claim-link-v1"),acceptance: Acceptance,before: RevisionCopy,after: RevisionCopy,expectedActiveRevisionId: id,sha256: hash }).strict();
export function readClaimLink(raw: unknown) {
  const link = ClaimLink.parse(raw), { sha256,...content } = link;
  if (sha256 !== digest(content) || canonicalJson(link.before) !== canonicalJson(link.acceptance.before) || link.expectedActiveRevisionId !== link.after.revisionId ||
    link.after.text !== link.acceptance.replacementText || link.after.revisionId === link.before.revisionId || link.after.sectionId !== link.before.sectionId ||
    link.after.projectId !== link.before.projectId || link.after.applicationId !== link.before.applicationId) throw new Error("Corrupt claim link");
  return deepFreeze(clone(link));
}
/** Pure explicit acceptance preview; creates no proposal revision, decision receipt, or host write. */
export function acceptPreview(run: Readonly<RunSnapshot>, raw: unknown, drift: Drift): Readonly<AcceptancePreview> {
  if (drift.status !== "current" || drift.findings.length) throw new Error("Current dependencies required");
  if (run.sha256 !== digest(run.content)) throw new Error("Corrupt run");
  const accepted = Acceptance.parse(raw);
  const change = claimChange(run,accepted.scenarioId,accepted.candidateId);
  if (accepted.runDigest !== run.sha256 || accepted.candidateDigest !== change.candidateDigest || accepted.before.projectId !== run.content.input.projectId || accepted.before.applicationId !== run.content.input.applicationId) throw new Error("Acceptance scope mismatch");
  if (!run.content.input.proposalRevisions.some(r => canonicalJson(r) === canonicalJson(accepted.before))) throw new Error("Before revision must match retained run context");
  if (change.selected.numericalStatus !== "computed_unverified") throw new Error("Numerical result unavailable or unsupported");
  if (new Set(accepted.acknowledged).size !== accepted.acknowledged.length || change.requiredAcknowledgements.some(k => !accepted.acknowledged.includes(k))) throw new Error("Explicit shortfall acknowledgement required");
  const preview = deepFreeze(clone(accepted)); acceptedPreviews.add(preview); return preview;
}
/** Host supplies its actually appended immutable after revision. This only binds exact copies. */
export function linkAcceptedRevision(preview: Readonly<AcceptancePreview>, rawAfter: unknown) {
  if (!acceptedPreviews.has(preview)) throw new Error("Explicit accepted preview required");
  const accepted = Acceptance.parse(preview), after = RevisionCopy.parse(rawAfter), before = accepted.before;
  if (after.projectId !== before.projectId || after.applicationId !== before.applicationId || after.sectionId !== before.sectionId || after.revisionId === before.revisionId || after.text !== accepted.replacementText) throw new Error("After revision does not match accepted preview");
  const content = { version: "aimfit-claim-link-v1" as const,acceptance: clone(accepted),before: clone(before),after: clone(after),expectedActiveRevisionId: after.revisionId };
  return readClaimLink({ ...content,sha256: digest(content) });
}
export function linkedRevisionStatus(link: ReturnType<typeof linkAcceptedRevision>, revision: z.infer<typeof RevisionCopy>): "current" | "proposal-context-review" {
  link = readClaimLink(link);
  const now = RevisionCopy.parse(revision);
  if (now.projectId !== link.after.projectId || now.applicationId !== link.after.applicationId || now.sectionId !== link.after.sectionId) throw new Error("Wrong revision scope");
  return canonicalJson(now) === canonicalJson(link.after) ? "current" : "proposal-context-review";
}
/** Reconcile the authorized after revision against the retained before copy for this one link. */
export function currentnessForLink(run: Readonly<RunSnapshot>, link: ReturnType<typeof linkAcceptedRevision>, currentRaw: unknown, heads: AimFitInput["dependencies"], engine: NumericResult["engine"] | null | "unavailable" = "unavailable"): Drift {
  link = readClaimLink(link);
  const current = AssumptionSet.parse(currentRaw);
  if (link.acceptance.runDigest !== run.sha256) throw new Error("Wrong linked run");
  const section = current.proposalRevisions.find(r => r.sectionId === link.after.sectionId);
  if (!section || linkedRevisionStatus(link,section) !== "current") return { status: "stale",findings: [{ key: "linked-proposal-revision",action: "proposal-context-review" }] };
  const normalized = clone(current);
  normalized.proposalRevisions = normalized.proposalRevisions.map(r => r.sectionId === link.after.sectionId ? clone(link.before) : r);
  const expectedAfter = proposalDependency(link.after), expectedBefore = proposalDependency(link.before);
  normalized.dependencies = normalized.dependencies.map(d => canonicalJson(d) === canonicalJson(expectedAfter) ? expectedBefore : d);
  const normalizedHeads = heads.map(d => canonicalJson(d) === canonicalJson(expectedAfter) ? expectedBefore : d);
  return currentness(run,normalized,normalizedHeads,engine);
}
export function exportRun(run: Readonly<RunSnapshot>, format: "json" | "md") {
  if (run.sha256 !== digest(run.content)) throw new Error("Corrupt run");
  if (format !== "json" && format !== "md") throw new Error("Unsupported export format");
  const encoded = canonicalJson(run);
  // JSON code block is inert preparation text. Markdown narrative never interpolates source HTML.
  const bytes = Buffer.from(format === "json" ? encoded : `# AIMFIT internal planning snapshot\n\nNonclinical conditional planning. R reference gate pending. No scientific validation.\n\n\`\`\`json\n${encoded.replace(/`/g,"\\u0060")}\n\`\`\`\n`,"utf8");
  if (bytes.length > 262144) throw new Error("Export capacity exceeded");
  return { bytes,byteLength: bytes.length,sha256: digestBytes(bytes),format };
}
import { createHash } from "node:crypto";
function digestBytes(bytes: Uint8Array): string { return createHash("sha256").update(bytes).digest("hex"); }
