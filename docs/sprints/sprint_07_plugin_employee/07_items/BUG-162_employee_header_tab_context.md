# [BUG-162] Header Employee WC hiển thị sai ngữ cảnh tab

| Trường | Giá trị |
| :--- | :--- |
| ID / loại / sprint | BUG-162 / Bug UI / Sprint 07 |
| Mức độ / trạng thái | **Low** / **Resolved (QA)** 2026-10-30 |
| Phát hiện bởi / ngày | QA/QC Agent / 2026-10-30 |
| Owner / reviewer | Developer / QA |
| Liên quan | [TASK-435](TASK-435_employee_web_ui_admin_self_config.md), AC-19 |

## 1. Mô tả

Header luôn hiển thị subtitle `PLUGIN_EMPLOYEE_LIST` (“Danh sách nhân viên”) dù người dùng đang ở tab `Hồ sơ của tôi`, `Đề xuất`, `Danh bạ` hoặc `Cấu hình`. Trên mobile self-only, header gây hiểu nhầm là đang xem danh sách HR.

## 2. Cách sửa

Thêm getter `headerSubtitleKey` ánh xạ tab hiện tại sang key i18n tương ứng; template dùng getter thay vì hardcode `PLUGIN_EMPLOYEE_LIST`.

## 3. Kiểm chứng

- Browser desktop/mobile: subtitle đổi theo tab (`Hồ sơ của tôi`, `Đề xuất thay đổi`, `Danh bạ`, `Cấu hình duyệt`).
- Ảnh mobile: `08_testing/evidence/s07_qa/mobile_self_390x844.png` (subtitle “Hồ sơ của tôi”).
- Build PASS, 0 console error.

## 4. Lịch sử

| Phiên bản | Ngày | Thay đổi | Nguồn |
| :--- | :--- | :--- | :--- |
| 0.1 | 2026-10-30 | QA phát hiện subtitle sai tab | TR-S07-001 |
| 0.2 | 2026-10-30 | Fix getter + retest PASS | Developer/QA |
