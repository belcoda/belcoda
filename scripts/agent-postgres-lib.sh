# Shared Postgres bootstrap helpers for agent setup scripts.
# Expects callers to define as_postgres() before sourcing.
#
# PostGIS: event.location is geography(Point,4326). Agent setups run
# `drizzle-kit push`, which does not execute drizzle/*.sql migrations, so the
# extension must be installed and CREATE EXTENSION'd before schema push.

# Parse user / password from postgres:// or postgresql:// URLs (percent-decoded).
pg_uri_user() {
	python3 - "$1" <<'PY'
import sys
from urllib.parse import urlparse, unquote

uri = sys.argv[1]
parsed = urlparse(uri)
if parsed.scheme not in ("postgres", "postgresql"):
	raise SystemExit(f"unsupported URI scheme: {parsed.scheme!r}")
if parsed.username is None:
	print("", end="")
else:
	print(unquote(parsed.username, encoding="utf-8"), end="")
PY
}

pg_uri_password() {
	python3 - "$1" <<'PY'
import sys
from urllib.parse import urlparse, unquote

uri = sys.argv[1]
parsed = urlparse(uri)
if parsed.scheme not in ("postgres", "postgresql"):
	raise SystemExit(f"unsupported URI scheme: {parsed.scheme!r}")
if parsed.password is None:
	print("", end="")
else:
	print(unquote(parsed.password, encoding="utf-8"), end="")
PY
}

# Parse the database name from postgres:// or postgresql:// URLs (percent-decoded).
pg_uri_dbname() {
	python3 - "$1" <<'PY'
import sys
from urllib.parse import urlparse, unquote

uri = sys.argv[1]
parsed = urlparse(uri)
if parsed.scheme not in ("postgres", "postgresql"):
	raise SystemExit(f"unsupported URI scheme: {parsed.scheme!r}")
print(unquote(parsed.path.lstrip("/"), encoding="utf-8"), end="")
PY
}

# Parse the host from postgres:// or postgresql:// URLs (empty when unset).
pg_uri_host() {
	python3 - "$1" <<'PY'
import sys
from urllib.parse import urlparse

uri = sys.argv[1]
parsed = urlparse(uri)
if parsed.scheme not in ("postgres", "postgresql"):
	raise SystemExit(f"unsupported URI scheme: {parsed.scheme!r}")
print(parsed.hostname or "", end="")
PY
}

# Block until Postgres accepts connections, then fail loudly with diagnostics.
wait_for_postgres() {
	local timeout_sec="${PG_READY_TIMEOUT_SEC:-60}"
	local deadline=$(($(date +%s) + timeout_sec))
	until pg_isready -q; do
		if [ "$(date +%s)" -ge "$deadline" ]; then
			echo "PostgreSQL did not become ready within ${timeout_sec}s" >&2
			pg_isready || true
			service postgresql status 2>/dev/null || true
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

# SQL-escape a literal for use inside single quotes.
sql_escape() {
	printf '%s' "${1//\'/\'\'}"
}

# Quote a value as a PostgreSQL identifier.
sql_ident() {
	printf '"%s"' "${1//\"/\"\"}"
}

# Create or reconcile a role with the requested attributes.
ensure_role() {
	local name="$1"
	local with_clause="$2"
	local password="$3"
	local ident
	ident=$(sql_ident "$name")
	local out status
	set +e
	out=$(as_postgres psql -v ON_ERROR_STOP=1 -c \
		"CREATE ROLE ${ident} WITH ${with_clause} PASSWORD '$(sql_escape "$password")';" 2>&1)
	status=$?
	set -e
	if [ "$status" -eq 0 ]; then
		return 0
	fi
	if printf '%s' "$out" | grep -Eqi 'already exists'; then
		as_postgres psql -v ON_ERROR_STOP=1 -c \
			"ALTER ROLE ${ident} WITH ${with_clause} PASSWORD '$(sql_escape "$password")';"
		return $?
	fi
	printf '%s\n' "$out" >&2
	return "$status"
}

# Create or reconcile a database with the requested owner.
ensure_database() {
	local name="$1"
	local owner="$2"
	local db_ident owner_ident
	db_ident=$(sql_ident "$name")
	owner_ident=$(sql_ident "$owner")
	local out status
	set +e
	out=$(as_postgres psql -v ON_ERROR_STOP=1 -c \
		"CREATE DATABASE ${db_ident} OWNER ${owner_ident};" 2>&1)
	status=$?
	set -e
	if [ "$status" -eq 0 ]; then
		return 0
	fi
	if printf '%s' "$out" | grep -Eqi 'already exists'; then
		as_postgres psql -v ON_ERROR_STOP=1 -c \
			"ALTER DATABASE ${db_ident} OWNER TO ${owner_ident};"
		return $?
	fi
	printf '%s\n' "$out" >&2
	return "$status"
}

# Bootstrap roles/database from DATABASE_URL and ZERO_UPSTREAM_DB secrets.
bootstrap_postgres_roles() {
	: "${DATABASE_URL:?DATABASE_URL must be set for Postgres bootstrap}"
	: "${ZERO_UPSTREAM_DB:?ZERO_UPSTREAM_DB must be set for Postgres bootstrap}"

	local app_user app_password app_db app_host
	local upstream_user upstream_password upstream_db
	app_user=$(pg_uri_user "$DATABASE_URL")
	app_password=$(pg_uri_password "$DATABASE_URL")
	app_db=$(pg_uri_dbname "$DATABASE_URL")
	app_host=$(pg_uri_host "$DATABASE_URL")
	upstream_user=$(pg_uri_user "$ZERO_UPSTREAM_DB")
	upstream_password=$(pg_uri_password "$ZERO_UPSTREAM_DB")
	upstream_db=$(pg_uri_dbname "$ZERO_UPSTREAM_DB")

	if [ -z "$app_user" ] || [ -z "$app_password" ]; then
		echo "DATABASE_URL must include a username and password" >&2
		exit 1
	fi
	if [ -z "$upstream_user" ] || [ -z "$upstream_password" ]; then
		echo "ZERO_UPSTREAM_DB must include a username and password" >&2
		exit 1
	fi
	if [ -z "$app_db" ]; then
		echo "DATABASE_URL must include a database name" >&2
		exit 1
	fi
	# These scripts bootstrap one local cluster, so both URLs must target the same DB.
	if [ -n "$upstream_db" ] && [ "$app_db" != "$upstream_db" ]; then
		echo "DATABASE_URL ($app_db) and ZERO_UPSTREAM_DB ($upstream_db) must name the same database" >&2
		exit 1
	fi
	# Warn (don't fail) if the app points somewhere other than the local cluster we set up.
	case "$app_host" in
	"" | localhost | 127.0.0.1 | ::1) ;;
	*) echo "warning: DATABASE_URL host '$app_host' is not local; these scripts only bootstrap the local Postgres cluster" >&2 ;;
	esac

	# Cloud agent envs are ephemeral and agent-only: Zero needs SUPERUSER on the
	# upstream role to CREATE PUBLICATION … FOR TABLES IN SCHEMA. When both URLs
	# share a user, that role also needs REPLICATION; when split, only the upstream
	# role gets SUPERUSER + REPLICATION.
	if [ "$app_user" = "$upstream_user" ]; then
		# One role has one password: a shared user with divergent passwords can't work.
		if [ "$app_password" != "$upstream_password" ]; then
			echo "DATABASE_URL and ZERO_UPSTREAM_DB share user '$app_user' but have different passwords" >&2
			exit 1
		fi
		ensure_role "$app_user" "LOGIN REPLICATION SUPERUSER" "$app_password"
	else
		ensure_role "$app_user" "LOGIN" "$app_password"
		ensure_role "$upstream_user" "LOGIN REPLICATION SUPERUSER" "$upstream_password"
		# Let the replication role read the app-owned tables Zero must snapshot.
		# Membership in the owner role inherits SELECT on current and future objects.
		as_postgres psql -v ON_ERROR_STOP=1 -c \
			"GRANT $(sql_ident "$app_user") TO $(sql_ident "$upstream_user");"
	fi
	ensure_database "$app_db" "$app_user"
	enable_postgis "$app_db"
}

# Install the PostGIS packages matching the on-disk Postgres major version.
# Safe to re-run. Uses ${SUDO:-} so root callers (agent-setup-web.sh) work.
# Postgres does not need to be running; files land under /usr/lib/postgresql.
install_postgis_packages() {
	local pg_major
	pg_major=$(ls /usr/lib/postgresql 2>/dev/null | sort -n | tail -1)
	if [ -z "$pg_major" ]; then
		echo "Could not determine PostgreSQL major version (expected /usr/lib/postgresql/<major>)" >&2
		exit 1
	fi
	${SUDO:-} apt-get update
	${SUDO:-} apt-get install -y "postgresql-${pg_major}-postgis-3"
}

# Enable PostGIS in the given database. Superuser required (uses as_postgres).
# Idempotent. Must run after the database exists and the packages are installed.
enable_postgis() {
	local dbname="$1"
	as_postgres psql -d "$dbname" -v ON_ERROR_STOP=1 -c \
		"CREATE EXTENSION IF NOT EXISTS postgis;"
}
