"use client";
import { useEffect, useId, useRef, useState } from "react";
import type { State } from "../../lib/schema";
import { Badge, Field, useEditorDirty, type EditorProps } from "../common";

type Props = EditorProps & { projectId: string };
type Document = State["documents"][number];
export const documentUrl = (documentId: string, versionId: string) => `/api/documents/${encodeURIComponent(documentId)}/versions/${encodeURIComponent(versionId)}`;
export async function vaultResponse(response: Response) {
  const value = await response.json();
  if (!response.ok) throw Object.assign(new Error(value.error?.message || `Request failed (${response.status}). Your inputs are preserved.`), {status:response.status});
  return value;
}
function encodedMetadata(value: unknown) {
  const bytes = new TextEncoder().encode(JSON.stringify(value));
  const encoded = btoa(Array.from(bytes, byte => String.fromCharCode(byte)).join("")).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
  if (encoded.length > 4096) throw new Error("Upload details exceed the metadata limit. Shorten the title and owner label.");
  return encoded;
}
export function DocumentUpload(props: Props & { document?: Document; onUploaded?: (id: string) => void }) {
  const [file, setFile] = useState<File | null>(null), [title, setTitle] = useState(props.document?.title ?? ""), [category, setCategory] = useState(props.document?.category ?? "CV"), [owner, setOwner] = useState(props.document?.owner ?? ""), [uploading, setUploading] = useState(false), [error, setError] = useState(""), [notice, setNotice] = useState("");
  const uploadId = useId();
  const [markDirty] = useEditorDirty(`upload-${uploadId}`);
  const categoryList = useId();
  const input = useRef<HTMLInputElement>(null), receipt = useRef<{payload: string; key: string; revision:number} | null>(null);
  async function upload(event: React.FormEvent) {
    event.preventDefault(); setError(""); setNotice("");
    if (!file) { setError("Choose an original file first."); return; }
    if (!file.size || file.size > 10_000_000) { setError("Choose a nonempty PDF, TXT, Markdown or DOCX file of at most 10,000,000 bytes."); return; }
    setUploading(true);
    try {
      const metadata = { projectId: props.projectId, ...(props.document ? {documentId: props.document.id} : {}), filename: file.name, claimedMime: file.type, title, category, owner, expectedRevision: props.state.revision };
      const payload = JSON.stringify({...metadata, expectedRevision:undefined, size: file.size, modified: file.lastModified});
      if (receipt.current?.payload !== payload) receipt.current = {payload, key: crypto.randomUUID(),revision:metadata.expectedRevision};
      const response = await vaultResponse(await fetch("/api/documents", {method: "POST", headers: {"Content-Type": "application/octet-stream", "X-Upload-Metadata": encodedMetadata({...metadata,expectedRevision:receipt.current.revision, idempotencyKey: receipt.current.key})}, body: file}));
      setFile(null); if (input.current) input.current.value = "";
      receipt.current = null; markDirty(false);
      setNotice("Original file retained. Review and select its exact version separately.");
      await props.refresh?.(); props.onUploaded?.(response.documentId);
    } catch (failure) { if((failure as {status?:number}).status===409)receipt.current=null;setError((failure as Error).message); }
    finally { setUploading(false); }
  }
  return <form className="form-stack" onSubmit={upload}>
    <p className="muted">PDF, TXT, Markdown and DOCX · up to 10 MB. Files stay in this local workspace until it is explicitly removed. Archive hides a document and retains all versions. Uploads are researcher-provided, including uploads to a synthetic project.</p>
    <Field label={props.document ? "Replacement original file" : "Original file"}><input ref={input} type="file" accept=".pdf,.txt,.md,.docx" required disabled={uploading} onChange={event => {setFile(event.target.files?.[0] ?? null); markDirty(true); if (!title) setTitle(event.target.files?.[0]?.name ?? "");}} /></Field>
    <div className="form-grid">
      <Field label="Document title"><input required disabled={uploading} maxLength={500} value={title} onChange={e => {setTitle(e.target.value); markDirty(true);}} /></Field>
      <Field label="Document category"><input required disabled={uploading} maxLength={500} value={category} onChange={e => {setCategory(e.target.value); markDirty(true);}} list={categoryList} /></Field>
      <Field label="Owner label"><input disabled={uploading} maxLength={500} value={owner} onChange={e => {setOwner(e.target.value); markDirty(true);}} /></Field>
    </div>
    <datalist id={categoryList}><option value="CV"/><option value="Support letter"/><option value="Methods"/><option value="Ethics approval"/><option value="Other"/></datalist>
    <p className="muted">Parsing does not certify safety, readability, sponsor formatting or approval. Files are not sent to an AI provider by uploading them.</p>
    {error && <div><p className="error" role="alert">{error}</p><button type="button" onClick={()=>void props.refresh?.()}>Refresh saved data, preserving upload inputs</button></div>}{notice && <p role="status">{notice}</p>}
    <button className="primary" disabled={props.busy || uploading}>{uploading ? "Retaining original…" : props.document ? "Save a new immutable version" : "Upload original file"}</button>
  </form>;
}
function MetadataEditor(props: Props & {document: Document}) {
  const d = props.document;
  const [title, setTitle] = useState(d.title), [category, setCategory] = useState(d.category), [owner, setOwner] = useState(d.owner), [tags, setTags] = useState(d.tags.join(", ")), [error, setError] = useState("");
  const [markDirty, isDirty] = useEditorDirty(`document-metadata-${d.id}`);
  useEffect(() => {if (!isDirty) {setTitle(d.title);setCategory(d.category);setOwner(d.owner);setTags(d.tags.join(", "));}}, [d]);
  return <form className="form-stack" onSubmit={async e => {e.preventDefault();setError("");try {const result = await props.mutate({type:"editDocumentMetadata", documentId:d.id,title,category,owner,tags:tags.split(",").map(t=>t.trim()).filter(Boolean)});if(result)markDirty(false);}catch(error){setError((error as Error).message);}}}>
    <Field label="Document title"><input required maxLength={500} value={title} onChange={e=>{setTitle(e.target.value);markDirty(true);}}/></Field>
    <Field label="Document category"><input required maxLength={500} value={category} onChange={e=>{setCategory(e.target.value);markDirty(true);}}/></Field>
    <Field label="Owner label"><input maxLength={500} value={owner} onChange={e=>{setOwner(e.target.value);markDirty(true);}}/></Field>
    <Field label="Tags (comma separated, at most 20)"><input value={tags} onChange={e=>{setTags(e.target.value);markDirty(true);}}/></Field>
    {error&&<p role="alert" className="error">{error}</p>}<button disabled={props.busy}>Save document details</button>
  </form>;
}
function VersionView(props: Props & {document: Document; versionId: string}) {
  const version = props.state.documentVersions.find(v=>v.id===props.versionId)!;
  const attempts = props.state.parseAttempts.filter(p=>p.documentVersionId===version.id);
  const [attemptId,setAttemptId] = useState(attempts.at(-1)?.id ?? ""), [text,setText] = useState<string|null>(null), [error,setError] = useState(""), [loading,setLoading] = useState(false), [start,setStart] = useState(0), [end,setEnd] = useState(0), [title,setTitle] = useState(`${props.document.title} excerpt`), [by,setBy] = useState(""), [reason,setReason] = useState(""), [sourceId,setSourceId] = useState("");
  const [markDirty] = useEditorDirty(`file-excerpt-${version.id}`);
  const attempt = attempts.find(a=>a.id===attemptId) ?? attempts.at(-1);
  const eligibility = !!attempt && ["parsed","partial"].includes(attempt.status) && !/ethic|approval|irb|animal|data-use/i.test(props.document.category) && !props.state.ethicsRecords.some(r=>r.revisions.some(e=>e.supportingVersionIds.includes(version.id)));
  useEffect(()=>{setText(null);setStart(0);setEnd(0);},[attempt?.id]);
  async function readText() { if(!attempt)return;setLoading(true);setError("");try{const result=await vaultResponse(await fetch(`${documentUrl(props.document.id,version.id)}/text?attemptId=${encodeURIComponent(attempt.id)}`,{cache:"no-store"}));setText(result.text);}catch(e){setError((e as Error).message);}finally{setLoading(false);}}
  async function retry() {setLoading(true);setError("");try{await vaultResponse(await fetch(`${documentUrl(props.document.id,version.id)}/parse`,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({expectedRevision:props.state.revision,idempotencyKey:crypto.randomUUID()})}));await props.refresh?.();}catch(e){setError((e as Error).message);}finally{setLoading(false);}}
  return <div className="form-stack">
    <p><strong>{version.filename}</strong> · {version.mime} · {version.bytes.toLocaleString()} bytes · uploaded {version.createdAt}</p>
    <p style={{overflowWrap:"anywhere"}}>Original SHA-256: <code>{version.sha256}</code></p>
    <div className="row"><Badge tone={version.integrity==="available"?"green":"amber"}>Integrity: {version.integrity}</Badge><a href={`${documentUrl(props.document.id,version.id)}/download`}>Download original v{version.version}</a></div>
    {props.state.sources.filter(s=>s.projectId===props.projectId&&s.versions.some(v=>v.fileOrigin?.documentVersionId===version.id)).map(s=><details key={s.id}><summary>Promoted evidence: {s.title}</summary>{s.versions.filter(v=>v.fileOrigin?.documentVersionId===version.id).map(v=>{const origin=v.fileOrigin!;return <p key={v.version}>Evidence source v{v.version} � extraction {origin.parseAttemptId} � offsets {origin.start}�{origin.end} � reviewed by {origin.reviewedBy}{origin.manualEdit?" � manually edited source revision":" � exact reviewed excerpt"}{origin.reviewedHeadId!==props.document.versionIds.at(-1)?" � original file head changed; review required":""}</p>;})}</details>)}
    {version.integrity!=="available"&&<p className="muted">Downloads verify the saved byte length and SHA-256. Missing or changed bytes cannot satisfy a requirement.</p>}
    <Field label="Extraction attempt"><select value={attempt?.id ?? ""} onChange={e=>setAttemptId(e.target.value)}><option value="">No extraction yet</option>{attempts.map(a=><option key={a.id} value={a.id}>{a.status} · {a.startedAt} · {a.parser}</option>)}</select></Field>
    {attempt&&<><p>Extraction: <strong>{attempt.status}</strong>{attempt.pages?` · ${attempt.pages} pages`:""} · {attempt.textLength.toLocaleString()} UTF-16 units</p>{attempt.warnings.map((warning,i)=><p key={i} className="muted">{warning}</p>)}</>}
    <div className="row actions"><button type="button" disabled={loading||!attempt?.artifactSha256} onClick={()=>void readText()}>View extracted text</button><button type="button" disabled={loading||props.busy||attempts.some(a=>["pending","running"].includes(a.status))} onClick={()=>void retry()}>Retry extraction</button><button type="button" disabled={loading} onClick={()=>void props.refresh?.()}>Refresh parse status</button></div>
    {text!==null&&<><Field label="Normalized extracted text" hint="Select an exact passage here, or enter its UTF-16 offsets below. Review it against the original file."><textarea readOnly rows={12} value={text} onSelect={e=>{setStart(e.currentTarget.selectionStart);setEnd(e.currentTarget.selectionEnd);markDirty(true);}}/></Field>
      {attempt?.segments.length ? <details><summary>Page or paragraph references</summary>{attempt.segments.map((s,i)=><p key={i}>{s.page?`PDF page ${s.page}`:s.section||"Text"}: {s.start}–{s.end}</p>)}</details>:null}
      {eligibility?<form className="form-stack" onSubmit={async e=>{e.preventDefault();setError("");if(!attempt)return;try{if(end<=start||end-start>20000||end>text.length)throw new Error("Select a nonempty exact passage of at most 20,000 UTF-16 units.");const result=await props.mutate({type:"promoteFileExcerpt",projectId:props.projectId,documentVersionId:version.id,parseAttemptId:attempt.id,start,end,title,by,reason,...(sourceId?{sourceId}:{})});if(result)markDirty(false);}catch(e){setError((e as Error).message);}}}>
        <div className="form-grid"><Field label="Passage start (UTF-16)"><input type="number" min={0} max={text.length} required value={start} onChange={e=>{setStart(Number(e.target.value));markDirty(true);}}/></Field><Field label="Passage end (exclusive)"><input type="number" min={1} max={text.length} required value={end} onChange={e=>{setEnd(Number(e.target.value));markDirty(true);}}/></Field></div>
        <blockquote style={{whiteSpace:"pre-wrap",overflowWrap:"anywhere"}}>{text.slice(start,end)}</blockquote>
        <Field label="Evidence note title"><input required maxLength={500} value={title} onChange={e=>{setTitle(e.target.value);markDirty(true);}}/></Field>
        <Field label="Evidence destination"><select value={sourceId} onChange={e=>{setSourceId(e.target.value);markDirty(true);}}><option value="">New reviewed evidence note</option>{props.state.sources.filter(s=>s.projectId===props.projectId&&s.versions.at(-1)?.fileOrigin?.documentId===props.document.id).map(s=><option key={s.id} value={s.id}>New reviewed revision of {s.title}</option>)}</select></Field>
        <Field label="Excerpt reviewer label"><input required maxLength={500} value={by} onChange={e=>{setBy(e.target.value);markDirty(true);}}/></Field>
        <Field label="Excerpt review reason" hint="Explain relevance and any decision to retain an older file after replacement."><textarea required minLength={5} maxLength={3000} rows={2} value={reason} onChange={e=>{setReason(e.target.value);markDirty(true);}}/></Field>
        <p className="muted">Promoting records human review of this passage. Selecting it for drafting or AI generation remains a separate action.</p><button disabled={props.busy}>Promote reviewed excerpt</button>
      </form>:<p className="muted">This extraction is ineligible for evidence promotion. Ethics files remain administrative records. The original can still be reviewed as an attachment.</p>}
    </>}
    {error&&<p role="alert" className="error">{error}</p>}
  </div>;
}
function DocumentCard(props: Props & {document:Document}) {
  const d=props.document;
  const linked=props.state.attachmentSelections.filter(s=>d.versionIds.includes(s.documentVersionId));
  return <article className="requirement">
    <div className="row spread"><h3>{d.title}</h3><Badge tone={d.archivedAt?"amber":"neutral"}>{d.archivedAt?"Archived":"Active"} · {d.provenance==="researcher"?"Researcher-provided":"Synthetic fixture"}</Badge></div>
    <p>{d.category} · {d.owner||"Owner not recorded"} · latest v{d.versionIds.length} · {d.tags.join(", ")}</p>
    {linked.length>0&&<p className="muted">Linked applications: {[...new Set(linked.map(s=>s.applicationId))].map(id=>props.state.applications.find(a=>a.id===id)).filter(Boolean).map(a=>props.state.opportunities.find(c=>c.id===a!.opportunityId)?.title??a!.id).join(", ")}</p>}
    <details><summary>Versions, original files and reviewed excerpts ({d.versionIds.length})</summary>{[...d.versionIds].reverse().map(id=><details key={id}><summary>Version {props.state.documentVersions.find(v=>v.id===id)?.version} · {props.state.documentVersions.find(v=>v.id===id)?.filename}</summary><VersionView {...props} versionId={id}/></details>)}</details>
    <details><summary>Replace with a new version</summary><p>Existing attachment selections and handoffs retain their exact earlier file. Replacement requires renewed review.</p><DocumentUpload {...props}/></details>
    <details><summary>Edit document details</summary><MetadataEditor {...props}/></details>
    <button type="button" disabled={props.busy} onClick={()=>void props.mutate({type:"archiveDocument",documentId:d.id,archived:!d.archivedAt})}>{d.archivedAt?"Unarchive document":"Archive document"}</button>
  </article>;
}
export function VaultPanel(props:Props) {
  const [search,setSearch]=useState(""),[archived,setArchived]=useState(false);
  const documents=props.state.documents.filter(d=>d.projectId===props.projectId);
  const activeParse=props.state.parseAttempts.some(a=>["pending","running"].includes(a.status)&&documents.some(d=>d.versionIds.includes(a.documentVersionId)));
  useEffect(()=>{if(!activeParse)return;const timer=setInterval(()=>void props.refresh?.(),2000);return()=>clearInterval(timer);},[activeParse,props.refresh]);
  const matches=documents.filter(d=>(archived||!d.archivedAt)&&[d.title,d.category,d.owner,...d.tags,...props.state.documentVersions.filter(v=>v.documentId===d.id).map(v=>v.filename)].join(" ").toLowerCase().includes(search.toLowerCase()));
  return <section className="card form-stack" aria-label="Project document library"><p className="eyebrow">DOCUMENT VAULT · LOCAL</p><h2>Documents</h2><p>Keep original files, review their exact versions, and select them in each application's checklist.</p>
    <details><summary>Upload a supporting document</summary><DocumentUpload {...props}/></details>
    <Field label="Search document metadata"><input type="search" value={search} onChange={e=>setSearch(e.target.value)} placeholder="Title, filename, category, owner or tags"/></Field><label className="check"><input type="checkbox" checked={archived} onChange={e=>setArchived(e.target.checked)}/>Show archived documents</label>
    {matches.length?matches.map(d=><DocumentCard key={d.id} {...props} document={d}/>):<p className="muted">No matching documents in this project.</p>}
  </section>;
}
