import { parentPort, workerData } from "node:worker_threads";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { tsImport } from "tsx/esm/api";
const started=performance.now();
const sampled={peak:process.memoryUsage().heapUsed};
const sampler=setInterval(()=>{sampled.peak=Math.max(sampled.peak,process.memoryUsage().heapUsed);},10);
// This worker receives bytes only. Ingestion is local and OCR is deliberately absent.
// A thread is a local resource bound, not an OS security sandbox.
try {
  const { ingestDocument }=await tsImport(pathToFileURL(path.join(workerData.root,"modules/documents/src/server.ts")).href,import.meta.url);
  const result=await ingestDocument({filename:workerData.filename,bytes:new Uint8Array(workerData.bytes),id:workerData.id,mimeType:workerData.mime},{maxBytes:10_000_000,maxPages:100});
  if(result.text.length>200_000 || result.segments.length>10000) {
    parentPort.postMessage({status:"limit-exceeded",warnings:["TEXT_LIMIT"],text:"",segments:[],pages:null,parser:"documents-local-v1"});
  } else {
    // Normalization changes only BOM and CRLF; map segment boundaries through the same prefix operation.
    const normalize=(value)=>value.replace(/^\uFEFF/,"").replace(/\r\n?/g,"\n");
    const text=normalize(result.text);
    const offsets=new Uint32Array(result.text.length+1);let normalizedOffset=0;
    for(let index=0;index<result.text.length;index++) {
      if(!(index===0 && result.text[index]==="\uFEFF") && !(result.text[index]==="\n" && result.text[index-1]==="\r")) normalizedOffset++;
      offsets[index+1]=normalizedOffset;
    }
    const warnings=Array.isArray(result.metadata.warnings)?result.metadata.warnings:[];
    const partial=warnings.some(w=>/Some pages have no text/i.test(String(w)));
    const segments=result.segments.map(({start,end,page,section})=>({start:offsets[start],end:offsets[end],...(page?{page}:{}),...(section?{section:String(section).slice(0,500)}:{})}));
    parentPort.postMessage({status:!text.trim()?"no-text":partial?"partial":"parsed",warnings:warnings.map((w)=>/Some pages have no text/i.test(String(w))?"PARTIAL_TEXT":"PARSER_WARNING"),text,segments,pages:segments.some(s=>s.page)?Math.max(...segments.map(s=>s.page??0)):null,parser:`documents-local-v1/${result.metadata.engine??"text"}`});
  }
} catch(error) {
  const code=typeof error?.code==="string"?error.code:"PARSE_FAILED";
  parentPort.postMessage({status:code==="OCR_REQUIRED"?"no-text":/TOO_MANY|TOO_LARGE|LIMIT/.test(code)?"limit-exceeded":"failed",warnings:[/^[A-Z0-9_]{1,80}$/.test(code)?code:"PARSE_FAILED"],text:"",segments:[],pages:null,parser:"documents-local-v1"});
} finally {
  clearInterval(sampler);
  parentPort.postMessage({metrics:{durationMs:performance.now()-started,peakMemoryBytes:Math.max(sampled.peak,process.memoryUsage().heapUsed)}});
  parentPort.close();
}
