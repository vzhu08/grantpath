import { createLiveAI } from '../src/server';
if (process.env.RUN_LIVE_AI !== 'true')
  throw new Error('Set RUN_LIVE_AI=true only after approving provider usage');
const provider = process.env.AI_PROVIDER === 'anthropic' ? 'anthropic' : 'openai';
const apiKey = process.env[provider === 'anthropic' ? 'ANTHROPIC_API_KEY' : 'OPENAI_API_KEY'] ?? '';
const model = process.env.AI_MODEL ?? '';
if (!model) throw new Error('Set AI_MODEL to an available provider model');
const ai = createLiveAI({ provider, apiKey, model, timeoutMs: 15_000, maxRetries: 0 });
console.log(await ai.generate({ prompt: 'Reply with a short greeting.', maxOutputTokens: 32 }));
