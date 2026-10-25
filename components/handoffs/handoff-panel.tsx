"use client";
import { useRef, useState } from "react";
import type { Application } from "../../lib/schema";
import type { Handoff, Phase } from "../../lib/vault/schema";
import { Badge, Field, download, type EditorProps } from "../common";
import { vaultResponse } from "../documents/vault-panel";
type Props = EditorProps & { app: Application };
function manifestText(h: Handoff) {
  return [
    `# Internal preparation handoff ${h.id}`,
    `Created ${h.createdAt}. Phase: ${h.phase}. Rules: ${h.rulesVersion}.`,
    "Prepared for transfer to the sponsor portal. Check the portal preview and submission receipt.",
    "This manifest and its warnings are internal preparation notes, separate from sponsor attachments.",
    "",
    "## Files to upload",
    ...h.files.map(
      (f) =>
        `- ${f.transferFilename} (original ${f.filename}); version ${f.documentVersionId}; ${f.bytes} bytes; SHA-256 ${f.sha256}${f.issues.length ? `; review issues: ${f.issues.join("; ")}` : ""}`,
    ),
    "",
    "## Saved answers to enter",
    ...h.answers.flatMap((a) => [
      `### ${a.label}`,
      `Draft revision ${a.revisionId}. ${a.wordLimit ? `Confirmed limit: ${a.wordLimit} words.` : "No confirmed word limit recorded."}`,
      a.text,
      "",
    ]),
    "## Internal warnings",
    ...(h.warnings.length
      ? h.warnings.map((w) => `- ${w}`)
      : [
          "No modeled warnings recorded. Manual portal review is still required.",
        ]),
    "",
    "## Records needed at later phases",
    ...h.ethics.map((r) => {
      const e = r.revisions.at(-1)!;
      return `- ${e.category}: ${e.phase}; scope revision ${e.revision}; ${e.status}`;
    }),
    ...h.futureTasks.map((t) => `- ${t.title}: ${t.date ?? "date unresolved"}`),
  ].join("\n");
}
function Snapshot(props: Props & { handoff: Handoff }) {
  const h = props.handoff,
    [error, setError] = useState(""),
    [copied, setCopied] = useState("");
  const project = props.state.projects.find((p) => p.id === h.projectId),
    call = props.state.opportunities.find(
      (c) => c.id === props.app.opportunityId,
    );
  const older =
    props.app.revision !== h.applicationRevision ||
    project?.revision !== h.projectRevision ||
    call?.revision !== h.callRevision ||
    call?.sourceVersion !== h.callSourceVersion;
  return (
    <article className="requirement form-stack">
      <div className="row spread">
        <h3>Saved handoff · {h.createdAt}</h3>
        <Badge tone={h.warnings.length ? "amber" : "neutral"}>
          {h.phase} ·{" "}
          {h.warnings.length
            ? "Incomplete review handoff"
            : "Prepared snapshot"}
        </Badge>
      </div>
      {older && (
        <p role="status" className="muted">
          Current application inputs differ from this saved handoff. Its
          selected files, answers and warnings remain unchanged.
        </p>
      )}
      <p className="muted">
        Application revision {h.applicationRevision} · project revision{" "}
        {h.projectRevision} · call revision {h.callRevision}, source v
        {h.callSourceVersion}
      </p>
      <div className="row actions">
        <button
          type="button"
          onClick={() =>
            download(
              `handoff-${h.id}.json`,
              JSON.stringify(h, null, 2),
              "application/json;charset=utf-8",
            )
          }
        >
          Download internal JSON manifest
        </button>
        <button
          type="button"
          onClick={() =>
            download(
              `handoff-${h.id}.md`,
              manifestText(h),
              "text/markdown;charset=utf-8",
            )
          }
        >
          Download internal preparation notes
        </button>
      </div>
      <h4>Files to upload to the sponsor portal</h4>
      <p className="muted">
        These links return the exact original file bytes pinned by this
        snapshot. Internal notes are separate downloads above.
      </p>
      {h.files.length ? (
        h.files.map((f, i) => {
          const current = props.state.documentVersions.find(
              (v) => v.id === f.documentVersionId,
            ),
            unavailable =
              !current || ["missing", "corrupt"].includes(current.integrity);
          return (
            <div key={`${f.requirementId}-${i}`} className="form-stack">
              <strong>{f.transferFilename}</strong>
              <p>
                Original: {f.filename} · {f.mime} · {f.bytes.toLocaleString()}{" "}
                bytes
              </p>
              <p style={{ overflowWrap: "anywhere" }}>
                SHA-256: <code>{f.sha256}</code>
              </p>
              {unavailable ? (
                <p className="error">
                  Original bytes are currently unavailable or corrupt. Download
                  is disabled; this saved selection is retained.
                </p>
              ) : (
                <a
                  href={`/api/applications/${encodeURIComponent(h.applicationId)}/handoffs/${encodeURIComponent(h.id)}/${encodeURIComponent(f.documentVersionId)}/download?requirementId=${encodeURIComponent(f.requirementId)}`}
                >
                  Download saved sponsor file
                </a>
              )}
              {f.issues.length > 0 && (
                <details>
                  <summary>
                    Internal file review notes ({f.issues.length})
                  </summary>
                  {f.issues.map((issue, index) => (
                    <p className="muted" key={index}>
                      {issue}
                    </p>
                  ))}
                </details>
              )}
            </div>
          );
        })
      ) : (
        <p className="muted">
          No original file selections were saved in this handoff.
        </p>
      )}
      <h4>Saved answers to enter</h4>
      {h.answers.length ? (
        h.answers.map((a) => (
          <details key={a.requirementId ?? a.sectionKey}>
            <summary>
              {a.label} · draft revision {a.revisionId}
            </summary>
            <p className="muted">
              Target field: {a.label}.{" "}
              {a.wordLimit
                ? `Confirmed limit: ${a.wordLimit} words.`
                : "No confirmed limit recorded; inspect the saved call."}
            </p>
            <Field label={`Saved answer: ${a.label}`}>
              <textarea readOnly rows={6} value={a.text} />
            </Field>
            <button
              type="button"
              onClick={async () => {
                try {
                  await navigator.clipboard.writeText(a.text);
                  setCopied(a.sectionKey);
                  setError("");
                } catch {
                  setError(
                    "Clipboard access is unavailable. Select and copy the saved answer text above.",
                  );
                }
              }}
            >
              Copy saved answer
            </button>
            {copied === a.sectionKey && (
              <p role="status">Saved answer copied.</p>
            )}
          </details>
        ))
      ) : (
        <p className="muted">
          No existing draft answers were mapped in this snapshot.
        </p>
      )}
      <details>
        <summary>Internal warnings and later-phase records</summary>
        {h.warnings.map((w, i) => (
          <p key={i} className="muted">
            {w}
          </p>
        ))}
        {h.ethics.map((r) => {
          const e = r.revisions.at(-1)!;
          return (
            <p key={r.id}>
              {e.category} · {e.phase} · {e.status} · scope revision{" "}
              {e.revision}
            </p>
          );
        })}
        {h.futureTasks.map((t) => (
          <p key={t.id}>
            {t.title} · {t.date ?? "Unresolved date"}
          </p>
        ))}
        {!h.warnings.length && !h.ethics.length && !h.futureTasks.length && (
          <p>No internal warnings or later-phase records saved.</p>
        )}
      </details>
      {error && (
        <p className="error" role="alert">
          {error}
        </p>
      )}
    </article>
  );
}
export function HandoffPanel(props: Props) {
  const [phase, setPhase] = useState<Phase>("application"),
    [saving, setSaving] = useState(false),
    [error, setError] = useState("");
  const receipt = useRef<{
    payload: string;
    key: string;
    revision: number;
  } | null>(null);
  const handoffs = props.state.handoffs.filter(
      (h) => h.applicationId === props.app.id,
    ),
    call = props.state.opportunities.find(
      (c) => c.id === props.app.opportunityId,
    );
  async function save() {
    setSaving(true);
    setError("");
    try {
      const payload = JSON.stringify({ applicationId: props.app.id, phase });
      if (receipt.current?.payload !== payload)
        receipt.current = {
          payload,
          key: crypto.randomUUID(),
          revision: props.state.revision,
        };
      await vaultResponse(
        await fetch(
          `/api/applications/${encodeURIComponent(props.app.id)}/handoffs`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              expectedRevision: receipt.current.revision,
              phase,
              idempotencyKey: receipt.current.key,
            }),
          },
        ),
      );
      receipt.current = null;
      await props.refresh?.();
    } catch (e) {
      if ((e as { status?: number }).status === 409) receipt.current = null;
      setError((e as Error).message);
    } finally {
      setSaving(false);
    }
  }
  return (
    <section className="card form-stack" aria-label="Preparation and handoff">
      <p className="eyebrow">PREPARATION & HANDOFF</p>
      <h2>Prepare for sponsor transfer</h2>
      <p>
        Prepared for transfer to the sponsor portal. Check the portal preview
        and submission receipt.
      </p>
      <p className="muted">
        A handoff freezes the selected file versions, existing mapped draft
        answers and internal review warnings. An incomplete review handoff is
        allowed and visibly labeled. Saving, copying or downloading never
        changes the application to Submitted.
      </p>
      {call?.url && (
        <a href={call.url} target="_blank" rel="noreferrer">
          Open saved official call or portal link ↗
        </a>
      )}
      <Field label="Handoff preparation phase">
        <select
          value={phase}
          disabled={saving}
          onChange={(e) => setPhase(e.target.value as Phase)}
        >
          <option value="application">Application</option>
          <option value="pre-award">Pre-award</option>
          <option value="before-research">Before research</option>
        </select>
      </Field>
      <button
        className="primary"
        disabled={props.busy || saving}
        onClick={() => void save()}
      >
        {saving ? "Saving immutable handoff…" : "Save handoff snapshot"}
      </button>
      {error && (
        <div>
          <p className="error" role="alert">
            {error}
          </p>
          <button type="button" onClick={() => void props.refresh?.()}>
            Refresh saved data before retrying
          </button>
        </div>
      )}
      {[...handoffs].reverse().map((h) => (
        <Snapshot key={h.id} {...props} handoff={h} />
      ))}
      {!handoffs.length && (
        <p className="muted">No saved handoffs for this application.</p>
      )}
    </section>
  );
}
