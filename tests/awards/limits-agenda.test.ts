import { it, expect } from "vitest";
import { fixture } from "./fixture";
import { awardAgenda } from "../../lib/awards/agenda";
import { boundedSnapshot } from "../../lib/awards/canonical";
import { MoneyFactV1Schema } from "../../lib/awards/schema";
import type { AwardCommand } from "../../lib/awards/commands";

it("keeps confirmed agenda IDs stable and suppresses superseded obligations without deleting history", () => {
  const f = fixture(); f.execute(f.initialCommand());
  const input = { termsVersionId: f.awards.records[0]!.currentConfirmedTermsVersionId, title: "Annual narrative", description: "Quoted annual narrative preparation task",
    responsibility: "Synthetic preparer", deadline: { kind: "date" as const, raw: "2026-11-01", date: "2026-11-01", confirmed: true as const }, evidence: [f.quote],
    origin: "sponsor" as const, review: "proposed" as const, applicable: true, supersedesItemId: null as string | null, goalId: null, derivation: null };
  const add = (supersedes: string | null) => f.execute({ type: "saveAwardObligation", ...f.bind(), itemId: null, expectedItemRevisionId: null,
    input: { ...input, supersedesItemId: supersedes }, actor: "Preparer", reason: "Exact term reviewed" }).resultIds;
  const [first, firstRevision] = add(null);
  expect(awardAgenda(f.awards, "application")).toHaveLength(0);
  const confirm = (id: string, revisionId: string) => f.execute({ type: "reviewAwardObligation", ...f.bind(), itemId: id, expectedItemRevisionId: revisionId, actor: "Reviewer", reason: "Applicable date confirmed" });
  confirm(first!, firstRevision!);
  const originalId = awardAgenda(f.awards, "application")[0]!.id;
  expect(originalId).toBe(`award:${f.awards.records[0]!.id}:obligation:${first}`);
  const [second, secondRevision] = add(first!); confirm(second!, secondRevision!);
  expect(awardAgenda(f.awards, "application")).toHaveLength(1);
  expect(awardAgenda(f.awards, "application")[0]!.itemId).toBe(second);
  expect(f.awards.obligations).toHaveLength(2);
  const firstCurrent = f.awards.obligations.find(i => i.id === first)!.revisions.at(-1)!;
  const before = JSON.stringify(f.awards);
  expect(() => f.execute({ type: "saveAwardObligation", ...f.bind(), itemId: first!, expectedItemRevisionId: firstCurrent.id,
    input: { ...input, supersedesItemId: second! }, actor: "Preparer", reason: "Attempt cycle" })).toThrow(/cyclic/);
  expect(JSON.stringify(f.awards)).toBe(before);
});

it("rejects dollar-only known currency, over-limit input and Unicode snapshot bytes before mutation", () => {
  const f = fixture(), fact = structuredClone(f.terms.fundingFacts[0]!);
  fact.evidence = [{ ...f.quote, quote: "$240000.00", start: 0, end: 10 }];
  expect(MoneyFactV1Schema.safeParse(fact).success).toBe(false);
  expect(() => boundedSnapshot({ text: "😀".repeat(510_000) })).toThrow(/2 MB/);
  const command = f.initialCommand();
  expect(() => f.execute({ ...command, reason: "x".repeat(501) } as AwardCommand)).toThrow();
  expect(f.awards.receipts).toHaveLength(0); expect(f.awards.records).toHaveLength(0);
});

it("does not let fresh fact IDs relabel old action money as new funding", () => {
  const f = fixture(); f.execute(f.initialCommand());
  const payload = structuredClone(f.terms); payload.changeKind = "documented_administrative_change";
  payload.sponsorActionId = "extension-action"; payload.sponsorIdentifier = "Administrative extension";
  payload.fundingFacts[0]!.id = "fresh-id-for-old-money";
  expect(() => f.execute({ type: "saveAwardChangeCandidate", ...f.bind(), expectedHeadId: f.awards.records[0]!.currentConfirmedTermsVersionId,
    payload, supersedesCandidateId: null, actor: "Preparer", reason: "Time extension, no new funding evidence" })).toThrow(/new action support/);
});
