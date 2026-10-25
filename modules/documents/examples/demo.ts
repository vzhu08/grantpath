import { readFile } from 'node:fs/promises';
import { ingestDocument } from '../src/server';
const document = await ingestDocument({
  filename: 'project.md',
  bytes: await readFile(new URL('../fixtures/project.md', import.meta.url)),
});
console.log(JSON.stringify(document, null, 2));
