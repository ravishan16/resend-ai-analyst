# Options Insight – Quantitative Earnings Research Agent

## TL;DR
- **What it is:** An autonomous Cloudflare Worker that scans upcoming earnings, enriches them with volatility and sentiment analysis, and delivers a polished newsletter via Resend.
- **Why it matters:** Retail options traders get institutional-style prep without the manual grind—quantitative stats, AI commentary, and playbook-ready strategies arrive every weekday morning.
- **Where to look next:** For feature-level details and roadmap, read the companion [Product Requirements Document](PRD.md).

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
    subgraph Data_Sources[Data & Intelligence Sources]
        F["Finnhub\nEarnings Calendar"]
        A["Alpha Vantage\nQuotes + Volatility"]
        G["Google Gemini\nNarrative AI"]
    end

    subgraph Worker[Cloudflare Worker]
        S["Scheduler & API Gateway\n(src/index.js)"]
        O["Opportunity Scanner\n(src/finnhub.js)"]
        V["Volatility Service\n(src/real-volatility.js, alphavantage.js)"]
        QA["Quality Filters\n(validateAnalysis)"]
        T["Template Composer\n(src/email-template.js)"]
    end

    subgraph Delivery[Comms]
        R["Resend\nBroadcast" ]
        Inbox["Subscriber\nInbox"]
    end

    F --> O
    A --> V
    O --> V
    V --> QA
    QA --> T
    T --> R --> Inbox
    S --> O
    S --> QA
    S --> R
    G --> QA
```

---

## Data & Intelligence Stack

| Layer | Service | Purpose | Notes |
| --- | --- | --- | --- |
| Market Events | **Finnhub** | Earnings calendar & VIX quote | Free tier 60 calls/min; configured via `FINNHUB_API_KEY` |
| Volatility & Pricing | **Alpha Vantage** | Quotes, historical volatility, expected move | Free tier 25 calls/day; fallback estimators handle premium lockouts |
| AI Narrative | **Google Gemini** | Sentiment, strategy articulation | Model: `gemini-pro-latest`; validated before inclusion |
| Delivery | **Resend** | Broadcast the React Email digest | Audience ID stored in secrets |
| Compute | **Cloudflare Workers** | Cron trigger, API endpoints, pipeline orchestration | Runs at 08:00 UTC weekdays (see `wrangler.toml`) |

---

## Daily Research Workflow (Deep Dive)

1. **Scan Universe** – `getEarningsOpportunities` pulls 45 days of earnings, filters by curated tickers, and scores timing + liquidity.
2. **Volatility Analysis** – `getBulkVolatilityAnalysis` hydrates each candidate with IV, HV, expected move, and liquidity stats; estimate mode stays deterministic when real data is unavailable.
3. **Quality Gate** – Composite `qualityScore` + `validateAnalysis` thresholds keep low-information names out of the email.
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
SUMMARY_EMAIL_RECIPIENT=ravishankar.sivasubramaniam@gmail.com
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
| Component drill-down | `make test-<component>` | Finnhub, Alpha Vantage, volatility, Gemini, email, scoring |
| Cron dev server | `make dev` | Boots Wrangler with `/health`, `/status`, `/trigger` endpoints |
| Force a run (local Wrangler) | `curl http://localhost:8787/cdn-cgi/handler/scheduled` | Mimics the Cloudflare cron event |
| Authorized manual trigger | `curl -X POST -H "x-trigger-secret: $TRIGGER_AUTH_SECRET" https://.../trigger` | Requires shared secret header |
| Review run summary | Automatic | Every run sends a status email (success/errors, metrics) to `SUMMARY_EMAIL_RECIPIENT` via Resend |

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

---

## Testing Matrix

```sh
# Component-level
make test-finnhub
make test-alphavantage
make test-volatility
make test-gemini
make test-email
make test-scoring

# Integration
make test-pipeline
make test-full-run

# Debugging
make debug-run        # Verbose logging across the stack
make test-stock SYMBOL=AAPL
```

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
