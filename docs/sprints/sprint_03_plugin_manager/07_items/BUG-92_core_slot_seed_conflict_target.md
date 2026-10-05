# [BUG-92] Seed Core UI Slot không khớp partial unique index

- **Loại**: Documentation / Design defect
- **Severity**: High
- **Trạng thái**: Done (đóng 2026-10-05 theo xác nhận của chủ dự án — hồ sơ [QA-02](../08_testing/QA-02_sprint_03_requal_2026-10-05.md))
- **Ngày phát hiện**: 2026-09-20 (review lần 2)
- **Người xử lý**: Solution Architect Agent

## Bằng chứng và tác động

Nguồn: [06_designs/database/PLUGIN_MANAGER_DATABASE_SCHEMA.md](../06_designs/database/PLUGIN_MANAGER_DATABASE_SCHEMA.md), dòng 378 tại HEAD 20b1dd4.

DDL mục 2.5 thay UNIQUE(slot_code) bằng index uq_plugin_ui_slot_core ON (slot_code) WHERE host_type='CORE'. Mục 6 vẫn dùng ON CONFLICT (slot_code) DO NOTHING không có predicate; index plugin còn lại là composite nên cũng không khớp. Vì không suy ra được arbiter index, SQL seed không chạy được theo DDL đã ban hành, chặn V3.0.0 trước cả backfill.

## Hướng xử lý

Đổi conflict target thành ON CONFLICT (slot_code) WHERE host_type = 'CORE' DO NOTHING (hoặc phương án tương đương đúng index). Rà đồng bộ mọi ví dụ seed.

## Tiêu chí kiểm tra sau sửa

Trên PostgreSQL thật: tạo DDL mới rồi seed hai lần; lần đầu tạo đủ hai Core slot, lần sau không lỗi/không trùng; plugin slot cùng slot_code vẫn hợp lệ theo scope.

Nguồn kiểm chứng quy tắc SQL: [PostgreSQL 16 INSERT — ON CONFLICT / index_predicate](https://www.postgresql.org/docs/16/sql-insert.html#SQL-ON-CONFLICT). Review này đối chiếu tĩnh với tài liệu chính thức, chưa chạy SQL.

## Ghi Chú Xử Lý (2026-09-20)

- Sửa conflict target đúng partial unique index: `ON CONFLICT (slot_code) WHERE host_type = 'CORE' DO NOTHING` (index_predicate inference theo PostgreSQL 16).
- Bổ sung mục kiểm chứng seed 2 lần trên PostgreSQL thật; slot của plugin cùng `slot_code` vẫn hợp lệ theo partial index composite.
- Tài liệu: [DES-03-DB mục 6](../06_designs/database/PLUGIN_MANAGER_DATABASE_SCHEMA.md).

## Xác Nhận Static Validation (2026-09-20 — Review Lần 3)

- **Đã xác nhận tĩnh**: DDL ở mục 6 hiện đã khớp chính xác với partial unique index `uq_plugin_ui_slot_core` (dòng 209–210). Conflict target `ON CONFLICT (slot_code) WHERE host_type = 'CORE' DO NOTHING` suy ra được arbiter index đúng theo PostgreSQL 16 spec.
- **Trạng thái**: Done — đã Reviewer xác nhận đóng (2026-10-05, theo xác nhận của chủ dự án). Kiểm chứng static đã hoàn tất qua đối chiếu tài liệu chính thức PostgreSQL.
- **Lưu ý**: Seed plugin slot cùng `slot_code` nhưng `host_type = 'PLUGIN'` vẫn hợp lệ nhờ composite index `uq_plugin_ui_slot_plugin (owner_plugin_key, slot_code, contract_version) WHERE host_type = 'PLUGIN'` — không xung đột với Core index.

