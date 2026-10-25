import { rankCandidates, sampleCandidates, samplePreferences } from '../src/index';
console.log('LOCAL deterministic decision over synthetic activities');
console.log(
  JSON.stringify(
    rankCandidates(sampleCandidates, samplePreferences, [
      { memberId: 'alex', candidateId: 'garden' },
    ]),
    null,
    2,
  ),
);
console.log(
  'CONFLICT example',
  rankCandidates(sampleCandidates, [
    { memberId: 'a', requiredTags: ['outdoors'] },
    { memberId: 'b', excludedTags: ['outdoors'] },
  ]).ranked,
);
console.log(
  'COLD START',
  rankCandidates(sampleCandidates, []).ranked.map((r) => r.candidate.id),
);
