import { V2StateSchema, V3StateSchema } from "../schema";
import { migrateV3 } from "../resubmissions/migration";
export function migrateV2(input: unknown) {
  const old = V2StateSchema.parse(input);
  return migrateV3(V3StateSchema.parse({ ...old, schemaVersion: 3 }));
}
