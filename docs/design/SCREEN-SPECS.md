# Screen Specs — Open ERP SaaS Platform
# Sprint 01–02: Auth & System Administration

**Phiên bản:** 1.0  
**Ngày tạo:** 09/05/2026  
**Tác giả:** UI/UX Designer  
**Phạm vi:** Sprint 01 (Auth, Onboarding) + Sprint 02 (System Admin)  
**Tham chiếu:** [Design System](DESIGN-SYSTEM.md)

---

## Mục lục

**Public Pages**
1. [Landing Page / Register Entry](#1-landing-page--register-entry)
2. [Trang đăng ký doanh nghiệp (4 bước)](#2-trang-đăng-ký-doanh-nghiệp-4-bước)
3. [Trang đăng nhập (Login + MFA)](#3-trang-đăng-nhập-login--mfa)
4. [Trang quên / đặt lại mật khẩu](#4-trang-quên--đặt-lại-mật-khẩu)

**App Shell — System Admin**
5. [Dashboard tổng quan (sau login)](#5-dashboard-tổng-quan-sau-login)
6. [User Management — List + Form](#6-user-management--list--form)
7. [Role & Permission Matrix](#7-role--permission-matrix)
8. [Department / Org Chart](#8-department--org-chart)
9. [Audit Log](#9-audit-log)
10. [Tenant Settings](#10-tenant-settings)
11. [Notification Preferences](#11-notification-preferences)

---

## 1. Landing Page / Register Entry

### 1.1 Tổng quan màn hình

| Thuộc tính | Giá trị |
|---|---|
| **Loại trang** | Public — Marketing |
| **Mục tiêu** | Giới thiệu sản phẩm, thu hút đăng ký dùng thử |
| **Luồng tiếp theo** | → Trang đăng ký DN (bước 1) |

### 1.2 Layout

```
┌────────────────────────────────────────────────────┐
│ [top-nav: Logo | Menu | Đăng nhập | Dùng thử]      │ ← 64px sticky
├────────────────────────────────────────────────────┤
│ HERO BAND (96px padding top/bottom)                │
│ ┌──────────────────────┬──────────────────────┐   │
│ │ 7/12: Content        │ 5/12: App mockup     │   │
│ │ [display-xl]         │ [Screenshot app      │   │
│ │ Số hóa toàn diện     │  radius 16px,        │   │
│ │ vận hành DN với AI   │  shadow subtle]      │   │
│ │ [body 18px mô tả]    │                      │   │
│ │ [btn-primary]        │                      │   │
│ │ [btn-secondary]      │                      │   │
│ └──────────────────────┴──────────────────────┘   │
├────────────────────────────────────────────────────┤
│ LOGOS BAND: "Tin dùng bởi..." — logo khách hàng    │ ← 48px padding
├────────────────────────────────────────────────────┤
│ FEATURES BAND (96px padding)                       │
│ [display-md] + [subtitle]                          │
│ ┌──────────┬──────────┬──────────┬──────────┐     │
│ │feature   │feature   │feature   │feature   │     │
│ │card      │card      │card      │card      │     │
│ └──────────┴──────────┴──────────┴──────────┘     │
├────────────────────────────────────────────────────┤
│ MODULES BAND (96px padding)                        │
│ Tab group: [SA] [HR] [Sale] [Kế toán] [Office]    │
│ [Nội dung module tab active - 2 column layout]     │
├────────────────────────────────────────────────────┤
│ PRICING BAND (96px padding)                        │
│ ┌──────────┬──────────────────┬──────────┐        │
│ │ Cơ bản   │ Chuyên nghiệp    │ Doanh    │        │
│ │ data-    │ pricing-featured │ nghiệp   │        │
│ │ card     │ (bg #101010)     │ data-card│        │
│ └──────────┴──────────────────┴──────────┘        │
├────────────────────────────────────────────────────┤
│ CTA BAND: Đăng ký ngay                             │ ← 96px padding
├────────────────────────────────────────────────────┤
│ FOOTER (bg #101010, text on-dark)                  │
│ Logo | Links | © 2026 Open ERP                     │
└────────────────────────────────────────────────────┘
```

### 1.3 Components sử dụng

| Component | Vị trí | Variant | Ghi chú |
|---|---|---|---|
| `top-nav` | Header sticky | Public | Logo + nav links + 2 CTA |
| Hero Headline | Content hero | `display-xl` | Font: Cal Sans / Inter 600 |
| `btn-primary` | Hero CTA | Default | "Dùng thử miễn phí — 14 ngày" |
| `btn-secondary` | Hero CTA phụ | Default | "Xem demo" |
| `feature-card` | Features band | 4-column grid | Icon + Title + Description |
| `pricing-tier-card-featured` | Pricing band | Dark (#101010) | Chỉ 1 card dark |
| Footer | Bottom | Dark surface | bg #101010 |

### 1.4 Key Interactions

- CTA "Dùng thử miễn phí" → scroll smooth xuống form đăng ký hoặc navigate `/register`
- Nav "Đăng nhập" → `/login`
- Pricing tab group: switch giữa Tháng / Năm (toggle pill)
- Module tab: switch tab hiển thị nội dung module

### 1.5 Mobile Adaptation

- Hero: Stack dọc, mockup ẩn, content full width
- Features: 1 column (2 column trên tablet)
- Pricing: Horizontal scroll cards
- Nav: Hamburger menu → drawer overlay

---

## 2. Trang đăng ký doanh nghiệp (4 bước)

### 2.1 Tổng quan

| Thuộc tính | Giá trị |
|---|---|
| **Loại trang** | Public — Auth/Onboarding |
| **Mục tiêu** | Thu thập thông tin DN, xác thực, tạo tenant |
| **Route** | `/register` |

### 2.2 Layout chung (Tất cả bước)

```
┌────────────────────────────────────────────────────┐
│ [Logo Open ERP]                    top-left, 64px  │
├────────────────────────────────────────────────────┤
│                                                    │
│   ┌───────────────────────────────────────────┐   │
│   │  [workflow-status-stepper: 4 bước]        │   │ ← max-width 560px, centered
│   │                                           │   │
│   │  [Nội dung bước hiện tại]                 │   │
│   │                                           │   │
│   │  [Action buttons: Quay lại | Tiếp theo]   │   │
│   └───────────────────────────────────────────┘   │
│                                                    │
└────────────────────────────────────────────────────┘
```

#### Stepper indicator

```
[1. Thông tin DN] ─── [2. Xác nhận MST] ─── [3. Xác thực OTP] ─── [4. Thiết lập ban đầu]
```

---

### 2.3 Bước 1: Thông tin cơ bản (MST + Email)

**Mô tả:** Người dùng nhập mã số thuế để tự động tra cứu thông tin DN, kèm email quản trị.

**Components:**

| Component | Ghi chú |
|---|---|
| `form-group` — MST | `text-input`, 14 ký tự số, `pattern="[0-9]{10,14}"` |
| `form-group` — Email | `text-input`, `type="email"` |
| `form-group` — Mật khẩu | `text-input`, `type="password"`, helper: yêu cầu mật khẩu |
| `form-group` — Xác nhận MK | `text-input`, `type="password"` |
| `btn-primary` | "Tiếp theo" — disabled cho đến khi hợp lệ |
| Divider "Hoặc" + OAuth | btn Google / Microsoft (btn-secondary style) |

**Validation inline:**
- MST: Kiểm tra định dạng 10 hoặc 14 số → Hiển thị error ngay dưới field
- Email: RFC format check
- Password strength indicator (progress-bar 4 cấp độ)

**Interaction:**
- Khi MST hợp lệ → Call API tra cứu → Preview tên DN bên dưới field (badge-pill xanh + tên)
- Nếu MST không tìm thấy → Warning alert "Không tìm thấy DN, bạn có thể nhập thủ công"

---

### 2.4 Bước 2: Xác nhận thông tin MST

**Mô tả:** Hiển thị thông tin DN lấy từ hệ thống thuế để người dùng xác nhận.

**Layout:**

```
[display-sm] Xác nhận thông tin doanh nghiệp

[data-card — Thông tin từ hệ thống thuế]
  Tên DN:          CÔNG TY TNHH ABC
  MST:             0123456789
  Địa chỉ:         123 Nguyễn Văn A, Q.1, TP.HCM
  Ngày cấp:        01/01/2020
  Trạng thái MST:  [badge: active] Đang hoạt động

[alert — info] "Nếu thông tin không chính xác, vui lòng liên hệ cơ quan thuế để cập nhật"

[Tùy chỉnh thêm — optional fields collapsible]
  form-group: Tên hiển thị (có thể sửa)
  form-group: Website
  form-group: Số điện thoại

[btn-secondary "Quay lại"] [btn-primary "Xác nhận & Tiếp theo"]
```

---

### 2.5 Bước 3: Xác thực OTP

**Mô tả:** Gửi OTP 6 số đến email đã đăng ký, người dùng nhập để xác thực.

**Layout:**

```
[display-sm] Xác thực email của bạn
[body-md, muted] Chúng tôi đã gửi mã 6 số đến
                 abc@company.com

[OTP Input — 6 ô riêng biệt, mỗi ô 48×56px, auto-focus]
  [  ]  [  ]  [  ]  [  ]  [  ]  [  ]

[Đếm ngược] Gửi lại sau 00:57 → [link "Gửi lại"] sau khi hết

[btn-primary "Xác nhận"] — disabled cho đến khi 6 số đầy đủ
```

**OTP Input behavior:**
- Mỗi ô text-input 1 ký tự, auto-advance khi nhập
- Backspace: xóa và focus về ô trước
- Paste: tự động điền 6 ô
- Error (sai OTP): border đỏ tất cả ô + shake animation nhẹ + alert error

---

### 2.6 Bước 4: Onboarding Wizard (5 sub-bước)

**Mô tả:** Thiết lập ban đầu cho tenant sau khi xác thực thành công.

**Sub-stepper (dạng tab-group ngang):**
```
[Gói dịch vụ] → [Phòng ban] → [Người dùng đầu tiên] → [Logo & Thương hiệu] → [Hoàn tất]
```

#### Sub-bước 4a: Chọn gói dịch vụ

3 cards ngang (giống pricing band):
- Mỗi card: tên gói, giá/tháng, danh sách tính năng, btn "Chọn gói này"
- Card featured (Chuyên nghiệp): border #111111 2px, tick icon

#### Sub-bước 4b: Tạo phòng ban đầu tiên

```
[form-group] Tên phòng ban đầu tiên
[btn-ghost "Thêm phòng ban"] — thêm row
List các phòng ban: [text-input tên] [btn-icon-circular xóa]

Gợi ý nhanh: [chip] Ban lãnh đạo [chip] Kinh doanh [chip] Kế toán [chip] Nhân sự
(click chip → tự động thêm vào list)
```

#### Sub-bước 4c: Mời người dùng đầu tiên

```
[form-group] Email người dùng + [select] Vai trò + [btn-ghost "Thêm"]
List emails đã thêm: [avatar initial] [email] [role badge] [btn-icon-circular xóa]
```

#### Sub-bước 4d: Logo & Thương hiệu

```
[file-upload] Upload logo DN (PNG/SVG, max 2MB)
Preview logo 80×80px rounded

[form-group] Màu thương hiệu chính: [color picker input + preview swatch]
```

#### Sub-bước 4e: Hoàn tất

```
[Icon check-circle 64px, #10b981]
[display-sm] Tài khoản đã sẵn sàng!
[body-md] Chào mừng bạn đến với Open ERP. Hệ thống đang khởi tạo...
[progress-bar animated]
[btn-primary "Vào Dashboard ngay"]
```

### 2.7 Mobile Adaptation

- Form full width, padding 16px
- Bước 4 sub-stepper: scroll ngang trên mobile
- Gói dịch vụ: stack dọc
- OTP input: numeric keyboard on mobile

---

## 3. Trang đăng nhập (Login + MFA)

### 3.1 Tổng quan

| Thuộc tính | Giá trị |
|---|---|
| **Route** | `/login` |
| **Mục tiêu** | Xác thực danh tính người dùng, hỗ trợ MFA |

### 3.2 Layout

```
┌──────────────────────────────────────────────┐
│ [Logo — top-left]          [Link "Đăng ký"]  │
├──────────────────────────────────────────────┤
│                                              │
│   ┌────────────────────────────────────┐    │
│   │ [display-sm] Chào mừng trở lại    │    │ ← max-width 400px, centered
│   │ [body-sm, muted] Đăng nhập để     │    │
│   │ tiếp tục vào Open ERP             │    │
│   │                                    │    │
│   │ [form-group] Email / Tên đăng nhập │    │
│   │ [form-group] Mật khẩu              │    │
│   │              [link "Quên MK?" right│    │
│   │ [checkbox] Ghi nhớ đăng nhập       │    │
│   │ [btn-primary full-width] Đăng nhập │    │
│   │                                    │    │
│   │ [divider "Hoặc đăng nhập với"]     │    │
│   │ [btn-secondary] Google             │    │
│   │ [btn-secondary] Microsoft          │    │
│   └────────────────────────────────────┘    │
│                                              │
└──────────────────────────────────────────────┘
```

### 3.3 Luồng MFA (sau khi nhập đúng email/password)

```
Chuyển sang màn hình MFA — cùng card layout:

[display-sm] Xác thực 2 yếu tố
[body-md] Nhập mã từ ứng dụng xác thực của bạn

[OTP Input — 6 ô] (giống bước 3 đăng ký)

[link] "Dùng mã dự phòng" → modal nhập backup code
[btn-primary full-width] "Xác nhận"
[link] "Quay lại đăng nhập"
```

### 3.4 States

| State | Xử lý UI |
|---|---|
| Loading (đang xác thực) | btn-primary loading spinner, fields disabled |
| Sai thông tin | alert error "Email hoặc mật khẩu không đúng", field border error |
| Tài khoản bị khóa | alert error "Tài khoản đã bị khóa. Liên hệ quản trị viên" |
| Tenant không hoạt động | alert warning + link hướng dẫn |

### 3.5 Mobile Adaptation

- Layout full screen, padding 24px
- Keyboard-aware (push layout lên khi bàn phím mở)
- Biometric login option (Ionic: Face ID / Touch ID)

---

## 4. Trang quên / đặt lại mật khẩu

### 4.1 Bước 1: Nhập email

```
┌────────────────────────────────────┐
│ [Icon mail 48px]                   │
│ [display-sm] Quên mật khẩu?       │
│ [body-sm] Nhập email để nhận link  │
│ đặt lại mật khẩu                  │
│                                    │
│ [form-group] Email                 │
│ [btn-primary] "Gửi link đặt lại"  │
│ [link] ← Quay lại đăng nhập       │
└────────────────────────────────────┘
```

### 4.2 Bước 2: Xác nhận gửi email

```
[Icon check-circle 48px, #10b981]
[display-sm] Kiểm tra hộp thư của bạn
[body-md] Chúng tôi đã gửi email đến
          user@company.com
[body-sm, muted] Không nhận được? [link "Gửi lại"] (60s cooldown)
[link] ← Quay lại đăng nhập
```

### 4.3 Bước 3: Đặt mật khẩu mới (từ link email)

```
[display-sm] Đặt mật khẩu mới
[form-group] Mật khẩu mới + password strength bar
[form-group] Xác nhận mật khẩu mới
[btn-primary] "Đặt lại mật khẩu"
```

Sau khi thành công → alert success + tự động redirect đến `/login` sau 3 giây.

---

## 5. Dashboard tổng quan (sau login)

### 5.1 Tổng quan

| Thuộc tính | Giá trị |
|---|---|
| **Route** | `/dashboard` |
| **Layout** | App shell (sidebar + header + content) |
| **Đối tượng** | Admin, Manager, Người dùng thông thường |

### 5.2 Layout

```
┌──────────────┬─────────────────────────────────────────────┐
│ app-sidebar  │ [header bar: Tenant | Search | 🔔 | Avatar]  │
│ (240px)      ├─────────────────────────────────────────────┤
│              │ [page-header] Dashboard / Tổng quan          │
│ [Dashboard]  │                                              │
│ [HR]         │ ┌─────┬─────┬─────┬─────┐ ← kpi-widget row │
│ [Sale]       │ │KPI  │KPI  │KPI  │KPI  │   4 cols          │
│ [Kho]        │ │Nhân │Đơn  │Doanh│Công │                   │
│ [Kế toán]    │ │viên │hàng │thu  │việc │                   │
│ [Office]     │ └─────┴─────┴─────┴─────┘                   │
│ [AI Agent]   │                                              │
│ [Cài đặt]    │ ┌──────────────────────┬───────────────────┐│
│              │ │ Hoạt động gần đây    │ Việc cần làm      ││
│ ─────────    │ │ [timeline list]      │ [task list]       ││
│ [Avatar]     │ │                      │                   ││
│ [Settings]   │ └──────────────────────┴───────────────────┘│
└──────────────┴─────────────────────────────────────────────┘
```

### 5.3 Components sử dụng

| Component | Vị trí | Chi tiết |
|---|---|---|
| `kpi-widget` | Row đầu tiên, 4 cols | Nhân viên, Đơn hàng hôm nay, Doanh thu tháng, Công việc chờ |
| `timeline` | Panel trái dưới | 10 hoạt động gần nhất, phân loại theo module |
| Task list | Panel phải dưới | Danh sách việc cần làm hôm nay (từ các module) |
| `app-sidebar` | Fixed left | Tất cả module navigation |
| `breadcrumb` | page-header | Dashboard |
| Notification bell | Header | Badge số thông báo chưa đọc |

### 5.4 KPI Widgets chi tiết

| KPI | Icon | Số liệu | Trend |
|---|---|---|---|
| Nhân viên đang hoạt động | `users` | Tổng số / Tăng so tháng trước | ↑ / ↓ |
| Đơn hàng hôm nay | `shopping-cart` | Số đơn / Giá trị | ↑ / ↓ |
| Doanh thu tháng | `trending-up` | VND format | % so tháng trước |
| Công việc chờ | `clipboard-list` | Số task / Quá hạn | Badge warning |

### 5.5 Mobile Adaptation

- KPI widgets: 2×2 grid
- Timeline + Task list: Tab group chuyển đổi
- Sidebar → Bottom tab navigation (5 tabs: Home, HR, Sale, Office, More)

---

## 6. User Management — List + Form

### 6.1 List View

```
┌──────────────────────────────────────────────────────────────┐
│ [page-header] Quản lý người dùng                             │
│               [breadcrumb: Dashboard / Cài đặt / Người dùng] │
│               [btn-primary "+ Thêm người dùng"]              │
├──────────────────────────────────────────────────────────────┤
│ [filter-bar]                                                  │
│ [search-input "Tìm kiếm..."] [Phòng ban ▼] [Vai trò ▼] [Trạng thái ▼]
├──────────────────────────────────────────────────────────────┤
│ [table]                                                       │
│ ┌────────┬────────────────┬───────────────┬────────┬────────┐│
│ │ □      │ Họ tên         │ Email         │ Vai trò│ Trạng  ││
│ │        │ [avatar] Tên   │               │ [badge]│ thái   ││
│ │        │ Phòng ban      │               │        │ [badge]││
│ ├────────┼────────────────┼───────────────┼────────┼────────┤│
│ │ [row]  │ ...            │ ...           │ ...    │ ...    ││
│ └────────┴────────────────┴───────────────┴────────┴────────┘│
│ [pagination]                          Hiển thị 1-20 / 156    │
└──────────────────────────────────────────────────────────────┘
```

**Table columns:**
| Cột | Nội dung | Sortable |
|---|---|---|
| Checkbox | Multi-select | - |
| Họ tên | Avatar (36px) + Tên + Phòng ban (caption) | ✓ |
| Email | Text | ✓ |
| Vai trò | badge-pill (Admin/Manager/User) | ✓ |
| Trạng thái | badge-pill (active/inactive/pending) | ✓ |
| Ngày tạo | timestamp | ✓ |
| Hành động | btn-ghost "..." → dropdown [Sửa / Đặt lại MK / Vô hiệu hóa / Xóa] | - |

**Bulk actions (khi chọn ≥1 user):**
```
[n người dùng đã chọn] [btn-ghost "Vô hiệu hóa"] [btn-danger "Xóa"] [btn-ghost "Hủy chọn"]
```

### 6.2 Form Thêm / Sửa người dùng

**Dùng drawer/sheet (480px) cho edit inline, hoặc modal 600px cho add new.**

```
[Title] Thêm người dùng mới

Thông tin cơ bản:
  [form-group] Họ và tên *
  [form-group] Email *
  [form-group] Số điện thoại

Phân công:
  [form-group — select] Phòng ban *
  [form-group — select] Chức vụ
  [form-group — select] Vai trò hệ thống * (Admin / Manager / User)

Bảo mật:
  [form-group] Mật khẩu tạm thời (auto-generate + copy button)
  [toggle] Yêu cầu đổi mật khẩu lần đầu đăng nhập
  [toggle] Bật xác thực 2 yếu tố (MFA)

Trạng thái:
  [toggle] Kích hoạt tài khoản

[btn-secondary "Hủy"] [btn-primary "Lưu"]
```

### 6.3 Mobile Adaptation

- Table → card list view
- Filter bar → bottom sheet filter
- Form → full-screen page (không dùng drawer)

---

## 7. Role & Permission Matrix

### 7.1 Tổng quan

| Thuộc tính | Giá trị |
|---|---|
| **Route** | `/settings/roles` |
| **Mục tiêu** | Quản lý vai trò và phân quyền chi tiết |

### 7.2 Layout

```
┌──────────────────────────────────────────────────────────┐
│ [page-header] Vai trò & Phân quyền                       │
│               [btn-primary "+ Thêm vai trò"]             │
├──────────────────────────────────────────────────────────┤
│ ┌─────────────────────┐ ┌──────────────────────────────┐ │
│ │ Danh sách vai trò   │ │ Ma trận phân quyền           │ │
│ │                     │ │                              │ │
│ │ [list]              │ │ [Permission matrix table]    │ │
│ │ ● Super Admin       │ │                              │ │
│ │ ○ Admin Tenant    ← selected ──→ Phân hệ | View | Create | Edit | Delete│ │
│ │ ○ Manager           │ │ System Admin | ✓  |  ✓    |  ✓   |  ✓    │ │
│ │ ○ HR Manager        │ │ HR           | ✓  |  ✓    |  ✓   |  ✗    │ │
│ │ ○ Sale Staff        │ │ Sale         | ✓  |  ✗    |  ✗   |  ✗    │ │
│ │ ○ Viewer            │ │ ...          |    |       |      |       │ │
│ │                     │ │                              │ │
│ │ [btn-ghost "+ Thêm"]│ │ [btn-primary "Lưu thay đổi"]│ │
│ └─────────────────────┘ └──────────────────────────────┘ │
└──────────────────────────────────────────────────────────┘
```

**Permission matrix:**
- Rows: Phân hệ / Module (System Admin, HR, Sale, Kế toán, Office...)
- Columns: Hành động (View, Create, Edit, Delete, Export, Approve...)
- Cell: Checkbox toggle

### 7.3 Mobile Adaptation

- Chia thành 2 màn hình riêng: Danh sách vai trò → chọn role → màn hình permission
- Matrix scroll ngang

---

## 8. Department / Org Chart

### 8.1 Layout

```
┌──────────────────────────────────────────────────────────┐
│ [page-header] Cơ cấu tổ chức                             │
│ [tab-group: Cây tổ chức | Danh sách phòng ban]           │
├──────────────────────────────────────────────────────────┤
│ Tab "Cây tổ chức":                                       │
│                                                          │
│              ┌─────────────────┐                         │
│              │ BAN LÃNH ĐẠO    │ ← org-node card         │
│              │ 5 thành viên    │   12px radius, border    │
│              └────────┬────────┘                         │
│          ┌────────────┴─────────────┐                    │
│    ┌─────┴──────┐          ┌────────┴──────┐             │
│    │ Kinh doanh │          │  Kế toán      │             │
│    │ 12 thành   │          │  6 thành viên │             │
│    └────────────┘          └───────────────┘             │
│                                                          │
│ [btn-primary "+ Thêm phòng ban"] [btn-secondary "Sửa"]   │
├──────────────────────────────────────────────────────────┤
│ Tab "Danh sách":                                         │
│ [table: Tên PB | Trưởng phòng | Số thành viên | Phòng cha│ | Hành động]
└──────────────────────────────────────────────────────────┘
```

**Thêm/Sửa phòng ban** — Modal 480px:
```
[form-group] Tên phòng ban *
[form-group — select] Phòng ban cha (tùy chọn)
[form-group — select] Trưởng phòng
[form-group] Mô tả (textarea)
[btn-secondary "Hủy"] [btn-primary "Lưu"]
```

### 8.2 Mobile Adaptation

- Org chart: Chỉ hiển thị dạng danh sách có thể mở rộng (accordion)
- Tab list làm màn hình chính

---

## 9. Audit Log

### 9.1 Layout

```
┌──────────────────────────────────────────────────────────┐
│ [page-header] Nhật ký hoạt động (Audit Log)              │
├──────────────────────────────────────────────────────────┤
│ [filter-bar]                                             │
│ [search] [Phân hệ ▼] [Loại hành động ▼] [Người dùng ▼] [Thời gian ▼]
├──────────────────────────────────────────────────────────┤
│ [table]                                                  │
│ Thời gian | Người dùng | Hành động | Đối tượng | IP | Chi tiết │
│ [row: timestamp | avatar+email | badge action | resource name | IP | btn-ghost "Xem"]
│ ...                                                       │
│ [pagination]                                             │
└──────────────────────────────────────────────────────────┘
```

**Action badges:**
- CREATE: badge emerald
- UPDATE: badge blue (info)
- DELETE: badge red (error)
- LOGIN/LOGOUT: badge gray (inactive)
- EXPORT: badge violet

**Chi tiết log (Drawer 640px):**
```
[Thời gian chính xác: DD/MM/YYYY HH:mm:ss]
[Người dùng: avatar + tên + email]
[Hành động: badge]
[Đối tượng: Type / ID / Tên]
[IP Address + User Agent]
[Thay đổi dữ liệu:]
  Trước: [code block JSON]
  Sau:   [code block JSON]
```

### 9.2 Mobile Adaptation

- Table → card list (mỗi card: action badge + user + time + resource)
- Chi tiết → full-screen page

---

## 10. Tenant Settings

### 10.1 Layout (Tab-based settings page)

```
┌──────────────────────────────────────────────────────────┐
│ [page-header] Cài đặt hệ thống                           │
├──────────────────────────────────────────────────────────┤
│ ┌─────────────────────────────────────────────────────┐  │
│ │ [tab-group]                                         │  │
│ │ Thông tin DN | Bảo mật | Thông báo | Gói dịch vụ   │  │
│ └─────────────────────────────────────────────────────┘  │
│                                                          │
│ Tab "Thông tin DN":                                      │
│ ┌──────────────────────────────────────────────────────┐ │
│ │ [Upload logo] + Preview                              │ │
│ │ [form-group] Tên công ty *                           │ │
│ │ [form-group] MST                                     │ │
│ │ [form-group] Địa chỉ                                 │ │
│ │ [form-group] Số điện thoại                           │ │
│ │ [form-group] Website                                 │ │
│ │ [form-group — select] Múi giờ                        │ │
│ │ [form-group — select] Ngôn ngữ mặc định              │ │
│ │ [form-group — select] Đơn vị tiền tệ                 │ │
│ │                          [btn-primary "Lưu thay đổi"]│ │
│ └──────────────────────────────────────────────────────┘ │
└──────────────────────────────────────────────────────────┘
```

**Tab "Bảo mật":**
```
Chính sách mật khẩu:
  [form-group] Độ dài tối thiểu (số, default 8)
  [toggle] Yêu cầu chữ hoa
  [toggle] Yêu cầu ký tự đặc biệt
  [form-group] Thời gian hết hạn mật khẩu (ngày, 0 = không hết hạn)

Phiên đăng nhập:
  [form-group] Thời gian hết hạn session (giờ)
  [toggle] Buộc đăng xuất khi đổi mật khẩu

Xác thực 2 yếu tố:
  [toggle] Bắt buộc MFA cho tất cả người dùng
  [toggle] Bắt buộc MFA cho Admin
```

### 10.2 Mobile Adaptation

- Tab group → vertical accordion sections
- Form fields full width

---

## 11. Notification Preferences

### 11.1 Layout

```
┌──────────────────────────────────────────────────────────┐
│ [page-header] Cài đặt thông báo                          │
├──────────────────────────────────────────────────────────┤
│ [Hướng dẫn: Chọn loại thông báo bạn muốn nhận]          │
│                                                          │
│ ┌──────────────────────────────────────────────────────┐ │
│ │ Kênh thông báo                                       │ │
│ │ [toggle] Thông báo trong ứng dụng                    │ │
│ │ [toggle] Email thông báo                             │ │
│ │ [toggle] Thông báo đẩy (Push notification)           │ │
│ └──────────────────────────────────────────────────────┘ │
│                                                          │
│ ┌──────────────────────────────────────────────────────┐ │
│ │ Loại thông báo              │ App │ Email │ Push     │ │
│ ├──────────────────────────────────────────────────────┤ │
│ │ Được giao việc mới          │ [✓] │  [✓]  │  [✓]    │ │
│ │ Đơn hàng cần duyệt          │ [✓] │  [✓]  │  [✗]    │ │
│ │ Nhắc nhở deadline           │ [✓] │  [✗]  │  [✓]    │ │
│ │ Thành viên mới tham gia     │ [✗] │  [✓]  │  [✗]    │ │
│ │ Cảnh báo bảo mật            │ [✓] │  [✓]  │  [✓]    │ │
│ │ Báo cáo định kỳ             │ [✗] │  [✓]  │  [✗]    │ │
│ └──────────────────────────────────────────────────────┘ │
│                                                          │
│ Tần suất email tóm tắt:                                  │
│ [radio] Ngay lập tức  [radio] Hàng ngày  [radio] Hàng tuần │
│                                                          │
│ [btn-primary "Lưu cài đặt"]                              │
└──────────────────────────────────────────────────────────┘
```

### 11.2 Mobile Adaptation

- Matrix toggle → accordion per loại thông báo
- Mỗi loại expand ra 3 toggle con (App / Email / Push)

---

*Tài liệu này mô tả screen specs cho Sprint 01–02. Các sprint tiếp theo sẽ được bổ sung dần theo tiến độ dự án.*
