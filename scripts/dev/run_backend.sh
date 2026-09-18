#!/usr/bin/env bash
set -e

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
echo "[Open-ERP] Khoi chay Backend Quarkus Dev Mode - Live-Coding, port 8088..."

# Java 25 + ByteBuddy (Quarkus 3.15) requires the experimental flag.
export JAVA_TOOL_OPTIONS="-Dnet.bytebuddy.experimental=true"

# JWT keys are gitignored; generate them on first run after cloning.
if [ ! -f "$ROOT/src/backend/src/main/resources/privateKey.pem" ]; then
  echo "[Open-ERP] Chua co khoa JWT - dang sinh khoa RSA dev..."
  node "$ROOT/scripts/dev/generate_jwt_keys.js"
fi

cd "$ROOT/src/backend"

if [ -x ./mvnw ]; then
    ./mvnw quarkus:dev
elif command -v mvn >/dev/null 2>&1; then
    mvn quarkus:dev
else
    echo "Loi: Khong tim thay Maven hoac ./mvnw. Vui long cai dat Java 21+ va Maven!"
    exit 1
fi
