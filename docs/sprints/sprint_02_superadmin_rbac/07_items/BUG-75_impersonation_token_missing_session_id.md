# [BUG-75] Impersonation Token Thiếu `session_id` — Mọi API Organization/IAM Trả 401 Và Interceptor Đá Văng Khỏi Phiên Đại Diện

- **Mã Lỗi**: BUG-75
- **Phân Loại**: Bug / Defect (Functional, Cross-cutting: backend + frontend)
- **Mức Độ Ưu Tiên**: [ ] Critical / [x] High / [ ] Medium / [ ] Low
- **Người Báo Cáo (Reporter)**: QA/QC Agent (Browser Dual-Mode Testing Sprint 02)
- **Người Xử Lý (Assignee)**: Developer Agent
- **Thuộc Sprint**: Sprint 02 - Super Admin & Phân Quyền Toàn Diện
- **Trạng Thái**: [ ] To Do / [ ] In Progress / [ ] In Review / [x] Done / [ ] Deferred
- **Ngày Phát Hiện**: 2026-09-19

---

## 1. Mô Tả Lỗi

> Khi Super Admin đang trong phiên đại diện (impersonation) và điều hướng tới các màn nghiệp vụ tenant (Cơ cấu tổ chức, Thành viên, Vai trò, Bản ghi mẫu), các API nhóm `organization/*` và `iam/*` trả **401 `UNAUTHORIZED` "Session is no longer active"**. Frontend interceptor coi 401 khi impersonate là phiên hết hạn nên **xóa phiên đại diện và đá về `/platform/tenants`**, khiến không thể thao tác hỗ trợ trong tenant.

### Nguyên nhân gốc (Root Cause)

- `ImpersonationService.start()` (dòng 133) có gọi `sessionManager.createSession(targetUserId, ...)` nhưng **không gắn `session_id`** vào JWT; `PlatformJwtService.generateImpersonationToken()` (dòng 64-84) không phát hành claim `session_id`.
- `OrganizationSecurityResolver.requireTenantPrincipal()` (dòng 38-42) và `IamSecurityResolver` (dòng ~40) bắt buộc `session_id` phải tồn tại và `sessionManager.isSessionActive(...)` → 401.
- `auth.interceptor.ts` (dòng 77) chủ động đặt `sessionId = null` khi có impersonation token (không gửi `X-Session-Id`); khi gặp 401 sẽ gọi `clearImpersonationAndRedirect()` (dòng 108-113).

- **Môi trường**: Web Desktop 1440x900 (Chrome), backend Quarkus dev, DB `openerp_dev` + Redis thật.
- **Tài khoản test**: `qa.sa02@example.com` (SUPER_ADMIN) → impersonate tenant `qa-test-corp-02` (owner `qa.owner02@example.com`).

### Bằng chứng runtime (API-level, token impersonation)

| API | Kết quả |
| :--- | :--- |
| `POST /platform/tenants/{id}/impersonate` | 200 `PLATFORM_IMPERSONATION_STARTED` |
| `GET /api/v1/core/sample-records` | **200** `CORE_SAMPLE_RECORD_LIST_SUCCESS` |
| `GET /api/v1/iam/roles` | **401** `UNAUTHORIZED` — "Session is no longer active" |
| `GET /api/v1/organization/branches` | **401** `UNAUTHORIZED` — "Session is no longer active" |
| `GET /api/v1/organization/departments/tree` | **401** `UNAUTHORIZED` — "Session is no longer active" |
| `GET /api/v1/organization/memberships` | **401** `UNAUTHORIZED` — "Session is no longer active" |
| `POST /api/v1/core/sample-records/export` | 403 `SUPERADMIN_IMPERSONATION_SECRET_EXPORT_FORBIDDEN` (đúng thiết kế) |
| `POST /platform/impersonate/exit` | 200 `PLATFORM_IMPERSONATION_ENDED` |

- Browser: sau khi start impersonation, điều hướng `/settings/sample-records` → 2 request 401 (`departments/tree`, `memberships`) → banner biến mất, URL quay về `/platform/tenants`.
  - Ảnh: `../08_testing/screenshots/web/QA-W-04_c_tenant_page_while_impersonating.png` (đã bị đá về), `QA-W-04_diag_after_navigation.png`.
- Ảnh banner hoạt động đúng trước đó: `QA-W-04_b_impersonation_banner.png` (đếm ngược 29:56 → 29:53).

> **Ghi chú phạm vi**: Đây **không phải** lỗi của tính năng chặn export (BUG-68 vẫn đúng: 403 `SUPERADMIN_IMPERSONATION_SECRET_EXPORT_FORBIDDEN`).

### Các bước tái hiện (Reproduction Steps)

1. Đăng nhập Platform SUPER_ADMIN → `/platform/tenants` → "Truy cập đại diện" tenant bất kỳ → nhập ticket/reason/mật khẩu → "Bắt đầu phiên" (banner vàng hiện đúng).
2. Điều hướng tới `/settings/sample-records` (hoặc `/settings/organization`, `/settings/roles`, `/settings/members`).
3. **Quan sát**: trang không tải được nội dung; console có 401; banner impersonation biến mất; URL tự quay về `/platform/tenants`.
4. Hoặc gọi trực tiếp `GET /api/v1/organization/branches` bằng token impersonation → 401 "Session is no longer active".

## 2. Tác Động

- Toàn bộ nghiệp vụ tổ chức (chi nhánh/phòng ban/thành viên/phân công chi nhánh) và RBAC (`/iam/roles`, permission matrix) **không thể thao tác trong phiên đại diện** — đứt gãy mục tiêu FEAT-11 (hỗ trợ khách hàng bằng impersonation).
- Trải nghiệm bị "đá văng" đột ngột (mất ngữ cảnh phiên đại diện) do interceptor coi 401 là hết hạn phiên.
- Lỗi Cross-cutting (backend token + frontend interceptor) → khó phát hiện nếu chỉ test API `core/sample-records` (vẫn 200).

## 3. Kết Quả Kỳ Vọng

- Impersonation token mang `session_id` của session đã tạo trong `ImpersonationService.start()` (claim `session_id` như token tenant thường), **hoặc** các resolver dùng cơ chế phiên riêng cho impersonation (kiểm tra marker Redis `impersonation:session:{id}`).
- Interceptor gửi kèm session tương ứng khi impersonate (bỏ `sessionId = null`) nếu backend chấp nhận.
- Toàn bộ API `organization/*`, `iam/*` trả 200 trong phiên đại diện (tuân thủ data scope theo user đại diện).
- Bổ sung test backend: gọi `GET /organization/branches` + `GET /iam/roles` bằng token impersonation → 200.

## 4. Xác Nhận Khắc Phục (QA Verification)

- [ ] Developer sửa token/resolver theo mục 3.
- [ ] QA re-test: start impersonation → mở `/settings/organization`, `/settings/roles`, `/settings/sample-records` → không 401, không bị đá về; export vẫn 403 đúng.
- [ ] Cập nhật `08_testing/test_report.md` (QA-W-04) với bằng chứng sau sửa.

## Ghi Chú QA (2026-09-19)

- Phát hiện trong QA-W-04 (Impersonation). Các phần **PASS**: banner đếm ngược, API `core/sample-records` 200, export 403 đúng mã, exit 200 ENDED, audit `IMPERSONATION_START/END` ghi nhận.
- Phần **FAIL**: điều hướng nghiệp vụ trong tenant bị 401/đá văng → đánh giá QA-W-04 là **FAIL** cho tới khi BUG-75 được xử lý.

## Ghi Chú Hoàn Thành (2026-09-19)

- **Quyết định thiết kế**: chọn **phương án 1 — session thật gắn vào token impersonation** thay vì mở nhánh riêng cho impersonation trong các resolver. Lý do: tái sử dụng đúng session filter hiện có (`SessionManager` + Redis), `exit` trở thành cơ chế vô hiệu hóa token tức thời, không phát sinh cơ chế phiên thứ hai cần bảo trì.
- **Thay đổi**:
  - `src/backend/.../modules/platform/service/PlatformJwtService.java:30,81` — hằng `CLAIM_SESSION_ID`, `generateImpersonationToken(...)` nhận `sessionId` và phát claim `session_id` như token tenant thường.
  - `src/backend/.../modules/platform/service/ImpersonationService.java:131-136` — `start()` tạo Redis session cho target user rồi truyền `sessionId` vào token; marker Redis lưu thêm `session_id` (`:143`).
  - `src/backend/.../modules/platform/service/ImpersonationService.java:193-199` — `exit()` thu hồi session (`revokeSession`) ngoài việc xóa marker → token cũ chết ngay.
- **Test**: `ImpersonationApiTest.testImpersonationTokenCanUseTenantApis` — token impersonation gọi `GET /organization/branches` + `GET /iam/roles` → 200; sau `exit` gọi lại → 401. Bổ sung assert `session_id` active trong `testStartAndExitImpersonation`.
- **Ghi chú FE**: resolver backend đọc `session_id` từ claim nên không bắt buộc FE gửi `X-Session-Id`; FE agent có thể giữ/bỏ `sessionId = null` trong interceptor tùy luồng — không ảnh hưởng backend.
- Kiểm chứng: full `mvn test` **187/187 PASS** (PostgreSQL + Redis thật, không H2).

## Ghi Chú QA Re-test (2026-09-19) — QA-R-75: PASS

- Banner đếm ngược hoạt động: `... CÒN LẠI 29:58` → giảm sau 2.5s; token impersonation có `session_id`.
- `/settings/organization` + `/settings/roles` tải đầy đủ nội dung, **không 401, không bị đá văng**: các API `organization/branches`, `departments/tree`, `memberships`, `iam/roles`, `iam/permissions`, `data-resources` đều **200**.
- API-level: token impersonation gọi `organization/branches` 200 (`ORGANIZATION_BRANCH_LIST_SUCCESS`), `iam/roles` 200 (`IAM_ROLE_LIST_SUCCESS`), `core/sample-records` 200.
- Exit: về `/platform/tenants`; token cũ gọi lại → **401 `UNAUTHORIZED`** (thu hồi session thật).
- Console errors: 0. Ảnh: `QA-R-75_a_impersonation_banner.png` → `QA-R-75_d_after_exit.png`.
- **Kết luận**: BUG-75 khắc phục hoàn toàn → giữ **Done**.
