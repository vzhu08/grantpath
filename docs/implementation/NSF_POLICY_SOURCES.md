# NSF template manifest sources and integration contract

PT-02 adds an immutable, typed standard-research narrative preparation profile. It does not bind a template to an application, migrate storage, implement the editor/library, render a sponsor packet or certify sponsor readiness. The requesting user selected NSF in the separately researched implementation plan and later authorized starting roadmap 01. The profile remains a GrantPath structure derived from NSF guidance, not an NSF-issued form.

## Sources reviewed October 25 2026

The manifest records the official URL, manual check date, short excerpt, effective-date wording and the scope of any superseding notice. Those metadata are evidence of this technical source review, not continuous policy monitoring or independent verification of researcher claims. These official pages were opened while implementing this task:

- [NSF PAPPG index](https://www.nsf.gov/policies/pappg) still identifies NSF 24-1 as the current guide and links Supplements 1 and 2. A proposed newer guidance document is not silently treated as an effective replacement.
- [PAPPG 24-1 Chapter II](https://www.nsf.gov/policies/pappg/24-1/ch-2-proposal-preparation), particularly II.D.2.b through i: summary components and one-page aggregate limit; Project Description and its separate Broader Impacts heading; prior-support applicability and nested five-page limit; references; budget justification; facilities; mentoring. The full Project Description, including prior support, stays within 15 pages. Budget Justification has a five-page limit, and applicable mentoring has a one-page limit. Word limits are not invented from page limits.
- [Supplement 1 NSF 26-200](https://www.nsf.gov/policies/document/pappg24-1-supplement-1), effective for financial assistance awarded on or after December 8, 2025, amends specifically listed topics rather than replacing every rule in the guide.
- [Supplement 2 NSF 26-202](https://www.nsf.gov/policies/document/pappg24-1-supplement-2) supplies the controlling DMSP transition. Its notice identifies April 27, 2026 for the Research.gov tool. The older two-page PDF-upload provision is replaced. The local component is therefore an unlimited preparation worksheet, with the actual Research.gov task tracked separately.
- [NSF Senior/Key Personnel Documents](https://www.nsf.gov/funding/senior-personnel-documents) confirms the external SciENcv biosketch/current-support workflows, prescribed COA template and separate Synergistic Activities document. Internal reusable prose is not a substitute for these official records.

A real solicitation, NSF unit guidance, future notice or authorized deviation must be reconciled by the researcher before an eventual application binding is confirmed. Conflicts do not resolve automatically. Unknown applicability remains unresolved. The postdoctoral mentoring question asks whether a plan is required after reviewing the documented senior/key-personnel exception; it never assumes that exception from a job title.

## Pure interfaces

`lib/proposals/nsf-template.ts` exports:

- `NSF_STANDARD_RESEARCH_TEMPLATE`: recursively frozen template version 1, with stable section/component IDs, source references, explicit coverage and external tasks.
- `TemplateManifestSchema` / `parseTemplateManifest(input)`: strict shape/reference/order/parent/cycle/condition validation; the parser returns a recursively frozen copy. Template changes require a reviewed new immutable version; shape validation alone cannot establish that a changed rule is NSF policy.
- `AnswerSchema`, `QuestionIdSchema`, `ApplicabilityAnswersSchema`, `ConditionSchema`, and their relevant TypeScript types: bounded typed answer/any/all conditions without expression evaluation. Absent answers behave as unknown; unknown question IDs and operators are rejected.
- `evaluateCondition(condition, answers)`: applicable, not-applicable or unresolved under three-valued logic.
- `resolveTemplate(manifest, answers)`: applicable/unknown sections and external tasks plus unresolved/unsupported coverage findings. It does not clear external completion or claim that a package is supported under every call.
- `exportComponentPlan(manifest, answers)`: ordered per-component groups with aggregate limits and a measurement state that remains unknown until the exact PDF is rendered. Summary subgroups share one page; prior support stays nested inside the 15-page description.

Conditional work remains in an export preparation plan when its applicability is unknown; only an explicit false condition excludes it. Unsupported subawards, multi-organization submissions or special proposal types produce findings. Suggested writing headings remain distinguishable from the sourced required Broader Impacts heading. No API, file I/O, provider calls or source retrieval occurs when these pure helpers run.

## Next integration work

After lead review, PT-03 should copy a resolved manifest into a versioned application binding, migrate v1 data with byte-preserving backup, and retain old/unmapped drafts. A pinned manifest never changes an existing application automatically. Binding confirmation must record the actual call/source version, applicability answers, rule decisions and actor/time. Readiness must retain external tasks and exact-render page measurements. The renderer, document tree and current application schema are owned by the lead and were deliberately not modified here.

## Verification

Local verification on October 25, 2026: locked `npm ci --offline --no-audit --no-fund` passed; `npm run typecheck` passed; `npm test -- tests/proposals/template.test.ts` passed all 12 focused tests; `npm test` passed all 81 tests in six suites. The focused tests cover manifest integrity, three-valued conditions, aggregate/nested limits, the DMSP transition, external-personnel tasks and unsupported scope. Production build/browser behavior is unchanged and was not rerun in this scoped task; repository CI and lead integration verify those gates. No paid model calls, Research.gov login or sponsor submission is performed.
