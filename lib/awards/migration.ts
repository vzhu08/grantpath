import { StateSchema, V4StateSchema } from "../schema";
import { validateStateIntegrity } from "../proposals/workflow";
import { validateVaultState } from "../vault/domain";
import { validateResubmissionGraph } from "../resubmissions/validation";
import { emptyAwards } from "./schema";
import { validateAwardsIntegrity } from "./integrity";

/** Additive 4→5. Repository backs up the untouched original bytes before commit. */
export function migrateV4(input: unknown) {
  const old = V4StateSchema.parse(input);
  const state = validateResubmissionGraph(validateVaultState(validateStateIntegrity(StateSchema.parse({ ...old, schemaVersion: 5, awards: emptyAwards() }))));
  state.awards = validateAwardsIntegrity(state.awards, state);
  return state;
}
