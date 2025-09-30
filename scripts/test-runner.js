#!/usr/bin/env node

/**
 * Quick test runner to verify all modules
 * Usage: node scripts/test-runner.js
 */

import { spawn } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const rootDir = join(__dirname, '..');

console.log('🧪 Running Options Insight Test Suite\n');

const runCommand = (command, args = []) => {
  return new Promise((resolve, reject) => {
    const process = spawn(command, args, {
      cwd: rootDir,
      stdio: 'inherit'
    });

    process.on('close', (code) => {
      if (code === 0) {
        resolve();
      } else {
        reject(new Error(`Command failed with code ${code}`));
      }
    });
  });
};

async function runTests() {
  try {
    console.log('📋 Running unit tests...');
    await runCommand('npm', ['test']);
    
    console.log('\n📊 Generating coverage report...');
    await runCommand('npm', ['run', 'test:coverage']);
    
    console.log('\n✅ All tests passed!');
    console.log('📈 Coverage report generated in ./coverage/');
    console.log('🌐 View coverage: open coverage/index.html');
    
  } catch (error) {
    console.error('\n❌ Test suite failed:', error.message);
    process.exit(1);
  }
}

runTests();