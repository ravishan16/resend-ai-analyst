
import { Resend } from 'resend';

// A large, representative list of prominent stocks from the S&P 500 and NASDAQ 100.
const STOCK_UNIVERSE = [
    'AAPL', 'MSFT', 'GOOGL', 'AMZN', 'NVDA', 'META', 'TSLA', 'BRK-B', 'JPM', 'JNJ',
    'V', 'PG', 'MA', 'UNH', 'HD', 'DIS', 'BAC', 'PYPL', 'ADBE', 'NFLX',
    'CRM', 'CSCO', 'PFE', 'XOM', 'T', 'INTC', 'VZ', 'ORCL', 'WMT', 'KO',
    'PEP', 'MCD', 'COST', 'AVGO', 'QCOM', 'TXN', 'HON', 'INTU', 'AMAT', 'MU',
    'SBUX', 'CAT', 'GS', 'IBM', 'BA', 'GE', 'MMM', 'NKE', 'AMD', 'C',
    'UBER', 'ZM', 'SQ', 'SNAP', 'PINS', 'ETSY', 'ROKU', 'SPOT', 'TWLO', 'SNOW',
    'U', 'RBLX', 'COIN', 'HOOD', 'PLTR', 'SOFI', 'RIVN', 'LCID', 'AFRM', 'SHOP',
    'MRNA', 'PTON', 'GME', 'AMC'
];

// Gemini model simulation
const gemini = {
    async generateContent(prompt) {
        const idea1 = `**Iron Condor:** This is a classic, risk-defined strategy for high implied volatility. You could structure an Iron Condor by selling a call credit spread above the expected price range and a put credit spread below it. The goal is for the stock to stay between your short strikes by expiration to collect the premium.`;
        const idea2 = `**Bull Put Spread:** If you have a slightly bullish bias, you could sell a put credit spread. This involves selling a higher-strike put and buying a lower-strike put. You collect a credit upfront and profit if the stock price stays above your short strike at expiration. It's a risk-defined way to be long.`;
        return { response: { text: () => `### Trading Idea 1
${idea1}

### Trading Idea 2
${idea2}` } };
    }
};

export default {
    async scheduled(controller, env, ctx) {
        console.log("Running AI Stock Analyst Agent...");
        try {
            await processAndSendDigest(env);
        } catch (error) {
            console.error("Agent failed to run:", error);
        }
    },
};

async function processAndSendDigest(env) {
    const { FINNHUB_API_KEY, RESEND_API_KEY } = env;

    const fromDate = new Date();
    const toDate = new Date();
    toDate.setDate(fromDate.getDate() + 45);
    const fromDateStr = fromDate.toISOString().split('T')[0];
    const toDateStr = toDate.toISOString().split('T')[0];

    const url = `https://finnhub.io/api/v1/calendar/earnings?from=${fromDateStr}&to=${toDateStr}&token=${FINNHUB_API_KEY}`;
    const response = await fetch(url);
    if (!response.ok) throw new Error(`Finnhub API Error: ${response.statusText}`);
    const data = await response.json();
    const earningsCalendar = data.earningsCalendar || [];

    const stockUniverseSet = new Set(STOCK_UNIVERSE);
    const relevantEarnings = earningsCalendar
        .filter(event => stockUniverseSet.has(event.symbol))
        .sort((a, b) => new Date(a.date) - new Date(b.date));

    const top5Opportunities = relevantEarnings.slice(0, 5);

    if (top5Opportunities.length === 0) {
        console.log("No relevant earnings opportunities found in the stock universe.");
        return;
    }

    const emailContent = await generateDigestWithGemini(top5Opportunities);
    const emailHtml = createEmailHtml(emailContent);
    
    await sendBroadcast(RESEND_API_KEY, emailHtml);
}

async function generateDigestWithGemini(opportunities) {
    let content = [];
    for (const opp of opportunities) {
        const prompt = `You are a conservative financial analyst...`; // Prompt remains the same
        const result = await gemini.generateContent(prompt);
        const tradingIdeas = result.response.text();
        content.push({ opportunity: opp, ideas: tradingIdeas });
    }
    return content;
}

function createEmailHtml(content) {
    const today = new Date().toDateString();
    let opportunitiesHtml = '';
    content.forEach(item => {
        const opp = item.opportunity;
        const earningsDate = new Date(opp.date).toDateString();
        opportunitiesHtml += `
            <div class="opportunity">
                <h2>${opp.symbol} (Earnings: ${earningsDate})</h2>
                <p><b>EPS Estimate:</b> ${opp.epsEstimate || 'N/A'}</p>
                <div class="ideas">
                    ${item.ideas.replace(/### (.*)/g, '<h3>$1</h3>').replace(/\n/g, '<br/>')}
                </div>
            </div>
        `;
    });

    return `
        <!DOCTYPE html><html><head>...</head><body>...</body></html>
    `; // The full HTML is omitted for brevity but is the same as before
}

async function sendBroadcast(apiKey, htmlContent) {
    const today = new Date().toDateString();
    const audienceId = '085abd2c-38b7-4871-9946-b087255ec292';
    const resend = new Resend(apiKey);

    console.log("Creating broadcast draft...");
    const { data: createData, error: createError } = await resend.broadcasts.create({
        from: 'newsletter@ravishankars.com',
        audienceId: audienceId,
        subject: `Your AI Stock Analyst Digest - ${today}`,
        html: htmlContent,
    });

    if (createError) {
        throw new Error(`Resend API (create) failed: ${JSON.stringify(createError)}`);
    }

    console.log(`Successfully created broadcast draft ${createData.id}. Sending...`);

    const { data: sendData, error: sendError } = await resend.broadcasts.send(createData.id);

    if (sendError) {
        throw new Error(`Resend API (send) failed: ${JSON.stringify(sendError)}`);
    }

    console.log(`Successfully triggered send for broadcast ${sendData.id}`);
}