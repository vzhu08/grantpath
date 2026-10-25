# Actual implementation status

## Current release Roadmap 01

Implemented on October 25, 2026: versioned NSF Research narrative preparation, explicit applicability/call mapping, all 14 editors, structured content, researcher reviews, approved scoped reusable content, preserved provenance/history, schema 1-to-2 byte-backup migration, immutable packets and verified component downloads. See [release details](PROPOSAL_WORKFLOW.md). Item 02 application work has not started; the user requested stopping after 01. The item 02–04 planning documents from other chats remain separate work.

Final local checks: `npm run check` passed (TypeScript, **126 tests across 10 suites**, production build). `npm run test:browser` passed the baseline plus complete proposal journey, including exact citations, paragraphs/headings/lists/tables, 14 sections, retained unsaved buffers, 409 recovery, library approval/context insertion, explicit external completion, snapshot immutability, downloads and restart persistence. Its installed-renderer configuration is deliberately disabled to verify DOCX preservation and Unknown page counts.

Actual LibreOffice **26.8.1.1** and four Times New Roman font files passed `test:exports` (1-page fidelity, 3-page intentional overflow, 3-page table) and the full `test:proposal-workflow` pipeline. That pipeline verified **19 artifacts and eight PDFs**: Summary 1/1 page, Description 2/15, nested prior support 2/5, References 1, Budget Justification 1/5, Facilities 1, Mentoring 1/1, DMSP worksheet 1 and separate internal report 4. Binary hashes, embedded fonts, Letter pages, table/Unicode markers, idempotency, source-change staleness, immutable saved inputs and interrupted-job restart recovery passed. Deep Windows output paths failed visibly; a shorter private output path succeeded, and the app now reports an actionable path-length prerequisite.

The repository is now **public** under `vzhu08/grantpath` by explicit user authorization. GitHub API verification confirms strict required CI on main, administrator enforcement, conversation resolution, no force pushes/deletion, automatic squash merging and post-merge branch deletion. Eligible labeled PRs use the checked merge workflow. Earlier private-plan limitations below are historical. Local workspace data, uploads, environment settings, tools and generated artifacts remain ignored.

Live AI, sponsor login/submission, institutional certification and hosted collaboration were not exercised. Normal manual operation needs no provider key. Use `npm run build` then `npm run review`; the final task handoff verifies the healthy loopback URL separately from build success.

## Historical initial implementation verification

Verified locally on October 25, 2026. Initial build is implemented. No deployment, application submission or paid provider request occurred.

## Verification

- `npm ci`: passed from the generated lockfile. Source kit revision `22a5f44a27375e88ac2cd1754f6976704f725bc5`.
- `npm run typecheck`: passed.
- `npm test`: **69 passed**, five suites: documents, extraction, recommendations, AI (mocked transports), application domain/persistence/security.
- `npm run build`: passed using Next **16.4.3** and Zod **4.6.7**. Windows app sandbox blocked generated output directory operations; the successful build ran with filesystem access. This is a tool sandbox restriction, not a compiler failure in the app.
- `npm run test:browser`: passed on the production build using Chromium 156, Playwright 1.64.0. Created a researcher project/evidence/call through UI; confirmed eligibility, requirements and CV status; saved/cited three sections; reached zero modeled blockers; downloaded ICS and Markdown; verified exact state after refresh and actual process restart. Also checked explicit fixture acceptance, no-key recovery, regeneration preserving manual text, independent dirty editors, navigation guard, competing-draft conflict recovery, keyboard focus and 390px viewport with no horizontal overflow. No uncaught browser errors.
- Desktop/mobile screenshots and downloaded files were inspected. Reproducible output: ignored `test-results/browser-result.json`, `grantpath-desktop.png`, `grantpath-mobile.png`, `browser-event.ics`, `browser-application.md`.
- `npm audit --json`: **zero vulnerabilities** after patching the kit's pinned Next/Zod and transitive undici dependency. This is package-advisory verification, not a security certification.
- Two local agents performed read-only reviews; lead integrated and re-tested their evidence/version/date/editor findings. Implementation writes stayed serial because the initial workspace had no Git checkout for isolated writer branches.

## Limits and unrun checks

Live AI was not run: credentials and explicit paid-test intent were not supplied. Default provider transport tests are mocked. Calendar fixtures verify all-day/exact UTC serialization, stable UIDs, escaping and octet folding; no external calendar-client import is claimed. Text-only evidence/call intake and three starter sections are deliberate first-build limits. Local storage requires one user/process; hosted authorization, file vaults, workers and external reminders are future releases. Scientific claims and all sponsor conditions require researcher review.

## Next authorized work

The user subsequently requested a GitHub repository under the normal `vzhu08` account, pushing this initial build, then beginning roadmap 01. The completed separate-chat plan is `FULL_PROPOSAL_TEMPLATES.md`, with its rendered PDF in the project root. It selects NSF Research narrative preparation. Begin PT-01 only after the initial repository push: pin DOCX rendering, configure the real font and LibreOffice, verify heading/list/table fidelity and intentional overflow. The rest of roadmap 01 remains unimplemented until its own acceptance gates pass. Other roadmap items remain future goals.

## Roadmap 01 progress

The initial repository was created privately at https://github.com/vzhu08/grantpath and main received verified baseline commit 7481ffe. The user then authorized useful isolated agents, automated checks/eligible merges, and a local review link after this and future tasks.

PT-01 renderer is implemented; default checks now pass 78 tests in six suites, plus production build. Actual LibreOffice 26.8.1.1 with installed Times New Roman produced 1/3/3 pages; exact-PDF font embedding, Letter dimensions, Unicode, placeholders, final table row and every page's visual layout were verified. Details: PROPOSAL_RENDERER.md. No application migration or full NSF authoring UI is claimed.

CI automation PR #1 passed hosted types/tests/build/browser and was merged. The NSF manifest PR #2 is independently scoped and undergoing the same hosted checks. The private account plan returned HTTP 403 for main branch protection and did not enable native auto-merge; validation remains active and the auto-merge policy stays disabled unless the user changes the account/visibility setup. No protection bypass is used. Dependabot can create routine update PRs/commits; checks run deterministically.

The local production server is healthy at http://127.0.0.1:3000. Use npm run build then npm run review for subsequent application handoffs. Server logs/data and renderer executables/artifacts stay ignored.
