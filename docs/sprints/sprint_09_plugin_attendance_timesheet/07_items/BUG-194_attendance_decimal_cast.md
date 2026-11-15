# [BUG-194] Tạo loại phép trả 500 — cột decimal bind dạng varchar

| Trường | Giá trị |
| :--- | :--- |
| ID / loại / sprint | BUG-194 / Bug / Sprint 09 |
| Severity / trạng thái | **High / Fixed source** |
| Owner/agent / reviewer | Developer / QA |
| Cập nhật / input version | 2026-11-15 / Tenant `review50c` |
| depends_on / blocks / parent | BUG-188 / sổ cái phép / [TASK-456](TASK-456_attendance_leave_types_ledger_balances.md) |
| Write scope | `plugin.json`, `LeaveAdminResource`, UI quản lý nghỉ phép |

## 1. Hiện tượng

`POST /admin/leave-types` trả `INTERNAL_ERROR — Unexpected catalog plugin error`; không thể tạo loại phép nên sổ cái phép luôn 0 và đơn LEAVE không trừ phép.

## 2. Nguyên nhân

Data gateway bind tham số dạng text. Các cột `numeric` (`default_annual_grant`, `days`, `granted`, `used`, `remaining`, `expiring`) nhận varchar nên PostgreSQL từ chối. Đây cùng lớp lỗi với `jsonb`/`time` trước đó.

## 3. Sửa đổi

- Thêm `"type": "numeric"` cho toàn bộ tham số ghi vào cột decimal trong `plugin.json`.
- Thêm `GET /admin/employees` (phân trang đầy đủ) để UI chọn nhân sự.
- UI **Quản lý nghỉ phép**: bảng loại phép, drawer thêm loại phép, drawer cấp phép (nhân sự + loại phép + số ngày).

## 4. Kiểm chứng

- Tạo loại phép `ANNUAL` trả 200.
- Cấp 12 ngày phép cho nhân sự → `plg_attendance_leave_ledger` có bản ghi, số dư hiển thị.
