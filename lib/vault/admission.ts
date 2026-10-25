import { inflateRawSync } from "node:zlib";
import path from "node:path";
import { KitError } from "../../packages/runtime/src/index";

export const MAX_FILE_BYTES = 10_000_000;
const MIME: Record<string, string> = {
  pdf: "application/pdf", txt: "text/plain", md: "text/markdown",
  docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
};
function reject(message = "The document structure is unsupported or inconsistent."): never {
  throw new KitError("DOCUMENT_STRUCTURE", message, 422);
}
function utf8(bytes: Uint8Array): string {
  try { return new TextDecoder("utf-8", { fatal: true }).decode(bytes); }
  catch { return reject("Use a valid UTF-8 text document."); }
}
const crcTable = Uint32Array.from({length:256}, (_, n) => {
  let c=n; for(let i=0;i<8;i++) c=(c&1)?0xedb88320^(c>>>1):c>>>1; return c>>>0;
});
function crc32(bytes: Uint8Array) {
  let crc=0xffffffff; for(const b of bytes) crc=crcTable[(crc^b)&255]!^(crc>>>8); return (crc^0xffffffff)>>>0;
}
function xmlText(value:string) {
  return value.replace(/&#(?:x([a-f0-9]+)|(\d+));/gi, (_, hex, dec) => {
    const n=parseInt(hex??dec,hex?16:10); return n<=0x10ffff?String.fromCodePoint(n):reject();
  }).replace(/&amp;/g,"&").replace(/&quot;/g,'"').replace(/&apos;/g,"'").replace(/&lt;/g,"<").replace(/&gt;/g,">");
}
/** Strict non-extracting ZIP admission. Actual inflation is bounded and CRC checked. */
function admitDocx(bytes:Uint8Array) {
  const b=Buffer.from(bytes); let end=-1;
  for(let i=b.length-22;i>=Math.max(0,b.length-65557);i--)
    if(b.readUInt32LE(i)===0x06054b50 && i+22+b.readUInt16LE(i+20)===b.length) {end=i;break;}
  if(end<0 || b.readUInt16LE(end+4)!==0 || b.readUInt16LE(end+6)!==0) reject();
  const count=b.readUInt16LE(end+10), centralSize=b.readUInt32LE(end+12), centralStart=b.readUInt32LE(end+16);
  if(!count || count>2000 || b.readUInt16LE(end+8)!==count || centralStart+centralSize!==end) reject();
  const entries=new Map<string,{start:number;end:number;data:Buffer}>();
  let cursor=centralStart, expanded=0;
  for(let n=0;n<count;n++) {
    if(cursor+46>end || b.readUInt32LE(cursor)!==0x02014b50) reject();
    const flags=b.readUInt16LE(cursor+8), method=b.readUInt16LE(cursor+10), crc=b.readUInt32LE(cursor+16),
      compressed=b.readUInt32LE(cursor+20), size=b.readUInt32LE(cursor+24), nameLength=b.readUInt16LE(cursor+28),
      extraLength=b.readUInt16LE(cursor+30), commentLength=b.readUInt16LE(cursor+32), start=b.readUInt32LE(cursor+42);
    const next=cursor+46+nameLength+extraLength+commentLength;
    if(next>end || flags&~0x080e || flags&1 || ![0,8].includes(method) || b.readUInt16LE(cursor+34)!==0) reject();
    const name=utf8(b.subarray(cursor+46,cursor+46+nameLength));
    if(!name || name.includes("\\") || name.startsWith("/") || /(^|\/)\.\.?($|\/)/.test(name) || /[\x00-\x1f:]/.test(name) || entries.has(name)) reject();
    if(/(?:vba|macro|activex|embeddings|oleobject|customui)/i.test(name)) reject("Macro packages and embedded active payloads are not accepted.");
    if(!name.endsWith("/") && !/\.(?:xml|rels|png|jpe?g|gif|bmp|tiff?|emf|wmf)$/i.test(name)) reject("This DOCX contains an unsupported embedded payload.");
    expanded+=size;
    if(expanded>50_000_000 || size>50_000_000 || compressed>MAX_FILE_BYTES || start+30>centralStart || b.readUInt32LE(start)!==0x04034b50) reject();
    const localFlags=b.readUInt16LE(start+6), localMethod=b.readUInt16LE(start+8), localNameLength=b.readUInt16LE(start+26), localExtraLength=b.readUInt16LE(start+28),
      payloadStart=start+30+localNameLength+localExtraLength, payloadEnd=payloadStart+compressed;
    if(localFlags!==flags || localMethod!==method || payloadEnd>centralStart || utf8(b.subarray(start+30,start+30+localNameLength))!==name) reject();
    let localEnd=payloadEnd;
    if(flags&8) {
      if(![0,crc].includes(b.readUInt32LE(start+14)) || ![0,compressed].includes(b.readUInt32LE(start+18)) || ![0,size].includes(b.readUInt32LE(start+22))) reject();
      if(localEnd+12>centralStart) reject();
      if(b.readUInt32LE(localEnd)===0x08074b50) localEnd+=4;
      if(localEnd+12>centralStart || b.readUInt32LE(localEnd)!==crc || b.readUInt32LE(localEnd+4)!==compressed || b.readUInt32LE(localEnd+8)!==size) reject();
      localEnd+=12;
    } else if(b.readUInt32LE(start+14)!==crc || b.readUInt32LE(start+18)!==compressed || b.readUInt32LE(start+22)!==size) reject();
    let data:Buffer;
    try { data=method===0?b.subarray(payloadStart,payloadEnd):inflateRawSync(b.subarray(payloadStart,payloadEnd),{maxOutputLength:Math.max(1,size)}); }
    catch { reject(); }
    if(data.length!==size || crc32(data)!==crc) reject();
    entries.set(name,{start,end:localEnd,data}); cursor=next;
  }
  if(cursor!==end) reject();
  const ordered=[...entries.values()].sort((a,b)=>a.start-b.start); let previous=0;
  for(const entry of ordered) {if(entry.start!==previous) reject(); previous=entry.end;}
  if(previous!==centralStart || !entries.has("[Content_Types].xml") || !entries.has("_rels/.rels") || !entries.has("word/document.xml")) reject("Upload an actual DOCX word-processing package.");
  for(const [name,entry] of entries) {
    if(!/\.(xml|rels)$/i.test(name)) continue;
    const xml=xmlText(utf8(entry.data));
    if(/<!\s*(DOCTYPE|ENTITY)/i.test(xml) || /macroenabled|vbaProject|oleObject|activeX|altChunk/i.test(xml)) reject();
    if(name==="[Content_Types].xml" && !xml.includes("application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml")) reject();
    if(name.endsWith(".rels")) {
      if(!/<Relationships\b/i.test(xml)) reject();
      for(const rel of xml.matchAll(/<Relationship\b([^>]*)\/?\s*>/gi)) {
        const attrs=new Map([...rel[1]!.matchAll(/([\w:]+)\s*=\s*(["'])(.*?)\2/gs)].map(m=>[m[1]!.toLowerCase(),m[3]!]));
        const target=attrs.get("target"), mode=attrs.get("targetmode");
        if(!target || (mode && mode.toLowerCase()!=="internal") || /^[a-z][a-z0-9+.-]*:|^[/\\]/i.test(target) || target.includes("\\")) reject("External-file relationships are not accepted.");
        const base=name==="_rels/.rels"?"":path.posix.dirname(path.posix.dirname(name));
        const resolved=path.posix.normalize(path.posix.join(base,target.split("#")[0]!));
        if(resolved.startsWith("../") || !entries.has(resolved)) reject("DOCX relationships must resolve inside the admitted package.");
      }
    }
  }
}
export function admit(filename:string, claimedMime:string, bytes:Uint8Array):{mime:string} {
  if(bytes.byteLength===0) reject("Empty uploads are not accepted.");
  if(bytes.byteLength>MAX_FILE_BYTES) throw new KitError("FILE_TOO_LARGE","Use a file of at most 10,000,000 bytes.",413);
  if(!filename || filename.length>255 || /[\\/\x00-\x1f\x7f:]/.test(filename) || /^\./.test(filename) || filename.trim()!==filename)
    throw new KitError("FILENAME","Use a plain filename without directory paths.",400);
  const extension=filename.toLowerCase().split(".").pop()!, mime=MIME[extension];
  if(!mime) throw new KitError("UNSUPPORTED_TYPE","Use PDF, TXT, Markdown or DOCX.",415);
  const claimed=claimedMime.toLowerCase().trim().split(";")[0]!;
  if(claimed && claimed!=="application/octet-stream" && claimed!==mime && !(extension==="md" && claimed==="text/plain"))
    throw new KitError("MIME_MISMATCH","The declared file type contradicts its filename.",415);
  if(extension==="pdf") {
    const b=Buffer.from(bytes);
    if(!/^%PDF-\d\.\d/.test(b.subarray(0,9).toString("ascii")) || !b.subarray(Math.max(0,b.length-2048)).includes(Buffer.from("%%EOF"))) reject("The PDF header or end marker is missing.");
  } else if(extension==="docx") admitDocx(bytes);
  else {
    const value=utf8(bytes);
    if(value.includes("\0") || /^%PDF-|^PK\x03\x04/.test(value)) reject("Binary content cannot be admitted as text.");
  }
  return {mime};
}
