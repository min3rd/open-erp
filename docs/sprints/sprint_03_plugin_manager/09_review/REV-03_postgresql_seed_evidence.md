# REV-03 — Bằng chứng PostgreSQL cho BUG-92

- Ngày: 2026-09-20.
- Môi trường: container đang chạy `openerp-postgres-primary`, image `postgres:16-alpine`, database `openerp_dev`.
- Input: trích nguyên block DDL `plugin_ui_slots` và block seed từ DES-03-DB tại baseline `1919b23`; chỉ thay CREATE TABLE bằng CREATE TEMP TABLE để kiểm tra không tác động bảng ứng dụng.
- Thực thi: psql với ON_ERROR_STOP=1; BEGIN; SET LOCAL search_path=pg_temp; tạo bảng/index; seed hai lần; thêm PLUGIN slot có cùng slot_code với Core; đếm theo host_type; ROLLBACK.

```text
CREATE TABLE
CREATE INDEX
CREATE INDEX
CREATE INDEX
INSERT 0 2
INSERT 0 0
INSERT 0 1
host_type | count
CORE      | 2
PLUGIN    | 1
ROLLBACK
```

Kết quả PASS cho conflict target và tính idempotent của seed; plugin slot trùng slot_code với Core vẫn hợp lệ. Không thay đổi dữ liệu ứng dụng. Không suy rộng kết quả này thành PASS cho toàn bộ migration, rollback runtime hoặc khóa plugin.
