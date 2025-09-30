/**
 * Real volatility data integration using simplified multi-source approach
 * Primary: Yahoo Finance (free, reliable, complete data)
 * Fallback: Finnhub (free quotes)
 * Final: Estimated data
 */

import AlphaVantageAPI from './alphavantage.js';
import SimplifiedDataProvider from './simplified-data.js';

class RealVolatilityData {
    constructor() {
        this.alphaVantage = null; // Legacy Alpha Vantage API (fallback)
        this.dataProvider = null; // New simplified provider
        this.initialized = false;
        this.alphaVantageApiKey = null;
        this.finnhubApiKey = null;
    }

    /**
     * Initialize the data providers
     */
    async initialize(alphaVantageApiKey = null, finnhubApiKey = null) {
        // Store API keys
        this.alphaVantageApiKey = alphaVantageApiKey || process.env.ALPHA_VANTAGE_API_KEY;
        this.finnhubApiKey = finnhubApiKey || process.env.FINNHUB_API_KEY;
        
        console.log('🔄 Initializing simplified data provider...');
        
        // Initialize simplified provider (primary) with optimized Yahoo Finance settings
        this.dataProvider = new SimplifiedDataProvider({
            finnhubApiKey: this.finnhubApiKey,
            requestDelay: 600 // Reduced delay for Yahoo Finance's liberal rate limits
        });

        // Legacy Alpha Vantage for compatibility (final fallback)
        if (this.alphaVantageApiKey && this.alphaVantageApiKey !== 'your_alpha_vantage_api_key_here') {
            this.alphaVantage = new AlphaVantageAPI(this.alphaVantageApiKey);
            console.log('✅ Alpha Vantage API initialized (final fallback)');
        } else {
            console.log('⚠️  Alpha Vantage API key not available');
        }
        
        this.initialized = true;
        console.log('✅ Simplified data provider initialized');
        return true;
    }

    /**
     * Get volatility analysis for a single symbol (simplified)
     */
    async getVolatilityAnalysis(symbol) {
        if (!this.initialized) {
            throw new Error('RealVolatilityData not initialized');
        }

        try {
            // Try simplified provider first (Yahoo + Finnhub)
            const analysis = await this.dataProvider.getVolatilityAnalysis(symbol);
            if (analysis) {
                return analysis;
            }
        } catch (error) {
            console.warn(`⚠️ Simplified provider failed for ${symbol}:`, error.message);
        }

        // Fallback to legacy Alpha Vantage (if available)
        if (this.alphaVantage) {
            try {
                console.log(`🔄 Falling back to Alpha Vantage for ${symbol}...`);
                const analysis = await this.alphaVantage.getVolatilityAnalysis(symbol);
                if (analysis) return analysis;
            } catch (error) {
                console.warn(`⚠️ Alpha Vantage fallback failed for ${symbol}:`, error.message);
            }
        }

        // Final fallback: return null instead of mock data when providers fail
        return null;
    }

    /**
     * Get volatility analysis for multiple symbols (simplified)
     */
    async getBulkVolatilityAnalysis(symbols) {
        if (!this.initialized) {
            console.warn('⚠️ Data providers not initialized, using mock data');
            return this.getMockBulkData(symbols);
        }

        try {
            // Use simplified provider for bulk analysis
            console.log(`📊 Using simplified provider for ${symbols.length} symbols...`);
            const results = await this.dataProvider.getBulkVolatilityAnalysis(symbols);
            
            // Handle null/undefined results
            if (!results || typeof results !== 'object') {
                return {};
            }
            
            // Check for any failed symbols and retry with Alpha Vantage if available
            const failedSymbols = Object.entries(results)
                .filter(([symbol, data]) => data === null)
                .map(([symbol]) => symbol);
            
            if (failedSymbols.length > 0 && this.alphaVantage) {
                console.log(`🔄 Retrying ${failedSymbols.length} failed symbols with Alpha Vantage...`);
                
                for (const symbol of failedSymbols) {
                    try {
                        const analysis = await this.alphaVantage.getVolatilityAnalysis(symbol);
                        if (analysis) {
                            results[symbol] = analysis;
                        } else {
                            results[symbol] = this.getMockVolatilityData(symbol);
                        }
                        
                        // Rate limiting for Alpha Vantage
                        if (failedSymbols.indexOf(symbol) < failedSymbols.length - 1) {
                            await new Promise(resolve => setTimeout(resolve, 15000));
                        }
                    } catch (error) {
                        console.warn(`⚠️ Alpha Vantage retry failed for ${symbol}:`, error.message);
                        results[symbol] = this.getMockVolatilityData(symbol);
                    }
                }
            } else if (failedSymbols.length > 0) {
                // Fill remaining failures with mock data
                failedSymbols.forEach(symbol => {
                    results[symbol] = this.getMockVolatilityData(symbol);
                });
            }
            
            return results;
            
        } catch (error) {
            console.error('❌ Error in simplified bulk analysis:', error);
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
export async function initializeRealData(alphaVantageApiKey = null, finnhubApiKey = null) {
    return await realVolatilityData.initialize(alphaVantageApiKey, finnhubApiKey);
}

/**
 * Get volatility analysis for a single symbol (compatible interface)
 */
export async function getVolatilityAnalysis(symbol, alphaVantageApiKey = null, finnhubApiKey = null) {
    // If API keys are provided and not initialized yet, initialize now
    if ((alphaVantageApiKey || finnhubApiKey) && !realVolatilityData.initialized) {
        await realVolatilityData.initialize(alphaVantageApiKey, finnhubApiKey);
    }
    
    return await realVolatilityData.getVolatilityAnalysis(symbol);
}

/**
 * Get volatility analysis for multiple symbols (compatible interface)
 */
export async function getBulkVolatilityAnalysis(symbols, alphaVantageApiKey = null, finnhubApiKey = null) {
    // If API keys are provided and not initialized yet, initialize now
    if ((alphaVantageApiKey || finnhubApiKey) && !realVolatilityData.initialized) {
        await realVolatilityData.initialize(alphaVantageApiKey, finnhubApiKey);
    }
    
    return await realVolatilityData.getBulkVolatilityAnalysis(symbols);
}

/**
 * Calculate volatility score from real data
 */
export function calculateVolatilityScore(volatilityData) {
    if (!volatilityData) {
        return 0;
    }

    const ivPercentile = volatilityData.impliedVolatilityPercentile || 50;
    const ivRank = volatilityData.impliedVolatilityRank || 0;
    const liquidity = volatilityData.optionsVolume || 0;
    
    return (ivPercentile * 0.4) + (ivRank * 0.4) + (Math.min(liquidity / 10000, 10) * 0.2);
}

// Export both the class and the function
export default RealVolatilityData;