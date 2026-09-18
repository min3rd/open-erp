# [BUG-02] Frontend Gọi Sai Endpoint Xác Thực 2FA Khi Đăng Nhập

- **Mã Lỗi**: BUG-02
- **Phân Loại**: Bug / Defect
- **Mức Độ Ưu Tiên**: [x] Critical / [ ] High / [ ] Medium / [ ] Low
- **Người Báo Cáo (Reporter)**: QA/QC Agent
- **Người Xử Lý (Assignee)**: Developer Agent
- **Thuộc Sprint**: Sprint 01
- **Trạng Thái**: [ ] To Do / [ ] In Progress / [ ] In Review / [x] Done / [ ] Deferred

---

## 1. Mô Tả Lỗi
> Frontend gọi sai đường dẫn API xác thực 2FA khi đăng nhập, dẫn đến lỗi 404 và không thể đăng nhập với tài khoản đã bật 2FA.

- **Môi trường**: Local
- **Tính năng / Module bị ảnh hưởng**: Đăng nhập với 2FA (FEAT-03, FEAT-05).
- **File liên quan**: `src/frontend/web/src/app/core/services/auth.service.ts:67` gọi `POST /api/v1/auth/2fa/verify`.
- **Tài liệu đối chiếu**: `src/backend/src/main/java/com/vn9melody/openerp/modules/iam/resource/AuthResource.java:99` (`/api/v1/auth/2fa/verify-login`) và DES-02 mục 2.6.

## 2. Các Bước Tái Hiện Lỗi (Steps to Reproduce)
1. Đăng nhập vào hệ thống, vào phần Account và bật 2FA (cài mã OTP).
2. Đăng xuất khỏi hệ thống.
3. Thực hiện đăng nhập lại bằng email/mật khẩu.
4. Nhập mã OTP 2FA tại màn hình xác thực.

## 3. Kết Quả Thực Tế (Actual Result)
- Request bị trả về `404 Not Found` do gọi sai endpoint `/api/v1/auth/2fa/verify`.
- Không thể đăng nhập khi tài khoản đã bật 2FA.

## 4. Kết Quả Kỳ Vọng (Expected Result)
- Frontend phải gọi đúng endpoint `POST /api/v1/auth/2fa/verify-login` theo DES-02 mục 2.6 và `AuthResource.java:99`, nhận `access_token` và chuyển vào dashboard thành công.

## 5. Log Lỗi / Hình Ảnh Đính Kèm (Stacktrace / Screenshots)
Không có.

## 6. Xác Nhận Khắc Phục (QA Verification)
- [x] Developer đã sửa xong.
- [x] QA đã re-test và xác nhận không còn lỗi.
- [x] Không gây lỗi phát sinh (Regression test pass).
- **Ghi chú QA (2026-09-18)**: Xác nhận bằng automated browser test (puppeteer: routing/deep-link 7/7, login + token cũ 3/3, form 2 bước + live slug check + 2FA redirect 6/6, console 0 lỗi), Mobile smoke 18/18 PASS, Web/Mobile build PASS; ảnh minh chứng tại docs/06_user_guides/assets/sprint_01_core_iam/. Nghiệm thu cuối của khách hàng thực hiện khi đóng Sprint.
