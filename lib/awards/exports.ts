import { ANNUAL_SECTIONS } from "./templates";
import { SECTION_KEYS, ReportSnapshotSchema } from "./schema";
import { validateFrozenReport } from "./integrity";
import { canonicalJson } from "./canonical";

export function exportAnnualReport(raw: unknown, format: string) {
  if (format !== "md" && format !== "json") throw new Error("Choose md or json.");
  const snapshot = ReportSnapshotSchema.parse(raw);
  validateFrozenReport(snapshot);
  const p = snapshot.payload, c = p.reportRevision.context;
  const terms = p.terms.find(t => t.id === c.termsVersionId)!;
  const header = ["# NSF annual narrative worksheet", "", "Local preparation worksheet · Reviewed draft with gaps",
    `Award: ${terms.payload.identity.sponsorAwardNumber}`, `Reporting budget period: ${c.periodStart} through ${c.periodEnd}`,
    `Evidence through: ${c.evidenceThrough} · As of: ${c.asOfDate}`, `Terms: ${c.termsVersionId}`, `Snapshot: ${snapshot.id}`,
    `Provenance: ${p.award.provenance === "demo" ? "Synthetic demo" : "Researcher-provided; not independently verified"}`,
    "No sponsor submission, certification or acceptance is recorded.", ""];
  const body = SECTION_KEYS.flatMap(key => {
    const s = p.sections.find(s => s.sectionKey === key)!;
    const review = p.reviews.find(r => r.sectionRevisionId === s.id)!;
    return [`## ${ANNUAL_SECTIONS[key].title}`, "", s.text || (review.decision === "nothing_to_report_confirmed" ? `Nothing to report — confirmed locally by ${review.actor}: ${review.reason}` : "[Missing narrative — reviewed draft with gaps]"), ""];
  });
  return { filename: `grantpath-annual-${snapshot.id}.${format}`, contentType: format === "md" ? "text/markdown; charset=utf-8" : "application/json; charset=utf-8",
    content: format === "md" ? [...header, ...body].join("\n") : canonicalJson({ id: snapshot.id, digest: snapshot.digest, internalEvidenceAppendix: p }), digest: snapshot.digest };
}
