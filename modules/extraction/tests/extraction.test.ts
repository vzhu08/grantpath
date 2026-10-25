import { describe, it, expect } from 'vitest';
import { extractFields, reviewExtraction, validateExtraction, evidencePreview } from '../src/index';
import { normalizeText } from '../../documents/src/index';
const doc = (text: string) => normalizeText({ filename: 'source.txt', text });
describe('evidence grounded extraction', () => {
  it('extracts and normalizes values with source support', () => {
    const d = doc('🌿\nBudget: $12,500.00\nDeadline: 2027-03-15');
    const r = extractFields(d);
    expect(r.fields.find((f) => f.key === 'budget')!.value).toBe(12500);
    expect(r.fields.find((f) => f.key === 'organization')!.status).toBe('missing');
    const c = r.fields.find((f) => f.key === 'budget')!.candidates[0]!.evidence;
    expect(evidencePreview(d, c).highlight).toBe('$12,500.00');
    expect(validateExtraction(r, d)).toEqual(r);
  });
  it('represents ambiguous and invalid dates explicitly', () => {
    const r = extractFields(doc('Deadline: 2027-03-15\nDeadline: 2027-04-01\nBudget: unknown'));
    expect(r.fields.find((f) => f.key === 'deadline')).toMatchObject({
      status: 'ambiguous',
      value: null,
    });
    expect(r.fields.find((f) => f.key === 'budget')).toMatchObject({
      status: 'invalid',
      value: null,
    });
    expect(
      extractFields(doc('Deadline: 2027-02-30')).fields.find((f) => f.key === 'deadline')!.status,
    ).toBe('invalid');
  });
  it('rejects invented evidence and conflicting hashes', () => {
    const d = doc('Budget: $20');
    const r = extractFields(d);
    r.fields.find((f) => f.key === 'budget')!.candidates[0]!.evidence.quote = 'fake';
    expect(() => validateExtraction(r, d)).toThrow('evidence');
    expect(() => validateExtraction({ ...r, documentHash: 'fake' }, d)).toThrow('changed');
  });
  it('tracks review edits and marks unsupported manual changes', () => {
    const d = doc('Budget: $20');
    const r = reviewExtraction(
      extractFields(d),
      { key: 'budget', value: '25', editor: 'local-user', note: 'Confirmed revised estimate' },
      d,
    );
    expect(r.fields.find((f) => f.key === 'budget')).toMatchObject({
      status: 'reviewed',
      value: 25,
      review: { previousValue: 20, supported: false },
    });
  });
  it('supports configurable escaped labels and empty sources', () => {
    const r = extractFields(doc('Cost (USD): 4'), [
      { key: 'cost', label: 'Cost (USD)', kind: 'price' },
    ]);
    expect(r.fields[0]!.value).toBe(4);
    expect(extractFields(doc('')).fields.every((f) => f.status === 'missing')).toBe(true);
  });
  it('rejects untrusted provider claims of human review even when evidence is otherwise valid', () => {
    const d = doc('Budget: $20');
    const reviewed = reviewExtraction(
      extractFields(d),
      { key: 'budget', value: '25', editor: 'user', note: 'Manual revision' },
      d,
    );
    expect(() => validateExtraction(reviewed, d)).toThrow('cannot claim human review');
    const foundWithReview = extractFields(d);
    foundWithReview.fields.find((f) => f.key === 'budget')!.review = {
      editor: 'claimed-user',
      note: 'pretended approval',
      previousValue: 20,
      supported: true,
    };
    expect(() => validateExtraction(foundWithReview, d)).toThrow('cannot claim human review');
  });
  it('keeps legitimate successive local reviews and enforces reviewed value normalization', () => {
    const d = doc('Budget: $20');
    const first = reviewExtraction(
      extractFields(d),
      { key: 'budget', value: '25', editor: 'user', note: 'First revision' },
      d,
    );
    const next = reviewExtraction(
      first,
      { key: 'budget', value: '30', editor: 'user', note: 'Second revision' },
      d,
    );
    expect(next.fields.find((f) => f.key === 'budget')).toMatchObject({
      value: 30,
      status: 'reviewed',
      review: { previousValue: 25, supported: false },
    });
    next.fields.find((f) => f.key === 'budget')!.value = 'invalid-price';
    expect(() =>
      reviewExtraction(next, { key: 'budget', value: '35', editor: 'user', note: 'Attempt' }, d),
    ).toThrow();
  });
});
