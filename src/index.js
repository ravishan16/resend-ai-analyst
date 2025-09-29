import { getEarningsOpportunities, getMarketContext } from './finnhub.js';
import { generateTradingIdeas, validateAnalysis } from './gemini.js';
import { sendEmailDigest } from './email.js';
import { initializeRealData } from './real-volatility.js';

export default {
    async scheduled(controller, env, ctx) {
        console.log("🎯 Running Options Insight Research Agent...");
        try {
            await processAndSendDigest(env);
        } catch (error) {
            console.error("❌ Options Insight failed to run:", error);
            // In production, you might want to send error notifications
        }
    },

    async fetch(request, env, ctx) {
        const url = new URL(request.url);
        
        // Health check endpoint
        if (url.pathname === '/health') {
            return new Response(JSON.stringify({
                status: 'healthy',
                service: 'Options Insight',
                timestamp: new Date().toISOString(),
                version: '1.0.0'
            }), {
                headers: { 'Content-Type': 'application/json' },
                status: 200
            });
        }

        // API status endpoint - checks if required environment variables are present
        if (url.pathname === '/status') {
            const { FINNHUB_API_KEY, ALPHA_VANTAGE_API_KEY, RESEND_API_KEY, GEMINI_API_KEY } = env;
            
            const status = {
                service: 'Options Insight',
                timestamp: new Date().toISOString(),
                environment: {
                    FINNHUB_API_KEY: !!FINNHUB_API_KEY,
                    ALPHA_VANTAGE_API_KEY: !!ALPHA_VANTAGE_API_KEY, 
                    RESEND_API_KEY: !!RESEND_API_KEY,
                    GEMINI_API_KEY: !!GEMINI_API_KEY
                },
                ready: !!(FINNHUB_API_KEY && ALPHA_VANTAGE_API_KEY && RESEND_API_KEY && GEMINI_API_KEY)
            };

            return new Response(JSON.stringify(status, null, 2), {
                headers: { 'Content-Type': 'application/json' },
                status: status.ready ? 200 : 503
            });
        }

        // Manual trigger endpoint (for testing)
        if (url.pathname === '/trigger' && request.method === 'POST') {
            try {
                await processAndSendDigest(env);
                return new Response(JSON.stringify({
                    success: true,
                    message: 'Newsletter processing completed',
                    timestamp: new Date().toISOString()
                }), {
                    headers: { 'Content-Type': 'application/json' },
                    status: 200
                });
            } catch (error) {
                return new Response(JSON.stringify({
                    success: false,
                    error: error.message,
                    timestamp: new Date().toISOString()
                }), {
                    headers: { 'Content-Type': 'application/json' },
                    status: 500
                });
            }
        }

        // Default response
        return new Response('Options Insight Worker - Use /health, /status, or POST /trigger endpoints', {
            status: 404
        });
    }
};

async function processAndSendDigest(env) {
    const { FINNHUB_API_KEY, ALPHA_VANTAGE_API_KEY, RESEND_API_KEY, GEMINI_API_KEY } = env;

    // Validate required API keys
    if (!FINNHUB_API_KEY || !RESEND_API_KEY || !GEMINI_API_KEY) {
        throw new Error('Missing required API keys (FINNHUB_API_KEY, RESEND_API_KEY, GEMINI_API_KEY)');
    }

    // Initialize Alpha Vantage for real volatility data
    if (ALPHA_VANTAGE_API_KEY) {
        console.log("🔐 Initializing Alpha Vantage for market data...");
        const alphaVantageInit = await initializeRealData(ALPHA_VANTAGE_API_KEY);
        if (!alphaVantageInit) {
            console.warn("⚠️  Alpha Vantage initialization failed, using fallback data");
        } else {
            console.log("✅ Alpha Vantage initialized successfully");
        }
    } else {
        console.warn("⚠️  No Alpha Vantage API key provided, using fallback data");
    }

    console.log("📊 Step 1: Scanning earnings opportunities...");
    const opportunities = await getEarningsOpportunities(FINNHUB_API_KEY, ALPHA_VANTAGE_API_KEY);

    if (opportunities.length === 0) {
        console.log("ℹ️  No qualifying earnings opportunities found today.");
        return;
    }

    console.log(`✅ Found ${opportunities.length} qualified opportunities`);

    console.log("🌍 Step 2: Getting market context...");
    const marketContext = await getMarketContext(FINNHUB_API_KEY);
    console.log(`✅ Market context - VIX: ${marketContext.vix?.toFixed(1)}, Regime: ${marketContext.marketRegime}`);

    console.log("🤖 Step 3: Generating AI analysis...");
    const emailContent = await generateTradingIdeas(GEMINI_API_KEY, opportunities, marketContext);

    // Validate analyses and filter out poor quality ones
    const validatedContent = emailContent.filter(item => {
        const validation = validateAnalysis(item.analysis);
        if (!validation.isValid) {
            console.warn(`⚠️  Filtering out ${item.opportunity.symbol} due to: ${validation.issues.join(', ')}`);
            return false;
        }
        return true;
    });

    if (validatedContent.length === 0) {
        console.log("ℹ️  No analyses passed validation - newsletter will not be sent");
        return;
    }

    console.log(`✅ Generated ${validatedContent.length} validated analyses`);

    console.log("📧 Step 4: Sending newsletter...");
    const result = await sendEmailDigest(RESEND_API_KEY, validatedContent, marketContext);
    
    console.log(`🎉 Newsletter sent successfully!`);
    console.log(`   📊 Opportunities analyzed: ${opportunities.length}`);
    console.log(`   ✅ Analyses passed validation: ${validatedContent.length}`);
    console.log(`   📧 Broadcast ID: ${result.broadcastId}`);
    console.log(`   🕒 Completed at: ${result.timestamp}`);
}