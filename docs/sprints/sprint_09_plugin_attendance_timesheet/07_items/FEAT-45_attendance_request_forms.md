# [FEAT-45] Plugin attendance — Đơn từ trên form/workflow Sprint 08 (fallback nội bộ)

| Trường | Giá trị |
| :--- | :--- |
| ID / loại / sprint | FEAT-45 / Feature / Sprint 09 |
| Trạng thái / Severity | To Do / High |
| Owner/agent / reviewer | Developer / QA |
| Cập nhật / input version | 2026-11-02 / [ADR-S09-002](../05_solutions/03_ADR-S09-002_request_forms_on_form_workflow.md) APPROVED, [CONF-S09-001](../04_confirmation/01_CONF-S09-001_sprint_09_scope_and_ac.md) Q17/Q18 |
| depends_on / blocks | [FEAT-43](FEAT-43_attendance_core_shifts_ingestion_calc.md) / [FEAT-46](FEAT-46_attendance_leave_module.md) (LEAVE mapping), [FEAT-47](FEAT-47_attendance_ui_web_mobile.md) |
| Write scope | `plugins/attendance/**` (request/request-types/mapping) |

## 1. Scope

RequestTypes seed 6 (LEAVE/OVERTIME/ATTENDANCE_FIX/LATE_EARLY/BUSINESS_TRIP/SHIFT_SWAP) + tenant tạo loại mới; Requests pin form_version + affected_window (window_days, kỳ chốt); adapter mở workflow instance + consume `workflow.instance.completed` qua Event Hub; MappingExecutor idempotent theo request_id; fallback INTERNAL_FALLBACK 1 cấp manager/HR giữ schema; inbox + timeline + thông báo. AC truy vết: AC-R01…R04, AC-Đ01…Đ06.

## 2. Task con (reservation — tạo file trước khi phân công)

| TASK | Nội dung | Trạng thái |
| :--- | :--- | :--- |
| TASK-452 | RequestTypes seed + Requests CRUD + validation | Reserved |
| TASK-453 | Workflow adapter + event consume + MappingExecutor | Reserved |
| TASK-454 | Fallback INTERNAL_FALLBACK + migrate path | Reserved |
| TASK-455 | Inbox/timeline + notification | Reserved |

## 3. Lịch sử

| Phiên bản | Ngày | Thay đổi |
| :--- | :--- | :--- |
| 0.1 | 2026-11-02 | Khởi tạo + reservation TASK-452…455 |
