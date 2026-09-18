# [TASK-271] Migration Hợp Nhất Nguồn Vai Trò (`user_tenants.role` → `user_roles`)

- **Mã Công Việc**: TASK-271
- **Phân Loại**: Technical Task
- **Mức Độ Ưu Tiên**: [x] Critical / [ ] High / [ ] Medium / [ ] Low
- **Người Phụ Trách (Assignee)**: Developer Agent
- **Thuộc Sprint**: Sprint 02 - Super Admin & Phân Quyền Toàn Diện
- **Trạng Thái**: [x] To Do / [ ] In Progress / [ ] In Review / [ ] Done / [ ] Deferred

---

## 1. Mô Tả Công Việc
- Bối cảnh: khắc phục [BUG-54](BUG-54_role_source_conflict.md) — hai nguồn vai trò song song giữa Sprint 1 và Sprint 2.
- Mục tiêu: chuyển toàn bộ vai trò sang `roles` + `user_roles`; deprecate `user_tenants.role`.
- Tài liệu thiết kế: [DES-02-DB](../06_designs/database/SUPERADMIN_RBAC_DATABASE_SCHEMA.md) §4.2/§4.4; [ANL-02](../02_analysis/ANL-02_functional_rbac_and_data_scope_permissions.md) §2.2.

## 2. Các Bước Kỹ Thuật Cần Triển Khai
- [ ] Tạo/cập nhật bảng `roles` (system roles `tenant_id NULL`) và `user_roles`.
- [ ] Migration map dữ liệu: `OWNER→TENANT_OWNER`, `ADMIN/TENANT_ADMIN→TENANT_ADMIN`, `MEMBER→STAFF`, `VIEWER→VIEWER`; bỏ qua/ghi log giá trị lạ.
- [ ] Chuyển toàn bộ code đọc vai trò sang `user_roles` (single source of truth); cập nhật JWT claims/context loader.
- [ ] Deprecate cột `user_tenants.role` (giữ tạm để rollback, đánh dấu rõ; không xóa dữ liệu khi chưa xác nhận).
- [ ] Viết test mapping + test login/ủy quyền theo vai trò mới trên PostgreSQL thật.

## 3. Tiêu Chí Hoàn Thành (Definition of Done)
- [ ] 100% user hiện hữu có bản ghi `user_roles` tương ứng.
- [ ] Không còn code nghiệp vụ đọc `user_tenants.role`.
- [ ] `mvn test` pass 100%; migration chạy an toàn trên DB có dữ liệu.

## 4. Xác Nhận Hoàn Tất (QA Verification)
- [ ] Developer đã hoàn tất và tự kiểm thử.
- [ ] QA kiểm tra dữ liệu mapping trên DB thật.
- [ ] Không phát sinh regression đăng nhập/phân quyền.
