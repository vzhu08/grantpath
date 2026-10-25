import type { State } from "../schema";
import { currentProposalRendererIdentity } from "./export-service";

// This is a volatile response projection. Saved exports remain immutable, and
// browser checks cannot mistake an earlier machine configuration for this one.
export async function proposalRuntimeState(state: State): Promise<State> {
  if (!state.proposalExports.length) return state;
  const identity = await currentProposalRendererIdentity();
  const available = !JSON.parse(identity).unavailable;
  return {
    ...state,
    proposalExports: state.proposalExports.map((job) => ({
      ...job,
      runtimeRendererMatch: available && job.renderer === identity,
    })),
  };
}
