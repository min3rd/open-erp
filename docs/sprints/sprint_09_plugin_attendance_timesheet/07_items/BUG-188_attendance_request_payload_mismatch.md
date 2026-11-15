# [BUG-188] Form gửi đơn gửi `data` nhưng API đọc `response`/`affected_window`

| Trường | Giá trị |
| :--- | :--- |
| ID / loại / sprint | BUG-188 / Bug / Sprint 09 (phát hiện khi test UI thật) |
| Severity / trạng thái | **High / Fixed source** |
| Owner/agent / reviewer | Developer / QA |
| Cập nhật / input version | 2026-11-15 / Tenant `review50c` |
| depends_on / blocks / parent | BUG-187 / test luồng đơn từ / [TR-S09-003](../08_testing/04_TR-S09-003_db_role_ui_retest_report.md) |
| Write scope | `attendance.service.ts`, `plugin.json` |

## 1. Hiện tượng

Đơn được tạo thành công nhưng `response` và `affected_window` đều `{}`; không có ngày/lý do/giờ OT. Mapping sau duyệt không có dữ liệu để xử lý.

## 2. Nguyên nhân

UI gửi:

```json
{ "request_type_code": "OVERTIME", "data": { "from_date": "...", "reason": "..." } }
```

nhưng `RequestSubmitRequest` của backend chỉ có `request_type_code`, `response`, `affected_window`.

Đồng thời cột `approval_mode varchar(16)` không chứa được `INTERNAL_FALLBACK` (17 ký tự), làm insert trả 500.

## 3. Sửa đổi

- Service map `data` → `response` + `affected_window`.
- Thêm migration `V1.2.0__widen_attendance_approval_mode.sql` mở rộng cột lên `varchar(32)`.
- Thêm `"type": "jsonb"` cho `response`/`affected_window` trong descriptor insert.
- Service duyệt đơn map `APPROVE`/`REJECT` → `APPROVED`/`REJECTED` (backend enum `RequestStatus`).

## 4. Kiểm chứng

- POST `/api/v1/attendance/requests` trả 200 `ATTENDANCE_REQUEST_CREATED`; response có `approval_mode=INTERNAL_FALLBACK`.
- Cần test lại sau rebuild để xác nhận `response` chứa from_date/to_date/reason.
