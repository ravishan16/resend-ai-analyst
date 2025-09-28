import { getEarningsOpportunities, getMarketContext } from './finnhub.js';
import { getVolatilityAnalysis, getBulkVolatilityAnalysis, calculateVolatilityScore } from './polygon.js';
import { generateTradingIdeas, validateAnalysis } from './gemini.js';
import { sendEmailDigest, previewEmailTemplate } from './email.js';

async function main() {
    const [,, command, ...args] = process.argv;

    try {
        switch (command) {
            case 'finnhub':
                await testFinnhub();
                break;
            case 'polygon':
                await testPolygon();
                break;
            case 'volatility':
                await testVolatilityAnalysis();
                break;
            case 'gemini':
                await testGemini();
                break;
            case 'email':
                await testEmail();
                break;
            case 'scoring':
                await testScoring();
                break;
            case 'pipeline':
                await testPipeline();
                break;
            case 'full-run':
                await testFullRun();
                break;
            case 'preview-email':
                await previewEmail();
                break;
            case 'test-stock':
                await testSpecificStock();
                break;
            case 'validate-keys':
                await validateApiKeys();
                break;
            default:
                console.log('🔧 AI Stock Analyst CLI');
                console.log('');
                console.log('Usage: node src/cli.js <command>');
                console.log('');
                console.log('Commands:');
                console.log('  finnhub        - Test earnings data fetching');
                console.log('  polygon        - Test options & volatility data');
                console.log('  volatility     - Test volatility analysis pipeline');
                console.log('  gemini         - Test AI analysis');
                console.log('  email          - Test email delivery');
                console.log('  scoring        - Test opportunity scoring');
                console.log('  pipeline       - Test complete data pipeline');
                console.log('  full-run       - Simulate complete daily run');
                console.log('  preview-email  - Preview email template');
                console.log('  test-stock     - Test specific stock (set SYMBOL env var)');
                console.log('  validate-keys  - Validate all API keys');
        }
    } catch (error) {
        console.error('❌ Error:', error.message);
        process.exit(1);
    }
}

async function testFinnhub() {
    console.log('📊 Testing Finnhub integration...');
    const finnhubApiKey = process.env.FINNHUB_API_KEY;
    const polygonApiKey = process.env.POLYGON_API_KEY;
    
    if (!finnhubApiKey) {
        throw new Error('FINNHUB_API_KEY environment variable is not set');
    }
    
    const opportunities = await getEarningsOpportunities(finnhubApiKey, polygonApiKey);
    console.log(`✅ Found ${opportunities.length} earnings opportunities`);
    
    opportunities.forEach(opp => {
        console.log(`  📈 ${opp.symbol} - ${opp.date} (Quality: ${opp.qualityScore}/100)`);
    });
}

async function testPolygon() {
    console.log('📈 Testing Polygon.io integration...');
    const polygonApiKey = process.env.POLYGON_API_KEY;
    
    if (!polygonApiKey) {
        throw new Error('POLYGON_API_KEY environment variable is not set');
    }
    
    const testSymbols = ['AAPL', 'MSFT', 'GOOGL'];
    console.log(`Testing volatility analysis for: ${testSymbols.join(', ')}`);
    
    const results = await getBulkVolatilityAnalysis(testSymbols, polygonApiKey);
    const successfulResults = Object.entries(results).filter(([symbol, data]) => data !== null);
    console.log(`✅ Successfully analyzed ${successfulResults.length} symbols`);
    
    successfulResults.forEach(([symbol, result]) => {
        const score = calculateVolatilityScore(result);
        console.log(`  📊 ${symbol}:`);
        console.log(`     Current Price: $${result.currentPrice?.toFixed(2) || 'N/A'}`);
        console.log(`     IV: ${result.impliedVolatility?.toFixed(1) || 'N/A'}%`);
        console.log(`     HV (30d): ${result.historicalVolatility30d?.toFixed(1) || 'N/A'}%`);
        console.log(`     Volatility Score: ${score}/100`);
    });
}

async function testVolatilityAnalysis() {
    console.log('📊 Testing volatility analysis pipeline...');
    const polygonApiKey = process.env.POLYGON_API_KEY;
    
    if (!polygonApiKey) {
        throw new Error('POLYGON_API_KEY environment variable is not set');
    }
    
    const symbol = process.env.SYMBOL || 'AAPL';
    console.log(`Analyzing volatility for ${symbol}...`);
    
    const result = await getVolatilityAnalysis(symbol, polygonApiKey);
    
    if (result) {
        console.log('✅ Volatility Analysis Results:');
        console.log(`  Symbol: ${result.symbol}`);
        console.log(`  Current Price: $${result.currentPrice?.toFixed(2)}`);
        console.log(`  Historical Vol (30d): ${result.historicalVolatility30d?.toFixed(1)}%`);
        console.log(`  Implied Vol: ${result.impliedVolatility?.toFixed(1) || 'N/A'}%`);
        console.log(`  Expected Move: $${result.expectedMove?.toFixed(2) || 'N/A'}`);
        console.log(`  Options Volume: ${result.optionsVolume?.toLocaleString()}`);
        console.log(`  RSI: ${result.technicalIndicators?.rsi?.toFixed(1) || 'N/A'}`);
        
        const score = calculateVolatilityScore(result);
        console.log(`  Overall Score: ${score}/100`);
    } else {
        console.log('❌ No volatility data available');
    }
}

async function testGemini() {
    console.log('🤖 Testing Gemini AI analysis...');
    const geminiApiKey = process.env.GEMINI_API_KEY;
    
    if (!geminiApiKey) {
        throw new Error('GEMINI_API_KEY environment variable is not set');
    }
    
    // Create mock opportunity data
    const mockOpportunities = [{
        symbol: 'AAPL',
        date: '2025-10-28',
        daysToEarnings: 15,
        qualityScore: 75,
        volatilityData: {
            currentPrice: 150.25,
            impliedVolatility: 35.5,
            historicalVolatility30d: 28.3,
            expectedMove: 8.75,
            optionsVolume: 15000,
            technicalIndicators: { rsi: 68.5 }
        }
    }];
    
    const mockMarketContext = {
        vix: 18.5,
        marketRegime: 'normal'
    };
    
    console.log('Generating AI analysis...');
    const analyses = await generateTradingIdeas(geminiApiKey, mockOpportunities, mockMarketContext);
    
    console.log(`✅ Generated ${analyses.length} analyses`);
    
    analyses.forEach(item => {
        const analysis = item.analysis;
        console.log(`  📊 ${item.opportunity.symbol}:`);
        console.log(`     Sentiment Score: ${analysis.sentimentScore || 'N/A'}/10`);
        console.log(`     Recommendation: ${analysis.recommendation}`);
        console.log(`     Strategies: ${analysis.strategies?.length || 0}`);
        
        const validation = validateAnalysis(analysis);
        if (validation.isValid) {
            console.log(`     ✅ Analysis passed validation`);
        } else {
            console.log(`     ❌ Validation issues: ${validation.issues.join(', ')}`);
        }
    });
}

async function testEmail() {
    console.log('📧 Testing email template and delivery...');
    const resendApiKey = process.env.RESEND_API_KEY;
    const geminiApiKey = process.env.GEMINI_API_KEY;
    
    if (!resendApiKey || !geminiApiKey) {
        throw new Error('RESEND_API_KEY or GEMINI_API_KEY environment variable is not set');
    }
    
    // Use mock data for testing
    const mockContent = [{
        opportunity: {
            symbol: 'AAPL',
            date: '2025-10-28',
            daysToEarnings: 15,
            qualityScore: 85,
            volatilityData: {
                currentPrice: 150.25,
                impliedVolatility: 35.5,
                historicalVolatility30d: 28.3,
                expectedMove: 8.75,
                optionsVolume: 15000,
                technicalIndicators: { rsi: 68.5, atr: 2.15 }
            }
        },
        analysis: {
            sentimentScore: 8,
            recommendation: 'STRONGLY CONSIDER',
            strategies: [
                { name: 'Iron Condor', details: 'Sell 145/150/155/160 Iron Condor for $2.50 credit...' },
                { name: 'Bull Put Spread', details: 'Sell 140/145 Put Spread for $1.25 credit...' }
            ],
            riskFactors: 'High IV environment may lead to volatility crush post-earnings.'
        }
    }];
    
    const mockMarketContext = {
        vix: 18.5,
        marketRegime: 'normal'
    };
    
    console.log('Sending test email...');
    const result = await sendEmailDigest(resendApiKey, mockContent, mockMarketContext);
    console.log(`✅ Email sent successfully - Broadcast ID: ${result.broadcastId}`);
}

async function testScoring() {
    console.log('🎯 Testing opportunity scoring algorithm...');
    
    // Mock volatility data for scoring test
    const mockVolatilityData = [
        { symbol: 'AAPL', impliedVolatility: 35, historicalVolatility30d: 28, optionsVolume: 15000, technicalIndicators: { rsi: 68 } },
        { symbol: 'MSFT', impliedVolatility: 25, historicalVolatility30d: 22, optionsVolume: 8000, technicalIndicators: { rsi: 45 } },
        { symbol: 'TSLA', impliedVolatility: 55, historicalVolatility30d: 65, optionsVolume: 25000, technicalIndicators: { rsi: 75 } }
    ];
    
    console.log('Calculating volatility scores...');
    mockVolatilityData.forEach(data => {
        const score = calculateVolatilityScore(data);
        console.log(`  📊 ${data.symbol}: ${score}/100`);
        console.log(`     IV: ${data.impliedVolatility}% | HV: ${data.historicalVolatility30d}% | Volume: ${data.optionsVolume.toLocaleString()}`);
    });
    
    console.log('✅ Scoring algorithm test completed');
}

async function testPipeline() {
    console.log('🔄 Testing complete data pipeline...');
    const finnhubApiKey = process.env.FINNHUB_API_KEY;
    const polygonApiKey = process.env.POLYGON_API_KEY;
    
    if (!finnhubApiKey || !polygonApiKey) {
        throw new Error('FINNHUB_API_KEY or POLYGON_API_KEY environment variable is not set');
    }
    
    console.log('1. Fetching earnings opportunities...');
    const opportunities = await getEarningsOpportunities(finnhubApiKey, polygonApiKey);
    console.log(`   Found ${opportunities.length} opportunities`);
    
    console.log('2. Getting market context...');
    const marketContext = await getMarketContext(finnhubApiKey);
    console.log(`   VIX: ${marketContext.vix} | Regime: ${marketContext.marketRegime}`);
    
    console.log('✅ Data pipeline test completed');
}

async function testFullRun() {
    console.log('🎯 Simulating complete daily run...');
    
    const { FINNHUB_API_KEY, POLYGON_API_KEY, GEMINI_API_KEY, RESEND_API_KEY } = process.env;
    
    if (!FINNHUB_API_KEY || !POLYGON_API_KEY || !GEMINI_API_KEY || !RESEND_API_KEY) {
        throw new Error('Missing required API keys');
    }
    
    try {
        console.log('1. 📊 Scanning earnings opportunities...');
        const opportunities = await getEarningsOpportunities(FINNHUB_API_KEY, POLYGON_API_KEY);
        console.log(`   ✅ Found ${opportunities.length} qualified opportunities`);
        
        if (opportunities.length === 0) {
            console.log('   ℹ️  No opportunities found - newsletter will not be sent');
            return;
        }
        
        console.log('2. 🌍 Getting market context...');
        const marketContext = await getMarketContext(FINNHUB_API_KEY);
        console.log(`   ✅ VIX: ${marketContext.vix?.toFixed(1)} | Regime: ${marketContext.marketRegime}`);
        
        console.log('3. 🤖 Generating AI analysis...');
        const emailContent = await generateTradingIdeas(GEMINI_API_KEY, opportunities, marketContext);
        console.log(`   ✅ Generated ${emailContent.length} analyses`);
        
        console.log('4. 📧 Sending newsletter...');
        const result = await sendEmailDigest(RESEND_API_KEY, emailContent, marketContext);
        console.log(`   ✅ Newsletter sent - Broadcast ID: ${result.broadcastId}`);
        
        console.log('\n🎉 Full run completed successfully!');
        
    } catch (error) {
        console.error('❌ Full run failed:', error.message);
        throw error;
    }
}

async function previewEmail() {
    console.log('👀 Generating email preview...');
    
    // Mock data for preview
    const mockContent = [{
        opportunity: {
            symbol: 'AAPL',
            date: '2025-10-28',
            daysToEarnings: 15,
            qualityScore: 85,
            volatilityData: {
                currentPrice: 150.25,
                impliedVolatility: 35.5,
                historicalVolatility30d: 28.3,
                expectedMove: 8.75,
                optionsVolume: 15000,
                technicalIndicators: { rsi: 68.5, atr: 2.15 }
            }
        },
        analysis: {
            sentimentScore: 8,
            recommendation: 'STRONGLY CONSIDER',
            strategies: [
                { name: 'Iron Condor', details: 'Sell 145/150/155/160 Iron Condor for $2.50 credit targeting 20% profit in 10-14 days' }
            ],
            riskFactors: 'High IV environment may lead to volatility crush post-earnings'
        }
    }, {
        opportunity: {
            symbol: 'TSLA',
            date: '2025-10-30',
            daysToEarnings: 17,
            qualityScore: 72,
            volatilityData: {
                currentPrice: 245.80,
                impliedVolatility: 45.2,
                historicalVolatility30d: 52.1,
                expectedMove: 15.30,
                optionsVolume: 28500,
                technicalIndicators: { rsi: 75.2, atr: 8.65 }
            }
        },
        analysis: {
            sentimentScore: 6,
            recommendation: 'CONSIDER',
            strategies: [
                { name: 'Bull Put Spread', details: 'Sell 230/235 Put Spread for $1.75 credit with 65% win rate' },
                { name: 'Short Strangle', details: 'Sell 225 Put / 265 Call for $4.20 credit targeting IV contraction' }
            ],
            riskFactors: 'High volatility stock with unpredictable earnings reactions'
        }
    }];
    
    const mockMarketContext = { vix: 18.5, marketRegime: 'normal' };
    
    const htmlContent = previewEmailTemplate(mockContent, mockMarketContext);
    
    // Save preview to file
    const fs = await import('fs');
    const previewPath = './email-preview.html';
    fs.writeFileSync(previewPath, htmlContent);
    
    console.log(`✅ Email preview saved to: ${previewPath}`);
    console.log('   Open this file in your browser to see the email template');
}

async function testSpecificStock() {
    const symbol = process.env.SYMBOL;
    if (!symbol) {
        throw new Error('SYMBOL environment variable is required');
    }
    
    console.log(`📊 Testing analysis for ${symbol}...`);
    const polygonApiKey = process.env.POLYGON_API_KEY;
    
    if (!polygonApiKey) {
        throw new Error('POLYGON_API_KEY environment variable is not set');
    }
    
    const result = await getVolatilityAnalysis(symbol, polygonApiKey);
    
    if (result) {
        const score = calculateVolatilityScore(result);
        console.log(`✅ Analysis for ${symbol}:`);
        console.log(`  Price: $${result.currentPrice?.toFixed(2)}`);
        console.log(`  IV: ${result.impliedVolatility?.toFixed(1)}%`);
        console.log(`  HV: ${result.historicalVolatility30d?.toFixed(1)}%`);
        console.log(`  Score: ${score}/100`);
    } else {
        console.log(`❌ No data available for ${symbol}`);
    }
}

async function validateApiKeys() {
    console.log('🔑 Validating API keys...');
    
    const keys = [
        { name: 'FINNHUB_API_KEY', value: process.env.FINNHUB_API_KEY },
        { name: 'POLYGON_API_KEY', value: process.env.POLYGON_API_KEY },
        { name: 'GEMINI_API_KEY', value: process.env.GEMINI_API_KEY },
        { name: 'RESEND_API_KEY', value: process.env.RESEND_API_KEY }
    ];
    
    keys.forEach(key => {
        if (key.value) {
            console.log(`  ✅ ${key.name}: Present (${key.value.length} chars)`);
        } else {
            console.log(`  ❌ ${key.name}: Missing`);
        }
    });
    
    console.log('\n🔍 Testing API connectivity...');
    
    // Test Finnhub
    if (process.env.FINNHUB_API_KEY) {
        try {
            const response = await fetch(`https://finnhub.io/api/v1/quote?symbol=AAPL&token=${process.env.FINNHUB_API_KEY}`);
            if (response.ok) {
                console.log('  ✅ Finnhub API: Working');
            } else {
                console.log('  ❌ Finnhub API: Error');
            }
        } catch (error) {
            console.log('  ❌ Finnhub API: Connection failed');
        }
    }
    
    console.log('✅ API key validation completed');
}

main().catch(console.error);
