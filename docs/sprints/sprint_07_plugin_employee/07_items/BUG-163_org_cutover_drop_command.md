# [BUG-163] `org-cutover drop-legacy` không chạy do sai tên command

| Trường | Giá trị |
| :--- | :--- |
| ID / loại / sprint | BUG-163 / Bug vận hành / Sprint 07 |
| Mức độ / trạng thái | **High** / **Resolved (QA)** 2026-10-30 |
| Phát hiện bởi / ngày | QA/QC Agent / 2026-10-30 |
| Owner / reviewer | Developer / QA |
| Liên quan | [TASK-428](TASK-428_core_projection_security_cutover.md), `scripts/ops/org-cutover.mjs` |

## 1. Mô tả

QA chạy cutover E2E trên database tạm `openerp_cutover_test`. `copy`/`verify` PASS, nhưng `drop-legacy --confirm DROP-LEGACY` in usage và exit 1:

```text
[org-cutover] usage: org-cutover.mjs status|backup|copy|verify|drop-legacy --tenant <uuid>
```

Nguyên nhân: handler map khai báo `dropLegacy` thay vì key `'drop-legacy'`, nên command line không tìm thấy handler.

## 2. Cách sửa

Đổi `handlers` thành `{ status, backup, copy, verify, 'drop-legacy': dropLegacy }`.

## 3. Kiểm chứng

- Cutover E2E trên `openerp_cutover_test`:
  - `copy`: branches 1/1, departments 2/2, memberships 2/2, branch access 1/1, projection 2 users, closure 3, manager edge 1.
  - `drop-legacy --confirm DROP-LEGACY`: PASS; legacy `branches` = null; projection vẫn 2 rows.
  - Kết quả cuối: `CUTOVER E2E PASS`.
- Database tạm đã drop sau test; không ảnh hưởng `openerp_dev`.

## 4. Lịch sử

| Phiên bản | Ngày | Thay đổi | Nguồn |
| :--- | :--- | :--- | :--- |
| 0.1 | 2026-10-30 | QA phát hiện command drop-legacy lỗi | TR-S07-001 |
| 0.2 | 2026-10-30 | Fix handler key; cutover E2E PASS | Developer/QA |
