# [TASK-386] Component dùng chung `catalog-picker` (autocomplete + nhập tự do)

| Trường | Giá trị |
| :--- | :--- |
| ID / loại / sprint | TASK-386 / Task / Sprint 05 |
| Severity / trạng thái | High / **Blocked — chờ CONF-S05-001 được duyệt** |
| Owner/agent / reviewer | Developer (agent) / QA + Architect |
| Cập nhật / input version | 2026-10-06 / CONF-S05-001 (Pending), SOL-S05-001, DES-S05-001 |
| depends_on / blocks / parent | TASK-381 / — / [FEAT-30](FEAT-30_catalog_core_plugin.md) |
| Write scope / baseline | `shared/components/catalog-picker/**`, `shared/models/catalog.model.ts` |

## 1. Mục tiêu

Một component duy nhất cho Web + Mobile: lazy options, resolve theo lô, nhập tự do, tạo nhanh.

## 2. Các thao tác

- [ ] Inputs/outputs theo DES-UI §3; model `CatalogItemRef {catalog_item_id, text}`
- [ ] Debounce 250ms, phân trang cuộn tới đáy, cache theo (type,parent,q,as_of)
- [ ] Nhánh nhập tự do + nút "Lưu vào danh mục" (theo quyền)
- [ ] Mobile: touch target ≥40px, không phụ thuộc hover

## 3. Tiêu chí và kiểm chứng

- AC liên quan: **AC-10, AC-11, AC-12**
- Build web + mobile PASS; backend test trên PostgreSQL/Redis thật (không H2).
- Baseline + cách kiểm chứng ghi ở mục bàn giao khi hoàn thành.

| Kiểm tra / baseline / môi trường | Kết quả | Evidence |
| :--- | :--- | :--- |
| — | Not Run | Chưa triển khai (chờ gate scope) |

## 4. Bàn giao và lịch sử

Chưa bắt đầu — phụ thuộc gate [CONF-S05-001](../04_confirmation/01_CONF-S05-001_sprint_05_scope.md) và thiết kế đã review. Khi triển khai: ghi commit, số liệu đo và ảnh minh chứng.
