#!/usr/bin/env bash
set -euo pipefail

# Shared setup for cloud coding agents (Cursor background agents, Codex cloud, etc).
# Installs Postgres configured for Zero, creates the dev DB, then installs deps
# and seeds the database. Runs during the agent's build/setup phase, where the
# network is available — the app itself must be able to run offline afterwards.
#
# Called by:
#   - .cursor/setup.sh          (Cursor `install` step)
#   - Codex environment "setup script": `bash scripts/agent-setup.sh`
#
# Secrets (DATABASE_URL, ZERO_UPSTREAM_DB, ZERO_*, BETTER_AUTH_*, OWNER_*,
# MOCK_EXTERNAL_SERVICES=true, ...) are provided by the agent platform, not here.

# Some agent containers run setup as root without a `sudo` binary; others require
# sudo. Use it only when present.
SUDO=""
if command -v sudo >/dev/null 2>&1; then SUDO="sudo"; fi

# --- Postgres (Zero needs wal_level=logical for logical replication) ---
$SUDO apt-get update
$SUDO apt-get install -y postgresql postgresql-contrib
PG_CONF=$($SUDO -u postgres psql -tAc "SHOW config_file")
echo "wal_level = logical"        | $SUDO tee -a "$PG_CONF"
echo "max_wal_senders = 10"       | $SUDO tee -a "$PG_CONF"
echo "max_replication_slots = 10" | $SUDO tee -a "$PG_CONF"
$SUDO service postgresql restart

# role + db to match DATABASE_URL / ZERO_UPSTREAM_DB
# SUPERUSER guarantees the REPLICATION privilege Zero needs.
$SUDO -u postgres psql -c "CREATE ROLE app WITH LOGIN SUPERUSER PASSWORD 'app';" || true
$SUDO -u postgres psql -c "CREATE DATABASE belcoda OWNER app;" || true

# --- App deps + schema + seed ---
npm ci --include=dev
npm run db:push
npm run db:seed
