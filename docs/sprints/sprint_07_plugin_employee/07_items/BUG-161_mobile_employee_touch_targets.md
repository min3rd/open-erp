# [BUG-161] Mobile touch target nhỏ hơn 40px trong Employee WC

| Trường | Giá trị |
| :--- | :--- |
| ID / loại / sprint | BUG-161 / Bug UI / Sprint 07 |
| Mức độ / trạng thái | **High** / **Resolved (QA)** 2026-10-30 |
| Phát hiện bởi / ngày | QA/QC Agent / 2026-10-30 |
| Owner / reviewer | Developer / QA |
| Liên quan | [TASK-435](TASK-435_employee_web_ui_admin_self_config.md), [TASK-436](TASK-436_employee_mobile_self_service.md), AC-19, `.agents/rules/agent_qa.md` |

## 1. Mô tả

Browser QA viewport 390×844 phát hiện nhiều control trong Employee WC chỉ cao 32px, thấp hơn ngưỡng touch target 40px:

- Tab `Hồ sơ của tôi` / `Danh sách nhân viên` (min-h-8).
- Input trong self request drawer.
- Nút `Rút đề xuất`.
- Nút `SharpButton` size `sm` (py-1 + text 11px ≈ 28px).

## 2. Cách sửa

- Employee WC: đổi toàn bộ `min-h-8` thành `min-h-10 sm:min-h-8` cho button/input/select/textarea.
- `SharpButtonComponent`: thêm `min-h-10 sm:min-h-0` vào base class để mọi nút đạt 40px trên mobile, vẫn giữ mật độ desktop.

## 3. Kiểm chứng

- Rebuild `employee-plugin`, `web`, `mobile` PASS.
- Browser script 390×844: tất cả `button/input/select/textarea/a` visible có height ≥ 40px → PASS.
- Ảnh: `08_testing/evidence/s07_qa/mobile_self_390x844.png`.
- 0 console error.

## 4. Lịch sử

| Phiên bản | Ngày | Thay đổi | Nguồn |
| :--- | :--- | :--- | :--- |
| 0.1 | 2026-10-30 | QA phát hiện touch target 32px | TR-S07-001 |
| 0.2 | 2026-10-30 | Fix responsive min-height; QA re-test PASS | Developer/QA |
