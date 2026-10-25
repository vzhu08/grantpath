import { z } from "zod";
import { assertLocalRequest } from "../../../../../../lib/http";
import { readAwards } from "../../../../../../lib/awards/read-state";
import { requireAward } from "../../../../../../lib/awards/context";
import { exportAnnualReport } from "../../../../../../lib/awards/exports";
import { awardErrorResponse } from "../../../../../../lib/awards/http";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export async function GET(request: Request, context: { params: Promise<{ snapshotId: string }> }) {
  try {
    assertLocalRequest(request);
    const { snapshotId } = z.object({ snapshotId: z.string().min(1).max(100).regex(/^[a-zA-Z0-9_-]+$/) }).parse(await context.params);
    const format = z.enum(["md", "json"]).parse(new URL(request.url).searchParams.get("format"));
    const { awards } = await readAwards();
    const snapshot = awards.reportSnapshots.find(s => s.id === snapshotId);
    requireAward(snapshot, "Reviewed report snapshot not found.", 404);
    const result = exportAnnualReport(snapshot, format);
    return new Response(result.content, { headers: { "Content-Type": result.contentType, "Content-Disposition": `attachment; filename="${result.filename}"`,
      "Cache-Control": "no-store", "X-Content-Type-Options": "nosniff", "X-GrantPath-Content-Digest": result.digest } });
  } catch (error) { return awardErrorResponse(error); }
}
