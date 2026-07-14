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

# Run a command as the postgres OS user. Prefer sudo when available; otherwise
# su (containers that lack sudo but run as root). Never expand to bare `-u postgres`.
as_postgres() {
	if [ -n "$SUDO" ]; then
		$SUDO -u postgres "$@"
	else
		su postgres -c "$(printf '%q ' "$@")"
	fi
}

# shellcheck source=agent-postgres-lib.sh
. "$(dirname "$0")/agent-postgres-lib.sh"

# --- Postgres (Zero needs wal_level=logical for logical replication) ---
$SUDO apt-get update
$SUDO apt-get install -y postgresql postgresql-contrib
PG_CONF=$(as_postgres psql -tAc "SHOW config_file")
# Idempotent: only append the wal settings once (avoids growth on re-runs).
if ! $SUDO grep -q '^wal_level = logical' "$PG_CONF"; then
	printf 'wal_level = logical\nmax_wal_senders = 10\nmax_replication_slots = 10\n' |
		$SUDO tee -a "$PG_CONF" >/dev/null
fi
$SUDO service postgresql restart
wait_for_postgres

bootstrap_postgres_roles

# --- App deps + schema + seed ---
npm ci --include=dev
npm run db:push
npm run db:seed
