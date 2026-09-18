# [BUG-46] Drawer Tắt 2FA Dùng Nhầm Key i18n Cảnh Báo Sai Ngữ Cảnh

- **Mã Lỗi**: BUG-46
- **Phân Loại**: Bug / Defect
- **Mức Độ Ưu Tiên**: [ ] Critical / [ ] High / [x] Medium / [ ] Low
- **Người Báo Cáo (Reporter)**: QA/QC Agent
- **Người Xử Lý (Assignee)**: Developer Agent
- **Thuộc Sprint**: Sprint 01
- **Trạng Thái**: [ ] To Do / [ ] In Progress / [ ] In Review / [x] Done / [ ] Deferred

---

## 1. Mô Tả Lỗi
> Hộp cảnh báo trong Drawer tắt 2FA dùng key `ACCOUNT_2FA_DESC_DISABLED` ("Bảo mật 2 lớp đang TẮT...") vốn mô tả trạng thái 2FA đang tắt, sai hoàn toàn ngữ cảnh khi người dùng đang bật 2FA và chuẩn bị tắt.

- **Môi trường**: Local (browser manual test)
- **Tính Năng / Module Bị Ảnh Hưởng**: Quản lý tài khoản — Drawer Xóa/Tắt 2FA (FEAT-06).
- **File Liên Quan**:
  - `src/frontend/web/src/app/features/dashboard/account-drawer/disable-2fa-drawer.component.html:10` — `[appTranslate]="'ACCOUNT_2FA_DESC_DISABLED'"`.
  - `src/frontend/web/public/i18n/vi.json:111` / `en.json:111` — nội dung key cũ nói 2FA "đang TẮT".
  - Bằng chứng ảnh: `docs/06_user_guides/assets/sprint_01_core_iam/20-disable-2fa.png`.
- **Tài Liệu Đối Chiếu**: AGENTS.md — "Bắt buộc 100% Đa Ngôn Ngữ (Zero-Hardcode Strings)"; DES-03 — ngữ cảnh Drawer tắt 2FA phải cảnh báo giảm mức bảo vệ.

## 2. Các Bước Tái Hiện Lỗi (Steps to Reproduce)
1. Đăng nhập tài khoản đang bật 2FA.
2. Mở Quản lý tài khoản → tab Bảo mật → bấm "Tắt 2FA".
3. Quan sát hộp cảnh báo màu vàng ở đầu Drawer.

## 3. Kết Quả Thực Tế (Actual Result)
- Hộp cảnh báo hiển thị "Bảo mật 2 lớp đang TẮT. Hãy kích hoạt để tăng cường bảo vệ..." — vô nghĩa vì 2FA đang BẬT và người dùng đang tắt nó.
- Bằng chứng: ảnh `20-disable-2fa.png` chụp đúng trạng thái sai.

## 4. Kết Quả Kỳ Vọng (Expected Result)
- Sử dụng key riêng cho ngữ cảnh tắt 2FA, ví dụ `ACCOUNT_2FA_DISABLE_WARNING`, với nội dung cảnh báo giảm mức bảo vệ an toàn.
- Key có đủ bản dịch `vi`/`en`; không tái sử dụng key mô tả trạng thái `ACCOUNT_2FA_DESC_DISABLED`.

## 5. Log Lỗi / Hình Ảnh Đính Kèm (Stacktrace / Screenshots)
```
disable-2fa-drawer.component.html:10 -> ACCOUNT_2FA_DESC_DISABLED
vi.json:111 "Bảo mật 2 lớp đang TẮT. Hãy kích hoạt để tăng cường bảo vệ an toàn cho tài khoản."
Ảnh: docs/06_user_guides/assets/sprint_01_core_iam/20-disable-2fa.png
```

## 6. Xác Nhận Khắc Phục (QA Verification)
- [x] Developer đã sửa xong (thêm key `ACCOUNT_2FA_DISABLE_WARNING` vào `vi.json`/`en.json` Web — và Mobile — đồng thời đổi `disable-2fa-drawer.component.html:10` sang dùng đúng key).
- [x] QA đã re-test và xác nhận không còn lỗi (nội dung cảnh báo mới "Cảnh báo: Tắt 2FA sẽ làm giảm đáng kể mức độ bảo vệ..." hiển thị đúng ngữ cảnh trong Drawer tắt 2FA).
- [x] Không gây lỗi phát sinh (Regression test pass; Web/Mobile build PASS, không còn tham chiếu key cũ trong drawer).
