import { beforeEach,describe,it,expect,vi } from "vitest";
import { harness } from "./harness";
import { generatePreview,previews,suggestionContext,responseContext,validateSuggestions,buildPrompt,requirePreview } from "../../lib/resubmissions/generation";
import { last,sha256 } from "../../lib/resubmissions/context";
import { applyResubmissionCommand } from "../../lib/resubmissions/workflow";
import { acquireGeneration } from "../../lib/resubmissions/limiter";
import { quoteFeedback } from "../../lib/resubmissions/feedback";
beforeEach(()=>previews.clear());
const request=(h:ReturnType<typeof harness>)=>({attemptId:h.attemptId,ranges:[quoteFeedback(h.state.resubmissions.feedback[0]!,0,20)],originalSectionIds:[],mode:"fixture" as const,confirmUsage:false,expectedRevision:h.state.revision});
describe("bounded resubmission previews",()=>{
  it("returns proposals only; strict output cannot set completion or fabricate a quotation",async()=>{
    const h=harness(),input=request(h),context=suggestionContext(h.state,input),before=h.state.resubmissions.concerns.length;
    const result=await generatePreview(h.state,"suggest",input);expect(h.state.resubmissions.concerns).toHaveLength(before);expect(result.mode).toBe("fixture");
    const candidate=(result.preview as {candidates:unknown[]}).candidates[0];
    expect(()=>validateSuggestions({candidates:[{...candidate as object,completed:true}]},context,h.state)).toThrow();
    const q=input.ranges[0]!;expect(()=>validateSuggestions({candidates:[{id:"bad",interpretation:"Changed",citations:[{...q,start:1}],category:"clarification",evidenceNeed:"",questions:[]}]},context,h.state)).toThrow();
  });
  it("accepts/dismisses the complete candidate batch atomically and consumes only after durable commit",async()=>{
    const h=harness(),result=await generatePreview(h.state,"suggest",request(h)),candidate=(result.preview as {candidates:{id:string;interpretation:string;citations:ReturnType<typeof quoteFeedback>[]}[]}).candidates[0]!;
    const command={type:"acceptConcernPreview" as const,attemptId:h.attemptId,previewToken:result.token,decisions:[{candidateId:candidate.id,decision:"accept" as const,fields:{interpretation:candidate.interpretation,citations:candidate.citations,importance:"major" as const,disposition:"clarify" as const,confirmed:true,mappings:[],noEditReason:"No edit appropriate after interpretation review.",rationale:""},reason:"Researcher reviewed the suggestion."}]};
    const pending=applyResubmissionCommand(h.state,{expectedRevision:h.state.revision,command},h.env);expect(pending.consumedPreviewToken).toBe(result.token);expect(previews.has(result.token)).toBe(true);expect(h.state.resubmissions.concerns).toHaveLength(0);
    // Simulate a failed storage commit by retaining the original state; retry is
    // still possible because token removal belongs to the durable commit effect.
    h.run(command);expect(previews.has(result.token)).toBe(false);expect(h.state.resubmissions.concerns[0]!.origin).toBe("fixture");expect(()=>h.run(command)).toThrow(/expired/);
  });
  it("rejects wrong kind, changed state, expiry, restart and malformed provider output",async()=>{
    const h=harness(),result=await generatePreview(h.state,"suggest",request(h));
    expect(()=>requirePreview(result.token,"respond",h.state,h.attemptId,null)).toThrow(/operation/);
    expect(()=>requirePreview(result.token,"suggest",{...h.state,revision:h.state.revision+1},h.attemptId,null)).toThrow(/changed/);
    previews.get(result.token)!.expires=0;expect(()=>requirePreview(result.token,"suggest",h.state,h.attemptId,null)).toThrow(/expired/);previews.clear();expect(()=>requirePreview(result.token,"suggest",h.state,h.attemptId,null)).toThrow(/expired/);
    await expect(generatePreview(h.state,"suggest",{...request(h),mode:"live",confirmUsage:true},undefined,{structured:async()=>({output:{candidates:[{text:"truncated or malformed"}]}})})).rejects.toThrow(/validation/);
  });
  it("live consent, missing configuration, cancellation and prompt bounds preserve manual records",async()=>{
    const h=harness(),before=JSON.stringify(h.state);await expect(generatePreview(h.state,"suggest",{...request(h),mode:"live"})).rejects.toThrow(/Confirm provider/);
    const abort=new AbortController();abort.abort();await expect(generatePreview(h.state,"suggest",request(h),abort.signal)).rejects.toThrow();
    expect(()=>buildPrompt("suggest",{text:"x".repeat(50_001)})).toThrow(/50,000/);
    await expect(generatePreview(h.state,"suggest",{...request(h),mode:"live",confirmUsage:true},undefined,{structured:async()=>{throw Error("Provider unavailable");}})).rejects.toThrow(/failed/);
    expect(JSON.stringify(h.state)).toBe(before);
  });
  it("a disabled live adapter fails visibly without a fixture fallback",async()=>{
    const h=harness(),before=JSON.stringify(h.state);vi.stubEnv("RUN_LIVE_AI","false");try{await expect(generatePreview(h.state,"suggest",{...request(h),mode:"live",confirmUsage:true})).rejects.toMatchObject({status:503});expect(previews.size).toBe(0);expect(JSON.stringify(h.state)).toBe(before);}finally{vi.unstubAllEnvs();}
  });
  it("in-flight mocked timeout returns408 and preserves accepted work",async()=>{
    const h=harness(),before=JSON.stringify(h.state),signal=AbortSignal.timeout(10);await expect(generatePreview(h.state,"suggest",{...request(h),mode:"live",confirmUsage:true},signal,{structured:async request=>{request.signal?.throwIfAborted();return new Promise((_,reject)=>request.signal?.addEventListener("abort",()=>reject(new Error("Mocked provider timeout")),{once:true}));}})).rejects.toMatchObject({status:408});expect(previews.size).toBe(0);expect(JSON.stringify(h.state)).toBe(before);
  });
  it("manual intake or private concern edits cannot be relabeled as synthetic fixture input",async()=>{
    const h=harness();h.env.fixture=false;h.run({type:"saveFeedbackSource",attemptId:h.attemptId,label:"Private reviewer",kind:"individual-review",url:"",text:"Private researcher feedback."});
    const privateSource=last(h.state.resubmissions.feedback);await expect(generatePreview(h.state,"suggest",{...request(h),ranges:[quoteFeedback(privateSource,0,privateSource.versions[0]!.text.length)]})).rejects.toThrow(/synthetic/);
    const concernId=h.concern(),concern=h.state.resubmissions.concerns.find(c=>c.id===concernId)!;expect(concern.provenance).toBe("researcher");
    const input={concernId,actionIds:[],evidenceKeys:[],revisionKeys:[],includeOriginal:false,mode:"fixture" as const,confirmUsage:false,expectedRevision:h.state.revision};expect(responseContext(h.state,input).synthetic).toBe(false);await expect(generatePreview(h.state,"respond",input)).rejects.toThrow(/synthetic/);
  });
  it("response context narrows target/evidence text to selected passages and preserves classifications",()=>{
    const h=harness(),id=h.concern(),aid=h.action(id),action=h.state.resubmissions.actions[0]!,link=action.fields.revisions[0]!;
    const target=h.state.applications.find(a=>a.id===link.applicationId)!.sections[0]!.revisions[0]!;target.text="Selected. PRIVATE_UNSELECTED";link.digest=sha256("placeholder");
    // Replace digest with a raw text SHA-256 through the public helper.
    const original=h.target("approach","Selected. PRIVATE_UNSELECTED");original.range={start:0,end:9,quote:"Selected."};action.fields.revisions=[original];
    const context=responseContext(h.state,{concernId:id,actionIds:[aid],evidenceKeys:[],revisionKeys:[sha256(original)],includeOriginal:false,mode:"live",confirmUsage:true,expectedRevision:h.state.revision});expect(JSON.stringify(context.data)).not.toContain("PRIVATE_UNSELECTED");
  });
  it("uses the same process-wide limiter as the existing draft endpoint",()=>{
    const g=globalThis as typeof globalThis&{grantpathGenerationLimit?:{inFlight:boolean;attempts:number[]}};g.grantpathGenerationLimit={inFlight:false,attempts:[]};
    const release=acquireGeneration();expect(()=>acquireGeneration()).toThrow(/one active/);release();for(let i=0;i<5;i++)acquireGeneration()();expect(()=>acquireGeneration()).toThrow(/six attempts/);g.grantpathGenerationLimit={inFlight:false,attempts:[]};
  });
});
