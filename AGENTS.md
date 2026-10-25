# Project instructions

GrantPath is a time-constrained hackathon project. Every development and scope decision must prioritize **technical impressiveness, clarity, impact and novelty**: demonstrate a substantive working mechanism, make its value easy for judges to understand, solve a concrete researcher problem, and show a defensible differentiator. Read [project goals](docs/PROJECT_BRIEF.md) before planning or expanding work. Favor the smallest complete, reliable demo with strong evidence; reserve time for integration and rehearsal. Defer low-value breadth and infrastructure beyond the current local release. Preserve required correctness, data integrity and honest fixture/live labels. Use the actual event deadline when supplied; do not assume the generic kit's 24-hour schedule applies.

This is a standalone snapshot of Hackathon Kit. Read [selected modules](docs/kit/SELECTED_MODULES.md), [quickstart](docs/QUICKSTART.md), [ownership](docs/OWNERSHIP.md) and your task card before editing. Inspect scoped instructions explicitly.

Read the [human–AI team workflow](docs/HUMAN_AI_TEAM_WORKFLOW.md) as human coordination context. Ask for actual human role and approval owners independently of worker accounts; existing technical controls remain authoritative and orchestration is optional.

- Selected modules: documents, extraction, recommendations, ai.
- App routes: app/. Canonical capability code: modules/. Shared validation/runtime: packages/.
- Run npm ci, npm run check, npm run dev. For an imported module use its README check command.
- One writer per file set; separate checkout and branch per concurrent writer. Assign a human and steward for app/layout.tsx, global styles, package manifests/lockfile, contracts and migrations.
- Validate boundary data; preserve fixture/live labels. No external API calls in ordinary tests.
- Keep credentials server-side. No deployment, sends or paid tests without application/operator intent.
- Preserve local modifications when upgrading this snapshot. Source revision and hashes: kit.project.json.
- Return real checks, skipped prerequisites and handoff; do not claim deployment success from a local build.
- User preference for every completed application task: deploy the final code locally by building it, running `npm run review`, verifying the loopback health endpoint/build identity and providing the working local review URL. Use isolated data for automated acceptance; preserve the normal local workspace. Local review does not authorize public deployment.
- Default for this orchestrator and every future orchestrated chat: use agents for useful independent work and speed unless the human explicitly specifies otherwise. Give every concurrent writer an isolated checkout/branch and exclusive file ownership; read-only reviewers need no write scope. Let GitHub Actions run repeatable checks and deterministic checked integration; never merge a failing or superseded revision.
- User speed preference: **Standard mode, Fast off** for all future chats and agents. Preserve the requested model/reasoning effort. Apply to existing chats only through a quick supported control; do not interrupt work or spend substantial context/time on reconfiguration. This supersedes earlier Fast-mode dispatch instructions.
- For user-selected research tasks, a completed/reviewed research handoff authorizes starting a **new implementation chat for that task** under the standing user pipeline. Resolve consequential human questions and predecessor-information gates first; give the new chat its exact spec, exclusive paths, agents, Standard speed and final local review requirements. This does not select unrequested roadmap work or mark research as implemented code.
- Orchestrator owns keeping **main current and locally inspectable**: integrate each completed checked feature incrementally through the required CI/branch gates, preserve user WIP, refresh the latest main production review server and verify/report its URL and revision/build identity. Do not wait for all parallel tasks before integrating a completed feature; do not merge failing or superseded revisions.
