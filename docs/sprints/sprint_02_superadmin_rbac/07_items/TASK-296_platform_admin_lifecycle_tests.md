# [TASK-296] Test Vòng Đời Platform Admin (Bootstrap/Guards/Revocation/CLI)

- **Mã Công Việc**: TASK-296
- **Phân Loại**: Technical Task
- **Mức Độ Ưu Tiên**: [ ] Critical / [ ] High / [x] Medium / [ ] Low
- **Người Phụ Trách (Assignee)**: Developer Agent & QA/QC Agent
- **Thuộc Sprint**: Sprint 02 - Super Admin & Phân Quyền Toàn Diện
- **Trạng Thái**: [ ] To Do / [ ] In Progress / [ ] In Review / [x] Done / [ ] Deferred

---

## 1. Mô Tả Công Việc
- Bối cảnh: kiểm chứng [FEAT-18](FEAT-18_superadmin_account_lifecycle_and_cli.md) AC1 → AC7; map trực tiếp TC-BE-28 → TC-BE-32 trong [test_plan](../08_testing/test_plan.md).
- Mục tiêu: bộ test tự động trên PostgreSQL & Redis thật (cấm H2) cho toàn bộ vòng đời tài khoản Super Admin.
- Tài liệu thiết kế: [SOL-01 §1.2](../05_solutions/SOL-01_superadmin_architecture_and_security.md); [DES-DB §2.2](../06_designs/database/SUPERADMIN_RBAC_DATABASE_SCHEMA.md).

## 2. Các Ca Kiểm Thử Bắt Buộc
- [ ] **TC-BE-28 — Bootstrap first-run**: chạy backend khi `platform_super_admins` rỗng với `bootstrap-emails`; tạo/nâng cấp user, gán `SUPER_ADMIN`, `must_change_password = true`, `two_factor_required = true`, audit `PLATFORM_ADMIN_BOOTSTRAPPED`. Chạy lại lần 2 → không tạo trùng/bỏ qua khi đã có admin `ACTIVE`.
- [ ] **TC-BE-29 — Self-disable Guard**: SUPER_ADMIN gọi disable chính mình → `403 PLATFORM_SELF_DISABLE_FORBIDDEN`; trạng thái không đổi.
- [ ] **TC-BE-30 — Last-admin Guard**: disable SUPER_ADMIN `ACTIVE` cuối cùng → `409 PLATFORM_LAST_ADMIN_PROTECTED`; vẫn còn 1 admin active. Bổ sung ca 2 request disable đồng thời (chống race).
- [ ] **TC-BE-31 — Disable Revocation**: disable một admin khác → session Redis bị xóa, token vào blacklist, email cảnh báo, audit `PLATFORM_ADMIN_DISABLED`.
- [ ] **TC-BE-32 — Admin CLI**: chạy offline CLI `bootstrap/list/disable` + remote CLI → lệnh thực thi đúng; audit `actor_type = CLI`; không nhận mật khẩu qua arg.
- [ ] Bổ sung ca: không tự đăng ký qua API công khai (payload chứa role nền tảng bị từ chối/bỏ qua); email đã tồn tại khi grant → không tạo trùng user.

## 3. Tiêu Chí Hoàn Thành (Definition of Done)
- [ ] 100% ca test pass trên PostgreSQL & Redis thật; `mvn test` 100%.
- [ ] Fixture không dùng H2/mock DB.
- [ ] Kết quả ghi nhận vào `08_testing/` kèm log chạy.

## 4. Xác Nhận Hoàn Tất (QA Verification)
- [ ] Developer đã viết test và tự chạy.
- [ ] QA review độc lập và chạy lại bộ test.
- [ ] Không phát sinh regression.

## Ghi Chú Hoàn Thành (2026-09-18)
- `PlatformAdminApiTest` + `PlatformAuthApiTest` bao phủ TC-BE-28→32: bootstrap first-run/idempotent, self-disable guard, last-admin guard (kể cả 2 request đồng thời), revocation session/blacklist, CLI.
- Ca bổ sung: không tự đăng ký qua API công khai; grant email hiện hữu không tạo trùng user.
- Chạy trên PostgreSQL & Redis thật; full suite `mvn test` **157/157 PASS**.
