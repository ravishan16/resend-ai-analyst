import { getEarningsOpportunities, getMarketContext } from './finnhub.js';
import { generateTradingIdeas, validateAnalysis } from './gemini.js';
import { sendEmailDigest, sendRunSummaryEmail } from './email.js';
import { initializeRealData } from './real-volatility.js';

export default {
    async scheduled(controller, env, ctx) {
        console.log("🎯 Running Options Insight Research Agent...");
        let summary;

        try {
            summary = await processAndSendDigest(env);
        } catch (error) {
            console.error("❌ Options Insight failed to run:", error);
            summary = buildEmergencySummary(error);
        }

        await deliverRunSummary(env, summary);

        if (!summary.success) {
            console.warn("⚠️  Research agent completed with issues – see summary for details");
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
            const expectedSecret = env.TRIGGER_AUTH_SECRET || env.TRIGGER_AUTH_TOKEN;
            if (!expectedSecret) {
                console.warn('⚠️  Manual trigger blocked: TRIGGER_AUTH_SECRET not configured');
                return new Response(JSON.stringify({
                    success: false,
                    error: 'Manual trigger disabled: missing TRIGGER_AUTH_SECRET',
                    timestamp: new Date().toISOString()
                }), {
                    headers: { 'Content-Type': 'application/json' },
                    status: 503
                });
            }

            const providedSecret = request.headers.get('x-trigger-secret') || url.searchParams.get('token');
            if (!providedSecret || !timingSafeEqual(providedSecret, expectedSecret)) {
                console.warn('⚠️  Unauthorized manual trigger attempt');
                return new Response(JSON.stringify({
                    success: false,
                    error: 'Unauthorized',
                    timestamp: new Date().toISOString()
                }), {
                    headers: { 'Content-Type': 'application/json' },
                    status: 401
                });
            }

            let summary;

            try {
                summary = await processAndSendDigest(env);
            } catch (error) {
                console.error('❌ Manual trigger failed:', error);
                summary = buildEmergencySummary(error);
            }

            await deliverRunSummary(env, summary);

            return new Response(JSON.stringify({
                success: summary.success,
                summary,
                timestamp: new Date().toISOString()
            }), {
                headers: { 'Content-Type': 'application/json' },
                status: summary.success ? 200 : 500
            });
        }

        // Default response
        return new Response('Options Insight Worker - Use /health, /status, or POST /trigger endpoints', {
            status: 404
        });
    }
};

async function processAndSendDigest(env) {
    const summary = createRunSummary();
    const startTime = Date.now();

    const beginStep = (name) => {
        summary._activeStep = name;
    };

    const completeStep = (status, detail) => {
        const name = summary._activeStep || 'Pipeline';
        summary.steps.push({ name, status, detail });
        summary._activeStep = null;
    };

    const failStep = (detail) => {
        const name = summary._activeStep || 'Pipeline';
        summary.steps.push({ name, status: 'failed', detail });
        summary._activeStep = null;
    };

    try {
        const { FINNHUB_API_KEY, ALPHA_VANTAGE_API_KEY, RESEND_API_KEY, GEMINI_API_KEY } = env;

        beginStep('Validate environment');
        const missingKeys = ['FINNHUB_API_KEY', 'RESEND_API_KEY', 'GEMINI_API_KEY'].filter(key => !env[key]);
        if (missingKeys.length > 0) {
            const message = `Missing required secrets: ${missingKeys.join(', ')}`;
            failStep(message);
            summary.errors.push(formatError(new Error(message)));
            return finalizeSummary(summary, startTime);
        }
        completeStep('success', 'All required secrets present');

        beginStep('Initialize Alpha Vantage');
        if (!ALPHA_VANTAGE_API_KEY) {
            console.warn("⚠️  No Alpha Vantage API key provided, using fallback data");
            completeStep('warning', 'No Alpha Vantage API key provided; using fallback data');
        } else {
            console.log("🔐 Initializing Alpha Vantage for market data...");
            try {
                const alphaVantageInit = await initializeRealData(ALPHA_VANTAGE_API_KEY);
                if (!alphaVantageInit) {
                    console.warn("⚠️  Alpha Vantage initialization failed, using fallback data");
                    completeStep('warning', 'Alpha Vantage initialization failed; using fallback data');
                } else {
                    console.log("✅ Alpha Vantage initialized successfully");
                    completeStep('success', 'Alpha Vantage initialized successfully');
                }
            } catch (error) {
                console.warn('⚠️  Alpha Vantage threw an error, using fallback data', error);
                completeStep('warning', `Alpha Vantage error: ${error.message}`);
            }
        }

        beginStep('Scan earnings opportunities');
        console.log("📊 Step 1: Scanning earnings opportunities...");
        const opportunities = await getEarningsOpportunities(FINNHUB_API_KEY, ALPHA_VANTAGE_API_KEY);
        summary.metrics.totalOpportunities = opportunities.length;
        completeStep('success', `${opportunities.length} opportunities analyzed`);

        if (opportunities.length === 0) {
            console.log("ℹ️  No qualifying earnings opportunities found today.");
            beginStep('Generate AI analysis');
            completeStep('skipped', 'No opportunities available');
            beginStep('Send newsletter');
            completeStep('skipped', 'No analyses to deliver');
            return finalizeSummary(summary, startTime);
        }

        console.log(`✅ Found ${opportunities.length} qualified opportunities`);

        beginStep('Fetch market context');
        console.log("🌍 Step 2: Getting market context...");
        const marketContext = await getMarketContext(FINNHUB_API_KEY);
        summary.metrics.vix = marketContext.vix;
        summary.metrics.marketRegime = marketContext.marketRegime;
        completeStep('success', `VIX ${marketContext.vix?.toFixed(1) ?? 'N/A'}, Regime: ${marketContext.marketRegime}`);
        console.log(`✅ Market context - VIX: ${marketContext.vix?.toFixed(1)}, Regime: ${marketContext.marketRegime}`);

        beginStep('Generate AI analysis');
        console.log("🤖 Step 3: Generating AI analysis...");
        const emailContent = await generateTradingIdeas(GEMINI_API_KEY, opportunities, marketContext);
        summary.metrics.generatedAnalyses = emailContent.length;
        completeStep('success', `Generated ${emailContent.length} analyses`);

        beginStep('Validate analyses');
        const validatedContent = emailContent.filter(item => {
            const validation = validateAnalysis(item.analysis);
            if (!validation.isValid) {
                console.warn(`⚠️  Filtering out ${item.opportunity.symbol} due to: ${validation.issues.join(', ')}`);
                return false;
            }
            return true;
        });
        const filteredCount = emailContent.length - validatedContent.length;
        summary.metrics.validatedAnalyses = validatedContent.length;
        if (filteredCount > 0) {
            completeStep('warning', `${validatedContent.length} passed, ${filteredCount} filtered out`);
        } else {
            completeStep('success', `${validatedContent.length} analyses passed validation`);
        }

        if (validatedContent.length === 0) {
            console.log("ℹ️  No analyses passed validation - newsletter will not be sent");
            beginStep('Send newsletter');
            completeStep('skipped', 'No validated analyses to send');
            return finalizeSummary(summary, startTime);
        }

        console.log(`✅ Generated ${validatedContent.length} validated analyses`);

        beginStep('Send newsletter');
        console.log("📧 Step 4: Sending newsletter...");
        const result = await sendEmailDigest(RESEND_API_KEY, validatedContent, marketContext);
        summary.metrics.newsletterSent = true;
        summary.metrics.broadcastId = result.broadcastId;
        summary.metrics.recipientCount = result.recipientCount;
        summary.metrics.completedAt = result.timestamp;
        completeStep('success', `Broadcast ${result.broadcastId} dispatched`);

        console.log(`🎉 Newsletter sent successfully!`);
        console.log(`   📊 Opportunities analyzed: ${opportunities.length}`);
        console.log(`   ✅ Analyses passed validation: ${validatedContent.length}`);
        console.log(`   📧 Broadcast ID: ${result.broadcastId}`);
        console.log(`   🕒 Completed at: ${result.timestamp}`);

        return finalizeSummary(summary, startTime);
    } catch (error) {
        console.error('❌ Pipeline failure:', error);
        failStep(error.message || 'Unknown pipeline failure');
        summary.errors.push(formatError(error));
        return finalizeSummary(summary, startTime);
    }
}

async function deliverRunSummary(env, summary) {
    const recipient = env.SUMMARY_EMAIL_RECIPIENT || env.STATUS_EMAIL_RECIPIENT || 'ravishankar.sivasubramaniam@gmail.com';

    if (!env.RESEND_API_KEY) {
        console.warn('⚠️  Skipping run summary email: RESEND_API_KEY not configured');
        return;
    }

    if (!recipient) {
        console.warn('⚠️  Skipping run summary email: no recipient configured');
        return;
    }

    try {
        await sendRunSummaryEmail(env.RESEND_API_KEY, summary, recipient, {
            from: env.SUMMARY_EMAIL_FROM || 'alerts@ravishankars.com'
        });
        console.log(`📬 Run summary email sent to ${recipient}`);
    } catch (error) {
        console.error('❌ Failed to send run summary email:', error);
    }
}

function createRunSummary() {
    return {
        success: false,
        startedAt: new Date().toISOString(),
        finishedAt: null,
        durationMs: null,
        steps: [],
        metrics: {
            newsletterSent: false
        },
        errors: [],
        _activeStep: null
    };
}

function finalizeSummary(summary, startTime) {
    summary.finishedAt = new Date().toISOString();
    summary.durationMs = Date.now() - startTime;
    summary.success = summary.errors.length === 0;
    delete summary._activeStep;
    return summary;
}

function buildEmergencySummary(error) {
    const summary = createRunSummary();
    summary.errors.push(formatError(error));
    summary.steps.push({ name: 'Pipeline', status: 'failed', detail: error.message || 'Unhandled failure' });
    return finalizeSummary(summary, Date.now());
}

function formatError(error) {
    return {
        message: error?.message || String(error),
        stack: typeof error?.stack === 'string' ? error.stack.split('\n').slice(0, 5).join('\n') : null
    };
}

function timingSafeEqual(a, b) {
    if (typeof a !== 'string' || typeof b !== 'string') {
        return false;
    }

    const length = Math.max(a.length, b.length);
    let result = a.length === b.length ? 0 : 1;

    for (let i = 0; i < length; i++) {
        const charCodeA = a.charCodeAt(i) || 0;
        const charCodeB = b.charCodeAt(i) || 0;
        result |= charCodeA ^ charCodeB;
    }

    return result === 0;
}