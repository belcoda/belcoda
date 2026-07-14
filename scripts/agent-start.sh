#!/usr/bin/env bash
set -euo pipefail

# Per-session startup for Claude Code on the web, wired in as a SessionStart hook
# in .claude/settings.json. The environment cache stores files, not running
# processes, so Postgres (installed + seeded by scripts/agent-setup-web.sh) must
# be restarted at the start of every session.
#
# Cloud-only: SessionStart hooks also run locally, so bail out unless we're in a
# Claude Code cloud session, where CLAUDE_CODE_REMOTE=true.

if [ "${CLAUDE_CODE_REMOTE:-}" != "true" ]; then
	exit 0
fi

# Fail loudly after a bounded wait; dump status + recent logs for diagnosis.
wait_for_postgres() {
	local timeout_sec="${PG_READY_TIMEOUT_SEC:-60}"
	local deadline=$(($(date +%s) + timeout_sec))
	until pg_isready -q; do
		if [ "$(date +%s)" -ge "$deadline" ]; then
			echo "PostgreSQL did not become ready within ${timeout_sec}s" >&2
			pg_isready || true
			service postgresql status 2>/dev/null || sudo service postgresql status || true
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

service postgresql start 2>/dev/null || sudo service postgresql start
wait_for_postgres
