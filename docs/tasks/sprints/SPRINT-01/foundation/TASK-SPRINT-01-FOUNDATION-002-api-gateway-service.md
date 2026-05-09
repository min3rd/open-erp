# TASK-SPRINT-01-FOUNDATION-002: Triển khai API Gateway NestJS

## Thông tin

| Thuộc tính       | Giá trị                           |
|------------------|-----------------------------------|
| Task ID          | TASK-SPRINT-01-FOUNDATION-002     |
| Sprint           | Sprint 01                         |
| Cluster          | foundation                        |
| Loại             | Backend                           |
| Người phụ trách  | Backend                           |
| Story Points     | 8                                 |
| Trạng thái       | ⬜ TODO                           |
| Phụ thuộc        | TASK-SPRINT-01-FOUNDATION-001     |

## Mô tả

Xây dựng API Gateway bằng NestJS — điểm vào duy nhất của toàn bộ hệ thống. API Gateway chịu trách nhiệm xác thực JWT, kiểm tra rate limit, proxy request đến microservices phù hợp, xử lý lỗi toàn cục, và ghi log request/response.

## Phạm vi kỹ thuật

### Backend (NestJS — `api-gateway`)

**Cấu trúc module:**
```
src/
├── app.module.ts
├── main.ts
├── common/
│   ├── filters/
│   │   └── global-exception.filter.ts     ← Xử lý lỗi toàn cục
│   ├── interceptors/
│   │   ├── logging.interceptor.ts         ← Log request/response
│   │   └── transform.interceptor.ts       ← Chuẩn hóa response
│   ├── middleware/
│   │   ├── tenant.middleware.ts           ← Trích xuất tenantId
│   │   └── request-id.middleware.ts       ← Gán requestId (UUID v4)
│   └── guards/
│       └── jwt-auth.guard.ts              ← Validate JWT token
├── proxy/
│   ├── proxy.module.ts
│   └── proxy.service.ts                   ← Forward request đến service
└── health/
    └── health.controller.ts               ← GET /health
```

**Các tính năng cần triển khai:**

1. **Rate Limiting** (`@nestjs/throttler`):
   - Global: 100 req/phút/IP
   - Auth endpoints: 10 req/phút/IP (chống brute force)
   - Cấu hình qua `ThrottlerModule.forRoot()`

2. **Request Logging Middleware**:
   - Log: `requestId`, `method`, `url`, `tenantId`, `userId`, `status`, `duration`
   - Format JSON (cho ELK stack)
   - Không log request body (bảo mật)

3. **Global Exception Filter**:
   - Bắt tất cả exceptions → format response chuẩn
   - Map NestJS HttpException → response JSON
   - Map Mongoose errors → 400/409
   - Log 5xx errors đầy đủ stack trace

4. **Transform Interceptor** — chuẩn hóa response:
```json
{
  "success": true,
  "data": { ... },
  "meta": {
    "requestId": "uuid",
    "timestamp": "ISO8601",
    "version": "v1"
  }
}
```

5. **JWT Validation Middleware**:
   - Verify JWT signature bằng public key (RS256) hoặc secret (HS256)
   - Kiểm tra token không nằm trong Redis blacklist
   - Inject `req.user` (userId, tenantId, roles)

6. **TenantMiddleware**:
   - Trích xuất `tenantId` theo thứ tự ưu tiên: JWT payload → Header `X-Tenant-ID` → Subdomain
   - Inject `req.tenantId`

7. **CORS Configuration**:
   - Allowed origins: danh sách từ env (`ALLOWED_ORIGINS`)
   - Methods: GET, POST, PUT, PATCH, DELETE, OPTIONS
   - Headers: Content-Type, Authorization, X-Tenant-ID

8. **Proxy Routing** → forward đến microservices:

| Route prefix         | Upstream service    | Port |
|----------------------|---------------------|------|
| `/api/v1/auth/*`     | auth-service        | 3001 |
| `/api/v1/tenants/*`  | tenant-service      | 3002 |
| `/api/v1/users/*`    | user-service        | 3003 |
| `/api/v1/roles/*`    | rbac-service        | 3004 |
| `/api/v1/catalogs/*` | catalog-service     | 3005 |
| `/api/v1/audit-logs/*` | audit-service     | 3006 |
| `/api/v1/notifications/*` | notification-service | 3007 |

9. **Swagger / OpenAPI**:
   - `@nestjs/swagger` — document đầy đủ tất cả endpoints
   - Truy cập tại `/api/docs`
   - Bearer token auth trong Swagger UI

### Package dependencies chính

```json
{
  "@nestjs/core": "^10.x",
  "@nestjs/platform-fastify": "^10.x",
  "@nestjs/throttler": "^5.x",
  "@nestjs/swagger": "^7.x",
  "@nestjs/jwt": "^10.x",
  "@nestjs/passport": "^10.x",
  "passport-jwt": "^4.x",
  "ioredis": "^5.x",
  "uuid": "^9.x",
  "helmet": "^7.x"
}
```

### Cấu hình môi trường

```env
PORT=3000
NODE_ENV=development
JWT_SECRET=...
JWT_PUBLIC_KEY=...
REDIS_URL=redis://:password@redis:6379
ALLOWED_ORIGINS=http://localhost:4200,http://localhost:8100
AUTH_SERVICE_URL=http://auth-service:3001
TENANT_SERVICE_URL=http://tenant-service:3002
USER_SERVICE_URL=http://user-service:3003
```

## API Endpoints

| Method | Path     | Mô tả                          | Auth |
|--------|----------|-------------------------------|------|
| GET    | `/health`| Health check toàn bộ hệ thống | Không |
| GET    | `/api/docs` | Swagger UI                 | Không |

Không có business endpoints — tất cả đều là proxy.

## Acceptance Criteria

- [ ] API Gateway khởi động thành công, bind port 3000
- [ ] Health check endpoint `GET /health` trả về trạng thái tất cả dependencies
- [ ] Rate limiting hoạt động: request thứ 101 trong 1 phút trả về 429
- [ ] JWT validation đúng: token hết hạn → 401, token hợp lệ → pass
- [ ] TenantMiddleware trích xuất tenantId thành công từ JWT và subdomain
- [ ] Request log format JSON chuẩn, có requestId
- [ ] Global exception filter: tất cả lỗi đều trả về format chuẩn
- [ ] CORS cho phép origin từ `ALLOWED_ORIGINS`
- [ ] Swagger UI hiển thị đầy đủ tại `/api/docs`
- [ ] Proxy routing forward đúng đến từng microservice
- [ ] Unit test coverage ≥ 80%
- [ ] Multi-tenancy: mọi DB query đều có tenantId filter

## Ghi chú kỹ thuật

- Dùng **Fastify** thay vì Express để đạt hiệu năng cao hơn (~2x).
- `helmet()` bật mặc định để thêm security headers.
- Tách config service (`@nestjs/config`) để đọc `.env` type-safe.
- Proxy dùng `http-proxy-middleware` hoặc custom `HttpService` của NestJS.
- Trong production: API Gateway chạy sau Load Balancer (nginx/AWS ALB).
- Không bao giờ expose các microservice port ra ngoài Docker network trong production.
