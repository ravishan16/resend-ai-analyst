import { describe, it, expect, vi, beforeEach } from 'vitest';
import RealVolatilityData, { calculateVolatilityScore } from '../src/real-volatility.js';

// Mock the simplified data provider
vi.mock('../src/simplified-data.js', () => {
  return {
    default: vi.fn().mockImplementation(() => ({
      getVolatilityAnalysis: vi.fn(),
      getBulkVolatilityAnalysis: vi.fn()
    }))
  };
});

// Mock Alpha Vantage API
vi.mock('../src/alphavantage.js', () => {
  return {
    default: vi.fn().mockImplementation(() => ({
      getVolatilityAnalysis: vi.fn()
    }))
  };
});

describe('RealVolatilityData', () => {
  let realVolatility;
  
  beforeEach(() => {
    vi.clearAllMocks();
    realVolatility = new RealVolatilityData();
  });

  describe('initialize', () => {
    it('should initialize simplified data provider', async () => {
      const result = await realVolatility.initialize('alpha-key', 'finnhub-key');

      expect(result).toBe(true);
      expect(realVolatility.initialized).toBe(true);
      expect(realVolatility.dataProvider).toBeTruthy();
    });

    it('should handle missing API keys gracefully', async () => {
      const result = await realVolatility.initialize();

      expect(result).toBe(true);
      expect(realVolatility.initialized).toBe(true);
    });
  });

  describe('getVolatilityAnalysis', () => {
    beforeEach(async () => {
      await realVolatility.initialize('alpha-key', 'finnhub-key');
    });

    it('should use simplified provider for analysis', async () => {
      const mockAnalysis = {
        symbol: 'AAPL',
        currentPrice: 150.50,
        volatilityScore: 85,
        dataQuality: 'real'
      };

      realVolatility.dataProvider.getVolatilityAnalysis.mockResolvedValue(mockAnalysis);

      const result = await realVolatility.getVolatilityAnalysis('AAPL');

      expect(result).toEqual(mockAnalysis);
      expect(realVolatility.dataProvider.getVolatilityAnalysis).toHaveBeenCalledWith('AAPL');
    });

    it('should throw error when not initialized', async () => {
      const uninitializedRealVol = new RealVolatilityData();

      await expect(uninitializedRealVol.getVolatilityAnalysis('AAPL'))
        .rejects.toThrow('RealVolatilityData not initialized');
    });

    it('should handle provider errors gracefully', async () => {
      realVolatility.dataProvider.getVolatilityAnalysis.mockRejectedValue(new Error('Provider error'));

      const result = await realVolatility.getVolatilityAnalysis('AAPL');

      expect(result).toBeNull();
    });
  });

  describe('getBulkVolatilityAnalysis', () => {
    beforeEach(async () => {
      await realVolatility.initialize('alpha-key', 'finnhub-key');
    });

    it('should analyze multiple symbols', async () => {
      const symbols = ['AAPL', 'MSFT', 'GOOGL'];
      const mockResults = {
        AAPL: { symbol: 'AAPL', volatilityScore: 85 },
        MSFT: { symbol: 'MSFT', volatilityScore: 72 },
        GOOGL: { symbol: 'GOOGL', volatilityScore: 91 }
      };

      realVolatility.dataProvider.getBulkVolatilityAnalysis.mockResolvedValue(mockResults);

      const result = await realVolatility.getBulkVolatilityAnalysis(symbols);

      expect(result).toEqual(mockResults);
      expect(realVolatility.dataProvider.getBulkVolatilityAnalysis).toHaveBeenCalledWith(symbols);
    });

    it('should handle empty symbol array', async () => {
      const result = await realVolatility.getBulkVolatilityAnalysis([]);

      expect(result).toEqual({});
    });
  });
});

describe('calculateVolatilityScore', () => {
  it('should calculate score based on IV percentile, rank, and liquidity', () => {
    const volatilityData = {
      impliedVolatilityPercentile: 80,
      impliedVolatilityRank: 0.7,
      optionsVolume: 50000
    };

    const score = calculateVolatilityScore(volatilityData);

    // Expected: (80 * 0.4) + (0.7 * 0.4) + (5.0 * 0.2) = 32 + 0.28 + 1.0 = 33.28
    expect(score).toBeCloseTo(33.28, 1);
  });

  it('should use default values for missing data', () => {
    const volatilityData = {
      impliedVolatilityPercentile: 60
      // Missing rank and volume
    };

    const score = calculateVolatilityScore(volatilityData);

    // Expected: (60 * 0.4) + (0 * 0.4) + (0 * 0.2) = 24
    expect(score).toBe(24);
  });

  it('should cap liquidity component at maximum', () => {
    const volatilityData = {
      impliedVolatilityPercentile: 50,
      impliedVolatilityRank: 0.5,
      optionsVolume: 200000 // Very high volume
    };

    const score = calculateVolatilityScore(volatilityData);

    // Liquidity component should be capped at 10 * 0.2 = 2.0
    // Expected: (50 * 0.4) + (0.5 * 0.4) + (10 * 0.2) = 20 + 0.2 + 2.0 = 22.2
    expect(score).toBeCloseTo(22.2, 1);
  });

  it('should return 0 for null or undefined data', () => {
    expect(calculateVolatilityScore(null)).toBe(0);
    expect(calculateVolatilityScore(undefined)).toBe(0);
  });
});