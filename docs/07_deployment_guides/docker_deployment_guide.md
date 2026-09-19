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

---

## 4. Cấu Hình Platform Super Admin (Sprint 02)

Các biến môi trường bắt buộc/khuyến nghị cho container Backend khi vận hành nền tảng:

| Biến môi trường | Bắt buộc | Mô tả |
| :--- | :---: | :--- |
| `OPENERP_ADMIN_BOOTSTRAP_SECRET` | Có (lần đầu/khẩn cấp) | Secret cho bootstrap first-run và Offline CLI. Cấp qua Docker secret/secret manager; không ghi vào file compose trong repo. |
| `OPENERP_PLATFORM_BOOTSTRAP_EMAILS` | Có (lần đầu) | CSV email Super Admin khởi tạo. Bootstrap chỉ chạy khi **không còn SUPER_ADMIN `ACTIVE`**. |
| `OPENERP_PLATFORM_PLUGIN_CATALOG` | Khuyến nghị | CSV plugin tùy chọn cho danh mục `GET /api/v1/platform/plugins`, dạng `key[:name_key[:description_key]]`. Để trống → chỉ có `core`. |
| `OPENERP_FRONTEND_URL` | Có | URL frontend dùng trong email (mặc định `%prod`: `https://openerp.9ms.io.vn`). Không hardcode URL trong mã nguồn. |
| `OPENERP_CORS_ORIGINS` | Có | Danh sách origin được phép gọi API. |
| `OPENERP_JWT_PUBLIC_KEY` / `OPENERP_JWT_PRIVATE_KEY` | Có | Cặp khóa JWT mount từ secret manager (không dùng khóa dev). |

- TTL Impersonation mặc định `1800` giây (`OPENERP_PLATFORM_IMPERSONATION_TTL_SECONDS` nếu cần chỉnh).
- Jobs nền (`audit partition/retention`, `tenant lifecycle`, `impersonation timeout`) mặc định bật — xem [local_setup_guide.md](local_setup_guide.md) mục 6.2.
- **Lưu ý timezone**: CSDL lưu timestamps theo **UTC**; không đặt biến TZ giờ địa phương cho container DB/Backend.
- Vận hành khẩn cấp (mất toàn bộ admin): chạy Offline CLI trong container backend:
  ```bash
  docker compose -f deployments/docker/docker-compose.prod.yml exec backend \
    java -jar quarkus-run.jar admin-cli list-admins
  ```
  Danh sách lệnh: `bootstrap`, `list-admins`, `grant-admin --email X --role R`, `revoke-admin --email X`; audit ghi `actor_type = CLI`.
