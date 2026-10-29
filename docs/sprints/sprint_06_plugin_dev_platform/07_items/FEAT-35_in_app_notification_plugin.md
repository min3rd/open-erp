# [FEAT-35] Plugin in-app notification

| Trường | Giá trị |
| :--- | :--- |
| ID / loại / sprint | FEAT-35 / Feature / Sprint 06 |
| Trạng thái / phiên bản / cập nhật | **Done (QA)** — plugin 1.0.7, bell drawer, bỏ notification Core, platform defaults + tenant override / 1.2 / 2026-10-29 |
| Owner / reviewer | PM + Architect / Chủ dự án |
| Đầu vào | [CONF-S06-001](../04_confirmation/01_CONF-S06-001_sprint_06_scope_and_questions.md) 1.0, [00_READING_GUIDE](../00_READING_GUIDE.md) |
| Đọc trước / đọc tiếp | Các task con bên dưới |


## 1. Mục tiêu

Plugin mẫu thật `in-app-notification`: header bell + tab cấu hình + screen CRUD; đứng cạnh bell Core.

## 2. Task con

- [TASK-418](TASK-418_in_app_notification_backend.md) — In-app notification backend
- [TASK-419](TASK-419_in_app_notification_web.md) — In-app notification web

## 3. Tiêu chí nghiệm thu

- Backend notification/preferences zero-DB, tenant isolation, gateway PASS.
- Header contribution + settings tab + CRUD screen hoạt động.
- Đứng cạnh bell Core, không thay thế; mobile read-only.
- Dùng template/CLI 2.0 chứng minh end-to-end.

## 4. Phụ thuộc & ghi chú

- Phụ thuộc: FEAT-33/34; TASK-418/419
- Task 418–419; phụ thuộc slot runtime và template.
- Design đã duyệt; task là kế hoạch triển khai, trạng thái Done phải có bằng chứng.


## Lịch sử

| Phiên bản | Ngày | Thay đổi | Nguồn |
| :--- | :--- | :--- | :--- |
| 0.1 | 2026-10-29 | Tạo item từ CONF-S06-001 1.0 + design draft; trạng thái Planned, chưa bắt đầu | Architect/BA; kế hoạch Sprint 06 |
| 0.5 | 2026-10-29 | QA desktop PASS; mobile không render plugin header contribution → BUG-154 (High); QA sign-off blocked | QA; TR-S06-001 1.1 |
| 1.0 | 2026-10-29 | Fix mobile header + notification screen; BUG-154 Resolved; Done (QA) | QA/Developer; TR-S06-001 1.2 |
