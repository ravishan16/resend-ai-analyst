import SimplifiedDataProvider from "../src/simplified-data.js";

(async () => {
  const provider = new SimplifiedDataProvider({
    finnhubApiKey: process.env.FINNHUB_API_KEY,
  });

  const testSymbols = ["AAPL", "MSFT", "NVDA", "INVALID"];

  const results = await Promise.all(
    testSymbols.map(async (symbol) => {
      try {
        const analysis = await provider.getVolatilityAnalysis(symbol);
        console.log({
          symbol: analysis.symbol,
          price: analysis.currentPrice,
          historicalVolatility: analysis.historicalVolatility,
          impliedVolatility: analysis.impliedVolatility,
          fiftyTwoWeekLow: analysis.fiftyTwoWeekLow,
          fiftyTwoWeekHigh: analysis.fiftyTwoWeekHigh,
        });
        return {
          symbol: analysis.symbol,
          price: analysis.currentPrice,
          historicalVolatility: analysis.historicalVolatility,
          impliedVolatility: analysis.impliedVolatility,
          fiftyTwoWeekLow: analysis.fiftyTwoWeekLow,
          fiftyTwoWeekHigh: analysis.fiftyTwoWeekHigh,
          error: null,
        };
      } catch (err) {
        return {
          symbol,
          error: err.message,
        };
      }
    })
  );
  // Results are available in the 'results' array for further processing or assertions
})();
