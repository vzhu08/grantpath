# Ownership

Product and scope owner: requesting user. Orchestrator/integration coordinator: Codex in chat `01a17191-e455-7b93-8c8e-54ebcf12741d`. This is the authoritative ownership board. Current assignments and handoff rules are recorded in [ORCHESTRATION.md](ORCHESTRATION.md).

Parent is responsible for keeping main updated through required checks and maintaining the latest checked main's healthy local review deployment. Completed features integrate incrementally; workers retain exclusive scopes and cannot self-merge. Primary user WIP must be preserved through reviewable commits and branch changes.

## Current application implementation

The user authorized two independent implementation chats and useful subagents in each on October 25, 2026. This supersedes the planning documents' earlier single-writer/no-subagent assumptions. Concurrent writers still require separate checkouts, branches and exclusive paths.

| Scope | Implementation owner / steward | Human owner | Checkout / duty |
| --- | --- | --- | --- |
| Central ownership, task/coordination records, API contract, implementation status and roadmap | Parent orchestrator | Requesting user | Primary `grantguide`; preserve existing roadmap and task 03/04 planning changes |
| Document vault, parsing, document/ethics/handoff UI and tests | Task 02 lead | Requesting user | Managed `306d/grantguide`, `feature/document-vault-02` |
| All pre-existing application/shared files, including contracts, migrations and integration scripts | Task06 shared SOURCE from final checked05 handoff3abe165; parent05 CI/main/build heavy slot, then06 heavy after explicit release | Requesting user |05released/frozen;06must stack resulting checkedmain before final acceptance.08next, then later04/07/09. Parent central docs/.github/AGENTS/kit/manifests/layout/styles/03harness stay outside this lease unless separately coordinated |
| New `lib/resubmissions/**`, `components/resubmissions/**`, `app/api/resubmissions/**`, `tests/resubmissions/**`, `scripts/resubmissions-*` and task 03 release/spec docs | Task 03 complete; parent integration steward | Requesting user | Managed `f678/grantguide`; frozen506ce806, main2da6a31; parent owns acceptance harness; no ongoing03 writer |
| New `modules/review/**`, `lib/reviews/**`, `components/reviews/**`, `app/api/review-runs/**`, `app/api/review-auth/**`, `tests/reviews/**`, `scripts/review-*` and task 04 release/spec docs | Task 04 lead | Requesting user | Managed `a92b/grantguide`; offline source checkpointd55d874/doc1a5d4f9 ready; shared integration after05→06→08, no lease now |
| New `lib/awards/**`, `components/awards/**`, `app/api/awards/**`, `tests/awards/**`, `scripts/awards-*` and task 05 release/spec | Task05 complete; parent integration steward | Requesting user | `2123/grantguide`, frozen3abe165/app6c7ad91;3005review healthy; source/heavy released; parent exact-CI/main refresh underway |
| New `lib/finance/**`, `components/finance/**`, `app/api/finance/**`, `tests/finance/**`, `scripts/finance-*` and own06 release/spec | Task06 implementation lead | Requesting user | `09f2/grantguide`; shared SOURCE lease from3abe165 now, parent reserves05 heavy refresh then explicit transfer. Actual adapter5tests passed against early14c; reconcile final05 now |
| New `lib/financial-reports/**`, `components/financial-reports/**`, `app/api/financial-reports/**`, `tests/financial-reports/**`, `scripts/financial-reports-*` and own08 release/spec | Task 08 implementation lead | Requesting user | Managed `7556/grantguide`, `codex/financial-reports-08`; checked independent source; prioritized after actual checked05/06 runtime |
| New `lib/reminders/**`, `components/reminders/**`, `app/api/reminders/**`, `tests/reminders/**`, `scripts/reminders-*` and task 07 implementation/release docs | Task 07 implementation lead | Requesting user | Managed `239a/grantguide`, `feature/07-website-reminders`; human-approved open-site banners only |
| New `lib/discovery/**`, `components/discovery/**`, `app/api/discovery/**`, `tests/discovery/**`, `scripts/discovery-*` and task 09 implementation/release docs | Task 09 implementation lead | Requesting user | Managed `93cb/grantguide`, `feature/09-nsf-grant-discovery`; NSF/Grants.gov manual-only scope |
| Independent subagent reviews | Each task lead's assigned reviewer | Requesting user | Read-only unless assigned an exclusive file set in another isolated checkout/branch |
| `docs/reviews/PRE_UI_ACCEPTANCE.md`, `docs/reviews/pre-ui-evidence/**`; no application edits | Existing review chat `01a171d9-b270-72d2-8d9b-73364c6a3834` | Requesting user | Prepare matrix now with read-only agents; final combined/rendered acceptance after checked02–09 main and explicit heavy-slot transfer, isolated data/port3120. No heavy lease now; GO required before redesign |
| `docs/design/UI_REDESIGN_PLAN.md`, `docs/design/ui-exploration/**` only | UI phase1 chat `01a1726f-1eb0-78e3-84b4-4612859da62f`, `6c30/grantguide` | Requesting user | Ideation/planning now with read-only agents; no app/frontend/heavy writes. Same chat may implement later only after combined GO and explicit frontend lease |

## Parallel core implementations — no frontend/shared integration

| Exclusive new scope | Lead chat / checkout | Human owner |
| --- | --- | --- |
| `modules/grantweave/**`, `lib/grantweave/**`, `tests/grantweave/**`, `scripts/grantweave-*`, `docs/implementation/11_GRANTWEAVE_RELEASE.md` | `01a17253-910c-7610-909c-84831a022d03`; `2c3a/grantguide` | Requesting user |
| `modules/aimfit/**`, `lib/aimfit/**`, `tests/aimfit/**`, `scripts/aimfit-*`, `docs/implementation/12_AIMFIT_RELEASE.md` | `01a17253-baf7-7ef2-8c5d-8a59184c6d16`; `b78e/grantguide` | Requesting user |
| `modules/bootstrap/**`, `lib/bootstrap/**`, `tests/bootstrap/**`, `scripts/bootstrap-*`, `docs/implementation/13_BOOTSTRAP_RELEASE.md` | `01a17253-d870-7153-bc75-06a35b56d908`; `cc64/grantguide` | Requesting user |

Latest human instruction authorizes these independent core writers now, not frontend components/fixtures, root schemas/migrations/repository/routes/manifests or live upstream adapters. Each lead uses useful agents; concurrent sub-writers require separate checkouts and exclusive files. Only read-only existing dependencies and parent-coordinated bounded pure-test slots are permitted while05 owns heavy verification. Source studies can be copied from primary; central/research-owner files are not a new write lease. Later integration/validation/deployment requirements remain explicit.

## Immediate research ownership

The human now requests these four research chats before the UI break; older research-start timing is superseded. Frontend code may change. No application/shared writes or heavy checks are assigned; all final implementation details depending on unfinished runtime remain provisional.

| Exclusive document scope | Lead chat / checkout | Human owner |
| --- | --- | --- |
| `docs/research/REAL_GRANT_DATA_FEASIBILITY.md`, `docs/research/real-grant-data/**` | `01a1722e-688c-7253-a330-a4bbff107f78`; `21b7/grantguide` | Requesting user |
| `docs/implementation/11_GRANTWEAVE_IMPLEMENTATION.md`, `docs/research/11/**` | `01a1722e-8b65-7443-843c-55b03fb4758a`; `d80b/grantguide` | Requesting user |
| `docs/implementation/12_AIMFIT_IMPLEMENTATION.md`, `docs/research/12/**` | `01a1722e-c293-7cf1-aec7-b4adbd4fc5f6`; `80d1/grantguide` | Requesting user |
| `docs/implementation/13_BOOTSTRAP_IMPLEMENTATION.md`, `docs/research/13/**` | `01a1722e-c38e-7e12-84e1-c30606142796`; `b22b/grantguide` | Requesting user |

Each lead is sole document writer with useful read-only agents. No worker account is treated as a human expert or approval owner. Parent coordinates actual merged prerequisites and collects reviewed docs; agents do not answer required human choices.

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
