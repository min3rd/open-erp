# [BUG-17] Frontend Thiếu Auth Guard, HTTP Interceptor và Route Deep-Link Xác Thực

- **Mã Lỗi**: BUG-17
- **Phân Loại**: Bug / Defect
- **Mức Độ Ưu Tiên**: [ ] Critical / [x] High / [ ] Medium / [ ] Low
- **Người Báo Cáo (Reporter)**: QA/QC Agent
- **Người Xử Lý (Assignee)**: Developer Agent
- **Thuộc Sprint**: Sprint 01
- **Trạng Thái**: [x] To Do / [ ] In Progress / [ ] In Review / [ ] Done / [ ] Deferred

---

## 1. Mô Tả Lỗi
> Frontend Angular 22 thiếu lớp bảo vệ điều hướng (Auth Guard) và HTTP Interceptor xử lý token, đồng thời thiếu các route deep-link phục vụ xác thực email / chọn Tenant / nhập 2FA.

- **Môi trường**: Local
- **Tính năng / Module bị ảnh hưởng**: FEAT-03 (Đăng nhập & Xác định ngữ cảnh Tenant), toàn bộ luồng xác thực Web
- **Tệp liên quan**:
  - `src/frontend/web/src/app/app.routes.ts` (dòng 3-37): không có `canActivate`/guard nào; route `/dashboard` (dòng 29-32) được nạp trực tiếp, không kiểm tra đăng nhập.
  - `src/frontend/web/src/app/app.config.ts:11`: chỉ gọi `provideHttpClient()` mà không đăng ký `withInterceptors(...)`.
  - `src/frontend/web/src/app/core/services/api.service.ts:52-61`: hàm `handleError` chỉ chuyển tiếp `code`/`message`, không bắt 401 và không tự refresh token.
  - Không tồn tại route `/verify-email`, `/select-tenant`, `/auth/2fa` để deep-link từ email kích hoạt/OTP (DES-03 mục 2.3 quy định màn hình `/auth/2fa`).
- **Tài liệu đối chiếu**: [DES-03 - CORE_IAM_UI_SPEC.md](../06_designs/ui_ux/CORE_IAM_UI_SPEC.md) mục 2.3; [FEAT-03 - FEAT-03_authentication_login.md](FEAT-03_authentication_login.md); [DES-02 - CORE_IAM_API_SPEC.md](../06_designs/api/CORE_IAM_API_SPEC.md) (API `/api/v1/auth/refresh`).

## 2. Các Bước Tái Hiện Lỗi (Steps to Reproduce)
1. Khởi chạy Web (`http://localhost:4200`) trong cửa sổ ẩn danh, đảm bảo `localStorage` không có `openerp_token`.
2. Truy cập trực tiếp URL `http://localhost:4200/dashboard`.
3. Quan sát màn hình Dashboard hiển thị dù chưa đăng nhập.
4. Xóa token trong `localStorage` (hoặc chờ Access Token hết hạn 15 phút) rồi thao tác gọi API tài khoản, quan sát không có cơ chế refresh token.
5. Mở link deep-link dạng `/verify-email?token=...`, `/select-tenant` hoặc `/auth/2fa`.

## 3. Kết Quả Thực Tế (Actual Result)
- `/dashboard` truy cập tự do không cần token, không bị chuyển hướng về `/login`.
- Khi API trả 401, frontend chỉ nhận `ApiErrorResponse` và hiển thị lỗi, không tự động refresh token cũng không đăng xuất.
- Các URL deep-link `/verify-email`, `/select-tenant`, `/auth/2fa` bị route wildcard `**` (dòng 33-36) chuyển hết về `/login`, người dùng không thể hoàn tất xác thực từ email.

## 4. Kết Quả Kỳ Vọng (Expected Result)
- Route private phải được bọc Auth Guard: chưa đăng nhập thì chuyển hướng `/login` kèm `returnUrl`.
- HTTP Interceptor tự gắn `Authorization: Bearer <token>`; khi gặp 401 phải gọi `/api/v1/auth/refresh` để cấp lại Access Token hoặc đăng xuất an toàn.
- Cung cấp đầy đủ route `/verify-email`, `/select-tenant`, `/auth/2fa` theo đặc tả DES-03 mục 2.3 để hỗ trợ deep-link từ email.

## 5. Log Lỗi / Hình Ảnh Đính Kèm (Stacktrace / Screenshots)
- Không có

## 6. Xác Nhận Khắc Phục (QA Verification)
- [ ] Developer đã sửa xong.
- [ ] QA đã re-test và xác nhận không còn lỗi.
- [ ] Không gây lỗi phát sinh (Regression test pass).
