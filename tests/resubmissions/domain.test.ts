import { describe,it,expect } from "vitest";
import { harness } from "./harness";
import { canonical,last,normalized,sha256 } from "../../lib/resubmissions/context";
import { concernFingerprint,concernState,documentFingerprint,attemptIssues } from "../../lib/resubmissions/matrix";
import { feedbackCitation,quoteFeedback,coverageGaps } from "../../lib/resubmissions/feedback";
import { validateResubmissionGraph } from "../../lib/resubmissions/validation";
import { packetJSON,packetMarkdown } from "../../lib/resubmissions/exports";
import { newSource,cite } from "../../lib/evidence";
import { ResubmissionCommandSchema } from "../../lib/resubmissions/schema";
describe("resubmission truth and cycles",()=>{
  it("freezes explicit partial coverage; later capture/project/call changes leave original digest unchanged",()=>{
    const h=harness(),before=canonical(h.state.resubmissions.snapshots[0]);
    h.run({type:"saveCaptureSection",captureId:h.captureId,captureRevision:3,sectionId:"summary",label:"Summary",text:"A later correction.",savedRevisionId:null});
    h.state.projects[0]!.profile.title="Changed title";h.state.opportunities[0]!.title="Changed call";
    expect(canonical(h.state.resubmissions.snapshots[0])).toBe(before);expect(h.state.resubmissions.snapshots[0]!.coverage.extent).toBe("partial");
    expect(()=>h.run({...h.freeze,type:"freezeSubmissionSnapshot",operationId:"complete-text",captureRevision:4,coverage:{...h.freeze.coverage,extent:"complete-text"}})).toThrow(/already frozen/);
  });
  it("same-call cycles are distinct; stale successful retry recovers original IDs and changed content conflicts",()=>{
    const h=harness(),first=h.state.resubmissions.attempts[0]!;
    const retried=h.run(h.create,0);expect(retried.replayed).toBe(true);expect(retried.resultIds).toEqual([first.id,first.targetApplicationId]);
    expect(()=>h.run({...h.create,mode:"reviewed-copy",confirmCopy:true},0)).toThrow(/different content/);
    const second=h.run({...h.create,operationId:"attempt-2"}).selectedId!;expect(second).not.toBe(first.id);expect(h.state.applications).toHaveLength(3);expect(first.context.sponsorType).toBe("unresolved");
    expect(h.state.applications[0]!.sections.every(s=>!s.revisions.length)).toBe(true);
  });
  it("freeze retry returns same immutable snapshot before stale revision rejection",()=>{const h=harness();expect(h.run(h.freeze,0).selectedId).toBe(h.snapshotId);expect(h.state.resubmissions.snapshots).toHaveLength(1);});
  it("capture-create retry recovers its original mutable capture before stale revision rejection",()=>{const h=harness();expect(h.run({type:"createSubmissionCapture",operationId:"capture-create-1",projectId:"demo-project",originalApplicationId:"original",method:"pasted",supersedesId:null,correctionReason:""},0).selectedId).toBe(h.captureId);expect(h.state.resubmissions.captures).toHaveLength(1);});
  it("failed stale commands and graph failures leave the original candidate byte-identical",()=>{const h=harness(),before=canonical(h.state);expect(()=>h.run({type:"saveConcern",attemptId:h.attemptId,fields:{interpretation:"wrong",citations:[{sourceId:"missing",version:1,hash:"bad",quote:"x",start:0,end:1}],importance:"major",disposition:"change",confirmed:true,mappings:[],noEditReason:"",rationale:""},status:"accepted"})).toThrow();expect(canonical(h.state)).toBe(before);expect(()=>h.run({type:"archiveAttempt",attemptId:h.attemptId,reason:"Archive for later."},0)).toThrow(/newer save/);});
  it("rejects whitespace-only researcher labels and retained decision reasons",()=>{expect(ResubmissionCommandSchema.safeParse({type:"reviewAttempt",attemptId:"attempt",expectedFingerprint:"a".repeat(64),by:" "}).success).toBe(false);expect(ResubmissionCommandSchema.safeParse({type:"archiveAttempt",attemptId:"attempt",reason:"     "}).success).toBe(false);});
});
describe("feedback quotation and coverage integrity",()=>{
  it("normalizes BOM/newlines and retains selected repeated occurrence offsets including non-BMP text",()=>{
    const h=harness();h.run({type:"saveFeedbackSource",attemptId:h.attemptId,sourceId:h.feedbackId,label:"Reviewer 1",kind:"individual-review",url:"",text:"\uFEFF😀 repeat\r\n\r\n😀 repeat"});
    const source=h.state.resubmissions.feedback[0]!,v=last(source.versions),start=v.text.lastIndexOf("😀 repeat"),quote=quoteFeedback(source,start,start+9);
    expect(quote.start).toBe(11);expect(quote.end).toBe(20);expect(feedbackCitation(h.state,h.state.resubmissions.attempts[0]!,quote).version.version).toBe(2);
    expect(()=>feedbackCitation(h.state,h.state.resubmissions.attempts[0]!,{...quote,start:0})).toThrow(/range/);
    expect(()=>feedbackCitation(h.state,h.state.resubmissions.attempts[0]!,{...quote,hash:"bad"})).toThrow(/hash/);
  });
  it("coverage rejects omitted paragraphs; correction invalidates reviewed coverage and retains old quotes",()=>{
    const h=harness(),c=h.concern(),source=h.state.resubmissions.feedback[0]!,v=last(source.versions);
    expect(()=>h.run({type:"reviewFeedbackCoverage",sourceId:source.id,version:v.version,hash:v.hash,decisions:[{start:0,end:20,disposition:"concern",reason:"Calibration concern selected."}],by:"Researcher"})).toThrow(/paragraph/);
    h.run({type:"reviewFeedbackCoverage",sourceId:source.id,version:v.version,hash:v.hash,decisions:[{start:0,end:v.text.length,disposition:"concern",reason:"All paragraphs inspected."}],by:"Researcher"});expect(coverageGaps(h.state.resubmissions.feedback[0]!)).toHaveLength(0);
    h.run({type:"saveFeedbackSource",attemptId:h.attemptId,sourceId:source.id,label:"Reviewer 1",kind:"individual-review",url:"",text:v.text+"\n\nAdditional concern."});expect(coverageGaps(h.state.resubmissions.feedback[0]!).length).toBeGreaterThan(0);
    expect(feedbackCitation(h.state,h.state.resubmissions.attempts[0]!,h.state.resubmissions.concerns.find(x=>x.id===c)!.fields.citations[0]!).version.version).toBe(1);
  });
  it("rejects cross-attempt quotes and feedback as research evidence",()=>{
    const h=harness(),second=h.run({...h.create,operationId:"second"}).selectedId!,source=h.state.resubmissions.feedback[0]!;
    expect(()=>feedbackCitation(h.state,h.state.resubmissions.attempts.find(a=>a.id===second)!,quoteFeedback(source,0,20))).toThrow(/this attempt/);
    const c=h.concern();expect(()=>h.action(c,"summary",{evidenceRequired:true,evidence:[{citation:quoteFeedback(source,0,20),claim:"An experiment",classification:"observed-result",resultDate:""}]})).toThrow();
  });
});
describe("completion and targeted invalidation",()=>{
  it("requires human outcomes and matching disposition; administrative action and opening edits preserve resolved rows",()=>{
    const h=harness(),id=h.concern(),aid=h.action(id);h.complete(id,aid);
    expect(concernState(h.state,h.state.resubmissions.concerns[0]!)).toBe("Resolved");
    const action=h.state.resubmissions.actions[0]!;h.run({type:"saveRevisionAction",attemptId:h.attemptId,actionId:aid,actionRevision:action.revision,fields:{...action.fields,owner:"Another descriptive label",due:{kind:"date",raw:"next",date:"2026-11-01",confirmed:true}}});
    expect(concernState(h.state,h.state.resubmissions.concerns[0]!)).toBe("Resolved");
    const prior=documentFingerprint(h.state,h.state.resubmissions.attempts[0]!);h.run({type:"saveResponseDocument",attemptId:h.attemptId,concernOrder:[id],opening:"New introduction",closing:"",by:""});expect(documentFingerprint(h.state,h.state.resubmissions.attempts[0]!)).not.toBe(prior);expect(concernState(h.state,h.state.resubmissions.concerns[0]!)).toBe("Resolved");
    expect(h.state.resubmissions.responses[0]!.completions).toHaveLength(1);
  });
  it("only reopens rows whose mapped sections changed; retains historical completion",()=>{
    const h=harness(),a=h.concern(0,20,"summary"),b=h.concern(22,45,"approach");h.complete(a,h.action(a));h.complete(b,h.action(b,"approach"));
    h.target("summary","A newer saved summary.");
    expect(concernState(h.state,h.state.resubmissions.concerns.find(c=>c.id===a)!)).toBe("Needs review");expect(concernState(h.state,h.state.resubmissions.concerns.find(c=>c.id===b)!)).toBe("Resolved");expect(h.state.resubmissions.responses[0]!.completions).toHaveLength(1);
  });
  it("new-data trap rejects proposed results and allows an explicitly recorded negative observed result",()=>{
    const h=harness(),c=h.concern(),aid=h.action(c,"summary",{kind:"new-data",evidenceRequired:true});
    const source=newSource({id:"result",projectId:"demo-project",title:"Synthetic negative result",type:"preliminary",provenance:"demo",text:"The synthetic pilot detected no improvement."});h.state.sources.push(source);
    const evidence={citation:cite(source,"The synthetic pilot detected no improvement."),claim:"The pilot found no improvement.",classification:"observed-result" as const,resultDate:"2026-10-25"};
    const a=h.state.resubmissions.actions[0]!;
    expect(()=>h.run({type:"recordActionOutcome",actionId:aid,actionRevision:a.revision,result:"We will collect data.",resultClassification:"proposed-work",evidence:[{...evidence,classification:"proposed-work"}],revisions:a.fields.revisions,by:"Researcher"})).toThrow(/observed/);
    h.run({type:"recordActionOutcome",actionId:aid,actionRevision:a.revision,result:"The synthetic pilot found no improvement.",resultClassification:"negative-result",evidence:[evidence],revisions:a.fields.revisions,by:"Researcher"});expect(h.state.resubmissions.actions[0]!.fields.state).toBe("reviewed");
    h.run({type:"saveConcernResponse",concernId:c,text:"The pilot result was negative; we preserve that limitation.",citations:[evidence.citation],missingInputs:[]});
    const concern=h.state.resubmissions.concerns[0]!,response=h.state.resubmissions.responses[0]!;h.run({type:"recordConcernCompletion",concernId:c,responseRevisionId:last(response.revisions).id,expectedFingerprint:concernFingerprint(h.state,concern),kind:"clarified",reason:"Reviewed negative evidence honestly.",by:"Researcher"});expect(concernState(h.state,h.state.resubmissions.concerns[0]!)).toBe("Resolved");
    const doc=normalized(source.id,source.versions[0]!.text+" A corrected result.");h.state.sources.find(s=>s.id===source.id)!.versions.push({version:2,hash:doc.hash,text:doc.text,createdAt:h.env.at});expect(concernState(h.state,h.state.resubmissions.concerns[0]!)).toBe("Needs review");
  });
  it("evidence-need downgrades require reason and re-review; required history is retained",()=>{const h=harness(),c=h.concern(),aid=h.action(c,"summary",{kind:"new-data",evidenceRequired:true,evidenceReason:""}),a=h.state.resubmissions.actions[0]!;expect(()=>h.run({type:"saveRevisionAction",attemptId:h.attemptId,actionId:aid,actionRevision:a.revision,fields:{...a.fields,evidenceRequired:false}})).toThrow(/reasoned/);h.run({type:"saveRevisionAction",attemptId:h.attemptId,actionId:aid,actionRevision:a.revision,fields:{...a.fields,evidenceRequired:false,evidenceReason:"The study scope changed; the evidence need is no longer applicable."}});expect(h.state.resubmissions.actions[0]!.history[0]!.fields.evidenceRequired).toBe(true);expect(h.state.resubmissions.actions[0]!.fields.state).toBe("open");});
});
describe("lineage, conflicts and packet history",()=>{
  it("split and merge retain quotes and one shared action, without cycles or partial saves",()=>{
    const h=harness(),id=h.concern(),aid=h.action(id),parent=h.state.resubmissions.concerns[0]!;
    const children=h.run({type:"splitConcern",concernId:id,concernRevision:parent.revision,children:[{...parent.fields,interpretation:"Calibration detail"},{...parent.fields,interpretation:"Measurement detail"}],reason:"Two separately actionable concerns."}).resultIds;
    expect(children).toHaveLength(2);expect(h.state.resubmissions.actions).toHaveLength(1);expect(h.state.resubmissions.actions[0]!.fields.concernIds).toEqual(children);
    const merged=h.run({type:"mergeConcerns",attemptId:h.attemptId,concernIds:children,interpretation:"Combined method concern",reason:"Shared action and original passage."}).selectedId!;expect(h.state.resubmissions.actions.find(a=>a.id===aid)!.fields.concernIds).toEqual([merged]);
    const broken=structuredClone(h.state);broken.resubmissions.concerns.find(c=>c.id===merged)!.successorIds=[id];broken.resubmissions.concerns[0]!.parentIds=[merged];expect(()=>validateResubmissionGraph(broken)).toThrow(/cycle/);
  });
  it("conflicting recommendations require a current human rationale before completion",()=>{
    const h=harness(),a=h.concern(),b=h.concern(22,45,"approach"),action=h.action(a);const group=h.run({type:"recordConflictDecision",attemptId:h.attemptId,concernIds:[a,b],rationale:"",callConstraint:"",by:""}).selectedId!;
    expect(()=>h.complete(a,action)).toThrow(/conflict/);
    h.run({type:"recordConflictDecision",attemptId:h.attemptId,conflictId:group,concernIds:[a,b],rationale:"Preserve calibration and defer additional data under the revised scope.",callConstraint:"Synthetic call scope only.",by:"Researcher"});
    // Earlier failed completion was atomic; response/outcome saves before the
    // failed completion remain intentional independent commands.
    h.complete(a,action);expect(concernState(h.state,h.state.resubmissions.concerns[0]!)).toBe("Resolved");expect(attemptIssues(h.state,h.state.resubmissions.attempts[0]!).length).toBeGreaterThan(0);
  });
  it("saved packet is self-contained, selective, inert and unchanged by edits or restart",()=>{
    const h=harness(),id=h.concern(),aid=h.action(id);h.complete(id,aid);
    h.run({type:"saveFeedbackSource",attemptId:h.attemptId,label:"Unused review",kind:"panel-summary",url:"",text:"UNSELECTED_PRIVATE_SENTINEL"});
    const packetId=h.run({type:"saveResponsePacket",attemptId:h.attemptId,concernIds:[id],includeOriginal:false,includeTarget:false,operationId:"packet-1"}).selectedId!,packet=h.state.resubmissions.packets.find(p=>p.id===packetId)!,before=packetJSON(packet),markdown=packetMarkdown(packet);
    expect(before).not.toContain("UNSELECTED_PRIVATE_SENTINEL");expect(markdown).not.toContain("UNSELECTED_PRIVATE_SENTINEL");expect(before).toContain("partial");expect(packet.digest).toBe(sha256(packet.payload));
    h.run({type:"saveConcernResponse",concernId:id,text:"<img src=https://example.invalid/private> ![x](https://example.invalid/x) <script>alert(1)</script>",citations:[],missingInputs:[]});
    h.state=JSON.parse(JSON.stringify(h.state));validateResubmissionGraph(h.state);expect(packetJSON(h.state.resubmissions.packets[0]!)).toBe(before);expect(h.run({type:"saveResponsePacket",attemptId:h.attemptId,concernIds:[id],includeOriginal:false,includeTarget:false,operationId:"packet-1"},0).selectedId).toBe(packetId);
    const newPacket=h.run({type:"saveResponsePacket",attemptId:h.attemptId,concernIds:[id],includeOriginal:false,includeTarget:false,operationId:"packet-2"}).selectedId!;const md=packetMarkdown(h.state.resubmissions.packets.find(p=>p.id===newPacket)!);expect(md).not.toContain("<img");expect(md).toContain("&lt;img");expect(md).not.toContain("![x](https:");expect(md).toContain("Needs review");
  });
});
