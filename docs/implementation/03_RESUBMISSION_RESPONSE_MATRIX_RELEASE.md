# Task 03 — Resubmission response matrix release evidence

Status: independent core implemented and checked; shared application integration is queued behind Task 02. This is not an application-complete release or a deployment claim.

Human product/scope owner: requesting user. Task 03 implementation/schema steward: this chat. Checkout `C:/Users/vzhu0/.codex/worktrees/f678/grantguide`, branch `feature/resubmission-matrix-03`, starting baseline `4b7d2059957d92d75f18984685a25bb2324a8b54` (workspace schema 2, roadmap 01 complete). The imported implementation specification retains exact SHA-256 `7D995546E39A2D13FBE6D52E1735772A6D867ADC9ED0A224080ECD34367C85A1` from the primary source.

## Hackathon value and judge proof

Researcher problem: reviewer comments get detached from proposed changes, actual evidence and the saved revision being reviewed. The distinctive mechanism connects an exact feedback quotation to shared actions, classified evidence passages, immutable target revision links, a response and a human decision. The focused judge path resolves a supported clarification, leaves an unfinished experiment open, then changes one linked source and reopens only that decision while the saved internal packet remains unchanged.

Technical impressiveness, clarity, impact and novelty are standing priorities. This release uses the existing local application and kit normalization/AI adapters; original work is the resubmission graph, capture truth, cycle separation, dependency invalidation, bounded comparison and frozen response packet. No measured time-saving, funding or market-uniqueness claim is made. Optional NIH profiles, sponsor DOCX/PDF, collaboration, external delivery and live AI tests are deferred. No actual event deadline or demo duration was supplied.

## Independent implementation

- Strict feature schemas, server-assigned IDs/times and bounded retained histories.
- Mutable captures and attested immutable snapshots, coverage exclusions, correction lineage, copied historical research/call support and SHA-256 manifests.
- Atomic attempt/target cycles and operation receipts recovered before stale global revision rejection. Reviewed copies preserve manual/fixture/live origin and need target-context review.
- Feedback-only source namespace; normalized UTF-16 exact range quotations, paragraph coverage, append-only corrections, split/merge lineage and retained conflict decisions.
- Shared actions, explicit new-evidence requirements, honest negative/inconclusive outcomes, pinned target/evidence links and manual response histories.
- Human completion conditions and scientific dependency fingerprints, with administrative owner/due changes excluded from row invalidation.
- Bounded paragraph LCS comparison, stable many-to-many section mappings and complete-text fallback.
- Selective immutable internal Markdown/JSON packets, inert Markdown escaping and safe loopback download handlers.
- Optional suggestion/response previews, exact allowed-range validation, synthetic-only fixtures, per-request live consent, shared process limiter key, 15-minute bound tokens and post-durable-save token effects.

## Shared integration contract — queued, no competing migration

Task 02 owns the shared-file lease. Its contract milestone is `67daccc`, not its final checked release. Task 03 has not modified pre-existing shared files, central docs, manifests, layout/styles or imported modules.

After the parent supplies Task 02's exact checked commit and transfers the lease:

1. Preserve its schema 3 vault collections (`documents`, `documentVersions`, `parseAttempts`, `attachmentSelections`, `ethicsRecords`, `ethicsTasks`, `handoffs`, `operationReceipts`), Requirement.vault and Source fileOrigin additions. Add schema 4 with `resubmissions: ResubmissionsSchema` and empty feature collections, plus application `cycleId: initial` / `originAttemptId: null`. Preserve byte-exact backup/migration behavior and all proposal/vault history.
2. Add `...ResubmissionCommandSchema.options` to workspace commands. Dispatch `applyResubmissionCommand` before ordinary handling; recover feature receipts before the global expected-revision gate. Its candidate state already advances global revision. Call `commitResubmissionPreview(result)` only after the repository has durably atomically saved the candidate.
3. Validate `validateResubmissionGraph` on reads and every candidate write, including ordinary draft/source/project edits. Apply the 25 MiB new-write bound without making a larger pre-existing valid store unreadable.
4. Ordinary `saveApplication` must select only the initial cycle. Never replace an original submitted app. Keep cycle labels in selectors. Demo reset must retain all referenced dependencies; the feature helper currently refuses reset once resubmission history exists.
5. Mount the feature component in drafting/review. Server-derived `/api/resubmissions/view` supplies row/attempt/document fingerprints, readiness issues, comparison and one agenda item per shared action; client code must not import node crypto. Derive Reviewed from current fingerprints, not the persisted historic attempt state.
6. New suggest/respond handlers share the existing `grantpathGenerationLimit` global. Wire the shared helper explicitly if needed without adding another independent limiter. Capture token consumption after durable persistence, never before it.
7. Add migration, repository/restart/security/browser acceptance on isolated ports, regression, final build, dev smoke and production review health/build identity verification.

## Actual verification so far

Commands in this isolated checkout:

| Command | Result |
| --- | --- |
| `npm ci` | Initial sandbox invocation failed (`Exit handler never called`); authorized unsandboxed retry exit 0, 117 packages, audit 0 vulnerabilities. |
| `npm run typecheck` | Exit 0 after independent feature implementation. |
| `npm test -- tests/resubmissions` | Exit 0, 32 tests across 3 suites (domain, comparison, generation). |

The comparison writer used isolated checkout `C:/Users/vzhu0/.codex/worktrees/task03-comparison/grantguide`, branch `feature/resubmission-comparison-03`, exclusive `comparison.ts` and `comparison.test.ts`. Commit `49d9d21e3947ff3f94d16099d30c621db23d46e1` integrated as `a0d098c`; its npm ci, typecheck, 11 tests and whitespace check exited 0. Read-only reviewer `/root/resubmission_integrity_review` supplied executable adversarial cases; the lead fixed coverage union mismatch, downgrade reasons, correction lineage, mixed provenance, retained call support, selected-history disclosure, archived revisions and token commit timing.

Independent reviewer proof: two supported rows and one unfinished experiment displayed `[Resolved, Resolved, In progress]`; editing the first linked evidence source displayed `[Needs review, Resolved, In progress]`. Its 27,089-byte packet and original snapshot remained identical through JSON restart/graph validation. This is domain proof, not yet browser/persistence integration evidence.

NSF official current-guide index and Chapter IV.E were rechecked October 25, 2026; source metadata is in `lib/resubmissions/nsf-profile.ts`. It records preparation guidance and required human decisions, not sponsor eligibility.

## Pending verification and handoff

Required app integration, migration/restart fixtures, browser A01–22 coverage, full `npm run check`, module README checks, `npm run dev`, `npm run review`, explicit `/api/health` and review URL remain pending the shared lease. Review reservations: `PORT=3003`, private `GRANTPATH_DATA_DIR=.local-data/task-03-review`; browser `3103`; dev `3203`. Tests use synthetic unique `.test-data` directories. No primary workspace/data or port 3000 server was read into fixtures or modified.

Live AI, sponsor submission, external delivery, deployment and human applicant evaluation are unrun. Ordinary tests are offline with mocked transports. Markdown/JSON are the only response packet formats; no sponsor DOCX/PDF release is claimed.
