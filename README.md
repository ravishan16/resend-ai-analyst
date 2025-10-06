# Options Insight – Quantitative Earnings Research Agent

<p align="left">
   <a href="https://github.com/ravishan16/options-insight/actions/workflows/ci.yml">
      <img alt="CI" src="https://github.com/ravishan16/options-insight/actions/workflows/ci.yml/badge.svg" />
   </a>
   <a href="https://codecov.io/gh/ravishan16/options-insight">
      <img alt="Coverage" src="https://codecov.io/gh/ravishan16/options-insight/branch/main/graph/badge.svg" />
   </a>
   <a href="https://github.com/ravishan16/options-insight/actions/workflows/deploy.yml">
      <img alt="Deploy" src="https://github.com/ravishan16/options-insight/actions/workflows/deploy.yml/badge.svg" />
   </a>
   <a href="LICENSE">
      <img alt="License" src="https://img.shields.io/badge/license-MIT-%23B45F4D" />
   </a>
   <a href="https://options-insight.ravishankars.com/" target="_blank">
      <img alt="Subscribe" src="https://img.shields.io/badge/subscribe-options--insight.ravishankars.com-%23DDBEA9" />
   </a>
</p>

## TL;DR
- **What it is:** Options Insight gives retail traders an edge by automatically analyzing upcoming earnings, enriching them with volatility and sentiment data, and delivering a powerful, easy-to-read newsletter to your inbox every morning.
- **Why it matters:** Retail options traders get institutional-style prep without the manual grind—quantitative stats, AI commentary, and playbook-ready strategies arrive every weekday morning.
- **Performance:** Yahoo Finance optimized architecture delivering sub-200ms quotes with 100% reliability and 69/69 passing tests.
- **Subscribe:** Preview the latest briefing and join the list at [options-insight.ravishankars.com](https://options-insight.ravishankars.com/).

## Newsletter Sample
![Newsletter Sample](assets/newsletter-sample.png)

---

## Why this Exists
The modern options workflow is still a patchwork of screeners, spreadsheets, and ad-hoc AI prompts. Options Insight packages that routine into a deterministic, reviewable pipeline. Every run follows the same recipe—scan > filter > analyze > narrate > publish—so traders start their day with context they can trust rather than intuition they have to second-guess.

---

## How the System Works (Optimized Pipeline)
1. **Market Radar** – Finnhub's earnings calendar is filtered to a curated universe (`src/config.js`) and a 1–45 day lookahead window.
2. **Yahoo Finance Primary** – High-performance data provider with **sub-200ms quote responses** and complete historical data coverage. Smart caching reduces redundant API calls during bulk operations.
3. **Quant Analysis** – `simplified-data.js` calculates real historical volatility, RSI indicators, and 5-week price ranges with composite quality scoring for opportunity ranking.
4. **AI Briefing** – Google Gemini transforms the quantitative analysis into human-friendly strategy recommendations, validated through quality gates in `gemini.js`.
5. **Professional Delivery** – Mobile-optimized React Email template with individual stock analysis and Resend broadcast delivery with automatic unsubscribe handling.

---

## Performance Architecture

### 🚀 Yahoo Finance Optimized
- **Primary Data Source:** Yahoo Finance (100% reliable, free, fast)
- **Quote Performance:** 67-255ms average response time
- **Historical Data:** Complete 60-day volatility calculations
- **Caching:** 5-minute intelligent caching for bulk operations
- **Rate Limiting:** Optimized 500ms delays (vs previous 1200ms)

### 📊 Data Quality Metrics
- **Success Rate:** 100% Yahoo Finance reliability
- **Fallback Usage:** <1% (Finnhub rarely needed)
- **Real Data Coverage:** 100% (no estimated volatility required)
- **Test Coverage:** 69/69 tests passing, 95%+ coverage on core modules

---

## Architecture at a Glance

```mermaid
flowchart TD
   classDef data fill:#F3E2D5,stroke:#B45F4D,stroke-width:1px,color:#3A3A3A
   classDef worker fill:#FDFDFD,stroke:#E4C590,stroke-width:1.6px,color:#3A3A3A
   classDef delivery fill:#DDBEA9,stroke:#B45F4D,stroke-width:1px,color:#3A3A3A
   classDef touch fill:#FAF6F0,stroke:#B45F4D,stroke-width:1px,color:#3A3A3A

   F["📅 Finnhub<br/>Earnings Calendar"]:::data
   Y["🚀 Yahoo Finance<br/>Quotes & Historical Data<br/>(Primary - 100% reliable)"]:::data
   FH["💼 Finnhub<br/>Quote Fallback<br/>(Rare usage)"]:::data
   G["🧠 Google Gemini<br/>Narrative AI"]:::data

   U["👤 Retail Trader<br/>Subscriber Persona"]:::touch
   Signup["📝 Signup Page<br/>Cloudflare Pages"]:::touch

   S["⏱ Scheduler & API<br/>(src/index.js)"]:::worker
   Sub["🛡 Subscribe Endpoint<br/>(POST /subscribe)"]:::worker
   P["📊 Opportunity Scan<br/>(src/finnhub.js)"]:::worker
   V["📈 Volatility Analysis<br/>(src/simplified-data.js)<br/>⚡ Cached & Optimized"]:::worker
   Q["✅ Quality Gates<br/>(validateAnalysis)"]:::worker
   T["🖋 Email Composer<br/>(src/email-template.js)"]:::worker

   Audience["📇 Resend Audience<br/>Contacts"]:::delivery
   R["✉️ Resend Broadcast"]:::delivery
   L["📥 Subscriber Inbox"]:::delivery
   Unsub["🚪 One-click Unsubscribe<br/>Resend-managed"]:::delivery

   F --> P
   Y --> V
   FH -.-> V
   P --> V --> Q --> T --> R --> L --> Unsub --> Audience
   G --> Q
   S --> P
   S --> R
   U --> Signup --> Sub --> Audience
```

The system pairs market intelligence with the human journey: traders discover the signup page, opt in via the Worker's protected `/subscribe` endpoint, get added to the Resend audience, and receive daily research with an always-on unsubscribe loop managed by Resend.

**Performance Highlights:**
- **Yahoo Finance Primary:** Sub-200ms response times, 100% reliability
- **Smart Caching:** 5-minute TTL reduces API calls during bulk operations  
- **Graceful Fallbacks:** Finnhub backup (rarely used) ensures zero downtime
- **Real Data Focus:** Historical volatility calculations using actual market data

---

## Data & Intelligence Stack

| Layer | Service | Purpose | Performance Notes |
| --- | --- | --- | --- |
| Market Events | **Finnhub** | Earnings calendar & VIX quote | Free tier 60 calls/min; configured via `FINNHUB_API_KEY` |
| **Primary Data** | **Yahoo Finance** | **Quotes & historical volatility** | **100% reliable, sub-200ms response, no API limits** |
| Fallback Data | Finnhub | Quote backup | <1% usage rate; automatic failover |
| AI Narrative | **Google Gemini** | Sentiment, strategy articulation | Model: `gemini-pro-latest`; validated before inclusion |
| Delivery | **Resend** | Broadcast the React Email digest | Audience ID stored in secrets |
| Compute | **Cloudflare Workers** | Cron trigger, API endpoints, pipeline orchestration | Runs at 08:00 UTC weekdays (see `wrangler.toml`) |

### 🚀 Performance Optimizations
- **Yahoo Finance Primary:** 67-255ms average quote response time
- **Smart Caching:** 5-minute TTL reduces redundant API calls by ~80%
- **Rate Optimization:** 500ms delays = 58% faster bulk processing
- **Real Data Focus:** 100% historical volatility from actual market data (no estimates needed)

---

## Daily Research Workflow (Optimized Pipeline)

1. **Scan Universe** – `getEarningsOpportunities` pulls 45 days of earnings, filters by curated tickers, and scores timing + liquidity.
2. **Yahoo Finance Volatility** – `SimplifiedDataProvider` fetches real-time quotes (sub-200ms) and historical volatility from Yahoo Finance with intelligent caching for bulk operations.
3. **Quality Gate** – Composite `volatilityScore` + `validateAnalysis` thresholds keep low-information names out of the email using real market data.
4. **Narrative Generation** – Gemini receives the quantitative snapshot plus market regime context (`getMarketContext`) and returns a structured brief.
5. **Rendering & Send** – `EmailTemplate` renders the cards, and `sendEmailDigest` publishes through Resend.

Logging across each stage (prefixed with emoji) makes full-run transcripts easy to read—see `make test-full-run` output for an end-to-end rehearsal.

---

## Local Quickstart

### 1. Install Tooling
Ensure you are running **Node.js 20 or newer** (Wrangler and the Worker runtime require it).

```sh
npm install
```

### 2. Configure Secrets
Create `.env` (used by the CLI and Make targets):

```bash
FINNHUB_API_KEY=your_finnhub_key
GEMINI_API_KEY=your_gemini_key
RESEND_API_KEY=your_resend_key
AUDIENCE_ID=your_resend_audience_id
TRIGGER_AUTH_SECRET=your_shared_secret
SUMMARY_EMAIL_RECIPIENT=********@gmail.com
# Optional: restrict who can call POST /subscribe (comma-separated origins)
# SIGNUP_ALLOWED_ORIGINS=https://options-insight.pages.dev,https://yourdomain.com
# Optional override (defaults to alerts@ravishankars.com)
# SUMMARY_EMAIL_FROM=alerts@ravishankars.com
```

> **Rate-limit performance**
> - **Yahoo Finance:** No API limits, sub-200ms response times, 100% reliability
> - **Smart Caching:** 5-minute TTL reduces API calls by ~80% during bulk operations
> - **Finnhub:** 60 calls/min free tier—ample for daily earnings scans
> - **Optimized Delays:** 500ms between requests = 58% faster processing
> - **Gemini:** Quotas vary by account; failures default to skipping analysis so email still sends

### 3. Run Sanity Tests
```sh
make test-finnhub      # Earnings scan
make test-yahoo        # Quote + volatility pipeline
make test-email        # Render newsletter preview
```

### 4. Preview the Newsletter Locally
```sh
make preview-email
open email-preview.html
```

---

## Operations Playbook

| Scenario | Command | Description |
| --- | --- | --- |
| End-to-end smoke | `make test-full-run` | Simulates scheduler + delivery locally (uses rate-limit delays) |
| Component drill-down | `make test-<component>` | Finnhub, Yahoo Finance, volatility, Gemini, email, scoring |
| Cron dev server | `make dev` | Boots Wrangler with `/health`, `/status`, `/trigger` endpoints |
| Force a run (local Wrangler) | `curl http://localhost:8787/cdn-cgi/handler/scheduled` | Mimics the Cloudflare cron event |
| Authorized manual trigger | `curl -X POST -H "x-trigger-secret: $TRIGGER_AUTH_SECRET" https://.../trigger` | Requires shared secret header |
| Review run summary | Automatic | Every run sends a status email (success/errors, metrics) to `SUMMARY_EMAIL_RECIPIENT` via Resend |
| Public signup form | `pages/` | Static Cloudflare Pages site that posts to `/subscribe` and adds contacts to the configured Resend audience |

Logs intentionally announce every stage with emoji prefixes for easy parsing. Yahoo Finance successes show response times, while rare fallbacks to Finnhub are clearly marked.

---

## Deploying to Cloudflare

1. **Push secrets** – Copies `.env` values into Worker secrets:
   ```sh
   make push-secrets
   ```
2. **Deploy** – Publish the worker and schedule:
   ```sh
   make deploy
   ```
3. **Verify** – Health checks and config audit:
   ```sh
   make verify-deployment
   ```
4. **Manual trigger** – Useful during smoke testing (requires `TRIGGER_AUTH_SECRET` to be set locally):
   ```sh
   make trigger-production
   ```

### Production Endpoints
- `GET /health` – Liveness probe
- `GET /status` – API key inventory (masked) + readiness flag
- `POST /trigger` – Run the full pipeline on demand (requires `x-trigger-secret` header matching `TRIGGER_AUTH_SECRET`)
- `POST /subscribe` – CORS-protected endpoint for the Cloudflare Pages signup form. Only accepts requests from `SIGNUP_ALLOWED_ORIGINS` (defaults include local dev + Pages preview)

---

## Testing & Quality Assurance

The system maintains high test coverage with comprehensive unit tests and integration testing.

### Running Tests

```sh
# Run all tests
npm test

# Run tests with coverage report
npm run test:coverage

# Watch mode for development
npm run test:watch

# Interactive test UI
npm run test:ui
```

### Component Testing via CLI

```sh
# Individual component tests
make test-finnhub      # Earnings calendar data
make test-yahoo        # Volatility analysis with Yahoo Finance
make test-gemini       # AI analysis generation
make test-email        # Newsletter rendering
make preview-email     # Local newsletter preview

# Integration tests
make test-full-run     # End-to-end pipeline
```

### Coverage Thresholds

The project maintains **80%+ coverage** across:
- Lines of code
- Functions
- Branches  
- Statements

Coverage reports are automatically generated and uploaded to [Codecov](https://codecov.io/gh/ravishan16/options-insight) on every PR and main branch push.

---

## Roadmap & Next Bets
Directly aligned with the PRD:

- **Performance Attribution** – Track realized vs. forecast volatility and POP accuracy.
- **Indicator Deepening** – Expand the technical signal set (ADX, ATR trend, skew).
- **Risk Guardrails** – Incorporate position sizing heuristics and capital at risk warnings.
- **Human-in-the-loop** – Optional review queue before broadcasting.
- **Portfolio Memory** – Persist historical recommendations for analytics dashboards.

---

## Contributing

Community improvements are welcome! Please read the [contributing guide](CONTRIBUTING.md) for setup instructions, coding standards, and the review process. If you are unsure where to start, browse open issues labeled `good first issue` or open a discussion to propose an idea.

> **CI checks**: Every pull request runs an automated Wrangler dry-run compile on GitHub Actions (Node.js 20). Please make sure `npx wrangler deploy --dry-run` succeeds locally before pushing.

---

## Security Policy

Sensitive findings should **not** be reported through public issues. Instead, open a [private security advisory](https://github.com/ravishan16/options-insight/security/advisories/new) with detailed reproduction steps, or contact the maintainer directly via the email address on their GitHub profile. We will acknowledge reports within 72 hours.

---

## License

This repository is licensed under the [MIT License](LICENSE). When contributing, you agree that your submissions will be covered by the same license.

---

## Compliance & Disclaimers
- Outputs are educational quantitative research, not individualized investment advice.
- Options carry significant risk of loss; always confirm assumptions independently.
- Source code is open for transparency—contributions should preserve explanatory logging.

---

## Further Reading
- [Product Requirements Document](PRD.md) – Full background, success metrics, and future roadmap.
- `src/` – Component implementations referenced above (`finnhub.js`, `simplified-data.js`, `gemini.js`, `email-template.js`).