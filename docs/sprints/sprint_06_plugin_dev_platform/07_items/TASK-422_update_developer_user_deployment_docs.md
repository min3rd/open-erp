# [TASK-422] Cập nhật developer/user/deployment docs

| Trường | Giá trị |
| :--- | :--- |
| ID / loại / sprint | TASK-422 / Task / Sprint 06 |
| Trạng thái / phiên bản / cập nhật | **Done (docs)** — UG-S06-001 1.4 + 13 ảnh; developer/deployment/CLI docs đồng bộ / 1.1 / 2026-10-29 |
| Owner / reviewer | Developer / Architect + QA |
| Đầu vào | [CONF-S06-001](../04_confirmation/01_CONF-S06-001_sprint_06_scope_and_questions.md) 1.0, design tương ứng |
| Đọc trước / đọc tiếp | [00_READING_GUIDE](../00_READING_GUIDE.md) |


## 1. Mục tiêu

Đồng bộ tài liệu với template 2.0, CLI interact, slot render, bỏ iframe; user guide có ảnh.

## 2. Việc phải làm

- [x] `create_new_plugin_guide`: bỏ CORE_IN_PROCESS; thêm wizard/entity/relation/CRUD.
- [x] `plugin_web_packaging_guide`: WC/MF contract, slot/contribution, context.
- [x] `shared_ui_contribution_guide`: PluginSlotComponent/TabStrip nếu dùng chung.
- [x] Deployment guide: build WC, bỏ iframe, env nếu đổi.
- [x] User guide Sprint 06 + ảnh header/tab/notification/catalog WC desktop + mobile (`docs/06_user_guides/assets/sprint_06/`, 13 ảnh, gồm bell drawer).

## 3. Tiêu chí nghiệm thu

- Guide không còn hướng dẫn iframe/CORE_IN_PROCESS.
- Lệnh CLI/template khớp code; link check PASS.
- User guide có ảnh minh chứng; review OK.

## 4. Phụ thuộc & phạm vi

- Thuộc feature: [FEAT-34](FEAT-34_core_rendered_ui_and_iframe_removal.md) — Core render UI extension & bỏ iframe
- depends_on: TASK-408…421
- Write scope: `docs/08_developer_guides/**`, `docs/07_deployment_guides/**`, `docs/06_user_guides/**`
- Mức độ: **Medium**

- Design đã duyệt; chưa bắt đầu theo lịch triển khai.


## Lịch sử

| Phiên bản | Ngày | Thay đổi | Nguồn |
| :--- | :--- | :--- | :--- |
| 0.1 | 2026-10-29 | Tạo item từ CONF-S06-001 1.0 + design draft; trạng thái Planned, chưa bắt đầu | Architect/BA; kế hoạch Sprint 06 |
| 0.3 | 2026-10-29 | Done (docs): UG-S06-001 1.1 + 7 ảnh desktop; cập nhật troubleshooting mobile BUG-154/155 | QA; TR-S06-001 1.1 |
| 1.0 | 2026-10-29 | UG-S06-001 1.2 + 9 ảnh desktop/mobile; bỏ ghi chú lỗi mobile | QA; TR-S06-001 1.2 |
| 1.1 | 2026-10-29 | UG-S06-001 1.4 + 13 ảnh; Q19/Q20 platform defaults + bell drawer; rà developer/deployment/CLI docs, bỏ iframe/CORE_IN_PROCESS | PM/Developer; TR-S06-001 1.5 |
