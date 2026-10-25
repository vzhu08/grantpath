"use client";
import { apiErrorMessage } from "../lib/api-error";
import { useContext, useEffect, useRef, useState } from "react";
import { cite, latest } from "../lib/evidence";
import { readiness, wordCount, type Issue } from "../lib/readiness";
import {
  snapshotInputsMatch,
  contentSourceFingerprint,
} from "../lib/proposals/checks";
import {
  ProposalDocumentSchema,
  textBlocks,
  visibleText,
  type ProposalBlock,
} from "../lib/proposals/blocks";
import {
  NSF_STANDARD_RESEARCH_TEMPLATE,
  exportComponentPlan,
  resolveTemplate,
  type ApplicabilityAnswers,
  type TemplateManifest,
} from "../lib/proposals/nsf-template";
import {
  ProposalExportSchema,
  type Application,
  type Citation,
  type ContentItem,
  type DraftRevision,
  type DraftSection,
  type PacketSnapshot,
  type Proposal,
  type ProposalExport,
  type State,
} from "../lib/schema";
import {
  Badge,
  CitationView,
  EditorRegistry,
  Field,
  SourceText,
  useEditorDirty,
  type EditorProps,
} from "./common";
import { BlockPreview, ProposalBlockEditor } from "./proposal-block-editor";

type Props = EditorProps & { app: Application };
type Mapping = {
  requirementId: string;
  sectionId: string | null;
  note: string;
};
const legacyMapping: Record<string, string> = {
  summary: "summary-overview",
  significance: "description-context",
  approach: "description-methods",
};

/** A preview of the server's legacy migration, without modifying saved drafts. */
export function adoptionPreview(app: Application) {
  return app.sections
    .filter((section) => legacyMapping[section.key])
    .map((section) => ({
      from: section.label,
      to: legacyMapping[section.key]!,
      revisions: section.revisions.length,
      words: wordCount(section.revisions.at(-1)?.text ?? ""),
    }));
}
export function sectionStatus(section: DraftSection) {
  const revision = section.revisions.at(-1);
  if (!revision?.text.trim()) return "Missing";
  return section.reviews?.some((review) => review.revisionId === revision.id)
    ? "Reviewed"
    : "Needs review";
}
/** Measurements describe one frozen input set and must never certify later edits. */
export function snapshotMatchesApplication(
  snapshot: PacketSnapshot,
  app: Application,
  state: State,
) {
  return snapshotInputsMatch(snapshot, state, app);
}
function revisionBlocks(revision?: DraftRevision): ProposalBlock[] {
  return revision?.blocks ?? textBlocks(revision?.text ?? "");
}
function errorText(error: unknown) {
  return error instanceof Error
    ? error.message
    : "The action failed. Saved inputs remain available.";
}

function TemplateSetup(props: Props) {
  const binding = props.app.binding;
  const manifest = binding?.manifest ?? NSF_STANDARD_RESEARCH_TEMPLATE;
  const [choice, setChoice] = useState<
    "legacy-three-section" | "nsf-standard-research"
  >(binding?.templateId ?? "legacy-three-section");
  const [answers, setAnswers] = useState<ApplicabilityAnswers>(
    binding?.answers ?? {},
  );
  const [mappings, setMappings] = useState<Mapping[]>(() =>
    props.app.requirements.map(
      (req) =>
        binding?.mappings.find(
          (mapping) => mapping.requirementId === req.id,
        ) ?? {
          requirementId: req.id,
          sectionId: legacyMapping[req.sectionKey ?? ""] ?? null,
          note: "",
        },
    ),
  );
  const [by, setBy] = useState(binding?.confirmedBy ?? ""),
    [note, setNote] = useState(""),
    [confirmed, setConfirmed] = useState(false),
    [pending, setPending] = useState(false);
  const [markDirty, edited] = useEditorDirty(
    "proposal-template-" + props.app.id,
  );
  const registry = useContext(EditorRegistry);
  const otherDirty = Object.entries(registry.ids).some(
    ([key, value]) => value && key !== "proposal-template-" + props.app.id,
  );
  const edit = () => {
    markDirty(true);
    setConfirmed(false);
  };
  useEffect(() => {
    if (edited) return;
    setAnswers(binding?.answers ?? {});
    setMappings(
      props.app.requirements.map(
        (req) =>
          binding?.mappings.find(
            (mapping) => mapping.requirementId === req.id,
          ) ?? {
            requirementId: req.id,
            sectionId: legacyMapping[req.sectionKey ?? ""] ?? null,
            note: "",
          },
      ),
    );
    setBy(binding?.confirmedBy ?? "");
  }, [binding?.revision, props.app.requirements, edited]);
  const resolved = resolveTemplate(manifest, answers);
  async function adopt() {
    setPending(true);
    try {
      const result = await props.mutate({
        type: "adoptTemplate",
        applicationId: props.app.id,
        templateId: choice,
      });
      if (result) {
        markDirty(false);
        setNote("");
        setConfirmed(false);
      }
    } finally {
      setPending(false);
    }
  }
  async function confirm() {
    setPending(true);
    try {
      const result = await props.mutate({
        type: "confirmTemplate",
        applicationId: props.app.id,
        answers,
        mappings,
        by: by.trim(),
        note: note.trim(),
      });
      if (result) {
        markDirty(false);
        setNote("");
        setConfirmed(false);
      }
    } finally {
      setPending(false);
    }
  }
  return (
    <section
      className="card form-stack"
      aria-labelledby="proposal-template-heading"
    >
      <div className="row spread">
        <div>
          <p className="eyebrow">PROPOSAL STRUCTURE</p>
          <h2 id="proposal-template-heading">
            Choose and confirm the proposal template
          </h2>
        </div>
        <Badge tone={binding?.confirmedAt ? "green" : "amber"}>
          {binding?.confirmedAt
            ? `Confirmed binding r${binding.revision}`
            : "Researcher confirmation needed"}
        </Badge>
      </div>
      <Field label="Proposal template">
        <select
          value={choice}
          disabled={props.busy || pending}
          onChange={(event) => setChoice(event.target.value as typeof choice)}
        >
          <option value="legacy-three-section">
            Legacy three-section starter
          </option>
          <option value="nsf-standard-research">
            NSF Standard Research · v{NSF_STANDARD_RESEARCH_TEMPLATE.version}
          </option>
        </select>
      </Field>
      {choice !== (binding?.templateId ?? "legacy-three-section") && (
        <section className="criterion">
          <h3>Adoption preview</h3>
          <p>
            Current sections and their histories will be archived. New sections
            need researcher review. Template adoption does not confirm the call
            mapping.
          </p>
          {choice === "nsf-standard-research" ? (
            <>
              <p>
                {
                  manifest.sections.filter(
                    (section) => section.kind === "content",
                  ).length
                }{" "}
                structured sections. Existing starter text is copied as follows:
              </p>
              <ul>
                {adoptionPreview(props.app).map((mapping) => (
                  <li key={mapping.to}>
                    {mapping.from} →{" "}
                    {manifest.sections.find(
                      (section) => section.id === mapping.to,
                    )?.heading ?? mapping.to}{" "}
                    · {mapping.words} words · {mapping.revisions} retained
                    revisions
                  </li>
                ))}
              </ul>
              <p className="muted">
                All other sections start empty. Archived text remains available
                below.
              </p>
            </>
          ) : (
            <p>
              The most recent archived starter sections will be restored where
              available. Full-proposal history remains archived.
            </p>
          )}
          <button
            className="primary"
            disabled={props.busy || pending || edited || otherDirty}
            onClick={() => void adopt()}
          >
            Adopt this template and retain history
          </button>
          {(edited || otherDirty) && (
            <p className="muted">
              Save or discard unsaved edits before changing templates.
            </p>
          )}
        </section>
      )}
      {binding?.templateId === "nsf-standard-research" && (
        <>
          <p>{manifest.coverage.notice}</p>
          <p className="muted">
            Pinned template v{manifest.version} · policy checked{" "}
            {manifest.checkedAt} · render profile {manifest.renderProfileId}.
            Review current call instructions and record any differences.
          </p>
          <details>
            <summary>Policy sources, effective dates and excerpts</summary>
            {manifest.sources.map((source) => (
              <article className="criterion" key={source.id}>
                <h4>
                  <a href={source.url} target="_blank" rel="noreferrer">
                    {source.title}
                  </a>
                </h4>
                <p>
                  Checked {source.checkedAt} · {source.checkedBy}
                </p>
                <p>Effective: {source.effective}</p>
                <blockquote>{source.excerpt}</blockquote>
                {source.supersedes.map((previous) => (
                  <p className="muted" key={previous.sourceId}>
                    Supersedes {previous.sourceId}: {previous.scope}
                  </p>
                ))}
              </article>
            ))}
          </details>
          <fieldset
            disabled={props.busy || pending}
            style={{ border: 0, padding: 0 }}
          >
            <legend>
              <h3>Applicability and supported scope</h3>
            </legend>
            <div className="form-grid">
              {manifest.questions.map((question) => (
                <Field
                  key={question.id}
                  label={question.prompt}
                  hint={question.help}
                >
                  <select
                    value={answers[question.id] ?? "unknown"}
                    onChange={(event) => {
                      setAnswers({
                        ...answers,
                        [question.id]: event.target.value,
                      });
                      edit();
                    }}
                  >
                    <option value="unknown">Unknown / not reviewed</option>
                    <option value="yes">Yes</option>
                    <option value="no">No</option>
                  </select>
                </Field>
              ))}
            </div>
          </fieldset>
          {resolved.coverageFindings.length > 0 && (
            <ul>
              {resolved.coverageFindings.map((finding) => (
                <li key={finding.questionId}>
                  <Badge tone="amber">{finding.status}</Badge> {finding.message}
                </li>
              ))}
            </ul>
          )}
          <h3>Map call requirements to proposal sections</h3>
          <p className="muted">
            Each call requirement remains visible. Use “External / no narrative
            section” for sponsor actions or uploads and explain the decision.
          </p>
          {props.app.requirements.length === 0 && (
            <p>
              No call requirements have been extracted. Review the complete call
              in the checklist before confirming.
            </p>
          )}
          {props.app.requirements.map((req) => {
            const mapping = mappings.find(
              (row) => row.requirementId === req.id,
            ) ?? { requirementId: req.id, sectionId: null, note: "" };
            function change(next: Partial<Mapping>) {
              setMappings((rows) => [
                ...rows.filter((row) => row.requirementId !== req.id),
                { ...mapping, ...next },
              ]);
              edit();
            }
            return (
              <article className="criterion" key={req.id}>
                <strong>{req.description}</strong>
                <div className="form-grid">
                  <Field label={`Destination for ${req.description}`}>
                    <select
                      value={mapping.sectionId ?? ""}
                      onChange={(event) =>
                        change({ sectionId: event.target.value || null })
                      }
                    >
                      <option value="">External / no narrative section</option>
                      {manifest.sections
                        .filter((section) => section.kind === "content")
                        .map((section) => (
                          <option key={section.id} value={section.id}>
                            {section.heading}
                          </option>
                        ))}
                    </select>
                  </Field>
                  <Field label={`Mapping rationale for ${req.description}`}>
                    <input
                      value={mapping.note}
                      maxLength={1000}
                      onChange={(event) => change({ note: event.target.value })}
                    />
                  </Field>
                </div>
              </article>
            );
          })}
          <div className="form-grid">
            <Field label="Researcher confirming applicability and mapping">
              <input
                value={by}
                maxLength={100}
                onChange={(event) => {
                  setBy(event.target.value);
                  edit();
                }}
              />
            </Field>
            <Field
              label="Confirmation note"
              hint="Record what you reviewed and any call-specific decisions (at least 5 characters)."
            >
              <textarea
                rows={2}
                value={note}
                maxLength={2000}
                onChange={(event) => {
                  setNote(event.target.value);
                  edit();
                }}
              />
            </Field>
          </div>
          <label className="check">
            <input
              type="checkbox"
              checked={confirmed}
              onChange={(event) => setConfirmed(event.target.checked)}
            />{" "}
            I reviewed the call, applicability answers, mapping and supported
            template scope.
          </label>
          <div className="row">
            <button
              className="primary"
              disabled={
                props.busy ||
                pending ||
                !confirmed ||
                !by.trim() ||
                note.trim().length < 5 ||
                otherDirty
              }
              onClick={() => void confirm()}
            >
              Confirm applicability and call mapping
            </button>
            {edited && (
              <button
                disabled={pending || props.busy}
                onClick={() => {
                  markDirty(false);
                  setNote("");
                  setConfirmed(false);
                }}
              >
                Discard mapping edits
              </button>
            )}
          </div>
          {binding.confirmedAt && (
            <p className="muted">
              Last confirmed by {binding.confirmedBy} at {binding.confirmedAt}:{" "}
              {binding.confirmationNote}. A change to the call can require
              confirmation again.
            </p>
          )}
        </>
      )}
    </section>
  );
}

function SectionEditor(
  props: Props & {
    section: DraftSection;
    manifest: TemplateManifest;
    applicability: string;
    sharedBusy: boolean;
  },
) {
  const section = props.section,
    saved = section.revisions.at(-1);
  const [markDirty, edited] = useEditorDirty(
    "proposal-section-" + props.app.id + "-" + section.key,
  );
  const [blocks, setBlocks] = useState<ProposalBlock[]>(revisionBlocks(saved)),
    [citations, setCitations] = useState<Citation[]>(saved?.citations ?? []);
  const sources = props.state.sources.filter(
    (source) => source.projectId === props.app.projectId,
  );
  const [selected, setSelected] = useState<string[]>(
    saved?.selectedSources.map((source) => source.sourceId) ??
      sources.map((source) => source.id),
  );
  const [quoteSource, setQuoteSource] = useState(sources[0]?.id ?? ""),
    [quote, setQuote] = useState(""),
    [by, setBy] = useState("");
  const [pending, setPending] = useState(false),
    [error, setError] = useState(""),
    [mode, setMode] = useState<"fixture" | "live">(
      props.app.provenance === "demo" ? "fixture" : "live",
    ),
    [consent, setConsent] = useState(false);
  const [preview, setPreview] = useState<{
    proposal: Proposal;
    token: string;
    mode: string;
  } | null>(null);
  const [libraryTitle, setLibraryTitle] = useState(section.label),
    [category, setCategory] = useState<ContentItem["category"]>("other"),
    [scope, setScope] = useState(""),
    [updateItem, setUpdateItem] = useState("");
  const controller = useRef<AbortController | null>(null);
  useEffect(() => () => controller.current?.abort(), []);
  useEffect(() => {
    if (edited) return;
    setBlocks(revisionBlocks(saved));
    setCitations(saved?.citations ?? []);
    setSelected(
      saved?.selectedSources.map((source) => source.sourceId) ??
        sources.map((source) => source.id),
    );
  }, [saved?.id, edited]);
  const definition = props.manifest.sections.find(
    (item) => item.id === section.key,
  )!;
  const text = visibleText({ blocks }),
    validation = ProposalDocumentSchema.safeParse({ blocks });
  const call = props.state.opportunities.find(
    (item) => item.id === props.app.opportunityId,
  );
  const project = props.state.projects.find(
    (item) => item.id === props.app.projectId,
  );
  const stale =
    !!saved &&
    (saved.bindingRevision !== props.app.binding?.revision ||
      saved.callRevision !== call?.revision ||
      saved.callSourceVersion !== call?.sourceVersion ||
      saved.projectRevision !== project?.revision ||
      saved.selectedSources.some((ref) => {
        const source = props.state.sources.find(
          (item) => item.id === ref.sourceId,
        );
        return (
          !source ||
          latest(source).version !== ref.version ||
          latest(source).hash !== ref.hash
        );
      }));
  const blocked = props.busy || pending || props.sharedBusy;
  function edit() {
    markDirty(true);
  }
  async function saveGenerated(token?: string) {
    setError("");
    setPending(true);
    try {
      const result = await props.mutate({
        type: "saveDraft",
        applicationId: props.app.id,
        sectionKey: section.key,
        label: definition.heading,
        wordLimit: section.wordLimit,
        text: token ? preview!.proposal.text : text,
        blocks: token ? textBlocks(preview!.proposal.text) : blocks,
        sourceIds: selected,
        citations: token ? preview!.proposal.citations : citations,
        proposalToken: token,
      });
      if (result) {
        const next = result.state.applications
          .find((app) => app.id === props.app.id)
          ?.sections.find((item) => item.key === section.key)
          ?.revisions.at(-1);
        setBlocks(revisionBlocks(next));
        setCitations(next?.citations ?? []);
        setPreview(null);
        markDirty(false);
      }
    } catch (error) {
      setError(errorText(error));
    } finally {
      setPending(false);
    }
  }
  async function generate() {
    setError("");
    setPending(true);
    const abort = new AbortController();
    controller.current = abort;
    try {
      const response = await fetch("/api/generate", {
        method: "POST",
        headers: { "content-type": "application/json" },
        signal: abort.signal,
        body: JSON.stringify({
          applicationId: props.app.id,
          sectionKey: section.key,
          sourceIds: selected,
          mode,
          confirmUsage: consent,
          expectedRevision: props.state.revision,
        }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(apiErrorMessage(data.error, "Generation failed."));
      setPreview(data);
    } catch (error) {
      if (!abort.signal.aborted) setError(errorText(error));
    } finally {
      setPending(false);
      controller.current = null;
    }
  }
  function restore(revision: DraftRevision) {
    if (
      edited &&
      !window.confirm(
        "Replace this section’s unsaved edits with the retained revision?",
      )
    )
      return;
    setBlocks(revisionBlocks(revision));
    setCitations(revision.citations);
    setSelected(revision.selectedSources.map((source) => source.sourceId));
    setPreview(null);
    edit();
  }
  async function librarySave() {
    setPending(true);
    try {
      const result = await props.mutate({
        type: "saveContent",
        applicationId: props.app.id,
        sectionKey: section.key,
        itemId: updateItem || undefined,
        title: libraryTitle,
        category,
        scope,
      });
      if (result) setScope("");
    } finally {
      setPending(false);
    }
  }
  return (
    <article
      className="card form-stack"
      aria-labelledby={`section-${props.app.id}-${section.key}`}
    >
      <div className="row spread">
        <div>
          <h2 id={`section-${props.app.id}-${section.key}`}>
            {definition.heading}
          </h2>
          <p className="muted">{definition.instructions}</p>
        </div>
        <div className="row">
          <Badge
            tone={
              props.applicability === "not-applicable" ? "neutral" : "amber"
            }
          >
            {props.applicability}
          </Badge>
          <Badge
            tone={sectionStatus(section) === "Reviewed" ? "green" : "amber"}
          >
            {sectionStatus(section)}
          </Badge>
          {edited && <Badge tone="amber">Unsaved edits</Badge>}
        </div>
      </div>
      <p className="muted">
        {wordCount(text)} words
        {section.wordLimit !== null
          ? ` / ${section.wordLimit} section word limit`
          : " · no section word limit"}
        .{" "}
        {definition.limits.pages
          ? `Nested page limit: ${definition.limits.pages}. `
          : ""}
        Page compliance is measured from the exported PDF for the complete
        component.
      </p>
      {stale && (
        <p className="error">
          Saved draft inputs changed. Review the current project, call, template
          and selected evidence, then save a new section revision even if its
          text stays the same.
        </p>
      )}
      {props.applicability === "not-applicable" && (
        <p className="muted">
          This section is excluded by the confirmed applicability answers. Its
          saved history remains available.
        </p>
      )}
      {definition.requiredHeadings.length > 0 && (
        <p>Required headings: {definition.requiredHeadings.join("; ")}</p>
      )}
      <ProposalBlockEditor
        blocks={blocks}
        disabled={blocked}
        onChange={(next) => {
          setBlocks(next);
          edit();
        }}
      />
      {!validation.success && (
        <p role="alert" className="error">
          {validation.error.issues[0]?.message}
        </p>
      )}
      {text.length > 20_000 && (
        <p role="alert" className="error">
          Section text exceeds 20,000 characters. Split or shorten the content
          before saving.
        </p>
      )}
      <details>
        <summary>Preview structured content</summary>
        <BlockPreview blocks={blocks} />
      </details>
      <details>
        <summary>
          Evidence selection and exact quotations · {citations.length} citations
        </summary>
        <div className="form-stack">
          <p className="muted">
            Selected sources are available to generation and recorded with the
            revision. Quotations keep the exact source version and text offsets.
          </p>
          {sources.map((source) => (
            <div key={source.id}>
              <label className="check">
                <input
                  type="checkbox"
                  disabled={blocked}
                  checked={selected.includes(source.id)}
                  onChange={(event) => {
                    setSelected(
                      event.target.checked
                        ? [...selected, source.id]
                        : selected.filter((id) => id !== source.id),
                    );
                    edit();
                  }}
                />{" "}
                {source.title} · v{latest(source).version} ·{" "}
                {source.provenance === "demo"
                  ? "Fictional demo"
                  : "Researcher-provided"}
              </label>
              <SourceText source={source} />
            </div>
          ))}
          {sources.length === 0 && (
            <p>Add project evidence in the source workspace first.</p>
          )}
          <Field label="Quotation source">
            <select
              value={quoteSource}
              disabled={blocked}
              onChange={(event) => setQuoteSource(event.target.value)}
            >
              <option value="">Choose a source</option>
              {sources.map((source) => (
                <option key={source.id} value={source.id}>
                  {source.title}
                </option>
              ))}
            </select>
          </Field>
          <Field
            label="Exact quotation"
            hint="Paste text exactly as shown in the normalized source."
          >
            <textarea
              value={quote}
              rows={3}
              disabled={blocked}
              onChange={(event) => setQuote(event.target.value)}
            />
          </Field>
          <button
            disabled={blocked || !quote || !quoteSource}
            onClick={() => {
              try {
                const source = sources.find(
                  (source) => source.id === quoteSource,
                );
                if (!source)
                  throw new Error("Select a current project source.");
                const citation = cite(source, quote);
                setCitations([...citations, citation]);
                setSelected([...new Set([...selected, source.id])]);
                setQuote("");
                setError("");
                edit();
              } catch (error) {
                setError(errorText(error));
              }
            }}
          >
            Attach exact quotation
          </button>
          {citations.map((citation, index) => (
            <div key={`${citation.sourceId}-${citation.start}-${index}`}>
              <CitationView citation={citation} state={props.state} />
              <button
                disabled={blocked}
                onClick={() => {
                  setCitations(citations.filter((_, i) => i !== index));
                  edit();
                }}
              >
                Remove quotation {index + 1}
              </button>
            </div>
          ))}
        </div>
      </details>
      <div className="row actions">
        <button
          className="primary"
          disabled={
            blocked ||
            (!edited && !stale) ||
            !validation.success ||
            text.length > 20_000
          }
          onClick={() => void saveGenerated()}
        >
          Save section revision
        </button>
        <button
          disabled={blocked || !edited}
          onClick={() => {
            setBlocks(revisionBlocks(saved));
            setCitations(saved?.citations ?? []);
            setSelected(
              saved?.selectedSources.map((source) => source.sourceId) ?? [],
            );
            setPreview(null);
            markDirty(false);
          }}
        >
          Discard unsaved section edits
        </button>
      </div>
      <div className="form-grid">
        <Field label="Researcher reviewing this saved revision">
          <input
            value={by}
            maxLength={100}
            onChange={(event) => setBy(event.target.value)}
          />
        </Field>
        <div>
          <p>
            Review applies to the exact saved revision. Editing creates a new
            revision that needs review.
          </p>
          <button
            disabled={
              blocked ||
              edited ||
              !saved ||
              !by.trim() ||
              !saved.text.trim() ||
              sectionStatus(section) === "Reviewed"
            }
            onClick={() =>
              void props.mutate({
                type: "reviewSection",
                applicationId: props.app.id,
                sectionKey: section.key,
                revisionId: saved!.id,
                by: by.trim(),
              })
            }
          >
            Mark saved revision reviewed
          </button>
        </div>
      </div>
      <details>
        <summary>Generate an evidence-grounded draft</summary>
        <div className="form-stack">
          <Field label="Generation mode">
            <select
              value={mode}
              disabled={blocked}
              onChange={(event) => {
                setMode(event.target.value as typeof mode);
                setConsent(false);
              }}
            >
              <option value="live">Live model</option>
              {props.app.provenance === "demo" && (
                <option value="fixture">Fictional fixture</option>
              )}
            </select>
          </Field>
          {mode === "live" && (
            <label className="check">
              <input
                type="checkbox"
                checked={consent}
                disabled={blocked}
                onChange={(event) => setConsent(event.target.checked)}
              />{" "}
              I authorize sending selected inputs to the configured model and
              any associated usage.
            </label>
          )}
          <div className="row">
            <button
              disabled={blocked || (mode === "live" && !consent)}
              onClick={() => void generate()}
            >
              Generate proposal preview
            </button>
            {pending && controller.current && (
              <button onClick={() => controller.current?.abort()}>
                Cancel generation
              </button>
            )}
          </div>
          <p className="muted">
            Generation produces a reviewable preview. Missing information
            remains explicit. Save manual edits before accepting a preview.
          </p>
        </div>
      </details>
      {preview && (
        <section className="criterion">
          <Badge tone="amber">
            {preview.mode === "fixture"
              ? "FICTIONAL FIXTURE"
              : "Live model preview"}{" "}
            · researcher review required
          </Badge>
          <BlockPreview blocks={textBlocks(preview.proposal.text)} />
          {preview.proposal.citations.map((citation, i) => (
            <CitationView key={i} citation={citation} state={props.state} />
          ))}
          <ul>
            {preview.proposal.missingInputs.map((missing, i) => (
              <li key={i}>Missing input: {missing}</li>
            ))}
          </ul>
          <div className="row">
            <button
              className="primary"
              disabled={blocked || edited}
              onClick={() => void saveGenerated(preview.token)}
            >
              Accept preview as a new saved revision
            </button>
            <button disabled={blocked} onClick={() => setPreview(null)}>
              Discard generated preview
            </button>
          </div>
        </section>
      )}
      <details>
        <summary>Save approved reusable content from this section</summary>
        <p className="muted">
          Save the section first. Library versions retain the exact saved text,
          blocks, citations and origin; approval is a separate researcher
          action.
        </p>
        <div className="form-grid">
          <Field label="Library item to create or update">
            <select
              value={updateItem}
              onChange={(event) => setUpdateItem(event.target.value)}
            >
              <option value="">Create a new content item</option>
              {props.state.contentLibrary
                .filter(
                  (item) =>
                    item.projectId === props.app.projectId && !item.retiredAt,
                )
                .map((item) => (
                  <option key={item.id} value={item.id}>
                    New version of {item.title}
                  </option>
                ))}
            </select>
          </Field>
          <Field label="Reusable content title">
            <input
              value={libraryTitle}
              maxLength={200}
              onChange={(event) => setLibraryTitle(event.target.value)}
            />
          </Field>
          <Field label="Reusable content category">
            <select
              value={category}
              onChange={(event) =>
                setCategory(event.target.value as typeof category)
              }
            >
              {["methods", "facilities", "team", "biography", "other"].map(
                (value) => (
                  <option key={value} value={value}>
                    {value}
                  </option>
                ),
              )}
            </select>
          </Field>
          <Field
            label="Approved scope of reuse"
            hint="Describe appropriate uses and limits (at least 5 characters)."
          >
            <textarea
              value={scope}
              maxLength={2000}
              onChange={(event) => setScope(event.target.value)}
            />
          </Field>
        </div>
        <button
          disabled={
            blocked ||
            edited ||
            !saved?.text.trim() ||
            !libraryTitle.trim() ||
            scope.trim().length < 5
          }
          onClick={() => void librarySave()}
        >
          Save library version for approval
        </button>
      </details>
      <details>
        <summary>Saved history · {section.revisions.length} revisions</summary>
        {[...section.revisions].reverse().map((revision) => (
          <details key={revision.id}>
            <summary>
              {revision.createdAt} · {revision.mode} · project r
              {revision.projectRevision} / call r{revision.callRevision} ·{" "}
              {section.reviews?.some(
                (review) => review.revisionId === revision.id,
              )
                ? "reviewed"
                : "needs review"}
            </summary>
            <BlockPreview blocks={revisionBlocks(revision)} />
            <p className="muted">
              Revision {revision.id} · binding r
              {revision.bindingRevision ?? "legacy"} · prompt{" "}
              {revision.promptVersion}
            </p>
            {revision.missingInputs.length > 0 && (
              <ul>
                {revision.missingInputs.map((missing, i) => (
                  <li key={i}>{missing}</li>
                ))}
              </ul>
            )}
            {revision.citations.map((citation, i) => (
              <CitationView key={i} citation={citation} state={props.state} />
            ))}
            {revision.reusedContent?.map((item) => (
              <p key={item.itemId}>
                Reusable content {item.itemId} v{item.revision}:{" "}
                {item.contextNote}
              </p>
            ))}
            {section.reviews
              ?.filter((review) => review.revisionId === revision.id)
              .map((review, i) => (
                <p key={i}>
                  Reviewed by {review.by} at {review.at}
                </p>
              ))}
            <button disabled={blocked} onClick={() => restore(revision)}>
              Restore this revision into the editor
            </button>
          </details>
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

function LibraryItem(
  props: Props & {
    item: ContentItem;
    anyDirty: boolean;
    targetSection: string;
  },
) {
  const item = props.item,
    current = item.versions.at(-1)!;
  const [revision, setRevision] = useState(current.revision),
    [by, setBy] = useState(""),
    [contextNote, setContextNote] = useState(""),
    [confirmContext, setConfirmContext] = useState(false),
    [pending, setPending] = useState(false);
  const version =
    item.versions.find((value) => value.revision === revision) ?? current;
  const originProject = props.state.projects.find(
    (project) => project.id === item.projectId,
  );
  async function insert() {
    setPending(true);
    try {
      const result = await props.mutate({
        type: "insertContent",
        applicationId: props.app.id,
        sectionKey: props.targetSection,
        itemId: item.id,
        revision: version.revision,
        contextNote,
        confirmContext: true,
      });
      if (result) {
        setContextNote("");
        setConfirmContext(false);
      }
    } finally {
      setPending(false);
    }
  }
  return (
    <article className="criterion form-stack">
      <div className="row spread">
        <h3>{item.title}</h3>
        <Badge
          tone={
            item.retiredAt ? "neutral" : version.approvedAt ? "green" : "amber"
          }
        >
          {item.retiredAt
            ? "Retired"
            : version.approvedAt
              ? "Approved"
              : "Unapproved"}{" "}
          · v{version.revision}
        </Badge>
      </div>
      <p>
        {item.category} · {originProject?.profile.title ?? item.projectId} ·{" "}
        {item.projectId === props.app.projectId
          ? "Current project"
          : "Cross-project content"}
      </p>
      <p>
        Scope for v{version.revision}: {version.scope}
      </p>
      <p className="muted">Version category: {version.category}</p>
      <Field label={`Version of ${item.title}`}>
        <select
          value={revision}
          onChange={(event) => {
            setRevision(Number(event.target.value));
            setConfirmContext(false);
          }}
        >
          {[...item.versions].reverse().map((value) => (
            <option key={value.revision} value={value.revision}>
              v{value.revision} ·{" "}
              {value.approvedAt
                ? `approved by ${value.approvedBy}`
                : "unapproved"}
            </option>
          ))}
        </select>
      </Field>
      <details>
        <summary>Preview text and evidence before reuse</summary>
        <BlockPreview blocks={version.blocks} />
        <p className="muted">
          Origin application {version.originApplicationId} · section{" "}
          {version.originSectionKey} · revision {version.originRevisionId}
        </p>
        {version.approvedAt && (
          <p>
            Approved by {version.approvedBy} at {version.approvedAt}
          </p>
        )}
        {version.sources.map((source) => (
          <SourceText key={source.id} source={source} />
        ))}
        {version.citations.map((citation, i) => (
          <CitationView
            key={i}
            citation={citation}
            state={{
              ...props.state,
              sources: [
                ...version.sources,
                ...props.state.sources.filter(
                  (source) =>
                    !version.sources.some(
                      (original) => original.id === source.id,
                    ),
                ),
              ],
            }}
          />
        ))}
      </details>
      {!version.approvedAt && !item.retiredAt && (
        <div className="row">
          <Field
            label={`Researcher approving ${item.title} v${version.revision}`}
          >
            <input
              value={by}
              maxLength={100}
              onChange={(event) => setBy(event.target.value)}
            />
          </Field>
          <button
            disabled={props.busy || pending || !by.trim()}
            onClick={() =>
              void props.mutate({
                type: "approveContent",
                itemId: item.id,
                revision: version.revision,
                by: by.trim(),
              })
            }
          >
            Approve this exact version
          </button>
        </div>
      )}
      <Field
        label={`Context decision for ${item.title}`}
        hint="Explain how this content fits the destination proposal; review facts, dates, people and sponsor requirements."
      >
        <textarea
          value={contextNote}
          maxLength={2000}
          rows={2}
          onChange={(event) => {
            setContextNote(event.target.value);
            setConfirmContext(false);
          }}
        />
      </Field>
      <label className="check">
        <input
          type="checkbox"
          checked={confirmContext}
          onChange={(event) => setConfirmContext(event.target.checked)}
        />{" "}
        I reviewed this exact version and its evidence for the destination
        context.
      </label>
      <div className="row">
        <button
          className="primary"
          disabled={
            props.busy ||
            pending ||
            props.anyDirty ||
            !!item.retiredAt ||
            !version.approvedAt ||
            !props.targetSection ||
            contextNote.trim().length < 5 ||
            !confirmContext
          }
          onClick={() => void insert()}
        >
          Insert approved version into selected section
        </button>
        {!item.retiredAt && (
          <button
            disabled={props.busy || pending || props.anyDirty}
            onClick={() => {
              if (
                window.confirm(
                  `Retire “${item.title}”? Historical versions and existing uses remain available.`,
                )
              )
                void props.mutate({ type: "retireContent", itemId: item.id });
            }}
          >
            Retire content item
          </button>
        )}
      </div>
      {props.anyDirty && (
        <p className="muted">
          Save or discard unsaved proposal edits before insertion. Inserted
          content becomes a new saved revision that needs review.
        </p>
      )}
    </article>
  );
}
function ReuseDecision(
  props: Props & {
    section: DraftSection;
    item: ContentItem;
    used: { itemId: string; revision: number; contextNote: string };
    anyDirty: boolean;
  },
) {
  const [reason, setReason] = useState(""),
    current = props.item.versions.at(-1)!,
    old = props.item.versions.find(
      (version) => version.revision === props.used.revision,
    );
  const decision = props.app.reuseDecisions?.find(
    (value) =>
      value.itemId === props.item.id &&
      value.sectionKey === props.section.key &&
      value.seenRevision === current.revision &&
      value.sourceFingerprint ===
        contentSourceFingerprint(props.item, props.state),
  );
  const sourceChanged = old?.sources.some((source) => {
    const now = props.state.sources.find((item) => item.id === source.id);
    return (
      !now ||
      latest(now).version !== latest(source).version ||
      latest(now).hash !== latest(source).hash
    );
  });
  if ((current.revision <= props.used.revision && !sourceChanged) || decision)
    return null;
  return (
    <article className="criterion">
      <h4>
        {props.item.title}: v{props.used.revision} → v{current.revision} in{" "}
        {props.section.label}
      </h4>
      <p>
        Saved context decision: {props.used.contextNote}. Updates never change
        an existing proposal automatically.
      </p>
      {sourceChanged && (
        <p className="error">
          Original supporting evidence changed. Review the retained quotations
          against the current source, then keep the pinned copy with a reason or
          save and approve a new library version.
        </p>
      )}
      <div className="form-grid">
        <details>
          <summary>Version currently used</summary>
          <BlockPreview
            blocks={
              old?.blocks ??
              textBlocks(
                "Retained source version is unavailable; review the saved section.",
              )
            }
          />
        </details>
        <details>
          <summary>
            New library version ·{" "}
            {current.approvedAt ? "approved" : "unapproved"}
          </summary>
          <BlockPreview blocks={current.blocks} />
          <p>Version scope: {current.scope}</p>
          {current.sources.map((source) => (
            <SourceText key={source.id} source={source} />
          ))}
          {sourceChanged && (
            <details>
              <summary>Current upstream evidence</summary>
              {old?.sources.map((source) => {
                const now = props.state.sources.find(
                  (item) => item.id === source.id,
                );
                return now ? (
                  <SourceText key={now.id} source={now} />
                ) : (
                  <p key={source.id}>
                    Source {source.id} is no longer available.
                  </p>
                );
              })}
            </details>
          )}
        </details>
      </div>
      <Field label={`Reason to keep or apply ${props.item.title}`}>
        <textarea
          value={reason}
          maxLength={2000}
          rows={2}
          onChange={(event) => setReason(event.target.value)}
        />
      </Field>
      <div className="row">
        <button
          disabled={props.busy || props.anyDirty || reason.trim().length < 5}
          onClick={() =>
            void props.mutate({
              type: "resolveReuse",
              applicationId: props.app.id,
              sectionKey: props.section.key,
              itemId: props.item.id,
              action: "keep",
              reason,
            })
          }
        >
          Keep the currently used version
        </button>
        <button
          disabled={
            props.busy ||
            props.anyDirty ||
            !current.approvedAt ||
            current.revision === props.used.revision ||
            !!props.item.retiredAt ||
            reason.trim().length < 5
          }
          onClick={() =>
            void props.mutate({
              type: "resolveReuse",
              applicationId: props.app.id,
              sectionKey: props.section.key,
              itemId: props.item.id,
              action: "apply",
              reason,
            })
          }
        >
          Apply approved update as a new section revision
        </button>
      </div>
      <p className="muted">
        If the reused text was edited, compare it manually in the section
        editor; the server preserves those edits.
      </p>
    </article>
  );
}
function ContentLibrary(
  props: Props & { anyDirty: boolean; selected: string },
) {
  const [showRetired, setShowRetired] = useState(false),
    [target, setTarget] = useState(props.selected);
  const items = props.state.contentLibrary.filter(
    (item) => showRetired || !item.retiredAt,
  );
  return (
    <section className="card form-stack">
      <h2>Approved, versioned content library</h2>
      <p>
        Preview a specific version, review its scope and evidence, then record a
        context decision before reuse. New versions require approval and an
        explicit decision in each proposal.
      </p>
      <Field label="Destination section for library insertion">
        <select
          value={target}
          onChange={(event) => setTarget(event.target.value)}
        >
          {props.app.sections.map((section) => (
            <option key={section.key} value={section.key}>
              {section.label}
            </option>
          ))}
        </select>
      </Field>
      <label className="check">
        <input
          type="checkbox"
          checked={showRetired}
          onChange={(event) => setShowRetired(event.target.checked)}
        />{" "}
        Show retired items
      </label>
      {items.length === 0 && (
        <p className="muted">
          No content items yet. Save a section to the library, then approve that
          exact version.
        </p>
      )}
      {items.map((item) => (
        <details key={item.id}>
          <summary>
            {item.title} · {item.category} · latest v
            {item.versions.at(-1)?.revision}
            {item.retiredAt ? " · retired" : ""}
          </summary>
          <LibraryItem {...props} targetSection={target} item={item} />
        </details>
      ))}
      <h3>Review updates to content used in this proposal</h3>
      {props.app.sections.flatMap(
        (section) =>
          section.revisions.at(-1)?.reusedContent?.map((used) => {
            const item = props.state.contentLibrary.find(
              (item) => item.id === used.itemId,
            );
            return item ? (
              <ReuseDecision
                {...props}
                key={section.key + used.itemId}
                section={section}
                item={item}
                used={used}
              />
            ) : null;
          }) ?? [],
      )}
      {props.app.reuseDecisions?.length ? (
        <details>
          <summary>Retained keep-version decisions</summary>
          {props.app.reuseDecisions.map((decision, index) => (
            <p key={index}>
              {decision.sectionKey} · {decision.itemId} · reviewed library v
              {decision.seenRevision} at {decision.at}: {decision.reason}
            </p>
          ))}
        </details>
      ) : null}
    </section>
  );
}

function ReadinessIssue(props: Props & { issue: Issue }) {
  const [reason, setReason] = useState("");
  const issue = props.issue;
  return (
    <article className={`issue ${issue.waived ? "waived" : issue.severity}`}>
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
      <strong> {issue.location}</strong>
      <p>{issue.message}</p>
      <p className="muted">Fix: {issue.fix}</p>
      {issue.waived ? (
        <p>Researcher waiver: {issue.waived}</p>
      ) : /^(scope-|condition-|pages-)/.test(issue.id) ? (
        <p className="muted">
          Resolve this rule or measurement before marking the package prepared.
        </p>
      ) : (
        <details>
          <summary>Record an explicit exception</summary>
          <p className="muted">
            This records a reason for accepting a finding. It does not establish
            sponsor compliance or complete an external task.
          </p>
          <Field label={`Waiver reason for ${issue.location}`}>
            <textarea
              value={reason}
              rows={2}
              minLength={5}
              maxLength={1000}
              onChange={(event) => setReason(event.target.value)}
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
            Record waiver with reason
          </button>
        </details>
      )}
    </article>
  );
}

function ExternalTaskEditor(
  props: Props & {
    task: Pick<
      TemplateManifest["externalTasks"][number],
      "id" | "label" | "instructions"
    >;
    applicability: string;
  },
) {
  const record = props.app.externalTasks?.find(
    (task) => task.id === props.task.id,
  );
  const [status, setStatus] = useState<"Missing" | "In progress" | "Ready">(
    record?.status ?? "Missing",
  );
  const [note, setNote] = useState(record?.note ?? ""),
    [by, setBy] = useState(record?.by ?? "");
  const [pending, setPending] = useState(false);
  const [markDirty, edited] = useEditorDirty(
    "proposal-external-" + props.app.id + "-" + props.task.id,
  );
  useEffect(() => {
    if (!edited) {
      setStatus(record?.status ?? "Missing");
      setNote(record?.note ?? "");
      setBy(record?.by ?? "");
    }
  }, [record?.at, edited]);
  const stale =
    !!record && record.bindingRevision !== props.app.binding?.revision;
  async function save() {
    setPending(true);
    try {
      const result = await props.mutate({
        type: "setExternalTask",
        applicationId: props.app.id,
        id: props.task.id,
        status,
        note,
        by: by.trim(),
      });
      if (result) markDirty(false);
    } finally {
      setPending(false);
    }
  }
  return (
    <article className="criterion form-stack">
      <div className="row spread">
        <h3>{props.task.label}</h3>
        <Badge tone={record?.status === "Ready" && !stale ? "green" : "amber"}>
          {props.applicability} · {record?.status ?? "Missing"}
          {stale ? " · reconfirm for current binding" : ""}
        </Badge>
      </div>
      <p>{props.task.instructions}</p>
      <p className="muted">
        Record the actual external action for binding r
        {props.app.binding?.revision}. A worksheet or generated narrative does
        not complete the sponsor task.
      </p>
      <div className="form-grid">
        <Field label={`Status of ${props.task.label}`}>
          <select
            value={status}
            disabled={props.busy || pending}
            onChange={(event) => {
              setStatus(event.target.value as typeof status);
              markDirty(true);
            }}
          >
            <option>Missing</option>
            <option>In progress</option>
            <option>Ready</option>
          </select>
        </Field>
        <Field label={`Researcher recording ${props.task.label}`}>
          <input
            value={by}
            maxLength={100}
            disabled={props.busy || pending}
            onChange={(event) => {
              setBy(event.target.value);
              markDirty(true);
            }}
          />
        </Field>
      </div>
      <Field
        label={`External action note for ${props.task.label}`}
        hint="Record the completion evidence or remaining action (at least 5 characters)."
      >
        <textarea
          value={note}
          maxLength={3000}
          rows={2}
          disabled={props.busy || pending}
          onChange={(event) => {
            setNote(event.target.value);
            markDirty(true);
          }}
        />
      </Field>
      <div className="row">
        <button
          disabled={
            props.busy ||
            pending ||
            !by.trim() ||
            note.trim().length < 5 ||
            (!edited && !stale)
          }
          onClick={() => void save()}
        >
          Record researcher task status
        </button>
        {edited && (
          <button
            disabled={props.busy || pending}
            onClick={() => markDirty(false)}
          >
            Discard task edits
          </button>
        )}
      </div>
      {record && (
        <p className="muted">
          Last recorded by {record.by} at {record.at} for binding r
          {record.bindingRevision}: {record.note}
        </p>
      )}
    </article>
  );
}

function ExportJob({
  job,
  snapshot,
  state,
  onCancel,
  busy,
}: {
  job: ProposalExport;
  snapshot: PacketSnapshot;
  state: State;
  onCancel: () => void;
  busy: boolean;
}) {
  const app = state.applications.find(
    (app) => app.id === snapshot.applicationId,
  );
  const matches = app && snapshotMatchesApplication(snapshot, app, state);
  return (
    <article className="criterion form-stack">
      <div className="row">
        <Badge
          tone={
            job.status === "succeeded"
              ? "green"
              : job.status === "failed"
                ? "red"
                : "amber"
          }
        >
          {job.status}
        </Badge>
        <strong>Export {job.id}</strong>
      </div>
      <p className="muted">
        Created {job.createdAt}
        {job.finishedAt ? ` · finished ${job.finishedAt}` : ""}.{" "}
        {matches
          ? "Matches the current saved application inputs."
          : "Historical frozen inputs; later edits need a new snapshot and export."}
      </p>
      {job.runtimeRendererMatch === false && (
        <p className="review-notice">
          The current renderer or fonts differ, or are unavailable. These frozen
          measurements do not establish current page compliance.
        </p>
      )}
      {job.errors.length > 0 && (
        <ul role="alert">
          {job.errors.map((error, index) => (
            <li key={index}>{error}</li>
          ))}
        </ul>
      )}
      {job.measurements.length > 0 && (
        <div style={{ overflowX: "auto" }}>
          <table>
            <caption>Exact PDF measurements for this frozen packet</caption>
            <thead>
              <tr>
                <th scope="col">Component</th>
                <th scope="col">Pages</th>
                <th scope="col">Limit</th>
                <th scope="col">Result</th>
              </tr>
            </thead>
            <tbody>
              {job.measurements.map((measurement) => (
                <tr key={measurement.componentId}>
                  <th scope="row">
                    {snapshot.payload.application.binding?.manifest?.components.find(
                      (component) => component.id === measurement.componentId,
                    )?.label ?? measurement.componentId}
                  </th>
                  <td>{measurement.pages ?? "Unknown"}</td>
                  <td>{measurement.limit ?? "None"}</td>
                  <td>
                    {measurement.passed === null
                      ? "Unknown"
                      : measurement.passed
                        ? "Within limit"
                        : "Over limit"}
                    <p className="muted">{measurement.note}</p>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <div className="row">
        {job.artifacts.map((artifact) => (
          <a
            className="button"
            key={artifact.id}
            href={`/api/proposal-exports/${encodeURIComponent(job.id)}/${encodeURIComponent(artifact.id)}`}
            download={artifact.filename}
          >
            Download {artifact.filename} · {artifact.bytes.toLocaleString()}{" "}
            bytes
          </a>
        ))}
        {(job.status === "queued" || job.status === "running") && (
          <button disabled={busy} onClick={onCancel}>
            Cancel export job
          </button>
        )}
      </div>
      {job.artifacts.length > 0 && (
        <details>
          <summary>Artifact integrity</summary>
          {job.artifacts.map((artifact) => (
            <p key={artifact.id} style={{ overflowWrap: "anywhere" }}>
              {artifact.filename}: SHA-256 {artifact.sha256}
            </p>
          ))}
        </details>
      )}
    </article>
  );
}
function PacketExports(
  props: Props & { anyDirty: boolean; setExportBusy: (value: boolean) => void },
) {
  const [pending, setPending] = useState(false),
    [error, setError] = useState(""),
    [watched, setWatched] = useState<ProposalExport | null>(null),
    [pollError, setPollError] = useState("");
  const snapshots = [
    ...props.state.packetSnapshots.filter(
      (snapshot) => snapshot.applicationId === props.app.id,
    ),
  ].reverse();
  const refreshRef = useRef(props.refresh);
  refreshRef.current = props.refresh;
  useEffect(() => {
    if (
      watched &&
      (watched.status === "queued" || watched.status === "running")
    )
      return;
    const active = props.state.proposalExports.find(
      (job) =>
        (job.status === "queued" || job.status === "running") &&
        snapshots.some((snapshot) => snapshot.id === job.snapshotId),
    );
    if (active) setWatched(active);
  }, [props.state.proposalExports, props.app.id, watched?.status]);
  useEffect(() => {
    if (!watched || !["queued", "running"].includes(watched.status)) return;
    let active = true,
      timer: ReturnType<typeof setTimeout> | undefined;
    const controller = new AbortController();
    async function poll() {
      try {
        const response = await fetch(
          `/api/proposal-exports/${encodeURIComponent(watched!.id)}`,
          { signal: controller.signal, cache: "no-store" },
        );
        const data = await response.json();
        if (!response.ok)
          throw new Error(apiErrorMessage(data.error, "Could not read export status."));
        const result = ProposalExportSchema.parse(data.export ?? data);
        if (!active) return;
        setWatched(result);
        setPollError("");
        if (result.status === "succeeded" || result.status === "failed")
          await refreshRef.current?.();
        else timer = setTimeout(poll, 1500);
      } catch (error) {
        if (!active || controller.signal.aborted) return;
        setPollError(errorText(error));
        timer = setTimeout(poll, 5000);
      }
    }
    timer = setTimeout(poll, 700);
    return () => {
      active = false;
      controller.abort();
      if (timer) clearTimeout(timer);
    };
  }, [watched?.id, watched?.status]);
  async function exportSnapshot(
    snapshot: PacketSnapshot,
    revision: number,
    retry = false,
  ) {
    const response = await fetch("/api/proposal-exports", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        snapshotId: snapshot.id,
        expectedRevision: revision,
        ...(retry ? { retry: true } : {}),
      }),
    });
    const data = await response.json();
    if (!response.ok)
      throw new Error(apiErrorMessage(data.error, "Export could not be started."));
    const job = data.state?.proposalExports?.find(
      (item: ProposalExport) => item.id === data.exportId,
    );
    if (!job)
      throw new Error(
        "Export response did not contain the saved job. Refresh saved state before retrying.",
      );
    setWatched(ProposalExportSchema.parse(job));
    await props.refresh?.();
  }
  async function freezeAndExport() {
    setPending(true);
    props.setExportBusy(true);
    setError("");
    try {
      const result = await props.mutate({
        type: "freezePacket",
        applicationId: props.app.id,
      });
      if (!result) return;
      const snapshot = result.state.packetSnapshots.find(
        (snapshot) => snapshot.id === result.selectedId,
      );
      if (!snapshot)
        throw new Error(
          "The frozen snapshot was not returned. Refresh saved state before retrying.",
        );
      await exportSnapshot(snapshot, result.state.revision);
    } catch (error) {
      setError(errorText(error));
    } finally {
      setPending(false);
      props.setExportBusy(false);
    }
  }
  async function retry(snapshot: PacketSnapshot) {
    setPending(true);
    props.setExportBusy(true);
    setError("");
    try {
      await exportSnapshot(snapshot, props.state.revision, true);
    } catch (error) {
      setError(errorText(error));
    } finally {
      setPending(false);
      props.setExportBusy(false);
    }
  }
  async function cancel(job: ProposalExport) {
    setPending(true);
    props.setExportBusy(true);
    setError("");
    try {
      const response = await fetch(
        `/api/proposal-exports/${encodeURIComponent(job.id)}`,
        {
          method: "DELETE",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ expectedRevision: props.state.revision }),
        },
      );
      const data = await response.json();
      if (!response.ok)
        throw new Error(apiErrorMessage(data.error, "Export cancellation failed."));
      const saved = data.state?.proposalExports?.find(
        (item: ProposalExport) => item.id === data.exportId,
      );
      if (saved) setWatched(ProposalExportSchema.parse(saved));
      await props.refresh?.();
    } catch (error) {
      setError(errorText(error));
      await props.refresh?.();
    } finally {
      setPending(false);
      props.setExportBusy(false);
    }
  }
  const busy = props.busy || pending;
  const manifest = props.app.binding?.manifest;
  return (
    <section className="card form-stack">
      <h2>Freeze and export a proposal packet</h2>
      <p>
        Freeze the saved application, call, project, evidence and library
        versions into an immutable snapshot. Editable DOCX and measured PDF
        components are generated together; the manifest records findings and
        file hashes. Later edits need a new snapshot.
      </p>
      {manifest && (
        <details>
          <summary>Planned component boundaries and aggregate limits</summary>
          {exportComponentPlan(manifest, props.app.binding?.answers ?? {}).map(
            (plan) => (
              <p key={plan.component.id}>
                <strong>{plan.component.label}</strong> · {plan.applicability} ·{" "}
                {plan.aggregateLimits.pages === null
                  ? "no aggregate page limit"
                  : `${plan.aggregateLimits.pages} aggregate pages`}{" "}
                ·{" "}
                {plan.component.delivery === "preparation-worksheet"
                  ? "preparation worksheet; complete the separate portal task"
                  : "narrative"}
              </p>
            ),
          )}
        </details>
      )}
      <button
        className="primary"
        disabled={busy || props.anyDirty}
        onClick={() => void freezeAndExport()}
      >
        Freeze saved inputs and generate packet
      </button>
      {props.anyDirty && (
        <p className="muted">
          Save or discard unsaved draft and template edits before freezing. The
          packet uses saved inputs only.
        </p>
      )}
      {error && (
        <p role="alert" className="error">
          {error}
        </p>
      )}
      {pollError && (
        <p role="alert" className="error">
          Export status unavailable: {pollError}. Saved snapshots and prior
          artifacts remain available.
        </p>
      )}
      {props.refresh && (
        <button disabled={busy} onClick={() => void props.refresh?.()}>
          Refresh saved export status
        </button>
      )}
      {snapshots.length === 0 && (
        <p className="muted">
          No frozen packets yet. Incomplete drafts may be exported for review
          with explicit findings.
        </p>
      )}
      {snapshots.map((snapshot) => {
        const jobs = props.state.proposalExports.filter(
          (job) => job.snapshotId === snapshot.id,
        );
        const live = watched?.snapshotId === snapshot.id ? watched : null;
        const list = live
          ? [...jobs.filter((job) => job.id !== live.id), live]
          : jobs;
        return (
          <details key={snapshot.id} open={snapshots[0]?.id === snapshot.id}>
            <summary>
              Snapshot {snapshot.createdAt} ·{" "}
              {
                snapshot.payload.issues.filter(
                  (issue) => !issue.waived && issue.severity === "blocker",
                ).length
              }{" "}
              blockers ·{" "}
              {snapshotMatchesApplication(snapshot, props.app, props.state)
                ? "current saved inputs"
                : "historical inputs"}
            </summary>
            <p className="muted" style={{ overflowWrap: "anywhere" }}>
              Snapshot {snapshot.id} · SHA-256 {snapshot.digest} · rules{" "}
              {snapshot.payload.rulesVersion}
            </p>
            <details>
              <summary>Frozen readiness findings and waivers</summary>
              {snapshot.payload.issues.length === 0 ? (
                <p>No deterministic findings at freeze time.</p>
              ) : (
                snapshot.payload.issues.map((issue) => (
                  <article className="criterion" key={issue.id}>
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
                    <strong> {issue.location}</strong>
                    <p>{issue.message}</p>
                    <p className="muted">Fix: {issue.fix}</p>
                    {issue.waived && <p>Recorded waiver: {issue.waived}</p>}
                  </article>
                ))
              )}
            </details>
            {list.map((job) => (
              <ExportJob
                key={job.id}
                job={job}
                snapshot={snapshot}
                state={props.state}
                busy={busy}
                onCancel={() => void cancel(job)}
              />
            ))}
            <button
              disabled={
                busy ||
                props.anyDirty ||
                list.some(
                  (job) => job.status === "queued" || job.status === "running",
                )
              }
              onClick={() => void retry(snapshot)}
            >
              {list.some((job) => job.status === "succeeded")
                ? "Check or regenerate the same frozen packet"
                : "Generate or retry this frozen packet"}
            </button>
          </details>
        );
      })}
    </section>
  );
}

export function ProposalPanel(props: Props) {
  const registry = useContext(EditorRegistry),
    anyDirty = Object.values(registry.ids).some(Boolean);
  const [selected, setSelected] = useState(props.app.sections[0]?.key ?? ""),
    [exportBusy, setExportBusy] = useState(false);
  const manifest = props.app.binding?.manifest;
  const resolved = manifest
    ? resolveTemplate(manifest, props.app.binding?.answers ?? {})
    : null;
  const review = readiness(props.state, props.app);
  const active = props.app.sections.some((section) => section.key === selected)
    ? selected
    : (props.app.sections[0]?.key ?? "");
  return (
    <div className="form-stack">
      <div className="section-heading">
        <div>
          <p className="eyebrow">04 / FULL PROPOSAL</p>
          <h2>
            {manifest
              ? "Write, review and freeze the complete proposal"
              : "Proposal template"}
          </h2>
          <p className="muted">
            {props.app.provenance === "demo"
              ? "Fictional demonstration application"
              : "Researcher application"}{" "}
            · saved application r{props.app.revision}. Human review remains
            explicit at every stage.
          </p>
        </div>
        {manifest && (
          <div className="row">
            <Badge tone={review.blockers ? "red" : "green"}>
              {review.blockers} blockers
            </Badge>
            <Badge tone="amber">{review.warnings} warnings</Badge>
          </div>
        )}
      </div>
      <TemplateSetup
        {...props}
        busy={props.busy || exportBusy}
        key={props.app.id}
      />
      {manifest &&
        props.app.binding?.templateId === "nsf-standard-research" && (
          <>
            <nav className="card" aria-label="Proposal sections">
              <h3>Section navigator</h3>
              <p className="muted">
                Switching sections keeps unsaved buffers. Save each edited
                section before freezing or reusing content.
              </p>
              <div className="row" style={{ flexWrap: "wrap" }}>
                {props.app.sections.map((section) => {
                  const applicability =
                    resolved?.sections.find(
                      (item) => item.section.id === section.key,
                    )?.applicability ?? "unresolved";
                  return (
                    <button
                      key={section.key}
                      type="button"
                      aria-pressed={active === section.key}
                      onClick={() => setSelected(section.key)}
                    >
                      {section.label} ·{" "}
                      {applicability === "not-applicable"
                        ? "not applicable"
                        : sectionStatus(section)}
                      {registry.ids[
                        "proposal-section-" + props.app.id + "-" + section.key
                      ]
                        ? " · unsaved"
                        : ""}
                    </button>
                  );
                })}
              </div>
            </nav>
            {props.app.sections.map((section) => (
              <div
                key={props.app.id + section.key}
                hidden={active !== section.key}
              >
                <SectionEditor
                  {...props}
                  section={section}
                  manifest={manifest}
                  applicability={
                    resolved?.sections.find(
                      (item) => item.section.id === section.key,
                    )?.applicability ?? "unresolved"
                  }
                  sharedBusy={exportBusy}
                />
              </div>
            ))}
            <section className="card">
              <h2>External sponsor tasks</h2>
              <p>
                These actions are completed in the sponsor’s systems. Narrative
                text and exported worksheets do not complete SciENcv, DMSP,
                budget entry, certifications or submission.
              </p>
              {resolved?.externalTasks.map(({ task, applicability }) => (
                <ExternalTaskEditor
                  {...props}
                  busy={props.busy || exportBusy}
                  task={task}
                  applicability={applicability}
                  key={props.app.id + task.id}
                />
              ))}
            </section>
            <ContentLibrary
              {...props}
              busy={props.busy || exportBusy}
              key={props.app.id + "library"}
              anyDirty={anyDirty}
              selected={active}
            />
            <PacketExports
              {...props}
              key={props.app.id + "exports"}
              anyDirty={anyDirty}
              setExportBusy={setExportBusy}
            />
          </>
        )}
      {(props.app.archivedSections?.length ?? 0) > 0 && (
        <section className="card">
          <details>
            <summary>
              Archived sections and retained history ·{" "}
              {props.app.archivedSections?.length}
            </summary>
            {props.app.archivedSections?.map((section, index) => (
              <details key={section.key + index}>
                <summary>
                  {section.label} · {section.revisions.length} revisions
                </summary>
                {[...section.revisions].reverse().map((revision) => (
                  <article key={revision.id} className="criterion">
                    <p>
                      {revision.createdAt} · {revision.mode} · {revision.id}
                    </p>
                    <BlockPreview blocks={revisionBlocks(revision)} />
                    {revision.citations.map((citation, i) => (
                      <CitationView
                        key={i}
                        citation={citation}
                        state={props.state}
                      />
                    ))}
                  </article>
                ))}
              </details>
            ))}
          </details>
        </section>
      )}
      {manifest && (
        <section className="card form-stack">
          <h2>Application readiness</h2>
          <p className="muted">
            Deterministic findings for saved inputs · rules{" "}
            {review.rulesVersion}. Review the complete sponsor call and the
            exported documents. Any waiver remains an explicit recorded
            exception.
          </p>
          {review.issues.map((issue) => (
            <ReadinessIssue
              {...props}
              busy={props.busy || exportBusy}
              issue={issue}
              key={issue.id}
            />
          ))}
          {review.issues.length === 0 && (
            <p>No deterministic findings for the current saved inputs.</p>
          )}
        </section>
      )}
    </div>
  );
}
