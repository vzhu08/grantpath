import { readJSON } from "../../packages/runtime/src/body";
import { errorResponse, KitError } from "../../packages/runtime/src/index";
import { assertLocalRequest } from "../http";
import { repository } from "../repository";
import { generatePreview, RespondInput, SuggestInput } from "./generation";
import { acquireGeneration } from "./limiter";
import type { Workspace } from "./context";
export async function previewRequest(request:Request,kind:"suggest"|"respond") {
  let release:(()=>void)|undefined;const signal=AbortSignal.any([request.signal,AbortSignal.timeout(22_000)]);
  try{assertLocalRequest(request,true);const input=kind==="suggest"?await readJSON(request,SuggestInput,120_000):await readJSON(request,RespondInput,120_000);release=acquireGeneration();const state=await repository().read() as Workspace;return Response.json(await generatePreview(state,kind,input,signal),{headers:{"cache-control":"no-store"}});}
  catch(error){return errorResponse(signal.aborted?new KitError("CANCELLED_OR_TIMEOUT","Preview cancelled or timed out. Your manual text is preserved.",408):error);}
  finally{release?.();}
}
