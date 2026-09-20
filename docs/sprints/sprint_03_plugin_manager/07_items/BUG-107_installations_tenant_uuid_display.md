# BUG-107: P9 hiển thị tenant bằng UUID (thiếu mapping snake_case `tenant_slug`/`tenant_name`)

| Trường | Giá Trị |
| :--- | :--- |
| **Mã** | BUG-107 |
| **Mức độ** | **High** |
| **Phát hiện bởi** | QA/QC Agent + Khách hàng — kiểm thử trình duyệt `/platform/plugins` tầng 3 |
| **Ngày** | 2026-09-20 |
| **Trạng thái** | Resolved (Dev fix 2026-09-20) |
| **Liên quan** | TASK-315, DES-03-API P9, `PluginResponses.InstallationItem` |

## Mô tả

`InstallationItem.tenantSlug`/`tenantName` **thiếu `@JsonProperty`** nên Jackson trả **camelCase** (`tenantSlug`, `tenantName`) trong khi frontend (và chuẩn `ResponseKey`) dùng **snake_case**. UI không đọc được → fallback hiển thị `tenant_id` (UUID) trong cột "Tenant" — người dùng không thể hiểu.

Bằng chứng API thật:

```json
{ "tenantSlug": "qa-plug-195850", "tenantName": "QA Plugin Co", "tenant_id": "aeea9eed-…", "status": "NOT_INSTALLED" }
```

Ảnh minh chứng: `08_testing/evidence/screenshots/web_20_platform_plugins.png` (dòng tenant là UUID).

## Hướng sửa (đã thực hiện)

- Thêm hằng số `TENANT_SLUG`, `TENANT_NAME`, `LAST_ERROR_CODE` vào `PluginResponseKey.Json`.
- Gắn `@JsonProperty` tương ứng cho `InstallationItem.tenantSlug`, `.tenantName`, `.lastErrorCode`.
- Bổ sung assert API: `data.items[*].tenant_slug`/`tenant_name` không rỗng.

## Tiêu chí kiểm tra sau sửa

- [ ] P9 trả `tenant_slug`, `tenant_name` (snake_case) và UI hiển thị tên tenant.
- [ ] QA browser: `/platform/plugins` cột Tenant hiển thị "QA Plugin Co (qa-plug-195850)".
