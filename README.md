# AI Stock Analyst Newsletter

## 1. The Problem

Retail options traders need more than basic trading ideas - they need quantitative analysis that includes volatility metrics, probability of profit calculations, and clear sentiment-driven recommendations. Most existing solutions provide generic advice without the institutional-grade data analysis necessary for consistent profitability.

## 2. The Solution (Enhanced MVP)

This project is an autonomous AI agent that delivers a daily "Earnings Play" newsletter with comprehensive quantitative analysis:

**Core Enhancements:**
- **Volatility-Based Screening**: Uses implied volatility percentiles and volatility rank to identify high-opportunity trades
- **Probability of Profit (POP) Calculations**: Quantitative assessment of strategy success likelihood
- **Sentiment Scoring**: AI-driven analysis with clear "STRONGLY CONSIDER" or "STAY AWAY" recommendations
- **Multi-Source Data**: Combines Finnhub earnings data with Polygon.io options and volatility metrics
- **Professional Email Design**: React Email templates for institutional-quality presentation

The agent's enhanced workflow:

1.  **Advanced Market Scan:** Every morning, scans curated stock universe for earnings opportunities
2.  **Quantitative Filtering:** Uses multi-factor scoring based on IV percentile, options volume, and volatility rank
3.  **Deep Data Analysis:** Fetches options chains, historical volatility, and technical indicators
4.  **AI-Powered Quantitative Analysis:** Enhanced prompts generate sentiment scores, POP calculations, and specific strategy recommendations
5.  **Professional Newsletter Delivery:** React Email template with volatility dashboard and comprehensive analysis

For detailed technical specifications, see the [Product Requirements Document (PRD.md)](PRD.md).

## 3. Project Status

This project is an **enhanced, production-ready MVP** with comprehensive quantitative analysis capabilities:

**✅ Implemented Features:**
- Multi-source data integration (Finnhub + Polygon.io)
- Volatility-based opportunity screening
- AI-powered sentiment analysis with POP calculations
- Professional React Email templates
- Comprehensive local testing framework
- Robust error handling and logging

**🔄 Current Development Focus:**
- Performance tracking and recommendation validation
- Advanced technical indicator integration
- Enhanced risk management features

## 4. Local Development & Testing

### 4.1. Environment Setup

1.  **Install dependencies:**
## 5. Key Features

### 5.1. Quantitative Analysis
- **Implied Volatility Analysis**: IV percentile, volatility rank, expected move calculations
- **Options Data Integration**: Volume, open interest, bid/ask analysis
- **Technical Indicators**: RSI, Bollinger Bands, momentum indicators
- **Historical Context**: 30/90-day volatility comparisons

### 5.2. AI-Enhanced Recommendations
- **Sentiment Scoring**: 1-10 quantitative assessment of opportunity quality  
- **Clear Recommendations**: "STRONGLY CONSIDER", "NEUTRAL", or "STAY AWAY"
- **Strategy-Specific POP**: Calculated probability of profit for each recommended strategy
- **Risk Assessment**: Max loss, expected profit, risk/reward ratios

### 5.3. Professional Email Design
- **Volatility Dashboard**: Market overview and VIX context
- **Opportunity Cards**: Clean, data-rich presentation for each stock
- **Educational Content**: Brief explanations of key concepts
- **Mobile-Optimized**: React Email templates for perfect rendering

## 6. Architecture Overview

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   Finnhub API   │    │   Polygon.io     │    │   Gemini API    │
│ (Earnings Data) │    │ (Options/Vol)    │    │ (AI Analysis)   │
└─────────┬───────┘    └─────────┬────────┘    └─────────┬───────┘
          │                      │                       │
          └──────────┬───────────┴───────────────────────┘
                     │
        ┌────────────▼─────────────┐
        │   Cloudflare Worker      │
        │  ┌─────────────────────┐ │
        │  │ Volatility Analysis │ │
        │  │ Scoring Algorithm   │ │  
        │  │ AI Prompt Engine    │ │
        │  └─────────────────────┘ │
        └────────────┬─────────────┘
                     │
        ┌────────────▼─────────────┐
        │     Resend API           │
        │  (React Email Template)  │
        └──────────────────────────┘
```

## 7. Production Deployment

### 7.1. Pre-deployment Checklist
- [ ] All API keys configured in Cloudflare Worker environment
- [ ] Local testing completed successfully  
- [ ] Email templates validated
- [ ] Audience ID configured in Resend
- [ ] Cron schedule verified (8:00 AM UTC weekdays)

### 7.2. Deployment Commands
```sh
# Deploy to production
make deploy

# Verify deployment  
make verify-deployment

# Monitor logs
make logs
```2.  **Set up environment variables:**
    Create a `.env` file with the following keys:
    ```bash
    FINNHUB_API_KEY=your_finnhub_key          # Earnings calendar data
    POLYGON_API_KEY=your_polygon_key          # Options & volatility data  
    GEMINI_API_KEY=your_gemini_key           # AI analysis
    RESEND_API_KEY=your_resend_key           # Email delivery
    AUDIENCE_ID=your_resend_audience_id      # Email subscriber list
    ```

    **⚠️ Note on API Rate Limits:**
    - **Polygon.io Free Tier**: 5 calls per minute - our system automatically manages this with intelligent batching and delays
    - **Finnhub Free Tier**: 60 calls per minute - generous limits for earnings data
    - **Gemini Free Tier**: Rate limits vary - the system handles retries and fallbacks

### 4.2. Component Testing

Use the enhanced Makefile for comprehensive testing:

```sh
# Test individual components
make test-finnhub          # Test earnings data fetching
make test-polygon          # Test options & volatility data
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

### 4.3. Manual Testing & Debugging

**Test complete workflow locally:**
```sh
# Run the complete pipeline with debug output
make debug-run

# Test with specific stock symbols
make test-stock SYMBOL=AAPL

# Validate email template rendering
make preview-email
```

**Simulate scheduled execution:**
```sh
# While dev server is running, trigger manual execution
curl "http://localhost:8787/cdn-cgi/handler/scheduled"
```
