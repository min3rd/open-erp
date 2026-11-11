# [TASK-450] Mẫu xuất bảng công & Xuất dữ liệu Payroll-ready (Excel/CSV)

| Trường | Giá trị |
| :--- | :--- |
| ID / loại / sprint | TASK-450 / Task / Sprint 09 |
| Severity / trạng thái | High / Done |
| Owner/agent / reviewer | Developer / QA |
| Cập nhật / input version | 2026-11-11 / [DES-DB-S09-001](../06_designs/db/01_DES-DB-S09-001_attendance_schema.md), [DES-API-S09-001](../06_designs/api/01_DES-API-S09-001_attendance_api.md) §8 |
| depends_on / blocks / parent | TASK-449 / TASK-451 / [FEAT-44](FEAT-44_attendance_timesheets.md) |
| Write scope | `plugins/attendance/src/main/java/**` |

## 1. Mục tiêu

1. **Quản lý Template cột xuất**: `GET/POST/PUT/DELETE /admin/export-templates` (cho phép bật/tắt và sắp xếp thứ tự các cột xuất dữ liệu: Mã NV, Họ tên, Phòng ban, Chi nhánh, Công chuẩn, Công thực tế, Nghỉ phép có lương, Nghỉ không lương, Giờ OT thường, Giờ OT đêm, Đi muộn, Về sớm).
2. **Xuất bảng công (Export Payroll-ready)**: `POST /admin/timesheets/{id}/export` xuất bảng công theo template ra file CSV / Excel, sẵn sàng nạp cho phần mềm tính lương.
