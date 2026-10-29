# [BUG-158] Catalog chưa migrate metadata template 2.0 (`template_version 0.1.0`, thiếu `schema_version`)

| Trường | Giá trị |
| :--- | :--- |
| ID / loại / sprint | BUG-158 / Bug migration / Sprint 06 |
| Mức độ / trạng thái | **Medium** / **Resolved (QA)** 2026-10-29 |
| Phát hiện bởi / ngày | QA/QC Agent / 2026-10-29 |
| Owner / reviewer | Developer / QA |
| Liên quan | [AC-18](../04_confirmation/01_CONF-S06-001_sprint_06_scope_and_questions.md), [TASK-420](TASK-420_catalog_web_component_migration.md), [TASK-413](TASK-413_cli_validate_upgrade_test.md) |

## 1. Mô tả

Catalog đã chuyển code sang zero-DB/WC nhưng metadata `plugin.json` vẫn là template cũ:

- `"template_version": "0.1.0"` (template 2.0 dùng `2.0.0`).
- Không có `schema_version` 2.0.

Chạy `open-erp-cli upgrade --check` trong `plugins/catalog`:

```text
OUTDATED plugin.json: schema_version must be 2.0
OUTDATED plugin.json: template_version 0.1.0 -> 2.0.0
upgrade --check found template work (use --apply to update the manifest/backup).
```

Hệ quả: AC-18 (“migrate sang template 2.0”) chưa đạt về metadata; công cụ upgrade luôn báo catalog cần nâng cấp dù code đã migrate. Runtime hiện vẫn chạy vì manifest parser không chặn các field này.

## 2. Các bước tái hiện

1. `cd plugins/catalog`.
2. `node ../../tools/open-erp-cli/bin/open-erp.js upgrade --check`.
3. Quan sát output OUTDATED.

## 3. Bằng chứng

- [plugin.json](../../../../plugins/catalog/plugin.json) dòng 11 `template_version: 0.1.0`; không có `schema_version`.
- Command output ở trên (exit code 1).

## 4. Hướng sửa đề xuất

- Chạy `open-erp-cli upgrade --apply` (có backup) hoặc cập nhật tay `schema_version: "2.0"`, `template_version: "2.0.0"`.
- Thêm regression `upgrade --check` cho `plugins/catalog` phải trả “up to date” sau migrate.

## 5. Cách sửa & kiểm chứng

- Cập nhật `schema_version: "2.0"` và `template_version: "2.0.0"` trong `plugins/catalog/plugin.json` + bản copy resources.
- **Kiểm chứng:** `open-erp-cli upgrade --check` → `Template 2.0.0 is up to date.` (exit 0).

## 6. Lịch sử

| Phiên bản | Ngày | Thay đổi | Nguồn |
| :--- | :--- | :--- | :--- |
| 0.1 | 2026-10-29 | Tạo bug từ QA CLI + manifest catalog | TR-S06-001 / TASK-423 |
| 0.2 | 2026-10-29 | Cập nhật metadata; QA re-test PASS | Developer/QA |
