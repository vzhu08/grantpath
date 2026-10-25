import { afterEach, describe, expect, it, vi } from "vitest";
import { mkdir, mkdtemp, readFile, readdir, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import { createAwardDemoWorkspace } from "../../lib/awards/demo";
import { applyCommand, createRepository } from "../../lib/repository";
import { captureOrigin } from "../../lib/awards/identity";
import { exportAnnualReport } from "../../lib/awards/exports";
import { currentReportDifferences } from "../../lib/awards/reporting";

const faults = vi.hoisted(() => ({ rename: false, write: false }));
vi.mock("node:fs/promises", async importOriginal => {
  const actual = await importOriginal<typeof import("node:fs/promises")>();
  return { ...actual,
    rename: async (from: string, to: string) => { if (faults.rename && String(from).includes(".workspace-")) throw Object.assign(new Error("Synthetic rename failure"), { code: "EIO" }); return actual.rename(from, to); },
    open: async (...args: Parameters<typeof actual.open>) => {
      const handle = await actual.open(...args);
      if (faults.write && String(args[0]).includes(".workspace-")) return new Proxy(handle, { get(target, property) {
        if (property === "writeFile") return async () => { throw Object.assign(new Error("Synthetic write failure"), { code: "EIO" }); };
        const value = Reflect.get(target, property); return typeof value === "function" ? value.bind(target) : value;
      } });
      return handle;
    },
  };
});
const root = path.resolve(".test-data/awards-repository"), directories: string[] = [];
async function directory() { await mkdir(root, { recursive: true }); const dir = await mkdtemp(path.join(root, "case-")); directories.push(dir); return dir; }
afterEach(async () => { faults.rename = false; faults.write = false; for (const dir of directories.splice(0)) { if (!path.resolve(dir).startsWith(root + path.sep)) throw Error("Refusing cleanup outside award test data."); await rm(dir, { recursive: true, force: true }); } });

describe("integrated award storage, origin and restart", { timeout: 30_000 }, () => {
  it("migrates actual schema4 with exact backup and preserves proposal/submitted/response frozen history", async () => {
    const fixture = createAwardDemoWorkspace(false);
    const withPacket = applyCommand(fixture.state, { expectedRevision: fixture.state.revision, command: { type: "freezePacket", applicationId: fixture.applicationId } }).state;
    const old = JSON.parse(JSON.stringify(withPacket)); old.schemaVersion = 4; delete old.awards;
    const originalHistory = JSON.stringify({ packets: old.packetSnapshots, resubmissions: old.resubmissions });
    const bytes = Buffer.from("\r\n" + JSON.stringify(old, null, "\t").replace(/\n/g, "\r\n") + "\r\n"), dir = await directory(), filename = path.join(dir, "workspace.json");
    await writeFile(filename, bytes);
    const migrated = await createRepository(dir).read();
    expect(migrated.schemaVersion).toBe(5); expect(migrated.awards.records).toHaveLength(0);
    expect(migrated.applications[0]!.sections).toHaveLength(14);
    expect(JSON.stringify({ packets: migrated.packetSnapshots, resubmissions: migrated.resubmissions })).toBe(originalHistory);
    const backups = (await readdir(dir)).filter(f => f.startsWith("workspace.v4-")); expect(backups).toHaveLength(1);
    expect(await readFile(path.join(dir, backups[0]!))).toEqual(bytes);
    const accepted = await readFile(filename); expect(await createRepository(dir).read()).toEqual(migrated); expect(await readFile(filename)).toEqual(accepted);
  });
  it("copies attested same-application submission and refuses the target's prior submission as current proof", () => {
    const f = createAwardDemoWorkspace(false), original = captureOrigin(f.state, f.applicationId, f.initialCommand.type === "confirmInitialAward" ? f.initialCommand.originSelection : (() => { throw Error(); })(), "2026-10-25T12:00:00.000Z");
    expect(original.applicationCycleId).toBe("initial"); expect(original.originAttemptId).toBeNull();
    expect(original.submissionEvidence.state).toBe("human_attested_snapshot"); expect(original.submittedSnapshot!.sections).toHaveLength(14);
    const target = f.state.applications.find(a => a.originAttemptId)!;
    expect(() => captureOrigin(f.state, target.id, { draftIds: [], proposedMoneyFacts: [], packetId: null, submissionSnapshotId: f.state.resubmissions.snapshots[0]!.id, submissionEvidence: { state: "unknown" } }, "2026-10-25T12:00:00.000Z")).toThrow(/prior submission/);
    const context = captureOrigin(f.state, target.id, { draftIds: [], proposedMoneyFacts: [], packetId: null, submissionEvidence: { state: "unknown" } }, "2026-10-25T12:00:00.000Z");
    expect(context.originAttemptId).toBe(target.originAttemptId); expect(context.submissionEvidence.state).toBe("unknown");
  });
  it("recovers a durable receipt without another write after a regular source correction and restart", async () => {
    const f = createAwardDemoWorkspace(), dir = await directory(), filename = path.join(dir, "workspace.json"); await writeFile(filename, JSON.stringify(f.state));
    const repo = createRepository(dir), snapshot = f.state.awards.reportSnapshots[0]!, md = exportAnnualReport(snapshot, "md"), json = exportAnnualReport(snapshot, "json");
    const source = f.state.sources.find(s => s.id === f.outputId)!;
    await repo.mutate({ expectedRevision: f.state.revision, command: { type: "saveSource", id: source.id, projectId: f.projectId, sourceType: source.type, title: source.title, url: "", text: source.versions[0]!.text + " Correction: uncertainty remains." } });
    const beforeRetry = await readFile(filename);
    const recovered = await repo.mutate({ expectedRevision: 0, command: { type: "awardMutation", operationId: "award-demo-initial", action: f.initialCommand } });
    expect(recovered.replayed).toBe(true); expect(recovered.resultIds![0]).toBe(f.state.awards.records[0]!.id); expect(await readFile(filename)).toEqual(beforeRetry);
    const restart = await createRepository(dir).read();
    expect(currentReportDifferences(restart.awards, f.reportId!, restart).length).toBeGreaterThan(0);
    expect(exportAnnualReport(restart.awards.reportSnapshots[0], "md")).toEqual(md); expect(exportAnnualReport(restart.awards.reportSnapshots[0], "json")).toEqual(json);
    await expect(repo.mutate({ expectedRevision: restart.revision, command: { type: "resetDemo" } })).rejects.toMatchObject({ status: 409 });
    expect(await readFile(filename)).toEqual(beforeRetry);
  });
  it.each(["write", "rename"] as const)("a %s failure commits no receipt or partial amendment", async failure => {
    const f = createAwardDemoWorkspace(), dir = await directory(), filename = path.join(dir, "workspace.json"), bytes = Buffer.from(JSON.stringify(f.state)); await writeFile(filename, bytes);
    const award = f.state.awards.records[0]!, repo = createRepository(dir); faults[failure] = true;
    await expect(repo.mutate({ expectedRevision: f.state.revision, command: { type: "awardMutation", operationId: "failed-archive", action: { type: "archiveAward", awardId: award.id, expectedAwardRevision: award.revision, actor: "Synthetic researcher", reason: "Storage fault test" } } })).rejects.toThrow(/Synthetic/);
    faults[failure] = false;
    expect(await readFile(filename)).toEqual(bytes); const restarted = await createRepository(dir).read();
    expect(restarted.awards.records[0]!.localState).toBe("recorded"); expect(restarted.awards.receipts.some(r => r.operationId === "failed-archive")).toBe(false);
  });
  it.each(["future-schema", "missing-awards", "bad-award-parent", "bad-frozen-digest"])("preserves %s storage without fixture reset", async kind => {
    const f = createAwardDemoWorkspace(), input = JSON.parse(JSON.stringify(f.state));
    if (kind === "future-schema") input.schemaVersion = 999;
    if (kind === "missing-awards") delete input.awards;
    if (kind === "bad-award-parent") input.awards.records[0].applicationId = "missing";
    if (kind === "bad-frozen-digest") input.awards.reportSnapshots[0].digest = "0".repeat(64);
    const dir = await directory(), filename = path.join(dir, "workspace.json"), bytes = Buffer.from(JSON.stringify(input)); await writeFile(filename, bytes);
    await expect(createRepository(dir).read()).rejects.toMatchObject({ status: 503 }); expect(await readFile(filename)).toEqual(bytes);
  });
});
