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

# Run psql as the postgres OS user (root setup → su, matching other agent scripts).
as_postgres() {
	su postgres -c "$(printf '%q ' "$@")"
}

# Fail loudly after a bounded wait; dump status + recent logs for diagnosis.
wait_for_postgres() {
	local timeout_sec="${PG_READY_TIMEOUT_SEC:-60}"
	local deadline=$(($(date +%s) + timeout_sec))
	until pg_isready -q; do
		if [ "$(date +%s)" -ge "$deadline" ]; then
			echo "PostgreSQL did not become ready within ${timeout_sec}s" >&2
			pg_isready || true
			service postgresql status || true
			# Prefer Ubuntu package log paths; fall back to journald.
			if compgen -G '/var/log/postgresql/*.log' >/dev/null 2>&1; then
				tail -n 80 /var/log/postgresql/*.log || true
			elif command -v journalctl >/dev/null 2>&1; then
				journalctl -u postgresql -n 80 --no-pager || true
			fi
			exit 1
		fi
		sleep 1
	done
}

# Parse user / password from postgres:// or postgresql:// URLs.
pg_uri_user() {
	local rest="${1#*://}"
	local userpass="${rest%%@*}"
	printf '%s' "${userpass%%:*}"
}
pg_uri_password() {
	local rest="${1#*://}"
	local userpass="${rest%%@*}"
	printf '%s' "${userpass#*:}"
}

# SQL-escape a literal for use inside single quotes.
sql_escape() {
	printf '%s' "${1//\'/\'\'}"
}

# Create a role; ignore only "already exists". Propagate other failures.
ensure_role() {
	local name="$1"
	local with_clause="$2"
	local password="$3"
	local out status
	set +e
	out=$(as_postgres psql -v ON_ERROR_STOP=1 -c \
		"CREATE ROLE ${name} WITH ${with_clause} PASSWORD '$(sql_escape "$password")';" 2>&1)
	status=$?
	set -e
	if [ "$status" -eq 0 ]; then
		return 0
	fi
	if printf '%s' "$out" | grep -Eqi 'already exists'; then
		return 0
	fi
	printf '%s\n' "$out" >&2
	return "$status"
}

# Create a database; ignore only "already exists". Propagate other failures.
ensure_database() {
	local name="$1"
	local owner="$2"
	local out status
	set +e
	out=$(as_postgres psql -v ON_ERROR_STOP=1 -c \
		"CREATE DATABASE ${name} OWNER ${owner};" 2>&1)
	status=$?
	set -e
	if [ "$status" -eq 0 ]; then
		return 0
	fi
	if printf '%s' "$out" | grep -Eqi 'already exists'; then
		return 0
	fi
	printf '%s\n' "$out" >&2
	return "$status"
}

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
wait_for_postgres

# role + db from DATABASE_URL / ZERO_UPSTREAM_DB (required secrets).
: "${DATABASE_URL:?DATABASE_URL must be set for Postgres bootstrap}"
: "${ZERO_UPSTREAM_DB:?ZERO_UPSTREAM_DB must be set for Postgres bootstrap}"

APP_USER=$(pg_uri_user "$DATABASE_URL")
APP_PASSWORD=$(pg_uri_password "$DATABASE_URL")
UPSTREAM_USER=$(pg_uri_user "$ZERO_UPSTREAM_DB")
UPSTREAM_PASSWORD=$(pg_uri_password "$ZERO_UPSTREAM_DB")

if [ -z "$APP_USER" ] || [ -z "$APP_PASSWORD" ]; then
	echo "DATABASE_URL must include a username and password" >&2
	exit 1
fi
if [ -z "$UPSTREAM_USER" ] || [ -z "$UPSTREAM_PASSWORD" ]; then
	echo "ZERO_UPSTREAM_DB must include a username and password" >&2
	exit 1
fi

# Least-privilege application role (no SUPERUSER). Replication for Zero stays on
# a separate role when ZERO_UPSTREAM_DB uses a different user; if both URLs share
# a user, grant REPLICATION on that role (still without SUPERUSER).
if [ "$APP_USER" = "$UPSTREAM_USER" ]; then
	ensure_role "$APP_USER" "LOGIN REPLICATION" "$APP_PASSWORD"
else
	ensure_role "$APP_USER" "LOGIN" "$APP_PASSWORD"
	ensure_role "$UPSTREAM_USER" "LOGIN REPLICATION" "$UPSTREAM_PASSWORD"
fi
ensure_database belcoda "$APP_USER"

# --- App deps + schema + seed (cached into the snapshot) ---
npm ci --include=dev
npm run db:push
npm run db:seed
