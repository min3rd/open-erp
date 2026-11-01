# [BUG-166] Plugin install không cấp quyền cho TENANT_ADMIN

| Trường | Giá trị |
| :--- | :--- |
| ID / loại / sprint | BUG-166 / Bug phân quyền / Sprint 07 |
| Mức độ / trạng thái | **High** / **Resolved (QA)** 2026-10-30 |
| Phát hiện bởi / ngày | QA/QC Agent / 2026-10-30 |
| Owner / reviewer | Developer / QA |
| Liên quan | [TASK-426](TASK-426_organization_plugin_scaffold_schema_seed.md), `PluginPermissionSeeder` |

## 1. Mô tả

Sau khi cài `employee`, tài khoản tenant admin (role `TENANT_ADMIN`) không có bất kỳ quyền `employee:*` nào; mở plugin bị 403. `PluginPermissionSeeder` chỉ grant cho `TENANT_OWNER`.

## 2. Cách sửa

- Seeder grant permission plugin cho cả `TENANT_OWNER` và `TENANT_ADMIN`.
- Migration `V7.0.4__plugin_permissions_tenant_admin.sql` backfill quyền plugin (domain <> core) cho TENANT_ADMIN trên tenant đã cài.

## 3. Kiểm chứng

- Sau fix, TENANT_ADMIN có 23 quyền employee; UI list/create/approval/tools chạy thật PASS.
- `open-erp validate` + backend tests PASS.

## 4. Lịch sử

| Phiên bản | Ngày | Thay đổi | Nguồn |
| :--- | :--- | :--- | :--- |
| 0.1 | 2026-10-30 | QA cài plugin thật phát hiện 403 do thiếu grant admin | TR-S07-001 1.2 |
| 0.2 | 2026-10-30 | Fix seeder + migration backfill; retest PASS | Developer/QA |
