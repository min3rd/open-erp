# [BUG-09] TOTP Secret Lưu Dạng Plaintext Trong Cơ Sở Dữ Liệu

- **Mã Lỗi**: BUG-09
- **Phân Loại**: Bug / Defect
- **Mức Độ Ưu Tiên**: [x] Critical / [ ] High / [ ] Medium / [ ] Low
- **Người Báo Cáo (Reporter)**: QA/QC Agent
- **Người Xử Lý (Assignee)**: Developer Agent
- **Thuộc Sprint**: Sprint 01
- **Trạng Thái**: [x] To Do / [ ] In Progress / [ ] In Review / [ ] Done / [ ] Deferred

---

## 1. Mô Tả Lỗi
> Mô tả ngắn gọn hiện tượng lỗi xảy ra.

- Tại `src/backend/src/main/java/com/vn9melody/openerp/modules/iam/service/TwoFactorService.java:102`, phương thức `enable2Fa` gán trực tiếp `twoFactor.secretKeyEnc = twoFactor.tempSecretKey;` → Secret TOTP được lưu nguyên bản (plaintext) vào cột `secret_key_enc` của bảng `user_two_factor`, không qua bất kỳ bước mã hóa nào.
- **Tài liệu đối chiếu**:
  - SOL-01 (`../05_solutions/SOL-01_core_identity_architecture.md`) mục 2.2: yêu cầu mã hóa secret TOTP bằng **AES-256-GCM** trước khi lưu.
  - ANL-01 (`../02_analysis/ANL-01_core_identity_access.md`) mục 3.6: yêu cầu secret chỉ được lưu dưới dạng đã mã hóa.
- **Rủi ro**: Chỉ cần rò rỉ bản sao CSDL (backup, SQL injection, lộ quyền đọc), kẻ tấn công trích xuất được secret và tự sinh mã TOTP hợp lệ → chiếm đoạt hoàn toàn lớp xác thực 2FA.
- **Môi trường**: Local
- **Tính Năng / Module bị ảnh hưởng**: Two-Factor Authentication (FEAT-05)

## 2. Các Bước Tái Hiện Lỗi (Steps to Reproduce)
1. Khởi động hạ tầng và backend local (`make infra`, `make backend`).
2. Đăng nhập, gọi `POST /api/v1/account/2fa/setup` để nhận `secret_key` và `qr_code_uri`.
3. Gọi `POST /api/v1/account/2fa/enable` với mã TOTP hợp lệ để kích hoạt 2FA.
4. Truy vấn trực tiếp PostgreSQL: `SELECT secret_key_enc FROM user_two_factor WHERE user_id = '<user_id>';`

## 3. Kết Quả Thực Tế (Actual Result)
- Cột `secret_key_enc` chứa chuỗi Base32 secret nguyên bản, trùng khớp 100% với `secret_key` đã trả ở bước setup; có thể dùng ngay để sinh mã TOTP mà không cần bất kỳ khóa giải mã nào.

## 4. Kết Quả Kỳ Vọng (Expected Result)
- Theo SOL-01 mục 2.2 và ANL-01 mục 3.6, cột `secret_key_enc` phải chứa ciphertext AES-256-GCM (kèm IV/tag) được mã hóa bằng khóa quản lý tập trung; không thể khôi phục secret nếu chỉ có dữ liệu CSDL.

## 5. Log Lỗi / Hình Ảnh Đính Kèm (Stacktrace / Screenshots)
Không có.

## 6. Xác Nhận Khắc Phục (QA Verification)
- [ ] Developer đã sửa xong.
- [ ] QA đã re-test và xác nhận không còn lỗi.
- [ ] Không gây lỗi phát sinh (Regression test pass).
