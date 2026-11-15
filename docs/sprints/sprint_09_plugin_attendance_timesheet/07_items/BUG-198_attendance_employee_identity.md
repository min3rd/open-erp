# [BUG-198] Đơn từ và số dư phép của nhân viên dùng `user_id` thay vì `employee_id`

| Trường | Giá trị |
| :--- | :--- |
| ID / loại / sprint | BUG-198 / Bug / Sprint 09 |
| Severity / trạng thái | **High / Fixed source** |
| Owner/agent / reviewer | Developer / QA |
| Cập nhật / input version | 2026-11-15 / Tenant `review50c` |
| depends_on / blocks / parent | BUG-196 / dữ liệu self-service / [TASK-468](TASK-468_attendance_activity_audit_trail.md) |
| Write scope | `AttendanceEmployeeResolver`, `RequestResource`, `MyLeaveResource` |

## 1. Hiện tượng

Đơn nghỉ phép và số dư phép của người dùng đăng nhập được ghi theo `user_id`, trong khi log chấm công, phân ca và bảng công dùng `employee_id` của projection nhân sự. Vì vậy đơn/số dư không khớp với dữ liệu công của chính nhân viên đó.

## 2. Nguyên nhân

`RequestResource.submitRequest` và `MyLeaveResource` lấy thẳng `tenantContext.userId()` làm employee id. `AttendanceResource` đã resolve đúng qua `attendance.employee_ref.get_by_user_id` nhưng hai resource còn lại thì chưa.

## 3. Sửa đổi

- Thêm `AttendanceEmployeeResolver.resolve(userId)`: tra `employee_ref` theo `user_id`, fallback về `user_id` khi chưa sync.
- Áp dụng cho: nộp đơn, danh sách đơn của tôi, số dư phép của tôi.
- `GET /admin/employees` trả thêm `user_id` để QA đối chiếu.

## 4. Kiểm chứng

- `npm run qa:attendance-api`: cấp phép và nộp đơn cho user `review50c` ghi đúng `employee_id` của EMP-000, sổ cái hiển thị tên nhân viên.
