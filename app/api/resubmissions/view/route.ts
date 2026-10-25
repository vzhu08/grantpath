import { errorResponse } from "../../../../packages/runtime/src/index";
import { assertLocalRequest } from "../../../../lib/http";
import { repository } from "../../../../lib/repository";
import { resubmissionView } from "../../../../lib/resubmissions/view";
import type { Workspace } from "../../../../lib/resubmissions/context";
export const runtime="nodejs";
export const dynamic="force-dynamic";
export async function GET(request:Request) {try{assertLocalRequest(request);return Response.json(resubmissionView(await repository().read() as Workspace),{headers:{"cache-control":"no-store"}});}catch(error){return errorResponse(error);}}
