import { vaultRuntimeState } from "../../../lib/vault/service";
import { storage } from "../../../lib/vault/storage";
import { readJSON } from "../../../packages/runtime/src/body";
import { errorResponse, KitError } from "../../../packages/runtime/src/index";
import { GenerationInputSchema } from "../../../lib/schema";
import { generateProposal } from "../../../lib/generation";
import { pendingProposals, repository, uid } from "../../../lib/repository";
import { assertLocalRequest } from "../../../lib/http";
import { acquireGeneration } from "../../../lib/resubmissions/limiter";
export const runtime = "nodejs";
export async function POST(request: Request) {
  let release:(()=>void)|undefined;
  const signal = AbortSignal.any([request.signal, AbortSignal.timeout(22_000)]);
  try {
    assertLocalRequest(request, true);
    const input = await readJSON(request, GenerationInputSchema, 120_000);
    release=acquireGeneration();
    const repo = repository(),
      state = await vaultRuntimeState(await repo.read(), repo.directory);
    for (const source of state.sources.filter((s) =>
      input.sourceIds.includes(s.id),
    )) {
      const o = source.versions.at(-1)?.fileOrigin;
      if (!o || o.manualEdit) continue;
      const attempt = state.parseAttempts.find(
        (p) => p.id === o.parseAttemptId,
      );
      if (!attempt)
        throw new KitError("EVIDENCE", "File extraction is unavailable.", 422);
      await storage(repo.directory).readText(attempt);
    }

    const { proposal, revision } = await generateProposal(state, input, signal);
    for (const [token, pending] of pendingProposals)
      if (pending.expires < Date.now()) pendingProposals.delete(token);
    if (pendingProposals.size >= 30)
      pendingProposals.delete(pendingProposals.keys().next().value!);
    const token = uid("proposal");
    pendingProposals.set(token, {
      applicationId: input.applicationId,
      sectionKey: input.sectionKey,
      stateRevision: state.revision,
      revision,
      expires: Date.now() + 15 * 60_000,
    });
    return Response.json(
      { proposal, token, mode: input.mode, inputRevision: state.revision },
      { headers: { "cache-control": "no-store" } },
    );
  } catch (error) {
    return errorResponse(
      signal.aborted
        ? new KitError(
            "CANCELLED_OR_TIMEOUT",
            "Generation was cancelled or timed out. Your draft is preserved.",
            408,
          )
        : error,
    );
  } finally {
    release?.();
  }
}
