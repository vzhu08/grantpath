"use client";
import { useEffect, useState } from "react";
import type { State } from "../../lib/schema";
import { calendarEvent } from "../../lib/calendar";
import { localDate, WORKSPACE_TIMEZONE } from "../../lib/dates";
import {
  Badge,
  Field,
  download,
  useEditorDirty,
  type EditorProps,
} from "../common";
import { documentUrl } from "../documents/vault-panel";
type Props = EditorProps & { projectId: string };
type EthicsRecord = State["ethicsRecords"][number];
type Revision = EthicsRecord["revisions"][number];
type Editable = Omit<Revision, "revision" | "at" | "confirmation">;
const phases = [
  "application",
  "pre-award",
  "before-research",
  "specific-date",
  "unknown",
] as const;
const categories = [
  "IRB",
  "animal-study",
  "data-use",
  "training",
  "conflict-of-interest",
  "other",
] as const;
const statuses = [
  "unknown",
  "pending",
  "approved",
  "exempt",
  "not-applicable",
  "expired",
  "withdrawn",
] as const;
const blank: Editable = {
  category: "IRB",
  scope: "",
  institution: "",
  reference: "",
  status: "unknown",
  basis: "",
  phase: "unknown",
  requiredDate: null,
  approvalDate: null,
  expiry: { kind: "unknown" },
  supportingVersionIds: [],
};
function editable(record?: EthicsRecord): Editable {
  if (!record) return { ...blank, supportingVersionIds: [] };
  const {
    revision: _revision,
    at: _at,
    confirmation: _confirmation,
    ...value
  } = record.revisions.at(-1)!;
  return value;
}
function EthicsEditor(
  props: Props & { record?: EthicsRecord; onSaved?: () => void },
) {
  const [value, setValue] = useState<Editable>(() => editable(props.record)),
    [error, setError] = useState("");
  const [markDirty, isDirty] = useEditorDirty(
    `ethics-editor-${props.record?.id ?? props.projectId}`,
  );
  useEffect(() => {
    if (!isDirty) setValue(editable(props.record));
  }, [props.record]);
  function edit<K extends keyof Editable>(key: K, next: Editable[K]) {
    setValue({ ...value, [key]: next });
    markDirty(true);
  }
  const documents = props.state.documents.filter(
    (d) => d.projectId === props.projectId,
  );
  return (
    <form
      className="form-stack"
      onSubmit={async (e) => {
        e.preventDefault();
        setError("");
        try {
          if (
            ["exempt", "not-applicable"].includes(value.status) &&
            (!value.basis.trim() || !value.reference.trim())
          )
            throw new Error(
              "Record the basis and reference for an exempt or not-applicable determination.",
            );
          if (
            value.expiry.kind === "date" &&
            value.approvalDate &&
            value.expiry.date < value.approvalDate
          )
            throw new Error(
              "Expiry cannot precede the recorded approval date.",
            );
          const result = await props.mutate({
            type: "saveEthicsRecord",
            ...(props.record ? { id: props.record.id } : {}),
            projectId: props.projectId,
            record: value,
          });
          if (result) {
            markDirty(false);
            props.onSaved?.();
          }
        } catch (e) {
          setError((e as Error).message);
        }
      }}
    >
      <div className="form-grid">
        <Field label="Ethics category">
          <select
            value={value.category}
            onChange={(e) =>
              edit("category", e.target.value as Editable["category"])
            }
          >
            {categories.map((c) => (
              <option key={c}>{c}</option>
            ))}
          </select>
        </Field>
        <Field label="Recorded ethics status">
          <select
            value={value.status}
            onChange={(e) =>
              edit("status", e.target.value as Editable["status"])
            }
          >
            {statuses.map((s) => (
              <option key={s}>{s}</option>
            ))}
          </select>
        </Field>
      </div>
      <Field
        label="Actual scope"
        hint="Describe the study activities, population or administrative scope this record covers."
      >
        <textarea
          required
          maxLength={3000}
          rows={3}
          value={value.scope}
          onChange={(e) => edit("scope", e.target.value)}
        />
      </Field>
      <div className="form-grid">
        <Field label="Institution">
          <input
            maxLength={500}
            value={value.institution}
            onChange={(e) => edit("institution", e.target.value)}
          />
        </Field>
        <Field label="Protocol or reference label">
          <input
            maxLength={500}
            required={["exempt", "not-applicable"].includes(value.status)}
            value={value.reference}
            onChange={(e) => edit("reference", e.target.value)}
          />
        </Field>
      </div>
      <Field label="Determination basis and source wording">
        <textarea
          rows={2}
          maxLength={3000}
          required={["exempt", "not-applicable"].includes(value.status)}
          value={value.basis}
          onChange={(e) => edit("basis", e.target.value)}
        />
      </Field>
      <div className="form-grid">
        <Field label="Phase when needed">
          <select
            value={value.phase}
            onChange={(e) => edit("phase", e.target.value as Editable["phase"])}
          >
            {phases.map((p) => (
              <option key={p}>{p}</option>
            ))}
          </select>
        </Field>
        <Field label="Required date, when known">
          <input
            type="date"
            required={value.phase === "specific-date"}
            value={value.requiredDate ?? ""}
            onChange={(e) => edit("requiredDate", e.target.value || null)}
          />
        </Field>
        <Field label="Actual approval date, when known">
          <input
            type="date"
            value={value.approvalDate ?? ""}
            onChange={(e) => edit("approvalDate", e.target.value || null)}
          />
        </Field>
      </div>
      <div className="form-grid">
        <Field label="Expiry meaning">
          <select
            value={value.expiry.kind}
            onChange={(e) =>
              edit(
                "expiry",
                e.target.value === "date"
                  ? { kind: "date", date: "" }
                  : e.target.value === "no-expiry"
                    ? { kind: "no-expiry" }
                    : { kind: "unknown" },
              )
            }
          >
            <option value="unknown">Unknown</option>
            <option value="no-expiry">Explicitly no expiry stated</option>
            <option value="date">Confirmed expiry date</option>
          </select>
        </Field>
        {value.expiry.kind === "date" && (
          <Field label="Expiry date (inclusive)">
            <input
              type="date"
              required
              value={value.expiry.date}
              onChange={(e) =>
                edit("expiry", { kind: "date", date: e.target.value })
              }
            />
          </Field>
        )}
      </div>
      <fieldset className="form-stack">
        <legend>Supporting original file versions</legend>
        <p className="muted">
          Selections pin exact versions. Saving any scope, status, timing or
          support change creates a new unconfirmed revision.
        </p>
        {documents.length ? (
          documents.map((d) => (
            <div key={d.id}>
              <strong>
                {d.title}
                {d.archivedAt ? " · archived" : ""}
              </strong>
              {d.versionIds
                .map((id) =>
                  props.state.documentVersions.find((v) => v.id === id),
                )
                .filter(Boolean)
                .map((v) => (
                  <label className="check" key={v!.id}>
                    <input
                      type="checkbox"
                      checked={value.supportingVersionIds.includes(v!.id)}
                      onChange={(e) =>
                        edit(
                          "supportingVersionIds",
                          e.target.checked
                            ? [...value.supportingVersionIds, v!.id]
                            : value.supportingVersionIds.filter(
                                (id) => id !== v!.id,
                              ),
                        )
                      }
                    />
                    {v!.filename} · v{v!.version}
                  </label>
                ))}
            </div>
          ))
        ) : (
          <p className="muted">
            Upload a supporting file in Documents first, if one is needed.
          </p>
        )}
      </fieldset>
      <p className="muted">
        These are researcher-entered administrative records. Confirmation
        records your review and does not grant institutional approval. Later
        confirmed phases remain future tasks during application preparation.
      </p>
      {error && (
        <p role="alert" className="error">
          {error}
        </p>
      )}
      <button className="primary" disabled={props.busy}>
        {props.record ? "Save new ethics revision" : "Save ethics record"}
      </button>
    </form>
  );
}
function EthicsCard(props: Props & { record: EthicsRecord }) {
  const { record: r } = props,
    v = r.revisions.at(-1)!;
  const [by, setBy] = useState(""),
    [error, setError] = useState("");
  const expired = v.expiry.kind === "date" && v.expiry.date < localDate();
  const beforeNeed =
    v.expiry.kind === "date" &&
    !!v.requiredDate &&
    v.expiry.date < v.requiredDate;
  return (
    <article className="requirement form-stack">
      <div className="row spread">
        <h3>
          {v.category} · {v.reference || "Reference not recorded"}
        </h3>
        <Badge tone={expired || !v.confirmation ? "amber" : "neutral"}>
          {v.status} · revision {v.revision}
        </Badge>
      </div>
      <p>{v.scope}</p>
      <p>
        {v.institution || "Institution unknown"} · needed {v.phase}
        {v.requiredDate ? ` · ${v.requiredDate}` : ""}
      </p>
      <p>
        Approval: {v.approvalDate ?? "unknown"} · Expiry:{" "}
        {v.expiry.kind === "date"
          ? `${v.expiry.date} (inclusive)`
          : v.expiry.kind === "no-expiry"
            ? "explicitly no expiry stated"
            : "unknown"}
      </p>
      {(expired || beforeNeed) && (
        <p role="status" className="error">
          {expired
            ? "The recorded expiry has passed."
            : "The record expires before its required date."}{" "}
          Review this record's scope and timing.
        </p>
      )}
      {v.confirmation ? (
        <p className="muted">
          Researcher confirmation: {v.confirmation.by} · {v.confirmation.at}.
          Supporting files and scope are pinned to revision {v.revision}.
        </p>
      ) : (
        <p className="muted">
          This scope revision has no recorded human confirmation.
        </p>
      )}
      {v.supportingVersionIds.map((id) => {
        const f = props.state.documentVersions.find((f) => f.id === id);
        return f ? (
          <a key={id} href={`${documentUrl(f.documentId, f.id)}/download`}>
            Supporting original: {f.filename} v{f.version}
          </a>
        ) : (
          <p key={id} className="error">
            Supporting file unavailable
          </p>
        );
      })}
      <details>
        <summary>Edit scope, status, dates or supporting files</summary>
        <EthicsEditor {...props} />
      </details>
      <form
        className="form-stack"
        onSubmit={async (e) => {
          e.preventDefault();
          setError("");
          try {
            await props.mutate({
              type: "confirmEthicsRecord",
              recordId: r.id,
              by,
            });
          } catch (e) {
            setError((e as Error).message);
          }
        }}
      >
        <Field label="Ethics reviewer label">
          <input
            required
            maxLength={500}
            value={by}
            onChange={(e) => setBy(e.target.value)}
          />
        </Field>
        <button disabled={props.busy}>Confirm current scope and timing</button>
      </form>
      <details>
        <summary>Ethics revision history ({r.revisions.length})</summary>
        {[...r.revisions].reverse().map((item) => (
          <div key={item.revision}>
            <p>
              <strong>Revision {item.revision}</strong> · {item.at} ·{" "}
              {item.status} · {item.phase}
            </p>
            <p>{item.scope}</p>
            <p className="muted">
              {item.confirmation
                ? `Confirmed by ${item.confirmation.by}`
                : "Unconfirmed"}{" "}
              · {item.supportingVersionIds.length} supporting versions
            </p>
          </div>
        ))}
      </details>
      {error && (
        <p role="alert" className="error">
          {error}
        </p>
      )}
    </article>
  );
}
export function EthicsPanel(props: Props) {
  const [adding, setAdding] = useState(false),
    [error, setError] = useState("");
  const records = props.state.ethicsRecords.filter(
      (r) => r.projectId === props.projectId,
    ),
    ids = new Set(records.map((r) => r.id)),
    tasks = props.state.ethicsTasks.filter(
      (t) => ids.has(t.recordId) && t.active,
    );
  return (
    <section className="card form-stack" aria-label="Ethics records">
      <p className="eyebrow">SCOPE & TIMING · RESEARCHER REPORTED</p>
      <h2>Ethics and administrative records</h2>
      <p>
        Record when an approval or administrative record is needed. An IRB
        record needed before research does not automatically block the initial
        application.
      </p>
      <button type="button" onClick={() => setAdding(!adding)}>
        {adding ? "Close new record editor" : "Add ethics record"}
      </button>
      {adding && <EthicsEditor {...props} onSaved={() => setAdding(false)} />}
      {records.length ? (
        records.map((r) => <EthicsCard key={r.id} {...props} record={r} />)
      ) : (
        <p className="muted">No ethics records entered for this project.</p>
      )}
      <details>
        <summary>Ethics agenda ({tasks.length} active tasks)</summary>
        <p className="muted">
          Date display basis: {WORKSPACE_TIMEZONE}. Dates are inclusive; no
          expiry is inferred. Calendar exports are one-time snapshots.
        </p>
        {tasks.map((t) => (
          <article className="requirement" key={t.id}>
            <strong>{t.title}</strong>
            <p>
              {t.date
                ? `${t.date} · ${t.date < localDate() ? "Overdue" : "Upcoming"}`
                : "Unresolved date"}{" "}
              · scope revision {t.revision}
            </p>
            {t.date && (
              <button
                type="button"
                onClick={() => {
                  try {
                    download(
                      `ethics-${t.kind}.ics`,
                      calendarEvent({
                        id: t.id,
                        title: t.title,
                        description: `Researcher-reported ${t.kind} task. Scope revision ${t.revision}. Verify institution requirements.`,
                        deadline: {
                          kind: "date",
                          raw: t.date!,
                          date: t.date!,
                          confirmed: true,
                        },
                        updatedAt: t.at,
                      }),
                      "text/calendar;charset=utf-8",
                    );
                  } catch (e) {
                    setError((e as Error).message);
                  }
                }}
              >
                Export task (.ics)
              </button>
            )}
          </article>
        ))}
        {!tasks.length && <p>No active tasks.</p>}
      </details>
      {error && (
        <p role="alert" className="error">
          {error}
        </p>
      )}
    </section>
  );
}
