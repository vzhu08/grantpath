import { afterEach,describe,it,expect } from "vitest";
import { mkdir,mkdtemp,readFile,readdir,writeFile,rm } from "node:fs/promises";
import path from "node:path";
import { createDemo,createApplication } from "../../lib/fixtures";
import { createRepository } from "../../lib/repository";
import { applyProposalCommand,canonicalStringify,sha256 as proposalHash } from "../../lib/proposals/workflow";
import { createResubmissionDemoWorkspace } from "../../lib/resubmissions/demo";
import { concernState } from "../../lib/resubmissions/matrix";
import { packetJSON } from "../../lib/resubmissions/exports";
import { StateSchema } from "../../lib/schema";
import { SectionMapping } from "../../lib/resubmissions/schema";
const root=path.resolve(".test-data/resubmissions-repository"),directories:string[]=[];
async function directory(){await mkdir(root,{recursive:true});const value=await mkdtemp(path.join(root,"case-"));directories.push(value);return value;}
afterEach(async()=>{for(const dir of directories.splice(0)){const resolved=path.resolve(dir);if(!resolved.startsWith(root+path.sep))throw Error("Refusing cleanup outside isolated test data.");await rm(resolved,{recursive:true,force:true});}});
describe("schema4 migration and durable recovery",()=>{
  it("migrates schema3 with an exact byte backup and preserves frozen proposal payload/digest and vault artifacts",async()=>{
    const state=createDemo(),app=createApplication(state.projects[0]!,state.opportunities[0]!,state,"legacy-original");state.applications.push(app);
    applyProposalCommand(state,{type:"freezePacket",applicationId:app.id},"2026-10-25T12:00:00.000Z");
    const old=JSON.parse(JSON.stringify(state));old.schemaVersion=3;delete old.resubmissions;
    for(const application of old.applications){delete application.cycleId;delete application.originAttemptId;}
    for(const packet of old.packetSnapshots){delete packet.payload.application.cycleId;delete packet.payload.application.originAttemptId;packet.digest=proposalHash(canonicalStringify(packet.payload));}
    const payload=JSON.stringify(old.packetSnapshots[0].payload),digest=old.packetSnapshots[0].digest;
    const dir=await directory(),file=path.join(dir,"workspace.json"),bytes=Buffer.from("\r\n"+JSON.stringify(old,null,"\t").replace(/\n/g,"\r\n")+"\r\n");
    await mkdir(path.join(dir,"vault/blobs"),{recursive:true});const artifact=path.join(dir,"vault/blobs/retained-original.bin"),artifactBytes=Buffer.from("SYNTHETIC retained original file\0\r\n");await writeFile(artifact,artifactBytes);await writeFile(file,bytes);
    const migrated=await createRepository(dir).read();expect(migrated.schemaVersion).toBe(4);expect(migrated.applications[0]!.cycleId).toBe("initial");expect(migrated.applications[0]!.originAttemptId).toBeNull();expect(migrated.resubmissions.snapshots).toHaveLength(0);expect(migrated.resubmissions.attempts).toHaveLength(0);expect(migrated.projects).toEqual(old.projects);expect(migrated.sources).toEqual(old.sources);expect(migrated.opportunities).toEqual(old.opportunities);expect(JSON.stringify(migrated.packetSnapshots[0]!.payload)).toBe(payload);expect(migrated.packetSnapshots[0]!.digest).toBe(digest);expect(await readFile(artifact)).toEqual(artifactBytes);
    const backups=(await readdir(dir)).filter(f=>f.startsWith("workspace.v3-"));expect(backups).toHaveLength(1);expect(await readFile(path.join(dir,backups[0]!))).toEqual(bytes);const saved=await readFile(file);expect(await createRepository(dir).read()).toEqual(migrated);expect(await readFile(file)).toEqual(saved);expect((await readdir(dir)).filter(f=>f.startsWith("workspace.v3-"))).toEqual(backups);
  });
  it("recovers lost-success receipts before revision checks and persists targeted source invalidation across restart",async()=>{
    const fixture=createResubmissionDemoWorkspace(),dir=await directory();await writeFile(path.join(dir,"workspace.json"),JSON.stringify(fixture.state,null,2));const repo=createRepository(dir),before=packetJSON(fixture.state.resubmissions.packets[0]!);
    const command={type:"saveResponsePacket" as const,attemptId:fixture.attemptId,concernIds:fixture.state.resubmissions.concerns.map(c=>c.id),includeOriginal:true,includeTarget:true,operationId:"synthetic-packet"};const first=await repo.read(),retried=await repo.mutate({expectedRevision:0,command});expect(retried.selectedId).toBe(fixture.packetId);expect(retried.replayed).toBe(true);expect(retried.state.revision).toBe(first.revision);await expect(repo.mutate({expectedRevision:0,command:{...command,includeTarget:false}})).rejects.toMatchObject({status:409});
    const source=first.sources.find(s=>s.id===fixture.linkedSourceId)!;await repo.mutate({expectedRevision:first.revision,command:{type:"saveSource",id:source.id,projectId:source.projectId!,title:source.title,sourceType:source.type,text:source.versions[0]!.text+" Synthetic correction requiring renewed review.",url:""}});
    const restarted=await createRepository(dir).read(),concern=restarted.resubmissions.concerns.find(c=>c.id===fixture.supportedId)!;expect(concernState(restarted,concern)).toBe("Needs review");expect(concernState(restarted,restarted.resubmissions.concerns.find(c=>c.id===fixture.experimentId)!)).toBe("In progress");expect(packetJSON(restarted.resubmissions.packets[0]!)).toBe(before);
  });
  it("same-call ordinary open selects initial cycle and never reuses a target",async()=>{
    const fixture=createResubmissionDemoWorkspace(),dir=await directory();await writeFile(path.join(dir,"workspace.json"),JSON.stringify(fixture.state));const repo=createRepository(dir),result=await repo.mutate({expectedRevision:fixture.state.revision,command:{type:"saveApplication",projectId:"demo-project",opportunityId:"demo-call-1"}});expect(result.selectedId).toBe("resubmission-demo-original");expect(result.state.applications).toHaveLength(2);expect(result.state.applications.find(a=>a.id===fixture.targetApplicationId)!.originAttemptId).toBe(fixture.attemptId);await expect(repo.mutate({expectedRevision:result.state.revision,command:{type:"resetDemo"}})).rejects.toThrow(/retained/);
  });
  it("competing writes return409 and no partial save; interrupted temporary data does not replace accepted state",async()=>{
    const fixture=createResubmissionDemoWorkspace(),dir=await directory(),file=path.join(dir,"workspace.json");await writeFile(file,JSON.stringify(fixture.state));const repo=createRepository(dir),revision=fixture.state.revision;
    const commands=["First internal opening","Competing internal opening"].map(opening=>({expectedRevision:revision,command:{type:"saveResponseDocument" as const,attemptId:fixture.attemptId,concernOrder:fixture.state.resubmissions.concerns.map(c=>c.id),opening,closing:"",by:""}}));const result=await Promise.allSettled(commands.map(input=>repo.mutate(input)));expect(result.filter(r=>r.status==="fulfilled")).toHaveLength(1);const rejected=result.find(r=>r.status==="rejected") as PromiseRejectedResult;expect(rejected.reason.status).toBe(409);const accepted=await readFile(file);await writeFile(path.join(dir,".workspace-interrupted.tmp"),"{unfinished");expect((await createRepository(dir).read()).revision).toBe(revision+1);expect(await readFile(file)).toEqual(accepted);
  });
  it.each(["future","missing-feature","broken-graph","broken-receipt"])("preserves %s storage as a recoverable error",async kind=>{
    const fixture=createResubmissionDemoWorkspace(),input=JSON.parse(JSON.stringify(fixture.state));if(kind==="future")input.schemaVersion=999;if(kind==="missing-feature")delete input.resubmissions;if(kind==="broken-graph")input.resubmissions.responses[0].concernId="missing";if(kind==="broken-receipt")input.resubmissions.receipts[0].resultIds=["missing"];const dir=await directory(),file=path.join(dir,"workspace.json"),bytes=Buffer.from(JSON.stringify(input));await writeFile(file,bytes);await expect(createRepository(dir).read()).rejects.toMatchObject({status:503});expect(await readFile(file)).toEqual(bytes);
  });
  it("rejects an empty mapping before it can make comparison unreadable",()=>{expect(SectionMapping.safeParse({originalSectionId:null,targetSectionIds:[],note:""}).success).toBe(false);expect(StateSchema.safeParse({...createDemo(),resubmissions:undefined}).success).toBe(false);});
});
