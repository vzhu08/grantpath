"use client";
import { useState } from "react";
import { Field, CitationView, SourceText, useEditorDirty } from "../common";
import { cite } from "../../lib/evidence";
import type { AwardRecord, ProgressRevision } from "../../lib/awards/schema";
import type { AwardPanelProps } from "./types";
import type { AwardSend } from "./panel";

export function AwardProgressEditor({ state, awards, award, busy, send }: AwardPanelProps & { award: AwardRecord; send: AwardSend }) {
  const [termsId, setTermsId] = useState(award.currentConfirmedTermsVersionId);
  const terms = awards.termsVersions.find(t => t.id === termsId)!;
  const sources = state.sources.filter(s => s.projectId === award.projectId && s.type !== "call");
  const [sourceId, setSourceId] = useState(""), [sourceVersion, setSourceVersion] = useState<number | undefined>(), [quote, setQuote] = useState(""), [actor, setActor] = useState(""), [reason, setReason] = useState(""),
    [goalId, setGoalId] = useState(""), [status, setStatus] = useState<ProgressRevision["state"]>("no_update"), [finding, setFinding] = useState<ProgressRevision["finding"]>("none_reported"),
    [start, setStart] = useState(""), [end, setEnd] = useState(""), [observed, setObserved] = useState(""), [text, setText] = useState(""),
    [delay, setDelay] = useState(""), [recovery, setRecovery] = useState(""), [next, setNext] = useState(""),
    [kind, setKind] = useState<ProgressRevision["evidenceKind"]>("researcher_log"), [editing, setEditing] = useState<{ id: string; revisionId: string } | null>(null), [error, setError] = useState("");
  const [markDirty] = useEditorDirty(`award-progress-${award.id}`);
  const source = sources.find(s => s.id === sourceId);
  const edit = (set: (v: string) => void, value: string) => { set(value); markDirty(true); };
  async function save() {
    try {
      const evidence = quote && source ? [cite(source, quote, sourceVersion)] : [];
      const result = await send({ type: "saveAwardProgress", awardId: award.id, expectedAwardRevision: award.revision,
        updateId: editing?.id ?? null, expectedProgressRevisionId: editing?.revisionId ?? null,
        input: { termsVersionId: terms.id, goalIds: goalId ? [goalId] : [], itemIds: [], startDate: start || null, endDate: end || null, observedDate: observed || null,
          state: status, finding, factualText: text, delayReason: delay, recoveryPlan: recovery, nextPlan: next, evidence, evidenceKind: kind,
          correctionReason: editing ? reason : "", allocation: null }, actor, reason });
      if (result) { markDirty(false); setError(""); setEditing(null); }
    } catch (e) { setError((e as Error).message); }
  }
  function correct(id: string, p: ProgressRevision) {
    setEditing({ id, revisionId: p.id }); setTermsId(p.termsVersionId); setGoalId(p.goalIds[0] ?? ""); setStatus(p.state); setFinding(p.finding); setStart(p.startDate ?? ""); setEnd(p.endDate ?? "");
    setObserved(p.observedDate ?? ""); setText(p.factualText); setDelay(p.delayReason); setRecovery(p.recoveryPlan); setNext(p.nextPlan); setKind(p.evidenceKind);
    setSourceId(p.evidence[0]?.sourceId ?? ""); setSourceVersion(p.evidence[0]?.version); setQuote(p.evidence[0]?.quote ?? ""); setReason(""); markDirty(true);
  }
  return <div><h3>Actual progress</h3><p>Completed work, findings and future plans are separate. A dated researcher log is labeled researcher-reported. Missing or out-of-period evidence stays a gap in the worksheet.</p>
    <p>Pinned terms: {terms.id}. {termsId !== award.currentConfirmedTermsVersionId && <button type="button" onClick={() => { setTermsId(award.currentConfirmedTermsVersionId); setGoalId(""); markDirty(true); }}>Reconcile this update against current terms · reselect goal</button>}</p>
    <div className="card"><h4>{editing ? "Append a correction · preserve original revision" : "Record a dated update"}</h4>
      <Field label="Approved goal"><select value={goalId} onChange={e => edit(setGoalId, e.target.value)}><option value="">No goal selected</option>{terms.payload.goals.map(g => <option key={g.goalId} value={g.goalId}>{g.text}</option>)}</select></Field>
      <Field label="Work status"><select value={status} onChange={e => { setStatus(e.target.value as typeof status); markDirty(true); }}>{["no_update", "not_started", "in_progress", "completed", "delayed"].map(v => <option key={v} value={v}>{v.replaceAll("_", " ")}</option>)}</select></Field>
      <Field label="Finding · completion is not a positive finding"><select value={finding} onChange={e => { setFinding(e.target.value as typeof finding); markDirty(true); }}>{["none_reported", "positive", "negative", "inconclusive"].map(v => <option key={v} value={v}>{v.replaceAll("_", " ")}</option>)}</select></Field>
      {[["Activity start", start, setStart], ["Activity end", end, setEnd], ["Observation date", observed, setObserved]].map(([label, value, set]) => <Field key={String(label)} label={String(label)}><input type="date" value={String(value)} onChange={e => edit(set as (v: string) => void, e.target.value)} /></Field>)}
      {[["What actually happened", text, setText], ["Delay reason", delay, setDelay], ["Recovery plan · future work", recovery, setRecovery], ["Next-period plan · future work", next, setNext]].map(([label, value, set]) => <Field key={String(label)} label={String(label)}><textarea maxLength={5000} value={String(value)} onChange={e => edit(set as (v: string) => void, e.target.value)} rows={3} /></Field>)}
      <Field label="Evidence kind"><select value={kind} onChange={e => { setKind(e.target.value as typeof kind); markDirty(true); }}><option value="researcher_log">Researcher-reported log</option><option value="artifact">Output artifact text</option><option value="other">Other supplied evidence</option></select></Field>
      <Field label="Actual evidence source"><select value={sourceId} onChange={e => { edit(setSourceId, e.target.value); setSourceVersion(sources.find(s => s.id === e.target.value)?.versions.at(-1)?.version); }}><option value="">Missing evidence</option>{sources.map(s => <option key={s.id} value={s.id}>{s.title}</option>)}</select></Field>
      {source && <><SourceText key={`${source.id}-${sourceVersion}`} source={source} initialVersion={sourceVersion} /><p>Pinned evidence v{sourceVersion}. <button type="button" onClick={() => { setSourceVersion(source.versions.at(-1)!.version); markDirty(true); }}>Select latest version after review</button></p></>}<Field label="Exact evidence excerpt"><textarea maxLength={20000} value={quote} onChange={e => edit(setQuote, e.target.value)} rows={4} /></Field>
      <Field label="Local author"><input value={actor} onChange={e => edit(setActor, e.target.value)} maxLength={500} /></Field><Field label={editing ? "Correction reason" : "Review note"}><input value={reason} onChange={e => edit(setReason, e.target.value)} maxLength={500} /></Field>
      {error && <p role="alert" className="error">{error}</p>}<button type="button" disabled={busy} onClick={() => void save()}>Save {editing ? "correction" : "actual update"}</button>
    </div>
    {awards.progressUpdates.filter(u => u.awardId === award.id).map(u => { const p = u.revisions.at(-1)!; return <article className="card" key={u.id}><h4>{p.state.replaceAll("_", " ")} · {p.finding.replaceAll("_", " ")}</h4><p>{p.factualText || "No actual narrative supplied."}</p><p>{p.observedDate ?? p.endDate ?? "Observation date missing"} · {p.evidenceKind === "researcher_log" ? "Researcher-reported" : "Supplied evidence"} · {u.revisions.length} retained revision(s)</p>{p.evidence.map((c, i) => <CitationView key={i} citation={c} state={state} />)}<button type="button" onClick={() => correct(u.id, p)}>Append correction</button><details><summary>Progress history</summary>{u.revisions.map(r => <p key={r.id}>Revision {r.ordinal} · {r.at} · {r.factualText} · {r.correctionReason}</p>)}</details></article>; })}
  </div>;
}
