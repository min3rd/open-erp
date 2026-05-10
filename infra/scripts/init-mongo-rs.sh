#!/usr/bin/env bash
set -euo pipefail

MONGO_RS_NAME="${MONGO_RS_NAME:-rs0}"

echo "[mongodb-rs-init] Waiting for MongoDB to be ready..."
until mongosh --host mongodb --port 27017 --quiet --eval "db.adminCommand('ping').ok" | grep -q 1; do
  sleep 2
done

echo "[mongodb-rs-init] Ensuring replica set ${MONGO_RS_NAME} is configured..."
mongosh --host mongodb --port 27017 --quiet <<'EOF'
const rsName = process.env.MONGO_RS_NAME || "rs0";
const cfg = {
  _id: rsName,
  members: [{ _id: 0, host: "mongodb:27017" }],
};

try {
  const status = rs.status();
  if (status.ok === 1) {
    print(`[mongodb-rs-init] Replica set already initialized: ${status.set}`);
    quit(0);
  }
} catch (error) {
  print("[mongodb-rs-init] Replica set not initialized yet, running rs.initiate().");
}

const result = rs.initiate(cfg);
if (result.ok !== 1) {
  throw new Error(`[mongodb-rs-init] rs.initiate failed: ${tojson(result)}`);
}

print("[mongodb-rs-init] Replica set initialized.");
EOF
