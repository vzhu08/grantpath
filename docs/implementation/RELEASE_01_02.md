# Complete roadmap 01 then 02

User authorization: finish the NSF proposal-template/reuse workflow, then implement the prepared document-vault specification. Use useful isolated local agents; CI handles repeated verification and checked integration. Finish with a healthy local server/review URL. Existing other-chat edits to ROADMAP and the item-03 plan are out of this release's write scope.

## Shared contracts

`lib/schema.ts` is authoritative. Workspace schema 2 adds generic stable section keys, optional versioned template bindings/archives, structured blocks, library revisions, frozen packet snapshots and export records. `lib/proposals/blocks.ts` is browser-safe; rendering reexports its schema and stays server-only. `lib/proposals/workflow.ts` owns proposal commands. `createRepository(directory)` exposes serialized `read`, revision-checked `mutate`, and server-only `internal(operation, expectedRevision?)` returning `{state,result}`; it exposes trusted `directory`/`filename`. All metadata writes use that queue. Migration from v1 writes an exclusive byte-identical backup before atomic replacement.

Application proposal commands: adoptTemplate; confirmTemplate (answers, requirement mappings, by, note); reviewSection; saveContent; approveContent; retireContent; insertContent (explicit target-context confirmation); resolveReuse; freezePacket. Draft saves accept validated blocks whose visible text must equal text. A frozen packet contains exact application/project/call/source/library inputs, issues and SHA-256. Existing draft IDs/text/source citations are retained in archives. Template manifest and blocks must never import server libraries into the browser.

## Exclusive ownership for 01

- Lead: root schemas/repository/migrations, proposal workflow/readiness, generation integration, app/page.tsx, shared common.tsx/styles, manifests/lockfiles, fixtures, tests except explicitly delegated files and final integration.
- Proposal UI agent: `components/proposal-panel.tsx`, `components/proposal-block-editor.tsx`, `tests/proposals/ui-contract.test.ts` only, isolated checkout from the contract commit. Export `ProposalPanel(EditorProps & {app:Application})`. It displays template setup for every app and the full editor/library/exports only for NSF-bound apps. Root keeps legacy Drafts alongside it when no NSF binding. Use optional `EditorProps.refresh()` after background changes; preserve editor registry/buffers.
- Export agent: `lib/proposals/export-service.ts`, `app/api/proposal-templates/route.ts`, `app/api/proposal-exports/**`, `tests/proposals/exports.test.ts` only, isolated checkout. POST exports accepts `{snapshotId,expectedRevision}` and returns `{state,exportId}`; frozen metadata is the input, never current mutable drafts. GET export status by export ID and GET verified artifact by artifact ID. Only trusted server paths. Use typed ProposalExport/PacketSnapshot records and repository.internal; do not edit shared schema.

Agents propose contract/dependency changes to the lead. Do not modify another lane or the user's dirty docs. Each worker runs focused tests/typecheck and commits its scope; lead integrates after inspection. Ports/data stay separate. No live paid calls or sponsor submissions. No application work for item 02 begins until 01's integrated browser/export acceptance passes; read-only planning for 02 may happen earlier.
