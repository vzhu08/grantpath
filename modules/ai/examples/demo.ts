import { z } from 'zod';
import { FakeAI, renderPrompt, summaryPrompt } from '../src/index';
const ai = new FakeAI('Fixture: a three-person team builds a working demo.');
const prompt = renderPrompt(summaryPrompt, {
  source: 'Three developers are building a hackathon demo.',
  style: 'brief',
});
console.log({ ...prompt, ...(await ai.generate({ prompt: prompt.text })) });
console.log(
  await ai.structured({ prompt: 'Extract the team size' }, z.object({ people: z.number() }), {
    people: 3,
  }),
);
for await (const chunk of ai.stream({ prompt: prompt.text })) process.stdout.write(chunk);
process.stdout.write('\n');
