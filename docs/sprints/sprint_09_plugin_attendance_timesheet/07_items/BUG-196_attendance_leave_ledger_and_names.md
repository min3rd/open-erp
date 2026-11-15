# [BUG-196] Sổ cái phép 500, tên nhân viên hardcode, `my-requests` sai path

| Trường | Giá trị |
| :--- | :--- |
| ID / loại / sprint | BUG-196 / Bug / Sprint 09 |
| Severity / trạng thái | **High / Fixed source** |
| Owner/agent / reviewer | Developer / QA |
| Cập nhật / input version | 2026-11-15 / Tenant `review50c` |
| depends_on / blocks / parent | BUG-194 / nghiệm thu nghỉ phép / [TASK-456](TASK-456_attendance_leave_types_ledger_balances.md) |
| Write scope | `LeaveLedgerService`, `LeaveDtos`, `attendance.service.ts`, template |

## 1. Hiện tượng

- Tab **Quản lý nghỉ phép** hiển thị "Tổng: 0 bản ghi" cho sổ cái dù DB có 52 bút toán GRANT.
- Mọi dòng số dư/sổ cái hiển thị "Nguyễn Văn A" (dữ liệu mẫu).
- **Đơn của tôi** luôn rỗng vì gọi `/requests/my-requests` (khớp `GET /requests/{id}` → `Invalid UUID string: my-requests`).
- Thẻ ca hiển thị "Giờ công quy đổi: h" (thiếu giá trị).

## 2. Nguyên nhân

| Lỗi | Nguyên nhân |
| :--- | :--- |
| Sổ cái 500 | `mapLedgerRow` cast `(Number)` cho cột `days` nhưng gateway trả NUMERIC dạng String |
| Tên mẫu | DTO không có `employee_name`; template fallback hardcode "Nguyễn Văn A" |
| my-requests 404 | UI gọi sai path; API đúng là `GET /my-requests` |
| Giờ công trống | Backend trả `working_minutes`, template đọc `work_hours` |

## 3. Sửa đổi

- `days` đọc qua `toDouble(...)`, chấp nhận String/Number.
- Thêm `employee_name` vào `LeaveBalanceDto` và `LeaveLedgerEntryDto`; service nạp một lần danh sách nhân sự (`PluginDataPager`) và gán tên.
- UI bỏ fallback hardcode, hiển thị `—` khi thiếu.
- UI gọi `GET /my-requests`.
- `AttendanceService.shifts()` map `work_hours = working_minutes / 60`.

## 4. Kiểm chứng

- `GET /admin/leave-ledger?page=1&size=10` trả 200 và 52 bút toán có tên nhân viên.
- Tab Đơn của tôi hiển thị đơn đã tạo.
- Thẻ ca hiển thị "8h".
