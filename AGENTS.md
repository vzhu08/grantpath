# Project instructions

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
- User preference for every completed application task: build the final code, run `npm run review`, verify the loopback health endpoint and provide the local review URL. Use isolated data for automated acceptance; preserve the normal local workspace.
- Use useful independent agents in isolated checkouts with exclusive file ownership. Let GitHub Actions run repeatable checks and deterministic checked integration; never merge a failing or superseded revision.
