# [BUG-185] Tenant đăng ký xong nhưng toàn bộ plugin mặc định bị bỏ qua

| Trường | Giá trị |
| :--- | :--- |
| ID / loại / sprint | BUG-185 / Bug / Sprint 09 (phát hiện khi chạy local dev UI) |
| Severity / trạng thái | **High / Fixed** |
| Owner/agent / reviewer | Developer / QA |
| Cập nhật / input version | 2026-11-15 / Local dev stack + tenant `review50c` |
| depends_on / blocks / parent | BUG-184 / — / [TR-S09-003](../08_testing/04_TR-S09-003_db_role_ui_retest_report.md) |
| Write scope | `PluginProvisioningService`, `AuthService` |

## 1. Hiện tượng

Đăng ký doanh nghiệp qua UI thành công nhưng `tenant_plugins` không có bản ghi nào (hoặc toàn bộ `NOT_INSTALLED`). Log backend:

```text
Default plugin catalog provisioning failed ... Plugin is not entitled for this tenant
...
violates foreign key constraint "tenant_plugins_tenant_id_fkey"
```

## 2. Nguyên nhân

- `provisionDefaults` chạy trước khi transaction đăng ký tenant commit, nên transaction mới của install saga không thấy tenant/entitlement vừa tạo.
- `grantIfExists` và `lifecycleService.install` lại chạy trong transaction mới (`requiringNew`) nên không thấy dữ liệu chưa commit.

## 3. Sửa đổi

- Grant entitlement + `allowed_plugins` trong một transaction mới, commit trước.
- Chạy install saga trong transaction mới kế tiếp.
- Đăng ký provisioning qua `TransactionSynchronizationRegistry.afterCompletion(STATUS_COMMITTED)` để chỉ chạy sau khi tenant đã commit.

## 4. Kiểm chứng

- Tenant `review50c` đăng ký qua UI: catalog, org-structure, employee, form, workflow lần lượt `ACTIVE`; attendance `NOT_INSTALLED` (đúng default không khóa).
- 5 container plugin được deploy và healthy.
- Docs check: 0 lỗi; duplicate TASK đã xử lý riêng.
