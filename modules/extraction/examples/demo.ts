import { readFile } from 'node:fs/promises';
import { normalizeText } from '../../documents/src/index';
import { extractFields, reviewExtraction } from '../src/index';
const document = normalizeText({
  filename: 'ambiguous.txt',
  text: await readFile(new URL('../fixtures/ambiguous.txt', import.meta.url), 'utf8'),
});
const result = extractFields(document);
console.log(
  JSON.stringify(
    {
      original: result,
      reviewed: reviewExtraction(
        result,
        {
          key: 'deadline',
          value: '2027-04-01',
          editor: 'demo-user',
          note: 'Selected the later documented deadline',
        },
        document,
      ),
    },
    null,
    2,
  ),
);
