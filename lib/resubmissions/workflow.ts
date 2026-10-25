import { createApplication } from "../fixtures";
import type { State } from "../schema";
import { ResubmissionCommandSchema, ResubmissionsSchema, type ResubmissionCommand, type ConcernRecord, type ActionRecord, type AttemptRecord } from "./schema";
import { appendBound, assertUnique, attemptFor, clock, fail, find, last, mappingsValid, normalized, sha256, type Clock, type Workspace } from "./context";
import { feedbackCitation, validateCoverage } from "./feedback";
import { freezeSubmission, saveCaptureSection } from "./snapshots";
import { actionIssues, attemptFingerprint, attemptIssues, concernFingerprint, concernDependencies,concernActions, concernResponse, conflictFingerprint, documentFingerprint, requireCompletion, scientificAction } from "./matrix";
import { jsonCopy } from "./context";
import { savePacket } from "./exports";
import { validateResubmissionGraph } from "./validation";
import { previews, requirePreview, Suggestions, ResponsePreview, validateAcceptedCandidate } from "./generation";
import { NSF_STANDARD_RESEARCH_TEMPLATE, TemplateManifestSchema } from "../proposals/nsf-template";

function commandProject(state:Workspace,c:ResubmissionCommand) {
  if("projectId" in c)return c.projectId;
  if("snapshotId" in c)return find(state.resubmissions.snapshots,c.snapshotId).projectId;
  if("captureId" in c)return find(state.resubmissions.captures,c.captureId).projectId;
  if("attemptId" in c)return attemptFor(state,c.attemptId).projectId;
  if("sourceId" in c&&c.type==="reviewFeedbackCoverage")return find(state.resubmissions.feedback,c.sourceId).projectId;
  if("concernId" in c)return find(state.resubmissions.concerns,c.concernId).projectId;
  if("actionId" in c)return find(state.resubmissions.actions,c.actionId).projectId;
  return fail("Cannot determine operation project.");
}
export function recoverResubmissionReceipt(state:Workspace,c:ResubmissionCommand) {
  if(!("operationId" in c))return null;
  const projectId=commandProject(state,c), receipt=state.resubmissions.receipts.find(r=>r.projectId===projectId&&r.command===c.type&&r.operationId===c.operationId);
  if(!receipt)return null;
  if(receipt.inputDigest!==sha256(c))fail("This operation ID already saved different content. Use a new operation ID after reconciling the result.",409);
  return {state,selectedId:receipt.resultIds[0],resultIds:receipt.resultIds,replayed:true,consumedPreviewToken:undefined};
}
const base=(projectId:string,provenance:"demo"|"researcher",env:Clock,prefix:string)=>({id:env.id(prefix),projectId,provenance,createdAt:env.at,updatedAt:env.at});
function touchAttempt(attempt:AttemptRecord,env:Clock) {attempt.revision++;attempt.updatedAt=env.at;if(attempt.state==="reviewed")attempt.state="working";}
function validateConcernFields(state:Workspace,attempt:AttemptRecord,fields:ConcernRecord["fields"]) {for(const citation of fields.citations)feedbackCitation(state,attempt,citation);mappingsValid(state,attempt,fields.mappings);}
function newConcern(state:Workspace,attempt:AttemptRecord,fields:ConcernRecord["fields"],env:Clock):ConcernRecord {
  appendBound(state.resubmissions.concerns.filter(c=>c.attemptId===attempt.id),"Retained concerns",200);
  appendBound(state.resubmissions.concerns.filter(c=>c.attemptId===attempt.id&&["accepted","suggested"].includes(c.status)),"Active concerns",100);
  validateConcernFields(state,attempt,fields);
  const record:ConcernRecord={...base(attempt.projectId,env.fixture?attempt.provenance:"researcher",env,"concern"),attemptId:attempt.id,revision:1,fields,history:[],origin:"manual",generation:null,status:"accepted",reason:"",parentIds:[],successorIds:[],awaitingReview:false,suggestionId:null};
  state.resubmissions.concerns.push(record);return record;
}
function changeConcern(concern:ConcernRecord,env:Clock) {appendBound(concern.history,"Concern history",99);concern.history.push({revision:concern.revision,fields:structuredClone(concern.fields),at:concern.updatedAt});concern.revision++;concern.updatedAt=env.at;concern.awaitingReview=false;}
function changeAction(action:ActionRecord,env:Clock) {appendBound(action.history,"Action history",99);action.history.push({revision:action.revision,fields:structuredClone(action.fields),at:action.updatedAt});action.revision++;action.updatedAt=env.at;}
export function applyResubmissionCommand(original:Workspace,input:{expectedRevision:number;command:ResubmissionCommand},env:Clock=clock()) {
  const c=ResubmissionCommandSchema.parse(input.command), recovered=recoverResubmissionReceipt(original,c);
  if(recovered)return recovered;
  if(input.expectedRevision!==original.revision)fail("A newer save exists. Your editor text is preserved; reload and reconcile before retrying.",409);
  const state=structuredClone(original), f=state.resubmissions;
  let selectedId:string|undefined;let resultIds:string[]=[];let consumeToken:string|undefined;
  if("operationId" in c)appendBound(f.receipts.filter(r=>r.projectId===commandProject(state,c)),"Idempotency receipts",200);
  if(c.type==="createSubmissionCapture") {
    const project=find(state.projects,c.projectId);
    if(c.originalApplicationId&&find(state.applications,c.originalApplicationId).projectId!==project.id)fail("Original application belongs to another project.");
    if(c.method==="saved-drafts"&&!c.originalApplicationId)fail("Select an original application for saved-draft capture.");
    if(c.supersedesId&&(find(f.snapshots,c.supersedesId).projectId!==project.id||c.correctionReason.trim().length<5))fail("A corrected capture needs a same-project snapshot and an explicit correction reason.");
    const capture={...base(project.id,c.method==="pasted"&&!env.fixture?"researcher":project.provenance,env,"capture"),originalApplicationId:c.originalApplicationId,method:c.method,revision:1,sections:[],history:[],supersedesId:c.supersedesId,correctionReason:c.correctionReason};f.captures.push(capture);selectedId=capture.id;
  } else if(c.type==="saveCaptureSection") {
    saveCaptureSection(state,find(f.captures,c.captureId),c,env);selectedId=c.captureId;
  } else if(c.type==="freezeSubmissionSnapshot") {
    selectedId=freezeSubmission(state,c,env);
  } else if(c.type==="createResubmissionAttempt") {
    const snapshot=find(f.snapshots,c.snapshotId),project=find(state.projects,snapshot.projectId),call=find(state.opportunities,c.targetCallId);
    appendBound(f.attempts.filter(a=>a.projectId===project.id),"Resubmission attempts",20);
    if(c.priorAttemptId&&attemptFor(state,c.priorAttemptId).projectId!==project.id)fail("Prior attempt belongs to another project.");
    if(c.mode==="reviewed-copy"&&!c.confirmCopy)fail("Review the mapping and confirm inherited content before copying.");
    const app=createApplication(project,call,state as State,env.id("application")),attemptId=env.id("attempt"),cycleId=env.id("cycle");
    // Stable section IDs are copied as identities, never matched by label or
    // position. Blank cycles do not inherit readiness, waivers or submission.
    const targetTemplate=c.targetTemplateId??"same-as-original";
    const manifest=targetTemplate==="nsf-standard-research"?TemplateManifestSchema.parse(NSF_STANDARD_RESEARCH_TEMPLATE):targetTemplate==="same-as-original"?snapshot.templateManifest:null;
    if(manifest){app.binding={...app.binding!,templateId:"nsf-standard-research",manifest:structuredClone(manifest)};app.sections=manifest.sections.filter(s=>s.kind==="content").map(s=>({key:s.id,label:s.heading,wordLimit:s.limits.words,revisions:[],reviews:[]}));}
    else if(targetTemplate!=="legacy-three-section"){app.sections=snapshot.sections.map(s=>({key:s.sectionId,label:s.label,wordLimit:null,revisions:[],reviews:[]}));if(app.sections.some(s=>!["summary","significance","approach"].includes(s.key)))delete app.binding;}
    const target={...app,cycleId,originAttemptId:attemptId,createdAt:env.at,updatedAt:env.at};state.applications.push(target);
    const attempt:AttemptRecord={...base(project.id,snapshot.provenance==="researcher"||call.provenance==="researcher"?"researcher":project.provenance,env,"attempt"),id:attemptId,snapshotId:snapshot.id,targetApplicationId:app.id,revision:1,cycleId,priorAttemptId:c.priorAttemptId,profile:c.profile,profileVersion:1,state:"working",archiveReason:"",mappings:c.mappings,mappingHistory:[],context:{relationship:"unknown",sponsorType:"unresolved",rationale:"",checkedOn:"",confirmedBy:"",confirmed:false,callRevision:call.revision,rules:[],substantiveChanges:"",deliveryInstructions:""},contextHistory:[],document:{concernOrder:[],opening:[],closing:[],reviews:[]},reviews:[]};
    f.attempts.push(attempt);mappingsValid(state,attempt,c.mappings);
    if(c.mode==="reviewed-copy") {
      const destinations=new Set<string>();
      for(const mapping of c.mappings)for(const sectionId of mapping.targetSectionIds) {
        if(!mapping.originalSectionId)continue;
        if(destinations.has(sectionId))fail("A reviewed copy with multiple originals into one target needs an explicit manual combined revision. Keep the mapping and use a blank target.");
        destinations.add(sectionId);
        const source=snapshot.sections.find(s=>s.sectionId===mapping.originalSectionId)!;
        target.sections.find(s=>s.key===sectionId)!.revisions.push({id:env.id("draft"),text:source.text,citations:structuredClone(source.citations),selectedSources:[...new Map(source.citations.filter(c=>state.sources.some(s=>s.id===c.sourceId&&s.projectId===project.id)).map(c=>[c.sourceId,{sourceId:c.sourceId,version:c.version,hash:c.hash}])).values()],projectRevision:project.revision,callRevision:call.revision,callSourceVersion:call.sourceVersion,missingInputs:["Inherited submitted text requires target-context review."],mode:source.origin,promptVersion:`inherited-submission-v1:${snapshot.id}:${source.revisionId??"pasted"}`,createdAt:env.at});
      }
    }
    selectedId=attempt.id;resultIds=[attempt.id,target.id];
  } else if(c.type==="saveFeedbackSource") {
    const attempt=attemptFor(state,c.attemptId,true),doc=normalized(c.sourceId??"feedback",c.text);
    if(!doc.text.trim())fail("Paste nonempty feedback.");
    if(c.sourceId) {
      const source=find(f.feedback,c.sourceId);if(source.attemptId!==attempt.id)fail("Feedback belongs to another attempt.");
      source.label=c.label;source.kind=c.kind;source.url=c.url;source.updatedAt=env.at;if(!env.fixture)source.provenance="researcher";
      if(last(source.versions).hash!==doc.hash){appendBound(source.versions,"Feedback versions",20);source.versions.push({version:last(source.versions).version+1,text:doc.text,hash:doc.hash,createdAt:env.at});}
      selectedId=source.id;
    } else {
      appendBound(f.feedback.filter(x=>x.attemptId===attempt.id),"Feedback sources",10);
      const source={...base(attempt.projectId,env.fixture?attempt.provenance:"researcher",env,"feedback"),attemptId:attempt.id,kind:c.kind,label:c.label,url:c.url,versions:[{version:1,text:doc.text,hash:doc.hash,createdAt:env.at}],coverageReviews:[],archivedAt:null};f.feedback.push(source);selectedId=source.id;
    }
    if(f.feedback.filter(x=>x.attemptId===attempt.id).reduce((n,s)=>n+last(s.versions).text.length,0)>100_000)fail("Feedback current versions exceed 100,000 UTF-16 units.",413);
    touchAttempt(attempt,env);
  } else if(c.type==="reviewFeedbackCoverage") {
    const source=find(f.feedback,c.sourceId),attempt=attemptFor(state,source.attemptId,true),version=last(source.versions);
    if(version.version!==c.version||version.hash!==c.hash)fail("Feedback changed before coverage review.",409);
    validateCoverage(source,c.decisions);appendBound(source.coverageReviews,"Feedback coverage history");source.coverageReviews.push({version:c.version,hash:c.hash,decisions:c.decisions,by:c.by,at:env.at});touchAttempt(attempt,env);selectedId=source.id;
  } else if(c.type==="saveConcern") {
    const attempt=attemptFor(state,c.attemptId,true);validateConcernFields(state,attempt,c.fields);
    if(c.concernId){const concern=find(f.concerns,c.concernId);if(concern.attemptId!==attempt.id)fail("Concern belongs to another attempt.");if(concern.revision!==c.concernRevision)fail("Concern changed; reconcile before saving.",409);if(concern.status==="superseded")fail("Edit the retained successor concern instead.");changeConcern(concern,env);concern.fields=c.fields;concern.status=c.status;selectedId=concern.id;}
    else {const concern=newConcern(state,attempt,c.fields,env);concern.status=c.status;selectedId=concern.id;}
    if(!env.fixture&&selectedId)find(f.concerns,selectedId).provenance="researcher";
    touchAttempt(attempt,env);
  } else if(c.type==="decideConcernSuggestion") {
    const concern=find(f.concerns,c.concernId),attempt=attemptFor(state,concern.attemptId,true);if(concern.revision!==c.concernRevision||concern.status!=="suggested")fail("Suggestion changed or was already decided.",409);changeConcern(concern,env);concern.status=c.decision==="accept"?"accepted":"dismissed";concern.reason=c.reason;touchAttempt(attempt,env);selectedId=concern.id;
  } else if(c.type==="acceptConcernPreview") {
    const attempt=attemptFor(state,c.attemptId,true),preview=requirePreview(c.previewToken,"suggest",state,attempt.id,null),output=Suggestions.parse(preview.output);
    assertUnique(c.decisions.map(d=>d.candidateId),"Candidate decisions");
    if(c.decisions.length!==output.candidates.length||output.candidates.some(candidate=>!c.decisions.some(d=>d.candidateId===candidate.id)))fail("Review every candidate in one atomic batch, accepting or explicitly dismissing each suggestion.");
    for(const decision of c.decisions){const candidate=output.candidates.find(s=>s.id===decision.candidateId)!;validateAcceptedCandidate(decision.fields,candidate);const concern=newConcern(state,attempt,decision.fields,env);concern.status=decision.decision==="accept"?"accepted":"dismissed";concern.reason=decision.reason;concern.origin=preview.mode;concern.generation={...preview.metadata,humanEdited:decision.fields.interpretation!==candidate.interpretation};concern.suggestionId=candidate.id;resultIds.push(concern.id);}
    consumeToken=c.previewToken;selectedId=resultIds[0];touchAttempt(attempt,env);
  } else if(c.type==="splitConcern"||c.type==="mergeConcerns") {
    const parents=c.type==="splitConcern"?[find(f.concerns,c.concernId)]:c.concernIds.map(id=>find(f.concerns,id)),attempt=attemptFor(state,parents[0]!.attemptId,true);
    assertUnique(parents.map(p=>p.id),"Parent concerns");if(parents.some(p=>p.attemptId!==attempt.id||p.status!=="accepted"))fail("Split/merge requires accepted concerns from the same attempt.");
    if(c.type==="splitConcern"&&parents[0]!.revision!==c.concernRevision)fail("Concern changed before split.",409);
    if(c.type==="mergeConcerns"&&c.attemptId!==attempt.id)fail("Concerns belong to another attempt.");
    const allCitations=[...new Map(parents.flatMap(p=>p.fields.citations).map(q=>[sha256(q),q])).values()];
    const fields=c.type==="splitConcern"?c.children:[{...parents[0]!.fields,interpretation:c.interpretation,citations:allCitations,confirmed:false,mappings:parents.flatMap(p=>p.fields.mappings)}];
    // Splits preserve all source passages across children; merges preserve their
    // exact union. No discarded quotation is silently treated as resolved.
    if(c.type==="splitConcern"&&allCitations.some(q=>!fields.some(child=>child.citations.some(c=>sha256(q)===sha256(c)))))fail("Split children must retain every original feedback quotation.");
    const children=fields.map(fields=>newConcern(state,attempt,fields,env));
    for(const child of children){child.parentIds=parents.map(p=>p.id);const inherited=parents.find(p=>p.origin!=="manual");if(inherited){child.origin=inherited.origin;child.generation=inherited.generation?{...inherited.generation,humanEdited:true}:null;}}
    for(const parent of parents){changeConcern(parent,env);parent.status="superseded";parent.reason=c.reason;parent.successorIds=children.map(ch=>ch.id);}
    for(const action of f.actions.filter(a=>a.fields.concernIds.some(id=>parents.some(p=>p.id===id)))){changeAction(action,env);action.fields.concernIds=[...new Set([...action.fields.concernIds.filter(id=>!parents.some(p=>p.id===id)),...children.map(ch=>ch.id)])];action.fields.state="in-progress";action.fields.reviewedBy="";action.fields.reviewedAt=null;}
    for(const group of f.conflicts.filter(g=>g.concernIds.some(id=>parents.some(p=>p.id===id))))group.concernIds=[...new Set([...group.concernIds,...children.map(ch=>ch.id)])];
    attempt.document.concernOrder=attempt.document.concernOrder.flatMap(id=>parents.some(p=>p.id===id)?children.map(ch=>ch.id):[id]).filter((id,i,arr)=>arr.indexOf(id)===i);touchAttempt(attempt,env);selectedId=children[0]!.id;resultIds=children.map(ch=>ch.id);
  } else if(c.type==="recordConflictDecision") {
    const attempt=attemptFor(state,c.attemptId,true);assertUnique(c.concernIds,"Conflict concerns");if(c.concernIds.some(id=>find(f.concerns,id).attemptId!==attempt.id))fail("Conflict concerns belong to another attempt.");
    const group=c.conflictId?find(f.conflicts,c.conflictId):{...base(attempt.projectId,attempt.provenance,env,"conflict"),attemptId:attempt.id,concernIds:c.concernIds,decisions:[]};
    if(group.attemptId!==attempt.id)fail("Conflict belongs to another attempt.");
    if(c.conflictId&&sha256([...group.concernIds].sort())!==sha256([...c.concernIds].sort()))fail("Existing conflict membership is retained; create a distinct group for different concerns.");
    if(!c.conflictId)f.conflicts.push(group);
    if(c.rationale.trim()){if(c.rationale.trim().length<5||!c.by.trim())fail("A conflict decision needs a reason and researcher label.");appendBound(group.decisions,"Conflict decisions");group.decisions.push({rationale:c.rationale,callConstraint:c.callConstraint,by:c.by,fingerprint:conflictFingerprint(state,group),at:env.at});}
    group.updatedAt=env.at;touchAttempt(attempt,env);selectedId=group.id;
  } else if(c.type==="saveRevisionAction"||c.type==="recordActionOutcome") {
    let action:ActionRecord;let attempt:AttemptRecord;
    if(c.type==="saveRevisionAction") {
      attempt=attemptFor(state,c.attemptId,true);assertUnique(c.fields.concernIds,"Action concerns");if(c.fields.concernIds.some(id=>{const concern=find(f.concerns,id);return concern.attemptId!==attempt.id||concern.status!=="accepted";}))fail("Action concerns must be accepted in this attempt.");
      if(c.actionId){action=find(f.actions,c.actionId);if(action.attemptId!==attempt.id)fail("Action belongs to another attempt.");if(action.revision!==c.actionRevision)fail("Action changed before save.",409);const downgrade=action.fields.evidenceRequired&&(!c.fields.evidenceRequired||(["new-data","new-analysis"].includes(action.fields.kind)&&!["new-data","new-analysis"].includes(c.fields.kind)));if(downgrade&&(c.fields.evidenceReason.trim().length<5||c.fields.evidenceReason===action.fields.evidenceReason))fail("Removing or downgrading an evidence need requires a new reasoned disposition and renewed review.");const same=sha256(scientificAction(action))===sha256(scientificAction({...action,fields:c.fields}));changeAction(action,env);action.fields={...c.fields,...(!same?{state:"open" as const,reviewedBy:"",reviewedAt:null}:{})};}
      else{appendBound(f.actions.filter(a=>a.attemptId===attempt.id),"Actions",200);action={...base(attempt.projectId,attempt.provenance,env,"action"),attemptId:attempt.id,revision:1,fields:{...c.fields,state:"open",reviewedBy:"",reviewedAt:null},history:[]};f.actions.push(action);}
    } else {
      action=find(f.actions,c.actionId);attempt=attemptFor(state,action.attemptId,true);if(action.revision!==c.actionRevision)fail("Action changed before outcome review.",409);changeAction(action,env);action.fields={...action.fields,result:c.result,resultClassification:c.resultClassification,evidence:c.evidence,revisions:c.revisions,state:"reviewed",reviewedBy:c.by,reviewedAt:env.at};
      const issues=actionIssues(state,attempt,action);if(issues.length)fail(issues.join(" "));
    }
    if(!env.fixture)action.provenance="researcher";
    touchAttempt(attempt,env);selectedId=action.id;
  } else if(c.type==="saveConcernResponse") {
    const concern=find(f.concerns,c.concernId),attempt=attemptFor(state,concern.attemptId,true);
    if(concern.status!=="accepted")fail("Write responses for accepted active concerns.");
    const preview=c.previewToken?requirePreview(c.previewToken,"respond",state,attempt.id,concern.id):null;
    if(preview){const output=ResponsePreview.parse(preview.output);if(c.citations.some(c=>!output.citations.some(saved=>sha256(c)===sha256(saved))))fail("Accepted preview citations must use the selected saved preview evidence.");consumeToken=c.previewToken;}
    let response=concernResponse(state,concern);if(!response){response={...base(attempt.projectId,attempt.provenance,env,"response"),attemptId:attempt.id,concernId:concern.id,revisions:[],completions:[]};f.responses.push(response);}
    appendBound(response.revisions,"Response revisions");response.revisions.push({id:env.id("response-revision"),text:c.text,origin:preview?.mode??last(response.revisions)?.origin??"manual",createdAt:env.at,citations:c.citations,missingInputs:c.missingInputs,generation:preview?{...preview.metadata,humanEdited:c.text!==ResponsePreview.parse(preview.output).text}:last(response.revisions)?.generation?{...last(response.revisions)!.generation!,humanEdited:true}:null});response.updatedAt=env.at;touchAttempt(attempt,env);selectedId=response.id;
  } else if(c.type==="requestConcernReview"||c.type==="recordConcernCompletion") {
    const concern=find(f.concerns,c.concernId),attempt=attemptFor(state,concern.attemptId,true);requireCompletion(state,concern);
    if(c.type==="requestConcernReview")concern.awaitingReview=true;
    else{const response=concernResponse(state,concern)!;if(last(response.revisions).id!==c.responseRevisionId||concernFingerprint(state,concern)!==c.expectedFingerprint)fail("The row changed. Review its current evidence, target and response before completing it.",409);const expectedKind={change:"changed",clarify:"clarified","not-adopted":"not-adopted",unassigned:""}[concern.fields.disposition];if(c.kind!==expectedKind)fail("Completion label must match the recorded disposition.");appendBound(response.completions,"Human completion decisions");response.completions.push({id:env.id("completion"),fingerprint:c.expectedFingerprint,dependencies:jsonCopy(concernDependencies(state,concern)),reviewedActionRevisions:concernActions(state,concern).map(a=>({id:a.id,revision:a.revision})),responseRevisionId:c.responseRevisionId,kind:c.kind,reason:c.reason,by:c.by,at:env.at});}
    touchAttempt(attempt,env);selectedId=concern.id;
  } else if(c.type==="confirmAttemptContext") {
    const attempt=attemptFor(state,c.attemptId,true),app=find(state.applications,attempt.targetApplicationId),call=find(state.opportunities,app.opportunityId);
    if(c.context.callRevision!==call.revision)fail("The target call changed before context review.",409);
    if(c.context.confirmed&&(!c.context.confirmedBy.trim()||!c.context.checkedOn||c.context.rationale.trim().length<5||c.context.sponsorType==="unresolved"))fail("Confirmed context needs a checked date, human label, rationale and formal type decision.");
    for(const rule of c.context.rules)if(rule.status!=="unknown"&&(!rule.checkedOn||rule.decision.trim().length<5||(rule.status==="confirmed"&&(!rule.url||rule.excerpt.trim().length<5))))fail("A checked sponsor-rule decision needs a date and rationale; confirmed instructions also need their official URL and excerpt.");
    appendBound(attempt.contextHistory,"Sponsor decision history",99);attempt.contextHistory.push(structuredClone(attempt.context));attempt.context=c.context;if(!env.fixture)attempt.provenance="researcher";touchAttempt(attempt,env);selectedId=attempt.id;
  } else if(c.type==="saveAttemptMappings") {
    const attempt=attemptFor(state,c.attemptId,true);if(attempt.revision!==c.attemptRevision)fail("Attempt changed before mapping save. Preserve and reconcile your mapping choices.",409);mappingsValid(state,attempt,c.mappings);appendBound(attempt.mappingHistory,"Attempt mapping history",99);attempt.mappingHistory.push({revision:attempt.revision,mappings:structuredClone(attempt.mappings),at:attempt.updatedAt});attempt.mappings=c.mappings;touchAttempt(attempt,env);selectedId=attempt.id;
  } else if(c.type==="reviewAttempt") {
    const attempt=attemptFor(state,c.attemptId,true);if(attemptFingerprint(state,attempt)!==c.expectedFingerprint)fail("Attempt changed before internal review.",409);const issues=attemptIssues(state,attempt);if(issues.length)fail(issues.join(" "));appendBound(attempt.reviews,"Attempt reviews");attempt.reviews.push({fingerprint:c.expectedFingerprint,by:c.by,at:env.at});attempt.state="reviewed";attempt.updatedAt=env.at;selectedId=attempt.id;
  } else if(c.type==="archiveAttempt") {
    const attempt=attemptFor(state,c.attemptId,true);attempt.state="archived";attempt.archiveReason=c.reason;attempt.updatedAt=env.at;selectedId=attempt.id;
  } else if(c.type==="saveResponseDocument") {
    const attempt=attemptFor(state,c.attemptId,true);assertUnique(c.concernOrder,"Response order");if(c.concernOrder.some(id=>find(f.concerns,id).attemptId!==attempt.id))fail("Response order includes another attempt's concern.");
    attempt.document.concernOrder=c.concernOrder;
    for(const key of ["opening","closing"] as const)if((last(attempt.document[key])?.text??"")!==c[key]){appendBound(attempt.document[key],"Response document revisions");attempt.document[key].push({id:env.id("document-revision"),text:c[key],origin:"manual",createdAt:env.at,citations:[],missingInputs:[],generation:null});}
    if(c.reviewFingerprint){if(documentFingerprint(state,attempt)!==c.reviewFingerprint)fail("Response document changed before review.",409);if(!c.by.trim())fail("A document review needs a researcher label.");appendBound(attempt.document.reviews,"Response document reviews");attempt.document.reviews.push({fingerprint:c.reviewFingerprint,by:c.by,at:env.at});}
    touchAttempt(attempt,env);selectedId=attempt.id;
  } else if(c.type==="saveResponsePacket") {
    assertUnique(c.concernIds,"Packet concerns");selectedId=savePacket(state,c,env);
  }
  resultIds=resultIds.length?resultIds:selectedId?[selectedId]:[];
  if("operationId" in c)f.receipts.push({projectId:commandProject(state,c),operationId:c.operationId,command:c.type,inputDigest:sha256(c),resultIds,createdAt:env.at});
  state.revision++;ResubmissionsSchema.parse(f);validateResubmissionGraph(state);
  if(Buffer.byteLength(JSON.stringify(state,null,2),"utf8")>25*1024*1024)fail("The workspace exceeds 25 MiB. The existing store remains readable; export or plan a capacity change without pruning history.",413);
  return {state,selectedId,resultIds,replayed:false,consumedPreviewToken:consumeToken};
}
/** Call only after the candidate workspace has been durably atomically saved. */
export function commitResubmissionPreview(result:{consumedPreviewToken?:string}) {if(result.consumedPreviewToken)previews.delete(result.consumedPreviewToken);}
