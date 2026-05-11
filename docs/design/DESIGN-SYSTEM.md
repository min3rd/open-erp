# Design System — Open ERP SaaS Platform

**Phiên bản:** 1.1  
**Ngày tạo:** 09/05/2026  
**Ngày cập nhật:** 09/05/2026  
**Tác giả:** UI/UX Designer  
**Trạng thái:** Chính thức  
**Nền tảng:** Web (Angular 21+) · Mobile (Ionic Angular 8 + Capacitor 6)

---

## Mục lục

1. [Tổng quan và Nguyên tắc](#1-tổng-quan-và-nguyên-tắc)
2. [Color System](#2-color-system)
3. [Typography System](#3-typography-system)
4. [Spacing System](#4-spacing-system)
5. [Components](#5-components)
6. [Layouts](#6-layouts)
7. [Iconography](#7-iconography)
8. [Responsive & Breakpoints](#8-responsive--breakpoints)
9. [Motion & Animation](#9-motion--animation)
10. [Do's and Don'ts](#10-dos-and-donts)
11. [UI Library Dùng Chung](#11-ui-library-dùng-chung)

---

## 1. Tổng quan và Nguyên tắc

### 1.1 Triết lý thiết kế

Open ERP theo triết lý **"Professional Clarity"** — giao diện rõ ràng, chuyên nghiệp, ưu tiên dữ liệu. Lấy cảm hứng từ phong cách cal.com: nền trắng sạch, typography mạnh mẽ, tối giản trang trí nhưng giàu thông tin.

**Ba trụ cột thiết kế:**

| Trụ cột                        | Định nghĩa                                              | Ứng dụng trong ERP                                 |
| ------------------------------ | ------------------------------------------------------- | -------------------------------------------------- |
| **Clarity (Rõ ràng)**          | Thông tin quan trọng nhất luôn nổi bật, không bị lấn át | KPI số lớn, trạng thái đơn hàng, cảnh báo hệ thống |
| **Density (Mật độ thông tin)** | Hiển thị nhiều dữ liệu nhất có thể mà không gây rối     | Bảng dữ liệu, danh sách, form nhiều trường         |
| **Consistency (Nhất quán)**    | Người dùng học một lần, dùng mọi nơi                    | Pattern thao tác đồng nhất across tất cả phân hệ   |

### 1.2 Mapping từ Cal.com sang Open ERP

Cal.com là **marketing site** — ưu tiên chuyển đổi (conversion). Open ERP là **application shell** — ưu tiên vận hành hàng ngày.

| Context                       | Cal.com gốc                      | Open ERP adaptation                                 |
| ----------------------------- | -------------------------------- | --------------------------------------------------- |
| **Trang công khai (Public)**  | Marketing landing, pricing, blog | Landing page đăng ký dịch vụ, trang login           |
| **App shell (sau đăng nhập)** | Không có                         | Dashboard, module management, forms, tables         |
| **Mobile**                    | Responsive web                   | Ionic native app với bottom tab navigation          |
| **Accent color**              | `#3b82f6` dùng rất thưa          | App shell dùng làm link, active state, focus ring   |
| **Dark surface**              | Footer + featured pricing card   | Footer trang công khai; KHÔNG áp dụng trong app     |
| **Typography display**        | Cal Sans cho tiêu đề lớn         | Display chỉ dùng landing page; app dùng title scale |

### 1.3 Phân vùng thiết kế

```
┌─────────────────────────────────────────────────────┐
│  VÙNG 1: Public Pages (Marketing / Auth)            │
│  → Landing page, Register, Login, Reset password    │
│  → Dùng đầy đủ cal.com style: display typography,  │
│    section 96px padding, dark footer                │
├─────────────────────────────────────────────────────┤
│  VÙNG 2: App Shell (Sau đăng nhập — Web)            │
│  → Sidebar + Header + Content Area                  │
│  → Typography scale: title-*, body-*, caption       │
│  → Không có dark surface, không có section bands    │
├─────────────────────────────────────────────────────┤
│  VÙNG 3: Mobile App (Ionic 8)                       │
│  → Ionic components + Open ERP token override       │
│  → Bottom tab navigation, native feel               │
│  → Chia sẻ color/typography tokens với Web          │
└─────────────────────────────────────────────────────┘
```

---

## 2. Color System

### 2.1 Brand Colors

| Token                   | Hex       | RGB        | Mô tả & Use case                                           |
| ----------------------- | --------- | ---------- | ---------------------------------------------------------- |
| `--color-brand-primary` | `#111111` | 17,17,17   | CTA chính (button-primary), heading text, icon mạnh        |
| `--color-brand-accent`  | `#3b82f6` | 59,130,246 | Link, active state sidebar, focus ring, progress indicator |

### 2.2 Badge Pastel Colors

Dùng cho trạng thái, nhãn phân loại, tag trong toàn bộ hệ thống:

| Token                   | Hex       | Mô tả                                            |
| ----------------------- | --------- | ------------------------------------------------ |
| `--color-badge-orange`  | `#fb923c` | Cảnh báo nhẹ, trạng thái chờ xử lý, deadline gần |
| `--color-badge-pink`    | `#ec4899` | Nhãn đặc biệt, ưu tiên cao, phân hệ HR           |
| `--color-badge-violet`  | `#8b5cf6` | AI suggestions, automation, phân hệ AI Agent     |
| `--color-badge-emerald` | `#34d399` | Thành công nhẹ, hoàn thành, phân hệ Sale         |

### 2.3 Surface Colors

| Token                           | Hex       | Mô tả & Use case                              |
| ------------------------------- | --------- | --------------------------------------------- |
| `--color-surface-canvas`        | `#ffffff` | Nền trang chính, nền form, nền modal          |
| `--color-surface-soft`          | `#f8f9fa` | Nền sidebar, nền header app, nền section phụ  |
| `--color-surface-card`          | `#f5f5f5` | Feature cards, dashboard summary cards        |
| `--color-surface-strong`        | `#e5e7eb` | Nền table row hover, divider nhẹ              |
| `--color-surface-dark`          | `#101010` | Footer trang công khai, featured pricing card |
| `--color-surface-dark-elevated` | `#1a1a1a` | Nền items trong dark surface                  |

### 2.4 Border Colors

| Token                          | Hex       | Mô tả & Use case                             |
| ------------------------------ | --------- | -------------------------------------------- |
| `--color-border-hairline`      | `#e5e7eb` | Border input, border card, divider trong app |
| `--color-border-hairline-soft` | `#f3f4f6` | Divider rất nhẹ, separator trong list        |

### 2.5 Text Colors

| Token                       | Hex       | Mô tả & Use case                                    |
| --------------------------- | --------- | --------------------------------------------------- |
| `--color-text-ink`          | `#111111` | Tiêu đề, label quan trọng, text chính trên nền sáng |
| `--color-text-body`         | `#374151` | Nội dung form, mô tả, table cell                    |
| `--color-text-muted`        | `#6b7280` | Helper text, placeholder, metadata                  |
| `--color-text-muted-soft`   | `#898989` | Timestamp, caption phụ, text disabled               |
| `--color-text-on-dark`      | `#ffffff` | Text trên dark surface (footer, featured card)      |
| `--color-text-on-dark-soft` | `#a1a1aa` | Text phụ trên dark surface                          |

### 2.6 Semantic Colors

| Token                      | Hex       | Dùng cho                                       |
| -------------------------- | --------- | ---------------------------------------------- |
| `--color-semantic-success` | `#10b981` | Badge hoàn thành, alert thành công, icon check |
| `--color-semantic-warning` | `#f59e0b` | Badge cảnh báo, alert warning, deadline        |
| `--color-semantic-error`   | `#ef4444` | Lỗi validation, alert error, delete action     |
| `--color-semantic-info`    | `#3b82f6` | Alert thông tin, tooltip, loading indicator    |

### 2.7 Dark Mode Tokens (Bắt buộc cho Web + Mobile)

Dark mode dùng cùng hệ token, không tạo token rời kiểu `--dark-*`. Cách chuẩn là giữ nguyên tên token và override theo color mode.

| Token                           | Light     | Dark      | Mục đích                                  |
| ------------------------------- | --------- | --------- | ----------------------------------------- |
| `--color-brand-primary`         | `#111111` | `#f3f4f6` | Màu primary text/button theo nền hiện tại |
| `--color-brand-accent`          | `#3b82f6` | `#60a5fa` | Link, focus, active state                 |
| `--color-surface-canvas`        | `#ffffff` | `#0b1220` | Nền trang chính                           |
| `--color-surface-soft`          | `#f8f9fa` | `#111827` | Nền phụ (sidebar/header/list group)       |
| `--color-surface-card`          | `#f5f5f5` | `#1f2937` | Nền card/panel                            |
| `--color-surface-strong`        | `#e5e7eb` | `#374151` | Hover, selected row nhẹ, phân lớp mạnh    |
| `--color-surface-dark`          | `#101010` | `#030712` | Khu vực dark emphasis                     |
| `--color-surface-dark-elevated` | `#1a1a1a` | `#111827` | Bề mặt nâng trong vùng dark               |
| `--color-border-hairline`       | `#e5e7eb` | `#334155` | Border chính                              |
| `--color-border-hairline-soft`  | `#f3f4f6` | `#1f2937` | Divider mảnh                              |
| `--color-text-ink`              | `#111111` | `#f9fafb` | Heading, text mạnh                        |
| `--color-text-body`             | `#374151` | `#e5e7eb` | Nội dung chính                            |
| `--color-text-muted`            | `#6b7280` | `#9ca3af` | Metadata, helper                          |
| `--color-text-muted-soft`       | `#898989` | `#6b7280` | Text phụ cấp thấp                         |
| `--color-text-on-dark`          | `#ffffff` | `#ffffff` | Text trên nền dark                        |
| `--color-text-on-dark-soft`     | `#a1a1aa` | `#cbd5e1` | Text phụ trên nền dark                    |
| `--color-semantic-success`      | `#10b981` | `#34d399` | Success state                             |
| `--color-semantic-warning`      | `#f59e0b` | `#fbbf24` | Warning state                             |
| `--color-semantic-error`        | `#ef4444` | `#f87171` | Error state                               |
| `--color-semantic-info`         | `#3b82f6` | `#60a5fa` | Info/loading state                        |

### 2.8 Chiến lược Color Mode (Thứ tự ưu tiên)

Thứ tự resolve color mode bắt buộc:

1. `user setting` (người dùng chọn trực tiếp trong UI)
2. `persisted setting` (giá trị đã lưu lần trước)
3. `system setting` (theo `prefers-color-scheme`)

Chuẩn key lưu trữ thống nhất toàn hệ:

- Key: `openErp.colorMode`
- Web: lưu trong `localStorage`
- Mobile (Capacitor): lưu trong `Preferences`

Giá trị hợp lệ:

- `light`
- `dark`
- `system`

> Khi `openErp.colorMode = system`, giao diện phải tự cập nhật theo thay đổi của hệ điều hành ở runtime.

---

## 3. Typography System

### 3.1 Font Stack

```css
/* Display — Cal Sans (hoặc Inter 600 với negative tracking) */
--font-display:
  "Cal Sans", "Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;

/* Body — Inter cho mọi nội dung còn lại */
--font-body:
  "Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", "Helvetica Neue",
  sans-serif;

/* Mono — cho code, ID, số kỹ thuật */
--font-mono:
  "JetBrains Mono", "Fira Code", "Cascadia Code", "Courier New", monospace;
```

**Quy tắc font boundary (BẮT BUỘC):**

- `--font-display` → CHỈ dùng cho h1, h2, h3 trên public pages; display headlines
- `--font-body` → Tất cả nội dung còn lại: nav, button, form, table, body text
- Không được dùng `--font-display` trong app shell (sidebar, header, nội dung module)

### 3.2 Type Scale

| Token               | Font    | Size | Weight | Line Height | Letter Spacing | Use case trong ERP                             |
| ------------------- | ------- | ---- | ------ | ----------- | -------------- | ---------------------------------------------- |
| `--type-display-xl` | Display | 64px | 600    | 1.1         | -0.04em        | Landing page H1, màn hình chào mừng            |
| `--type-display-lg` | Display | 48px | 600    | 1.1         | -0.03em        | Tiêu đề section lớn (public pages)             |
| `--type-display-md` | Display | 36px | 600    | 1.2         | -0.02em        | H2 public pages, tiêu đề phân hệ (public)      |
| `--type-display-sm` | Display | 28px | 600    | 1.2         | -0.02em        | H3 public pages, section headers               |
| `--type-title-lg`   | Body    | 22px | 600    | 1.3         | -0.01em        | Page title trong app shell                     |
| `--type-title-md`   | Body    | 18px | 600    | 1.4         | 0              | Card title, section header trong app           |
| `--type-title-sm`   | Body    | 16px | 600    | 1.4         | 0              | Sidebar item (active), column header table     |
| `--type-body-md`    | Body    | 16px | 400    | 1.5         | 0              | Nội dung form, mô tả, table rows               |
| `--type-body-sm`    | Body    | 14px | 400    | 1.5         | 0              | Text phụ, meta info, label form                |
| `--type-caption`    | Body    | 13px | 500    | 1.4         | 0.01em         | Badge text, helper text, timestamp, breadcrumb |
| `--type-button`     | Body    | 14px | 600    | 1           | 0              | Tất cả buttons trong hệ thống                  |
| `--type-nav-link`   | Body    | 14px | 500    | 1           | 0              | Sidebar navigation, top nav                    |
| `--type-code`       | Mono    | 13px | 400    | 1.6         | 0              | Code, ID hệ thống, tenant code                 |

### 3.3 Quy tắc sử dụng trong Angular Material / Tailwind

```css
/* Tailwind classes tương ứng */
.text-display-xl {
  font-family: var(--font-display);
  font-size: 64px;
  font-weight: 600;
  letter-spacing: -0.04em;
}
.text-display-lg {
  font-family: var(--font-display);
  font-size: 48px;
  font-weight: 600;
  letter-spacing: -0.03em;
}
.text-title-lg {
  font-family: var(--font-body);
  font-size: 22px;
  font-weight: 600;
}
.text-title-md {
  font-family: var(--font-body);
  font-size: 18px;
  font-weight: 600;
}
.text-body-md {
  font-family: var(--font-body);
  font-size: 16px;
  font-weight: 400;
}
.text-body-sm {
  font-family: var(--font-body);
  font-size: 14px;
  font-weight: 400;
}
.text-caption {
  font-family: var(--font-body);
  font-size: 13px;
  font-weight: 500;
}
.text-button {
  font-family: var(--font-body);
  font-size: 14px;
  font-weight: 600;
}
```

---

## 4. Spacing System

### 4.1 Base 4px Scale

| Token        | Giá trị | Tailwind         | Dùng cho                                  |
| ------------ | ------- | ---------------- | ----------------------------------------- |
| `--space-1`  | 4px     | `p-1`, `gap-1`   | Khoảng cách tối thiểu, icon padding       |
| `--space-2`  | 8px     | `p-2`, `gap-2`   | Padding badge, khoảng giữa icon và text   |
| `--space-3`  | 12px    | `p-3`, `gap-3`   | Padding button sm, khoảng input nội tuyến |
| `--space-4`  | 16px    | `p-4`, `gap-4`   | Padding standard, khoảng giữa form fields |
| `--space-6`  | 24px    | `p-6`, `gap-6`   | Padding card nhỏ, nội dung app content    |
| `--space-8`  | 32px    | `p-8`, `gap-8`   | Padding feature card, section nội bộ      |
| `--space-12` | 48px    | `p-12`, `gap-12` | Khoảng giữa sections trong app            |
| `--space-24` | 96px    | `py-24`          | Section padding ngoài (public pages only) |

### 4.2 Quy tắc áp dụng

| Ngữ cảnh                                         | Spacing                   |
| ------------------------------------------------ | ------------------------- |
| Padding button default (trên/dưới × trái/phải)   | 12px × 20px               |
| Padding button sm                                | 8px × 16px                |
| Height input / button default                    | 40px                      |
| Height input / button sm                         | 32px                      |
| Padding form-group (khoảng cách giữa các fields) | 16px                      |
| Padding card trong app shell                     | 24px                      |
| Padding feature card (dashboard, public)         | 32px                      |
| Padding nội dung trong sidebar                   | 16px                      |
| Gap giữa sidebar items                           | 4px                       |
| Padding header app bar                           | 16px (dọc) × 24px (ngang) |
| Khoảng giữa section bands (public pages)         | 96px                      |

### 4.3 Border Radius

| Token           | Giá trị | Dùng cho                       |
| --------------- | ------- | ------------------------------ |
| `--radius-xs`   | 4px     | Tag nhỏ, code block            |
| `--radius-sm`   | 6px     | Tooltip, dropdown item         |
| `--radius-md`   | 8px     | Button, input, select          |
| `--radius-lg`   | 12px    | Card, modal, drawer            |
| `--radius-xl`   | 16px    | Hero mockup, image placeholder |
| `--radius-full` | 9999px  | Avatar, badge pill, toggle     |

---

## 5. Components

### 5.1 Buttons

#### btn-primary

```
Background:   #111111
Text:         #ffffff
Font:         14px / 600 (--type-button)
Height:       40px (default), 32px (sm)
Padding:      12px 20px (default), 8px 16px (sm)
Radius:       8px (--radius-md)
Border:       none
```

| State          | Xử lý                                        |
| -------------- | -------------------------------------------- |
| Default        | bg #111111, text white                       |
| Active/Pressed | bg #000000 (thuần đen)                       |
| Disabled       | bg #e5e7eb, text #6b7280, cursor not-allowed |
| Loading        | Spinner trắng 16px thay thế icon, text ẩn    |

> **Không có hover state** — theo quy tắc cal.com, không dùng hover styling cho CTA

#### btn-secondary

```
Background:   #ffffff
Border:       1px solid #e5e7eb (hairline)
Text:         #111111
Font:         14px / 600
Height:       40px / 32px
Radius:       8px
```

| State          | Xử lý                        |
| -------------- | ---------------------------- |
| Active/Pressed | bg #f5f5f5                   |
| Disabled       | text #6b7280, border #f3f4f6 |

#### btn-ghost

```
Background:   transparent
Border:       none
Text:         #374151
Font:         14px / 600
Height:       40px / 32px
```

Dùng cho: action phụ trong toolbar, inline action trong table, breadcrumb action.

#### btn-danger

```
Background:   #ef4444
Text:         #ffffff
Font:         14px / 600
Height:       40px / 32px
Radius:       8px
```

Dùng khi: Xóa, hủy không thể hoàn tác, tắt tài khoản.  
Bắt buộc kèm theo confirmation modal trước khi thực hiện.

#### btn-icon-circular

```
Width/Height: 36px (default), 28px (sm)
Background:   transparent hoặc #f5f5f5
Border-radius: 9999px
Icon:         20px (default), 16px (sm)
```

Dùng cho: Nút đóng modal, action nhanh trong table row, icon button trong header.

---

### 5.2 Inputs & Forms

#### text-input

```
Height:       40px
Radius:       8px
Border:       1px solid #e5e7eb
Background:   #ffffff
Text:         16px / 400, #374151
Padding:      0 12px
```

| State    | Thay đổi                                              |
| -------- | ----------------------------------------------------- |
| Default  | border #e5e7eb                                        |
| Focused  | border #3b82f6, ring: 0 0 0 3px rgba(59,130,246,0.15) |
| Error    | border #ef4444, ring: 0 0 0 3px rgba(239,68,68,0.15)  |
| Disabled | bg #f8f9fa, text #898989, cursor not-allowed          |

#### select

Dùng cùng style với text-input. Thêm icon chevron-down 16px (Lucide) ở phải, padding-right 40px.

#### textarea

Giống text-input, min-height 80px, resize vertical only.

#### checkbox

```
Size:         16px × 16px
Radius:       4px
Border:       1px solid #e5e7eb
Checked:      bg #111111, checkmark white 10px
```

#### radio

```
Size:         16px × 16px
Radius:       9999px
Checked:      dot #111111 8px trong ring #111111 1px
```

#### toggle/switch

```
Width:        40px, Height: 22px
Radius:       9999px
Off:          bg #e5e7eb, dot white 18px
On:           bg #111111, dot white 18px (slide to right)
Transition:   200ms ease
```

#### date-picker

Text-input + icon calendar-days 16px (Lucide) prefix, mở popover calendar.  
Calendar popover: bg white, radius 12px, shadow md, padding 16px.

#### file-upload

```
Height:       80px (default drop zone)
Border:       2px dashed #e5e7eb
Radius:       8px
Background:   #f8f9fa
Text center:  "Kéo thả file hoặc Click để chọn" — 14px, #6b7280
Active drag:  border #3b82f6, bg rgba(59,130,246,0.05)
```

#### form-group

Cấu trúc chuẩn cho mọi trường nhập liệu:

```html
<div class="form-group">
  <!-- gap-top: 16px -->
  <label class="form-label">
    <!-- 14px/600, #111111, mb-6px -->
    Tên trường <span class="required">*</span>
  </label>
  <input class="text-input" />
  <p class="form-helper">
    <!-- 13px/400, #6b7280, mt-4px -->
    Helper text hoặc error message
  </p>
</div>
```

**Quy tắc:** Label LUÔN visible. KHÔNG dùng placeholder làm label.

#### search-input

Text-input với icon search 16px prefix (padding-left 36px). Có nút clear (×) hiện khi có value.

---

### 5.3 Navigation

#### top-nav (Public pages)

```
Height:       64px
Background:   #ffffff
Border-bottom: 1px solid #f3f4f6
Position:     sticky, top 0, z-index 100
Padding:      0 24px
Max-width:    1200px, margin auto
```

Cấu trúc: `[Logo] ─── [Menu items 14px/500] ─── [CTA: btn-secondary "Đăng nhập" + btn-primary "Dùng thử miễn phí"]`

#### app-sidebar (Sau đăng nhập)

```
Width:        240px (expanded), 64px (collapsed)
Background:   #f8f9fa
Border-right: 1px solid #e5e7eb
Height:       100vh, position fixed
Transition:   width 250ms ease
```

**Cấu trúc sidebar:**

```
┌──────────────────┐
│ Logo + Tenant    │  ← 64px header
├──────────────────┤
│ [icon] Module 1  │  ← nav item 40px height
│ [icon] Module 2  │
│   ├ Sub item     │  ← nested 36px height, indent 16px
│   └ Sub item     │
├──────────────────┤
│ [icon] Settings  │  ← bottom items
│ [avatar] User    │
└──────────────────┘
```

**Nav item:**

```
Height:       40px
Padding:      0 12px
Radius:       8px
Text:         14px/500, #374151
Icon:         20px, stroke 1.5px
Active:       bg #f5f5f5, text #111111, icon #111111
Active bar:   2px solid #111111 bên trái (accent: #3b82f6 khi collapsed)
```

#### breadcrumb

```
Font:         13px/500, --type-caption
Separator:    icon chevron-right 12px, #898989
Current:      #111111 (non-link)
Parent:       #6b7280 (link, no underline)
```

#### tab-group (Trong app)

```
Border-bottom: 1px solid #e5e7eb
Tab item:      14px/500, #6b7280, padding: 10px 16px
Active tab:    #111111, border-bottom 2px solid #111111
```

Khác với nav-pill-group (marketing): tab-group dùng underline, không dùng pill background.

#### pagination

```
Button size:  32px × 32px
Radius:       8px
Active:       bg #111111, text white
Font:         14px/500
```

---

### 5.4 Cards & Containers

#### feature-card (Dashboard summary, Public feature list)

```
Background:   #f5f5f5
Radius:       12px
Padding:      32px
Border:       none
```

Nội dung: Icon 24px + Title (18px/600) + Description (14px/400, #374151).

#### data-card (List view, detail panel trong app)

```
Background:   #ffffff
Border:       1px solid #e5e7eb
Radius:       12px
Padding:      24px
```

Dùng cho: danh sách bản ghi, chi tiết đơn hàng, hồ sơ nhân viên.

#### stats-card (KPI dashboard)

```
Background:   #ffffff
Border:       1px solid #e5e7eb
Radius:       12px
Padding:      24px
```

Cấu trúc: `[Label 13px/500, #6b7280] / [Số KPI 36px/600, #111111] / [Trend icon + % 14px/500]`  
Trend up: `#10b981` + icon arrow-up-right  
Trend down: `#ef4444` + icon arrow-down-right

#### empty-state

```
Container:    text-center, padding 48px 24px
Icon:         48px, #e5e7eb (stroke)
Title:        18px/600, #111111, mt-16px
Description:  14px/400, #6b7280, mt-8px
Action:       btn-primary, mt-24px (nếu có)
```

#### loading-skeleton

Dùng pulse animation (opacity 1 → 0.5 → 1, 1.5s infinite) với màu `#e5e7eb`.  
Skeleton bar: radius 4px.  
Skeleton circle: radius 9999px.

---

### 5.5 Data Display

#### table

```
Header row:   bg #f8f9fa, 40px height, border-bottom #e5e7eb
              Font: 13px/500, #6b7280 (--type-caption)
Data row:     bg #ffffff, 48px height, border-bottom #f3f4f6
              Font: 14px/400, #374151
Row selected: bg rgba(59,130,246,0.06), border-left 2px solid #3b82f6
Hover row:    bg #f8f9fa (subtle)
```

Cột sort: Icon arrows-up-down 14px, active cột: icon arrow-up / arrow-down + text #111111.  
Cột action: Luôn cố định bên phải (sticky).

#### badge/chip (Status badges)

```
Height:       22px
Padding:      4px 10px
Radius:       9999px
Font:         13px/500 (--type-caption)
Border:       1px solid transparent
```

| Trạng thái                   | Background | Text      | Border    |
| ---------------------------- | ---------- | --------- | --------- |
| `active` / Hoạt động         | `#dcfce7`  | `#15803d` | `#bbf7d0` |
| `inactive` / Không hoạt động | `#f3f4f6`  | `#6b7280` | `#e5e7eb` |
| `pending` / Chờ xử lý        | `#fef9c3`  | `#854d0e` | `#fde68a` |
| `error` / Lỗi                | `#fee2e2`  | `#b91c1c` | `#fca5a5` |
| `processing` / Đang xử lý    | `#eff6ff`  | `#1d4ed8` | `#bfdbfe` |
| `draft` / Nháp               | `#f3f4f6`  | `#374151` | `#e5e7eb` |

#### avatar-circle

```
Size:         36px (default), 24px (sm), 48px (lg)
Radius:       9999px
Border:       2px solid #ffffff (khi xếp chồng)
```

Ưu tiên: Ảnh → Initials (2 chữ đầu tên, bg #f5f5f5, text #374151) → Icon user 20px.

#### timeline (Audit log, Activity feed)

Mỗi mục timeline:

```
Dot:      8px circle, màu theo loại sự kiện
Line:     1px solid #e5e7eb, nối các dots
Content:  [Actor avatar 24px] [Action text 14px/400] [Timestamp 13px, #898989]
          Thụt lề 16px so với dot
```

#### progress-bar

```
Height:       8px (default), 4px (sm)
Radius:       9999px
Track:        #e5e7eb
Fill:         #111111 (default), hoặc màu semantic
```

---

### 5.6 Feedback

#### alert

```
Radius:       8px
Padding:      12px 16px
Border-left:  4px solid (màu semantic)
Font:         14px/400
```

| Loại      | Background | Border    | Icon                      |
| --------- | ---------- | --------- | ------------------------- |
| `success` | `#f0fdf4`  | `#10b981` | check-circle, `#10b981`   |
| `warning` | `#fffbeb`  | `#f59e0b` | alert-triangle, `#f59e0b` |
| `error`   | `#fef2f2`  | `#ef4444` | x-circle, `#ef4444`       |
| `info`    | `#eff6ff`  | `#3b82f6` | info, `#3b82f6`           |

#### toast/snackbar

```
Position:     fixed, top-right, 16px gap
Width:        360px (max)
Background:   #111111
Text:         #ffffff, 14px/500
Radius:       8px
Padding:      12px 16px
Shadow:       0 4px 16px rgba(0,0,0,0.15)
Auto-dismiss: 4 giây
Animation:    slide in từ phải 200ms, fade out 150ms
```

#### modal/dialog

```
Overlay:      rgba(0,0,0,0.5)
Container:    bg #ffffff, radius 12px, padding 32px
Width:        480px (sm), 600px (md), 800px (lg)
Header:       title 18px/600 + btn-icon-circular đóng
Footer:       actions right-aligned
Animation:    fade + scale (0.96→1) 200ms
```

#### drawer/sheet (Side panel chi tiết)

```
Width:        480px (default), 640px (wide)
Position:     fixed right, height 100vh
Background:   #ffffff
Border-left:  1px solid #e5e7eb
Shadow:       -4px 0 24px rgba(0,0,0,0.08)
Animation:    slide từ phải 250ms ease
```

Dùng cho: Chi tiết bản ghi, form chỉnh sửa inline, preview tài liệu.

#### tooltip

```
Background:   #111111
Text:         #ffffff, 13px/500
Padding:      6px 10px
Radius:       6px
Max-width:    240px
Delay:        300ms
```

---

### 5.7 App-specific Components

#### page-header

```
Padding:      24px 24px 16px
Border-bottom: 1px solid #f3f4f6
```

Cấu trúc: `[Breadcrumb] / [Title 22px/600] [Action buttons right-aligned]`

#### filter-bar

```
Padding:      16px 0
Gap:          8px
```

Cấu trúc: `[search-input flex-1] [Filter chips] [Sort dropdown]`  
Filter chip active: bg #111111, text white, radius pill.

#### kpi-widget (Dashboard)

```
Background:   #ffffff
Border:       1px solid #e5e7eb
Radius:       12px
Padding:      24px
Min-height:   120px
```

Cấu trúc:

```
[Icon module 20px, #6b7280]     ← top-left
[Label 13px/500, #6b7280]
[Số KPI 36px/600, #111111]      ← main value
[Trend 14px/500] [Sparkline]    ← bottom row
```

#### workflow-status-stepper

```
Step circle:  32px, radius 9999px
  Completed:  bg #111111, icon check white
  Current:    bg #111111, text white, ring 3px #3b82f6 (accent focus)
  Upcoming:   bg #f5f5f5, text #6b7280, border #e5e7eb
Connector:    1px solid #e5e7eb → #111111 (completed)
Label:        13px/500, bên dưới circle
```

---

## 6. Layouts

### 6.1 Public Pages (Marketing / Auth)

```
Grid:         12 columns
Max-width:    1200px, margin auto
Gutter:       24px
Section padding: 96px (top/bottom)
```

**Hero band (Landing page):**

```
┌─────────────────────────────────┬──────────────────┐
│  Content (7/12)                 │  Mockup (5/12)   │
│  display-xl headline            │  App screenshot  │
│  Body text 18px                 │  16px radius     │
│  CTA buttons row                │                  │
└─────────────────────────────────┴──────────────────┘
```

### 6.2 App Shell (Sau đăng nhập — Web)

```
┌────────────┬────────────────────────────────────┐
│  Sidebar   │  Header Bar (64px)                 │
│  240px     ├────────────────────────────────────┤
│  (fixed)   │  Content Area                      │
│            │  max-width: 1440px                 │
│            │  padding: 24px                     │
│            │                                    │
│            │  [page-header]                     │
│            │  [filter-bar]                      │
│            │  [table / card grid]               │
└────────────┴────────────────────────────────────┘
```

**Header bar app:**

```
Height:       64px
Background:   #ffffff
Border-bottom: 1px solid #f3f4f6
Content:      [Hamburger (mobile)] [Tenant name 16px/600] ─── [Search global] [Notifications bell] [Avatar menu]
```

**Responsive sidebar behavior:**

- ≥1024px: Sidebar fixed 240px, có thể thu nhỏ về 64px (chỉ icon)
- 768px–1024px: Sidebar ẩn mặc định, mở bằng drawer overlay
- <768px: Sidebar drawer fullscreen overlay

### 6.3 Mobile App (Ionic 8)

**Tab bar navigation:**

```
Position:     fixed bottom
Height:       56px (safe area aware)
Background:   #ffffff
Border-top:   1px solid #e5e7eb
Tabs:         5 tabs tối đa
Active tab:   icon + label, màu #111111
Inactive tab: icon + label, màu #898989
```

**ion-header:**

```
Background:   #ffffff
Border-bottom: 1px solid #f3f4f6
--color:      #111111
```

**ion-content:**

```
--background:          #f8f9fa
--padding-start:       16px
--padding-end:         16px
--padding-top:         16px
--padding-bottom:      80px (space cho tab bar)
```

**ion-card (mapping sang data-card):**

```
--background:    #ffffff
--border-radius: 12px
border:          1px solid #e5e7eb
box-shadow:      none
margin:          0 0 12px 0
```

**ion-fab (floating action button):**

```
Bottom:       72px (trên tab bar)
Right:        16px
Background:   #111111
Icon:         white, 24px
Size:         56px
Radius:       9999px
```

---

## 7. Iconography

### 7.1 Icon Set

**Bộ icon chính: [Lucide Icons](https://lucide.dev)**  
Lý do: Open source, consistent stroke width, đầy đủ cho ERP context, hỗ trợ Angular package.

Bộ dự phòng: Heroicons (nếu Lucide thiếu icon cụ thể nào).

### 7.2 Sizes

| Size | Dùng cho                                                          |
| ---- | ----------------------------------------------------------------- |
| 16px | Inline với text, icon trong badge, icon suffix/prefix trong input |
| 20px | Default — sidebar nav, button icon, action toolbar                |
| 24px | Navigation header, page-level action, empty state                 |
| 32px | Icon lớn trong empty state phụ                                    |
| 48px | Empty state chính, module illustration                            |

### 7.3 Quy tắc

- Stroke width: **1.5px** tất cả các size (consistent với Lucide default)
- Không fill icon trừ khi icon dạng solid (ví dụ: trạng thái active đặc biệt)
- Màu icon: Mặc định thừa hưởng `currentColor` từ parent text
- Không scale icon bằng font-size — luôn dùng width/height cụ thể

---

## 8. Responsive & Breakpoints

| Breakpoint | Tên     | Giá trị         | Mô tả                            |
| ---------- | ------- | --------------- | -------------------------------- |
| `xs`       | Mobile  | < 768px         | Single column, bottom navigation |
| `sm`       | Tablet  | 768px – 1024px  | 2 columns, sidebar drawer        |
| `md`       | Desktop | 1024px – 1440px | Full sidebar + content           |
| `lg`       | Wide    | > 1440px        | Max-width 1440px, centered       |

### 8.1 Component Breakpoint Behavior

| Component   | Mobile (<768px)      | Tablet (768-1024px) | Desktop (1024px+)            |
| ----------- | -------------------- | ------------------- | ---------------------------- |
| Sidebar     | Drawer overlay       | Drawer overlay      | Fixed 240px                  |
| Table       | Card list view       | Horizontal scroll   | Full columns                 |
| Modal       | Bottom sheet         | Centered modal      | Centered modal               |
| Filter bar  | Stacked, collapsible | Inline              | Inline                       |
| Stats cards | 1 column             | 2 columns           | 4 columns                    |
| Form        | Full width           | Max 600px           | Max 720px                    |
| Page header | Title + back button  | Title + actions     | Title + breadcrumb + actions |

---

## 9. Motion & Animation

### 9.1 Nguyên tắc

Open ERP ưu tiên **hiệu năng và tập trung** — animation tối thiểu, không gây sao nhãng.  
Tất cả animation phải tuân thủ `prefers-reduced-motion`.

```css
@media (prefers-reduced-motion: reduce) {
  * {
    animation-duration: 0.01ms !important;
    transition-duration: 0.01ms !important;
  }
}
```

### 9.2 Animation Tokens

| Tên                 | Duration | Easing        | Dùng cho                                  |
| ------------------- | -------- | ------------- | ----------------------------------------- |
| `--motion-fade`     | 150ms    | `ease`        | Page transition, element appear/disappear |
| `--motion-slide`    | 200ms    | `ease-out`    | Toast slide-in, dropdown open             |
| `--motion-modal`    | 200ms    | `ease`        | Modal fade + scale                        |
| `--motion-sidebar`  | 250ms    | `ease`        | Sidebar expand/collapse                   |
| `--motion-skeleton` | 1500ms   | `ease-in-out` | Skeleton pulse (infinite)                 |

### 9.3 Cụ thể từng component

| Component           | Animation                                                 |
| ------------------- | --------------------------------------------------------- |
| **Page transition** | `opacity: 0→1`, 150ms                                     |
| **Toast**           | `transform: translateX(100%)→0`, 200ms ease-out           |
| **Toast dismiss**   | `opacity: 1→0`, 150ms                                     |
| **Modal open**      | `opacity: 0→1` + `transform: scale(0.96)→scale(1)`, 200ms |
| **Drawer open**     | `transform: translateX(100%)→0`, 250ms ease               |
| **Sidebar toggle**  | `width: 240px↔64px`, 250ms ease                           |
| **Dropdown open**   | `opacity: 0→1` + `transform: translateY(-4px)→0`, 150ms   |
| **Skeleton**        | `opacity: 1→0.5→1`, 1500ms infinite                       |
| **Progress bar**    | `width: 0→N%`, 300ms ease                                 |

---

## 10. Do's and Don'ts

### ✅ DO — Trong ERP Context

| Quy tắc                                   | Chi tiết                                                                          |
| ----------------------------------------- | --------------------------------------------------------------------------------- |
| **Ưu tiên data-dense**                    | Bảng hiển thị ≥8 rows, form hiển thị ≥4 fields mỗi hàng (lg)                      |
| **Label luôn visible**                    | Mọi input đều có label rõ ràng bên trên, KHÔNG dùng placeholder làm label         |
| **Dùng `#3b82f6` cho link và focus**      | Accent color dùng cho link text, focus ring, active sidebar item (khác marketing) |
| **Confirmation trước destructive action** | Mọi action xóa/hủy/tắt cần confirm modal với btn-danger                           |
| **Loading state**                         | Mọi async action cần hiển thị loading (skeleton hoặc spinner)                     |
| **Empty state có action**                 | Empty state luôn có CTA "Thêm mới" hoặc hướng dẫn cụ thể                          |
| **Responsive table**                      | Mobile: chuyển table thành card list view, không scroll ngang nhỏ                 |
| **Form validation inline**                | Hiển thị lỗi ngay dưới field, không dùng alert popup cho form validation          |
| **Số liệu lớn dùng separator**            | Định dạng: `1.234.567` (dấu chấm) cho số Việt Nam                                 |
| **Kiểm thử contrast trước release**       | Tối thiểu WCAG AA: text thường `>= 4.5:1`, text lớn `>= 3:1` cho cả light/dark    |

### ❌ DON'T — Cấm trong mọi trường hợp

| Quy tắc                               | Chi tiết                                                                                      |
| ------------------------------------- | --------------------------------------------------------------------------------------------- |
| **Không dùng gradient**               | Không background gradient, không gradient text                                                |
| **Không drop-shadow nặng**            | Chỉ dùng border + subtle shadow (max `0 2px 8px rgba(0,0,0,0.08)`)                            |
| **Không dùng accent cho primary CTA** | `#3b82f6` KHÔNG được dùng cho button-primary                                                  |
| **Không blur font boundary**          | Display font (`--font-display`) KHÔNG được dùng trong app shell                               |
| **Không hardcode màu theo mode**      | Không viết trực tiếp `#fff/#111` trong component; luôn dùng token để dark mode hoạt động đúng |
| **Không animation phức tạp**          | Không parallax, không particle, không 3D transform                                            |
| **Không placeholder làm label**       | Khi input có giá trị, label phải vẫn thấy                                                     |
| **Không icon fill**                   | Dùng icon stroke 1.5px, không fill (trừ icon trạng thái đặc biệt)                             |
| **Không màu bright/vibrant**          | Accent pastels chỉ dùng cho badge, không dùng làm màu nền section                             |

---

## 11. UI Library Dùng Chung

### 11.1 Mục tiêu

- Dùng một hệ component nhất quán cho cả web và mobile.
- Đồng bộ token, trạng thái, và hành vi xuyên nền tảng.

### 11.2 Nguyên tắc thiết kế thư viện

- Tách lớp token khỏi lớp rendering.
- Giữ cùng API component cho web/mobile ở mức semantics.
- Chỉ khác implementation theo adapter nền tảng (Angular web hoặc Ionic mobile).

### 11.3 Bộ component parity bắt buộc

| Component    | Variant bắt buộc                  | Trạng thái bắt buộc                 |
| ------------ | --------------------------------- | ----------------------------------- |
| Button       | primary, secondary, ghost, danger | default, focused, disabled, loading |
| Input        | default                           | default, focused, error, disabled   |
| Select       | default                           | default, focused, error, disabled   |
| Modal/Drawer | default                           | open, close, loading                |
| Toast/Alert  | success, info, warning, error     | show, dismiss                       |
| Badge/Chip   | semantic variants                 | default                             |

### 11.4 Mapping nền tảng

| Lớp              | Web (Angular)               | Mobile (Ionic)                      |
| ---------------- | --------------------------- | ----------------------------------- |
| Tokens           | CSS custom properties       | Ionic CSS variables + mapping token |
| Form controls    | Component web custom/themed | ion-input/ion-select wrapper        |
| Overlay          | Dialog/Drawer web           | ion-modal/ion-sheet wrapper         |
| Navigation shell | Sidebar + header            | Tabs + stack navigation             |

### 11.5 Ràng buộc triển khai giao diện

- Web ưu tiên CSS thuần theo token, không phụ thuộc SCSS cho logic theme mới.
- Mọi chuỗi UI phải hỗ trợ i18n key (Transloco) và metadata động từ backend.

---

_Tài liệu này là nguồn sự thật duy nhất (single source of truth) cho toàn bộ quyết định thiết kế trong dự án Open ERP. Mọi thay đổi phải được cập nhật vào đây trước khi triển khai._
