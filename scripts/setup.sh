#!/usr/bin/env bash

# CodeMind Environment Setup Script
echo "Setting up environment configuration files for CodeMind..."

# Copy desktop/react/.env.example -> .env if not exists
if [ ! -f "desktop/react/.env" ]; then
  if [ -f "desktop/react/.env.example" ]; then
    cp desktop/react/.env.example desktop/react/.env
    echo "✔ Created desktop/react/.env from .env.example"
  else
    echo "✖ Error: desktop/react/.env.example not found"
  fi
else
  echo "ℹ desktop/react/.env already exists, skipping"
fi

# Copy backend/.env.example -> .env if not exists
if [ ! -f "backend/.env" ]; then
  if [ -f "backend/.env.example" ]; then
    cp backend/.env.example backend/.env
    echo "✔ Created backend/.env from .env.example"
  else
    echo "✖ Error: backend/.env.example not found"
  fi
else
  echo "ℹ backend/.env already exists, skipping"
fi

echo "Environment setup complete!"
