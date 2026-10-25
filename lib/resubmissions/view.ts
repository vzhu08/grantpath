import { compareSections } from "./comparison";
import { attemptFingerprint,attemptIssues,concernFingerprint,concernState,completionIssues,documentFingerprint,actionAgenda } from "./matrix";
import { find,last,type Workspace } from "./context";
import { coverageGaps } from "./feedback";
export function resubmissionView(state:Workspace) {
  return {revision:state.revision,concerns:Object.fromEntries(state.resubmissions.concerns.map(c=>[c.id,{state:concernState(state,c),fingerprint:concernFingerprint(state,c),issues:completionIssues(state,c)}])),attempts:Object.fromEntries(state.resubmissions.attempts.map(a=>{
    const snapshot=find(state.resubmissions.snapshots,a.snapshotId),app=find(state.applications,a.targetApplicationId),fingerprint=attemptFingerprint(state,a),issues=attemptIssues(state,a),documentReview=documentFingerprint(state,a);
    return [a.id,{fingerprint,issues,state:a.state==="archived"?"Archived":last(a.reviews)?.fingerprint===fingerprint&&!issues.length?"Reviewed":"Working",documentFingerprint:documentReview,documentReviewed:last(a.document.reviews)?.fingerprint===documentReview,comparison:compareSections(snapshot.sections.map(s=>({sectionId:s.sectionId,label:s.label,revisionId:s.revisionId,text:s.text})),app.sections.map(s=>({sectionId:s.key,label:s.label,revisionId:last(s.revisions)?.id??null,text:last(s.revisions)?.text??""})),a.mappings.map(m=>({originalSectionIds:m.originalSectionId?[m.originalSectionId]:[],targetSectionIds:m.targetSectionIds})))}];
  })),feedback:Object.fromEntries(state.resubmissions.feedback.map(s=>[s.id,{gaps:coverageGaps(s)}])),agenda:actionAgenda(state)};
}
export type ResubmissionView=ReturnType<typeof resubmissionView>;
