# [TASK-403] Mobile plugin screen host + read-only UX

| Trường | Giá trị |
| :--- | :--- |
| ID / loại / sprint | TASK-403 / Task / Sprint 05 |
| Severity / trạng thái | High / **Done (dev+QA)** 2026-10-28 — mobile plugin host + read-only PASS |
| Owner / reviewer | Developer (mobile) / QA + Architect |
| depends_on / blocks | TASK-397, TASK-399 / TASK-398, đóng Sprint 05 |
| Write scope | `src/frontend/mobile/src/app/pages/settings/catalog/**`, `src/frontend/mobile/src/app/app.routes.ts`, `plugins/catalog/web/**` |

## 1. Mục tiêu

Mobile mở màn catalog bằng **plugin UI từ manifest** (IFRAME, `read_only`) như ADR-S05-001 A10, thay vì page native; giữ touch target ≥ 40px, không tràn ngang, token tự làm mới và logout khi hết phiên.

## 2. Hiện trạng

- Web đã dùng `PluginScreenHostComponent` + iframe plugin, PASS.
- Mobile vẫn dùng page native `CatalogBrowsePage` gọi gateway; trái AC "UI tải từ manifest plugin" của BUG-135.
- Thử nghiệm iframe trên mobile cho thấy plugin UI hiển thị đúng dữ liệu/i18n (sau khi bundle thêm `i18n/`), nhưng còn:
  - Nút hành động admin hiện vì user có quyền quản lý; cần chế độ `read_only` từ manifest.
  - Touch target của toolbar/nút nhỏ < 40px.
  - Token hết hạn phải refresh/reload, fallback logout.

## 3. Việc phải làm

- [x] Mobile host page nhận `pluginKey` + `render_mode=IFRAME` (từ manifest hoặc route config), lấy runtime token qua `/api/v1/plugins/session-token` với `environment.apiBaseUrl`.
- [x] Truyền `readonly=1` khi screen `read_only`; plugin UI ẩn toàn bộ hành động ghi (import/export, thêm/sửa/đóng, grant, menu chuột phải) và chỉ giữ browse/filter/detail.
- [x] Bắt `session-expired`, refresh token một lần rồi reload giữ route; thất bại → `AuthService.clearSession()`.
- [x] Đảm bảo iframe full viewport dưới header Ionic, safe-area, 0 overflow ngang.
- [x] Kiểm tra touch target ≥ 40px cho control còn lại; bổ sung CSS mobile trong plugin bundle.
- [x] QA 390×844: 0 console error, ảnh evidence; cập nhật TR-S05-001 và BUG-135.

## 4. Tiêu chí nghiệm thu

- Mobile `/settings/catalog` render UI plugin từ iframe; không còn page native catalog.
- Read-only: không thấy nút tạo/sửa/xoá/import ở tài khoản chỉ có `catalog:item:read` (và cả tenant admin trên mobile).
- 390×844: overflow ngang = 0; touch target ≥ 40px; 0 console error; ảnh minh chứng.
- Hết hạn plugin token: tự refresh + reload; refresh lỗi → về `/login`.

## 5. Lịch sử

| Phiên bản | Ngày | Thay đổi | Nguồn |
| :--- | :--- | :--- | :--- |
| 0.1 | 2026-10-28 | Tạo task sau QA P5: mobile vẫn native, chưa đạt AC UI manifest/read-only | QA/Developer |
| 0.2 | 2026-10-28 | Done (dev+QA): mobile iframe host + token refresh; plugin `readonly=1` ẩn write actions; CSS touch ≥40px; QA 390×844 PASS | Developer/QA |
