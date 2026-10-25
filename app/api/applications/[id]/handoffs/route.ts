import { assertLocalRequest } from "../../../../../lib/http";
import { repository } from "../../../../../lib/repository";
import { createHandoff, resolveFile } from "../../../../../lib/vault/service";
import { storage } from "../../../../../lib/vault/storage";
import { PhaseSchema } from "../../../../../lib/vault/schema";
import { Id } from "../../../../../lib/schema";
import {
  errorResponse,
  KitError,
} from "../../../../../packages/runtime/src/index";
import { readJSON } from "../../../../../packages/runtime/src/body";
import { z } from "zod";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
type Ctx = {
  params: Promise<{ id: string }>;
};
export async function POST(request: Request, ctx: Ctx) {
  try {
    assertLocalRequest(request, true);
    const { id } = await ctx.params,
      input = await readJSON(
        request,
        z
          .object({
            expectedRevision: z.number().int().nonnegative(),
            phase: PhaseSchema,
            idempotencyKey: Id,
          })
          .strict(),
        4096,
      );
    return Response.json(await createHandoff(id, input), {
      status: 201,
      headers: { "cache-control": "no-store" },
    });
  } catch (e) {
    return errorResponse(e);
  }
}
