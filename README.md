# AI Stock Analyst Newsletter

## 1. The Problem

Retail options traders, particularly those following methodologies like tastytrade's, constantly hunt for opportunities based on market volatility. A primary source of predictable volatility is a company's upcoming earnings announcement, which often leads to a spike in a stock's Implied Volatility (IV).

Identifying these "earnings plays" is a manual and time-consuming process. It requires a trader to:
-   Scan hundreds of stocks daily.
-   Keep track of the earnings calendar for each one.
-   Filter for opportunities within a specific timeframe (e.g., the next 45 days).
-   Stay updated on market news to understand the context.

This manual effort is a significant barrier and means many potential opportunities are missed.

## 2. The Solution (MVP)

This project is an autonomous AI agent that solves this problem by delivering a daily "Earnings Play" newsletter.

The agent automatically performs the analysis and delivers a concise, actionable digest with the **top 5 trading ideas** for the day. The core workflow is fully automated:

1.  **Daily Scan:** Every morning, a scheduled worker scans all stocks in the NASDAQ 100 and S&P 500.
2.  **Filter & Rank:** It identifies stocks with earnings announcements in the next 45 days and ranks them by market cap and date proximity to find the "top 5".
3.  **AI-Powered Analysis:** The agent feeds the data for the top 5 stocks to an LLM. The AI, acting as a financial analyst, writes a brief, insightful summary for each.
4.  **Immediate Delivery:** The final digest is immediately sent via email to all active subscribers.

Users can subscribe and unsubscribe through a simple web interface. The system will also handle email bounces to maintain a clean subscriber list.

## 3. Architecture

The entire system is designed to be robust, scalable, and cost-effective, running entirely on a serverless platform.

-   **Compute & API:** **Cloudflare Workers** are used for both:
    -   A `cron` triggered worker that runs the daily analysis and email dispatch.
    -   An HTTP worker that handles user `subscribe` and `unsubscribe` requests.

-   **Frontend:** **Cloudflare Pages** hosts the static HTML/JavaScript landing page for subscriptions.

-   **Database:** **Cloudflare D1**, a serverless SQLite database, stores the list of subscriber emails. It will also be used to manage a "do-not-send" list for bounced addresses.

-   **Financial Data:** The **Finnhub API** provides the core market data and earnings calendar.

-   **Email Delivery:** **Resend** is used for reliably delivering the daily newsletter. The system leverages Resend's **Audiences** feature for subscriber management and the **Broadcasts API** to efficiently send the digest to the entire audience at once. This is a more scalable and appropriate solution for a newsletter than sending to individual emails. The system will also be configured to receive bounce notifications to manage list hygiene.

-   **AI Brains:** A Large Language Model (e.g., Google Gemini) is used for the final synthesis of the trading ideas.

## 4. Stretch Goals

Once the MVP is complete, the following features can be added:

-   **Human-in-the-Loop Approval:** Implement a workflow where the generated digest is first saved as a `draft` in the D1 database. A notification is sent to a Slack channel with "Approve" and "Reject" buttons. A human decision then triggers the final send or cancellation.
-   **Advanced Scheduling:** Allow the approver in Slack to not only send the email but also schedule it for a specific time, leveraging Resend's scheduling feature.
