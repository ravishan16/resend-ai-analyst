import { describe, it, expect, vi, beforeEach } from 'vitest';
import FinnhubAPI from '../src/finnhub.js';

// Mock fetch
global.fetch = vi.fn();

describe('FinnhubAPI', () => {
  let finnhub;
  const mockApiKey = 'test-finnhub-key';
  
  beforeEach(() => {
    vi.clearAllMocks();
    finnhub = new FinnhubAPI(mockApiKey);
  });

  describe('constructor', () => {
    it('should initialize with API key', () => {
      expect(finnhub.apiKey).toBe(mockApiKey);
      expect(finnhub.baseUrl).toBe('https://finnhub.io/api/v1');
    });
  });

  describe('getEarningsCalendar', () => {
    it('should fetch earnings calendar for date range', async () => {
      const mockResponse = {
        earningsCalendar: [
          {
            symbol: 'AAPL',
            date: '2025-01-15',
            epsEstimate: 2.10,
            revenueEstimate: 95000000000
          },
          {
            symbol: 'MSFT',
            date: '2025-01-16',
            epsEstimate: 3.20,
            revenueEstimate: 62000000000
          }
        ]
      };

      fetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockResponse)
      });

      const result = await finnhub.getEarningsCalendar('2025-01-15', '2025-01-20');

      expect(fetch).toHaveBeenCalledWith(
        `https://finnhub.io/api/v1/calendar/earnings?from=2025-01-15&to=2025-01-20&token=${mockApiKey}`
      );
      expect(result).toEqual(mockResponse.earningsCalendar);
    });

    it('should handle API errors gracefully', async () => {
      fetch.mockResolvedValueOnce({
        ok: false,
        status: 403,
        statusText: 'Forbidden'
      });

      await expect(finnhub.getEarningsCalendar('2025-01-15', '2025-01-20'))
        .rejects.toThrow('Finnhub API error: 403 Forbidden');
    });

    it('should handle network errors', async () => {
      fetch.mockRejectedValueOnce(new Error('Network error'));

      await expect(finnhub.getEarningsCalendar('2025-01-15', '2025-01-20'))
        .rejects.toThrow('Network error');
    });
  });

  describe('getQuote', () => {
    it('should fetch real-time quote', async () => {
      const mockQuote = {
        c: 150.50, // current price
        h: 152.00, // high
        l: 149.00, // low
        o: 151.00, // open
        pc: 148.50, // previous close
        t: 1640995200 // timestamp
      };

      fetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockQuote)
      });

      const result = await finnhub.getQuote('AAPL');

      expect(fetch).toHaveBeenCalledWith(
        `https://finnhub.io/api/v1/quote?symbol=AAPL&token=${mockApiKey}`
      );
      expect(result).toEqual(mockQuote);
    });

    it('should handle invalid symbol', async () => {
      const mockResponse = {
        c: 0,
        h: 0,
        l: 0,
        o: 0,
        pc: 0,
        t: 0
      };

      fetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockResponse)
      });

      const result = await finnhub.getQuote('INVALID');

      expect(result).toEqual(mockResponse);
    });
  });

  describe('getCompanyProfile', () => {
    it('should fetch company profile', async () => {
      const mockProfile = {
        country: 'US',
        currency: 'USD',
        exchange: 'NASDAQ NMS - GLOBAL MARKET',
        ipo: '1980-12-12',
        marketCapitalization: 2800000,
        name: 'Apple Inc',
        phone: '14089961010',
        shareOutstanding: 15728.7,
        ticker: 'AAPL',
        weburl: 'https://www.apple.com/'
      };

      fetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockProfile)
      });

      const result = await finnhub.getCompanyProfile('AAPL');

      expect(fetch).toHaveBeenCalledWith(
        `https://finnhub.io/api/v1/stock/profile2?symbol=AAPL&token=${mockApiKey}`
      );
      expect(result).toEqual(mockProfile);
    });
  });

  describe('getBasicFinancials', () => {
    it('should fetch basic financials', async () => {
      const mockFinancials = {
        metric: {
          '10DayAverageTradingVolume': 78000000,
          '52WeekHigh': 199.62,
          '52WeekLow': 164.08,
          beta: 1.2,
          marketCapitalization: 2800000,
          peBasicExclExtraTTM: 28.5
        },
        series: {
          annual: {},
          quarterly: {}
        }
      };

      fetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockFinancials)
      });

      const result = await finnhub.getBasicFinancials('AAPL');

      expect(fetch).toHaveBeenCalledWith(
        `https://finnhub.io/api/v1/stock/metric?symbol=AAPL&metric=all&token=${mockApiKey}`
      );
      expect(result).toEqual(mockFinancials);
    });
  });

  describe('rate limiting', () => {
    it('should include delay between requests when specified', async () => {
      const finnhubWithDelay = new FinnhubAPI(mockApiKey, 100);

      fetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ c: 150 })
      });

      const startTime = Date.now();
      await finnhubWithDelay.getQuote('AAPL');
      await finnhubWithDelay.getQuote('MSFT');
      const endTime = Date.now();

      // Should have at least 100ms delay between calls
      expect(endTime - startTime).toBeGreaterThan(100);
    });
  });

  describe('error handling', () => {
    it('should handle rate limit errors with specific message', async () => {
      fetch.mockResolvedValueOnce({
        ok: false,
        status: 429,
        statusText: 'Too Many Requests'
      });

      await expect(finnhub.getQuote('AAPL'))
        .rejects.toThrow('Finnhub API error: 429 Too Many Requests');
    });

    it('should handle unauthorized access', async () => {
      fetch.mockResolvedValueOnce({
        ok: false,
        status: 401,
        statusText: 'Unauthorized'
      });

      await expect(finnhub.getQuote('AAPL'))
        .rejects.toThrow('Finnhub API error: 401 Unauthorized');
    });
  });
});