# Options Insight

## 1. The Origin Story

After several years of trading options and following resources like Tasty Trade, my friends and I formed a small trading group where we regularly discuss options plays. Over time, we developed a consistent but manual workflow: scan for earnings opportunities, analyze volatility metrics, and then turn to ChatGPT or Gemini for additional market insights and strategy validation.

This process worked, but it was time-consuming and inconsistent. **Options Insight** was born from the desire to automate this exact workflow - not to replace our judgment, but to systematically execute the research process we were already doing manually. The goal is simple: take our proven approach and make it scalable, consistent, and continuously improving.

This isn't about creating another generic "AI trading bot." It's about codifying the systematic research process that serious options traders already follow, then iterating to make it better over time.

## 2. The Problem

Retail options traders need more than basic trading ideas - they need quantitative analysis that includes volatility metrics, probability of profit calculations, and clear sentiment-driven recommendations. Most existing solutions provide generic advice without the institutional-grade data analysis necessary for consistent profitability.

## 3. The Solution (Enhanced MVP)

**Options Insight** is an autonomous research agent that delivers a daily "Earnings Play" newsletter with comprehensive quantitative analysis:

**Core Enhancements:**
- **Volatility-Based Screening**: Uses implied volatility estimates and historical volatility analysis to identify high-opportunity trades
- **Real Market Data**: Live stock prices and calculated volatility metrics from Alpha Vantage
- **Sentiment Scoring**: Quantitative analysis with clear "STRONGLY CONSIDER" or "STAY AWAY" recommendations
- **Multi-Source Data**: Combines Finnhub earnings data with Alpha Vantage market data and volatility calculations
- **Professional Email Design**: Clean, institutional-quality presentation

The automated research workflow:

1.  **Advanced Market Scan:** Every morning, scans curated stock universe for earnings opportunities
2.  **Quantitative Filtering:** Uses multi-factor scoring based on IV percentile, options volume, and volatility rank
3.  **Deep Data Analysis:** Fetches options chains, historical volatility, and technical indicators
4.  **Quantitative Analysis:** Advanced prompts generate sentiment scores, POP calculations, and specific strategy recommendations
5.  **Professional Newsletter Delivery:** Clean template with volatility dashboard and comprehensive analysis

For detailed technical specifications, see the [Product Requirements Document (PRD.md)](PRD.md).

## 4. Project Status

This project is an **enhanced, production-ready MVP** with comprehensive quantitative analysis capabilities:

**✅ Implemented Features:**
- Multi-source data integration (Finnhub + Polygon.io)
- Volatility-based opportunity screening
- Quantitative sentiment analysis with POP calculations
- Professional email templates
- Comprehensive local testing framework
- Robust error handling and logging

**🔄 Current Development Focus:**
- Performance tracking and recommendation validation
- Advanced technical indicator integration
- Enhanced risk management features

## 5. Local Development & Testing

### 5.1. Environment Setup

1.  **Install dependencies:**
## 6. Key Features

### 6.1. Quantitative Analysis
- **Implied Volatility Analysis**: IV percentile, volatility rank, expected move calculations
- **Options Data Integration**: Volume, open interest, bid/ask analysis
- **Technical Indicators**: RSI, Bollinger Bands, momentum indicators
- **Historical Context**: 30/90-day volatility comparisons

### 6.2. Enhanced Recommendations
- **Sentiment Scoring**: 1-10 quantitative assessment of opportunity quality  
- **Clear Recommendations**: "STRONGLY CONSIDER", "NEUTRAL", or "STAY AWAY"
- **Strategy-Specific POP**: Calculated probability of profit for each recommended strategy
- **Risk Assessment**: Max loss, expected profit, risk/reward ratios

### 6.3. Professional Email Design
- **Volatility Dashboard**: Market overview and VIX context
- **Opportunity Cards**: Clean, data-rich presentation for each stock
- **Educational Content**: Brief explanations of key concepts
- **Mobile-Optimized**: Templates for perfect rendering

## 7. Architecture Overview

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   Finnhub API   │    │  Alpha Vantage   │    │   Gemini API    │
│ (Earnings Data) │    │ (Market Data)    │    │ (Analysis)      │
└─────────┬───────┘    └─────────┬────────┘    └─────────┬───────┘
          │                      │                       │
          └──────────┬───────────┴───────────────────────┘
                     │
        ┌────────────▼─────────────┐
        │   Cloudflare Worker      │
        │  ┌─────────────────────┐ │
        │  │ Volatility Analysis │ │
        │  │ Scoring Algorithm   │ │  
        │  │ Research Engine     │ │
        │  └─────────────────────┘ │
        └────────────┬─────────────┘
                     │
        ┌────────────▼─────────────┐
        │     Resend API           │
        │  (Email Template)        │
        └──────────────────────────┘
```

## 8. Production Deployment

### 8.1. Pre-deployment Checklist
- [ ] All API keys configured in Cloudflare Worker environment
- [ ] Local testing completed successfully  
- [ ] Email templates validated
- [ ] Audience ID configured in Resend
- [ ] Cron schedule verified (8:00 AM UTC weekdays)

### 8.2. Deployment Commands
```sh
# Push environment variables to Cloudflare
make push-secrets

# Deploy to production
make deploy

# Verify deployment  
make verify-deployment

# Manually trigger newsletter (for testing)
make trigger-production

# Monitor logs
make logs
```

### 8.3. Production Endpoints
Once deployed, your worker will have these endpoints:

- **`/health`** - Basic health check
- **`/status`** - API configuration status
- **`/trigger`** (POST) - Manually trigger newsletter processing

Example usage:
```sh
# Check health
curl https://your-worker.your-subdomain.workers.dev/health

# Check API configuration
curl https://your-worker.your-subdomain.workers.dev/status

# Manually trigger (for testing)
curl -X POST https://your-worker.your-subdomain.workers.dev/trigger
```2.  **Set up environment variables:**
    Create a `.env` file with the following keys:
    ```bash
    FINNHUB_API_KEY=your_finnhub_key          # Earnings calendar data
    ALPHA_VANTAGE_API_KEY=your_alpha_key      # Stock prices & volatility data  
    GEMINI_API_KEY=your_gemini_key           # AI analysis
    RESEND_API_KEY=your_resend_key           # Email delivery
    AUDIENCE_ID=your_resend_audience_id      # Email subscriber list
    ```

    **⚠️ Note on API Rate Limits:**
    - **Alpha Vantage Free Tier**: 25 calls per day - our system uses intelligent caching and fallback estimates
    - **Finnhub Free Tier**: 60 calls per minute - generous limits for earnings data
    - **Gemini Free Tier**: Rate limits vary - the system handles retries and fallbacks

### 5.2. Component Testing

Use the enhanced Makefile for comprehensive testing:

```sh
# Test individual components
make test-finnhub          # Test earnings data fetching
make test-alphavantage     # Test stock prices & volatility data
make test-volatility       # Test volatility analysis pipeline
make test-gemini           # Test AI analysis with sample data
make test-email            # Test email template and delivery
make test-scoring          # Test opportunity scoring algorithm

# Integration testing
make test-pipeline         # Test complete data pipeline
make test-full-run         # Simulate complete daily run

# Development server
make dev                   # Start local development server
make deploy                # Deploy to Cloudflare Workers
```

### 5.3. Testing the Scheduled Worker Locally

To test the complete scheduled worker functionality:

1. **Start the local development server:**
   ```sh
   make dev
   # Or directly with wrangler:
   npx wrangler dev
   ```

2. **Trigger the scheduled event:** In a separate terminal, simulate the cron trigger:
   ```sh
   curl "http://localhost:8787/cdn-cgi/handler/scheduled"
   ```

This will execute the complete daily workflow including:
- Scanning earnings opportunities
- Fetching volatility data (respecting API rate limits)
- Generating AI analyses
- Sending the newsletter

### 5.4. Manual Testing & Debugging

**Test complete workflow locally:**
```sh
# Run the complete pipeline with debug output
make debug-run

# Test with specific stock symbols
make test-stock SYMBOL=AAPL

# Validate email template rendering
make preview-email
```

**Test individual components:**
```sh
make test-finnhub          # Test earnings data fetching
make test-alphavantage     # Test stock prices & volatility data
make test-volatility       # Test volatility analysis pipeline
make test-gemini           # Test AI analysis with sample data
make test-email            # Test email template and delivery
make test-scoring          # Test opportunity scoring algorithm

# Integration testing
make test-pipeline         # Test complete data pipeline
make test-full-run         # Simulate complete daily run
```
