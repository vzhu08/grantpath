"use client";
import { useState } from "react";
import type { AttemptRecord, CitationRecord, FeedbackRecord } from "../../lib/resubmissions/schema";
import { ErrorText, Field, FormActions, Text, citation, useBuffer, useOperation, type Shared } from "./common";

export function FeedbackIntake(props: Shared & { attempt: AttemptRecord; source?: FeedbackRecord }) {
  const form = useBuffer("feedback-edit-" + (props.source?.id ?? props.attempt.id), { label: props.source?.label ?? "", kind: props.source?.kind ?? "individual-review", url: props.source?.url ?? "", text: props.source?.versions.at(-1)?.text ?? "" }, props.source?.updatedAt ?? props.attempt.id), op = useOperation(props.run), v = form.value;
  return <details className="card"><summary><strong>{props.source ? "Correct feedback (adds a retained version)" : "Paste a separate review or panel summary"}</strong></summary><p>Reviewer labels describe the source; they do not identify a person. Pasting stores this text locally and does not send it to an AI provider.</p>
    <form onSubmit={e => { e.preventDefault(); void op.save({ type: "saveFeedbackSource", attemptId: props.attempt.id, sourceId: props.source?.id, label: v.label, kind: v.kind, url: v.url, text: v.text }, () => props.source ? form.clean() : form.reload()); }}>
      <Field label="Feedback label"><input value={v.label} maxLength={500} onChange={e => form.edit({ ...v, label: e.target.value })} placeholder="Reviewer 1 or Panel" required /></Field>
      <Field label="Feedback kind"><select value={v.kind} onChange={e => form.edit({ ...v, kind: e.target.value as typeof v.kind })}><option value="individual-review">Individual review</option><option value="panel-summary">Panel summary</option><option value="decision">Decision</option><option value="program-guidance">Program guidance</option></select></Field>
      <Field label="Checked source URL (optional)"><input type="url" value={v.url} maxLength={2000} onChange={e => form.edit({ ...v, url: e.target.value })} /></Field>
      <Field label="Reviewer or panel text"><textarea rows={7} value={v.text} maxLength={20_000} onChange={e => form.edit({ ...v, text: e.target.value })} required /></Field>
      <ErrorText>{op.error}</ErrorText><FormActions dirty={form.dirty} busy={op.busy} onReload={form.reload}><button disabled={op.busy}>Save feedback source</button></FormActions>
    </form>
  </details>;
}

function paragraphs(text: string) { return [...text.matchAll(/\S(?:[^\n]|\n(?![\t ]*\n))*/g)].map(m => { const value = m[0].trimEnd(); return { start: m.index!, end: m.index! + value.length, text: value }; }); }
export function FeedbackReview(props: Shared & { source: FeedbackRecord; attempt: AttemptRecord; onQuote: (quote: CitationRecord) => void }) {
  const current = props.source.versions.at(-1)!, [versionNumber, setVersionNumber] = useState(current.version), [range, setRange] = useState({ start: 0, end: 0 }), [selectionError, setSelectionError] = useState("");
  const version = props.source.versions.find(v => v.version === versionNumber) ?? current, selected = version.text.slice(range.start, range.end), op = useOperation(props.run);
  const reviewed = props.source.coverageReviews.at(-1), initial = reviewed?.version === current.version ? reviewed.decisions : [];
  const form = useBuffer("feedback-coverage-" + props.source.id, { version: current.version, hash: current.hash, decisions: paragraphs(current.text).map(p => { const old = initial.find(d => d.start <= p.start && d.end >= p.end); return { start: p.start, end: p.end, disposition: old?.disposition ?? "", reason: old?.reason ?? "" }; }) }, current.version);
  return <section className="card"><h4>{props.source.label}</h4><p>{props.source.kind} · {props.source.provenance === "demo" ? "Synthetic" : "Researcher content"} · {props.view?.feedback[props.source.id]?.gaps.length ?? "…"} paragraph(s) need coverage review</p>
    <Field label="Saved feedback version"><select value={version.version} onChange={e => { setVersionNumber(Number(e.target.value)); setRange({ start: 0, end: 0 }); }}>{props.source.versions.map(v => <option key={v.version} value={v.version}>Version {v.version}{v.version === current.version ? " (current)" : " (historical)"}</option>)}</select></Field>
    <small>Canonical normalized text · UTF-16 end-exclusive offsets · {version.hash}</small>
    <Field label={`${props.source.label} canonical text — select the exact passage`}><textarea readOnly rows={8} value={version.text} onSelect={e => setRange({ start: e.currentTarget.selectionStart, end: e.currentTarget.selectionEnd })} /></Field>
    <p>Selected range {range.start}–{range.end}{version.version !== current.version ? " · historical version: a current completion will require explicit reanchoring" : ""}</p><Text>{selected || "Select words above to quote a concern."}</Text>
    <button type="button" disabled={!selected} onClick={() => { try { props.onQuote(citation(props.source.id, version.version, version.hash, version.text, range.start, range.end)); setSelectionError(""); } catch (e) { setSelectionError((e as Error).message); } }}>Use this exact feedback passage</button><ErrorText>{selectionError}</ErrorText>
    <details><summary>Review every nonempty paragraph</summary><p>Coverage helps expose omissions. It does not prove that every scientific issue was understood. Choose a disposition and reason for each paragraph.</p>
      <form onSubmit={e => { e.preventDefault(); const v = form.value; if (v.decisions.some(d => !d.disposition)) { op.setError("Choose a disposition for every nonempty paragraph."); return; } void op.save({ type: "reviewFeedbackCoverage", sourceId: props.source.id, version: v.version, hash: v.hash, decisions: v.decisions.map(d => ({ ...d, disposition: d.disposition as "concern" | "positive" | "administrative" | "no-action" })), by: props.actor }, () => form.clean()); }}>
        {paragraphs(current.text).map((p, i) => { const d = form.value.decisions[i]; return <article key={p.start}><Text>{p.text}</Text><Field label={`Paragraph ${i + 1} disposition`}><select value={d?.disposition ?? ""} onChange={e => form.edit({ ...form.value, decisions: form.value.decisions.map((d, j) => j === i ? { ...d, disposition: e.target.value } : d) })}><option value="">Not yet reviewed</option><option value="concern">Concern / reviewed range</option><option value="positive">Positive comment</option><option value="administrative">Administrative text</option><option value="no-action">No action, with reason</option></select></Field><Field label={`Paragraph ${i + 1} review reason`}><input value={d?.reason ?? ""} maxLength={3000} minLength={5} required onChange={e => form.edit({ ...form.value, decisions: form.value.decisions.map((d, j) => j === i ? { ...d, reason: e.target.value } : d) })} /></Field></article>; })}
        <ErrorText>{op.error}</ErrorText><FormActions dirty={form.dirty} busy={op.busy} onReload={form.reload}><button disabled={op.busy || form.value.decisions.some(d => !d.disposition || d.reason.trim().length < 5)}>Record coverage review for version {form.value.version}</button></FormActions>
      </form>
    </details><FeedbackIntake {...props} />
  </section>;
}
