
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

    // 4. Generate the content for the email body
    const tableRows = generateTableRows(top5Opportunities);

    // 5. Send the email via Resend Broadcasts API
    const emailHtml = createEmailHtml(tableRows);
    await sendBroadcast(RESEND_API_KEY, emailHtml);
}

function generateTableRows(opportunities) {
    let rows = '';
    opportunities.forEach(opp => {
        const earningsDate = new Date(opp.date).toDateString();
        // Bug Fix: Format revenue as millions, not billions.
        const revenueEst = opp.revenueEstimate ? opp.revenueEstimate.toFixed(2) : 'N/A';
        rows += `
            <tr>
                <td><b>${opp.symbol}</b></td>
                <td>${earningsDate}</td>
                <td>${opp.epsEstimate || 'N/A'}</td>
                <td>${revenueEst}</td>
            </tr>
        `;
    });
    return rows;
}

function createEmailHtml(tableRows) {
    const today = new Date().toDateString();
    // New Minimalist HTML Template
    return `
        <!DOCTYPE html>
        <html>
        <head>
            <title>AI Stock Analyst Digest - ${today}</title>
            <style>
                body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; line-height: 1.5; color: #333; background-color: #f7f7f7; margin: 0; padding: 0; }
                .wrapper { width: 100%; table-layout: fixed; }
                .container { max-width: 600px; margin: 20px auto; background-color: #ffffff; padding: 30px; border-radius: 8px; box-shadow: 0 4px 8px rgba(0,0,0,0.1); }
                h1 { font-size: 24px; color: #2c3e50; margin-top: 0; }
                p { margin-bottom: 20px; }
                table { width: 100%; border-collapse: collapse; }
                th, td { padding: 12px; text-align: left; border-bottom: 1px solid #eaeaea; }
                th { font-size: 14px; color: #555; }
                td { font-size: 16px; }
                .footer { text-align: center; margin-top: 20px; font-size: 12px; color: #999; }
                .footer a { color: #999; text-decoration: underline; }
            </style>
        </head>
        <body>
            <div class="wrapper">
                <div class="container">
                    <h1>Top 5 Earnings Plays</h1>
                    <p>Daily digest of stocks with upcoming earnings, which may see high implied volatility.</p>
                    <table>
                        <thead>
                            <tr>
                                <th>Symbol</th>
                                <th>Earnings Date</th>
                                <th>EPS Est.</th>
                                <th>Revenue Est. (M)</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${tableRows}
                        </tbody>
                    </table>
                </div>
                <div class="footer">
                    <p>Not financial advice. For informational purposes only.</p>
                    <p><a href="{{resend_unsubscribe_url}}">Unsubscribe</a></p>
                </div>
            </div>
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
            from: 'onboarding@resend.dev', // Using default Resend address for testing
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