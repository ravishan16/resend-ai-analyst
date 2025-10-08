#!/usr/bin/env node

/**
 * Configuration Validation Script
 * Validates all environment variables, configuration files, and deployment settings
 */

import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const REQUIRED_ENV_VARS = [
    'FINNHUB_API_KEY',
    'RESEND_API_KEY', 
    'GEMINI_API_KEY',
    'AUDIENCE_ID'
];

const OPTIONAL_ENV_VARS = [
    'ALPHA_VANTAGE_API_KEY', // Legacy fallback, still supported
    'NEWSLETTER_FROM',
    'NEWSLETTER_FROM_EMAIL',
    'SUMMARY_EMAIL_RECIPIENT',
    'STATUS_EMAIL_RECIPIENT',
    'SUMMARY_EMAIL_FROM',
    'TRIGGER_AUTH_SECRET',
    'TRIGGER_AUTH_TOKEN',
    'SIGNUP_ALLOWED_ORIGINS',
    'SUBSCRIBE_ALLOWED_ORIGINS',
    'ALLOWED_ORIGINS'
];

const CONFIG_FILES = [
    'package.json',
    'wrangler.toml',
    'vitest.config.js',
    '.env.example'
];

console.log('🔍 Validating Options Insight Configuration...\n');

let hasErrors = false;

// 1. Validate environment variables
console.log('📋 Environment Variables:');
console.log('========================');

// Check required variables
console.log('\n✅ Required Variables:');
for (const envVar of REQUIRED_ENV_VARS) {
    const value = process.env[envVar];
    if (!value) {
        console.log(`❌ ${envVar}: MISSING`);
        hasErrors = true;
    } else {
        const masked = value.substring(0, 8) + '*'.repeat(Math.max(0, value.length - 8));
        console.log(`✅ ${envVar}: ${masked}`);
    }
}

// Check optional variables
console.log('\n🔧 Optional Variables:');
for (const envVar of OPTIONAL_ENV_VARS) {
    const value = process.env[envVar];
    if (!value) {
        console.log(`⚪ ${envVar}: Not set (using defaults)`);
    } else {
        const masked = value.length > 20 
            ? value.substring(0, 20) + '...' 
            : value.substring(0, 8) + '*'.repeat(Math.max(0, value.length - 8));
        console.log(`✅ ${envVar}: ${masked}`);
    }
}

// 2. Validate configuration files
console.log('\n📁 Configuration Files:');
console.log('=======================');

for (const configFile of CONFIG_FILES) {
    if (fs.existsSync(configFile)) {
        console.log(`✅ ${configFile}: Found`);
        
        // Validate specific file contents
        try {
            if (configFile === 'package.json') {
                const pkg = JSON.parse(fs.readFileSync(configFile, 'utf8'));
                if (!pkg.type || pkg.type !== 'module') {
                    console.log(`   ⚠️  package.json should have "type": "module"`);
                }
                if (!pkg.scripts.deploy) {
                    console.log(`   ⚠️  Missing deploy script`);
                }
            }
            
            if (configFile === 'wrangler.toml') {
                const wrangler = fs.readFileSync(configFile, 'utf8');
                if (!wrangler.includes('crons =')) {
                    console.log(`   ⚠️  No cron schedule configured`);
                }
                if (!wrangler.includes('compatibility_date')) {
                    console.log(`   ⚠️  Missing compatibility_date`);
                }

                // Security check: Ensure no sensitive keys are bound in [vars]
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
                const hasVarsSection = /\n\[vars\]/.test(wrangler);
                if (hasVarsSection) {
                    const varsSection = wrangler.split(/\n\[vars\]/)[1] || '';
                    const violations = sensitive.filter(k => new RegExp(`^${k}\s*=`, 'm').test(varsSection));
                    if (violations.length) {
                        console.log(`   ❌ Sensitive keys found in [vars]: ${violations.join(', ')}`);
                        console.log('      Move these to Cloudflare Secrets using: wrangler secret put <NAME>');
                        hasErrors = true;
                    }
                    // Additionally, block template placeholders like {{ KEY }} which can overwrite secrets
                    const templateLeak = varsSection.match(/\{\{\s*[A-Z0-9_]+\s*\}\}/g);
                    if (templateLeak) {
                        console.log(`   ❌ Template placeholders found in [vars]: ${[...new Set(templateLeak)].join(', ')}`);
                        console.log('      Remove placeholders and rely on Secrets to prevent plaintext overwrites.');
                        hasErrors = true;
                    }
                }
            }
        } catch (error) {
            console.log(`   ❌ Invalid JSON/TOML format: ${error.message}`);
            hasErrors = true;
        }
    } else {
        console.log(`❌ ${configFile}: Missing`);
        hasErrors = true;
    }
}

// 3. Validate source structure
console.log('\n🏗️  Source Structure:');
console.log('====================');

const REQUIRED_SOURCE_FILES = [
    'src/index.js',
    'src/config.js',
    'src/finnhub.js',
    'src/gemini.js',
    'src/email.js',
    'src/email-template.js',
    'src/simplified-data.js'
];

for (const sourceFile of REQUIRED_SOURCE_FILES) {
    if (fs.existsSync(sourceFile)) {
        console.log(`✅ ${sourceFile}: Found`);
    } else {
        console.log(`❌ ${sourceFile}: Missing`);
        hasErrors = true;
    }
}

// 4. Validate test structure
console.log('\n🧪 Test Structure:');
console.log('==================');

const testDir = 'tests';
if (fs.existsSync(testDir)) {
    const testFiles = fs.readdirSync(testDir).filter(f => f.endsWith('.test.js'));
    console.log(`✅ Test directory: Found (${testFiles.length} test files)`);
    testFiles.forEach(file => console.log(`   📝 ${file}`));
} else {
    console.log(`⚠️  No tests directory found`);
}

// 5. Validate deployment readiness
console.log('\n🚀 Deployment Readiness:');
console.log('=========================');

// Check .env.example completeness
console.log('\n📄 .env.example validation:');
if (fs.existsSync('.env.example')) {
    const envExample = fs.readFileSync('.env.example', 'utf8');
    const missingFromExample = [];
    
    for (const envVar of [...REQUIRED_ENV_VARS, ...OPTIONAL_ENV_VARS]) {
        if (!envExample.includes(envVar)) {
            missingFromExample.push(envVar);
        }
    }
    
    if (missingFromExample.length > 0) {
        console.log(`⚠️  .env.example missing: ${missingFromExample.join(', ')}`);
    } else {
        console.log(`✅ .env.example is complete`);
    }
} else {
    console.log(`❌ .env.example is missing`);
    hasErrors = true;
}

// Check for common issues
console.log('\n🔧 Common Issues Check:');
if (process.env.POLYGON_API_KEY) {
    console.log(`⚠️  POLYGON_API_KEY is set but not used (legacy variable)`);
}

if (!process.env.ALPHA_VANTAGE_API_KEY) {
    console.log(`ℹ️  ALPHA_VANTAGE_API_KEY not set - using Yahoo Finance only (recommended)`);
}

// 6. Summary
console.log('\n📊 Validation Summary:');
console.log('======================');

if (hasErrors) {
    console.log('❌ Configuration validation FAILED');
    console.log('🔧 Please fix the issues above before deployment');
    process.exit(1);
} else {
    console.log('✅ Configuration validation PASSED');
    console.log('🚀 System is ready for deployment');
}

console.log('\n💡 Next steps:');
console.log('  1. Run "npm test" to validate functionality');
console.log('  2. Run "make test-full-run" for end-to-end testing');
console.log('  3. Deploy with "npm run deploy"');