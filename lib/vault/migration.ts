import { V2StateSchema, StateSchema } from "../schema";
export function migrateV2(input: unknown) {
  const old = V2StateSchema.parse(input);
  return StateSchema.parse({ ...old, schemaVersion: 3 });
}
