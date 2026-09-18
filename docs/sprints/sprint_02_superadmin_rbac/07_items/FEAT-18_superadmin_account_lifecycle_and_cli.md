# [FEAT-18] Vòng Đời Tài Khoản Super Admin & CLI Quản Trị Nền Tảng

- **Mã Tính Năng**: FEAT-18
- **Phân Loại**: Feature / Security
- **Mức Độ Ưu Tiên**: [ ] Critical / [x] High / [ ] Medium / [ ] Low
- **Người Đề Xuất**: Solution Architect Agent (theo quyết định thiết kế 2026-09-18)
- **Người Phụ Trách**: Developer Agent
- **Thuộc Sprint**: Sprint 02 - Super Admin & Phân Quyền Toàn Diện
- **Trạng Thái**: [x] To Do / [ ] In Progress / [ ] In Review / [ ] Done / [ ] Deferred

---

## 1. Tóm Tắt Nhu Cầu
- **User Story**: Là một Platform Operator, tôi muốn có quy trình rõ ràng để cấp, vô hiệu hóa và thu hồi tài khoản Super Admin — kể cả khi hệ thống mất toàn bộ admin hoặc API không truy cập được — để vận hành nền tảng an toàn mà không cần sửa CSDL thủ công.
- **Tài liệu giải pháp**: [SOL-01](../05_solutions/SOL-01_superadmin_architecture_and_security.md) §1.2 (1.2.1 → 1.2.7).
- **Tài liệu thiết kế**: [DES-DB](../06_designs/database/SUPERADMIN_RBAC_DATABASE_SCHEMA.md) §2.2; [DES-API](../06_designs/api/SUPERADMIN_RBAC_API_SPEC.md) §3.12; [DES-UI](../06_designs/ui_ux/SUPERADMIN_RBAC_UI_SPEC.md) §4.7.
- **Bối cảnh**: khắc phục [BUG-73](BUG-73_superadmin_lifecycle_cli_missing.md); kế thừa [TASK-274](TASK-274_super_admin_bootstrap.md) (bootstrap) và mở rộng toàn diện vòng đời.
- **Ghi chú phạm vi**: **KHÔNG cho phép tự đăng ký Super Admin qua API công khai** — endpoint đăng ký chỉ tạo user/tenant thông thường. Quyền nền tảng chỉ được cấp qua bootstrap first-run, Platform API (bởi SUPER_ADMIN hiện hữu) hoặc CLI quản trị.

## 2. Tiêu Chí Nghiệm Thu (Acceptance Criteria)
- [ ] **AC1**: Không tồn tại endpoint công khai/tự đăng ký nào tạo `SUPER_ADMIN`/`SUPPORT_ENGINEER`; mọi request đăng ký chỉ tạo user/tenant. Có test chứng minh payload đăng ký chứa role nền tảng bị bỏ qua/từ chối.
- [ ] **AC2**: Bootstrap first-run idempotent chỉ chạy khi **không còn SUPER_ADMIN `ACTIVE`**; tạo (hoặc nâng cấp user hiện hữu, không tạo trùng) user `ACTIVE`/`email_verified`, gán `SUPER_ADMIN` với `must_change_password = true`, `two_factor_required = true`; audit `PLATFORM_ADMIN_BOOTSTRAPPED` (actor_type `SYSTEM`).
- [ ] **AC3**: Chỉ SUPER_ADMIN hiện hữu cấp quyền qua `POST /api/v1/platform/admins`; user chưa tồn tại → gửi invitation (`PLATFORM_ADMIN_INVITATION_SENT`, status `INVITED`); user đã tồn tại → nâng cấp (`PLATFORM_ADMIN_GRANTED`).
- [ ] **AC4**: Guards vô hiệu hóa/thu hồi: tự disable/revoke chính mình → `403 PLATFORM_SELF_DISABLE_FORBIDDEN`; disable/revoke SUPER_ADMIN `ACTIVE` cuối cùng → `409 PLATFORM_LAST_ADMIN_PROTECTED` (kiểm tra trong transaction, không race).
- [ ] **AC5**: Disable/revoke có hiệu lực tức thì: thu hồi toàn bộ session Redis + blacklist token, gửi email cảnh báo, audit `scope = PLATFORM` (`PLATFORM_ADMIN_DISABLED`/`PLATFORM_ADMIN_REVOKED`); admin bắt buộc đổi mật khẩu + bật 2FA trước khi dùng portal.
- [ ] **AC6**: CLI 2 chế độ: Offline CLI (Quarkus command mode) chạy trên server với `OPENERP_ADMIN_BOOTSTRAP_SECRET` + DB/Redis; Remote CLI (`scripts/platform/platform-admin-cli.bat|sh`) gọi Platform API qua HTTPS với admin + TOTP (hoặc service token ngắn hạn) và IP allowlist. Không nhận mật khẩu qua CLI arg; mọi thao tác audit `actor_type = 'CLI'` + `correlation_id` + `ip_address` (offline ghi `local-console`).
- [ ] **AC7**: Ma trận phân quyền SUPER_ADMIN vs SUPPORT_ENGINEER được enforce: SUPPORT_ENGINEER chỉ xem tenant/user + impersonation; không quản trị admin khác, không khóa tenant, không đổi quota.

## 3. Danh Sách Công Việc Kỹ Thuật (Sub-Tasks)
- [ ] **[TASK-294](TASK-294_platform_admin_lifecycle_api.md)**: Platform Admin Lifecycle API (grant/list/disable/enable/revoke/reset-password/disable-2FA) + guards + session revoke + audit.
- [ ] **[TASK-295](TASK-295_platform_admin_cli.md)**: Offline CLI (Quarkus command mode) + Remote CLI script (`scripts/platform/platform-admin-cli.bat|sh`) + cập nhật `docs/07_deployment_guides/`.
- [ ] **[TASK-296](TASK-296_platform_admin_lifecycle_tests.md)**: Test bootstrap/first-run, self-disable blocked, last-admin guard, disable revokes sessions, CLI audit.
- [ ] (liên quan: [TASK-274](TASK-274_super_admin_bootstrap.md) bootstrap nền tảng; BUG-73 đã đóng phần thiết kế).

## 4. Xác Nhận Hoàn Tất (QA Verification)
- [ ] Developer đã hoàn tất toàn bộ sub-task.
- [ ] QA chạy bộ test trên PostgreSQL/Redis thật (TC-BE-28 → TC-BE-32) và xác nhận.
- [ ] QA kiểm thử thủ công màn `/platform/admins` trên Web Desktop (0 console error).
- [ ] Không phát sinh regression.
