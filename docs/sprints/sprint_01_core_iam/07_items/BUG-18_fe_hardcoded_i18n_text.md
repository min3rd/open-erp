# [BUG-18] Frontend Hardcode Chuỗi i18n và Thiếu Key Dịch ACCOUNT_NEW_PASSWORD_LABEL

- **Mã Lỗi**: BUG-18
- **Phân Loại**: Bug / Defect
- **Mức Độ Ưu Tiên**: [ ] Critical / [x] High / [ ] Medium / [ ] Low
- **Người Báo Cáo (Reporter)**: QA/QC Agent
- **Người Xử Lý (Assignee)**: Developer Agent
- **Thuộc Sprint**: Sprint 01
- **Trạng Thái**: [ ] To Do / [ ] In Progress / [ ] In Review / [x] Done / [ ] Deferred

---

## 1. Mô Tả Lỗi
> Nhiều chuỗi văn bản hiển thị trên giao diện bị hardcode, không đi qua hệ thống đa ngôn ngữ i18n; đặc biệt một key dịch được tham chiếu nhưng chưa được khai báo trong từ điển nên giao diện hiển thị nguyên key.

- **Môi trường**: Local
- **Tính năng / Module bị ảnh hưởng**: Toàn bộ UI Web (FEAT-01 → FEAT-06), trải nghiệm đa ngôn ngữ VI/EN
- **Tệp liên quan**:
  - `src/frontend/web/src/app/features/dashboard/account-drawer/account-drawer.component.html:147`: dùng `[label]="'ACCOUNT_NEW_PASSWORD_LABEL' | translate"` nhưng key `ACCOUNT_NEW_PASSWORD_LABEL` không tồn tại trong `src/frontend/web/public/i18n/vi.json` và `src/frontend/web/public/i18n/en.json` → hiển thị nguyên key.
  - Hardcode không qua i18n:
    - `register-business.component.html:36,43,44,56-59`: `hint="slug (openerp.9ms.io.vn)"`, `label="Mã số thuế / Tax ID"`, `placeholder="0109999999"`, các option `1 - 10`, `11 - 50`, `51 - 200`, `201+`.
    - `setup-2fa-drawer.component.html:31,45`: `URI: ...`, `Copy All`.
    - `dashboard.component.html:23,37`: `(slug: ...)`, `100% DONE`.
    - `account-drawer.component.html:81,93,105,266`: `Avatar URL`, `Tiếng Việt (vi)`, `Asia/Ho_Chi_Minh (UTC+7)`, `IP: ...`.
    - `reset-password.component.html:20-21`: `Token`.
    - `login.component.html:110`: `placeholder="ABCD-1234"`.
    - `disable-2fa-drawer.component.html:30`: `placeholder="123456"`.
- **Tài liệu đối chiếu**: AGENTS.md - quy tắc "Bắt buộc 100% Đa Ngôn Ngữ (Zero-Hardcode Strings)"; [DES-03 - CORE_IAM_UI_SPEC.md](../06_designs/ui_ux/CORE_IAM_UI_SPEC.md).

## 2. Các Bước Tái Hiện Lỗi (Steps to Reproduce)
1. Đăng nhập, mở Drawer Quản lý tài khoản → tab Bảo mật.
2. Quan sát nhãn ô "Mật khẩu mới": hiển thị nguyên chuỗi `ACCOUNT_NEW_PASSWORD_LABEL`.
3. Lần lượt mở trang Đăng ký doanh nghiệp, Drawer Setup 2FA, Dashboard, Reset Password, Login, Drawer Disable 2FA.
4. Chuyển ngôn ngữ sang English (hoặc ngược lại) và quan sát các text đã nêu.

## 3. Kết Quả Thực Tế (Actual Result)
- Ô mật khẩu mới hiển thị literal `ACCOUNT_NEW_PASSWORD_LABEL` thay vì nhãn dịch.
- Các chuỗi `Tax ID`, `URI:`, `Copy All`, `100% DONE`, `Avatar URL`, `Token`, `IP:`... giữ nguyên bất kể ngôn ngữ, trộn lẫn tiếng Việt/tiếng Anh trên cùng giao diện.

## 4. Kết Quả Kỳ Vọng (Expected Result)
- Bổ sung key `ACCOUNT_NEW_PASSWORD_LABEL` vào đầy đủ `vi.json` và `en.json` (hoặc loại bỏ nếu không sử dụng).
- 100% chuỗi hiển thị phải dùng `TranslatePipe`/`TranslateDirective` với mã dịch tương ứng, không hardcode bất kỳ text VI/EN nào trong template/component theo quy định AGENTS.md.

## 5. Log Lỗi / Hình Ảnh Đính Kèm (Stacktrace / Screenshots)
- Không có

## 6. Xác Nhận Khắc Phục (QA Verification)
- [x] Developer đã sửa xong.
- [x] QA đã re-test và xác nhận không còn lỗi.
- [x] Không gây lỗi phát sinh (Regression test pass).
- **Ghi chú QA (2026-09-18)**: Xác nhận bằng automated browser test (puppeteer: routing/deep-link 7/7, login + token cũ 3/3, form 2 bước + live slug check + 2FA redirect 6/6, console 0 lỗi), Mobile smoke 18/18 PASS, Web/Mobile build PASS; ảnh minh chứng tại docs/06_user_guides/assets/sprint_01_core_iam/. Nghiệm thu cuối của khách hàng thực hiện khi đóng Sprint.
