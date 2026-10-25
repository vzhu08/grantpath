# Three developers, one integration queue

Use the [human–AI team workflow](HUMAN_AI_TEAM_WORKFLOW.md) for flexible human accountability, approval owners and the build → test → evaluate → prioritize → dispatch loop. Ask for actual human assignments; these roles are independent of worker accounts and the technical file ownership lanes below. The playbook is context; existing ownership and authorization controls remain authoritative.

Humans own product decisions, interfaces, acceptance and deployment. Typical lanes: Product/UX (app pages, components, demo path), Platform/API (routes, persistence, deployment), Core capability (module algorithms, AI and evaluations). Record actual globs and named stewards in OWNERSHIP.md; one accountable human and one active writer per file set.

Each human has a clone; each concurrent writing job has its own branch/check-out. Worktrees share Git state and do not isolate databases, ports, credentials, caches or deployments. Assign separate resources. The authoritative live board, not stale branch copies, coordinates claims. Read-only reviews may overlap; a reviewer making edits must claim a writer scope.

Agree inputs/outputs/errors/units/empty cases/streaming/persistence and shared fixtures before splitting frontend/backend work. Use packages/contracts for wire boundaries, module fixtures for capability behavior. UI can use labeled fixtures until the agreed route returns a real result; integrate one early. Contract changes go through the steward and pause affected tasks when breaking.

Task board: Planned → Ready → Running → Review → Queued → Merged → Verified, with Blocked for precise dependencies. Task cards include ID, human owner, session, branch/check-out, base SHA, dependencies, claimed/reserved files, read-first, outcome, acceptance, exact checks, non-goals, result SHA and merge/deploy authority. A 20–60 minute task is a planning guide, not a quota.

One coordinator integrates in dependency order. Review scope/evidence, update the candidate against current main in a clean checkout, run combined checks and then merge. Never rebase an active writer's checkout. Rerun affected tests after conflicts or main updates. Verify the resulting main and actual deployment separately. Pause dependent merges if the demo breaks; repair or revert and prove recovery.

Start with one writer per developer. Increase only when independent work and review capacity exist; reduce concurrency when review waits or integration failures grow. Agent counts and commits are not outcomes. Switch Codex/Claude only after stopping the first writer and saving a checkpoint/handoff. Both use the same contracts, board, queue and checks; tool agreement cannot replace tests.
