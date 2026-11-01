# [BUG-172] Mobile route `/apps/:pluginKey` nằm sai dưới `/settings`

| Trường | Giá trị |
| :--- | :--- |
| ID / loại / sprint | BUG-172 / Bug mobile / Sprint 07 |
| Mức độ / trạng thái | **High** / **Resolved (QA)** 2026-10-30 |
| Phát hiện bởi / ngày | QA/QC Agent / 2026-10-30 |
| Owner / reviewer | Developer / QA |
| Liên quan | [TASK-436](TASK-436_employee_mobile_self_service.md), `app.routes.ts` |

## 1. Mô tả

Route plugin screen được khai báo trong children của `settings`, nên URL thật là `/settings/apps/:pluginKey`. Manifest và drawer dùng `/apps/employee`; deep link rơi vào wildcard → `/login`, dù user đã đăng nhập.

## 2. Cách sửa

Đưa `apps/:pluginKey` ra top-level, thêm `authGuard`. Drawer link `/apps/employee` hoạt động đúng.

## 3. Kiểm chứng

- Mobile Ionic 390×844: deep link `/apps/employee` render `op-employee-app` PASS.
- Không còn redirect login; 0 console error.

## 4. Lịch sử

| Phiên bản | Ngày | Thay đổi | Nguồn |
| :--- | :--- | :--- | :--- |
| 0.1 | 2026-10-30 | QA mobile phát hiện deep link plugin screen sai route | TR-S07-001 1.2 |
| 0.2 | 2026-10-30 | Move route top-level + authGuard; retest PASS | Developer/QA |
