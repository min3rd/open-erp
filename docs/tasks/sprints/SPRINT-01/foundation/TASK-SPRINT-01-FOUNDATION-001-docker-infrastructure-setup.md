# TASK-SPRINT-01-FOUNDATION-001: Thiết lập hạ tầng Docker Compose

## Thông tin
| Thuộc tính | Giá trị |
|---|---|
| Task ID | TASK-SPRINT-01-FOUNDATION-001 |
| Sprint | Sprint 01 |
| Cluster | foundation |
| Loại | DevOps |
| Người phụ trách | DevOps |
| Story Points | 5 |
| Trạng thái | ⬜ TODO |
| Phụ thuộc | Không có |

## Mô tả
Thiết lập toàn bộ môi trường phát triển cục bộ bằng Docker Compose, bao gồm tất cả infrastructure services (MongoDB, Redis, RabbitMQ, MinIO, Qdrant) và khung cấu trúc monorepo cho tất cả microservices. Đây là task nền tảng mà tất cả các task khác phụ thuộc vào.

## Phạm vi kỹ thuật

### DevOps
- Tạo `docker-compose.yml` với tất cả infrastructure services:
  - MongoDB 7 (Replica Set 1 node cho dev, port 27017)
  - Redis 7 Alpine (port 6379)
  - RabbitMQ 3.13 Management (port 5672, 15672)
  - MinIO latest (port 9000, 9001)
  - Qdrant latest (port 6333)
- Tạo `docker-compose.override.yml` cho dev (volume mounts, hot reload)
- Tạo `.env.example` với tất cả biến môi trường cần thiết
- Tạo `Makefile` với các lệnh tiện ích: `make up`, `make down`, `make logs`, `make clean`
- Cấu hình Docker network: `openErp-network` (bridge)
- Cấu hình volume persistence cho MongoDB, Redis, RabbitMQ, MinIO, Qdrant
- Script khởi tạo MongoDB Replica Set: `scripts/init-mongo.sh`
- Script tạo MinIO buckets: `scripts/init-minio.sh`
- Script seed RabbitMQ exchanges và queues: `scripts/init-rabbitmq.sh`
- Dockerfile mẫu cho NestJS microservice (multi-stage build)
- `.dockerignore` cho Node.js projects

### Backend (NestJS)
- Tạo cấu trúc monorepo `open-erp-backend/`:
  ```
  open-erp-backend/
  ├── package.json (workspace root)
  ├── nest-cli.json (monorepo config)
  ├── tsconfig.base.json
  ├── services/
  │   ├── api-gateway/
  │   ├── auth-service/
  │   ├── tenant-service/
  │   ├── user-service/
  │   ├── rbac-service/
  │   ├── catalog-service/
  │   ├── audit-service/
  │   ├── notification-service/
  │   └── storage-service/
  └── libs/
      ├── common/          ← Shared DTOs, decorators, guards, interceptors
      ├── database/        ← Mongoose connection, base schemas
      └── messaging/       ← RabbitMQ client, event patterns
  ```
- Tạo `libs/common/` với:
  - `TenantContextDto`
  - `PaginationDto`
  - `ApiResponseDto`
  - `TenantMiddleware` (skeleton)
  - `JwtAuthGuard` (skeleton)
  - `RbacGuard` (skeleton)
  - `BaseService<T>` abstract class
  - `TenantAwareRepository<T>` abstract class
- Tạo `libs/database/` với:
  - `MongooseModule` config helper
  - `BaseSchema` mixin (timestamps, tenantId, isDeleted)
- Tạo `libs/messaging/` với:
  - RabbitMQ ClientProxy factory
  - Event pattern constants

## Database (MongoDB)
- Collections: Không có (chỉ thiết lập kết nối)
- Indexes: Không có (từng service sẽ tạo indexes riêng)
- Replica Set initialization script

## API Endpoints
Không có (task hạ tầng)

## Acceptance Criteria
- [ ] `docker-compose up` chạy thành công, tất cả services healthy
- [ ] MongoDB Replica Set khởi tạo thành công (kiểm tra bằng `rs.status()`)
- [ ] MinIO console accessible tại `http://localhost:9001`
- [ ] RabbitMQ Management UI accessible tại `http://localhost:15672`
- [ ] Qdrant API accessible tại `http://localhost:6333`
- [ ] Cấu trúc monorepo backend tạo đúng theo spec
- [ ] `libs/common`, `libs/database`, `libs/messaging` compile không lỗi
- [ ] `.env.example` có đầy đủ biến môi trường
- [ ] `README.md` có hướng dẫn setup dev environment

## Ghi chú kỹ thuật
- MongoDB dev chỉ cần 1 node replica set (để support transactions nếu cần)
- MinIO admin credentials trong .env: `MINIO_ROOT_USER=openErp`, `MINIO_ROOT_PASSWORD=openErp123`
- RabbitMQ default credentials: `guest/guest` (chỉ dev)
- Sử dụng `healthcheck` trong docker-compose để services downstream chờ infrastructure ready
- Node.js version: 20 LTS Alpine trong Dockerfile
- NestJS monorepo dùng cấu hình `projects` trong `nest-cli.json`
