# [TASK-421] Xoá IFRAME enum/loader + regression

| Trường | Giá trị |
| :--- | :--- |
| ID / loại / sprint | TASK-421 / Task / Sprint 06 |
| Trạng thái / phiên bản / cập nhật | **Done (QA)** — IFRAME enum/loader/branch removed; tests + browser regression PASS / 0.2 / 2026-10-29 |
| Owner / reviewer | Developer / Architect + QA |
| Đầu vào | [CONF-S06-001](../04_confirmation/01_CONF-S06-001_sprint_06_scope_and_questions.md) 1.0, design tương ứng |
| Đọc trước / đọc tiếp | [00_READING_GUIDE](../00_READING_GUIDE.md) |


## 1. Mục tiêu

Sau khi catalog WC PASS, xoá hoàn toàn iframe khỏi code/template/test; đảm bảo không còn IFRAME.

## 2. Việc phải làm

- [x] Xoá `IFRAME` khỏi enum/parse; manifest IFRAME bị từ chối.
- [x] Xoá iframe loader/export/nhánh screen host/import.
- [x] Xoá test/QA/tài liệu iframe; cập nhật template/CLI.
- [x] Regression catalog + plugin lifecycle + mobile.
- [x] `grep -r IFRAME` trong code = 0 (trừ tài liệu lịch sử).

## 3. Tiêu chí nghiệm thu

- Không còn iframe loader/enum/nhánh code.
- Catalog/desktop/mobile/platform PASS sau xoá.
- Template/CLI không sinh iframe; build/test PASS.

## 4. Phụ thuộc & phạm vi

- Thuộc feature: [FEAT-34](FEAT-34_core_rendered_ui_and_iframe_removal.md) — Core render UI extension & bỏ iframe
- depends_on: TASK-420, TASK-417
- Write scope: `src/backend/.../PluginRenderMode.java`, `src/frontend/shared/plugin-host/iframe-loader/**`, `plugin-screen-host.component.*`, tests
- Mức độ: **Critical**

- Design đã duyệt; chưa bắt đầu theo lịch triển khai.


## Lịch sử

| Phiên bản | Ngày | Thay đổi | Nguồn |
| :--- | :--- | :--- | :--- |
| 0.1 | 2026-10-29 | Tạo item từ CONF-S06-001 1.0 + design draft; trạng thái Planned, chưa bắt đầu | Architect/BA; kế hoạch Sprint 06 |
