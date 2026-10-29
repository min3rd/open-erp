# [TASK-390] Import/Export CSV danh mục (khách chốt Q7 — trong phạm vi Sprint 5)

> **Trạng thái lịch sử:** task baseline của kiến trúc in-process (TR-S05-001 đã withdrawn). Đã được thay thế bởi TASK-394…406 (plugin độc lập). Không dùng làm bằng chứng QA/DoD.

| Trường | Giá trị |
| :--- | :--- |
| ID / loại / sprint | TASK-390 / Task / Sprint 05 |
| Severity / trạng thái | High / **Done (dev) — `fde4f03`; 12 test PASS (QA TC-20…23: PARTIAL/PASS test)** |
| Owner/agent / reviewer | Developer (agent) / QA + Architect |
| Cập nhật / input version | 2026-10-06 / CONF-S05-001 0.2 (câu trả lời Q1/Q2/Q7; gate Pending), DES-API/DES-UI |
| depends_on / blocks / parent | TASK-381 / — / [FEAT-30](FEAT-30_catalog_core_plugin.md) |
| Write scope / baseline | `modules/catalog/service/CatalogImportExportService.java`, `resource/CatalogImportExportResource.java`, UI drawer trong `web/features/settings/catalog/` |

## 1. Mục tiêu

Nạp/xuất danh mục bằng CSV an toàn: validate toàn tệp trước khi ghi, báo cáo theo dòng, export mở đúng bằng Excel tiếng Việt.

## 2. Các thao tác

- [ ] Import: multipart CSV, `dry_run=true` kiểm tra trước; khoá khớp theo `code` (có ⇒ tạo phiên bản mới, chưa có ⇒ tạo); giới hạn 5.000 dòng (`CATALOG_IMPORT_TOO_LARGE`)
- [ ] Báo cáo `created/updated/skipped/errors[{row, code, params}]`; lỗi theo dòng không chặn dòng hợp lệ
- [ ] Template CSV đúng cột theo loại; export theo loại/tất cả kèm cha–con + hiệu lực + trạng thái; UTF-8 BOM
- [ ] UI: drawer Import (chọn tệp → kết quả dry-run → ghi) + Export + tải mẫu; i18n 13 locale cho mã lỗi
- [ ] Test: tệp đúng/sai cột/vượt dòng/trùng mã; export → import lại (round-trip) không tạo trùng

## 3. Tiêu chí và kiểm chứng

- AC liên quan: **AC-18, AC-19**
- Build web + mobile PASS; backend test trên PostgreSQL/Redis thật (không H2).
- Baseline + cách kiểm chứng ghi ở mục bàn giao khi hoàn thành.

| Kiểm tra / baseline / môi trường | Kết quả | Evidence |
| :--- | :--- | :--- |
| — | Not Run | Chưa triển khai (gate đã duyệt 2026-10-06) |

## 4. Bàn giao và lịch sử

**Tiến độ 2026-10-06**: `CatalogImportExportService` (CSV + `.xlsx` qua **Apache POI 5.5.1** — ngoại lệ thư viện có kiểm soát) + DTO báo cáo khớp hợp đồng frontend; endpoint `POST /types/{code}/import?dry_run=` (multipart `file`), `GET /types/{code}/import/template`, `GET /catalog/export` — **và cả nhánh `/system/*`**; giới hạn `openerp.catalog.import.max-rows=20000`; mã lỗi mới `CATALOG_IMPORT_ROW_INVALID`.

Đặc tính đã kiểm chứng: tệp sai cấu trúc bị từ chối trước khi ghi; lỗi theo dòng không chặn dòng hợp lệ; `dry_run` không ghi gì; `parent_code` tạo cạnh + chặn chu trình theo dòng; **export → import round-trip idempotent** (đổi tên ⇒ `SKIPPED`, không sinh version rác); tenant nhập mã hệ thống ⇒ tạo bản ghi ghi đè (không đụng bản hệ thống).

Kiểm chứng: **12/12 test mới PASS** + **45/45 regression PASS** trên PostgreSQL 16 + Redis thật (không H2). Khoá i18n còn thiếu (`CATALOG_IMPORT_ROW_INVALID`, `CATALOG_EDGE_RELATION_NOT_ALLOWED`) đã bổ sung đủ 13 locale web.

Gate [CONF-S05-001](../04_confirmation/01_CONF-S05-001_sprint_05_scope.md) **APPROVED 2026-10-06** — sẵn sàng triển khai. Khi hoàn thành: ghi commit, số liệu đo và ảnh minh chứng.
