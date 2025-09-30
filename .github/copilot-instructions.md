# Options Insight - AI Coding Agent Instructions

## System Overview

**Options Insight** is a serverless quantitative finance newsletter system built on Cloudflare Workers. It automatically scans earnings calendars, performs volatility analysis using real market data, generates AI-powered trading insights, and delivers professional newsletters via email.

### Core Pipeline Architecture

The system follows a **7-stage deterministic pipeline** with comprehensive error handling and graceful degradation:

```
Environment → Data Init → Earnings Scan → Market Context → AI Analysis → Validation → Newsletter Delivery
```

Each stage tracks success/failure in a `summary` object and continues gracefully with fallbacks. **Reliability over features** - the newsletter always runs, even with degraded data sources.

## Essential Architectural Patterns

### 1. Multi-Source Data Pipeline with Graceful Degradation

The system uses a **simplified resilient data strategy** prioritizing proven free APIs:

```javascript
// Primary: Yahoo Finance (100% reliable for quotes + historical data)
// Fallback: Finnhub (reliable quotes, blocked historical on free tier)  
// Final: Estimated data (never fail the pipeline)

const provider = new SimplifiedDataProvider({
    finnhubApiKey: process.env.FINNHUB_API_KEY,
    requestDelay: 1200 // Respect rate limits
});
```

**Key Principle:** Never fail the entire pipeline due to one API error. Always provide fallback data.

### 2. Rate-Limited API Integration

Financial APIs have strict limits. The system uses explicit delays and comprehensive error handling:

```javascript
// Yahoo Finance + Finnhub strategy with 1.2s delays
for (const symbol of symbols) {
    const analysis = await provider.getVolatilityAnalysis(symbol);
    if (symbols.indexOf(symbol) < symbols.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 1200));
    }
}
```

**Pattern:** Respect external API limits with explicit delays and retry logic.

### 3. Emoji-Prefixed Structured Logging

```javascript
console.log("🎯 Running Options Insight Research Agent...");
console.log("📊 Scanning earnings opportunities...");  
console.log("🤖 Generating AI analysis...");
console.log("📧 Sending newsletter...");
```

**Pattern:** Each component has emoji identifiers for easy visual parsing in production logs.

## Development Workflow

### CLI-First Component Testing

The project prioritizes **component isolation** via comprehensive CLI commands:

```bash
make test-finnhub      # Test earnings data fetching
make test-alphavantage # Test volatility analysis  
make test-gemini       # Test AI analysis generation
make test-email        # Test newsletter rendering
make test-full-run     # End-to-end pipeline simulation
make preview-email     # Local newsletter preview
```

**Development Rule:** Always test components individually before integration.

### Environment & Deployment

```bash
# Local development
make push-secrets      # Sync .env to Cloudflare Workers
make verify-deployment # Production health checks

# Testing new implementations  
node test-simplified.js    # Test data provider changes
node test-data-sources.js  # Compare API reliability
```

**Security:** Never commit API keys. Use `make push-secrets` for production deployment.

### API Security & CORS

The `/subscribe` endpoint implements pattern-based CORS validation:

```javascript
// Supports wildcard domains like *.pages.dev for preview environments
function resolveAllowedOrigin(origin, allowedOrigins) {
    for (const allowed of allowedOrigins) {
        if (allowed.includes('*')) {
            const pattern = allowed.replace(/[.+?^${}()|[\]\\]/g, '\\$&').replace(/\*/g, '.*');
            const regex = new RegExp(`^${pattern}$`, 'i');
            if (regex.test(origin)) return origin;
        }
    }
}
```

## Data Models & External APIs

### Stock Universe Filtering

Analysis is restricted to **liquid S&P 500 + NASDAQ 100 stocks** to ensure data quality:

```javascript
// src/config.js - Curated universe prevents analysis of illiquid names
export const STOCK_UNIVERSE = [
  'AAPL', 'MSFT', 'GOOGL', 'AMZN', 'NVDA', 'META', 'TSLA', // ...
];
```

### Financial Data Sources

- **Yahoo Finance:** Primary source (free, 100% reliable for quotes + historical data)
- **Finnhub:** Fallback quotes + earnings calendar (60 calls/min free tier)
- **Alpha Vantage:** Legacy fallback (25 calls/day, historical data requires premium)
- **Google Gemini:** AI analysis with structured validation
- **Resend:** Newsletter delivery with audience management

### Volatility Scoring System

Consistent scoring algorithm works with both real and estimated data:

```javascript
// src/real-volatility.js - unified scoring across all data sources
export function calculateVolatilityScore(volatilityData) {
    if (!volatilityData) return 0;
    
    const ivPercentile = volatilityData.impliedVolatilityPercentile || 50;
    const ivRank = volatilityData.impliedVolatilityRank || 0;
    const liquidity = volatilityData.optionsVolume || 0;
    
    return (ivPercentile * 0.4) + (ivRank * 0.4) + (Math.min(liquidity / 10000, 10) * 0.2);
}
```

## Testing & Quality Gates

### AI Analysis Validation

Every AI-generated analysis passes validation before newsletter inclusion:

```javascript
// src/gemini.js - Never trust AI output without validation
export function validateAnalysis(analysis) {
    const issues = [];
    if (!analysis.sentimentScore || analysis.sentimentScore < 1) {
        issues.push('Invalid sentiment score');
    }
    if (!analysis.strategies || analysis.strategies.length === 0) {
        issues.push('No strategies provided');
    }
    return { isValid: issues.length === 0, issues };
}
```

### Newsletter Delivery Scenarios

The system handles three graceful degradation levels:
1. **Optimal:** Real data + AI analysis → Full newsletter
2. **Degraded:** Limited data → Context-only newsletter with market overview  
3. **Minimal:** Quality gate failures → Newsletter with explanation + fallback content

**Pattern:** Use quality gates to maintain newsletter standards while ensuring delivery.

## Deployment & Operations

### Production Endpoints

- `GET /health` - System liveness probe
- `GET /status` - Configuration audit (API keys masked)
- `POST /trigger` - Manual pipeline execution (auth: `x-trigger-secret`)
- `POST /subscribe` - CORS-protected subscription management

### Monitoring & Observability

Every pipeline run generates comprehensive telemetry:
- **Summary Email:** Sent to `SUMMARY_EMAIL_RECIPIENT` with step-by-step status
- **Metrics:** Opportunities found, analyses generated, newsletter broadcast ID
- **Error Tracking:** Stack traces with context for debugging
- **Performance:** Timing data for optimization

### CI/CD Pipeline

```bash
# Automated workflow (.github/workflows/)
PR → Unit tests + Wrangler compilation check (Node.js 20)
main → Auto-deploy Workers + Pages site
```

**Deployment Strategy:** Zero-downtime with automatic rollback on health check failure.

## Common Patterns & Anti-Patterns

### ✅ Best Practices

- **Resilient Design:** Implement graceful degradation for API failures
- **Visual Logging:** Use emoji-prefixed logs for production parsing
- **Component Testing:** Validate individual modules via CLI before integration  
- **Data Validation:** Never trust external APIs or AI without quality checks
- **Rate Limiting:** Respect API constraints with explicit delays
- **Environment Config:** Use environment variables for all sensitive data

### ❌ Anti-Patterns

- **Pipeline Failures:** Never fail entire system due to single API error
- **Trust Issues:** Don't assume external APIs are reliable without fallbacks
- **Hardcoded Values:** Avoid constants - use `src/config.js` for business logic
- **Security Leaks:** Never commit API keys or expose in logs
- **Quality Bypass:** Don't send newsletters without validation gates

## File Structure Quick Reference

```
src/
├── index.js              # Main Worker entry + pipeline orchestration
├── config.js             # Business logic: stock universe, thresholds
├── finnhub.js            # Earnings calendar + opportunity filtering
├── real-volatility.js    # Multi-source volatility analysis
├── simplified-data.js    # Resilient data provider (Yahoo + Finnhub)
├── gemini.js             # AI analysis generation + validation
├── email-template.js     # React Email rendering (template literals)
├── email.js              # Resend integration + audience management
└── cli.js                # Component testing + development workflow

pages/                    # Cloudflare Pages signup site
tests/                    # Vitest unit tests  
.github/workflows/        # CI/CD automation
```

This architecture prioritizes **reliability over features** - the newsletter always runs, even with degraded data sources.