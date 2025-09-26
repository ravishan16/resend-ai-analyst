
// A list of top tech/growth stocks to monitor (subset of NASDAQ 100 for example)
const STOCK_UNIVERSE = [
    'AAPL', 'MSFT', 'GOOGL', 'AMZN', 'NVDA', 'META', 'TSLA', 'AVGO', 'COST', 'ADBE',
    'AMD', 'NFLX', 'PEP', 'INTC', 'QCOM', 'TXN', 'HON', 'INTU', 'AMAT', 'MU'
];

export default {
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

    const fromDate = new Date();
    const toDate = new Date();
    toDate.setDate(fromDate.getDate() + 45);
    const fromDateStr = fromDate.toISOString().split('T')[0];
    const toDateStr = toDate.toISOString().split('T')[0];

    const url = `https://finnhub.io/api/v1/calendar/earnings?from=${fromDateStr}&to=${toDateStr}&token=${FINNHUB_API_KEY}`;
    const response = await fetch(url);
    if (!response.ok) {
        throw new Error(`Finnhub API request failed: ${response.statusText}`);
    }
    const data = await response.json();
    const earningsCalendar = data.earningsCalendar || [];

    const relevantEarnings = earningsCalendar
        .filter(event => STOCK_UNIVERSE.includes(event.symbol))
        .sort((a, b) => new Date(a.date) - new Date(b.date));

    const top5Opportunities = relevantEarnings.slice(0, 5);

    if (top5Opportunities.length === 0) {
        console.log("No relevant earnings opportunities found for today.");
        return;
    }

    const tableRows = generateTableRows(top5Opportunities);
    const emailHtml = createEmailHtml(tableRows);
    
    await sendBroadcast(RESEND_API_KEY, emailHtml);
}

function generateTableRows(opportunities) {
    let rows = '';
    opportunities.forEach(opp => {
        const earningsDate = new Date(opp.date).toDateString();
        const revenueEst = opp.revenueEstimate ? `${opp.revenueEstimate.toFixed(2)}M` : 'N/A';
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
                .footer { text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #eaeaea; font-size: 12px; color: #999; }
                .footer a { color: #999; text-decoration: underline; }
            </style>
        </head>
        <body>
            <div class="wrapper">
                <div class="container">
                    <h1>Your Top 5 Earnings Plays</h1>
                    <p>Good morning! Here is your daily digest of stocks with upcoming earnings. These are potential candidates for volatility-based options strategies.</p>
                    <table>
                        <thead>
                            <tr>
                                <th>Symbol</th>
                                <th>Earnings Date</th>
                                <th>EPS Est.</th>
                                <th>Revenue Est.</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${tableRows}
                        </tbody>
                    </table>
                </div>
                <div class="footer">
                    <p><b>Disclaimer:</b> This is not financial advice. This digest is for informational purposes only.</p>
                    <p>No longer want these emails? <a href="{{resend_unsubscribe_url}}">Unsubscribe</a>.</p>
                </div>
            </div>
        </body>
        </html>
    `;
}

async function sendBroadcast(apiKey, htmlContent) {
    const today = new Date().toDateString();
    const audienceId = '085abd2c-38b7-4871-9946-b087255ec292';

    // Step 1: Create the broadcast as a draft
    const createResponse = await fetch('https://api.resend.com/broadcasts', {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            from: 'newsletter@ravishankars.com',
            audience_id: audienceId,
            subject: `Your AI Stock Analyst Digest - ${today}`,
            html: htmlContent,
        }),
    });

    if (!createResponse.ok) {
        const errorData = await createResponse.json();
        throw new Error(`Resend API request to create broadcast failed: ${JSON.stringify(errorData)}`);
    }

    const createData = await createResponse.json();
    console.log(`Successfully created broadcast draft ${createData.id}`);

    // Step 2: Send the broadcast
    const sendResponse = await fetch(`https://api.resend.com/broadcasts/${createData.id}/send`, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${apiKey}`,
        },
    });

    if (!sendResponse.ok) {
        const errorData = await sendResponse.json();
        throw new Error(`Resend API request to send broadcast failed: ${JSON.stringify(errorData)}`);
    }

    const sendData = await sendResponse.json();
    console.log(`Successfully triggered send for broadcast ${sendData.id}`);
}