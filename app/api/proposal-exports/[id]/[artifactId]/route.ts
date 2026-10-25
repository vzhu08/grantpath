import { assertExportRequest, proposalExportService } from "../../../../../lib/proposals/export-service";
import { errorResponse } from "../../../../../packages/runtime/src/index";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export async function GET(request: Request, context: { params: Promise<{ id: string; artifactId: string }> }) {
  try {
    assertExportRequest(request);
    const params = await context.params;
    const { artifact, bytes } = await proposalExportService().download(params.id, params.artifactId);
    const types = { docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document", pdf: "application/pdf", json: "application/json", md: "text/markdown; charset=utf-8" };
    return new Response(new Uint8Array(bytes), { headers: {
      "content-type": types[artifact.format], "content-disposition": 'attachment; filename="' + artifact.filename + '"',
      "content-length": String(artifact.bytes), "cache-control": "no-store", "x-content-type-options": "nosniff",
      "content-security-policy": "default-src 'none'; sandbox",
    } });
  } catch (error) { return errorResponse(error); }
}
