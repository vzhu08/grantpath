import { describe,it,expect } from "vitest";
import { createResubmissionDemoWorkspace } from "../../lib/resubmissions/demo";
import { concernState } from "../../lib/resubmissions/matrix";
import { last,normalized } from "../../lib/resubmissions/context";
import { packetJSON } from "../../lib/resubmissions/exports";
import { validateResubmissionGraph } from "../../lib/resubmissions/validation";
import { resubmissionView } from "../../lib/resubmissions/view";
import { harness } from "./harness";
import { cite } from "../../lib/evidence";
import { StateSchema } from "../../lib/schema";
describe("judge-visible resubmission proof",()=>{
  it("preserves all14 sections and shows supported clarification / unfinished experiment / targeted reopen / immutable packet",()=>{
    const demo=createResubmissionDemoWorkspace(),{state}=demo;
    expect(state.resubmissions.snapshots[0]!.sections).toHaveLength(14);expect(state.applications.find(a=>a.id===demo.targetApplicationId)!.sections).toHaveLength(14);expect(state.applications.find(a=>a.id===demo.targetApplicationId)!.binding?.manifest).not.toBeNull();
    expect(state.resubmissions.feedback).toHaveLength(3);expect(state.resubmissions.concerns).toHaveLength(4);expect(state.resubmissions.conflicts[0]!.decisions).toHaveLength(1);
    const supported=state.resubmissions.concerns.find(c=>c.id===demo.supportedId)!,experiment=state.resubmissions.concerns.find(c=>c.id===demo.experimentId)!;expect(concernState(state,supported)).toBe("Resolved");expect(concernState(state,experiment)).toBe("In progress");
    const before=packetJSON(state.resubmissions.packets[0]!),snapshot=JSON.stringify(state.resubmissions.snapshots[0]);
    const source=state.sources.find(s=>s.id===demo.linkedSourceId)!,doc=normalized(source.id,last(source.versions).text+" Synthetic correction requires renewed review.");source.versions.push({version:2,text:doc.text,hash:doc.hash,createdAt:"2026-10-25T13:00:00.000Z"});
    expect(concernState(state,supported)).toBe("Needs review");expect(concernState(state,experiment)).toBe("In progress");
    const restarted=JSON.parse(JSON.stringify(state));validateResubmissionGraph(restarted);expect(packetJSON(restarted.resubmissions.packets[0])).toBe(before);expect(JSON.stringify(restarted.resubmissions.snapshots[0])).toBe(snapshot);
  });
  it("archived target links remain valid history; unresolved full packets and views still work",()=>{
    const h=harness(),id=h.concern(),aid=h.action(id);h.complete(id,aid);const target=h.state.applications.find(a=>a.id===h.state.resubmissions.attempts[0]!.targetApplicationId)!,removed=target.sections.shift()!;target.archivedSections=[removed];target.sections.push({key:"renamed-summary",label:"Renamed summary",wordLimit:null,revisions:[]});
    validateResubmissionGraph(h.state);expect(concernState(h.state,h.state.resubmissions.concerns[0]!)).toBe("Needs review");expect(resubmissionView(h.state).attempts[h.attemptId]!.comparison.notice).toContain("archived");
    expect(()=>h.run({type:"saveResponsePacket",attemptId:h.attemptId,concernIds:[id],includeOriginal:true,includeTarget:true,operationId:"archived-packet"})).not.toThrow();
  });
  it("saved submitted call citations are pinned while feedback never becomes research evidence",()=>{
    const h=harness(),app=h.state.applications[0]!,call=h.state.opportunities[0]!,source=h.state.sources.find(s=>s.id===call.sourceId)!;app.sections[0]!.revisions.push({id:"original-call-draft",text:"Original call instruction",citations:[cite(source,"FICTIONAL DEMO CALL")],selectedSources:[],projectRevision:1,callRevision:1,callSourceVersion:1,missingInputs:[],mode:"fixture",promptVersion:"synthetic-resubmission-v1",createdAt:h.env.at});
    const captureId=h.run({type:"createSubmissionCapture",operationId:"call-capture-create",projectId:app.projectId,originalApplicationId:app.id,method:"saved-drafts",supersedesId:null,correctionReason:""}).selectedId!;
    h.run({type:"saveCaptureSection",captureId,captureRevision:1,sectionId:"summary",label:"Summary",text:"",savedRevisionId:"original-call-draft"});
    expect(()=>h.run({...h.freeze,captureId,captureRevision:2,operationId:"call-capture"})).not.toThrow();expect(last(h.state.resubmissions.snapshots).evidence[0]!.type).toBe("call");
  });
  it("reviewed copies retain repeated citations while selecting each research source only once",()=>{
    const h=harness(),app=h.state.applications[0]!,source=h.state.sources.find(s=>s.id==="demo-methods")!,citation=cite(source,"Calibration drift and missing measurements will be documented.");
    app.sections[0]!.revisions.push({id:"many-citations",text:"Synthetic submitted calibration description.",citations:Array.from({length:20},()=>({...citation})),selectedSources:[{sourceId:source.id,version:1,hash:source.versions[0]!.hash}],projectRevision:1,callRevision:1,callSourceVersion:1,missingInputs:[],mode:"fixture",promptVersion:"synthetic-resubmission-v1",createdAt:h.env.at});
    const captureId=h.run({type:"createSubmissionCapture",operationId:"many-citations-capture",projectId:app.projectId,originalApplicationId:app.id,method:"saved-drafts",supersedesId:null,correctionReason:""}).selectedId!;h.run({type:"saveCaptureSection",captureId,captureRevision:1,sectionId:"summary",label:"Summary",text:"",savedRevisionId:"many-citations"});const snapshotId=h.run({...h.freeze,captureId,captureRevision:2,operationId:"many-citations-freeze",coverage:{...h.freeze.coverage,included:["Summary"]}}).selectedId!;
    const attemptId=h.run({...h.create,snapshotId,mode:"reviewed-copy",confirmCopy:true,mappings:[{originalSectionId:"summary",targetSectionIds:["summary"],note:"Reviewed stable identity."}],operationId:"many-citations-attempt"}).selectedId!,attempt=h.state.resubmissions.attempts.find(a=>a.id===attemptId)!,target=h.state.applications.find(a=>a.id===attempt.targetApplicationId)!,revision=target.sections[0]!.revisions[0]!;expect(revision.citations).toHaveLength(20);expect(revision.selectedSources).toHaveLength(1);expect(StateSchema.safeParse(h.state).success).toBe(true);
  });
  it("normalizes saved capture text without rewriting its historical source revision",()=>{const h=harness(),app=h.state.applications[0]!,raw="\uFEFF😀 submitted\r\nline two\r";app.sections[0]!.revisions.push({id:"raw-submitted",text:raw,citations:[],selectedSources:[],projectRevision:1,callRevision:1,callSourceVersion:1,missingInputs:[],mode:"manual",promptVersion:"manual",createdAt:h.env.at});const captureId=h.run({type:"createSubmissionCapture",operationId:"raw-capture",projectId:app.projectId,originalApplicationId:app.id,method:"saved-drafts",supersedesId:null,correctionReason:""}).selectedId!;h.run({type:"saveCaptureSection",captureId,captureRevision:1,sectionId:"summary",label:"Summary",text:"",savedRevisionId:"raw-submitted"});expect(h.state.resubmissions.captures.find(c=>c.id===captureId)!.sections[0]!.text).toBe("😀 submitted\nline two\n");expect(h.state.applications[0]!.sections[0]!.revisions[0]!.text).toBe(raw);});
});
