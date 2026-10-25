import { repository } from "../../../lib/repository";
import { errorResponse } from "../../../packages/runtime/src/index";
export const dynamic = "force-dynamic";
export async function GET() {
  try {
    await repository().read();
    return Response.json(
      {
        status: "ready",
        mode: "local",
        manualWorkflow: true,
        liveAI: "not checked",
        note: "Local storage is readable. This does not verify provider credentials or sponsor rules.",
      },
      { headers: { "cache-control": "no-store" } },
    );
  } catch (error) {
    return errorResponse(error);
  }
}
