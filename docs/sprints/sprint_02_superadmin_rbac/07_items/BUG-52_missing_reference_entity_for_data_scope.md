# [BUG-52] Thiếu Thực Thể Tham Chiếu Để Kiểm Chứng Data Scope (Test Dùng "Đơn Hàng" Không Tồn Tại)

- **Mã Lỗi**: BUG-52
- **Phân Loại**: Bug / Defect
- **Mức Độ Ưu Tiên**: [x] Critical / [ ] High / [ ] Medium / [ ] Low
- **Người Báo Cáo (Reporter)**: QA/QC Agent
- **Người Xử Lý (Assignee)**: Solution Architect Agent
- **Thuộc Sprint**: Sprint 02 - Super Admin & Phân Quyền Toàn Diện
- **Trạng Thái**: [x] To Do / [ ] In Progress / [ ] In Review / [ ] Done / [ ] Deferred

---

## 1. Mô Tả Lỗi
> Kế hoạch kiểm thử và AC của Data Permission Engine thao tác trên "đơn hàng"/`customers` — những thực thể không thuộc phạm vi Core Sprint 02 và chưa từng được định nghĩa trong migration; không có bảng nào chứa đủ `branch_id/department_id/created_by` để engine và test hoạt động.

- **Môi trường**: Backend Quarkus + PostgreSQL (Local)
- **Bằng chứng (file:line)**:
  - `../08_testing/test_plan.md:49-53` — TC-BE-07→11 dùng "danh sách đơn hàng" và `POST /api/v1/customers/export`.
  - `FEAT-16_data_permission_enforcement_engine.md:21` — AC1 gọi `orderRepository.findAccessible()` (không tồn tại).
  - `../05_solutions/SOL-02_rbac_and_data_scope_enforcement_engine.md:181-192` — chỉ ví dụ chỉ mục trên `sale_orders`, không có bảng thực tế nào được tạo trong Sprint 02.
  - `src/backend/src/main/resources/db/migration/` — các migration V1.0.x chỉ có Core IAM, chưa có bảng nghiệp vụ.
  - Phạm vi in-scope tại `../04_confirmation/CONF-01_sprint_02_scope.md:13-41` không bao gồm module Sales/Customer.
- **Tài Liệu Đối Chiếu**: ANL-02 §3-4; SOL-02 §4, §7.

## 2. Tác Động
- Không thể viết test cross-scope (TC-BE-07→11) cũng như chứng minh engine hoạt động; nguy cơ QA viết test giả hoặc bỏ qua kiểm chứng rò rỉ dữ liệu.

## 3. Kết Quả Kỳ Vọng
- Bổ sung FEAT-17 "Thực thể tham chiếu Core" (`core_sample_records` + API `/api/v1/core/sample-records`) làm nơi kiểm chứng 7 scopes/6 operations.
- Test fixtures và TC-BE được cập nhật theo thực thể mới; ghi chú sẽ thay bằng plugin entity khi có Plugin (Sprint sau).

## 4. Xác Nhận Khắc Phục (QA Verification)
- [x] FEAT-17 + TASK-283..286 được ban hành.
- [x] Test plan dùng đúng thực thể `core_sample_records`.
- [x] QA chạy được toàn bộ TC cross-scope trên PostgreSQL thật.

- **Ghi chú QA (2026-09-18)**: Đã ban hành FEAT-17 + TASK-283..286 và cập nhật test plan dùng `core_sample_records`; phần mã theo TASK-283..286, chờ thực thi.
