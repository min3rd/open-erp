# [FEAT-16] Bộ Máy Thực Thi Phân Quyền Dữ Liệu Tự Động Ở Tầng Backend (Data Permission Enforcement Engine)

- **Mã Tính Năng**: FEAT-16
- **Phân Loại**: Feature
- **Mức Độ Ưu Tiên**: [x] Critical / [ ] High / [ ] Medium / [ ] Low
- **Người Đề Xuất**: Solution Architect Agent
- **Người Phụ Trách**: Developer Agent
- **Thuộc Sprint**: Sprint 02 - Super Admin & Phân Quyền Toàn Diện
- **Trạng Thái**: [ ] To Do / [ ] In Progress / [ ] In Review / [x] Done / [ ] Deferred *(QA nghiệm thu cuối 2026-09-19 — TR-02 ĐẠT DoD Gate)*
- **Ghi Chú Wave 1 & 2 (2026-09-18)**: Wave 1 (Foundation/UI skeleton) hoàn tất 2026-09-18; Wave 2 backend APIs hoàn tất 2026-09-18; tích hợp/QA ở Wave 3.
- **Ghi Chú Wave 3 (2026-09-18)**: Wave 3 tích hợp xong (enforcement retrofit, quota call site, impersonation guard, plugin allowlist, must-change-password fix, guard SUPPORT_ENGINEER; backend 178/178 PASS, Web/Mobile build PASS); chờ QA dual-mode + sprint review để chuyển Done.

---

## 1. Tóm Tắt Nhu Cầu
- **User Story**: Là một Lập trình viên Backend và Kiến trúc sư hệ thống, tôi muốn tầng lõi Quarkus Java tự động biên dịch và tiêm các điều kiện lọc SQL (Hibernate Filter / JPA Predicate) dựa trên Ngữ cảnh người dùng (UserSecurityContext) để bảo vệ 100% dữ liệu chống rò rỉ mà không phụ thuộc vào code nghiệp vụ viết tay.
- **Tài liệu phân tích**: [ANL-02_functional_rbac_and_data_scope_permissions.md](../02_analysis/ANL-02_functional_rbac_and_data_scope_permissions.md)
- **Tài liệu giải pháp**: [SOL-02_rbac_and_data_scope_enforcement_engine.md](../05_solutions/SOL-02_rbac_and_data_scope_enforcement_engine.md)
- **Tài liệu thiết kế**: [SUPERADMIN_RBAC_DATABASE_SCHEMA.md](../06_designs/database/SUPERADMIN_RBAC_DATABASE_SCHEMA.md), [SUPERADMIN_RBAC_API_SPEC.md](../06_designs/api/SUPERADMIN_RBAC_API_SPEC.md), [SUPERADMIN_RBAC_UI_SPEC.md](../06_designs/ui_ux/SUPERADMIN_RBAC_UI_SPEC.md)

---

## 2. Tiêu Chí Nghiệm Thu (Acceptance Criteria)
- [x] **Kịch bản 1: Tiêm tự động điều kiện xem (Read Filtering)**: Given người dùng A thuộc phòng ban X có `read_scope = DEPARTMENT`, When gọi `sampleRecordRepository.findAccessible()` trên thực thể `core_sample_records`, Then câu lệnh SQL sinh ra chứa mệnh đề `WHERE tenant_id = :tId AND department_id IN (:userDeptIds)`. Người dùng A không bao giờ thấy bản ghi mẫu của phòng ban Y.
- [x] **Kịch bản 2: Tự động chặn sửa dữ liệu ngoài phạm vi (Mutation Guard)**: Given người dùng B có `update_scope = OWN_ONLY`, When gửi request `PUT /api/v1/core/sample-records/{id}` với bản ghi mẫu do người khác tạo, Then Engine ném ngoại lệ bảo mật và trả về `403 Forbidden` (`IAM_PERMISSION_DENIED_DATA_SCOPE`).
- [x] **Kịch bản 3: Cache ngữ cảnh bảo mật trên Redis**: Given người dùng đăng nhập và gọi API, When request đầu tiên thực thi, Then toàn bộ danh sách phòng ban con, danh sách cấp dưới và chính sách hiệu dụng được lưu vào Redis (`sec:ctx:{tenant_id}:{user_id}`) với TTL 10 phút, các request tiếp theo truy vấn cache $< 2ms$.
- [x] **Kịch bản 4: Vô hiệu hóa cache tức thì (Event-driven Invalidation)**: Given người dùng bị đổi vai trò hoặc chuyển phòng ban, When Admin lưu thay đổi, Then hệ thống phát sự kiện qua Redis Pub/Sub và xóa ngay lập tức key cache của người dùng bị ảnh hưởng.

---

## 3. Danh Sách Công Việc Kỹ Thuật (Sub-Tasks)
- [x] **TASK-261**: Xây dựng DTO `UserSecurityContext` và cơ chế nạp context từ Redis/DB vào RequestScoped Bean trong Quarkus.
- [x] **TASK-262**: Phát triển `DataScopeQueryCompiler` biên dịch 7 Scopes thành các Hibernate Filter / Panache Predicates.
- [x] **TASK-263**: Xây dựng Interceptor kiểm tra thao tác biến đổi (`UPDATE`, `DELETE`, `SHARE`) trước khi commit Transaction.
- [x] **TASK-264**: Hiện thực cơ chế vô hiệu hóa cache (Cache Invalidation Listener) qua Redis Pub/Sub khi có thay đổi cấu hình IAM/Org.
- [x] **TASK-265**: Đánh chỉ mục Composite Indexes trên các bảng nghiệp vụ (`tenant_id, branch_id`, `tenant_id, department_id`, `tenant_id, created_by`).
- [x] **TASK-266**: Viết trọn bộ Unit/Integration Test tự động kiểm tra rò rỉ dữ liệu chéo (Cross-Scope Data Leakage Test Suite) trên PostgreSQL và Redis thật.
- [x] (xem thêm item: BUG-52, FEAT-17, BUG-70, TASK-276).

---

## 4. Xác Nhận Hoàn Tất (QA Verification)
- [x] Developer đã hoàn thành mã nguồn theo thiết kế.
- [x] QA đã kiểm thử và xác nhận đạt Acceptance Criteria.
- [x] Không gây lỗi phát sinh (Regression test pass).

---

## Ghi Chú Hoàn Thành (2026-09-19)
- **Mã nguồn**: `UserSecurityContext` + `SecurityContextService` (Redis `sec:ctx:{tenant}:{user}`, TTL 15 phút, invalidation khi đổi IAM/Org), `DataScopeResolver/Predicate/Engine/FilterEnabler` (7 scope, union most-permissive, subordinates qua CTE), interceptor chặn mutation ngoài phạm vi, composite indexes.
- **Kiểm thử tự động**: `mvn test` **193/193 PASS** — `DataScopeEngineTest`, `SampleRecordApiTest`, `QuotaCallSiteTest` + bộ test rò rỉ dữ liệu chéo (TASK-266/TASK-286) trên PostgreSQL + Redis thật, không H2.
- **QA nghiệm thu cuối (TR-02)**: QA-W-10 (staff `OWN_ONLY` chỉ thấy bản ghi của mình, export bị chặn), phiên impersonation gọi API org/iam không còn 401; smoke web/mobile console 0.
- **Ghi chú**: `core_sample_records` (FEAT-17) là reference entity kiểm chứng engine; sẽ được thay bằng entity Plugin nghiệp vụ khi có Plugin ở Sprint sau.
