/**
 * Real volatility data integration using Alpha Vantage API
 * Provides actual market data with calculated volatility metrics
 */

import AlphaVantageAPI from './alphavantage.js';

class RealVolatilityData {
    constructor() {
        this.alphaVantage = new AlphaVantageAPI();
        this.initialized = false;
    }

    /**
     * Initialize the Alpha Vantage API
     */
    async initialize() {
        // Check if API key is available
        if (!process.env.ALPHA_VANTAGE_API_KEY || process.env.ALPHA_VANTAGE_API_KEY === 'your_alpha_vantage_api_key_here') {
            console.error('❌ Alpha Vantage API key required');
            console.log('Get your free key at: https://www.alphavantage.co/support/#api-key');
            return false;
        }

        console.log('✅ Alpha Vantage API initialized');
        this.initialized = true;
        return true;
    }

    /**
     * Get real volatility analysis for a single symbol
     */
    async getVolatilityAnalysis(symbol) {
        if (!this.initialized) {
            console.warn('⚠️ Alpha Vantage not initialized, using mock data');
            return this.getMockVolatilityData(symbol);
        }

        try {
            const analysis = await this.alphaVantage.getVolatilityAnalysis(symbol);
            return analysis;
        } catch (error) {
            console.error(`❌ Error getting real volatility data for ${symbol}:`, error);
            // Fallback to mock data if API fails
            return this.getMockVolatilityData(symbol);
        }
    }

    /**
     * Get real volatility analysis for multiple symbols
     */
    async getBulkVolatilityAnalysis(symbols) {
        if (!this.initialized) {
            console.warn('⚠️ Alpha Vantage not initialized, using mock data');
            return this.getMockBulkData(symbols);
        }

        try {
            // For free tier, we need to be careful about rate limits
            console.log(`📊 Analyzing ${symbols.length} symbols with Alpha Vantage (rate-limited)...`);
            
            const results = {};
            for (const symbol of symbols) {
                try {
                    const analysis = await this.alphaVantage.getVolatilityAnalysis(symbol);
                    results[symbol] = analysis;
                    
                    // Rate limiting for free tier (5 calls per minute)
                    if (symbols.indexOf(symbol) < symbols.length - 1) {
                        console.log('⏳ Rate limit delay...');
                        await new Promise(resolve => setTimeout(resolve, 15000)); // 15 second delay
                    }
                } catch (error) {
                    console.error(`❌ Error analyzing ${symbol}:`, error);
                    results[symbol] = this.getMockVolatilityData(symbol);
                }
            }
            
            return results;
        } catch (error) {
            console.error('❌ Error in bulk analysis:', error);
            return this.getMockBulkData(symbols);
        }
    }

    /**
     * Mock data fallback for when API is unavailable
     */
    getMockVolatilityData(symbol) {
        const mockPrice = 150 + Math.random() * 100;
        const mockIV = 20 + Math.random() * 40;
        
        return {
            symbol: symbol,
            currentPrice: mockPrice,
            impliedVolatility: mockIV,
            historicalVolatility: mockIV * 0.8,
            ivRank: Math.random() * 100,
            expectedMove: mockPrice * (mockIV / 100) * Math.sqrt(30/365),
            optionsVolume: Math.floor(Math.random() * 10000),
            bidAskSpread: mockPrice * 0.001,
            technicalIndicators: {
                rsi: 30 + Math.random() * 40,
                atr: mockPrice * 0.02
            },
            lastUpdated: new Date().toISOString(),
            dataSource: 'Mock Data (Fallback)',
            note: 'This is simulated data for testing purposes'
        };
    }

    /**
     * Mock bulk data for testing
     */
    getMockBulkData(symbols) {
        const results = {};
        symbols.forEach(symbol => {
            results[symbol] = this.getMockVolatilityData(symbol);
        });
        return results;
    }
}

// Create singleton instance
const realVolatilityData = new RealVolatilityData();

/**
 * Initialize the real data service (call this once at startup)
 */
export async function initializeRealData() {
    return await realVolatilityData.initialize();
}

/**
 * Get volatility analysis for a single symbol (compatible interface)
 */
export async function getVolatilityAnalysis(symbol) {
    return await realVolatilityData.getVolatilityAnalysis(symbol);
}

/**
 * Get volatility analysis for multiple symbols (compatible interface)
 */
export async function getBulkVolatilityAnalysis(symbols) {
    return await realVolatilityData.getBulkVolatilityAnalysis(symbols);
}

/**
 * Calculate volatility score from real data
 */
export function calculateVolatilityScore(volatilityData) {
    if (!volatilityData) {
        return 0;
    }

    let score = 0;
    const weights = {
        impliedVolatility: 25,
        ivRank: 20,
        optionsVolume: 20,
        expectedMove: 20,
        bidAskSpread: 15
    };

    // Score based on implied volatility level
    if (volatilityData.impliedVolatility) {
        const iv = volatilityData.impliedVolatility;
        if (iv > 0.4) score += weights.impliedVolatility; // >40%
        else if (iv > 0.25) score += weights.impliedVolatility * 0.7; // >25%
        else if (iv > 0.15) score += weights.impliedVolatility * 0.4; // >15%
    }

    // Score based on IV rank (higher is better for selling strategies)
    if (volatilityData.ivRank) {
        if (volatilityData.ivRank > 70) score += weights.ivRank;
        else if (volatilityData.ivRank > 50) score += weights.ivRank * 0.7;
        else if (volatilityData.ivRank > 30) score += weights.ivRank * 0.4;
    }

    // Score based on options volume (liquidity)
    if (volatilityData.optionsVolume > 1000) score += weights.optionsVolume;
    else if (volatilityData.optionsVolume > 500) score += weights.optionsVolume * 0.7;
    else if (volatilityData.optionsVolume > 100) score += weights.optionsVolume * 0.4;

    // Score based on expected move magnitude
    if (volatilityData.expectedMove && volatilityData.currentPrice) {
        const expectedMovePercent = (volatilityData.expectedMove / volatilityData.currentPrice) * 100;
        if (expectedMovePercent > 8) score += weights.expectedMove;
        else if (expectedMovePercent > 5) score += weights.expectedMove * 0.7;
        else if (expectedMovePercent > 3) score += weights.expectedMove * 0.4;
    }

    // Score based on bid/ask spread (tighter is better)
    if (volatilityData.bidAskSpread && volatilityData.currentPrice) {
        const spreadPercent = (volatilityData.bidAskSpread / volatilityData.currentPrice) * 100;
        if (spreadPercent < 0.5) score += weights.bidAskSpread; // <0.5%
        else if (spreadPercent < 1.0) score += weights.bidAskSpread * 0.7; // <1.0%
        else if (spreadPercent < 2.0) score += weights.bidAskSpread * 0.4; // <2.0%
    }

    return Math.round(score);
}