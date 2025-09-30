import { describe, it, expect } from 'vitest';
import { isValidElement } from 'react';

import EmailTemplate from '../src/email-template.js';
import { htmlToReactEmail } from '../src/email-renderer.js';

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

  it('includes unsubscribe information in footer for broadcasts', () => {
    const html = EmailTemplate({
      opportunities: [],
      marketContext: { digestNote: 'Digest note for unsubscribe test.' },
      date: 'Mon, 01 Jan 2025'
    });

    // Check that footer mentions unsubscribe options are available
    expect(html).toContain('Unsubscribe options available in email footer');
    expect(html).toContain('Options Insight Newsletter');
  });

  it('returns null when DOMParser.parseFromString is not supported (edge runtime fallback)', () => {
    const originalDomParser = globalThis.DOMParser;

    class BrokenDomParser {
      parseFromString() {
        throw new Error('This browser does not support `DOMParser.prototype.parseFromString`');
      }
    }

    try {
      // Simulate Cloudflare Worker environment with DOMParser stub that throws.
      globalThis.DOMParser = BrokenDomParser;

      const html = EmailTemplate({
        opportunities: [],
        marketContext: {},
        date: 'Mon, 01 Jan 2025'
      });

      const reactTree = htmlToReactEmail(html);
      expect(reactTree).toBeNull();
    } finally {
      if (originalDomParser === undefined) {
        delete globalThis.DOMParser;
      } else {
        globalThis.DOMParser = originalDomParser;
      }
    }
  });
});
