# Shared wire contracts

`src/index.ts` is the canonical Zod schema source. `schema.json` is generated with `npm run kit -- catalog build`. Python consumes the generated JSON Schema and shared fixtures; run its tests and the TS contract tests after schema changes. Offsets are JavaScript UTF-16 code units, end-exclusive. Python must convert offsets for non-BMP characters. Pages and CSV rows are 1-based. Progress is a fraction from 0 to 1. Unknown facts stay absent or explicitly missing; citations must match actual source substrings.
