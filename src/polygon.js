import { STOCK_UNIVERSE } from './config.js';

/**
 * Polygon.io API integration for options data, implied volatility, and market metrics
 */

/**
 * Rate limiting for Polygon.io free tier (5 calls per minute)
 */
class PolygonRateLimit {
    constructor() {
        this.calls = [];
        this.maxCalls = 5;
        this.windowMs = 60 * 1000; // 1 minute
    }

    async waitIfNeeded() {
        const now = Date.now();
        
        // Remove calls older than 1 minute
        this.calls = this.calls.filter(callTime => now - callTime < this.windowMs);
        
        // If we're at the limit, wait until we can make another call
        if (this.calls.length >= this.maxCalls) {
            const oldestCall = Math.min(...this.calls);
            const waitTime = this.windowMs - (now - oldestCall) + 100; // Extra 100ms buffer
            
            if (waitTime > 0) {
                console.log(`   ⏳ Rate limit: waiting ${Math.ceil(waitTime / 1000)}s (${this.calls.length}/${this.maxCalls} calls used)...`);
                await new Promise(resolve => setTimeout(resolve, waitTime));
            }
        }
        
        // Record this call
        this.calls.push(Date.now());
    }
}

const rateLimiter = new PolygonRateLimit();

/**
 * Fetch options chain data for a given stock symbol
 */
async function getOptionsChain(symbol, apiKey) {
    try {
        await rateLimiter.waitIfNeeded();
        
        const today = new Date();
        const thirtyDaysOut = new Date(today.getTime() + (30 * 24 * 60 * 60 * 1000));
        const expirationDate = thirtyDaysOut.toISOString().split('T')[0];
        
        const url = `https://api.polygon.io/v3/reference/options/contracts?underlying_ticker=${symbol}&expiration_date=${expirationDate}&limit=100&apikey=${apiKey}`;
        const response = await fetch(url);
        
        if (!response.ok) {
            if (response.status === 429) {
                console.warn(`   ⚠️  Rate limited for ${symbol}, skipping options data`);
                return null;
            }
            console.warn(`   ⚠️  Failed to fetch options chain for ${symbol}: ${response.statusText}`);
            return null;
        }
        
        const data = await response.json();
        return data.results || [];
    } catch (error) {
        console.error(`   ❌ Error fetching options chain for ${symbol}:`, error.message);
        return null;
    }
}

/**
 * Fetch historical volatility data
 */
async function getHistoricalVolatility(symbol, apiKey, days = 30) {
    try {
        await rateLimiter.waitIfNeeded();
        
        const endDate = new Date();
        const startDate = new Date(endDate.getTime() - (days * 24 * 60 * 60 * 1000));
        
        const url = `https://api.polygon.io/v2/aggs/ticker/${symbol}/range/1/day/${startDate.toISOString().split('T')[0]}/${endDate.toISOString().split('T')[0]}?adjusted=true&sort=asc&apikey=${apiKey}`;
        const response = await fetch(url);
        
        if (!response.ok) {
            if (response.status === 429) {
                console.warn(`   ⚠️  Rate limited for ${symbol}, skipping historical data`);
                return null;
            }
            console.warn(`   ⚠️  Failed to fetch historical data for ${symbol}: ${response.statusText}`);
            return null;
        }
        
        const data = await response.json();
        const prices = data.results || [];
        
        if (prices.length < 2) {
            return null;
        }

        // Calculate historical volatility (simplified)
        const returns = [];
        for (let i = 1; i < prices.length; i++) {
            const return_ = Math.log(prices[i].c / prices[i-1].c);
            returns.push(return_);
        }

        const avgReturn = returns.reduce((sum, ret) => sum + ret, 0) / returns.length;
        const variance = returns.reduce((sum, ret) => sum + Math.pow(ret - avgReturn, 2), 0) / (returns.length - 1);
        const volatility = Math.sqrt(variance * 252) * 100; // Annualized volatility

        return {
            historicalVolatility: volatility,
            priceData: prices,
            currentPrice: prices[prices.length - 1].c
        };
    } catch (error) {
        console.error(`   ❌ Error calculating historical volatility for ${symbol}:`, error.message);
        return null;
    }
}

/**
 * Calculate technical indicators
 */
function calculateTechnicalIndicators(priceData) {
    if (!priceData || priceData.length < 20) {
        return {
            rsi: null,
            bollingerPosition: null,
            atr: null
        };
    }

    // Simple RSI calculation (14-period)
    const rsiPeriod = 14;
    if (priceData.length >= rsiPeriod + 1) {
        const gains = [];
        const losses = [];
        
        for (let i = 1; i <= rsiPeriod; i++) {
            const change = priceData[priceData.length - i].c - priceData[priceData.length - i - 1].c;
            if (change > 0) {
                gains.push(change);
                losses.push(0);
            } else {
                gains.push(0);
                losses.push(Math.abs(change));
            }
        }
        
        const avgGain = gains.reduce((sum, gain) => sum + gain, 0) / rsiPeriod;
        const avgLoss = losses.reduce((sum, loss) => sum + loss, 0) / rsiPeriod;
        
        const rs = avgGain / (avgLoss || 0.001);
        const rsi = 100 - (100 / (1 + rs));
        
        return {
            rsi: rsi,
            bollingerPosition: null, // Simplified for now
            atr: null // Simplified for now
        };
    }

    return {
        rsi: null,
        bollingerPosition: null,
        atr: null
    };
}

/**
 * Calculate implied volatility metrics from options data
 */
function calculateVolatilityMetrics(optionsData, currentPrice) {
    if (!optionsData || optionsData.length === 0) {
        return {
            avgImpliedVolatility: null,
            ivPercentile: null,
            expectedMove: null,
            optionsVolume: 0
        };
    }

    // Calculate average implied volatility from at-the-money options
    const atmOptions = optionsData.filter(option => {
        const strike = parseFloat(option.strike_price);
        return Math.abs(strike - currentPrice) / currentPrice < 0.05; // Within 5% of current price
    });

    if (atmOptions.length === 0) {
        return {
            avgImpliedVolatility: null,
            ivPercentile: null,
            expectedMove: null,
            optionsVolume: optionsData.reduce((sum, opt) => sum + (opt.open_interest || 0), 0)
        };
    }

    // Calculate expected move (simplified approximation)
    const avgIV = atmOptions.reduce((sum, opt) => sum + (opt.implied_volatility || 0), 0) / atmOptions.length;
    const expectedMove = currentPrice * (avgIV / 100) * Math.sqrt(30/365); // Approximate 30-day expected move

    return {
        avgImpliedVolatility: avgIV,
        ivPercentile: null, // Would need historical IV data
        expectedMove: expectedMove,
        optionsVolume: optionsData.reduce((sum, opt) => sum + (opt.open_interest || 0), 0)
    };
}

/**
 * Main volatility analysis function
 */
async function getVolatilityAnalysis(symbol, apiKey) {
    try {
        console.log(`Fetching volatility analysis for ${symbol}...`);
        
        // Fetch options chain data
        const optionsData = await getOptionsChain(symbol, apiKey);
        
        // Fetch historical volatility data
        const historicalData = await getHistoricalVolatility(symbol, apiKey, 30);
        
        if (!historicalData) {
            console.warn(`No historical data available for ${symbol}`);
            return null;
        }

        // Calculate volatility metrics
        const volatilityMetrics = calculateVolatilityMetrics(optionsData, historicalData.currentPrice);
        
        // Calculate technical indicators
        const technicalIndicators = calculateTechnicalIndicators(historicalData.priceData);
        
        return {
            symbol: symbol,
            currentPrice: historicalData.currentPrice,
            historicalVolatility30d: historicalData.historicalVolatility,
            impliedVolatility: volatilityMetrics.avgImpliedVolatility,
            expectedMove: volatilityMetrics.expectedMove,
            optionsVolume: volatilityMetrics.optionsVolume,
            technicalIndicators: technicalIndicators,
            lastUpdated: new Date().toISOString()
        };
        
    } catch (error) {
        console.error(`Error in getVolatilityAnalysis for ${symbol}:`, error);
        return null;
    }
}

/**
 * Get volatility analysis for multiple symbols with rate limiting
 */
async function getBulkVolatilityAnalysis(symbols, apiKey) {
    console.log(`   📊 Analyzing volatility for ${symbols.length} symbols (respecting 5 calls/min limit)...`);
    
    const results = {};
    const batchSize = 1; // Process one symbol at a time to stay within limits
    
    for (let i = 0; i < symbols.length; i += batchSize) {
        const batch = symbols.slice(i, i + batchSize);
        console.log(`   📈 Processing batch ${Math.floor(i/batchSize) + 1}/${Math.ceil(symbols.length/batchSize)}: ${batch.join(', ')}`);
        
        const batchPromises = batch.map(async symbol => {
            try {
                // For each symbol, we need 2 API calls: options chain + historical data
                const analysis = await getVolatilityAnalysis(symbol, apiKey);
                return { symbol, analysis };
            } catch (error) {
                console.error(`   ❌ Error analyzing ${symbol}:`, error.message);
                return { symbol, analysis: null };
            }
        });
        
        const batchResults = await Promise.all(batchPromises);
        
        for (const { symbol, analysis } of batchResults) {
            results[symbol] = analysis;
        }
        
        // Add extra delay between batches if processing multiple symbols
        if (i + batchSize < symbols.length) {
            console.log(`   ⏳ Waiting 15 seconds between batches to respect rate limits...`);
            await new Promise(resolve => setTimeout(resolve, 15000));
        }
    }
    
    const successful = Object.values(results).filter(r => r !== null).length;
    console.log(`   ✅ Volatility analysis complete: ${successful}/${symbols.length} symbols analyzed`);
    
    return results;
}

/**
 * Calculate a composite volatility score for ranking opportunities
 */
function calculateVolatilityScore(volatilityData) {
    if (!volatilityData) {
        return 0;
    }

    let score = 0;
    const weights = {
        impliedVolatility: 25,
        historicalVolatility: 20,
        optionsVolume: 20,
        expectedMove: 20,
        rsi: 15
    };

    // Score based on implied volatility level
    if (volatilityData.impliedVolatility) {
        if (volatilityData.impliedVolatility > 40) score += weights.impliedVolatility;
        else if (volatilityData.impliedVolatility > 25) score += weights.impliedVolatility * 0.7;
        else if (volatilityData.impliedVolatility > 15) score += weights.impliedVolatility * 0.4;
    }

    // Score based on historical volatility
    if (volatilityData.historicalVolatility30d) {
        if (volatilityData.historicalVolatility30d > 35) score += weights.historicalVolatility;
        else if (volatilityData.historicalVolatility30d > 25) score += weights.historicalVolatility * 0.7;
        else if (volatilityData.historicalVolatility30d > 15) score += weights.historicalVolatility * 0.4;
    }

    // Score based on options volume (liquidity)
    if (volatilityData.optionsVolume > 10000) score += weights.optionsVolume;
    else if (volatilityData.optionsVolume > 5000) score += weights.optionsVolume * 0.7;
    else if (volatilityData.optionsVolume > 1000) score += weights.optionsVolume * 0.4;

    // Score based on expected move magnitude
    if (volatilityData.expectedMove && volatilityData.currentPrice) {
        const expectedMovePercent = (volatilityData.expectedMove / volatilityData.currentPrice) * 100;
        if (expectedMovePercent > 8) score += weights.expectedMove;
        else if (expectedMovePercent > 5) score += weights.expectedMove * 0.7;
        else if (expectedMovePercent > 3) score += weights.expectedMove * 0.4;
    }

    // Score based on RSI (looking for extremes)
    if (volatilityData.technicalIndicators?.rsi) {
        const rsi = volatilityData.technicalIndicators.rsi;
        if (rsi > 70 || rsi < 30) score += weights.rsi;
        else if (rsi > 60 || rsi < 40) score += weights.rsi * 0.5;
    }

    return Math.round(score);
}

// Export functions for use by other modules
export { 
    getVolatilityAnalysis, 
    getBulkVolatilityAnalysis, 
    calculateVolatilityScore 
};