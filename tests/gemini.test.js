import { describe, it, expect } from 'vitest';

import { validateAnalysis } from '../src/gemini.js';

describe('validateAnalysis', () => {
  it('accepts a well-formed analysis payload', () => {
    const analysis = {
      sentimentScore: 8,
      recommendation: 'STRONGLY CONSIDER',
      strategies: [
        { name: 'Bull Call Spread' },
        { name: 'Short Put' }
      ]
    };

    const result = validateAnalysis(analysis);

    expect(result.isValid).toBe(true);
    expect(result.issues).toHaveLength(0);
  });

  it('flags missing or inconsistent attributes', () => {
    const analysis = {
      sentimentScore: 3,
      recommendation: 'STRONGLY CONSIDER',
      strategies: []
    };

    const result = validateAnalysis(analysis);

    expect(result.isValid).toBe(false);
    expect(result.issues).toContain('No strategies provided');
    expect(result.issues).toContain('Inconsistent sentiment and recommendation');
  });
});
