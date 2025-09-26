
import { Resend } from 'resend';

// Gemini model for generating trading ideas
// In a real-world scenario, this would be a proper API call to the Gemini model.
// For this example, we simulate the model's capabilities directly in the code.
const gemini = {
    async generateContent(prompt) {
        // A simple simulation of Gemini generating two conservative trading ideas.
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

    const stockUniverse = await getStockUniverse(FINNHUB_API_KEY);
    
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

    const relevantEarnings = earningsCalendar
        .filter(event => stockUniverse.has(event.symbol))
        .sort((a, b) => new Date(a.date) - new Date(b.date));

    const top5Opportunities = relevantEarnings.slice(0, 5);

    if (top5Opportunities.length === 0) {
        console.log("No relevant earnings opportunities found.");
        return;
    }

    const emailContent = await generateDigestWithGemini(top5Opportunities);
    const emailHtml = createEmailHtml(emailContent);
    
    await sendBroadcast(RESEND_API_KEY, emailHtml);
}

async function getStockUniverse(apiKey) {
    const indices = ['^GSPC', '^NDX'];
    const promises = indices.map(index => 
        fetch(`https://finnhub.io/api/v1/index/constituent?symbol=${index}&token=${apiKey}`)
            .then(res => res.json())
    );

    const results = await Promise.all(promises);
    const symbols = new Set();
    results.forEach(result => {
        if (result.constituents) {
            result.constituents.forEach(symbol => symbols.add(symbol));
        }
    });

    console.log(`Built stock universe with ${symbols.size} unique symbols.`);
    return symbols;
}

async function generateDigestWithGemini(opportunities) {
    let content = [];
    for (const opp of opportunities) {
        const prompt = `You are a conservative financial analyst. For the stock ${opp.symbol}, which has an upcoming earnings announcement on ${new Date(opp.date).toDateString()}, propose two distinct, risk-defined options trading strategies to capitalize on the expected high implied volatility around this event. For each idea (e.g., Iron Condor, Bull Put Spread), briefly explain the strategy and its rationale.`;
        
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
        <!DOCTYPE html><html><head><title>AI Stock Analyst Digest - ${today}</title><style>body{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;line-height:1.6;color:#333;background-color:#f9f9f9;margin:0;padding:20px;}.container{max-width:600px;margin:0 auto;background-color:#fff;padding:30px;border-radius:10px;box-shadow:0 4px 12px rgba(0,0,0,0.1);}.opportunity{margin-bottom:25px;padding-bottom:15px;border-bottom:1px solid #eee;}h1{font-size:28px;color:#1c2b3a;text-align:center;margin-bottom:15px;}h2{font-size:22px;color:#2c3e50;margin-bottom:10px;}h3{font-size:18px;color:#34495e;margin-top:15px;border-left:3px solid #3498db;padding-left:10px;}.ideas{background-color:#fdfdfd;border:1px solid #f0f0f0;padding:15px;border-radius:5px;}.footer{text-align:center;margin-top:30px;padding-top:20px;font-size:12px;color:#aaa;}.footer a{color:#aaa;}</style></head><body><div class="container"><h1>Your AI Stock Analyst Digest</h1><p style="text-align:center;margin-bottom:30px;">Conservative options trading ideas for upcoming earnings events.</p>${opportunitiesHtml}</div><div class="footer"><p><b>Disclaimer:</b> This is not financial advice. This digest is for informational purposes only.</p><p>No longer want these emails? <a href="{{{RESEND_UNSUBSCRIBE_URL}}}">Unsubscribe</a>.</p></div></body></html>
    `;
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