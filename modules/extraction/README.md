# Structured extraction with evidence

## 1. What problem does this solve, and when should I use it?

Extract configurable labeled fields into reviewable structured data while preserving supporting source spans. Use the deterministic local extractor for briefs, forms and requirements containing `Label: value` lines, or apply its validation boundary to a configured model's structured output. Missing and ambiguous values remain explicit.

## 2. What is the smallest working example?

```sh
node --import tsx modules/extraction/examples/demo.ts
```

```ts
const result = extractFields(document);
const budget = result.fields.find((field) => field.key === 'budget');
```

Browser-safe functions and schemas are in `src/index.ts`. The default fields are organization, ISO deadline, decimal budget and requirement.

## 3. How do I add it to a fresh project or an existing project?

Select `extraction` and its `documents` dependency. Pass the canonical normalized source directly. For another form, provide `[{key,label,aliases?,kind?,required?}]`. The module does not force an AI dependency or route. Existing model adapters can call `validateExtraction(output,document)` before returning results.

## 4. What does the API accept and return?

`extractFields(document,fields=defaultFields)` returns `{documentId,documentHash,mode,method,fields}`. Each result includes status (`found`, `missing`, `ambiguous`, `invalid`, `reviewed`), value or null, issues and candidates with raw text, normalized value and Citation. Date values must be valid YYYY-MM-DD; price values accept decimal numbers and an optional dollar symbol/comma separators. Currency semantics belong to the caller. Text/requirements are trimmed. Repeated identical values remain supported; conflicting values become ambiguous. No confidence score is fabricated.

`validateExtraction(output,document)` checks schema, source revision, exact quotes/ranges, normalization and support for found values. This is the **untrusted provider** boundary: it rejects reviewed status or review metadata so a provider cannot impersonate a human reviewer. Legitimate local edits use the separate trusted validation path inside reviewExtraction; reviewed values must still satisfy their field normalization. `reviewExtraction(result,{key,value,editor,note},document)` returns a validated copy preserving the original candidates and previous value. A manual edit unsupported by evidence is marked `review.supported:false`. `evidencePreview(document,citation,context=80)` returns before/highlight/after text for safe UI rendering.

## 5. What prerequisites, environment variables, or credentials are needed?

Zod and shared contracts; no credentials. If connecting a model, configure its adapter server-side, request ExtractionResultSchema-compatible output, pass exact source spans, then run the validator. Provider-generated confidence or citations are not trusted merely because JSON validates.

## 6. What changes must I make to routes, schema, storage, or UI?

Display each value alongside its status and source link. Selecting evidence should scroll/highlight the canonical document; render before/highlight/after as text nodes with a `<mark>` element, never raw HTML. Offer save/cancel around a draft value; save calls reviewExtraction with editor identity from authentication and an explanatory note. Preserve original candidates in storage for audit; invalidate extraction after document hash changes. No migration is prescribed.

## 7. How do I verify it and handle expected failures?

```sh
npx vitest run modules/extraction/tests
node --import tsx modules/extraction/examples/demo.ts
```

Tests cover decimal normalization, Unicode support, ambiguity, impossible dates, empty sources, literal configurable labels, forged citations, source changes and unsupported manual edits. Missing values are normal output, not exceptions. Invalid external outputs must be rejected and surfaced for review; do not silently fill defaults or fallback to sample results.

Implementation: implemented. Local: tests passed 2026-10-09. Exported project: passed 2026-10-09 in the standalone full recipe (clean install, types, module tests, build and local HTTP). Live provider: not run — module is deterministic; any added model integration requires operator authorization. Base revision 0fcd52a plus implementation commit.

## 8. What does it depend on, and what are its limits?

Depends on documents and shared contracts, with Zod runtime validation. This is labeled-line extraction, not open-ended semantic entity recognition; it intentionally will not infer unlabeled facts. Up to 30 fields/10 aliases per field. ISO dates avoid locale ambiguity. Price parsing does not infer currency or exchange rates. Requirement fields preserve text but do not evaluate compliance. Manual review metadata is evidence of an edit, not independent factual verification. Original code/fixtures: MIT. No paid calls or third-party source material in fixtures.
