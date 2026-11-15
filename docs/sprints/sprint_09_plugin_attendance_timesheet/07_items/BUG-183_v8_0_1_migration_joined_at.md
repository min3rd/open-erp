# [BUG-183] V8.0.1 migration fails on existing database — `user_tenants.created_at` không tồn tại

| Trường | Giá trị |
| :--- | :--- |
| ID / loại / sprint | BUG-183 / Bug / Sprint 09 (phát hiện khi DB test) |
| Severity / trạng thái | **High / Fixed** |
| Owner/agent / reviewer | Developer / QA |
| Cập nhật / input version | 2026-11-14 / DB test trên PostgreSQL 16 + `openerp_dev` hiện hữu |
| depends_on / blocks / parent | — / — / [TR-S09-003](../08_testing/04_TR-S09-003_db_role_ui_retest_report.md) |
| Write scope | `src/backend/src/main/resources/db/migration/V8.0.1__default_locked_plugins_and_dependencies.sql` |

## 1. Hiện tượng

Chạy `mvn -f src/backend/pom.xml test` trên database hiện hữu: Flyway migration `V8.0.1` thất bại:

```text
ERROR: column "created_at" does not exist
Where: PL/pgSQL function organization_bootstrap_schema(text,uuid) line 148
```

Backend không khởi động được; toàn bộ test DB-backed bị block.

## 2. Nguyên nhân

Hàm `organization_bootstrap_schema` chọn owner đầu tiên bằng `ORDER BY created_at ASC` trên `user_tenants`, nhưng bảng này chỉ có `joined_at` (schema từ V1.0.0). Migration chỉ đúng trên DB chưa từng chạy hoặc có cột không tồn tại.

## 3. Sửa đổi

Đổi `ORDER BY created_at ASC` → `ORDER BY joined_at ASC` trong `V8.0.1`.

## 4. Kiểm chứng

- Migration `V8.0.1` + `V9.0.0` apply thành công trên `openerp_dev` và database sạch `openerp_test`.
- `ScopeProjectionServiceTest`: 2/2 PASS sau khi sửa.
- Full backend DB suite: **260 test, 0 failures, 0 errors, 1 skipped**.

## 5. Lưu ý triển khai

Database nào đã từng apply `V8.0.1` bản cũ (checksum khác) cần chạy `flyway repair` trước khi nâng cấp; database chưa apply sẽ chạy bản đã sửa trực tiếp. Không tắt `validate-on-migrate` toàn cục.
