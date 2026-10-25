import { NSF_STANDARD_RESEARCH_TEMPLATE } from "../../../lib/proposals/nsf-template";
import { assertExportRequest } from "../../../lib/proposals/export-service";
import { errorResponse } from "../../../packages/runtime/src/index";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export async function GET(request: Request) {
  try {
    assertExportRequest(request);
    return Response.json({ templates: [NSF_STANDARD_RESEARCH_TEMPLATE] }, { headers: { "cache-control": "no-store" } });
  } catch (error) { return errorResponse(error); }
}
