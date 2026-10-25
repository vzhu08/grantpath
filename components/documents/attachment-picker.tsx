"use client";
import { useState } from "react";
import type { Application, Requirement, State } from "../../lib/schema";
import { Badge, Field, useEditorDirty, type EditorProps } from "../common";
import { DocumentUpload, documentUrl } from "./vault-panel";
type Props=EditorProps&{app:Application;requirement:Requirement};
function ReviewForm(props:Props&{selection:State["attachmentSelections"][number]}) {
  const [by,setBy]=useState(""),[reason,setReason]=useState(""),[readable,setReadable]=useState(false),[relevant,setRelevant]=useState(false),[rules,setRules]=useState(false),[error,setError]=useState("");
  const [markDirty]=useEditorDirty(`attachment-review-${props.selection.id}`);
  async function save(decision:"accepted"|"rejected") {setError("");try{if(!by.trim()||reason.trim().length<5)throw new Error("Record a reviewer label and a reason of at least five characters.");if(decision==="accepted"&&(!readable||!relevant||!rules))throw new Error("Inspect the original and confirm readability, relevance and manual format rules.");const result=await props.mutate({type:"reviewAttachment",applicationId:props.app.id,selectionId:props.selection.id,decision,by,reason,readable,relevant,manualRulesChecked:rules});if(result)markDirty(false);}catch(e){setError((e as Error).message);}}
  return <form className="form-stack" onSubmit={e=>{e.preventDefault();void save("accepted");}}>
    <Field label="Attachment reviewer label"><input required maxLength={500} value={by} onChange={e=>{setBy(e.target.value);markDirty(true);}}/></Field>
    <Field label="Attachment review reason" hint="Record relevance and explain any decision to retain an older version."><textarea required minLength={5} maxLength={3000} value={reason} onChange={e=>{setReason(e.target.value);markDirty(true);}} rows={2}/></Field>
    <label className="check"><input type="checkbox" checked={readable} onChange={e=>{setReadable(e.target.checked);markDirty(true);}}/>I opened the original file and it is readable</label>
    <label className="check"><input type="checkbox" checked={relevant} onChange={e=>{setRelevant(e.target.checked);markDirty(true);}}/>This version is relevant to the requirement</label>
    <label className="check"><input type="checkbox" checked={rules} onChange={e=>{setRules(e.target.checked);markDirty(true);}}/>I checked the sponsor's remaining manual format rules</label>
    {error&&<p className="error" role="alert">{error}</p>}<div className="row actions"><button disabled={props.busy}>Accept reviewed selection</button><button type="button" disabled={props.busy} onClick={()=>void save("rejected")}>Reject selection</button></div>
  </form>;
}
export function AttachmentPicker(props:Props) {
  const {app,requirement:r,state}=props;
  const selections=state.attachmentSelections.filter(s=>s.applicationId===app.id&&s.requirementId===r.id),selection=selections.at(-1),version=state.documentVersions.find(v=>v.id===selection?.documentVersionId),document=state.documents.find(d=>d.id===version?.documentId);
  const [versionId,setVersionId]=useState(""),[error,setError]=useState("");
  const documents=state.documents.filter(d=>d.projectId===app.projectId&&!d.archivedAt);
  if(r.vault?.delivery!=="file-upload")return null;
  return <div className="form-stack" aria-label={`Attachment for ${r.description}`}>
    <p><strong>Selected original:</strong> {version&&document?`${document.title} · v${version.version} · ${version.filename}`:"No file selected"}</p>
    {selection&&<><Badge tone={selection.review?.decision==="accepted"?"green":"amber"}>{selection.review?`Review: ${selection.review.decision}`:"File review required"}</Badge>{version&&document&&<a href={`${documentUrl(document.id,version.id)}/download`}>Download selected original</a>}{selection.review&&<p className="muted">{selection.review.by} · {selection.review.at} · {selection.review.reason}</p>}</>}
    {document&&version&&document.versionIds.at(-1)!==version.id&&<p className="muted">A newer version exists. This selection still pins v{version.version}; explicitly select the replacement or review why the earlier version should be retained.</p>}
    <form className="form-stack" onSubmit={async e=>{e.preventDefault();setError("");try{if(!versionId)throw new Error("Choose an exact file version.");await props.mutate({type:"selectAttachment",applicationId:app.id,requirementId:r.id,documentVersionId:versionId});}catch(e){setError((e as Error).message);}}}>
      <Field label="Choose a project file version"><select value={versionId} required onChange={e=>setVersionId(e.target.value)}><option value="">Choose from document library</option>{documents.map(d=><optgroup key={d.id} label={`${d.title} · ${d.category}`}>{[...d.versionIds].reverse().map(id=>state.documentVersions.find(v=>v.id===id)).filter(Boolean).map(v=><option key={v!.id} value={v!.id}>v{v!.version} · {v!.filename} · {v!.mime}</option>)}</optgroup>)}</select></Field><button disabled={props.busy}>Select exact file version</button>
    </form>
    <details><summary>Upload a file for this requirement</summary><DocumentUpload {...props} projectId={app.projectId} onUploaded={()=>setVersionId("")}/><p className="muted">After upload, choose the version above and review it. Uploading never marks the requirement Ready.</p></details>
    {selection&&<details><summary>Review selected original file</summary><ReviewForm key={selection.id} {...props} selection={selection}/></details>}
    {selections.length>1&&<details><summary>Attachment selection history ({selections.length})</summary>{selections.map(s=>{const v=state.documentVersions.find(v=>v.id===s.documentVersionId);return <p key={s.id}>{s.selectedAt} · {v?.filename} v{v?.version} · {s.review?.decision??"unreviewed"}</p>;})}</details>}
    {error&&<p className="error" role="alert">{error}</p>}
  </div>;
}
