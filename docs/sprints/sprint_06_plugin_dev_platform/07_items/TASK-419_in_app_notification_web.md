# [TASK-419] In-app notification web

| Trường | Giá trị |
| :--- | :--- |
| ID / loại / sprint | TASK-419 / Task / Sprint 06 |
| Trạng thái / phiên bản / cập nhật | **Done (QA)** — desktop + mobile bell drawer/tab/list PASS; thay bell Core (Q19/Q20); BUG-154 fixed / 1.1 / 2026-10-29 |
| Owner / reviewer | Developer / Architect + QA |
| Đầu vào | [CONF-S06-001](../04_confirmation/01_CONF-S06-001_sprint_06_scope_and_questions.md) 1.0, design tương ứng |
| Đọc trước / đọc tiếp | [00_READING_GUIDE](../00_READING_GUIDE.md) |


## 1. Mục tiêu

Header bell contribution + settings tab + screen CRUD; thay bell Core (Q19), bell mở drawer (Q20); i18n/mobile.

## 2. Việc phải làm

- [x] Header WC: icon chuông + badge unread; click mở drawer, “Xem tất cả” mới navigate tới screen notification.
- [x] Settings tab WC: platform defaults + tenant inherit/override, channel/level; lưu/đọc qua API.
- [x] Screen list + detail drawer + mark read/all + badge refresh.
- [x] Manifest screen + 2 contributions; i18n; header chạy trên Web mobile viewport.
- [x] Header contribution trên Ionic mobile: plugin slot + notification screen + drawer full-height; BUG-154 Resolved.
- [x] Browser desktop + mobile: bell duy nhất, drawer/list render, 0 console error.

## 3. Tiêu chí nghiệm thu

- Bell plugin là chuông duy nhất; badge đúng; click mở drawer, “Xem tất cả” mới điều hướng.
- Tab cấu hình kế thừa/ghi đè platform defaults; reload giữ giá trị.
- Screen list/drawer chạy; mobile overflow 0; 0 console error.

## 4. Phụ thuộc & phạm vi

- Thuộc feature: [FEAT-35](FEAT-35_in_app_notification_plugin.md) — Plugin in-app notification
- depends_on: TASK-418, TASK-416, TASK-412
- Write scope: `plugins/in-app-notification/web/**`, `plugins/in-app-notification/plugin.json`
- Mức độ: **High**

- Design đã duyệt; chưa bắt đầu theo lịch triển khai.


## Lịch sử

| Phiên bản | Ngày | Thay đổi | Nguồn |
| :--- | :--- | :--- | :--- |
| 0.1 | 2026-10-29 | Tạo item từ CONF-S06-001 1.0 + design draft; trạng thái Planned, chưa bắt đầu | Architect/BA; kế hoạch Sprint 06 |
| 0.4 | 2026-10-29 | QA desktop PASS; Ionic mobile không render plugin bell → BUG-154 | QA; TR-S06-001 1.1 |
| 1.0 | 2026-10-29 | Fix mobile header + notification screen; BUG-154 Resolved; Done (QA) | QA/Developer; TR-S06-001 1.2 |
| 1.1 | 2026-10-29 | Q19/Q20: thay bell Core; bell mở drawer, “Xem tất cả” mới sang trang; 19/19 drawer check PASS | QA/Developer; TR-S06-001 1.5 |
