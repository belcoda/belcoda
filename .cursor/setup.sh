#!/usr/bin/env bash
set -euo pipefail

# --- Postgres (Zero needs wal_level=logical for logical replication) ---
sudo apt-get update
sudo apt-get install -y postgresql postgresql-contrib
PG_CONF=$(sudo -u postgres psql -tAc "SHOW config_file")
echo "wal_level = logical"        | sudo tee -a "$PG_CONF"
echo "max_wal_senders = 10"       | sudo tee -a "$PG_CONF"
echo "max_replication_slots = 10" | sudo tee -a "$PG_CONF"
sudo service postgresql restart

# role + db to match DATABASE_URL / ZERO_UPSTREAM_DB
# SUPERUSER guarantees the REPLICATION privilege Zero needs.
sudo -u postgres psql -c "CREATE ROLE app WITH LOGIN SUPERUSER PASSWORD 'app';" || true
sudo -u postgres psql -c "CREATE DATABASE belcoda OWNER app;" || true

# --- App deps + schema + seed ---
npm ci --include=dev
npm run db:push
npm run db:seed
