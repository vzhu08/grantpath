import { KitError } from "../../packages/runtime/src/index";
// Uses the existing endpoint's global key, so new endpoints share its limiter
// even before the small shared-file wiring change is integrated.
const globals=globalThis as typeof globalThis&{grantpathGenerationLimit?:{inFlight:boolean;attempts:number[]}};
export function acquireGeneration() {
  const limits=(globals.grantpathGenerationLimit??={inFlight:false,attempts:[]}),now=Date.now();limits.attempts=limits.attempts.filter(t=>t>now-60_000);
  if(limits.inFlight||limits.attempts.length>=6)throw new KitError("RATE_LIMIT","Wait before trying again: one active generation and six attempts per minute are allowed.",429,true);
  limits.inFlight=true;limits.attempts.push(now);let released=false;return ()=>{if(!released){limits.inFlight=false;released=true;}};
}
