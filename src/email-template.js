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
          <div class="opportunity-card" style="margin: 12px 0; padding: 16px; border: 1px solid #e5e7eb; border-radius: 6px; background-color: ${index % 2 === 0 ? '#f9fafb' : '#ffffff'};">
            <!-- Header Row -->
            <table class="header-table" style="width: 100%; margin-bottom: 8px;">
              <tr>
                <td style="width: 70%; vertical-align: middle;">
                  <table style="width: 100%;">
                    <tr>
                      <td style="padding: 0; margin: 0;">
                        <h3 style="font-size: 18px; font-weight: bold; margin: 0; color: #1f2937; display: inline-block;">${opp.symbol}</h3>
                        <span style="font-size: 12px; color: #6b7280; margin-left: 12px;">$${vol.currentPrice?.toFixed(2) || 'N/A'}</span>
                        <span style="font-size: 12px; color: #6b7280; margin-left: 8px;">${new Date(opp.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} (${opp.daysToEarnings}d)</span>
                      </td>
                    </tr>
                  </table>
                </td>
                <td class="sentiment-score" style="width: 30%; text-align: right; vertical-align: middle;">
                  <table style="margin: 0 auto;">
                    <tr>
                      <td style="text-align: center; padding-right: 8px;">
                        <div style="color: ${getSentimentColor(analysis.sentimentScore)}; font-weight: 600; font-size: 20px; margin: 0;">${analysis.sentimentScore || 'N/A'}</div>
                        <div style="font-size: 10px; color: #6b7280; margin: 0;">Sentiment</div>
                      </td>
                      <td style="text-align: center;">
                        <span class="recommendation-badge" style="${getRecommendationStyle(analysis.recommendation)}">
                          ${analysis.recommendation === 'STRONGLY CONSIDER' ? 'BUY' : 
                            analysis.recommendation === 'NEUTRAL' ? 'NEUTRAL' : 'AVOID'}
                        </span>
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>
            </table>
            
            <!-- Compact Metrics Table -->
            <table class="metrics-table" style="width: 100%; font-size: 11px; color: #374151;">
              <tr>
                <td style="padding: 4px 0; font-weight: 500;">IV/HV:</td>
                <td style="padding: 4px 0;">${vol.impliedVolatility?.toFixed(1) || 'N/A'}% / ${vol.historicalVolatility?.toFixed(1) || 'N/A'}%</td>
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
                <td style="padding: 4px 0; color: ${vol.impliedVolatility && vol.historicalVolatility && vol.impliedVolatility > vol.historicalVolatility ? '#dc2626' : '#16a34a'}; font-weight: 500;">
                  ${vol.impliedVolatility && vol.historicalVolatility ? 
                    (vol.impliedVolatility > vol.historicalVolatility ? 'High' : 'Normal') : 'N/A'}
                </td>
              </tr>
              <tr>
                <td style="padding: 4px 0; font-weight: 500;">RSI:</td>
                <td style="padding: 4px 0; color: ${vol.technicalIndicators?.rsi ? 
                  (vol.technicalIndicators.rsi > 70 ? '#dc2626' : vol.technicalIndicators.rsi < 30 ? '#16a34a' : '#6b7280') : '#6b7280'};">
                  ${vol.technicalIndicators?.rsi?.toFixed(1) || 'N/A'}
                </td>
                <td style="padding: 4px 0; font-weight: 500;">Options Volume:</td>
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
        <title>Options Insight Digest</title>
        <style>
          @media only screen and (max-width: 600px) {
            .container {
              width: 100% !important;
              max-width: 100% !important;
            }
            .content {
              padding: 16px !important;
            }
            .header-padding {
              padding: 20px 16px !important;
            }
            .opportunity-card {
              margin: 8px 0 !important;
              padding: 12px !important;
            }
            .metrics-table td {
              font-size: 10px !important;
              padding: 2px 0 !important;
            }
            .header-table {
              display: block !important;
            }
            .header-table tr {
              display: block !important;
            }
            .header-table td {
              display: block !important;
              width: 100% !important;
              text-align: left !important;
              margin-bottom: 4px;
            }
            .sentiment-score {
              text-align: left !important;
              margin-top: 8px;
            }
            .recommendation-badge {
              margin-left: 8px !important;
            }
          }
        </style>
      </head>
      <body style="margin: 0; padding: 0; background-color: #f3f4f6; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
        <div class="container" style="max-width: 600px; margin: 0 auto; background-color: #ffffff; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
          
          <!-- Header -->
          <div class="header-padding" style="padding: 24px; background: linear-gradient(135deg, #1e40af 0%, #3b82f6 100%); text-align: center;">
            <h1 style="color: #ffffff; margin: 0 0 8px 0; font-size: 24px; font-weight: bold;">
              🎯 Options Insight
            </h1>
            <p style="color: #bfdbfe; margin: 0; font-size: 14px;">
              Quantitative Earnings Opportunities • ${date}
            </p>
          </div>

          <!-- Summary -->
          <div class="content" style="padding: 20px 24px; background-color: #f8fafc; border-bottom: 1px solid #e2e8f0;">
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

          <!-- AI Recommendation -->
          ${aiRecommendation}

          <!-- Market Context -->
          ${marketContext.vix ? `
            <div style="margin: 24px; padding: 16px; background-color: #f1f5f9; border: 1px solid #cbd5e1; border-radius: 6px;">
              <h3 style="font-size: 14px; font-weight: 600; margin: 0 0 8px 0; color: #334155;">
                📈 Market Context
              </h3>
              <div style="font-size: 12px; color: #475569; line-height: 1.4;">
                <div style="margin-bottom: 4px;"><strong>VIX:</strong> ${marketContext.vix.toFixed(1)} (${getMarketRegimeDescription(marketContext.vix)})</div>
                <div style="margin-bottom: 4px;"><strong>Market Regime:</strong> ${marketContext.marketRegime || 'Normal'}</div>
                <div><strong>Strategy Guidance:</strong> ${getVixGuidance(marketContext.vix)}</div>
              </div>
            </div>
          ` : ''}

          <!-- Key Terms -->
          <div style="margin: 24px; padding: 16px; background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 6px;">
            <h3 style="font-size: 14px; font-weight: 600; margin: 0 0 8px 0; color: #374151;">
              📚 Key Terms
            </h3>
            <div style="font-size: 11px; color: #6b7280; line-height: 1.4;">
              <div style="margin-bottom: 6px;"><strong>IV (Implied Volatility):</strong> Market's expectation of future price movement</div>
              <div style="margin-bottom: 6px;"><strong>HV (Historical Volatility):</strong> Past 30-day realized price movement</div>
              <div style="margin-bottom: 6px;"><strong>Expected Move:</strong> Predicted price range through earnings (1 std dev)</div>
              <div><strong>Quality Score:</strong> Composite ranking based on liquidity, volume, and data reliability</div>
            </div>
          </div>

          <!-- Important Disclaimer -->
          <div style="margin: 24px; padding: 20px; background-color: #fef2f2; border: 2px solid #fca5a5; border-radius: 8px;">
            <h3 style="font-size: 16px; font-weight: 700; margin: 0 0 12px 0; color: #dc2626; display: flex; align-items: center;">
              ⚠️ Important Disclaimer
            </h3>
            <div style="font-size: 12px; color: #374151; line-height: 1.5; margin-bottom: 12px;">
              <p style="margin: 0 0 8px 0; font-weight: 600;">
                NOT FINANCIAL ADVICE: This analysis is generated by an automated algorithm and AI (Google Gemini) 
                for educational purposes only. The complete source code is available on 
                <a href="https://github.com/ravishan16/options-insight" style="color: #2563eb; text-decoration: underline;">GitHub</a> 
                for transparency and verification.
              </p>
            </div>
            <div style="font-size: 11px; color: #4b5563; line-height: 1.4;">
              Options trading involves substantial risk and may result in total loss. These are algorithmic 
              recommendations, not advice from any individual. All probability calculations are theoretical. Please 
              consult a qualified financial advisor and only risk capital you can afford to lose.
            </div>
          </div>

          <!-- Footer -->
          <div style="padding: 20px 24px; background-color: #f8fafc; border-top: 1px solid #e2e8f0; text-align: center;">
            <p style="font-size: 11px; color: #6b7280; margin: 0 0 8px 0; line-height: 1.4;">
              Powered by Finnhub, Alpha Vantage, and Google Gemini
            </p>
            <p style="font-size: 10px; color: #9ca3af; margin: 0; line-height: 1.3;">
              Options trading involves risk. Past performance does not guarantee future results. 
              This newsletter is for educational purposes only and should not be considered personalized investment advice.
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

function getMarketRegimeDescription(vix) {
  if (vix < 15) return 'Low Volatility';
  if (vix < 25) return 'Normal Volatility';  
  if (vix < 35) return 'High Volatility';
  return 'Extreme Volatility';
}

function getVixGuidance(vix) {
  if (vix < 15) return 'Low fear, premium selling favored';
  if (vix < 25) return 'Normal conditions, balanced strategies';
  return 'High fear, consider premium buying';
}

export default EmailTemplate;