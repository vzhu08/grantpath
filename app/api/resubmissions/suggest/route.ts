import { previewRequest } from "../../../../lib/resubmissions/http";
export const runtime="nodejs";
export const POST=(request:Request)=>previewRequest(request,"suggest");
