# TASK-SPRINT-01-FOUNDATION-001: Thiết lập Docker Compose cho toàn bộ hệ thống

## Thông tin

| Thuộc tính       | Giá trị                          |
|------------------|----------------------------------|
| Task ID          | TASK-SPRINT-01-FOUNDATION-001    |
| Sprint           | Sprint 01                        |
| Cluster          | foundation                       |
| Loại             | DevOps                           |
| Người phụ trách  | DevOps                           |
| Story Points     | 5                                |
| Trạng thái       | ⬜ TODO                          |
| Phụ thuộc        | Không có                         |

## Mô tả

Thiết lập file `docker-compose.yml` và `docker-compose.override.yml` cho môi trường phát triển cục bộ, bao gồm tất cả infrastructure services cần thiết cho toàn hệ thống Open ERP SaaS. Đây là task nền tảng — tất cả task khác trong Sprint 01 phụ thuộc vào task này.

## Phạm vi kỹ thuật

### DevOps — Docker Compose Services

| Service           | Image                     | Port nội bộ | Port expose | Mô tả                          |
|-------------------|---------------------------|-------------|-------------|--------------------------------|
| `mongodb`         | `mongo:7.0`               | 27017       | 27017       | MongoDB Primary (Replica Set)  |
| `mongodb-rs-init` | `mongo:7.0`               | —           | —           | Init Replica Set (one-shot)    |
| `rabbitmq`        | `rabbitmq:3.13-management`| 5672, 15672 | 5672, 15672 | Message broker + Management UI |
| `redis`           | `redis:7.2-alpine`        | 6379        | 6379        | Cache & Token blacklist        |
| `minio`           | `minio/minio:latest`      | 9000, 9001  | 9000, 9001  | Object storage (S3-compatible) |
| `adminer`         | `adminer:latest`          | 8080        | 8080        | DB management UI               |
| `redis-commander` | `rediscommander/redis-commander` | 8081 | 8081       | Redis UI                       |

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

- [ ] Lệnh `docker compose up -d` khởi động thành công tất cả services
- [ ] Tất cả health checks pass (kiểm tra qua `docker compose ps`)
- [ ] MongoDB Replica Set được khởi tạo: `rs.status()` trả về PRIMARY
- [ ] RabbitMQ Management UI truy cập được tại `http://localhost:15672`
- [ ] MinIO Console truy cập được tại `http://localhost:9001`
- [ ] Redis Commander truy cập được tại `http://localhost:8081`
- [ ] Adminer truy cập được tại `http://localhost:8080`
- [ ] Volumes persistent: dữ liệu còn sau khi `docker compose restart`
- [ ] File `.env.example` đầy đủ tất cả biến môi trường
- [ ] `docker-compose.override.yml` cho môi trường dev (hot reload, debug ports)

## Ghi chú kỹ thuật

- **Replica Set** là bắt buộc để NestJS Mongoose hỗ trợ transactions (session-based).
- **Thứ tự khởi động**: mongodb → mongodb-rs-init → rabbitmq, redis, minio song song → api-gateway → các microservices.
- Dùng `depends_on` với `condition: service_healthy` để đảm bảo thứ tự.
- File `docker-compose.override.yml` mount source code local để hot reload với `tsx watch` hoặc `nest start --watch`.
- Không commit file `.env` — chỉ commit `.env.example`.
- Cân nhắc dùng `Makefile` cho các lệnh thông dụng: `make up`, `make down`, `make logs`, `make reset`.
