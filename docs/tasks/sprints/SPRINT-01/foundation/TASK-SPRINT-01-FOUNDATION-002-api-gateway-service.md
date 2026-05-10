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
| Trạng thái       | 🟡 REVIEW                         |
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

- [x] API Gateway khởi động thành công, bind port 3000
- [ ] Health check endpoint `GET /health` trả về trạng thái tất cả dependencies (Hiện trả trạng thái cấu hình dependency; chưa probe kết nối thật Redis/upstream)
- [ ] Rate limiting hoạt động: request thứ 101 trong 1 phút trả về 429 (Đã implement middleware 100 req/phút global, 10 req/phút auth; chưa có automated test bắn 101 requests)
- [ ] JWT validation đúng: token hết hạn → 401, token hợp lệ → pass (Đã có baseline JWT middleware + optional Redis blacklist, chưa có test tích hợp token expired/valid)
- [x] TenantMiddleware trích xuất tenantId thành công từ JWT và subdomain
- [x] Request log format JSON chuẩn, có requestId
- [x] Global exception filter: tất cả lỗi đều trả về format chuẩn
- [x] CORS cho phép origin từ `ALLOWED_ORIGINS`
- [x] Swagger UI hiển thị đầy đủ tại `/api/docs`
- [x] Proxy routing forward đúng đến từng microservice
- [ ] Unit test coverage ≥ 80% (Hiện tại 24.65% theo `npm run test:cov`)
- [ ] Multi-tenancy: mọi DB query đều có tenantId filter (Không áp dụng trực tiếp cho gateway vì không truy vấn DB; sẽ được kiểm soát ở service/repository tasks phía sau)

## Kết quả triển khai (Ngày 03)

### Phạm vi hoàn tất

- Dựng nền API Gateway NestJS với cấu trúc `health`, `proxy`, `common`.
- Bổ sung middleware `requestId`, `rate limit` baseline, `jwt validation` baseline, `tenant extraction`.
- Bổ sung `logging interceptor`, `transform interceptor`, `global exception filter`.
- Cấu hình `helmet`, `CORS`, `ValidationPipe`, Swagger `/api/docs`.
- Dựng proxy routing nền theo route-prefix: `auth`, `tenants`, `users`, `roles`, `catalogs`, `audit-logs`, `notifications`.
- Bổ sung unit/e2e tests baseline cho health, tenant extraction, transform interceptor, proxy service.

### Files đã tạo / sửa

- `open-erp-backend/src/app.module.ts`
- `open-erp-backend/src/main.ts`
- `open-erp-backend/src/app.controller.spec.ts`
- `open-erp-backend/test/app.e2e-spec.ts`
- `open-erp-backend/src/common/types/express.d.ts`
- `open-erp-backend/src/common/filters/global-exception.filter.ts`
- `open-erp-backend/src/common/interceptors/logging.interceptor.ts`
- `open-erp-backend/src/common/interceptors/transform.interceptor.ts`
- `open-erp-backend/src/common/interceptors/transform.interceptor.spec.ts`
- `open-erp-backend/src/common/middleware/request-id.middleware.ts`
- `open-erp-backend/src/common/middleware/rate-limit.middleware.ts`
- `open-erp-backend/src/common/middleware/jwt-auth.middleware.ts`
- `open-erp-backend/src/common/middleware/tenant.middleware.ts`
- `open-erp-backend/src/common/middleware/tenant.middleware.spec.ts`
- `open-erp-backend/src/health/health.controller.ts`
- `open-erp-backend/src/health/health.module.ts`
- `open-erp-backend/src/proxy/proxy.constants.ts`
- `open-erp-backend/src/proxy/proxy.controller.ts`
- `open-erp-backend/src/proxy/proxy.module.ts`
- `open-erp-backend/src/proxy/proxy.service.ts`
- `open-erp-backend/src/proxy/proxy.service.spec.ts`
- `open-erp-backend/package.json`

### Kết quả chạy lệnh

**Lần chạy:** 2026-05-10

- `npm.cmd --prefix c:\Users\Minh\Documents\open-erp\open-erp-backend run build` → ✅ PASS
- `npm.cmd --prefix c:\Users\Minh\Documents\open-erp\open-erp-backend run test -- --runInBand --ci` → ✅ PASS (7 suites, 14 tests)
- `npm.cmd --prefix c:\Users\Minh\Documents\open-erp\open-erp-backend run test:e2e -- --runInBand --ci` → ✅ PASS (1 suite, 1 test)
- `npm.cmd --prefix c:\Users\Minh\Documents\open-erp\open-erp-backend run test:cov -- --runInBand --ci` → ⚠️ PASS test nhưng coverage toàn cục 24.65%

## Kế hoạch bù (Ngày 04)

- Bổ sung integration test cho JWT valid/expired và blacklist Redis.
- Bổ sung stress/functional test xác thực rule 101 request/phút trả 429.
- Nâng health check từ mức `configured` sang `real connectivity probe` (Redis + upstream service ping).
- Nâng coverage cho các thành phần mới (middleware/interceptor/filter/proxy controller) để tiệm cận mục tiêu ≥ 80% theo phạm vi task.

## Rủi ro kỹ thuật

- Rate limit hiện là in-memory middleware, chưa dùng shared store Redis nên chưa phù hợp scale ngang nhiều instance.
- JWT blacklist hiện `optional` theo `REDIS_URL`; nếu Redis lỗi sẽ fallback không chặn token blacklist.
- Proxy hiện chuẩn hóa response ở gateway layer; cần thống nhất thêm với contract khi các upstream service chính thức trả envelope riêng để tránh double-wrap ngoài ý muốn.

## Ghi chú kỹ thuật

- Dùng **Fastify** thay vì Express để đạt hiệu năng cao hơn (~2x).
- `helmet()` bật mặc định để thêm security headers.
- Tách config service (`@nestjs/config`) để đọc `.env` type-safe.
- Proxy dùng `http-proxy-middleware` hoặc custom `HttpService` của NestJS.
- Trong production: API Gateway chạy sau Load Balancer (nginx/AWS ALB).
- Không bao giờ expose các microservice port ra ngoài Docker network trong production.
