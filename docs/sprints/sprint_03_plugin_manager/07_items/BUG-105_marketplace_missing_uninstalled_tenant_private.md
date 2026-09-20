# BUG-105: T1 Marketplace bỏ sót plugin riêng của tenant khi chưa có ledger (chưa từng cài)

| Trường | Giá Trị |
| :--- | :--- |
| **Mã** | BUG-105 |
| **Mức độ** | **High** |
| **Phát hiện bởi** | QA/QC Agent — chạy kiểm thử trình duyệt thật (dữ liệu TENANT_PRIVATE không hiển thị) |
| **Ngày** | 2026-09-20 |
| **Trạng thái** | Resolved (Dev fix 2026-09-20) |
| **Liên quan** | BUG-87, TASK-316/317, DES-03-API T1/T8 |

## Mô tả

`GET /api/v1/tenant/plugins` (T1) chỉ duyệt theo bảng `tenant_plugins` (ledger). Plugin riêng `TENANT_PRIVATE` vừa đăng ký qua T8 nhưng **chưa cài** chưa có ledger → **không xuất hiện** trong Marketplace, dù DES ghi T1 trả "plugin được cấp phép **+ plugin riêng của tenant**" và luồng T8→T17→T3 yêu cầu tenant thấy plugin mình vừa đăng ký để publish & cài.

Bằng chứng: đăng ký `qa-custom-tool` (TENANT_PRIVATE, version PUBLISHED) → UI không có nhóm "Plugin riêng"; API T1 chỉ trả 2 plugin nền tảng.

## Hướng sửa (đã thực hiện)

- `PluginLifecycleService.listMarketplace`: sau vòng lặp ledger, bổ sung mọi catalog `TENANT_PRIVATE` thuộc tenant (bỏ qua catalog `BLOCKED` và key đã có ledger) với `status = NOT_INSTALLED`, `is_custom = true`, `latest_version` tính từ versions.
- Test `PluginLifecycleApiTest.testTenantCustomPluginFlow`: sau T8, T1 phải chứa item custom với `is_custom=true`, `status=NOT_INSTALLED`.

## Tiêu chí kiểm tra sau sửa

- [ ] Marketplace hiển thị nhóm "Plugin riêng" ngay sau khi đăng ký (chưa cần cài).
- [ ] Plugin riêng bị nền tảng khóa (BLOCKED) không hiển thị.
