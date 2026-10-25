# Recommendations and group decisions

## 1. What problem does this solve, and when should I use it?

Choose among a bounded set of activities, products, locations or proposals using explicit preferences. Hard constraints filter candidates before soft utility is calculated. Every group member has equal influence over utility; votes resolve equal utility. Explanations come from the exact inputs used by the calculation. No language model invents reasons.

## 2. What is the smallest working example?

From a checkout with dependencies installed:

```sh
node --import tsx modules/recommendations/examples/demo.ts
```

The synthetic activity dataset ranks the garden first, excludes the inaccessible/over-budget rooftop, demonstrates a conflict with no result, and shows a cold-start ordering. In code, import `rankCandidates`, `sampleCandidates` and `samplePreferences` from `modules/recommendations/src/index.ts`, then call `rankCandidates(sampleCandidates, samplePreferences)`.

## 3. How do I add it to a fresh project or an existing project?

Select `recommendations` using the kit catalog, or copy `modules/recommendations` preserving its layout. Install the pinned `zod` dependency listed in [module.json](module.json). Existing applications can call the pure function directly and adapt their candidate records; no database migration, route replacement or framework is required. Keep downstream preferences/candidate metadata in your application's own storage.

## 4. What does the API accept and return?

[The public schema](src/index.ts) defines `Candidate {id,name,tags,metrics,embedding?}`, `Preference {memberId,requiredTags,excludedTags,bounds,weights,preferredTags,tagWeight,embedding?,similarityWeight}` and `Vote {memberId,candidateId}`. Each metric weight includes a nonnegative weight and `higher|lower` direction. Bounds are inclusive; a missing metric fails a hard bound. IDs must be unique; at most one approval vote per known member is accepted.

`rankCandidates(candidates, preferences, votes?)` returns `mode:'local'`, ranked candidates with score/vote count/per-member contribution records, excluded IDs with reasons, ties, and a cold-start flag. Lower/higher metric utility uses the eligible pool's min/max; a constant metric receives 0.5, a missing soft value receives 0. Preferred-tag utility is the matched fraction. Optional cosine similarity maps [-1,1] to [0,1]. Weights normalize within each member, then member scores average. No active weights yields neutral 0.5. Hard constraints are unanimous, including members with no soft weights.

Scores round to 9 decimals. Ordering is descending score, descending approvals, then ascending lexical candidate ID; reported ties share score and approvals before the ID tiebreak. Votes never override hard constraints. Votes for a candidate subsequently excluded are retained as input but do not add utility to any other candidate. No members gives neutral scores and a stable ID order.

## 5. What prerequisites, environment variables, or credentials are needed?

Node.js 22+ for the examples, or a modern browser for the pure API. No environment variables or credentials. Precomputed embeddings are optional; generate them separately using a chosen provider and use the same model/dimension for candidate and preference vectors. Zero-norm, nonfinite or mismatched vectors fail explicitly.

## 6. What changes must I make to routes, schema, storage, or UI?

Collect hard constraints separately from soft preferences. Show excluded reasons and an empty-state action to relax constraints with consent. Render `ranked[].explanations` alongside results. Collect one approval choice per member; enforce member identity/authorization at a server boundary if votes are persisted or shared. The pure module does not authenticate group membership or synchronize votes.

## 7. How do I verify it and handle expected failures?

```sh
npx vitest run modules/recommendations/tests
```

Tests cover numerical explanation agreement, hard filtering, conflicts, cold start, missing metrics, similarity validation, duplicate/unknown votes and deterministic ties. An empty `ranked` array is a valid outcome. Invalid schema or IDs throw; render a correctable input error instead of a fabricated recommendation. [The fixtures](fixtures/activities.json) are synthetic and MIT licensed; [conflict.json](fixtures/conflict.json) documents the empty group outcome.

Implementation: implemented. Observed local verification: `npx tsc --noEmit` passed on the module checkout; `npx eslint modules` passed; `npx vitest run modules/recommendations/tests` passed (7 tests as part of the combined 35-test module run); `node --import tsx modules/recommendations/examples/demo.ts` completed without credentials. Exported-project verification: passed 2026-10-09 in the standalone full recipe (clean npm ci, types, module tests, production build and local HTTP). Live provider verification: not applicable to this pure module; external embedding generation is not verified here.

## 8. What does it depend on, and what are its limits?

Zod only. At most 2,000 candidates, 100 members and 100 approval votes. Relative min/max scoring means adding or removing eligible candidates can change utilities; use domain-fixed ranges in a downstream extension when that is undesirable. Equal member averaging is a transparent policy, not a claim of universal fairness. Embedding similarity does not replace hard constraints or explain semantic relevance beyond its numerical contribution. No API costs or external calls. Original implementation and synthetic fixtures: MIT.
