# [TASK-379] CRUD bản ghi danh mục + version + hiệu lực thời gian

| Trường | Giá trị |
| :--- | :--- |
| ID / loại / sprint | TASK-379 / Task / Sprint 05 |
| Severity / trạng thái | High / **To Do — sẵn sàng (gate APPROVED 2026-10-06)** |
| Owner/agent / reviewer | Developer (agent) / QA + Architect |
| Cập nhật / input version | 2026-10-06 / CONF-S05-001 (Pending), SOL-S05-001, DES-S05-001 |
| depends_on / blocks / parent | TASK-377 / — / [FEAT-30](FEAT-30_catalog_core_plugin.md) |
| Write scope / baseline | `modules/catalog/service/CatalogItemService.java`, `resource/CatalogResource.java` |

## 1. Mục tiêu

Sửa bản ghi tạo phiên bản mới, đóng hiệu lực thay vì xoá, tra cứu as-of và lịch sử phiên bản.

## 2. Các thao tác

- [ ] Tạo (v1) / Sửa (đóng bản cũ + tạo v(n+1) cùng `version_group_id`) / Đóng hiệu lực
- [ ] `GET /items/{id}/versions`, tham số `as_of` trên mọi API đọc
- [ ] Bắt lỗi chồng lấn từ ràng buộc EXCLUDE ⇒ `CATALOG_ITEM_WINDOW_OVERLAP`
- [ ] Test: sửa 3 lần ⇒ 3 phiên bản, as-of từng mốc trả đúng nội dung

## 3. Tiêu chí và kiểm chứng

- AC liên quan: **AC-06, AC-07, AC-08**
- Build web + mobile PASS; backend test trên PostgreSQL/Redis thật (không H2).
- Baseline + cách kiểm chứng ghi ở mục bàn giao khi hoàn thành.

| Kiểm tra / baseline / môi trường | Kết quả | Evidence |
| :--- | :--- | :--- |
| — | Not Run | Chưa triển khai (gate đã duyệt 2026-10-06) |

## 4. Bàn giao và lịch sử

Gate [CONF-S05-001](../04_confirmation/01_CONF-S05-001_sprint_05_scope.md) **APPROVED 2026-10-06** — sẵn sàng triển khai. Khi hoàn thành: ghi commit, số liệu đo và ảnh minh chứng.
