#!/usr/bin/env node
const fs = require('fs');
const path = require('path');

const rootDir = path.resolve(__dirname, '..');

const envConfigs = [
  {
    example: path.join(rootDir, 'desktop', 'react', '.env.example'),
    target: path.join(rootDir, 'desktop', 'react', '.env'),
    label: 'desktop/react/.env',
  },
  {
    example: path.join(rootDir, 'backend', '.env.example'),
    target: path.join(rootDir, 'backend', '.env'),
    label: 'backend/.env',
  },
];

console.log('🚀 Setting up environment configuration files for CodeMind...\n');

let createdCount = 0;

for (const { example, target, label } of envConfigs) {
  if (!fs.existsSync(target)) {
    if (fs.existsSync(example)) {
      fs.copyFileSync(example, target);
      console.log(`✔ Created ${label} from .env.example`);
      createdCount++;
    } else {
      console.warn(`✖ Error: ${label}.example not found at ${example}`);
    }
  } else {
    console.log(`ℹ ${label} already exists, skipping`);
  }
}

console.log(`\n✨ Environment setup complete! (${createdCount} file(s) created)`);
