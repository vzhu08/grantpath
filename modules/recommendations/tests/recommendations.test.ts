import { describe, expect, it } from 'vitest';
import {
  cosineSimilarity,
  rankCandidates,
  sampleCandidates,
  samplePreferences,
} from '../src/index';

describe('recommendations', () => {
  it('filters hard constraints and explains the actual score', () => {
    const result = rankCandidates(sampleCandidates, samplePreferences);
    expect(result.ranked.map((r) => r.candidate.id)).toEqual(['garden', 'market']);
    expect(result.excluded[0].id).toBe('rooftop');
    expect(result.excluded[0].reasons).toHaveLength(2);
    for (const r of result.ranked)
      expect(
        r.explanations.reduce((s, e) => s + e.contribution, 0) / samplePreferences.length,
      ).toBeCloseTo(r.score);
  });
  it('is stable for cold-start, equal scores and input order', () => {
    expect(
      rankCandidates([...sampleCandidates].reverse(), []).ranked.map((r) => r.candidate.id),
    ).toEqual(['garden', 'market', 'rooftop']);
    expect(rankCandidates(sampleCandidates, []).coldStart).toBe(true);
    expect(rankCandidates(sampleCandidates, []).ties).toHaveLength(1);
  });
  it('uses approval votes to resolve utility ties without violating hard constraints', () => {
    const result = rankCandidates(
      sampleCandidates,
      [{ memberId: 'voter', requiredTags: ['accessible'] }],
      [{ memberId: 'voter', candidateId: 'market' }],
    );
    expect(result.ranked[0].candidate.id).toBe('market');
    expect(result.ranked).toHaveLength(2);
  });
  it('returns empty for a conflicting group or empty pool', () => {
    expect(rankCandidates([], []).ranked).toEqual([]);
    expect(
      rankCandidates(sampleCandidates, [
        { memberId: 'one', requiredTags: ['outdoors'] },
        { memberId: 'two', excludedTags: ['outdoors'] },
      ]).ranked,
    ).toEqual([]);
  });
  it('rejects duplicate members, duplicate votes, malformed bounds and unknown vote targets', () => {
    expect(() => rankCandidates(sampleCandidates, [{ memberId: 'x' }, { memberId: 'x' }])).toThrow(
      'Duplicate',
    );
    expect(() =>
      rankCandidates(
        sampleCandidates,
        [{ memberId: 'x' }],
        [{ memberId: 'x', candidateId: 'missing' }],
      ),
    ).toThrow('unknown');
    expect(() =>
      rankCandidates(sampleCandidates, [{ memberId: 'x', bounds: { cost: { min: 50, max: 5 } } }]),
    ).toThrow();
    expect(() =>
      rankCandidates(
        sampleCandidates,
        [{ memberId: 'x' }],
        [
          { memberId: 'x', candidateId: 'garden' },
          { memberId: 'x', candidateId: 'garden' },
        ],
      ),
    ).toThrow('Duplicate');
  });
  it('computes optional embedding similarity and rejects incomparable vectors', () => {
    expect(cosineSimilarity([1, 0], [0, 1])).toBe(0);
    expect(() => cosineSimilarity([1], [1, 2])).toThrow();
    expect(() => cosineSimilarity([0], [1])).toThrow();
    const result = rankCandidates(
      [
        { id: 'a', name: 'A', embedding: [1, 0] },
        { id: 'b', name: 'B', embedding: [0, 1] },
      ],
      [{ memberId: 'p', embedding: [1, 0], similarityWeight: 1 }],
    );
    expect(result.ranked.map((r) => r.score)).toEqual([1, 0.5]);
  });
  it('penalizes missing soft metrics and excludes missing hard metrics', () => {
    const c = [
      { id: 'a', name: 'A' },
      { id: 'b', name: 'B', metrics: { value: 4 } },
    ];
    expect(
      rankCandidates(c, [{ memberId: 'x', weights: { value: { weight: 1, direction: 'higher' } } }])
        .ranked[0].candidate.id,
    ).toBe('b');
    expect(
      rankCandidates(c, [{ memberId: 'x', bounds: { value: { min: 0 } } }]).excluded[0].id,
    ).toBe('a');
  });
});
