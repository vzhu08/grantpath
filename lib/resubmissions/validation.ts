import { ResubmissionsSchema } from "./schema";
import { assertUnique, attemptFor, captureEvidenceCopy, evidenceCopy, exactCitation, fail, find, last, mappingsValid, normalized, revisionCopy, sha256, type Workspace } from "./context";
import { feedbackCitation } from "./feedback";

export function validateResubmissionGraph(state:Workspace) {
  const f=ResubmissionsSchema.parse(state.resubmissions);
  const records=[...f.captures,...f.snapshots,...f.attempts,...f.feedback,...f.concerns,...f.actions,...f.responses,...f.conflicts,...f.packets];
  assertUnique(records.map(r=>r.id),"Resubmission record identifiers");
  for(const record of records)find(state.projects,record.projectId);
  const existingIds=new Set(state.sources.map(s=>s.id));if(f.feedback.some(s=>existingIds.has(s.id)))fail("Feedback and scientific evidence must use separate source namespaces.");
  for(const capture of f.captures) {
    assertUnique(capture.sections.map(s=>s.sectionId),"Captured sections");
    if(capture.sections.reduce((n,s)=>n+s.text.length,0)>100_000)fail("Capture narrative capacity exceeded.",413);
    if(capture.originalApplicationId&&find(state.applications,capture.originalApplicationId).projectId!==capture.projectId)fail("Capture application belongs to another project.");
    if(capture.supersedesId&&(find(f.snapshots,capture.supersedesId).projectId!==capture.projectId||capture.correctionReason.trim().length<5))fail("Corrected snapshot lineage is invalid.");
    for(const sections of [capture.sections,...capture.history.map(h=>h.sections)])for(const section of sections)for(const c of section.citations)captureEvidenceCopy(state,capture.projectId,capture.originalApplicationId,c);
  }
  for(const snapshot of f.snapshots) {
    const {digest,...payload}=snapshot;if(sha256(payload)!==digest)fail("Submitted snapshot digest does not match frozen content; preserve the file and restore a verified backup.");
    if(find(f.captures,snapshot.captureId).projectId!==snapshot.projectId)fail("Snapshot capture belongs to another project.");
    assertUnique(snapshot.sections.map(s=>s.sectionId),"Frozen section identifiers");
    for(const section of snapshot.sections)for(const c of section.citations){const copy=snapshot.evidence.find(e=>e.id===c.sourceId&&e.version===c.version),callSource=(snapshot.callCopy as {sourceId?:string}|null)?.sourceId;if(!copy||!exactCitation(c,copy.text,copy.hash)||(copy.projectId!==snapshot.projectId&&!(copy.type==="call"&&copy.id===callSource)))fail("Frozen submission evidence is missing or mismatched.");}
    if(snapshot.supersedesId&&(snapshot.supersedesId===snapshot.id||find(f.snapshots,snapshot.supersedesId).projectId!==snapshot.projectId))fail("Snapshot correction lineage is invalid.");
  }
  for(const attempt of f.attempts) {
    const snapshot=find(f.snapshots,attempt.snapshotId),target=find(state.applications,attempt.targetApplicationId);
    if(snapshot.projectId!==attempt.projectId||target.projectId!==attempt.projectId||target.originAttemptId!==attempt.id||target.cycleId!==attempt.cycleId)fail("Attempt, submitted snapshot and target cycle references do not agree.");
    if(target.id===snapshot.originalApplicationId)fail("The resubmission target must be distinct from the original application.");
    if(attempt.priorAttemptId&&attemptFor(state,attempt.priorAttemptId).projectId!==attempt.projectId)fail("Prior attempt belongs to another project.");
    mappingsValid(state,attempt,attempt.mappings,true);assertUnique(attempt.document.concernOrder,"Response concern order");
    for(const id of attempt.document.concernOrder)if(find(f.concerns,id).attemptId!==attempt.id)fail("Response document references another attempt.");
    if(f.feedback.filter(s=>s.attemptId===attempt.id).length>10||f.feedback.filter(s=>s.attemptId===attempt.id).reduce((n,s)=>n+last(s.versions).text.length,0)>100_000)fail("Feedback capacity exceeded.",413);
    const concerns=f.concerns.filter(c=>c.attemptId===attempt.id);
    if(concerns.length>200||concerns.filter(c=>["accepted","suggested"].includes(c.status)).length>100||f.actions.filter(a=>a.attemptId===attempt.id).length>200)fail("Matrix retained-history capacity exceeded.",413);
  }
  for(const source of f.feedback) {
    if(attemptFor(state,source.attemptId).projectId!==source.projectId)fail("Feedback project does not match its attempt.");
    assertUnique(source.versions.map(v=>String(v.version)),"Feedback versions");
    for(const version of source.versions)if(normalized(source.id,version.text).hash!==version.hash||normalized(source.id,version.text).text!==version.text)fail("Feedback normalization/hash does not match its saved text.");
    for(const review of source.coverageReviews)if(!source.versions.some(v=>v.version===review.version&&v.hash===review.hash))fail("Historical feedback coverage version is unavailable.");
  }
  for(const concern of f.concerns) {
    const attempt=attemptFor(state,concern.attemptId);if(attempt.projectId!==concern.projectId)fail("Concern project does not match its attempt.");
    for(const fields of [concern.fields,...concern.history.map(h=>h.fields)]){for(const c of fields.citations)feedbackCitation(state,attempt,c);mappingsValid(state,attempt,fields.mappings,true);}
    assertUnique(concern.parentIds,"Concern parents");assertUnique(concern.successorIds,"Concern successors");
    for(const id of [...concern.parentIds,...concern.successorIds])if(id===concern.id||find(f.concerns,id).attemptId!==attempt.id)fail("Concern lineage has a self-link or cross-attempt reference.");
    for(const id of concern.successorIds)if(!find(f.concerns,id).parentIds.includes(concern.id))fail("Concern successor relationship is incomplete.");
  }
  for(const action of f.actions) {
    const attempt=attemptFor(state,action.attemptId);if(attempt.projectId!==action.projectId)fail("Action project does not match attempt.");
    for(const fields of [action.fields,...action.history.map(h=>h.fields)]){assertUnique(fields.concernIds,"Action concerns");for(const id of fields.concernIds)if(find(f.concerns,id).attemptId!==attempt.id)fail("Action concern belongs to another attempt.");for(const link of fields.evidence)evidenceCopy(state,attempt.projectId,link.citation);for(const link of fields.revisions)revisionCopy(state,attempt,link);}
  }
  const responseConcerns=new Set<string>();
  for(const response of f.responses) {
    const concern=find(f.concerns,response.concernId);if(concern.attemptId!==response.attemptId||concern.projectId!==response.projectId||responseConcerns.has(concern.id))fail("Response concern scope is invalid or duplicated.");responseConcerns.add(concern.id);
    assertUnique(response.revisions.map(r=>r.id),"Response revisions");
    for(const revision of response.revisions)for(const c of revision.citations)evidenceCopy(state,response.projectId,c);
    for(const decision of response.completions)if(!response.revisions.some(r=>r.id===decision.responseRevisionId))fail("Completion response revision is unavailable.");
  }
  for(const group of f.conflicts){const attempt=attemptFor(state,group.attemptId);assertUnique(group.concernIds,"Conflict members");if(group.projectId!==attempt.projectId||group.concernIds.some(id=>find(f.concerns,id).attemptId!==attempt.id))fail("Conflict membership crosses attempt/project scope.");}
  for(const packet of f.packets){if(attemptFor(state,packet.attemptId).projectId!==packet.projectId||sha256(packet.payload)!==packet.digest)fail("Frozen response packet scope or digest does not match.");}
  const visit=(ids:string[],next:(id:string)=>string[])=>{const completed=new Set<string>(),active=new Set<string>();const walk=(id:string)=>{if(active.has(id))fail("Reference graph contains a cycle.");if(completed.has(id))return;active.add(id);for(const child of next(id))walk(child);active.delete(id);completed.add(id);};for(const id of ids)walk(id);};
  visit(f.concerns.map(c=>c.id),id=>find(f.concerns,id).successorIds);
  visit(f.attempts.map(a=>a.id),id=>{const prior=attemptFor(state,id).priorAttemptId;return prior?[prior]:[];});
  visit(f.snapshots.map(s=>s.id),id=>{const prior=find(f.snapshots,id).supersedesId;return prior?[prior]:[];});
  for(const project of state.projects) {
    if(f.snapshots.filter(s=>s.projectId===project.id).length>50||f.packets.filter(s=>s.projectId===project.id).length>50||f.attempts.filter(s=>s.projectId===project.id).length>20||f.receipts.filter(r=>r.projectId===project.id).length>200)fail("Project resubmission history capacity exceeded.",413);
  }
  assertUnique(f.receipts.map(r=>`${r.projectId}:${r.command}:${r.operationId}`),"Operation receipts");
  return state;
}
export function protectResubmissionDemoReset(state:Workspace) {
  // Retain all synthetic dependencies used by a feature record, including mixed
  // provenance. The safe local reset behavior is an actionable refusal.
  if(state.resubmissions.captures.length||state.resubmissions.snapshots.length||state.resubmissions.attempts.length||state.resubmissions.packets.length)fail("Demo records are retained because submitted snapshots, targets or response history may reference them. Export or use a separate project; reset never rewrites frozen history.");
}
