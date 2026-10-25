# Task board

Authoritative ownership: OWNERSHIP.md. Product owner: requesting user.

## Current implementation dispatch

- Roadmap 01 baseline: merged at `4b7d2059957d92d75f18984685a25bb2324a8b54`; actual verification remains in `implementation/STATUS.md`.
- Task 02 Document Vault: independent chat `01a17194-b0ef-7d12-b587-46381048bb4c`, managed checkout `306d/grantguide`, branch `feature/document-vault-02`; isolated `/root/vault_storage` and `/root/vault_ui` writers plus read-only `/root/vault_review` reported. Owns initial shared integration lease. Schema 3 contract-only commit `67daccc` reported and relayed to Task 03; it is not a runnable/final handoff. Reviewer fixes and locked dependency installation are in progress; no final acceptance or lease release yet.
- Task 03 Resubmission Response Matrix: independent chat `01a17195-0179-74c2-b93c-d6dbb7f6144d`, managed checkout `f678/grantguide`, branch `feature/resubmission-matrix-03`; read-only `/root/resubmission_integrity_review` and isolated writing `/root/resubmission_comparison` subagents reported. Exact spec copy verified. Feature-only contracts/capture/feedback and nested schema 4 plan reported; integration seams relayed to Task 02. Shared integration still waits for Task 02's checked handoff and parent lease transfer.
- Task 04 Evidence-Linked Rubric Review: active chat `01a171aa-4c43-7972-800b-0f330c3a9b5b`, lead checkout `a92b/grantguide`, branch `feature/evidence-rubric-review-04`; isolated core/auth/UI work. ER-01 account access independently verified from sanitized evidence: completed GPT-6.1 Sol request funded by ChatGPT plan, validated grant and human-confirmed paid-credit spillover off. Full semantic feature acceptance/local review remains pending; shared integration queues after Task 03.
- Task 05 Awards/progress implementation: new chat `01a171b9-ee4e-7db3-ae2b-946085ce9c29`, `2123/grantguide`, `feature/05-awards-progress`; exact completed spec copied, read-only `/root/award_contract_review`; exclusive new award paths, no shared/heavy slot yet.
- Task 07 Website reminders implementation: new chat `01a171b9-fe30-7173-b466-0b30b0105231`, `239a/grantguide`, `feature/07-website-reminders`; exact spec/deferred note copied, read-only `/root/reminders_audit`; open-site banner cut only, no shared/heavy slot yet.
- Task 09 NSF discovery implementation: new chat `01a171ba-7924-79d0-9a73-19ec257e4445`, `93cb/grantguide`, `feature/09-nsf-grant-discovery`; read-only `/root/discovery_contract_review`; manual-only Grants.gov scope and bounded free public API preflight, no shared/heavy slot yet.
- Parent orchestration: chat `01a17191-e455-7b93-8c8e-54ebcf12741d`; owns central docs, integration order and future task coordination. See [ORCHESTRATION.md](ORCHESTRATION.md).

No application acceptance checks have been run by the parent for this dispatch. Worker release notes must distinguish local checks, PR/CI verification, integration and deployment. The normal workspace/data/server are preserved.

## Research-only dispatch 05–09

- 05 Awards/progress research complete: `cf6ab6f`, collected exact own spec into primary. Human selected NSF annual narrative worksheet. Parent independent review accepted its logical award boundary; code integration still needs checked runtime evidence.
- 07 Reminders research complete: `3d9da79`, exact spec and deferred note collected. Human finalized open-site banners only; external delivery deferred. New implementation above.
- 09 Discovery research complete: `d219f45`, exact spec collected. Human finalized NSF/Grants.gov with manual-only refresh. New implementation above.
- 06 Budget/ledger research: active chat `01a171bb-5d7b-74a3-bc64-2f10b8e516ae`, `1a63/grantguide`, `research/06-budget-ledger`, two read-only agents. Human scope/CSV/indirect assumptions are pending. 08 Financial reports remains held until 06 supplies settled ledger facts and human choices.
- All retain requested GPT-6.1 Sol / Extra High, useful read-only research agents, brief in-chat explanations and consequential HUMAN answers. The latest human speed preference is Standard / Fast off; parent removed the host Fast override and notified all current leads, without claiming verified per-thread tier changes. Research authorizes documents, not feature code. Exact outputs/gates are in ORCHESTRATION.md.

## Historical initial and roadmap 01 board

- Initial four-capability build and roadmap docs: complete, 69 baseline tests and production browser journey passed; initial main pushed as 7481ffe.
- PT-01 canonical renderer: lead-owned, implemented with real LibreOffice/Times rendering, page-limit and fidelity checks; final checks/PR in progress.
- PT-02 immutable NSF manifest: agent-owned isolated branch; reviewed source metadata, conditional components and focused tests; PR in progress. Application schema migration/editor integration remains pending.
- GitHub automation: agent-owned isolated branch; required CI check, browser journey, policy tests, Dependabot and explicit-label merge policy; repo settings/integration pending.
- Local review handoff: user requested a healthy local server and link after this and future application tasks. Use build then `npm run review`.

No paid live tests, external messages, sponsor submission or public deployment. User-authorized GitHub commits/PRs/eligible merges are permitted, with required checks. Other roadmap items remain future work.
