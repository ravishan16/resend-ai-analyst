# Product Requirements Document (PRD): Options Insight Newsletter

## 1. Overview

This document outlines the product requirements for Options Insight, an autonomous Cloudflare Worker that delivers weekday quantitative earnings analysis with volatility-based opportunity identification, AI-powered sentiment analysis, and specific options strategy recommendations to retail traders.

## 2. Vision & Goal

**Vision:** To empower retail traders with institutional-grade, quantitative analysis that combines real-time volatility metrics, technical indicators, and AI-driven sentiment analysis to identify high-quality earnings opportunities.

**Goal:** To create a fully autonomous system that scans earnings calendars, performs comprehensive volatility analysis using premium data sources, generates AI recommendations with quality validation, and delivers professional newsletters via mobile-optimized email templates.

## 3. Core Functionality (Current Implementation)

### 3.1. Daily Market Scan & Yahoo Finance Optimized Analysis

-   **Trigger:** Automated execution every weekday morning at 8:00 AM UTC via Cloudflare Workers cron.
-   **Primary Data Source:** Yahoo Finance API for quotes and historical data (67-255ms response times, 100% reliability).
-   **Earnings Calendar:** Finnhub API for comprehensive earnings schedule and market context (VIX).
-   **Stock Universe:** Curated list of liquid S&P 500 and NASDAQ 100 stocks (defined in `src/config.js`).
-   **Advanced Analytics:** Multi-factor quality scoring algorithm based on:
    -   **Real Historical Volatility**: 30-day calculated volatility from Yahoo Finance historical data
    -   **Implied Volatility Estimates**: Sophisticated estimation based on market characteristics
    -   **Technical Indicators**: RSI calculations and 5-week price ranges
    -   **Quality Scoring**: Composite score incorporating volatility, timing, and liquidity factors
    -   **Days to Earnings**: Optimal time window (1-45 days with preference for 14-21 days)
-   **Performance:** Intelligent 5-minute caching reduces API calls by ~80% during bulk operations.

### 3.2. AI-Powered Analysis with Quantitative Foundation

-   **Core Engine:** Google Gemini Pro with structured prompt engineering for quantitative analysis.
-   **Rich Data Context:** For each opportunity, AI receives:
    -   Current price, historical volatility, and implied volatility estimates
    -   Expected earnings move calculations and percentage impact
    -   RSI technical indicators and 5-week price range context
    -   Quality score and volatility ranking relative to universe
    -   Market regime context (VIX level and volatility environment)
-   **Structured Analysis Output:**
    -   **Sentiment Score (1-10)**: Quantitative assessment of opportunity attractiveness
    -   **Recommendation Classification**: "STRONGLY CONSIDER", "NEUTRAL", or "STAY AWAY"
    -   **Strategic Options**: 2-3 specific options strategies with entry timing
    -   **Risk Context**: Volatility assessment and position sizing guidance
-   **Quality Validation**: Multi-layer validation in `gemini.js` rejects inconsistent or low-quality analyses.

### 3.3. Professional Newsletter Delivery with Mobile Optimization

-   **Email Service:** Resend API with broadcast audience management and automatic unsubscribe handling.
-   **Template Engine:** React Email with mobile-responsive design optimized for mobile trading apps.
-   **Enhanced Content Structure:**
    -   **Market Context**: VIX level, volatility regime, and strategy guidance
    -   **Individual Analysis**: Each stock with sentiment score, recommendation badge, and key metrics
    -   **Metrics Display**: IV/HV ratios, expected move, quality scores, RSI, and 5-week ranges
    -   **Strategy Recommendations**: Specific options strategies with entry criteria
    -   **Educational Content**: Key terms definitions including RSI, volatility concepts, and quality scoring

### 3.4. Graceful Degradation & Reliability Architecture

-   **Resilient Design:** 7-stage pipeline with comprehensive error handling ensuring newsletter delivery even with partial data failures.
-   **Multi-Source Fallback:** Primary Yahoo Finance → Secondary Finnhub → Estimated data (never fail the pipeline).
-   **Quality Gates:** Three delivery scenarios:
    1. **Optimal:** Full real data with AI analysis (target scenario)
    2. **Degraded:** Limited data with market context and basic analysis
    3. **Minimal:** Quality gate failures → Newsletter with explanation and educational content
-   **Rate Limiting:** Intelligent 500ms delays between API calls with 5-minute caching to respect external API limits.
-   **Monitoring:** Comprehensive telemetry with summary emails, metrics tracking, and error reporting.

### 3.5. Public Signup and Audience Management

-   **Signup Surface:** Cloudflare Pages microsite (`pages/index.html`) deployed to production domain with branded landing content.
-   **CORS Protection:** Configurable allowed origins with wildcard support for preview environments.
-   **Audience Enrollment:** Successful submissions add contacts to Resend audience with acquisition metadata.
-   **Unsubscribe Management:** Automatic unsubscribe headers in every broadcast for compliance and user control.

## 4. Technical Architecture (Current Implementation)

### 4.1. Serverless Infrastructure
-   **Platform:** Cloudflare Workers with TypeScript support
-   **Deployment:** Automated via GitHub Actions with Wrangler CLI
-   **Pages Integration:** Cloudflare Pages for subscription landing page with CORS-protected signup
-   **Environment:** Complete configuration validation with 15+ environment variables

### 4.2. Data Sources & Integration
-   **Primary:** Yahoo Finance API (quotes, historical data, options volume estimation)
-   **Secondary:** Finnhub API (earnings calendar, market context, quote fallback)
-   **AI:** Google Gemini Pro with structured validation and quality scoring
-   **Email:** Resend API with broadcast management and automatic unsubscribe headers
-   **Performance:** Intelligent caching reduces API calls by ~80% during bulk operations

### 4.3. Quality Assurance & Testing
-   **Test Coverage:** 69/69 tests passing across 7 test files (email templates, AI validation, data providers)
-   **Component Testing:** CLI-driven individual component validation (`make test-*` commands)
-   **End-to-End:** Full pipeline simulation with `make test-full-run`
-   **Email Preview:** Local HTML preview generation with `make preview-email`

### 4.4. Development Workflow
-   **Environment Management:** `.env` file with `make push-secrets` for deployment
-   **Local Testing:** Node.js testing scripts for individual components
-   **Deployment Verification:** `make verify-deployment` for production health checks
-   **Debugging:** Emoji-prefixed structured logging for production visibility

## 5. User Experience & Interface

### 5.1. Newsletter Content & Mobile Optimization
-   **Mobile-First Design:** React Email templates optimized for mobile trading apps
-   **Content Structure:**
    -   Market context header with VIX and volatility regime
    -   Individual stock analysis cards with badges and key metrics
    -   Metrics table with IV/HV ratios, expected moves, RSI, and 5-week ranges
    -   Strategy recommendations with specific options strategies
    -   Educational key terms section with volatility and technical indicator definitions
-   **Visual Design:** Professional typography, color-coded sentiment badges, responsive tables

### 5.2. Subscription Management
-   **Landing Page:** Clean signup form on Cloudflare Pages with newsletter preview
-   **Email Compliance:** Automatic unsubscribe headers and Resend broadcast management
-   **CORS Protection:** Wildcard domain support for preview environments and production

## 6. Configuration & Environment Variables

### 6.1. Required API Keys
```bash
FINNHUB_API_KEY=<finnhub_api_key>           # Earnings calendar data
GEMINI_API_KEY=<gemini_api_key>             # AI analysis generation
RESEND_API_KEY=<resend_api_key>             # Email delivery service
```

### 6.2. Core Configuration
```bash
AUDIENCE_ID=<resend_audience_id>             # Newsletter subscriber list
TRIGGER_SECRET=<manual_trigger_secret>       # API endpoint protection
SUMMARY_EMAIL_RECIPIENT=<admin_email>        # Operational telemetry
CORS_ORIGINS=https://domain.com,*.pages.dev  # CORS protection
```

### 6.3. Optional Customization
```bash
MAX_OPPORTUNITIES=8                          # Analysis limit (default: 5)
MIN_DAYS_TO_EARNINGS=1                      # Opportunity window
MAX_DAYS_TO_EARNINGS=45                     # Extended analysis range
STOCK_UNIVERSE=AAPL,MSFT,GOOGL              # Custom stock list
```

## 7. Success Metrics & Performance

### 7.1. System Performance (Current Achievement)
-   **API Response Times:** 67-255ms for Yahoo Finance quotes (100% reliability)
-   **Pipeline Completion:** <2 minutes end-to-end with rate limiting
-   **Cache Efficiency:** ~80% API call reduction during bulk operations
-   **Test Coverage:** 69/69 tests passing across all components
-   **Reliability:** Graceful degradation ensures newsletter always delivers

### 7.2. Content Quality Metrics
-   **Opportunity Discovery:** 3-8 high-quality opportunities per day (configurable)
-   **AI Analysis Validation:** Multi-layer quality checks reject inconsistent analyses
-   **Data Accuracy:** Real historical volatility from Yahoo Finance + sophisticated IV estimation
-   **Technical Indicators:** RSI calculations and 5-week price ranges for comprehensive context

## 8. Deployment & Operations

### 8.1. Production Endpoints
-   `GET /health` - System liveness probe
-   `GET /status` - Configuration audit (API keys masked)
-   `POST /trigger` - Manual pipeline execution (auth: x-trigger-secret)
-   `POST /subscribe` - CORS-protected subscription management

### 8.2. Monitoring & Observability
-   **Pipeline Telemetry:** Comprehensive summary emails with step-by-step status
-   **Error Tracking:** Stack traces with context for debugging
-   **Performance Monitoring:** Timing data for optimization opportunities
-   **Newsletter Metrics:** Opportunities found, analyses generated, broadcast delivery confirmation

### 8.3. Operational Excellence
-   **Zero-Downtime Deployment:** Cloudflare Workers with automatic rollback
-   **Configuration Validation:** Pre-flight checks for all required environment variables
-   **Rate Limit Compliance:** Explicit delays and retry logic for external APIs
-   **Security:** No hardcoded credentials, masked API keys in logs, CORS protection

## 9. Risk Management & Compliance

### 9.1. Financial Disclaimers
-   **Investment Risk Warnings:** Clear statements about trading risks and potential losses
-   **Educational Purpose:** Content explicitly marked as educational, not investment advice
-   **Performance Disclaimers:** Past performance does not guarantee future results

### 9.2. Quality Controls
-   **Multi-Layer Validation:** AI output validation before newsletter inclusion
-   **Data Quality Checks:** Fallback systems prevent delivery with corrupted data
-   **Human Oversight:** Summary emails provide operational visibility and manual review capability

## 10. Future Enhancements (Post-Current Implementation)

### 10.1. Advanced Analytics
-   **Real-Time Options Data:** Direct options chain integration for precise implied volatility
-   **Machine Learning Models:** Predictive models for earnings move accuracy
-   **Backtesting Framework:** Historical strategy performance validation

### 10.2. User Experience Improvements
-   **Personalized Risk Settings:** Custom risk tolerance for strategy recommendations
-   **Interactive Dashboard:** Web-based analysis interface with deeper insights
-   **Performance Tracking:** Historical recommendation success metrics

### 10.3. Content Expansion
-   **Weekly Market Outlook:** Comprehensive volatility regime analysis
-   **Educational Series:** Advanced options strategies and risk management content
-   **Community Features:** User feedback and strategy discussion platform

## 3. Core Functionality (Enhanced MVP)

# Product Requirements Document (PRD): Options Insight Newsletter

## 1. Overview

This document outlines the product requirements for Options Insight, an autonomous Cloudflare Worker that delivers weekday quantitative earnings analysis with volatility-based opportunity identification, AI-powered sentiment analysis, and specific options strategy recommendations to retail traders.

## 2. Vision & Goal

**Vision:** To empower retail traders with institutional-grade, quantitative analysis that combines real-time volatility metrics, technical indicators, and AI-driven sentiment analysis to identify high-quality earnings opportunities.

**Goal:** To create a fully autonomous system that scans earnings calendars, performs comprehensive volatility analysis using premium data sources, generates AI recommendations with quality validation, and delivers professional newsletters via mobile-optimized email templates.

## 3. Core Functionality (Current Implementation)

### 3.1. Daily Market Scan & Yahoo Finance Optimized Analysis

-   **Trigger:** Automated execution every weekday morning at 8:00 AM UTC via Cloudflare Workers cron.
-   **Primary Data Source:** Yahoo Finance API for quotes and historical data (67-255ms response times, 100% reliability).
-   **Earnings Calendar:** Finnhub API for comprehensive earnings schedule and market context (VIX).
-   **Stock Universe:** Curated list of liquid S&P 500 and NASDAQ 100 stocks (defined in `src/config.js`).
-   **Advanced Analytics:** Multi-factor quality scoring algorithm based on:
    -   **Real Historical Volatility**: 30-day calculated volatility from Yahoo Finance historical data
    -   **Implied Volatility Estimates**: Sophisticated estimation based on market characteristics
    -   **Technical Indicators**: RSI calculations and 5-week price ranges
    -   **Quality Scoring**: Composite score incorporating volatility, timing, and liquidity factors
    -   **Days to Earnings**: Optimal time window (1-45 days with preference for 14-21 days)
-   **Performance:** Intelligent 5-minute caching reduces API calls by ~80% during bulk operations.

### 3.2. AI-Powered Analysis with Quantitative Foundation

-   **Core Engine:** Google Gemini Pro with structured prompt engineering for quantitative analysis.
-   **Rich Data Context:** For each opportunity, AI receives:
    -   Current price, historical volatility, and implied volatility estimates
    -   Expected earnings move calculations and percentage impact
    -   RSI technical indicators and 5-week price range context
    -   Quality score and volatility ranking relative to universe
    -   Market regime context (VIX level and volatility environment)
-   **Structured Analysis Output:**
    -   **Sentiment Score (1-10)**: Quantitative assessment of opportunity attractiveness
    -   **Recommendation Classification**: "STRONGLY CONSIDER", "NEUTRAL", or "STAY AWAY"
    -   **Strategic Options**: 2-3 specific options strategies with entry timing
    -   **Risk Context**: Volatility assessment and position sizing guidance
-   **Quality Validation**: Multi-layer validation in `gemini.js` rejects inconsistent or low-quality analyses.

### 3.3. Professional Newsletter Delivery with Mobile Optimization

-   **Email Service:** Resend API with broadcast audience management and automatic unsubscribe handling.
-   **Template Engine:** React Email with mobile-responsive design optimized for mobile trading apps.
-   **Enhanced Content Structure:**
    -   **Market Context**: VIX level, volatility regime, and strategy guidance
    -   **Individual Analysis**: Each stock with sentiment score, recommendation badge, and key metrics
    -   **Metrics Display**: IV/HV ratios, expected move, quality scores, RSI, and 5-week ranges
    -   **Strategy Recommendations**: Specific options strategies with entry criteria
    -   **Educational Content**: Key terms definitions including RSI, volatility concepts, and quality scoring
    -   **Opportunity Analysis**: For each stock:
        -   Company info and earnings date
        -   Volatility metrics (IV percentile, expected move)
        -   AI sentiment score and recommendation grade
        -   Detailed strategy recommendations with POP calculations
        -   Risk warnings and position sizing suggestions
    -   **Educational Section**: Brief explanation of key concepts
    -   **Disclaimer**: Comprehensive risk disclosures
-   **Audience:** Predefined audience in Resend with subscription management capabilities.

### 3.4. Public Signup and Audience Management

-   **Signup Surface:** Cloudflare Pages microsite (`pages/index.html`) deployed to the production domain [`https://options-insight.ravishankars.com/`](https://options-insight.ravishankars.com/) with branded landing content. Cloudflare continues to issue per-commit preview URLs (`https://<hash>.options-insight-signup.pages.dev`) for QA prior to release.
-   **Brand Palette:** The microsite mirrors the warm palette from [ravishankars.com](https://ravishankars.com/) via shared CSS variables (`--bg`, `--surface`, `--primary`, `--primary-dark`, `--accent`, etc.) to ensure visual continuity across marketing surfaces.
-   **CORS Guardrails:** `SIGNUP_ALLOWED_ORIGINS` secret restricts who can call `/subscribe`. Defaults include localhost, the production `options-insight.ravishankars.com` hostname, and the wildcard preview domains (`*.options-insight-signup.pages.dev`).
-   **Audience Enrollment:** Successful submissions add/merge contacts into the configured Resend audience with acquisition metadata.
-   **Unsubscribe Link:** Every broadcast footer renders Resend’s `{{{ unsubscribe_url }}}` so recipients can self-manage preferences without additional infrastructure.

## 4. Technical Architecture

-   **Compute:** Cloudflare Workers (scheduled cron job) with enhanced error handling and retry logic.
-   **Financial Data:** 
    -   **Primary:** Finnhub API for earnings calendar and company fundamentals
    -   **Volatility Data:** Alpha Vantage API for live quotes, historical volatility, and expected move calculations with calibrated fallback estimators when premium data is inaccessible
-   **AI Engine:** Google Gemini API with advanced prompt engineering for quantitative analysis.
-   **Email Delivery:** Resend API with React Email templates for professional formatting.
-   **Local Development:** Comprehensive Makefile with individual component testing capabilities.
-   **Data Processing:** Multi-stage pipeline with volatility analysis, POP calculations, and sentiment scoring.

## 5. Key Performance Metrics

### 5.1. Data Quality Metrics
-   **Volatility Coverage**: Percentage of opportunities with IV > 50th percentile
-   **Data Completeness**: Success rate of fetching required options and volatility data
-   **API Reliability**: Uptime and response time for Alpha Vantage and Finnhub APIs, including fallback activation rate

### 5.2. Analysis Quality Metrics
-   **Recommendation Distribution**: Balance of "STRONGLY CONSIDER" vs "STAY AWAY" recommendations
-   **POP Accuracy**: Track actual vs predicted probability of profit over time
-   **Sentiment Score Validation**: Correlation between sentiment scores and actual market performance

### 5.3. System Performance Metrics
-   **Execution Time**: Total processing time from data fetch to email delivery
-   **Error Rate**: Percentage of successful daily runs
-   **Email Delivery Rate**: Successful email delivery percentage

## 6. Risk Management & Compliance

### 6.1. Risk Disclosures
-   **Comprehensive Disclaimers**: Clear statements about investment risks and past performance
-   **Position Sizing Guidelines**: Recommendations for appropriate position sizes
-   **Stop Loss Suggestions**: Clear exit criteria for losing trades

### 6.2. Quality Controls
-   **POP Thresholds**: Minimum probability of profit requirements (55%+)
-   **Volatility Filters**: Reject opportunities with insufficient volatility or liquidity
-   **Secure Manual Trigger**: `/trigger` endpoint must require a signed shared-secret header to prevent unauthorized newsletter sends
-   **Run Status Notifications**: After every scheduled or manual run, email a Resend summary (status, metrics, errors) to the maintainer for operational visibility
-   **Human Oversight**: Logging and monitoring capabilities for manual review

## 7. Future Features (Post-Enhanced MVP)

-   **Performance Tracking**: Database to track recommendation success rates and user feedback.
-   **User Management:** A web interface for users to subscribe and unsubscribe, with a Cloudflare D1 database for subscriber management.
-   **Enhanced Robustness:** Advanced retry logic, error notifications, and comprehensive logging dashboard.
-   **Automated Testing:** A full suite of unit and integration tests with CI/CD pipeline.
-   **Human-in-the-Loop:** A review and approval workflow for the generated content before it's sent.
-   **Multi-Timeframe Analysis:** Extend beyond earnings to include technical breakouts and volatility expansion events.
-   **Portfolio Integration:** Suggestions for position sizing and portfolio risk management.
