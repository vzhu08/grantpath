# Task board

Authoritative ownership: OWNERSHIP.md. Product owner: requesting user.

## Current implementation dispatch

- Roadmap 01 baseline: merged at `4b7d2059957d92d75f18984685a25bb2324a8b54`; actual verification remains in `implementation/STATUS.md`.
- Task 02 Document Vault: completed checked handoff `d3c252b`, integrated into main `b4485b6` through passing PR7. Parent verified main production build/revision/health/readiness at port3000; original workspace bytes backed up. Shared lease released.
- Task 03 Resubmission Response Matrix: chat `01a17195-0179-74c2-b93c-d6dbb7f6144d`, `f678/grantguide`, `feature/resubmission-matrix-03`; owns current shared integration/verification lease. Schema4 integration check passed197 tests/build and feature browser; final regression/release pending. Produced three separate portable infrastructure fixes for parent main hotfix; no app-complete claim yet.
- Task 04 Evidence-Linked Rubric Review: active chat `01a171aa-4c43-7972-800b-0f330c3a9b5b`, lead checkout `a92b/grantguide`, branch `feature/evidence-rubric-review-04`; isolated core/auth/UI work. ER-01 account access independently verified from sanitized evidence: completed GPT-6.1 Sol request funded by ChatGPT plan, validated grant and human-confirmed paid-credit spillover off. Full semantic feature acceptance/local review remains pending; shared integration queues after Task 03.
- Task 05 Awards/progress implementation: new chat `01a171b9-ee4e-7db3-ae2b-946085ce9c29`, `2123/grantguide`, `feature/05-awards-progress`; exact completed spec copied, read-only `/root/award_contract_review`; exclusive new award paths, no shared/heavy slot yet.
- Task 07 Website reminders implementation: new chat `01a171b9-fe30-7173-b466-0b30b0105231`, `239a/grantguide`, `feature/07-website-reminders`; exact spec/deferred note copied, read-only `/root/reminders_audit`; open-site banner cut only, no shared/heavy slot yet.
- Task 09 NSF discovery implementation: new chat `01a171ba-7924-79d0-9a73-19ec257e4445`, `93cb/grantguide`, `feature/09-nsf-grant-discovery`; read-only `/root/discovery_contract_review`; manual-only Grants.gov scope and bounded free public API preflight, no shared/heavy slot yet.
- Task 06 Budget/ledger implementation: chat `01a171dd-a0a5-72d3-b598-da05f444f220`, `09f2/grantguide`, `feature/budget-ledger-06`; independent finance/CSV agents, only new finance paths, no heavy/shared or checked05-runtime integration gate released.
- Task 08 Financial reports implementation: new chat `01a171f5-1cc6-7082-903f-f3f51ec3d348`, `7556/grantguide`; reviewed synthetic internal-CSV spec; kickoff pending. Actual checked05/06 runtime and shared/resource leases required before integration.
- Parent orchestration: chat `01a17191-e455-7b93-8c8e-54ebcf12741d`; owns central docs, integration order and future task coordination. See [ORCHESTRATION.md](ORCHESTRATION.md).

Parent verified the exact checked main deployment independently. Infrastructure review on b448 confirmed connected client/server/import/API paths, a readiness P1 and API-message/metadata P2 findings; portable repairs passed19 focused tests on the main base and are on a CI-gated hotfix branch. Full-directory offline backup remains the interim for complete proposal-export restoration. The normal workspace/data are preserved.

## Research-only dispatch 05–09

- 05 Awards/progress research complete: `cf6ab6f`, collected exact own spec into primary. Human selected NSF annual narrative worksheet. Parent independent review accepted its logical award boundary; code integration still needs checked runtime evidence.
- 07 Reminders research complete: `3d9da79`, exact spec and deferred note collected. Human finalized open-site banners only; external delivery deferred. New implementation above.
- 09 Discovery research complete: `d219f45`, exact spec collected. Human finalized NSF/Grants.gov with manual-only refresh. New implementation above.
- 06 Budget/ledger research complete: `a6d6b5b`, collected into main with reviewed logical snapshot/reconciliation/cutoff boundary. All four human choices settled. Separate implementation above; actual05 runtime remains its integration gate.
- 08 Financial reports research complete: `d5f2738`, independent review found no implementation-dispatch blocker. Human chose synthetic NSF internal CSV, one confirmed period/cutoff, paid basis/synthetic comparison and local product-owner review without institutional authority. Separate implementation above.
- All retain requested GPT-6.1 Sol / Extra High, useful read-only research agents, brief in-chat explanations and consequential HUMAN answers. The latest human speed preference is Standard / Fast off; parent removed the host Fast override and notified all current leads, without claiming verified per-thread tier changes. Research authorizes documents, not feature code. Exact outputs/gates are in ORCHESTRATION.md.

## Queued whole-product UI break

Human-requested redesign prompt: [GrantPath UI redesign](prompts/GRANTPATH_UI_REDESIGN.md). Prepared now; not dispatched. Launch after the current selected implementation pipeline is merged/checked and frontend scopes are released, before research 11–13. Requires distinctive product-derived identity/signature interaction, agents with isolated ownership, actual rendered/browser verification, final local review and a design system mandatory for subsequent frontend work. Task10 is skipped; 11–13 also require their actual merged code prerequisites.

## Historical initial and roadmap 01 board

- Initial four-capability build and roadmap docs: complete, 69 baseline tests and production browser journey passed; initial main pushed as 7481ffe.
- PT-01 canonical renderer: lead-owned, implemented with real LibreOffice/Times rendering, page-limit and fidelity checks; final checks/PR in progress.
- PT-02 immutable NSF manifest: agent-owned isolated branch; reviewed source metadata, conditional components and focused tests; PR in progress. Application schema migration/editor integration remains pending.
- GitHub automation: agent-owned isolated branch; required CI check, browser journey, policy tests, Dependabot and explicit-label merge policy; repo settings/integration pending.
- Local review handoff: user requested a healthy local server and link after this and future application tasks. Use build then `npm run review`.

No paid live tests, external messages, sponsor submission or public deployment. User-authorized GitHub commits/PRs/eligible merges are permitted, with required checks. Other roadmap items remain future work.
