#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"

# Railway: DATABASE_URL must be on the WEB service (reference from PostgreSQL).
if [ -z "${DATABASE_URL:-}" ]; then
  if [ -n "${DATABASE_PRIVATE_URL:-}" ]; then
    export DATABASE_URL="$DATABASE_PRIVATE_URL"
  elif [ -n "${PGHOST:-}" ] && [ -n "${PGUSER:-}" ] && [ -n "${PGPASSWORD:-}" ] && [ -n "${PGDATABASE:-}" ]; then
    export DATABASE_URL="postgresql://${PGUSER}:${PGPASSWORD}@${PGHOST}:${PGPORT:-5432}/${PGDATABASE}"
  fi
fi

if [ -z "${DATABASE_URL:-}" ]; then
  echo "=============================================="
  echo "ERROR: DATABASE_URL is not set on this service."
  echo ""
  echo "Fix in Railway:"
  echo "  1. Project must include a PostgreSQL service"
  echo "  2. Open your WEB app service → Variables"
  echo "  3. New Variable → Add Reference → PostgreSQL → DATABASE_URL"
  echo "  4. Also set: NODE_ENV=production, JWT_SECRET=<random>"
  echo "  5. Redeploy the web service"
  echo "=============================================="
  exit 1
fi

export NODE_ENV="${NODE_ENV:-production}"

cd "$ROOT/server"

echo "→ Running migrations..."
npx prisma migrate deploy

echo "→ Seeding demo data..."
npx tsx prisma/seed.ts

echo "→ Starting server on port ${PORT:-3001}..."
node dist/index.js
