import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import {
  mkdir,
  mkdtemp,
  readFile,
  readdir,
  writeFile,
  rm,
  cp,
} from "node:fs/promises";
import path from "node:path";
import { createRepository, applyCommand } from "../../lib/repository";
import { createDemo } from "../../lib/fixtures";
import { CommandSchema, StateSchema, type State } from "../../lib/schema";
import {
  uploadDocument,
  createHandoff,
  vaultRuntimeState,
  resolveFile,
} from "../../lib/vault/service";
import { storage, sha256 } from "../../lib/vault/storage";
import {
  attachmentIssues,
  validateVaultState,
  sourceFileStale,
} from "../../lib/vault/domain";
import { readiness } from "../../lib/readiness";
import { generationContext } from "../../lib/generation";
import { latest, cite, citationStale, validCitation } from "../../lib/evidence";
let directory: string, repo: ReturnType<typeof createRepository>;
const settings = {
  delivery: "file-upload" as const,
  phase: "application" as const,
  requiredDate: null,
  allowedMime: ["application/pdf"],
  maxBytes: null,
  maxPages: null,
  manualRules: "Inspect readability and format",
  ethicsRecordId: null,
  settingsSource: "Synthetic CV rule; manually reviewed",
  officialUrl: "",
  checkedDate: "2026-10-25",
};
async function mutate(command: unknown) {
  const state = await repo.read();
  return repo.mutate({
    expectedRevision: state.revision,
    command: CommandSchema.parse(command),
  });
}
async function setup() {
  await mutate({
    type: "saveApplication",
    projectId: "demo-project",
    opportunityId: "demo-call-1",
  });
  let s = await repo.read();
  const a = s.applications[0]!,
    r = a.requirements.find((r) => r.category === "document")!;
  await mutate({
    type: "saveRequirement",
    applicationId: a.id,
    requirement: {
      ...r,
      review: "confirmed",
      obligation: "required",
      status: "Ready",
      vault: settings,
    },
  });
  return { appId: a.id, reqId: r.id };
}
async function upload(
  key = "upload-one",
  documentId?: string,
  filename = "cv.pdf",
  bytes?: Uint8Array,
) {
  const state = await repo.read(),
    data = bytes ?? (await readFile("modules/documents/fixtures/text.pdf"));
  return uploadDocument(
    {
      projectId: "demo-project",
      documentId,
      filename,
      claimedMime: filename.endsWith("pdf") ? "application/pdf" : "text/plain",
      title: "Synthetic CV",
      category: "CV",
      owner: "Test researcher",
      expectedRevision: state.revision,
      idempotencyKey: key,
    },
    data,
    repo,
  );
}
async function settled() {
  for (let i = 0; i < 160; i++) {
    const s = await repo.read();
    if (
      s.parseAttempts.length &&
      !s.parseAttempts.some((p) => ["pending", "running"].includes(p.status))
    )
      return s;
    await new Promise((r) => setTimeout(r, 100));
  }
  throw new Error("parse timeout");
}
beforeEach(async () => {
  await mkdir(".test-data/vault-workflow", { recursive: true });
  directory = await mkdtemp(path.resolve(".test-data/vault-workflow/case-"));
  repo = createRepository(directory);
});
afterEach(async () => {
  if ((await repo.read().catch(() => null))?.parseAttempts.length)
    await settled().catch(() => {});
  await rm(directory, { recursive: true, force: true });
});
describe(
  "persisted document CV integrity vertical slice",
  { timeout: 30000 },
  () => {
    it("migrates v2 with exact backup, retains all proposal content and unknown phases", async () => {
      const old = { ...createDemo(), schemaVersion: 2 };
      const raw = JSON.stringify(old);
      await writeFile(path.join(directory, "workspace.json"), raw);
      const s = await repo.read();
      expect(s.schemaVersion).toBe(3);
      expect(s.applications).toEqual(old.applications);
      const backups = (await readdir(directory)).filter((n) =>
        n.includes(".backup"),
      );
      expect(backups).toHaveLength(1);
      expect(await readFile(path.join(directory, backups[0]!), "utf8")).toBe(
        raw,
      );
      await repo.read();
      expect(
        (await readdir(directory)).filter((n) => n.includes(".backup")),
      ).toHaveLength(1);
    });
    it("fails closed when metadata is missing beside retained originals", async () => {
      await mkdir(path.join(directory, "vault", "blobs"), { recursive: true });
      const retained = path.join(directory, "vault", "blobs", "retained.bin");
      await writeFile(retained, "retained researcher bytes");
      await expect(repo.read()).rejects.toMatchObject({ status: 503 });
      expect(await readFile(retained, "utf8")).toBe(
        "retained researcher bytes",
      );
    });
    it("uploads PDF, requires independent selection/review, restarts and downloads identical bytes", async () => {
      const { appId, reqId } = await setup(),
        u = await upload(),
        s = await settled();
      expect(s.documents[0]!.provenance).toBe("researcher");
      expect(s.attachmentSelections).toHaveLength(0);
      await mutate({
        type: "selectAttachment",
        applicationId: appId,
        requirementId: reqId,
        documentVersionId: u.versionId,
      });
      let current = await repo.read(),
        app = current.applications.find((a) => a.id === appId)!,
        r = app.requirements.find((r) => r.id === reqId)!;
      expect(
        attachmentIssues(await vaultRuntimeState(current, directory), app, r),
      ).toContain("File review is absent, rejected or instructions changed.");
      await mutate({
        type: "reviewAttachment",
        applicationId: appId,
        selectionId: current.attachmentSelections.at(-1)!.id,
        decision: "accepted",
        readable: true,
        relevant: true,
        manualRulesChecked: true,
        by: "Synthetic researcher",
        reason: "Inspected original CV and confirmed rule",
      });
      current = await createRepository(directory).read();
      app = current.applications.find((a) => a.id === appId)!;
      expect(
        attachmentIssues(await vaultRuntimeState(current, directory), app, r),
      ).toEqual([]);
      const v = current.documentVersions[0]!;
      expect(sha256(await storage(directory).read(v))).toBe(v.sha256);
      const backup = await repo.backup(),
        restored = path.join(directory, "restore");
      await cp(backup, restored, { recursive: true });
      const restoredState = await createRepository(restored).read();
      expect(
        sha256(
          await storage(restored).read(restoredState.documentVersions[0]!),
        ),
      ).toBe(v.sha256);
    });
    it("preserves selected v1 after replacement; concurrent revisions conflict and receipts survive lost response", async () => {
      const { appId, reqId } = await setup(),
        u = await upload();
      await settled();
      await mutate({
        type: "selectAttachment",
        applicationId: appId,
        requirementId: reqId,
        documentVersionId: u.versionId,
      });
      const state = await repo.read(),
        data = await readFile("modules/documents/fixtures/text.pdf"),
        meta = {
          projectId: "demo-project",
          documentId: u.documentId,
          filename: "cv.pdf",
          claimedMime: "application/pdf",
          title: "CV",
          category: "CV",
          owner: "Tester",
          expectedRevision: state.revision,
          idempotencyKey: "replace-one",
        };
      const results = await Promise.allSettled([
        uploadDocument(meta, data, repo),
        uploadDocument({ ...meta, idempotencyKey: "replace-two" }, data, repo),
      ]);
      expect(results.filter((r) => r.status === "fulfilled")).toHaveLength(1);
      await settled();
      const replay = await uploadDocument(meta, data, repo);
      expect(replay.state.documents[0]!.versionIds).toHaveLength(2);
      expect(replay.state.attachmentSelections.at(-1)!.documentVersionId).toBe(
        u.versionId,
      );
      await expect(
        uploadDocument(meta, new Uint8Array([...data, 32]), repo),
      ).rejects.toMatchObject({ status: 409 });
    });
    it("freezes handoff bytes and answers; missing/corrupt originals cannot download or pass checks", async () => {
      const { appId, reqId } = await setup(),
        u = await upload();
      await settled();
      await mutate({
        type: "selectAttachment",
        applicationId: appId,
        requirementId: reqId,
        documentVersionId: u.versionId,
      });
      const before = await repo.read(),
        h = await createHandoff(
          appId,
          {
            expectedRevision: before.revision,
            phase: "application",
            idempotencyKey: "handoff-one",
          },
          repo,
        ),
        frozen = JSON.stringify(h.state.handoffs[0]);
      await upload("replacement", u.documentId);
      await settled();
      expect(JSON.stringify((await repo.read()).handoffs[0])).toBe(frozen);
      expect(
        (
          await createHandoff(
            appId,
            {
              expectedRevision: 0,
              phase: "application",
              idempotencyKey: "handoff-one",
            },
            repo,
          )
        ).handoffId,
      ).toBe(h.handoffId);
      const v = (await repo.read()).documentVersions[0]!;
      await writeFile(
        path.join(directory, "vault", "blobs", `${v.id}.bin`),
        "tampered",
      );
      await expect(storage(directory).read(v)).rejects.toBeTruthy();
      const runtime = await vaultRuntimeState(await repo.read(), directory),
        a = runtime.applications[0]!,
        r = a.requirements.find((r) => r.id === reqId)!;
      expect(
        attachmentIssues(runtime, a, r).some((s) =>
          s.includes("Original bytes"),
        ),
      ).toBe(true);
      expect(() =>
        applyCommand(runtime, {
          expectedRevision: runtime.revision,
          command: {
            type: "waiveIssue",
            applicationId: appId,
            issueId: `vault-${reqId}-0`,
            reason: "Cannot waive unavailable bytes",
          },
        }),
      ).toThrow(/waiver/);
    });
    it("promotes exact Unicode offsets, retains origins/manual history and detects new file heads", async () => {
      await setup();
      const u = await upload(
        "unicode",
        undefined,
        "notes.txt",
        Buffer.from("\ufeffLine one\r\nA \u{1f600} passage."),
      );
      let s = await settled();
      const p = s.parseAttempts[0]!,
        text = await storage(directory).readText(p),
        start = text.indexOf("A");
      await mutate({
        type: "promoteFileExcerpt",
        projectId: "demo-project",
        documentVersionId: u.versionId,
        parseAttemptId: p.id,
        start,
        end: text.length,
        title: "Reviewed result",
        by: "Researcher",
        reason: "Compared exact passage with original",
      });
      s = await repo.read();
      const source = s.sources.at(-1)!,
        ref = cite(source, "passage.");
      expect(validCitation(ref, s.sources)).toBe(true);
      expect(latest(source).fileOrigin?.start).toBe(start);
      await upload(
        "unicode-v2",
        u.documentId,
        "notes.txt",
        Buffer.from("Updated note"),
      );
      await settled();
      s = await repo.read();
      expect(sourceFileStale(s.sources.at(-1)!, s)).toBe(true);
      expect(citationStale(ref, s)).toBe(true);
      await mutate({
        type: "saveSource",
        id: source.id,
        projectId: "demo-project",
        title: source.title,
        sourceType: "other",
        text: "Manual revision.",
        url: "",
      });
      s = await repo.read();
      expect(latest(s.sources.at(-1)!).fileOrigin?.manualEdit).toBe(true);
      expect(s.sources.at(-1)!.versions[0]!.fileOrigin?.manualEdit).toBe(false);
    });
    it("later phase ethics never blocks application and changed scope invalidates confirmation", async () => {
      const { appId } = await setup();
      await mutate({
        type: "saveEthicsRecord",
        projectId: "demo-project",
        record: {
          scope: "Synthetic future study",
          institution: "Synthetic institution",
          reference: "IRB-TEST",
          category: "IRB",
          status: "approved",
          basis: "Synthetic manual record",
          phase: "before-research",
          requiredDate: "2027-01-01",
          approvalDate: "2026-10-01",
          expiry: { kind: "no-expiry" },
          supportingVersionIds: [],
        },
      });
      let s = await repo.read(),
        e = s.ethicsRecords[0]!;
      await mutate({
        type: "confirmEthicsRecord",
        recordId: e.id,
        by: "Researcher",
      });
      s = await repo.read();
      expect(
        readiness(s, s.applications.find((a) => a.id === appId)!).issues.some(
          (i) => i.id.startsWith("vault-ethics"),
        ),
      ).toBe(false);
      expect(
        readiness(s, s.applications[0]!, "before-research").issues.some((i) =>
          i.id.startsWith("vault-ethics"),
        ),
      ).toBe(false);
      const record = {
        ...s.ethicsRecords[0]!.revisions.at(-1)!,
        scope: "Changed scope",
      };
      await mutate({
        type: "saveEthicsRecord",
        id: e.id,
        projectId: "demo-project",
        record,
      });
      s = await repo.read();
      expect(s.ethicsRecords[0]!.revisions.at(-1)!.confirmation).toBeNull();
      expect(
        s.ethicsTasks.filter((t) => t.active && t.kind === "review"),
      ).toHaveLength(1);
    });
    it("keeps later-phase linked ethics internal and labels legacy task timing unknown", async () => {
      const { appId, reqId } = await setup();
      await mutate({
        type: "saveEthicsRecord",
        projectId: "demo-project",
        record: {
          scope: "Future scope",
          institution: "Synthetic institution",
          reference: "FUTURE",
          category: "IRB",
          status: "pending",
          basis: "Synthetic",
          phase: "before-research",
          requiredDate: "2027-01-01",
          approvalDate: null,
          expiry: { kind: "unknown" },
          supportingVersionIds: [],
        },
      });
      let s = await repo.read(),
        a = s.applications.find((a) => a.id === appId)!,
        r = a.requirements.find((r) => r.id === reqId)!;
      const legacy = { ...r, category: "task" as const, vault: undefined };
      expect(attachmentIssues(s, a, legacy)).toContain(
        "Delivery method and required phase need review.",
      );
      await mutate({
        type: "saveRequirement",
        applicationId: appId,
        requirement: {
          ...r,
          category: "task",
          vault: {
            ...settings,
            delivery: "external-record",
            phase: "before-research",
            ethicsRecordId: s.ethicsRecords[0]!.id,
          },
        },
      });
      s = await repo.read();
      a = s.applications.find((a) => a.id === appId)!;
      expect(
        readiness(s, a).issues.some((i) => i.id.startsWith("vault-ethics")),
      ).toBe(false);
      expect(
        readiness(s, a, "before-research").issues.some((i) =>
          i.id.startsWith("vault-ethics"),
        ),
      ).toBe(true);
    });
    it("freezes each portal requirement label and limit when fields share one draft", async () => {
      const { appId } = await setup();
      let s = await repo.read(),
        a = s.applications.find((a) => a.id === appId)!,
        base = a.requirements[0]!;
      await mutate({
        type: "saveDraft",
        applicationId: appId,
        sectionKey: "summary",
        label: "Draft summary",
        wordLimit: 500,
        text: "Proposed synthetic work.",
        sourceIds: [],
        citations: [],
      });
      for (const [id, label, limit] of [
        ["portal-one", "Portal first", 300],
        ["portal-two", "Portal second", 100],
      ] as const)
        await mutate({
          type: "saveRequirement",
          applicationId: appId,
          requirement: {
            ...base,
            id,
            category: "section",
            description: label,
            sectionKey: "summary",
            wordLimit: limit,
            vault: { ...settings, delivery: "portal-text" },
          },
        });
      s = await repo.read();
      const h = await createHandoff(
        appId,
        {
          expectedRevision: s.revision,
          phase: "application",
          idempotencyKey: "portal-handoff",
        },
        repo,
      );
      expect(
        h.state.handoffs[0]!.answers.map((a) => [a.label, a.wordLimit]),
      ).toEqual([
        ["Portal first", 300],
        ["Portal second", 100],
      ]);
    });
    it("rejects foreign references before commit and protects uploaded demo parents on reset", async () => {
      await setup();
      await upload();
      await settled();
      await expect(mutate({ type: "resetDemo" })).rejects.toThrow(/retained/);
      const s = await repo.read();
      expect(() =>
        resolveFile(
          s,
          s.documents[0]!.id,
          s.documentVersions[0]!.id,
          "foreign-project",
        ),
      ).toThrow(/outside/);
      const invalid = structuredClone(s);
      invalid.documentVersions[0]!.documentId = "foreign";
      expect(() => validateVaultState(invalid)).toThrow();
    });
  },
);
