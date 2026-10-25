# GrantPath

A local, single-user workspace for one source-checkable research-grant application. Create a project, add text evidence, inspect eligibility, confirm requirements, draft three sections and export a review packet. Manual editing works without API credentials.

## Run

Node **22.23+** and npm are required.

```sh
npm ci
npm run dev
```

Open **http://127.0.0.1:3000**. For production: `npm run build` then `npm start`. Both servers bind to loopback. Run one process per data directory.

Data survives refresh/restart in the gitignored `.local-data/workspace.json`; `GRANTPATH_DATA_DIR` selects another server-owned directory. Saves are serialized and atomic, with revision-conflict detection. Back up this directory before upgrades. Corrupt storage is reported and never reset to fixtures.

## Included

- Project profile and ten versioned evidence notes, each up to 20,000 characters. Paste or import UTF-8 TXT/Markdown.
- Six clearly fictional calls plus pasted calls. Potential fit, Needs confirmation, Known mismatch and Closed remain distinct. Preferences rank only potential fits.
- Proposed exact-quote requirements, researcher confirmation, document metadata/statuses, internal targets, agenda and one-event ICS export. Date-only cutoffs remain unknown.
- Three editable starter sections, retained revisions/citations, optional generated previews and deterministic blockers/warnings with reasoned waivers.
- Saved draft/checklist/issues/source appendix as UTF-8 Markdown. Submitted is a user record; the app sends nothing to a sponsor.

Sources and saved URLs are not independently verified. Reset demo data preserves researcher-created work. This initial build does not implement arbitrary sponsor packages, file vaults, scientific grading, background reminders or hosted collaboration.

## Optional AI

Copy `.env.example` to ignored `.env.local`; explicitly set `RUN_LIVE_AI=true`, `AI_PROVIDER` (`openai` or `anthropic`), `AI_MODEL`, and the matching `OPENAI_API_KEY` or `ANTHROPIC_API_KEY`. No model is chosen silently. Each live request requires UI consent. Keys stay on the server.

The full prompt is bounded to 50,000 characters, one active request and six attempts/minute, with bounded output and timeout/cancellation. Generated output is a reviewable preview; explicit acceptance creates a revision. Invalid quotations and live failures preserve edits and never fall back to fixtures. Demo/fixture generation is limited to labeled synthetic projects/calls. Live credentials have not been tested.

## Verify

```sh
npm run check
npx playwright install chromium
npm run test:browser
```

`check` runs TypeScript, imported module/domain tests and the production build. Tests use a workspace-local temp directory for Windows sandbox compatibility. Browser acceptance runs port 3100 with separate `.test-data/browser-*` storage, including an actual process restart. Screenshots/downloads/results go to gitignored `test-results/`. Override the port with `GRANTPATH_TEST_PORT`. Default tests never make paid calls or touch normal app data.

See [actual verification](docs/implementation/STATUS.md), [demo runbook](docs/DEMO_RUNBOOK.md), [architecture](docs/ARCHITECTURE.md), [API contracts](docs/API_CONTRACT.md) and [reuse notes](docs/MODULE_SELECTION.md).

## Future goals

The [roadmap](docs/ROADMAP.md) preserves all 13 future goals with boundaries, dependencies and acceptance criteria for humans and agents. Start with the [agent handoff](docs/AGENT_HANDOFF.md). Original PDFs remain in `docs/reference/`; the separately researched [NSF roadmap 01 specification](docs/implementation/FULL_PROPOSAL_TEMPLATES.md) is retained.

Reused [Hackathon Kit](https://github.com/oliverchennn/hackathon-kit) at `22a5f44a27375e88ac2cd1754f6976704f725bc5`. Original hashes/provenance remain in `kit.project.json`; application customizations and patched dependencies are documented separately. No symlinks or runtime imports depend on the temporary kit checkout. [MIT license](LICENSE), [third-party notices](THIRD_PARTY_NOTICES.md).
