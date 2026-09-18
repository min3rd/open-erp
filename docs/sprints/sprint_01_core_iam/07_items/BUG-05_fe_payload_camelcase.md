# [BUG-05] Frontend Gửi Payload CamelCase Trong Khi Backend Yêu Cầu Snake_case

- **Mã Lỗi**: BUG-05
- **Phân Loại**: Bug / Defect
- **Mức Độ Ưu Tiên**: [x] Critical / [ ] High / [ ] Medium / [ ] Low
- **Người Báo Cáo (Reporter)**: QA/QC Agent
- **Người Xử Lý (Assignee)**: Developer Agent
- **Thuộc Sprint**: Sprint 01
- **Trạng Thái**: [ ] To Do / [ ] In Progress / [ ] In Review / [x] Done / [ ] Deferred

---

## 1. Mô Tả Lỗi
> Frontend gửi payload dạng camelCase trong khi backend khai báo `@JsonProperty` snake_case, khiến các trường bắt buộc bị thiếu và request trả về `400 VALIDATION_FAILED`.

- **Môi trường**: Local
- **Tính năng / Module bị ảnh hưởng**: Đăng ký cá nhân, xác thực email OTP, đăng ký doanh nghiệp (FEAT-01, FEAT-02).
- **File liên quan**:
  - `src/frontend/web/src/app/core/services/auth.service.ts:34-36` gửi `fullName`, `phone` trong khi `src/backend/src/main/java/com/vn9melody/openerp/modules/iam/dto/PersonalRegisterRequest.java:11` yêu cầu `full_name`.
  - `src/frontend/web/src/app/core/services/auth.service.ts:38-40` gửi `otpCode` trong khi `src/backend/src/main/java/com/vn9melody/openerp/modules/iam/dto/VerifyEmailRequest.java` yêu cầu `otp_code`.
  - `src/frontend/web/src/app/features/auth/register-business/register-business.component.ts:73-86` gửi `admin.fullName`, `tenant.taxCode`, `tenant.companySize` trong khi backend `BusinessRegisterRequest.java` yêu cầu `full_name`, `tax_code`, `company_size`.
- **Tài liệu đối chiếu**: DES-02 mục 2.1/2.2/2.3.

## 2. Các Bước Tái Hiện Lỗi (Steps to Reproduce)
1. Truy cập trang đăng ký cá nhân và nhập đầy đủ họ tên, email, mật khẩu.
2. Bấm nút đăng ký.
3. Nhập mã OTP từ email để xác thực.
4. Truy cập trang đăng ký doanh nghiệp, nhập thông tin tenant và admin, bấm đăng ký.

## 3. Kết Quả Thực Tế (Actual Result)
- Hệ thống trả lỗi `400 VALIDATION_FAILED` do các trường bắt buộc (`full_name`, `otp_code`, `tax_code`, `company_size`) bị thiếu vì frontend gửi camelCase.
- Không thể đăng ký cá nhân, không thể xác thực email, không thể đăng ký doanh nghiệp.

## 4. Kết Quả Kỳ Vọng (Expected Result)
- Frontend phải gửi đúng key snake_case theo hợp đồng API tại DES-02 mục 2.1/2.2/2.3 (`full_name`, `otp_code`, `tax_code`, `company_size`), đăng ký và xác thực email thành công.

## 5. Log Lỗi / Hình Ảnh Đính Kèm (Stacktrace / Screenshots)
Không có.

## 6. Xác Nhận Khắc Phục (QA Verification)
- [x] Developer đã sửa xong.
- [x] QA đã re-test và xác nhận không còn lỗi.
- [x] Không gây lỗi phát sinh (Regression test pass).
- **Ghi chú QA (2026-09-18)**: Xác nhận bằng automated browser test (puppeteer: routing/deep-link 7/7, login + token cũ 3/3, form 2 bước + live slug check + 2FA redirect 6/6, console 0 lỗi), Mobile smoke 18/18 PASS, Web/Mobile build PASS; ảnh minh chứng tại docs/06_user_guides/assets/sprint_01_core_iam/. Nghiệm thu cuối của khách hàng thực hiện khi đóng Sprint.
