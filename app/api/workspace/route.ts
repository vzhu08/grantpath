import { readJSON } from "../../../packages/runtime/src/body";
import { errorResponse } from "../../../packages/runtime/src/index";
import { MutationSchema } from "../../../lib/schema";
import { assertLocalRequest } from "../../../lib/http";
import { repository } from "../../../lib/repository";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export async function GET(request: Request) {
  try {
    assertLocalRequest(request);
    return Response.json(await repository().read(), {
      headers: { "cache-control": "no-store" },
    });
  } catch (error) {
    return errorResponse(error);
  }
}
export async function POST(request: Request) {
  try {
    assertLocalRequest(request, true);
    const input = await readJSON(request, MutationSchema, 120_000);
    return Response.json(await repository().mutate(input), {
      headers: { "cache-control": "no-store" },
    });
  } catch (error) {
    return errorResponse(error);
  }
}
