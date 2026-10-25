import { createDemo, createApplication } from "../../lib/fixtures";
import { emptyResubmissions, type ResubmissionCommand, type ConcernRecord, type ActionRecord } from "../../lib/resubmissions/schema";
import { applyResubmissionCommand,commitResubmissionPreview } from "../../lib/resubmissions/workflow";
import { last, textDigest, type Workspace } from "../../lib/resubmissions/context";
import { quoteFeedback } from "../../lib/resubmissions/feedback";
import { concernFingerprint } from "../../lib/resubmissions/matrix";
export function harness() {
  let state:Workspace={...createDemo(),resubmissions:emptyResubmissions()}, counter=0;
  const env={at:"2026-10-25T12:00:00.000Z",id:(prefix:string)=>`${prefix}-${++counter}`,fixture:true};
  const run=(command:ResubmissionCommand,expectedRevision=state.revision)=>{const result=applyResubmissionCommand(state,{expectedRevision,command},env);state=result.state;commitResubmissionPreview(result);return result;};
  const original=createApplication(state.projects[0]!,state.opportunities[0]!,state,"original");state.applications.push({...original,cycleId:"initial",originAttemptId:null});
  const captureId=run({type:"createSubmissionCapture",projectId:"demo-project",originalApplicationId:"original",method:"pasted",supersedesId:null,correctionReason:""}).selectedId!;
  for(const [sectionId,label,text] of [["summary","Summary","Original summary."],["approach","Approach","Original approach."]])run({type:"saveCaptureSection",captureId,captureRevision:state.resubmissions.captures[0]!.revision,sectionId:sectionId!,label:label!,text:text!,savedRevisionId:null});
  const freeze:ResubmissionCommand={type:"freezeSubmissionSnapshot",captureId,captureRevision:state.resubmissions.captures[0]!.revision,coverage:{extent:"partial",included:["Summary","Approach"],excluded:["Figures","Uncaptured sections","Attachments and layout"],limitation:"Only selected narrative text is represented.",confirmed:true},attestation:{by:"Local researcher",statement:"I confirm this text matches the submitted narrative within this inventory.",confirmsSubmittedText:true,submittedOn:"unknown",sponsorIdentifier:"Synthetic sponsor",applicationIdentifier:"SYN-01"},operationId:"freeze-1"};
  const snapshotId=run(freeze).selectedId!;
  const create:ResubmissionCommand={type:"createResubmissionAttempt",snapshotId,targetCallId:"demo-call-1",priorAttemptId:null,profile:"general",mode:"blank",mappings:[{originalSectionId:"summary",targetSectionIds:["summary"],note:"Stable summary mapping."},{originalSectionId:"approach",targetSectionIds:["approach"],note:"Stable approach mapping."}],confirmCopy:false,operationId:"attempt-1"};
  const attemptId=run(create).selectedId!;
  const feedbackId=run({type:"saveFeedbackSource",attemptId,label:"Reviewer 1",kind:"individual-review",url:"",text:"Clarify calibration.\n\nCollect new pilot data."}).selectedId!;
  function concern(start=0,end=20,sectionId="summary") {
    const source=state.resubmissions.feedback.find(f=>f.id===feedbackId)!;
    const fields:ConcernRecord["fields"]={interpretation:"Explain the calibration method.",citations:[quoteFeedback(source,start,end)],importance:"major",disposition:"clarify",confirmed:true,mappings:[{originalSectionId:sectionId,targetSectionIds:[sectionId],note:"Explicit mapping."}],noEditReason:"",rationale:""};
    return run({type:"saveConcern",attemptId,fields,status:"accepted"}).selectedId!;
  }
  function target(sectionId="summary",text="Revised calibration passage.") {
    const app=state.applications.find(a=>a.id===state.resubmissions.attempts.find(a=>a.id===attemptId)!.targetApplicationId)!;
    const section=app.sections.find(s=>s.key===sectionId)!;
    const revision={id:env.id("draft"),text,citations:[],selectedSources:[],projectRevision:1,callRevision:1,callSourceVersion:1,missingInputs:[],mode:"manual" as const,promptVersion:"manual",createdAt:env.at};section.revisions.push(revision);
    return {applicationId:app.id,sectionId,revisionId:revision.id,digest:textDigest(text),range:{start:0,end:text.length,quote:text}};
  }
  function action(concernId:string,sectionId="summary",overrides:Partial<ActionRecord["fields"]>={}) {
    const fields:ActionRecord["fields"]={concernIds:[concernId],description:"Clarify the saved method.",owner:"Researcher",due:{kind:"unknown",raw:"",reason:"Not scheduled."},kind:"clarification",evidenceRequired:false,evidenceReason:"Clarification only.",evidence:[],revisions:[target(sectionId)],state:"open",result:"",resultClassification:"unrecorded",reviewedBy:"",reviewedAt:null,...overrides};
    return run({type:"saveRevisionAction",attemptId,fields}).selectedId!;
  }
  function complete(concernId:string,actionId:string) {
    const action=state.resubmissions.actions.find(a=>a.id===actionId)!;
    run({type:"recordActionOutcome",actionId,actionRevision:action.revision,result:"Clarified the method in the pinned target passage.",resultClassification:"existing-fact",evidence:action.fields.evidence,revisions:action.fields.revisions,by:"Researcher"});
    run({type:"saveConcernResponse",concernId,text:"We clarified the calibration method in the target passage.",citations:[],missingInputs:[]});
    const concern=state.resubmissions.concerns.find(c=>c.id===concernId)!,response=state.resubmissions.responses.find(r=>r.concernId===concernId)!;
    run({type:"recordConcernCompletion",concernId,responseRevisionId:last(response.revisions).id,expectedFingerprint:concernFingerprint(state,concern),kind:"clarified",reason:"Reviewed the passage and the response together.",by:"Researcher"});
  }
  return {get state(){return state;},set state(next:Workspace){state=next;},run,env,attemptId,feedbackId,captureId,snapshotId,freeze,create,concern,target,action,complete};
}
