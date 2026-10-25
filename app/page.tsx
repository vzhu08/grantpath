"use client";
import { useCallback, useEffect, useState } from "react";
import { StateSchema, type State, type Command } from "../lib/schema";
import { readiness } from "../lib/readiness";
import { deadlineLabel } from "../lib/calendar";
import { exportPacket } from "../lib/exports";
import { ProfileEditor, ProjectPanel } from "../components/project-panel";
import {
  OpportunitiesPanel,
  CallReview,
} from "../components/opportunities-panel";
import { Checklist } from "../components/checklist";
import { Drafts } from "../components/drafts";
import { Badge, Field, download, EditorRegistry } from "../components/common";

const steps = [
  {
    key: "project",
    number: "01",
    label: "Project & evidence",
    description: "Your research foundation",
  },
  {
    key: "opportunities",
    number: "02",
    label: "Opportunities",
    description: "Find and explain the fit",
  },
  {
    key: "application",
    number: "03",
    label: "Application plan",
    description: "Requirements & dates",
  },
  {
    key: "drafts",
    number: "04",
    label: "Draft & readiness",
    description: "Write, inspect, refine",
  },
];
export default function Workspace() {
  const [state, setState] = useState<State | null>(null),
    [projectId, setProjectId] = useState("demo-project"),
    [appId, setAppId] = useState(""),
    [tab, setTab] = useState("project"),
    [creating, setCreating] = useState(false),
    [busy, setBusy] = useState(false),
    [error, setError] = useState(""),
    [dirtyEditors, setDirtyEditors] = useState<Record<string, boolean>>({}),
    [saved, setSaved] = useState("Loading local workspace…"),
    [reviewCall, setReviewCall] = useState(false),
    [latestState, setLatestState] = useState<State | null>(null);
  const markEditor = useCallback(
    (id: string, value: boolean) =>
      setDirtyEditors((current) => {
        if (!!current[id] === value) return current;
        const next = { ...current };
        if (value) next[id] = true;
        else delete next[id];
        return next;
      }),
    [],
  );
  const dirty = Object.values(dirtyEditors).some(Boolean);
  const setDirty = (value: boolean) => {
    if (!value) setDirtyEditors({});
  };
  async function load(initial = false) {
    try {
      const response = await fetch("/api/workspace", { cache: "no-store" });
      const data = await response.json();
      if (!response.ok)
        throw new Error(
          data.error?.message ?? "Could not load the local workspace.",
        );
      const parsed = StateSchema.parse(data);
      if (initial || !dirty) {
        setState(parsed);
        setSaved(`Saved · workspace r${parsed.revision}`);
      } else setLatestState(parsed);
      setError("");
    } catch (e) {
      setError((e as Error).message);
    }
  }
  useEffect(() => {
    void load(true);
  }, []);
  useEffect(() => {
    const listener = (e: BeforeUnloadEvent) => {
      if (dirty) {
        e.preventDefault();
        e.returnValue = "";
      }
    };
    window.addEventListener("beforeunload", listener);
    return () => window.removeEventListener("beforeunload", listener);
  }, [dirty]);
  function navigate(action: () => void) {
    if (
      dirty &&
      !window.confirm(
        "You have unsaved edits. Leave this editor and discard them?",
      )
    )
      return;
    setDirty(false);
    setError("");
    action();
  }
  async function mutate(command: Command) {
    if (!state) return null;
    setBusy(true);
    setError("");
    setSaved("Saving…");
    try {
      const response = await fetch("/api/workspace", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ expectedRevision: state.revision, command }),
      });
      const result = await response.json();
      if (!response.ok) {
        if (response.status === 409) {
          const fresh = await fetch("/api/workspace", { cache: "no-store" });
          if (fresh.ok) setLatestState(StateSchema.parse(await fresh.json()));
        }
        throw new Error(
          result.error?.message ?? "Save failed. Your editor is preserved.",
        );
      }
      const parsed = StateSchema.parse(result.state);
      setState(parsed);
      setSaved(`Saved · workspace r${parsed.revision}`);
      setLatestState(null);
      return {
        state: parsed,
        selectedId: result.selectedId as string | undefined,
      };
    } catch (e) {
      setError((e as Error).message);
      setSaved("Save failed · edits preserved");
      return null;
    } finally {
      setBusy(false);
    }
  }
  const project =
    state?.projects.find((p) => p.id === projectId) ?? state?.projects[0];
  const apps =
    state?.applications.filter((a) => a.projectId === project?.id) ?? [];
  const app = apps.find((a) => a.id === appId) ?? apps[0];
  const call = state?.opportunities.find((c) => c.id === app?.opportunityId);
  const props = state ? { state, mutate, busy, dirty: setDirty } : null;
  const review = state && app ? readiness(state, app) : null;
  function openApplication(id: string) {
    navigate(() => {
      setAppId(id);
      setTab("application");
    });
  }
  return (
    <EditorRegistry.Provider value={{ ids: dirtyEditors, mark: markEditor }}>
      <div className="workspace">
        <aside className="sidebar">
          <a href="/" className="brand" aria-label="GrantPath home">
            <span className="brand-symbol" aria-hidden="true">
              <svg viewBox="0 0 28 28" fill="none">
                <path
                  d="M5 22V7h6v15M11 17h6V4h6v18"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </span>
            <span>
              GrantPath<span className="brand-caption">RESEARCH WORKSPACE</span>
            </span>
          </a>
          <div className="sidebar-rule" />
          <div className="project-picker">
            <Field label="CURRENT PROJECT">
              <select
                aria-label="Current project"
                value={project?.id ?? ""}
                disabled={!state || busy}
                onChange={(e) =>
                  navigate(() => {
                    setProjectId(e.target.value);
                    setAppId("");
                    setCreating(false);
                  })
                }
              >
                {state?.projects.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.provenance === "demo" ? "Demo · " : ""}
                    {p.profile.title}
                  </option>
                ))}
              </select>
            </Field>
            <button
              className="text-button"
              disabled={!state || busy}
              onClick={() =>
                navigate(() => {
                  setCreating(true);
                  setTab("project");
                })
              }
            >
              + New project
            </button>
          </div>
          <nav aria-label="Workspace steps">
            {steps.map((step) => (
              <button
                key={step.key}
                disabled={busy}
                className={`nav-item ${tab === step.key ? "active" : ""}`}
                onClick={() =>
                  navigate(() => {
                    setTab(step.key);
                    setCreating(false);
                  })
                }
              >
                <span className="step-number">{step.number}</span>
                <span>
                  <strong>{step.label}</strong>
                  <small>{step.description}</small>
                </span>
                {tab === step.key && <span className="nav-dot" />}
              </button>
            ))}
          </nav>
          <div className="sidebar-bottom">
            <div className="local-indicator">
              <span /> Local, single-user workspace
            </div>
            <p>
              Your work is saved on this computer. No application is submitted
              by this app.
            </p>
            <details>
              <summary>Demo data controls</summary>
              <p>
                Reset replaces the synthetic project, its notes and demo
                applications. Researcher-created projects, calls and
                applications are kept.
              </p>
              <button
                disabled={!state || busy}
                onClick={() => {
                  if (
                    window.confirm(
                      "Reset synthetic demo work only? Researcher-created records will be kept.",
                    )
                  )
                    void mutate({ type: "resetDemo" });
                }}
              >
                Reset demo data only
              </button>
            </details>
            <a
              href="https://github.com/oliverchennn/hackathon-kit"
              target="_blank"
              rel="noreferrer"
              className="kit-credit"
            >
              Built with Hackathon Kit ↗
            </a>
          </div>
        </aside>
        <div className="workspace-main">
          <header className="topbar">
            <span>
              Workspace{" "}
              <span className="crumb">
                / {steps.find((s) => s.key === tab)?.label}
              </span>
            </span>
            <span
              role="status"
              className={`save-state ${dirty ? "unsaved" : ""}`}
            >
              <span />
              {busy ? "Saving…" : dirty ? "Unsaved edits" : saved}
            </span>
          </header>
          <main id="main">
            <fieldset className="workspace-fields" disabled={busy}>
              <div className="page-heading">
                <div>
                  <p className="eyebrow">
                    FROM RESEARCH TO A CLEARER APPLICATION
                  </p>
                  <h1>
                    {creating
                      ? "Start with your research"
                      : (project?.profile.title ??
                        "Your next research chapter")}
                  </h1>
                  <p className="subtitle">
                    A focused place to connect your evidence, funding call, and
                    next draft.
                  </p>
                </div>
                <Badge tone="green">LOCAL WORKSPACE</Badge>
              </div>
              <div className="demo-banner">
                <span className="demo-icon" aria-hidden="true">
                  i
                </span>
                <div>
                  <strong>
                    {project?.provenance === "demo"
                      ? "You’re exploring a synthetic example."
                      : "The catalog includes six fictional demo calls."}
                  </strong>
                  <span>
                    {project?.provenance === "demo"
                      ? " Create your own project to start preparing an application."
                      : " Demo opportunities are labeled on every record. Pasted calls are researcher-provided."}{" "}
                    Sources and saved URLs are not independently verified.
                  </span>
                </div>
              </div>
              {error && (
                <div role="alert" className="error-panel">
                  <strong>We couldn’t complete that action.</strong>
                  <p>{error}</p>
                  <button onClick={() => void load()}>
                    Retry load / inspect latest saved data
                  </button>
                </div>
              )}
              {latestState && (
                <section className="conflict-panel">
                  <h3>A newer workspace revision is available</h3>
                  <p>
                    Your editor has been kept. Compare with the latest saved
                    records before retrying.
                  </p>
                  <div className="row">
                    <button
                      onClick={() =>
                        download(
                          "grantpath-latest-state.json",
                          JSON.stringify(latestState, null, 2),
                          "application/json;charset=utf-8",
                        )
                      }
                    >
                      Download latest state for comparison
                    </button>
                    <button
                      onClick={() => {
                        setState(latestState);
                        setLatestState(null);
                        setSaved(
                          `Latest r${latestState.revision} · reconcile editor before saving`,
                        );
                      }}
                    >
                      Use latest save revision (keep editor text)
                    </button>
                  </div>
                </section>
              )}
              {!state ? (
                <div className="card empty">
                  {error
                    ? "The local workspace is unavailable. Retry when the storage issue is resolved."
                    : "Loading your local workspace…"}
                </div>
              ) : props && project ? (
                <>
                  {creating ? (
                    <ProfileEditor
                      {...props}
                      key="new"
                      onSaved={(id) => {
                        setProjectId(id);
                        setCreating(false);
                      }}
                    />
                  ) : tab === "project" ? (
                    <ProjectPanel
                      {...props}
                      key={project.id}
                      project={project}
                      onSaved={setProjectId}
                    />
                  ) : tab === "opportunities" ? (
                    <OpportunitiesPanel
                      {...props}
                      project={project}
                      openApplication={openApplication}
                    />
                  ) : (
                    <>
                      <section className="application-header card">
                        <div className="row spread">
                          <div>
                            <p className="eyebrow">SAVED APPLICATION</p>
                            <h2>
                              {call?.title ?? "Choose an opportunity to begin"}
                            </h2>
                          </div>
                          {app && call && (
                            <Badge
                              tone={
                                call.provenance === "demo" ? "amber" : "neutral"
                              }
                            >
                              {call.provenance === "demo"
                                ? "Fictional demo opportunity"
                                : "Researcher-added opportunity"}
                            </Badge>
                          )}
                        </div>
                        {app && call ? (
                          <>
                            <div className="application-controls">
                              <Field label="Application">
                                <select
                                  value={app.id}
                                  onChange={(e) =>
                                    navigate(() => {
                                      setAppId(e.target.value);
                                      setReviewCall(false);
                                    })
                                  }
                                >
                                  {apps.map((a) => (
                                    <option key={a.id} value={a.id}>
                                      {
                                        state.opportunities.find(
                                          (c) => c.id === a.opportunityId,
                                        )?.title
                                      }
                                    </option>
                                  ))}
                                </select>
                              </Field>
                              <Field label="Application stage">
                                <select
                                  value={app.stage}
                                  disabled={busy}
                                  onChange={(e) =>
                                    void mutate({
                                      type: "setStage",
                                      applicationId: app.id,
                                      stage: e.target.value as typeof app.stage,
                                    })
                                  }
                                >
                                  <option>Considering</option>
                                  <option>Preparing</option>
                                  <option>Ready for review</option>
                                  <option>Submitted</option>
                                </select>
                              </Field>
                              <button
                                disabled={dirty || busy}
                                title={
                                  dirty
                                    ? "Save edits before exporting"
                                    : "Download the current saved draft and checklist"
                                }
                                className="primary"
                                onClick={() =>
                                  download(
                                    "grantpath-application.md",
                                    exportPacket(state, app),
                                  )
                                }
                              >
                                Export packet ↓
                              </button>
                            </div>
                            <div className="row spread">
                              <p className="muted">
                                {deadlineLabel(call.deadline)} ·{" "}
                                {review?.blockers} blockers / {review?.warnings}{" "}
                                warnings
                              </p>
                              <button
                                className="text-button"
                                onClick={() => setReviewCall(!reviewCall)}
                              >
                                Inspect eligibility & sponsor deadline
                              </button>
                            </div>
                            {app.stage === "Submitted" && (
                              <p className="review-notice">
                                Submitted is your own status record. No external
                                submission took place.
                              </p>
                            )}
                            {reviewCall && (
                              <CallReview
                                {...props}
                                call={call}
                                key={call.id}
                              />
                            )}
                          </>
                        ) : (
                          <div className="empty">
                            <p>
                              Save a call from your shortlist to create a
                              checklist and three draft sections.
                            </p>
                            <button onClick={() => setTab("opportunities")}>
                              Browse opportunities →
                            </button>
                          </div>
                        )}
                      </section>
                      {app &&
                        call &&
                        (tab === "application" ? (
                          <Checklist
                            {...props}
                            key={app.id}
                            app={app}
                            call={call}
                          />
                        ) : (
                          <Drafts {...props} key={app.id} app={app} />
                        ))}
                    </>
                  )}
                </>
              ) : null}
              <footer className="workspace-footer">
                <span>GrantPath · First build</span>
                <span>
                  Traceable inputs. Editable drafts. Researcher judgment.
                </span>
              </footer>
            </fieldset>
          </main>
        </div>
      </div>
    </EditorRegistry.Provider>
  );
}
