# [TASK-277] Bổ Sung Endpoint Platform Còn Thiếu (Tenant Detail, User Directory, Global Lock, Impersonation Logs)

- **Mã Công Việc**: TASK-277
- **Phân Loại**: Technical Task
- **Mức Độ Ưu Tiên**: [ ] Critical / [x] High / [ ] Medium / [ ] Low
- **Người Phụ Trách (Assignee)**: Developer Agent
- **Thuộc Sprint**: Sprint 02 - Super Admin & Phân Quyền Toàn Diện
- **Trạng Thái**: [ ] To Do / [ ] In Progress / [ ] In Review / [x] Done / [ ] Deferred

---

## 1. Mô Tả Công Việc
- Bối cảnh: khắc phục nhóm platform trong [BUG-61](BUG-61_missing_endpoints.md).
- Mục tiêu: bổ sung các endpoint `/api/v1/platform/*` phục vụ UI quản trị nền tảng.
- Tài liệu thiết kế: [DES-02-API](../06_designs/api/SUPERADMIN_RBAC_API_SPEC.md) §3; [DES-02-DB](../06_designs/database/SUPERADMIN_RBAC_DATABASE_SCHEMA.md) §2.

## 2. Các Bước Kỹ Thuật Cần Triển Khai
- [ ] `GET /api/v1/platform/tenants/{tenant_id}` — chi tiết tenant (khuôn mẫu 1).
- [ ] `GET /api/v1/platform/users` — directory toàn nền tảng, tìm kiếm theo email/phone/user_id (khuôn mẫu 2, có phân trang).
- [ ] `POST /api/v1/platform/users/{user_id}/lock` và `/unlock` — khóa/mở khóa toàn cục, thu hồi token, audit.
- [ ] `GET /api/v1/platform/impersonation-logs` — danh sách nhật ký impersonation (khuôn mẫu 2; lọc theo tenant/status/time).
- [ ] Dùng `ResponseKey` enum, không hardcode message; cập nhật API spec tương ứng.
- [ ] Integration test trên PostgreSQL thật cho từng endpoint + phân quyền `platform_role`.

## 3. Tiêu Chí Hoàn Thành (Definition of Done)
- [ ] Đầy đủ endpoint, đúng envelope + i18n code.
- [ ] Guard platform hoạt động; user thường nhận 403.
- [ ] `mvn test` pass 100%; API spec được cập nhật.

## 4. Xác Nhận Hoàn Tất (QA Verification)
- [ ] Developer đã hoàn tất và tự kiểm thử.
- [ ] QA kiểm thử contract các endpoint mới.
- [ ] Không phát sinh regression.

## Ghi Chú Hoàn Thành (2026-09-18)
- Đã hiện thực `GET /api/v1/platform/tenants/{id}` (chi tiết), `GET /api/v1/platform/users` (directory toàn nền tảng, tìm kiếm + phân trang), `POST /api/v1/platform/users/{id}/lock|unlock` (thu hồi token + audit) và `GET /api/v1/platform/impersonation-logs`.
- 100% endpoint dùng envelope 4 khuôn mẫu + `ResponseKey`/mã i18n (`PlatformTenantResource`, `PlatformUserResource`, `PlatformImpersonationResource`).
- Test API-level `PlatformTenantApiTest`, `PlatformUserApiTest`, `ImpersonationApiTest`; guard platform trả 403 với token thường.
