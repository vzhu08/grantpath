# Ownership

Product owner: requesting user. Lead writer/integrator: Codex in this chat. This is the authoritative ownership board.

| Scope                                                                            | Owner                        | Checkout / duty                                                   |
| -------------------------------------------------------------------------------- | ---------------------------- | ----------------------------------------------------------------- |
| Root manifests/lock, app, shared schemas/repository, renderer, docs except below | Codex lead                   | grantguide, roadmap/01-nsf-proposals; integrate and verify        |
| `.github/**`, `docs/GITHUB_AUTOMATION.md`                                        | github_automation agent      | isolated managed github-ci worktree; CI/policy tests and PR       |
| `lib/proposals/nsf-template.ts`, scoped template tests/policy docs               | nsf_template_manifest agent  | isolated managed nsf-template worktree; immutable manifest and PR |
| Read-only draft/security review                                                  | review_drafting_safety agent | no writes; concrete findings and artifact checks                  |

Initial implementation used serial writes/read-only reviews because the empty workspace was not yet in Git. After the user requested GitHub and useful parallelism, the verified initial commit was pushed and independent writers received separate Git checkouts/branches. Root manifests, contracts, application routes and integration remain lead-owned. No distributed orchestration was installed.

Normal review port 3000/data `.local-data`; browser tests port 3100/unique `.test-data` dirs; renderer checks use ignored `test-results`. Separate checkouts must retain distinct data/ports. Do not infer human teammates or decision rights from generic kit templates. No paid calls, sponsor submissions or public deployment.
