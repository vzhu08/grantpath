import type { State } from "../../lib/schema";
import type { AwardsState } from "../../lib/awards/schema";
import type { AwardMutation } from "../../lib/awards/commands";
export type AwardPanelProps = {
  state: State; awards: AwardsState; applicationId: string; busy: boolean;
  mutateAward: (mutation: AwardMutation) => Promise<{ resultIds: string[] } | null>;
  refresh?: () => Promise<void>;
};
