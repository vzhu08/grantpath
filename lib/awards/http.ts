import { errorResponse } from "../../packages/runtime/src/index";
import { AwardError } from "./context";
export function awardErrorResponse(error: unknown) {
  if (error instanceof AwardError) return Response.json({ error: { code: error.status === 409 ? "REVISION_CONFLICT" : "AWARD_INPUT", message: error.message } },
    { status: error.status, headers: { "Cache-Control": "no-store", "X-Content-Type-Options": "nosniff" } });
  return errorResponse(error);
}
