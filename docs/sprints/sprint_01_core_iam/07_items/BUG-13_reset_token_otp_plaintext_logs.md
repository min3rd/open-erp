# [BUG-13] Token Reset Và OTP Lưu Plaintext, Ghi Lộ Ra Log Hệ Thống

- **Mã Lỗi**: BUG-13
- **Phân Loại**: Bug / Defect
- **Mức Độ Ưu Tiên**: [ ] Critical / [x] High / [ ] Medium / [ ] Low
- **Người Báo Cáo (Reporter)**: QA/QC Agent
- **Người Xử Lý (Assignee)**: Developer Agent
- **Thuộc Sprint**: Sprint 01
- **Trạng Thái**: [ ] To Do / [ ] In Progress / [ ] In Review / [x] Done / [ ] Deferred

---

## 1. Mô Tả Lỗi
> Mô tả ngắn gọn hiện tượng lỗi xảy ra.

- **Token reset mật khẩu lưu dạng raw**: `src/backend/src/main/java/com/vn9melody/openerp/modules/iam/service/AuthService.java:305` gán `prt.tokenHash = token;` — token thô được lưu thẳng vào cột `token_hash` của bảng reset token. ANL-01 (`../02_analysis/ANL-01_core_identity_access.md`) mục 3.4 yêu cầu **băm SHA-256** token trước khi lưu.
- **OTP xác thực email lưu plaintext trong DB**: cột `users.verification_otp` (`src/backend/src/main/resources/db/migration/V1.0.0__init_core_iam_schema.sql:28`) nhận giá trị thô từ `AuthService.java:58` (`user.verificationOtp = otp;`). DES-01 (`../06_designs/database/CORE_IAM_DATABASE_SCHEMA.md`) mục 4 quy định OTP phải lưu trên **Redis** kèm TTL, không lưu cột DB.
- **Ghi lộ thông tin xác thực ra log**: `src/backend/src/main/java/com/vn9melody/openerp/modules/iam/service/EmailNotificationService.java:21` log OTP (`LOG.infof("Sending verification OTP [%s] ...")`) và dòng 34 log reset token (`LOG.infof("... with token: %s", resetToken)`).
- **Rủi ro**: Bất kỳ ai đọc được CSDL hoặc file log (vận hành, backup, log tập trung) đều có thể dùng OTP/token để chiếm tài khoản.
- **Môi trường**: Local
- **Tính Năng / Module bị ảnh hưởng**: Email Verification & Forgot Password (FEAT-01, FEAT-04)

## 2. Các Bước Tái Hiện Lỗi (Steps to Reproduce)
1. Đăng ký tài khoản mới: `POST /api/v1/auth/register/personal` → OTP gửi qua email/log.
2. Quan sát console backend: OTP in rõ trong log.
3. Thực hiện `POST /api/v1/auth/forgot-password` → token reset in rõ trong log.
4. Truy vấn DB:
   - `SELECT verification_otp FROM users WHERE email = '<email>';`
   - `SELECT token_hash FROM password_reset_tokens ORDER BY created_at DESC LIMIT 1;`

## 3. Kết Quả Thực Tế (Actual Result)
- `users.verification_otp` chứa OTP plaintext; `token_hash` chứa đúng token thô đã gửi cho người dùng (không phải hash); log backend chứa cả OTP lẫn reset token.

## 4. Kết Quả Kỳ Vọng (Expected Result)
- Theo ANL-01 mục 3.4: token reset chỉ lưu dạng hash SHA-256 (so khớp bằng hash khi verify). Theo DES-01 mục 4: OTP lưu trên Redis kèm TTL, không nằm trong cột DB. Log hệ thống tuyệt đối không chứa OTP/token thô (mask hoặc chỉ log sự kiện gửi).

## 5. Log Lỗi / Hình Ảnh Đính Kèm (Stacktrace / Screenshots)
Không có.

## 6. Xác Nhận Khắc Phục (QA Verification)
- [x] Developer đã sửa xong.
- [x] QA đã re-test và xác nhận không còn lỗi.
- [x] Không gây lỗi phát sinh (Regression test pass).
- **Ghi chú QA (2026-09-18)**: Xác nhận bằng automated test (`mvn test` BUILD SUCCESS, 22/22 test PASS trên PostgreSQL + Redis thật); mã test liên quan nằm trong `src/backend/src/test`; BUG-32 xác nhận bởi TC-14b, BUG-33 bởi TC-16.
