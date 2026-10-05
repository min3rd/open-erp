# [DES-UI-S04-002] Thiết Kế Motion, Icon, Context Menu & Skeleton

| Trường | Giá trị |
| :--- | :--- |
| ID / loại / sprint | DES-UI-S04-002 / Thiết kế UI/UX / Sprint 04 |
| Trạng thái / phiên bản / cập nhật | Draft / 0.1 / 2026-10-05 |
| Owner / reviewer | Solution Architect / Chưa review |
| Đầu vào | [CONF-S04-001](../../04_confirmation/01_CONF-S04-001_sprint_04_scope.md) (Draft), [SOL-S04-001](../../05_solutions/01_SOL-S04-001_ui_platform_architecture.md) |
| Đọc trước / đọc tiếp | [DES-UI-S04-001](01_DES-UI-S04-001_theme_tokens_and_layout.md) / [DES-API-S04-001](../api/01_DES-API-S04-001_theme_preferences_and_i18n.md) |

## 1. Motion (AC-04, AC-05)

### 1.1. Token
| Token | Giá trị mặc định | Dùng cho |
| :--- | :--- | :--- |
| `--op-duration-fast` | `120ms` | Hover, feedback, tooltip |
| `--op-duration-base` | `160ms` | Popup menu, context menu, fade |
| `--op-duration-slow` | `220ms` | Drawer slide, route/panel |
| `--op-ease-standard` | `cubic-bezier(.2,0,0,1)` | Vào/ra chung |
| `--op-ease-decelerate` | `cubic-bezier(0,0,.2,1)` | Phần tử xuất hiện |
| `--op-ease-accelerate` | `cubic-bezier(.4,0,1,1)` | Phần tử biến mất |

> Chủ dự án chốt: **animation nhanh, hiệu năng cao** ⇒ không dùng thời lượng > 220ms cho chuyển động thường.

### 1.2. Danh mục
| Mã | Chuyển động | Cách làm |
| :--- | :--- | :--- |
| M1 | Popup vào/ra (user-menu, notification-bell, section-nav, context menu) | fade + translate nhẹ (`scale`/`translate-y-1`) |
| M2 | Drawer trượt | `translate-x` (đã có, giữ) + backdrop fade |
| M3 | Hàng danh sách xuất hiện | fade nhẹ; **chỉ tối đa ~20 hàng**, còn lại tức thời |
| M4 | Chuyển route | fade/translate ngắn ở `<router-outlet>` (không dùng cho trang nặng) |
| M5 | Skeleton shimmer | keyframe `pulse`/shimmer, tắt khi reduced-motion |
| M6 | Skeleton → nội dung | crossfade ngắn |
| M7 | Phản hồi hành động (nút/toggle/badge) | scale/color, `fast` |
| M8 | Thanh progress trên cùng | chạy mượt theo tiến độ, không giật |

### 1.3. Quy tắc bắt buộc
- Chỉ animate **`transform`/`opacity`** (và `background-color` cho feedback). Không animate `height/width/top/left`.
- `@media (prefers-reduced-motion: reduce)` ⇒ tắt M1/M3/M4/M5/M6, giữ M7 tức thời.
- Không stagger toàn bộ danh sách lớn (chặn ở ~20 hàng hoặc tắt khi > ngưỡng).
- **Chuyển động đổi route có trong scope** (Q18): M4 bật cho route nhẹ; route dữ liệu nặng chỉ fade ngắn hoặc tắt.
- API component: input `motion?: MotionVariant` (enum dùng chung), mặc định theo token; không rải class animation ad-hoc trong màn hình.

## 2. Icon Feather (AC-06, AC-07)

### 2.1. Component `app-icon` (shared)
| Input | Kiểu | Ghi chú |
| :--- | :--- | :--- |
| `name` | `IconName` (enum) | Bắt buộc; tra qua adapter `feather-icons` (npm) trong `icon-registry.ts` |
| `size` | `SizeVariant` | Mặc định `SM` (~16px); map `XS..XL` ⇒ 12/16/20/24/32 |
| `decorative` | `boolean` | `true` ⇒ `aria-hidden="true"` (icon kèm nhãn chữ) |
| `labelKey` | `string?` | Khi icon-only ⇒ `aria-label` qua i18n |

- Render `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">`; path lấy từ package **`feather-icons`** (MIT) qua một adapter tập trung — **không** import trực tiếp trong template, không thêm UI component library (`feather-icons` chỉ là dữ liệu SVG).
- Một số icon phải có `rtl-mirror: true` (mũi tên, chevron, back/next) ⇒ lật khi `dir="rtl"` (đầy đủ trong Sprint 04 theo AC-16).

### 2.2. Quy tắc dùng
| Ngữ cảnh | Quy tắc |
| :--- | :--- |
| Hành động chính (nút có chữ) | icon + nhãn |
| Hàng bảng / context menu / icon-only gọn | icon-only + `labelKey` (tooltip/aria) |
| Trạng thái (badge) | icon + màu theo `ColorVariant`, kèm text |
| Không có trong registry | bổ sung vào registry chung; **cấm** SVG vẽ tay trong template màn hình |

## 3. Context Menu (AC-08, AC-09, AC-10)

### 3.1. Thành phần shared
- `ContextMenuService.open({ x, y, items, ariaLabelKey })`; đóng khi click ngoài, `Escape`, scroll, resize, blur.
- `ContextMenuComponent` render `role="menu"` + `role="menuitem"`, tự **lật** khi sát biên phải/dưới, kẹp trong viewport.
- `appContextMenuTrigger` directive gắn vào hàng danh sách: nhận `items` (data-driven) và `mouse`/`keyboard` (Shift+F10 / ContextMenu key).

### 3.2. Item
| Thuộc tính | Kiểu | Ghi chú |
| :--- | :--- | :--- |
| `id` | string | Định danh hành động |
| `labelKey` | string | i18n |
| `icon` | `IconName?` | Icon Feather |
| `visible` | boolean | Ẩn không áp dụng |
| `disabled` | boolean | Ví dụ khi record đang khoá |
| `disabledReasonKey` | string? | **Lý do hiển thị khi mục thiếu quyền/không áp dụng** (Q14) |
| `danger` | boolean | Hành động phá huỷ ⇒ `ColorVariant.DANGER` |
| `action` | callback/route | Là **shortcut** tới Drawer/route hiện có |

### 3.3. Ràng buộc
- **Chỉ Desktop** (Q7). Mobile giữ nút/luồng hiện có — **không** long-press.
- Không chặn menu chuột phải mặc định ngoài vùng danh sách.
- Hành động phải trùng với hành động inline/route hiện có (không tạo đường nghiệp vụ mới).
- Phân quyền: mục không đủ quyền **hiện mờ (disable) kèm lý do** (Q14), dùng `RequirePermission`/`AuthService` hiện có.
- Mục hiển thị **icon + nhãn chữ** (Q15).

### 3.4. Áp dụng bản đầu
**Tất cả màn danh sách** (Q20): role-matrix, members, plugin-marketplace, sample-record-list, danh sách phiên/credential, và các bảng dùng `shared/components/table`.

## 4. Loading Progress & Skeleton (AC-11, AC-12, AC-13)

### 4.1. Thanh progress trên cùng
- `LoadingService` (đếm request đang chạy) + **HTTP interceptor** toàn cục; component `TopProgressBar` gắn ở layout (Web: trên `<router-outlet>`; Mobile: đầu `ion-content` hoặc header).
- Hiển thị khi có ≥1 request; **chỉ hiện sau ~150ms** để tránh nhấp nháy với phản hồi nhanh (Q16); ẩn khi về 0.

### 4.2. Skeleton
| Component | Input | Dùng cho |
| :--- | :--- | :--- |
| `app-skeleton` | `variant: line\|block\|circle`, `width`, `height` | Khối chung |
| `app-skeleton-table` | `rows`, `columns` | Bảng danh sách |
| (biến thể) | `variant: card` | Thẻ plugin, mini card |

- Kích thước skeleton **khớp** nội dung thật để không nhảy layout.
- `aria-busy="true"` trên vùng đang tải.

### 4.3. Mô hình vùng load độc lập
Mỗi vùng có trạng thái riêng: `idle → loading → (empty | error | loaded)`.

| Bước | Hành vi |
| :--- | :--- |
| Tách vùng | Chuyển `forkJoin` gộp thành signal tải theo vùng (ví dụ organization: branches ▸ departments ▸ memberships độc lập). |
| Không N+1 | Chỉ tách khi vùng **thực sự độc lập**; phần phụ thuộc giữ chung 1 call. |
| Ưu tiên | Vùng nhanh hiện trước; vùng chậm hiện skeleton tới khi xong. |
| Lỗi | Vùng lỗi hiện thông báo + nút thử lại cục bộ (không chặn vùng khác), `aria-live="polite"`. |

> Bản đầu áp dụng: organization, role-matrix, members, plugin-marketplace, sample-record-list, dashboard (thẻ số liệu).

## 5. i18n Cần Thêm (cho bước 07)

| Nhóm key | Ví dụ |
| :--- | :--- |
| Tooltip/aria icon & context menu | `COMMON_MORE_ACTIONS`, `COMMON_CONTEXT_MENU` |
| Theme | `THEME_LABEL`, `THEME_INDUSTRIAL`, `THEME_SLATE_BLUE`, `THEME_EMERALD`, `THEME_AMBER` |
| Ngôn ngữ | tên bản địa trong registry (không dịch tên ngôn ngữ) |
| Skeleton/a11y | `COMMON_LOADING_REGION`, `COMMON_RETRY` |

## 6. Truy Vết & Chưa Kiểm Chứng

| AC | Phần thiết kế |
| :--- | :--- |
| AC-04, AC-05 | §1 |
| AC-06, AC-07 | §2 |
| AC-08, AC-09, AC-10 | §3 |
| AC-11, AC-12, AC-13 | §4 |

**Chưa kiểm chứng**: chưa có component/mã thật, chưa đo FPS, chưa kiểm a11y thực tế. Ngưỡng số hàng stagger và danh sách màn áp dụng sẽ chốt khi triển khai.
