# [BUG-165] Offboarding guard bỏ qua last tenant admin

| Trường | Giá trị |
| :--- | :--- |
| ID / loại / sprint | BUG-165 / Bug bảo mật / Sprint 07 |
| Mức độ / trạng thái | **Critical** / **Resolved (QA)** 2026-10-30 |
| Phát hiện bởi / ngày | QA/QC Agent / 2026-10-30 |
| Owner / reviewer | Developer / QA |
| Liên quan | [TASK-431](TASK-431_employee_admin_api_assignment_contract.md), AC-12/37 |

## 1. Mô tả

Gọi offboard nhân viên liên kết với tenant admin duy nhất trả **200 EMPLOYEE_OFFBOARDED** thay vì chặn. Nguyên nhân: Core check chỉ so `user_tenants.role = 'ADMIN'`, nhưng enum thực tế dùng `TENANT_ADMIN`; vì vậy `last_admin = false`.

Hệ quả: có thể offboard/khóa tenant admin cuối, làm tenant mất quản trị.

## 2. Cách sửa

- `InternalEmployeeGovernanceResource`: đếm admin theo `role in ('ADMIN','TENANT_ADMIN')`; `last_admin` đúng cho cả hai.
- Thêm test `lastAdminGuard` (TENANT_ADMIN) bên cạnh owner/platform.

## 3. Kiểm chứng

- `InternalEmployeeGovernanceResourceTest` 4/4 PASS.
- API thật: offboard admin duy nhất → **409 EMPLOYEE_LAST_ADMIN_FORBIDDEN**.
- Dữ liệu test đã restore employee ACTIVE + projection.

## 4. Lịch sử

| Phiên bản | Ngày | Thay đổi | Nguồn |
| :--- | :--- | :--- | :--- |
| 0.1 | 2026-10-30 | QA API thật phát hiện guard bỏ qua TENANT_ADMIN | TR-S07-001 1.2 |
| 0.2 | 2026-10-30 | Fix role matching + test; retest 409 PASS | Developer/QA |
