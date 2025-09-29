# Contributing to Options Insight

Thanks for your interest in contributing! This project automates an options-research digest using a Cloudflare Worker, Alpha Vantage market data, and Resend for email delivery. We welcome fixes, features, documentation updates, and issue triage.

## 📋 Code of Conduct

Please be respectful, inclusive, and kind. We expect all contributors to follow these simple principles:

- Assume good intent and communicate openly.
- Be patient with newcomers and learners.
- Respect differing opinions and work together toward consensus.
- Avoid harassment, discrimination, or disparaging remarks.

If you encounter behavior that violates these principles, please open a confidential issue or email the maintainer privately.

## 🚀 Getting started

1. Fork the repository and create a feature branch off `main`.
2. Ensure your local environment is running **Node.js 20 or newer** (matches CI and Wrangler requirements).
3. Install dependencies:
   ```bash
   npm install
   ```
4. Copy the configuration template (if you have one) or create an `.env` file with the following variables:
   ```bash
   # Required for local development
   ALPHA_VANTAGE_API_KEY=your-key
   GEMINI_API_KEY=your-key
   RESEND_API_KEY=your-key
   EMAIL_RECIPIENT=your-email@example.com
   EMAIL_FROM=Digest <digest@example.com>
   TRIGGER_AUTH_SECRET=choose-a-strong-secret
   SUMMARY_EMAIL_RECIPIENT=ravishankar.sivasubramaniam@gmail.com
   # Optional override (defaults to alerts@ravishankars.com)
   # SUMMARY_EMAIL_FROM=alerts@ravishankars.com
   ```
5. Start the worker locally:
   ```bash
   npm start
   ```
   This runs `wrangler dev` using Cloudflare's local emulator.

## 🧪 Testing & validation

- There is currently no automated test suite. Please add unit or integration tests when you introduce new logic, or describe manual testing steps in your pull request.
- Before submitting, run the worker locally and manually trigger the `/trigger` endpoint with the required `x-trigger-secret` header to confirm it works end-to-end.
- The CI pipeline executes `npx wrangler deploy --dry-run`. Ensure the same command succeeds locally to avoid failing checks.
- Each run sends a Resend summary email to `SUMMARY_EMAIL_RECIPIENT` with status and errors. Configure this to receive alerts for your environment.

## 🧱 Coding standards

- This project uses ECMAScript modules and targets the Cloudflare Workers runtime.
- Follow the existing code style (2-space indentation, semicolons where present) and keep functions small and focused.
- Prefer descriptive variable names and add docstrings or comments where logic is complex.
- Handle API failures gracefully; rate limits and missing data are common in Alpha Vantage.

## 🔄 Workflow

1. **Create an issue** describing the problem or feature if none exists yet.
2. **Branch naming**: `feature/short-description`, `fix/short-description`, or `docs/short-description`.
3. **Commits**: Keep commits focused and include a short summary of the change.
4. **Pull request**: 
   - Reference the issue it closes (e.g., `Closes #123`).
   - Include screenshots or logs where helpful.
   - Document manual testing steps.
   - Ensure secrets are never committed.
5. A maintainer will review your PR, suggest changes if needed, and merge once approved.

## 🧾 Documentation updates

If you change behavior or add configuration requirements, update the relevant sections of `README.md`, `PRD.md`, and any in-line comments. Clear documentation accelerates other contributors.

## 💬 Questions?

Open an issue with the `question` label or start a discussion thread. We're happy to help you get unstuck.

Thanks for helping improve Options Insight! 🙌
