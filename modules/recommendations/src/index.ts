import { z } from 'zod';

const MetricSchema = z.record(z.string(), z.number().finite());
export const CandidateSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  tags: z.array(z.string()).default([]),
  metrics: MetricSchema.default({}),
  embedding: z.array(z.number().finite()).min(1).max(4096).optional(),
});
export type Candidate = z.infer<typeof CandidateSchema>;
export const PreferenceSchema = z.object({
  memberId: z.string().min(1),
  requiredTags: z.array(z.string()).default([]),
  excludedTags: z.array(z.string()).default([]),
  bounds: z
    .record(
      z.string(),
      z
        .object({ min: z.number().finite().optional(), max: z.number().finite().optional() })
        .refine(
          (b) => b.min === undefined || b.max === undefined || b.min <= b.max,
          'min must not exceed max',
        ),
    )
    .default({}),
  weights: z
    .record(
      z.string(),
      z.object({
        weight: z.number().nonnegative().max(100),
        direction: z.enum(['higher', 'lower']),
      }),
    )
    .default({}),
  preferredTags: z.array(z.string()).default([]),
  tagWeight: z.number().nonnegative().max(100).default(1),
  embedding: z.array(z.number().finite()).min(1).max(4096).optional(),
  similarityWeight: z.number().nonnegative().max(100).default(0),
});
export type Preference = z.infer<typeof PreferenceSchema>;
export const VoteSchema = z.object({ memberId: z.string().min(1), candidateId: z.string().min(1) });
export type Vote = z.infer<typeof VoteSchema>;
export function cosineSimilarity(a: number[], b: number[]): number {
  if (!a.length || a.length !== b.length || [...a, ...b].some((n) => !Number.isFinite(n)))
    throw new Error('Embedding vectors must have equal nonzero dimensions and finite values');
  const normA = Math.hypot(...a),
    normB = Math.hypot(...b);
  if (!normA || !normB) throw new Error('Embedding vectors must have nonzero norm');
  return Math.max(-1, Math.min(1, a.reduce((sum, v, i) => sum + v * b[i], 0) / (normA * normB)));
}
export type Explanation = {
  memberId: string;
  input: string;
  value: number | string;
  utility: number;
  weight: number;
  contribution: number;
  note: string;
};
/** Hard constraints are unanimous; soft utility is equally averaged across members. Votes break utility ties. */
export function rankCandidates(
  candidateInput: unknown,
  preferenceInput: unknown,
  voteInput: unknown = [],
) {
  const candidates = z.array(CandidateSchema).max(2000).parse(candidateInput);
  const preferences = z.array(PreferenceSchema).max(100).parse(preferenceInput);
  const votes = z.array(VoteSchema).max(100).parse(voteInput);
  for (const [kind, ids] of [
    ['candidate', candidates.map((c) => c.id)],
    ['member', preferences.map((p) => p.memberId)],
    ['vote member', votes.map((v) => v.memberId)],
  ] as const)
    if (new Set(ids).size !== ids.length) throw new Error(`Duplicate ${kind} ID`);
  for (const vote of votes)
    if (
      !preferences.some((p) => p.memberId === vote.memberId) ||
      !candidates.some((c) => c.id === vote.candidateId)
    )
      throw new Error('Vote references an unknown member or candidate');
  const excluded: { id: string; reasons: string[] }[] = [];
  const eligible = candidates.filter((c) => {
    const reasons: string[] = [];
    for (const p of preferences) {
      for (const t of p.requiredTags)
        if (!c.tags.includes(t)) reasons.push(`${p.memberId}: required tag ${t} missing`);
      for (const t of p.excludedTags)
        if (c.tags.includes(t)) reasons.push(`${p.memberId}: excluded tag ${t}`);
      for (const [metric, bound] of Object.entries(p.bounds)) {
        const value = c.metrics[metric];
        if (
          value === undefined ||
          (bound.min !== undefined && value < bound.min) ||
          (bound.max !== undefined && value > bound.max)
        )
          reasons.push(`${p.memberId}: ${metric} outside hard bounds or missing`);
      }
    }
    if (reasons.length) excluded.push({ id: c.id, reasons });
    return !reasons.length;
  });
  const ranges = new Map<string, { low: number; high: number }>();
  for (const p of preferences)
    for (const metric of Object.keys(p.weights))
      if (!ranges.has(metric)) {
        let low = Infinity,
          high = -Infinity;
        for (const c of eligible) {
          const value = c.metrics[metric];
          if (value !== undefined) {
            low = Math.min(low, value);
            high = Math.max(high, value);
          }
        }
        ranges.set(metric, { low, high });
      }
  const ranked = eligible
    .map((candidate) => {
      const explanations: Explanation[] = [];
      let groupUtility = 0;
      for (const p of preferences) {
        const parts: Omit<Explanation, 'memberId' | 'contribution'>[] = [];
        for (const [metric, rule] of Object.entries(p.weights)) {
          const { low, high } = ranges.get(metric)!;
          const value = candidate.metrics[metric];
          const utility =
            value === undefined
              ? 0
              : low === high
                ? 0.5
                : rule.direction === 'higher'
                  ? (value - low) / (high - low)
                  : (high - value) / (high - low);
          parts.push({
            input: metric,
            value: value ?? 'missing',
            utility,
            weight: rule.weight,
            note:
              value === undefined
                ? 'Missing soft metric receives zero utility'
                : `Eligible range ${low}–${high}; prefer ${rule.direction}`,
          });
        }
        if (p.preferredTags.length) {
          const matched = p.preferredTags.filter((t) => candidate.tags.includes(t));
          parts.push({
            input: 'tags',
            value: matched.join(', ') || 'none',
            utility: matched.length / p.preferredTags.length,
            weight: p.tagWeight,
            note: `${matched.length}/${p.preferredTags.length} preferred tags`,
          });
        }
        if (p.embedding && p.similarityWeight > 0)
          parts.push({
            input: 'embedding',
            value: candidate.embedding
              ? cosineSimilarity(p.embedding, candidate.embedding)
              : 'missing',
            utility: candidate.embedding
              ? (cosineSimilarity(p.embedding, candidate.embedding) + 1) / 2
              : 0,
            weight: p.similarityWeight,
            note: 'Cosine mapped from [-1,1] to [0,1]; vectors must share a model',
          });
        const totalWeight = parts.reduce((s, x) => s + x.weight, 0);
        let memberUtility = totalWeight ? 0 : 0.5;
        for (const part of parts) {
          const contribution = totalWeight ? (part.utility * part.weight) / totalWeight : 0;
          memberUtility += contribution;
          explanations.push({ ...part, memberId: p.memberId, contribution });
        }
        if (!totalWeight)
          explanations.push({
            memberId: p.memberId,
            input: 'neutral prior',
            value: 'no active soft weight',
            utility: 0.5,
            weight: 0,
            contribution: 0.5,
            note: 'Member has no nonzero soft preference weights; neutral utility is 0.5',
          });
        groupUtility += memberUtility;
      }
      return {
        candidate,
        score:
          Math.round((preferences.length ? groupUtility / preferences.length : 0.5) * 1e9) / 1e9,
        votes: votes.filter((v) => v.candidateId === candidate.id).length,
        explanations,
      };
    })
    .sort(
      (a, b) =>
        b.score - a.score ||
        b.votes - a.votes ||
        (a.candidate.id < b.candidate.id ? -1 : a.candidate.id > b.candidate.id ? 1 : 0),
    );
  const grouped = new Map<string, typeof ranked>();
  for (const result of ranked) {
    const key = `${result.score}:${result.votes}`;
    grouped.set(key, [...(grouped.get(key) ?? []), result]);
  }
  const ties = [...grouped.values()]
    .filter((g) => g.length > 1)
    .map((g) => g.map((r) => r.candidate.id));
  return {
    mode: 'local' as const,
    ranked,
    excluded,
    ties,
    coldStart: preferences.length === 0,
    policy:
      'Unanimous hard constraints; equal member mean; score then approval votes then lexical ID',
  };
}
export const sampleCandidates: Candidate[] = [
  {
    id: 'garden',
    name: 'Garden picnic',
    tags: ['outdoors', 'accessible', 'vegetarian'],
    metrics: { cost: 12, minutes: 15, rating: 4.5 },
  },
  {
    id: 'market',
    name: 'Community market',
    tags: ['accessible', 'vegetarian'],
    metrics: { cost: 18, minutes: 8, rating: 4.7 },
  },
  {
    id: 'rooftop',
    name: 'Rooftop dinner',
    tags: ['outdoors'],
    metrics: { cost: 45, minutes: 30, rating: 4.8 },
  },
];
export const samplePreferences: Preference[] = [
  PreferenceSchema.parse({
    memberId: 'alex',
    requiredTags: ['accessible'],
    bounds: { cost: { max: 25 } },
    weights: {
      cost: { weight: 2, direction: 'lower' },
      rating: { weight: 1, direction: 'higher' },
    },
  }),
  PreferenceSchema.parse({
    memberId: 'sam',
    preferredTags: ['outdoors'],
    weights: { minutes: { weight: 1, direction: 'lower' } },
  }),
];
