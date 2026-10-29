# [TASK-416] Shared PluginSlotComponent + outlet + loaders

| Trường | Giá trị |
| :--- | :--- |
| ID / loại / sprint | TASK-416 / Task / Sprint 06 |
| Trạng thái / phiên bản / cập nhật | **Done (QA)** — slot/outlet/loaders/context/error+timeout; notification là fixture; iframe removal ở TASK-421 / 0.3 / 2026-10-29 |
| Owner / reviewer | Developer / Architect + QA |
| Đầu vào | [CONF-S06-001](../04_confirmation/01_CONF-S06-001_sprint_06_scope_and_questions.md) 1.0, design tương ứng |
| Đọc trước / đọc tiếp | [00_READING_GUIDE](../00_READING_GUIDE.md) |


## 1. Mục tiêu

Render slot/contribution trong shared: lọc contract/permission/platform, loader WC/MF, context bridge, error boundary.

## 2. Việc phải làm

- [x] `PluginSlotComponent` + `PluginContributionOutletComponent`.
- [x] Nâng cấp WC loader: tagName/context/events; MF loader: mount(target, context)/unmount.
- [x] Context: theme/language/tenant/user/permissions/apiBaseUrl/navigate/notify/resize.
- [x] Session token cache theo từng plugin_key (Map), tránh ghi đè khi nhiều contribution tải đồng thời.
- [x] `loadManifest` dedupe request in-flight; cache theo phiên + invalidate lifecycle.
- [x] Error boundary + timeout + fallback; telemetry code.
- [x] Test fixture slot = plugin `in-app-notification`; iframe loader removal chuyển TASK-421.

## 3. Tiêu chí nghiệm thu

- Slot render đúng contribution theo order; rỗng hiển thị fallback.
- Contract mismatch/entry lỗi bị skip, layout không hỏng.
- Test fixture WC/MF PASS; 0 console error.

## 4. Phụ thuộc & phạm vi

- Thuộc feature: [FEAT-34](FEAT-34_core_rendered_ui_and_iframe_removal.md) — Core render UI extension & bỏ iframe
- depends_on: TASK-414
- Write scope: `src/frontend/shared/plugin-host/**`, `src/frontend/shared/components/tab-strip/**`, `src/frontend/shared/index.ts`
- Mức độ: **High**

- Design đã duyệt; chưa bắt đầu theo lịch triển khai.


## Lịch sử

| Phiên bản | Ngày | Thay đổi | Nguồn |
| :--- | :--- | :--- | :--- |
| 0.1 | 2026-10-29 | Tạo item từ CONF-S06-001 1.0 + design draft; trạng thái Planned, chưa bắt đầu | Architect/BA; kế hoạch Sprint 06 |
