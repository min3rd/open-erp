# [BUG-36] Màu Sắc Component Không Phù Hợp Ở Dark Mode

- **Mã Lỗi**: BUG-36
- **Phân Loại**: Bug / Defect
- **Mức Độ Ưu Tiên**: [ ] Critical / [x] High / [ ] Medium / [ ] Low
- **Người Báo Cáo (Reporter)**: Khách hàng (manual test) + QA/QC Agent
- **Người Xử Lý (Assignee)**: Developer Agent
- **Thuộc Sprint**: Sprint 01
- **Trạng Thái**: [ ] To Do / [ ] In Progress / [ ] In Review / [x] Done / [ ] Deferred

---

## 1. Mô Tả Lỗi
> Khi hệ điều hành bật dark mode, màu sắc nhiều component không hài hòa: một phần do BUG-35 (thiếu class `dark:*` chỉ dùng trong shared), phần còn lại cần rà soát các template còn dùng nền/chữ sáng không có biến thể `dark:`.

- **Môi trường**: Local (Chrome, `prefers-color-scheme: dark`), Web + Mobile.
- **Tính Năng Bị Ảnh Hưởng**: Toàn bộ giao diện Core IAM (auth screens, dashboard, account drawer, 2FA drawers).
- **File Liên Quan**: `src/frontend/shared/components/**`, `src/frontend/web/src/app/features/**/*.html`, `src/frontend/mobile/src/app/pages/**/*.html`.
- **Đối Chiếu**: AGENTS.md (design token `dark:border-neutral-800`, sharp/dense UI); UI spec mục 1.1.

## 2. Các Bước Tái Hiện
1. Bật dark mode hệ điều hành (hoặc DevTools → Rendering → Emulate `prefers-color-scheme: dark`).
2. Duyệt: Login, Đăng ký, Dashboard, Drawer Quản lý tài khoản (3 tab), Setup/Disable 2FA, Sessions, Forgot/Reset.
3. Quan sát các vùng nền sáng chói, chữ thiếu tương phản, viền hòa lẫn nền.

## 3. Kết Quả Thực Tế
- Trước khi sửa BUG-35: Drawer/nhiều thành phần mất layout + thiếu `dark:*` → màu sắc lệch.
- Sau khi thêm `@source`: Drawer đúng, phần lớn bề mặt đã theo dark; cần QA rà soát lại toàn bộ màn hình để xác nhận không còn điểm lệch (đặc biệt bảng biểu, alert, badge, select, footer drawer).

## 4. Kết Quả Kỳ Vọng
- Mọi component có đủ cặp `light + dark` (nền `bg-white/dark:bg-neutral-900`, chữ `text-neutral-900/dark:text-neutral-100`, viền `border-neutral-200/dark:border-neutral-800`, alert `bg-*-50/dark:bg-*-950/40`).
- QA chụp ảnh đối chiếu light/dark cho từng màn hình chính.

## 5. Log Lỗi / Hình Ảnh Đính Kèm
- Ảnh audit: `%TEMP%\opencode\browser-qa\shots2\dark-*.png` (drawer/services trước & sau fix `@source`).

## 6. Xác Nhận Khắc Phục (QA Verification)
- [x] Developer đã sửa nguyên nhân gốc (BUG-35) và rà soát dark variants trong các template bị ảnh hưởng (login/register/forgot/reset/dashboard/account/2FA + Mobile Ionic dark palette).
- [x] QA đã re-test và xác nhận không còn lỗi (browser audit dark mode các màn hình Dashboard, Account detail/security/sessions, Setup 2FA, Login — màu sắc đồng nhất, không còn vùng sáng chói).
- [x] Không gây lỗi phát sinh (Regression test pass; Web/Mobile build PASS).
- **Ghi chú QA (2026-09-18)**: Ảnh đối chiếu dark tại `%TEMP%\opencode\browser-qa\shots-routes2\`; QA/QC vẫn rà soát thêm trên thiết bị thật khi test tổng thể.
