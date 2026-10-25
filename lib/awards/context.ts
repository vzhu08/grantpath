import { normalizeText } from "../../modules/documents/src/index";
import { validCitation } from "../evidence";
import type { Source } from "../schema";
import type { AwardCitation, FrozenSource, SourceVersionRef, OriginPayload } from "./schema";

export class AwardError extends Error {
  constructor(message: string, public readonly status = 400) { super(message); this.name = "AwardError"; }
}
export function requireAward(condition: unknown, message: string, status = 400): asserts condition {
  if (!condition) throw new AwardError(message, status);
}
export type AwardHost = {
  revision: number;
  sources: Source[];
  applications: { id: string; projectId: string; revision: number; provenance: "demo" | "researcher" }[];
  projects: { id: string; revision: number }[];
};
export function collectCitations(value: unknown): AwardCitation[] {
  if (!value || typeof value !== "object") return [];
  if (Array.isArray(value)) return value.flatMap(collectCitations);
  const r = value as Record<string, unknown>;
  if (typeof r.sourceId === "string" && typeof r.quote === "string" && typeof r.start === "number") return [r as AwardCitation];
  return Object.values(r).flatMap(collectCitations);
}
export function collectSourceRefs(value: unknown): SourceVersionRef[] {
  if (!value || typeof value !== "object") return [];
  if (Array.isArray(value)) return value.flatMap(collectSourceRefs);
  const r = value as Record<string, unknown>;
  const own = typeof r.sourceId === "string" && typeof r.version === "number" && typeof r.hash === "string"
    ? [{ sourceId: r.sourceId, version: r.version, hash: r.hash, role: typeof r.role === "string" ? r.role : "quoted evidence" } as SourceVersionRef] : [];
  return own.concat(Object.values(r).flatMap(collectSourceRefs));
}
export const refKey = (r: Pick<SourceVersionRef, "sourceId" | "version" | "hash">) => `${r.sourceId}:${r.version}:${r.hash}`;
export function validateSourceRef(ref: SourceVersionRef, host: AwardHost, projectId: string, allowedGlobal: readonly string[] = [], latestRequired = false) {
  const source = host.sources.find(s => s.id === ref.sourceId);
  requireAward(source && (source.projectId === projectId || (source.projectId === null && allowedGlobal.includes(source.id))), "Evidence belongs to another project or is missing.");
  const version = source.versions.find(v => v.version === ref.version);
  requireAward(version && version.hash === ref.hash, "The selected source version/hash is unavailable.");
  const normalized = normalizeText({ id: source.id, filename: `${source.title}.txt`, text: version.text });
  requireAward(normalized.text === version.text && normalized.hash === version.hash, "Stored normalized evidence is corrupt; preserve storage and repair it.");
  if (latestRequired) requireAward(source.versions.at(-1)?.version === ref.version, "A source changed after selection. Your editor is preserved; review the newer source before retrying.", 409);
  return { source, version };
}
export function validateEvidence(value: unknown, host: AwardHost, projectId: string, allowedGlobal: readonly string[] = []) {
  for (const ref of collectSourceRefs(value)) validateSourceRef(ref, host, projectId, allowedGlobal);
  for (const citation of collectCitations(value)) {
    validateSourceRef({ ...citation, role: "quote" }, host, projectId, allowedGlobal);
    requireAward(validCitation(citation, host.sources), "The quote, hash or normalized UTF-16 offsets do not match the selected evidence.");
  }
}
export function freezeSources(value: unknown, host: AwardHost, projectId: string, allowedGlobal: readonly string[] = []): FrozenSource[] {
  const seen = new Set<string>();
  return collectSourceRefs(value).filter(r => !seen.has(refKey(r)) && !!seen.add(refKey(r))).map(ref => {
    const { source, version } = validateSourceRef(ref, host, projectId, allowedGlobal);
    return { ...ref, projectId: source.projectId, title: source.title, provenance: source.provenance, text: version.text };
  });
}
export function frozenHost(sources: FrozenSource[], projectId: string): AwardHost {
  const grouped = new Map<string, Source>();
  for (const s of sources) {
    const source = grouped.get(s.sourceId) ?? { id: s.sourceId, projectId: s.projectId, title: s.title, provenance: s.provenance,
      type: "other", url: "", createdAt: "", updatedAt: "", versions: [] };
    const existing = source.versions.find(v => v.version === s.version);
    requireAward(!existing || existing.hash === s.hash && existing.text === s.text, "Frozen source versions conflict.");
    if (!existing) source.versions.push({ version: s.version, hash: s.hash, text: s.text, createdAt: "" });
    source.versions.sort((a, b) => a.version - b.version);
    grouped.set(s.sourceId, source);
  }
  return { revision: 0, sources: [...grouped.values()], projects: [{ id: projectId, revision: 1 }], applications: [] };
}
export const originGlobalSources = (p: OriginPayload) => p.sources.filter(s => s.projectId === null).map(s => s.sourceId);
