import { describe, it, expect, vi, beforeEach } from 'vitest';
import SimplifiedDataProvider from '../src/simplified-data.js';

describe('SimplifiedDataProvider - getVolatilityAnalysis', () => {
  let provider;

  beforeEach(() => {
    provider = new SimplifiedDataProvider();

    // Mock getQuote
    vi.spyOn(provider, 'getQuote').mockImplementation(async (symbol) => {
      if (symbol === 'INVALID') throw new Error('Invalid symbol');
      return {
        symbol,
        price: 150.5,
        change: 1.5,
        changePercent: 1.01,
        previousClose: 149,
        source: 'yahoo',
      };
    });

    // Mock getHistoricalData
    vi.spyOn(provider, 'getHistoricalData').mockImplementation(async (symbol) => {
      const mockPrices = Array.from({ length: 60 }, (_, i) => 150 + i * 0.5);
      const mockTimestamps = Array.from({ length: 60 }, (_, i) => Date.now() - i * 86400000);
      return {
        prices: mockPrices,
        timestamps: mockTimestamps,
        source: 'yahoo',
      };
    });
  });

  it('returns expected volatility analysis for valid symbol', async () => {
    const analysis = await provider.getVolatilityAnalysis('AAPL');

    expect(analysis.symbol).toBe('AAPL');
    expect(analysis.dataQuality).toBe('estimated'); // matches your test expectation
    expect(analysis.quote.price).toBe(150.5);
    expect(analysis.historical.prices.length).toBe(60);
  });

  it('throws error for invalid symbol', async () => {
    await expect(provider.getVolatilityAnalysis('INVALID')).rejects.toThrow('Invalid symbol');
  });
});
