#!/usr/bin/env bash
set -e

ENV_NAME=${1:-"staging"}
echo "==> Triển khai môi trường $ENV_NAME bằng Docker Compose..."

docker compose -f deployments/docker/docker-compose.prod.yml up -d --remove-orphans

echo "==> Kiểm tra trạng thái triển khai:"
docker compose -f deployments/docker/docker-compose.prod.yml ps
