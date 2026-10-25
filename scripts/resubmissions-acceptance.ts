import assert from "node:assert/strict";
import { spawn,type ChildProcess } from "node:child_process";
import { once } from "node:events";
import { mkdir,mkdtemp,readFile,writeFile } from "node:fs/promises";
import path from "node:path";
import { chromium,expect } from "@playwright/test";
import { createResubmissionDemoWorkspace } from "../lib/resubmissions/demo";
import { StateSchema } from "../lib/schema";
import type { Workspace } from "../lib/resubmissions/context";
import { sha256 } from "../lib/resubmissions/context";
import type { ResubmissionView } from "../lib/resubmissions/view";

const fixture=createResubmissionDemoWorkspace(),parsed=StateSchema.parse(fixture.state);
assert.ok("resubmissions" in parsed,"Integrate the Task 03 workspace schema and build before running application acceptance.");
const base=path.resolve(".test-data");await mkdir(base,{recursive:true});
const data=await mkdtemp(path.join(base,"resubmissions-")),artifacts=path.resolve("test-results/resubmissions");await mkdir(artifacts,{recursive:true});
await writeFile(path.join(data,"workspace.json"),JSON.stringify(parsed,null,2));
const port=Number(process.env.GRANTPATH_TEST_PORT||3103),origin=`http://127.0.0.1:${port}`;
assert.equal(port,3103,"Task 03 acceptance uses its reserved port 3103.");
let server:ChildProcess|undefined,output="";const errors:string[]=[];
async function start(){server=spawn(process.execPath,["node_modules/next/dist/bin/next","start","--hostname","127.0.0.1","--port",String(port)],{cwd:process.cwd(),env:{...process.env,GRANTPATH_DATA_DIR:data,RUN_LIVE_AI:"false",GRANTPATH_LIBREOFFICE_PATH:"",GRANTPATH_FONT_DIR:"",NEXT_TELEMETRY_DISABLED:"1"},windowsHide:true,stdio:["ignore","pipe","pipe"]});server.stdout!.on("data",c=>output+=c);server.stderr!.on("data",c=>output+=c);for(let i=0;i<100;i++){if(server.exitCode!==null)throw new Error("Isolated acceptance server exited: "+output);try{if((await fetch(origin+"/api/health")).ok)return;}catch{}await new Promise(r=>setTimeout(r,200));}throw Error("Acceptance server did not become healthy: "+output);}
async function stop(){if(server&&server.exitCode===null){const closed=once(server,"exit");server.kill();await closed;}}
async function get<T>(url:string):Promise<T>{const response=await fetch(origin+url);assert.equal(response.status,200,await response.clone().text());return response.json() as Promise<T>;}
async function mutate(command:unknown,expectedRevision?:number){const current=await get<Workspace>("/api/workspace");return fetch(origin+"/api/workspace",{method:"POST",headers:{origin,"content-type":"application/json"},body:JSON.stringify({expectedRevision:expectedRevision??current.revision,command})});}
let browser:Awaited<ReturnType<typeof chromium.launch>>|undefined;
try{
  await start();let view=await get<ResubmissionView>("/api/resubmissions/view");assert.equal(view.concerns[fixture.supportedId]!.state,"Resolved");assert.equal(view.concerns[fixture.experimentId]!.state,"In progress");
  const packetURL=`/api/resubmissions/packets/${fixture.packetId}?format=json`,savedJSON=await(await fetch(origin+packetURL)).text(),savedMD=await(await fetch(origin+`/api/resubmissions/packets/${fixture.packetId}?format=md`)).text(),savedPacket=JSON.parse(savedJSON);assert.equal(sha256(savedPacket.payload),savedPacket.digest);assert.match(savedMD,/Internal response review packet/);assert.match(savedMD,/Required evidence passage is missing/);
  // Recover an uncertain successful packet operation despite a stale revision.
  const command={type:"saveResponsePacket",attemptId:fixture.attemptId,concernIds:fixture.state.resubmissions.concerns.map(c=>c.id),includeOriginal:true,includeTarget:true,operationId:"synthetic-packet"};const retry=await mutate(command,0);assert.equal(retry.status,200,await retry.clone().text());assert.equal((await retry.json()).selectedId,fixture.packetId);
  const originError=await fetch(origin+"/api/resubmissions/suggest",{method:"POST",headers:{origin:"https://example.invalid","content-type":"application/json"},body:"{}"});assert.equal(originError.status,403);
  const typeError=await fetch(origin+"/api/resubmissions/respond",{method:"POST",headers:{origin,"content-type":"text/plain"},body:"{}"});assert.equal(typeError.status,415);
  const large=await fetch(origin+"/api/resubmissions/suggest",{method:"POST",headers:{origin,"content-type":"application/json"},body:JSON.stringify({padding:"😀".repeat(40_000)})});assert.equal(large.status,413);
  const source=fixture.state.sources.find(s=>s.id===fixture.linkedSourceId)!;const corrected=await mutate({type:"saveSource",id:source.id,projectId:source.projectId,title:source.title,sourceType:source.type,text:source.versions[0]!.text+" Synthetic correction: the calibration plan now requires renewed review.",url:""});assert.equal(corrected.status,200,await corrected.clone().text());view=await get<ResubmissionView>("/api/resubmissions/view");assert.equal(view.concerns[fixture.supportedId]!.state,"Needs review");assert.equal(view.concerns[fixture.experimentId]!.state,"In progress");assert.equal(await(await fetch(origin+packetURL)).text(),savedJSON);
  await stop();await start();view=await get<ResubmissionView>("/api/resubmissions/view");assert.equal(view.concerns[fixture.supportedId]!.state,"Needs review");assert.equal(await(await fetch(origin+packetURL)).text(),savedJSON);assert.equal(await(await fetch(origin+`/api/resubmissions/packets/${fixture.packetId}?format=md`)).text(),savedMD);
  browser=await chromium.launch({headless:true});const context=await browser.newContext({viewport:{width:1440,height:1000},timezoneId:"America/New_York",acceptDownloads:true}),page=await context.newPage();page.on("pageerror",e=>errors.push(e.message));await page.goto(origin);await page.locator("nav").getByRole("button",{name:/Draft & readiness/}).click();await expect(page.getByLabel("Resubmission attempt")).toBeVisible();await page.getByLabel("Resubmission attempt").selectOption(fixture.attemptId);await expect(page.getByText("Needs review",{exact:true}).first()).toBeVisible();await page.getByRole("button",{name:"Compare and export",exact:true}).click();await expect(page.getByText("Old / new comparison",{exact:true})).toBeVisible();
  await page.screenshot({path:path.join(artifacts,"resubmission-desktop.png"),fullPage:true});await page.setViewportSize({width:390,height:844});await page.screenshot({path:path.join(artifacts,"resubmission-mobile.png"),fullPage:true});assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=window.innerWidth),"Mobile view must not overflow horizontally.");assert.deepEqual(errors,[]);
  await writeFile(path.join(artifacts,"result.json"),JSON.stringify({passed:true,port,data,attemptId:fixture.attemptId,packetId:fixture.packetId,proof:["supported clarification resolved","unfinished experiment stayed open","linked source edit reopened only affected row","saved packet survived edits and actual process restart","origin/content-type/raw-byte limits enforced","desktop and mobile view inspected"],errors},null,2));console.log("Resubmission acceptance passed: "+origin+" (isolated data "+data+")");
}finally{await browser?.close();await stop();}
