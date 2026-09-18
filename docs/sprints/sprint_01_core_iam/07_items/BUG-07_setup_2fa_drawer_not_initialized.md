# [BUG-07] Drawer Thiết Lập 2FA Không Khởi Tạo Và Thiếu QR/Sao Chép Secret

- **Mã Lỗi**: BUG-07
- **Phân Loại**: Bug / Defect
- **Mức Độ Ưu Tiên**: [x] Critical / [ ] High / [ ] Medium / [ ] Low
- **Người Báo Cáo (Reporter)**: QA/QC Agent
- **Người Xử Lý (Assignee)**: Developer Agent
- **Thuộc Sprint**: Sprint 01
- **Trạng Thái**: [ ] To Do / [ ] In Progress / [ ] In Review / [x] Done / [ ] Deferred

---

## 1. Mô Tả Lỗi
> Drawer thiết lập 2FA không bao giờ được khởi tạo do chỉ gọi `initSetup()` khi `isOpen()` trong `ngOnInit`, trong khi component được render thường trú; ngoài ra thiếu QR code và nút sao chép secret.

- **Môi trường**: Local
- **Tính năng / Module bị ảnh hưởng**: Bật 2FA và quản lý tài khoản (FEAT-05 AC1/AC2, FEAT-06 AC3).
- **File liên quan**:
  - `src/frontend/web/src/app/features/dashboard/account-drawer/setup-2fa-drawer.component.ts:46-50` chỉ gọi `initSetup()` trong `ngOnInit` khi `isOpen()`; component được render thường trú khi đóng tại `src/frontend/web/src/app/features/dashboard/account-drawer/account-drawer.component.html:293-297` nên không bao giờ init.
  - Template setup 2FA hiện chỉ in text `secret_key`/`qr_code_uri`, không render QR 140x140 và không có nút sao chép secret.
- **Tài liệu đối chiếu**: DES-03 mục 3.2.1/3.3.

## 2. Các Bước Tái Hiện Lỗi (Steps to Reproduce)
1. Đăng nhập và mở Drawer Quản lý tài khoản.
2. Bấm nút "Bật 2FA" để mở Drawer thiết lập.
3. Quan sát nội dung Drawer.

## 3. Kết Quả Thực Tế (Actual Result)
- Drawer thiết lập 2FA trống, không hiển thị secret/URI/QR vì `initSetup()` không bao giờ được gọi.
- Không có QR code 140x140 để quét và không có nút sao chép secret, trái DES-03 3.2.1/3.3.

## 4. Kết Quả Kỳ Vọng (Expected Result)
- Drawer phải tự khởi tạo khi được mở (ví dụ reactive effect theo `isOpen()`), hiển thị QR code 140x140, secret kèm nút sao chép và danh sách mã dự phòng theo DES-03 mục 3.2.1/3.3; người dùng bật 2FA thành công (FEAT-05 AC1/AC2, FEAT-06 AC3).

## 5. Log Lỗi / Hình Ảnh Đính Kèm (Stacktrace / Screenshots)
Không có.

## 6. Xác Nhận Khắc Phục (QA Verification)
- [x] Developer đã sửa xong.
- [x] QA đã re-test và xác nhận không còn lỗi.
- [x] Không gây lỗi phát sinh (Regression test pass).
- **Ghi chú QA (2026-09-18)**: Xác nhận bằng automated browser test (puppeteer: routing/deep-link 7/7, login + token cũ 3/3, form 2 bước + live slug check + 2FA redirect 6/6, console 0 lỗi), Mobile smoke 18/18 PASS, Web/Mobile build PASS; ảnh minh chứng tại docs/06_user_guides/assets/sprint_01_core_iam/. Nghiệm thu cuối của khách hàng thực hiện khi đóng Sprint.
