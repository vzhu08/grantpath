"use client";
import { useEffect, useState } from "react";
import { cite } from "../lib/evidence";
import { calendarEvent, agendaStatus, deadlineLabel } from "../lib/calendar";
import { WORKSPACE_TIMEZONE } from "../lib/dates";
import {
  RequirementSchema,
  unknownDeadline,
  type Application,
  type Requirement,
  type Opportunity,
} from "../lib/schema";
import {
  Field,
  Badge,
  CitationView,
  DeadlineEditor,
  SourceText,
  download,
  numberOrNull,
  validateDeadline,
  useEditorDirty,
  type EditorProps,
} from "./common";
function RequirementEditor(
  props: EditorProps & {
    app: Application;
    call: Opportunity;
    item?: Requirement;
    onAdded?: () => void;
  },
) {
  const [markDirty, isDirty] = useEditorDirty(
    "requirement-" + (props.item?.id ?? "new-" + props.app.id),
  );
  useEffect(() => {
    if (props.item && !isDirty) {
      setItem(props.item);
      setQuote(props.item.citation?.quote ?? "");
    }
  }, [props.item]);
  const initial: Requirement = props.item ?? {
    id: `req-${crypto.randomUUID()}`,
    category: "task",
    description: "",
    obligation: "unknown",
    origin: "sponsor",
    review: "proposed",
    status: "Missing",
    citation: null,
    manual: true,
    due: unknownDeadline("", "No internal target set."),
    wordLimit: null,
    sectionKey: null,
    linkedSourceId: null,
    reference: "",
    note: "",
    responsible: "",
  };
  const [item, setItem] = useState(initial),
    [quote, setQuote] = useState(initial.citation?.quote ?? ""),
    [error, setError] = useState("");
  const source = props.state.sources.find((s) => s.id === props.call.sourceId)!;
  function edit(key: string, value: unknown) {
    setItem({ ...item, [key]: value });
    markDirty(true);
  }
  async function save(e: React.FormEvent) {
    e.preventDefault();
    try {
      const dateError = validateDeadline(item.due);
      if (dateError) throw new Error(dateError);
      const citation =
        quote === initial.citation?.quote
          ? initial.citation
          : quote
            ? cite(source, quote)
            : null;
      const parsed = RequirementSchema.parse({ ...item, citation });
      const out = await props.mutate({
        type: "saveRequirement",
        applicationId: props.app.id,
        requirement: parsed,
      });
      if (out) {
        markDirty(false);
        props.onAdded?.();
      }
    } catch (e) {
      setError((e as Error).message);
    }
  }
  return (
    <form className="form-stack" onSubmit={save}>
      <Field label="Requirement or task description">
        <input
          required
          value={item.description}
          onChange={(e) => edit("description", e.target.value)}
        />
      </Field>
      <div className="form-grid">
        <Field label="Origin">
          <select
            value={item.origin}
            onChange={(e) => edit("origin", e.target.value)}
          >
            <option value="sponsor">Sponsor requirement</option>
            <option value="internal">User-added internal task</option>
          </select>
        </Field>
        <Field label="Category">
          <select
            value={item.category}
            onChange={(e) => edit("category", e.target.value)}
          >
            <option value="section">Draft section</option>
            <option value="document">Supporting document</option>
            <option value="task">Task</option>
          </select>
        </Field>
        <Field label="Obligation">
          <select
            value={item.obligation}
            onChange={(e) => edit("obligation", e.target.value)}
          >
            <option value="unknown">Unknown</option>
            <option value="required">Required</option>
            <option value="optional">Optional</option>
          </select>
        </Field>
        <Field label="Document / task status">
          <select
            value={item.status}
            onChange={(e) => edit("status", e.target.value)}
          >
            <option>Missing</option>
            <option>In progress</option>
            <option>Ready</option>
          </select>
        </Field>
        <Field label="Mapped starter section">
          <select
            value={item.sectionKey ?? ""}
            onChange={(e) => edit("sectionKey", e.target.value || null)}
          >
            <option value="">No section mapping</option>
            {props.app.sections.map((s) => (
              <option value={s.key} key={s.key}>
                {s.label}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Sponsor word limit (optional)">
          <input
            type="number"
            min="1"
            value={item.wordLimit ?? ""}
            onChange={(e) => edit("wordLimit", numberOrNull(e.target.value))}
          />
        </Field>
      </div>
      <Field
        label="Exact call quotation"
        hint="Paste exact normalized source text. Unsupported overrides remain visibly user-entered."
      >
        <textarea
          rows={2}
          value={quote}
          onChange={(e) => {
            setQuote(e.target.value);
            markDirty(true);
          }}
        />
      </Field>
      <Field label="Linked evidence note">
        <select
          value={item.linkedSourceId ?? ""}
          onChange={(e) => edit("linkedSourceId", e.target.value || null)}
        >
          <option value="">No linked evidence</option>
          {props.state.sources
            .filter((s) => s.projectId === props.app.projectId)
            .map((s) => (
              <option value={s.id} key={s.id}>
                {s.title}
              </option>
            ))}
        </select>
      </Field>
      <div className="form-grid">
        <Field label="Document reference / link">
          <input
            type="url"
            value={item.reference}
            onChange={(e) => edit("reference", e.target.value)}
          />
        </Field>
        <Field label="Responsible person (plain text)">
          <input
            value={item.responsible}
            onChange={(e) => edit("responsible", e.target.value)}
          />
        </Field>
      </div>
      <Field label="Document status note">
        <textarea
          rows={2}
          value={item.note}
          onChange={(e) => edit("note", e.target.value)}
        />
      </Field>
      <details>
        <summary>Internal target date</summary>
        <p className="muted">
          This target is separate from the official sponsor deadline.
        </p>
        <DeadlineEditor
          value={item.due}
          label="Internal target"
          onChange={(v) => edit("due", v)}
        />
      </details>
      <label className="check">
        <input
          type="checkbox"
          checked={item.review === "confirmed"}
          onChange={(e) =>
            edit("review", e.target.checked ? "confirmed" : "proposed")
          }
        />
        I reviewed this item against the call
      </label>
      <p className="muted">
        Ready records your document/task status. The app cannot approve a study
        or certify compliance.
      </p>
      {error && (
        <p className="error" role="alert">
          {error}
        </p>
      )}
      <button disabled={props.busy} className="primary">
        Save checklist item
      </button>
    </form>
  );
}
export function Checklist(
  props: EditorProps & { app: Application; call: Opportunity },
) {
  const [add, setAdd] = useState(false),
    [error, setError] = useState("");
  const source = props.state.sources.find((s) => s.id === props.call.sourceId)!;
  function exportEvent(
    id: string,
    title: string,
    description: string,
    deadline: Requirement["due"],
  ) {
    try {
      download(
        "grantpath-event.ics",
        calendarEvent({
          id,
          title,
          description,
          deadline,
          updatedAt: props.app.updatedAt,
        }),
        "text/calendar;charset=utf-8",
      );
      setError("");
    } catch (e) {
      setError((e as Error).message);
    }
  }
  const events = [
    {
      id: `${props.app.id}-sponsor`,
      title: "Sponsor deadline",
      deadline: props.call.deadline,
      description: props.call.title,
    },
    ...props.app.requirements.map((r) => ({
      id: `${props.app.id}-${r.id}`,
      title: r.description,
      deadline: r.due,
      description: `Internal target. ${r.note}`,
    })),
  ];
  return (
    <div className="two-column wide-left">
      <section className="card">
        <div className="section-heading">
          <div>
            <p className="eyebrow">03 / REQUIREMENTS</p>
            <h2>Application checklist</h2>
          </div>
          <Badge tone={props.app.requirementsReviewed ? "green" : "amber"}>
            {props.app.requirementsReviewed
              ? "Review recorded"
              : "Review incomplete"}
          </Badge>
        </div>
        <p className="muted">
          Extraction proposes items. Read the whole call, confirm each item, and
          add anything missed.
        </p>
        <SourceText source={source} />
        {!props.app.requirements.length && (
          <div className="empty">
            No supported labeled lines were found. This does not mean the
            sponsor has no requirements. Add exact-quote items from the call.
          </div>
        )}
        <div className="requirements">
          {props.app.requirements.map((req) => (
            <article className="requirement" key={req.id}>
              <div className="row spread">
                <h3>{req.description}</h3>
                <Badge
                  tone={
                    req.status === "Ready"
                      ? "green"
                      : req.status === "Missing"
                        ? "red"
                        : "amber"
                  }
                >
                  {req.status}
                </Badge>
              </div>
              <div className="row">
                <Badge>
                  {req.category} · {req.obligation}
                </Badge>
                <Badge tone={req.review === "confirmed" ? "green" : "amber"}>
                  {req.review}
                </Badge>
                <Badge>
                  {req.origin === "internal" ? "Internal task" : "Sponsor item"}
                  {req.manual ? " · user-entered" : ""}
                </Badge>
              </div>
              {req.citation && (
                <CitationView citation={req.citation} state={props.state} />
              )}
              <div className="row actions">
                {req.review === "proposed" && (
                  <button
                    disabled={props.busy}
                    onClick={() =>
                      void props.mutate({
                        type: "saveRequirement",
                        applicationId: props.app.id,
                        requirement: { ...req, review: "confirmed" },
                      })
                    }
                  >
                    Confirm requirement
                  </button>
                )}
                <details>
                  <summary>Edit status, support and target</summary>
                  <RequirementEditor {...props} item={req} key={req.id} />
                </details>
              </div>
              {req.note && <p className="muted">Note: {req.note}</p>}
            </article>
          ))}
        </div>
        <div className="row actions">
          <button onClick={() => setAdd(!add)}>+ Add requirement / task</button>
          <button
            className="primary"
            disabled={props.busy}
            onClick={() =>
              void props.mutate({
                type: "reviewRequirements",
                applicationId: props.app.id,
              })
            }
          >
            Confirm whole-call review
          </button>
        </div>
        {add && <RequirementEditor {...props} onAdded={() => setAdd(false)} />}
        <details>
          <summary>Re-extract after a call amendment</summary>
          <p>
            Creates a fresh proposed checklist from the current source. Prior
            statuses and notes remain in checklist history. User-added internal
            tasks remain active.
          </p>
          <button
            disabled={props.busy}
            onClick={() =>
              void props.mutate({
                type: "reextractRequirements",
                applicationId: props.app.id,
              })
            }
          >
            Re-extract requirements
          </button>
        </details>
        {props.app.requirementsHistory.length > 0 && (
          <details>
            <summary>
              Checklist history · {props.app.requirementsHistory.length}{" "}
              snapshots
            </summary>
            {props.app.requirementsHistory.map((snapshot, i) => (
              <details key={i}>
                <summary>
                  Source v{snapshot.sourceVersion} · {snapshot.at}
                </summary>
                {snapshot.items.map((r) => (
                  <div key={r.id}>
                    <p>
                      {r.description} · {r.status} · {r.review} · {r.note}
                    </p>
                    {r.citation && (
                      <CitationView citation={r.citation} state={props.state} />
                    )}
                  </div>
                ))}
              </details>
            ))}
          </details>
        )}
      </section>
      <section className="card agenda">
        <p className="eyebrow">DATES & NEXT STEPS</p>
        <h2>Application agenda</h2>
        <p className="muted">
          Date display basis: {WORKSPACE_TIMEZONE}. Reminders are in-app entries
          only. Calendar import is a one-time snapshot.
        </p>
        {["Overdue", "Upcoming", "Unresolved date"].map((group) => (
          <div className="agenda-group" key={group}>
            <h3>{group}</h3>
            {events
              .filter((e) => agendaStatus(e.deadline) === group)
              .map((event) => (
                <article key={event.id}>
                  <strong>{event.title}</strong>
                  <p>{deadlineLabel(event.deadline)}</p>
                  {event.deadline.kind !== "unknown" ? (
                    <button
                      className="text-button"
                      onClick={() =>
                        exportEvent(
                          event.id,
                          event.title,
                          event.description,
                          event.deadline,
                        )
                      }
                    >
                      Export this event (.ics) ↗
                    </button>
                  ) : (
                    <span className="muted">
                      Confirm date before calendar export
                    </span>
                  )}
                </article>
              ))}
            {!events.some((e) => agendaStatus(e.deadline) === group) && (
              <p className="muted">No items.</p>
            )}
          </div>
        ))}
        {error && (
          <p className="error" role="alert">
            {error}
          </p>
        )}
      </section>
    </div>
  );
}
