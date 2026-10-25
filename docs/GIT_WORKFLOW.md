# Git workflow

Each developer uses a clone; each concurrent writer gets a branch and worktree. From the correct repo, fetch origin, inspect current main, then `git worktree add ../project-core-03 -b task/core-03 origin/main`. Record `git rev-parse HEAD` and actual allowed paths before starting. Assign separate ports/test data; worktrees share more than files.

Commit only task files. Push only with task authority. One coordinator reviews and integrates in dependency order: update candidate against current main in a clean checkout, run combined checks, merge using the agreed strategy, and verify core flow on resulting main/deployment. Never rebase a running writer's branch. Rerun checks after conflict resolution or main movement.

Recovery: pause dependent merges, repair or revert the faulty change without rewriting shared history, rerun the judge path and record known-good SHA. Merged and Verified remain distinct. Tool switch: stop, checkpoint, HANDOFF, inspect current state, then resume with the next tool.
