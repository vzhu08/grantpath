"use client";
import { useState } from "react";
import { matchOpportunities } from "../lib/calls";
import { latest } from "../lib/evidence";
import { deadlineLabel } from "../lib/calendar";
import {
  CallFieldsSchema,
  type Opportunity,
  type Project,
} from "../lib/schema";
import {
  Field,
  Badge,
  SourceText,
  CitationView,
  DeadlineEditor,
  list,
  numberOrNull,
  validateDeadline,
  useEditorDirty,
  type EditorProps,
} from "./common";

export function CallIntake(
  props: EditorProps & { call?: Opportunity; onSaved: (id: string) => void },
) {
  const [markDirty] = useEditorDirty(
    "call-intake-" + (props.call?.id ?? "new"),
  );
  const source = props.call
    ? props.state.sources.find((s) => s.id === props.call!.sourceId)
    : null;
  const [title, setTitle] = useState(props.call?.title ?? ""),
    [funder, setFunder] = useState(props.call?.funder ?? ""),
    [url, setUrl] = useState(props.call?.url ?? ""),
    [text, setText] = useState(source ? latest(source).text : ""),
    [error, setError] = useState("");
  const change = () => markDirty(true);
  async function save(e: React.FormEvent) {
    e.preventDefault();
    if (text.length > 20_000) {
      setError("Reduce the call text to 20,000 characters.");
      return;
    }
    const out = await props.mutate({
      type: "saveCall",
      id: props.call?.id,
      title,
      funder,
      url,
      text,
    });
    if (out?.selectedId) {
      markDirty(false);
      props.onSaved(out.selectedId);
      if (!props.call) {
        setTitle("");
        setFunder("");
        setUrl("");
        setText("");
      }
    }
  }
  return (
    <form onSubmit={save} className="form-stack">
      <div className="form-grid">
        <Field label="Call title">
          <input
            required
            value={title}
            onChange={(e) => {
              setTitle(e.target.value);
              change();
            }}
          />
        </Field>
        <Field label="Funder">
          <input
            required
            value={funder}
            onChange={(e) => {
              setFunder(e.target.value);
              change();
            }}
          />
        </Field>
      </div>
      <Field
        label="Official URL (optional)"
        hint="The app saves this link. It does not fetch or verify it."
      >
        <input
          type="url"
          value={url}
          onChange={(e) => {
            setUrl(e.target.value);
            change();
          }}
        />
      </Field>
      <Field label="Funding call text">
        <textarea
          required
          rows={9}
          value={text}
          onChange={(e) => {
            setText(e.target.value);
            change();
          }}
          placeholder={
            "Applicant type: University\nCareer stage: Early career\nCountry: United States\nTopics: water, sensors\nFunding minimum: 20000\nFunding maximum: 60000\nCurrency: USD\nDeadline: 2027-02-15\nSection: Project summary | 250 words\nDocument: Applicant CV\nRequirement: Confirm site access\nOptional: Community engagement note"
          }
        />
      </Field>
      <p className="muted">
        {text.length.toLocaleString()} / 20,000 characters. Labeled lines
        support extraction. Prose remains available for exact-quote manual
        requirements. Proposed fields always need review.
      </p>
      {error && (
        <p role="alert" className="error">
          {error}
        </p>
      )}
      <button className="primary" disabled={props.busy}>
        {props.call
          ? "Save call / invalidate prior review"
          : "Add funding call"}
      </button>
    </form>
  );
}
export function CallReview(props: EditorProps & { call: Opportunity }) {
  const [markDirty] = useEditorDirty("call-review-" + props.call.id);
  const [fields, setFields] = useState(CallFieldsSchema.parse(props.call)),
    [error, setError] = useState("");
  const source = props.state.sources.find((s) => s.id === props.call.sourceId)!;
  function edit(key: string, value: unknown) {
    setFields({ ...fields, [key]: value });
    markDirty(true);
  }
  async function save(e: React.FormEvent) {
    e.preventDefault();
    const error = validateDeadline(fields.deadline);
    if (error) {
      setError(error);
      return;
    }
    const parsed = CallFieldsSchema.safeParse(fields);
    if (!parsed.success) {
      setError(parsed.error.issues.map((i) => i.message).join(" "));
      return;
    }
    setError("");
    const saved = await props.mutate({
      type: "reviewCall",
      id: props.call.id,
      fields: parsed.data,
    });
    if (saved) markDirty(false);
  }
  return (
    <section className="card">
      <div className="section-heading">
        <div>
          <p className="eyebrow">INSPECT & CONFIRM</p>
          <h2>{props.call.title}</h2>
        </div>
        <Badge tone={props.call.provenance === "demo" ? "amber" : "neutral"}>
          {props.call.provenance === "demo"
            ? "Fictional demo call"
            : "Researcher-added call"}
        </Badge>
      </div>
      <p className="muted">
        Imported {props.call.importedAt}. Researcher last checked:{" "}
        {props.call.lastCheckedAt ?? "not recorded"}. Source checks are user
        records, not independent verification.
      </p>
      <SourceText source={source} />
      <form onSubmit={save} className="form-stack">
        <h3>Modeled eligibility</h3>
        <p className="muted">
          Only confirmed criteria determine fit. Match values are explicit
          alternatives separated by |. Resolve conflicting lines by keeping one
          reviewed rule per field. Unsupported edits stay user-entered.
        </p>
        {fields.criteria.length === 0 && (
          <div className="empty">
            No criteria were extracted. Add explicit source-supported criteria.
            An empty assessment cannot qualify as a potential fit.
          </div>
        )}
        {fields.criteria.map((criterion, index) => (
          <div className="criterion" key={index}>
            <div className="form-grid">
              <Field label="Eligibility field">
                <select
                  value={criterion.field}
                  onChange={(e) =>
                    edit(
                      "criteria",
                      fields.criteria.map((c, i) =>
                        i === index
                          ? {
                              ...c,
                              field: e.target.value,
                              manual: true,
                              confirmed: false,
                            }
                          : c,
                      ),
                    )
                  }
                >
                  <option value="applicantType">Applicant type</option>
                  <option value="careerStage">Career stage</option>
                  <option value="country">Country / region</option>
                  <option value="institution">Institution</option>
                </select>
              </Field>
              <Field label="Accepted values (use | for alternatives)">
                <input
                  required
                  value={criterion.values.join(" | ")}
                  onChange={(e) =>
                    edit(
                      "criteria",
                      fields.criteria.map((c, i) =>
                        i === index
                          ? {
                              ...c,
                              values: e.target.value
                                .split("|")
                                .map((x) => x.trimStart()),
                              manual: true,
                              conflict: false,
                              confirmed: false,
                            }
                          : c,
                      ),
                    )
                  }
                />
              </Field>
            </div>
            {criterion.citation && (
              <CitationView citation={criterion.citation} state={props.state} />
            )}
            <div className="row spread">
              <label className="check">
                <input
                  type="checkbox"
                  checked={criterion.confirmed}
                  onChange={(e) =>
                    edit(
                      "criteria",
                      fields.criteria.map((c, i) =>
                        i === index
                          ? {
                              ...c,
                              confirmed: e.target.checked,
                              conflict: e.target.checked ? false : c.conflict,
                              manual: c.manual || c.conflict,
                            }
                          : c,
                      ),
                    )
                  }
                />
                I reviewed this eligibility rule
                {criterion.manual ? " (user-entered override)" : ""}
              </label>
              <button
                type="button"
                className="text-button"
                onClick={() =>
                  edit(
                    "criteria",
                    fields.criteria.filter((_, i) => i !== index),
                  )
                }
              >
                Remove rule
              </button>
            </div>
            {criterion.conflict && (
              <p className="error">
                Conflicting source values. Resolve before confirming.
              </p>
            )}
          </div>
        ))}
        <button
          type="button"
          onClick={() =>
            edit("criteria", [
              ...fields.criteria,
              {
                field: "applicantType",
                values: [""],
                confirmed: false,
                conflict: false,
                citation: null,
                manual: true,
              },
            ])
          }
        >
          Add user-entered criterion
        </button>
        <div className="form-grid">
          <Field label="Topic tags">
            <input
              value={fields.tags.join(", ")}
              onChange={(e) =>
                edit(
                  "tags",
                  e.target.value.split(",").map((s) => s.trimStart()),
                )
              }
            />
          </Field>
          <Field label="Call currency (blank = unknown)">
            <input
              maxLength={3}
              value={fields.currency}
              onChange={(e) => edit("currency", e.target.value.toUpperCase())}
            />
          </Field>
          <Field label="Funding minimum">
            <input
              type="number"
              min="0"
              value={fields.minAmount ?? ""}
              onChange={(e) => edit("minAmount", numberOrNull(e.target.value))}
            />
          </Field>
          <Field label="Funding maximum">
            <input
              type="number"
              min="0"
              value={fields.maxAmount ?? ""}
              onChange={(e) => edit("maxAmount", numberOrNull(e.target.value))}
            />
          </Field>
        </div>
        <h3>Sponsor deadline</h3>
        <DeadlineEditor
          value={fields.deadline}
          onChange={(value) => edit("deadline", value)}
        />
        <label className="check">
          <input
            type="checkbox"
            checked={fields.reviewed}
            onChange={(e) => edit("reviewed", e.target.checked)}
          />
          I reviewed the modeled eligibility and recorded a source check. Other
          call conditions may apply.
        </label>
        {error && (
          <p className="error" role="alert">
            {error}
          </p>
        )}
        <button className="primary" disabled={props.busy}>
          Save reviewed call fields
        </button>
      </form>
      <details>
        <summary>Edit original call text / preserve source history</summary>
        <CallIntake {...props} onSaved={() => {}} />
      </details>
    </section>
  );
}
export function OpportunitiesPanel(
  props: EditorProps & {
    project: Project;
    openApplication: (id: string) => void;
  },
) {
  const [selected, setSelected] = useState<string | null>(null),
    [add, setAdd] = useState(false);
  const matches = matchOpportunities(props.project, props.state.opportunities);
  const selectedCall = props.state.opportunities.find((c) => c.id === selected);
  async function save(id: string) {
    const out = await props.mutate({
      type: "saveApplication",
      projectId: props.project.id,
      opportunityId: id,
    });
    if (out?.selectedId) props.openApplication(out.selectedId);
  }
  return (
    <div className="form-stack">
      <div className="section-heading">
        <div>
          <p className="eyebrow">02 / FIND A POSSIBLE FIT</p>
          <h2>Opportunity shortlist</h2>
          <p className="muted">
            Six fictional examples plus your calls. Eligibility is separate from
            topic and funding preferences.
          </p>
        </div>
        <button className="primary" onClick={() => setAdd(!add)}>
          + Add a call
        </button>
      </div>
      {add && (
        <section className="card">
          <h3>Paste a funding call</h3>
          <CallIntake
            {...props}
            onSaved={(id) => {
              setAdd(false);
              setSelected(id);
            }}
          />
        </section>
      )}
      <div className="call-list">
        {matches.map((match, index) => {
          const call = match.opportunity;
          const existing = props.state.applications.find(
            (a) =>
              a.projectId === props.project.id && a.opportunityId === call.id,
          );
          return (
            <article className="card call-card" key={call.id}>
              <div className="call-number">
                {String(index + 1).padStart(2, "0")}
              </div>
              <div className="call-content">
                <div className="row spread">
                  <span className="eyebrow">{call.funder}</span>
                  <Badge
                    tone={
                      match.status === "Potential fit"
                        ? "green"
                        : match.status === "Known mismatch" ||
                            match.status === "Closed"
                          ? "red"
                          : "amber"
                    }
                  >
                    {match.status}
                  </Badge>
                </div>
                <h3>{call.title}</h3>
                <div className="row">
                  <Badge
                    tone={call.provenance === "demo" ? "amber" : "neutral"}
                  >
                    {call.provenance === "demo"
                      ? "FICTIONAL DEMO"
                      : "User-added"}
                  </Badge>
                  <span className="muted">
                    {call.minAmount ?? "?"}–{call.maxAmount ?? "?"}{" "}
                    {call.currency || "currency unknown"}
                  </span>
                </div>
                <p className="deadline-line">{deadlineLabel(call.deadline)}</p>
                <details>
                  <summary>Why this status?</summary>
                  <ul>
                    {[
                      ...match.reasons,
                      ...match.unresolved,
                      ...match.preferences,
                    ].map((reason, i) => (
                      <li key={i}>{reason}</li>
                    ))}
                  </ul>
                  {call.criteria.flatMap((c, i) =>
                    c.citation
                      ? [
                          <CitationView
                            key={i}
                            citation={c.citation}
                            state={props.state}
                          />,
                        ]
                      : [],
                  )}
                  <p className="muted">
                    Imported {call.importedAt} · Last checked{" "}
                    {call.lastCheckedAt ?? "not recorded"}. Relevance rank is a
                    preference ordering, never an award probability.
                  </p>
                </details>
                <div className="row actions">
                  <button
                    onClick={() =>
                      setSelected(selected === call.id ? null : call.id)
                    }
                  >
                    Inspect / confirm call
                  </button>
                  <button
                    className="primary"
                    disabled={props.busy}
                    onClick={() => void save(call.id)}
                  >
                    {existing ? "Open application" : "Save to application"} →
                  </button>
                </div>
              </div>
            </article>
          );
        })}
      </div>
      {!matches.some((m) => m.status === "Potential fit") && (
        <div className="empty">
          No confirmed potential fits. Review unresolved criteria or add a call;
          eligibility has not been relaxed.
        </div>
      )}
      {selectedCall && (
        <CallReview {...props} call={selectedCall} key={selectedCall.id} />
      )}
    </div>
  );
}
