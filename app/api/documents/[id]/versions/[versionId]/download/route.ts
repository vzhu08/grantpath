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
      { version } = resolveFile(state, id, versionId),
      bytes = await storage(repo.directory).read(version);
    return new Response(new Uint8Array(bytes), {
      headers: {
        "content-type": version.mime,
        "content-disposition": `attachment; filename="${version.filename.replace(/[^a-zA-Z0-9_.-]/g, "_")}"`,
        "x-content-type-options": "nosniff",
        "cache-control": "no-store",
      },
    });
  } catch (e) {
    return errorResponse(e);
  }
}
