# [TASK-275] Migration Backfill V2.0.1 (Branch/Department Mặc Định, Membership, Seed Vai Trò)

- **Mã Công Việc**: TASK-275
- **Phân Loại**: Technical Task
- **Mức Độ Ưu Tiên**: [x] Critical / [ ] High / [ ] Medium / [ ] Low
- **Người Phụ Trách (Assignee)**: Developer Agent
- **Thuộc Sprint**: Sprint 02 - Super Admin & Phân Quyền Toàn Diện
- **Trạng Thái**: [x] To Do / [ ] In Progress / [ ] In Review / [ ] Done / [ ] Deferred

---

## 1. Mô Tả Công Việc
- Bối cảnh: khắc phục [BUG-59](BUG-59_missing_backfill_migration.md) — user Sprint 1 chưa có membership/role để engine tính phạm vi dữ liệu.
- Mục tiêu: Flyway V2.0.1 backfill an toàn, idempotent cho toàn bộ tenant/user hiện hữu.
- Tài liệu thiết kế: [DES-02-DB](../06_designs/database/SUPERADMIN_RBAC_DATABASE_SCHEMA.md) §3-4; [ANL-02](../02_analysis/ANL-02_functional_rbac_and_data_scope_permissions.md) BR-RBAC-03.

## 2. Các Bước Kỹ Thuật Cần Triển Khai
- [ ] Tạo branch mặc định "HQ" (`is_default = true`) và department "GENERAL" cho mỗi tenant hiện hữu.
- [ ] Seed system roles + permissions + `role_permissions` mặc định (phối hợp TASK-268).
- [ ] Tạo `user_department_memberships` primary cho mọi user hiện hữu (gắn branch/department mặc định).
- [ ] Gán `user_roles` theo mapping của [TASK-271](TASK-271_role_source_migration.md); đảm bảo tenant có ít nhất 1 `TENANT_OWNER`.
- [ ] Viết script/test kiểm chứng: 100% user có primary membership + role; chạy lại không nhân bản dữ liệu.

## 3. Tiêu Chí Hoàn Thành (Definition of Done)
- [ ] Migration V2.0.1 chạy pass trên DB sạch và DB có dữ liệu Sprint 1.
- [ ] Không mất dữ liệu tenant hiện hữu; rollback path được ghi chú.
- [ ] `mvn test` pass 100% trên PostgreSQL thật.

## 4. Xác Nhận Hoàn Tất (QA Verification)
- [ ] Developer đã hoàn tất và tự kiểm thử.
- [ ] QA kiểm tra dữ liệu backfill trên bản sao DB dev.
- [ ] Không phát sinh regression.
