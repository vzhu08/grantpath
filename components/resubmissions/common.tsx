"use client";
import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from "react";
import { Field, useEditorDirty } from "../common";
import type { ResubmissionCommand, CitationRecord, RevisionRecord, AttemptRecord } from "../../lib/resubmissions/schema";
import type { Workspace } from "../../lib/resubmissions/context";
import type { ResubmissionView } from "../../lib/resubmissions/view";

export { Field };
export type Run = (command: ResubmissionCommand) => Promise<unknown>;
export type Shared = { state: Workspace; run: Run; actor: string; view: ResubmissionView | null };
export const DirtyContext = createContext<{ mark: (id: string, dirty: boolean) => void }>({ mark: () => {} });
export function useBuffer<T>(id: string, initial: T, version: unknown) {
  const [value, setValue] = useState(initial), [dirty, setDirty] = useState(false);
  const currentDirty = useRef(false), context = useContext(DirtyContext);
  const [markEditor] = useEditorDirty("resubmission-" + id);
  useEffect(() => { if (!currentDirty.current) setValue(initial); }, [version]);
  useEffect(() => () => context.mark(id, false), [id, context.mark]);
  function mark(next: boolean) { currentDirty.current = next; setDirty(next); context.mark(id, next); markEditor(next); }
  function edit(next: T) { setValue(next); mark(true); }
  return { value, edit, dirty, clean: () => mark(false), reload: () => { setValue(initial); mark(false); } };
}
export function useOperation(run: Run) {
  const [busy, setBusy] = useState(false), [error, setError] = useState("");
  async function save(command: ResubmissionCommand, success?: (result: unknown) => void) {
    if (busy) return; setBusy(true); setError("");
    try { const result = await run(command); if (result === null || result === false) throw new Error("Save did not complete. Your text is preserved; reload saved data and reconcile before retrying."); success?.(result); return result; }
    catch (e) { setError((e as Error).message || "Save failed. Your text is preserved."); }
    finally { setBusy(false); }
  }
  return { busy, error, save, setError };
}
export function ErrorText({ children }: { children: ReactNode }) { return children ? <p role="alert" className="error">{children}</p> : null; }
export function Text({ children }: { children: ReactNode }) { return <pre style={{ whiteSpace: "pre-wrap", overflowWrap: "anywhere", fontFamily: "inherit", margin: "0.5rem 0", maxWidth: "100%" }}>{children}</pre>; }
export function FormActions({ dirty, busy, onReload, children }: { dirty: boolean; busy: boolean; onReload?: () => void; children: ReactNode }) { return <div className="row" style={{ flexWrap: "wrap", gap: 8 }}>{children}{dirty && <small>Unsaved text</small>}{dirty && onReload && <button type="button" className="secondary" disabled={busy} onClick={onReload}>Discard local edits / use saved</button>}</div>; }
export const list = (value: string) => value.split("\n").map(s => s.trim()).filter(Boolean);
export const operationId = () => "ui-" + crypto.randomUUID();
export const selectedId = (result: unknown) => result && typeof result === "object" && "selectedId" in result ? String(result.selectedId) : "";
export function citation(sourceId: string, version: number, hash: string, text: string, start: number, end: number): CitationRecord {
  if (start < 0 || end <= start || end > text.length) throw new Error("Select an exact nonempty passage in the saved text first.");
  return { sourceId, version, hash, quote: text.slice(start, end), start, end };
}
export async function revisionLink(applicationId: string, sectionId: string, revision: { id: string; text: string }, range: { start: number; end: number } | null): Promise<RevisionRecord> {
  const bytes = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(revision.text));
  const digest = [...new Uint8Array(bytes)].map(b => b.toString(16).padStart(2, "0")).join("");
  if (range && (range.start < 0 || range.end <= range.start || range.end > revision.text.length)) throw new Error("Select an exact target passage or use the full saved revision.");
  return { applicationId, sectionId, revisionId: revision.id, digest, range: range ? { ...range, quote: revision.text.slice(range.start, range.end) } : null };
}
export function SectionOptions({ attempt, state }: { attempt: AttemptRecord; state: Workspace }) { return <><option value="">Unmapped / no target section</option>{state.applications.find(a => a.id === attempt.targetApplicationId)?.sections.map(s => <option key={s.key} value={s.key}>{s.label}</option>)}</>; }
