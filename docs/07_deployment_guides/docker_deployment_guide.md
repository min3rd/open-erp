# Hướng Dẫn Triển Khai Hệ Thống Bằng Docker (Staging / On-Premise)

Tài liệu này hướng dẫn cách đóng gói và triển khai hệ thống `open-erp` trên máy chủ đơn sử dụng Docker Compose.

---

## 1. Quy Trình Đóng Gói Images (Build Container Images)

Trước khi triển khai, chạy script đóng gói:
```bash
# Đặt tên registry và tag phiên bản
export DOCKER_REGISTRY="your-registry.com/openerp"
export IMAGE_TAG="1.0.0"

./scripts/deploy/build_images.sh
```

Quá trình này sẽ build:
1. `Dockerfile.backend`: Multi-stage build Quarkus Java (JRE 21 Alpine).
2. `Dockerfile.web`: Multi-stage build Angular 22 với Nginx Alpine.

---

## 2. Triển Khai Môi Trường Staging
```bash
./scripts/deploy/deploy_docker.sh staging
```

Lệnh trên sử dụng cấu hình tại `deployments/docker/docker-compose.prod.yml` để khởi động các container với chính sách khởi động lại tự động (`restart: always`).

---

## 3. Kiểm Tra & Giám Sát Log
```bash
# Xem danh sách container
docker compose -f deployments/docker/docker-compose.prod.yml ps

# Xem log thời gian thực
docker compose -f deployments/docker/docker-compose.prod.yml logs -f --tail=100 backend
```
