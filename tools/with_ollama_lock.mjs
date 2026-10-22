#!/usr/bin/env node
/**
 * CLI Wrapper for Hermes or external tasks requiring the global Ollama lock.
 * Ensures external scripts never collide with Node agent execution windows.
 * Usage: node tools/with_ollama_lock.mjs <command...>
 */

import { withOllamaLock } from '../server/services/ollamaLock.mjs';
import { execSync } from 'child_process';

const args = process.argv.slice(2);
if (args.length === 0) {
  console.error('Usage: node tools/with_ollama_lock.mjs <command>');
  process.exit(1);
}

const command = args.join(' ');

async function main() {
  try {
    await withOllamaLock(async () => {
      console.log(`[OllamaLockWrapper] Acquired lock. Executing: ${command}`);
      execSync(command, { stdio: 'inherit' });
    }, { timeoutMs: 90000 });
  } catch (err) {
    console.error(`[OllamaLockWrapper] Execution failed: ${err.message}`);
    process.exit(1);
  }
}

main();
