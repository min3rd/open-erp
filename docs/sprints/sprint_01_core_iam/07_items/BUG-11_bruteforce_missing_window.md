# [BUG-11] Chống Brute-Force Thiếu Cửa Sổ Thời Gian 5 Lần / 10 Phút

- **Mã Lỗi**: BUG-11
- **Phân Loại**: Bug / Defect
- **Mức Độ Ưu Tiên**: [ ] Critical / [x] High / [ ] Medium / [ ] Low
- **Người Báo Cáo (Reporter)**: QA/QC Agent
- **Người Xử Lý (Assignee)**: Developer Agent
- **Thuộc Sprint**: Sprint 01
- **Trạng Thái**: [ ] To Do / [ ] In Progress / [ ] In Review / [x] Done / [ ] Deferred

---

## 1. Mô Tả Lỗi
> Mô tả ngắn gọn hiện tượng lỗi xảy ra.

- Trong `src/backend/src/main/java/com/vn9melody/openerp/core/security/BruteForceService.java:47-61`, phương thức `recordFailedAttempt` chỉ tăng lũy kế `tracker.attempts++`; bộ đếm **chỉ reset** khi đăng nhập đúng (`resetAttempts`) hoặc khi khóa hết hạn trong `isLocked` (dòng 26-35).
- Trường `lastAttempt` được gán tại dòng 55 nhưng **không bao giờ được đọc/so sánh** → không tồn tại cửa sổ trượt "5 lần sai trong 10 phút" theo yêu cầu.
- Các cột `user_credentials.failed_login_count` và `user_credentials.locked_until` đã được tạo trong migration `src/backend/src/main/resources/db/migration/V1.0.0__init_core_iam_schema.sql:54-55` nhưng **bị bỏ không dùng**, nên trạng thái khóa cũng không được bền vững hóa.
- **Tài liệu đối chiếu**:
  - ANL-01 (`../02_analysis/ANL-01_core_identity_access.md`) mục 3.3: quy tắc 5 lần sai trong cửa sổ 10 phút.
  - FEAT-03 (`FEAT-03_authentication_login.md`) AC4: khóa tạm thời khi vượt ngưỡng trong cửa sổ thời gian.
- **Hậu Quả**: 5 lần nhập sai rải rác trong nhiều tháng vẫn cộng dồn và kích hoạt khóa 15 phút một cách oan uổng; ngược lại kẻ tấn công dò mật khẩu chậm rãi có thể lách ngưỡng.
- **Môi trường**: Local
- **Tính Năng / Module bị ảnh hưởng**: Authentication / Anti-Brute-Force (FEAT-03)

## 2. Các Bước Tái Hiện Lỗi (Steps to Reproduce)
1. Khởi động backend local và chuẩn bị tài khoản test đang ACTIVE.
2. Gọi `POST /api/v1/auth/login` với mật khẩu sai 1 lần; chờ vượt mốc 10 phút (có thể chỉnh `MAX_ATTEMPTS`/thời gian để test nhanh).
3. Lặp lại bước 2 tổng cộng 5 lần, mỗi lần cách nhau hơn 10 phút.
4. Thử đăng nhập với mật khẩu **đúng**.

## 3. Kết Quả Thực Tế (Actual Result)
- Tài khoản vẫn bị khóa `AUTH_ACCOUNT_LOCKED` dù 5 lần sai nằm rải rác ngoài cửa sổ 10 phút; số đếm không bao giờ tự hết hạn theo thời gian.
- Giá trị `failed_login_count`, `locked_until` trong `user_credentials` luôn là mặc định (0/NULL), không phản ánh trạng thái thực tế.

## 4. Kết Quả Kỳ Vọng (Expected Result)
- Theo ANL-01 mục 3.3 và FEAT-03 AC4, chỉ các lần sai trong cửa sổ 10 phút gần nhất mới được tính; quá 10 phút kể từ lần sai trước đó thì bộ đếm phải được đặt lại; trạng thái khóa phải lưu bền vững và kiểm tra theo `locked_until`.

## 5. Log Lỗi / Hình Ảnh Đính Kèm (Stacktrace / Screenshots)
Không có.

## 6. Xác Nhận Khắc Phục (QA Verification)
- [x] Developer đã sửa xong.
- [x] QA đã re-test và xác nhận không còn lỗi.
- [x] Không gây lỗi phát sinh (Regression test pass).
- **Ghi chú QA (2026-09-18)**: Xác nhận bằng automated test (`mvn test` BUILD SUCCESS, 22/22 test PASS trên PostgreSQL + Redis thật); mã test liên quan nằm trong `src/backend/src/test`; BUG-32 xác nhận bởi TC-14b, BUG-33 bởi TC-16.
