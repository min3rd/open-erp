# [TASK-415] Slot registry seed + plugin-hosted slot sync

| Trường | Giá trị |
| :--- | :--- |
| ID / loại / sprint | TASK-415 / Task / Sprint 06 |
| Trạng thái / phiên bản / cập nhật | **Done (QA)** — migration `V6.0.0` + test PASS / 0.2 / 2026-10-29 |
| Owner / reviewer | Developer / Architect + QA |
| Đầu vào | [CONF-S06-001](../04_confirmation/01_CONF-S06-001_sprint_06_scope_and_questions.md) 1.0, design tương ứng |
| Đọc trước / đọc tiếp | [00_READING_GUIDE](../00_READING_GUIDE.md) |


## 1. Mục tiêu

Seed 2 slot mới; cập nhật allowed render modes; sync slot plugin-hosted theo namespace/contract.

## 2. Việc phải làm

- [x] Migration seed `core.layout.header.actions`, `core.settings.system.tabs`; bỏ IFRAME khỏi allowed modes.
- [x] Validate plugin slot namespace `<pluginKey>.*`; unique/contract.
- [x] Sync `plugin_ui_slots` khi publish; DEPRECATED slot không nhận contribution.
- [x] Test PostgreSQL thật: seed idempotent, namespace, contract (targeted PASS).

## 3. Tiêu chí nghiệm thu

- 4 slot Core có trong registry với allowed modes WC/MF.
- Plugin slot sai namespace bị từ chối; slot cũ DEPRECATED.
- Test DB PASS.

## 4. Phụ thuộc & phạm vi

- Thuộc feature: [FEAT-34](FEAT-34_core_rendered_ui_and_iframe_removal.md) — Core render UI extension & bỏ iframe
- depends_on: TASK-414
- Write scope: `src/backend/src/main/resources/db/migration/V6.0.0__plugin_ui_slots_v1.sql`, `PluginUiSlotSyncService.java`, test DB
- Mức độ: **High**

- Design đã duyệt; chưa bắt đầu theo lịch triển khai.


## Lịch sử

| Phiên bản | Ngày | Thay đổi | Nguồn |
| :--- | :--- | :--- | :--- |
| 0.1 | 2026-10-29 | Tạo item từ CONF-S06-001 1.0 + design draft; trạng thái Planned, chưa bắt đầu | Architect/BA; kế hoạch Sprint 06 |
