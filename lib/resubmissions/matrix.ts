import type { ActionRecord, ConcernRecord, AttemptRecord, ConflictRecord } from "./schema";
import { attemptFor, fail, find, last, revisionCopy, sha256, validateEvidence, type Workspace } from "./context";
import { coverageGaps, feedbackCitation } from "./feedback";

export function scientificAction(action: ActionRecord) {
  const { owner: _owner, due: _due, ...fields } = action.fields;
  return fields;
}
export function conflictFingerprint(state: Workspace, conflict: ConflictRecord) {
  const attempt = attemptFor(state, conflict.attemptId), app = find(state.applications, attempt.targetApplicationId), call = find(state.opportunities, app.opportunityId);
  return sha256({ version: 1, concerns: [...conflict.concernIds].sort().map(id => ({ id, fields: find(state.resubmissions.concerns,id).fields })), call: call.revision, context: attempt.context });
}
export function conflictResolved(state: Workspace, conflict: ConflictRecord) { return last(conflict.decisions)?.fingerprint === conflictFingerprint(state, conflict); }
export function concernActions(state: Workspace, concern: ConcernRecord) { return state.resubmissions.actions.filter(a => a.attemptId === concern.attemptId && a.fields.concernIds.includes(concern.id)); }
export function concernResponse(state: Workspace, concern: ConcernRecord) { return state.resubmissions.responses.find(r => r.concernId === concern.id); }
export function concernFingerprint(state: Workspace, concern: ConcernRecord) {
  const attempt = attemptFor(state, concern.attemptId), app = find(state.applications, attempt.targetApplicationId), project = find(state.projects, concern.projectId), call = find(state.opportunities, app.opportunityId);
  const actions = concernActions(state,concern), response = concernResponse(state,concern);
  const targetIds = new Set([...concern.fields.mappings.flatMap(m => m.targetSectionIds), ...actions.flatMap(a => a.fields.revisions.map(r => r.sectionId))]);
  const citations = [...actions.flatMap(a => a.fields.evidence.map(e => e.citation)), ...(last(response?.revisions ?? [])?.citations ?? [])];
  return sha256({ version: "concern-dependencies-v1", concern: { id: concern.id, revision: concern.revision, fields: concern.fields, status: concern.status }, feedback: concern.fields.citations.map(c => { const {source} = feedbackCitation(state,attempt,c); return { citation: c, latestVersion: last(source.versions).version, latestHash: last(source.versions).hash }; }), actions: [...actions].sort((a,b)=>a.id.localeCompare(b.id)).map(a=>({id:a.id,fields:scientificAction(a)})), evidence: citations.map(c => { const source=find(state.sources,c.sourceId); return {citation:c,latestVersion:last(source.versions).version,latestHash:last(source.versions).hash}; }).sort((a,b)=>a.citation.sourceId.localeCompare(b.citation.sourceId)||a.citation.start-b.citation.start), target: [...targetIds].sort().map(id=>({sectionId:id,revisionId:last(app.sections.find(s=>s.key===id)?.revisions??[])?.id??null})), response: last(response?.revisions??[])??null, projectRevision:project.revision, callRevision:call.revision, context:attempt.context, conflicts: state.resubmissions.conflicts.filter(g=>g.concernIds.includes(concern.id)).map(g=>({id:g.id,decision:last(g.decisions)??null,current:conflictFingerprint(state,g)})).sort((a,b)=>a.id.localeCompare(b.id)) });
}
export function actionIssues(state: Workspace, attempt: AttemptRecord, action: ActionRecord) {
  const f = action.fields, issues: string[] = [];
  if (f.state !== "reviewed" || !f.reviewedBy.trim() || !f.reviewedAt || !f.result.trim() || f.resultClassification === "unrecorded") issues.push("Action outcome needs researcher review.");
  for (const evidence of f.evidence) {
    validateEvidence(state,attempt,evidence);
    const source = find(state.sources,evidence.citation.sourceId);
    if (last(source.versions).version !== evidence.citation.version) issues.push("A linked evidence source has a newer version; select and review its current passage.");
  }
  for (const link of f.revisions) {
    revisionCopy(state,attempt,link);
    const section = find(state.applications,attempt.targetApplicationId).sections.find(s=>s.key===link.sectionId);
    if (!section||last(section.revisions)?.id !== link.revisionId) issues.push("A linked target section has a newer saved revision or is archived.");
  }
  if (f.evidenceRequired && !f.evidence.length) issues.push("Required evidence passage is missing.");
  if (["new-data","new-analysis"].includes(f.kind) && f.evidenceRequired) {
    if (!["observed-result","negative-result","inconclusive-result"].includes(f.resultClassification) || !f.evidence.some(e=>e.classification === "observed-result")) issues.push("New evidence needs a recorded observed, negative or inconclusive result and an observed-result source passage. Proposed work or an assertion cannot close it.");
  }
  return [...new Set(issues)];
}
export function completionIssues(state: Workspace, concern: ConcernRecord) {
  const attempt=attemptFor(state,concern.attemptId), response=concernResponse(state,concern), revision=last(response?.revisions??[]), actions=concernActions(state,concern), issues:string[]=[];
  if (concern.status !== "accepted" || !concern.fields.confirmed || !concern.fields.interpretation.trim() || concern.fields.disposition === "unassigned") issues.push("Confirm the accepted interpretation and disposition.");
  for (const c of concern.fields.citations) { const {source}=feedbackCitation(state,attempt,c); if(last(source.versions).version!==c.version) issues.push("Feedback was corrected; explicitly reanchor this concern to the current version."); }
  if (!revision?.text.trim()) issues.push("Save an accepted response revision.");
  if (revision?.missingInputs.length) issues.push("Response has unresolved missing inputs.");
  for(const c of revision?.citations??[]) { const source=find(state.sources,c.sourceId); if(last(source.versions).version!==c.version) issues.push("Response evidence has a newer source version."); }
  if (!actions.length) issues.push("Record at least one reviewed action outcome, including clarification or reasoned non-adoption.");
  for(const action of actions) issues.push(...actionIssues(state,attempt,action));
  if (["change","clarify"].includes(concern.fields.disposition) && !actions.some(a=>a.fields.revisions.length) && concern.fields.noEditReason.trim().length<5) issues.push("Select the exact target passage or explain why no proposal edit is appropriate.");
  if (concern.fields.disposition === "not-adopted" && concern.fields.rationale.trim().length<5) issues.push("Explain why the recommendation is not adopted; do not describe it as implemented.");
  for(const group of state.resubmissions.conflicts.filter(g=>g.concernIds.includes(concern.id))) if(!conflictResolved(state,group)) issues.push("Contradictory recommendations need a current human conflict decision.");
  return [...new Set(issues)];
}
export function concernState(state: Workspace, concern: ConcernRecord) {
  if(concern.status!=="accepted") return concern.status;
  const decision=last(concernResponse(state,concern)?.completions??[]);
  if(decision) return decision.fingerprint===concernFingerprint(state,concern) && !completionIssues(state,concern).length ? "Resolved" : "Needs review";
  if(concern.awaitingReview) return "Awaiting review";
  return concernActions(state,concern).length ? "In progress" : "Open";
}
export function attemptIssues(state: Workspace, attempt: AttemptRecord) {
  const issues:string[]=[];
  for(const feedback of state.resubmissions.feedback.filter(f=>f.attemptId===attempt.id&&!f.archivedAt)) if(coverageGaps(feedback).length) issues.push(`Feedback coverage needs review: ${feedback.label}.`);
  const active=state.resubmissions.concerns.filter(c=>c.attemptId===attempt.id&&c.status==="accepted");
  if(!active.length) issues.push("No accepted concerns have been reviewed.");
  for(const c of active) if(concernState(state,c)!=="Resolved") issues.push(`Concern ${c.id}: ${concernState(state,c)}.`);
  const app=find(state.applications,attempt.targetApplicationId), call=find(state.opportunities,app.opportunityId), context=attempt.context;
  if(!context.confirmed||!context.confirmedBy.trim()||context.sponsorType==="unresolved"||context.callRevision!==call.revision||!context.checkedOn||context.rationale.trim().length<5) issues.push("Confirm the target sponsor classification against the current call.");
  if(context.rules.some(r=>r.status==="unknown")) issues.push("Sponsor-rule decisions remain unknown.");
  if(attempt.profile==="nsf-resubmission-preparation"&&!context.substantiveChanges.trim()) issues.push("Describe substantive changes for the internal NSF preparation review.");
  for(const conflict of state.resubmissions.conflicts.filter(g=>g.attemptId===attempt.id)) if(!conflictResolved(state,conflict)) issues.push("An unresolved reviewer conflict remains.");
  return issues;
}
export function attemptFingerprint(state: Workspace, attempt: AttemptRecord) {
  return sha256({ version:1,context:attempt.context, rows:state.resubmissions.concerns.filter(c=>c.attemptId===attempt.id&&c.status==="accepted").map(c=>({id:c.id,fingerprint:concernFingerprint(state,c),decision:last(concernResponse(state,c)?.completions??[])??null})).sort((a,b)=>a.id.localeCompare(b.id)),coverage:state.resubmissions.feedback.filter(f=>f.attemptId===attempt.id).map(f=>({id:f.id,version:last(f.versions),review:last(f.coverageReviews)??null})).sort((a,b)=>a.id.localeCompare(b.id))});
}
export function documentFingerprint(state: Workspace, attempt: AttemptRecord) { return sha256({version:1,attempt:attemptFingerprint(state,attempt),document:{concernOrder:attempt.document.concernOrder,opening:last(attempt.document.opening)??null,closing:last(attempt.document.closing)??null}}); }
export function actionAgenda(state: Workspace) { return state.resubmissions.actions.filter(a=>attemptFor(state,a.attemptId).state!=="archived").map(a=>({id:a.id,attemptId:a.attemptId,description:a.fields.description,owner:a.fields.owner,due:a.fields.due,status:actionIssues(state,attemptFor(state,a.attemptId),a).length?"Open":"Reviewed",concernIds:a.fields.concernIds})); }
export function requireCompletion(state:Workspace,concern:ConcernRecord) { const issues=completionIssues(state,concern); if(issues.length) fail(issues.join(" ")); }
