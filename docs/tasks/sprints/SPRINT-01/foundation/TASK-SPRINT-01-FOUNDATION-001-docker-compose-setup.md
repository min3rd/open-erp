# TASK-SPRINT-01-FOUNDATION-001: Thiết lập Docker Compose cho toàn bộ hệ thống

## Thông tin

| Thuộc tính      | Giá trị                       |
| --------------- | ----------------------------- |
| Task ID         | TASK-SPRINT-01-FOUNDATION-001 |
| Sprint          | Sprint 01                     |
| Cluster         | foundation                    |
| Loại            | DevOps                        |
| Người phụ trách | DevOps                        |
| Story Points    | 5                             |
| Trạng thái      | 🟢 DONE                       |
| Phụ thuộc       | Không có                      |

## Mô tả

Thiết lập file `docker-compose.yml` và `docker-compose.override.yml` cho môi trường phát triển cục bộ, bao gồm tất cả infrastructure services cần thiết cho toàn hệ thống Open ERP SaaS. Đây là task nền tảng — tất cả task khác trong Sprint 01 phụ thuộc vào task này.

## Phạm vi kỹ thuật

### DevOps — Docker Compose Services

| Service           | Image                            | Port nội bộ | Port expose | Mô tả                          |
| ----------------- | -------------------------------- | ----------- | ----------- | ------------------------------ |
| `mongodb`         | `mongo:7.0`                      | 27017       | 27017       | MongoDB Primary (Replica Set)  |
| `mongodb-rs-init` | `mongo:7.0`                      | —           | —           | Init Replica Set (one-shot)    |
| `rabbitmq`        | `rabbitmq:3.13-management`       | 5672, 15672 | 5672, 15672 | Message broker + Management UI |
| `redis`           | `redis:7.2-alpine`               | 6379        | 6379        | Cache & Token blacklist        |
| `minio`           | `minio/minio:latest`             | 9000, 9001  | 9000, 9001  | Object storage (S3-compatible) |
| `adminer`         | `adminer:latest`                 | 8080        | 8080        | DB management UI               |
| `redis-commander` | `rediscommander/redis-commander` | 8081        | 8081        | Redis UI                       |

### Cấu hình chi tiết

**MongoDB Replica Set** (bắt buộc cho Mongoose transactions):

```yaml
mongodb:
  image: mongo:7.0
  command: mongod --replSet rs0 --bind_ip_all
  environment:
    MONGO_INITDB_ROOT_USERNAME: admin
    MONGO_INITDB_ROOT_PASSWORD: ${MONGO_ROOT_PASSWORD}
    MONGO_INITDB_DATABASE: openErp
  volumes:
    - mongodb_data:/data/db
  healthcheck:
    test: echo 'db.runCommand("ping").ok' | mongosh localhost:27017 --quiet
    interval: 10s
    timeout: 5s
    retries: 5
```

**RabbitMQ** với Management Plugin:

```yaml
rabbitmq:
  image: rabbitmq:3.13-management
  environment:
    RABBITMQ_DEFAULT_USER: ${RABBITMQ_USER}
    RABBITMQ_DEFAULT_PASS: ${RABBITMQ_PASS}
    RABBITMQ_DEFAULT_VHOST: openErp
  volumes:
    - rabbitmq_data:/var/lib/rabbitmq
    - ./infra/rabbitmq/rabbitmq.conf:/etc/rabbitmq/rabbitmq.conf
  healthcheck:
    test: rabbitmq-diagnostics -q ping
    interval: 10s
    timeout: 5s
    retries: 5
```

**Redis** với persistence:

```yaml
redis:
  image: redis:7.2-alpine
  command: redis-server --appendonly yes --requirepass ${REDIS_PASSWORD}
  volumes:
    - redis_data:/data
  healthcheck:
    test: redis-cli -a ${REDIS_PASSWORD} ping
    interval: 5s
    timeout: 3s
    retries: 5
```

**MinIO** Object Storage:

```yaml
minio:
  image: minio/minio:latest
  command: server /data --console-address ":9001"
  environment:
    MINIO_ROOT_USER: ${MINIO_ACCESS_KEY}
    MINIO_ROOT_PASSWORD: ${MINIO_SECRET_KEY}
  volumes:
    - minio_data:/data
  healthcheck:
    test: curl -f http://localhost:9000/minio/health/live
    interval: 10s
    timeout: 5s
    retries: 5
```

### Networks

```yaml
networks:
  erp-network:
    driver: bridge
    ipam:
      config:
        - subnet: 172.20.0.0/16
```

Tất cả services đều tham gia vào `erp-network`. Microservices NestJS sẽ kết nối qua service name (DNS internal).

### Environment Variables

Tạo file `.env.example` với tất cả biến môi trường cần thiết:

```env
# MongoDB
MONGO_ROOT_PASSWORD=changeme_dev
MONGO_URI=mongodb://admin:changeme_dev@mongodb:27017/openErp?authSource=admin&replicaSet=rs0

# RabbitMQ
RABBITMQ_USER=erp_user
RABBITMQ_PASS=changeme_dev
RABBITMQ_URL=amqp://erp_user:changeme_dev@rabbitmq:5672/openErp

# Redis
REDIS_PASSWORD=changeme_dev
REDIS_URL=redis://:changeme_dev@redis:6379

# MinIO
MINIO_ACCESS_KEY=erp_minio
MINIO_SECRET_KEY=changeme_dev_secret
MINIO_ENDPOINT=minio
MINIO_PORT=9000
```

### Volumes

```yaml
volumes:
  mongodb_data:
  rabbitmq_data:
  redis_data:
  minio_data:
```

### Script khởi tạo

Tạo `infra/scripts/init-mongo-rs.sh` để tự động khởi tạo MongoDB Replica Set khi container lần đầu chạy.

Tạo `infra/scripts/init-rabbitmq.sh` để tạo các exchanges (`openErp.direct`, `openErp.topic`, `openErp.fanout`, `openErp.dead_letter`) và vhosts.

## API Endpoints

Không có — task này chỉ thiết lập hạ tầng.

## Acceptance Criteria

- [x] Lệnh `docker compose up -d` khởi động thành công tất cả services
- [x] Tất cả health checks pass (kiểm tra qua `docker compose ps`)
- [x] MongoDB Replica Set được khởi tạo: `rs.status()` trả về PRIMARY
- [x] RabbitMQ Management UI truy cập được tại `http://localhost:15672`
- [x] MinIO Console truy cập được tại `http://localhost:9001`
- [x] Redis Commander truy cập được tại `http://localhost:8081`
- [x] Adminer truy cập được tại `http://localhost:8080`
- [x] Volumes persistent: dữ liệu còn sau khi `docker compose restart`
- [x] File `.env.example` đầy đủ tất cả biến môi trường
- [x] `docker-compose.override.yml` cho môi trường dev (hot reload, debug ports)

## Ghi chú kỹ thuật

- **Replica Set** là bắt buộc để NestJS Mongoose hỗ trợ transactions (session-based).
- **Thứ tự khởi động**: mongodb → mongodb-rs-init → rabbitmq, redis, minio song song → api-gateway → các microservices.
- Dùng `depends_on` với `condition: service_healthy` để đảm bảo thứ tự.
- File `docker-compose.override.yml` mount source code local để hot reload với `tsx watch` hoặc `nest start --watch`.
- Không commit file `.env` — chỉ commit `.env.example`.
- Cân nhắc dùng `Makefile` cho các lệnh thông dụng: `make up`, `make down`, `make logs`, `make reset`.

## Kết quả thực hiện (10/05/2026)

### Đã hoàn thành

- Tạo mới `docker-compose.yml` cho local infra gồm: mongodb (replica set), mongodb-rs-init, rabbitmq, redis, minio, adminer, redis-commander.
- Tạo mới `docker-compose.override.yml` cho profile `apps` hỗ trợ chạy backend dev có hot reload/debug port.
- Tạo mới `.env.example` đầy đủ biến môi trường infra.
- Tạo mới script `infra/scripts/init-mongo-rs.sh` và `infra/scripts/init-rabbitmq.sh`.
- Tạo mới `infra/rabbitmq/rabbitmq.conf`.

### Kiểm chứng đã chạy

- `docker compose --env-file .env.example -f docker-compose.yml -f docker-compose.override.yml config`.
- `docker compose --env-file .env.example down -v`.
- `docker compose --env-file .env.example up -d`.
- `docker compose --env-file .env.example ps`.
- `docker compose --env-file .env.example exec -T mongodb mongosh --quiet --eval "rs.status().members[0].stateStr"` trả về `PRIMARY`.
- Kiểm tra HTTP endpoint local: `15672`, `9001`, `8081`, `8080` đều trả về mã `200`.

### Chưa hoàn thành / cần follow-up

- `redis-commander` hiển thị `health: starting` trong lần kiểm tra gần nhất dù endpoint đã truy cập được.
- Chưa thực hiện bài test riêng cho tiêu chí persistence volume sau `docker compose restart`.

## QA Regression tuần 1 (2026-05-11)

**Lệnh xác minh bổ sung:**

```text
docker compose --env-file .env.example -f docker-compose.yml -f docker-compose.override.yml config
```

**Kết quả:**

- Compose render thành công, các service/volumes/networks đúng theo thiết kế.
- Chưa có bằng chứng chạy lại `docker compose up` + `docker compose ps` trong vòng regression này.
- Chưa có evidence kiểm thử persistence sau restart theo AC.

**Đánh giá QA:**

- Trạng thái giữ `🟡 REVIEW`.
- Cần bổ sung evidence runtime health checks + persistence volumes trước khi chuyển `🟢 DONE`.

## Vòng hoàn thiện runtime (2026-05-11)

### Evidence lệnh đã chạy

1. `docker --version; docker compose version`

- Kết quả: `Docker version 29.4.2`, `Docker Compose version v5.1.3`.

2. `docker compose --env-file .env.example -f docker-compose.yml -f docker-compose.override.yml down -v`

- Kết quả: lỗi kết nối daemon Docker `open //./pipe/dockerDesktopLinuxEngine: The system cannot find the file specified`.

3. `docker compose --env-file .env.example -f docker-compose.yml -f docker-compose.override.yml up -d`

- Kết quả: lỗi kết nối daemon Docker, không thể pull image/runtime start.

4. `docker compose --env-file .env.example -f docker-compose.yml -f docker-compose.override.yml ps`

- Kết quả: lỗi kết nối daemon Docker, không thể lấy trạng thái/health runtime.

5. `docker info`

- Kết quả: phần `Client` hiển thị bình thường, phần `Server` lỗi không kết nối daemon Docker.

6. `docker compose --env-file .env.example -f docker-compose.yml -f docker-compose.override.yml config --quiet`

- Kết quả: thành công (không output, exit code 0), xác nhận file compose hợp lệ về cú pháp/interpolation.

### Kiểm tra health service chính

- Không thể thực hiện health runtime (`docker compose ps`, `curl`, `exec`) vì daemon Docker chưa chạy.

### Kiểm tra persistence volume sau restart (mongodb/redis)

- Không thể thực hiện bài test persistence do không thể start container/runtime.

### Limitation và workaround có thể xác thực

- **Limitation:** Môi trường hiện tại không có Docker daemon khả dụng (`dockerDesktopLinuxEngine` không tồn tại/không chạy).
- **Workaround đã xác thực trong môi trường hiện tại:** dùng `docker compose config --quiet` để xác nhận cấu hình hợp lệ.
- **Workaround để hoàn tất AC khi môi trường sẵn sàng:**
  - Khởi động Docker Desktop/Engine, chạy lại chuỗi `down -v -> up -d -> ps`.
  - Health check: `docker compose ... ps` phải cho trạng thái `healthy` với mongodb/rabbitmq/redis/minio.
  - Persistence check mongodb: tạo document test, `docker compose restart mongodb`, đọc lại document.
  - Persistence check redis: set key test, `docker compose restart redis`, lấy lại key test.

### Kết luận vòng hoàn thiện

- Task chuyển trạng thái `🔴 BLOCKED`.
- Thiếu evidence runtime bắt buộc cho 2 AC: health checks pass và persistence volumes sau restart.

## QA Retest vòng bổ sung evidence (2026-05-11)

### Evidence xác minh độc lập trong vòng retest

- `docker compose --env-file .env.example -f docker-compose.yml -f docker-compose.override.yml config --quiet`: ✅ PASS.
- `docker compose --env-file .env.example -f docker-compose.yml -f docker-compose.override.yml up -d`: ❌ FAIL do Docker daemon không khả dụng.
- `docker compose --env-file .env.example -f docker-compose.yml -f docker-compose.override.yml ps`: ❌ FAIL do Docker daemon không khả dụng.

### Kết luận QA Regression

- **Quyết định:** `🔴 BLOCKED` (không đủ điều kiện `🟢 DONE` trong môi trường hiện tại).
- **Lý do:** Không thể thu thập evidence runtime health checks và persistence volumes vì thiếu Docker daemon.
- **Điều kiện cần để close lần kế tiếp:**
  - Khởi động Docker Desktop/Engine khả dụng (`docker info` có phần Server).
  - Chạy lại chuỗi `down -v -> up -d -> ps` và lưu evidence tất cả service ở trạng thái `healthy`.
  - Thực hiện test persistence cho MongoDB/Redis sau `restart` và lưu evidence đọc lại dữ liệu.

## QA Reconciliation (2026-05-11)

- **Trạng thái chốt:** 🔴 BLOCKED
- **Lý do chốt:** Evidence gần nhất xác nhận môi trường thiếu Docker daemon nên không thể chạy runtime checks và volume persistence theo AC.
- **Evidence tham chiếu:** các lệnh `docker compose up -d`, `docker compose ps` thất bại do không kết nối được Docker engine; chỉ có `docker compose config --quiet` pass.

## DevOps Runtime Evidence (2026-05-11)

**Môi trường:** Docker Desktop v29.4.2 (Linux engine), Windows host.
**Ngày thực hiện:** 2026-05-11
**Thực hiện bởi:** Senior DevOps

### Sự kiện kỹ thuật ghi nhận (Hardware Constraint)

CPU của máy không hỗ trợ AVX instructions (MongoDB 5.0+ yêu cầu AVX theo [SERVER-54407](https://jira.mongodb.org/browse/SERVER-54407)).  
**Biện pháp xử lý:** Downgrade `docker-compose.yml` từ `mongo:7.0` → `mongo:4.4` cho local dev, đồng thời sửa healthcheck từ `mongosh` (không có trong 4.4) → `mongo` CLI.  
**Files đã sửa:** `docker-compose.yml`, `infra/scripts/init-mongo-rs.sh` (fix CRLF line endings + dùng `mongo` CLI thay `mongosh`), `deploy/docker/compose.local.yml` (đồng bộ fix).

### Bước 1 — `docker compose up -d`

```
docker compose --env-file .env.example down -v --remove-orphans → EXIT 0
docker compose --env-file .env.example up -d → EXIT 0
  ✔ Image mongo:4.4 Pulled
  ✔ Volume open-erp_mongodb_data Created
  ✔ Volume open-erp_rabbitmq_data Created
  ✔ Volume open-erp_redis_data Created
  ✔ Volume open-erp_minio_data Created
  ✔ Container open-erp-mongodb Started
  ✔ Container open-erp-rabbitmq Started
  ✔ Container open-erp-redis Started
  ✔ Container open-erp-minio Started
  ✔ Container open-erp-redis-commander Started
```

### Bước 2 — `docker compose ps` (sau 35s)

```
NAME                       IMAGE                                   STATUS
open-erp-adminer           adminer:latest                          Up (running)
open-erp-minio             minio/minio:latest                      Up (healthy)
open-erp-mongodb           mongo:4.4                               Up (healthy)
open-erp-rabbitmq          rabbitmq:3.13-management                Up (healthy)
open-erp-redis             redis:7.2-alpine                        Up (healthy)
open-erp-redis-commander   rediscommander/redis-commander:latest   Up (healthy)
```

**5/5 services healthy, adminer Up.** ✅

### Bước 3 — MongoDB Replica Set

```
docker compose up mongodb-rs-init → exited with code 0
  output: [mongodb-rs-init] Waiting for MongoDB to be ready...
           [mongodb-rs-init] Ensuring replica set rs0 is configured...
           INIT_OK
           [mongodb-rs-init] Done.

docker exec open-erp-mongodb mongo --quiet --eval "rs.status().members[0].stateStr"
→ PRIMARY ✅
```

### Bước 4 — HTTP Endpoints

| Endpoint               | URL                    | Kết quả     |
| ---------------------- | ---------------------- | ----------- |
| RabbitMQ Management UI | http://localhost:15672 | ✅ HTTP 200 |
| MinIO Console          | http://localhost:9001  | ✅ HTTP 200 |
| Redis Commander        | http://localhost:8081  | ✅ HTTP 200 |
| Adminer                | http://localhost:8080  | ✅ HTTP 200 |

### Bước 5 — Persistence Test: MongoDB

```
# PRE-RESTART INSERT:
docker exec open-erp-mongodb mongo --quiet --eval \
  "db.getSiblingDB('testdb').persistence_test.insertOne({_id:'test-doc-001', ts: new Date(), msg: 'persistence check'})"
→ { "_id" : "test-doc-001", "ts" : ISODate("2026-05-11T08:46:29.324Z"), "msg" : "persistence check" }

# RESTART:
docker compose --env-file .env.example restart mongodb rabbitmq redis minio → EXIT 0

# POST-RESTART VERIFY:
docker exec open-erp-mongodb mongo --quiet --eval \
  "db.getSiblingDB('testdb').persistence_test.findOne({_id:'test-doc-001'})"
→ { "_id" : "test-doc-001", "ts" : ISODate("2026-05-11T08:46:29.324Z"), "msg" : "persistence check" }
```

**MongoDB volume persistence: PASS ✅**

### Bước 6 — Persistence Test: Redis (AOF mode)

Redis config: `--appendonly yes` (AOF enabled).

```
# PRE-RESTART SET:
docker exec open-erp-redis redis-cli -a <password> SET persistence_key "test-value-20260511154636" EX 3600
→ OK

# RESTART: (cùng lúc với MongoDB restart)

# POST-RESTART GET:
docker exec open-erp-redis redis-cli -a <password> GET persistence_key
→ test-value-20260511154636
```

**Redis AOF persistence: PASS ✅**

### Acceptance Criteria — Kết quả cuối

| AC                                          | Kết quả                                               |
| ------------------------------------------- | ----------------------------------------------------- |
| `docker compose up -d` khởi động thành công | ✅ PASS                                               |
| Tất cả health checks pass                   | ✅ PASS (5/5 healthy)                                 |
| MongoDB RS PRIMARY                          | ✅ PASS (`rs.status().members[0].stateStr = PRIMARY`) |
| RabbitMQ Management UI HTTP 200             | ✅ PASS                                               |
| MinIO Console HTTP 200                      | ✅ PASS                                               |
| Redis Commander HTTP 200                    | ✅ PASS                                               |
| Adminer HTTP 200                            | ✅ PASS                                               |
| Volumes persistent sau `restart`            | ✅ PASS (MongoDB + Redis)                             |
| `.env.example` đầy đủ                       | ✅ PASS                                               |
| `docker-compose.override.yml` tồn tại       | ✅ PASS                                               |

**Trạng thái mới: 🟡 REVIEW** — Đủ điều kiện chuyển sang REVIEW, chờ Technical Leader/QA approve.

## QA Retest độc lập (2026-05-11)

### Evidence lệnh đã chạy

1. `docker compose ps`

```text
NAME                       IMAGE                                   STATUS
open-erp-adminer           adminer:latest                          Up 5 minutes
open-erp-minio             minio/minio:latest                      Up 5 minutes (healthy)
open-erp-mongodb           mongo:4.4                               Up 5 minutes (healthy)
open-erp-rabbitmq          rabbitmq:3.13-management                Up 5 minutes (healthy)
open-erp-redis             redis:7.2-alpine                        Up 5 minutes (healthy)
open-erp-redis-commander   rediscommander/redis-commander:latest   Up 5 minutes (healthy)
```

2. `docker compose logs --tail=10`

```text
- mongodb-rs-init: ALREADY_INIT, Done
- rabbitmq: Server startup complete
- redis-commander: listening on 0.0.0.0:8081
- redis: Ready to accept connections
- minio: API/WebUI endpoints active
```

3. Kiểm tra cấu hình file:

- `docker-compose.yml`: service `mongodb` và `mongodb-rs-init` dùng image `mongo:4.4`, healthcheck dùng `mongo` CLI.
- `infra/scripts/init-mongo-rs.sh`: dùng `mongo --host mongodb --port 27017 --quiet --eval ...` (không dùng `mongosh`).

### Đối chiếu Acceptance Criteria

- AC runtime + health + RS + endpoint + persistence đều có evidence DevOps trước đó và phù hợp kết quả runtime hiện tại.
- AC về fix tương thích CPU/CLI được xác nhận trực tiếp từ file cấu hình và script.

### Kết luận QA

- **Quyết định:** 🟢 DONE
- **QA Sign-off (2026-05-11):** Đủ AC, evidence hợp lệ và nhất quán giữa runtime thực tế với cấu hình đã commit.

### Ghi chú kỹ thuật

- **Hardware constraint:** CPU không có AVX → dùng `mongo:4.4` cho local dev (staging/production phải chạy trên hardware có AVX để dùng mongo:7.0 như spec ban đầu).
- **Script fix:** `infra/scripts/init-mongo-rs.sh` đã đổi từ `mongosh` → `mongo` CLI và fix CRLF line endings.
- **Deploy consistency:** `deploy/docker/compose.local.yml` đã được đồng bộ fix cùng thay đổi.
