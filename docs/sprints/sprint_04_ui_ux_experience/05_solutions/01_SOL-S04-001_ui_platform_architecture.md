# [SOL-01] Kiến Trúc Nền Tảng UI/UX Cho Sprint 04

| Trường | Giá trị |
| :--- | :--- |
| ID / loại / sprint | SOL-S04-001 / Giải pháp / Sprint 04 |
| Trạng thái / phiên bản / cập nhật | Draft / 0.1 / 2026-10-05 |
| Owner / reviewer | Solution Architect / Chưa review |
| Đầu vào | [CONF-S04-001](../04_confirmation/01_CONF-S04-001_sprint_04_scope.md) (Draft), [ANL-S04-001…006](../02_analysis/), [BENCH-S04-001](../03_benchmarks/) |
| Đọc trước / đọc tiếp | [CONF-S04-001](../04_confirmation/01_CONF-S04-001_sprint_04_scope.md) / [DES-UI-S04-001](../06_designs/ui_ux/01_DES-UI-S04-001_theme_tokens_and_layout.md) |

> **Lưu ý gate**: đây là **giải pháp đề xuất**, hiệu lực sau khi CONF-S04-001 được duyệt. Không tự nhận Approved.

## 1. Nguyên Tắc Chung

1. **Mọi thứ đổi được bằng token, không sửa từng component.** Theme, motion, spacing, shape đều qua biến/tham số; component không hardcode màu/thời lượng.
2. **Thư viện dùng chung trước, Web/Mobile sau.** Toàn bộ component mới nằm ở `src/frontend/shared/`.
3. **Không thêm runtime dependency.** Feather là **dữ liệu path vendored**; motion dùng CSS + Tailwind v4; context menu/skeleton tự viết.
4. **Giữ bất biến:** mật độ cao, vuông vắn, anti-modal, 100% i18n, tách template `.html`.

## 2. Quyết Định Kiến Trúc

### 2.1. Theme & design tokens (S1)
- **Token 3 tầng**: (a) *primitive* (`--op-color-slate-800`…), (b) *semantic* (`--op-surface`, `--op-text`, `--op-border`, `--op-accent`…), (c) *theme* gán giá trị semantic theo `[data-theme][data-mode]`.
- Áp dụng: `<html data-theme="industrial" class="dark">`; theme chọn trong `ThemeService` (mở rộng, giữ key tương thích).
- Tailwind v4 CSS-first: map semantic token vào `@theme` để sinh utility (`bg-surface`, `text-muted`…); component **chuyển dần** khỏi `neutral-*` cứng sang semantic token.
- **Bất biến mật độ**: theme chỉ được đổi màu/nhấn, và chỉ được đổi spacing/shape trong ngưỡng token cho phép (xem DES-UI-S04-001).
- Lưu sở thích: localStorage (`openerp_theme`, `openerp_theme_mode`) + tuỳ chọn đồng bộ tài khoản (DES-API-S04-001).

### 2.2. Motion (S2)
- **Token motion**: `--op-duration-{fast,base,slow}`, `--op-ease-{standard,decelerate,accelerate}`.
- Kỹ thuật: CSS keyframes + Tailwind utilities + `@starting-style` cho enter; không dùng Angular animations (tránh overhead), trừ trường hợp danh sách lớn cần `OnPush` + CSS class điều khiển.
- Một **lớp chuyển động chung** cho popup (user-menu, notification-bell, context menu, section-nav) để đồng nhất vào/ra.
- **`prefers-reduced-motion: reduce`** ⇒ vô hiệu chuyển động không thiết yếu (giữ phản hồi tức thời).
- **Ngân sách**: chỉ animate `transform`/`opacity`; không animate layout; danh sách dài không stagger toàn bộ (chỉ tối đa ~20 hàng đầu hoặc tắt).

### 2.3. Icon Feather (S3)
- **Dùng npm package `feather-icons`** (MIT, dữ liệu SVG 24×24 stroke 2) làm nguồn icon — khách chốt 2026-10-05 (Q19). Đây là **exception có chủ đích** với chủ trương "hạn chế thư viện bên thứ ba": `feather-icons` chỉ là **gói dữ liệu path**, không phải UI component library, không mang theo framework; `IconComponent` vẫn tự viết trong `src/frontend/shared/components/icon/`.
- Bọc package trong một **registry adapter** (`icon-registry.ts`) để nếu sau này đổi nguồn (vendored/lucide) chỉ sửa một chỗ; cấm import trực tiếp `feather-icons` rải rác trong template.
- `IconComponent` (standalone, `<svg>` inline) nhận `name: IconName`, `size: SizeVariant`, dùng `currentColor`; `decorative` (aria-hidden) vs `labelKey` (aria-label qua i18n).
- `IconName` là enum dùng chung; **cấm** SVG vẽ tay rải rác trong template màn hình sau Sprint 04.

### 2.4. Context menu (S4)
- **`ContextMenuComponent` + `ContextMenuService`** ở shared: mở tại `(x,y)`, tự lật khi sát biên, đóng khi click ngoài/Escape/scroll.
- **`appContextMenuTrigger`** directive gắn vào hàng/danh sách, cấp `items` (data-driven, có `id`, `labelKey`, `icon`, `disabled`, `disabledReasonKey`, `visible`).
- Hành động là **shortcut** tới Drawer/route hiện có, không thay kiến trúc anti-modal.
- Phân quyền: mục không đủ quyền **hiện mờ (disable) kèm lý do** (khách chốt 2026-10-05, Q14) — dùng `RequirePermission`/`AuthService` hiện có.
- **Áp cho tất cả màn danh sách** (Desktop, khách chốt Q20).
- **Mobile: KHÔNG dùng context menu** (khách chốt Q7); giữ nút thao tác hiển thị.
- A11y: `role="menu"/"menuitem"`, roving focus, `Shift+F10`/ContextMenu key.

### 2.5. Loading & skeleton (S5)
- **Top progress bar**: `LoadingService` (đếm request đang chạy) + **HTTP interceptor** toàn cục + component shared ở layout.
- **Skeleton**: component shared `Skeleton` (dòng/khối) và `SkeletonTable` (n hàng, cột cấu hình) + biến thể card/form.
- **Vùng load độc lập**: chuyển các màn gộp `forkJoin` thành **signal tải theo vùng** (mỗi vùng idle/loading/empty/error/loaded). Chỉ tách vùng thực sự độc lập để tránh N+1.
- A11y: `aria-busy` vùng đang tải; thông báo lỗi qua `aria-live`.
- Không nhảy layout: skeleton đúng chiều cao nội dung thật.

### 2.6. Đa ngôn ngữ (S6)
- **`LangCode`** (thay union `'vi' | 'en'`) + **registry** (code, nativeName, dir, ngưỡng phủ).
- Nạp **lazy** `/i18n/<code>.json`; fallback `locale → en → key`; giữ `openerp_lang`.
- **Parity check script** (Node) đối chiếu key giữa các locale; **chỉ phát hành locale đủ 100% key** so với `en` (khách chốt Q5).
- **RTL đầy đủ cho `ar` ngay trong Sprint 04** (khách chốt Q4): dùng thuộc tính logic (`ps-*`/`pe-*`, `ms-*`/`me-*`), set `dir="rtl"` trên `<html>`; icon hướng lật bằng `rtl:scale-x-[-1]`; kiểm gương cho Drawer/bảng/progress bar.
- Format theo locale qua `Intl` (ngày/số/tiền), kế thừa xử lý timezone hiện có.

## 3. Phương Án Bị Loại

| Phương án | Lý do loại |
| :--- | :--- |
| Dùng thư viện icon npm (lucide) | **Chọn `feather-icons`** (dữ liệu SVG, MIT) theo chốt Q19; vẫn **không** dùng UI component library bên thứ ba. Adapter hoá để đổi nguồn dễ. |
| Angular Animations cho mọi chuyển động | Nặng, khó tắt theo reduced-motion toàn cục; CSS đủ đáp ứng |
| Tailwind config nhiều theme bằng class | Trùng lặp utility, phình CSS; CSS custom property + `@theme` gọn hơn |
| Skeleton bằng spinner trong mỗi vùng | Không giữ layout, trải nghiệm kém hơn skeleton |
| Dịch đủ mọi ngôn ngữ ngay | Không khả thi trong 1 sprint; dùng ngưỡng + lộ trình |

## 4. Tác Động & Migration

| Vùng | Tác động |
| :--- | :--- |
| `shared/enums` | Thêm `ThemeId`, `LangCode`, `IconName`, `MotionVariant`; giữ `ColorVariant/SizeVariant/ShapeVariant`. |
| `shared/theme` | `ThemeService` mở rộng (theme + mode), giữ key cũ để tương thích. |
| `shared/components` | Thêm `icon`, `context-menu`, `skeleton`, `top-progress-bar`; popup hiện có thêm motion. |
| `shared/i18n` | Thay union bằng `LangCode`; lazy load; giữ `TranslatePipe/Directive`. |
| Web/Mobile | Cập nhật layout (progress bar, data-theme), các màn danh sách (context menu, skeleton). |
| Backend (tùy chọn) | Lưu sở thích theme/ngôn ngữ vào hồ sơ người dùng (DES-API-S04-001). |

**Migration theme cũ**: `openerp_theme` giá trị `SYSTEM|LIGHT|DARK` ⇒ ánh xạ sang `theme=industrial` + `mode` tương ứng; không mất lựa chọn của người dùng.

## 5. Rủi Ro & Giảm Thiểu

| Rủi ro | Giảm thiểu |
| :--- | :--- |
| Flash sai theme khi tải | Inline script nhỏ trong `index.html` set `data-theme`/`dark` trước khi app boot. |
| Trôi dạt token (`neutral-*` còn sót) | Script/checklist rà soát; chuyển theo từng màn, có regression mật độ. |
| Animation gây chậm | Ngân sách hiệu năng; reduced-motion; không stagger hàng loạt. |
| Context menu phá hành vi chuột phải gốc | Chỉ can thiệp trong vùng danh sách; không chặn mặc định ngoài vùng đó. |
| Dịch thiếu | Parity check + fallback + chỉ phát hành locale đạt ngưỡng. |
| RTL phá layout | Khung trước; bật theo sau khi QA gương đạt. |

## 6. Chưa Kiểm Chứng

Đây là **giải pháp đề xuất**; chi tiết component/token nằm ở [DES-UI-S04-001](../06_designs/ui_ux/01_DES-UI-S04-001_theme_tokens_and_layout.md), [DES-UI-S04-002](../06_designs/ui_ux/02_DES-UI-S04-002_motion_icon_context_menu_skeleton.md), [DES-API-S04-001](../06_designs/api/01_DES-API-S04-001_theme_preferences_and_i18n.md). Chưa có dòng mã hay kết quả kiểm thử nào.
