"use client";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { Workspace } from "../../lib/resubmissions/context";
import type { CitationRecord, ResubmissionCommand } from "../../lib/resubmissions/schema";
import type { ResubmissionView } from "../../lib/resubmissions/view";
import { CreateCapture, CaptureEditor, CreateAttempt } from "./capture";
import { FeedbackIntake, FeedbackReview } from "./feedback";
import { ActionEditor, ConcernEditor } from "./matrix";
import { ComparisonView, ConflictPlanner, PacketReview, ResponseDocument, SponsorContext } from "./review";
import { DirtyContext, ErrorText, Field, Text, type Shared } from "./common";
import styles from "./panel.module.css";

export type ResubmissionsPanelProps = {
  state: Workspace;
  projectId: string;
  applicationId?: string;
  onCommand: (command: ResubmissionCommand) => Promise<unknown>;
  onSelectApplication?: (id: string) => void;
  onDirtyChange?: (dirty: boolean) => void;
};

export function ResubmissionsPanel(props: ResubmissionsPanelProps) {
  const [step, setStep] = useState<"baseline" | "matrix" | "review">("matrix"), [captureId, setCaptureId] = useState(""), [snapshotId, setSnapshotId] = useState(""), [attemptId, setAttemptId] = useState(""), [quote, setQuote] = useState<CitationRecord | null>(null), [actor, setActor] = useState("Local researcher"), [view, setView] = useState<ResubmissionView | null>(null), [viewError, setViewError] = useState(""), [refresh, setRefresh] = useState(0), [dirtyIds, setDirtyIds] = useState<Record<string, boolean>>({});
  const dirtyCallback = useRef(props.onDirtyChange); dirtyCallback.current = props.onDirtyChange;
  const mark = useCallback((id: string, dirty: boolean) => setDirtyIds(current => { if (!!current[id] === dirty) return current; const next = { ...current }; if (dirty) next[id] = true; else delete next[id]; return next; }), []), dirty = Object.values(dirtyIds).some(Boolean), dirtyContext = useMemo(() => ({ mark }), [mark]);
  useEffect(() => { dirtyCallback.current?.(dirty); }, [dirty]);
  useEffect(() => () => dirtyCallback.current?.(false), []);
  useEffect(() => { const guard = (event: BeforeUnloadEvent) => { if (dirty) { event.preventDefault(); event.returnValue = ""; } }; window.addEventListener("beforeunload", guard); return () => window.removeEventListener("beforeunload", guard); }, [dirty]);
  useEffect(() => {
    const controller = new AbortController(); setViewError("");
    void fetch("/api/resubmissions/view", { cache: "no-store", signal: controller.signal }).then(async response => { const data = await response.json(); if (!response.ok) throw new Error(data.error?.message ?? "Saved review status is unavailable."); if (data.revision !== props.state.revision) throw new Error("Saved workspace changed. Reload saved workspace data and reconcile your local text before reviewing."); setView(data); }).catch(error => { if (!controller.signal.aborted) { setView(null); setViewError((error as Error).message); } });
    return () => controller.abort();
  }, [props.state.revision, refresh]);
  const feature = props.state.resubmissions;
  if (!feature) return <section className="card"><h2>Resubmission response matrix</h2><p>This workspace needs the integrated resubmission schema before this view is available.</p></section>;
  const captures = feature.captures.filter(c => c.projectId === props.projectId), snapshots = feature.snapshots.filter(s => s.projectId === props.projectId), attempts = feature.attempts.filter(a => a.projectId === props.projectId), capture = captures.find(c => c.id === captureId) ?? captures.at(-1), snapshot = snapshots.find(s => s.id === snapshotId) ?? snapshots.at(-1), attempt = attempts.find(a => a.id === attemptId) ?? attempts.find(a => a.targetApplicationId === props.applicationId) ?? attempts.at(-1), currentView = view?.revision === props.state.revision ? view : null;
  const shared: Shared = { state: props.state, run: props.onCommand, actor, view: currentView }, concerns = feature.concerns.filter(c => c.attemptId === attempt?.id), actions = feature.actions.filter(a => a.attemptId === attempt?.id), feedback = feature.feedback.filter(f => f.attemptId === attempt?.id);
  function chooseAttempt(id: string) { setAttemptId(id); setQuote(null); }
  return <DirtyContext.Provider value={dirtyContext}><section aria-label="Resubmission response matrix" className={styles.panel}>
    <div className="card"><h2>Turn reviewer feedback into a traceable revision</h2><p>Original comment → action → evidence → exact target revision → response. A researcher records completion; a changed dependency visibly reopens the affected decision.</p>
      <Field label="Local researcher label"><input value={actor} maxLength={100} onChange={e => setActor(e.target.value)} /></Field><small>This descriptive label is stored with review decisions. It is not an authenticated institutional identity.</small>
      {attempts.length > 0 && <Field label="Resubmission attempt"><select value={attempt?.id ?? ""} disabled={dirty} onChange={e => chooseAttempt(e.target.value)}>{attempts.map(a => <option key={a.id} value={a.id}>{props.state.opportunities.find(c => c.id === props.state.applications.find(app => app.id === a.targetApplicationId)?.opportunityId)?.title} / {a.cycleId} / {currentView?.attempts[a.id]?.state ?? a.state}</option>)}</select></Field>}
      {dirty && <p role="status">Local edits are preserved. Save or explicitly discard them before switching capture, snapshot or attempt.</p>}
      <nav aria-label="Resubmission steps" className="row" style={{ flexWrap: "wrap", gap: 8 }}><button type="button" className={step === "baseline" ? "" : "secondary"} aria-pressed={step === "baseline"} onClick={() => setStep("baseline")}>Submitted baseline</button><button type="button" className={step === "matrix" ? "" : "secondary"} aria-pressed={step === "matrix"} onClick={() => setStep("matrix")}>Response matrix</button><button type="button" className={step === "review" ? "" : "secondary"} aria-pressed={step === "review"} onClick={() => setStep("review")}>Compare and export</button></nav>
      {!currentView && <p role="status">Checking current saved review dependencies…</p>}<ErrorText>{viewError}</ErrorText>{viewError && <button type="button" className="secondary" onClick={() => setRefresh(n => n + 1)}>Refresh saved review status</button>}
    </div>
    <div hidden={step !== "baseline"}>
      <CreateCapture {...shared} projectId={props.projectId} applicationId={props.applicationId} onCreated={id => { setCaptureId(id); setStep("baseline"); }} />
      {captures.length > 0 && <Field label="Mutable submission capture"><select value={capture?.id ?? ""} disabled={dirty} onChange={e => setCaptureId(e.target.value)}>{captures.map(c => <option key={c.id} value={c.id}>{c.id} / revision {c.revision}{feature.snapshots.some(s => s.captureId === c.id) ? " / frozen" : ""}</option>)}</select></Field>}
      {capture && <CaptureEditor key={capture.id} {...shared} capture={capture} onFrozen={id => setSnapshotId(id)} />}
      {snapshots.length > 0 && <><Field label="Frozen submitted baseline"><select value={snapshot?.id ?? ""} disabled={dirty} onChange={e => setSnapshotId(e.target.value)}>{snapshots.map(s => <option key={s.id} value={s.id}>{s.id} / {s.coverage.extent} / {s.createdAt}</option>)}</select></Field>{snapshot && <details className="card"><summary>Inspect frozen coverage and attestation</summary><p>Digest: <small style={{ overflowWrap: "anywhere" }}>{snapshot.digest}</small></p><Text>{snapshot.attestation.statement}</Text><p>{snapshot.attestation.by} · submitted {snapshot.attestation.submittedOn}</p><p>Included: {snapshot.coverage.included.join(", ")}</p><p>Excluded: {snapshot.coverage.excluded.join(", ")}</p><p>{snapshot.coverage.limitation}</p>{snapshot.supersedesId && <p>Corrects {snapshot.supersedesId}: {snapshot.correctionReason}</p>}</details>}<CreateAttempt {...shared} projectId={props.projectId} snapshot={snapshot} onCreated={id => { chooseAttempt(id); setStep("matrix"); }} /></>}
    </div>
    <div hidden={step !== "matrix"}>
      {!attempt ? <section className="card"><h3>Start from an attested submitted baseline</h3><p>Freeze the text actually submitted, then create an attempt and a distinct target application before entering feedback.</p><button type="button" onClick={() => setStep("baseline")}>Capture submitted baseline</button></section> : <>
        <section className="card"><h3>2. Plan the revision against original feedback</h3><p>Attempt {attempt.id} · {attempt.provenance === "demo" ? "Synthetic demonstration" : "Researcher or mixed content"} · target cycle {attempt.cycleId}</p><p>Original snapshot {attempt.snapshotId}. {attempt.state === "archived" ? "This attempt is archived; retained records remain inspectable." : "Manual planning needs no provider key."}</p>{props.onSelectApplication && <button type="button" className="secondary" disabled={dirty} onClick={() => props.onSelectApplication?.(attempt.targetApplicationId)}>Open this target application for drafting</button>}<p>{concerns.filter(c => currentView?.concerns[c.id]?.state === "Resolved").length} current resolved · {concerns.filter(c => currentView?.concerns[c.id]?.state === "Needs review").length} need review · {actions.filter(a => a.fields.kind === "new-data" && a.fields.state !== "reviewed").length} unfinished data actions</p></section>
        <fieldset disabled={attempt.state === "archived"} style={{ border: 0, padding: 0, minWidth: 0 }}><FeedbackIntake key={attempt.id} {...shared} attempt={attempt} />{feedback.map(source => <FeedbackReview key={source.id} {...shared} source={source} attempt={attempt} onQuote={setQuote} />)}
          {quote && <section className="card"><strong>Selected exact feedback passage</strong><Text>{quote.quote}</Text><small>{quote.sourceId} / version {quote.version} / {quote.start}–{quote.end}</small></section>}
          <ConcernEditor key={"new-" + attempt.id} {...shared} attempt={attempt} selectedQuote={quote} onCreated={() => setQuote(null)} />
          <h3>Concern matrix</h3>{concerns.map(concern => <ConcernEditor key={concern.id} {...shared} attempt={attempt} concern={concern} selectedQuote={quote} />)}
          <h3>Shared action plan</h3><details className="card"><summary>Action agenda — one entry per shared action</summary>{currentView?.agenda.filter(a => a.attemptId === attempt.id).map(a => <p key={a.id}><a href={`#resubmission-action-${a.id}`}>{a.description || a.id}</a> · {a.owner || "Owner unassigned"} · {a.due.kind === "unknown" ? "Date unknown" : a.due.kind === "date" ? `${a.due.date} (cutoff unknown)` : `${a.due.at} (${a.due.zone})`} · {a.status}</p>)}</details><ActionEditor key={"new-action-" + attempt.id} {...shared} attempt={attempt} />{actions.map(action => <ActionEditor key={action.id} {...shared} attempt={attempt} action={action} />)}<ConflictPlanner key={"conflict-" + attempt.id} {...shared} attempt={attempt} />
        </fieldset>
      </>}
    </div>
    <div hidden={step !== "review"}>{attempt ? <><ComparisonView {...shared} attempt={attempt} /><fieldset disabled={attempt.state === "archived"} style={{ border: 0, padding: 0, minWidth: 0 }}><SponsorContext key={"context-" + attempt.id} {...shared} attempt={attempt} /><ResponseDocument key={"document-" + attempt.id} {...shared} attempt={attempt} /></fieldset><PacketReview key={"packet-" + attempt.id} {...shared} attempt={attempt} /></> : <p>Create an attempt before comparison and export.</p>}</div>
  </section></DirtyContext.Provider>;
}

export default ResubmissionsPanel;
