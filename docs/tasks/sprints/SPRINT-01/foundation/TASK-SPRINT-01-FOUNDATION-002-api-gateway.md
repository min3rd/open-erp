# TASK-SPRINT-01-FOUNDATION-002: Xây dựng API Gateway

## Thông tin
| Thuộc tính | Giá trị |
|---|---|
| Task ID | TASK-SPRINT-01-FOUNDATION-002 |
| Sprint | Sprint 01 |
| Cluster | foundation |
| Loại | Feature |
| Người phụ trách | Backend |
| Story Points | 8 |
| Trạng thái | ⬜ TODO |
| Phụ thuộc | TASK-SPRINT-01-FOUNDATION-001 |

## Mô tả
Xây dựng NestJS API Gateway là điểm vào duy nhất cho toàn bộ hệ thống. Gateway thực hiện: giải mã subdomain thành tenantId, validate JWT, rate limiting bằng Redis, routing đến microservices qua TCP transport, và các global interceptors.

## Phạm vi kỹ thuật

### Backend (NestJS — `services/api-gateway/`)
- Khởi tạo NestJS app với HTTP server (port 3000)
- **Tenant Resolution Middleware**:
  - Phân tích `Host` header để lấy subdomain
  - Cache tenant info trong Redis (TTL 5 phút)
  - Xử lý trường hợp `localhost` và custom domains (dev)
  - Inject `tenantId` vào `request` context
- **JWT Validation Guard** (`JwtAuthGuard`):
  - Verify JWT RS256 signature với public key
  - Kiểm tra `exp`, `iat`, `tenantId` trong payload
  - Inject user context vào request
  - Skip cho public routes (auth endpoints)
- **Rate Limiting Module** (`@nestjs/throttler` + Redis store):
  - Global: 1.000 req/phút/userId
  - Auth endpoints: 10 req/phút/IP
  - Custom decorator `@RateLimit(limit, ttl)` cho từng endpoint
- **Request Routing**:
  - Tạo `ProxyModule` với `ClientProxy` cho mỗi microservice
  - Route controller cho từng service group:
    - `/api/v1/auth/*` → auth-service
    - `/api/v1/tenants/*` → tenant-service
    - `/api/v1/users/*` → user-service
    - `/api/v1/roles/*`, `/api/v1/permissions/*` → rbac-service
    - `/api/v1/catalog/*` → catalog-service
    - `/api/v1/audit-logs/*` → audit-service
    - `/api/v1/notifications/*` → notification-service
    - `/api/v1/hr/*` → hr-service
    - `/api/v1/sale/*` → sale-service
    - `/api/v1/inventory/*` → inventory-service
    - `/api/v1/accounting/*` → accounting-service
    - `/api/v1/invoices/*` → invoice-service
    - `/api/v1/office/*` → office-service
    - `/api/v1/meetings/*` → meeting-service
    - `/api/v1/ai/*` → ai-agent-service
    - `/api/v1/dashboard/*` → dashboard-service
- **Global Interceptors**:
  - `LoggingInterceptor`: log request/response với correlation ID
  - `TransformInterceptor`: wrap response trong `ApiResponseDto`
  - `TimeoutInterceptor`: timeout 30s cho mọi request
- **Global Filters**:
  - `HttpExceptionFilter`: format lỗi theo chuẩn error response
  - `AllExceptionsFilter`: catch unhandled exceptions
- **CORS Configuration**:
  - Whitelist: Angular dev server (localhost:4200), production domains
  - Credentials: true (để gửi cookies)
- **Swagger Setup**:
  - OpenAPI docs tại `/api/docs` (chỉ dev/staging)
  - Bearer token authentication trong Swagger UI
- **Health Check**:
  - `GET /health` — kiểm tra tất cả downstream services
  - `GET /api/v1/platform/health` — Super Admin only

## Database (MongoDB)
- Collections: Không trực tiếp (chỉ đọc qua Redis cache)
- Redis keys:
  - `tenant:subdomain:{subdomain}` → tenantId (TTL 5 phút)
  - `tenant:status:{tenantId}` → status (TTL 1 phút)
  - `ratelimit:{key}` → counter (TTL theo window)

## API Endpoints
| Method | Path | Auth | Mô tả |
|---|---|---|---|
| `GET` | `/health` | Public | Health check tổng hợp |
| `GET` | `/api/docs` | Public (dev) | Swagger UI |
| `GET` | `/api/v1/platform/health` | SuperAdmin | Health chi tiết |

## Acceptance Criteria
- [ ] API Gateway khởi động và expose port 3000
- [ ] Request đến `/api/v1/auth/login` được proxy đến auth-service thành công
- [ ] JWT validation hoạt động: request không có token → 401
- [ ] Tenant resolution: request từ `acme.openErp.vn` inject đúng tenantId
- [ ] Tenant SUSPENDED → tất cả request trả 403
- [ ] Rate limiting hoạt động: vượt 10 req/phút login → 429
- [ ] Correlation ID được tạo và truyền qua tất cả services
- [ ] Error responses đúng format chuẩn `ApiResponseDto`
- [ ] CORS chỉ cho phép origin whitelist
- [ ] `/health` trả về status tổng hợp của các services
- [ ] Swagger UI hiển thị đúng (môi trường dev)

## Ghi chú kỹ thuật
- Dùng `@nestjs/microservices` với TCP transport để giao tiếp với downstream services
- Pattern matching: mỗi route map đến 1 message pattern (command)
- JWT public key được load từ environment variable hoặc file (RS256)
- Redis rate limiter dùng sliding window algorithm
- Correlation ID: generate UUID v4 nếu client không gửi `X-Correlation-Id`
- Timeout per service có thể cấu hình riêng (AI service cần timeout 60s)
- Không forward Authorization header đến downstream — inject userId/tenantId qua metadata
