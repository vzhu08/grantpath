import { newSource, cite } from "../../lib/evidence";
import { emptyAwards, type AwardsState, type OriginPayload, type TermsPayload, type ReportContext } from "../../lib/awards/schema";
import { applyAwardMutation } from "../../lib/awards/workflow";
import { type AwardHost } from "../../lib/awards/context";
import type { AwardCommand } from "../../lib/awards/commands";

export const CLOCK = new Date("2026-10-25T16:00:00Z");
export function fixture() {
  const notice = newSource({ id: "notice", projectId: "project", title: "Synthetic NSF notice", type: "other", provenance: "demo",
    text: "Synthetic notice\r\nAward: NSF-EXAMPLE-1\r\nRecipient: Example University\r\nEffective: 2026-01-01\r\nPeriod: 2026-01-01 through 2026-12-31\r\nCurrent action: USD 240000.00\r\nCumulative obligation: USD 240000.00\r\nApproved goals: Run experiments A, B and C.\r\nAnnual narrative required. 😀" });
  const output = newSource({ id: "output", projectId: "project", title: "Synthetic experiment log", type: "other", provenance: "demo",
    text: "2026-10-01: Experiment A completed. The result was inconclusive. Experiment B was delayed because supplies were missing; repeat next month. No update for experiment C." });
  const call = newSource({ id: "call-source", projectId: null, title: "Synthetic originating call", type: "call", provenance: "demo", text: "Synthetic proposal request: USD 300000.00" });
  const host: AwardHost = { revision: 0, sources: [notice, output, call], applications: [{ id: "application", projectId: "project", revision: 1, provenance: "demo" }], projects: [{ id: "project", revision: 1 }] };
  const quote = cite(notice, notice.versions[0]!.text);
  const sourceRef = { sourceId: notice.id, version: 1, hash: quote.hash, role: "notice" };
  const money = (id: string, basis: "proposal_requested" | "current_action" | "obligated_cumulative", cents: string, evidence = [quote]) => ({ id, basis,
    value: { state: "known" as const, currency: "USD" as const, scale: 2 as const, minorUnits: cents }, evidence, periodId: null,
    confirmedBy: "Synthetic preparer", confirmedAt: CLOCK.toISOString() });
  const terms: TermsPayload = {
    sponsorActionId: "initial-action", changeKind: "initial", sponsorIdentifier: "Initial notice", absenceReason: "",
    issueDate: "2026-01-01", effectiveDate: "2026-01-01", dateEvidence: [quote],
    identity: { sponsor: "NSF", instrument: "standard_grant", sponsorAwardNumber: "NSF-EXAMPLE-1", recipientName: "Example University", evidence: [quote] },
    awardPeriod: { start: "2026-01-01", end: "2026-12-31", evidence: [quote] },
    budgetPeriods: [{ id: "period-1", label: "Budget year 1", start: "2026-01-01", end: "2026-12-31", evidence: [quote], supersedesPeriodId: null }],
    goals: ["A", "B", "C"].map(x => ({ goalId: `goal-${x}`, text: `Run experiment ${x}`, citations: [quote], incorporationRef: null, predecessorGoalIds: [] })),
    fundingFacts: [money("action-money", "current_action", "24000000"), money("cumulative-money", "obligated_cumulative", "24000000")],
    approvedBudgetRefs: [], policies: [], sponsorLifecycle: { value: "unknown", evidence: [] },
    fieldEvidence: { identity: { mode: "new", citations: [quote] }, awardPeriod: { mode: "new", citations: [quote] }, budgetPeriods: { mode: "new", citations: [quote] },
      goals: { mode: "new", citations: [quote] }, fundingFacts: { mode: "new", citations: [quote] }, approvedBudgetRefs: { mode: "unknown", reason: "Approved category budget not supplied" },
      policies: { mode: "unknown", reason: "Applicable full conditions need review" }, sponsorLifecycle: { mode: "unknown", reason: "No source-backed lifecycle assertion" } },
    sourceRefs: [sourceRef], historicalSourceReviews: [], unresolved: ["Applicable conditions and approved category budget not supplied."],
  };
  const origin: OriginPayload = { version: "award-origin-v1", applicationId: "application", projectId: "project", applicationRevision: 1, projectRevision: 1,
    applicationCycleId: "initial", originAttemptId: null, submittedSnapshot: null,
    callId: "call", callRevision: 1, callSourceRef: { sourceId: call.id, version: 1, hash: call.versions[0]!.hash, role: "originating call" },
    capturedAt: CLOCK.toISOString(), provenance: "demo", sections: [], proposedMoneyFacts: [money("request", "proposal_requested", "30000000", [cite(call, call.versions[0]!.text)])],
    packet: null, submissionEvidence: { state: "unknown" }, sources: [{ sourceId: call.id, version: 1, hash: call.versions[0]!.hash, role: "originating call", projectId: null, title: call.title, provenance: "demo", text: call.versions[0]!.text }] };
  let awards: AwardsState = emptyAwards(), sequence = 0;
  const uid = (prefix: string) => `${prefix}-${++sequence}`;
  const execute = (command: AwardCommand, operationId = `op-${++sequence}`, expectedRevision = host.revision) => {
    const result = applyAwardMutation(awards, host, { operationId, expectedRevision, command }, { now: CLOCK, uid, captureOrigin: () => structuredClone(origin) });
    awards = result.awards; if (!result.replayed) host.revision++; return result;
  };
  const initialCommand = (): AwardCommand => ({ type: "confirmInitialAward", applicationId: "application", expectedApplicationRevision: 1, expectedProjectRevision: 1,
    payload: structuredClone(terms), originSelection: { draftIds: [], proposedMoneyFacts: origin.proposedMoneyFacts, packetId: null, submissionEvidence: { state: "unknown" } },
    selectInitialCurrent: true, transcriptionConfirmed: true, actor: "Synthetic preparer", reason: "Reviewed exact synthetic notice; local confirmation only" });
  const bind = () => ({ awardId: awards.records[0]!.id, expectedAwardRevision: awards.records[0]!.revision });
  const context = (): ReportContext => ({ termsVersionId: awards.records[0]!.currentConfirmedTermsVersionId,
    termsDigest: awards.termsVersions.find(t => t.id === awards.records[0]!.currentConfirmedTermsVersionId)!.digest,
    periodId: "period-1", periodStart: "2026-01-01", periodEnd: "2026-12-31", evidenceThrough: "2026-10-25", asOfDate: "2026-10-25",
    progressRefs: awards.progressUpdates.map(u => ({ updateId: u.id, revisionId: u.revisions.at(-1)!.id })),
    sourceRefs: [sourceRef, { sourceId: output.id, version: 1, hash: output.versions[0]!.hash, role: "performance" }], historicalSourceReviews: [] });
  return { host, notice, output, call, quote, terms, origin, execute, initialCommand, bind, context, get awards() { return awards; } };
}
