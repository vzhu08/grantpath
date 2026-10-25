export const REQUIRED_CHECK = "Validate (types, tests, build, browser)";
export const WORKFLOW_PATH = ".github/workflows/ci.yml";

/** Pure policy: every unknown or changed prerequisite leaves the PR open. */
export function evaluateMerge({ pr, files, run, branch, reviews = [], repository, defaultBranch }) {
  if (pr.state !== "open" || pr.draft) return "Pull request is closed or a draft.";
  if (pr.base.ref !== defaultBranch || pr.head.repo?.full_name !== repository)
    return "Only same-repository pull requests to the default branch are eligible.";
  if (!pr.labels.some(label => label.name === "automerge"))
    return "The explicit automerge label is absent.";
  if (files.some(file => file.filename.startsWith(".github/")))
    return "Workflow and merge-policy changes need explicit maintainer review.";
  if (!branch.protected || !branch.protection?.required_status_checks?.contexts?.includes(REQUIRED_CHECK))
    return "The default branch must enforce the required CI check before automatic merges are enabled.";
  if (pr.mergeable !== true || !["clean", "unstable"].includes(pr.mergeable_state))
    return "GitHub has not confirmed a conflict-free merge.";
  const latestReview = new Map();
  for (const review of reviews) {
    if (["APPROVED", "CHANGES_REQUESTED", "DISMISSED"].includes(review.state))
      latestReview.set(review.user.login, review.state);
  }
  if ([...latestReview.values()].includes("CHANGES_REQUESTED"))
    return "A reviewer still requests changes.";
  if (!run || run.path !== WORKFLOW_PATH || run.event !== "pull_request" || run.status !== "completed" || run.conclusion !== "success")
    return "The full CI workflow has not passed.";
  const testedPR = run.pull_requests?.find(item => item.number === pr.number);
  if (run.head_sha !== pr.head.sha || testedPR?.head?.sha !== pr.head.sha || testedPR?.base?.sha !== pr.base.sha)
    return "CI did not test the current pull-request head and base revisions.";
  return null;
}

export async function runMergePolicy({ github, core, context }) {
  const { owner, repo } = context.repo;
  const defaultBranch = context.payload.repository.default_branch;
  const repository = `${owner}/${repo}`;
  const eventPR = context.payload.pull_request;
  const eventRun = context.payload.workflow_run;
  const dispatched = Number(context.payload.inputs?.pull_request);
  const numbers = eventPR ? [eventPR.number] : eventRun
    ? eventRun.pull_requests.map(pr => pr.number)
    : Number.isSafeInteger(dispatched) && dispatched > 0 ? [dispatched] : [];
  if (!numbers.length) { core.info("No associated pull request to evaluate."); return; }

  for (const number of [...new Set(numbers)].slice(0, 20)) {
    const { data: pr } = await github.rest.pulls.get({ owner, repo, pull_number: number });
    if (!pr.labels.some(label => label.name === "automerge")) {
      core.info(`PR #${number}: explicit automerge label is absent.`);
      continue;
    }
    const [{ data: branch }, files, reviews, { data: runs }] = await Promise.all([
      github.rest.repos.getBranch({ owner, repo, branch: defaultBranch }),
      github.paginate(github.rest.pulls.listFiles, { owner, repo, pull_number: number, per_page: 100 }),
      github.paginate(github.rest.pulls.listReviews, { owner, repo, pull_number: number, per_page: 100 }),
      github.rest.actions.listWorkflowRuns({ owner, repo, workflow_id: "ci.yml", event: "pull_request", head_sha: pr.head.sha, per_page: 20 }),
    ]);
    const run = runs.workflow_runs.sort((a, b) => b.run_number - a.run_number || b.run_attempt - a.run_attempt)[0];
    const reason = evaluateMerge({ pr, files, reviews, run, branch, repository, defaultBranch });
    if (reason) { core.info(`PR #${number}: ${reason}`); continue; }

    // Re-read immediately before merging; the merge endpoint also enforces this SHA
    // and GitHub's branch protection. No admin/bypass API or self-approval is used.
    const { data: current } = await github.rest.pulls.get({ owner, repo, pull_number: number });
    if (current.head.sha !== pr.head.sha || current.base.sha !== pr.base.sha || current.state !== "open" || current.draft || !current.labels.some(label => label.name === "automerge")) {
      core.info(`PR #${number}: inputs changed during evaluation; a later event can retry.`);
      continue;
    }
    const { data: merged } = await github.rest.pulls.merge({ owner, repo, pull_number: number, sha: pr.head.sha, merge_method: "squash" });
    if (!merged.merged) throw new Error(`GitHub declined PR #${number}: ${merged.message}`);
    core.info(`Merged PR #${number} after the exact head/base CI and branch gates passed.`);
  }
}

