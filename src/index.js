import { getEarningsOpportunities, getMarketContext } from './finnhub.js';
import { generateTradingIdeas, validateAnalysis } from './gemini.js';
import { sendEmailDigest } from './email.js';

export default {
    async scheduled(controller, env, ctx) {
        console.log("🎯 Running Enhanced AI Stock Analyst Agent...");
        try {
            await processAndSendDigest(env);
        } catch (error) {
            console.error("❌ Agent failed to run:", error);
            // In production, you might want to send error notifications
        }
    },
};

async function processAndSendDigest(env) {
    const { FINNHUB_API_KEY, POLYGON_API_KEY, RESEND_API_KEY, GEMINI_API_KEY } = env;

    // Validate required API keys
    if (!FINNHUB_API_KEY || !POLYGON_API_KEY || !RESEND_API_KEY || !GEMINI_API_KEY) {
        throw new Error('Missing required API keys');
    }

    console.log("📊 Step 1: Scanning earnings opportunities...");
    const opportunities = await getEarningsOpportunities(FINNHUB_API_KEY, POLYGON_API_KEY);

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