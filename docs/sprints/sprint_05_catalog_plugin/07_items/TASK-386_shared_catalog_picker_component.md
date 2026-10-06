# [TASK-386] Component dùng chung `catalog-picker` (autocomplete + nhập tự do)

| Trường | Giá trị |
| :--- | :--- |
| ID / loại / sprint | TASK-386 / Task / Sprint 05 |
| Severity / trạng thái | High / **In Progress — code xong, test PASS (2026-10-06); chờ commit** |
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
| — | Not Run | Chưa triển khai (gate đã duyệt 2026-10-06) |

## 4. Bàn giao và lịch sử

**Tiến độ 2026-10-06**: component dùng chung `@shared/components/catalog-picker` (+ `.html` riêng) + `models/catalog.model.ts` + `services/catalog.service.ts` + 16 khoá i18n × 13 locale × 2 app. Kiểm chứng: `npm run i18n:check:strict` PASS (web 960/960, mobile 510/510), `npm run web:build` PASS (0 lỗi/0 cảnh báo), `npm run mobile:build` PASS. Hợp đồng input/output ghi ở DES-UI §3 (bản 0.2). Trạng thái: **code xong, build PASS — chờ commit**.

Gate [CONF-S05-001](../04_confirmation/01_CONF-S05-001_sprint_05_scope.md) **APPROVED 2026-10-06** — sẵn sàng triển khai. Khi hoàn thành: ghi commit, số liệu đo và ảnh minh chứng.
