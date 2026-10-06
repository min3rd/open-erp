# [TASK-375] Migration V4.0.0: schema danh mục + seed plugin core + backfill

| Trường | Giá trị |
| :--- | :--- |
| ID / loại / sprint | TASK-375 / Task / Sprint 05 |
| Severity / trạng thái | High / **Blocked — chờ CONF-S05-001 được duyệt** |
| Owner/agent / reviewer | Developer (agent) / QA + Architect |
| Cập nhật / input version | 2026-10-06 / CONF-S05-001 (Pending), SOL-S05-001, DES-S05-001 |
| depends_on / blocks / parent | — / — / [FEAT-30](FEAT-30_catalog_core_plugin.md) |
| Write scope / baseline | `src/backend/src/main/resources/db/migration/V4.0.0__catalog_core_plugin.sql` |

## 1. Mục tiêu

Dựng toàn bộ CSDL danh mục (loại, bản ghi, cạnh, grant) với ràng buộc EXCLUDE, seed loại hệ thống + quyền + plugin core, backfill tenant cũ.

## 2. Các thao tác

- [ ] `CREATE EXTENSION btree_gist, pg_trgm`; 4 bảng theo [DES-DB-S05-001](../06_designs/db/01_DES-DB-S05-001_catalog_schema.md) §2
- [ ] Index §3 + ràng buộc EXCLUDE (COALESCE tenant_id cho bản ghi hệ thống)
- [ ] Seed plugin `catalog` (is_core, default_install, locked), 5 quyền, loại hệ thống + loại tenant mặc định
- [ ] Backfill: `tenants.allowed_plugins` + `tenant_plugins` ACTIVE cho mọi tenant hiện có (idempotent)

## 3. Tiêu chí và kiểm chứng

- AC liên quan: **AC-05, AC-07, AC-13, AC-14, AC-15**
- Build web + mobile PASS; backend test trên PostgreSQL/Redis thật (không H2).
- Baseline + cách kiểm chứng ghi ở mục bàn giao khi hoàn thành.

| Kiểm tra / baseline / môi trường | Kết quả | Evidence |
| :--- | :--- | :--- |
| — | Not Run | Chưa triển khai (chờ gate scope) |

## 4. Bàn giao và lịch sử

Chưa bắt đầu — phụ thuộc gate [CONF-S05-001](../04_confirmation/01_CONF-S05-001_sprint_05_scope.md) và thiết kế đã review. Khi triển khai: ghi commit, số liệu đo và ảnh minh chứng.
