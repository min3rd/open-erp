# [TASK-392] Màn quản trị danh mục hệ thống trong cổng Platform (N5)

| Trường | Giá trị |
| :--- | :--- |
| ID / loại / sprint | TASK-392 / Task / Sprint 05 |
| Severity / trạng thái | High / **Done (dev) — `f6b5131` + API `fde4f03`; QA TC-25 PARTIAL (thiếu ảnh UI)** |
| Owner/agent / reviewer | Developer (agent) / QA + Architect |
| Cập nhật / input version | 2026-10-06 / CONF-S05-001 1.0 (Approved 2026-10-06), DES-DB/API/UI |
| depends_on / blocks / parent | TASK-385, TASK-390 / — / [FEAT-30](FEAT-30_catalog_core_plugin.md) |
| Write scope / baseline | `web/src/app/features/platform/catalog/**`, `modules/catalog/resource/CatalogSystemResource.java` |

## 1. Mục tiêu

Super admin quản trị danh mục hệ thống (tỉnh/huyện/xã, ngành, chuyên ngành) trên UI: CRUD bản ghi + quan hệ + import/export, dùng lại UI quản trị với cờ "hệ thống".

## 2. Các thao tác

- [ ] Tái dùng bố cục 3 cột của màn tenant với `scope=system` (không nhân bản component)
- [ ] API hệ thống: CRUD bản ghi `tenant_id IS NULL` + quan hệ + import/export, chỉ super admin (`catalog:system:manage`)
- [ ] Ẩn/hiện theo quyền: tenant gọi API hệ thống ⇒ 403 `CATALOG_TYPE_FORBIDDEN`
- [ ] i18n 13 locale cho nhãn màn mới; kiểm tra không tràn ngang ở 390px (chỉ để hiển thị, không CRUD trên mobile)

## 3. Tiêu chí và kiểm chứng

- AC liên quan: **AC-22, AC-15, AC-16**
- Build web + mobile PASS; backend test trên PostgreSQL/Redis thật (không H2).
- Baseline + cách kiểm chứng ghi ở mục bàn giao khi hoàn thành.

| Kiểm tra / baseline / môi trường | Kết quả | Evidence |
| :--- | :--- | :--- |
| — | Not Run | Chưa triển khai (gate đã duyệt 2026-10-06) |

## 4. Bàn giao và lịch sử

**Tiến độ 2026-10-06**: route `/platform/catalog/...` (guard `platformSuperAdminGuard`, ẩn với support engineer) **dùng lại chính component** với route data `catalogScope: "system"`; service gọi `/api/v1/catalog/system/*` (đã chốt vào DES-API §2.1); hệ thống chỉ đọc với tenant (ẩn nút sửa/xoá + gợi ý "tạo cùng mã để ghi đè"). Build PASS. Trạng thái: **code xong, build PASS — chờ commit + QA**; backend `/system/*` đang được agent API triển khai (TASK-378…383) — cần đối chiếu đường dẫn khi xong.

Gate [CONF-S05-001](../04_confirmation/01_CONF-S05-001_sprint_05_scope.md) **APPROVED 2026-10-06** — sẵn sàng triển khai. Khi hoàn thành: ghi commit, số liệu đo và ảnh minh chứng.
