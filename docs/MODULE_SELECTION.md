# Selected modules and reuse

Actual kit revision: `22a5f44a27375e88ac2cd1754f6976704f725bc5`, matching the supplied planning reference. Generated with the kit CLI into the empty workspace using `web` and `documents,extraction,recommendations,ai`; no full recipe or orchestration runtime. `kit.project.json` preserves generated file hashes/provenance; local application customizations are separate.

| Module                   | Used interface                                       | Domain extension / limit                                                                                          |
| ------------------------ | ---------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------- |
| documents                | normalizeText, contentHash, canonical documents      | TXT/Markdown only; retained versions and source metadata                                                          |
| extraction               | extractFields with exact candidate spans             | Explicit grant labels, proposed requirements and manual prose quotes; no general grant reading                    |
| recommendations          | rankCandidates                                       | Tri-state hard eligibility handled before ranking only potential fits; no unknown-to-mismatch conversion          |
| ai                       | FakeAI.structured and server createLiveAI.structured | Explicit synthetic fixtures; live consent/config, quote/version validation, bounded prompt and preview acceptance |
| shared contracts/runtime | validateCitation, readJSON, KitError/errorResponse   | Application schemas, loopback/same-origin routes and atomic local storage                                         |

No interface differences from the brief's referenced revision were required. The generated generic AI demo routes were removed in favor of the connected application-owned route. Parser SDK dependencies are inherited from the selected documents module; PDF/DOCX/OCR intake is not enabled. Python was used only to inspect the supplied PDFs during development and is not an app dependency. No symlinks or imports reference the temporary kit checkout.

Dependency maintenance during initial verification: the kit pinned Next 16.4.0 and Zod 4.6.5. npm audit identified published advisories, so the app pins Next 16.4.3 and Zod 4.6.7, with the transitive undici dependency updated. The subsequent audit reported zero vulnerabilities. Kit source/provenance remains unchanged; this is an application dependency patch, not a claim of a security audit. Official Next notice: https://nextjs.org/blog/nextjs-security-update-october-14-2026.
