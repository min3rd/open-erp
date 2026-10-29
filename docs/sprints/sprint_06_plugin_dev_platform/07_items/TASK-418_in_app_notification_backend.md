# [TASK-418] In-app notification backend

| Trường | Giá trị |
| :--- | :--- |
| ID / loại / sprint | TASK-418 / Task / Sprint 06 |
| Trạng thái / phiên bản / cập nhật | **Done (QA)** — plugin 1.0.7; bell drawer + platform defaults + tenant settings; ACTIVE all scopes / 1.1 / 2026-10-29 |
| Owner / reviewer | Developer / Architect + QA |
| Đầu vào | [CONF-S06-001](../04_confirmation/01_CONF-S06-001_sprint_06_scope_and_questions.md) 1.0, design tương ứng |
| Đọc trước / đọc tiếp | [00_READING_GUIDE](../00_READING_GUIDE.md) |


## 1. Mục tiêu

Tạo plugin notification zero-DB: entity Notification/Preference, migration, query descriptor, API, permission, test.

## 2. Việc phải làm

- [x] Scaffold plugin theo template 2.0; manifest id `in-app-notification`.
- [x] Migration bảng notification + preferences; index unread; `tenant_id` do gateway quản lý.
- [x] Query descriptor list/create/mark read/preferences; service/resource DTO snake_case.
- [x] Permission read/manage/settings; health test PASS; gateway create/list/read/preferences PASS.
- [x] Đăng ký Entity Registry + UI contributions (header/settings); install/upgrade ACTIVE.

## 3. Tiêu chí nghiệm thu

- Tạo/list/đánh dấu đọc notification qua gateway PASS.
- Preferences get/upsert PASS; tenant A không thấy tenant B.
- Manifest validate PASS; test backend PASS.

## 4. Phụ thuộc & phạm vi

- Thuộc feature: [FEAT-35](FEAT-35_in_app_notification_plugin.md) — Plugin in-app notification
- depends_on: TASK-408, TASK-414
- Write scope: `plugins/in-app-notification/**` (backend, migrations, manifest, queries, tests)
- Mức độ: **High**

- Design đã duyệt; chưa bắt đầu theo lịch triển khai.


## Lịch sử

| Phiên bản | Ngày | Thay đổi | Nguồn |
| :--- | :--- | :--- | :--- |
| 0.1 | 2026-10-29 | Tạo item từ CONF-S06-001 1.0 + design draft; trạng thái Planned, chưa bắt đầu | Architect/BA; kế hoạch Sprint 06 |
