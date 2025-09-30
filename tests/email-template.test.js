import { describe, it, expect } from 'vitest';

import EmailTemplate from '../src/email-template.js';

describe('EmailTemplate', () => {
  it('renders digest note when supplied via market context', () => {
    const html = EmailTemplate({
      opportunities: [],
      marketContext: { digestNote: 'No qualifying setups today.' },
      date: 'Mon, 01 Jan 2025'
    });

    expect(html).toContain('No qualifying opportunities found today');
    expect(html).toContain('No qualifying setups today.');
  });

  it('uses the warm brand palette in the header', () => {
    const html = EmailTemplate({
      opportunities: [
        {
          opportunity: {
            symbol: 'AAPL',
            date: '2025-01-01',
            daysToEarnings: 10,
            volatilityData: {
              currentPrice: 190,
              impliedVolatility: 45,
              historicalVolatility: 30,
              expectedMove: 8,
              technicalIndicators: { rsi: 55 }
            },
            qualityScore: 72
          },
          analysis: {
            sentimentScore: 7,
            recommendation: 'NEUTRAL',
            strategies: [
              { name: 'Iron Condor' }
            ]
          }
        }
      ],
      marketContext: { vix: 18, marketRegime: 'normal' },
      date: 'Mon, 01 Jan 2025'
    });

    expect(html).toContain('#FAF6F0');
    expect(html).toContain('#DDBEA9');
    expect(html).toContain('Quantitative Earnings Opportunities');
  });
});
