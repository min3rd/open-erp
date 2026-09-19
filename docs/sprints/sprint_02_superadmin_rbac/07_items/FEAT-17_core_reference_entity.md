# [FEAT-17] Thực Thể Tham Chiếu Core Để Kiểm Chứng Data Permission Engine

- **Mã Tính Năng**: FEAT-17
- **Phân Loại**: Feature / Reference Implementation
- **Mức Độ Ưu Tiên**: [ ] Critical / [x] High / [ ] Medium / [ ] Low
- **Người Đề Xuất**: QA/QC Agent (theo kết quả review Sprint 02)
- **Thuộc Sprint**: Sprint 02 - Super Admin & Phân Quyền Toàn Diện
- **Trạng Thái**: [ ] To Do / [x] In Progress / [ ] In Review / [ ] Done / [ ] Deferred
- **Ghi Chú Wave 1 & 2 (2026-09-18)**: Wave 1 (Foundation/UI skeleton) hoàn tất 2026-09-18; Wave 2 backend APIs hoàn tất 2026-09-18; tích hợp/QA ở Wave 3.

---

## 1. Tóm Tắt Nhu Cầu
- **User Story**: Là một Kiến trúc sư/Developer, tôi muốn có một thực thể tham chiếu thuộc Core để kiểm chứng bộ máy phân quyền dữ liệu (7 scopes × 6 operations) hoạt động đúng, vì Sprint 02 không có entity nghiệp vụ nào (xem [BUG-52](BUG-52_missing_reference_entity_for_data_scope.md)).
- **Tài liệu phân tích**: [ANL-02](../02_analysis/ANL-02_functional_rbac_and_data_scope_permissions.md) §3-4.
- **Tài liệu xác nhận khách hàng**: [CONF-01](../04_confirmation/CONF-01_sprint_02_scope.md) mục 1.7 (in-scope Enforcement Engine).
- **Ghi chú phạm vi**: Đây là **reference implementation** phục vụ kiểm chứng engine; sẽ được thay thế bằng entity của Plugin nghiệp vụ khi có Plugin (Sprint sau), không phát triển thêm nghiệp vụ trên bảng này.

## 2. Tiêu Chí Nghiệm Thu (Acceptance Criteria)
- [ ] **AC1**: Bảng `core_sample_records` có các cột `tenant_id`, `branch_id`, `department_id`, `created_by`, `assignee_id`, `title`, `amount`, `status` + timestamps; mọi truy vấn đều gắn `tenant_id`.
- [ ] **AC2**: API `/api/v1/core/sample-records` có list phân trang (khuôn mẫu 2) + CRUD + export; mọi response dùng `code` + `ResponseKey`.
- [ ] **AC3**: Given user có `read_scope = OWN_ONLY`, When lấy danh sách, Then chỉ thấy bản ghi `created_by = mình OR assignee_id = mình`.
- [ ] **AC4**: Given user `export_scope = NONE`, When gọi export, Then nhận `403 IAM_PERMISSION_DENIED_EXPORT`; tenant khác nhận 404/403, không rò rỉ dữ liệu.
- [ ] **AC5**: Có fixture đa tenant/chi nhánh/phòng ban phục vụ test cross-scope; test chạy trên PostgreSQL & Redis thật (cấm H2).

## 3. Danh Sách Công Việc Kỹ Thuật (Sub-Tasks)
- [ ] **TASK-283**: Tạo bảng + entity `core_sample_records` + đăng ký Entity Registry.
- [ ] **TASK-284**: API `/api/v1/core/sample-records` + wiring Data Permission Engine.
- [ ] **TASK-285**: Seed fixtures kiểm thử (nhiều tenant/branch/department/subordinates).
- [ ] **TASK-286**: Bộ test cross-scope/cross-tenant cho 7 scopes × 6 operations.

## 4. Xác Nhận Hoàn Tất (QA Verification)
- [ ] Developer đã hoàn tất toàn bộ sub-task.
- [ ] QA chạy test suite cross-scope trên PostgreSQL thật và xác nhận.
- [ ] Không phát sinh regression.
