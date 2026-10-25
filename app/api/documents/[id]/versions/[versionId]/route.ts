import { assertLocalRequest } from "../../../../../../lib/http";
import { repository } from "../../../../../../lib/repository";
import {
  resolveFile,
  queueParse,
  recoverVault,
} from "../../../../../../lib/vault/service";
import { storage } from "../../../../../../lib/vault/storage";
import {
  errorResponse,
  KitError,
} from "../../../../../../packages/runtime/src/index";
import { readJSON } from "../../../../../../packages/runtime/src/body";
import { Id } from "../../../../../../lib/schema";
import { z } from "zod";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
type Ctx = { params: Promise<{ id: string; versionId: string }> };
export async function GET(request: Request, ctx: Ctx) {
  try {
    assertLocalRequest(request);
    await recoverVault();
    const { id, versionId } = await ctx.params,
      state = await repository().read(),
      file = resolveFile(state, id, versionId);
    return Response.json(
      {
        ...file,
        attempts: state.parseAttempts.filter(
          (p) => p.documentVersionId === versionId,
        ),
      },
      { headers: { "cache-control": "no-store" } },
    );
  } catch (e) {
    return errorResponse(e);
  }
}
