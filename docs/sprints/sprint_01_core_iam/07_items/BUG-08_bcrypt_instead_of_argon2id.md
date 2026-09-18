# [BUG-08] Dùng BCrypt Thay Vì Argon2id Để Băm Mật Khẩu

- **Mã Lỗi**: BUG-08
- **Phân Loại**: Bug / Defect
- **Mức Độ Ưu Tiên**: [x] Critical / [ ] High / [ ] Medium / [ ] Low
- **Người Báo Cáo (Reporter)**: QA/QC Agent
- **Người Xử Lý (Assignee)**: Developer Agent
- **Thuộc Sprint**: Sprint 01
- **Trạng Thái**: [x] To Do / [ ] In Progress / [ ] In Review / [ ] Done / [ ] Deferred

---

## 1. Mô Tả Lỗi
> Backend dùng BCrypt (jbcrypt) để băm mật khẩu, trái với quyết định kiến trúc đã chốt là dùng Argon2id là lựa chọn duy nhất.

- **Môi trường**: Local
- **Tính năng / Module bị ảnh hưởng**: Bảo mật mật khẩu — Core IAM (đăng ký, đăng nhập, đổi mật khẩu, đặt lại mật khẩu).
- **File liên quan**:
  - `src/backend/src/main/java/com/vn9melody/openerp/core/security/PasswordHashService.java:4,14` import và dùng `org.mindrot.jbcrypt.BCrypt`.
  - `src/backend/pom.xml:85-89` khai báo dependency `org.mindrot:jbcrypt`.
- **Tài liệu đối chiếu**: ANL-01 mục 3.1, SOL-01 mục 2.1 và CONF-01 mục 3 chốt **Argon2id là lựa chọn duy nhất, không dùng BCrypt**.

## 2. Các Bước Tái Hiện Lỗi (Steps to Reproduce)
1. Mở file `src/backend/src/main/java/com/vn9melody/openerp/core/security/PasswordHashService.java`.
2. Kiểm tra import và lời gọi `BCrypt.hashpw` / `BCrypt.checkpw`.
3. Kiểm tra dependency băm mật khẩu trong `src/backend/pom.xml`.

## 3. Kết Quả Thực Tế (Actual Result)
- `PasswordHashService` dùng `org.mindrot.jbcrypt.BCrypt` với `LOG_ROUNDS = 12`; `pom.xml:85-89` khai báo jbcrypt.
- Không có thư viện Argon2id trong dự án; mật khẩu người dùng được băm bằng thuật toán không đúng quy chuẩn bảo mật đã chốt.

## 4. Kết Quả Kỳ Vọng (Expected Result)
- `PasswordHashService` phải dùng Argon2id (ví dụ thư viện `de.mkammerer:argon2-jvm`) theo ANL-01 3.1, SOL-01 2.1 và CONF-01 mục 3; loại bỏ dependency jbcrypt và cập nhật test liên quan để xác nhận hash/verify hoạt động đúng.

## 5. Log Lỗi / Hình Ảnh Đính Kèm (Stacktrace / Screenshots)
Không có.

## 6. Xác Nhận Khắc Phục (QA Verification)
- [ ] Developer đã sửa xong.
- [ ] QA đã re-test và xác nhận không còn lỗi.
- [ ] Không gây lỗi phát sinh (Regression test pass).
