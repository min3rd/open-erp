# [FEAT-13] Cơ Cấu Tổ Chức Doanh Nghiệp (Chi Nhánh, Cây Phòng Ban & Tuyến Quản Lý Báo Cáo)

- **Mã Tính Năng**: FEAT-13
- **Phân Loại**: Feature
- **Mức Độ Ưu Tiên**: [ ] Critical / [x] High / [ ] Medium / [ ] Low
- **Người Đề Xuất**: Khách hàng / BA Agent
- **Người Phụ Trách**: Developer Agent
- **Thuộc Sprint**: Sprint 02 - Super Admin & Phân Quyền Toàn Diện
- **Trạng Thái**: [ ] To Do / [x] In Progress / [ ] In Review / [ ] Done / [ ] Deferred
- **Ghi Chú Wave 1 & 2 (2026-09-18)**: Wave 1 (Foundation/UI skeleton) hoàn tất 2026-09-18; Wave 2 backend APIs hoàn tất 2026-09-18; tích hợp/QA ở Wave 3.

---

## 1. Tóm Tắt Nhu Cầu
- **User Story**: Là một Quản trị viên Doanh nghiệp (Tenant Admin) hoặc Giám đốc nhân sự, tôi muốn thiết lập danh mục Chi nhánh, Cây phòng ban đa cấp và chỉ định Quản lý trực tiếp cho từng nhân sự để xây dựng nền tảng sơ đồ tổ chức phục vụ phân quyền dữ liệu.
- **Tài liệu phân tích**: [ANL-02_functional_rbac_and_data_scope_permissions.md](../02_analysis/ANL-02_functional_rbac_and_data_scope_permissions.md)
- **Tài liệu giải pháp**: [SOL-02_rbac_and_data_scope_enforcement_engine.md](../05_solutions/SOL-02_rbac_and_data_scope_enforcement_engine.md)
- **Tài liệu thiết kế**: [SUPERADMIN_RBAC_DATABASE_SCHEMA.md](../06_designs/database/SUPERADMIN_RBAC_DATABASE_SCHEMA.md), [SUPERADMIN_RBAC_API_SPEC.md](../06_designs/api/SUPERADMIN_RBAC_API_SPEC.md), [SUPERADMIN_RBAC_UI_SPEC.md](../06_designs/ui_ux/SUPERADMIN_RBAC_UI_SPEC.md)

---

## 2. Tiêu Chí Nghiệm Thu (Acceptance Criteria)
- [ ] **Kịch bản 1: Quản lý Chi nhánh**: Given Tenant Admin mở màn hình chi nhánh, When tạo mới chi nhánh "Chi nhánh Đà Nẵng (BR-DN)", Then chi nhánh được tạo kèm cờ hoạt động `ACTIVE`, không trùng mã trong cùng Tenant.
- [ ] **Kịch bản 2: Cây Phòng Ban đa cấp**: Given một phòng ban "Khối Kinh Doanh", When tạo thêm "Phòng Bán Lẻ" với `parent_id` là Khối Kinh Doanh, Then cây phòng ban hiển thị phân cấp chính xác.
- [ ] **Kịch bản 3: Gán nhân viên vào phòng ban**: Given nhân viên Nguyễn Văn A, When gán vào Phòng Bán Lẻ và chỉ định quản lý trực tiếp là Trần Văn B, Then bản ghi liên kết được tạo với cờ `is_primary = true`.
- [ ] **Kịch bản 4: Chặn vòng lặp tuyến báo cáo (Cycle Detection)**: Given A quản lý B, B quản lý C, When cố gắng gán C làm quản lý trực tiếp của A, Then hệ thống phát hiện chu trình và báo lỗi `ORGANIZATION_REPORTING_CYCLE_DETECTED`.
- [ ] **Kịch bản 5: Phân công quản lý nhiều chi nhánh**: Given một Giám đốc vùng, When gán quản lý BR-HN và BR-HCM (không cần membership từng phòng ban), Then hệ thống lưu `user_branch_assignments` và scope BRANCH của người này bao gồm cả 2 chi nhánh.

---

## 3. Danh Sách Công Việc Kỹ Thuật (Sub-Tasks)
- [ ] **TASK-231**: Tạo bảng `branches`, `departments`, `user_department_memberships` trong PostgreSQL.
- [ ] **TASK-232**: Viết thuật toán phát hiện chu trình vòng lặp (DFS Cycle Detection) trong Quarkus Service khi gán quản lý trực tiếp.
- [ ] **TASK-233**: Hiện thực bộ API CRUD `/api/v1/organization/branches`, `/api/v1/organization/departments/tree` và `/api/v1/organization/memberships`.
- [ ] **TASK-234**: Xây dựng UI Cây sơ đồ phòng ban phân cấp trên Angular Web với Split-Screen (bên trái cây phòng ban, bên phải danh sách nhân sự).
- [ ] **TASK-235**: Xây dựng `DepartmentFormDrawer` và `UserAssignmentDrawer` trượt cạnh phải Anti-Modal.
- [ ] **TASK-236**: Xây dựng màn hình danh bạ cơ cấu tổ chức trên ứng dụng Ionic Mobile.
- [ ] (xem thêm item: TASK-279, BUG-66, TASK-275, TASK-287, TASK-288, TASK-289, TASK-290, BUG-71).

---

## 4. Xác Nhận Hoàn Tất (QA Verification)
- [ ] Developer đã hoàn thành mã nguồn theo thiết kế.
- [ ] QA đã kiểm thử và xác nhận đạt Acceptance Criteria.
- [ ] Không gây lỗi phát sinh (Regression test pass).
