# [BUG-37] Chưa Tận Dụng Angular Router - Trạng Thái Không Lưu Vào URL

- **Mã Lỗi**: BUG-37
- **Phân Loại**: Bug / Defect
- **Mức Độ Ưu Tiên**: [ ] Critical / [x] High / [ ] Medium / [ ] Low
- **Người Báo Cáo (Reporter)**: Khách hàng (manual test) + QA/QC Agent
- **Người Xử Lý (Assignee)**: Developer Agent
- **Thuộc Sprint**: Sprint 01
- **Trạng Thái**: [ ] To Do / [ ] In Progress / [ ] In Review / [x] Done / [ ] Deferred

---

## 1. Mô Tả Lỗi
> Các bước giao diện quan trọng không được ánh xạ vào URL: mở Quản lý tài khoản và chuyển tab vẫn giữ URL `/dashboard`; reload mất toàn bộ trạng thái. Các bước xác thực (OTP kích hoạt, chọn workspace, 2FA khi đăng nhập) cũng không có route riêng thực sự.

- **Môi trường**: Local (browser manual test + puppeteer audit)
- **Tính Năng Bị Ảnh Hưởng**: FEAT-03 (login/workspace/2FA), FEAT-06 (quản lý tài khoản), FEAT-01 (xác thực OTP).
- **File Liên Quan**:
  - `src/frontend/web/src/app/app.routes.ts` (account không có route; `/verify-email`, `/select-tenant`, `/auth/2fa` đang trỏ về LoginComponent).
  - `dashboard.component.html:110-113` (drawer mở bằng signal cục bộ `isAccountDrawerOpen`), `dashboard.component.ts`.
  - `account-drawer.component.ts` (tab bằng signal `activeTab`).
- **Bằng Chứng Audit**: mở drawer/tab Bảo mật/Sessions/Setup 2FA → `page.url()` luôn = `http://localhost:4200/dashboard`; reload → drawer biến mất.
- **Đối Chiếu**: AGENTS.md + `.agents/rules/ui_ux_standards.md` (ưu tiên Angular Router / nested routes, biểu thị trạng thái qua URL), UI spec Anti-Modal.

## 2. Các Bước Tái Hiện
1. Đăng nhập → `/dashboard` → bấm "Quản lý tài khoản".
2. Quan sát URL: vẫn `/dashboard`; chuyển tab "Bảo mật" / "Phiên đăng nhập": URL không đổi.
3. Nhấn F5: drawer đóng, quay về trạng thái mặc định.
4. Ở luồng đăng nhập 2FA/Chọn workspace/OTP kích hoạt: không deep-link/reload được.

## 3. Kết Quả Thực Tế
- URL không phản ánh trạng thái; reload mất ngữ cảnh; không bookmark/chia sẻ link; vi phạm định hướng Router-first của dự án.

## 4. Kết Quả Kỳ Vọng
- Route-driven đầy đủ:
  - `/account/detail` (tab Hồ sơ), `/account/security` (tab Bảo mật), `/account/security/2fa/setup`, `/account/security/2fa/disable`, `/account/sessions`.
  - `/verify-email?email=...`, `/select-tenant`, `/auth/2fa` có component riêng, dùng `sessionStorage` cho pre-auth token; reload/deep-link hoạt động.
  - Reload tại `/account/security` mở đúng drawer + tab; đóng drawer quay về `/dashboard`.
- Áp dụng tương tự cho Mobile.

## 5. Log Lỗi / Hình Ảnh Đính Kèm
```
URL after open account: http://localhost:4200/dashboard
URL after clicking tabs: http://localhost:4200/dashboard
URL after reload while drawer open: http://localhost:4200/dashboard
drawer visible after reload: false
```

## 6. Xác Nhận Khắc Phục (QA Verification)
- [x] Developer đã sửa xong (route refactor Web + Mobile: `/account/detail|security|sessions`, `/account/security/2fa/setup|disable`, `/verify-email`, `/auth/2fa`, `/select-tenant`).
- [x] QA đã re-test và xác nhận không còn lỗi (puppeteer 7/7 PASS: deep-link, đổi tab theo URL, reload giữ trạng thái, Escape đóng đúng tầng stacked drawer, guard chặn `/account/**`; Mobile smoke 18/18 PASS).
- [x] Không gây lỗi phát sinh (Web/Mobile build PASS, console 0 lỗi).
- **Ghi chú QA (2026-09-18)**: bằng chứng URL/ảnh tại `%TEMP%\opencode\browser-qa\shots-routes2\`.
