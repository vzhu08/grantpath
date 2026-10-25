# Provenance and reuse

Original toolkit code, documentation and synthetic fixtures are MIT. Package dependencies retain their upstream licenses; installed packages include their own LICENSE/NOTICE files. The exact dependency graph is recorded in package-lock.json and the optional Python uv.lock. Consult those licenses before redistribution; this file does not replace them.

Notable components: React/Next.js, Zod, AI SDK and providers, Supabase client/SSR, PapaParse, pdf-lib, pdfjs-dist, Mammoth, QRCode, ws, Cheerio, ipaddr.js and Undici. No third-party logos, photographs, private documents, recordings or downloaded public datasets are bundled. Module manifests identify synthetic fixture authorship. The two files in docs/resources/source were supplied by the operator and are retained as source references with their original rights.

Before a hackathon, read its eligibility rules for prebuilt code, event-period work, AI tools and sponsor usage. MIT permission does not establish event eligibility. In SUBMISSION.md distinguish kit reuse from original event work and credit tools, libraries, datasets and people accurately. Do not claim synthetic data as real-world evaluation evidence.

Dependency audit on 2026-10-09 identified a moderate sprintf-js precision-format denial-of-service advisory through Mammoth's CLI dependency chain (argparse). The kit uses Mammoth's library API, accepts no user format strings and does not expose its CLI. A non-regressive upstream fix was not reported by npm audit. Recheck before public deployment; do not downgrade to an obsolete Mammoth release merely to silence the report.
