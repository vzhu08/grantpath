# Verification contract

`npm run check`: strict TypeScript, selected-kit/domain tests and production build. Domain tests cover eligibility/ambiguity, currency, Unicode quote spans, staleness, archives, atomic persistence, conflicts, demo reset, intake bounds, route origin, calendar serialization, bounded generation, malicious source text, forged citations, no-key operation, draft history and readiness.

`npm run test:browser`: isolated headless Chromium journey creating project/evidence/call, confirming requirements, drafting/citing sections, exporting files, refresh/restart, missing live configuration, explicit fixtures, focus and 390px stacking. Screenshots and downloaded files remain in `test-results/` for inspection.

Default tests use fixtures/mocked provider transports. Paid live requests and external calendar-client imports are separate, unrun checks unless explicitly recorded. Serialization alone is not a calendar-client import test.
