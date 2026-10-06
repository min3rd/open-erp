# [TASK-381] API lookup cho form động (types/options/resolve/path/inline)

| Trường | Giá trị |
| :--- | :--- |
| ID / loại / sprint | TASK-381 / Task / Sprint 05 |
| Severity / trạng thái | High / **Blocked — chờ CONF-S05-001 được duyệt** |
| Owner/agent / reviewer | Developer (agent) / QA + Architect |
| Cập nhật / input version | 2026-10-06 / CONF-S05-001 (Pending), SOL-S05-001, DES-S05-001 |
| depends_on / blocks / parent | TASK-379, TASK-380 / — / [FEAT-30](FEAT-30_catalog_core_plugin.md) |
| Write scope / baseline | `modules/catalog/service/CatalogLookupService.java`, `resource/CatalogLookupResource.java` |

## 1. Mục tiêu

Form động lazy-load được danh mục tenant/hệ thống, resolve theo lô và tạo nhanh khi nhập tự do.

## 2. Các thao tác

- [ ] `GET /lookup/types` trả schema renderer (name_key, allow_free_text, attributes_schema)
- [ ] `GET /lookup/{typeCode}/options` phân trang + `q` + `parent_id` + `as_of` (mặc định 20, tối đa 100)
- [ ] `POST /lookup/{typeCode}/resolve` theo lô; `POST /lookup/{typeCode}/inline` (quyền riêng, chống trùng)
- [ ] Không trả dữ liệu tenant khác; test cách ly

## 3. Tiêu chí và kiểm chứng

- AC liên quan: **AC-10, AC-11, AC-12, AC-15**
- Build web + mobile PASS; backend test trên PostgreSQL/Redis thật (không H2).
- Baseline + cách kiểm chứng ghi ở mục bàn giao khi hoàn thành.

| Kiểm tra / baseline / môi trường | Kết quả | Evidence |
| :--- | :--- | :--- |
| — | Not Run | Chưa triển khai (chờ gate scope) |

## 4. Bàn giao và lịch sử

Chưa bắt đầu — phụ thuộc gate [CONF-S05-001](../04_confirmation/01_CONF-S05-001_sprint_05_scope.md) và thiết kế đã review. Khi triển khai: ghi commit, số liệu đo và ảnh minh chứng.
