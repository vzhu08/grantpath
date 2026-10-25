"use client";
import { useRef, useState } from "react";
import { Badge, Field, SourceText, CitationView, useEditorDirty } from "../common";
import { formatMoneyFact } from "../../lib/awards/money-facts";
import { blankIntake, intakeTerms, suggestAwardFields, type IntakeFields } from "../../lib/awards/intake";
import { cite } from "../../lib/evidence";
import type { AwardCommand, AwardMutation } from "../../lib/awards/commands";
import type { AwardPanelProps } from "./types";
import { AwardProgressEditor } from "./progress-editor";
import { AnnualWorksheetEditor } from "./worksheet-editor";
import { AwardItemsEditor } from "./items-editor";

export function AwardPanel(props: AwardPanelProps) {
  const { state, awards, applicationId, busy } = props;
  const application = state.applications.find(a => a.id === applicationId);
  const award = awards.records.find(a => a.applicationId === applicationId);
  const current = awards.termsVersions.find(t => t.id === award?.currentConfirmedTermsVersionId);
  const [tab, setTab] = useState("notice"), [error, setError] = useState(""), [message, setMessage] = useState("");
  const [retryMutation, setRetryMutation] = useState<AwardMutation | null>(null);
  const recovery = useRef<{ resolve: (value: { resultIds: string[] } | null) => void } | null>(null);
  const attempts = useRef<{ serialized: string; operationId: string; expectedRevision: number } | null>(null);
  async function send(command: AwardCommand) {
    if (recovery.current) { setError("Resolve the pending save with an exact retry, or keep edits and reconcile as a new save."); return null; }
    const serialized = JSON.stringify(command);
    if (attempts.current?.serialized !== serialized) attempts.current = { serialized, operationId: `award-op-${crypto.randomUUID()}`, expectedRevision: state.revision };
    const waitForRecovery = () => new Promise<{ resultIds: string[] } | null>(resolve => { recovery.current = { resolve }; });
    try {
      const mutation = { operationId: attempts.current.operationId, expectedRevision: attempts.current.expectedRevision, command };
      setRetryMutation(mutation);
      const result = await props.mutateAward(mutation);
      if (!result) { setError("Save result is unresolved. Your edits remain here. An exact retry recovers the original operation before another save."); return await waitForRecovery(); }
      attempts.current = null; setRetryMutation(null); setError(""); setMessage("Saved locally. No sponsor submission or certification."); return result;
    } catch (e) { setError((e as Error).message); return await waitForRecovery(); }
  }
  if (!application) return <p>Select a saved application for Award &amp; progress.</p>;
  return <section aria-label="Award and progress">
    <h2>Award &amp; progress</h2>
    <p>Track approved terms and what actually happened, then prepare an honest NSF annual narrative worksheet.</p>
    <p className="muted">Local preparation only. Proposal promises are separate from actual performance. {application.provenance === "demo" ? "Synthetic demo inputs." : "Researcher-provided inputs; not independently verified."}</p>
    {award && <p><Badge>{award.localState === "archived" ? "Archived locally" : "Confirmed locally"}</Badge> <Badge>Sponsor status: {current?.payload.sponsorLifecycle.value ?? "unknown"}</Badge></p>}
    <nav className="tabs" aria-label="Award sections">{[["notice", "Notice & amendments"], ["items", "Obligations & milestones"], ["progress", "Actual progress"], ["report", "Annual worksheet"]].map(([key, label]) => <button key={key} type="button" aria-pressed={tab === key} onClick={() => setTab(key!)}>{label}</button>)}</nav>
    {error && <div role="alert" className="error"><p>{error}</p>{retryMutation && <><button type="button" disabled={busy} onClick={() => { void props.mutateAward(retryMutation).then(result => { if (result) { const pending = recovery.current; recovery.current = null; pending?.resolve(result); setRetryMutation(null); attempts.current = null; setError(""); setMessage("Recovered the original saved operation and record IDs. Editor text is retained."); } }).catch(e => setError((e as Error).message)); }}>Retry exact last operation · recover original result</button><button type="button" onClick={() => { const pending = recovery.current; recovery.current = null; pending?.resolve(null); setRetryMutation(null); attempts.current = null; setError("Edits retained. Reload saved data and reconcile the conflicting record before saving again."); }}>Keep edits and reconcile as a new save</button></>}{props.refresh && <button type="button" onClick={() => void props.refresh!()}>Reload saved data · keep editor text</button>}</div>}
    {message && <p role="status">{message}</p>}
    <div hidden={tab !== "notice"}>
      {current && <><h3>Current approved terms</h3><p>{current.payload.identity.sponsorAwardNumber} · {current.payload.identity.recipientName}</p>
        <p>Effective {current.payload.effectiveDate ?? "unknown"} · award period {current.payload.awardPeriod ? `${current.payload.awardPeriod.start} to ${current.payload.awardPeriod.end}` : "unknown"}</p>
        <h4>Approved money facts</h4>{current.payload.fundingFacts.length ? current.payload.fundingFacts.map(f => <p key={f.id}>{f.basis.replaceAll("_", " ")}: {formatMoneyFact(f)}</p>) : <p>Unknown. No amount is inferred.</p>}
        <h4>Original proposed context</h4>{awards.originSnapshots.find(o => o.id === award?.originContext.id)?.payload.proposedMoneyFacts.map(f => <p key={f.id}>Requested: {formatMoneyFact(f)}</p>)}
        <p className="muted">Requested context stays frozen. Approved facts are not a balance or permission to spend.</p>
        {current.payload.identity.evidence.map((c, i) => <CitationView key={i} citation={c} state={state} />)}
        <details><summary>Immutable terms and amendment history</summary>{awards.termsVersions.filter(t => t.awardId === award?.id).map(t => <p key={t.id}>Version {t.ordinal} · {t.payload.changeKind.replaceAll("_", " ")} · {t.payload.sponsorActionId} · {t.id === current.id ? "Current terms" : "Historical or pending"} · confirmed locally by {t.confirmedBy}</p>)}</details>
      </>}
      {award?.localState !== "archived" && <AwardNoticeEditor key={award?.id ?? `intake-${applicationId}`} {...props} send={send} />}
      {award?.localState === "recorded" && <button disabled={busy} type="button" onClick={() => void send({ type: "archiveAward", awardId: award.id, expectedAwardRevision: award.revision, actor: "Local preparer", reason: "Hide ordinary editing; preserve all award/report history" })}>Archive local award record</button>}
    </div>
    {award && award.localState === "recorded" ? <>
      <div hidden={tab !== "items"}><AwardItemsEditor {...props} award={award} send={send} /></div>
      <div hidden={tab !== "progress"}><AwardProgressEditor {...props} award={award} send={send} /></div>
      <div hidden={tab !== "report"}><AnnualWorksheetEditor {...props} award={award} send={send} /></div>
    </> : award?.localState === "archived" ? <div><h3>Preserved historical report downloads</h3>{awards.reportSnapshots.filter(s => s.awardId === award.id).map(s => <p key={s.id}>Reviewed draft {s.id} · {s.payload.reviewedAt} · <a href={`/api/awards/reports/${encodeURIComponent(s.id)}/export?format=md`}>Narrative Markdown</a>{" · "}<a href={`/api/awards/reports/${encodeURIComponent(s.id)}/export?format=json`}>Internal evidence JSON</a></p>)}</div> : tab !== "notice" && <p>Confirm an in-force notice to begin. Unconfirmed intake creates no approved money or agenda items.</p>}
  </section>;
}
export type AwardSend = (command: AwardCommand) => Promise<{ resultIds: string[] } | null>;

function AwardNoticeEditor({ state, awards, applicationId, busy, send }: AwardPanelProps & { send: AwardSend }) {
  const award = awards.records.find(a => a.applicationId === applicationId), application = state.applications.find(a => a.id === applicationId)!;
  const project = state.projects.find(p => p.id === application.projectId)!;
  const [baseTermsId, setBaseTermsId] = useState(award?.currentConfirmedTermsVersionId ?? null);
  const [originRevisions, setOriginRevisions] = useState({ application: application.revision, project: project.revision });
  const base = awards.termsVersions.find(t => t.id === baseTermsId);
  const sources = state.sources.filter(s => s.projectId === project.id && s.type !== "call");
  const [sourceId, setSourceId] = useState(""), [sourceVersion, setSourceVersion] = useState<number | undefined>(), [quote, setQuote] = useState(""), [fields, setFields] = useState<IntakeFields>(blankIntake),
    [actor, setActor] = useState(""), [reason, setReason] = useState(""), [confirmed, setConfirmed] = useState(false), [error, setError] = useState(""),
    [kind, setKind] = useState<"numbered_amendment" | "documented_administrative_change" | "transcription_correction">("numbered_amendment"),
    [proposalSourceId, setProposalSourceId] = useState(""), [proposalQuote, setProposalQuote] = useState(""), [requested, setRequested] = useState(""), [historicalReason, setHistoricalReason] = useState(""), [supersedesCandidateId, setSupersedesCandidateId] = useState<string | null>(null);
  const [markDirty] = useEditorDirty(`award-notice-${applicationId}`);
  const source = sources.find(s => s.id === sourceId);
  const change = <K extends keyof IntakeFields>(key: K, value: IntakeFields[K]) => { setFields(f => ({ ...f, [key]: value })); markDirty(true); };
  const labels: [keyof IntakeFields, string, string][] = [["number", "Sponsor award number", "text"], ["recipient", "Recipient", "text"],
    ["sponsorActionId", "Stable action label (keep it for corrected interpretations)", "text"], ["sponsorIdentifier", "Sponsor amendment/notice identifier, if supplied", "text"],
    ["effective", "Effective date · unknown/future stays in intake", "date"], ["issue", "Issue date, if known", "date"],
    ["start", "Award period start", "date"], ["end", "Award period end", "date"], ["budgetStart", "Reporting budget period start", "date"], ["budgetEnd", "Reporting budget period end", "date"],
    ["currentAction", "Amount of this action (decimal text; blank stays absent)", "text"], ["cumulative", "Explicit cumulative obligation (no calculation)", "text"], ["anticipated", "Explicit anticipated total (no inference)", "text"]];
  async function save() {
    try {
      if (!source || !confirmed) throw new Error("Select exact evidence and confirm transcription/applicability.");
      const at = new Date().toISOString(), payload = intakeTerms(fields, source, quote, actor, at, base, base ? kind : "initial", sourceVersion);
      if (historicalReason.trim()) payload.historicalSourceReviews = payload.sourceRefs.flatMap(ref => {
        const latest = state.sources.find(s => s.id === ref.sourceId)?.versions.at(-1)?.version;
        return latest && latest !== ref.version ? [{ sourceId: ref.sourceId, version: ref.version, latestVersion: latest, reason: historicalReason, actor }] : [];
      });
      if (base && award) {
        const result = await send({ type: "saveAwardChangeCandidate", awardId: award.id, expectedAwardRevision: award.revision, expectedHeadId: base.id,
          payload, supersedesCandidateId, actor, reason });
        if (result) { markDirty(false); setError(""); }
      } else {
        const proposedSource = sources.find(s => s.id === proposalSourceId);
        const proposedMoneyFacts = requested && proposedSource ? [{ id: `proposed-${crypto.randomUUID()}`, basis: "proposal_requested" as const,
          value: { state: "known" as const, currency: "USD" as const, scale: 2 as const, minorUnits: parseRequested(requested) },
          evidence: [cite(proposedSource, proposalQuote)], periodId: null, confirmedBy: actor, confirmedAt: at }] : [];
        const result = await send({ type: "confirmInitialAward", applicationId, expectedApplicationRevision: originRevisions.application, expectedProjectRevision: originRevisions.project,
          payload, originSelection: { draftIds: application.sections.flatMap(s => s.revisions.at(-1) ? [s.revisions.at(-1)!.id] : []), proposedMoneyFacts, packetId: null, submissionEvidence: { state: "unknown" } },
          selectInitialCurrent: true, transcriptionConfirmed: true, actor, reason });
        if (result) { markDirty(false); setError(""); }
      }
    } catch (e) { setError((e as Error).message); }
  }
  return <div className="card"><h3>{award ? "Propose an amendment or correction" : "Record a source-backed award"}</h3>
    {award && baseTermsId !== award.currentConfirmedTermsVersionId && <p role="alert" className="error">Current terms changed while this editor was open. Edits are retained. <button type="button" onClick={() => { setBaseTermsId(award.currentConfirmedTermsVersionId); setConfirmed(false); markDirty(true); }}>Reconcile this candidate against current terms · review again</button></p>}
    {!award && (originRevisions.application !== application.revision || originRevisions.project !== project.revision) && <p role="alert" className="error">Saved proposal context changed. <button type="button" onClick={() => { setOriginRevisions({ application: application.revision, project: project.revision }); setConfirmed(false); markDirty(true); }}>Review current saved proposal context · retain intake edits</button></p>}
    {award && <p>Stable identity: {base?.payload.identity.sponsorAwardNumber} · {base?.payload.identity.recipientName}. Blank cumulative/anticipated fields explicitly carry the prior cited facts. Amount of this action starts blank and needs the new action’s own supporting excerpt.</p>}
    <p>Paste notice text in Project &amp; evidence, then select it here. Review exact text beside every interpreted field. Missing values stay unresolved.</p>
    <Field label="Notice/change text source"><select value={sourceId} onChange={e => { setSourceId(e.target.value); setSourceVersion(sources.find(s => s.id === e.target.value)?.versions.at(-1)?.version); markDirty(true); }}><option value="">Select saved text</option>{sources.map(s => <option key={s.id} value={s.id}>{s.title}</option>)}</select></Field>
    {source && <><SourceText key={`${source.id}-${sourceVersion}`} source={source} initialVersion={sourceVersion} /><p>Intake pins source v{sourceVersion}. {source.versions.at(-1)?.version !== sourceVersion && "A newer version exists; review it explicitly."}</p><button type="button" onClick={() => { setSourceVersion(source.versions.at(-1)!.version); setConfirmed(false); markDirty(true); }}>Use latest source version for a new review</button><button type="button" onClick={() => { const suggestions = suggestAwardFields(source, sourceVersion); const next = { ...fields }; for (const f of suggestions.fields) if (f.status === "found" && typeof f.value === "string" && f.key in next) (next as Record<string, string | boolean>)[f.key] = f.value; setFields(next); markDirty(true); }}>Suggest labeled fields · review required</button></>}
    <Field label="If retaining an older source: reason after reviewing every newer supplied version"><input value={historicalReason} maxLength={500} onChange={e => { setHistoricalReason(e.target.value); markDirty(true); }} /></Field>
    <Field label="Exact supporting excerpt from normalized source"><textarea value={quote} maxLength={20000} onChange={e => { setQuote(e.target.value); markDirty(true); }} rows={5} /></Field>
    {award && <Field label="Change type"><select value={kind} onChange={e => { setKind(e.target.value as typeof kind); markDirty(true); }}><option value="numbered_amendment">Numbered amendment</option><option value="documented_administrative_change">Documented administrative change</option><option value="transcription_correction">Transcription correction · same real award</option></select></Field>}
    {award && <Field label="Earlier candidate being reconciled, if any"><select value={supersedesCandidateId ?? ""} onChange={e => { setSupersedesCandidateId(e.target.value || null); markDirty(true); }}><option value="">New sponsor action</option>{awards.changeCandidates.filter(c => c.awardId === award.id).map(c => <option key={c.id} value={c.id}>{c.payload.sponsorIdentifier ?? c.payload.sponsorActionId} · {c.decision} · {c.id}</option>)}</select></Field>}
    {labels.map(([key, label, type]) => <Field key={key} label={label}><input type={type} value={String(fields[key])} onChange={e => change(key, e.target.value as never)} /></Field>)}
    <Field label="Approved scope goals · one per line"><textarea value={fields.goals} maxLength={5000} onChange={e => change("goals", e.target.value)} rows={4} /></Field>
    <label><input type="checkbox" checked={fields.explicitUsd} onChange={e => change("explicitUsd", e.target.checked)} /> The source explicitly states USD and the amount basis; a dollar sign alone is insufficient.</label>
    {!award && <details><summary>Optional: freeze a separately supported proposed request</summary><p>Only use explicit proposal-request evidence. Profile funding need is not a default request.</p><Field label="Proposed budget evidence"><select value={proposalSourceId} onChange={e => { setProposalSourceId(e.target.value); markDirty(true); }}><option value="">Unknown</option>{sources.map(s => <option key={s.id} value={s.id}>{s.title}</option>)}</select></Field><Field label="Exact quote explicitly supporting requested USD"><textarea value={proposalQuote} onChange={e => { setProposalQuote(e.target.value); markDirty(true); }} /></Field><Field label="Requested USD decimal text"><input value={requested} onChange={e => { setRequested(e.target.value); markDirty(true); }} /></Field></details>}
    <Field label="Local preparer name"><input value={actor} onChange={e => { setActor(e.target.value); markDirty(true); }} maxLength={500} /></Field>
    <Field label="Review note / applicability / correction reason"><textarea value={reason} maxLength={500} onChange={e => { setReason(e.target.value); markDirty(true); }} /></Field>
    <label><input type="checkbox" checked={confirmed} onChange={e => { setConfirmed(e.target.checked); markDirty(true); }} /> I reviewed the quoted transcription and applicability. This is a local record.</label>
    {error && <p role="alert" className="error">{error}</p>}<button type="button" disabled={busy || !confirmed} onClick={() => void save()}>{award ? "Save pending change candidate" : "Confirm award record and select initial terms"}</button>
    {award && awards.changeCandidates.filter(c => c.awardId === award.id).map(c => <div className="card" key={c.id}><p>{c.payload.sponsorIdentifier ?? c.payload.absenceReason} · {c.decision} · base {c.baseTermsVersionId}</p>
      {c.decision === "proposed" && <><button type="button" disabled={busy || !actor || !reason} onClick={() => void send({ type: "reviewAwardChange", awardId: award.id, expectedAwardRevision: award.revision, expectedHeadId: award.currentConfirmedTermsVersionId, candidateId: c.id, decision: "confirmed", sameAwardConfirmed: kind === "transcription_correction" && confirmed, actor, reason })}>Confirm this interpretation locally</button><button type="button" disabled={busy || !actor || !reason} onClick={() => void send({ type: "reviewAwardChange", awardId: award.id, expectedAwardRevision: award.revision, expectedHeadId: award.currentConfirmedTermsVersionId, candidateId: c.id, decision: "rejected", sameAwardConfirmed: false, actor, reason })}>Reject candidate</button></>}
      {c.decision === "confirmed" && c.termsVersionId !== award.currentConfirmedTermsVersionId && <button type="button" disabled={busy || !actor || !reason || !confirmed} onClick={() => void send({ type: "selectCurrentAwardTerms", awardId: award.id, expectedAwardRevision: award.revision, expectedHeadId: award.currentConfirmedTermsVersionId, termsVersionId: c.termsVersionId!, applicabilityConfirmed: true, retroactivePeriodsReviewed: confirmed, actor, reason })}>Adopt as current · reviewed applicability and affected periods</button>}
    </div>)}
  </div>;
}

// Import kept browser-safe: exact decimal conversion has no server dependencies.
import { parseUsdMinorUnits } from "../../lib/awards/money-facts";
const parseRequested = (value: string) => parseUsdMinorUnits(value, "proposal_requested");
