import { vaultRuntimeState, recoverVault } from "../../../lib/vault/service";
import { readJSON } from "../../../packages/runtime/src/body";
import { errorResponse } from "../../../packages/runtime/src/index";
import { MutationSchema } from "../../../lib/schema";
import { assertLocalRequest } from "../../../lib/http";
import { repository } from "../../../lib/repository";
import { proposalRuntimeState } from "../../../lib/proposals/runtime-state";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export async function GET(request: Request) {
  try {
    assertLocalRequest(request);
    await recoverVault();
    return Response.json(
      await vaultRuntimeState(
        await proposalRuntimeState(await repository().read()),
        repository().directory,
      ),
      {
        headers: { "cache-control": "no-store" },
      },
    );
  } catch (error) {
    return errorResponse(error);
  }
}
export async function POST(request: Request) {
  try {
    assertLocalRequest(request, true);
    const input = await readJSON(request, MutationSchema, 120_000);
    const result = await repository().mutate(input);
    return Response.json(
      {
        ...result,
        state: await vaultRuntimeState(
          await proposalRuntimeState(result.state),
          repository().directory,
        ),
      },
      {
        headers: { "cache-control": "no-store" },
      },
    );
  } catch (error) {
    return errorResponse(error);
  }
}
