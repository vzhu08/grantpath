"use client";
import { useState } from "react";
import { Field, SourceText, CitationView, DeadlineEditor, useEditorDirty } from "../common";
import { cite } from "../../lib/evidence";
import { unknownDeadline, type Deadline } from "../../lib/schema";
import type { AwardRecord, AwardItem } from "../../lib/awards/schema";
import type { AwardPanelProps } from "./types";
import type { AwardSend } from "./panel";

export function AwardItemsEditor({ state, awards, award, busy, send }: AwardPanelProps & { award: AwardRecord; send: AwardSend }) {
  const [termsId, setTermsId] = useState(award.currentConfirmedTermsVersionId);
  const [kind, setKind] = useState<"obligation" | "milestone">("obligation"), [origin, setOrigin] = useState<"sponsor" | "internal">("sponsor"),
    [title, setTitle] = useState(""), [description, setDescription] = useState(""), [responsibility, setResponsibility] = useState(""),
    [deadline, setDeadline] = useState<Deadline>(unknownDeadline()), [sourceId, setSourceId] = useState(""), [sourceVersion, setSourceVersion] = useState<number | undefined>(), [quote, setQuote] = useState(""),
    [actor, setActor] = useState(""), [reason, setReason] = useState(""), [actual, setActual] = useState(""), [error, setError] = useState(""), [editing, setEditing] = useState<AwardItem | null>(null);
  const [markDirty] = useEditorDirty(`award-items-${award.id}`);
  const sources = state.sources.filter(s => s.projectId === award.projectId && s.type !== "call"), source = sources.find(s => s.id === sourceId);
  const edit = (set: (v: string) => void, value: string) => { set(value); markDirty(true); };
  const evidence = () => source && quote ? [cite(source, quote, sourceVersion)] : [];
  const bind = { awardId: award.id, expectedAwardRevision: award.revision, actor, reason };
  async function save() {
    try { const result = await send({ type: kind === "obligation" ? "saveAwardObligation" : "saveAwardMilestone", ...bind,
      itemId: editing?.id ?? null, expectedItemRevisionId: editing?.revisions.at(-1)?.id ?? null,
      input: { termsVersionId: termsId, title, description, responsibility, deadline, evidence: evidence(),
        origin: kind === "milestone" ? "internal" : origin, review: "proposed", applicable: true, supersedesItemId: null, goalId: null, derivation: null } });
      if (result) { markDirty(false); setError(""); setEditing(null); }
    } catch (e) { setError((e as Error).message); }
  }
  return <div><h3>Obligations &amp; internal milestones</h3><p>Confirm dated, applicable items individually before they enter the agenda. A local completion is not legal certification or sponsor acceptance.</p>
    <p>Pinned terms: {termsId}. {termsId !== award.currentConfirmedTermsVersionId && <button type="button" onClick={() => { setTermsId(award.currentConfirmedTermsVersionId); markDirty(true); }}>Reconcile this item against current terms · retain editor text</button>}</p>
    <div className="card"><Field label="Item kind"><select value={kind} onChange={e => { setKind(e.target.value as typeof kind); markDirty(true); }}><option value="obligation">Obligation</option><option value="milestone">Internal milestone</option></select></Field>
      {kind === "obligation" && <Field label="Origin"><select value={origin} onChange={e => { setOrigin(e.target.value as typeof origin); markDirty(true); }}><option value="sponsor">Sponsor · exact term support required</option><option value="internal">Internal task</option></select></Field>}
      <Field label="Title"><input value={title} onChange={e => edit(setTitle, e.target.value)} maxLength={500} /></Field><Field label="Description"><textarea value={description} onChange={e => edit(setDescription, e.target.value)} maxLength={5000} /></Field>
      <Field label="Responsibility label"><input value={responsibility} onChange={e => edit(setResponsibility, e.target.value)} maxLength={500} /></Field>
      <DeadlineEditor value={deadline} onChange={v => { setDeadline(v); markDirty(true); }} label="Preparation target" />
      <Field label="Supporting source"><select value={sourceId} onChange={e => { edit(setSourceId, e.target.value); setSourceVersion(sources.find(s => s.id === e.target.value)?.versions.at(-1)?.version); }}><option value="">No source selected</option>{sources.map(s => <option key={s.id} value={s.id}>{s.title}</option>)}</select></Field>
      {source && <><SourceText key={`${source.id}-${sourceVersion}`} source={source} initialVersion={sourceVersion} /><p>Pinned evidence v{sourceVersion}. <button type="button" onClick={() => { setSourceVersion(source.versions.at(-1)!.version); markDirty(true); }}>Select latest version after review</button></p></>}<Field label="Exact term or completion evidence excerpt"><textarea value={quote} onChange={e => edit(setQuote, e.target.value)} maxLength={20000} rows={4} /></Field>
      <Field label="Local reviewer"><input value={actor} onChange={e => edit(setActor, e.target.value)} maxLength={500} /></Field><Field label="Review/completion note"><input value={reason} onChange={e => edit(setReason, e.target.value)} maxLength={500} /></Field>
      <Field label="Actual completion date, when recording completion"><input type="date" value={actual} onChange={e => edit(setActual, e.target.value)} /></Field>
      {error && <p role="alert" className="error">{error}</p>}<button type="button" disabled={busy} onClick={() => void save()}>Save proposed {kind}</button>
    </div>
    {[...awards.obligations, ...awards.milestones].filter(i => i.awardId === award.id).map(item => { const r = item.revisions.at(-1)!; return <article key={item.id} className="card"><h4>{r.title}</h4><p>{r.origin === "sponsor" ? "Sponsor obligation" : "Internal planning"} · {r.review} · {r.termsVersionId === award.currentConfirmedTermsVersionId ? "Current terms" : "Older terms · reconcile"}</p><p>{r.description}</p>{r.evidence.map((c, i) => <CitationView key={i} citation={c} state={state} />)}
      <button type="button" disabled={busy} onClick={() => { setEditing(item); setTermsId(r.termsVersionId); setKind(item.kind); setOrigin(r.origin); setTitle(r.title); setDescription(r.description); setResponsibility(r.responsibility); setDeadline(r.deadline); setSourceId(r.evidence[0]?.sourceId ?? ""); setSourceVersion(r.evidence[0]?.version); setQuote(r.evidence[0]?.quote ?? ""); markDirty(true); }}>Revise item · retain history</button>
      <button type="button" disabled={busy || !actor || !reason} onClick={() => void send({ type: "reviewAwardObligation", ...bind, itemId: item.id, expectedItemRevisionId: r.id })}>Confirm reviewed applicability and date</button>
      <button type="button" disabled={busy || !actual || !actor || !reason} onClick={() => { try { void send({ type: "recordAwardCompletion", ...bind, input: { itemId: item.id, itemRevisionId: r.id, actualDate: actual, status: "completed", evidence: evidence(), note: reason } }); } catch (e) { setError((e as Error).message); } }}>Record evidenced completion</button>
      <details><summary>Item and completion history</summary>{item.revisions.map(v => <p key={v.id}>Revision {v.ordinal} · {v.title} · {v.review} · {v.at}</p>)}{awards.completions.filter(c => c.itemId === item.id).map(c => <p key={c.id}>{c.actualDate} · {c.status} · {c.actor} · {c.note}</p>)}</details>
    </article>; })}
  </div>;
}
