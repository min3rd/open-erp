# [FEAT-14] Ma Trận Phân Quyền Chức Năng (Functional RBAC Matrix)

- **Mã Tính Năng**: FEAT-14
- **Phân Loại**: Feature
- **Mức Độ Ưu Tiên**: [ ] Critical / [x] High / [ ] Medium / [ ] Low
- **Người Đề Xuất**: Khách hàng / BA Agent
- **Người Phụ Trách**: Developer Agent
- **Thuộc Sprint**: Sprint 02 - Super Admin & Phân Quyền Toàn Diện
- **Trạng Thái**: [x] To Do / [ ] In Progress / [ ] In Review / [ ] Done / [ ] Deferred

---

## 1. Tóm Tắt Nhu Cầu
- **User Story**: Là một Quản trị viên Doanh nghiệp (Tenant Admin), tôi muốn tạo các vai trò (Roles) trong công ty và gán danh sách các quyền chức năng (Functional Permissions dạng `domain:resource:action`) để kiểm soát chặt chẽ việc nhân viên được thao tác trên những màn hình và tính năng nào.
- **Tài liệu phân tích**: [ANL-02_functional_rbac_and_data_scope_permissions.md](../02_analysis/ANL-02_functional_rbac_and_data_scope_permissions.md)
- **Tài liệu thiết kế**: [SUPERADMIN_RBAC_DATABASE_SCHEMA.md](../06_designs/database/SUPERADMIN_RBAC_DATABASE_SCHEMA.md), [SUPERADMIN_RBAC_API_SPEC.md](../06_designs/api/SUPERADMIN_RBAC_API_SPEC.md), [SUPERADMIN_RBAC_UI_SPEC.md](../06_designs/ui_ux/SUPERADMIN_RBAC_UI_SPEC.md)

---

## 2. Tiêu Chí Nghiệm Thu (Acceptance Criteria)
- [ ] **Kịch bản 1: Quản lý Vai trò hệ thống & Tùy biến**: Given Tenant Admin mở danh sách vai trò, When kiểm tra, Then các vai trò hệ thống (`TENANT_OWNER`, `TENANT_ADMIN`, `GENERAL_MANAGER`, `STAFF`, `VIEWER`) có nhãn `[SYS]` và không cho phép xóa; cho phép bấm "+ Thêm Vai Trò" để tạo vai trò mới.
- [ ] **Kịch bản 2: Bật/Tắt quyền chức năng cho Vai trò**: Given vai trò "Kế Toán Bán Hàng", When Admin tích chọn nhóm quyền `sales:order:read` và `sales:order:create` rồi bấm Lưu, Then bản ghi `role_permissions` được cập nhật, hệ thống xóa cache Redis của các user liên quan.
- [ ] **Kịch bản 3: Gán nhiều vai trò cho một người dùng**: Given nhân viên Nguyễn Văn A, When Admin gán đồng thời 2 vai trò `Kinh Doanh B2B` và `Thủ Kho`, Then nhân viên A có tập hợp gộp (Union) quyền của cả hai vai trò.
- [ ] **Kịch bản 4: Chặn xóa vai trò đang có người dùng**: Given vai trò `SALES_LEAD` đang có 4 người dùng gán, When Admin bấm xóa vai trò này, Then hệ thống từ chối xóa và trả về lỗi `IAM_ROLE_IN_USE`.

---

## 3. Danh Sách Công Việc Kỹ Thuật (Sub-Tasks)
- [ ] **TASK-241**: Tạo bảng `permissions`, `roles`, `role_permissions`, `user_roles` trong PostgreSQL; nạp dữ liệu mẫu (Seeding) danh mục quyền chuẩn.
- [ ] **TASK-242**: Hiện thực bộ API CRUD Vai trò và API gán quyền `PUT /api/v1/iam/roles/{id}/permissions`.
- [ ] **TASK-243**: Hiện thực API gán vai trò người dùng `POST /api/v1/iam/users/{id}/roles`.
- [ ] **TASK-244**: Xây dựng UI Cột 1 (Danh sách Vai trò) và Cột 2 (Lưới Switch Toggle quyền chức năng) trong bố cục Split-Screen trên Angular Web.
- [ ] **TASK-245**: Tích hợp màn hình xem vai trò và đổi vai trò người dùng trên Ionic Mobile.
- [ ] (xem thêm item: BUG-51, TASK-267, TASK-268, BUG-54, TASK-271, TASK-276).

---

## 4. Xác Nhận Hoàn Tất (QA Verification)
- [ ] Developer đã hoàn thành mã nguồn theo thiết kế.
- [ ] QA đã kiểm thử và xác nhận đạt Acceptance Criteria.
- [ ] Không gây lỗi phát sinh (Regression test pass).
