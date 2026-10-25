import { it,expect } from "vitest";
import { harness } from "./harness";
import { cite } from "../../lib/evidence";
import { concernState } from "../../lib/resubmissions/matrix";
import { validateResubmissionGraph } from "../../lib/resubmissions/validation";
import { validateVaultState } from "../../lib/vault/domain";
import { packetJSON } from "../../lib/resubmissions/exports";
it("vault replacement, missing originals and ethics reclassification reopen current rows while historical references and packets survive",()=>{
  const h=harness(),source=h.state.sources.find(s=>s.id==="demo-methods")!,version=source.versions[0]!,hash="a".repeat(64),at=h.env.at;
  h.state.documents.push({id:"linked-file",projectId:"demo-project",title:"Synthetic method notes",category:"methods",owner:"Synthetic researcher",tags:[],provenance:"demo",archivedAt:null,versionIds:["linked-file-v1"],createdAt:at});
  h.state.documentVersions.push({id:"linked-file-v1",documentId:"linked-file",version:1,filename:"methods.txt",mime:"text/plain",bytes:100,sha256:hash,createdAt:at,documentDate:null,integrity:"available"});
  h.state.parseAttempts.push({id:"linked-parse",documentVersionId:"linked-file-v1",parser:"synthetic-text",status:"parsed",warnings:[],artifactSha256:hash,textLength:version.text.length,segments:[],pages:null,startedAt:at,finishedAt:at});
  version.fileOrigin={documentId:"linked-file",documentVersionId:"linked-file-v1",parseAttemptId:"linked-parse",artifactSha256:hash,start:0,end:version.text.length,reviewedHeadId:"linked-file-v1",reviewedBy:"Synthetic reviewer",reviewedAt:at,reason:"Synthetic exact original-file excerpt.",manualEdit:false};
  const id=h.concern(),aid=h.action(id,"summary",{evidenceRequired:true,evidence:[{citation:cite(source,"Calibration drift and missing measurements will be documented."),claim:"Planned drift checks are documented.",classification:"existing-fact",resultDate:""}]});h.complete(id,aid);validateVaultState(h.state);expect(concernState(h.state,h.state.resubmissions.concerns[0]!)).toBe("Resolved");h.run({type:"saveResponsePacket",attemptId:h.attemptId,concernIds:[id],includeOriginal:false,includeTarget:false,operationId:"file-origin-packet"});const packet=packetJSON(h.state.resubmissions.packets[0]!);
  h.state.documents[0]!.versionIds.push("linked-file-v2");h.state.documentVersions.push({...h.state.documentVersions[0]!,id:"linked-file-v2",version:2});validateVaultState(h.state);validateResubmissionGraph(h.state);expect(concernState(h.state,h.state.resubmissions.concerns[0]!)).toBe("Needs review");expect(packetJSON(h.state.resubmissions.packets[0]!)).toBe(packet);
  h.state.documents[0]!.versionIds.pop();h.state.documentVersions.pop();h.state.documentVersions[0]!.integrity="missing";expect(concernState(h.state,h.state.resubmissions.concerns[0]!)).toBe("Needs review");h.state.documentVersions[0]!.integrity="available";h.state.documents[0]!.category="IRB approval";expect(()=>validateResubmissionGraph(h.state)).not.toThrow();expect(concernState(h.state,h.state.resubmissions.concerns[0]!)).toBe("Needs review");expect(packetJSON(h.state.resubmissions.packets[0]!)).toBe(packet);
});
