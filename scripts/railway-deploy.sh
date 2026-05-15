#!/usr/bin/env bash
set -euo pipefail

# Deploy Team Task Manager to Railway (run after: railway login)
# Usage: ./scripts/railway-deploy.sh

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

if ! command -v railway &>/dev/null; then
  echo "Install Railway CLI: npm install -g @railway/cli"
  exit 1
fi

if ! railway whoami &>/dev/null; then
  echo "Run: railway login"
  exit 1
fi

echo "→ Linking Railway project (skip if already linked)..."
railway link 2>/dev/null || railway init --name team-task-manager

echo "→ Adding PostgreSQL (skip if already added)..."
railway add --database postgres 2>/dev/null || true

JWT_SECRET="${JWT_SECRET:-$(openssl rand -hex 32)}"
echo "→ Setting environment variables..."
railway variables set \
  NODE_ENV=production \
  JWT_SECRET="$JWT_SECRET"

echo "→ Deploying..."
railway up --detach

echo "→ Generating public domain..."
railway domain 2>/dev/null || echo "Create a domain in Railway dashboard → Settings → Networking"

echo ""
echo "Done! Open your Railway dashboard for the live URL."
echo "Update README.md Live app link with your domain."
