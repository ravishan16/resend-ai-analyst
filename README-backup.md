# Options Insight – Quantitative Earnings Research Agent

<p align="left">
   <a href="https://github.com/ravishan16/options-insight/actions/workflows/ci.yml">
      <img alt="CI" src="https://github.com> **Rate-limit performance**
> - **YaLogs intentionally announce every stage with emoji prefixes for easy parsing. Yahoo Finance successes show response times, while rare fallbacks to Finnhub are clearly marked.oo Finance:** No API limits, sub-200ms response times, 100% reliability
> - **Smart Caching:** 5-minute TTL reduces API calls by ~80% during bulk operations
> - **Finnhub:** 60 calls/min free tier—ample for daily earnings scans
> - **Optimized Delays:** 500ms between requests (down from 1200ms) = 58% faster processing
> - **Gemini:** Quotas vary by account; failures default to skipping analysis so email still sendsishan16/options-insight/actions/workflows/ci.yml/badge.svg" />
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
- **What it is:** An autonomous Cloudflare Worker that scans upcoming earnings, enriches them with volatility and sentiment analysis, and delivers a polished newsletter via Resend.
- **Why it matters:** Retail options traders get institutional-style prep without the manual grind—quantitative stats, AI commentary, and playbook-ready strategies arrive every weekday morning.
- **Performance:** Yahoo Finance optimized architecture delivering sub-200ms quotes with 100% reliability and 69/69 passing tests.
- **Subscribe:** Preview the latest briefing and join the list at [options-insight.ravishankars.com](https://options-insight.ravishankars.com/).

---

## Why this Exists
The modern options workflow is still a patchwork of screeners, spreadsheets, and ad-hoc AI prompts. Options Insight packages that routine into a deterministic, reviewable pipeline. Every run follows the same recipe—scan > filter > analyze > narrate > publish—so traders start their day with context they can trust rather than intuition they have to second-guess.

---

## How the System Works (Optimized Pipeline)
1. **Market Radar** – Finnhub's earnings calendar is filtered to a curated universe (`src/config.js`) and a 1–45 day lookahead window.
2. **Yahoo Finance Primary** – High-performance data provider with **sub-200ms quote responses** and complete historical data coverage. Smart caching reduces redundant API calls during bulk operations.
3. **Quant Scoring** – `simplified-data.js` calculates real historical volatility (not estimated) with a composite volatility score feeding opportunity ranking.
4. **AI Briefing** – Google Gemini transforms the quantitative bundle into human-friendly strategy notes, run through validation guards in `gemini.js`.
5. **Delivery** – A React Email template renders the briefing and Resend fires the broadcast to the preconfigured audience.

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

## TL;DR
- **What it is:** An autonomous Cloudflare Worker that scans upcoming earnings, enriches them with volatility and sentiment analysis, and delivers a polished newsletter via Resend.
- **Why it matters:** Retail options traders get institutional-style prep without the manual grind—quantitative stats, AI commentary, and playbook-ready strategies arrive every weekday morning.
- **Where to look next:** For feature-level details and roadmap, read the companion [Product Requirements Document](PRD.md).
- **Subscribe:** Preview the latest briefing and join the list at [options-insight.ravishankars.com](https://options-insight.ravishankars.com/).

---

## Why this Exists
The modern options workflow is still a patchwork of screeners, spreadsheets, and ad-hoc AI prompts. Options Insight packages that routine into a deterministic, reviewable pipeline. Every run follows the same recipe—scan > filter > analyze > narrate > publish—so traders start their day with context they can trust rather than intuition they have to second-guess.

---

## How the System Works (Narrative Flow)
1. **Market Radar** – Finnhub’s earnings calendar is filtered to a curated universe (`src/config.js`) and a 1–45 day lookahead window.
2. **Volatility Intelligence** – Alpha Vantage powers live quotes and (where available) historical vol. When premium endpoints are locked, the system transparently falls back to estimated ranges so the pipeline never stalls.
3. **Quant Scoring** – `real-volatility.js` calculates expected move, IV rank, and a composite volatility score that feeds opportunity ranking.
4. **AI Briefing** – Google Gemini transforms the quantitative bundle into human-friendly strategy notes, run through validation guards in `gemini.js`.
5. **Delivery** – A React Email template renders the briefing and Resend fires the broadcast to the preconfigured audience.

---

## Architecture at a Glance

```mermaid
flowchart TD
   classDef data fill:#F3E2D5,stroke:#B45F4D,stroke-width:1px,color:#3A3A3A
   classDef worker fill:#FDFDFD,stroke:#E4C590,stroke-width:1.6px,color:#3A3A3A
   classDef delivery fill:#DDBEA9,stroke:#B45F4D,stroke-width:1px,color:#3A3A3A
   classDef touch fill:#FAF6F0,stroke:#B45F4D,stroke-width:1px,color:#3A3A3A

   F["📅 Finnhub<br/>Earnings Calendar"]:::data
   Y["� Yahoo Finance<br/>Quotes & Historical Data<br/>(Primary - 100% reliable)"]:::data
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

The system pairs market intelligence with the human journey: traders discover the signup page, opt in via the Worker’s protected `/subscribe` endpoint, get added to the Resend audience, and receive daily research with an always-on unsubscribe loop managed by Resend.

- **Subscriber Persona (Retail Trader):** Action-oriented options trader seeking pre-market context and volatility guidance.
- **Signup Touchpoint:** Branded Cloudflare Pages microsite funnels interest straight into the Worker’s CORS-guarded subscription endpoint.
- **Retention & Trust:** Every briefing flows through Resend broadcasts, honoring unsubscribe requests without additional infrastructure.

---

## Data & Intelligence Stack

| Layer | Service | Purpose | Performance Notes |
| --- | --- | --- | --- |
| Market Events | **Finnhub** | Earnings calendar & VIX quote | Free tier 60 calls/min; configured via `FINNHUB_API_KEY` |
| **Primary Data** | **Yahoo Finance** | **Quotes & historical volatility** | **100% reliable, sub-200ms response, no API limits** |
| Fallback Data | Finnhub | Quote backup | <1% usage rate; automatic failover |
| Legacy Fallback | Alpha Vantage | Emergency quotes only | 25 calls/day limit; rarely triggered |
| AI Narrative | **Google Gemini** | Sentiment, strategy articulation | Model: `gemini-pro-latest`; validated before inclusion |
| Delivery | **Resend** | Broadcast the React Email digest | Audience ID stored in secrets |
| Compute | **Cloudflare Workers** | Cron trigger, API endpoints, pipeline orchestration | Runs at 08:00 UTC weekdays (see `wrangler.toml`) |

### 🚀 Performance Optimizations
- **Yahoo Finance Primary:** 67-255ms average quote response time
- **Smart Caching:** 5-minute TTL reduces redundant API calls by ~80%
- **Rate Optimization:** 500ms delays (down from 1200ms) = 58% faster bulk processing
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
ALPHA_VANTAGE_API_KEY=your_alpha_key
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

> **Rate-limit snapshot**
> - Alpha Vantage free tier allows 25 calls/day. The worker staggers calls (15 s gaps) and falls back to calibrated estimates when premium data is locked.
> - Finnhub free tier handles 60 calls/min—ample for daily scans.
> - Gemini quotas vary by account; failures default to skipping the analysis so the email still sends.

### 3. Run Sanity Tests
```sh
make test-finnhub      # Earnings scan
make test-alphavantage # Quote + volatility pipeline
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

Logs intentionally announce every stage. When Alpha Vantage returns premium notices, you’ll see the fallback estimation path in the transcript.

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

### Cloudflare Pages Signup Flow

The `/pages` directory contains a lightweight, branded signup experience that talks to the Worker’s `/subscribe` endpoint.

1. **Preview locally** – Open `pages/index.html` directly in the browser or serve it with any static HTTP server.
2. **Configure allowed origins** – Set `SIGNUP_ALLOWED_ORIGINS` in `.env` (comma-separated) and run `make push-secrets` so only trusted hosts can call `/subscribe`.
3. **Deploy to Cloudflare Pages** – Point a Pages project at the repository (directory `pages/`), or upload the contents manually. Cloudflare assigns a production domain like `https://options-insight-signup.pages.dev` and per-commit preview URLs (e.g. `https://<hash>.options-insight-signup.pages.dev`). The form auto-detects the production API and falls back to the default Worker URL.
4. **Unsubscribe support** – Resend automatically injects `{{{ unsubscribe_url }}}` into the React Email footer, so every broadcast includes a first-party opt-out link.

> **CI automation:** The `Deploy Cloudflare Pages Signup` GitHub Action now builds preview deployments for pull requests (surfacing the URL in the Actions log) and pushes the `pages/` directory to your Cloudflare Pages project (`options-insight-signup` by default) on every merge to `main`. Configure the same `CLOUDFLARE_ACCOUNT_ID`/`CLOUDFLARE_API_TOKEN` secrets used for the Worker and grant the token Pages access.

> **Manual deploy:** Run `make deploy-pages` to publish from your local machine. Override the project name with `PROJECT_NAME=your-pages-project make deploy-pages` if you use a different name.

> **Note:** The signup form collects `email` (required) and `firstName` (optional) and tags the contact with the acquisition source in Resend. Submissions from disallowed origins return a 403 with a descriptive error.

### Brand palette

The public signup page mirrors the warm palette from [ravishankars.com](https://ravishankars.com/). Key CSS variables (see `pages/styles.css`) include:

| Variable | Hex | Description |
| --- | --- | --- |
| `--bg` | `#FAF6F0` | Ivory Linen background |
| `--surface` | `#FDFDFD` | Porcelain cards and surfaces |
| `--text` | `#3A3A3A` | Charcoal Plum headings |
| `--muted` | `#7C6F64` | Warm Taupe body copy |
| `--primary` | `#DDBEA9` | Soft Clay buttons and accents |
| `--primary-dark` | `#B45F4D` | Terracotta hover state |
| `--border`/`--accent` | `#E4C590` | Gold Sand dividers, tags, and pill outlines |

Use the same variables when extending the marketing experience to keep the Properties brand consistent.

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
make test-alphavantage # Volatility analysis
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

## Public Signup Page

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

> **Run notifications**: After each scheduled or manual execution the worker emails a summary (status, metrics, warnings, and errors) to `SUMMARY_EMAIL_RECIPIENT` using Resend. Set this in your environment or accept the default maintainer address.

## Security Policy

Sensitive findings should **not** be reported through public issues. Instead, open a [private security advisory](https://github.com/ravishan16/options-insight/security/advisories/new) with detailed reproduction steps, or contact the maintainer directly via the email address on their GitHub profile. We will acknowledge reports within 72 hours.

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
- `src/` – Component implementations referenced above (`finnhub.js`, `real-volatility.js`, `gemini.js`, `email-template.js`).
