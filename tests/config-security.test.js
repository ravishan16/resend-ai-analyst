import { describe, it, expect } from 'vitest';
import fs from 'fs';
import { SENSITIVE_KEYS } from '../src/config/constants.js';

describe('wrangler.toml security', () => {
  const wrangler = fs.readFileSync('wrangler.toml', 'utf8');

  // Robustly extract only the [vars] section
  const varsMatch = wrangler.match(/(?:^|\n)\[vars\](?:\n|\r\n)([\s\S]*?)(?=(?:\n|\r\n)\[\w+]|$)/);
  const varsSection = varsMatch ? varsMatch[1] : null;

  it('does not bind sensitive secrets in [vars]', () => {
    if (!varsSection) return; // OK if no [vars]
    for (const key of SENSITIVE_KEYS) {
      const keyRegex = new RegExp(`^\\s*${key}\\s*=`, 'm');
      expect(keyRegex.test(varsSection)).toBe(false, `Sensitive key "${key}" should not be in [vars]`);
    }
  });

  it('does not contain template placeholders like {{ KEY }} in [vars]', () => {
    if (!varsSection) return;
    const placeholderRegex = /\{\{\s*[A-Z0-9_]+\s*\}\}/;
    expect(placeholderRegex.test(varsSection)).toBe(false, 'Template placeholders like {{ KEY }} are not allowed in [vars]');
  });
});
