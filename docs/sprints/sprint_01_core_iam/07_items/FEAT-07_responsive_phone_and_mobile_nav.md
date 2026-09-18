# [FEAT-07] Tối Ưu Web Cho Kích Thước Điện Thoại & Drawer Điều Hướng Mobile

- **Mã Tính Năng**: FEAT-07
- **Phân Loại**: Feature / Enhancement
- **Mức Độ Ưu Tiên**: [ ] Critical / [x] High / [ ] Medium / [ ] Low
- **Người Đề Xuất**: Khách hàng (yêu cầu trực tiếp khi QA, 2026-09-18)
- **Phụ Trách**: Developer Agent (Web)
- **Thuộc Sprint**: Sprint 01
- **Trạng Thái**: [ ] To Do / [ ] In Progress / [ ] In Review / [x] Done / [ ] Deferred

---

## 1. Tóm Tắt Nhu Cầu
- **User Story**: Là người dùng truy cập Open-ERP bằng điện thoại (trình duyệt mobile), tôi muốn màn hình đăng ký/đăng nhập và dashboard hiển thị gọn gàng, không tràn ngang; đồng thời các tiện ích (thông tin tài khoản, menu, chuyển ngôn ngữ, chọn theme) được gom vào một Drawer mở bằng nút hamburger để không chiếm diện tích màn hình nhỏ.
- **Bối cảnh**: Hiện tại ở viewport 390px, TopBar dashboard bị tràn ngang (logo/tên tenant/badge role/language/account/logout chen chúc), trang đăng nhập thừa nhiều khoảng trống dọc; chưa có theme switcher (đang cố định theo hệ điều hành).

## 2. Tiêu Chí Nghiệm Thu (Acceptance Criteria)
- [x] **AC1 - Không tràn ngang**: Ở viewport 390x844, `document.documentElement.scrollWidth <= window.innerWidth` trên các trang `/login`, `/register/personal`, `/register/business`, `/forgot-password`, `/dashboard`.
- [x] **AC2 - Auth screens tối ưu điện thoại**: login/register/forgot/reset hiển thị 1 cột, form rộng tối đa, nút full-width, khoảng cách dọc gọn, không có cột brand chiếm chỗ trên màn hình nhỏ; các ô OTP (6 ô) vừa 390px.
- [x] **AC3 - Hamburger + Drawer điều hướng mobile**: dưới breakpoint `lg`, TopBar chỉ còn logo + nút hamburger; nhấn hamburger mở Drawer (trượt cạnh phải) chứa:
  - Thông tin tài khoản: avatar/tên, email, tên workspace, badge vai trò.
  - Menu: Dashboard, Hồ sơ (`/account/detail`), Bảo mật & 2FA (`/account/security`), Phiên đăng nhập (`/account/sessions`).
  - Language switcher (dùng component shared `LanguageSwitcherComponent`).
  - Theme switcher (System / Light / Dark).
  - Nút Đăng xuất.
- [x] **AC4 - Theme switcher hoạt động**: chọn Light/Dark/System áp dụng ngay toàn app (class `.dark` trên `<html>`), lưu lựa chọn (`localStorage`), mặc định System (theo OS); `dark:` của Tailwind chuyển sang class strategy (`@custom-variant`).
- [x] **AC5 - Dashboard responsive**: TopBar không tràn; welcome banner xếp dọc trên điện thoại; grid tính năng 1 cột (điện thoại) → 2 cột (tablet) → 3 cột (desktop); padding gọn.
- [x] **AC6 - Desktop không hồi quy**: viewport 1600px giữ nguyên bố cục hiện tại (TopBar đầy đủ, không hamburger).
- [x] **AC7 - i18n & a11y**: mọi nhãn mới có key vi/en; hamburger/drawer có `aria-label`, `role="dialog"` (component Drawer sẵn có); console 0 lỗi.

## 3. Danh Sách Công Việc Kỹ Thuật (Sub-Tasks)
- [x] TASK-135: Thêm class-based dark variant (`@custom-variant dark`) + `ThemeService` (SYSTEM/LIGHT/DARK, persist, matchMedia listener) + `ThemeSwitcherComponent` trong shared.
- [x] TASK-136: Tạo `MobileNavDrawerComponent` (hamburger + drawer nội dung tài khoản/menu/language/theme/logout) trong shared hoặc features, dùng lại `DrawerComponent` + `LanguageSwitcherComponent`.
- [x] TASK-137: Refactor `TopBarComponent` responsive (ẩn cụm phải dưới `lg`, hiện hamburger; truncate brand/tenant; không tràn ngang).
- [x] TASK-138: Rà soát & tối ưu responsive cho các màn auth (login/register/forgot/reset) + dashboard (padding, grid, banner).
- [x] TASK-139: QA browser responsive (390x844 + 1600x1000), chụp ảnh minh chứng, kiểm tra console.

## 4. Ghi Chú
- Bổ sung phạm vi được khách hàng yêu cầu trực tiếp trong giai đoạn QA (xem `04_confirmation/CONF-01_sprint_01_scope.md` mục 3).
- Ứng dụng Mobile Ionic 8 (mobile app) không thuộc phạm vi item này (đã mobile-first).
- **Ghi chú QA (2026-09-18)**: Xác nhận bằng puppeteer responsive 40/40 + 11/11 (overflow 0, hamburger + drawer đầy đủ, theme persist, desktop không hồi quy), Web/Mobile build PASS, console 0 lỗi; ảnh minh chứng tại docs/06_user_guides/assets/sprint_01_core_iam/ (21-23).
