# [TASK-453] Workflow Adapter + Event Hub Consume + MappingExecutor

| Trường | Giá trị |
| :--- | :--- |
| ID / loại / sprint | TASK-453 / Task / Sprint 09 |
| Severity / trạng thái | High / In Progress |
| Owner/agent / reviewer | Developer / QA |
| Cập nhật / input version | 2026-11-11 / [ADR-S09-002](../05_solutions/03_ADR-S09-002_request_forms_on_form_workflow.md) 1.0, [DES-API-S09-001](../06_designs/api/01_DES-API-S09-001_attendance_api.md) §10 |
| depends_on / blocks / parent | TASK-452 / TASK-454 / [FEAT-45](FEAT-45_attendance_request_forms.md) |
| Write scope | `plugins/attendance/**` |

## 1. Mục tiêu

1. Lắng nghe sự kiện Event Hub `POST /api/v1/internal/events` với event `workflow.instance.completed`.
2. `MappingExecutor` xử lý bất biến (idempotent) theo `request_id`:
   - `LEAVE`: Trừ số dư phép trong LeaveLedger và cập nhật công ngày `ON_LEAVE` / `HALF_DAY`.
   - `OVERTIME`: Ghi nhận `plg_attendance_ot_windows`.
   - `ATTENDANCE_FIX`: Ghi nhận log chấm công bổ sung và tính lại công ngày.
   - `LATE_EARLY`: Miễn giảm lỗi muộn/sớm trên bản ghi chấm công.
   - `BUSINESS_TRIP`: Cập nhật trạng thái `BUSINESS_TRIP` trên công ngày.
   - `SHIFT_SWAP`: Tạo phân ca làm việc mới trong `plg_attendance_shift_assignments`.
   - Loại tự tạo (`X_*`): Đánh dấu mapping `APPLIED` không ghi đè dữ liệu chấm công.

