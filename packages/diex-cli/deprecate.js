#!/usr/bin/env node
const message = `\nDiex CLI (diex-cli) is deprecated.\n\nPlease install and use the new package instead:\n  npm install -g diex-sdk\n\nThe command name remains the same: \"diex\".\nMore info: https://www.npmjs.com/package/diex-sdk\n`;

console.error(message);
process.exitCode = 1;
