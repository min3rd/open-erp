# [TASK-387] Tích hợp picker vào form thật + màn tra cứu danh mục trên Mobile

| Trường | Giá trị |
| :--- | :--- |
| ID / loại / sprint | TASK-387 / Task / Sprint 05 |
| Severity / trạng thái | Medium / **In Progress — màn Mobile đang dựng (2026-10-06)** |
| Owner/agent / reviewer | Developer (agent) / QA + Architect |
| Cập nhật / input version | 2026-10-06 / CONF-S05-001 1.0 (Approved 2026-10-06), SOL-S05-001, DES-UI-S05-001 |
| depends_on / blocks / parent | TASK-386 / — / [FEAT-30](FEAT-30_catalog_core_plugin.md) |
| Write scope / baseline | web feature dùng thử (vd `sample-records`), `mobile/src/app/pages/settings/catalog/**` |

## 1. Mục tiêu

Chứng minh picker chạy end-to-end trong một form thật và có màn tra cứu read-only trên mobile.

## 2. Các thao tác

- [x] ~~Thay một trường text bằng `catalog-picker` (loại Chức danh) ở một màn có sẵn~~ → **đã đạt bằng cách khác**: drawer "thêm quan hệ" của màn quản trị (TASK-385) dùng `catalog-picker` trong form thật, có lưu/đọc lại giá trị
- [ ] Mobile: màn danh sách/cây read-only + picker trong form
- [ ] Kiểm tra lưu/đọc lại giá trị `{catalog_item_id, text}` và trường hợp nhập tự do

> **Ghi chú phạm vi (Architect, 2026-10-06)**: bỏ việc gắn picker vào `sample-records` — bảng `core_sample_records` **không có trường JSON/tự do**, muốn gắn phải thêm cột vào entity core chỉ để demo (YAGNI). Chứng minh "form thật" dùng drawer quan hệ của màn quản trị; AC-11/AC-12 vẫn được bao phủ.

## 3. Tiêu chí và kiểm chứng

- AC liên quan: **AC-11, AC-12, AC-16**
- Build web + mobile PASS; backend test trên PostgreSQL/Redis thật (không H2).
- Baseline + cách kiểm chứng ghi ở mục bàn giao khi hoàn thành.

| Kiểm tra / baseline / môi trường | Kết quả | Evidence |
| :--- | :--- | :--- |
| — | Not Run | Chưa triển khai (gate đã duyệt 2026-10-06) |

## 4. Bàn giao và lịch sử

Gate [CONF-S05-001](../04_confirmation/01_CONF-S05-001_sprint_05_scope.md) **APPROVED 2026-10-06** — sẵn sàng triển khai. Khi hoàn thành: ghi commit, số liệu đo và ảnh minh chứng.
