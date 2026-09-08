#!/usr/bin/env bash
set -euo pipefail

# Fallback setup for agent environments that can't apt-install Postgres
# (no sudo/apt). Brings up docker-compose.yaml (postgis/postgis:16-3.5 with
# wal_level=logical), enables PostGIS, then pushes schema and seeds.
#
# drizzle-kit push does not run drizzle/*.sql, so CREATE EXTENSION must
# happen here — including when the volume was created from a plain
# postgres:16 image that never enabled PostGIS.
#
# Usage: bash scripts/agent-setup-docker.sh

if [ ! -f .env ]; then
	cp .env.example.cloud-agents .env
fi

docker compose up -d --wait
docker compose exec -T postgres psql -U app -d belcoda -c \
	'CREATE EXTENSION IF NOT EXISTS postgis;'

npm ci --include=dev
# drizzle.config.ts sets strict: true (interactive confirm). Agent install has
# no TTY, so push would hang/fail without --force.
npx drizzle-kit push --force
npm run db:seed
