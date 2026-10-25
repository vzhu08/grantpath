"use client";
import { VaultPanel } from "./documents/vault-panel";
import { EthicsPanel } from "./ethics/ethics-panel";
import { useEffect, useState } from "react";
import { latest } from "../lib/evidence";
import {
  ProfileSchema,
  type Project,
  type Source,
  type Profile,
} from "../lib/schema";
import {
  Field,
  Badge,
  SourceText,
  list,
  numberOrNull,
  useEditorDirty,
  type EditorProps,
} from "./common";
export const emptyProfile: Profile = {
  title: "",
  abstract: "",
  tags: [],
  applicantType: "",
  institution: "",
  careerStage: "",
  country: "",
  fundingNeed: null,
  currency: "USD",
  startDate: "",
  endDate: "",
  knownFacts: "",
};
export function ProfileEditor({
  project,
  onSaved,
  ...props
}: EditorProps & { project?: Project; onSaved: (id: string) => void }) {
  const [markDirty, isDirty] = useEditorDirty(
    "profile-" + (project?.id ?? "new"),
  );
  useEffect(() => {
    if (project && !isDirty) setProfile(project.profile);
  }, [project?.revision]);
  const [profile, setProfile] = useState(project?.profile ?? emptyProfile),
    [error, setError] = useState("");
  function edit<K extends keyof Profile>(key: K, value: Profile[K]) {
    setProfile({ ...profile, [key]: value });
    markDirty(true);
  }
  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const parsed = ProfileSchema.safeParse(profile);
    if (!parsed.success) {
      setError(
        parsed.error.issues
          .map((x) => `${x.path.join(".")}: ${x.message}`)
          .join(" "),
      );
      return;
    }
    setError("");
    const result = await props.mutate({
      type: "saveProject",
      id: project?.id,
      profile: parsed.data,
    });
    if (result?.selectedId) {
      markDirty(false);
      onSaved(result.selectedId);
    }
  }
  return (
    <form onSubmit={submit} className="card form-stack">
      <div className="section-heading">
        <div>
          <p className="eyebrow">01 / RESEARCH CONTEXT</p>
          <h2>{project ? "Project profile" : "Create a project"}</h2>
        </div>
        {project?.provenance === "demo" && (
          <Badge tone="amber">Synthetic project</Badge>
        )}
      </div>
      <p className="muted">
        Record what you know. Leave unknown facts blank; project facts are
        researcher claims.
      </p>
      <Field label="Project title">
        <input
          required
          value={profile.title}
          onChange={(e) => edit("title", e.target.value)}
          maxLength={500}
        />
      </Field>
      <Field label="Short abstract">
        <textarea
          rows={4}
          value={profile.abstract}
          onChange={(e) => edit("abstract", e.target.value)}
          maxLength={5000}
        />
      </Field>
      <Field
        label="Topic tags"
        hint="Comma-separated; used for transparent relevance preferences."
      >
        <input
          value={profile.tags.join(", ")}
          onChange={(e) =>
            edit(
              "tags",
              e.target.value.split(",").map((s) => s.trimStart()),
            )
          }
          onBlur={() =>
            setProfile({
              ...profile,
              tags: profile.tags.map((s) => s.trim()).filter(Boolean),
            })
          }
        />
      </Field>
      <div className="form-grid">
        <Field label="Applicant type">
          <input
            list="applicant-types"
            placeholder="Unknown"
            value={profile.applicantType}
            onChange={(e) => edit("applicantType", e.target.value)}
          />
          <datalist id="applicant-types">
            <option>University</option>
            <option>Nonprofit</option>
            <option>For-profit company</option>
            <option>Individual</option>
          </datalist>
        </Field>
        <Field label="Career stage">
          <input
            list="career-stages"
            placeholder="Unknown"
            value={profile.careerStage}
            onChange={(e) => edit("careerStage", e.target.value)}
          />
          <datalist id="career-stages">
            <option>Early career</option>
            <option>Established investigator</option>
            <option>Graduate student</option>
          </datalist>
        </Field>
        <Field label="Institution">
          <input
            placeholder="Unknown"
            value={profile.institution}
            onChange={(e) => edit("institution", e.target.value)}
          />
        </Field>
        <Field label="Country / region">
          <input
            placeholder="Unknown"
            value={profile.country}
            onChange={(e) => edit("country", e.target.value)}
          />
        </Field>
        <Field label="Approximate funding need">
          <input
            type="number"
            min="0"
            step="0.01"
            value={profile.fundingNeed ?? ""}
            onChange={(e) => edit("fundingNeed", numberOrNull(e.target.value))}
          />
        </Field>
        <Field label="Currency code">
          <input
            required
            maxLength={3}
            value={profile.currency}
            onChange={(e) => edit("currency", e.target.value.toUpperCase())}
          />
        </Field>
        <Field label="Intended start">
          <input
            type="date"
            value={profile.startDate}
            onChange={(e) => edit("startDate", e.target.value)}
          />
        </Field>
        <Field label="Intended end">
          <input
            type="date"
            value={profile.endDate}
            onChange={(e) => edit("endDate", e.target.value)}
          />
        </Field>
      </div>
      <Field label="Known eligibility facts and uncertainties">
        <textarea
          rows={3}
          value={profile.knownFacts}
          onChange={(e) => edit("knownFacts", e.target.value)}
          maxLength={5000}
        />
      </Field>
      {error && (
        <p role="alert" className="error">
          {error}
        </p>
      )}
      <button className="primary" disabled={props.busy}>
        {props.busy ? "Saving…" : "Save project"}
      </button>
      {project && (
        <p className="muted">
          Revision {project.revision} · {project.history.length} earlier
          profiles retained · saved{" "}
          {new Date(project.updatedAt).toLocaleString()}
        </p>
      )}
    </form>
  );
}
function SourceEditor({
  source,
  project,
  ...props
}: EditorProps & { source?: Source; project: Project }) {
  const [markDirty] = useEditorDirty(
    "source-" + (source?.id ?? "new-" + project.id),
  );
  const [title, setTitle] = useState(source?.title ?? ""),
    [type, setType] = useState<Source["type"]>(source?.type ?? "methods"),
    [text, setText] = useState(source ? latest(source).text : ""),
    [url, setUrl] = useState(source?.url ?? ""),
    [error, setError] = useState("");
  const changed = () => markDirty(true);
  async function intake(file?: File) {
    if (!file) return;
    try {
      if (!/\.(txt|md|markdown)$/i.test(file.name))
        throw new Error(
          "Choose a UTF-8 .txt or .md file. PDF and DOCX are future roadmap goals.",
        );
      if (file.size > 80_000)
        throw new Error(
          "File is too large. Each source supports at most 20,000 characters.",
        );
      const value = new TextDecoder("utf-8", { fatal: true }).decode(
        await file.arrayBuffer(),
      );
      if (value.length > 20_000)
        throw new Error(
          "This text exceeds 20,000 characters. Split it into shorter source notes.",
        );
      setText(value);
      if (!title) setTitle(file.name);
      setError("");
      changed();
    } catch (e) {
      setError((e as Error).message);
    }
  }
  async function save(e: React.FormEvent) {
    e.preventDefault();
    if (text.length > 20_000) {
      setError("Reduce this source to 20,000 characters.");
      return;
    }
    const out = await props.mutate({
      type: "saveSource",
      id: source?.id,
      projectId: project.id,
      title,
      sourceType: type,
      text,
      url,
    });
    if (out) markDirty(false);
    if (out && !source) {
      setTitle("");
      setText("");
      setUrl("");
    }
  }
  return (
    <form onSubmit={save} className="form-stack source-editor">
      <div className="form-grid">
        <Field label="Source title">
          <input
            required
            value={title}
            onChange={(e) => {
              setTitle(e.target.value);
              changed();
            }}
            maxLength={500}
          />
        </Field>
        <Field label="Evidence type">
          <select
            value={type}
            onChange={(e) => {
              setType(e.target.value as Source["type"]);
              changed();
            }}
          >
            <option value="preliminary">Preliminary work</option>
            <option value="methods">Methods</option>
            <option value="team">Team qualifications</option>
            <option value="facilities">Facilities</option>
            <option value="other">Other notes</option>
          </select>
        </Field>
      </div>
      <Field
        label="Optional source URL"
        hint="Saving a URL does not fetch or verify its content."
      >
        <input
          type="url"
          value={url}
          onChange={(e) => {
            setUrl(e.target.value);
            changed();
          }}
        />
      </Field>
      <Field label="Pasted evidence text">
        <textarea
          required
          rows={6}
          value={text}
          onChange={(e) => {
            setText(e.target.value);
            changed();
          }}
          aria-describedby="source-limit"
        />
      </Field>
      <div className="row spread">
        <span
          id="source-limit"
          className={text.length > 20_000 ? "error" : "muted"}
        >
          {text.length.toLocaleString()} / 20,000 characters
        </span>
        <Field label="Or import UTF-8 text">
          <input
            type="file"
            accept=".txt,.md,.markdown,text/plain,text/markdown"
            onChange={(e) => void intake(e.target.files?.[0])}
          />
        </Field>
      </div>
      {error && (
        <p className="error" role="alert">
          {error}
        </p>
      )}
      <button
        disabled={
          props.busy ||
          (!source &&
            props.state.sources.filter((s) => s.projectId === project.id)
              .length >= 10)
        }
      >
        {source ? "Save new source version" : "Add evidence source"}
      </button>
    </form>
  );
}
export function ProjectPanel(
  props: EditorProps & { project: Project; onSaved: (id: string) => void },
) {
  const sources = props.state.sources.filter(
    (s) => s.projectId === props.project.id,
  );
  return (
    <div>
      <div className="two-column">
        <ProfileEditor {...props} key={props.project.id} />
        <section className="card">
          <p className="eyebrow">SOURCE LIBRARY</p>
          <h2>Evidence you can inspect</h2>
          <p className="muted">
            {sources.length} / 10 sources. Pasted text or UTF-8 TXT/Markdown
            only. Material edits preserve old versions and mark dependent drafts
            stale.
          </p>
          {sources.length === 0 && (
            <div className="empty">
              Add methods, preliminary work, team or facilities notes to support
              this project.
            </div>
          )}
          <div className="source-list">
            {sources.map((source) => (
              <article key={source.id}>
                <div className="row spread">
                  <h3>{source.title}</h3>
                  <Badge>
                    {source.type} · v{latest(source).version}
                  </Badge>
                </div>
                <SourceText source={source} key={latest(source).hash} />
                <details>
                  <summary>Edit source / preserve previous version</summary>
                  <SourceEditor {...props} source={source} key={source.id} />
                </details>
              </article>
            ))}
          </div>
          <details open={sources.length === 0}>
            <summary>Add a source</summary>
            <SourceEditor {...props} />
          </details>
        </section>
      </div>
      <VaultPanel {...props} projectId={props.project.id} />
      <EthicsPanel {...props} projectId={props.project.id} />
    </div>
  );
}
