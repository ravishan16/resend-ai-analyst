/**
 * Professional email template using template literals (JSX-free for Node.js compatibility)
 */

const EmailTemplate = ({ 
  opportunities = [], 
  marketContext = {}, 
  date = new Date().toDateString() 
}) => {

  const getSentimentColor = (score) => {
    if (score >= 8) return '#10b981'; // Green
    if (score >= 6) return '#f59e0b'; // Amber  
    return '#ef4444'; // Red
  };

  const getRecommendationStyle = (recommendation) => {
    const styles = {
      'STRONGLY CONSIDER': 'background-color: #10b981; color: #ffffff; padding: 4px 8px; border-radius: 4px; font-size: 11px; font-weight: bold;',
      'NEUTRAL': 'background-color: #f59e0b; color: #ffffff; padding: 4px 8px; border-radius: 4px; font-size: 11px; font-weight: bold;',
      'STAY AWAY': 'background-color: #ef4444; color: #ffffff; padding: 4px 8px; border-radius: 4px; font-size: 11px; font-weight: bold;'
    };
    return styles[recommendation] || styles['NEUTRAL'];
  };

  // Generate compact opportunities display
  const opportunitiesHtml = opportunities.length > 0 ? `
    <div style="margin: 16px 24px;">
      ${opportunities.map((item, index) => {
        const opp = item.opportunity;
        const analysis = item.analysis;
        const vol = opp.volatilityData || {};
        
        return `
          <div style="margin: 12px 0; padding: 16px; border: 1px solid #e5e7eb; border-radius: 6px; background-color: ${index % 2 === 0 ? '#f9fafb' : '#ffffff'};">
            <!-- Header Row -->
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
              <div style="display: flex; align-items: center; gap: 12px;">
                <h3 style="font-size: 18px; font-weight: bold; margin: 0; color: #1f2937;">${opp.symbol}</h3>
                <span style="font-size: 12px; color: #6b7280;">$${vol.currentPrice?.toFixed(2) || 'N/A'}</span>
                <span style="font-size: 12px; color: #6b7280;">${new Date(opp.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} (${opp.daysToEarnings}d)</span>
              </div>
              <div style="display: flex; align-items: center; gap: 8px;">
                <div style="text-align: center;">
                  <div style="color: ${getSentimentColor(analysis.sentimentScore)}; font-weight: 600; font-size: 20px;">${analysis.sentimentScore || 'N/A'}</div>
                  <div style="font-size: 10px; color: #6b7280;">Sentiment</div>
                </div>
                <span style="${getRecommendationStyle(analysis.recommendation)}">
                  ${analysis.recommendation === 'STRONGLY CONSIDER' ? 'BUY' : 
                    analysis.recommendation === 'NEUTRAL' ? 'NEUTRAL' : 'AVOID'}
                </span>
              </div>
            </div>
            
            <!-- Compact Metrics Table -->
            <table style="width: 100%; font-size: 11px; color: #374151;">
              <tr>
                <td style="padding: 4px 0; font-weight: 500;">IV/HV:</td>
                <td style="padding: 4px 0;">${vol.impliedVolatility?.toFixed(1) || 'N/A'}% / ${vol.historicalVolatility30d?.toFixed(1) || 'N/A'}%</td>
                <td style="padding: 4px 0; font-weight: 500;">Expected Move:</td>
                <td style="padding: 4px 0;">${vol.expectedMove && vol.currentPrice ? 
                  `${((vol.expectedMove / vol.currentPrice) * 100).toFixed(1)}% ($${vol.expectedMove.toFixed(2)})` : 'N/A'}</td>
              </tr>
              <tr>
                <td style="padding: 4px 0; font-weight: 500;">Quality:</td>
                <td style="padding: 4px 0; color: ${opp.qualityScore >= 70 ? '#10b981' : opp.qualityScore >= 40 ? '#f59e0b' : '#ef4444'}; font-weight: 600;">
                  ${opp.qualityScore || 'N/A'}/100
                </td>
                <td style="padding: 4px 0; font-weight: 500;">Vol Status:</td>
                <td style="padding: 4px 0; color: ${vol.impliedVolatility > vol.historicalVolatility30d ? '#dc2626' : '#16a34a'}; font-weight: 500;">
                  ${vol.impliedVolatility && vol.historicalVolatility30d ? 
                    (vol.impliedVolatility > vol.historicalVolatility30d ? 'High' : 'Normal') : 'N/A'}
                </td>
              </tr>
              <tr>
                <td style="padding: 4px 0; font-weight: 500;">RSI:</td>
                <td style="padding: 4px 0; color: ${vol.technicalIndicators?.rsi ? 
                  (vol.technicalIndicators.rsi > 70 ? '#dc2626' : vol.technicalIndicators.rsi < 30 ? '#16a34a' : '#6b7280') : '#6b7280'};">
                  ${vol.technicalIndicators?.rsi?.toFixed(1) || 'N/A'}
                </td>
                <td style="padding: 4px 0; font-weight: 500;">Options Vol:</td>
                <td style="padding: 4px 0;">${vol.optionsVolume ? vol.optionsVolume.toLocaleString() : 'N/A'}</td>
              </tr>
            </table>
            
            <!-- Strategies (if any) -->
            ${analysis.strategies && analysis.strategies.length > 0 ? `
              <div style="margin-top: 8px; font-size: 11px;">
                <div style="font-weight: 600; margin-bottom: 4px; color: #374151;">Strategies:</div>
                ${analysis.strategies.slice(0, 2).map(strategy => `
                  <div style="margin-bottom: 2px; color: #6b7280;">• ${strategy.name}</div>
                `).join('')}
              </div>
            ` : ''}
          </div>
        `;
      }).join('')}
    </div>
  ` : `
    <div style="padding: 24px; text-align: center; color: #6b7280; background-color: #f9fafb; border-radius: 8px; margin: 16px 0;">
      <p style="margin: 0; font-size: 14px;">No qualifying opportunities found today.</p>
      <p style="margin: 4px 0 0 0; font-size: 12px;">Check back tomorrow for new earnings opportunities.</p>
    </div>
  `;

  // Generate AI consolidated recommendation
  const aiRecommendation = opportunities.length > 0 ? generateConsolidatedRecommendation(opportunities, marketContext) : '';

  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <title>AI Stock Analyst Digest</title>
      </head>
      <body style="margin: 0; padding: 0; background-color: #f3f4f6; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
        <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
          
          <!-- Header -->
          <div style="padding: 24px; background: linear-gradient(135deg, #1e40af 0%, #3b82f6 100%); text-align: center;">
            <h1 style="color: #ffffff; margin: 0 0 8px 0; font-size: 24px; font-weight: bold;">
              🎯 AI Stock Analyst Digest
            </h1>
            <p style="color: #bfdbfe; margin: 0; font-size: 14px;">
              Quantitative Earnings Opportunities • ${date}
            </p>
          </div>

          <!-- Summary -->
          <div style="padding: 20px 24px; background-color: #f8fafc; border-bottom: 1px solid #e2e8f0;">
            <p style="margin: 0; font-size: 14px; color: #374151; line-height: 1.5;">
              Today's analysis identified <strong>${opportunities.length} high-quality earnings opportunities</strong> using volatility 
              analysis, technical indicators, and AI-powered sentiment scoring.
            </p>
          </div>

          <!-- Opportunities -->
          <div style="padding: 0;">
            <h2 style="font-size: 16px; font-weight: 600; margin: 20px 24px 8px 24px; color: #1f2937;">
              📊 Earnings Opportunities
            </h2>
            ${opportunitiesHtml}
          </div>

          ${aiRecommendation}

          <!-- Market Context -->
          <div style="margin: 24px; padding: 16px; background-color: #f0f9ff; border: 1px solid #bae6fd; border-radius: 6px;">
            <h3 style="font-size: 14px; font-weight: 600; margin: 0 0 8px 0; color: #0369a1;">
              📈 Market Context
            </h3>
            <p style="font-size: 12px; line-height: 1.4; margin: 0; color: #475569;">
              VIX: ${marketContext.vix?.toFixed(1) || 'N/A'} | 
              Regime: ${marketContext.marketRegime || 'Unknown'} | 
              Environment: ${getMarketDescription(marketContext)}
            </p>
          </div>

          <!-- Key Terms -->
          <div style="margin: 24px; padding: 16px; background-color: #fefce8; border: 1px solid #fde68a; border-radius: 6px;">
            <h3 style="font-size: 14px; font-weight: 600; margin: 0 0 8px 0; color: #a16207;">
              📚 Key Terms
            </h3>
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px; font-size: 11px; color: #475569; line-height: 1.3;">
              <div><strong>IV/HV:</strong> Implied vs Historical Volatility (%)</div>
              <div><strong>Quality:</strong> Overall opportunity score (0-100)</div>
              <div><strong>Expected Move:</strong> Projected price movement</div>
              <div><strong>RSI:</strong> Momentum indicator (0-100)</div>
              <div><strong>Vol Status:</strong> Current volatility level vs history</div>
              <div><strong>Options Vol:</strong> Trading activity level</div>
            </div>
          </div>

          <!-- Disclaimer -->
          <div style="padding: 20px 24px; background-color: #fef2f2; border: 1px solid #fca5a5;">
            <h3 style="font-size: 13px; font-weight: 600; margin: 0 0 8px 0; color: #dc2626;">
              ⚠️ Important Disclaimer
            </h3>
            <p style="font-size: 11px; line-height: 1.4; margin: 0 0 8px 0; color: #475569;">
              <strong>NOT FINANCIAL ADVICE:</strong> This analysis is generated by an automated algorithm and AI (Google Gemini) for educational purposes only. 
              The complete source code is available on <a href="https://github.com/ravishan16/resend-ai-analyst" style="color: #2563eb;">GitHub</a> for transparency and verification.
            </p>
            <p style="font-size: 11px; line-height: 1.4; margin: 0; color: #475569;">
              Options trading involves substantial risk and may result in total loss. These are algorithmic recommendations, not advice from any individual. 
              All probability calculations are theoretical. Please consult a qualified financial advisor and only risk capital you can afford to lose.
            </p>
          </div>

          <!-- Footer -->
          <div style="padding: 16px 24px; background-color: #f1f5f9; text-align: center; border-top: 1px solid #e2e8f0;">
            <p style="font-size: 11px; margin: 0 0 4px 0; color: #64748b;">
              Generated by AI Stock Analyst • ${date}
            </p>
            <p style="font-size: 10px; margin: 0; color: #94a3b8;">
              Powered by Finnhub, Polygon.io, and Google Gemini AI
            </p>
          </div>

        </div>
      </body>
    </html>
  `;
};

// Helper function to generate consolidated AI recommendation
function generateConsolidatedRecommendation(opportunities, marketContext) {
  const stronglyConsider = opportunities.filter(item => item.analysis.recommendation === 'STRONGLY CONSIDER');
  const neutral = opportunities.filter(item => item.analysis.recommendation === 'NEUTRAL'); 
  const stayAway = opportunities.filter(item => item.analysis.recommendation === 'STAY AWAY');
  
  const avgSentiment = opportunities.reduce((sum, item) => sum + (item.analysis.sentimentScore || 5), 0) / opportunities.length;
  
  if (stronglyConsider.length === 0) {
    return `
      <div style="margin: 24px; padding: 16px; background-color: #fef3c7; border: 1px solid #f59e0b; border-radius: 6px;">
        <h3 style="font-size: 14px; font-weight: 600; margin: 0 0 8px 0; color: #92400e;">
          🤖 AI Consolidated View
        </h3>
        <p style="font-size: 12px; line-height: 1.4; margin: 0; color: #475569;">
          <strong>NEUTRAL MARKET:</strong> No strongly recommended opportunities today. 
          Average sentiment: ${avgSentiment.toFixed(1)}/10. Consider waiting for better setups or focus on paper trading to refine strategy.
        </p>
      </div>
    `;
  }
  
  const topPicks = stronglyConsider
    .sort((a, b) => (b.analysis.sentimentScore || 0) - (a.analysis.sentimentScore || 0))
    .slice(0, 2);
    
  return `
    <div style="margin: 24px; padding: 16px; background-color: #d1fae5; border: 1px solid #10b981; border-radius: 6px;">
      <h3 style="font-size: 14px; font-weight: 600; margin: 0 0 8px 0; color: #065f46;">
        🤖 AI Consolidated Recommendation
      </h3>
      <p style="font-size: 12px; line-height: 1.4; margin: 0 0 8px 0; color: #475569;">
        <strong>TOP PICKS:</strong> ${topPicks.map(item => `${item.opportunity.symbol} (${item.analysis.sentimentScore}/10)`).join(', ')}
      </p>
      <p style="font-size: 12px; line-height: 1.4; margin: 0; color: #475569;">
        <strong>MARKET OUTLOOK:</strong> ${stronglyConsider.length} strong opportunities identified. 
        Avg sentiment: ${avgSentiment.toFixed(1)}/10. Focus on volatility-selling strategies in current ${marketContext.marketRegime || 'normal'} regime.
      </p>
    </div>
  `;
}

function getMarketDescription(marketContext) {
  const vix = marketContext.vix || 0;
  if (vix < 15) return 'Low fear, premium selling favored';
  if (vix < 25) return 'Normal conditions, balanced strategies';
  return 'High fear, consider premium buying';
}

export default EmailTemplate;