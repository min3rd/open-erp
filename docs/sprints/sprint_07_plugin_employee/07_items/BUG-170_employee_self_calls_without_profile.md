# [BUG-170] Employee WC gọi self API cho tài khoản không có hồ sơ

| Trường | Giá trị |
| :--- | :--- |
| ID / loại / sprint | BUG-170 / Bug UI / Sprint 07 |
| Mức độ / trạng thái | **Medium** / **Resolved (QA)** 2026-10-30 |
| Phát hiện bởi / ngày | QA/QC Agent / 2026-10-30 |
| Owner / reviewer | Developer / QA |
| Liên quan | [TASK-435](TASK-435_employee_web_ui_admin_self_config.md) |

## 1. Mô tả

Tenant admin chưa liên kết hồ sơ nhân viên mở Employee WC: UI gọi `/me`, `/me/change-requests`, `/me/documents` song song → 3 × 404 và console error, dù màn HR vẫn dùng được.

## 2. Cách sửa

- Chỉ tải `myChangeRequests`/`myDocuments` sau khi `/me` trả profile thành công.
- Giữ `/me` 404 là trạng thái “không có hồ sơ”; không gọi thêm self API.

## 3. Kiểm chứng

- Browser app thật: tài khoản admin không có hồ sơ chỉ còn 1 request `/me` (không gọi self list).
- Sau khi liên kết hồ sơ, self tab/tài liệu tải bình thường; 0 console error.

## 4. Lịch sử

| Phiên bản | Ngày | Thay đổi | Nguồn |
| :--- | :--- | :--- | :--- |
| 0.1 | 2026-10-30 | QA app thật phát hiện 404 self calls | TR-S07-001 1.2 |
| 0.2 | 2026-10-30 | Gate self load sau /me; retest PASS | Developer/QA |
