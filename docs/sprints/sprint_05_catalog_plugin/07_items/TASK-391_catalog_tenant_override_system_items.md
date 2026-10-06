# [TASK-391] Ghi đè/ẩn danh mục hệ thống theo tenant (khách chốt Q1/Q2)

| Trường | Giá trị |
| :--- | :--- |
| ID / loại / sprint | TASK-391 / Task / Sprint 05 |
| Severity / trạng thái | High / **To Do — sẵn sàng (gate APPROVED 2026-10-06)** |
| Owner/agent / reviewer | Developer (agent) / QA + Architect |
| Cập nhật / input version | 2026-10-06 / CONF-S05-001 0.2 (câu trả lời Q1/Q2/Q7; gate Pending), DES-API/DES-UI |
| depends_on / blocks / parent | TASK-379, TASK-381 / — / [FEAT-30](FEAT-30_catalog_core_plugin.md) |
| Write scope / baseline | `modules/catalog/service/CatalogItemService.java`, `CatalogLookupService.java`, UI danh sách/options |

## 1. Mục tiêu

Tenant tạo bản ghi cùng `code` để ghi đè nhãn/thuộc tính, hoặc ẩn mục hệ thống khỏi form của mình mà không ảnh hưởng tenant khác.

## 2. Các thao tác

- [ ] Quy tắc hợp nhất `DISTINCT ON (code)` tenant thắng đã có ở TASK-377 — bổ sung nhánh **ẩn**: bản ghi tenant `INACTIVE` cùng `code` ⇒ loại mục hệ thống khỏi options của tenant
- [ ] Cho phép tạo bản ghi tenant trỏ tới mục hệ thống (không cần cha–con) và đánh dấu nguồn gốc để UI hiện badge "Ghi đè"
- [ ] Không cho tenant sửa trực tiếp bản ghi hệ thống (chỉ tạo bản ghi tenant cùng `code`)
- [ ] Test: 2 tenant — A ghi đè/ẩn, B không đổi; options của A và B khác nhau đúng như thiết kế

## 3. Tiêu chí và kiểm chứng

- AC liên quan: **AC-20, AC-15**
- Build web + mobile PASS; backend test trên PostgreSQL/Redis thật (không H2).
- Baseline + cách kiểm chứng ghi ở mục bàn giao khi hoàn thành.

| Kiểm tra / baseline / môi trường | Kết quả | Evidence |
| :--- | :--- | :--- |
| — | Not Run | Chưa triển khai (gate đã duyệt 2026-10-06) |

## 4. Bàn giao và lịch sử

Gate [CONF-S05-001](../04_confirmation/01_CONF-S05-001_sprint_05_scope.md) **APPROVED 2026-10-06** — sẵn sàng triển khai. Khi hoàn thành: ghi commit, số liệu đo và ảnh minh chứng.
