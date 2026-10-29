# [TASK-420] Catalog Web Component migration

| Trường | Giá trị |
| :--- | :--- |
| ID / loại / sprint | TASK-420 / Task / Sprint 06 |
| Trạng thái / phiên bản / cập nhật | **Done (QA)** — desktop + mobile catalog PASS; BUG-155/156/157/158 fixed / 1.0 / 2026-10-29 |
| Owner / reviewer | Developer / Architect + QA |
| Đầu vào | [CONF-S06-001](../04_confirmation/01_CONF-S06-001_sprint_06_scope_and_questions.md) 1.0, design tương ứng |
| Đọc trước / đọc tiếp | [00_READING_GUIDE](../00_READING_GUIDE.md) |


## 1. Mục tiêu

Chuyển catalog từ iframe sang WC `op-catalog-app`; giữ route-state, mobile read-only, platform system.

## 2. Việc phải làm

- [x] Thêm `@angular/elements`; đổi `plugin-main.ts` sang createCustomElement; build `main.js` không hash.
- [x] Shell inputs `route/scope/readonly/theme/language`; events `op:route-change/resize/notify`; bỏ postMessage.
- [x] Core WC loader truyền context; screen host route-state hai chiều; bỏ iframe branch.
- [x] Gateway set cookie `plugin_token` path-scoped khi serve entry để chunk/static request không 401.
- [x] Manifest 3 screen WC: desktop, mobile readonly, platform system.
- [x] QA regression catalog desktop: WC, route-state/reload, 0 console error, 0 iframe.
- [x] QA regression catalog mobile: bảng bản ghi + type list hiển thị, i18n đúng, touch target ≥40px; metadata template 2.0.0 (BUG-155/156/157/158 Resolved).

## 3. Tiêu chí nghiệm thu

- Catalog chạy WC trên 3 screen; route reload/bookmark đúng.
- Mobile 390×844 read-only overflow 0; platform system scope PASS.
- API gateway 200; không đổi contract; 0 console error.

## 4. Phụ thuộc & phạm vi

- Thuộc feature: [FEAT-34](FEAT-34_core_rendered_ui_and_iframe_removal.md) — Core render UI extension & bỏ iframe
- depends_on: TASK-416, design ADR-S06-002
- Write scope: `plugins/catalog/web/**`, `plugins/catalog/plugin.json`, `src/frontend/web/angular.json`, `src/frontend/web/package.json`
- Mức độ: **Critical**

- Design đã duyệt; chưa bắt đầu theo lịch triển khai.


## Lịch sử

| Phiên bản | Ngày | Thay đổi | Nguồn |
| :--- | :--- | :--- | :--- |
| 0.1 | 2026-10-29 | Tạo item từ CONF-S06-001 1.0 + design draft; trạng thái Planned, chưa bắt đầu | Architect/BA; kế hoạch Sprint 06 |
| 0.3 | 2026-10-29 | QA desktop PASS; mobile FAIL BUG-155/156/157; catalog metadata BUG-158 | QA; TR-S06-001 1.1 |
| 1.0 | 2026-10-29 | Fix mobile layout/i18n/touch + metadata; Done (QA) | QA/Developer; TR-S06-001 1.2 |
