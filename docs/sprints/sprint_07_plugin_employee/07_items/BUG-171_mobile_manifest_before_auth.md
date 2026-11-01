# [BUG-171] Mobile gọi UI manifest trước đăng nhập gây 401 và logout

| Trường | Giá trị |
| :--- | :--- |
| ID / loại / sprint | BUG-171 / Bug mobile / Sprint 07 |
| Mức độ / trạng thái | **High** / **Resolved (QA)** 2026-10-30 |
| Phát hiện bởi / ngày | QA/QC Agent / 2026-10-30 |
| Owner / reviewer | Developer / QA |
| Liên quan | [TASK-436](TASK-436_employee_mobile_self_service.md), `PluginHostService` |

## 1. Mô tả

Mobile app khởi động gọi `GET /api/v1/plugins/ui-manifest` khi chưa có token → 401. `authInterceptor` không có refresh token nên xóa session và điều hướng `/login`, làm hỏng deep link `/apps/employee` dù localStorage còn token hợp lệ.

## 2. Cách sửa

Chỉ gọi `loadManifest()` trong `effect` khi `auth.isAuthenticated()` true; bỏ call vô điều kiện trong constructor.

## 3. Kiểm chứng

- Mobile Ionic 390×844: login → dashboard → mở plugin employee PASS.
- 0 console error; không còn request manifest 401.

## 4. Lịch sử

| Phiên bản | Ngày | Thay đổi | Nguồn |
| :--- | :--- | :--- | :--- |
| 0.1 | 2026-10-30 | QA mobile phát hiện manifest 401 trước login | TR-S07-001 1.2 |
| 0.2 | 2026-10-30 | Gate manifest theo auth; retest PASS | Developer/QA |
