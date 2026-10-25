import { assertLocalRequest } from "../../../../../../lib/http";
import { repository } from "../../../../../../lib/repository";
import {
  createHandoff,
  resolveFile,
} from "../../../../../../lib/vault/service";
import { storage } from "../../../../../../lib/vault/storage";
import { PhaseSchema } from "../../../../../../lib/vault/schema";
import { Id } from "../../../../../../lib/schema";
import {
  errorResponse,
  KitError,
} from "../../../../../../packages/runtime/src/index";
import { readJSON } from "../../../../../../packages/runtime/src/body";
import { z } from "zod";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
type Ctx = {
  params: Promise<{ id: string; snapshotId: string }>;
};
export async function GET(request: Request, ctx: Ctx) {
  try {
    assertLocalRequest(request);
    const { id, snapshotId } = await ctx.params,
      state = await repository().read(),
      snapshot = state.handoffs.find(
        (h) => h.id === snapshotId && h.applicationId === id,
      );
    if (!snapshot) throw new KitError("NOT_FOUND", "Handoff unavailable.", 404);
    const app = state.applications.find((a) => a.id === id)!;
    return Response.json(
      {
        snapshot,
        currentInputsMatch: app.revision === snapshot.applicationRevision,
        downloads: snapshot.files.map((f) => ({
          ...f,
          url: `/api/applications/${id}/handoffs/${snapshotId}/${f.documentVersionId}/download?requirementId=${f.requirementId}`,
        })),
      },
      { headers: { "cache-control": "no-store" } },
    );
  } catch (e) {
    return errorResponse(e);
  }
}
