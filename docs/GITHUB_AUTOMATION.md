# GitHub checks and routine merges

The user requested useful parallel agents and deterministic automation for routine checks, commits and merges. CI handles repeated verification; Dependabot creates routine dependency commits/PRs; the merge workflow merges explicitly selected passing PRs. Agents still own implementation and review. No model API, application submission, deployment or private researcher content belongs in these workflows.

## Required validation

`CI` runs on every pull request, pushes to main, merge-queue groups and manual dispatch. It validates workflows with a pinned/checksummed actionlint release, tests the merge policy, installs the lockfile, checks high/critical dependency advisories, runs `npm run check`, installs Chromium and runs the isolated local browser journey. One job avoids repeated installs/builds. npm caching and superseded-run cancellation reduce waste. Synthetic diagnostics are retained for seven days; no provider secrets are read.

The exact required status-check context is **`Validate (types, tests, build, browser)`**. Do not add path filters that leave this required check pending. Real LibreOffice/font export verification remains a separate prerequisite until its renderer environment is part of CI; ordinary tests must continue to run without it.

## Automatic merge policy

Add the **`automerge`** label to an in-repository PR when its scope is authorized for automatic integration. The workflow reacts to PR changes/labels and CI completion, so agents do not need to poll. It requires the protected default branch to enforce the validation check, a successful canonical CI run for the exact current head/base, known conflict-free mergeability, and no outstanding changes-requested review. GitHub's normal merge endpoint enforces the checked head SHA and repository rules; no admin bypass, self-approval or force push is used.

Changes under `.github/` always need maintainer integration, even if labeled, so a PR cannot automatically change its own gates. Privileged workflow events check out only the trusted default branch and never execute PR code. A missing check, unknown state, stale run, changed label or unavailable branch protection leaves the PR open. The workflow sends no comments or external messages. A manual workflow dispatch can re-evaluate a PR after settings or mergeability settle.

Weekly Dependabot npm updates are grouped as patch/minor changes, labeled `dependencies` and `automerge`, and get normal CI. Major version updates are excluded from routine npm updates and need a separately scoped task. Action-pin updates are grouped but marked `workflow-review`, since they change control files. Pinned action SHAs were resolved from the official release tags on October 25, 2026: checkout v7.0.1, setup-node v7.1.0, upload-artifact v7.0.2 and github-script v9.0.0.

## One-time repository settings

On October 25, 2026 the user explicitly authorized making `vzhu08/grantpath` public. Visibility is now public; strict up-to-date required CI, administrator enforcement, required conversation resolution, no force pushes/deletion, squash merging, branch deletion after merge and native auto-merge were applied and verified through GitHub's API. The normal labeled-PR policy above is now eligible. Local data, environment secrets, uploads and generated artifacts remain ignored. No account upgrade is required for this public repository.

Lead/operator applies these after the CI PR is inspected; no settings are silently weakened. Enable squash merging, automatic branch deletion and native auto-merge support:

```sh
gh api --method PATCH repos/vzhu08/grantpath -F allow_squash_merge=true -F allow_merge_commit=false -F allow_rebase_merge=false -F delete_branch_on_merge=true -F allow_auto_merge=true
```

Protect main with strict up-to-date checks, no force-pushes/deletion and no bypass. Save this JSON and use `gh api --method PUT repos/vzhu08/grantpath/branches/main/protection --input <file>`:

```json
{
  "required_status_checks": {
    "strict": true,
    "contexts": ["Validate (types, tests, build, browser)"]
  },
  "enforce_admins": true,
  "required_pull_request_reviews": null,
  "restrictions": null,
  "required_conversation_resolution": true,
  "allow_force_pushes": false,
  "allow_deletions": false
}
```

Private-repository branch protection depends on the account plan. If GitHub reports that it is unavailable, keep validation active and automated merging disabled; do not substitute a bypass or claim protection is enforced. The GitHub Actions token needs the workflow's declared read/write permissions and repository Actions must be enabled. Review-required organizational rules remain authoritative; the workflow does not approve its own PR.

Create the `automerge`, `dependencies` and `workflow-review` labels once if they are absent. Labels are intent markers, not test results. The normal development handoff is a small scoped commit/PR, authorization label after review, then deterministic checks and merge. Files are never silently committed from researcher data or unfinished editors.
