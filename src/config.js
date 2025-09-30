// Expanded representative universe covering many missing names from S&P 500 + NASDAQ 100
// Updated STOCK_UNIVERSE_RAW: Comprehensive list of relevant tickers
const STOCK_UNIVERSE_RAW = [
  // Core / Mega Tech
  'AAPL', 'MSFT', 'GOOGL', 'GOOG', 'AMZN', 'NVDA', 'META', 'TSLA', 'ADBE', 'NFLX',

  // Financials / Big Banks / Services
  'BRK-B', 'JPM', 'GS', 'MS', 'C', 'BAC', 'WFC', 'BLK', 'AXP', 'ICE', 'SCHW', 'COF',

  // Healthcare / Biotech / Pharma
  'UNH', 'JNJ', 'PFE', 'LLY', 'MRK', 'ABT', 'MDT', 'BIIB', 'GILD', 'AMGN', 'REGN', 'ISRG',

  // Consumer / Staples / Discretionary
  'V', 'MA', 'HD', 'DIS', 'MCD', 'COST', 'NKE', 'KO', 'PEP', 'PG', 'SBUX', 'TGT', 'LOW', 'LULU',

  // Semiconductors / Hardware / Equipment
  'CSCO', 'INTC', 'QCOM', 'TXN', 'AMD', 'AMAT', 'ASML', 'ADI', 'LRCX', 'KLAC', 'MU', 'NXPI',

  // Enterprise & Software / Cloud / SaaS
  'INTU', 'CRM', 'ORCL', 'NOW', 'SNYS', 'WORK', 'ADSK', 'PYPL', 'ZM', 'DOCU', 'OKTA',

  // Communications / Telecom / Media
  'VZ', 'T', 'TMUS', 'CMCSA', 'CHTR', 'DISCA', 'DISCK', 'CMG',

  // Industrials / Transportation / Infrastructure
  'XOM', 'CVX', 'COP', 'SLB', 'CAT', 'BA', 'HON', 'GE', 'UNP', 'UPS', 'DE', 'RTX',

  // Growth / Newer Economy / Disruptors (non-meme)
  'UBER', 'LYFT', 'SHOP', 'SNAP', 'ETSY', 'ROKU', 'SPOT', 'TWLO', 'SNOW', 'PLTR', 'COIN', 'RBLX', 'SOFI', 'PTON', 'ARM',

  // Additional NASDAQ 100 Components
  'AMGN', 'ASML', 'ATVI', 'CDNS', 'DXCM', 'EBAY', 'EXC', 'MAR', 'MELI', 'MNST', 'MRNA', 'OKTA', 'PYPL', 'REGN', 'SIRI', 'TTWO', 'VRTX', 'ZTS',

  // Notable Tech Companies Outside S&P 500 / NASDAQ 100
  'TSM', 'BIDU', 'JD', 'PDD', 'BABA', 'SHOP', 'SQ', 'RBLX', 'PLTR', 'SNAP', 'ETSY', 'COIN', 'SOFI', 'PTON', 'ARM'
];

// Remove duplicates and export the clean stock universe
export const STOCK_UNIVERSE = [...new Set(STOCK_UNIVERSE_RAW)];

// Quality thresholds for filtering opportunities
export const QUALITY_THRESHOLDS = {
  minVolatilityScore: 20,
  minDaysToEarnings: 1,
  maxDaysToEarnings: 45
};

// Volatility analysis thresholds
export const VOLATILITY_THRESHOLDS = {
  minImpliedVolatility: 15,
  maxImpliedVolatility: 200,
  minHistoricalVolatility: 10,
  maxHistoricalVolatility: 150
};

/**
 * Check if a symbol is in the curated stock universe
 * @param {string} symbol - Stock symbol to check
 * @returns {boolean} True if symbol is in the approved universe
 * @description Validates symbols against the curated list of liquid S&P 500 and 
 * NASDAQ 100 stocks. Only universe stocks receive full analysis to ensure data
 * quality and options liquidity.
 */
export function isInStockUniverse(symbol) {
  if (typeof symbol !== 'string') return false;
  return STOCK_UNIVERSE.includes(symbol);
}

/**
 * Get a quality threshold value for filtering
 * @param {string} key - Threshold key name
 * @returns {number|undefined} Threshold value or undefined if key not found
 * @description Retrieves quality score thresholds used throughout the pipeline
 * for filtering opportunities and maintaining newsletter standards.
 */
export function getQualityThreshold(key) {
  return QUALITY_THRESHOLDS[key];
}

/**
 * Get a volatility threshold value for analysis
 * @param {string} key - Threshold key name  
 * @returns {number|undefined} Threshold value or undefined if key not found
 * @description Retrieves volatility thresholds used in opportunity scoring
 * and market regime classification.
 */
export function getVolatilityThreshold(key) {
  return VOLATILITY_THRESHOLDS[key];
}