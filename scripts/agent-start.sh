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

service postgresql start 2>/dev/null || sudo service postgresql start
until pg_isready -q; do sleep 1; done
