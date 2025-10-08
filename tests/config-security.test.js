import { describe, it, expect } from 'vitest';
import fs from 'fs';

describe('wrangler.toml security', () => {
  const wrangler = fs.readFileSync('wrangler.toml', 'utf8');

  it('does not bind sensitive secrets in [vars]', () => {
    const sensitive = [
      'FINNHUB_API_KEY',
      'ALPHA_VANTAGE_API_KEY',
      'GEMINI_API_KEY',
      'RESEND_API_KEY',
      'AUDIENCE_ID',
      'SUMMARY_EMAIL_RECIPIENT',
      'SUMMARY_EMAIL_FROM',
      'TRIGGER_AUTH_SECRET'
    ];

    const hasVars = /\n\[vars\]/.test(wrangler);
    if (!hasVars) return; // okay if no vars section

    const varsSection = wrangler.split(/\n\[vars\]/)[1] || '';
    for (const key of sensitive) {
      expect(new RegExp(`^${key}\\s*=`, 'm').test(varsSection)).toBe(false);
    }
  });

  it('does not contain template placeholders like {{ KEY }} in [vars]', () => {
    const hasVars = /\n\[vars\]/.test(wrangler);
    if (!hasVars) return;
    const varsSection = wrangler.split(/\n\[vars\]/)[1] || '';
    expect(/\{\{\s*[A-Z0-9_]+\s*\}\}/.test(varsSection)).toBe(false);
  });
});
