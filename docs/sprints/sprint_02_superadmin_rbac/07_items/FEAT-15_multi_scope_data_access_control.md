# [FEAT-15] Phân Quyền Dữ Liệu Đa Phạm Vi & Ma Trận 6 Thao Tác Tác Động Dữ Liệu

- **Mã Tính Năng**: FEAT-15
- **Phân Loại**: Feature
- **Mức Độ Ưu Tiên**: [x] Critical / [ ] High / [ ] Medium / [ ] Low
- **Người Đề Xuất**: Khách hàng / BA Agent
- **Người Phụ Trách**: Developer Agent
- **Thuộc Sprint**: Sprint 02 - Super Admin & Phân Quyền Toàn Diện
- **Trạng Thái**: [x] To Do / [ ] In Progress / [ ] In Review / [ ] Done / [ ] Deferred

---

## 1. Tóm Tắt Nhu Cầu
- **User Story**: Là một Quản trị viên Doanh nghiệp (Tenant Admin), tôi muốn thiết lập ma trận phạm vi dữ liệu theo 7 cấp bậc (`ALL`, `BRANCH`, `DEPARTMENT_AND_CHILDREN`, `DEPARTMENT`, `OWN_AND_SUBORDINATES`, `OWN_ONLY`, `NONE`) độc lập cho 6 thao tác dữ liệu (`CREATE`, `READ`, `UPDATE`, `DELETE`, `EXPORT`, `SHARE`) trên từng tài nguyên nghiệp vụ để bảo vệ dữ liệu doanh nghiệp và chống lộ lọt thông tin.
- **Tài liệu phân tích**: [ANL-02_functional_rbac_and_data_scope_permissions.md](../02_analysis/ANL-02_functional_rbac_and_data_scope_permissions.md)
- **Tài liệu giải pháp**: [SOL-02_rbac_and_data_scope_enforcement_engine.md](../05_solutions/SOL-02_rbac_and_data_scope_enforcement_engine.md)
- **Tài liệu thiết kế**: [SUPERADMIN_RBAC_DATABASE_SCHEMA.md](../06_designs/database/SUPERADMIN_RBAC_DATABASE_SCHEMA.md), [SUPERADMIN_RBAC_API_SPEC.md](../06_designs/api/SUPERADMIN_RBAC_API_SPEC.md), [SUPERADMIN_RBAC_UI_SPEC.md](../06_designs/ui_ux/SUPERADMIN_RBAC_UI_SPEC.md)

---

## 2. Tiêu Chí Nghiệm Thu (Acceptance Criteria)
- [ ] **Kịch bản 1: Cấu hình ma trận phạm vi dữ liệu**: Given Tenant Admin đang chọn vai trò `SALES_LEAD`, When thiết lập tài nguyên `SALE_ORDER` có `read_scope = OWN_AND_SUBORDINATES`, `create_scope = BRANCH`, `update_scope = OWN_ONLY`, `delete_scope = NONE`, `export_scope = NONE`, Then cấu hình được lưu vào bảng `role_data_policies`.
- [ ] **Kịch bản 2: Bảo vệ quyền Xuất dữ liệu (Export Protection)**: Given nhân viên có vai trò với `export_scope = NONE` trên tài nguyên `SAMPLE_RECORD`, When người dùng bấm xuất Excel danh sách bản ghi mẫu hoặc gọi API `POST /api/v1/core/sample-records/export`, Then nút bấm bị vô hiệu hóa hoặc API trả về lỗi `403 Forbidden` (`IAM_PERMISSION_DENIED_EXPORT`).
- [ ] **Kịch bản 3: Nguyên tắc gộp quyền mở rộng nhất (Most Permissive)**: Given người dùng có 2 vai trò: Vai trò 1 cho `read_scope = OWN_ONLY`, Vai trò 2 cho `read_scope = DEPARTMENT`, When người dùng xem danh sách, Then người dùng xem được toàn bộ dữ liệu của `DEPARTMENT`.
- [ ] **Kịch bản 4: Quyền tuyệt đối của TENANT_OWNER**: Given tài khoản chủ sở hữu Tenant, When truy vấn bất kỳ dữ liệu nào, Then luôn áp dụng phạm vi `ALL` cho mọi thao tác, không bị giới hạn bởi bất kỳ chính sách nào.

---

## 3. Danh Sách Công Việc Kỹ Thuật (Sub-Tasks)
- [ ] **TASK-251**: Tạo bảng `role_data_policies` trong PostgreSQL kèm ràng buộc Check Constraints hợp lệ cho 7 Scopes.
- [ ] **TASK-252**: Khởi tạo các Java Enum `DataScope` và `DataOperation` trong Quarkus Backend và TypeScript Enums trong Frontend Shared UI.
- [ ] **TASK-253**: Hiện thực API `GET /api/v1/iam/roles/{id}/data-policies` và `PUT /api/v1/iam/roles/{id}/data-policies`.
- [ ] **TASK-254**: Xây dựng thuật toán tính toán quyền hiệu dụng (Effective Policy Calculator) áp dụng nguyên tắc Most Permissive khi gộp nhiều Roles.
- [ ] **TASK-255**: Xây dựng UI Cột 3 (Ma trận bảng lưới 2 chiều Dropdown phân quyền dữ liệu) trong màn hình Split-Screen trên Angular Web.
- [ ] (xem thêm item: BUG-50, BUG-52, FEAT-17, BUG-61, TASK-282, TASK-276, TASK-288, BUG-71).

---

## 4. Xác Nhận Hoàn Tất (QA Verification)
- [ ] Developer đã hoàn thành mã nguồn theo thiết kế.
- [ ] QA đã kiểm thử và xác nhận đạt Acceptance Criteria.
- [ ] Không gây lỗi phát sinh (Regression test pass).
