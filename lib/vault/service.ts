import { randomUUID, createHash } from "node:crypto";
import { KitError } from "../../packages/runtime/src/index";
import { repository, type createRepository } from "../repository";
import { StateSchema, type State } from "../schema";
import {
  UploadMetadataSchema,
  type UploadMetadata,
  PhaseSchema,
  type Phase,
} from "./schema";
import { record, attachmentIssues, phaseApplies } from "./domain";
import { readiness } from "../readiness";
import { storage, sha256 } from "./storage";
import { admit } from "./admission";
import { parseFile } from "./parser";
type Repo = ReturnType<typeof createRepository>;
const uid = (prefix: string) => `${prefix}-${randomUUID()}`;
const fail = (message: string, status = 422): never => {
  throw new KitError("VAULT", message, status);
};
const fingerprint = (value: unknown) =>
  createHash("sha256").update(JSON.stringify(value)).digest("hex");
const active = new Set<string>();
const touchProject = (state: State, projectId: string) => {
  for (const a of state.applications.filter((a) => a.projectId === projectId)) {
    a.revision++;
    a.updatedAt = new Date().toISOString();
    a.waivers = [];
    if (a.stage === "Ready for review") a.stage = "Preparing";
  }
};
export async function vaultRuntimeState(
  input: State,
  directory: string,
): Promise<State> {
  const state = structuredClone(input),
    store = storage(directory);
  for (const v of state.documentVersions) {
    try {
      await store.read(v);
      v.integrity = "available";
    } catch (e) {
      v.integrity =
        (e as { code?: string }).code === "VAULT_MISSING"
          ? "missing"
          : "corrupt";
    }
  }
  return state;
}
export function resolveFile(
  state: State,
  documentId: string,
  versionId: string,
  projectId?: string,
) {
  const d = record(state.documents, documentId),
    v = record(state.documentVersions, versionId);
  if (
    v.documentId !== d.id ||
    !d.versionIds.includes(v.id) ||
    (projectId && d.projectId !== projectId)
  )
    fail("This file is outside the requested project or document.", 403);
  return { document: d, version: v };
}
function replay(
  state: State,
  key: string,
  kind: "upload" | "parse" | "handoff",
  fp: string,
) {
  const receipt = state.operationReceipts.find(
    (r) => r.key === key && Date.parse(r.createdAt) > Date.now() - 7 * 86400000,
  );
  if (receipt && (receipt.fingerprint !== fp || receipt.kind !== kind))
    fail("Idempotency key was already used with different input.", 409);
  return receipt;
}
function receipt(
  state: State,
  key: string,
  kind: "upload" | "parse" | "handoff",
  fp: string,
  id: string,
) {
  state.operationReceipts = state.operationReceipts.filter(
    (r) => Date.parse(r.createdAt) > Date.now() - 7 * 86400000,
  );
  state.operationReceipts.push({
    key,
    kind,
    fingerprint: fp,
    resourceId: id,
    createdAt: new Date().toISOString(),
  });
}
export async function uploadDocument(
  meta: UploadMetadata,
  bytes: Uint8Array,
  repo: Repo = repository(),
) {
  meta = UploadMetadataSchema.parse(meta);
  const hash = sha256(bytes),
    fp = fingerprint({ ...meta, expectedRevision: undefined, hash }),
    pre = await repo.read(),
    old = replay(pre, meta.idempotencyKey, "upload", fp);
  if (old) {
    const v = record(pre.documentVersions, old.resourceId);
    return {
      state: await vaultRuntimeState(pre, repo.directory),
      documentId: v.documentId,
      versionId: v.id,
    };
  }
  const admitted = admit(meta.filename, meta.claimedMime, bytes),
    id = uid("file-version"),
    at = new Date().toISOString(),
    store = storage(repo.directory);
  const result = await repo.internal(async (state) => {
    const old = replay(state, meta.idempotencyKey, "upload", fp);
    if (old) return old.resourceId;
    if (state.revision !== meta.expectedRevision)
      fail(
        "Saved state changed. Your upload selection is preserved; refresh and retry.",
        409,
      );
    record(state.projects, meta.projectId);
    let d = meta.documentId
      ? record(state.documents, meta.documentId)
      : undefined;
    if (d && (d.projectId !== meta.projectId || d.archivedAt))
      fail("Choose an active document in this project.", 403);
    if (d && d.versionIds.length >= 20)
      fail("This document has twenty retained versions.", 503);
    if (
      !d &&
      state.documents.filter((x) => x.projectId === meta.projectId).length >=
        100
    )
      fail("This project has one hundred documents.", 503);
    if ((await store.physicalBytes()) + bytes.length > 250000000)
      fail(
        "Vault capacity reached. Preserve data and choose another data directory.",
        503,
      );
    await store.put(id, bytes);
    if (!d) {
      d = {
        id: uid("document"),
        projectId: meta.projectId,
        title: meta.title,
        category: meta.category,
        owner: meta.owner,
        tags: [],
        provenance: "researcher",
        archivedAt: null,
        versionIds: [],
        createdAt: at,
      };
      state.documents.push(d);
    }
    state.documentVersions.push({
      id,
      documentId: d.id,
      version: d.versionIds.length + 1,
      filename: meta.filename,
      mime: admitted.mime,
      bytes: bytes.length,
      sha256: hash,
      createdAt: at,
      documentDate: null,
      integrity: "available",
    });
    d.versionIds.push(id);
    touchProject(state, d.projectId);
    receipt(state, meta.idempotencyKey, "upload", fp, id);
    return id;
  });
  const v = record(result.state.documentVersions, result.result);
  void queueParse(v.id, repo).catch(() => {});
  return { state: result.state, documentId: v.documentId, versionId: v.id };
}
export async function queueParse(
  versionId: string,
  repo: Repo = repository(),
  retry?: { expectedRevision: number; idempotencyKey: string },
) {
  const fp = fingerprint({ versionId }),
    id = uid("parse"),
    at = new Date().toISOString();
  const saved = await repo.internal((state) => {
    if (retry) {
      const old = replay(state, retry.idempotencyKey, "parse", fp);
      if (old)
        return {
          version: record(state.documentVersions, versionId),
          attemptId: old.resourceId,
          created: false,
        };
      if (state.revision !== retry.expectedRevision)
        fail("Saved state changed. Reload before retrying extraction.", 409);
    }
    const v = record(state.documentVersions, versionId);
    if (
      state.parseAttempts.some(
        (p) =>
          p.documentVersionId === v.id &&
          ["pending", "running"].includes(p.status),
      )
    )
      fail("An extraction is already active.", 409);
    if (
      state.parseAttempts.filter((p) =>
        ["pending", "running"].includes(p.status),
      ).length >= 5
    )
      fail("The parser queue is full. Retry after extraction finishes.", 429);
    state.parseAttempts.push({
      id,
      documentVersionId: v.id,
      parser: "documents-vault-1",
      status: "pending",
      warnings: [],
      artifactSha256: null,
      textLength: 0,
      segments: [],
      pages: null,
      startedAt: at,
      finishedAt: null,
    });
    if (retry) receipt(state, retry.idempotencyKey, "parse", fp, id);
    return { version: v, attemptId: id, created: true };
  });
  if (!saved.result.created)
    return { state: saved.state, attemptId: saved.result.attemptId };
  active.add(id);
  void (async () => {
    try {
      await repo.internal((state) => {
        record(state.parseAttempts, id).status = "running";
      });
      const output = await parseFile(repo.directory, saved.result.version);
      const artifactSha256 = ["parsed", "partial"].includes(output.status)
        ? await storage(repo.directory).writeText(id, output.text)
        : null;
      await repo.internal((state) => {
        const p = record(state.parseAttempts, id);
        Object.assign(p, {
          ...output,
          text: undefined,
          artifactSha256,
          textLength: output.text.length,
          finishedAt: new Date().toISOString(),
        });
      });
    } catch {
      await repo
        .internal((state) => {
          const p = record(state.parseAttempts, id);
          p.status = "failed";
          p.warnings = [
            "EXTRACTION_FAILED: Original retained. Retry or use a text alternative.",
          ];
          p.finishedAt = new Date().toISOString();
        })
        .catch(() => {});
    } finally {
      active.delete(id);
    }
  })();
  return { state: saved.state, attemptId: id };
}
const recovery = new WeakMap<Repo, Promise<void>>();
export async function recoverVault(repo: Repo = repository()) {
  const existing = recovery.get(repo);
  if (existing) return existing;
  const work = (async () => {
    const state = await repo.read();
    await storage(repo.directory).recover(state);
    if (
      state.parseAttempts.some((p) => ["pending", "running"].includes(p.status))
    )
      await repo.internal((s) => {
        for (const p of s.parseAttempts)
          if (["pending", "running"].includes(p.status) && !active.has(p.id)) {
            p.status = "retryable";
            p.warnings = [
              "INTERRUPTED: Original retained; explicitly retry extraction.",
            ];
            p.finishedAt = new Date().toISOString();
          }
      });
  })();
  recovery.set(repo, work);
  return work;
}
export async function createHandoff(
  applicationId: string,
  input: { expectedRevision: number; phase: Phase; idempotencyKey: string },
  repo: Repo = repository(),
) {
  const fp = fingerprint({ applicationId, phase: input.phase }),
    pre = await repo.read(),
    old = replay(pre, input.idempotencyKey, "handoff", fp);
  if (old) return { state: pre, handoffId: old.resourceId };
  const id = uid("handoff");
  const saved = await repo.internal(async (state) => {
    const replayed = replay(state, input.idempotencyKey, "handoff", fp);
    if (replayed) return replayed.resourceId;
    if (state.revision !== input.expectedRevision)
      fail("Saved state changed. Reload before saving a handoff.", 409);
    const current = await vaultRuntimeState(state, repo.directory),
      app = record(current.applications, applicationId),
      project = record(current.projects, app.projectId),
      call = record(current.opportunities, app.opportunityId);
    const checks = readiness(current, app, input.phase);
    const today = new Intl.DateTimeFormat("en-CA", {
      timeZone: "America/New_York",
    }).format(new Date());
    const files = app.requirements
      .filter(
        (r) =>
          r.vault?.delivery === "file-upload" &&
          phaseApplies(r.vault.phase, input.phase, r.vault.requiredDate, today),
      )
      .flatMap((r, index) => {
        const s = current.attachmentSelections
          .filter((s) => s.applicationId === app.id && s.requirementId === r.id)
          .at(-1);
        if (!s) return [];
        const v = record(current.documentVersions, s.documentVersionId),
          d = record(current.documents, v.documentId);
        const ext = v.filename.split(".").at(-1)!.toLowerCase();
        return [
          {
            requirementId: r.id,
            documentId: d.id,
            documentVersionId: v.id,
            sha256: v.sha256,
            filename: v.filename,
            transferFilename: `${
              d.title
                .toLowerCase()
                .replace(/[^a-z0-9_-]/g, "_")
                .slice(0, 20) || "file"
            }_${v.id.slice(-8)}_r${index + 1}_v${v.version}.${ext}`,
            mime: v.mime,
            bytes: v.bytes,
            issues: attachmentIssues(current, app, r, input.phase),
          },
        ];
      });
    state.handoffs.push({
      id,
      applicationId: app.id,
      projectId: project.id,
      applicationRevision: app.revision,
      projectRevision: project.revision,
      callRevision: call.revision,
      callSourceVersion: call.sourceVersion,
      phase: PhaseSchema.parse(input.phase),
      createdAt: new Date().toISOString(),
      rulesVersion: checks.rulesVersion,
      requirements: structuredClone(
        app.requirements.map((r) => ({
          ...r,
          selection:
            current.attachmentSelections
              .filter(
                (s) => s.applicationId === app.id && s.requirementId === r.id,
              )
              .at(-1) ?? null,
        })),
      ),
      files,
      answers: app.requirements
        .filter(
          (r) =>
            r.vault?.delivery === "portal-text" &&
            phaseApplies(
              r.vault.phase,
              input.phase,
              r.vault.requiredDate,
              today,
            ),
        )
        .flatMap((req) => {
          const section = app.sections.find((s) => s.key === req.sectionKey),
            r = section?.revisions.at(-1);
          return section && r
            ? [
                {
                  requirementId: req.id,
                  sectionKey: section.key,
                  label: req.description,
                  revisionId: r.id,
                  text: r.text,
                  wordLimit: req.wordLimit,
                  evidence: structuredClone([
                    ...r.selectedSources,
                    ...r.citations,
                  ]),
                },
              ]
            : [];
        }),
      warnings: checks.issues.map(
        (i) =>
          `${i.severity}: ${i.location}: ${i.message}${i.waived ? ` Waived: ${i.waived}` : ""}`,
      ),
      ethics: structuredClone(
        current.ethicsRecords.filter((r) => r.projectId === project.id),
      ),
      futureTasks: structuredClone(
        current.ethicsTasks.filter(
          (t) =>
            t.active &&
            current.ethicsRecords.some(
              (r) => r.id === t.recordId && r.projectId === project.id,
            ),
        ),
      ),
    });
    receipt(state, input.idempotencyKey, "handoff", fp, id);
    return id;
  });
  return { state: saved.state, handoffId: saved.result };
}
