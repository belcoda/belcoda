#!/usr/bin/env bash
set -euo pipefail

# Cursor background agent `install` step. Delegates to the shared cloud-agent
# setup so Cursor and Codex stay in sync. See scripts/agent-setup.sh.
exec bash "$(dirname "$0")/../scripts/agent-setup.sh"
