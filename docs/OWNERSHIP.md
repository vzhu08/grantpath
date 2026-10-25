# Ownership

Product and scope owner: requesting user. Orchestrator/integration coordinator: Codex in chat `01a17191-e455-7b93-8c8e-54ebcf12741d`. This is the authoritative ownership board. Current assignments and handoff rules are recorded in [ORCHESTRATION.md](ORCHESTRATION.md).

Parent is responsible for keeping main updated through required checks and maintaining the latest checked main's healthy local review deployment. Completed features integrate incrementally; workers retain exclusive scopes and cannot self-merge. Primary user WIP must be preserved through reviewable commits and branch changes.

## Current application implementation

The user authorized two independent implementation chats and useful subagents in each on October 25, 2026. This supersedes the planning documents' earlier single-writer/no-subagent assumptions. Concurrent writers still require separate checkouts, branches and exclusive paths.

| Scope | Implementation owner / steward | Human owner | Checkout / duty |
| --- | --- | --- | --- |
| Central ownership, task/coordination records, API contract, implementation status and roadmap | Parent orchestrator | Requesting user | Primary `grantguide`; preserve existing roadmap and task 03/04 planning changes |
| Document vault, parsing, document/ethics/handoff UI and tests | Task 02 lead | Requesting user | Managed `306d/grantguide`, `feature/document-vault-02` |
| All pre-existing application/shared files, including contracts, migrations, layout/styles, manifests and integration scripts | Task05 source integration from frozen03 handoff506ce806; then06→08 after explicit checked runtime handoffs, later04/07/09 | Requesting user | Task03 released scope; parent owns03 CI/main/build refresh and heavy slot until explicit transfer.05 must stack resulting checkedmain before final tests; no other shared writer |
| New `lib/resubmissions/**`, `components/resubmissions/**`, `app/api/resubmissions/**`, `tests/resubmissions/**`, `scripts/resubmissions-*` and task 03 release/spec docs | Task 03 lead | Requesting user | Managed `f678/grantguide`; feature work now, shared integration after Task 02 handoff |
| New `modules/review/**`, `lib/reviews/**`, `components/reviews/**`, `app/api/review-runs/**`, `app/api/review-auth/**`, `tests/reviews/**`, `scripts/review-*` and task 04 release/spec docs | Task 04 lead | Requesting user | Managed `a92b/grantguide`; pure review/auth/UI work now, shared integration after Task 03 handoff |
| New `lib/awards/**`, `components/awards/**`, `app/api/awards/**`, `tests/awards/**`, `scripts/awards-*` and task 05 implementation/release docs | Task 05 implementation lead | Requesting user | Managed `2123/grantguide`, `feature/05-awards-progress`; shared source integration now from506ce806, checkedmain/heavy transfer before final checks; no04 prerequisite |
| New `lib/finance/**`, `components/finance/**`, `app/api/finance/**`, `tests/finance/**`, `scripts/finance-*` and own06 release/spec | Task 06 implementation lead | Requesting user | Managed `09f2/grantguide`, `feature/budget-ledger-06`; checked independent source; runtime/shared integration after checked05 |
| New `lib/financial-reports/**`, `components/financial-reports/**`, `app/api/financial-reports/**`, `tests/financial-reports/**`, `scripts/financial-reports-*` and own08 release/spec | Task 08 implementation lead | Requesting user | Managed `7556/grantguide`, `codex/financial-reports-08`; checked independent source; prioritized after actual checked05/06 runtime |
| New `lib/reminders/**`, `components/reminders/**`, `app/api/reminders/**`, `tests/reminders/**`, `scripts/reminders-*` and task 07 implementation/release docs | Task 07 implementation lead | Requesting user | Managed `239a/grantguide`, `feature/07-website-reminders`; human-approved open-site banners only |
| New `lib/discovery/**`, `components/discovery/**`, `app/api/discovery/**`, `tests/discovery/**`, `scripts/discovery-*` and task 09 implementation/release docs | Task 09 implementation lead | Requesting user | Managed `93cb/grantguide`, `feature/09-nsf-grant-discovery`; NSF/Grants.gov manual-only scope |
| Independent subagent reviews | Each task lead's assigned reviewer | Requesting user | Read-only unless assigned an exclusive file set in another isolated checkout/branch |

## Research-only tasks 05–09

The user authorized separate research chats, useful agents, GPT-6.1 Sol / Extra High (latest override: Standard/Fast off), implementation documents, brief explanations in chat and human answers to consequential questions. Research 05, 07 and 09 is complete and collected; separate implementation leads now own those scopes. Independent review accepted 05's settled logical award contract and released 06 research. Hold 08 until 06 supplies the necessary settled ledger contract and decisions. Actual implementation-dependent facts remain later integration gates. See ORCHESTRATION.md for chat IDs and unlock criteria.

Each research lead is sole writer of its own new `docs/implementation/NN_*_IMPLEMENTATION.md` and optional `docs/research/NN/**`, in its own checkout/branch. Research subagents are read-only unless separately assigned an isolated checkout and exact exclusive notes. Production code, shared docs, credentials, sends and deployment are outside research scopes. The latest human instruction authorizes a separate implementation chat after reviewed research handoff; 05/07/09 have reached that gate and transferred their specs to the implementation leads above. Parent owns central records and collects reviewed documents; it may relay the human's actual answers but may not answer in place of the human.

The requesting user is already the recorded product/approval owner. Actual human technical/product/demo role assignments were asked separately and remain unanswered; no additional people or account-derived roles are assumed. Parent coordination does not authorize deployment, sponsor submission, paid live calls or external messages.

Central parent-owned files: `docs/OWNERSHIP.md`, `docs/TASK_BOARD.md`, `docs/TASK_CARD.md`, `docs/ORCHESTRATION.md`, `docs/API_CONTRACT.md`, `docs/implementation/STATUS.md`, `docs/ROADMAP.md`. Task leads supply proposed contract/status updates in their own release notes. Neither task changes `.github/**`, `AGENTS.md`, or `kit.project.json` under this assignment.

## Historical roadmap 01 assignments

| Scope                                                                            | Owner                        | Checkout / duty                                                   |
| -------------------------------------------------------------------------------- | ---------------------------- | ----------------------------------------------------------------- |
| Root manifests/lock, app, shared schemas/repository, renderer, docs except below | Codex lead                   | grantguide, roadmap/01-nsf-proposals; integrate and verify        |
| `.github/**`, `docs/GITHUB_AUTOMATION.md`                                        | github_automation agent      | isolated managed github-ci worktree; CI/policy tests and PR       |
| `lib/proposals/nsf-template.ts`, scoped template tests/policy docs               | nsf_template_manifest agent  | isolated managed nsf-template worktree; immutable manifest and PR |
| Read-only draft/security review                                                  | review_drafting_safety agent | no writes; concrete findings and artifact checks                  |

Initial implementation used serial writes/read-only reviews because the empty workspace was not yet in Git. After the user requested GitHub and useful parallelism, the verified initial commit was pushed and independent writers received separate Git checkouts/branches. Root manifests, contracts, application routes and integration remain lead-owned. No distributed orchestration was installed.

Normal review port 3000/data `.local-data`; baseline browser tests port 3100/unique `.test-data` dirs; renderer checks use ignored `test-results`. Implementation task NN reserves review/browser/dev ports `3000+NN` / `3100+NN` / `3200+NN` (currently 02,03,04,05,07,09). Each uses its own checkout and ignored `.local-data/task-NN-review`; acceptance uses unique `.test-data` directories. Task 04's lightweight OAuth setup is on 3304, separate from final application review. Do not infer human teammates or decision rights from generic kit templates. No added paid usage, sponsor submissions or public deployment.
