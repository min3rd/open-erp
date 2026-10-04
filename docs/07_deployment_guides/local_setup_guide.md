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
| **Tối Thiểu (Mặc Định)** | `npm run infra` | **PostgreSQL Primary + Redis** | **~300 MB** | Dev chức năng Core, nghiệp vụ cơ bản, Web và Mobile |
| **Kafka Profile** | `npm run infra:kafka` | Tối thiểu + Kafka (KRaft) + Kafka UI | ~1.5 GB | Dev module giao tiếp bất đồng bộ, event-driven |
| **MongoDB Profile** | `npm run infra:mongo` | Tối thiểu + MongoDB Replica-Set | ~800 MB | Dev module audit logs, dynamic schemas |
| **Storage Profile** | `npm run infra:storage` | Tối thiểu + MinIO S3 Object Storage | ~600 MB | Dev tính năng upload, file attachments |
| **Mail Profile** | `npm run infra:mail` | Tối thiểu + Mailpit SMTP Testing | ~350 MB | Dev/test gửi email thông báo, xác nhận tài khoản |
| **Full Profile** | `npm run infra:full` | **Toàn bộ 8 dịch vụ** | **~6 - 8 GB** | Máy cấu hình mạnh, test tích hợp toàn diện |

---

## 3. Khởi Động Hạ Tầng

### 3.1. Chạy Dịch Vụ Tối Thiểu (Khuyến Nghị Mặc Định)
```bash
# Từ thư mục gốc dự án (đa nền tảng Windows/macOS/Linux)
npm run infra

# Hoặc dùng Makefile (Unix/Git Bash)
make infra

# Hoặc script shell
./scripts/dev/start_infra.sh
```

### 3.2. Chạy Thêm Dịch Vụ Nặng Theo Nhu Cầu
```bash
# Chỉ bật thêm Kafka khi dev sự kiện
npm run infra:kafka

# Chỉ bật thêm MongoDB khi dev dynamic forms/audit logs
npm run infra:mongo

# Chỉ bật thêm MinIO S3 khi dev upload/file
npm run infra:storage

# Chỉ bật thêm Mailpit SMTP khi dev email
npm run infra:mail

# Bật toàn bộ dịch vụ (chỉ khuyến nghị khi RAM >= 16GB)
npm run infra:full

# Xem trạng thái / dừng toàn bộ
npm run infra:ps
npm run infra:down
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

### 3.4. Khởi Động Nhanh Từ Thư Mục Gốc (Đa Nền Tảng)
Từ thư mục gốc dự án chỉ cần chạy 1 lệnh:
```bash
npm run dev
```
Script Node (`scripts/run.mjs`) sẽ:
1. Khởi động Docker infra: PostgreSQL Primary + Redis + Mailpit (`docker compose --profile mail up -d`).
2. Tự tạo database test `openerp_test` nếu chưa có (test **không** dùng chung `openerp_dev`).
3. Khởi chạy 3 tiến trình nền: Backend Quarkus (8088), Web Angular (4200), Mobile Ionic (8100).
4. Ghi log vào `logs/dev-backend.log`, `logs/dev-web.log`, `logs/dev-mobile.log`.

Dừng 3 tiến trình dev (giữ hạ tầng Docker):
```bash
npm run dev:stop
```

Hoặc chạy từng phần:
```bash
npm run infra          # Docker infra tối thiểu (PostgreSQL + Redis)
npm run infra:mail     # Docker infra + Mailpit
npm run backend        # Quarkus dev mode (port 8088)
npm run web            # Angular dev server (port 4200)
npm run mobile         # Ionic dev server (port 8100)
```

> **Lưu ý Java 25**: Quarkus 3.15 + ByteBuddy cần flag `-Dnet.bytebuddy.experimental=true`. Flag đã được cấu hình sẵn trong `pom.xml` (`jvm.args`) cho `mvn quarkus:dev` và được `npm run backend` / `npm run dev` set qua `JAVA_TOOL_OPTIONS` — không cần set thủ công.

### 3.5. Bootstrap Khóa JWT (Bắt Buộc Cho Fresh Clone)
Cặp khóa `privateKey.pem` / `publicKey.pem` **bị gitignore** (không bao giờ commit khóa bí mật), nên sau khi clone cần sinh khóa cho local:
```bash
npm run keys:jwt
```
- Script sinh RSA 2048 (private PKCS#8 + public SPKI) vào `src/backend/src/main/resources/` và `src/backend/src/test/resources/`.
- Tự động chạy khi thiếu khóa qua `npm run backend` / `npm run dev`.
- Tùy chọn: `--force` để ghi đè, `--out <dir>` để sinh vào thư mục khác.
- Với Staging/Production, khóa phải được cấp qua Secret Manager và mount vào container (không dùng khóa dev).

---

## 4. Chạy Ứng Dụng Trong Chế Độ Phát Triển (Live-Coding)

### 4.1. Chạy Backend Quarkus (Java 21+)
```bash
npm run backend
# Hoặc: make backend / ./scripts/dev/run_backend.sh
```
- Endpoint Backend: `http://localhost:8088`
- Quarkus Dev UI: `http://localhost:8088/q/dev/`

### 4.2. Chạy Web Desktop (Angular 22)
```bash
npm run web
# Hoặc: make web / ./scripts/dev/run_web.sh
```
- Truy cập trình duyệt: `http://localhost:4200`

### 4.3. Chạy Mobile App (Ionic 8 + Angular)
```bash
npm run mobile
# Hoặc: make mobile / ./scripts/dev/run_mobile.sh
```
- Truy cập trình duyệt: `http://localhost:8100`

### 4.4. Chạy Automated Test Backend (DB riêng `openerp_test`)
```bash
npm run backend:test
# Hoặc: mvn -f src/backend/pom.xml test
```
- Test chạy trên PostgreSQL thật + Redis thật (DB index 1), **không dùng H2**.
- Database `openerp_test` được tạo tự động bởi `npm run infra` / `npm run dev` (hoặc script `docker/postgres/init/01-create-test-database.sql` khi khởi tạo volume mới) — dữ liệu trên `openerp_dev` không bị ảnh hưởng.

---

## 5. Dừng & Giải Phóng Tài Nguyên
Sau khi hoàn thành phiên làm việc, luôn chạy lệnh sau để giải phóng RAM cho máy trạm:
```bash
make infra-down
```

---

## 6. Cấu Hình Platform Super Admin, Jobs Nền & CLI Quản Trị (Sprint 02)

### 6.1. Biến môi trường & cấu hình Quarkus

| Cấu hình | Biến môi trường | Mặc định | Mô tả |
| :--- | :--- | :--- | :--- |
| `openerp.platform.bootstrap-secret` | `OPENERP_ADMIN_BOOTSTRAP_SECRET` | (trống) | Secret bắt buộc để bootstrap first-run và chạy Offline CLI. Thiếu/sai → bootstrap **bỏ qua an toàn** + log `WARN` (không sập ứng dụng). **Không hardcode giá trị thật vào repo.** |
| `openerp.platform.bootstrap-emails` | `OPENERP_PLATFORM_BOOTSTRAP_EMAILS` | (trống) | CSV email được cấp `SUPER_ADMIN` khi hệ thống **không còn SUPER_ADMIN `ACTIVE`**. Bootstrap idempotent: email đã tồn tại → nâng cấp tài khoản hiện hữu, không tạo trùng; tài khoản tạo mới có `must_change_password = true` + `two_factor_required = true`. |
| `openerp.platform.plugin-catalog` | `OPENERP_PLATFORM_PLUGIN_CATALOG` | (trống → chỉ `core`) | CSV plugin tùy chọn cho `GET /api/v1/platform/plugins`, mỗi entry `key[:name_key[:description_key]]`. Ví dụ: `sales:PLUGIN_SALES_NAME:PLUGIN_SALES_DESCRIPTION,accounting` (entry không có name_key sẽ dùng key dẫn xuất `PLUGIN_<KEY>_NAME`/`..._DESCRIPTION`). Trùng key bị bỏ qua, `core` luôn bắt buộc. |
| `openerp.frontend.url` | `OPENERP_FRONTEND_URL` | local `http://localhost:4200`; `%prod` `https://openerp.9ms.io.vn` | URL frontend dùng trong email (xác thực, đặt lại mật khẩu, lời mời). Không hardcode URL trong mã nguồn. |
| `openerp.platform.impersonation-ttl-seconds` | `OPENERP_PLATFORM_IMPERSONATION_TTL_SECONDS` | `1800` | TTL tối đa phiên Impersonation (giây), không có refresh token. |
| `openerp.platform.deletion-grace-days` | `OPENERP_PLATFORM_DELETION_GRACE_DAYS` | `30` | Số ngày ân hạn trước khi tenant `PENDING_DELETION` → `DELETED`. |

> **Timezone**: toàn bộ timestamp lưu trong PostgreSQL/MongoDB theo **UTC** (kiểu `timestamptz`, backend trả `Z`); giao diện tự hiển thị theo timezone/locale người dùng. Không cấu hình TZ cho container theo giờ địa phương.

### 6.2. Jobs nền (background jobs)

| Cấu hình | Mặc định | Chức năng |
| :--- | :--- | :--- |
| `openerp.platform.audit.partition-interval-seconds` | `86400` | Tạo partition tháng cho `platform_audit_logs`. |
| `openerp.platform.audit.retention-interval-seconds` | `2592000` | Job retention dọn partition audit quá `retention-months` (24 tháng). |
| `openerp.platform.audit.retention-months` | `24` | Thời gian lưu hot storage. |
| `openerp.platform.lifecycle.interval-seconds` | `86400` | Job vòng đời tenant (`TRIAL` → `EXPIRED`, `PENDING_DELETION` → `DELETED`). |
| `openerp.platform.impersonation.interval-seconds` | `300` | Job sweeper đóng phiên Impersonation quá hạn (`STARTED` → `TIMEOUT`) — chạy trên **worker thread** để tránh lỗi JTA IO thread (BUG-82). |
| `openerp.platform.audit.jobs-enabled` / `lifecycle.jobs-enabled` / `impersonation.jobs-enabled` | `true` (dev/prod) | Bật/tắt từng nhóm job; profile `%test` tắt toàn bộ timer (test gọi job trực tiếp). |

Kiểm tra job chạy đúng: log tick đầu tiên phải xuất hiện trên `vert.x-worker-thread-*` (ví dụ `Impersonation timeout: N overdue session(s) moved to TIMEOUT`), không có dòng `Cannot start a JTA transaction from the IO thread`.

### 6.3. Bootstrap Super Admin lần đầu (local)

```bash
# 1) Đặt secret + email bootstrap (chỉ trong phiên shell, không commit)
export OPENERP_ADMIN_BOOTSTRAP_SECRET=doi-secret-manh-tai-day   # Windows PowerShell: $env:OPENERP_ADMIN_BOOTSTRAP_SECRET="..."
export OPENERP_PLATFORM_BOOTSTRAP_EMAILS=admin@congty.vn

# 2) Chạy backend (bootstrap tự chạy khi chưa có SUPER_ADMIN ACTIVE)
npm run backend
```

- Truy cập `http://localhost:8088/q/health` để xác nhận backend `UP`.
- Tài khoản bootstrap đăng nhập lần đầu sẽ bị buộc **đổi mật khẩu + bật 2FA**.

### 6.4. Offline CLI quản trị (`admin-cli`)

Dùng khi **mất toàn bộ SUPER_ADMIN** hoặc API không truy cập được. Yêu cầu `OPENERP_ADMIN_BOOTSTRAP_SECRET` + quyền truy cập DB/Redis.

```bash
# Chạy từ mã nguồn (dev)
cd src/backend
mvn quarkus:dev -Dquarkus.args="admin-cli list-admins"

# Chạy từ gói build (server)
java -jar target/quarkus-app/quarkus-run.jar admin-cli bootstrap
java -jar target/quarkus-app/quarkus-run.jar admin-cli list-admins
java -jar target/quarkus-app/quarkus-run.jar admin-cli grant-admin --email admin@congty.vn --role SUPER_ADMIN
java -jar target/quarkus-app/quarkus-run.jar admin-cli revoke-admin --email admin@congty.vn
```

- `--role` nhận `SUPER_ADMIN` hoặc `SUPPORT_ENGINEER`.
- CLI **không nhận mật khẩu qua tham số**; mọi thao tác ghi audit `actor_type = CLI`, `ip_address = local-console`; guards self-disable/last-admin vẫn áp dụng.
- Cảnh báo bảo mật: secret chỉ đặt qua biến môi trường của phiên vận hành, thu hồi/đổi ngay sau khi dùng xong; không lưu vào script hay shell history.
