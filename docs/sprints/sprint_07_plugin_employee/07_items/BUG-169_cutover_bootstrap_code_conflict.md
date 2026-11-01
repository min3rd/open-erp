# [BUG-169] Cutover copy lỗi unique code khi plugin đã bootstrap HQ

| Trường | Giá trị |
| :--- | :--- |
| ID / loại / sprint | BUG-169 / Bug cutover / Sprint 07 |
| Mức độ / trạng thái | **High** / **Resolved (QA)** 2026-10-30 |
| Phát hiện bởi / ngày | QA/QC Agent / 2026-10-30 |
| Owner / reviewer | Developer / QA |
| Liên quan | [TASK-428](TASK-428_core_projection_security_cutover.md), `scripts/ops/org-cutover.mjs` |

## 1. Mô tả

Trên tenant đã cài `org-structure`, plugin bootstrap tạo branch/department `HQ` với UUID khác legacy. `copy` chỉ dùng `ON CONFLICT (id)` nên lỗi:

```text
duplicate key value violates unique constraint "uq_org_branch_code"
Key (tenant_id, code)=(..., HQ) already exists.
```

## 2. Cách sửa

Trước khi copy, reconcile theo `(tenant_id, code)`:
- Repoint departments/memberships/branch-access từ plugin UUID sang legacy UUID.
- Xóa row plugin trùng code, sau đó insert legacy row với UUID gốc.
- Làm tương tự cho department code (repoint parent/membership rồi xóa).

## 3. Kiểm chứng

- Chạy trên tenant dev thật `15a14e7f-...`: `copy` **PASS** branches 1/1, departments 1/1, memberships 1/1, branch access 1/1; projection scope=1, closure OK.
- Backup trước cutover lưu tại `evidence/s07_qa_real/cutover_backup/`.

## 4. Lịch sử

| Phiên bản | Ngày | Thay đổi | Nguồn |
| :--- | :--- | :--- | :--- |
| 0.1 | 2026-10-30 | QA cutover dev phát hiện unique code conflict | TR-S07-001 1.2 |
| 0.2 | 2026-10-30 | Reconcile theo code; cutover dev PASS | Developer/QA |
