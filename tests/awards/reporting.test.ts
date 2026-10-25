import { describe, it, expect } from "vitest";
import { cite, newSource } from "../../lib/evidence";
import { assembleWorksheet, blockIssues, currentReportDifferences, sectionFingerprint } from "../../lib/awards/reporting";
import { performanceIssues } from "../../lib/awards/progress";
import { exportAnnualReport } from "../../lib/awards/exports";
import { validateAwardsIntegrity, assertAwardResetSafe } from "../../lib/awards/integrity";
import { proposedAnnualTarget } from "../../lib/awards/agenda";
import { contentDigest } from "../../lib/awards/canonical";
import { SECTION_KEYS, type ProgressRevision } from "../../lib/awards/schema";
import { reportReviewProblems } from "../../lib/awards/freshness";
import { fixture, CLOCK } from "./fixture";

function withProgress() {
  const f = fixture(); f.execute(f.initialCommand());
  const progress = (state: ProgressRevision["state"], goal: string, finding: ProgressRevision["finding"]) => ({
    termsVersionId: f.awards.records[0]!.currentConfirmedTermsVersionId, goalIds: [goal], itemIds: [],
    startDate: "2026-10-01", endDate: "2026-10-01", observedDate: "2026-10-01", state, finding,
    factualText: state === "completed" ? "Experiment A completed; result inconclusive." : "Experiment B has not finished.",
    delayReason: state === "delayed" ? "Supplies missing." : "", recoveryPlan: state === "delayed" ? "Repeat next month." : "",
    nextPlan: "", evidence: [cite(f.output, f.output.versions[0]!.text)], evidenceKind: "researcher_log" as const, correctionReason: "", allocation: null,
  });
  f.execute({ type: "saveAwardProgress", ...f.bind(), updateId: null, expectedProgressRevisionId: null,
    input: progress("completed", "goal-A", "inconclusive"), actor: "Preparer", reason: "Actual log reviewed" });
  f.execute({ type: "saveAwardProgress", ...f.bind(), updateId: null, expectedProgressRevisionId: null,
    input: progress("delayed", "goal-B", "none_reported"), actor: "Preparer", reason: "Delay retained" });
  return { f, progress };
}

describe("honest annual narrative worksheet", () => {
  it("allows an explicitly reviewed historical source but blocks a subsequent unreviewed version", () => {
    const f = fixture(); f.execute(f.initialCommand()); const context = f.context(), revised = newSource({ ...f.output, text: f.output.versions[0]!.text + " Reviewed correction." });
    f.output.versions.push({ ...revised.versions[0]!, version: 2 });
    expect(reportReviewProblems(f.awards, f.awards.records[0]!.id, context, f.host.sources).length).toBe(1);
    context.historicalSourceReviews = [{ sourceId: f.output.id, version: 1, latestVersion: 2, actor: "Reviewer", reason: "Inspected the correction; this historical claim remains supported." }];
    expect(reportReviewProblems(f.awards, f.awards.records[0]!.id, context, f.host.sources)).toHaveLength(0);
    f.output.versions.push({ ...revised.versions[0]!, version: 3 });
    expect(reportReviewProblems(f.awards, f.awards.records[0]!.id, context, f.host.sources).length).toBe(1);
  });
  it("keeps completed/inconclusive work, delayed work, plans and missing goals distinct", () => {
    const { f } = withProgress(), sections = assembleWorksheet(f.awards, f.awards.records[0]!.id, f.context(), f.host);
    expect(sections.accomplishments.some(b => b.claimKind === "actual_result" && b.text.includes("inconclusive"))).toBe(true);
    expect(sections.changes.some(b => b.claimKind === "delay")).toBe(true);
    expect(sections.accomplishments.some(b => b.claimKind === "future_plan")).toBe(true);
    expect(sections.accomplishments.some(b => b.text.includes("No actual progress update for goal: Run experiment C"))).toBe(true);
    expect(sections.products).toHaveLength(0); expect(sections.special).toHaveLength(0);
    const forged = { blockId: "unsupported", text: "All three experiments succeeded", claimKind: "actual_result" as const,
      supportRefs: [{ kind: "source_quote" as const, citation: f.quote }] };
    expect(blockIssues(forged, f.context(), f.awards.records[0]!.id, f.awards, f.host).some(i => i.includes("Actual claims require"))).toBe(true);
  });
  it("excludes undated, future, out-of-period and unallocated boundary-spanning actuals", () => {
    const { f } = withProgress(), original = f.awards.progressUpdates[0]!.revisions[0]!, context = f.context();
    expect(performanceIssues(original, context, true)).toHaveLength(0);
    expect(performanceIssues({ ...original, endDate: null, observedDate: null }, context).some(i => i.includes("missing"))).toBe(true);
    expect(performanceIssues({ ...original, endDate: "2026-11-01", observedDate: "2026-11-01" }, context).some(i => i.includes("later"))).toBe(true);
    expect(performanceIssues({ ...original, startDate: "2025-12-20" }, context).some(i => i.includes("boundary"))).toBe(true);
    expect(performanceIssues({ ...original, startDate: "2025-12-20", allocation: { periodId: "period-1", text: "Only work observed on Oct1", reason: "Reviewed allocation", actor: "Preparer", at: CLOCK.toISOString() } }, context)).toHaveLength(0);
  });
  it("uses only explicitly allocated period narrative and excludes old/future delays", () => {
    const { f } = withProgress(), awards = structuredClone(f.awards), context = f.context();
    const p = awards.progressUpdates[0]!.revisions[0]!;
    p.startDate = "2025-12-20"; p.factualText = "Last year: three experiments succeeded. This year: one inconclusive experiment.";
    p.allocation = { periodId: "period-1", text: "This year: one inconclusive experiment.", reason: "Explicit period allocation", actor: "Preparer", at: CLOCK.toISOString() };
    let sections = assembleWorksheet(awards, awards.records[0]!.id, context, f.host);
    expect(sections.accomplishments.filter(b => b.claimKind === "actual_result").every(b => !b.text.includes("Last year"))).toBe(true);
    expect(sections.accomplishments.some(b => b.claimKind === "actual_result" && b.text.includes(p.allocation!.text))).toBe(true);
    const delayed = awards.progressUpdates[1]!.revisions[0]!;
    for (const date of ["2025-12-20", "2026-11-01"]) {
      delayed.startDate = date; delayed.endDate = date; delayed.observedDate = date;
      sections = assembleWorksheet(awards, awards.records[0]!.id, context, f.host);
      expect(sections.changes.some(b => b.claimKind === "delay")).toBe(false);
      expect(sections.accomplishments.some(b => b.claimKind === "future_plan")).toBe(true);
    }
  });
  it("freezes exact reviewed inputs, exports identical old content, flags corrected progress and survives serialization", () => {
    const { f } = withProgress(), context = f.context(), sections = assembleWorksheet(f.awards, f.awards.records[0]!.id, context, f.host);
    const { asOfDate: _, ...inputContext } = context;
    const result = f.execute({ type: "saveAnnualReport", ...f.bind(), reportId: null, expectedReportRevisionId: null, context: inputContext,
      sections: SECTION_KEYS.map(sectionKey => ({ sectionKey, blocks: sections[sectionKey], mode: "deterministic" })), actor: "Preparer", reason: "Save honest worksheet" });
    const [reportId, reportRevisionId] = result.resultIds;
    const revision = f.awards.reports[0]!.revisions[0]!;
    expect(() => f.execute({ type: "freezeAnnualReport", ...f.bind(), reportId: reportId!, reportRevisionId: reportRevisionId!, actor: "Reviewer", reason: "Too early" })).toThrow(/Review every section/);
    for (const sectionRevisionId of revision.sectionRevisionIds) f.execute({ type: "reviewAnnualSection", ...f.bind(), reportId: reportId!, reportRevisionId: reportRevisionId!, sectionRevisionId,
      decision: "reviewed", actor: "Reviewer", reason: "Reviewed exact text and visible missing inputs" });
    const freezeCommand = { type: "freezeAnnualReport" as const, ...f.bind(), reportId: reportId!, reportRevisionId: reportRevisionId!, actor: "Reviewer", reason: "Freeze draft with gaps" };
    const frozen = f.execute(freezeCommand, "freeze-op");
    const snapshot = f.awards.reportSnapshots[0]!, oldMd = exportAnnualReport(snapshot, "md"), oldJson = exportAnnualReport(snapshot, "json");
    expect(oldMd.content.includes("Reviewed draft with gaps")).toBe(true);
    expect(oldMd.content.includes("internalEvidenceAppendix")).toBe(false);
    const update = f.awards.progressUpdates[0]!, { id: _id, ordinal: _ordinal, author: _author, at: _at, ...input } = update.revisions[0]!;
    f.execute({ type: "saveAwardProgress", ...f.bind(), updateId: update.id, expectedProgressRevisionId: update.revisions[0]!.id,
      input: { ...input, factualText: "Correction: inconclusive; no positive finding", correctionReason: "Corrected wording" }, actor: "Preparer", reason: "Correction retains history" });
    expect(currentReportDifferences(f.awards, reportId!, f.host).some(i => i.includes("corrected"))).toBe(true);
    expect(f.execute(freezeCommand, "freeze-op", 0).resultIds).toEqual(frozen.resultIds);
    expect(f.awards.reportSnapshots).toHaveLength(1);
    expect(exportAnnualReport(snapshot, "md")).toEqual(oldMd); expect(exportAnnualReport(snapshot, "json")).toEqual(oldJson);
    const restarted = validateAwardsIntegrity(JSON.parse(JSON.stringify(f.awards)), f.host);
    expect(restarted.reportSnapshots[0]!.digest).toBe(contentDigest(snapshot.payload));
    expect(() => exportAnnualReport(snapshot, "../../secrets")).toThrow(/md or json/);
    expect(() => assertAwardResetSafe(restarted, [f.output.id], [])).toThrow(/evidence referenced/);
    const corrupt = structuredClone(snapshot); corrupt.payload.sections[0]!.text = "Forged";
    expect(() => exportAnnualReport(corrupt, "md")).toThrow();
    const badRef = structuredClone(snapshot);
    const goalBlock = badRef.payload.sections[0]!.blocks.find(b => b.claimKind === "approved_goal")!;
    goalBlock.supportRefs = [{ kind: "approved_goal", awardId: snapshot.awardId, termsVersionId: context.termsVersionId, goalId: "missing-goal" }];
    for (const s of badRef.payload.sections) for (const review of badRef.payload.reviews.filter(r => r.sectionRevisionId === s.id)) review.fingerprint = sectionFingerprint(badRef.payload.reportRevision, s);
    badRef.digest = contentDigest(badRef.payload);
    expect(() => exportAnnualReport(badRef, "json")).toThrow(/goal block/);
  });
  it("preserves unknown cutoff and calculates proposed targets with calendar arithmetic", () => {
    const f = fixture();
    expect(proposedAnnualTarget({ id: "year", start: "2026-10-01", end: "2027-09-30" }, [f.quote])).toMatchObject({ proposedDate: "2027-07-02", confirmed: false });
    expect(proposedAnnualTarget({ id: "leap", start: "2027-03-01", end: "2028-02-29" }, [f.quote]).proposedDate).toBe("2027-12-01");
  });
});
