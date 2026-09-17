# [DES-03] Đặc Tả Thiết Kế Giao Diện UI/UX: Core Identity & Anti-Modal Architecture

- **Mã Tài Liệu**: DES-03
- **Phụ Trách**: Solution Architect Agent
- **Công Nghệ**: Angular >= 22, Ionic 8, Tailwind CSS v4
- **Phong Cách Thiết Kế**: Industrial Sharp, High Density, Anti-Modal

---

## 1. Triết Lý Thiết Kế: Nhỏ Gọn, Vuông Vắn & Anti-Modal

```
+----------------------------------------------------------------------------------+
| Top Bar (h-9, border-b, text-xs, flex items-center justify-between px-3)         |
| [Logo Open-ERP] [Workspace: Acme VN v]               [Search] [Bell] [Avatar v]  |
+-------------------------------------------------------+--------------------------+
| Main Workspace Content Area                           | Account Drawer (Right)   |
| (Hiển thị đầy đủ bảng dữ liệu nghiệp vụ)              | (width: 440px, z-index)  |
|                                                       | - Tabs: Profile/Security |
|                                                       | - Font: text-xs          |
|                                                       | - Rounded-none, sharp    |
|                                                       | - Stacked sub-drawers    |
+-------------------------------------------------------+--------------------------+
```

### 1.1. Nguyên Tắc Bất Di Bất Dịch
1. **Tuyệt đối không dùng Modal**: Không bật pop-up giữa màn hình làm gián đoạn ngữ cảnh.
2. **Sử dụng Drawer cho Tác Vụ Cá Nhân**: Khi bấm vào Avatar, một Drawer trượt ra từ mép phải màn hình (`drawer-right`, width: `440px`), cho phép sửa hồ sơ, đổi mật khẩu, quản lý 2FA và xem sessions.
3. **Mật độ thông tin cao**: Cỡ chữ chuẩn cho form là `text-xs` (12px), labels là `text-[11px] font-medium uppercase text-neutral-500`, các khoảng cách đệm `p-1.5`, `space-y-2`.
4. **Góc cạnh sắc nét**: 100% các nút bấm, input, card đều mang class `rounded-none` hoặc `rounded-sm` (tối đa 2px), viền mảnh `border-neutral-200 dark:border-neutral-800`.

---

## 2. Đặc Tả Màn Hình Xác Thực (Auth Screens Layout)

### 2.1. Màn Hình Đăng Nhập (`/login`)
- Bố cục 2 phần:
  - **Cột Trái (Brand & Live Metrics)**: Chiếm 50% màn hình, hiển thị nền tối (`bg-neutral-950 text-white`), slogan và số liệu trực quan của hệ thống.
  - **Cột Phải (Login Form)**: Form đăng nhập vuông vắn, gồm:
    - Input Email (`h-8 text-xs rounded-none border-neutral-300`).
    - Input Password (`h-8 text-xs rounded-none border-neutral-300`).
    - Link "Quên mật khẩu?" (`text-xs text-neutral-600 hover:underline`).
    - Nút "Đăng Nhập" (`h-8 bg-neutral-900 text-white text-xs font-medium rounded-none hover:bg-neutral-800`).
    - Link "Chưa có tài khoản? Đăng ký cá nhân / Đăng ký doanh nghiệp".

### 2.2. Màn Hình Đăng Ký Cá Nhân (`/register/personal`) & Doanh Nghiệp (`/register/business`)
- Form nhập liệu mật độ cao, nhóm các trường hợp lý (Thông tin quản trị viên & Thông tin tổ chức).
- Subdomain picker có kiểm tra trực tiếp (Live availability check) hiển thị preview URL: `https://[slug].openerp.vn`.

### 2.3. Màn Hình Xác Thực 2FA (`/auth/2fa`)
- Ô nhập 6 chữ số định dạng OTP pin input vuông vắn: 6 ô vuông rời kích thước `w-9 h-10 text-center font-mono text-base border border-neutral-300 rounded-none focus:border-neutral-900`.

---

## 3. Đặc Tả Drawer Quản Lý Tài Khoản (`AccountDrawerComponent`)

- **Vị trí**: Trượt mượt mà từ cạnh phải (`transform translate-x-full transition-transform duration-200 ease-out`).
- **Thanh tiêu đề (Header)**: Chiều cao `40px`, gồm Avatar nhỏ, Tên người dùng, và nút đóng `X` (`h-6 w-6 rounded-none`).
- **Thanh điều hướng con (Sub-Tabs)**:
  - Tab 1: `Hồ Sơ` (Họ tên, Email, SĐT, Ngôn ngữ, Múi giờ).
  - Tab 2: `Bảo Mật` (Đổi mật khẩu, Kích hoạt 2FA).
  - Tab 3: `Phiên Đăng Nhập` (Danh sách thiết bị, IP, Nút đăng xuất từ xa).
- **Cơ chế Xếp Chồng (Stacked Drawer)**:
  - Khi người dùng bấm "Cài đặt 2FA" từ Tab Bảo Mật, một Drawer con (`TwoFactorDrawer`) trượt ra đè thêm 40px lên Drawer cha, tạo hiệu ứng xếp lớp chuyên nghiệp mà không mất ngữ cảnh.
