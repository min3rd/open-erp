#!/bin/sh
# =============================================================================
# docker-init.sh — OpenERP Docker Initialization Script
#
# Runs database seed initialization before starting the application.
# Only executes when SEED_ON_INIT=true (or "1") is set.
#
# Environment variables:
#   SEED_ON_INIT              - "true" or "1" to enable seeding on startup
#   SEED_FORCE                - "true" to re-run seeds even if already executed
#   SEED_SUPERADMIN_PASSWORD  - Password for the SuperAdmin user (recommended for production)
#   MONGODB_URI               - MongoDB connection URI (used for health check)
# =============================================================================

set -e

echo "=== OpenERP Docker Init ==="
echo "NODE_ENV: ${NODE_ENV:-not set}"
echo ""

# ---------------------------------------------------------------------------
# Wait for MongoDB to be ready
# ---------------------------------------------------------------------------
wait_for_mongo() {
  local max_attempts=30
  local attempt=0

  echo "Waiting for MongoDB..."
  while [ $attempt -lt $max_attempts ]; do
    attempt=$((attempt + 1))
    if node -e "
      const mongoose = require('mongoose');
      mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017')
        .then(() => { mongoose.disconnect(); process.exit(0); })
        .catch(() => process.exit(1));
    " 2>/dev/null; then
      echo "✓ MongoDB is ready"
      return 0
    fi
    echo "  MongoDB not ready yet (attempt $attempt/$max_attempts), waiting 3s..."
    sleep 3
  done

  echo "✗ MongoDB did not become ready in time"
  return 1
}

# ---------------------------------------------------------------------------
# Run seeds if SEED_ON_INIT is set
# ---------------------------------------------------------------------------
if [ "${SEED_ON_INIT}" = "true" ] || [ "${SEED_ON_INIT}" = "1" ]; then
  echo "Database seeding is enabled (SEED_ON_INIT=${SEED_ON_INIT})"
  echo ""

  wait_for_mongo

  SEED_ARGS=""

  if [ "${SEED_FORCE}" = "true" ] || [ "${SEED_FORCE}" = "1" ]; then
    SEED_ARGS="${SEED_ARGS} --force"
    echo "ℹ️  SEED_FORCE enabled — all seeds will be re-run"
  fi

  if [ -n "${SEED_SUPERADMIN_PASSWORD}" ]; then
    SEED_ARGS="${SEED_ARGS} --seed-superadmin-password ${SEED_SUPERADMIN_PASSWORD}"
  fi

  echo "Running first-run initialization..."
  cd /app
  # shellcheck disable=SC2086
  npx ts-node -r tsconfig-paths/register scripts/seeds/first-run-init.ts ${SEED_ARGS}
  echo "✓ Database initialization complete"
else
  echo "Skipping database seeding (SEED_ON_INIT not set or false)"
fi

echo ""
echo "Starting application..."

# Start the application, passing all arguments through
exec "$@"
