# Integration notes

| Boundary         | Connected source/consumer | Environment names/scopes only | Setup   | Limit               | Actual verification   |
| ---------------- | ------------------------- | ----------------------------- | ------- | ------------------- | --------------------- |
| [route → module] | [paths]                   | [names, never values]         | [steps] | [timeout/data/cost] | [date/command/result] |

For OAuth record provider app/test-account owner, minimum scopes, exact redirect URI, state/PKCE, server token storage and refresh/revocation. For webhooks preserve raw body, verify signature/timestamp, deduplicate events and record retry semantics. For outbound sends require an explicit application action; default local tests use sinks.

Sponsor adapter checklist: official endpoint/docs checked date; account/eligibility; request/response schema; input bounds; credential location; timeout/cancel; retry/idempotency; usage/cost policy; source attribution; fixture provenance; failure example; test-account check; disclosure in submission. Do not assume future sponsors or invent availability.
