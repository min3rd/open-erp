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
- **Kích thước**: Chiều rộng `440px` (trên Desktop/Tablet), `100vw` toàn màn hình trên Mobile.
- **Thanh tiêu đề (Header)**: Chiều cao `40px`, gồm Avatar nhỏ, Tên người dùng, và nút đóng `X` (`h-6 w-6 rounded-none`).
- **Thanh điều hướng con (Sub-Tabs)**:
  - Tab 1: `Hồ Sơ` (Họ tên, Email, SĐT, Ngôn ngữ, Múi giờ).
  - Tab 2: `Bảo Mật` (Đổi mật khẩu, Quản lý xác thực 2FA).
  - Tab 3: `Phiên Đăng Nhập` (Danh sách thiết bị, IP, Nút đăng xuất từ xa).

---

### 3.1. Chi Tiết Tab Bảo Mật (Security Tab)
1. **Khối Đổi Mật Khẩu**:
   - Input Mật khẩu hiện tại, Mật khẩu mới, Xác nhận mật khẩu mới.
   - Checkbox vuông: "Đăng xuất khỏi tất cả các thiết bị khác".
   - Nút "Cập nhật mật khẩu" (`h-7 px-3 bg-neutral-900 text-white text-xs rounded-none`).
2. **Khối Xác Thực 2 Yếu Tố (2FA)**:
   - **Trường hợp CHƯA KÍCH HOẠT**:
     - Tiêu đề: "Xác thực hai yếu tố (TOTP)".
     - Trạng thái: Badge xám `Chưa kích hoạt` (`text-[10px] bg-neutral-100 text-neutral-600 px-1.5 py-0.5 rounded-none border border-neutral-200`).
     - Mô tả: "Bảo vệ tài khoản bằng mã bảo mật 6 số từ Google Authenticator hoặc ứng dụng tương thích."
     - Nút hành động: "Bật 2FA" (`h-7 px-3 bg-neutral-900 text-white text-xs font-medium rounded-none hover:bg-neutral-800`).
   - **Trường hợp ĐÃ KÍCH HOẠT**:
     - Trạng thái: Badge xanh lá `Đã kích hoạt` (`text-[10px] bg-emerald-50 text-emerald-700 px-1.5 py-0.5 rounded-none border border-emerald-200`).
     - Thông tin phụ: "Kích hoạt ngày DD/MM/YYYY • Còn X/8 mã dự phòng".
     - Các nút hành động:
       - Nút "Tắt 2FA" (`h-7 px-2.5 text-xs text-rose-600 border border-rose-300 hover:bg-rose-50 rounded-none`).
       - Nút "Mã dự phòng" (`h-7 px-2.5 text-xs text-neutral-700 border border-neutral-300 hover:bg-neutral-100 rounded-none`).

---

### 3.2. Cơ Chế Xếp Chồng Drawer Con (Anti-Modal Stacked Drawers)

Tuyệt đối không sử dụng Modal pop-up che khuất màn hình. Khi người dùng thao tác với 2FA, các Drawer con sẽ trượt ra đè thêm lên Drawer cha:

#### 3.2.1. Drawer Đăng Ký 2FA (`Setup2FaDrawerComponent`)
- **Kích thước & Vị trí**: Trượt từ cạnh phải, chiều rộng `420px`, đè lùi Drawer cha sang trái 30px (hiệu ứng xếp lớp stacked card).
- **Tiêu đề**: "Thiết Lập Xác Thực 2 Yếu Tố".
- **Giai đoạn 1 - Quét mã**:
  - Mã QR hiển thị trong khung vuông sắc nét kích thước `140x140px` viền `border border-neutral-300 p-1`.
  - Dòng Secret Key dạng chữ: `font-mono text-xs bg-neutral-100 p-1 border select-all` kèm nút bấm "Sao chép".
- **Giai đoạn 2 - Xác nhận kích hoạt**:
  - Ô nhập mã OTP 6 chữ số: 6 ô vuông nhỏ rời rạc (`w-8 h-9 text-center font-mono text-sm border border-neutral-300 rounded-none focus:border-neutral-900`).
  - Nút "Xác Nhận & Bật 2FA" (`w-full h-8 bg-neutral-900 text-white text-xs font-medium rounded-none`).
- **Giai đoạn 3 - Cấp mã dự phòng (Backup Codes)**:
  - Khi kích hoạt thành công, drawer chuyển sang màn hình danh sách 8 mã dự phòng dạng 2 cột:
    ```
    [ A1B2-C3D4 ]    [ E5F6-G7H8 ]
    [ I9J0-K1L2 ]    [ M3N4-O5P6 ]
    [ Q7R8-S9T0 ]    [ U1V2-W3X4 ]
    [ Y5Z6-A7B8 ]    [ C9D0-E1F2 ]
    ```
  - Cảnh báo: "Lưu trữ các mã này ở nơi an toàn. Mỗi mã chỉ dùng được 1 lần nếu bạn mất điện thoại."
  - Nút "Sao chép toàn bộ" & Nút "Tải file text (.txt)".
  - Nút "Tôi đã lưu mã an toàn - Hoàn tất" (đóng Stacked Drawer và làm mới trạng thái trên Drawer cha).

#### 3.2.2. Drawer Xóa/Tắt 2FA (`Disable2FaDrawerComponent`)
- **Kích thước & Vị trí**: Chiều rộng `380px`, trượt từ cạnh phải đè lên Drawer cha.
- **Tiêu đề**: "Vô Hiệu Hóa Xác Thực 2FA".
- **Hộp cảnh báo (Alert Box)**:
  - Viền vuông, nền nhạt `bg-amber-50 border border-amber-300 p-2 text-xs text-amber-800`.
  - Nội dung: "Cảnh báo: Tắt 2FA sẽ làm giảm đáng kể mức độ bảo vệ tài khoản của bạn khỏi nguy cơ bị đánh cắp."
- **Form xác thực chính chủ (Re-Authentication)**:
  - Nhãn: "Mật khẩu hiện tại" $\rightarrow$ Input mật khẩu (`h-8 text-xs border-neutral-300 rounded-none`).
  - Nhãn: "Mã 2FA hiện tại hoặc Mã dự phòng" $\rightarrow$ Input OTP 6 số (`h-8 text-xs font-mono border-neutral-300 rounded-none`).
- **Nút hành động**:
  - Nút "Hủy bỏ" (`h-8 px-3 text-xs border border-neutral-300 rounded-none hover:bg-neutral-100`).
  - Nút "Xác Nhận Tắt 2FA" (`h-8 px-3 text-xs bg-rose-600 hover:bg-rose-700 text-white font-medium rounded-none`).

---

### 3.3. Trải Nghiệm Trên Ứng Dụng Di Động (Ionic 8 + Angular)
- Không dùng Drawer xếp chồng mà sử dụng **IonNav trượt trang theo chiều ngang (Slide Transition)**.
- Màn hình thiết lập 2FA ưu tiên hiển thị nút **"Sao Chép Mã Bí Mật"** để người dùng dán trực tiếp vào ứng dụng Google Authenticator hoặc Microsoft Authenticator trên cùng thiết bị di động.
