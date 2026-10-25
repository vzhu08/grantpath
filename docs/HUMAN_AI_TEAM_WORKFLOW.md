# Human–AI Team Workflow for a 24-Hour Hackathon

> **Purpose:** Define how three human teammates and three independently authenticated Codex workers collaborate to deliver a compelling, verifiably working hackathon demo. This is a human operating playbook—not a replacement for `AGENTS.md`, repository ownership rules, the technical orchestration specification, or event rules.
>
> **Suggested location in Hackathon Kit:** `docs/templates/HUMAN_AI_TEAM_WORKFLOW.md`. The kit's existing project generator copies files from `docs/templates/` into the generated project's `docs/` folder, making this available as `docs/HUMAN_AI_TEAM_WORKFLOW.md`. Link it from generated `AGENTS.md` and the kickoff instructions.

## 1. Shared objective and non-negotiables

**Kit integration:** Use this playbook as human coordination context, including when coordinating manually without the optional orchestration runtime. Worker startup steps apply only when that runtime is selected. Record actual human role and approval owners separately from worker accounts; machine handoff does not transfer human decision rights. Existing technical controls govern every action, including stricter runtime feature-freeze gates; this playbook grants no autonomous authority or exception to those controls.

**Win on demonstrated product value, not agent activity.** The team optimizes for a distinctive, credible, easy-to-explain, stable MVP that judges can understand in a three-minute demo. Code volume, number of agents, commits, and feature count are not success metrics.

- **Humans own:** the problem, user value, event/judging interpretation, priorities, sensitive approvals, evidence quality, final integration/release decisions, and submission.
- **Codex orchestrator owns:** planning and dependency management, bounded task assignment, monitoring, evidence-based updates, integration coordination, and focused blocker escalation.
- **Codex workers own:** assigned implementation and debugging inside agreed file scopes; subagents are optional and limited to truly independent work.
- **Deterministic tooling owns:** Git operations, formatting, linting, test execution, CI status collection, timestamps, heartbeats, and routine status aggregation. Do not spend model turns merely to run or narrate repetitive commands.
- **One source of truth:** GitHub Issues/PRs plus the orchestrator's durable decision/task records. Chat brainstorming is _not_ an authorized implementation request until accepted into the shared plan.
- **Rule compliance:** respect the hackathon's requirements for prior code, attribution, AI assistance, external services, and publication; never misrepresent reused work or staged/demo output as newly built or live.

## 2. Three human roles (accountability, not rigid assignments)

| Role                                | Main question                                                                  | Primary responsibilities                                                                                                                                                                            | Evidence of success                                                                       |
| ----------------------------------- | ------------------------------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------- |
| **A — Technical/orchestrator lead** | “Are we building the right thing on the critical path, and does it integrate?” | Operate the single lead conversation; approve architecture/task plan; settle interface conflicts; react to real blockers; manage integration/release gate; protect a known-good build and deadline. | Verified critical path, healthy agents, integrated demo, honest status.                   |
| **B — Product/research lead**       | “Is this valuable, distinctive, and competitive?”                              | Research user need, prior art, APIs/datasets, evaluation methods, judge criteria; challenge feature value; propose targeted improvements; supply credible metrics and pitch claims.                 | Clear differentiation, prioritized evidence-backed improvements, defensible impact story. |
| **C — Demo/QA/story lead**          | “Would a skeptical judge understand and trust this now?”                       | Exercise the deployed app as a stranger would; find UX/performance/failure problems; maintain realistic demo data/scenarios; assemble and rehearse demo/pitch; verify claims and backups.           | Repeatable live demo, documented bugs and fixes, concise convincing presentation.         |

**All three remain builders and decision-makers when needed.** These are accountability lanes, not exclusive jobs. Someone who finishes early should take the most useful unowned human task. A second human should not become a full-time “agent babysitter.” The lead operator should intervene only for significant questions, blocked dependencies, priorities, and releases.

**Human role ≠ worker account role.** Three separate Codex accounts can all run code-writing workers even when their human owners are doing strategy or demo work. The lead machine can run an orchestrator and its own worker, but both use that person's account allowance. Coordinator leadership may transfer to another person's local account while all coding workers keep their tasks.

## 3. Human ↔ orchestrator interface

Treat the lead like a normal, responsive Codex conversation: it should accept questions, explain tradeoffs, remember decisions, display real-time events, and request help without requiring constant prompting.

**Opening exchange:** The lead asks only unanswered, consequential questions (demo user, differentiator, actual deadline, permitted reuse, required APIs, constraints). It proposes an MVP critical path, task dependencies, human approvals, and a demo fallback. The operator approves before the first dispatch.

**During execution:**

- Post **immediate event-based updates** for meaningful starts, test results, PRs, failed CI, worker loss/recovery, integration progress, and release results.
- Emit a **compact factual update every five minutes while active**, preferably from deterministic status data rather than a fresh model invocation: all workers' last verified actions, blocked/waiting work, demo health, and upcoming decision points.
- **Escalate genuine blockers promptly**, with failed step, evidence, attempted safe fixes, the exact help requested, a recommended option, deadline impact, and independent work continuing. Do not ask for trivial implementation preferences.
- Answer on-demand questions such as “What is B doing?”, “Can we cut this feature?”, “Why did CI fail?”, or “What can we demo right now?” without pausing workers unnecessarily.
- Preserve context in durable summaries, pending decisions, and task records so another teammate can take over leadership without repeating past clarifications.
- Never claim a task is verified solely because an agent says it finished. Distinguish planned, implementing, locally checked, PR opened, CI verified, merged, and deployed.

### Human decision rights

| Action                                                  | Owner / rule                                                   |
| ------------------------------------------------------- | -------------------------------------------------------------- |
| Prioritize and approve substantial scope changes        | Human A, after consulting B and C when they affect value/demo  |
| Propose features, differentiation, evidence or datasets | Human B; send concise proposal to A / orchestrator             |
| Identify UX defects, demo failures, unsupported claims  | Human C; file an issue; escalate critical breakage immediately |
| Plan, dispatch, monitor, and coordinate bounded work    | Orchestrator, after authorization and within constraints       |
| Implement inside exclusive file scope                   | Assigned worker (optional local subagents)                     |
| Run tests and scoped commits                            | Deterministic runner; attach real exit codes and evidence      |
| Merge, deploy, purchase, publish, destructive changes   | Explicit human approval under repo/event policy                |

**Avoid bypassing the queue:** If Human B or C independently prompts a coding agent to edit production files without a claimed scope, they can cause collisions. Ideas and bugs go into the shared queue; the orchestrator assigns edits. Read-only analysis and independent research can happen in any chat.

## 4. The 24-hour operating schedule

Times are relative to the **actual event start and deadline**, not to the moment the orchestrator starts. Move checkpoints if the event length differs.

| Time        | Human A: Technical lead                                                                | Human B: Product lead                                                                    | Human C: Demo/QA lead                                                                     | Must exist by end                                                  |
| ----------- | -------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------- | ------------------------------------------------------------------ |
| **0–1 h**   | Set architecture, API contracts, worker ownership; authorize dispatch; deploy skeleton | Lock problem, target user, compelling differentiator, judge criteria                     | Define the 30-second explanation, three-minute judge path, realistic sample input         | Approved smallest MVP, shared contracts, running/deployed skeleton |
| **1–4 h**   | Unblock core vertical slice, integrate early, prevent divergent branches               | Find required data/APIs, validate solution assumptions, propose only high-return changes | Test actual input → actual result; log empty/error/loading cases                          | One genuine end-to-end flow—not screenshots or mock-only claims    |
| **4–10 h**  | Coordinate parallel differentiation and tests                                          | Establish evidence of improvement, compare alternatives, verify claims                   | Repeated deployed-app walkthroughs; fix obvious friction                                  | Distinctive feature and initial evidence work end-to-end           |
| **10–17 h** | Stabilize interfaces, eliminate blockers, control scope                                | Stop open-ended ideation; prioritize measurable gains and pitch evidence                 | Run structured test matrix; draft slides and live script                                  | Reliable core path, evidence, draft demo/pitch                     |
| **17–21 h** | Tighten CI, deployment, observability, recovery; cut risky changes                     | Finalize the problem/solution/results narrative                                          | Rehearse complete demo; exercise backup and failure path                                  | Stable candidate and practiced pitch                               |
| **21–24 h** | Freeze new features; fix only high-severity blockers; verify release/submission        | Audit every claim against evidence; finalize judge Q&A                                   | Full clean-session demo rehearsal, backup recording if permitted, submission verification | Proven deployment, completed submission, contingency plan          |

**Human check-ins:** Every **60–90 minutes**, spend roughly 5–10 minutes checking the deployed judge path and deciding the single most important next change. This is separate from automated five-minute status summaries. Avoid prolonged meetings.

**Scope rule:** After the core end-to-end flow exists, approve new features only if their likely judging benefit outweighs integration/test risk. In the final three hours, no new feature work without an explicit critical-path exception.

## 5. Closed-loop operating rhythm

1. **Workers build** scoped pieces in parallel, following agreed contracts.
2. **Human C tests** the real running/deployed product and reports concise, reproducible issues (steps, expected/actual, severity, screenshot/log when useful).
3. **Human B evaluates** the highest-impact product opportunities and evidence gaps, not unlimited feature ideas.
4. **Human A prioritizes** both inputs with the orchestrator, decides what to build/cut, and protects the critical path.
5. **Orchestrator dispatches** bounded repair or improvement tasks and reports test/PR/CI evidence.
6. **Humans verify** that the next build is actually better. Repeat.

**Issue severity:**

- **P0:** Core judge path broken, data/security issue, unusable deployment, or no credible live demonstration. Interrupt and fix now.
- **P1:** Materially weakens the core value proposition or demo reliability. Prioritize before polishing.
- **P2:** Useful polish or optional feature. Do only if schedule allows.

Always keep a known-good demo commit and verify the deployed state separately from build success.

## 6. Practical communication formats

### Product improvement proposal — Human B → lead

```text
PROPOSAL: [one-sentence improvement]
JUDGING VALUE: [which criterion and why]
EVIDENCE: [source, experiment, competitor, or clear assumption]
CHANGE: [concrete user-visible behavior]
ESTIMATED DEPENDENCIES/RISKS: [interfaces, APIs, time]
RECOMMENDATION: ship now / later / cut
```

### Demo/QA report — Human C → lead

```text
ISSUE: [short title] | Severity: P0/P1/P2
ENVIRONMENT: [verified deployment URL or local commit]
STEPS: [reproducible input and actions]
EXPECTED / ACTUAL: [observable difference]
EVIDENCE: [log, screenshot, timing, or failed check]
JUDGE IMPACT: [why it matters in the demo]
```

### Blocker request — orchestrator → team

```text
BLOCKED: [task/worker]
PROBLEM: [specific failed action and evidence]
TRIED: [bounded attempts, if applicable]
DECISION NEEDED: [one clear question]
RECOMMENDED: [preferred option and reason]
ALTERNATIVES: [other viable options]
DEADLINE IMPACT: [critical path / optional]
CONTINUING IN PARALLEL: [independent work]
```

### Five-minute status — orchestrator → team

```text
TIME REMAINING: [actual deadline calculation]
DEMO: [live/partial/broken; last verified evidence]
A / B / C WORKERS: [task ID, state, last verified action]
INTEGRATION: [latest relevant PR, CI, merge/deploy status]
BLOCKERS / HUMAN DECISIONS: [none or actionable item]
NEXT PRIORITY: [critical-path move]
```

### End-of-checkpoint human sync

Answer in order: (1) Can we demo the core value now? (2) What is the most serious failure? (3) What is the highest-value next improvement? (4) What should we cut? (5) Is the current deadline risk acceptable?

## 7. Conversational prompts by human role

**A — Orchestrator operator:**

> “Give me the current critical path, actual deployment health, all worker states, and the highest-priority blocker. Recommend one change that improves the probability of a successful judging demo. Don't interrupt healthy workers unless necessary.”

**B — Product/research lead (separate research chat, read-only):**

> “Assess our MVP against the judging rubric, competitors, and available evidence. Identify at most three differentiated improvements. For each, estimate measurable judge value, implementation dependencies, and the risk of distracting from the demo. Return a proposal that I can submit to the orchestrator.”

**C — Demo/QA lead:**

> “Act as a skeptical hackathon judge. Evaluate the current deployed product using a realistic input and the planned three-minute user journey. Produce reproducible P0/P1 issues, unsupported claims, UX confusion points, and suggested demo-script improvements. Do not claim you tested anything you could not actually access.”

**Group decision:** The three humans select direction and release readiness; the orchestrator implements their approved decisions through the task queue. An AI plan is an input to the decision, not an implicit authorization.

## 8. Handoffs, absences, and failure fallback

- **Human role handoff:** update accountable owners, pending approvals, decisions, and the last known-good deployment; the incoming human reviews the state summary rather than rereading the whole chat.
- **Coordinator machine/account handoff:** use the orchestration runtime's lease-protected handoff or takeover commands **only once implemented and tested**. Transferring leadership must not copy Codex credentials or spawn two dispatching leaders. Workers continue safely while the dispatch authority moves.
- **Coordinator outage:** finish already assigned work where safe. Humans can fall back to regular branches/PRs and the existing collaboration playbook. Do not falsely report that coordination is active.
- **AI or API limit:** reduce nonessential reasoning, favor mechanical status collection, shift allowed task capacity to available accounts, and protect the working demo.
- **Deployment issue:** prioritize restoration of the last verified stable demo and explicitly label mock/fixture fallbacks.

## 9. Kickoff and submission checklists

### Before coding

- [ ] Read event judging criteria, reuse/AI rules, and submission requirements.
- [ ] Agree on the single distinctive demo feature and target user.
- [ ] Assign human A/B/C, name the current orchestrator operator, and record an authorized backup.
- [ ] Confirm three worker logins and capabilities without sharing credentials.
- [ ] Agree shared interfaces, file ownership, deadline, checkpoint cadence, and demo fallback.
- [ ] Create and verify an initial deployed skeleton.

### Before submitting

- [ ] Run the full judge journey against the actual deployment with realistic data.
- [ ] Verify P0 issues are resolved and the known-good version is recorded.
- [ ] Ensure claims, metrics, and live/fixture labels are accurate.
- [ ] Rehearse the pitch and expected judge questions.
- [ ] Verify the submission link, access permissions, and actual receipt/status.
- [ ] Record final repository commit, deployment URL, and unresolved limitations.

## 10. Repository integration guidance

For **Hackathon Kit maintainers**:

1. Keep this as a **reusable human playbook** under `docs/templates/HUMAN_AI_TEAM_WORKFLOW.md` so the existing template-copy behavior exports it into new projects as `docs/HUMAN_AI_TEAM_WORKFLOW.md`.
2. Add a short link from `docs/playbooks/COLLABORATION.md` and `docs/playbooks/DEVELOPMENT_PLAYBOOK.md` (avoid copying sections already present).
3. When generating projects, reference `docs/HUMAN_AI_TEAM_WORKFLOW.md` in the generated `AGENTS.md` / project quickstart as a guide for human responsibilities; retain current technical agent constraints unchanged.
4. In the orchestrator's top-level context, load or summarize **the chosen project’s** human role assignments, deadline, scope authority, and escalation contacts, not fixed assumptions about people's identities.
5. Do not require an orchestration runtime to read or follow this playbook. It is useful even when all coding is coordinated manually.
6. Do not silently overwrite a project's modified copy during later kit adoption; preserve existing user work and use the kit's plan-first integration rules.

**Scope:** This document defines collaboration and decisions. The technical orchestrator specification remains responsible for implemented CLI commands, runtime state, locking, tests, and authentication.
