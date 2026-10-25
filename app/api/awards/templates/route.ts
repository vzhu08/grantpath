import { assertLocalRequest } from "../../../../lib/http";
import { ANNUAL_TEMPLATE, orderedSections } from "../../../../lib/awards/templates";
import { errorResponse } from "../../../../packages/runtime/src/index";

export async function GET(request: Request) {
  try {
    assertLocalRequest(request);
    return Response.json({ ...ANNUAL_TEMPLATE, sections: orderedSections() }, { headers: { "Cache-Control": "no-store", "X-Content-Type-Options": "nosniff" } });
  } catch (error) { return errorResponse(error); }
}
