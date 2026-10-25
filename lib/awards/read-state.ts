import { repository } from "../repository";
import { AwardsStateSchema } from "./schema";
import { requireAward } from "./context";
import { validateAwardsIntegrity } from "./integrity";

/** No side storage: integration must persist this namespace in the shared atomic repository. */
export async function readAwards() {
  const workspace = await repository().read();
  const namespace = (workspace as unknown as { awards?: unknown }).awards;
  requireAward(namespace, "Award persistence is not integrated in this application revision.", 503);
  const awards = validateAwardsIntegrity(AwardsStateSchema.parse(namespace), workspace);
  return { workspace, awards };
}
