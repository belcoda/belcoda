#!/usr/bin/env bash
set -euo pipefail

# Setup script for Claude Code on the web (claude.ai/code).
#
# Paste `bash scripts/agent-setup-web.sh` into the cloud environment's
# "Setup script" field. It runs as root on Ubuntu 24.04 before the session
# starts, and its filesystem result is CACHED — so this installs/seeds once and
# later sessions start from the snapshot. Per-session service startup lives in
# the SessionStart hook (scripts/agent-start.sh), because the cache stores files,
# not running processes.
#
# Unlike Cursor/Codex, the base image already ships PostgreSQL 16 and Node (via
# nvm), so we don't apt-install Postgres — we just configure and seed it.
#
# Secrets (DATABASE_URL, ZERO_UPSTREAM_DB, ZERO_*, BETTER_AUTH_*, OWNER_*,
# MOCK_EXTERNAL_SERVICES=true, ...) come from the environment's variables, set in
# the same cloud environment UI. Keep network access at "Trusted" (the default)
# so npm and nodejs.org are reachable.

# --- Node 24 (base image ships 20/21/22 via nvm; CI/Docker pin 24) ---
export NVM_DIR="${NVM_DIR:-$HOME/.nvm}"
for candidate in "$NVM_DIR/nvm.sh" /root/.nvm/nvm.sh /usr/local/nvm/nvm.sh; do
	if [ -s "$candidate" ]; then
		# shellcheck disable=SC1090
		. "$candidate"
		break
	fi
done
if command -v nvm >/dev/null 2>&1; then
	nvm install 24
	nvm alias default 24
	nvm use 24
fi

# --- Configure the pre-installed Postgres for Zero (needs wal_level=logical) ---
PG_CONF="/etc/postgresql/16/main/postgresql.conf"
if [ -f "$PG_CONF" ]; then
	{
		echo "wal_level = logical"
		echo "max_wal_senders = 10"
		echo "max_replication_slots = 10"
	} >>"$PG_CONF"
fi
service postgresql start
until pg_isready -q; do sleep 1; done

# role + db to match DATABASE_URL / ZERO_UPSTREAM_DB.
# SUPERUSER guarantees the REPLICATION privilege Zero needs. (Runs as root, so
# switch to the postgres user with su rather than sudo.)
su postgres -c "psql -c \"CREATE ROLE app WITH LOGIN SUPERUSER PASSWORD 'app';\"" || true
su postgres -c "psql -c \"CREATE DATABASE belcoda OWNER app;\"" || true

# --- App deps + schema + seed (cached into the snapshot) ---
npm ci --include=dev
npm run db:push
npm run db:seed
