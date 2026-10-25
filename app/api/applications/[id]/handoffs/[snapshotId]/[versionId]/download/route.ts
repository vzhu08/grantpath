import { assertLocalRequest } from "../../../../../../../../lib/http";
import { repository } from "../../../../../../../../lib/repository";
import {
  createHandoff,
  resolveFile,
} from "../../../../../../../../lib/vault/service";
import { storage } from "../../../../../../../../lib/vault/storage";
import { PhaseSchema } from "../../../../../../../../lib/vault/schema";
import { Id } from "../../../../../../../../lib/schema";
import {
  errorResponse,
  KitError,
} from "../../../../../../../../packages/runtime/src/index";
import { readJSON } from "../../../../../../../../packages/runtime/src/body";
import { z } from "zod";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
type Ctx = {
  params: Promise<{ id: string; snapshotId: string; versionId: string }>;
};
export async function GET(request: Request, ctx: Ctx) {
  try {
    assertLocalRequest(request);
    const { id, snapshotId, versionId } = await ctx.params,
      repo = repository(),
      state = await repo.read(),
      snapshot = state.handoffs.find(
        (h) => h.id === snapshotId && h.applicationId === id,
      ),
      file = snapshot?.files.find(
        (f) =>
          f.documentVersionId === versionId &&
          (!new URL(request.url).searchParams.get("requirementId") ||
            f.requirementId ===
              new URL(request.url).searchParams.get("requirementId")),
      );
    if (!snapshot || !file)
      throw new KitError("NOT_FOUND", "Handoff file unavailable.", 404);
    const { version } = resolveFile(
      state,
      file.documentId,
      versionId,
      snapshot.projectId,
    );
    if (version.sha256 !== file.sha256 || version.bytes !== file.bytes)
      throw new KitError("INTEGRITY", "Saved file integrity failed.", 503);
    return new Response(
      new Uint8Array(await storage(repo.directory).read(version)),
      {
        headers: {
          "content-type": file.mime,
          "content-disposition": `attachment; filename="${file.transferFilename}"`,
          "x-content-type-options": "nosniff",
          "cache-control": "no-store",
        },
      },
    );
  } catch (e) {
    return errorResponse(e);
  }
}
