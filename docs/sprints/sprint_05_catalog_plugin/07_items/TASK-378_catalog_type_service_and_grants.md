# [TASK-378] CRUD loại danh mục + quản trị quyền theo loại

| Trường | Giá trị |
| :--- | :--- |
| ID / loại / sprint | TASK-378 / Task / Sprint 05 |
| Severity / trạng thái | High / **To Do — sẵn sàng (gate APPROVED 2026-10-06)** |
| Owner/agent / reviewer | Developer (agent) / QA + Architect |
| Cập nhật / input version | 2026-10-06 / CONF-S05-001 (Pending), SOL-S05-001, DES-S05-001 |
| depends_on / blocks / parent | TASK-377 / — / [FEAT-30](FEAT-30_catalog_core_plugin.md) |
| Write scope / baseline | `modules/catalog/service/CatalogTypeService.java`, `resource/CatalogTypeResource.java`, `CatalogGrantService` |

## 1. Mục tiêu

Tenant tạo/sửa loại danh mục của mình và cấu hình vai trò nào được xem/ghi từng loại.

## 2. Các thao tác

- [ ] CRUD loại (không đổi `code`; loại hệ thống chỉ platform ghi)
- [ ] API grants `GET/PUT /types/{code}/grants` (ghi đè danh sách, validate role thuộc tenant)
- [ ] Audit mọi mutation; mã lỗi theo DES-API §6

## 3. Tiêu chí và kiểm chứng

- AC liên quan: **AC-09, AC-16**
- Build web + mobile PASS; backend test trên PostgreSQL/Redis thật (không H2).
- Baseline + cách kiểm chứng ghi ở mục bàn giao khi hoàn thành.

| Kiểm tra / baseline / môi trường | Kết quả | Evidence |
| :--- | :--- | :--- |
| — | Not Run | Chưa triển khai (gate đã duyệt 2026-10-06) |

## 4. Bàn giao và lịch sử

Gate [CONF-S05-001](../04_confirmation/01_CONF-S05-001_sprint_05_scope.md) **APPROVED 2026-10-06** — sẵn sàng triển khai. Khi hoàn thành: ghi commit, số liệu đo và ảnh minh chứng.
