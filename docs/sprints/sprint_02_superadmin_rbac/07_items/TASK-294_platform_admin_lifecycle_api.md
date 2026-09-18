# [TASK-294] Platform Admin Lifecycle API (Grant/List/Disable/Enable/Revoke/Reset-Password/Disable-2FA)

- **Mã Công Việc**: TASK-294
- **Phân Loại**: Technical Task
- **Mức Độ Ưu Tiên**: [ ] Critical / [x] High / [ ] Medium / [ ] Low
- **Người Phụ Trách (Assignee)**: Developer Agent
- **Thuộc Sprint**: Sprint 02 - Super Admin & Phân Quyền Toàn Diện
- **Trạng Thái**: [x] To Do / [ ] In Progress / [ ] In Review / [ ] Done / [ ] Deferred

---

## 1. Mô Tả Công Việc
- Bối cảnh: khắc phục [BUG-73](BUG-73_superadmin_lifecycle_cli_missing.md); hiện thực [FEAT-18](FEAT-18_superadmin_account_lifecycle_and_cli.md) AC3 → AC5, AC7.
- Mục tiêu: bộ Platform API quản trị tài khoản Super Admin theo [DES-API §3.12](../06_designs/api/SUPERADMIN_RBAC_API_SPEC.md).
- Tài liệu thiết kế: [SOL-01 §1.2.4 → §1.2.5](../05_solutions/SOL-01_superadmin_architecture_and_security.md); [DES-DB §2.2](../06_designs/database/SUPERADMIN_RBAC_DATABASE_SCHEMA.md).

## 2. Các Bước Kỹ Thuật Cần Triển Khai
- [ ] `GET /api/v1/platform/admins` — Khuôn mẫu 3, mã `PLATFORM_ADMIN_LIST_SUCCESS`.
- [ ] `POST /api/v1/platform/admins` — 201, Khuôn mẫu 1; upsert (không tạo trùng user/bản ghi); user mới → invitation (`PLATFORM_ADMIN_INVITATION_SENT`), user hiện hữu → `PLATFORM_ADMIN_GRANTED`.
- [ ] `POST /api/v1/platform/admins/{id}/disable|enable` — body `{reason, confirm_password}` cho disable; mã `PLATFORM_ADMIN_DISABLED`/`PLATFORM_ADMIN_ENABLED`.
- [ ] `DELETE /api/v1/platform/admins/{id}` — mã `PLATFORM_ADMIN_REVOKED`.
- [ ] `POST /api/v1/platform/admins/{id}/reset-password` — mã `PLATFORM_ADMIN_PASSWORD_RESET_SENT`.
- [ ] `POST /api/v1/platform/admins/{id}/disable-2fa` — break-glass (ticket/reason), mã `PLATFORM_ADMIN_2FA_DISABLED`.
- [ ] Guards: chỉ `SUPER_ADMIN`; `403 PLATFORM_SELF_DISABLE_FORBIDDEN` (tự disable/revoke); `409 PLATFORM_LAST_ADMIN_PROTECTED` (admin `ACTIVE` cuối cùng) — kiểm tra trong cùng transaction với `SELECT ... FOR UPDATE` chống race.
- [ ] Hiệu lực tức thì khi disable/revoke: xóa toàn bộ session Redis + blacklist access/refresh token + gửi email cảnh báo.
- [ ] Enforce `must_change_password` + `two_factor_required` trước khi dùng portal.
- [ ] Audit `PLATFORM_ADMIN_*` với `scope = PLATFORM`, before/after + reason; bổ sung enum `AuditAction` + `PlatformAdminStatus` (Java & `@shared/enums`) và bảng i18n.

## 3. Tiêu Chí Hoàn Thành (Definition of Done)
- [ ] 100% endpoint tuân thủ 4 khuôn mẫu phản hồi + `code`/`params`; không hardcode message nghiệp vụ.
- [ ] Guard self-disable/last-admin hoạt động đúng, không race condition (kể cả 2 request đồng thời).
- [ ] Audit đầy đủ mọi thao tác, fail-closed; không lộ secret/mật khẩu trong log.
- [ ] Test trên PostgreSQL/Redis thật (TASK-296) pass; `mvn test` 100%.

## 4. Xác Nhận Hoàn Tất (QA Verification)
- [ ] Developer đã hoàn tất và tự kiểm thử.
- [ ] QA xác minh guards, revoke session, audit theo TC-BE-29 → TC-BE-31.
- [ ] Không phát sinh regression.
