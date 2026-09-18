# [BUG-12] Thiếu 3 Endpoint Auth: Refresh, Logout, Resend-Verification

- **Mã Lỗi**: BUG-12
- **Phân Loại**: Bug / Defect
- **Mức Độ Ưu Tiên**: [ ] Critical / [x] High / [ ] Medium / [ ] Low
- **Người Báo Cáo (Reporter)**: QA/QC Agent
- **Người Xử Lý (Assignee)**: Developer Agent
- **Thuộc Sprint**: Sprint 01
- **Trạng Thái**: [ ] To Do / [ ] In Progress / [ ] In Review / [x] Done / [ ] Deferred

---

## 1. Mô Tả Lỗi
> Mô tả ngắn gọn hiện tượng lỗi xảy ra.

- `src/backend/src/main/java/com/vn9melody/openerp/modules/iam/resource/AuthResource.java` (base `@Path("/api/v1/auth")`, dòng 20) hiện chỉ khai báo: `register/personal`, `verify-email`, `register/business`, `login`, `select-tenant`, `2fa/verify-login`, `forgot-password`, `reset-password`. **Thiếu 3 endpoint đã được xác nhận**:
  - `POST /api/v1/auth/refresh` — DES-02 (`../06_designs/api/CORE_IAM_API_SPEC.md`) mục 2.8.
  - `POST /api/v1/auth/logout` — DES-02 mục 2.9.
  - `POST /api/v1/auth/resend-verification` — DES-02 mục 2.10.
- `src/backend/src/main/java/com/vn9melody/openerp/core/api/ErrorCode.java:15` đã khai báo hằng `AUTH_LOGOUT_SUCCESS` nhưng **không được sử dụng ở bất kỳ đâu**.
- Frontend `src/frontend/web/src/app/core/services/auth.service.ts:93-101`: hàm `logout()` chỉ xóa `localStorage` (`openerp_token`, `openerp_session_id`, `openerp_user`) và điều hướng về `/login`, **không gọi API logout** → phiên phía server không bị hủy.
- **Tài liệu đối chiếu**: DES-02 mục 2.8/2.9/2.10; FEAT-03 (`FEAT-03_authentication_login.md`) TASK-112/113; FEAT-04 (`FEAT-04_forgot_password.md`).
- **Hậu Quả**: Token hết hạn không thể làm mới; không thể đăng xuất thực sự (phiên vẫn sống trên server); người dùng không thể yêu cầu gửi lại mã xác thực email.
- **Môi trường**: Local
- **Tính Năng / Module bị ảnh hưởng**: Authentication API (FEAT-03, FEAT-04)

## 2. Các Bước Tái Hiện Lỗi (Steps to Reproduce)
1. Khởi động backend local (`make backend`).
2. Kiểm tra danh sách route hoặc gọi lần lượt:
   - `POST /api/v1/auth/refresh`
   - `POST /api/v1/auth/logout`
   - `POST /api/v1/auth/resend-verification`
3. Trên FE: đăng nhập, bấm Đăng xuất, rồi dùng lại token cũ để gọi `GET /api/v1/account/profile`.

## 3. Kết Quả Thực Tế (Actual Result)
- Cả 3 endpoint trả `404 Not Found` (không tồn tại route).
- Sau khi "đăng xuất" trên FE, token/session cũ vẫn còn hiệu lực phía server, gọi API hồ sơ vẫn thành công.

## 4. Kết Quả Kỳ Vọng (Expected Result)
- Theo DES-02 mục 2.8/2.9/2.10: backend phải cung cấp đủ 3 endpoint với contract i18n code-driven tương ứng; `/logout` phải hủy phiên phía server và trả `AUTH_LOGOUT_SUCCESS`; FE `logout()` phải gọi API trước khi xóa trạng thái local.

## 5. Log Lỗi / Hình Ảnh Đính Kèm (Stacktrace / Screenshots)
Không có.

## 6. Xác Nhận Khắc Phục (QA Verification)
- [x] Developer đã sửa xong.
- [x] QA đã re-test và xác nhận không còn lỗi.
- [x] Không gây lỗi phát sinh (Regression test pass).
- **Ghi chú QA (2026-09-18)**: Xác nhận bằng automated browser test (puppeteer: routing/deep-link 7/7, login + token cũ 3/3, form 2 bước + live slug check + 2FA redirect 6/6, console 0 lỗi), Mobile smoke 18/18 PASS, Web/Mobile build PASS; ảnh minh chứng tại docs/06_user_guides/assets/sprint_01_core_iam/. Nghiệm thu cuối của khách hàng thực hiện khi đóng Sprint.
