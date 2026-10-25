import type { PacketRecord, ResubmissionCommand, AttemptRecord } from "./schema";
import { appendBound, evidenceCopy, find, jsonCopy, last, revisionCopy, sha256, type Clock, type Workspace } from "./context";
import { attemptIssues, concernActions, concernFingerprint, concernResponse, concernState, conflictResolved, documentFingerprint,completionIssues } from "./matrix";
import { feedbackCitation } from "./feedback";
import { compareAttempt } from "./comparison-view";
import { readiness } from "../readiness";
import type { State } from "../schema";

export function packetPayload(state:Workspace, attempt:AttemptRecord, c:Extract<ResubmissionCommand,{type:"saveResponsePacket"}>) {
  const original=find(state.resubmissions.snapshots,attempt.snapshotId), app=find(state.applications,attempt.targetApplicationId), project=find(state.projects,attempt.projectId), call=find(state.opportunities,app.opportunityId);
  const rows=c.concernIds.map(id=>{
    const concern=find(state.resubmissions.concerns,id);
    if(concern.attemptId!==attempt.id) throw new Error("Packet concern belongs to another attempt.");
    const actions=concernActions(state,concern), response=concernResponse(state,concern), responseRevision=last(response?.revisions??[]);
    const citations=[...actions.flatMap(a=>a.fields.evidence.map(e=>e.citation)),...(responseRevision?.citations??[])];
    const evidence=[...new Map(citations.map(c=>[`${c.sourceId}:${c.version}:${c.start}:${c.end}`,{...evidenceCopy(state,attempt.projectId,c),text:c.quote,range:{start:c.start,end:c.end},citation:c}])).values()];
    const targets=actions.flatMap(a=>a.fields.revisions.map(r=>{const copy=revisionCopy(state,attempt,r);return {applicationId:copy.applicationId,sectionId:copy.sectionId,label:copy.label,range:copy.range,revision:{id:copy.revision.id,text:r.range?.quote??copy.revision.text,mode:copy.revision.mode,createdAt:copy.revision.createdAt}};}));
    const {history:_history,...currentConcern}=concern;
    return {concern:structuredClone(currentConcern),state:concernState(state,concern),issues:completionIssues(state,concern),fingerprint:concernFingerprint(state,concern),feedback:concern.fields.citations.map(c=>{const {source,version}=feedbackCitation(state,attempt,c);return {sourceId:source.id,label:source.label,kind:source.kind,provenance:source.provenance,version:version.version,hash:version.hash,citation:c,text:c.quote};}),actions:actions.map(({history:_history,...current})=>structuredClone(current)),evidence,targetPassages:targets,response:responseRevision?structuredClone(responseRevision):null,completion:last(response?.completions??[])??null};
  });
  const conflicts=state.resubmissions.conflicts.filter(g=>g.attemptId===attempt.id&&g.concernIds.some(id=>c.concernIds.includes(id))).map(g=>({...g,resolved:conflictResolved(state,g)}));
  const comparison=c.includeOriginal&&c.includeTarget?compareAttempt(state,attempt):null;
  const applicationReadiness=readiness(state as State,app);
  return jsonCopy({format:"grantpath-internal-response-packet",formatVersion:1,manifestVersion:1,comparisonAlgorithm:"paragraph-lcs-v1",comparison,applicationReadiness,disclosure:{concernIds:c.concernIds,includeOriginal:c.includeOriginal,includeTarget:c.includeTarget},project:{id:project.id,title:project.profile.title,revision:project.revision,provenance:project.provenance},lineage:{attemptId:attempt.id,priorAttemptId:attempt.priorAttemptId,snapshotId:original.id,originalApplicationId:original.originalApplicationId,targetApplicationId:app.id,cycleId:attempt.cycleId},original:{digest:original.digest,attestation:original.attestation,coverage:original.coverage,sections:c.includeOriginal?original.sections:[],evidence:c.includeOriginal?original.evidence:[],callCopy:original.callCopy},target:{callId:call.id,callTitle:call.title,callRevision:call.revision,provenance:app.provenance,sections:c.includeTarget?app.sections.map(s=>({sectionId:s.key,label:s.label,revision:last(s.revisions)??null})):[]},profile:{id:attempt.profile,version:attempt.profileVersion},context:attempt.context,mappings:attempt.mappings,rows,conflicts,issues:attemptIssues(state,attempt),document:{order:attempt.document.concernOrder.filter(id=>c.concernIds.includes(id)),opening:last(attempt.document.opening)??null,closing:last(attempt.document.closing)??null,review:last(attempt.document.reviews)??null,currentFingerprint:documentFingerprint(state,attempt)},limitations:["Internal review packet; not a sponsor attachment or certification of scientific validity, eligibility or funding likelihood.","Text capture excludes figures, layout and attachments described in the coverage inventory.","Actor labels describe local researcher decisions; they are not authenticated institutional identities."],sourceModes:[...new Set(rows.map(r=>(r as {concern:{origin:string}}).concern.origin))]});
}
export function savePacket(state:Workspace,c:Extract<ResubmissionCommand,{type:"saveResponsePacket"}>,env:Clock) {
  const attempt=find(state.resubmissions.attempts,c.attemptId);
  appendBound(state.resubmissions.packets.filter(p=>p.projectId===attempt.projectId),"Saved response packet",50);
  const payload=packetPayload(state,attempt,c), packet:PacketRecord={id:env.id("response-packet"),attemptId:attempt.id,projectId:attempt.projectId,provenance:attempt.provenance,createdAt:env.at,updatedAt:env.at,manifestVersion:1,payload,digest:sha256(payload)};
  state.resubmissions.packets.push(packet);return packet.id;
}
export const packetJSON=(packet:PacketRecord)=>JSON.stringify(packet,null,2)+"\n";
// Encode all source-controlled text as inert Markdown. Raw HTML, image/link
// syntax, fences, and line starts cannot acquire document structure.
export const escapeMarkdown=(value:string)=>value.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/([\\`*_{}\[\]()#!|+\-.])/g,"\\$1");
function quote(value:string) {return value.split("\n").map(line=>"> "+escapeMarkdown(line)).join("\n");}
export function packetMarkdown(packet:PacketRecord) {
  // The payload is already server-derived and frozen. Reading uses only saved
  // content, and never follows current evidence or target references.
  const p=packet.payload as ReturnType<typeof packetPayload>;
  const lines=["# Internal response review packet","",`Packet: ${packet.id}`,`Manifest: 1 | SHA-256: ${packet.digest}`,"",quote(p.limitations.join("\n")),"","## Capture and scope",quote(JSON.stringify(p.original.coverage)),quote(JSON.stringify(p.original.attestation)),"","## Sponsor decisions",quote(JSON.stringify(p.context)),"","## Current review issues",...p.issues.map((x:string)=>"- "+escapeMarkdown(x)),""];
  for(const [index,row] of p.rows.entries()) {
    lines.push(`## ${index+1}. Concern ${row.concern.id}`,`State: ${escapeMarkdown(row.state)} | Origin: ${row.concern.origin}`,"",quote(row.concern.fields.interpretation));
    for(const feedback of row.feedback) lines.push("",`### ${escapeMarkdown(feedback.label)} — version ${feedback.version}`,quote(feedback.text),`Range: ${feedback.citation.start}–${feedback.citation.end}; ${escapeMarkdown(feedback.hash)}`);
    lines.push("","### Open work and review gaps",...row.issues.map((issue:string)=>"- "+escapeMarkdown(issue)),"","### Actions and evidence");
    for(const action of row.actions) lines.push(quote(JSON.stringify(action.fields)));
    for(const evidence of row.evidence) lines.push(quote(evidence.text));
    for(const target of row.targetPassages) lines.push(`Target ${escapeMarkdown(target.label)} / ${target.revision.id}`,quote(target.revision.text));
    lines.push("","### Response",quote(row.response?.text??"No accepted response."),"",quote(JSON.stringify(row.completion??{status:"open"})));
  }
  lines.push("","## Application readiness (separate from response review)",quote(JSON.stringify(p.applicationReadiness)),"","## Response document",quote(p.document.opening?.text??""),quote(p.document.closing?.text??""),"","## Conflicts",quote(JSON.stringify(p.conflicts)),"","## Original narrative");
  for(const section of p.original.sections) lines.push(`### ${escapeMarkdown(section.label)}`,quote(section.text));
  lines.push("","## Target narrative");for(const section of p.target.sections) lines.push(`### ${escapeMarkdown(section.label)}`,quote(section.revision?.text??""));
  return lines.join("\n")+"\n";
}
