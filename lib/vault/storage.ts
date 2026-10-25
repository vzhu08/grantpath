import { createHash, randomUUID } from "node:crypto";
import {
  mkdir,
  open,
  readFile,
  lstat,
  readdir,
  unlink,
  link,
  realpath,
} from "node:fs/promises";
import path from "node:path";
import { KitError } from "../../packages/runtime/src/index";
import type { State } from "../schema";
import {
  DocumentVersionSchema,
  ParseAttemptSchema,
  type DocumentVersion,
  type ParseAttempt,
} from "./schema";
import { MAX_FILE_BYTES } from "./admission";
export const MAX_BLOB_BYTES = 250_000_000,
  MAX_ARTIFACT_BYTES = 50_000_000,
  MAX_TEXT_UNITS = 200_000;
export const sha256 = (bytes: Uint8Array | string) =>
  createHash("sha256").update(bytes).digest("hex");
const queues = new Map<string, Promise<unknown>>();
function storageError(
  message = "The vault is unavailable. Preserve the workspace and restore its metadata and files together.",
  code = "VAULT_STORAGE",
): never {
  throw new KitError(code, message, 503);
}
function validId(id: string) {
  if (!/^[a-zA-Z0-9_-]{1,100}$/.test(id))
    throw new KitError("INVALID_ID", "Invalid vault record ID.", 400);
  return id;
}
type Options = {
  graceMs?: number;
  maxBlobBytes?: number;
  maxArtifactBytes?: number;
  beforePublish?: () => Promise<void> | void;
};
export function storage(directory: string, options: Options = {}) {
  const dataRoot = path.resolve(directory),
    root = path.join(dataRoot, "vault");
  async function ensure() {
    await mkdir(dataRoot, { recursive: true });
    for (const child of [
      root,
      ...["blobs", "staging", "extractions"].map((n) => path.join(root, n)),
    ]) {
      await mkdir(child, { recursive: true });
      const stat = await lstat(child);
      if (stat.isSymbolicLink() || !stat.isDirectory())
        storageError("The configured vault contains an unsafe storage path.");
    }
    const actual = await realpath(root),
      expected = path.join(await realpath(dataRoot), "vault");
    if (actual.toLowerCase() !== expected.toLowerCase())
      storageError(
        "The vault path must stay beneath its configured data directory.",
      );
  }
  const filePath = (kind: string, id: string) => {
    const resolved = path.resolve(
      root,
      kind,
      validId(id) + (kind === "extractions" ? ".txt" : ".bin"),
    );
    if (!resolved.startsWith(path.resolve(root, kind) + path.sep))
      storageError();
    return resolved;
  };
  async function size(kind: string) {
    let bytes = 0;
    for (const entry of await readdir(path.join(root, kind), {
      withFileTypes: true,
    })) {
      const item = await lstat(path.join(root, kind, entry.name));
      if (!item.isFile() || item.isSymbolicLink())
        storageError("Unexpected files or links were found in vault storage.");
      bytes += item.size;
    }
    return bytes;
  }
  async function serial<T>(operation: () => Promise<T>): Promise<T> {
    const tail = queues.get(root) ?? Promise.resolve();
    const result = tail.then(operation, operation);
    const next = result.catch(() => {});
    queues.set(root, next);
    try {
      return await result;
    } finally {
      if (queues.get(root) === next) queues.delete(root);
    }
  }
  async function publish(
    kind: "blobs" | "extractions",
    id: string,
    bytes: Uint8Array,
  ) {
    return serial(async () => {
      let staging: string | undefined;
      try {
        await ensure();
        const quota =
          kind === "blobs"
            ? (options.maxBlobBytes ?? MAX_BLOB_BYTES)
            : (options.maxArtifactBytes ?? MAX_ARTIFACT_BYTES);
        // Staging reservations count against physical capacity before publication.
        if ((await size(kind)) + (await size("staging")) + bytes.length > quota)
          storageError(
            "Vault capacity reached. Back up the complete workspace before changing its storage limit.",
            "VAULT_QUOTA",
          );
        const target = filePath(kind, id);
        staging = filePath("staging", `stage-${randomUUID()}`);
        const file = await open(staging, "wx", 0o600);
        try {
          await file.writeFile(bytes);
          await file.sync();
        } finally {
          await file.close();
        }
        await options.beforePublish?.();
        // A same-volume hard link publishes atomically and fails if an ID already exists.
        // Unlike rename on Windows it can never replace an immutable prior version.
        await link(staging, target);
      } catch (error) {
        if (error instanceof KitError) throw error;
        if ((error as NodeJS.ErrnoException).code === "EEXIST")
          throw new KitError(
            "IMMUTABLE_VERSION",
            "This vault version already exists; create a new version instead.",
            409,
          );
        storageError();
      } finally {
        if (staging) await unlink(staging).catch(() => {});
      }
    });
  }
  async function boundedRead(
    kind: "blobs" | "extractions",
    id: string,
    maximum: number,
  ) {
    await ensure();
    const filename = filePath(kind, id);
    try {
      const stat = await lstat(filename);
      if (!stat.isFile() || stat.isSymbolicLink() || stat.size > maximum)
        storageError(
          "A vault file failed integrity verification.",
          "VAULT_CORRUPT",
        );
      const bytes = await readFile(filename);
      if (bytes.length > maximum || bytes.length !== stat.size)
        storageError("A vault file changed while being read.", "VAULT_CORRUPT");
      return bytes;
    } catch (error) {
      if (error instanceof KitError) throw error;
      if ((error as NodeJS.ErrnoException).code === "ENOENT")
        storageError(
          "The saved original or extraction is missing. Restore its matching vault backup.",
          "VAULT_MISSING",
        );
      storageError();
    }
  }
  return {
    put: async (id: string, bytes: Uint8Array) => {
      validId(id);
      if (!bytes.length || bytes.length > MAX_FILE_BYTES)
        throw new KitError(
          "FILE_TOO_LARGE",
          "Use a nonempty file of at most 10,000,000 bytes.",
          413,
        );
      await publish("blobs", id, bytes);
      return sha256(bytes);
    },
    read: async (input: DocumentVersion) => {
      const version = DocumentVersionSchema.parse(input),
        bytes = await boundedRead("blobs", version.id, MAX_FILE_BYTES);
      if (bytes.length !== version.bytes || sha256(bytes) !== version.sha256)
        storageError(
          "The saved original failed size or SHA-256 verification. Restore its matching backup.",
          "VAULT_CORRUPT",
        );
      return bytes;
    },
    writeText: async (id: string, text: string) => {
      if (text.length > MAX_TEXT_UNITS)
        throw new KitError(
          "TEXT_TOO_LARGE",
          "Extraction exceeds 200,000 UTF-16 units; no text was truncated.",
          413,
        );
      const bytes = Buffer.from(text, "utf8");
      await publish("extractions", id, bytes);
      return sha256(bytes);
    },
    readText: async (input: ParseAttempt) => {
      const attempt = ParseAttemptSchema.parse(input);
      if (!attempt.artifactSha256)
        throw new KitError(
          "TEXT_UNAVAILABLE",
          "This extraction has no reviewed text artifact.",
          404,
        );
      const bytes = await boundedRead(
        "extractions",
        attempt.id,
        MAX_TEXT_UNITS * 4,
      );
      if (sha256(bytes) !== attempt.artifactSha256)
        storageError(
          "The saved extraction failed SHA-256 verification.",
          "VAULT_CORRUPT",
        );
      let text: string;
      try {
        text = new TextDecoder("utf-8", { fatal: true }).decode(bytes);
      } catch {
        return storageError(
          "The saved extraction is not valid UTF-8.",
          "VAULT_CORRUPT",
        );
      }
      if (text.length !== attempt.textLength || text.length > MAX_TEXT_UNITS)
        storageError(
          "The saved extraction failed length verification.",
          "VAULT_CORRUPT",
        );
      return text;
    },
    physicalBytes: async () => {
      await ensure();
      return (await size("blobs")) + (await size("staging"));
    },
    artifactBytes: async () => {
      await ensure();
      return size("extractions");
    },
    recover: async (state: State) =>
      serial(async () => {
        await ensure();
        const cutoff = Date.now() - (options.graceMs ?? 3_600_000);
        const blobs = new Set([
          ...state.documentVersions.map((v) => v.id),
          ...state.handoffs.flatMap((h) =>
            h.files.map((f) => f.documentVersionId),
          ),
        ]);
        const artifacts = new Set([
          ...state.parseAttempts.map((a) => a.id),
          ...state.sources.flatMap((s) =>
            s.versions.flatMap((v) =>
              v.fileOrigin ? [v.fileOrigin.parseAttemptId] : [],
            ),
          ),
        ]);
        let removed = 0;
        for (const kind of ["staging", "blobs", "extractions"] as const) {
          for (const entry of await readdir(path.join(root, kind), {
            withFileTypes: true,
          })) {
            const filename = path.join(root, kind, entry.name),
              stat = await lstat(filename);
            if (!stat.isFile() || stat.isSymbolicLink())
              storageError(
                "Recovery stopped because an unsafe storage entry was found.",
              );
            const extension = kind === "extractions" ? ".txt" : ".bin",
              id = entry.name.endsWith(extension)
                ? entry.name.slice(0, -extension.length)
                : "";
            const referenced =
              kind === "blobs"
                ? blobs.has(id)
                : kind === "extractions"
                  ? artifacts.has(id)
                  : false;
            if (!referenced && stat.mtimeMs < cutoff) {
              await unlink(filename);
              removed++;
            }
          }
        }
        return { removed };
      }),
  };
}
