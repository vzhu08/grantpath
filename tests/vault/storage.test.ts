import { describe, it, expect, afterEach } from "vitest";
import { mkdir, mkdtemp, readFile, writeFile, rm, utimes } from "node:fs/promises";
import path from "node:path";
import { zipSync, strToU8 } from "fflate";
import { storage,sha256 } from "../../lib/vault/storage";
import { admit } from "../../lib/vault/admission";
import { createDemo } from "../../lib/fixtures";
import type { DocumentVersion, ParseAttempt } from "../../lib/vault/schema";
const roots:string[]=[];
async function directory(){const root=path.resolve(".test-data");await mkdir(root,{recursive:true});const dir=await mkdtemp(path.join(root,"vault-storage-"));roots.push(dir);return dir;}
afterEach(async()=>{for(const dir of roots.splice(0)){if(!dir.startsWith(path.resolve(".test-data")+path.sep))throw Error("Unsafe cleanup");await rm(dir,{recursive:true,force:true});}});
function version(id:string,bytes:Uint8Array):DocumentVersion{return {id,documentId:"doc-one",version:1,filename:"cv.txt",mime:"text/plain",bytes:bytes.length,sha256:sha256(bytes),createdAt:new Date().toISOString(),documentDate:null,integrity:"unchecked"};}
function docx(extra:Record<string,Uint8Array>={}) {return zipSync({"[Content_Types].xml":strToU8('<Types><Override ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/></Types>'),"_rels/.rels":strToU8('<Relationships><Relationship Id="r1" Target="word/document.xml"/></Relationships>'),"word/document.xml":strToU8('<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"><w:body><w:p><w:r><w:t>Synthetic CV</w:t></w:r></w:p></w:body></w:document>'),...extra});}
describe("vault admission",()=>{
 it("admits actual synthetic DOCX and repository synthetic DOCX",async()=>{expect(admit("cv.docx","",docx()).mime).toContain("wordprocessingml");expect(admit("brief.docx","",await readFile("modules/documents/fixtures/brief.docx")).mime).toContain("wordprocessingml");});
 it("rejects paths, contradictory types, binary text, empty and oversized input",()=>{
  expect(()=>admit("../cv.txt","",strToU8("CV"))).toThrow(/plain filename/);expect(()=>admit("cv.txt","application/pdf",strToU8("CV"))).toThrow(/contradicts/);
  expect(()=>admit("cv.txt","",new Uint8Array([255]))).toThrow(/UTF-8/);expect(()=>admit("cv.txt","",new Uint8Array())).toThrow(/Empty/);expect(()=>admit("cv.txt","",new Uint8Array(10_000_001))).toThrow(/10,000,000/);
 });
 it("rejects macros, external relationships, embedded payloads, malformed and inconsistent ZIPs",()=>{
  expect(()=>admit("cv.docx","",docx({"word/vbaProject.bin":strToU8("macro")}))).toThrow();
  expect(()=>admit("cv.docx","",docx({"word/_rels/document.xml.rels":strToU8('<Relationships><Relationship Target="file:///secret" TargetMode="External"/></Relationships>')}))).toThrow(/External-file/);
  expect(()=>admit("cv.docx","",docx({"word/embeddings/oleObject1.bin":strToU8("payload")}))).toThrow();
  const broken=docx().slice();broken[14]=broken[14]!^255;expect(()=>admit("cv.docx","",broken)).toThrow();
  expect(()=>admit("cv.docx","",new Uint8Array([80,75,3,4]))).toThrow();
 });
 it("rejects a declared expansion bomb before inflation",()=>{const bytes=docx();const b=Buffer.from(bytes);const at=b.indexOf(Buffer.from([0x50,0x4b,0x01,0x02]));b.writeUInt32LE(50_000_001,at+24);expect(()=>admit("cv.docx","",b)).toThrow();});
});
describe("immutable original and artifact storage",()=>{
 it("survives reopening, refuses overwrite, detects corruption and missing bytes",async()=>{
  const dir=await directory(),bytes=strToU8("Synthetic CV v1"),v=version("file-v1",bytes),store=storage(dir);
  await store.put(v.id,bytes);expect(await storage(dir).read(v)).toEqual(Buffer.from(bytes));
  await expect(store.put(v.id,strToU8("new bytes"))).rejects.toThrow(/already exists/);expect(await store.read(v)).toEqual(Buffer.from(bytes));
  await writeFile(path.join(dir,"vault/blobs/file-v1.bin"),"changed");await expect(store.read(v)).rejects.toThrow(/verification/);
  await expect(store.read({...v,id:"missing"})).rejects.toThrow(/missing/);await expect(store.put("../outside",bytes)).rejects.toThrow(/record ID/);
 });
 it("failed publish and physical quota preserve committed originals",async()=>{
  const dir=await directory(),bytes=strToU8("original"),v=version("file-v1",bytes);await storage(dir).put(v.id,bytes);
  await expect(storage(dir,{beforePublish:()=>{throw Object.assign(Error("disk full"),{code:"ENOSPC"});}}).put("file-v2",bytes)).rejects.toThrow(/unavailable/);
  expect(await storage(dir).read(v)).toEqual(Buffer.from(bytes));expect(await storage(dir).physicalBytes()).toBe(bytes.length);
  await expect(storage(dir,{maxBlobBytes:bytes.length}).put("file-v2",bytes)).rejects.toThrow(/capacity/);
 });
 it("keeps normalized Unicode text separate from binary hash and detects artifact tampering",async()=>{
  const dir=await directory(),text="Method\n😀 evidence",store=storage(dir),artifactSha256=await store.writeText("parse-one",text);
  const attempt:ParseAttempt={id:"parse-one",documentVersionId:"file-one",parser:"test",status:"parsed",warnings:[],artifactSha256,textLength:text.length,segments:[],pages:null,startedAt:"now",finishedAt:"now"};
  expect(await store.readText(attempt)).toBe(text);await writeFile(path.join(dir,"vault/extractions/parse-one.txt"),"tampered");await expect(store.readText(attempt)).rejects.toThrow(/verification/);
  await expect(store.writeText("large","a".repeat(200001))).rejects.toThrow(/200,000/);
 });
 it("recovery removes only old orphans and protects saved and handoff referenced originals",async()=>{
  const dir=await directory(),store=storage(dir),bytes=strToU8("synthetic");for(const id of ["file-kept","file-orphan"]) await store.put(id,bytes);
  const state=createDemo();state.documentVersions.push(version("file-kept",bytes));
  const old=new Date(Date.now()-7200000);for(const id of ["file-kept","file-orphan"])await utimes(path.join(dir,`vault/blobs/${id}.bin`),old,old);
  expect(await store.recover(state)).toEqual({removed:1});expect(await store.read(state.documentVersions[0]!)).toEqual(Buffer.from(bytes));
 });
});
