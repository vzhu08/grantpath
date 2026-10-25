import { migrateV2 } from "./vault/migration";
import { migrateV3 } from "./resubmissions/migration";
import { isResubmissionCommand } from "./resubmissions/schema";
import { applyResubmissionCommand,commitResubmissionPreview } from "./resubmissions/workflow";
import { validateResubmissionGraph,protectResubmissionDemoReset } from "./resubmissions/validation";
import {
  applyVaultCommand,
  isVaultCommand,
  validateVaultState,
} from "./vault/domain";
import {
  mkdir,
  open,
  readFile,
  rename,
  unlink,
  readdir,
} from "node:fs/promises";
import path from "node:path";
import { randomUUID } from "node:crypto";
import { normalizeText } from "../modules/documents/src/index";
import { KitError } from "../packages/runtime/src/index";
import { createDemo, createApplication } from "./fixtures";
import { extractCall, extractRequirements } from "./calls";
import { latest, newSource, validCitation } from "./evidence";
import { readiness } from "./readiness";
import {
  isProposalCommand,
  applyProposalCommand,
  validateStateIntegrity,
} from "./proposals/workflow";
import { migrateV1 } from "./proposals/migration";
import { textBlocks, visibleText } from "./proposals/blocks";
import {
  StateSchema,
  MutationSchema,
  type State,
  type Mutation,
  type DraftRevision,
} from "./schema";

export const uid = (prefix: string) => `${prefix}-${randomUUID()}`;
export type PendingProposal = {
  applicationId: string;
  sectionKey: string;
  stateRevision: number;
  revision: DraftRevision;
  expires: number;
};
const globalStore = globalThis as typeof globalThis & {
  grantpathRepository?: ReturnType<typeof createRepository>;
  grantpathProposals?: Map<string, PendingProposal>;
};
export const pendingProposals = (globalStore.grantpathProposals ??= new Map());
function fail(message: string, status = 400): never {
  throw new KitError(
    status === 409 ? "REVISION_CONFLICT" : "INVALID_INPUT",
    message,
    status,
  );
}
function find<T extends { id: string }>(items: T[], id: string): T {
  return (
    items.find((x) => x.id === id) ??
    fail("Record not found. Reload the workspace and try again.", 404)
  );
}
export function applyCommand(
  state: State,
  input: Mutation,
  vaultExcerpt?: string,
): { state: State; selectedId?: string;resultIds?:string[];replayed?:boolean;consumedPreviewToken?:string } {
  const { command: c } = MutationSchema.parse(input);
  // The feature command recovers a receipt before checking expectedRevision.
  if(isResubmissionCommand(c))return applyResubmissionCommand(state,{expectedRevision:input.expectedRevision,command:c});
  if (input.expectedRevision !== state.revision)
    fail(
      "A newer save exists. Your editor text is preserved. Reload saved data and reconcile your changes before retrying.",
      409,
    );
  const at = new Date().toISOString();
  let selectedId: string | undefined;
  const touch = (app: State["applications"][number]) => {
    app.revision++;
    app.updatedAt = at;
    app.waivers = [];
    if (app.stage === "Ready for review") app.stage = "Preparing";
  };
  const invalidate = (
    predicate: (app: State["applications"][number]) => boolean,
  ) => state.applications.filter(predicate).forEach(touch);
  if (isVaultCommand(c)) {
    selectedId = applyVaultCommand(state, c, at, vaultExcerpt);
    if (c.type === "editDocumentMetadata")
      invalidate(
        (a) => a.projectId === find(state.documents, c.documentId).projectId,
      );
    else if (c.type === "saveEthicsRecord" || c.type === "promoteFileExcerpt")
      invalidate((a) => a.projectId === c.projectId);
    else if (c.type === "confirmEthicsRecord")
      invalidate(
        (a) => a.projectId === find(state.ethicsRecords, c.recordId).projectId,
      );
    else if (c.type === "selectAttachment" || c.type === "reviewAttachment") {
      const a = find(state.applications, c.applicationId);
      a.waivers = [];
      if (a.stage === "Ready for review") a.stage = "Preparing";
    }
    state.revision++;
    return { state: validateResubmissionGraph(validateVaultState(StateSchema.parse(state))), selectedId };
  }
  if (isProposalCommand(c)) {
    selectedId = applyProposalCommand(state, c, at);
    state.revision++;
    return {
      state: validateResubmissionGraph(validateStateIntegrity(StateSchema.parse(state))),
      selectedId,
    };
  }
  if (c.type === "saveProject") {
    if (c.id) {
      const p = find(state.projects, c.id);
      p.history.push({
        revision: p.revision,
        profile: p.profile,
        at: p.updatedAt,
      });
      p.profile = c.profile;
      p.revision++;
      p.updatedAt = at;
      invalidate((a) => a.projectId === p.id);
      selectedId = p.id;
    } else {
      const id = uid("project");
      state.projects.push({
        id,
        revision: 1,
        profile: c.profile,
        provenance: "researcher",
        history: [],
        createdAt: at,
        updatedAt: at,
      });
      selectedId = id;
    }
  } else if (c.type === "saveSource") {
    const project = find(state.projects, c.projectId);
    if (c.sourceType === "call") fail("Add funding calls from Opportunities.");
    if (c.id) {
      const source = find(state.sources, c.id);
      if (source.projectId !== project.id)
        fail("This source belongs to another project.");
      const normalized = normalizeText({
        id: source.id,
        filename: c.title + ".txt",
        text: c.text,
      });
      if (latest(source).hash !== normalized.hash)
        source.versions.push({
          ...(latest(source).fileOrigin
            ? {
                fileOrigin: { ...latest(source).fileOrigin!, manualEdit: true },
              }
            : {}),
          version: latest(source).version + 1,
          hash: normalized.hash,
          text: normalized.text,
          createdAt: at,
        });
      source.title = c.title;
      source.type = c.sourceType;
      source.url = c.url;
      source.updatedAt = at;
      invalidate((a) => a.projectId === project.id);
    } else {
      if (state.sources.filter((s) => s.projectId === project.id).length >= 10)
        fail(
          "This project has ten sources. Edit an existing source instead of adding another.",
        );
      state.sources.push(
        newSource({
          id: uid("source"),
          projectId: project.id,
          title: c.title,
          type: c.sourceType,
          text: c.text,
          url: c.url,
          provenance: project.provenance,
        }),
      );
    }
  } else if (c.type === "saveCall") {
    if (c.id) {
      const call = find(state.opportunities, c.id),
        source = find(state.sources, call.sourceId);
      const {
        title,
        funder,
        url,
        tags,
        minAmount,
        maxAmount,
        currency,
        criteria,
        reviewed,
        deadline,
      } = call;
      call.history.push({
        revision: call.revision,
        sourceVersion: call.sourceVersion,
        fields: {
          title,
          funder,
          url,
          tags,
          minAmount,
          maxAmount,
          currency,
          criteria,
          reviewed,
          deadline,
        },
        at,
      });
      const normalized = normalizeText({
        id: source.id,
        filename: c.title + ".txt",
        text: c.text,
      });
      if (latest(source).hash !== normalized.hash)
        source.versions.push({
          version: latest(source).version + 1,
          hash: normalized.hash,
          text: normalized.text,
          createdAt: at,
        });
      source.title = c.title;
      source.url = c.url;
      source.updatedAt = at;
      Object.assign(call, extractCall(source), {
        title: c.title,
        funder: c.funder,
        url: c.url,
        sourceVersion: latest(source).version,
        revision: call.revision + 1,
        lastCheckedAt: null,
      });
      invalidate((a) => a.opportunityId === call.id);
      selectedId = call.id;
    } else {
      const source = newSource({
        id: uid("call-source"),
        projectId: null,
        title: c.title,
        type: "call",
        text: c.text,
        url: c.url,
        provenance: "researcher",
      });
      const call = {
        ...extractCall(source),
        id: uid("call"),
        title: c.title,
        funder: c.funder,
        url: c.url,
        sourceId: source.id,
        sourceVersion: 1,
        revision: 1,
        provenance: "researcher" as const,
        importedAt: at,
        lastCheckedAt: null,
        history: [],
      };
      state.sources.push(source);
      state.opportunities.push(call);
      selectedId = call.id;
    }
  } else if (c.type === "reviewCall") {
    const call = find(state.opportunities, c.id);
    const confirmed = c.fields.criteria.filter((r) => r.confirmed);
    if (
      confirmed.some((r) => r.conflict) ||
      new Set(confirmed.map((r) => r.field)).size !== confirmed.length
    )
      fail(
        "Resolve conflicting criteria first: retain one reviewed rule per field, with alternatives separated by |.",
      );
    for (const criterion of c.fields.criteria) {
      if (
        criterion.citation &&
        (criterion.citation.sourceId !== call.sourceId ||
          criterion.citation.version !== call.sourceVersion ||
          !validCitation(criterion.citation, state.sources))
      )
        fail("Eligibility quote must resolve to the current call source.");
      if (!criterion.citation) criterion.manual = true;
      if (
        criterion.citation &&
        !criterion.manual &&
        !criterion.values.every((v) =>
          criterion.citation!.quote.toLowerCase().includes(v.toLowerCase()),
        )
      )
        fail("Changed criterion values need a visible user-entered override.");
    }
    const {
      title,
      funder,
      url,
      tags,
      minAmount,
      maxAmount,
      currency,
      criteria,
      reviewed,
      deadline,
    } = call;
    call.history.push({
      revision: call.revision,
      sourceVersion: call.sourceVersion,
      fields: {
        title,
        funder,
        url,
        tags,
        minAmount,
        maxAmount,
        currency,
        criteria,
        reviewed,
        deadline,
      },
      at,
    });
    Object.assign(call, c.fields, {
      revision: call.revision + 1,
      lastCheckedAt: c.fields.reviewed ? at : null,
    });
    invalidate((a) => a.opportunityId === call.id);
  } else if (c.type === "saveApplication") {
    const project = find(state.projects, c.projectId),
      call = find(state.opportunities, c.opportunityId);
    const existing = state.applications.find(
      (a) => a.projectId === project.id && a.opportunityId === call.id && a.cycleId==="initial" && !a.originAttemptId,
    );
    if (existing) selectedId = existing.id;
    else {
      const app = createApplication(project, call, state, uid("application"));
      state.applications.push(app);
      selectedId = app.id;
    }
  } else if (c.type === "resetDemo") {
    protectResubmissionDemoReset(state);
    if (
      state.documents.length ||
      state.ethicsRecords.length ||
      state.handoffs.length ||
      state.sources.some(
        (s) =>
          s.provenance === "researcher" &&
          state.projects.find((p) => p.id === s.projectId)?.provenance ===
            "demo",
      )
    )
      fail(
        "Demo reset is unavailable while retained uploads, ethics, handoffs or researcher evidence reference this workspace. All original files remain retained.",
      );
    if (
      state.packetSnapshots.some(
        (packet) => packet.payload.project.provenance === "demo",
      ) ||
      state.contentLibrary.some(
        (item) =>
          state.projects.find((p) => p.id === item.projectId)?.provenance ===
          "demo",
      )
    )
      fail(
        "Demo records are retained because frozen packets or reusable content reference them. Your saved provenance has not been reset.",
      );
    const demo = createDemo();
    const protectedCallIds = new Set(
      state.applications
        .filter((a) => a.provenance === "researcher")
        .map((a) => a.opportunityId),
    );
    const protectedSources = new Set(
      state.opportunities
        .filter((o) => protectedCallIds.has(o.id))
        .map((o) => o.sourceId),
    );
    state.applications = state.applications.filter(
      (a) => a.provenance !== "demo",
    );
    state.projects = [
      ...state.projects.filter((p) => p.provenance !== "demo"),
      ...demo.projects,
    ];
    state.sources = [
      ...state.sources.filter(
        (s) => s.provenance !== "demo" || protectedSources.has(s.id),
      ),
      ...demo.sources.filter((s) => !protectedSources.has(s.id)),
    ];
    state.opportunities = [
      ...state.opportunities.filter(
        (o) => o.provenance !== "demo" || protectedCallIds.has(o.id),
      ),
      ...demo.opportunities.filter((o) => !protectedCallIds.has(o.id)),
    ];
  } else {
    const app = find(state.applications, c.applicationId),
      project = find(state.projects, app.projectId),
      call = find(state.opportunities, app.opportunityId);
    if (c.type === "saveRequirement") {
      const r = c.requirement;
      if (
        r.citation &&
        (r.citation.sourceId !== call.sourceId ||
          !validCitation(r.citation, state.sources))
      )
        fail("Requirement quote must match a saved version of this call.");
      if (!r.citation) r.manual = true;
      if (
        r.linkedSourceId &&
        !state.sources.some(
          (s) => s.id === r.linkedSourceId && s.projectId === project.id,
        )
      )
        fail("Choose evidence from this project.");
      const index = app.requirements.findIndex((item) => item.id === r.id);
      const previous = index < 0 ? null : app.requirements[index];
      if (
        r.citation &&
        (!previous ||
          previous.description !== r.description ||
          previous.category !== r.category ||
          previous.obligation !== r.obligation)
      )
        r.manual = true;
      app.requirementsHistory.push({
        sourceVersion: app.requirementsSourceVersion,
        at,
        items: structuredClone(app.requirements),
      });
      if (index < 0) app.requirements.push(r);
      else app.requirements[index] = r;
      app.requirementsReviewed = false;
      touch(app);
    } else if (c.type === "reviewRequirements") {
      if (
        app.requirements.some(
          (r) =>
            r.origin === "sponsor" &&
            (r.review !== "confirmed" ||
              (r.citation && r.citation.version !== call.sourceVersion)),
        )
      )
        fail("Confirm or refresh every proposed sponsor requirement first.");
      app.requirementsReviewed = true;
      app.requirementsSourceVersion = call.sourceVersion;
      touch(app);
    } else if (c.type === "reextractRequirements") {
      const source = find(state.sources, call.sourceId);
      app.requirementsHistory.push({
        sourceVersion: app.requirementsSourceVersion,
        at,
        items: structuredClone(app.requirements),
      });
      app.requirements = [
        ...app.requirements.filter((r) => r.origin === "internal"),
        ...extractRequirements(source),
      ];
      app.requirementsReviewed = false;
      app.requirementsSourceVersion = call.sourceVersion;
      touch(app);
    } else if (c.type === "saveDraft") {
      const section =
        app.sections.find((s) => s.key === c.sectionKey) ??
        fail("Choose a section in this application.", 404);
      const sources = c.sourceIds.map((id) => find(state.sources, id));
      if (sources.some((s) => s.projectId !== project.id))
        fail("Draft evidence must belong to this project.");
      let revision: DraftRevision;
      if (c.proposalToken) {
        const pending = pendingProposals.get(c.proposalToken);
        if (
          !pending ||
          pending.expires < Date.now() ||
          pending.applicationId !== app.id ||
          pending.sectionKey !== section.key ||
          pending.stateRevision !== state.revision
        )
          fail(
            "Generation inputs changed or the preview expired. Your text is preserved; generate again or save a manual revision.",
            409,
          );
        revision = {
          ...pending.revision,
          id: uid("draft"),
          text: c.text,
          createdAt: at,
        };
      } else {
        if (
          c.citations.some(
            (ref) =>
              (!c.sourceIds.includes(ref.sourceId) &&
                ref.sourceId !== call.sourceId) ||
              !validCitation(ref, state.sources),
          )
        )
          fail(
            "Manual quotations must resolve to selected project evidence or this call.",
          );
        revision = {
          id: uid("draft"),
          text: c.text,
          citations: c.citations,
          selectedSources: sources.map((s) => ({
            sourceId: s.id,
            version: latest(s).version,
            hash: latest(s).hash,
          })),
          projectRevision: project.revision,
          callRevision: call.revision,
          callSourceVersion: call.sourceVersion,
          missingInputs: [],
          mode: "manual",
          promptVersion: "manual-1",
          createdAt: at,
        };
      }
      if (c.blocks && visibleText({ blocks: c.blocks }) !== c.text)
        fail(
          "Structured content and visible text do not match. Refresh the editor before saving.",
        );
      revision.blocks = c.blocks ?? textBlocks(revision.text);
      revision.representationVersion = 1;
      revision.bindingRevision = app.binding?.revision ?? null;
      revision.reusedContent ??= section.revisions.at(-1)?.reusedContent ?? [];
      if (revision.citations.some((ref) => !validCitation(ref, state.sources)))
        fail(
          "A generated citation is invalid. Regenerate with current evidence.",
        );
      section.label = c.label;
      section.wordLimit = c.wordLimit;
      section.revisions.push(revision);
      touch(app);
    } else if (c.type === "waiveIssue") {
      if (/^(scope-|condition-|pages-|vault-)/.test(c.issueId))
        fail(
          "A waiver cannot resolve unsupported scope, unknown applicability or measured page compliance. Review the source rule or re-render the content.",
        );
      const issue = readiness(state, app).issues.find(
        (i) => i.id === c.issueId,
      );
      if (!issue) fail("This readiness issue no longer exists.");
      app.waivers = app.waivers.filter((w) => w.issueId !== c.issueId);
      app.waivers.push({
        issueId: c.issueId,
        fingerprint: issue.fingerprint,
        reason: c.reason,
        at,
      });
      app.revision++;
      app.updatedAt = at;
    } else if (c.type === "setStage") {
      if (c.stage === "Ready for review" && readiness(state, app).blockers)
        fail(
          "Resolve or explicitly waive the remaining blockers before marking Ready for review.",
        );
      app.stage = c.stage;
      app.revision++;
      app.updatedAt = at;
    }
  }
  state.revision++;
  return { state: validateResubmissionGraph(StateSchema.parse(state)), selectedId };
}
export function createRepository(directory: string) {
  const filename = path.join(directory, "workspace.json");
  let tail: Promise<unknown> = Promise.resolve();
  async function write(state: State,migrating=false) {
    state = validateResubmissionGraph(validateVaultState(
      validateStateIntegrity(StateSchema.parse(state)),
    ));
    const serialized=JSON.stringify(state,null,2);
    if(!migrating&&Buffer.byteLength(serialized,"utf8")>25*1024*1024)fail("The workspace exceeds 25 MiB. It remains readable and exportable; preserve it and plan a capacity change without pruning history.",413);
    await mkdir(directory, { recursive: true });
    const temp = path.join(directory, `.workspace-${randomUUID()}.tmp`);
    try {
      const file = await open(temp, "wx", 0o600);
      try {
        await file.writeFile(serialized, "utf8");
        await file.sync();
      } finally {
        await file.close();
      }
      await rename(temp, filename);
    } finally {
      await unlink(temp).catch(() => {});
    }
  }
  async function load(): Promise<State> {
    let raw: Buffer;
    try {
      raw = await readFile(filename);
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code !== "ENOENT")
        throw new KitError(
          "STORAGE_ERROR",
          "The workspace could not be read. Preserve the data file.",
          503,
        );
      const retained = await readdir(directory).catch(
        (e: NodeJS.ErrnoException) => {
          if (e.code === "ENOENT") return [];
          throw e;
        },
      );
      if (
        retained.some(
          (name) =>
            name === "vault" ||
            name === "backups" ||
            name.includes(".backup.json") ||
            name.startsWith(".workspace-"),
        )
      )
        throw new KitError(
          "STORAGE_ERROR",
          "Workspace metadata is missing beside retained vault or backup data. Restore matching metadata and files together; nothing was reset.",
          503,
        );
      const state = createDemo();
      await write(state);
      return state;
    }
    try {
      const input = JSON.parse(raw.toString("utf8"));
      if ([1,2,3].includes(input.schemaVersion)) {
        const migrated =
          input.schemaVersion === 1 ? migrateV1(input) : input.schemaVersion===2?migrateV2(input):migrateV3(input);
        const backup = await open(
          path.join(
            directory,
            `workspace.v${input.schemaVersion}-${Date.now()}-${randomUUID()}.backup.json`,
          ),
          "wx",
          0o600,
        );
        try {
          await backup.writeFile(raw);
          await backup.sync();
        } finally {
          await backup.close();
        }
        await write(migrated,true);
        return migrated;
      }
      return validateResubmissionGraph(validateVaultState(
        validateStateIntegrity(StateSchema.parse(input)),
      ));
    } catch (error) {
      throw new KitError(
        "STORAGE_ERROR",
        "The local workspace could not be read. Preserve the data file and inspect it before restarting; it has not been reset.",
        503,
      );
    }
  }
  function enqueue<T>(operation: () => Promise<T>): Promise<T> {
    const next = tail.then(operation, operation);
    tail = next.catch(() => {});
    return next;
  }
  return {
    read: () => enqueue(load),
    mutate: (input: Mutation) =>
      enqueue(async () => {
        let current = await load();
        if (
          ["freezePacket", "setStage", "waiveIssue"].includes(
            input.command.type,
          ) &&
          current.proposalExports.length
        )
          current = await (
            await import("./proposals/runtime-state")
          ).proposalRuntimeState(current);
        current = await (
          await import("./vault/service")
        ).vaultRuntimeState(current, directory);
        let excerpt: string | undefined;
        if (input.command.type === "promoteFileExcerpt") {
          const c = input.command;
          const attempt = current.parseAttempts.find(
            (p) => p.id === c.parseAttemptId,
          );
          if (!attempt) fail("Extraction attempt unavailable.", 404);
          const store = (await import("./vault/storage")).storage(directory);
          const artifact = await store.readText(attempt);
          excerpt = artifact.slice(c.start, c.end);
        }
        const result = applyCommand(current, input, excerpt);
        if(result.replayed)return result;
        result.state.proposalExports.forEach((job) => {
          delete job.runtimeRendererMatch;
        });
        await write(result.state);
        commitResubmissionPreview(result);
        return result;
      }),
    internal: <T>(
      operation: (state: State) => T | Promise<T>,
      expectedRevision?: number,
    ) =>
      enqueue(async () => {
        const state = await load();
        if (
          expectedRevision !== undefined &&
          state.revision !== expectedRevision
        )
          fail("Saved state changed. Reload and retry.", 409);
        const result = await operation(state);
        state.revision++;
        const validated = validateResubmissionGraph(validateVaultState(
          validateStateIntegrity(StateSchema.parse(state)),
        ));
        await write(validated);
        return { state: validated, result };
      }),
    backup: () =>
      enqueue(async () => {
        const state = await load(),
          store = (await import("./vault/storage")).storage(directory),
          target = path.join(
            directory,
            "backups",
            `workspace-${Date.now()}-${randomUUID()}`,
          );
        await mkdir(path.join(target, "vault", "blobs"), { recursive: true });
        await mkdir(path.join(target, "vault", "extractions"), {
          recursive: true,
        });
        for (const v of state.documentVersions)
          await (
            await import("node:fs/promises")
          ).writeFile(
            path.join(target, "vault", "blobs", `${v.id}.bin`),
            await store.read(v),
            { flag: "wx", mode: 0o600 },
          );
        for (const p of state.parseAttempts)
          if (p.artifactSha256)
            await (
              await import("node:fs/promises")
            ).writeFile(
              path.join(target, "vault", "extractions", `${p.id}.txt`),
              await store.readText(p),
              { flag: "wx", mode: 0o600 },
            );
        await (
          await import("node:fs/promises")
        ).writeFile(
          path.join(target, "workspace.json"),
          JSON.stringify(state, null, 2),
          { flag: "wx", mode: 0o600 },
        );
        return target;
      }),
    directory,
    filename,
  };
}
export function repository() {
  return (globalStore.grantpathRepository ??= createRepository(
    path.resolve(process.env.GRANTPATH_DATA_DIR || ".local-data"),
  ));
}
