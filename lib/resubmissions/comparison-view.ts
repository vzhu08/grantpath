import { compareSections } from "./comparison";
import { find,last,type Workspace } from "./context";
import type { AttemptRecord } from "./schema";
/** Retained mappings may name archived target sections. Keep their historical
 * truth but show those originals and current replacements as unmapped now. */
export function compareAttempt(state:Workspace,attempt:AttemptRecord) {
  const snapshot=find(state.resubmissions.snapshots,attempt.snapshotId),app=find(state.applications,attempt.targetApplicationId);
  const currentIds=new Set(app.sections.map(s=>s.key));
  const mappings=attempt.mappings.map(m=>({originalSectionIds:m.originalSectionId?[m.originalSectionId]:[],targetSectionIds:m.targetSectionIds.filter(id=>currentIds.has(id))})).filter(m=>m.originalSectionIds.length||m.targetSectionIds.length);
  const comparison=compareSections(snapshot.sections.map(s=>({sectionId:s.sectionId,label:s.label,revisionId:s.revisionId,text:s.text})),app.sections.map(s=>({sectionId:s.key,label:s.label,revisionId:last(s.revisions)?.id??null,text:last(s.revisions)?.text??""})),mappings);
  return {...comparison,historicalMappings:attempt.mappings.filter(m=>m.targetSectionIds.some(id=>!currentIds.has(id))),notice:attempt.mappings.some(m=>m.targetSectionIds.some(id=>!currentIds.has(id)))?"Some mapped target sections are archived. Their pinned passages remain historical references; current replacements are shown as unmapped.":null};
}
