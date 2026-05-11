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
- [x] Health check endpoint `GET /health` trả về trạng thái tất cả dependencies (đã nâng cấp qua `HealthDependencyProbeService` với trạng thái `ok/not-configured/unreachable`; có test strategy-level bằng mock service)
- [x] Rate limiting hoạt động: request thứ 101 trong 1 phút trả về 429 (đã bổ sung unit simulation global 101 requests tại `rate-limit.middleware.spec.ts`)
- [x] JWT validation đúng: token hết hạn → 401, token hợp lệ → pass (đã có HTTP runtime test bằng supertest tại `jwt-auth.guard.http.spec.ts`)
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

- `open-erp-backend/src/common/filters/global-exception.filter.ts`
- `open-erp-backend/src/common/filters/global-exception.filter.spec.ts`
- `open-erp-backend/src/common/middleware/rate-limit.middleware.ts`
- `open-erp-backend/src/common/middleware/rate-limit.middleware.spec.ts`
- `open-erp-backend/src/proxy/proxy.controller.ts`
- `open-erp-backend/src/proxy/proxy.controller.spec.ts`
- `open-erp-backend/src/proxy/proxy.service.spec.ts`

### Kết quả chạy lệnh

**Lần chạy:** 2026-05-10

- `Set-Location -Path 'c:\Users\Minh\Documents\open-erp\open-erp-backend'; npm.cmd run build` → ✅ PASS
- `Set-Location -Path 'c:\Users\Minh\Documents\open-erp\open-erp-backend'; npm.cmd run test -- --runInBand --ci` → ✅ PASS (10 suites, 23 tests)
- `Set-Location -Path 'c:\Users\Minh\Documents\open-erp\open-erp-backend'; npm.cmd run test:e2e -- --runInBand --ci` → ✅ PASS (1 suite, 1 test)
- `Set-Location -Path 'c:\Users\Minh\Documents\open-erp\open-erp-backend'; npm.cmd run test:cov -- --runInBand --ci` → ✅ PASS (coverage toàn cục 50.47%; `global-exception.filter.ts` 77.08%, `rate-limit.middleware.ts` 87.09%, `proxy.controller.ts` 93.75%, `proxy.service.ts` 97.05%)

## Kết quả cập nhật nóng (2026-05-10)

- Chuẩn hóa `GlobalExceptionFilter` theo contract backend: `error.message` trả dạng `key + data`, không hard-code message text để quyết định UI.
- Sửa lỗi compile middleware rate-limit do `TooManyRequestsException` không có trong phiên bản Nest hiện tại bằng `HttpException(..., 429)` theo contract mới.
- Sửa lỗi TS1272 ở proxy controller bằng `import type { Request } from 'express'` cho decorated signature.
- Sửa lỗi TS2345 ở proxy controller bằng chuẩn hóa payload trước khi `throw new HttpException(...)`.
- Bổ sung unit tests cho global exception filter, rate-limit middleware và proxy controller; bổ sung nhánh lỗi upstream ở proxy service.

## Kế hoạch bù (Ngày 04)

- Bổ sung integration test cho JWT valid/expired và blacklist Redis.
- Bổ sung stress/functional test xác thực rule 101 request/phút trả 429.
- Nâng health check từ mức `configured` sang `real connectivity probe` (Redis + upstream service ping).
- Nâng coverage cho các thành phần còn thấp ngoài phạm vi nóng để tiệm cận mục tiêu ≥ 80% toàn service.

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

## QA Regression tuần 1 (2026-05-11)

**Lệnh xác minh:**
```text
npm run build
npm test -- --passWithNoTests
npm run test:cov -- --runInBand --passWithNoTests
```

**Kết quả:**
- Build PASS, test PASS (`16/16 suites`, `70/70 tests`).
- Coverage cục bộ các thành phần gateway chính đạt tốt (`proxy.service.ts` 97.05%, `proxy.controller.ts` 93.75%, `rate-limit.middleware.ts` 87.87%).
- Một số AC vẫn chưa có evidence integration/runtime thực: health probe thật cho dependency, test stress 101 request/phút, test JWT expired/valid qua HTTP runtime.

**Đánh giá QA:**
- Trạng thái giữ `🟡 REVIEW` do còn thiếu evidence integration theo AC.

## Vòng hoàn thiện REVIEW (2026-05-11)

### Evidence code/test bổ sung

- Bổ sung strategy probe dependency qua `HealthDependencyProbeService` và inject vào `HealthController`.
- Bổ sung test global rate-limit 101 requests tại `src/common/middleware/rate-limit.middleware.spec.ts`.
- Bổ sung HTTP runtime test cho JWT valid/expired qua supertest tại `src/common/guards/jwt-auth.guard.http.spec.ts`.
- Bổ sung test controller health mock strategy tại `src/health/health.controller.spec.ts`.

### Lệnh đã chạy

```text
npm run build
npm test -- --passWithNoTests
npm run test:cov -- --runInBand --passWithNoTests
```

### Output summary

- `npm run build`: ✅ PASS.
- `npm test -- --passWithNoTests`: ✅ PASS (`22/22` suites, `89/89` tests).
- `npm run test:cov -- --runInBand --passWithNoTests`: ✅ PASS (`22/22` suites, `89/89` tests).
- Coverage toàn backend: Statements `60.03%`, Branches `57.27%`, Functions `48.58%`, Lines `61.02%`.

### Đánh giá trạng thái task

- Task vẫn giữ `🟡 REVIEW`.
- Lý do chưa chuyển `🟢 DONE`:
   - Chưa đạt ngưỡng coverage tổng thể `>= 80%` theo AC hiện tại của task.
   - Health probe đã có strategy/runtime-safe abstraction và test, nhưng chưa có evidence môi trường integration đầy đủ cho tất cả dependency thật trong CI hiện tại.

## QA Retest vòng bổ sung evidence (2026-05-11)

### Evidence xác minh độc lập trong vòng retest

- `npm run build`: ✅ PASS.
- `npm run test:cov -- --runInBand --passWithNoTests`: ✅ PASS (`22/22` suites, `89/89` tests).
- Coverage toàn backend: Statements `60.03%`, Branches `57.27%`, Functions `48.58%`, Lines `61.02%`.

### Kết luận QA Regression

- **Quyết định:** `🟡 REVIEW`.
- **Lý do:** AC coverage `>= 80%` chưa đạt, nên chưa đủ điều kiện `🟢 DONE`.
- **Điều kiện cần để close lần kế tiếp:**
   - Nâng coverage tổng backend đạt tối thiểu `80%` theo AC task.
   - Bổ sung evidence integration runtime dependencies (Redis/upstream probe thật) trong CI hoặc môi trường tích hợp tương đương.

## QA Reconciliation (2026-05-11)

- **Trạng thái chốt:** 🟡 REVIEW
- **Lý do chốt:** Có tiến triển và evidence test/build pass, nhưng còn thiếu AC coverage tổng thể `>= 80%` và evidence integration runtime dependency thật.
- **Evidence tham chiếu:** kết quả `npm run test:cov` mới nhất cho toàn backend ~60%, chưa đạt ngưỡng AC của task.

## QA Final Retest (2026-05-11)

**Ngày thực hiện:** 2026-05-11  
**Người thực hiện:** Senior QA  
**Phạm vi:** Retest cuối Sprint 01

### Evidence build / test / coverage

```text
> npm run build
> nest build
✅ PASS (exit 0)

> npm test -- --passWithNoTests --runInBand
Test Suites: 22 passed, 22 total
Tests:       89 passed, 89 total
Time:        16.439 s
✅ All PASS

> npm run test:cov -- --runInBand --passWithNoTests
All files | % Stmts: 60.03 | % Branch: 57.27 | % Funcs: 48.58 | % Lines: 61.02
Test Suites: 22 passed, 22 total
Tests:       89 passed, 89 total
```

### Đánh giá AC

| AC | Trạng thái | Ghi chú |
|---|---|---|
| API Gateway khởi động, bind port 3000 | ✅ | Build PASS, unit test pass |
| `GET /health` trả trạng thái dependencies | ✅ | Strategy-level probe test PASS |
| Rate limiting: request thứ 101 → 429 | ✅ | `rate-limit.middleware.spec.ts` xác nhận 101 requests |
| JWT validation: expired → 401, valid → pass | ✅ | `jwt-auth.guard.http.spec.ts` HTTP runtime test PASS |
| TenantMiddleware trích xuất tenantId | ✅ | `tenant.middleware.spec.ts` PASS |
| Request log JSON chuẩn, có requestId | ✅ | `logging.interceptor` test PASS |
| Global exception filter format chuẩn | ✅ | `global-exception.filter.spec.ts` PASS |
| CORS từ ALLOWED_ORIGINS | ✅ | Cấu hình + unit test PASS |
| Swagger UI tại `/api/docs` | ✅ | Build/start không lỗi |
| Proxy routing forward đúng microservice | ✅ | `proxy.controller.spec.ts`, `proxy.service.spec.ts` PASS |
| Unit test coverage ≥ 80% | ❌ | Tổng backend 61.02% Lines, chưa đạt ngưỡng AC |
| Multi-tenancy: mọi DB query có tenantId | ✅ N/A | Gateway không truy vấn DB trực tiếp; xác nhận ở service layers |
| Integration runtime dependencies thật | ❌ | Redis probe thật, upstream service ping: Docker daemon không khả dụng |

### Kết luận QA Final

- **Quyết định:** Giữ 🟡 REVIEW
- **Lý do:** 2 AC chưa đạt: coverage tổng backend < 80% và thiếu evidence integration runtime dependencies thật.
- **Điều kiện đóng:**
  1. Nâng coverage tổng backend (hoặc scoped gateway) lên ≥ 80% — điều kiện chính.
  2. Bổ sung integration smoke test với Redis và upstream service ping khi Docker/môi trường sẵn sàng.
