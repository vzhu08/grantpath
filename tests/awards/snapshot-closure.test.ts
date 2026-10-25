import { it, expect } from "vitest";
import { fixture } from "./fixture";
import { cite } from "../../lib/evidence";
import { assembleWorksheet } from "../../lib/awards/reporting";
import { SECTION_KEYS } from "../../lib/awards/schema";
import { contentDigest } from "../../lib/awards/canonical";
import { exportAnnualReport } from "../../lib/awards/exports";

it("freezes superseded item dependencies and rejects missing semantic support even with a recomputed outer digest", () => {
  const f = fixture(); f.execute(f.initialCommand());
  const head = f.awards.records[0]!.currentConfirmedTermsVersionId;
  const makeItem = (supersedesItemId: string | null) => f.execute({ type: "saveAwardMilestone", ...f.bind(), itemId: null, expectedItemRevisionId: null,
    input: { termsVersionId: head, title: "Internal experimental milestone", description: "Researcher planning", responsibility: "Preparer",
      deadline: { kind: "unknown", raw: "", reason: "No target selected" }, evidence: [], origin: "internal", review: "proposed", applicable: true,
      supersedesItemId, goalId: "goal-A", derivation: null }, actor: "Preparer", reason: "Preserve target lineage" }).resultIds[0]!;
  const a = makeItem(null), b = makeItem(a);
  f.execute({ type: "saveAwardProgress", ...f.bind(), updateId: null, expectedProgressRevisionId: null, actor: "Preparer", reason: "Actual dated record",
    input: { termsVersionId: head, goalIds: ["goal-A"], itemIds: [b], startDate: "2026-10-01", endDate: "2026-10-01", observedDate: "2026-10-01",
      state: "completed", finding: "inconclusive", factualText: "Experiment A completed, result inconclusive", delayReason: "", recoveryPlan: "", nextPlan: "",
      evidence: [cite(f.output, f.output.versions[0]!.text)], evidenceKind: "researcher_log", correctionReason: "", allocation: null } });
  const context = f.context(), { asOfDate: _, ...inputContext } = context;
  const sections = assembleWorksheet(f.awards, f.awards.records[0]!.id, context, f.host);
  f.execute({ type: "saveAnnualReport", ...f.bind(), reportId: null, expectedReportRevisionId: null, context: inputContext,
    sections: SECTION_KEYS.map(sectionKey => ({ sectionKey, blocks: sections[sectionKey], mode: "deterministic" })), actor: "Preparer", reason: "Save bounded worksheet" });
  const report = f.awards.reports[0]!, revision = report.revisions[0]!;
  for (const sectionRevisionId of revision.sectionRevisionIds) f.execute({ type: "reviewAnnualSection", ...f.bind(), reportId: report.id, reportRevisionId: revision.id,
    sectionRevisionId, decision: "reviewed", actor: "Reviewer", reason: "Reviewed gaps and exact sources" });
  f.execute({ type: "freezeAnnualReport", ...f.bind(), reportId: report.id, reportRevisionId: revision.id, actor: "Reviewer", reason: "Immutable reviewed draft" });
  const snapshot = f.awards.reportSnapshots[0]!;
  expect(snapshot.payload.items.map(i => i.id).sort()).toEqual([a, b].sort());
  const missing = structuredClone(snapshot); missing.payload.items = missing.payload.items.filter(i => i.id !== a); missing.digest = contentDigest(missing.payload);
  expect(() => exportAnnualReport(missing, "json")).toThrow(/superseded item support/);
  const missingOutput = structuredClone(snapshot); missingOutput.payload.sources = missingOutput.payload.sources.filter(s => s.sourceId !== f.output.id); missingOutput.digest = contentDigest(missingOutput.payload);
  expect(() => exportAnnualReport(missingOutput, "md")).toThrow(/missing|another project/);
});
