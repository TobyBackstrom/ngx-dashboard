#!/usr/bin/env node

// Workaround for xliffmerge bug where it incorrectly parses arguments
const originalArgv = process.argv;
process.argv = [originalArgv[0]]; // Keep only node executable path
process.argv.push(...originalArgv.slice(2)); // Skip the script path

// Add default languages if not specified
const hasLanguages = originalArgv.some(arg => ['es', 'fr', 'de', 'en'].includes(arg));
if (!hasLanguages) {
  process.argv.push('es', 'fr', 'de');
}

require('../node_modules/@ngx-i18nsupport/ngx-i18nsupport/src/xliffmerge/main.js');