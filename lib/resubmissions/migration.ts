import { V3StateSchema,V4StateSchema } from "../schema";
import { emptyResubmissions } from "./schema";
import { validateResubmissionGraph } from "./validation";
import { migrateV4 } from "../awards/migration";
/** Additive schema3→4 only. Repository owns serialized byte-identical backup. */
export function migrateV3(input:unknown) {
  const old=V3StateSchema.parse(input);
  return migrateV4(V4StateSchema.parse({...old,schemaVersion:4,applications:old.applications.map(a=>({...a,cycleId:a.cycleId??"initial",originAttemptId:a.originAttemptId??null})),resubmissions:emptyResubmissions()}));
}
