# [BUG-173] Plugin artifact mất sau khi recreate backend (local object storage)

| Trường | Giá trị |
| :--- | :--- |
| ID / loại / sprint | BUG-173 / Bug môi trường / Sprint 07 |
| Mức độ / trạng thái | **High** / **Resolved (QA)** 2026-10-30 |
| Phát hiện bởi / ngày | QA/QC Agent / 2026-10-30 |
| Owner / reviewer | Developer / QA |
| Liên quan | `docker-compose.yml`, `LocalObjectStorage` |

## 1. Mô tả

Sau khi recreate backend container, cài plugin cho tenant `minhvv` lỗi `STORAGE_OBJECT_NOT_FOUND`. Artifact bundle nằm trong `/tmp/openerp-object-storage` (ephemeral), mất khi container bị recreate dù version vẫn `PUBLISHED`.

## 2. Cách sửa

- Thêm named volume `openerp_backend_storage` mount tại `/tmp/openerp-object-storage`.
- Re-upload bundle và cập nhật `artifact_ref` cho version đã publish nếu artifact cũ đã mất.

## 3. Kiểm chứng

- Cài `org-structure` 1.0.0 + `employee` 1.0.4 cho tenant `minhvv` **ACTIVE**.
- Browser tenant `minhvv`: employee + organization screen PASS, 0 console error.

## 4. Lịch sử

| Phiên bản | Ngày | Thay đổi | Nguồn |
| :--- | :--- | :--- | :--- |
| 0.1 | 2026-10-30 | QA cài minhvv phát hiện artifact mất sau recreate | TR-S07-001 1.4 |
| 0.2 | 2026-10-30 | Thêm volume + re-upload; cài minhvv PASS | Developer/QA |
