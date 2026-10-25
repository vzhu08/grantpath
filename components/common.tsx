"use client";
import {
  Children,
  cloneElement,
  createContext,
  isValidElement,
  useContext,
  useEffect,
  useId,
  useState,
  type ReactElement,
} from "react";
import { latest, sourceDocument, citationStale } from "../lib/evidence";
import {
  DeadlineSchema,
  unknownDeadline,
  type Deadline,
  type Source,
  type Citation,
  type State,
  type Command,
} from "../lib/schema";
export type Mutate = (
  command: Command,
) => Promise<{ state: State; selectedId?: string } | null>;
export type EditorProps = {
  state: State;
  mutate: Mutate;
  busy: boolean;
  dirty: (value: boolean) => void;
  refresh?: () => Promise<void>;
};
export const EditorRegistry = createContext<{
  ids: Record<string, boolean>;
  mark: (id: string, value: boolean) => void;
}>({ ids: {}, mark: () => {} });
export function useEditorDirty(id: string) {
  const registry = useContext(EditorRegistry);
  useEffect(() => () => registry.mark(id, false), [id, registry.mark]);
  return [
    (value: boolean) => registry.mark(id, value),
    !!registry.ids[id],
  ] as const;
}
export function Field({
  label,
  children,
  hint,
}: {
  label: string;
  children: React.ReactNode;
  hint?: string;
}) {
  const id = useId();
  return (
    <div className="field">
      <label htmlFor={id}>{label}</label>
      {Children.map(children, (child) =>
        isValidElement(child) &&
        ["input", "textarea", "select"].includes(String(child.type))
          ? cloneElement(
              child as ReactElement<{
                id?: string;
                "aria-describedby"?: string;
              }>,
              { id, "aria-describedby": hint ? id + "-hint" : undefined },
            )
          : child,
      )}
      {hint && <small id={id + "-hint"}>{hint}</small>}
    </div>
  );
}
export function Badge({
  children,
  tone = "neutral",
}: {
  children: React.ReactNode;
  tone?: string;
}) {
  return <span className={`badge ${tone}`}>{children}</span>;
}
export function SourceText({
  source,
  initialVersion,
}: {
  source: Source;
  initialVersion?: number;
}) {
  const [version, setVersion] = useState(
    initialVersion ?? latest(source).version,
  );
  const current =
    source.versions.find((v) => v.version === version) ?? latest(source);
  return (
    <details className="source-view">
      <summary>
        Open source · {source.title} · v{current.version}
      </summary>
      <div className="source-meta">
        <Badge tone={source.provenance === "demo" ? "amber" : "neutral"}>
          {source.provenance === "demo"
            ? "Fictional demo"
            : "Researcher-provided"}
        </Badge>
        <span>
          {source.id} · hash {current.hash}
        </span>
        <Field label="Source version">
          <select
            value={version}
            onChange={(e) => setVersion(Number(e.target.value))}
          >
            {source.versions.map((v) => (
              <option key={v.version} value={v.version}>
                Version {v.version} · {new Date(v.createdAt).toLocaleString()}
              </option>
            ))}
          </select>
        </Field>
      </div>
      <p className="muted">
        Exact normalized text used for extraction and drafting. UTF-16 offsets;
        end-exclusive. Added {source.createdAt}; updated {source.updatedAt}.
        This source has not been independently verified.
      </p>
      {source.url && (
        <a href={source.url} target="_blank" rel="noreferrer">
          Open saved URL (not fetched or verified) ↗
        </a>
      )}
      <pre>{current.text}</pre>
    </details>
  );
}
export function CitationView({
  citation,
  state,
}: {
  citation: Citation;
  state: State;
}) {
  const source = state.sources.find((s) => s.id === citation.sourceId),
    version = source?.versions.find((v) => v.version === citation.version);
  if (!source || !version)
    return <p className="error">Source reference is unavailable.</p>;
  const doc = sourceDocument(source, citation.version);
  return (
    <details className="citation">
      <summary>
        {source.title} · v{citation.version} · [{citation.start}, {citation.end}
        ){latest(source).version !== citation.version ? " · STALE" : ""}
      </summary>
      <blockquote>{citation.quote}</blockquote>
      {version.fileOrigin && (
        <div className="muted">
          <p>
            {version.fileOrigin.manualEdit
              ? "Manually edited evidence; original origin retained"
              : "Reviewed original-file excerpt"}{" "}
            � reviewed by {version.fileOrigin.reviewedBy}. Full extraction
            offsets [{version.fileOrigin.start}, {version.fileOrigin.end}).
          </p>
          <a
            href={`/api/documents/${version.fileOrigin.documentId}/versions/${version.fileOrigin.documentVersionId}/download`}
          >
            Download the cited original file version
          </a>
          <details>
            <summary>File extraction trace</summary>
            <p>Extraction attempt: {version.fileOrigin.parseAttemptId}</p>
            <p style={{ overflowWrap: "anywhere" }}>
              Full-artifact SHA-256: {version.fileOrigin.artifactSha256}
            </p>
            <p>{version.fileOrigin.reason}</p>
          </details>
        </div>
      )}

      <p className="muted">
        Hash {citation.hash}. Provenance, not independent verification.
      </p>
      <pre>
        {doc.text.slice(Math.max(0, citation.start - 100), citation.start)}
        <mark>{doc.text.slice(citation.start, citation.end)}</mark>
        {doc.text.slice(citation.end, citation.end + 100)}
      </pre>
      <SourceText source={source} initialVersion={citation.version} />
    </details>
  );
}
export function DeadlineEditor({
  value,
  onChange,
  label = "Deadline",
}: {
  value: Deadline;
  onChange: (value: Deadline) => void;
  label?: string;
}) {
  return (
    <div className="deadline-editor">
      <Field label={`${label} precision`}>
        <select
          value={value.kind}
          onChange={(e) =>
            onChange(
              e.target.value === "unknown"
                ? unknownDeadline(value.raw)
                : e.target.value === "date"
                  ? { kind: "date", date: "", raw: value.raw, confirmed: true }
                  : {
                      kind: "exact",
                      at: "",
                      zone: "UTC",
                      raw: value.raw,
                      confirmed: true,
                    },
            )
          }
        >
          <option value="unknown">Unresolved / do not guess</option>
          <option value="date">Confirmed date only</option>
          <option value="exact">Confirmed timestamp and offset</option>
        </select>
      </Field>
      <Field label="Original deadline wording">
        <input
          value={value.raw}
          onChange={(e) => onChange({ ...value, raw: e.target.value })}
        />
      </Field>
      {value.kind === "date" && (
        <Field
          label="Confirmed date"
          hint="Cutoff time is unknown. Calendar export will be all-day."
        >
          <input
            type="date"
            value={value.date}
            onChange={(e) => onChange({ ...value, date: e.target.value })}
          />
        </Field>
      )}
      {value.kind === "exact" && (
        <>
          <Field
            label="Source timestamp with explicit offset"
            hint="Example: 2027-02-15T17:00:00-05:00. Do not supply a guessed timezone."
          >
            <input
              value={value.at}
              placeholder="2027-02-15T17:00:00-05:00"
              onChange={(e) => onChange({ ...value, at: e.target.value })}
            />
          </Field>
          <Field
            label="Confirmed source offset"
            hint="Must match the timestamp; UTC requires a Z timestamp."
          >
            <input
              value={value.zone}
              placeholder="-05:00 or UTC"
              onChange={(e) => onChange({ ...value, zone: e.target.value })}
            />
          </Field>
        </>
      )}
      {value.kind === "unknown" && <p className="muted">{value.reason}</p>}
    </div>
  );
}
export function download(
  name: string,
  text: string,
  type = "text/markdown;charset=utf-8",
) {
  const url = URL.createObjectURL(new Blob([text], { type }));
  const link = document.createElement("a");
  link.href = url;
  link.download = name;
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
export function validateDeadline(value: Deadline): string | null {
  const result = DeadlineSchema.safeParse(value);
  return result.success
    ? null
    : "Confirm a valid date or timestamp with the matching source offset, or keep the date unresolved.";
}
export const list = (value: string) =>
  value
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
export const numberOrNull = (value: string) =>
  value.trim() === "" ? null : Number(value);
