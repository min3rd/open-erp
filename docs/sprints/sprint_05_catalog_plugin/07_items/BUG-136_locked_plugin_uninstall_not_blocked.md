# [BUG-136] Plugin locked vẫn gỡ được qua API (AC-14)

| Trường | Giá trị |
| :--- | :--- |
| ID / loại / sprint | BUG-136 / Bug chức năng / Sprint 05 |
| Mức độ / trạng thái | **High** / Resolved (dev+QA automated) 2026-10-28 |
| Phát hiện bởi / ngày | Agent rà soát (re-check Sprint 05) / 2026-10-27 |
| Owner / reviewer | Developer / QA |
| Liên quan | [BUG-135](BUG-135_catalog_not_independent_plugin.md), [TASK-376](TASK-376_plugin_registration_entity_registry.md), AC-13/AC-14, `PluginLifecycleService` |

## 1. Mô tả

Plugin `catalog` được seed `locked = TRUE`, `default_install = TRUE` với cam kết “luôn bật, không gỡ được” (AC-13/AC-14). Tuy nhiên `PluginLifecycleService.uninstall` **không kiểm tra `locked`**; chỉ `disable` mới chặn. Tenant admin có quyền `core:plugin:manage` vẫn gọi được:

`POST /api/v1/tenant/plugins/catalog/uninstall` → ledger chuyển `UNINSTALLED`.

Hệ quả: plugin “locked” bị gỡ khỏi tenant; marketplace/UI có thể mất trạng thái nhưng API catalog core vẫn hoạt động (xem BUG-135), tạo trạng thái không nhất quán.

## 2. Cách tái hiện

1. Đăng nhập tenant owner/admin có `core:plugin:manage`.
2. Gọi `POST /api/v1/tenant/plugins/catalog/uninstall`.
3. Quan sát response `PLUGIN_UNINSTALL_SUCCESS` + `tenant_plugins.status = UNINSTALLED` (thay vì `PLUGIN_LOCKED_DEFAULT` 403).

## 3. Nguyên nhân

`PluginLifecycleService.uninstall` (dòng 227–271) lấy `TenantPlugin` ledger nhưng không đọc `PluginCatalog` để kiểm tra `locked`/`defaultInstall`. `simpleTransition(disable)` có kiểm tra `catalog.locked` (dòng 333), `uninstall` thì không.

## 4. Hướng sửa

- Trong `uninstall`, sau `requireLedger`: lấy `PluginCatalog` và chặn nếu `locked` (hoặc `defaultInstall && locked`) bằng `ApiException(403, PLUGIN_LOCKED_DEFAULT, ...)`.
- Giữ nguyên hành vi soft-uninstall cho plugin không locked (dữ liệu vẫn còn).
- Bổ sung test `PluginLifecycleApiTest`: cài plugin locked → gọi uninstall → 403 `PLUGIN_LOCKED_DEFAULT`; ledger vẫn ACTIVE; plugin không locked → uninstall thành công.
- Kiểm tra cả đường platform governance nếu có endpoint uninstall hỗ trợ tenant (P19–P23) — dùng chung service nên fix một chỗ.

## 5. Tiêu chí kiểm tra sau sửa

- [ ] `POST .../catalog/uninstall` trả 403 `PLUGIN_LOCKED_DEFAULT` với tenant owner/admin.
- [ ] Ledger catalog vẫn `ACTIVE` sau khi gọi.
- [ ] Plugin không locked vẫn uninstall được (không hồi quy).
- [ ] Test backend PASS trên PostgreSQL thật.

## 6. Lịch sử

| Phiên bản | Ngày | Thay đổi | Nguồn |
| :--- | :--- | :--- | :--- |
| 0.1 | 2026-10-27 | Tạo bug sau re-check Sprint 05 | Agent rà soát; đối chiếu `PluginLifecycleService` + AC-14 |
| 0.2 | 2026-10-27 | **Fixed (dev)**: `uninstall` đọc `PluginCatalog.locked`, trả 403 `PLUGIN_LOCKED_DEFAULT`; test `testLockedPluginCannotBeUninstalled` PASS | Developer Agent; `PluginLifecycleApiTest` 10/10 |
| 0.3 | 2026-10-28 | QA chạy lại toàn bộ backend: `PluginLifecycleApiTest` 403 locked + plugin không locked vẫn uninstall; full suite 266 PASS | QA/Developer; surefire |
