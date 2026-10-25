# Actual implementation status

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
