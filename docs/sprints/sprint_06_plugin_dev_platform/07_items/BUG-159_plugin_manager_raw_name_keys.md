# [BUG-159] Plugin Manager hiển thị raw key tên/mô tả plugin (`PLUGIN_IN_APP_NOTIFICATION_NAME`, …)

| Trường | Giá trị |
| :--- | :--- |
| ID / loại / sprint | BUG-159 / Bug i18n / Sprint 06 |
| Mức độ / trạng thái | **Medium** / **Resolved (QA)** 2026-10-29 |
| Phát hiện bởi / ngày | QA/QC Agent / 2026-10-29 |
| Owner / reviewer | Developer / QA |
| Liên quan | [AC-12/AC-17](../04_confirmation/01_CONF-S06-001_sprint_06_scope_and_questions.md), [TASK-418](TASK-418_in_app_notification_backend.md), [TASK-419](TASK-419_in_app_notification_web.md), `src/frontend/web/public/i18n` |

## 1. Mô tả

Trang **Quản lý plugin** (`/settings/plugins`) hiển thị raw i18n key thay vì tên/mô tả:

- `PLUGIN_IN_APP_NOTIFICATION_NAME` / `PLUGIN_IN_APP_NOTIFICATION_DESCRIPTION` (in-app-notification).
- `PLUGIN_E2E_SAMPLE_NAME` / `PLUGIN_E2E_SAMPLE_DESCRIPTION` (e2e-sample).

`plugin_catalog` lưu `name_key`/`description_key`; web/mobile dictionary của Core không có các key này. Catalog hiển thị đúng vì `PLUGIN_CATALOG_NAME` có trong dictionary.

## 2. Các bước tái hiện

1. Đăng nhập tenant admin, mở `/settings/plugins`.
2. Quan sát card `in-app-notification` và `e2e-sample`.

**Mong muốn:** “Thông báo trong ứng dụng”, mô tả tiếng Việt/Anh.
**Thực tế:** raw key.

## 3. Bằng chứng

- [Ảnh Plugin Manager](../08_testing/evidence/sprint_06/05_desktop_plugin_manager.png)
- [Ảnh sau khi tắt plugin](../08_testing/evidence/sprint_06/14_plugin_manager_notification_disabled.png)
- `SELECT plugin_key, name_key, description_key FROM plugin_catalog` → các key nêu trên.

## 4. Hướng sửa đề xuất

- Thêm `PLUGIN_IN_APP_NOTIFICATION_NAME/DESCRIPTION` (và key e2e-sample nếu còn dùng) vào dictionary web + mobile, hoặc cho Plugin Manager fallback sang `name`/`description` literal từ manifest/version.
- Mở rộng i18n check cho `name_key` của `plugin_catalog`.

## 5. Cách sửa & kiểm chứng

- Bổ sung `PLUGIN_IN_APP_NOTIFICATION_NAME/DESCRIPTION` và `PLUGIN_E2E_SAMPLE_NAME/DESCRIPTION` cho web + mobile 13 locale; parity 100%.
- **Kiểm chứng:** Plugin Manager hiển thị “Thông báo trong ứng dụng” và mô tả, không còn raw key; ảnh `evidence/sprint_06_retest/04_desktop_plugin_manager_fixed.png`.

## 6. Lịch sử

| Phiên bản | Ngày | Thay đổi | Nguồn |
| :--- | :--- | :--- | :--- |
| 0.1 | 2026-10-29 | Tạo bug từ QA browser desktop | TR-S06-001 1.1 |
| 0.2 | 2026-10-29 | Bổ sung i18n plugin catalog; QA re-test PASS | Developer/QA |
