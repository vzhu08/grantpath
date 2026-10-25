# GrantWeave 11 core release

October 25, 2026. **Working, independently reviewed and scoped-tested pure core; application integration pending.** Latest human authorization releases independent engine/contracts/tests/exports now, superseding the copied study's older wait-for-GW-0 wording for this phase only. It does not release shared integration or frontend.

## Researcher improvement and mechanism

GrantWeave finds exact whole-item funding assignments for required research work or establishes why the encoded conditions fail. It distinguishes apparent aggregate affordability from usable dated/category capacity, effort/resource availability and scoped support compatibility. Existing support remains active at zero new allocation. Hypothetical awards are separate conditional branch assumptions; call maxima never become money available.

The working mechanism is deterministic bounded TypeScript finite-domain DFS with exact BigInt cents, sound monotone pruning, an independent raw-model witness checker, source-linked constraints and reproducible frozen internal exports. A separately implemented exhaustive oracle and independent hand-derived solution counts validate the approved small synthetic reference. No external solver service, AI arithmetic or additional dependency.

## Ownership and inspected source

Lead: `C:/Users/vzhu0/.codex/worktrees/2c3a/grantguide`, branch `codex/11-grantweave-core`. Actual starting main `2da6a3104663d602424256217b19f2eba58c6996`, schema 4. Only root AGENTS found in relevant scoped instruction search. Read project brief, selected modules, quickstart, ownership, task card, human workflow, API/status, full study/reference/source/review notes and latest primary AGENTS/coordination/ownership/task-card overrides.

Copied only the four assigned study documents individually from primary, verified source/destination SHA-256 bytes, preserved originals. Reference-only context commit `4c1b512` contains these unchanged copies. Parent already collected equivalent research in `7010236`, so the later core code commit can be integrated separately.

| Copied file | SHA-256 |
| --- | --- |
| `docs/implementation/11_GRANTWEAVE_IMPLEMENTATION.md` | `901c43af5668954b528be5bf2d88d77310eebb5aeaec651bdbd7d1d213ea4c81` |
| `docs/research/11/REFERENCE_CASES.md` | `af2c125e61108141e070f925fedafaae07863e2046922aa1cb7fdadae486cfbd` |
| `docs/research/11/SOURCES.md` | `b4af3a6b2b70c86649cce0cb5927f4c8b04bfc4b3f06e2de0473d43968aa2796` |
| `docs/research/11/REVIEW.md` | `a388030f0d2f27f644342aaacf37c7dd9d83ce1bf04f205f6d5bfe1ee7277c8c` |

Sole lead writer: new `modules/grantweave/**`, `tests/grantweave/**`, `scripts/grantweave-vitest.config.ts`, this release note. No other shared/application/central-record edits. No concurrent writing subagent. Both useful read-only agents use requested GPT-6.1 Sol/xhigh, Standard/Fast off requested without costly tier changes:

| Agent | Independent work, fixes and final result |
| --- | --- |
| `/root/algorithm_review` | Exact four F1/one F2 solution counts, domain/pruning/support/node/checker review and independent oracle/test audit. Fixed full-output ordering, saved witness order, unconditional oracle comparison, B performance-window fidelity, all-candidate and exact-budget coverage. Final static approval; no remaining blocker. |
| `/root/contract_review` | Closed boundaries, authority/unknown/currentness/failure/export review. Fixed out-of-range UTF-16 offsets silently clamped by slice; saved branch/label/witness/totals/state/limits and fabricated infeasible acceptance. Final static approval; no remaining blocker. |

Reviewers executed no tests/processes and made no writes. The user directly authorized parent-chat progress/resource/handoff messaging after automatic review rejected delegation-only authorization. No unrelated messages sent.

## Actual contracts and implemented behavior

Public server-side entrypoint `modules/grantweave/index.ts`: v1 input/model/branch/witness/dependency/result/snapshot schemas, `validateInput`, `solve`, `validateWitness`, `createSnapshot`, `readFrozenExport`, `assessCurrentness`, and actual feature-owned TypeScript types. [Module README](../../modules/grantweave/README.md) documents boundaries, all entrypoints and a complete concrete caller example. No duplicate host DTO or guessed 05/06 port/import.

Strict nested validation covers canonical USD cents, dates and performance windows, exact economic identities, source text SHA-256/UTF-16 quotations, confirmations/synthetic labels, complete explicit branch outcomes, graph references/DAG, monthly demand units/capacities/outside loads and closed supported restriction predicates. Unknown/null/proposed facts produce `needs_input`; known zero is a real constraint.

Versioned results distinguish feasible/infeasible/unknown/needs-input/invalid-model/error, retain deterministic work/stop state, exact usage/cap/slack and source-linked exclusions/proofs. Infeasibility needs a direct complete proof or exhaustive search. Node limit without witness/proof stays unknown. A found verified witness remains feasible with incomplete alternatives. Sufficient conflict sets are explicitly non-minimal; no optimality or guaranteed completion claim.

Pure snapshot helpers freeze exact UTF-8 JSON/Markdown content, lengths, SHA-256 and serializer identity in memory. Readers verify closure/branch/label/limits and independently recompute every feasible witness's constraints. Claimed infeasibility is checked against the pinned bounded engine; this can consume the captured node budget and belongs outside a future serialized host transaction. Saved bytes are never regenerated or reformatted. Hashes detect corruption; they do not authenticate hostile imports. Currentness is only a caller-supplied manifest comparison, not invented upstream/file verification.

All synthetic unit/reference inputs are confined to tests, including the approved $12,000 A/B/C case and separate invented overlap/removal variants. No product/frontend fixture injection, source-verified claims, actual award receipts or real financial/scientific authority.

## Executed scoped verification

Parent explicitly rotated the single cheap 11–13 slot from 12 to 11, then 11 released it promptly for 13 after checks and exact junction cleanup. Heavy/shared priority remains 05→06→08. Versions read from the reused existing primary dependencies: Node **24.12.0**, Vitest **5.0.5**, TypeScript **6.0.3**, Zod **4.6.7**. No install/package/lockfile changes.

Private environment: `TEMP`/`TMP` set to this checkout's `.test-data/grantweave/temp`, heap bound 512 MiB; feature Vitest config uses **one worker**, serial files and `.test-data/grantweave/vite` cache. A temporary `node_modules` junction pointed exactly to `C:/Users/vzhu0/PycharmProjects/grantguide/node_modules`; path/type/target were verified before link-only removal. Shared target retained. Initial sandbox junction creation was denied by filesystem permissions, then the approved elevated bounded command succeeded.

| Exact command | Observed result |
| --- | --- |
| `node node_modules/vitest/vitest.mjs run --config scripts/grantweave-vitest.config.ts --configLoader native` | Exit **0**, **45 tests / 1 suite passed**, reported duration **4.22 s**. This is whole focused-suite duration, not a solver benchmark. |
| `node node_modules/typescript/bin/tsc --ignoreConfig --noEmit --strict --target ES2022 --module ESNext --moduleResolution Bundler --types node --skipLibCheck modules/grantweave/index.ts tests/grantweave/core.test.ts scripts/grantweave-vitest.config.ts` | Exit **0**, no diagnostics. Explicit-file scoped check, not app typecheck. |

Coverage: F1–F4/D1/E1/C1/O1/O2/R1/T1 and ES1; all **729** default oracle leaves with exactly four feasible allocations; sole F2 witness and binding caps; all **729 default + 729 overlap candidates** through public witness validation; **60 seeded** small models with category/period/cost restrictions. Additional checks cover indivisible packing beyond aggregate money, exact large cents, direct proof versus unknown, exact-budget exhaustion, incomplete witness retention, 5-source/12-atom work bounding, cap-increase witness preservation, malformed/duplicate/missing/unknown identities, dates/money/units/cycles/period overlap, source/label/citation integrity, canonical set-order output, fingerprint changes, frozen byte/order roundtrip, corrupt/rehashed-invalid proof/state/limit/format rejection and targeted currentness. No external API calls in tests.

Static final scope/whitespace/clean-status evidence and final code SHA are supplied in the chat handoff after commit. A file-write tool approval timeout left this release file absent; the confirmed absent write was retried, without lost code or changed application data. Subsequent workspace commands and the checks above succeeded.

## Pending host/application gates

GW-0 still requires actual checked/merged 05/06 SHAs and runtime contracts: money grammar, obligation versus anticipated/action facts, selected terms/current head, ledger cutoff/budget/category mapping, human-confirmed eligible residual capacity and authoritative source/file closure. Scalar remaining is not eligible money. Preserve upstream historical payloads and hash algorithms. No unmerged finance runtime or fake host is imported.

Later exclusive shared integration must capture/recapture closures, reject stale-during-solve saves, atomically retain immutable input/result/exports/receipt, recover retries before revision rejection, reject changed retry payloads, preserve failed-write bytes and retain graph history through reset/archive/migration. Reconcile actual request/storage/lifetime caps. No parallel mutable JSON store or toy server.

Frontend awaits combined 02–09 functional/rendered GO, accepted DESIGN_SYSTEM/UI_COMPONENT_MAP and explicit ownership. No React/components/pages/styles/scaffolds/frontend fixtures. Live AI, paid requests, sponsor actions, real science/finance/institutional validation, public deployment and real experiment execution were not performed.

No local GrantWeave application review URL exists for this core milestone. Full app checks/build, `npm run review`, verified loopback health/build/revision identity, connected acceptance/restart/receipts/retention/regressions and required CI/branch gates remain application integration prerequisites. Parent keeps current main/review stewardship; this worker does not merge itself.
