# [TASK-454] Cơ chế Fallback INTERNAL_FALLBACK (Duyệt nội bộ 1 cấp)

| Trường | Giá trị |
| :--- | :--- |
| ID / loại / sprint | TASK-454 / Task / Sprint 09 |
| Severity / trạng thái | High / In Progress |
| Owner/agent / reviewer | Developer / QA |
| Cập nhật / input version | 2026-11-11 / [ADR-S09-002](../05_solutions/03_ADR-S09-002_request_forms_on_form_workflow.md) §2.3 |
| depends_on / blocks / parent | TASK-453 / TASK-455 / [FEAT-45](FEAT-45_attendance_request_forms.md) |
| Write scope | `plugins/attendance/**` |

## 1. Mục tiêu

1. Hỗ trợ luồng duyệt `INTERNAL_FALLBACK` khi workflow engine chưa sẵn sàng:
   - Tự động gán người duyệt là Quản lý trực tiếp (`manager_employee_id`) hoặc HR Admin.
   - Thao tác `POST /requests/{id}/fallback-action` nhận `{action: APPROVE | REJECT, comment}`.
   - Khi `APPROVE`: kích hoạt `MappingExecutor` áp dụng kết quả vào hệ thống chấm công.
   - Chặn người không có thẩm quyền hoặc khi đơn không ở chế độ fallback (400 `ATTENDANCE_REQUEST_NOT_ACTIONABLE`).

