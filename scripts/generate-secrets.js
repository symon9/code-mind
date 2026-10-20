#!/usr/bin/env node
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

function generateSecret(bytes = 32) {
  return crypto.randomBytes(bytes).toString('hex');
}

const jwtSecret = generateSecret();
const refreshSecret = generateSecret();

console.log('==================================================');
console.log('   CodeMind Cryptographically Secure Secrets');
console.log('==================================================\n');
console.log(`JWT_SECRET="${jwtSecret}"`);
console.log(`REFRESH_SECRET="${refreshSecret}"\n`);

const shouldWrite = process.argv.includes('--write');
const envPath = path.resolve(__dirname, '../backend/.env');

if (shouldWrite && fs.existsSync(envPath)) {
  let content = fs.readFileSync(envPath, 'utf-8');
  if (content.includes('JWT_SECRET=')) {
    content = content.replace(/JWT_SECRET="?[^"\n\r]*"?/, `JWT_SECRET="${jwtSecret}"`);
  } else {
    content += `\nJWT_SECRET="${jwtSecret}"`;
  }

  if (content.includes('REFRESH_SECRET=')) {
    content = content.replace(/REFRESH_SECRET="?[^"\n\r]*"?/, `REFRESH_SECRET="${refreshSecret}"`);
  } else {
    content += `\nREFRESH_SECRET="${refreshSecret}"`;
  }

  fs.writeFileSync(envPath, content, 'utf-8');
  console.log(`Successfully updated secrets in ${envPath}`);
} else if (shouldWrite) {
  console.log(`Note: ${envPath} not found. Copy and paste the above values into your production environment.`);
} else {
  console.log('Tip: Run with --write to automatically update backend/.env:');
  console.log('  node scripts/generate-secrets.js --write\n');
}
