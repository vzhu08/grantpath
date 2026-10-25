import { errorResponse, KitError } from "../../../../../packages/runtime/src/index";
import { assertLocalRequest } from "../../../../../lib/http";
import { repository } from "../../../../../lib/repository";
import { packetJSON, packetMarkdown } from "../../../../../lib/resubmissions/exports";
import type { Workspace } from "../../../../../lib/resubmissions/context";
export const runtime="nodejs";
export const dynamic="force-dynamic";
export async function GET(request:Request,context:{params:Promise<{id:string}>}) {
  try{assertLocalRequest(request);const {id}=await context.params,format=new URL(request.url).searchParams.get("format")??"md";if(!["md","json"].includes(format))throw new KitError("FORMAT","Choose md or json.",400);const state=await repository().read() as Workspace,packet=state.resubmissions?.packets.find(p=>p.id===id);if(!packet)throw new KitError("NOT_FOUND","Saved response packet not found.",404);if(!state.resubmissions.attempts.some(a=>a.id===packet.attemptId&&a.projectId===packet.projectId)||!state.projects.some(p=>p.id===packet.projectId))throw new KitError("SCOPE","Packet project or attempt scope is unavailable.",403);return new Response(format==="md"?packetMarkdown(packet):packetJSON(packet),{headers:{"content-type":format==="md"?"text/markdown; charset=utf-8":"application/json; charset=utf-8","content-disposition":`attachment; filename="grantpath-response-${packet.id}.${format}"`,"x-content-type-options":"nosniff","cache-control":"no-store"}});}
  catch(error){return errorResponse(error);}
}
