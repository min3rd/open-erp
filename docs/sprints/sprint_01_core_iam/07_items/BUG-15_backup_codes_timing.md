# [BUG-15] Backup Codes Trả Sai Thời Điểm: Xuất Ở /2fa/setup Thay Vì /2fa/enable

- **Mã Lỗi**: BUG-15
- **Phân Loại**: Bug / Defect
- **Mức Độ Ưu Tiên**: [ ] Critical / [x] High / [ ] Medium / [ ] Low
- **Người Báo Cáo (Reporter)**: QA/QC Agent
- **Người Xử Lý (Assignee)**: Developer Agent
- **Thuộc Sprint**: Sprint 01
- **Trạng Thái**: [x] To Do / [ ] In Progress / [ ] In Review / [ ] Done / [ ] Deferred

---

## 1. Mô Tả Lỗi
> Mô tả ngắn gọn hiện tượng lỗi xảy ra.

- `src/backend/src/main/java/com/vn9melody/openerp/modules/iam/service/TwoFactorService.java` phương thức `setup2Fa` (dòng 74-87): sinh 8 backup codes (dòng 74), **hash và lưu ngay ở bước setup** (dòng 80-85), rồi **trả luôn danh sách mã trong response** `TwoFactorSetupResponse(secretKey, qrCodeUri, backupCodes)` (dòng 87).
- **Tài liệu đối chiếu**: DES-02 (`../06_designs/api/CORE_IAM_API_SPEC.md`):
  - Mục 3.2.2: `POST /api/v1/account/2fa/setup` chỉ trả `secret_key` + `qr_code_uri`.
  - Mục 3.2.3: mã dự phòng chỉ được trả **một lần duy nhất** tại `POST /api/v1/account/2fa/enable`.
- `src/backend/src/main/java/com/vn9melody/openerp/modules/iam/dto/response/TwoFactorEnableResponse.java` hiện chỉ có `is_enabled` và `enabled_at`, **không có trường `backup_codes`** → đặt sai chỗ theo thiết kế.
- Frontend `src/frontend/shared/models/api.model.ts:60-64` (`TwoFactorSetupData`) vẫn khai báo `backup_codes: string[]` và `setup-2fa-drawer.component.html:52` hiển thị mã ngay ở bước setup.
- **Hậu Quả**: Người dùng nhận mã dự phòng trước khi 2FA thực sự được kích hoạt; nếu bỏ dở bước enable, hash backup codes vẫn tồn tại trong DB dù 2FA chưa bật; trải nghiệm và bảo mật lệch thiết kế đã xác nhận.
- **Môi trường**: Local
- **Tính Năng / Module bị ảnh hưởng**: Two-Factor Authentication / Account Management (FEAT-06)

## 2. Các Bước Tái Hiện Lỗi (Steps to Reproduce)
1. Đăng nhập và gọi `POST /api/v1/account/2fa/setup`.
2. Quan sát payload phản hồi.
3. Gọi `POST /api/v1/account/2fa/enable` với mã TOTP hợp lệ.
4. Quan sát payload phản hồi của bước enable.
5. Trên FE: mở drawer thiết lập 2FA, kiểm tra thời điểm 8 mã dự phòng được hiển thị.

## 3. Kết Quả Thực Tế (Actual Result)
- `POST /2fa/setup` trả về cả `backup_codes` (8 mã) và đã lưu hash vào `user_two_factor.backup_codes_hash` ngay từ bước setup.
- `POST /2fa/enable` chỉ trả `is_enabled`/`enabled_at`; FE hiển thị mã dự phòng ở bước setup.

## 4. Kết Quả Kỳ Vọng (Expected Result)
- Theo DES-02 mục 3.2.2, `/2fa/setup` chỉ trả `secret_key` và `qr_code_uri`, chưa sinh/lưu mã dự phòng. Theo DES-02 mục 3.2.3, `/2fa/enable` trả `backup_codes` một lần duy nhất và lưu hash vào thời điểm này; FE chỉ hiển thị mã ở bước enable. Ảnh hưởng FEAT-06 AC3.

## 5. Log Lỗi / Hình Ảnh Đính Kèm (Stacktrace / Screenshots)
Không có.

## 6. Xác Nhận Khắc Phục (QA Verification)
- [ ] Developer đã sửa xong.
- [ ] QA đã re-test và xác nhận không còn lỗi.
- [ ] Không gây lỗi phát sinh (Regression test pass).
