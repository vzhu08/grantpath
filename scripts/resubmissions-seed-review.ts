import { mkdir,open } from "node:fs/promises";
import path from "node:path";
import { createResubmissionDemoWorkspace } from "../lib/resubmissions/demo";
import { StateSchema } from "../lib/schema";
const directory=path.resolve(".local-data/task-03-review"),fixture=createResubmissionDemoWorkspace(),parsed=StateSchema.parse(fixture.state);
if(!("resubmissions" in parsed))throw new Error("Integrate the Task 03 workspace schema before preparing the review fixture.");
await mkdir(directory,{recursive:true});
try{const file=await open(path.join(directory,"workspace.json"),"wx",0o600);try{await file.writeFile(JSON.stringify(parsed,null,2),"utf8");await file.sync();}finally{await file.close();}console.log("Prepared synthetic Task 03 review data in "+directory);}
catch(error){if((error as NodeJS.ErrnoException).code!=="EEXIST")throw error;console.log("Preserved existing Task 03 private review workspace in "+directory);}
