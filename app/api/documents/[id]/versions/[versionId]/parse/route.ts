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
export async function POST(request: Request, ctx: Ctx) {
  try {
    assertLocalRequest(request, true);
    await recoverVault();
    const { id, versionId } = await ctx.params,
      repo = repository();
    resolveFile(await repo.read(), id, versionId);
    const input = await readJSON(
      request,
      z
        .object({
          expectedRevision: z.number().int().nonnegative(),
          idempotencyKey: Id,
        })
        .strict(),
      4096,
    );
    return Response.json(await queueParse(versionId, repo, input), {
      status: 202,
      headers: { "cache-control": "no-store" },
    });
  } catch (e) {
    return errorResponse(e);
  }
}
