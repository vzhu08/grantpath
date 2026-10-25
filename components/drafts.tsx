"use client";
import { useRef, useState } from "react";
import { cite, latest } from "../lib/evidence";
import { wordCount, readiness, type Issue } from "../lib/readiness";
import {
  type Application,
  type DraftSection,
  type Citation,
  type Proposal,
} from "../lib/schema";
import {
  Field,
  Badge,
  CitationView,
  SourceText,
  numberOrNull,
  useEditorDirty,
  type EditorProps,
} from "./common";
function DraftEditor(
  props: EditorProps & { app: Application; section: DraftSection },
) {
  const [markDirty] = useEditorDirty(
    "draft-" + props.app.id + "-" + props.section.key,
  );
  const revision = props.section.revisions.at(-1),
    sources = props.state.sources.filter(
      (s) => s.projectId === props.app.projectId,
    );
  const [text, setText] = useState(revision?.text ?? ""),
    [label, setLabel] = useState(props.section.label),
    [limit, setLimit] = useState<number | null>(props.section.wordLimit),
    [selected, setSelected] = useState<string[]>(
      revision?.selectedSources.map((s) => s.sourceId) ??
        sources.map((s) => s.id),
    ),
    [citations, setCitations] = useState<Citation[]>(revision?.citations ?? []),
    [quote, setQuote] = useState(""),
    [quoteSource, setQuoteSource] = useState(sources[0]?.id ?? ""),
    [mode, setMode] = useState<"fixture" | "live">("live"),
    [consent, setConsent] = useState(false),
    [generating, setGenerating] = useState(false),
    [error, setError] = useState(""),
    [preview, setPreview] = useState<{
      proposal: Proposal;
      token: string;
      mode: string;
    } | null>(null),
    [edited, setEdited] = useState(false);
  const controller = useRef<AbortController | null>(null);
  const mark = () => {
    setEdited(true);
    markDirty(true);
  };
  async function save(token?: string) {
    const result = await props.mutate({
      type: "saveDraft",
      applicationId: props.app.id,
      sectionKey: props.section.key,
      label,
      wordLimit: limit,
      text: token ? preview!.proposal.text : text,
      sourceIds: selected,
      citations,
      proposalToken: token,
    });
    if (result) {
      const saved = result.state.applications
        .find((a) => a.id === props.app.id)!
        .sections.find((s) => s.key === props.section.key)!
        .revisions.at(-1)!;
      setText(saved.text);
      setCitations(saved.citations);
      setSelected(saved.selectedSources.map((s) => s.sourceId));
      setPreview(null);
      setEdited(false);
      markDirty(false);
    }
  }
  async function generate() {
    setError("");
    setGenerating(true);
    controller.current = new AbortController();
    try {
      const response = await fetch("/api/generate", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          applicationId: props.app.id,
          sectionKey: props.section.key,
          sourceIds: selected,
          mode,
          confirmUsage: consent,
          expectedRevision: props.state.revision,
        }),
        signal: controller.current.signal,
      });
      const result = await response.json();
      if (!response.ok)
        throw new Error(result.error?.message ?? "Generation failed.");
      setPreview(result);
    } catch (e) {
      setError(
        (e as Error).name === "AbortError"
          ? "Generation cancelled. Your text is preserved."
          : (e as Error).message,
      );
    } finally {
      setGenerating(false);
      controller.current = null;
    }
  }
  function addQuote() {
    try {
      const source = sources.find((s) => s.id === quoteSource);
      if (!source) throw new Error("Choose an evidence source.");
      const citation = cite(source, quote);
      setCitations([...citations, citation]);
      if (!selected.includes(source.id)) setSelected([...selected, source.id]);
      setQuote("");
      mark();
      setError("");
    } catch (e) {
      setError((e as Error).message);
    }
  }
  return (
    <article className="card draft-editor">
      <div className="row spread">
        <p className="eyebrow">{props.section.key.toUpperCase()}</p>
        <Badge tone={edited ? "amber" : "neutral"}>
          {edited
            ? "Unsaved edits"
            : revision
              ? "Saved revision"
              : "Empty section"}
        </Badge>
      </div>
      <div className="form-grid">
        <Field label="Section label">
          <input
            value={label}
            onChange={(e) => {
              setLabel(e.target.value);
              mark();
            }}
          />
        </Field>
        <Field label="Declared word limit">
          <input
            type="number"
            min="1"
            value={limit ?? ""}
            onChange={(e) => {
              setLimit(numberOrNull(e.target.value));
              mark();
            }}
          />
        </Field>
      </div>
      <Field label={`${props.section.label} draft`}>
        <textarea
          className="draft-text"
          rows={10}
          value={text}
          onChange={(e) => {
            setText(e.target.value);
            mark();
          }}
          maxLength={20_000}
        />
      </Field>
      <div className="row spread">
        <span className={limit && wordCount(text) > limit ? "error" : "muted"}>
          {wordCount(text)} words{limit ? ` / ${limit}` : ""} ·{" "}
          {text.length.toLocaleString()} / 20,000 characters
        </span>
        <button
          className="primary"
          disabled={props.busy || generating}
          onClick={() => void save()}
        >
          Save manual revision
        </button>
      </div>
      <p className="review-notice">
        Researcher review required. Quotations show provenance; they do not
        certify the claims.
      </p>
      <details>
        <summary>Evidence selection and exact quotations</summary>
        {sources.length === 0 && (
          <p className="muted">
            Add project evidence to support this section. Manual editing remains
            available.
          </p>
        )}
        {sources.map((source) => (
          <div className="evidence-choice" key={source.id}>
            <label className="check">
              <input
                type="checkbox"
                checked={selected.includes(source.id)}
                onChange={(e) => {
                  setSelected(
                    e.target.checked
                      ? [...selected, source.id]
                      : selected.filter((id) => id !== source.id),
                  );
                  markDirty(true);
                }}
              />
              {source.title} · v{latest(source).version}
            </label>
            <SourceText source={source} />
          </div>
        ))}
        <Field label="Quote source">
          <select
            value={quoteSource}
            onChange={(e) => setQuoteSource(e.target.value)}
          >
            <option value="">Choose source</option>
            {sources.map((s) => (
              <option key={s.id} value={s.id}>
                {s.title}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Add exact supporting quotation">
          <textarea
            rows={2}
            value={quote}
            onChange={(e) => setQuote(e.target.value)}
          />
        </Field>
        <button onClick={addQuote} disabled={!quote}>
          Add quotation to this draft
        </button>
      </details>
      {citations.map((citation, i) => (
        <div key={i}>
          <CitationView citation={citation} state={props.state} />
          <button
            className="text-button"
            onClick={() => {
              setCitations(citations.filter((_, index) => i !== index));
              mark();
            }}
          >
            Remove quotation
          </button>
        </div>
      ))}
      <details className="generate-box">
        <summary>Optional AI draft proposal</summary>
        <p className="muted">
          Generate one proposal, inspect its text and support, then explicitly
          accept it. Regeneration preserves the editor and all saved revisions.
          No-key operation uses manual editing.
        </p>
        <Field label="Generation mode">
          <select
            value={mode}
            onChange={(e) => setMode(e.target.value as typeof mode)}
          >
            <option value="live">Live provider (configuration required)</option>
            <option value="fixture" disabled={props.app.provenance !== "demo"}>
              Demo / synthetic fixture only
            </option>
          </select>
        </Field>
        {mode === "live" && (
          <label className="check">
            <input
              type="checkbox"
              checked={consent}
              onChange={(e) => setConsent(e.target.checked)}
            />
            Use the configured provider for this action; selected content will
            be sent and usage may be charged.
          </label>
        )}
        <div className="row actions">
          <button
            disabled={generating || props.busy || (mode === "live" && !consent)}
            onClick={() => void generate()}
          >
            {generating
              ? "Generating proposal…"
              : preview
                ? "Regenerate proposal"
                : "Generate proposal"}
          </button>
          {generating && (
            <button onClick={() => controller.current?.abort()}>
              Cancel generation
            </button>
          )}
        </div>
      </details>
      {error && (
        <p className="error" role="alert">
          {error}
        </p>
      )}
      {preview && (
        <section className="proposal">
          <Badge tone="amber">
            {preview.mode === "fixture"
              ? "DEMO / FIXTURE"
              : "Live model proposal"}{" "}
            · Researcher review required
          </Badge>
          <pre>{preview.proposal.text}</pre>
          {preview.proposal.citations.map((c, i) => (
            <CitationView key={i} citation={c} state={props.state} />
          ))}
          <ul>
            {preview.proposal.missingInputs.map((missing, i) => (
              <li key={i}>Missing input: {missing}</li>
            ))}
          </ul>
          {edited && (
            <p className="muted">
              Save your manual changes before accepting a generated proposal.
              The preview does not overwrite the editor.
            </p>
          )}
          <div className="row actions">
            <button
              className="primary"
              disabled={props.busy || edited}
              onClick={() => void save(preview.token)}
            >
              Accept proposal as new saved revision
            </button>
            <button onClick={() => setPreview(null)}>Discard proposal</button>
          </div>
        </section>
      )}
      {props.section.revisions.length > 0 && (
        <details>
          <summary>
            Saved history · {props.section.revisions.length} revisions
          </summary>
          {[...props.section.revisions].reverse().map((saved) => (
            <details key={saved.id}>
              <summary>
                {saved.createdAt} · {saved.mode} · project r
                {saved.projectRevision} / call r{saved.callRevision}
              </summary>
              <pre>{saved.text}</pre>
              {saved.citations.map((c, i) => (
                <CitationView key={i} citation={c} state={props.state} />
              ))}
              <button
                onClick={() => {
                  if (
                    edited &&
                    !window.confirm(
                      "Replace the unsaved editor with this retained revision?",
                    )
                  )
                    return;
                  setText(saved.text);
                  setCitations(saved.citations);
                  setSelected(saved.selectedSources.map((s) => s.sourceId));
                  mark();
                }}
              >
                Restore this text into editor
              </button>
            </details>
          ))}
        </details>
      )}
    </article>
  );
}
function IssueRow({
  issue,
  ...props
}: EditorProps & { app: Application; issue: Issue }) {
  const [reason, setReason] = useState("");
  return (
    <article className={`issue ${issue.waived ? "waived" : issue.severity}`}>
      <div className="row">
        <Badge
          tone={
            issue.waived
              ? "neutral"
              : issue.severity === "blocker"
                ? "red"
                : "amber"
          }
        >
          {issue.waived ? "Waived" : issue.severity}
        </Badge>
        <strong>{issue.location}</strong>
      </div>
      <p>{issue.message}</p>
      <p className="muted">Fix: {issue.fix}</p>
      {issue.waived ? (
        <p>Researcher waiver: {issue.waived}</p>
      ) : (
        <details>
          <summary>Record an explicit waiver</summary>
          <Field label="Reason for waiver">
            <textarea
              rows={2}
              minLength={5}
              maxLength={1000}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
            />
          </Field>
          <button
            disabled={props.busy || reason.trim().length < 5}
            onClick={() =>
              void props.mutate({
                type: "waiveIssue",
                applicationId: props.app.id,
                issueId: issue.id,
                reason,
              })
            }
          >
            Waive with reason
          </button>
        </details>
      )}
    </article>
  );
}
export function Drafts(props: EditorProps & { app: Application }) {
  const review = readiness(props.state, props.app);
  return (
    <div className="form-stack">
      <div className="section-heading">
        <div>
          <p className="eyebrow">04 / DRAFT & REVIEW</p>
          <h2>Three sections. Traceable support.</h2>
          <p className="muted">
            A starter proposal, with editable labels and limits. Save revisions
            before exporting.
          </p>
        </div>
        <div className="row">
          <Badge tone={review.blockers ? "red" : "green"}>
            {review.blockers} blockers
          </Badge>
          <Badge tone="amber">{review.warnings} warnings</Badge>
        </div>
      </div>
      {props.app.sections.map((section) => (
        <DraftEditor
          {...props}
          section={section}
          key={props.app.id + "-" + section.key}
        />
      ))}
      <section className="card">
        <h2>Application readiness</h2>
        <p className="muted">
          Deterministic checks of known inputs. Rules {review.rulesVersion},
          application revision {review.applicationRevision}. This is not peer
          review or sponsor acceptance. Waivers expire when the finding or saved
          inputs change.
        </p>
        {review.issues.length === 0 && (
          <div className="empty">
            No modeled readiness issues. Review all other sponsor conditions
            before using this packet.
          </div>
        )}
        {review.issues.map((issue) => (
          <IssueRow
            {...props}
            issue={issue}
            key={issue.id + issue.fingerprint}
          />
        ))}
      </section>
    </div>
  );
}
