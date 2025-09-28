import { GoogleGenerativeAI } from "@google/generative-ai";

/**
 * Enhanced AI analysis with quantitative data and sentiment scoring
 */
export async function generateTradingIdeas(apiKey, opportunities, marketContext) {
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-pro-latest"});

    console.log(`Generating AI analysis for ${opportunities.length} opportunities...`);

    let content = [];
    for (const opp of opportunities) {
        try {
            const analysis = await generateSingleAnalysis(model, opp, marketContext);
            if (analysis) {
                content.push({
                    opportunity: opp,
                    analysis: analysis,
                    timestamp: new Date().toISOString()
                });
            }
        } catch (error) {
            console.error(`Error generating analysis for ${opp.symbol}:`, error);
            // Continue with other opportunities even if one fails
        }
    }

    console.log(`Successfully generated ${content.length} analyses`);
    return content;
}

/**
 * Generate comprehensive analysis for a single opportunity
 */
async function generateSingleAnalysis(model, opportunity, marketContext) {
    const vol = opportunity.volatilityData;
    const prompt = createEnhancedPrompt(opportunity, marketContext);

    try {
        const result = await model.generateContent(prompt);
        const response = await result.response;
        const rawAnalysis = response.text();

        // Parse the structured response
        const analysis = parseAnalysisResponse(rawAnalysis, opportunity);
        
        return analysis;
    } catch (error) {
        console.error(`Error in AI analysis for ${opportunity.symbol}:`, error);
        return null;
    }
}

/**
 * Create enhanced prompt with quantitative data
 */
function createEnhancedPrompt(opportunity, marketContext) {
    const vol = opportunity.volatilityData;
    const marketRegimeDescription = getMarketRegimeDescription(marketContext);
    
    const prompt = `
QUANTITATIVE ANALYST: Analyze this earnings opportunity. KEEP RESPONSE CONCISE.

STOCK: ${opportunity.symbol} | Earnings: ${opportunity.date} (${opportunity.daysToEarnings}d)
Price: $${vol?.currentPrice?.toFixed(2) || 'N/A'} | Expected Move: ${vol?.expectedMove ? `${((vol.expectedMove/vol.currentPrice)*100).toFixed(1)}%` : 'N/A'}
IV: ${vol?.impliedVolatility?.toFixed(1) || 'N/A'}% | HV: ${vol?.historicalVolatility30d?.toFixed(1) || 'N/A'}% | RSI: ${vol?.technicalIndicators?.rsi?.toFixed(1) || 'N/A'}
Quality: ${opportunity.qualityScore}/100 | VIX: ${marketContext?.vix?.toFixed(1) || 'N/A'} (${marketContext?.marketRegime || 'Unknown'})

RESPOND IN EXACTLY THIS FORMAT (NO EXTRA TEXT):

**SENTIMENT SCORE:** [number 1-10]

**RECOMMENDATION:** [STRONGLY CONSIDER or NEUTRAL or STAY AWAY]

**REASONING:** [2-3 sentences max explaining key factors]

**STRATEGIES:**
1. **[Strategy Name]** - POP: [%], Risk: $[amount], Entry: [timing]  
2. **[Strategy Name]** - POP: [%], Risk: $[amount], Entry: [timing]

**KEY RISKS:** [1-2 bullets max]

BE CONCISE. NO FLUFF.`;

    return prompt;
}

/**
 * Parse structured AI response into organized data
 */
function parseAnalysisResponse(rawResponse, opportunity) {
    const analysis = {
        symbol: opportunity.symbol,
        sentimentScore: null,
        recommendation: 'NEUTRAL',
        strategies: [],
        volatilityAssessment: '',
        riskFactors: '',
        positionSizing: '',
        rawAnalysis: rawResponse
    };

    try {
        // Extract sentiment score - try multiple patterns
        let sentimentMatch = rawResponse.match(/\*\*SENTIMENT SCORE:\*\*\s*(\d+)/i);
        if (!sentimentMatch) {
            sentimentMatch = rawResponse.match(/SENTIMENT SCORE:\s*(\d+)/i);
        }
        if (!sentimentMatch) {
            sentimentMatch = rawResponse.match(/sentiment[^:]*:\s*(\d+)/i);
        }
        if (!sentimentMatch) {
            // Try to find any number after sentiment-related words
            sentimentMatch = rawResponse.match(/sentiment[^0-9]*(\d+)/i);
        }
        
        if (sentimentMatch) {
            analysis.sentimentScore = parseInt(sentimentMatch[1]);
        }

        // Extract recommendation - try multiple patterns
        let recommendationMatch = rawResponse.match(/\*\*RECOMMENDATION:\*\*\s*(STRONGLY CONSIDER|NEUTRAL|STAY AWAY)/i);
        if (!recommendationMatch) {
            recommendationMatch = rawResponse.match(/RECOMMENDATION:\s*(STRONGLY CONSIDER|NEUTRAL|STAY AWAY)/i);
        }
        if (!recommendationMatch) {
            // Look for the recommendation anywhere in the response
            recommendationMatch = rawResponse.match(/(STRONGLY CONSIDER|NEUTRAL|STAY AWAY)/i);
        }
        
        if (recommendationMatch) {
            analysis.recommendation = recommendationMatch[1].toUpperCase();
        }

        // Extract strategies (simplified parsing)
        const strategyMatches = rawResponse.match(/\d\.\s*\*\*([^*]+)\*\*([\s\S]*?)(?=\d\.\s*\*\*|\*\*POSITION SIZING|\n\n|$)/gi);
        if (strategyMatches) {
            strategyMatches.forEach(match => {
                const strategyName = match.match(/\*\*([^*]+)\*\*/)?.[1]?.trim();
                if (strategyName) {
                    analysis.strategies.push({
                        name: strategyName,
                        details: match.replace(/\*\*[^*]+\*\*/, '').trim()
                    });
                }
            });
        }

        // Extract other sections
        const volatilityMatch = rawResponse.match(/\*\*VOLATILITY ASSESSMENT:\*\*\s*([\s\S]*?)(?=\*\*[A-Z\s]+:|$)/i);
        if (volatilityMatch) {
            analysis.volatilityAssessment = volatilityMatch[1].trim();
        }

        const riskMatch = rawResponse.match(/\*\*RISK FACTORS:\*\*\s*([\s\S]*?)(?=\*\*[A-Z\s]+:|$)/i);
        if (riskMatch) {
            analysis.riskFactors = riskMatch[1].trim();
        }

        const positionMatch = rawResponse.match(/\*\*POSITION SIZING:\*\*\s*([\s\S]*?)(?=\*\*[A-Z\s]+:|$)/i);
        if (positionMatch) {
            analysis.positionSizing = positionMatch[1].trim();
        }

    } catch (parseError) {
        console.error(`Error parsing AI response for ${opportunity.symbol}:`, parseError);
    }

    return analysis;
}

/**
 * Get market regime description for context
 */
function getMarketRegimeDescription(marketContext) {
    if (!marketContext || !marketContext.marketRegime) {
        return '';
    }

    const descriptions = {
        'high-volatility': 'High volatility environment - Premium selling may be attractive, but manage risk carefully.',
        'elevated-volatility': 'Elevated volatility - Good environment for defined risk strategies.',
        'normal': 'Normal volatility environment - Focus on high-probability setups.',
        'low-volatility': 'Low volatility environment - Premium buying may be more attractive than selling.'
    };

    return descriptions[marketContext.marketRegime] || '';
}

/**
 * Validate analysis quality and filter out poor recommendations
 */
export function validateAnalysis(analysis) {
    const issues = [];

    // Check sentiment score
    if (!analysis.sentimentScore || analysis.sentimentScore < 1 || analysis.sentimentScore > 10) {
        issues.push('Invalid sentiment score');
    }

    // Check recommendation format
    if (!['STRONGLY CONSIDER', 'NEUTRAL', 'STAY AWAY'].includes(analysis.recommendation)) {
        issues.push('Invalid recommendation format');
    }

    // Check for strategies
    if (!analysis.strategies || analysis.strategies.length === 0) {
        issues.push('No strategies provided');
    }

    // Conservative filter: Reject low-confidence analyses
    if (analysis.sentimentScore && analysis.sentimentScore < 5 && analysis.recommendation === 'STRONGLY CONSIDER') {
        issues.push('Inconsistent sentiment and recommendation');
    }

    return {
        isValid: issues.length === 0,
        issues: issues
    };
}