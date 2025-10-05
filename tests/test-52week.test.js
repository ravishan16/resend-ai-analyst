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
        console.log({
          symbol: analysis.symbol,
          price: analysis.currentPrice,
          historicalVolatility: analysis.historicalVolatility,
          impliedVolatility: analysis.impliedVolatility,
          fiftyTwoWeekLow: analysis.fiftyTwoWeekLow,
          fiftyTwoWeekHigh: analysis.fiftyTwoWeekHigh,
        });
        expect(analysis).toHaveProperty("currentPrice");
        expect(analysis).toHaveProperty("fiftyTwoWeekHigh");
        expect(analysis).toHaveProperty("fiftyTwoWeekLow");
      }
    });
  });
});
