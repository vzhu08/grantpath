import { readJSON } from "../../packages/runtime/src/body";
import { errorResponse, KitError } from "../../packages/runtime/src/index";
import { assertLocalRequest } from "../http";
import { repository } from "../repository";
import { generatePreview, RespondInput, SuggestInput,responseContext } from "./generation";
import { acquireGeneration } from "./limiter";
import type { Workspace } from "./context";
import { vaultRuntimeState } from "../vault/service";
import { storage } from "../vault/storage";
import { find } from "./context";
export async function previewRequest(request:Request,kind:"suggest"|"respond") {
  let release:(()=>void)|undefined;const signal=AbortSignal.any([request.signal,AbortSignal.timeout(22_000)]);
  try{assertLocalRequest(request,true);const input=kind==="suggest"?await readJSON(request,SuggestInput,120_000):await readJSON(request,RespondInput,120_000);release=acquireGeneration();const repo=repository(),state=await vaultRuntimeState(await repo.read(),repo.directory) as Workspace;if(kind==="respond"){const context=responseContext(state,RespondInput.parse(input));for(const link of context.evidence){const source=find(state.sources,link.citation.sourceId),origin=source.versions.find(v=>v.version===link.citation.version)?.fileOrigin;if(origin&&!origin.manualEdit)await storage(repo.directory).readText(find(state.parseAttempts,origin.parseAttemptId));}}return Response.json(await generatePreview(state,kind,input,signal),{headers:{"cache-control":"no-store"}});}
  catch(error){return errorResponse(signal.aborted?new KitError("CANCELLED_OR_TIMEOUT","Preview cancelled or timed out. Your manual text is preserved.",408):error);}
  finally{release?.();}
}
