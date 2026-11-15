# [BUG-199] Cột phòng ban trong báo cáo trống — chưa đọc dữ liệu org/employee qua gRPC

| Trường | Giá trị |
| :--- | :--- |
| ID / loại / sprint | BUG-199 / Bug / Sprint 09 |
| Severity / trạng thái | **High / Fixed source** |
| Owner/agent / reviewer | Developer / QA |
| Cập nhật / input version | 2026-11-15 / Tenant `review50c` |
| depends_on / blocks / parent | BUG-197 / báo cáo theo phòng ban / [TASK-466](TASK-466_attendance_api.md) |
| Write scope | `OrgDirectoryService`, `AttendanceReportService`, manifest org-structure/employee, UI báo cáo |

## 1. Hiện tượng

Báo cáo công phòng ban và top đi muộn/OT không có tên phòng ban (`department_name = null`), dù tenant đã có 8 phòng ban và nhân sự.

## 2. Nguyên nhân

- Attendance chỉ có `primary_department_id` trên projection nhân sự và projection này không được đồng bộ (51 ref đều null).
- Query id của plugin org (`department.list`) và employee (`assignment.list`) không có tiền tố plugin, nên cơ chế đọc chéo của data gateway (yêu cầu tiền tố khớp plugin key) không resolve được.

## 3. Sửa đổi

- Thêm alias READ có tiền tố vào manifest của plugin đích:
  - `org-structure.department.list`, `org-structure.branch.list`
  - `employee.assignment.list` (bộ lọc `employee_id` optional)
- `OrgDirectoryService` trong attendance:
  - đọc assignments qua gRPC (cross-plugin READ) → chọn phân công primary,
  - đọc departments qua gRPC → map id → tên,
  - cache 60 giây theo tenant; lỗi/không cài plugin thì trả map rỗng để báo cáo vẫn chạy.
- `AttendanceReportService` dùng service này cho team/top-late/OT và trả `by_department` thật trong summary.
- UI: cột **Phòng ban** ở bảng Công phòng ban, Top đi muộn và OT.
- QA script tự tạo phân công phòng ban qua API employee (idempotent) trước khi assert.

## 4. Kiểm chứng

- `npm run qa:attendance-api`: 18/18 PASS, gồm “Team report resolves department names via cross-plugin gRPC” và “Summary report aggregates by department”.
- UI Công phòng ban hiển thị 51 nhân sự kèm phòng ban (Chăm sóc khách hàng, Vận hành, Kinh doanh, Công nghệ thông tin, Marketing, …).
