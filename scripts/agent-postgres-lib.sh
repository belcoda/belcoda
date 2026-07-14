# Shared Postgres bootstrap helpers for agent setup scripts.
# Expects callers to define as_postgres() before sourcing.

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

	local app_user app_password upstream_user upstream_password
	app_user=$(pg_uri_user "$DATABASE_URL")
	app_password=$(pg_uri_password "$DATABASE_URL")
	upstream_user=$(pg_uri_user "$ZERO_UPSTREAM_DB")
	upstream_password=$(pg_uri_password "$ZERO_UPSTREAM_DB")

	if [ -z "$app_user" ] || [ -z "$app_password" ]; then
		echo "DATABASE_URL must include a username and password" >&2
		exit 1
	fi
	if [ -z "$upstream_user" ] || [ -z "$upstream_password" ]; then
		echo "ZERO_UPSTREAM_DB must include a username and password" >&2
		exit 1
	fi

	# Least-privilege application role (no SUPERUSER). Replication for Zero stays on
	# a separate role when ZERO_UPSTREAM_DB uses a different user; if both URLs share
	# a user, grant REPLICATION on that role (still without SUPERUSER).
	if [ "$app_user" = "$upstream_user" ]; then
		ensure_role "$app_user" "LOGIN REPLICATION" "$app_password"
	else
		ensure_role "$app_user" "LOGIN" "$app_password"
		ensure_role "$upstream_user" "LOGIN REPLICATION" "$upstream_password"
	fi
	ensure_database belcoda "$app_user"
}
