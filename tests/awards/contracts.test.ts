import { describe, it, expect } from "vitest";
import { parseUsdMinorUnits, formatMoneyFact } from "../../lib/awards/money-facts";
import { MoneyFactV1Schema, TermsPayloadSchema } from "../../lib/awards/schema";
import { awardFinanceContext } from "../../lib/awards/terms";
import { validateAwardsIntegrity } from "../../lib/awards/integrity";
import { applyAwardMutation } from "../../lib/awards/workflow";
import { newSource } from "../../lib/evidence";
import { fixture, CLOCK } from "./fixture";

describe("award-contract-v1", () => {
  it("retries initial confirmation before revision validation and keeps requested money separate", () => {
    const f = fixture(), command = f.initialCommand(), proposalBefore = JSON.stringify(f.origin);
    const a = f.execute(command, "initial-op");
    const b = f.execute(command, "initial-op", 0);
    expect(b.replayed).toBe(true); expect(b.resultIds).toEqual(a.resultIds);
    expect(f.host.revision).toBe(1); expect(f.awards.records).toHaveLength(1);
    const dto = awardFinanceContext(f.awards, a.awardId);
    expect(dto.fundingFacts[0]!.value).toMatchObject({ minorUnits: "24000000" });
    expect(f.awards.originSnapshots[0]!.payload.proposedMoneyFacts[0]!.value).toMatchObject({ minorUnits: "30000000" });
    expect(JSON.stringify(f.origin)).toBe(proposalBefore); expect(dto.sponsorLifecycle).toBe("unknown");
    expect(() => f.execute(command, "another-op")).toThrow(/already has an award/);
  });
  it("rejects changed retry content even when the outer revision is stale", () => {
    const f = fixture(), command = f.initialCommand(); f.execute(command, "same-op");
    expect(() => f.execute({ ...command, reason: "Changed" }, "same-op", 0)).toThrow(/different content/);
    expect(() => applyAwardMutation(f.awards, f.host, { operationId: "same-op", expectedRevision: 0, command, payloadHash: "false" }, { now: CLOCK, captureOrigin: () => f.origin })).toThrow();
  });
  it("uses exact signed action values, zero, and unknown without rounding or total inference", () => {
    expect(parseUsdMinorUnits("0.10", "obligated_cumulative")).toBe("10");
    expect(parseUsdMinorUnits("-100", "current_action")).toBe("-10000");
    expect(parseUsdMinorUnits("0", "anticipated_total")).toBe("0");
    for (const amount of ["-0", "-0.00", "0.001", "1e3", "10000000000000000", "01", "1,000.00"])
      expect(() => parseUsdMinorUnits(amount, "current_action")).toThrow();
    expect(() => parseUsdMinorUnits("-1", "anticipated_total")).toThrow();
    const f = fixture(), fact = structuredClone(f.terms.fundingFacts[0]!);
    fact.value = { state: "known", currency: "USD", scale: 2, minorUnits: "10" };
    expect(formatMoneyFact(fact)).toBe("USD 0.10");
    expect(MoneyFactV1Schema.safeParse({ ...fact, basis: "obligated_cumulative", value: { ...fact.value, minorUnits: "-10" } }).success).toBe(false);
    expect(TermsPayloadSchema.safeParse({ ...f.terms, fundingFacts: [{ ...fact, basis: "proposal_requested" }] }).success).toBe(false);
  });
  it("rejects forged spans and foreign-project evidence while normalized emoji/CRLF round-trips", () => {
    const good = fixture(); good.execute(good.initialCommand()); expect(good.quote.quote.includes("\r")).toBe(false);
    expect(validateAwardsIntegrity(good.awards, good.host).records).toHaveLength(1);
    const bad = fixture(), cmd = bad.initialCommand();
    if (cmd.type !== "confirmInitialAward") throw Error();
    cmd.payload.identity.evidence[0]!.start++;
    expect(() => bad.execute(cmd)).toThrow(); expect(bad.awards.records).toHaveLength(0);
    const foreign = fixture(); foreign.notice.projectId = "another-project";
    expect(() => foreign.execute(foreign.initialCommand())).toThrow(/another project/);
  });
  it("does not confirm future/unknown-effective initial notices or source replacements", () => {
    for (const date of [null, "2026-10-26"]) {
      const f = fixture(), c = f.initialCommand(); if (c.type !== "confirmInitialAward") throw Error();
      c.payload.effectiveDate = date; expect(() => f.execute(c)).toThrow(/in-force/);
    }
    const f = fixture(), c = f.initialCommand();
    const replacement = newSource({ ...f.notice, text: "Corrected synthetic notice" });
    f.notice.versions.push({ ...replacement.versions[0]!, version: 2 });
    expect(() => f.execute(c)).toThrow(/source changed|source changed|source.*changed|selected source changed/i);
  });
  it("refuses changed period intervals reusing an ID and corrupt retained digests", () => {
    const f = fixture(); f.execute(f.initialCommand());
    const corrupt = structuredClone(f.awards); corrupt.termsVersions[0]!.payload.identity.recipientName = "Changed";
    expect(() => validateAwardsIntegrity(corrupt, f.host)).toThrow(/digest/);
    const changed = structuredClone(f.terms); changed.changeKind = "numbered_amendment"; changed.sponsorActionId = "amendment";
    changed.sponsorIdentifier = "Amendment 1";
    changed.budgetPeriods[0]!.end = "2026-12-30";
    expect(() => f.execute({ type: "saveAwardChangeCandidate", ...f.bind(), expectedHeadId: f.awards.records[0]!.currentConfirmedTermsVersionId,
      payload: changed, supersedesCandidateId: null, actor: "Preparer", reason: "Changed period" })).toThrow(/new period ID/);
  });
});
