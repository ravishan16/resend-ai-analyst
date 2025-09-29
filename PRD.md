# Product Requirements Document (PRD): AI Stock Analyst Newsletter

## 1. Overview

This document outlines the product requirements for the AI Stock Analyst Newsletter, an autonomous agent that delivers daily, quantitative AI-powered trading analysis with volatility-based opportunity identification, probability of profit calculations, and sentiment-driven recommendations to retail options traders.

## 2. Vision & Goal

**Vision:** To empower retail traders with institutional-grade, quantitative AI-driven analysis that combines volatility metrics, sentiment analysis, and probability calculations to identify high-quality trading opportunities.

**Goal:** To create a fully autonomous system that scans the market for high-volatility earnings opportunities, performs quantitative analysis using multiple data sources, calculates probability of profit for various strategies, and delivers actionable recommendations with clear "STRONGLY CONSIDER" or "STAY AWAY" guidance in a professional daily newsletter.

## 3. Core Functionality (Enhanced MVP)

### 3.1. Daily Market Scan & Quantitative Analysis

-   **Trigger:** The system will run automatically every weekday morning at 8:00 AM UTC.
-   **Primary Data Source:** Finnhub API for earnings calendar and basic company data.
-   **Volatility Data Source:** Alpha Vantage API for quotes and historical volatility metrics, with deterministic fallback estimators when premium endpoints are unavailable.
-   **Stock Universe:** The scan will be limited to a curated list of liquid stocks from the S&P 500 and NASDAQ 100 (defined in `src/config.js`).
-   **Advanced Filtering:** The system will use a multi-factor scoring algorithm to identify opportunities based on:
    -   **Implied Volatility Percentile**: Prioritize stocks with IV > 50th percentile (high volatility environment)
    -   **Volatility Rank**: Current IV relative to 52-week high/low
    -   **Options Volume**: Minimum daily options volume for liquidity
    -   **Days to Earnings**: Optimal time window (7-30 days out)
    -   **Expected Move**: Calculated from Alpha Vantage pricing data with documented fallback bands when premium data is locked
-   **Output:** Top 5 highest-scoring opportunities with comprehensive volatility metrics.

### 3.2. Enhanced AI-Powered Analysis with Quantitative Foundation

-   **Core Engine:** Google Gemini API with enhanced prompt engineering for quantitative analysis.
-   **Data-Rich Prompts:** For each opportunity, the AI receives:
    -   Current implied volatility and historical percentile
    -   Historical volatility (30-day, 90-day)
    -   Expected earnings move and historical move accuracy
    -   Options chain data and volume metrics
    -   Technical indicators (RSI, Bollinger Bands)
-   **Required Analysis Output:**
    -   **Sentiment Score (1-10)**: Quantitative assessment of opportunity quality
    -   **Recommendation Grade**: "STRONGLY CONSIDER", "NEUTRAL", or "STAY AWAY"
    -   **Probability of Profit (POP)**: Calculated for each suggested strategy
    -   **Risk Assessment**: Maximum loss, expected profit, risk/reward ratio
    -   **Strategy Recommendations**: 2-3 specific options strategies with entry/exit criteria
-   **Quality Control**: Reject recommendations with POP < 55% or inadequate risk/reward ratios.

### 3.3. Professional Newsletter Delivery with React Email

-   **Email Service:** Resend API with React Email templates for professional formatting.
-   **Enhanced Content Structure:**
    -   **Executive Summary**: Market volatility overview and day's opportunity count
    -   **Volatility Dashboard**: VIX level, market IV environment
    -   **Opportunity Analysis**: For each stock:
        -   Company info and earnings date
        -   Volatility metrics (IV percentile, expected move)
        -   AI sentiment score and recommendation grade
        -   Detailed strategy recommendations with POP calculations
        -   Risk warnings and position sizing suggestions
    -   **Educational Section**: Brief explanation of key concepts
    -   **Disclaimer**: Comprehensive risk disclosures
-   **Audience:** Predefined audience in Resend with subscription management capabilities.

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
go-   **Run Status Notifications**: After every scheduled or manual run, email a Resend summary (status, metrics, errors) to the maintainer for operational visibility
-   **Human Oversight**: Logging and monitoring capabilities for manual review

## 7. Future Features (Post-Enhanced MVP)

-   **Performance Tracking**: Database to track recommendation success rates and user feedback.
-   **User Management:** A web interface for users to subscribe and unsubscribe, with a Cloudflare D1 database for subscriber management.
-   **Enhanced Robustness:** Advanced retry logic, error notifications, and comprehensive logging dashboard.
-   **Automated Testing:** A full suite of unit and integration tests with CI/CD pipeline.
-   **Human-in-the-Loop:** A review and approval workflow for the generated content before it's sent.
-   **Multi-Timeframe Analysis:** Extend beyond earnings to include technical breakouts and volatility expansion events.
-   **Portfolio Integration:** Suggestions for position sizing and portfolio risk management.
