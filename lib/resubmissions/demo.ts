import { createApplication,createDemo } from "../fixtures";
import { cite } from "../evidence";
import { applyProposalCommand } from "../proposals/workflow";
import { emptyResubmissions,type ResubmissionCommand,type ConcernRecord,type ActionRecord } from "./schema";
import { applyResubmissionCommand,commitResubmissionPreview } from "./workflow";
import { concernFingerprint } from "./matrix";
import { last,textDigest,type Workspace } from "./context";
import { quoteFeedback } from "./feedback";

/** A self-contained synthetic rehearsal fixture. Never reads a user's store.
 * Not an ordinary mutation or an assertion that research has been conducted. */
export function createResubmissionDemoWorkspace() {
  let state={...createDemo(),resubmissions:emptyResubmissions()} as Workspace,counter=0;
  const env={at:"2026-10-25T12:00:00.000Z",fixture:true,id:(prefix:string)=>`resubmission-demo-${prefix}-${++counter}`};
  function run(command:ResubmissionCommand){const result=applyResubmissionCommand(state,{expectedRevision:state.revision,command},env);state=result.state;commitResubmissionPreview(result);return result.selectedId!;}
  const original=createApplication(state.projects[0]!,state.opportunities[0]!,state,"resubmission-demo-original");state.applications.push({...original,cycleId:"initial",originAttemptId:null});
  applyProposalCommand(state,{type:"adoptTemplate",applicationId:original.id,templateId:"nsf-standard-research"},env.at);
  const app=state.applications.find(a=>a.id===original.id)!;app.stage="Submitted";
  const methods=state.sources.find(s=>s.id==="demo-methods")!,methodCitation=cite(methods,"Calibration drift and missing measurements will be documented.");
  for(const section of app.sections)section.revisions.push({id:env.id("submitted-draft"),text:`SYNTHETIC SUBMITTED TEXT — ${section.label}.\n\nThis illustrative sensor study proposes paired sensor and reference measurements. Field validation and site access remain planned; no field pilot result is claimed.`,citations:[methodCitation],selectedSources:[{sourceId:methods.id,version:1,hash:methods.versions[0]!.hash}],projectRevision:1,callRevision:1,callSourceVersion:1,missingInputs:[],mode:"fixture",promptVersion:"synthetic-resubmission-v1",createdAt:env.at});
  const captureId=run({type:"createSubmissionCapture",operationId:"capture-create-1",projectId:app.projectId,originalApplicationId:app.id,method:"saved-drafts",supersedesId:null,correctionReason:""});
  for(const section of app.sections)run({type:"saveCaptureSection",captureId,captureRevision:state.resubmissions.captures[0]!.revision,sectionId:section.key,label:section.label,text:"",savedRevisionId:last(section.revisions).id});
  const snapshotId=run({type:"freezeSubmissionSnapshot",captureId,captureRevision:state.resubmissions.captures[0]!.revision,coverage:{extent:"complete-text",included:app.sections.map(s=>s.label),excluded:["Figures","Layout","Attachments and external forms"],limitation:"Synthetic text-only rehearsal: all 14 narrative editors are captured; figures, attachment files and portal forms are unrepresented.",confirmed:true},attestation:{by:"Synthetic example researcher",statement:"For this synthetic rehearsal, these saved sections match the illustrative submitted narrative within the stated inventory.",confirmsSubmittedText:true,submittedOn:"unknown",sponsorIdentifier:"FICTIONAL DEMO CALL",applicationIdentifier:"SYNTHETIC-ORIGINAL"},operationId:"synthetic-freeze"});
  const attemptId=run({type:"createResubmissionAttempt",snapshotId,targetCallId:app.opportunityId,priorAttemptId:null,profile:"nsf-resubmission-preparation",mode:"reviewed-copy",mappings:app.sections.map(s=>({originalSectionId:s.key,targetSectionIds:[s.key],note:"Reviewed stable section identity for the synthetic rehearsal."})),confirmCopy:true,operationId:"synthetic-attempt"});
  const sourceIds=[
    run({type:"saveFeedbackSource",attemptId,label:"Reviewer 1 — synthetic",kind:"individual-review",url:"",text:"Explain calibration drift and how the reference measurements address it.\n\nA new field validation experiment is needed before a stronger performance claim can be made."}),
    run({type:"saveFeedbackSource",attemptId,label:"Reviewer 2 — synthetic",kind:"individual-review",url:"",text:"Narrow the proposed field work to one site to keep the scope credible.\n\nPlease make the scope and limitations explicit."}),
    run({type:"saveFeedbackSource",attemptId,label:"Panel — synthetic",kind:"panel-summary",url:"",text:"Broaden the field work to several sites for generalizability.\n\nThe calibration explanation should distinguish existing methods from unfinished experiments."}),
  ];
  for(const id of sourceIds){const source=state.resubmissions.feedback.find(s=>s.id===id)!,v=last(source.versions);run({type:"reviewFeedbackCoverage",sourceId:id,version:v.version,hash:v.hash,decisions:[{start:0,end:v.text.length,disposition:"concern",reason:"Every paragraph inspected in the labeled synthetic example; the selected concerns retain their exact passages."}],by:"Synthetic example researcher"});}
  const sectionId="description-methods";
  function concern(sourceId:string,paragraph:number,interpretation:string,disposition:ConcernRecord["fields"]["disposition"]="clarify"){
    const source=state.resubmissions.feedback.find(s=>s.id===sourceId)!,text=last(source.versions).text,quote=text.split("\n\n")[paragraph]!,start=text.indexOf(quote);
    return run({type:"saveConcern",attemptId,status:"accepted",fields:{interpretation,citations:[quoteFeedback(source,start,start+quote.length)],importance:"major",disposition,confirmed:true,mappings:[{originalSectionId:sectionId,targetSectionIds:[sectionId],note:"Explicit methods-section link."}],noEditReason:"",rationale:disposition==="not-adopted"?"This synthetic example chooses a narrower feasible scope and retains the generalizability limitation.":""}});
  }
  const supportedId=concern(sourceIds[0]!,0,"Clarify how planned calibration checks address drift."),experimentId=concern(sourceIds[0]!,1,"Obtain a new field validation result before making a performance claim.","change"),narrowId=concern(sourceIds[1]!,0,"Reduce the planned field deployment to one site.","change"),broadId=concern(sourceIds[2]!,0,"Consider the panel's request for multiple sites.","not-adopted");
  const target=state.applications.find(a=>a.id===state.resubmissions.attempts[0]!.targetApplicationId)!,section=target.sections.find(s=>s.key===sectionId)!;
  const text="SYNTHETIC REVISED METHODS.\n\nPaired reference measurements will document calibration drift and missing measurements. This is a planned method, not a completed field validation. The field experiment remains unfinished.";
  const revision={id:env.id("target-draft"),text,citations:[methodCitation],selectedSources:[{sourceId:methods.id,version:1,hash:methods.versions[0]!.hash}],projectRevision:1,callRevision:1,callSourceVersion:1,missingInputs:[],mode:"fixture" as const,promptVersion:"synthetic-resubmission-v1",createdAt:env.at};section.revisions.push(revision);
  const link={applicationId:target.id,sectionId,revisionId:revision.id,digest:textDigest(text),range:{start:0,end:text.length,quote:text}};
  function action(concernId:string,description:string,kind:ActionRecord["fields"]["kind"],evidenceRequired:boolean){return run({type:"saveRevisionAction",attemptId,fields:{concernIds:[concernId],description,owner:"Synthetic example researcher",due:{kind:"unknown",raw:"",reason:"Rehearsal only; no actual deadline is asserted."},kind,evidenceRequired,evidenceReason:"Declared need in the synthetic plan.",evidence:[],revisions:kind==="clarification"?[link]:[],state:"open",result:"",resultClassification:"unrecorded",reviewedBy:"",reviewedAt:null}});}
  const actionId=action(supportedId,"Explain the existing proposed calibration method without claiming a completed experiment.","clarification",true);
  action(experimentId,"Conduct the field validation and record the observed, negative or inconclusive result.","new-data",true);
  action(narrowId,"Revise the field scope and identify its limitation.","scope-change",false);
  action(broadId,"Explain why multi-site expansion is not adopted for this cycle.","scope-change",false);
  run({type:"recordConflictDecision",attemptId,concernIds:[narrowId,broadId],rationale:"The synthetic example chooses one-site feasibility and explicitly retains the limitation on generalizability. Neither comment is discarded.",callConstraint:"The fictional call has no real sponsor decision attached.",by:"Synthetic example researcher"});
  run({type:"confirmAttemptContext",attemptId,context:{relationship:"same-program",sponsorType:"new",rationale:"Synthetic NSF-first preparation example; lineage is separate from formal sponsor type.",checkedOn:"2026-10-25",confirmedBy:"Synthetic example researcher",confirmed:true,callRevision:1,rules:[{key:"waiting-restrictions",topic:"Waiting restrictions",excerpt:"No real program rule is asserted in this fictional demonstration.",url:"",checkedOn:"2026-10-25",decision:"Requires real solicitation review before real use.",status:"unknown"}],substantiveChanges:"Clarify calibration, narrow planned field scope, and retain the unfinished experiment as open work.",deliveryInstructions:"Internal response draft only; no sponsor attachment is authorized."}});
  const actionRecord=state.resubmissions.actions.find(a=>a.id===actionId)!;
  run({type:"recordActionOutcome",actionId,actionRevision:actionRecord.revision,result:"Clarified existing proposed methods; no field experiment is claimed.",resultClassification:"existing-fact",evidence:[{citation:methodCitation,claim:"The submitted method already planned to document calibration drift.",classification:"existing-fact",resultDate:""}],revisions:[link],by:"Synthetic example researcher"});
  run({type:"saveConcernResponse",concernId:supportedId,text:"We clarified the planned calibration checks in the exact saved methods passage. Field validation is still unfinished, so no field performance result is claimed.",citations:[methodCitation],missingInputs:[]});
  const concernRecord=state.resubmissions.concerns.find(c=>c.id===supportedId)!,response=state.resubmissions.responses.find(r=>r.concernId===supportedId)!;
  run({type:"recordConcernCompletion",concernId:supportedId,responseRevisionId:last(response.revisions).id,expectedFingerprint:concernFingerprint(state,concernRecord),kind:"clarified",reason:"Synthetic reviewer examined the quoted comment, method evidence, target revision and response together.",by:"Synthetic example researcher"});
  run({type:"saveResponseDocument",attemptId,concernOrder:[supportedId,experimentId,narrowId,broadId],opening:"SYNTHETIC INTERNAL RESPONSE. One clarification has been reviewed; unfinished work and scope decisions remain visible.",closing:"No sponsor eligibility, completed field experiment or funding outcome is asserted.",by:""});
  const packetId=run({type:"saveResponsePacket",attemptId,concernIds:[supportedId,experimentId,narrowId,broadId],includeOriginal:true,includeTarget:true,operationId:"synthetic-packet"});
  return {state,attemptId,targetApplicationId:target.id,supportedId,experimentId,packetId,linkedSourceId:methods.id};
}
