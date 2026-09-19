# [FEAT-17] Thực Thể Tham Chiếu Core Để Kiểm Chứng Data Permission Engine

- **Mã Tính Năng**: FEAT-17
- **Phân Loại**: Feature / Reference Implementation
- **Mức Độ Ưu Tiên**: [ ] Critical / [x] High / [ ] Medium / [ ] Low
- **Người Đề Xuất**: QA/QC Agent (theo kết quả review Sprint 02)
- **Thuộc Sprint**: Sprint 02 - Super Admin & Phân Quyền Toàn Diện
- **Trạng Thái**: [ ] To Do / [ ] In Progress / [ ] In Review / [x] Done / [ ] Deferred *(QA nghiệm thu cuối 2026-09-19 — TR-02 ĐẠT DoD Gate)*
- **Ghi Chú Wave 1 & 2 (2026-09-18)**: Wave 1 (Foundation/UI skeleton) hoàn tất 2026-09-18; Wave 2 backend APIs hoàn tất 2026-09-18; tích hợp/QA ở Wave 3.
- **Ghi Chú Wave 3 (2026-09-18)**: Wave 3 tích hợp xong (enforcement retrofit, quota call site, impersonation guard, plugin allowlist, must-change-password fix, guard SUPPORT_ENGINEER; backend 178/178 PASS, Web/Mobile build PASS); chờ QA dual-mode + sprint review để chuyển Done.

---

## 1. Tóm Tắt Nhu Cầu
- **User Story**: Là một Kiến trúc sư/Developer, tôi muốn có một thực thể tham chiếu thuộc Core để kiểm chứng bộ máy phân quyền dữ liệu (7 scopes × 6 operations) hoạt động đúng, vì Sprint 02 không có entity nghiệp vụ nào (xem [BUG-52](BUG-52_missing_reference_entity_for_data_scope.md)).
- **Tài liệu phân tích**: [ANL-02](../02_analysis/ANL-02_functional_rbac_and_data_scope_permissions.md) §3-4.
- **Tài liệu xác nhận khách hàng**: [CONF-01](../04_confirmation/CONF-01_sprint_02_scope.md) mục 1.7 (in-scope Enforcement Engine).
- **Ghi chú phạm vi**: Đây là **reference implementation** phục vụ kiểm chứng engine; sẽ được thay thế bằng entity của Plugin nghiệp vụ khi có Plugin (Sprint sau), không phát triển thêm nghiệp vụ trên bảng này.

## 2. Tiêu Chí Nghiệm Thu (Acceptance Criteria)
- [x] **AC1**: Bảng `core_sample_records` có các cột `tenant_id`, `branch_id`, `department_id`, `created_by`, `assignee_id`, `title`, `amount`, `status` + timestamps; mọi truy vấn đều gắn `tenant_id`.
- [x] **AC2**: API `/api/v1/core/sample-records` có list phân trang (khuôn mẫu 2) + CRUD + export; mọi response dùng `code` + `ResponseKey`.
- [x] **AC3**: Given user có `read_scope = OWN_ONLY`, When lấy danh sách, Then chỉ thấy bản ghi `created_by = mình OR assignee_id = mình`.
- [x] **AC4**: Given user `export_scope = NONE`, When gọi export, Then nhận `403 IAM_PERMISSION_DENIED_EXPORT`; tenant khác nhận 404/403, không rò rỉ dữ liệu.
- [x] **AC5**: Có fixture đa tenant/chi nhánh/phòng ban phục vụ test cross-scope; test chạy trên PostgreSQL & Redis thật (cấm H2).

## 3. Danh Sách Công Việc Kỹ Thuật (Sub-Tasks)
- [x] **TASK-283**: Tạo bảng + entity `core_sample_records` + đăng ký Entity Registry.
- [x] **TASK-284**: API `/api/v1/core/sample-records` + wiring Data Permission Engine.
- [x] **TASK-285**: Seed fixtures kiểm thử (nhiều tenant/branch/department/subordinates).
- [x] **TASK-286**: Bộ test cross-scope/cross-tenant cho 7 scopes × 6 operations.

## 4. Xác Nhận Hoàn Tất (QA Verification)
- [x] Developer đã hoàn tất toàn bộ sub-task.
- [x] QA chạy test suite cross-scope trên PostgreSQL thật và xác nhận.
- [x] Không phát sinh regression.

---

## Ghi Chú Hoàn Thành (2026-09-19)
- **Mã nguồn**: bảng + entity `core_sample_records` (đăng ký Entity Registry); API `/api/v1/core/sample-records` (list phân trang khuôn mẫu 2 + CRUD + share + export, `code` + `ResponseKey`); fixtures đa tenant/chi nhánh/phòng ban.
- **Kiểm thử tự động**: `mvn test` **193/193 PASS** — `SampleRecordApiTest` (AC1-AC5) + `DataScopeEngineTest` + cross-scope tests TASK-286 trên PostgreSQL + Redis thật.
- **QA nghiệm thu cuối (TR-02)**: QA-W-10 (owner: list 3 dòng, tạo bản ghi, export OK; staff `OWN_ONLY` không thấy bản ghi người khác; export trả `403 IAM_PERMISSION_DENIED_EXPORT`), mobile QA-SM2-M-04 render danh sách PASS; console 0.
- **Sub-task liên quan**: TASK-283/284/285/286 `Done`.
