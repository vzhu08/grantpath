# Risks and scope cuts

| Risk                  | Early validation                                      | Owner    | Trigger                   | Planned cut/fallback                         | Disclosure                     |
| --------------------- | ----------------------------------------------------- | -------- | ------------------------- | -------------------------------------------- | ------------------------------ |
| Provider outage/quota | One authorized test-account call before relying on it | Core     | bounded retries exhausted | Explicitly labeled replay or local algorithm | Never call it live             |
| Integration drift     | Shared fixture through UI/API                         | Platform | schema mismatch           | Freeze interface, repair boundary            | Record changed contract        |
| Demo too complex      | Two-minute rehearsal                                  | Product  | core result not visible   | Cut secondary screens                        | Explain reduced scope honestly |
| [project risk]        | [check]                                               | [name]   | [observable]              | [bounded scope reduction]                    | [judge/user note]              |

Prefer cuts that preserve one valuable end-to-end flow. Do not respond to a broken boundary by adding more features or rewriting the entire stack near the deadline.
