import { errorResponse } from "../../../../packages/runtime/src/index";
import { assertLocalRequest } from "../../../../lib/http";
import { repository } from "../../../../lib/repository";
import { resubmissionView } from "../../../../lib/resubmissions/view";
import type { Workspace } from "../../../../lib/resubmissions/context";
import { vaultRuntimeState } from "../../../../lib/vault/service";
export const runtime="nodejs";
export const dynamic="force-dynamic";
export async function GET(request:Request) {try{assertLocalRequest(request);const repo=repository();return Response.json(resubmissionView(await vaultRuntimeState(await repo.read(),repo.directory) as Workspace),{headers:{"cache-control":"no-store"}});}catch(error){return errorResponse(error);}}
