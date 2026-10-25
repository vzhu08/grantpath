# Ownership

Product owner: requesting user. Lead writer/integrator: Codex in this chat. This is the authoritative ownership board.

| Scope                                              | Owner                      | Duty                                         |
| -------------------------------------------------- | -------------------------- | -------------------------------------------- |
| lib/**, app/**, tests, root configuration and docs | Codex lead                 | Implementation, integration and verification |
| Eligibility/evidence and requirements/date review  | Local read-only reviewer A | Report concrete gaps; no writes              |
| Drafting/readiness/security and final scope review | Local read-only reviewer B | Report concrete gaps; no writes              |

Contracts: lib/schema.ts. Fixtures: lib/fixtures.ts. Port 3000; test port 3100. Normal data .local-data/; tests use temporary directories. No concurrent writers or shared remote systems. The empty workspace has no Git checkout and Git metadata is read-only under this task profile; isolated writer branches are unavailable. The brief's serial-writing/read-only-review fallback applies. Generic kit role templates do not add human teammates or approval gates to the accepted request.
