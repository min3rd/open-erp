# [TASK-417] Header slot + /settings/system tabs

| Trường | Giá trị |
| :--- | :--- |
| ID / loại / sprint | TASK-417 / Task / Sprint 06 |
| Trạng thái / phiên bản / cập nhật | **Done (QA)** — topbar/settings/dashboard slot + i18n + browser smoke; QA 390/1440 thuộc TASK-423 / 0.3 / 2026-10-29 |
| Owner / reviewer | Developer / Architect + QA |
| Đầu vào | [CONF-S06-001](../04_confirmation/01_CONF-S06-001_sprint_06_scope_and_questions.md) 1.0, design tương ứng |
| Đọc trước / đọc tiếp | [00_READING_GUIDE](../00_READING_GUIDE.md) |


## 1. Mục tiêu

Gắn slot vào topbar, dashboard và settings sections; tạo trang `/settings/system` với TabStrip Core + plugin; URL giữ tab.

## 2. Việc phải làm

- [x] Topbar: một instance slot trước user menu, responsive desktop/mobile (không mount trùng).
- [x] Trang `/settings/system`: tab Core + tab từ slot; query `?tab=`; fallback khi tab mất.
- [x] Thêm menu item `SETTINGS_SYSTEM_TITLE` vào nhóm System của settings layout.
- [x] TabStrip shared: keyboard/aria; tab plugin desktop-only.
- [x] Gắn `core.dashboard.widgets` vào dashboard và `core.settings.sections` vào tab general; rỗng thì ẩn.
- [x] Loading/empty/error/forbidden; i18n 13 locale hoặc vi/en tối thiểu.
- [x] Test browser: header bell + tab + dashboard/settings sections, 0 console error; QA 390/1440 ở TASK-423.

## 3. Tiêu chí nghiệm thu

- Header contribution hiện/ẩn theo plugin ACTIVE + quyền.
- Tab plugin render trong `/settings/system`; reload/bookmark giữ tab.
- Mobile overflow 0; 0 console error; tắt plugin tab biến mất.

## 4. Phụ thuộc & phạm vi

- Thuộc feature: [FEAT-34](FEAT-34_core_rendered_ui_and_iframe_removal.md) — Core render UI extension & bỏ iframe
- depends_on: TASK-416, TASK-415
- Write scope: `src/frontend/shared/components/topbar/**`, `src/frontend/web/src/app/features/settings/**`, `src/frontend/web/src/app/app.routes.ts`, i18n
- Mức độ: **High**

- Design đã duyệt; chưa bắt đầu theo lịch triển khai.


## Lịch sử

| Phiên bản | Ngày | Thay đổi | Nguồn |
| :--- | :--- | :--- | :--- |
| 0.1 | 2026-10-29 | Tạo item từ CONF-S06-001 1.0 + design draft; trạng thái Planned, chưa bắt đầu | Architect/BA; kế hoạch Sprint 06 |
