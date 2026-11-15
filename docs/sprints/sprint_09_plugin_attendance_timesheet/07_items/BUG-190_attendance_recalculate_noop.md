# [BUG-190] Nút tính lại công là no-op — không có record nào được tạo

| Trường | Giá trị |
| :--- | :--- |
| ID / loại / sprint | BUG-190 / Bug / Sprint 09 |
| Severity / trạng thái | **High / Fixed source** |
| Owner/agent / reviewer | Developer / QA |
| Cập nhật / input version | 2026-11-15 / Tenant `review50c`, tháng 10/2026 |
| depends_on / blocks / parent | BUG-189 / bảng công thật / [TASK-465](TASK-465_attendance_calc_job.md) |
| Write scope | `AttendanceCalculationService`, `AttendanceAdminResource`, `TimesheetService` |

## 1. Hiện tượng

`POST /admin/records/recalculate` trả `ATTENDANCE_RECALC_QUEUED` nhưng không làm gì. Kỳ công tháng 10/2026 có 2.069 log nhưng `actual_days = 0` cho cả 51 nhân sự, vì bảng `plg_attendance_records` trống.

## 2. Nguyên nhân

Endpoint chỉ trả timestamp; không có orchestrator nào duyệt nhân viên × ngày để gọi `AttendanceCalculationService.calculateDay`.

## 3. Sửa đổi

- `AttendanceCalculationService.recalculateRange(from, to)`: nạp thư viện ca, ca mặc định, record hiện có, log theo ngày và phân ca theo ngày; gọi `calculateDay` cho mỗi cặp nhân viên–ngày có log hoặc có phân ca.
- `persistRecord` phân nhánh: có record → `attendance.record.recalc_update` (UPDATE theo id), chưa có → `attendance.record.upsert`. Bảo toàn `is_override`.
- Endpoint nhận `from`/`to` (tối đa 10 ngày/lần) và trả `calculated`; UI "Tính lại công" và bước S3 chia kỳ thành các đoạn 7 ngày để tránh timeout 30s của gateway.
- Bước `S3_CALCULATE` chỉ tạo snapshot từ record; việc tính record do thao tác tính công (chunked) đảm nhận.

## 4. Kiểm chứng

- Gọi recalculate tháng 10/2026 → số record > 0; chạy lại lần 2 không nhân đôi record.
- Snapshot kỳ công có `actual_days` khác 0.
