#!/usr/bin/env bash
set -e

PROFILE=${1:-"minimal"}

case "$PROFILE" in
  "full")
    echo "==> Khởi động TOÀN BỘ hạ tầng (Full Profile - yêu cầu RAM >= 8GB)..."
    docker compose --profile full up -d
    ;;
  "kafka")
    echo "==> Khởi động hạ tầng Tối thiểu + Apache Kafka & Kafka UI..."
    docker compose --profile kafka up -d
    ;;
  "mongo")
    echo "==> Khởi động hạ tầng Tối thiểu + MongoDB Replica-Set..."
    docker compose --profile mongo up -d
    ;;
  "storage")
    echo "==> Khởi động hạ tầng Tối thiểu + MinIO S3 Storage..."
    docker compose --profile storage up -d
    ;;
  "mail")
    echo "==> Khởi động hạ tầng Tối thiểu + Mailpit SMTP..."
    docker compose --profile mail up -d
    ;;
  "minimal"|*)
    echo "==> Khởi động hạ tầng TỐI THIỂU (PostgreSQL Primary + Redis, ~300MB RAM)..."
    docker compose up -d
    ;;
esac

echo "==> Kiểm tra trạng thái containers đang chạy..."
docker compose ps

echo "=========================================================="
echo "Dịch vụ tối thiểu mặc định:"
echo "- PostgreSQL Primary:    localhost:5432 (user: openerp, db: openerp_dev)"
echo "- Redis:                 localhost:6379 (pass: openerp_redis_password)"
echo ""
echo "Mẹo: Để bật thêm các service nặng theo nhu cầu:"
echo "  ./scripts/dev/start_infra.sh kafka    (Bật thêm Kafka & Kafka UI)"
echo "  ./scripts/dev/start_infra.sh mongo    (Bật thêm MongoDB)"
echo "  ./scripts/dev/start_infra.sh storage  (Bật thêm MinIO)"
echo "  ./scripts/dev/start_infra.sh full     (Bật toàn bộ)"
echo "=========================================================="
