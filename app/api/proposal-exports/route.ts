import { ExportRequestSchema, assertExportRequest, proposalExportService } from "../../../lib/proposals/export-service";
import { readJSON } from "../../../packages/runtime/src/body";
import { errorResponse } from "../../../packages/runtime/src/index";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export async function POST(request: Request) {
  try {
    assertExportRequest(request, true);
    const input = await readJSON(request, ExportRequestSchema, 120_000);
    return Response.json(await proposalExportService().request(input), { status: 202, headers: { "cache-control": "no-store" } });
  } catch (error) { return errorResponse(error); }
}
