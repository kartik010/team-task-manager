#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"

resolve_database_url() {
  # Already set and non-empty
  if [ -n "${DATABASE_URL:-}" ] && [ "${DATABASE_URL}" != '${{Postgres.DATABASE_URL}}' ]; then
    return 0
  fi

  # Railway private URL (preferred for service-to-service)
  if [ -n "${DATABASE_PRIVATE_URL:-}" ] && [[ "${DATABASE_PRIVATE_URL}" != *'${{'* ]]; then
    export DATABASE_URL="$DATABASE_PRIVATE_URL"
    return 0
  fi

  # Build from individual Postgres vars (referenced per-field in railway.toml)
  if [ -n "${PGHOST:-}" ] && [[ "${PGHOST}" != *'${{'* ]] \
    && [ -n "${PGUSER:-}" ] && [ -n "${PGPASSWORD:-}" ] && [ -n "${PGDATABASE:-}" ]; then
    export DATABASE_URL="postgresql://${PGUSER}:${PGPASSWORD}@${PGHOST}:${PGPORT:-5432}/${PGDATABASE}"
    return 0
  fi
}

resolve_database_url

if [ -z "${DATABASE_URL:-}" ] || [[ "${DATABASE_URL}" == *'${{'* ]]; then
  echo "=============================================="
  echo "ERROR: DATABASE_URL is empty or not resolved."
  echo ""
  echo "Your Postgres service name on Railway must be: Postgres"
  echo "(Canvas → click Postgres → Settings → Service name)"
  echo ""
  echo "Then redeploy the WEB service. Config is in railway.toml:"
  echo '  DATABASE_URL = "${{Postgres.DATABASE_URL}}"'
  echo ""
  echo "If your DB service has a different name (e.g. PostgreSQL), either:"
  echo "  A) Rename it to Postgres, OR"
  echo "  B) Edit railway.toml — replace Postgres with your exact service name"
  echo ""
  echo "Manual fallback (Web service → Variables → Raw Editor):"
  echo "  Copy DATABASE_URL from the Postgres service variables tab"
  echo "  Paste as a plain value on the web service (not a broken reference)"
  echo "=============================================="
  echo ""
  echo "Debug (variable names only):"
  for v in DATABASE_URL DATABASE_PRIVATE_URL PGHOST PGPORT PGUSER PGDATABASE JWT_SECRET; do
    if [ -n "${!v:-}" ]; then
      if [[ "${!v}" == *'${{'* ]]; then
        echo "  $v = UNRESOLVED template"
      else
        echo "  $v = set"
      fi
    else
      echo "  $v = missing"
    fi
  done
  exit 1
fi

if [ -z "${JWT_SECRET:-}" ]; then
  echo "WARNING: JWT_SECRET not set — using temporary secret (set in Railway Variables)"
  export JWT_SECRET="railway-temp-change-me-$(openssl rand -hex 8 2>/dev/null || echo dev)"
fi

export NODE_ENV="${NODE_ENV:-production}"

cd "$ROOT/server"

echo "→ Running migrations..."
npx prisma migrate deploy

echo "→ Seeding demo data..."
npx tsx prisma/seed.ts

echo "→ Starting server on port ${PORT:-3001}..."
node dist/index.js
