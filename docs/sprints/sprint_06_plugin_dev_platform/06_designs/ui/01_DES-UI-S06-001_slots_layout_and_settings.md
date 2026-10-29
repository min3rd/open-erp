# [DES-UI-S06-001] Thiết kế UI — header slot, tab cấu hình hệ thống & notification

| Trường | Giá trị |
| :--- | :--- |
| ID / loại / sprint | DES-UI-S06-001 / Thiết kế UI / Sprint 06 |
| Trạng thái / phiên bản / cập nhật | **APPROVED — 2026-10-29** / 1.0 / 2026-10-29 |
| Owner / reviewer | Solution Architect / Developer + QA |
| Đầu vào | [ADR-S06-001](../../05_solutions/02_ADR-S06-001_core_rendered_ui_slots.md), [DES-API-S06-001](../api/01_DES-API-S06-001_manifest_and_ui_manifest.md) |
| Đọc trước / đọc tiếp | [DES-API-S06-001](../api/01_DES-API-S06-001_manifest_and_ui_manifest.md) / [DES-UI-S06-002](02_DES-UI-S06-002_catalog_web_component_migration.md) |

## 1. Mục đích

Đặc tả giao diện cho:

1. `PluginSlotComponent` + contribution outlet trong `@shared`.
2. Header slot trên topbar desktop/mobile.
3. Trang `/settings/system` với tab Core + tab plugin.
4. Plugin `in-app-notification` (header bell + tab cấu hình + screen danh sách).
5. Trạng thái loading/empty/error/forbidden, i18n, accessibility, mobile.

## 2. Nguyên tắc UI

- **High density, sharp**: `text-xs`/`text-sm`, `p-1`/`p-2`, `gap-1`, `rounded-sm`/`rounded-none`; không `rounded-xl`.
- **Anti-modal**: tab là route/URL; form notification dùng Drawer hoặc split, không modal.
- **Không hardcode chuỗi/màu**: i18n key + design tokens (`bg-surface`, `text-ink`, `border-default`).
- **Component dùng chung trước**: slot/outlet/tab-strip nằm trong `src/frontend/shared/`.
- **Plugin không sửa layout Core**: plugin chỉ render trong vùng slot.

## 3. Component mới trong `@shared`

```text
src/frontend/shared/plugin-host/
├── plugin-slot/
│   ├── plugin-slot.component.ts
│   └── plugin-slot.component.html
├── contribution-outlet/
│   ├── contribution-outlet.component.ts
│   └── contribution-outlet.component.html
├── web-component-loader/       # nâng cấp
├── module-federation-loader/   # nâng cấp
└── plugin-host.model.ts        # thêm slots/contribution

src/frontend/shared/components/tab-strip/
├── tab-strip.component.ts
└── tab-strip.component.html
```

### 3.1. `PluginSlotComponent`

```ts
@Component({ selector: 'app-plugin-slot', ... })
export class PluginSlotComponent {
  slot = input.required<string>();
  context = input<PluginContext>({});
  emptyKey = input<string>('PLUGIN_SLOT_EMPTY');
  maxContributions = input<number | null>(null);
}
```

- Đọc `PluginHostService.slots()`; lọc `slot_code === slot()`.
- Sắp xếp `order`; cắt `maxContributions`.
- Mỗi contribution render qua `PluginContributionOutletComponent` trong error boundary.
- Nếu rỗng: render `emptyKey` (có thể ẩn bằng `emptyKey=''`).
- Không tự tạo wrapper trang trí; dùng `display: contents` hoặc `inline-flex` để không phá layout topbar.
- Hỗ trợ `slot` do plugin host: cùng component, dữ liệu từ manifest.

### 3.2. `PluginContributionOutletComponent`

- Input: `contribution`, `context`.
- Kiểm tra `contract_version` major khớp slot; sai ⇒ emit lỗi, không render.
- Kiểm tra `platforms` (desktop/mobile) và `permission` (backend đã lọc, kiểm tra lại).
- Chọn loader:
  - `WEB_COMPONENT` → `PluginWebComponentLoaderComponent`.
  - `MODULE_FEDERATION` → `PluginModuleFederationLoaderComponent`.
- Bọc `<div class="plugin-contribution" [attr.data-plugin]="...">` + error fallback.
- Timeout 10s; retry 1 lần; log telemetry.

### 3.3. Loader contract

| Loader | Input | Output | Ghi chú |
| :--- | :--- | :--- | :--- |
| WC | `entry`, `tagName`, `context`, `isolation` | `routeChange`, `notify`, `resize`, `failed` | Tạo element, set property, append; remove khi destroy |
| MF | `entry`, `exposedModule`, `context` | `routeChange`, `notify`, `resize`, `failed` | `mount(target, context)` trả `{unmount}`; gọi unmount khi destroy |
| Iframe | — | — | **Đã xoá** |

**WC isolation:** `isolation: 'shadow'` cho widget nhỏ (header/tab); `isolation: 'light'` cho full-screen app (catalog) để Tailwind/global style hoạt động. Descriptor có thể khai báo `isolation`; mặc định `shadow` cho contribution, `light` cho screen.

**MF context:** `mount(target, context)`; context gồm theme/language/tenant/user/permissions/apiBaseUrl/navigate/notify/resize.

**Session cache:** `PluginHostService` giữ session token **theo từng `plugin_key`** (Map), không dùng một signal duy nhất, để nhiều plugin/contribution tải đồng thời không ghi đè token của nhau.

## 4. Header slot

### 4.1. Vị trí

`src/frontend/shared/components/topbar/topbar.component.html`:

```html
<header class="h-11 lg:h-12 ...">
  <div class="left">…brand/context…</div>

  <div class="flex items-center gap-1 lg:gap-3">
    <!-- Một instance slot duy nhất, hiển thị cả desktop và mobile.
         Không đặt slot trong 2 nhánh hidden/lg:hidden để tránh mount trùng. -->
    <app-plugin-slot slot="core.layout.header.actions" [context]="headerContext()" />

    <!-- Desktop actions -->
    <div class="hidden lg:flex items-center gap-2">
      <app-notification-bell ... />
      <app-user-menu ... />
    </div>

    <!-- Mobile hamburger -->
    <button class="lg:hidden ..." hamburger ... />
  </div>
</header>
```

- Contribution header phải là action compact (button/icon + badge), cao 32–40px.
- Không contribution nào được thay thế user menu/hamburger.
- Slot chỉ mount **một lần**; desktop/mobile dùng CSS responsive, không nhân đôi component.
- Nếu quá nhiều contribution, ẩn phần dư bằng CSS/overflow menu (S06 giới hạn mềm; plugin chỉ nên khai báo 1 action mobile).
- `headerContext()`: theme, language, direction, tenant, user, permissions, apiBaseUrl, navigate, notify.

### 4.2. Notification bell contribution

- Tag `op-in-app-notification-bell`; hiển thị icon chuông + badge số chưa đọc.
- Click: mở drawer danh sách gần nhất (không đổi route); nút “Xem tất cả” trong footer mới emit `op:navigate` tới `/settings/apps/in-app-notification` (Q20).
- `aria-label` từ i18n; badge `aria-live="polite"`.
- **Thay bell Core** (Q19); plugin là nguồn thông báo duy nhất.
- Mobile: hiển thị icon-only, touch target ≥40px.

## 5. Trang `/settings/system`

### 5.1. Route & layout

- Thêm route con trong `settings-layout`:
  - `/settings/system` → `SystemSettingsComponent`.
  - Query `?tab=<id>` giữ tab; hoặc nested `/settings/system/:tab`.
- Đề xuất query `?tab=` để không phá route con; `tab` mặc định `general`.
- Thêm menu item `SETTINGS_SYSTEM_TITLE` (icon `settings`) vào nhóm `SETTINGS_GROUP_SYSTEM` trong `settings-layout.component.ts`, trước `plugins`; quyền `core:tenant:settings-manage`.
- Trang nằm trong settings layout hiện có (topbar + menu + main).
- Không modal; tab content render inline.

### 5.2. Tab Core + tab plugin

| Tab | Nguồn | Nội dung S06 |
| :--- | :--- | :--- |
| `general` | Core | Thông tin tenant/system read-only + link cấu hình hiện có |
| `plugins` | Core | Tóm tắt plugin đang bật + link `/settings/plugins` |
| `<contribution.id>` | Slot `core.settings.system.tabs` | Nội dung do plugin render |

- Tab plugin lấy từ `PluginHostService.slots()`; chỉ contribution `platforms` có `desktop`.
- Mỗi tab plugin là một contribution; `title_key` làm nhãn; `order` sắp xếp.
- Nếu tab đang chọn không còn (plugin tắt), fallback `general` + thông báo.
- Tab strip dùng `TabStripComponent` (shared): `role="tablist"`, `role="tab"`, `aria-selected`, keyboard arrow/Home/End.
- Tab content: `<app-plugin-slot [slot]="'core.settings.system.tabs'" ...>` chỉ render contribution đang chọn? Thiết kế `PluginSlotComponent` nhận `filterId` hoặc trang render `PluginContributionOutletComponent` trực tiếp cho tab đang chọn. Đề xuất outlet trực tiếp để tránh render tất cả tab.
- Tab plugin desktop-only trong S06; mobile chỉ thấy tab Core (Q14 A).

### 5.3. Trạng thái

| Trạng thái | UI |
| :--- | :--- |
| Loading manifest | Skeleton tab strip + content |
| Không có tab plugin | Chỉ tab Core; không hiện empty |
| Tab plugin lỗi | Nội dung fallback trong tab, không mất tab |
| Plugin tắt | Tab biến mất; nếu đang chọn → `general` |
| Thiếu quyền | Tab không hiện (backend đã lọc) |

### 5.4. Notification settings tab

- Form: `channel_in_app` toggle, `channel_email` toggle, `level_min` select.
- Nút Lưu/Hủy dùng `SharpButton`; lưu qua plugin API; thành công phát `op:notify` code `IN_APP_NOTIFICATION_SETTINGS_SAVED`.
- Layout 1 cột, `text-xs`, `p-2`, `space-y-1.5`; không modal.
- i18n key: `PLUGIN_IN_APP_NOTIFICATION_SETTINGS_TITLE`, `..._CHANNEL_IN_APP`, `..._CHANNEL_EMAIL`, `..._LEVEL_MIN`, `..._SAVED`.

### 5.5. Dashboard & settings sections

| Slot | Vị trí | Render |
| :--- | :--- | :--- |
| `core.dashboard.widgets` | Dashboard, dưới KPI/trước bảng | Grid responsive 1/2/3 cột; contribution là card; rỗng ⇒ ẩn section |
| `core.settings.sections` | Tab `general` của `/settings/system`, dưới thông tin chung | Danh sách card section; rỗng ⇒ ẩn |

- Cả hai slot dùng `PluginSlotComponent`; contribution tự chịu trách nhiệm nội dung.
- Card dùng token `bg-surface`, `border-default`, `rounded-container`; không hardcode màu.
- Dashboard/settings sections desktop; mobile ẩn nếu contribution không khai báo `mobile`.

## 6. Plugin `in-app-notification` — bell drawer + screen danh sách

- Bell trên header mở **drawer** (shared `app-drawer`) với 6 thông báo gần nhất, badge mức, thời gian; click item đánh dấu đã đọc; có “Đọc tất cả”.
- Nút **Xem tất cả** trong footer drawer mới điều hướng `op:navigate` tới `/settings/apps/in-app-notification`.
- Screen `/apps/in-app-notification` (hoặc `/apps/in-app-notification/notifications`) dùng CRUD codegen:
  - List: title, level badge, read_at, created_at; filter level/read; pagination.
  - Drawer: chi tiết + đánh dấu đã đọc.
- Manifest có screen WC + 2 contribution (header, settings tab).
- Route host `/settings/apps/in-app-notification`; mobile có thể read-only.
- Bell Core cũ đã bỏ; plugin bell là nguồn thông báo duy nhất.

## 7. Mobile

- Header: slot render tối đa 2 contribution; icon-only; touch ≥40px; không tràn ngang.
- Settings system: tab Core dạng vertical list/select; tab plugin ẩn (desktop-only S06).
- Notification screen: list read-only, filter cơ bản; 390×844 overflow 0.
- Catalog WC: `readonly=true`; touch ≥40px; không hover-only.

## 8. i18n & accessibility

### 8.1. Key mới (tối thiểu)

| Key | Dùng |
| :--- | :--- |
| `SETTINGS_SYSTEM_TITLE` | Tiêu đề trang |
| `SETTINGS_SYSTEM_TAB_GENERAL` | Tab Core |
| `SETTINGS_SYSTEM_TAB_PLUGINS` | Tab Core |
| `PLUGIN_SLOT_EMPTY` | Slot rỗng |
| `PLUGIN_CONTRIBUTION_ERROR` | Contribution lỗi |
| `PLUGIN_HOST_UNAVAILABLE` | Manifest lỗi |
| `PLUGIN_IN_APP_NOTIFICATION_*` | Plugin notification |

- Cập nhật tất cả locale đang bật (13 locale) hoặc tối thiểu vi/en nếu scope QA cho phép; chạy `npm run i18n:check:strict`.

### 8.2. Accessibility

- Tab: `role=tablist/tab/tabpanel`, `aria-controls`, `aria-selected`, keyboard.
- Icon-only: `aria-label`/`labelKey`.
- Focus visible; không trap focus trong slot.
- Badge: `aria-live=polite`, không chỉ dựa màu.
- Touch target ≥40px mobile.

## 9. Browser QA

| Case | Desktop ≥1280 | Mobile 390×844 |
| :--- | :--- | :--- |
| Header slot hiển thị/ẩn theo plugin | ✅ | ✅ (tối đa 2) |
| Settings tab plugin | ✅ | Ẩn (S06) |
| Tắt plugin | Header/tab biến mất | Header biến mất |
| Thiếu quyền | Không thấy contribution | Không thấy |
| Contribution lỗi | Fallback, layout OK | Fallback, overflow 0 |
| Theme sáng/tối | ✅ | ✅ |
| i18n vi/en | ✅ | ✅ |
| Console error | 0 | 0 |

## 9.1. Addendum Q19 — notification settings (2026-10-29)

- Platform portal `/platform/notification-settings`: form defaults (tên hiển thị, email hỗ trợ, kênh, mức tối thiểu), menu “Cấu hình thông báo nền tảng”.
- Tab Cấu hình thông báo tenant: hiển thị defaults nền tảng; toggle “Dùng mặc định nền tảng”; tắt toggle để nhập riêng.
- Bỏ `NotificationBellComponent`/`NotificationBannerComponent` khỏi topbar/dashboard/settings Web và dashboard Mobile; plugin bell là chuông duy nhất.
- Bell drawer dùng shared `app-drawer`; footer “Xem tất cả” mới điều hướng. Drawer được portal ra `document.body` để thoát `contain: content` của Ionic toolbar và phủ full viewport trên mobile.

## 10. Lịch sử

| Phiên bản | Ngày | Thay đổi | Nguồn |
| :--- | :--- | :--- | :--- |
| 0.1 | 2026-10-29 | Thiết kế slot/outlet/header/settings/notification/mobile/QA | Architect; ADR/DES-API-S06 |
| 1.0 | 2026-10-29 | Chủ dự án duyệt design ready (Q17 + design review); Thiết kế slot/outlet/header/settings/notification/mobile/QA | Architect; ADR/DES-API-S06 |
