"use client";
import { useState } from "react";
import { Field, useEditorDirty, CitationView } from "../common";
import { SECTION_KEYS, type AwardRecord, type FactualBlock, type SectionKey, type ReportContext } from "../../lib/awards/schema";
import { orderedSections, ANNUAL_TEMPLATE } from "../../lib/awards/templates";
import { previewWorksheet } from "../../lib/awards/assembly";
import { localDate } from "../../lib/dates";
import { reportReviewProblems } from "../../lib/awards/freshness";
import type { AwardPanelProps } from "./types";
import type { AwardSend } from "./panel";

const emptySections = () => Object.fromEntries(SECTION_KEYS.map(k => [k, [] as FactualBlock[]])) as Record<SectionKey, FactualBlock[]>;
export function AnnualWorksheetEditor({ state, awards, award, busy, send }: AwardPanelProps & { award: AwardRecord; send: AwardSend }) {
  const [termsId, setTermsId] = useState(award.currentConfirmedTermsVersionId);
  const terms = awards.termsVersions.find(t => t.id === termsId)!;
  const [periodId, setPeriodId] = useState(""), [through, setThrough] = useState(""), [actor, setActor] = useState(""), [reason, setReason] = useState(""),
    [blocks, setBlocks] = useState(emptySections), [selectedProgress, setSelectedProgress] = useState<string[]>([]), [reportId, setReportId] = useState<string | null>(null),
    [expectedRevisionId, setExpectedRevisionId] = useState<string | null>(null), [error, setError] = useState(""), [mode, setMode] = useState<"manual" | "deterministic">("manual"), [historicalReason, setHistoricalReason] = useState("");
  const [markDirty] = useEditorDirty(`award-report-${award.id}`);
  const reports = awards.reports.filter(r => r.awardId === award.id), report = reports.find(r => r.id === reportId), revision = report?.revisions.at(-1);
  const updates = awards.progressUpdates.filter(u => u.awardId === award.id);
  function context(): ReportContext {
    const period = terms.payload.budgetPeriods.find(p => p.id === periodId);
    if (!period) throw new Error("Select the actual confirmed reporting budget period.");
    const progressRefs = updates.filter(u => selectedProgress.includes(u.id)).map(u => ({ updateId: u.id, revisionId: u.revisions.at(-1)!.id }));
    const allRefs = [...terms.payload.sourceRefs, ...updates.filter(u => selectedProgress.includes(u.id)).flatMap(u => u.revisions.at(-1)!.evidence.map(c => ({ sourceId: c.sourceId, version: c.version, hash: c.hash, role: "actual progress" })))];
    const seen = new Set<string>();
    return { termsVersionId: terms.id, termsDigest: terms.digest, periodId, periodStart: period.start, periodEnd: period.end, evidenceThrough: through,
      asOfDate: localDate(), progressRefs, sourceRefs: allRefs.filter(r => { const k = `${r.sourceId}:${r.version}:${r.hash}`; if (seen.has(k)) return false; seen.add(k); return true; }),
      historicalSourceReviews: historicalReason.trim() ? allRefs.flatMap(ref => { const latest = state.sources.find(s => s.id === ref.sourceId)?.versions.at(-1)?.version;
        return latest && latest !== ref.version ? [{ sourceId: ref.sourceId, version: ref.version, latestVersion: latest, reason: historicalReason, actor }] : []; }) : [] };
  }
  function editBlock(key: SectionKey, index: number, change: Partial<FactualBlock>) { setBlocks(all => ({ ...all, [key]: all[key].map((b, i) => i === index ? { ...b, ...change } : b) })); setMode("manual"); markDirty(true); }
  function loadReport(id: string) {
    const saved = reports.find(r => r.id === id), r = saved?.revisions.at(-1);
    if (!r) return;
    // Explicit action; props refresh never overwrites editor buffers.
    setReportId(id); setExpectedRevisionId(r.id); setTermsId(r.context.termsVersionId); setPeriodId(r.context.periodId); setThrough(r.context.evidenceThrough);
    setSelectedProgress(r.context.progressRefs.map(p => p.updateId));
    const next = emptySections(); for (const sectionId of r.sectionRevisionIds) { const s = awards.sectionRevisions.find(s => s.id === sectionId)!; next[s.sectionKey] = structuredClone(s.blocks); }
    setBlocks(next); markDirty(false);
  }
  async function save() {
    try {
      const { asOfDate: _, ...inputContext } = context();
      const result = await send({ type: "saveAnnualReport", awardId: award.id, expectedAwardRevision: award.revision,
        reportId, expectedReportRevisionId: expectedRevisionId, context: inputContext,
        sections: SECTION_KEYS.map(sectionKey => ({ sectionKey, blocks: blocks[sectionKey], mode })), actor, reason });
      if (result) { setReportId(result.resultIds[0]!); setExpectedRevisionId(result.resultIds[1]!); markDirty(false); setError(""); }
    } catch (e) { setError((e as Error).message); }
  }
  const bind = { awardId: award.id, expectedAwardRevision: award.revision, actor, reason };
  const stale = !!revision && reportReviewProblems(awards, award.id, revision.context, state.sources).length > 0;
  return <div><h3>NSF annual narrative worksheet</h3><p>{ANNUAL_TEMPLATE.scopeNote}</p><p className="muted">Exact portal-template fidelity is unverified. Structured products/PAR, participant roster and other portal fields remain separate. Unknown special requirements are not “none.”</p>
    <p>Pinned terms: {terms.id}. {termsId !== award.currentConfirmedTermsVersionId && <button type="button" onClick={() => { setTermsId(award.currentConfirmedTermsVersionId); setPeriodId(""); markDirty(true); }}>Reconcile against current terms · reselect period and review blocks</button>}</p>
    <div className="card"><Field label="Confirmed reporting budget period"><select value={periodId} onChange={e => { setPeriodId(e.target.value); markDirty(true); }}><option value="">Select actual period</option>{terms.payload.budgetPeriods.map(p => <option key={p.id} value={p.id}>{p.label}: {p.start} — {p.end}</option>)}</select></Field>
      <Field label="Evidence through date"><input type="date" value={through} onChange={e => { setThrough(e.target.value); markDirty(true); }} /></Field><p>As of save: server date in America/New_York. Future actuals and unallocated boundary-spanning work cannot support performance.</p>
      <fieldset><legend>Select actual progress revisions</legend>{updates.map(u => { const p = u.revisions.at(-1)!; return <label key={u.id} style={{ display: "block" }}><input type="checkbox" checked={selectedProgress.includes(u.id)} onChange={e => { setSelectedProgress(ids => e.target.checked ? [...ids, u.id] : ids.filter(id => id !== u.id)); markDirty(true); }} />{p.state.replaceAll("_", " ")} · {p.factualText || "No update"} · revision {p.ordinal}</label>; })}</fieldset>
      <button type="button" onClick={() => { try { setBlocks(previewWorksheet(awards, award.id, context())); setMode("deterministic"); markDirty(true); setError(""); } catch (e) { setError((e as Error).message); } }}>Assemble evidence-linked preview · review required</button>
      <Field label="Local reviewer/preparer"><input value={actor} onChange={e => { setActor(e.target.value); markDirty(true); }} maxLength={500} /></Field><Field label="Review note, absence decision or missing-input disclosure"><textarea value={reason} onChange={e => { setReason(e.target.value); markDirty(true); }} maxLength={500} /></Field>
      <Field label="If retaining older evidence: reason after inspecting every newer supplied source"><textarea value={historicalReason} onChange={e => { setHistoricalReason(e.target.value); markDirty(true); }} maxLength={500} /></Field>
    </div>
    {orderedSections().map(s => <section className="card" key={s.key} aria-label={s.title}><h4>{s.title}</h4><p>{s.prompt}</p>
      {!blocks[s.key].length && <p>Missing narrative. Blank is distinct from a human-confirmed nothing-to-report decision.</p>}
      {blocks[s.key].map((block, i) => <div className="field" key={block.blockId}><Field label={`${s.title} block ${i + 1}`}><textarea value={block.text} maxLength={10000} rows={4} onChange={e => editBlock(s.key, i, { text: e.target.value })} /></Field>
        <Field label="Claim kind"><select value={block.claimKind} onChange={e => editBlock(s.key, i, { claimKind: e.target.value as FactualBlock["claimKind"] })}>{["approved_goal", "actual_activity", "actual_result", "delay", "future_plan", "context"].map(v => <option key={v} value={v}>{v.replaceAll("_", " ")}</option>)}</select></Field>
        <Field label="Pinned support"><select value={supportValue(block)} onChange={e => { const value = e.target.value;
          const progress = updates.find(u => `progress:${u.id}` === value); const goal = terms.payload.goals.find(g => `goal:${g.goalId}` === value);
          editBlock(s.key, i, { supportRefs: progress ? [{ kind: "progress_update", awardId: award.id, updateId: progress.id, revisionId: progress.revisions.at(-1)!.id }] : goal ? [{ kind: "approved_goal", awardId: award.id, termsVersionId: terms.id, goalId: goal.goalId }] : [{ kind: "missing", reason: "Human-supplied draft has no resolved evidence support." }] });
        }}><option value="missing">Missing support · disclose gap</option>{terms.payload.goals.map(g => <option key={g.goalId} value={`goal:${g.goalId}`}>Approved goal: {g.text}</option>)}{updates.filter(u => selectedProgress.includes(u.id)).map(u => <option key={u.id} value={`progress:${u.id}`}>Actual update: {u.revisions.at(-1)!.factualText}</option>)}</select></Field>
        {block.supportRefs.map((ref, j) => ref.kind === "source_quote" ? <CitationView key={j} citation={ref.citation} state={state} /> : <p className="muted" key={j}>{ref.kind === "missing" ? `Gap: ${ref.reason}` : `Pinned ${ref.kind.replaceAll("_", " ")}`}</p>)}
        <button type="button" onClick={() => { setBlocks(all => ({ ...all, [s.key]: all[s.key].filter((_, n) => n !== i) })); markDirty(true); }}>Remove this draft block</button>
      </div>)}
      <button type="button" onClick={() => { setBlocks(all => ({ ...all, [s.key]: [...all[s.key], { blockId: `block-${crypto.randomUUID()}`, text: "[Missing narrative]", claimKind: "context", supportRefs: [{ kind: "missing", reason: "No support supplied." }] }] })); markDirty(true); }}>Add manual block · missing support initially</button>
    </section>)}
    {error && <p role="alert" className="error">{error}</p>}<button type="button" disabled={busy} onClick={() => void save()}>Save exact worksheet revision</button>
    <h4>Saved worksheet revisions</h4>{reports.map(r => <p key={r.id}>{r.id} · {r.revisions.length} retained revision(s) <button type="button" onClick={() => loadReport(r.id)}>Load saved worksheet into editor</button></p>)}
    {revision && <div className="card"><h4>Review saved revision {revision.ordinal}</h4>{stale && <p className="error">Current inputs changed. Preserve this history; save a reconciled worksheet revision before review.</p>}
      <p>Review applies to the saved text below, including disclosed gaps.</p>
      {revision.sectionRevisionIds.map(sectionRevisionId => { const s = awards.sectionRevisions.find(s => s.id === sectionRevisionId)!; const review = awards.sectionReviews.filter(r => r.reportRevisionId === revision.id && r.sectionRevisionId === s.id).at(-1); return <div key={s.id}><details><summary>{s.sectionKey} · {review?.decision.replaceAll("_", " ") ?? "Review missing"}</summary><p style={{ whiteSpace: "pre-wrap" }}>{s.text || "Blank narrative"}</p></details>
        <button type="button" disabled={busy || !!stale} onClick={() => void send({ type: "reviewAnnualSection", ...bind, reportId: report!.id, reportRevisionId: revision.id, sectionRevisionId: s.id, decision: "reviewed" })}>Review saved {s.sectionKey} with visible gaps</button>
        {s.sectionKey !== "accomplishments" && !s.blocks.length && <button type="button" disabled={busy || !!stale} onClick={() => void send({ type: "reviewAnnualSection", ...bind, reportId: report!.id, reportRevisionId: revision.id, sectionRevisionId: s.id, decision: "nothing_to_report_confirmed" })}>Confirm nothing to report · use written reason</button>}
      </div>; })}
      <ul>{revision.unresolved.map((gap, i) => <li key={i}>{gap}</li>)}</ul><button type="button" disabled={busy || !!stale} onClick={() => void send({ type: "freezeAnnualReport", ...bind, reportId: report!.id, reportRevisionId: revision.id })}>Save reviewed draft snapshot with gaps</button>
    </div>}
    <h4>Historical reviewed snapshots</h4>{awards.reportSnapshots.filter(s => s.awardId === award.id).map(s => <article className="card" key={s.id}><p>Historical reviewed draft · {s.payload.reviewedAt} · {s.payload.reviewActor}</p><p>Period {s.payload.reportRevision.context.periodStart} to {s.payload.reportRevision.context.periodEnd} · evidence through {s.payload.reportRevision.context.evidenceThrough}</p><p>Digest <code style={{ overflowWrap: "anywhere" }}>{s.digest}</code></p><a href={`/api/awards/reports/${encodeURIComponent(s.id)}/export?format=md`}>Download narrative Markdown</a>{" · "}<a href={`/api/awards/reports/${encodeURIComponent(s.id)}/export?format=json`}>Download separate internal evidence JSON</a></article>)}
  </div>;
}
function supportValue(block: FactualBlock) { const ref = block.supportRefs[0]; return ref?.kind === "progress_update" ? `progress:${ref.updateId}` : ref?.kind === "approved_goal" ? `goal:${ref.goalId}` : "missing"; }
