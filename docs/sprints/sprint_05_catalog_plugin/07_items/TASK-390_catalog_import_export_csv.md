# [TASK-390] Import/Export CSV danh mục (khách chốt Q7 — trong phạm vi Sprint 5)

| Trường | Giá trị |
| :--- | :--- |
| ID / loại / sprint | TASK-390 / Task / Sprint 05 |
| Severity / trạng thái | High / **Blocked — chờ CONF-S05-001 được duyệt** |
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
| — | Not Run | Chưa triển khai (chờ gate scope) |

## 4. Bàn giao và lịch sử

Chưa bắt đầu — phụ thuộc gate [CONF-S05-001](../04_confirmation/01_CONF-S05-001_sprint_05_scope.md). Khi triển khai: ghi commit, số liệu đo và ảnh minh chứng.
