# [TASK-437] Auth switch-tenant endpoint + session revoke

| Trường | Giá trị |
| :--- | :--- |
| ID / loại / sprint | TASK-437 / Task / Sprint 07 |
| Severity / trạng thái | High / **Done (QA)** — switch/list + revoke + audit + rate limit verified app thật |
| Owner/agent / reviewer | Developer / Architect + QA |
| Cập nhật / input version | 2026-10-30 / ADR-003, DES-API 0.2 |
| depends_on / blocks / parent | Design / TASK-438 / FEAT-38 |
| Write scope / baseline | `src/backend/**`; working tree |

## 1. Mục tiêu

`POST /api/v1/auth/switch-tenant` + `GET /api/v1/auth/me/tenants`; validate membership, revoke session cũ, cấp token mới, audit/rate limit.

## 2. Thao tác

- [x] DTO/resource/service; LoginResult; 4 response templates.
- [x] Validate tenant ACTIVE/TRIAL; user membership; revoke old access/refresh/session.
- [x] Audit `AUTH_TENANT_SWITCHED`; rate limit 10/60s; idempotency optional deferred.
- [x] Error codes; `AuthResourceApiTest` + `TenantSwitchRateLimiterTest` PASS.
- [x] `GET /auth/me/tenants` non-paginated.

## 3. Tiêu chí & kiểm chứng

- [x] Endpoint switch + `GET /auth/me/tenants`; validate membership/status; revoke session cũ; cấp token mới.
- [x] Audit + rate limit 10/60s; idempotency optional deferred.
- [x] `AuthResourceApiTest` + `TenantSwitchRateLimiterTest` PASS trên PostgreSQL/Redis thật.

| Kiểm tra | Kết quả | Evidence |
| :--- | :--- | :--- |
| Backend `mvn package` | **Pass** | compile |
| Auth switch tests | **Pass** | `AuthResourceApiTest`, `TenantSwitchRateLimiterTest` |

## 4. Bàn giao

Files: `AuthResource`, `AuthService`, `SwitchTenantRequest`, `ErrorCode`. Blocker: infra chưa chạy; audit/rate limit còn thiếu. Chuyển TASK-438.

## Lịch sử

| Phiên bản | Ngày | Thay đổi | Nguồn |
| :--- | :--- | :--- | :--- |
| 0.1 | 2026-10-30 | Tạo task; To Do | Architect/PM |
| 0.2 | 2026-10-30 | Endpoint switch-tenant + me/tenants + revoke session; backend package PASS; tests/audit pending | Developer |
| 0.3 | 2026-10-30 | `AuthResourceApiTest` PASS; audit/rate limit/idempotency vẫn deferred | Developer |
| 0.4 | 2026-10-30 | Audit AUTH_TENANT_SWITCHED + rate limit 10/60s + test; idempotency optional | Developer |
