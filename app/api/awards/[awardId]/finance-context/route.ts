import { z } from "zod";
import { assertLocalRequest } from "../../../../../lib/http";
import { readAwards } from "../../../../../lib/awards/read-state";
import { awardFinanceContext } from "../../../../../lib/awards/terms";
import { requireAward } from "../../../../../lib/awards/context";
import { awardErrorResponse } from "../../../../../lib/awards/http";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export async function GET(request: Request, context: { params: Promise<{ awardId: string }> }) {
  try {
    assertLocalRequest(request);
    const { awardId } = z.object({ awardId: z.string().min(1).max(100).regex(/^[a-zA-Z0-9_-]+$/) }).parse(await context.params);
    const { awards } = await readAwards();
    const dto = awardFinanceContext(awards, awardId);
    const expectedHead = new URL(request.url).searchParams.get("expectedHead");
    requireAward(!expectedHead || expectedHead === dto.currentConfirmedTermsVersionId, "Current award terms changed. Reconcile the pinned downstream context.", 409);
    return Response.json(dto, { headers: { "Cache-Control": "no-store", "X-Content-Type-Options": "nosniff" } });
  } catch (error) { return awardErrorResponse(error); }
}
