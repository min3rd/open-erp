# [TASK-458] Cấp phép, điều chỉnh phép & Báo cáo số dư phép

| Trường | Giá trị |
| :--- | :--- |
| ID / loại / sprint | TASK-458 / Task / Sprint 09 |
| Severity / trạng thái | High / In Progress |
| Owner/agent / reviewer | Developer / QA |
| Cập nhật / input version | 2026-11-11 / [DES-API-S09-001](../06_designs/api/01_DES-API-S09-001_attendance_api.md) §7 |
| depends_on / blocks / parent | TASK-456 / FEAT-47 / [FEAT-46](FEAT-46_attendance_leave_module.md) |
| Write scope | `plugins/attendance/**` |

## 1. Mục tiêu

1. `POST /admin/leave-ledger/grants`: Cấp phép cho danh sách nhân viên (`employee_ids[]`, `leave_type_id`, `days`, `valid_until`, `note`).
2. `POST /admin/leave-ledger/adjustments`: HR điều chỉnh số dư phép (+/- days) kèm lý do bắt buộc.
3. `GET /my-leave-balances`: Nhân viên xem số dư phép của bản thân (được cấp, đã dùng, còn lại, sắp hết hạn).
4. `GET /admin/leave-balances`: HR xem số dư phép toàn bộ nhân viên.
5. `GET /admin/leave-ledger`: Tra cứu lịch sử biến động sổ cái nghỉ phép.

