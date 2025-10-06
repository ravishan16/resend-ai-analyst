import SimplifiedDataProvider from "../src/simplified-data.js";

describe("SimplifiedDataProvider - getVolatilityAnalysis", () => {
  const provider = new SimplifiedDataProvider({
    finnhubApiKey: process.env.FINNHUB_API_KEY,
  });

  const testSymbols = ["AAPL", "MSFT", "NVDA", "INVALID"];

  testSymbols.forEach((symbol) => {
    it(`should analyze volatility for ${symbol}`, async () => {
      if (symbol === "INVALID") {
        await expect(provider.getVolatilityAnalysis(symbol)).rejects.toThrow(
          "Invalid symbol"
        );
      } else {
        const analysis = await provider.getVolatilityAnalysis(symbol);

        // 1. Check for existence (already done)
        expect(analysis).toHaveProperty("currentPrice");
        expect(analysis).toHaveProperty("fiftyTwoWeekHigh");
        expect(analysis).toHaveProperty("fiftyTwoWeekLow");

        // 2. Check for numeric type and positive value
        // Ensure the core values are numbers and greater than zero
        expect(typeof analysis.currentPrice).toBe("number");
        expect(analysis.currentPrice).toBeGreaterThan(0);

        expect(typeof analysis.historicalVolatility).toBe("number");
        expect(analysis.historicalVolatility).toBeGreaterThan(0);

        // 3. Check for logical consistency
        // The 52-week high must be greater than the low
        expect(analysis.fiftyTwoWeekHigh).toBeGreaterThan(
          analysis.fiftyTwoWeekLow
        );

        // The current price should generally be within the 52-week range (or close to it)
        expect(analysis.currentPrice).toBeGreaterThan(
          analysis.fiftyTwoWeekLow * 0.9
        ); // tolerance check
      }
    });
  });
});
