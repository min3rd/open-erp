# [FEAT-16] Bộ Máy Thực Thi Phân Quyền Dữ Liệu Tự Động Ở Tầng Backend (Data Permission Enforcement Engine)

- **Mã Tính Năng**: FEAT-16
- **Phân Loại**: Feature
- **Mức Độ Ưu Tiên**: [x] Critical
- **Người Đề Xuất**: Solution Architect Agent
- **Thuộc Sprint**: Sprint 02 - Super Admin & Phân Quyền Toàn Diện
- **Trạng Thái**: [ ] To Do

---

## 1. Tóm Tắt Nhu Cầu
- **User Story**: Là một Lập trình viên Backend và Kiến trúc sư hệ thống, tôi muốn tầng lõi Quarkus Java tự động biên dịch và tiêm các điều kiện lọc SQL (Hibernate Filter / JPA Predicate) dựa trên Ngữ cảnh người dùng (UserSecurityContext) để bảo vệ 100% dữ liệu chống rò rỉ mà không phụ thuộc vào code nghiệp vụ viết tay.
- **Tài liệu phân tích**: [ANL-02_functional_rbac_and_data_scope_permissions.md](../02_analysis/ANL-02_functional_rbac_and_data_scope_permissions.md)
- **Tài liệu giải pháp**: [SOL-02_rbac_and_data_scope_enforcement_engine.md](../05_solutions/SOL-02_rbac_and_data_scope_enforcement_engine.md)
- **Tài liệu thiết kế**: [SUPERADMIN_RBAC_DATABASE_SCHEMA.md](../06_designs/database/SUPERADMIN_RBAC_DATABASE_SCHEMA.md)

---

## 2. Tiêu Chí Nghiệm Thu (Acceptance Criteria)
- [ ] **Kịch bản 1: Tiêm tự động điều kiện xem (Read Filtering)**: Given người dùng A thuộc phòng ban X có `read_scope = DEPARTMENT`, When gọi `orderRepository.findAccessible()`, Then câu lệnh SQL sinh ra chứa mệnh đề `WHERE tenant_id = :tId AND department_id IN (:userDeptIds)`. Người dùng A không bao giờ thấy đơn hàng của phòng ban Y.
- [ ] **Kịch bản 2: Tự động chặn sửa dữ liệu ngoài phạm vi (Mutation Guard)**: Given người dùng B có `update_scope = OWN_ONLY`, When gửi request `PUT /api/v1/orders/{id}` với đơn hàng do người khác tạo, Then Engine ném ngoại lệ bảo mật và trả về `403 Forbidden` (`IAM_PERMISSION_DENIED_DATA_SCOPE`).
- [ ] **Kịch bản 3: Cache ngữ cảnh bảo mật trên Redis**: Given người dùng đăng nhập và gọi API, When request đầu tiên thực thi, Then toàn bộ danh sách phòng ban con, danh sách cấp dưới và chính sách hiệu dụng được lưu vào Redis (`sec:ctx:{tenant_id}:{user_id}`) với TTL 10 phút, các request tiếp theo truy vấn cache $< 2ms$.
- [ ] **Kịch bản 4: Vô hiệu hóa cache tức thì (Event-driven Invalidation)**: Given người dùng bị đổi vai trò hoặc chuyển phòng ban, When Admin lưu thay đổi, Then hệ thống phát sự kiện qua Redis Pub/Sub và xóa ngay lập tức key cache của người dùng bị ảnh hưởng.

---

## 3. Danh Sách Công Việc Kỹ Thuật (Sub-Tasks)
- [ ] **TASK-261**: Xây dựng DTO `UserSecurityContext` và cơ chế nạp context từ Redis/DB vào RequestScoped Bean trong Quarkus.
- [ ] **TASK-262**: Phát triển `DataScopeQueryCompiler` biên dịch 7 Scopes thành các Hibernate Filter / Panache Predicates.
- [ ] **TASK-263**: Xây dựng Interceptor kiểm tra thao tác biến đổi (`UPDATE`, `DELETE`, `SHARE`) trước khi commit Transaction.
- [ ] **TASK-264**: Hiện thực cơ chế vô hiệu hóa cache (Cache Invalidation Listener) qua Redis Pub/Sub khi có thay đổi cấu hình IAM/Org.
- [ ] **TASK-265**: Đánh chỉ mục Composite Indexes trên các bảng nghiệp vụ (`tenant_id, branch_id`, `tenant_id, department_id`, `tenant_id, created_by`).
- [ ] **TASK-266**: Viết trọn bộ Unit/Integration Test tự động kiểm tra rò rỉ dữ liệu chéo (Cross-Scope Data Leakage Test Suite) trên PostgreSQL và Redis thật.
