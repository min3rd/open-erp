# Hướng Dẫn Cài Đặt & Chạy Môi Trường Local Development

Tài liệu này hướng dẫn chi tiết cách thiết lập môi trường phát triển cục bộ cho toàn bộ dự án `open-erp` với cơ chế **tối ưu tài nguyên máy trạm (Minimal Footprint)**.

---

## 1. Yêu Cầu Cài Đặt Ban Đầu (Prerequisites)
- **Hệ điều hành**: Windows 11 / macOS / Linux.
- **Docker & Docker Compose**: Docker Desktop phiên bản mới nhất.
- **Java**: Eclipse Temurin hoặc OpenJDK version **21+ LTS**.
- **Node.js**: Node.js v22.x LTS và npm v10+.
- **Công cụ dòng lệnh**:
  - `git`
  - `make` (trên Windows có thể dùng Git Bash hoặc cài qua Chocolatey `choco install make`).

---

## 2. Chiến Lược Tiết Kiệm Tài Nguyên (Minimal Service Footprint)

Do tài nguyên máy trạm của lập trình viên có hạn, dự án cấu hình phân tầng dịch vụ qua **Docker Compose Profiles**:

| Chế Độ | Lệnh Khởi Chạy | Dịch Vụ Khởi Chạy | Mức Chiếm Dụng RAM | Trường Hợp Sử Dụng |
| :--- | :--- | :--- | :--- | :--- |
| **Tối Thiểu (Mặc Định)** | `make infra` | **PostgreSQL Primary + Redis** | **~300 MB** | Dev chức năng Core, nghiệp vụ cơ bản, Web và Mobile |
| **Kafka Profile** | `make infra-kafka` | Tối thiểu + Kafka (KRaft) + Kafka UI | ~1.5 GB | Dev module giao tiếp bất đồng bộ, event-driven |
| **MongoDB Profile** | `make infra-mongo` | Tối thiểu + MongoDB Replica-Set | ~800 MB | Dev module audit logs, dynamic schemas |
| **Storage Profile** | `make infra-storage` | Tối thiểu + MinIO S3 Object Storage | ~600 MB | Dev tính năng upload, file attachments |
| **Mail Profile** | `make infra-mail` | Tối thiểu + Mailpit SMTP Testing | ~350 MB | Dev/test gửi email thông báo, xác nhận tài khoản |
| **Full Profile** | `make infra-full` | **Toàn bộ 8 dịch vụ** | **~6 - 8 GB** | Máy cấu hình mạnh, test tích hợp toàn diện |

---

## 3. Khởi Động Hạ Tầng

### 3.1. Chạy Dịch Vụ Tối Thiểu (Khuyến Nghị Mặc Định)
```bash
# Sử dụng Makefile
make infra

# Hoặc dùng script
./scripts/dev/start_infra.sh          # Linux / macOS
scripts\dev\start_infra.bat           # Windows CMD / PowerShell
```

### 3.2. Chạy Thêm Dịch Vụ Nặng Theo Nhu Cầu
```bash
# Chỉ bật thêm Kafka khi dev sự kiện
make infra-kafka
# Hoặc: ./scripts/dev/start_infra.sh kafka

# Chỉ bật thêm MongoDB khi dev dynamic forms/audit logs
make infra-mongo
# Hoặc: ./scripts/dev/start_infra.sh mongo

# Bật toàn bộ dịch vụ (chỉ khuyến nghị khi RAM >= 16GB)
make infra-full
# Hoặc: ./scripts/dev/start_infra.sh full
```

### 3.3. Danh Mục Cổng & Tài Khoản Cục Bộ:
- **PostgreSQL Primary (Tối thiểu)**: `localhost:5432` (User: `openerp`, Pass: `openerp_dev_password`, DB: `openerp_dev`)
- **Redis Cache (Tối thiểu)**: `localhost:6379` (Pass: `openerp_redis_password`)
- **PostgreSQL Replica (On-demand)**: `localhost:5433`
- **MongoDB Replica-Set (On-demand)**: `localhost:27017` (rs0)
- **Apache Kafka (On-demand)**: `localhost:9092`
- **Kafka Web Console (On-demand)**: `http://localhost:8085`
- **MinIO S3 Console (On-demand)**: `http://localhost:9001` (User: `openerp_minio_admin`, Pass: `openerp_minio_password`)
- **Mailpit SMTP Web (On-demand)**: `http://localhost:8025`

### 3.4. Khởi Động Nhanh Từ Thư Mục Gốc (Windows CMD)
Từ thư mục gốc dự án chỉ cần chạy 1 lệnh:
```bat
dev.bat
```
Script sẽ:
1. Khởi động Docker infra: PostgreSQL Primary + Redis + Mailpit (`docker compose --profile mail up -d`).
2. Tự tạo database test `openerp_test` nếu chưa có (test **không** dùng chung `openerp_dev`).
3. Mở 3 cửa sổ dev: Backend Quarkus (8088), Web Angular (4200), Mobile Ionic (8100).

Dừng toàn bộ:
```bat
stop-dev.bat
```

Hoặc chạy từng phần:
```bat
scripts\dev\start_infra.bat mail   # Docker infra + Mailpit
scripts\dev\run_backend.bat        # Quarkus dev mode (port 8088)
scripts\dev\run_web.bat            # Angular dev server (port 4200)
scripts\dev\run_mobile.bat         # Ionic dev server (port 8100)
```

> **Lưu ý Java 25**: Quarkus 3.15 + ByteBuddy cần flag `-Dnet.bytebuddy.experimental=true`. Flag đã được cấu hình sẵn trong `pom.xml` (`jvm.args`) cho `mvn quarkus:dev` và trong `run_backend.bat` (`JAVA_TOOL_OPTIONS`) — không cần set thủ công.

### 3.5. Bootstrap Khóa JWT (Bắt Buộc Cho Fresh Clone)
Cặp khóa `privateKey.pem` / `publicKey.pem` **bị gitignore** (không bao giờ commit khóa bí mật), nên sau khi clone cần sinh khóa cho local:
```bat
node scripts\dev\generate_jwt_keys.js
```
- Script sinh RSA 2048 (private PKCS#8 + public SPKI) vào `src/backend/src/main/resources/` và `src/backend/src/test/resources/`.
- Tự động chạy khi thiếu khóa qua `scripts\dev\run_backend.bat` / `run_backend.sh` hoặc `dev.bat`.
- Tùy chọn: `--force` để ghi đè, `--out <dir>` để sinh vào thư mục khác.
- Với Staging/Production, khóa phải được cấp qua Secret Manager và mount vào container (không dùng khóa dev).

---

## 4. Chạy Ứng Dụng Trong Chế Độ Phát Triển (Live-Coding)

### 4.1. Chạy Backend Quarkus (Java 21+)
```bash
make backend
# Hoặc: ./scripts/dev/run_backend.sh (Windows: scripts\dev\run_backend.bat)
```
- Endpoint Backend: `http://localhost:8088`
- Quarkus Dev UI: `http://localhost:8088/q/dev/`

### 4.2. Chạy Web Desktop (Angular 22)
```bash
make web
# Hoặc: ./scripts/dev/run_web.sh (Windows: scripts\dev\run_web.bat)
```
- Truy cập trình duyệt: `http://localhost:4200`

### 4.3. Chạy Mobile App (Ionic 8 + Angular)
```bash
make mobile
# Hoặc: ./scripts/dev/run_mobile.sh (Windows: scripts\dev\run_mobile.bat)
```
- Truy cập trình duyệt: `http://localhost:8100`

### 4.4. Chạy Automated Test Backend (DB riêng `openerp_test`)
```bat
cd src\backend
mvn test
```
- Test chạy trên PostgreSQL thật + Redis thật (DB index 1), **không dùng H2**.
- Database `openerp_test` được tạo tự động bởi `scripts\dev\start_infra.bat` (hoặc script `docker/postgres/init/01-create-test-database.sql` khi khởi tạo volume mới) — dữ liệu trên `openerp_dev` không bị ảnh hưởng.

---

## 5. Dừng & Giải Phóng Tài Nguyên
Sau khi hoàn thành phiên làm việc, luôn chạy lệnh sau để giải phóng RAM cho máy trạm:
```bash
make infra-down
```
