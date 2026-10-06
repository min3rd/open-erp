# [TASK-381] API lookup cho form động (types/options/resolve/path/inline)

| Trường | Giá trị |
| :--- | :--- |
| ID / loại / sprint | TASK-381 / Task / Sprint 05 |
| Severity / trạng thái | High / **Done (dev) — `fde4f03`; QA TC-10/11/12** |
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
| — | Not Run | Chưa triển khai (gate đã duyệt 2026-10-06) |

## 4. Bàn giao và lịch sử

Lookup cho form động: `/lookup/types`, `/lookup/{typeCode}/options` (phân trang 0-based, mặc định 20/tối đa 100, `path` ghép " / "), `/resolve` theo lô, `/path`, `/inline` (`catalog:item:inline-create`). Hợp đồng trường khớp chính xác `catalog-picker` đã dựng.

**Tiến độ 2026-10-06**: hoàn thành trong đợt API (agent backend). Kiểm chứng: **34 test PASS** (23 test mới + 11 test cũ giữ xanh) trên PostgreSQL + Redis thật, không H2; bộ regression `PlatformAuthApiTest`, `PlatformPasswordChangeGuardTest`, `ImpersonationApiTest` **13/13 PASS**. Đường dẫn API khớp DES-API (kể cả `/api/v1/catalog/system/*` đã chốt ở §2.1). Trạng thái: **code xong, test PASS — chờ commit + QA (TASK-389)**.

Gate [CONF-S05-001](../04_confirmation/01_CONF-S05-001_sprint_05_scope.md) **APPROVED 2026-10-06** — sẵn sàng triển khai. Khi hoàn thành: ghi commit, số liệu đo và ảnh minh chứng.
