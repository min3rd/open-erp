# [TASK-384] Test backend (PostgreSQL thật): DAG, version, chồng lấn, phân quyền, cách ly tenant

> **Trạng thái lịch sử:** task baseline của kiến trúc in-process (TR-S05-001 đã withdrawn). Đã được thay thế bởi TASK-394…406 (plugin độc lập). Không dùng làm bằng chứng QA/DoD.

| Trường | Giá trị |
| :--- | :--- |
| ID / loại / sprint | TASK-384 / Task / Sprint 05 |
| Severity / trạng thái | High / **Done (dev) — `fde4f03`; full suite 287 PASS** |
| Owner/agent / reviewer | Developer (agent) / QA + Architect |
| Cập nhật / input version | 2026-10-06 / CONF-S05-001 (Pending), SOL-S05-001, DES-S05-001 |
| depends_on / blocks / parent | TASK-378, TASK-379, TASK-380, TASK-381, TASK-382 / — / [FEAT-30](FEAT-30_catalog_core_plugin.md) |
| Write scope / baseline | `src/backend/src/test/java/.../modules/catalog/**` |

## 1. Mục tiêu

Chứng minh AC-01…AC-15 ở tầng API trên CSDL thật (không H2).

## 2. Các thao tác

- [ ] Test DAG: đa cha, nhảy cấp, chu trình bị từ chối, không sinh cạnh bắc cầu
- [ ] Test version/as-of + chồng lấn (EXCLUDE) + đóng hiệu lực
- [ ] Test phân quyền 2 tầng + cách ly tenant (2 tenant, cùng mã)
- [ ] Test lookup: phân trang, gộp tenant+hệ thống (tenant thắng), resolve lô, inline-create

## 3. Tiêu chí và kiểm chứng

- AC liên quan: **AC-01…AC-15**
- Build web + mobile PASS; backend test trên PostgreSQL/Redis thật (không H2).
- Baseline + cách kiểm chứng ghi ở mục bàn giao khi hoàn thành.

| Kiểm tra / baseline / môi trường | Kết quả | Evidence |
| :--- | :--- | :--- |
| — | Not Run | Chưa triển khai (gate đã duyệt 2026-10-06) |

## 4. Bàn giao và lịch sử

**Tiến độ 2026-10-06**: bộ test backend của plugin đã dựng và xanh trên PostgreSQL 16 + Redis thật (**không H2**): `CatalogRepositoryPostgresTest` (EXCLUDE chồng lấn, chu trình, options gộp tenant thắng, `as_of`), `CatalogAdminUnitSeederTest` (34 tỉnh / 3.321 xã / cạnh trực tiếp, idempotent), `CatalogPluginRegistrationTest` (4 entity vào registry), `CatalogTypeApiTest`, `CatalogItemVersioningApiTest` (sửa ⇒ version mới + đóng bản cũ), `CatalogEdgeApiTest` (allowlist cha khác loại + chu trình), `CatalogLookupApiTest` (phân trang, nhập tự do, inline), `CatalogImportExportApiTest` (11), `CatalogImportMaxRowsApiTest` (giới hạn cấu hình). Tổng các lượt: **49 + 34 + 12 + regression 45** test PASS; đang chạy **toàn bộ suite** để chốt trước commit.

Gate [CONF-S05-001](../04_confirmation/01_CONF-S05-001_sprint_05_scope.md) **APPROVED 2026-10-06** — sẵn sàng triển khai. Khi hoàn thành: ghi commit, số liệu đo và ảnh minh chứng.
