import { afterEach,beforeEach,describe,it,expect,vi } from "vitest";
import { createApplication,createDemo } from "../../lib/fixtures";
import { cite } from "../../lib/evidence";
import { readiness } from "../../lib/readiness";
import { applyCommand } from "../../lib/repository";
import { generationContext } from "../../lib/generation";
import { StateSchema } from "../../lib/schema";
import { validateStateIntegrity,applyProposalCommand } from "../../lib/proposals/workflow";
import { validateVaultState } from "../../lib/vault/domain";
function readyWorkspace(){
  const state=createDemo(),app=createApplication(state.projects[0]!,state.opportunities[0]!,state,"file-evidence-application"),source=state.sources.find(s=>s.id==="demo-methods")!,version=source.versions[0]!,at=new Date().toISOString(),hash="a".repeat(64);
  state.documents.push({id:"evidence-file",projectId:"demo-project",title:"Synthetic methods",category:"methods",owner:"Synthetic researcher",tags:[],provenance:"researcher",archivedAt:null,versionIds:["evidence-file-v1"],createdAt:at});
  state.documentVersions.push({id:"evidence-file-v1",documentId:"evidence-file",version:1,filename:"methods.txt",mime:"text/plain",bytes:100,sha256:hash,createdAt:at,documentDate:null,integrity:"available"});
  state.parseAttempts.push({id:"evidence-parse",documentVersionId:"evidence-file-v1",parser:"synthetic-text",status:"parsed",warnings:[],artifactSha256:hash,textLength:version.text.length,segments:[],pages:null,startedAt:at,finishedAt:at});
  version.fileOrigin={documentId:"evidence-file",documentVersionId:"evidence-file-v1",parseAttemptId:"evidence-parse",artifactSha256:hash,start:0,end:version.text.length,reviewedHeadId:"evidence-file-v1",reviewedBy:"Synthetic researcher",reviewedAt:at,reason:"Reviewed synthetic methods excerpt.",manualEdit:false};
  app.requirements=[];app.requirementsReviewed=true;app.stage="Preparing";
  for(const section of app.sections)section.revisions.push({id:`${section.key}-saved`,text:"The proposed synthetic study will document calibration drift and limitations.",citations:section.key==="summary"?[cite(source,"Calibration drift and missing measurements will be documented.")]:[],selectedSources:[{sourceId:source.id,version:version.version,hash:version.hash}],projectRevision:1,callRevision:1,callSourceVersion:1,missingInputs:[],mode:"manual",promptVersion:"manual",createdAt:at});
  state.applications.push(app);validateVaultState(validateStateIntegrity(StateSchema.parse(state)));expect(readiness(state,app).blockers).toBe(0);return {state,app,source};
}
beforeEach(()=>{vi.useFakeTimers({toFake:["Date"]});vi.setSystemTime(new Date("2026-10-25T12:00:00Z"));});afterEach(()=>vi.useRealTimers());
describe("current draft evidence original integrity",()=>{
  it.each(["missing","corrupt"] as const)("blocks %s originals in quoted and selected-only sections and cannot be waived or marked Ready",integrity=>{
    const {state,app}=readyWorkspace();state.documentVersions[0]!.integrity=integrity;const issues=readiness(state,app).issues.filter(i=>i.id.startsWith("vault-evidence-"));expect(issues.map(i=>i.id).sort()).toEqual(["vault-evidence-approach","vault-evidence-significance","vault-evidence-summary"]);expect(issues.every(i=>i.severity==="blocker"&&i.waived===null)).toBe(true);
    expect(()=>applyCommand(state,{expectedRevision:state.revision,command:{type:"setStage",applicationId:app.id,stage:"Ready for review"}})).toThrow(/blockers/);expect(app.stage).toBe("Preparing");expect(()=>applyCommand(state,{expectedRevision:state.revision,command:{type:"waiveIssue",applicationId:app.id,issueId:issues[0]!.id,reason:"Attempted local override"}})).toThrow(/waiver cannot/);
  });
  it("reopens selected-only sections after original-file replacement, consistent with generation",()=>{
    const {state,app,source}=readyWorkspace();state.documents[0]!.versionIds.push("evidence-file-v2");state.documentVersions.push({...state.documentVersions[0]!,id:"evidence-file-v2",version:2});validateVaultState(state);expect(readiness(state,app).issues.filter(i=>i.id.startsWith("vault-evidence-")).length).toBe(3);expect(()=>generationContext(state,{applicationId:app.id,sectionKey:"significance",sourceIds:[source.id],mode:"fixture",confirmUsage:false,expectedRevision:state.revision})).toThrow(/Review the file evidence/);
  });
  it("blocks excluded ethics/approval origins even when the selected excerpt was manually edited",()=>{const {state,app,source}=readyWorkspace();source.versions[0]!.fileOrigin!.manualEdit=true;state.documents[0]!.category="IRB approval";expect(readiness(state,app).issues.filter(i=>i.id.startsWith("vault-evidence-")).length).toBe(3);});
  it("retains legitimate manual-source behavior and historical frozen packet validity",()=>{
    const {state,app,source}=readyWorkspace();applyProposalCommand(state,{type:"freezePacket",applicationId:app.id},new Date().toISOString());const frozen=JSON.stringify(state.packetSnapshots[0]);source.versions[0]!.fileOrigin!.manualEdit=true;state.documentVersions[0]!.integrity="missing";state.documents[0]!.versionIds.push("evidence-file-v2");state.documentVersions.push({...state.documentVersions[0]!,id:"evidence-file-v2",version:2,integrity:"available"});expect(readiness(state,app).blockers).toBe(0);expect(()=>validateStateIntegrity(StateSchema.parse(state))).not.toThrow();expect(JSON.stringify(state.packetSnapshots[0])).toBe(frozen);
    delete source.versions[0]!.fileOrigin;expect(readiness(state,app).blockers).toBe(0);
  });
});
