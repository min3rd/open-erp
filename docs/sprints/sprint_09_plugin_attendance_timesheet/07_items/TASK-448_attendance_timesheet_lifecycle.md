# [TASK-448] Timesheets CRUD + Quy trình 4 bước Base + Snapshot

| Trường | Giá trị |
| :--- | :--- |
| ID / loại / sprint | TASK-448 / Task / Sprint 09 |
| Severity / trạng thái | High / Done |
| Owner/agent / reviewer | Developer / QA |
| Cập nhật / input version | 2026-11-11 / [DES-DB-S09-001](../06_designs/db/01_DES-DB-S09-001_attendance_schema.md) 1.0, [DES-API-S09-001](../06_designs/api/01_DES-API-S09-001_attendance_api.md) §8 |
| depends_on / blocks / parent | FEAT-43 / TASK-449 / [FEAT-44](FEAT-44_attendance_timesheets.md) |
| Write scope | `plugins/attendance/src/main/java/**/service/**`, `plugins/attendance/src/main/java/**/resource/**` |

## 1. Mục tiêu

Hiện thực hóa quy trình bảng công kỳ 4 bước Base (`S1_LOGS` -> `S2_SCHEDULE` -> `S3_CALCULATE` -> `S4_ADJUST` -> `DONE`):
1. **CRUD Timesheet**: Tạo bảng công theo kỳ (tháng/năm), phạm vi (TENANT/BRANCH/DEPARTMENT) và chế độ tính lương (`wage_calc_mode`: `STANDARD_MINUS_UNPAID` hoặc `ACTUAL_TOTAL`).
2. **Chuyển bước (Step Transition)**:
   - Bước 1 `S1_LOGS`: Rà soát log thô, lọc log thiếu/sai.
   - Bước 2 `S2_SCHEDULE`: Rà soát xếp ca, gán ca và ngày nghỉ.
   - Bước 3 `S3_CALCULATE`: Chạy `AttendanceCalculationService` tính công toàn bộ nhân viên trong kỳ, tạo `snapshot` tổng hợp (tổng công chuẩn, công thực tế, nghỉ phép, OT, muộn/về sớm).
   - Bước 4 `S4_ADJUST`: Cho phép HR điều chỉnh số công từng nhân viên kèm lý do bắt buộc.
   - Hoàn tất `DONE`: Đóng bước điều chỉnh, chuyển sang giai đoạn gửi xác nhận và chốt.
3. **Cảnh báo ghi đè khi quay lại bước trước**: Nếu quay lại bước 1/2/3 sau khi đã có điều chỉnh thủ công tại bước 4, yêu cầu cờ `confirm_override_loss = true`, nếu không trả mã lỗi `409 ATTENDANCE_TIMESHEET_OVERRIDE_LOSS`.

## 2. Thao tác

- [x] Định nghĩa DTOs cho Timesheet lifecycle (`TimesheetDto`, `TimesheetStepRequest`, `TimesheetRecordUpdateRequest`)
- [x] Xây dựng `TimesheetService` xử lý chuyển bước và tính snapshot
- [x] Hiện thực API `GET /admin/timesheets`, `POST /admin/timesheets`, `POST /admin/timesheets/{id}/step`, `PUT /admin/timesheets/{id}/records/{recordId}`
- [x] Viết Unit & Integration Test kiểm chứng quy trình 4 bước và snapshot
