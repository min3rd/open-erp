# [TASK-287] Bảng `user_branch_assignments` & Migration V2.0.0 (Phân Công Quản Lý Chi Nhánh)

- **Mã Công Việc**: TASK-287
- **Phân Loại**: Technical Task
- **Mức Độ Ưu Tiên**: [ ] Critical / [x] High / [ ] Medium / [ ] Low
- **Người Phụ Trách (Assignee)**: Developer Agent
- **Thuộc Sprint**: Sprint 02 - Super Admin & Phân Quyền Toàn Diện
- **Trạng Thái**: [ ] To Do / [ ] In Progress / [ ] In Review / [x] Done / [ ] Deferred

---

## 1. Mô Tả Công Việc
- Bối cảnh: sub-task của [FEAT-13](FEAT-13_organization_hierarchy_structure.md) & [FEAT-15](FEAT-15_multi_scope_data_access_control.md); khắc phục [BUG-71](BUG-71_multibranch_manager_design_gap.md).
- Mục tiêu: hiện thực mô hình phân công "Chi nhánh được quản lý" tách khỏi membership thành viên.
- Tài liệu thiết kế: [DES-02-DB](../06_designs/database/SUPERADMIN_RBAC_DATABASE_SCHEMA.md) §3.4, §3.5, §5.

## 2. Các Bước Kỹ Thuật Cần Triển Khai
- [ ] Tạo bảng `user_branch_assignments` (`user_id`, `tenant_id`, `branch_id`, `is_primary`, `can_manage`, `assigned_at`) trong migration `V2.0.0__superadmin_rbac_schema.sql`.
- [ ] Partial unique index `uq_user_primary_branch` đảm bảo mỗi user tối đa 1 `is_primary = TRUE` (BR-RBAC-09).
- [ ] Unique `uq_user_branch(user_id, branch_id)` + index `idx_user_branch_tenant`, `idx_user_branch_branch`.
- [ ] Composite FK `(branch_id, tenant_id) → branches(id, tenant_id)` ON DELETE CASCADE (chống ghép cặp sai tenant).
- [ ] Ràng buộc `membership.branch_id = departments.branch_id` khi department có branch (trigger/service; department xuyên chi nhánh cho phép `branch_id NULL`).
- [ ] Đăng ký entity `UserBranchAssignment` vào Entity Registry (TASK-276).

## 3. Tiêu Chí Hoàn Thành (Definition of Done)
- [ ] Migration V2.0.0 idempotent, chạy sạch trên PostgreSQL thật (không H2).
- [ ] CSDL Sprint 02 đủ 12 bảng mới; ràng buộc primary/branch-dept được kiểm chứng bằng test.
- [ ] Không vi phạm dữ liệu backfill của V2.0.1.

## 4. Xác Nhận Hoàn Tất (QA Verification)
- [ ] Developer đã hoàn tất và tự kiểm thử.
- [ ] QA review migration + chạy lại trên `openerp_test`.
- [ ] Không phát sinh regression.

## Ghi Chú Hoàn Thành (2026-09-18)
- `V2.0.0` §3 tạo bảng `user_branch_assignments` (PK `id`); partial unique `uq_user_primary_branch` đảm bảo mỗi user tối đa 1 primary; unique `uq_user_branch(user_id, branch_id)` + index `idx_user_branch_tenant`/`idx_user_branch_branch`.
- Composite FK `fk_user_branch_assignments_branch_tenant` `(branch_id, tenant_id) → branches(id, tenant_id)` ON DELETE CASCADE chống ghép cặp sai tenant (BUG-66).
- `V2.0.1` §4 backfill **14 primary branch assignments** cho user hiện hữu với `can_manage = FALSE`; entity `UserBranchAssignment` đã đăng ký registry (TASK-276).
- `mvn test` **51/51 PASS** trên PostgreSQL thật.
