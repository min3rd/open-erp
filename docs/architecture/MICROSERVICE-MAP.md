# Microservice Map — Open ERP
# Bản đồ Microservices & Giao tiếp

**Phiên bản:** 1.0  
**Ngày tạo:** 09/05/2026  
**Tác giả:** Technical Leader  
**Trạng thái:** Hoàn chỉnh  

---

## Mục lục

1. [Bảng tổng hợp 20 Microservices](#1-bảng-tổng-hợp-20-microservices)
2. [RabbitMQ Exchange Design](#2-rabbitmq-exchange-design)
3. [Event Catalog](#3-event-catalog-danh-mục-sự-kiện)
4. [Service Dependencies](#4-service-dependencies)
5. [Docker Compose Services](#5-docker-compose-services)

---

## 1. Bảng tổng hợp 20 Microservices

| Service | Port | Module NestJS | MongoDB Collections | RabbitMQ Publishes | RabbitMQ Subscribes |
|---|---|---|---|---|---|
| `api-gateway` | 3000 | GatewayModule | — | — | — |
| `auth-service` | 3001 | AuthModule | users, refresh_tokens | user.login, user.logout | — |
| `tenant-service` | 3002 | TenantModule | platform_tenants, platform_subscriptions | tenant.created, tenant.updated | — |
| `user-service` | 3003 | UserModule | users, departments | user.created, user.updated | tenant.created |
| `rbac-service` | 3004 | RbacModule | roles, permissions | permission.updated | user.created |
| `catalog-service` | 3005 | CatalogModule | catalogs, dynamic_forms | catalog.updated | tenant.created |
| `audit-service` | 3006 | AuditModule | audit_logs | — | *.* (all events) |
| `notification-service` | 3007 | NotificationModule | notifications | — | task.assigned, order.created, ... |
| `hr-service` | 3008 | HrModule | employees, contracts, attendance, leave_requests, evaluations | employee.created, attendance.recorded | user.created |
| `sale-service` | 3009 | SaleModule | customers, orders, quotations, price_lists | order.created, order.updated | inventory.updated |
| `inventory-service` | 3010 | InventoryModule | inventory, stock_movements, warehouses | inventory.updated, stock.low | order.created |
| `logistics-service` | 3011 | LogisticsModule | deliveries | delivery.updated | order.confirmed |
| `purchase-service` | 3012 | PurchaseModule | purchase_orders, suppliers | po.created | inventory.low |
| `office-service` | 3013 | OfficeModule | tasks, documents, workflows | task.created, task.completed | employee.created |
| `meeting-service` | 3014 | MeetingModule | meetings | meeting.created, meeting.ended | — |
| `chat-service` | 3015 | ChatModule | messages, channels | message.sent | — |
| `accounting-service` | 3016 | AccountingModule | journal_entries, accounts, payments | payment.recorded | order.completed, po.confirmed |
| `invoice-service` | 3017 | InvoiceModule | invoices | invoice.issued | order.completed |
| `ai-agent-service` | 3018 | AiAgentModule | ai_conversations, ai_tasks | ai.suggestion, ai.alert | *.* (selected events) |
| `dashboard-service` | 3019 | DashboardModule | — (read from other services) | — | *.* (selected events) |

---

## 2. RabbitMQ Exchange Design

### 2.1 Exchange layout

```
Exchange: openErp.direct   (type: direct)
  Routing key chính xác → service cụ thể
  Dùng cho: targeted notifications, command patterns

Exchange: openErp.topic    (type: topic)
  Wildcard routing: "order.*" → notification-service, audit-service, dashboard-service

Exchange: openErp.fanout   (type: fanout)
  Broadcast tới tất cả queues
  Dùng cho: tenant.suspended, system.maintenance

Exchange: openErp.dead_letter (type: direct)
  Nhận messages failed sau MAX_RETRIES (3 lần)
  Alert khi DLQ có tin nhắn mới
```

### 2.2 Queue naming convention

```
{service-name}.{routing-key}
Ví dụ:
  notification-service.order.created
  audit-service.#                     (subscribe mọi event)
  dashboard-service.order.*
  accounting-service.order.completed
```

### 2.3 Message format chuẩn

```json
{
  "eventId": "uuid-v4",
  "eventType": "order.created",
  "tenantId": "6645a2b3c4d5e6f7a8b9c0d1",
  "userId": "abc123",
  "timestamp": "2026-05-09T10:00:00Z",
  "version": "1.0",
  "payload": {
    "orderId": "ORD-2026-0001",
    "customerId": "CUS-001",
    "total": 5000000
  },
  "metadata": {
    "service": "sale-service",
    "correlationId": "req-uuid"
  }
}
```

---

## 3. Event Catalog (Danh mục sự kiện)

### 3.1 Platform Events

| Event | Publisher | Subscribers | Mô tả |
|---|---|---|---|
| `tenant.created` | tenant-service | user-service, catalog-service, rbac-service | Tenant mới được tạo |
| `tenant.suspended` | tenant-service | user-service, notification-service | Tenant bị tạm ngưng |
| `tenant.terminated` | tenant-service | tất cả services | Tenant bị xóa |
| `user.login` | auth-service | audit-service | User đăng nhập |
| `user.created` | user-service | rbac-service, hr-service, office-service | User mới |
| `user.deleted` | user-service | rbac-service, hr-service | User bị xóa |
| `permission.updated` | rbac-service | api-gateway | Quyền thay đổi |

### 3.2 HR Events

| Event | Publisher | Subscribers | Mô tả |
|---|---|---|---|
| `employee.created` | hr-service | office-service, meeting-service, chat-service | Nhân viên mới |
| `employee.terminated` | hr-service | user-service, audit-service | Nhân viên nghỉ việc |
| `attendance.recorded` | hr-service | dashboard-service | Chấm công |
| `leave_request.approved` | hr-service | notification-service | Đơn nghỉ phép được duyệt |

### 3.3 Sale & Inventory Events

| Event | Publisher | Subscribers | Mô tả |
|---|---|---|---|
| `order.created` | sale-service | notification-service, audit-service, dashboard-service | Đơn hàng mới |
| `order.confirmed` | sale-service | inventory-service, logistics-service | Đơn hàng xác nhận |
| `order.completed` | sale-service | accounting-service, invoice-service, dashboard-service | Hoàn thành |
| `order.cancelled` | sale-service | inventory-service | Hủy đơn |
| `inventory.updated` | inventory-service | sale-service, dashboard-service | Tồn kho thay đổi |
| `stock.low` | inventory-service | purchase-service, notification-service | Tồn kho thấp |

### 3.4 Accounting & Office Events

| Event | Publisher | Subscribers | Mô tả |
|---|---|---|---|
| `payment.recorded` | accounting-service | audit-service, dashboard-service | Ghi nhận thanh toán |
| `invoice.issued` | invoice-service | accounting-service, notification-service | HĐ điện tử phát hành |
| `task.assigned` | office-service | notification-service, audit-service | Giao việc |
| `task.completed` | office-service | dashboard-service | Hoàn thành công việc |
| `document.approved` | office-service | notification-service | Văn bản được duyệt |

---

## 4. Service Dependencies

### 4.1 Startup Order

```
Level 0 — Infrastructure:
  MongoDB, RabbitMQ, Redis, MinIO

Level 1 — Platform Core (độc lập):
  auth-service (3001), tenant-service (3002)

Level 2 — Phụ thuộc Level 1:
  user-service (3003), rbac-service (3004)
  catalog-service (3005), audit-service (3006), notification-service (3007)

Level 3 — Business Services:
  hr-service (3008), sale-service (3009), inventory-service (3010)
  logistics-service (3011), purchase-service (3012)
  office-service (3013), meeting-service (3014), chat-service (3015)

Level 4 — Phụ thuộc Level 3:
  accounting-service (3016), invoice-service (3017)
  ai-agent-service (3018), dashboard-service (3019)

Level 5 — Entry Point:
  api-gateway (3000)
```

### 4.2 Inter-Service Communication Matrix

| Caller → Callee | Protocol | Pattern | Ghi chú |
|---|---|---|---|
| api-gateway → microservices | NestJS TCP | Request-Response | HTTP → TCP proxy |
| microservice → microservice (query) | NestJS TCP | Request-Response | Sync cross-service query |
| microservice → microservice (event) | RabbitMQ | Publish-Subscribe | Fire-and-forget |
| microservices → Redis | ioredis | Direct | Cache, rate limit |
| microservices → MongoDB | Mongoose | Direct | Persistence |
| notification-service → Email | SMTP | Direct | Gửi email |
| notification-service → Push | FCM/APNS | HTTP | Mobile push |

---

## 5. Docker Compose Services

```yaml
version: '3.9'
services:
  mongodb:
    image: mongo:7.0
    ports: ["27017:27017"]
    volumes: [mongo-data:/data/db]
    networks: [openErp-internal-net]

  rabbitmq:
    image: rabbitmq:3.13-management
    ports: ["5672:5672", "15672:15672"]
    environment:
      RABBITMQ_DEFAULT_USER: openErp
      RABBITMQ_DEFAULT_PASS: secret
    networks: [openErp-internal-net]

  redis:
    image: redis:7.2-alpine
    ports: ["6379:6379"]
    networks: [openErp-internal-net]

  minio:
    image: minio/minio
    command: server /data --console-address ":9001"
    ports: ["9000:9000", "9001:9001"]
    networks: [openErp-internal-net, openErp-storage-net]

  api-gateway:
    build: ./services/api-gateway
    ports: ["3000:3000"]
    env_file: .env
    depends_on: [mongodb, rabbitmq, redis]
    networks: [openErp-gateway-net, openErp-internal-net]

  auth-service:
    build: ./services/auth-service
    ports: ["3001:3001"]
    env_file: .env
    depends_on: [mongodb, redis, rabbitmq]
    networks: [openErp-gateway-net, openErp-internal-net]

  # ... tương tự cho các service 3002-3019

networks:
  openErp-gateway-net:
    driver: bridge
  openErp-internal-net:
    driver: bridge
  openErp-storage-net:
    driver: bridge

volumes:
  mongo-data:
```
