# BUG-102: Thiếu seed quyền `core:plugin:*` → toàn bộ tính năng Plugin Manager bị 403 ở môi trường thật

| Trường | Giá Trị |
| :--- | :--- |
| **Mã** | BUG-102 |
| **Mức độ** | **Critical** |
| **Phát hiện bởi** | QA/QC Agent — phát hiện khi chạy kiểm thử trình duyệt thật (dev DB) |
| **Ngày** | 2026-09-20 |
| **Trạng thái** | Resolved (Dev fix 2026-09-20) |
| **Liên quan** | TASK-301, TASK-309, TenantPluginResource, DES-03-API mục 4 |

## Mô tả

`TenantPluginResource`/`TenantPluginCredentialResource` yêu cầu các quyền `core:plugin:read|install|manage|register-custom|credential:manage` qua `@RequirePermission`, nhưng **không có migration/seeder nào tạo các quyền này** trong bảng `permissions` và cũng không gán cho role hệ thống (`TENANT_OWNER`/`TENANT_ADMIN`). Kiểm tra thực tế trên `openerp_dev`:

```
SELECT code FROM permissions WHERE code LIKE 'core:plugin%';  -> 0 rows
```

Trong khi đó test backend PASS vì `PluginLifecycleApiTest` **tự chèn** quyền qua native SQL (`insertPluginPermissions`). Hệ quả trên môi trường thật: mọi API tenant plugin trả `403 IAM_PERMISSION_DENIED_FUNCTIONAL`; route `/settings/plugins` bị `permissionGuard` chặn → **không role nào dùng được tính năng**; install cũng thất bại (thiếu `core:plugin:install`).

## Cách tái hiện

1. Khởi động backend trên DB mới (Flyway V3.0.x) → `permissions` không có `core:plugin*`.
2. Đăng nhập TENANT_OWNER → `GET /api/v1/tenant/plugins` → 403.

## Hướng sửa (đã thực hiện)

- Migration `V3.0.3__seed_core_plugin_permissions.sql`:
  - Insert idempotent 5 quyền `core:plugin:read|install|manage|credential:manage|register-custom` với `is_system = FALSE` (để không phá `SchemaFoundationTest` — bộ test này khóa số lượng quyền `is_system = true`) và `description_key` i18n.
  - Gán cho role hệ thống `TENANT_OWNER` (đủ 5) và `TENANT_ADMIN` (4 quyền, không có `register-custom`); `register-custom` vẫn bị chặn bởi cờ `tenants.allow_custom_plugins` ở server.
- Bổ sung key i18n `PERM_CORE_PLUGIN_*` vào từ điển Web vi/en.

## Tiêu chí kiểm tra sau sửa

- [ ] Sau khi backend khởi động với migration mới: `permissions` có 5 mã `core:plugin*` và TENANT_OWNER có mapping trong `role_permissions`.
- [ ] TENANT_OWNER gọi T1 marketplace → 200 (không còn 403).
- [ ] QA browser: `/settings/plugins` mở được bằng tài khoản TENANT_OWNER.
