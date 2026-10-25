import { Citation, type CitationRecord, type FeedbackRecord, type AttemptRecord } from "./schema";
import { exactCitation, fail, find, last, normalized, type Workspace } from "./context";

export function feedbackCitation(state: Workspace, attempt: AttemptRecord, value: CitationRecord) {
  const c = Citation.parse(value), source = find(state.resubmissions.feedback, c.sourceId);
  if (source.attemptId !== attempt.id || source.projectId !== attempt.projectId) fail("Feedback quotations must belong to this attempt and project.");
  const version = source.versions.find(v => v.version === c.version) ?? fail("Feedback version is unavailable.");
  if (!exactCitation(c, version.text, version.hash)) fail("Feedback quotation, hash or normalized UTF-16 range does not match.");
  return { source, version };
}
export function quoteFeedback(source: FeedbackRecord, start: number, end: number, versionNumber = last(source.versions).version): CitationRecord {
  const version = source.versions.find(v => v.version === versionNumber) ?? fail("Feedback version is unavailable.");
  if (!Number.isInteger(start) || !Number.isInteger(end) || start < 0 || end <= start || end > version.text.length) fail("Select a nonempty exact feedback range.");
  const doc = normalized(source.id, version.text);
  return Citation.parse({ sourceId: source.id, version: version.version, hash: doc.hash, start, end, quote: doc.text.slice(start, end) });
}
export function feedbackParagraphs(text: string) {
  return [...text.matchAll(/\S(?:[^\n]|\n(?![\t ]*\n))*/g)].map(m => {
    const value = m[0].trimEnd(); return { start: m.index!, end: m.index! + value.length, text: value };
  });
}
export function coverageGaps(source: FeedbackRecord, review = last(source.coverageReviews)) {
  const current = last(source.versions);
  if (!review || review.version !== current.version || review.hash !== current.hash) return feedbackParagraphs(current.text);
  return uncoveredParagraphs(current.text,review.decisions);
}
function uncoveredParagraphs(text:string, decisions:FeedbackRecord["coverageReviews"][number]["decisions"]) {
  const ranges=[...decisions].sort((a,b)=>a.start-b.start);
  return feedbackParagraphs(text).filter(p=>{let cursor=p.start;for(const d of ranges)if(d.start<=cursor&&d.end>cursor)cursor=d.end;return cursor<p.end;});
}
export function validateCoverage(source: FeedbackRecord, decisions: FeedbackRecord["coverageReviews"][number]["decisions"]) {
  const current = last(source.versions);
  for (const d of decisions) if (d.end <= d.start || d.end > current.text.length || !current.text.slice(d.start, d.end).trim()) fail("Coverage ranges must select nonempty saved feedback text.");
  // Multiple reviewed ranges may collectively cover a paragraph. Gaps between
  // ranges remain visible; overlap is permitted.
  const gaps = uncoveredParagraphs(current.text,decisions);
  if (gaps.length) fail(`${gaps.length} nonempty feedback paragraph(s) still need a reviewed range or explicit disposition.`);
}
