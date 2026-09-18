# [BUG-22] Đăng Ký Doanh Nghiệp Không Gửi Email Kích Hoạt, User Được Đặt ACTIVE Ngay

- **Mã Lỗi**: BUG-22
- **Phân Loại**: Bug / Defect
- **Mức Độ Ưu Tiên**: [ ] Critical / [x] High / [ ] Medium / [ ] Low
- **Người Báo Cáo (Reporter)**: QA/QC Agent
- **Người Xử Lý (Assignee)**: Developer Agent
- **Thuộc Sprint**: Sprint 01
- **Trạng Thái**: [ ] To Do / [ ] In Progress / [ ] In Review / [x] Done / [ ] Deferred

---

## 1. Mô Tả Lỗi
> Luồng đăng ký doanh nghiệp tạo user với trạng thái `ACTIVE` ngay lập tức và không gửi email kích hoạt/xác nhận workspace, trái với tiêu chí nghiệm thu FEAT-02 AC1 và xác nhận phạm vi CONF-01.

- **Môi trường**: Local
- **Tính năng / Module bị ảnh hưởng**: FEAT-02 (Đăng ký tài khoản quản trị doanh nghiệp), luồng email thông báo IAM
- **Tệp liên quan**: `src/backend/src/main/java/com/vn9melody/openerp/modules/iam/service/AuthService.java` - `registerBusiness()` dòng 147-154:
  - Dòng 152: `user.status = AccountStatus.ACTIVE;`
  - Dòng 153: `user.emailVerifiedAt = Instant.now();`
  - Không có lời gọi `EmailNotificationService` gửi email kích hoạt/xác nhận workspace sau khi tạo Tenant + User.
  - So sánh: luồng cá nhân có OTP xác thực email đầy đủ (xem `AuthService.java:100-120`).
- **Tài liệu đối chiếu**: [FEAT-02 - FEAT-02_business_registration.md](FEAT-02_business_registration.md) AC1 ("...gửi email kích hoạt"); [CONF-01 - CONF-01_sprint_01_scope.md](../04_confirmation/CONF-01_sprint_01_scope.md).

## 2. Các Bước Tái Hiện Lỗi (Steps to Reproduce)
1. Khởi chạy backend cùng PostgreSQL, Redis và Mailpit (profile mail) để bắt email.
2. Gọi `POST /api/v1/auth/register/business` (hoặc đăng ký qua giao diện) với thông tin Tenant + Admin hợp lệ.
3. Kiểm tra hộp thư Mailpit và log gửi mail của backend.
4. Truy vấn bản ghi `users` vừa tạo trong PostgreSQL, kiểm tra `status` và `email_verified_at`.

## 3. Kết Quả Thực Tế (Actual Result)
- Không có email kích hoạt/xác nhận workspace nào được gửi sau khi đăng ký doanh nghiệp.
- User được tạo với `status = ACTIVE` và `emailVerifiedAt = now()` ngay lập tức (không qua bước xác thực email như luồng cá nhân).
- Đăng nhập được ngay dù chưa có bất kỳ xác nhận nào từ email.

## 4. Kết Quả Kỳ Vọng (Expected Result)
- Sau transaction tạo Tenant + User + Role `TENANT_ADMIN`, hệ thống phải gửi email kích hoạt/xác nhận quyền truy cập workspace qua `EmailNotificationService` (dùng URL frontend nạp từ cấu hình `@ConfigProperty`, không hardcode).
- Trạng thái tài khoản phải thống nhất với FEAT-02 AC1 và luồng cá nhân (chờ xác thực trước khi ACTIVE hoặc cơ chế xác nhận workspace tương đương đã được khách hàng phê duyệt).
- Có test/kiểm thử xác nhận email được gửi và trạng thái đúng sau khi xác nhận.

## 5. Log Lỗi / Hình Ảnh Đính Kèm (Stacktrace / Screenshots)
- Không có

## 6. Xác Nhận Khắc Phục (QA Verification)
- [x] Developer đã sửa xong.
- [x] QA đã re-test và xác nhận không còn lỗi.
- [x] Không gây lỗi phát sinh (Regression test pass).
- **Ghi chú QA (2026-09-18)**: Xác nhận bằng automated test (`mvn test` BUILD SUCCESS, 22/22 test PASS trên PostgreSQL + Redis thật); mã test liên quan nằm trong `src/backend/src/test`; BUG-32 xác nhận bởi TC-14b, BUG-33 bởi TC-16.
