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
# We do apt-install PostGIS: event.location is geography(Point,4326) and
# drizzle-kit push does not run CREATE EXTENSION from drizzle/*.sql.
#
# Secrets (DATABASE_URL, ZERO_UPSTREAM_DB, ZERO_*, BETTER_AUTH_*, OWNER_*,
# MOCK_EXTERNAL_SERVICES=true, ...) come from the environment's variables, set in
# the same cloud environment UI. Keep network access at "Trusted" (the default)
# so npm and nodejs.org are reachable.

# --- Node 24 (base image ships 20/21/22 via nvm; CI/Docker pin 24) ---
export NVM_DIR="${NVM_DIR:-$HOME/.nvm}"
# The base image installs nvm at /opt/nvm (see /etc/profile.d/nvm.sh). The setup
# script runs as a non-login shell, so that profile drop-in isn't sourced and
# NVM_DIR is usually unset here — probe /opt/nvm explicitly or the whole Node 24
# block gets silently skipped and the session stays on the base image's Node.
for candidate in "$NVM_DIR/nvm.sh" /opt/nvm/nvm.sh /root/.nvm/nvm.sh /usr/local/nvm/nvm.sh; do
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

# --- IPv6 listen fallback for the IPv6-less sandbox ---
# This VM's kernel boots with `ipv6.disable=1`, so any process that hard-codes an
# IPv6 (`::`) listen bind fails with EAFNOSUPPORT — notably @rocicorp/zero's
# zero-cache. Rather than patch that package (version-pinned, breaks on upgrade),
# preload a shim that rewrites `::` -> 0.0.0.0 at Node's core net layer. Wire it
# via NODE_OPTIONS in a login-shell drop-in so it reaches `npm run dev` and the
# zero-cache workers it spawns. Guarded on both the shim existing and IPv6 being
# absent, so it can never point `node` at a missing --require, and is a no-op on
# any dual-stack machine.
cat >/etc/profile.d/zero-ipv6-fallback.sh <<'EOF'
_shim=/home/user/belcoda/scripts/ipv6-listen-fallback.cjs
if [ ! -e /proc/net/if_inet6 ] && [ -f "$_shim" ]; then
	case ":$NODE_OPTIONS:" in
		*"$_shim"*) ;;
		*) export NODE_OPTIONS="${NODE_OPTIONS:+$NODE_OPTIONS }--require $_shim" ;;
	esac
fi
unset _shim
EOF

# Run psql as the postgres OS user (root setup → su, matching other agent scripts).
as_postgres() {
	su postgres -c "$(printf '%q ' "$@")"
}

# shellcheck source=agent-postgres-lib.sh
# Provides wait_for_postgres, bootstrap_postgres_roles, install_postgis_packages.
. "$(dirname "$0")/agent-postgres-lib.sh"

# --- PostGIS for the pre-installed Postgres (needed before drizzle-kit push) ---
install_postgis_packages

# --- Configure the pre-installed Postgres for Zero (needs wal_level=logical) ---
# Idempotent: only append once so cache rebuilds don't accumulate duplicate lines.
PG_CONF="/etc/postgresql/16/main/postgresql.conf"
pg_conf_changed=0
if [ -f "$PG_CONF" ] && ! grep -q '^wal_level = logical' "$PG_CONF"; then
	{
		echo "wal_level = logical"
		echo "max_wal_senders = 10"
		echo "max_replication_slots = 10"
	} >>"$PG_CONF"
	pg_conf_changed=1
fi
service postgresql start
wait_for_postgres
# wal_level takes effect only on a full restart. If Postgres was already running
# when we appended the setting, `start` above was a no-op and the live server is
# still on the default `replica` — restart so Zero's logical replication works.
if [ "$pg_conf_changed" -eq 1 ]; then
	service postgresql restart
	wait_for_postgres
fi

bootstrap_postgres_roles

# --- App deps + schema + seed (cached into the snapshot) ---
# Seed needs OWNER_* (and related) from process.env / .env. Cloud env secrets
# may supply them; otherwise copy the committed example before db:seed so
# install still produces a loginable owner account.
if [ ! -f .env ]; then
	cp .env.example.cloud-agents .env
fi

npm ci --include=dev
# drizzle.config.ts sets strict: true (interactive confirm). Agent/cloud setup
# has no TTY, so push would hang/fail without --force.
npx drizzle-kit push --force
npm run db:seed
