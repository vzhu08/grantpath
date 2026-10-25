# GrantPath UI redesign dispatch prompt

Status: prepared for a later implementation break. **Do not dispatch this chat yet.** The orchestrator must first satisfy the launch gate below and replace the revision placeholders with actual checked values.

## Launch gate for the orchestrator

- Finish and merge the current selected implementation batch: tasks 02–09 that are in the active pipeline, including task 08 after its researched handoff. Required runtime predecessors, checks and local review handoffs must pass. Task 10 is skipped.
- Complete the infrastructure review itself, disposition all findings, close release-blocking issues and verify the latest main build, health/readiness and local review URL. Confirm every existing frontend writer has relinquished its scope.
- **New human quality gate:** require the current combined02–09 functional/rendered acceptance report to say GO before starting this redesign. Follow [the pre-UI review](PRE_UI_ACCEPTANCE_REVIEW.md), led by existing review chat `01a171d9-b270-72d2-8d9b-73364c6a3834`. Fix and recheck release blockers/material workflow defects, with actual cross-feature browser, persistence/export and screenshot evidence on the final checked main. The earlier infrastructure review or individual unit/build success alone does not satisfy this gate.
- Reserve an implementation break for the redesign. Pause competing frontend/shared-style/layout writers and new product implementation; backend contracts remain stable. Research11–13 and real-data feasibility are now separately authorized to start before this UI break; their docs must warn that frontend code is changing and retain provisional dependent sections until actual merged contracts can be inspected.
- Start a **new implementation chat** with useful agents, separate writer checkouts/branches, GPT-6.1 Sol / Extra High unless the human changes the model preference, and Standard speed/Fast off. Assign the requesting user as human owner and the UI lead as steward for layout, global styles, fonts, shared components and any necessary manifest changes.
- Supply the exact merged main SHA, working local URL, current acceptance commands and explicit file/resource lease. This is implementation authorization under the human's requested UI task; routine design choices do not need another approval round.
- Check the research registry before UI launch: the human now requests real-data feasibility and research11–13 immediately. Reuse those existing research chats; do not launch duplicates. They own only research documents and cannot compete for frontend/backend writes or heavy checks. UI must not wait for their recommendations.

---

## Prompt to send to the new UI implementation chat

Redesign and implement the complete **GrantPath application UI/UX** as a distinctive, polished research workbench for a time-constrained hackathon. Own the design decisions and implementation. Make reasonable assumptions and proceed without asking the human to choose layouts, fonts, colors or visual directions.

Parent orchestrator: `01a17191-e455-7b93-8c8e-54ebcf12741d`, local `grantguide` project. Checked main revision: **[ORCHESTRATOR: exact merged SHA]**. Current healthy review URL: **[ORCHESTRATOR: verified URL/build]**. Explicit frontend/shared-style lease: **[ORCHESTRATOR: confirmed scopes and paused writers]**. Actual time remaining: **[ORCHESTRATOR: confirmed window, no invented cutoff]**.

The human's priorities are **technical impressiveness, clarity, impact and novelty**. This is a working hackathon application, with a demo expected October 26, 2026 unless the human updates that context. Preserve time for integration, verification and rehearsal. Create a memorable product identity and an understandable working experience; a long feature list or cosmetic theme swap is insufficient.

### Understand the real product

Read `AGENTS.md`, `docs/PROJECT_BRIEF.md`, ownership/task/coordination records, API contract, actual implementation status, feature release notes and scoped instructions. Inspect the actual merged code, run the app and capture the starting screens before designing. Treat the supplied SHA as the source of truth. Identify every implemented view, its state owner, mutation API and dirty-buffer behavior. Preserve useful conventions and all verified behavior.

GrantPath's primary user is a researcher or principal investigator preparing and revising a funding application. They need to know **what matters next, what supports a claim, which exact version is selected, and what remains unresolved**. Its differentiator is a traceable chain of source material, requirements, file/draft versions, reviewer concerns, actions, evidence and human decisions. Later award/finance features extend that same traceability into approved terms and recorded activity.

The existing base uses paper/sage surfaces, sans-serif text, rounded controls and numbered workspace steps. Inspect what has changed during the completed batch. Develop a stronger composition and identity for the whole product rather than treating those defaults as the final design system.

Inventory and preserve the actual merged capabilities:

- Project profile, versioned evidence and document library: upload, extraction review, exact quotation/excerpt origin, immutable file versions and readable missing/stale states.
- Opportunity discovery and comparison: clearly fictional examples, manual calls and verified NSF/Grants.gov data remain distinguishable; refresh and freshness mean what the backend actually implements.
- Application preparation: confirmed requirements, phase-aware attachment/ethics records, deadlines/internal targets, agenda/ICS, pinned selections and immutable handoffs.
- Full NSF narrative authoring: all supported sections and applicability, structured text/tables/lists, reviewed reusable content, citations, source inspection, frozen packets and existing DOCX/PDF downloads/limits.
- Resubmission: frozen original, independent target cycle, exact reviewer quotes, concern/action/evidence/revision/response links, comparisons, human completion and targeted staleness.
- Advisory rubric review: criterion scores/reasons and top fixes, insufficient-context states, exact passage/evidence inspection, accepted/dismissed findings, tasks and retained runs. Show actual semantic/fixture/manual coverage honestly.
- Award and finance workflow: confirmed terms/amendments, honest progress worksheet, exact requested/approved/actual/committed/forecast distinctions, preview-confirmed CSV, immutable ledger/internal report snapshots and appropriate local-review labels.
- Website reminders: banners while the website is open, with durable snooze/dismiss/pause and changed-deadline behavior. Closed-site delivery is deferred.

Only expose capabilities that are really present in the checked main. If an inventory item remains outside the accepted batch, report the discrepancy and design around the actual product. Never invent a working connection, result, receipt link, scientific score or financial authority.

### Choose and implement a deliberate identity

Explore at least three substantially different product-specific compositions privately, then choose and implement the strongest. Useful starting lenses include an annotated research dossier, a precise field instrument, or an evidence-and-funding ledger. These are prompts for judgment, not templates or three color variants of the same card dashboard.

Choose a memorable, coherent palette with deliberate relationships between canvas, ink, accent and semantic states. Give typography a recognizable role in reading, authoring, evidence inspection and exact numeric comparisons. Define spacing, density, hierarchy, surface treatment, borders and motion as a system. Use fonts that render reliably in the actual demo environment; bundle permitted assets or provide intentional fallbacks. Avoid adding a dependency or remote build requirement merely for decoration.

Make the selected project/application, current stage, current version and next useful action understandable within seconds. Organize navigation around the researcher's workflow and keep context visible across the whole application. Long forms, evidence passages and comparisons need compositions suited to reading and decisions. This is an application workbench; a marketing landing page is not required.

### Make the product itself memorable

Implement one primary **signature interaction** derived from real persisted relationships. Favor a compelling, inspectable evidence/version experience that demonstrates why GrantPath matters. Possible directions include:

- A claim-to-evidence trace that opens the retained quotation, original file version and relevant requirement or review action together.
- A revision/change lens that makes the old submission, selected target revision and supported response legible, including what actually became stale.
- A precise funding view that separates requested, awarded, spent, committed and unknown amounts and reveals their actual source/snapshot.

Choose the strongest after inspecting the integrated code. Preserve gaps as gaps and show the next action when a link is missing. Do not draw a decorative graph with invented edges. Support ordinary keyboard/click controls alongside any direct manipulation. Motion should explain a state/version change, reveal a relationship or confirm a save; honor reduced-motion preferences.

Keep familiar controls predictable. Apply originality to composition, evidence presentation and the signature interaction. Use charts, cards, tables, badges or icons because they answer a real user question. Do not fill space with fake metrics, interchangeable dashboard tiles, generic AI copy or unsupported success claims.

### Make the complete workflow convincing

Use realistic domain-specific content and the existing synthetic/real labels. The main laptop/projector demo must expose the distinctive capability early and remain legible at realistic viewing distance. Source text, dense financial values, long reviewer comments, tables and missing values must stay readable.

Every implemented surface needs useful loading, empty, validation, conflict, error and success states. Decode actual structured API errors into useful messages. Preserve no-key/manual recovery, uncertain dates, stale evidence, null advisory scores, negative balances and incomplete work. Do not turn warnings into green success styling or erase the distinction between a human decision and a machine check.

Preserve unsaved text across ordinary view changes, selection, background refresh and 409 conflicts. Never replace a dirty editor with server state silently. Keep frozen historical references separate from current text; a highlight for an old quotation must open the retained version. Version labels and source inspector details should clarify the researcher's decision without exposing server paths or irrelevant implementation internals.

### Coordinate agents and exclusive ownership

Use useful independent agents for product/workflow audit, implementation and rendered-result critique. Keep the current concurrency limit in mind. Every concurrent writer needs its own isolated checkout/branch and a literal exclusive file set. Read-only reviewers may inspect the lead checkout.

The UI lead owns the application shell, navigation, `app/layout.tsx`, global styles/fonts, shared primitives/tokens and final integration. Freeze those interfaces before giving dependent component work to writers. Delegate screen families with disjoint existing files/directories, for example proposal/review authoring, project/document/application preparation, or award/finance/discovery. Pick actual scopes after the code inventory; do not assign the same shared component or stylesheet to multiple writers.

All competing frontend implementation is paused during this redesign lease. Keep data calculations, server commands, validation, storage, migrations and provider authentication intact. If a real backend issue prevents the UI from working, report a concrete reproducible blocker to the parent and coordinate its owner; do not silently rewrite contracts or add product scope. Keep credentials and file I/O server-side and tests offline by default.

### Implement and verify the rendered result

Use the existing Next.js/React stack and maintainable native components/styles. Reuse the app's working APIs and state machinery. Avoid unnecessary packages, external services or a new design framework. Keep imported module provenance intact.

Run the actual application and inspect screenshots throughout implementation. Check a laptop/projector viewport, a large desktop and a 390 px mobile viewport, keyboard-only use, visible focus, contrast, zoom, long content, overflow and reduced-motion behavior. Check real loading/error/conflict/empty states; do not verify only the populated happy path.

Exercise the main source-to-draft/review journey plus representative paths in every implemented feature family. Include upload/replacement/exact quotation, 14-section authoring, unsaved-buffer/409 recovery, old/new review actions, failed/insufficient semantic review, ledger import/duplicate/refund/commitment behavior, banner dismissal after date change, saved exports and real restart. Update UI locators when the design changes while preserving meaningful behavioral assertions. Do not remove required acceptance or data-integrity coverage to make the redesign pass.

Critique the actual rendered result for:

1. Immediate clarity of the selected application, current state and next action.
2. Efficient reading, writing and review with evidence visible at the right time.
3. Legible hierarchy, density and long-content handling on a projected screen.
4. A coherent product-specific identity across every feature, including error/empty states.
5. A signature interaction that genuinely explains the traceable evidence/version mechanism.

Identify the three most consequential observed weaknesses, fix them and inspect the affected screens again. Use concrete screenshots and behavior rather than arbitrary self-ratings. Report any unavailable visual/browser check accurately.

### Leave a design system future work can follow

Deliver `docs/DESIGN_SYSTEM.md` and `docs/UI_COMPONENT_MAP.md` referencing the actual implemented tokens, components, layouts and interaction/state patterns. Explain how a new feature joins navigation, uses the evidence inspector, handles dense data/forms, reports errors and preserves dirty state. Include practical examples from the code, accessibility/motion rules and the rationale for the chosen palette/type hierarchy.

Supply the parent with the exact instruction update needed to make these files mandatory for future frontend work. The redesign is complete only when the implemented UI, these design-system documents and the corresponding `AGENTS.md` consumption requirement are checked and merged into main. Subsequent implementations, including 11–13 after their gates, must consume this design system and shared primitives instead of adding a competing palette or independent screen shell. Treat changes to the design system as shared-scope work with a steward.

### Final handoff

Complete integration on the exact checked current base. Run the applicable unit/module checks, `npm run check`, existing and revised isolated browser journeys, real restart and dev smoke under the assigned resource slot. Build the final code, run `npm run review` on the assigned review port/data, explicitly verify `/api/health` plus revision/build identity and provide the working local URL. Preserve the normal workspace and unrelated servers. No public deployment, external sends, paid calls or account changes are authorized by a UI redesign.

Report the chosen design direction, what the signature interaction explains, changed workflow/screens, real commands and screenshot/browser evidence, the three weaknesses fixed, remaining limitations, exact commit and released ownership. Provide a concise chat explanation and links to the design-system docs and actual local review. The parent will integrate through normal CI gates and refresh main's local deployment.
