# [BUG-167] Cài employee thất bại vì thiếu UI slot `core.layout.user-menu.items`

| Trường | Giá trị |
| :--- | :--- |
| ID / loại / sprint | BUG-167 / Bug tích hợp / Sprint 07 |
| Mức độ / trạng thái | **High** / **Resolved (QA)** 2026-10-30 |
| Phát hiện bởi / ngày | QA/QC Agent / 2026-10-30 |
| Owner / reviewer | Developer / QA |
| Liên quan | [TASK-438](TASK-438_plugin_context_user_menu_switcher.md), `V7.0.3__plugin_user_menu_slot.sql` |

## 1. Mô tả

Đăng ký version `employee` trả **409 PLUGIN_UI_SLOT_NOT_FOUND: [core.layout.user-menu.items]**. Core chưa seed slot này, nên manifest có contribution user-menu không thể publish/cài.

## 2. Cách sửa

- Thêm migration `V7.0.3__plugin_user_menu_slot.sql` seed slot CORE, platforms desktop+mobile, max 8 contributions.
- Áp dụng slot trên dev DB và cài lại.

## 3. Kiểm chứng

- Version `employee` 1.0.3/1.0.4 publish + install/upgrade **ACTIVE**.
- User menu render contribution `Hồ sơ của tôi`; browser app thật 0 console error.

## 4. Lịch sử

| Phiên bản | Ngày | Thay đổi | Nguồn |
| :--- | :--- | :--- | :--- |
| 0.1 | 2026-10-30 | QA cài plugin thật phát hiện missing slot | TR-S07-001 1.2 |
| 0.2 | 2026-10-30 | Seed slot V7.0.3; retest install PASS | Developer/QA |
