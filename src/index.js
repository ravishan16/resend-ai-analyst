// A list of top tech/growth stocks to monitor (subset of NASDAQ 100 for example)
const STOCK_UNIVERSE = [
    'AAPL', 'MSFT', 'GOOGL', 'AMZN', 'NVDA', 'META', 'TSLA', 'AVGO', 'COST', 'ADBE',
    'AMD', 'NFLX', 'PEP', 'INTC', 'QCOM', 'TXN', 'HON', 'INTU', 'AMAT', 'MU'
];

export default {
    // This handler is triggered by the cron schedule in wrangler.toml
    async scheduled(controller, env, ctx) {
        console.log("Running daily stock analyst agent...");
        try {
            await processAndSendDigest(env);
        } catch (error) {
            console.error("Failed to run daily stock analyst agent:", error);
        }
    },
};

async function processAndSendDigest(env) {
    const { FINNHUB_API_KEY, RESEND_API_KEY } = env;

    // 1. Get date range for the next 45 days
    const fromDate = new Date();
    const toDate = new Date();
    toDate.setDate(fromDate.getDate() + 45);
    const fromDateStr = fromDate.toISOString().split('T')[0];
    const toDateStr = toDate.toISOString().split('T')[0];

    // 2. Fetch upcoming earnings from Finnhub
    const url = `https://finnhub.io/api/v1/calendar/earnings?from=${fromDateStr}&to=${toDateStr}&token=${FINNHUB_API_KEY}`;
    const response = await fetch(url);
    if (!response.ok) {
        throw new Error(`Finnhub API request failed: ${response.statusText}`);
    }
    const data = await response.json();
    const earningsCalendar = data.earningsCalendar || [];

    // 3. Filter for our stock universe and rank them
    const relevantEarnings = earningsCalendar
        .filter(event => STOCK_UNIVERSE.includes(event.symbol))
        .sort((a, b) => new Date(a.date) - new Date(b.date)); // Sort by closest earnings date

    const top5Opportunities = relevantEarnings.slice(0, 5);

    if (top5Opportunities.length === 0) {
        console.log("No relevant earnings opportunities found for today.");
        return;
    }

    // 4. Use AI to generate the digest
    const digestContent = generateAIDigest(top5Opportunities);

    // 5. Send the email via Resend Broadcasts API
    const emailHtml = createEmailHtml(digestContent);
    await sendBroadcast(RESEND_API_KEY, emailHtml);
}

function generateAIDigest(opportunities) {
    // In a real scenario, this would call an external LLM.
    // Here, we simulate the AI's output based on a template for reliability and speed.
    let digest = "<h1>Top 5 Earnings Plays for the Next 45 Days</h1>";
    digest += "<p>Here are today's top earnings volatility opportunities based on the tastytrade methodology. These stocks have upcoming earnings and may see a spike in implied volatility.</p>";

    opportunities.forEach(opp => {
        const earningsDate = new Date(opp.date).toDateString();
        digest += `
            <h2>${opp.symbol} (Earnings on ${earningsDate})</h2>
            <p>
                ${opp.symbol} is reporting earnings on ${earningsDate}. This event is a prime candidate for options premium selling strategies like strangles or iron condors. Traders should watch for elevated implied volatility leading up to this date to structure potential trades.
            </p>
            <p><em>Hour: ${opp.hour.toUpperCase()} | EPS Estimate: ${opp.epsEstimate || 'N/A'} | Revenue Estimate: ${opp.revenueEstimate ? (opp.revenueEstimate / 1000).toFixed(2) + 'B' : 'N/A'}</em></p>
            <hr/>
        `;
    });
    return digest;
}

function createEmailHtml(content) {
    const today = new Date().toDateString();
    return `
        <!DOCTYPE html>
        <html>
        <head>
            <title>AI Stock Analyst Digest - ${today}</title>
            <style>
                body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                h1, h2 { color: #2c3e50; }
                hr { border: 0; height: 1px; background: #ddd; }
            </style>
        </head>
        <body>
            ${content}
            <p><em>Disclaimer: This is not financial advice. This digest is for informational purposes only.</em></p>
        </body>
        </html>
    `;
}

async function sendBroadcast(apiKey, htmlContent) {
    const today = new Date().toDateString();
    const audienceId = '085abd2c-38b7-4871-9946-b087255ec292';

    const response = await fetch('https://api.resend.com/broadcasts', {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            from: 'digest@ravishankars.com', // IMPORTANT: This domain must be verified in your Resend account
            audience_id: audienceId,
            subject: `Your AI Stock Analyst Digest - ${today}`,
            html: htmlContent,
        }),
    });

    if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`Resend API request failed: ${JSON.stringify(errorData)}`);
    }

    const responseData = await response.json();
    console.log(`Successfully created broadcast ${responseData.id} for audience ${audienceId}`);
}