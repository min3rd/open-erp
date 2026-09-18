# [BUG-14] 2FA Thiếu Đếm Số Lần Nhập Sai Và Khóa; Pre-Auth Token Không Kiểm Tra Type

- **Mã Lỗi**: BUG-14
- **Phân Loại**: Bug / Defect
- **Mức Độ Ưu Tiên**: [ ] Critical / [x] High / [ ] Medium / [ ] Low
- **Người Báo Cáo (Reporter)**: QA/QC Agent
- **Người Xử Lý (Assignee)**: Developer Agent
- **Thuộc Sprint**: Sprint 01
- **Trạng Thái**: [ ] To Do / [ ] In Progress / [ ] In Review / [x] Done / [ ] Deferred

---

## 1. Mô Tả Lỗi
> Mô tả ngắn gọn hiện tượng lỗi xảy ra.

- **Không đếm số lần sai 2FA, không khóa, không hủy pre-auth token**: `src/backend/src/main/java/com/vn9melody/openerp/modules/iam/service/TwoFactorService.java` phương thức `verifyLogin2Fa` (dòng 171-189) khi mã sai chỉ ném `AUTH_2FA_CODE_INVALID` (dòng 184); không lưu/đếm số lần thất bại, không kích hoạt khóa sau 3 lần sai, và không vô hiệu hóa `pre_auth_token` sau khi thất bại.
- **Pre-auth token không kiểm tra loại/purpose**: `src/backend/src/main/java/com/vn9melody/openerp/modules/iam/resource/AuthResource.java:129-137` phương thức `parseUserIdFromPreAuthToken` chỉ đọc `sub` từ JWT rồi trả `UUID`; **không kiểm tra claim `type`/`purpose`** → bất kỳ JWT hợp lệ nào có `sub` là UUID (kể cả access token thường) đều dùng được cho `/select-tenant` (dòng 88) và `/2fa/verify-login` (dòng 101).
- **Tài liệu đối chiếu**:
  - CONF-01 (`../04_confirmation/CONF-01_sprint_01_scope.md`) mục 3: khóa sau 3 lần nhập sai mã 2FA.
  - FEAT-05 (`FEAT-05_two_factor_auth.md`) AC3.
  - DES-02 (`../06_designs/api/CORE_IAM_API_SPEC.md`) mục 2.6: trả `AUTH_2FA_ATTEMPTS_EXCEEDED`.
  - `src/backend/src/main/java/com/vn9melody/openerp/core/api/ErrorCode.java:24` đã khai báo `AUTH_2FA_ATTEMPTS_EXCEEDED` nhưng **không được sử dụng**.
- **Rủi ro**: Brute-force mã TOTP/backup code không giới hạn; lạm dụng pre-auth token sai mục đích để vượt luồng xác thực.
- **Môi trường**: Local
- **Tính Năng / Module bị ảnh hưởng**: Two-Factor Authentication (FEAT-05)

## 2. Các Bước Tái Hiện Lỗi (Steps to Reproduce)
1. Chuẩn bị tài khoản đã bật 2FA; đăng nhập để nhận `pre_auth_token`.
2. Gọi `POST /api/v1/auth/2fa/verify-login` với mã TOTP sai **hơn 3 lần liên tiếp**.
3. Quan sát phản hồi và khả năng tiếp tục thử.
4. Lấy một access token thường (không phải pre-auth token) và gọi `POST /api/v1/auth/select-tenant` với chính token đó ở trường `preAuthToken`.

## 3. Kết Quả Thực Tế (Actual Result)
- Sau hơn 3 lần sai, hệ thống vẫn trả `AUTH_2FA_CODE_INVALID` và cho phép thử vô hạn; không có khóa, không trả `AUTH_2FA_ATTEMPTS_EXCEEDED`; `pre_auth_token` vẫn dùng được.
- Access token thường có `sub` hợp lệ vẫn được `parseUserIdFromPreAuthToken` chấp nhận cho luồng select-tenant/2FA.

## 4. Kết Quả Kỳ Vọng (Expected Result)
- Theo CONF-01 mục 3, FEAT-05 AC3 và DES-02 mục 2.6: đếm số lần sai, khóa xác thực 2FA sau 3 lần và trả `AUTH_2FA_ATTEMPTS_EXCEEDED`; hủy `pre_auth_token` sau khi vượt ngưỡng. Token pre-auth phải được kiểm tra claim `type`/`purpose` trước khi chấp nhận.

## 5. Log Lỗi / Hình Ảnh Đính Kèm (Stacktrace / Screenshots)
Không có.

## 6. Xác Nhận Khắc Phục (QA Verification)
- [x] Developer đã sửa xong.
- [x] QA đã re-test và xác nhận không còn lỗi.
- [x] Không gây lỗi phát sinh (Regression test pass).
- **Ghi chú QA (2026-09-18)**: Xác nhận bằng automated test (`mvn test` BUILD SUCCESS, 22/22 test PASS trên PostgreSQL + Redis thật); mã test liên quan nằm trong `src/backend/src/test`; BUG-32 xác nhận bởi TC-14b, BUG-33 bởi TC-16.
