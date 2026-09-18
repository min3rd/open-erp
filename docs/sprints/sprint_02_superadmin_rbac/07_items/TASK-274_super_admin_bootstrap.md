# [TASK-274] Bootstrap Super Admin Từ Cấu Hình (BR-SA-01)

- **Mã Công Việc**: TASK-274
- **Phân Loại**: Technical Task
- **Mức Độ Ưu Tiên**: [ ] Critical / [x] High / [ ] Medium / [ ] Low
- **Người Phụ Trách (Assignee)**: Developer Agent
- **Thuộc Sprint**: Sprint 02 - Super Admin & Phân Quyền Toàn Diện
- **Trạng Thái**: [x] To Do / [ ] In Progress / [ ] In Review / [ ] Done / [ ] Deferred

---

## 1. Mô Tả Công Việc
- Bối cảnh: khắc phục [BUG-58](BUG-58_super_admin_bootstrap_missing.md) — chưa có cách tạo Super Admin đầu tiên sau triển khai.
- Mục tiêu: seed idempotent Super Admin từ cấu hình khi ứng dụng khởi động.
- Tài liệu thiết kế: [ANL-01](../02_analysis/ANL-01_superadmin_platform_management.md) BR-SA-01; [DES-02-DB](../06_designs/database/SUPERADMIN_RBAC_DATABASE_SCHEMA.md) §2.2.

## 2. Các Bước Kỹ Thuật Cần Triển Khai
- [ ] Thêm cấu hình `openerp.platform.bootstrap-emails` (danh sách email, mặc định rỗng ở prod).
- [ ] Listener `StartupEvent`: với mỗi email hợp lệ, UPSERT vào `platform_super_admins` (role `SUPER_ADMIN`, `is_active = true`, `granted_by` hệ thống) — idempotent.
- [ ] Không ghi log lộ secret; cảnh báo log nếu email chưa tồn tại trong `users`.
- [ ] Tài liệu deployment: hướng dẫn cấu hình + cách xác minh quyền Super Admin.
- [ ] Test: chạy startup lặp lại không sinh bản ghi trùng; email không tồn tại bị bỏ qua có cảnh báo.

## 3. Tiêu Chí Hoàn Thành (Definition of Done)
- [ ] Bootstrap hoạt động, idempotent, có test trên PostgreSQL thật.
- [ ] Tài liệu deployment cập nhật (local/staging/production).
- [ ] `mvn test` pass 100%; không hardcode URL/secret.

## 4. Xác Nhận Hoàn Tất (QA Verification)
- [ ] Developer đã hoàn tất và tự kiểm thử.
- [ ] QA xác minh tài khoản bootstrap truy cập được `/platform/*`.
- [ ] Không phát sinh regression.

> **Cập nhật thiết kế (FEAT-18, 2026-09-18)**: bootstrap được nâng cấp theo [SOL-01 §1.2.3](../05_solutions/SOL-01_superadmin_architecture_and_security.md) — chỉ chạy khi **không còn SUPER_ADMIN `ACTIVE`** nào; yêu cầu `OPENERP_ADMIN_BOOTSTRAP_SECRET`; email đã tồn tại → **nâng cấp tài khoản hiện hữu** (không tạo trùng, không ghi đè mật khẩu/trạng thái); bản ghi tạo với `status = 'ACTIVE'`, `is_active = TRUE`, `must_change_password = TRUE`, `two_factor_required = TRUE`; audit `PLATFORM_ADMIN_BOOTSTRAPPED` (`actor_type = SYSTEM`).
