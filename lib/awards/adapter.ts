import type { State } from "../schema";
import type { AwardsState } from "./schema";
import { applyAwardMutation, type AwardRuntime } from "./workflow";
import { captureOrigin } from "./identity";

/** Shared repository seam, invoked inside its existing serialized atomic transaction.
 * Receipt lookup must happen here BEFORE any outer expectedRevision rejection.
 * No write/revision increment is needed for replay; return current state + original IDs.
 */
export function applyAwardWorkspaceMutation<T extends State & { awards: AwardsState }>(state: T, input: unknown,
  options: Pick<AwardRuntime, "now" | "uid"> = {}) {
  const result = applyAwardMutation(state.awards, state, input, { ...options,
    captureOrigin: (applicationId, selection, at) => captureOrigin(state, applicationId, selection, at) });
  const next = result.replayed ? state : { ...state, awards: result.awards, revision: state.revision + 1 };
  return { state: next, selectedId: result.awardId, operationResult: { resultIds: result.resultIds, replayed: result.replayed } };
}
