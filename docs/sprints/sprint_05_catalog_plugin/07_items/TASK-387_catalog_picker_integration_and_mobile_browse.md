# [TASK-387] Tích hợp picker vào form thật + màn tra cứu danh mục trên Mobile

| Trường | Giá trị |
| :--- | :--- |
| ID / loại / sprint | TASK-387 / Task / Sprint 05 |
| Severity / trạng thái | Medium / **Blocked — chờ CONF-S05-001 được duyệt** |
| Owner/agent / reviewer | Developer (agent) / QA + Architect |
| Cập nhật / input version | 2026-10-06 / CONF-S05-001 (Pending), SOL-S05-001, DES-S05-001 |
| depends_on / blocks / parent | TASK-386 / — / [FEAT-30](FEAT-30_catalog_core_plugin.md) |
| Write scope / baseline | web feature dùng thử (vd `sample-records`), `mobile/src/app/pages/settings/catalog/**` |

## 1. Mục tiêu

Chứng minh picker chạy end-to-end trong một form thật và có màn tra cứu read-only trên mobile.

## 2. Các thao tác

- [ ] Thay một trường text bằng `catalog-picker` (loại Chức danh) ở một màn có sẵn
- [ ] Mobile: màn danh sách/cây read-only + picker trong form
- [ ] Kiểm tra lưu/đọc lại giá trị `{catalog_item_id, text}` và trường hợp nhập tự do

## 3. Tiêu chí và kiểm chứng

- AC liên quan: **AC-11, AC-12, AC-16**
- Build web + mobile PASS; backend test trên PostgreSQL/Redis thật (không H2).
- Baseline + cách kiểm chứng ghi ở mục bàn giao khi hoàn thành.

| Kiểm tra / baseline / môi trường | Kết quả | Evidence |
| :--- | :--- | :--- |
| — | Not Run | Chưa triển khai (chờ gate scope) |

## 4. Bàn giao và lịch sử

Chưa bắt đầu — phụ thuộc gate [CONF-S05-001](../04_confirmation/01_CONF-S05-001_sprint_05_scope.md) và thiết kế đã review. Khi triển khai: ghi commit, số liệu đo và ảnh minh chứng.
