import { assertLocalRequest } from "../../../../../../../lib/http";
import { repository } from "../../../../../../../lib/repository";
import {
  resolveFile,
  queueParse,
  recoverVault,
} from "../../../../../../../lib/vault/service";
import { storage } from "../../../../../../../lib/vault/storage";
import {
  errorResponse,
  KitError,
} from "../../../../../../../packages/runtime/src/index";
import { readJSON } from "../../../../../../../packages/runtime/src/body";
import { Id } from "../../../../../../../lib/schema";
import { z } from "zod";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
type Ctx = { params: Promise<{ id: string; versionId: string }> };
export async function GET(request: Request, ctx: Ctx) {
  try {
    assertLocalRequest(request);
    const { id, versionId } = await ctx.params,
      repo = repository(),
      state = await repo.read(),
      { version } = resolveFile(state, id, versionId);
    await storage(repo.directory).read(version);
    const attempt = state.parseAttempts.find(
      (p) =>
        p.id === new URL(request.url).searchParams.get("attemptId") &&
        p.documentVersionId === version.id,
    );
    if (!attempt)
      throw new KitError("NOT_FOUND", "Extraction unavailable.", 404);
    const text = await storage(repo.directory).readText(attempt);
    return Response.json(
      {
        text,
        segments: attempt.segments,
        artifactSha256: attempt.artifactSha256,
      },
      { headers: { "cache-control": "no-store" } },
    );
  } catch (e) {
    return errorResponse(e);
  }
}
