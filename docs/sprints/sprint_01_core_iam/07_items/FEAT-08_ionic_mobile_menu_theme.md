# [FEAT-08] Ionic Mobile: Side Menu Điều Hướng & Theme Switcher

- **Mã Tính Năng**: FEAT-08
- **Phân Loại**: Feature / Enhancement
- **Mức Độ Ưu Tiên**: [ ] Critical / [x] High / [ ] Medium / [ ] Low
- **Người Đề Xuất**: Khách hàng (bổ sung sau FEAT-07, 2026-09-18)
- **Phụ Trách**: Developer Agent (Mobile)
- **Thuộc Sprint**: Sprint 01
- **Trạng Thái**: [ ] To Do / [ ] In Progress / [ ] In Review / [x] Done / [ ] Deferred

---

## 1. Tóm Tắt Nhu Cầu
- **User Story**: Là người dùng ứng dụng Mobile (Ionic 8), tôi muốn có **menu điều hướng dạng Side Menu** chứa thông tin tài khoản, các menu chức năng, chuyển ngôn ngữ, chọn Theme và Đăng xuất — thay vì các nút rải rác trên toolbar; đồng thời theme Sáng/Tối/Hệ thống phải hoạt động trên Mobile.
- **Bối cảnh**: FEAT-07 đã xử lý cho Web. Mobile hiện dùng `dark.system.css` (chỉ theo OS, chưa có switcher), lộ trình tài khoản/ngôn ngữ trên toolbar và card dashboard, chưa có side menu.

## 2. Tiêu Chí Nghiệm Thu (Acceptance Criteria)
- [x] **AC1 - Side Menu**: có `ion-menu` mở từ nút hamburger trên toolbar các màn hình đã đăng nhập (Dashboard, Tài khoản); menu chứa:
  - Thông tin tài khoản: avatar chữ cái đầu, Họ tên, Email, tên workspace, badge vai trò.
  - Menu: Dashboard (`/dashboard`), Hồ sơ (`/account/detail`), Bảo mật & 2FA (`/account/security`), Phiên đăng nhập (`/account/sessions`) — bấm tự đóng menu.
  - Language switcher (VI/EN).
  - Theme switcher (Hệ thống / Sáng / Tối).
  - Nút Đăng xuất.
- [x] **AC2 - Theme hoạt động trên Mobile**: chuyển sang dark mode **class-based** (`dark.class.css` của Ionic + `@custom-variant dark` cho Tailwind); chọn Dark/Light/System áp dụng ngay cho cả Ionic components (`ion-toolbar`, `ion-content`, `ion-list`...) lẫn Tailwind; lựa chọn được ghi nhớ; mặc định theo hệ thống.
- [x] **AC3 - Toolbar gọn**: Dashboard/Tài khoản chỉ còn nút menu + tiêu đề; các nút tài khoản/ngôn ngữ/đăng xuất không còn rải trên toolbar/card dashboard (đã chuyển vào menu).
- [x] **AC4 - Auth screens**: các trang đăng nhập/đăng ký/quên mật khẩu/OTP hiển thị gọn trên 390px, nút full-width, có truy cập chuyển ngôn ngữ + theme (đặt gọn góc trên) — không tràn ngang.
- [x] **AC5 - Không hồi quy**: build production PASS; đăng nhập/2FA/chọn workspace/tài khoản vẫn hoạt động; console 0 lỗi.
- [x] **AC6 - i18n**: key mới `COMMON_THEME`, `THEME_SYSTEM`, `THEME_LIGHT`, `THEME_DARK`, `COMMON_MENU` có đủ vi/en; không hardcode text.

## 3. Danh Sách Công Việc Kỹ Thuật (Sub-Tasks)
- [x] TASK-140: Chuyển Ionic sang dark class-based (`dark.class.css` + `@custom-variant dark`), tái sử dụng `ThemeService` shared (tự thêm class Ionic palette nếu cần), init khi app bootstrap.
- [x] TASK-141: Tạo `MobileMenuComponent` (ion-menu contentId) + gắn `ion-menu` vào app shell; thêm nút menu trên toolbar Dashboard/Tài khoản.
- [x] TASK-142: Thêm key i18n vi/en; tái sử dụng `LanguageSwitcherComponent` + `ThemeSwitcherComponent` shared.
- [x] TASK-143: Tinh chỉnh auth screens responsive (390px) + đặt language/theme gọn.
- [x] TASK-144: QA mobile viewport (390x844), chụp ảnh minh chứng, cập nhật ảnh hướng dẫn 16/17/18 + thêm ảnh menu/theme.

## 4. Ghi Chú
- Bổ sung phạm vi được khách hàng yêu cầu sau khi kiểm tra bản Web (xem `04_confirmation/CONF-01_sprint_01_scope.md` mục 3).
- **Ghi chú QA (2026-09-18)**: Xác nhận puppeteer mobile 42/42 + 22/22 (menu đầy đủ, theme class-based persist, không tràn ngang, console 0 lỗi); Mobile + Web build PASS; ảnh 16/17/18/24/25 tại docs/06_user_guides/assets/sprint_01_core_iam/.
