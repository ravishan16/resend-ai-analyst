import { describe, it, expect, vi, beforeEach } from "vitest";
import SimplifiedDataProvider from "../src/simplified-data.js";

// Mock fetch for API calls
global.fetch = vi.fn();

describe("SimplifiedDataProvider", () => {
  let provider;

  beforeEach(() => {
    vi.clearAllMocks();
    provider = new SimplifiedDataProvider({
      finnhubApiKey: process.env.FINNHUB_API_KEY,
      requestDelay: 100,
    });
  });

  describe("getQuote", () => {
    it("should get quote from Yahoo Finance first", async () => {
      const mockYahooResponse = {
        chart: {
          result: [
            {
              meta: { regularMarketPrice: 150.5, previousClose: 149.0 },
              timestamp: [1640995200],
              indicators: { quote: [{ close: [150.5] }] },
            },
          ],
        },
      };

      fetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockYahooResponse),
      });

      const quote = await provider.getQuote("AAPL");

      expect(quote).toMatchObject({
        symbol: "AAPL",
        price: 150.5,
        previousClose: 149.0,
        change: 1.5,
        changePercent: 1.01,
        source: "yahoo",
      });
    });

    it("should fallback to Finnhub when Yahoo fails", async () => {
      // Yahoo fails
      fetch.mockRejectedValueOnce(new Error("Yahoo API error"));

      // Finnhub succeeds
      const mockFinnhubResponse = {
        c: 150.5, // current price
        pc: 149.0, // previous close
      };

      fetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockFinnhubResponse),
      });

      const quote = await provider.getQuote("AAPL");

      expect(quote).toEqual({
        symbol: "AAPL",
        price: 150.5,
        previousClose: 149.0,
        change: 1.5,
        changePercent: 1.01,
        source: "finnhub",
      });
    });

    it("should throw error when all sources fail", async () => {
      fetch.mockRejectedValue(new Error("API error"));

      await expect(provider.getQuote("AAPL")).rejects.toThrow(
        "Unable to fetch quote for AAPL"
      );
    });
  });

  describe("getHistoricalData", () => {
    it("should get historical data from Yahoo Finance", async () => {
      const mockYahooResponse = {
        chart: {
          result: [
            {
              timestamp: [1640995200, 1641081600, 1641168000],
              indicators: {
                quote: [
                  {
                    close: [150.5, 151.0, 149.5],
                    high: [151.0, 152.0, 150.0],
                    low: [149.0, 150.0, 148.0],
                    volume: [1000000, 1100000, 900000],
                  },
                ],
              },
            },
          ],
        },
      };

      fetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockYahooResponse),
      });

      const data = await provider.getHistoricalData("AAPL", 60);

      expect(data.prices).toHaveLength(3);
      expect(data.prices[0]).toEqual({
        date: "2022-01-01",
        close: 150.5,
        high: 151.0,
        low: 149.0,
        volume: 1000000,
      });
      expect(data.source).toBe("yahoo");
    });

    it("should return null when Yahoo historical data fails", async () => {
      fetch.mockRejectedValueOnce(new Error("Yahoo API error"));

      const data = await provider.getHistoricalData("AAPL", 60);

      expect(data).toBeNull();
    });
  });

  describe("getVolatilityAnalysis", () => {
    it("should perform complete volatility analysis with real data", async () => {
      // Mock Yahoo quote
      const mockQuoteResponse = {
        chart: {
          result: [
            {
              meta: { regularMarketPrice: 150.5, previousClose: 149.0 },
              timestamp: [1640995200],
              indicators: { quote: [{ close: [150.5] }] },
            },
          ],
        },
      };

      // Mock Yahoo historical data
      const prices = Array.from(
        { length: 60 },
        (_, i) => 150 + Math.sin(i * 0.1) * 5
      );
      const mockHistoricalResponse = {
        chart: {
          result: [
            {
              timestamp: Array.from(
                { length: 60 },
                (_, i) => 1640995200 + i * 86400
              ),
              indicators: {
                quote: [
                  {
                    close: prices,
                    high: prices.map((p) => p + 1),
                    low: prices.map((p) => p - 1),
                    volume: Array(60).fill(1000000),
                  },
                ],
              },
            },
          ],
        },
      };

      fetch
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(mockQuoteResponse),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(mockHistoricalResponse),
        });

      const analysis = await provider.getVolatilityAnalysis("AAPL");

      expect(analysis).toMatchObject({
        symbol: "AAPL",
        currentPrice: 150.5,
        changePercent: 1.01,
        dataQuality: "real",
        dataSources: { quote: "yahoo", historical: "yahoo" },
      });
      expect(analysis.historicalVolatility).toBeGreaterThan(0);
      expect(analysis.impliedVolatility).toBeGreaterThan(0);
      expect(analysis.expectedMove).toBeGreaterThan(0);
      expect(analysis.volatilityScore).toBeGreaterThanOrEqual(0);
    });

    it("should return estimated analysis when data sources fail", async () => {
      fetch.mockRejectedValue(new Error("API error"));

      const analysis = await provider.getVolatilityAnalysis("AAPL");

      expect(analysis).toMatchObject({
        symbol: "AAPL",
        dataQuality: "estimated",
        dataSources: { quote: "estimated", historical: "estimated" },
      });
      expect(analysis.currentPrice).toBeGreaterThan(0);
      expect(analysis.historicalVolatility).toBeGreaterThan(0);
    });
  });

  describe("getBulkVolatilityAnalysis", () => {
    it("should analyze multiple symbols with rate limiting", async () => {
      const symbols = ["AAPL", "MSFT"];

      // Mock responses for both symbols
      fetch.mockResolvedValue({
        ok: true,
        json: () =>
          Promise.resolve({
            chart: {
              result: [
                {
                  meta: { regularMarketPrice: 150.5, previousClose: 149.0 },
                  timestamp: [1640995200],
                  indicators: { quote: [{ close: [150.5] }] },
                },
              ],
            },
          }),
      });

      const startTime = Date.now();
      const results = await provider.getBulkVolatilityAnalysis(symbols);
      const endTime = Date.now();

      expect(Object.keys(results)).toEqual(symbols);
      expect(results.AAPL).toBeTruthy();
      expect(results.MSFT).toBeTruthy();

      // Should have rate limiting delay (at least 100ms between calls)
      expect(endTime - startTime).toBeGreaterThan(100);
    });

    it("should handle mixed success/failure scenarios", async () => {
      const symbols = ["AAPL", "INVALID"];

      fetch
        .mockResolvedValueOnce({
          ok: true,
          json: () =>
            Promise.resolve({
              chart: {
                result: [
                  { meta: { regularMarketPrice: 150.5, previousClose: 149.0 } },
                ],
              },
            }),
        })
        .mockRejectedValueOnce(new Error("Invalid symbol"));

      const results = await provider.getBulkVolatilityAnalysis(symbols);

      expect(results.AAPL).toBeTruthy();
      expect(results.INVALID).toBeNull();
    });
  });

  describe("calculateHistoricalVolatility", () => {
    it("should calculate volatility from price data", () => {
      const prices = [100, 101, 99, 102, 98, 103, 97];
      const volatility = provider.calculateHistoricalVolatility(prices);

      expect(volatility).toBeGreaterThan(0);
      expect(volatility).toBeLessThan(100);
    });

    it("should handle insufficient data", () => {
      const prices = [100, 101];
      const volatility = provider.calculateHistoricalVolatility(prices);

      expect(volatility).toBe(0);
    });
  });

  describe("estimateImpliedVolatility", () => {
    it("should estimate reasonable implied volatility", () => {
      const historicalVol = 25;
      const impliedVol = provider.estimateImpliedVolatility(historicalVol);

      expect(impliedVol).toBeGreaterThan(20);
      expect(impliedVol).toBeLessThan(35);
    });
  });
});
