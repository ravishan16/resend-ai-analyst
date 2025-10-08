// Centralized list of sensitive config keys that must NOT live in wrangler [vars]
export const SENSITIVE_KEYS = [
  'FINNHUB_API_KEY',
  'ALPHA_VANTAGE_API_KEY',
  'GEMINI_API_KEY',
  'RESEND_API_KEY',
  'AUDIENCE_ID',
  'SUMMARY_EMAIL_RECIPIENT',
  'SUMMARY_EMAIL_FROM',
  'TRIGGER_AUTH_SECRET'
];
