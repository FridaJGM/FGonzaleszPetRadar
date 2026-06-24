#!/bin/sh
# ─────────────────────────────────────────────────────────────────
# init-postgis.sh
# Ensures the PostGIS extension exists in the target database.
# Runs at container startup BEFORE NestJS boots.
# ─────────────────────────────────────────────────────────────────
set -e

# Build connection string from env vars
if [ -n "$DATABASE_URL" ]; then
  CONN="$DATABASE_URL"
else
  PGPASSWORD="${DB_PASSWORD:-postgres}"
  export PGPASSWORD
  CONN="postgresql://${DB_USER:-postgres}:${DB_PASSWORD:-postgres}@${DB_HOST:-localhost}:${DB_PORT:-5432}/${DB_NAME:-petradar}"
fi

echo "[init-postgis] Waiting for PostgreSQL to be ready..."
for i in $(seq 1 30); do
  if psql "$CONN" -c "SELECT 1" > /dev/null 2>&1; then
    echo "[init-postgis] PostgreSQL is ready."
    break
  fi
  echo "[init-postgis] Attempt $i/30 — waiting 2s..."
  sleep 2
done

echo "[init-postgis] Enabling PostGIS extension (if not already enabled)..."
psql "$CONN" -c "CREATE EXTENSION IF NOT EXISTS postgis;" 2>&1 || {
  echo "[init-postgis] WARNING: Could not create PostGIS extension."
  echo "[init-postgis] The database may not have PostGIS available."
  echo "[init-postgis] Geometry columns will fail — make sure your DB has PostGIS."
}

echo "[init-postgis] Done."
