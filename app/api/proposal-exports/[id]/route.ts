import { ExportCancellationSchema, assertExportRequest, proposalExportService } from "../../../../lib/proposals/export-service";
import { readJSON } from "../../../../packages/runtime/src/body";
import { errorResponse } from "../../../../packages/runtime/src/index";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
type Context = { params: Promise<{ id: string }> };
export async function GET(request: Request, context: Context) {
  try {
    assertExportRequest(request);
    return Response.json(await proposalExportService().status((await context.params).id), { headers: { "cache-control": "no-store" } });
  } catch (error) { return errorResponse(error); }
}
export async function DELETE(request: Request, context: Context) {
  try {
    assertExportRequest(request, true);
    const input = await readJSON(request, ExportCancellationSchema, 120_000);
    return Response.json(await proposalExportService().cancel((await context.params).id, input.expectedRevision), { headers: { "cache-control": "no-store" } });
  } catch (error) { return errorResponse(error); }
}
