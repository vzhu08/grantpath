import type { PlanningInput } from "../../modules/bootstrap/src/index";

/** Feature-owned future host seam; NOT a task-03 DTO, repository, route or implemented adapter. */
export type BootstrapIntakeRead =
  | { status: "available"; input: PlanningInput; checkedHostRevision: string }
  | { status: "unavailable"; reason: string };
export interface BootstrapIntakePort {
  /** Must hydrate actual vault integrity, recheck real 03 IDs/revisions/citations/currentness and accepted+confirmed unstarted work. */
  readCurrent(projectId: string, attemptId: string, concernIds: readonly string[]): Promise<BootstrapIntakeRead>;
}
/** No synthetic fallback and no claim of a working host integration. */
export const unavailableBootstrapIntake: BootstrapIntakePort = {
  async readCurrent() { return { status: "unavailable", reason: "Bootstrap core only: authoritative task-03 host adapter and shared persistence/API integration are not assigned." }; },
};
