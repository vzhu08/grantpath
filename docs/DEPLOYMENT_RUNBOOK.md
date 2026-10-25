# Deployment runbook

Human release authority: [name]. Target host/team/project/environment: [exact]. Candidate SHA: [actual]. Known-good URL/SHA: [record]. Budget: [authorized policy]. Hosted verification: [not run until evidence exists].

Before deployment: npm ci, project checks/build, inspect module prerequisites and secrets by name, review migrations/backup and explicit CORS. Configure separate local/preview/production values and OAuth callbacks. Browser URL must be publicly reachable; server URL can be private. Keep provider keys off NEXT_PUBLIC.

For a generated web app use its Next configuration and vercel.json. Confirm the platform's current target behavior before the first deploy. For optional Python/jobs use the supplied container build context; durable SQLite needs a persistent volume and separate worker lifecycle. Memory demos are not reliable hosted background processing. Review current payload, duration, native binary, streaming and WebSocket constraints in official host docs; no fixed quota/free-tier promise.

After authorized deployment: inspect build/runtime logs, GET /api/health and /api/ready, confirm the returned revision, and execute DEMO_RUNBOOK in a fresh session. Record URL/SHA/screenshots and failures. Roll back to the named known-good deployment if the core flow breaks, verify schema compatibility and test recovery. App rollback does not reverse migrations. Never reset production data as a demo shortcut.
