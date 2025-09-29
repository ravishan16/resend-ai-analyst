#!/usr/bin/env node

/**
 * Alpha Vantage API Test Script
 */

import AlphaVantageAPI from './src/alphavantage.js';
import dotenv from 'dotenv';
dotenv.config();

async function testAlphaVantage() {
    console.log('🧪 Testing Alpha Vantage API Integration...\n');

    const apiKey = process.env.ALPHA_VANTAGE_API_KEY;
    
    console.log('📋 Environment Check:');
    console.log(`   API Key: ${apiKey ? '✅ Set' : '❌ Missing'}\n`);

    if (!apiKey || apiKey === 'your_alpha_vantage_api_key_here') {
        console.error('❌ Missing Alpha Vantage API key!');
        console.log('\n📝 To get a free API key:');
        console.log('1. Go to: https://www.alphavantage.co/support/#api-key');
        console.log('2. Fill out the form to get your free API key');
        console.log('3. Add it to your .env file as ALPHA_VANTAGE_API_KEY=your_key');
        console.log('\n💡 Free tier includes:');
        console.log('   • 25 API calls per day');
        console.log('   • Real-time and historical stock data');
        console.log('   • Technical indicators');
        console.log('   • Basic options data (premium required for full options chain)');
        return;
    }

    try {
        const alphaVantage = new AlphaVantageAPI();

        // Test 1: Get stock quote
        console.log('📊 Test 1: Stock Quote Data');
        const quote = await alphaVantage.getQuote('AAPL');
        if (quote) {
            console.log('   ✅ Success! Quote data received:');
            console.log(`      Symbol: ${quote.symbol}`);
            console.log(`      Price: $${quote.price}`);
            console.log(`      Change: ${quote.change} (${quote.changePercent})`);
            console.log(`      Volume: ${quote.volume.toLocaleString()}`);
            console.log(`      Last Updated: ${quote.lastUpdated}\n`);
        } else {
            console.log('   ❌ Failed to fetch quote data\n');
            return;
        }

        // Test 2: Historical volatility calculation
        console.log('📈 Test 2: Historical Volatility Analysis');
        const volatility = await alphaVantage.getHistoricalVolatility('AAPL');
        if (volatility !== null) {
            console.log('   ✅ Success! Historical volatility calculated:');
            console.log(`      60-day Historical Volatility: ${volatility.toFixed(1)}%\n`);
        } else {
            console.log('   ❌ Failed to calculate historical volatility\n');
        }

        // Test 3: Complete volatility analysis
        console.log('🎯 Test 3: Complete Volatility Analysis');
        const analysis = await alphaVantage.getVolatilityAnalysis('AAPL');
        if (analysis) {
            console.log('   ✅ Success! Complete analysis:');
            console.log(`      Current Price: $${analysis.currentPrice?.toFixed(2)}`);
            console.log(`      Historical Vol: ${analysis.historicalVolatility?.toFixed(1)}%`);
            console.log(`      Estimated IV: ${analysis.impliedVolatility?.toFixed(1)}%`);
            console.log(`      Expected Move: $${analysis.expectedMove?.toFixed(2)}`);
            console.log(`      Data Source: ${analysis.dataSource}`);
            console.log(`      Note: ${analysis.note}\n`);
        } else {
            console.log('   ❌ Failed to complete volatility analysis\n');
            return;
        }

        console.log('🎉 Alpha Vantage integration test completed successfully!');
        console.log('\n💡 Next steps:');
        console.log('1. This gives us real market data with estimated implied volatility');
        console.log('2. For real options chains and precise IV data, consider upgrading to premium ($50/month)');
        console.log('3. The free tier provides 25 API calls per day - perfect for testing');
        console.log('4. Historical volatility is calculated from 60 days of price data');
        
    } catch (error) {
        console.error('❌ Test failed:', error.message);
        console.log('\n🔍 Common issues:');
        console.log('1. Invalid API key');
        console.log('2. Rate limit exceeded (5 calls per minute on free tier)');
        console.log('3. Symbol not found');
    }
}

// Run test
testAlphaVantage();