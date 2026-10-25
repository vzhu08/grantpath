import test from "node:test";
import assert from "node:assert/strict";
import { evaluateMerge, runMergePolicy, REQUIRED_CHECK, WORKFLOW_PATH } from "./merge-policy.mjs";

function fixture() {
  return {
    repository: "vzhu08/grantpath", defaultBranch: "main",
    pr: { number: 12, state: "open", draft: false, base: { ref: "main", sha: "base" }, head: { sha: "head", repo: { full_name: "vzhu08/grantpath" } }, labels: [{ name: "automerge" }], mergeable: true, mergeable_state: "clean" },
    branch: { protected: true, protection: { required_status_checks: { contexts: [REQUIRED_CHECK] } } },
    files: [{ filename: "lib/readiness.ts" }], reviews: [],
    run: { path: WORKFLOW_PATH, event: "pull_request", status: "completed", conclusion: "success", head_sha: "head", pull_requests: [{ number: 12, head: { sha: "head" }, base: { sha: "base" } }] },
  };
}
test("accepts only an explicitly labeled fully checked revision", () => assert.equal(evaluateMerge(fixture()), null));
test("keeps unlabeled and draft work open", () => { for (const field of ["labels", "draft"]) { const data=fixture();data.pr[field]=field==="labels"?[]:true;assert.ok(evaluateMerge(data)); } });
test("refuses fork or non-default targets", () => { const data=fixture();data.pr.head.repo.full_name="external/fork";assert.ok(evaluateMerge(data));data.pr.head.repo.full_name=data.repository;data.pr.base.ref="other";assert.ok(evaluateMerge(data)); });
test("never automatically changes workflow governance", () => { const data=fixture();data.files.push({filename:".github/workflows/ci.yml"});assert.match(evaluateMerge(data),/maintainer review/); });
test("refuses missing server-side branch gates", () => { const data=fixture();data.branch.protected=false;assert.match(evaluateMerge(data),/enforce/);data.branch.protected=true;data.branch.protection.required_status_checks.contexts=[];assert.match(evaluateMerge(data),/enforce/); });
test("failed, incomplete, and cancelled CI cannot merge", () => { for (const conclusion of [null,"failure","cancelled","skipped"]) { const data=fixture();data.run.conclusion=conclusion;assert.match(evaluateMerge(data),/not passed/); } });
test("a newer head or base invalidates successful CI", () => { for (const side of ["head","base"]) { const data=fixture();data.pr[side].sha="new";assert.match(evaluateMerge(data),/current/); } });
test("only the canonical PR CI workflow can pass", () => { const data=fixture();data.run.event="push";assert.ok(evaluateMerge(data));data.run.event="pull_request";data.run.path=".github/workflows/other.yml";assert.ok(evaluateMerge(data)); });
test("missing association is unknown, never a pass", () => { const data=fixture();data.run.pull_requests=[];assert.ok(evaluateMerge(data)); });
test("unresolved requested changes block merge", () => { const data=fixture();data.reviews=[{user:{login:"reviewer"},state:"CHANGES_REQUESTED"}];assert.match(evaluateMerge(data),/requests changes/);data.reviews.push({user:{login:"reviewer"},state:"APPROVED"});assert.equal(evaluateMerge(data),null); });
test("unknown mergeability and conflicts remain open", () => { for (const state of [null,false]) { const data=fixture();data.pr.mergeable=state;assert.ok(evaluateMerge(data)); } });

function harness(data=fixture()) {
  const calls=[];
  let reads=0;
  const getPR=async()=>({data:structuredClone(data.pr)});
  const github={rest:{pulls:{get:async()=>{reads++;return getPR();},listFiles(){},listReviews(){},merge:async input=>{calls.push(input);return {data:{merged:true}};}},repos:{getBranch:async()=>({data:data.branch})},actions:{listWorkflowRuns:async()=>({data:{workflow_runs:[data.run]}})}},paginate:async method=>method===github.rest.pulls.listFiles?data.files:data.reviews};
  const context={repo:{owner:'vzhu08',repo:'grantpath'},payload:{repository:{default_branch:'main'},pull_request:{number:12}}};
  return {data,github,context,core:{info(){}},calls,get reads(){return reads;}};
}
test('merge call pins the tested SHA and uses squash without approval/bypass APIs',async()=>{const h=harness();await runMergePolicy(h);assert.deepEqual(h.calls,[{owner:'vzhu08',repo:'grantpath',pull_number:12,sha:'head',merge_method:'squash'}]);assert.equal(h.reads,2);});
test('unprotected repositories make no merge call',async()=>{const h=harness();h.data.branch.protected=false;await runMergePolicy(h);assert.deepEqual(h.calls,[]);});
test('a head change during final re-read prevents the merge',async()=>{const h=harness();let read=0;h.github.rest.pulls.get=async()=>({data:{...structuredClone(h.data.pr),head:{...h.data.pr.head,sha:++read===1?'head':'changed'}}});await runMergePolicy(h);assert.deepEqual(h.calls,[]);});
test('removing the label during final re-read prevents the merge',async()=>{const h=harness();let read=0;h.github.rest.pulls.get=async()=>({data:{...structuredClone(h.data.pr),labels:++read===1?h.data.pr.labels:[]}});await runMergePolicy(h);assert.deepEqual(h.calls,[]);});
test('CI completion events select associated PRs without evaluating run artifacts',async()=>{const h=harness();delete h.context.payload.pull_request;h.context.payload.workflow_run={pull_requests:[{number:12}]};await runMergePolicy(h);assert.equal(h.calls.length,1);});

