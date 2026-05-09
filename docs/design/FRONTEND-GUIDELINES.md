# Frontend Guidelines — Open ERP SaaS Platform

**Phiên bản:** 1.1  
**Ngày tạo:** 09/05/2026  
**Ngày cập nhật:** 09/05/2026  
**Tác giả:** UI/UX Designer  
**Áp dụng cho:** Frontend Agent (Angular 21) · Mobile Agent (Ionic Angular 8)  
**Tham chiếu:** [Design System](DESIGN-SYSTEM.md) · [Screen Specs](SCREEN-SPECS.md)

---

## Mục lục

**Phần A — Angular 21 (Web)**
1. [CSS Custom Properties & Design Tokens](#a1-css-custom-properties--design-tokens)
2. [Color Mode Strategy & Persistence](#a2-color-mode-strategy--persistence)
3. [Angular Material v17+ Theming](#a3-angular-material-v17-theming)
4. [Tailwind CSS Mapping](#a4-tailwind-css-mapping)
5. [Component Naming Conventions](#a5-component-naming-conventions)
6. [File Structure Conventions](#a6-file-structure-conventions)
7. [Accessibility (A11y)](#a7-accessibility-a11y)
8. [Internationalization (i18n)](#a8-internationalization-i18n)

**Phần B — Ionic 8 (Mobile)**
9. [Override Ionic CSS Variables](#b1-override-ionic-css-variables)
10. [ion-Component Usage Guidelines](#b2-ion-component-usage-guidelines)
11. [Native Feel Patterns](#b3-native-feel-patterns)
12. [Offline Handling UI](#b4-offline-handling-ui)
13. [Push Notification UI](#b5-push-notification-ui)

---

## Phần A — Angular 21 (Web)

---

### A1. CSS Custom Properties & Design Tokens

Tất cả design tokens phải được định nghĩa dưới dạng CSS custom properties trong file `styles/tokens.css` (hoặc `_tokens.scss`). **KHÔNG hardcode giá trị màu, font, spacing** trực tiếp trong component styles.

#### A1.1 Cấu trúc file tokens

```
src/
└── styles/
    ├── tokens.css          ← Tất cả CSS custom properties
    ├── typography.css      ← Type scale classes
    ├── reset.css           ← Normalize / reset
    └── global.css          ← Import tất cả, global styles
```

#### A1.2 Nội dung `styles/tokens.css`

```css
:root {
  /* ── Brand ── */
  --color-brand-primary:        #111111;
  --color-brand-accent:         #3b82f6;

  /* ── Badge Pastels ── */
  --color-badge-orange:         #fb923c;
  --color-badge-pink:           #ec4899;
  --color-badge-violet:         #8b5cf6;
  --color-badge-emerald:        #34d399;

  /* ── Surface ── */
  --color-surface-canvas:       #ffffff;
  --color-surface-soft:         #f8f9fa;
  --color-surface-card:         #f5f5f5;
  --color-surface-strong:       #e5e7eb;
  --color-surface-dark:         #101010;
  --color-surface-dark-elevated:#1a1a1a;

  /* ── Border ── */
  --color-border-hairline:      #e5e7eb;
  --color-border-hairline-soft: #f3f4f6;

  /* ── Text ── */
  --color-text-ink:             #111111;
  --color-text-body:            #374151;
  --color-text-muted:           #6b7280;
  --color-text-muted-soft:      #898989;
  --color-text-on-dark:         #ffffff;
  --color-text-on-dark-soft:    #a1a1aa;

  /* ── Semantic ── */
  --color-semantic-success:     #10b981;
  --color-semantic-warning:     #f59e0b;
  --color-semantic-error:       #ef4444;
  --color-semantic-info:        #3b82f6;

  /* ── Typography ── */
  --font-display: 'Cal Sans', 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
  --font-body:    'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Helvetica Neue', sans-serif;
  --font-mono:    'JetBrains Mono', 'Fira Code', 'Cascadia Code', monospace;

  /* ── Spacing ── */
  --space-1:  4px;
  --space-2:  8px;
  --space-3:  12px;
  --space-4:  16px;
  --space-6:  24px;
  --space-8:  32px;
  --space-12: 48px;
  --space-24: 96px;

  /* ── Radius ── */
  --radius-xs:   4px;
  --radius-sm:   6px;
  --radius-md:   8px;
  --radius-lg:   12px;
  --radius-xl:   16px;
  --radius-full: 9999px;

  /* ── Motion ── */
  --motion-fade:     150ms ease;
  --motion-slide:    200ms ease-out;
  --motion-modal:    200ms ease;
  --motion-sidebar:  250ms ease;
  --motion-skeleton: 1500ms ease-in-out;

  /* ── Sizing ── */
  --size-sidebar-expanded:  240px;
  --size-sidebar-collapsed:  64px;
  --size-header-height:       64px;
  --size-tab-bar-height:      56px;
  --size-input-height:        40px;
  --size-input-sm-height:     32px;
  --size-avatar:              36px;
}

/* Accessibility: giảm animation khi người dùng yêu cầu */
@media (prefers-reduced-motion: reduce) {
  * {
    animation-duration: 0.01ms !important;
    transition-duration: 0.01ms !important;
  }
}
```

#### A1.3 Dark Mode Tokens và Rules Override

Tất cả token màu phải có khả năng override theo mode bằng cùng tên token. Không tạo class màu rời theo component.

```css
:root {
  color-scheme: light;
}

:root[data-color-mode='dark'] {
  color-scheme: dark;

  --color-brand-primary:        #f3f4f6;
  --color-brand-accent:         #60a5fa;

  --color-surface-canvas:       #0b1220;
  --color-surface-soft:         #111827;
  --color-surface-card:         #1f2937;
  --color-surface-strong:       #374151;

  --color-border-hairline:      #334155;
  --color-border-hairline-soft: #1f2937;

  --color-text-ink:             #f9fafb;
  --color-text-body:            #e5e7eb;
  --color-text-muted:           #9ca3af;
  --color-text-muted-soft:      #6b7280;

  --color-semantic-success:     #34d399;
  --color-semantic-warning:     #fbbf24;
  --color-semantic-error:       #f87171;
  --color-semantic-info:        #60a5fa;
}
```

### A2. Color Mode Strategy & Persistence

Thứ tự ưu tiên resolve mode bắt buộc:

1. `user setting` (vừa chọn tại UI)
2. `persisted` (đã lưu trước đó)
3. `system` (`prefers-color-scheme`)

Chuẩn key lưu trữ:

- `openErp.colorMode`
- Web: `localStorage.setItem('openErp.colorMode', mode)`
- Mobile: `Capacitor Preferences` cùng key `openErp.colorMode`

Giá trị hợp lệ: `light` | `dark` | `system`

#### A2.1 Do / Don't cho Color Mode

**DO**
- Dùng token `var(--color-...)` trong toàn bộ CSS/SCSS.
- Test contrast ở cả light và dark trước khi merge.
- Sync trạng thái mode giữa shell web, mobile app shell và trang đăng nhập.

**DON'T**
- Không hardcode màu (`#fff`, `#111`, `rgb(...)`) trong component styles.
- Không gắn class `dark` theo từng component con gây lệch theme.
- Không chỉ test dark mode ở một vài màn hình "happy path".

#### A2.2 Sử dụng trong Component

```scss
/* ✅ ĐÚNG — Dùng CSS variable */
.btn-primary {
  background-color: var(--color-brand-primary);
  color: var(--color-text-on-dark);
  border-radius: var(--radius-md);
  height: var(--size-input-height);
  font-size: 14px;
  font-weight: 600;
}

/* ❌ SAI — Hardcode giá trị */
.btn-primary {
  background-color: #111111;
  color: white;
  border-radius: 8px;
}
```

---

### A3. Angular Material v17+ Theming

Open ERP dùng Angular Material v17+ với M3 theming system. Cần override để phù hợp với Open ERP Design System.

#### A3.0 Lưu ý version

Mặc dù tiêu đề đang ghi Angular Material v17+, dự án Angular 21 vẫn áp dụng cùng nguyên tắc M3 theme ở tài liệu này.

#### A3.1 Thiết lập theme trong `styles/material-theme.scss`

```scss
@use '@angular/material' as mat;

// Định nghĩa light/dark theme từ Open ERP tokens
$open-erp-light-theme: mat.m3-define-theme((
  color: (
    theme-type: light,
    primary: mat.$blue-palette,      // #3b82f6 (accent dùng trong app)
    tertiary: mat.$neutral-palette,
  ),
  typography: (
    plain-family: 'Inter',
    brand-family: 'Inter',           // Cal Sans chỉ dùng qua custom classes
    bold-weight: 600,
    medium-weight: 500,
    regular-weight: 400,
  ),
));

$open-erp-dark-theme: mat.m3-define-theme((
  color: (
    theme-type: dark,
    primary: mat.$blue-palette,
    tertiary: mat.$neutral-palette,
  ),
  typography: (
    plain-family: 'Inter',
    brand-family: 'Inter',
    bold-weight: 600,
    medium-weight: 500,
    regular-weight: 400,
  ),
));

// Apply light mặc định
html {
  @include mat.all-component-themes($open-erp-light-theme);
}

// Apply dark theo data attribute
html[data-color-mode='dark'] {
  @include mat.all-component-colors($open-erp-dark-theme);
}
```

#### A3.2 Override Angular Material Components

```scss
// Override input để match Design System
.mat-mdc-form-field {
  .mat-mdc-text-field-wrapper {
    background-color: var(--color-surface-canvas);
    border-radius: var(--radius-md);
    border: 1px solid var(--color-border-hairline);
  }

  &.mat-focused .mat-mdc-text-field-wrapper {
    border-color: var(--color-brand-accent);
    box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.15);
  }
}

// Override button
.mat-mdc-button.mat-primary {
  background-color: var(--color-brand-primary) !important;
  color: var(--color-text-on-dark) !important;
  border-radius: var(--radius-md) !important;
  font-weight: 600 !important;
}
```

#### A3.3 Khi nào dùng Angular Material vs Custom Component

| Dùng Angular Material | Dùng Custom Component |
|---|---|
| Date picker (mat-datepicker) | Buttons (btn-primary, btn-secondary...) |
| Select / Autocomplete | Table (data-dense ERP table) |
| Dialog (mat-dialog) | Sidebar navigation |
| Tooltip (mat-tooltip) | KPI widgets |
| Progress bar | Badge/chips |
| Snackbar | Page header |

#### A3.4 ThemeService / ColorModeService (Angular 21)

```ts
import { DOCUMENT } from '@angular/common';
import { Injectable, Inject, signal, effect } from '@angular/core';

export type ColorMode = 'light' | 'dark' | 'system';

@Injectable({ providedIn: 'root' })
export class ColorModeService {
  private readonly storageKey = 'openErp.colorMode';
  readonly mode = signal<ColorMode>('system');

  constructor(@Inject(DOCUMENT) private readonly document: Document) {
    const persisted = (localStorage.getItem(this.storageKey) as ColorMode | null) ?? 'system';
    this.mode.set(persisted);

    effect(() => {
      const resolved = this.resolveMode(this.mode());
      this.document.documentElement.setAttribute('data-color-mode', resolved);
    });
  }

  setMode(mode: ColorMode): void {
    this.mode.set(mode);
    localStorage.setItem(this.storageKey, mode);
  }

  private resolveMode(mode: ColorMode): 'light' | 'dark' {
    if (mode === 'light' || mode === 'dark') {
      return mode;
    }
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  }
}
```

> Nếu dùng chung service cho mobile shell, thay tầng lưu trữ bằng adapter `Capacitor Preferences` nhưng giữ nguyên key `openErp.colorMode`.

---

### A4. Tailwind CSS Mapping

Nếu dự án dùng Tailwind CSS cùng Angular, cấu hình `tailwind.config.js` để map design tokens:

```js
// tailwind.config.js
module.exports = {
  content: ['./src/**/*.{html,ts}'],
  theme: {
    extend: {
      colors: {
        brand: {
          primary: '#111111',
          accent:  '#3b82f6',
        },
        surface: {
          canvas:       '#ffffff',
          soft:         '#f8f9fa',
          card:         '#f5f5f5',
          strong:       '#e5e7eb',
          dark:         '#101010',
          'dark-elev':  '#1a1a1a',
        },
        border: {
          hairline:     '#e5e7eb',
          'hairline-soft': '#f3f4f6',
        },
        ink:            '#111111',
        body:           '#374151',
        muted:          '#6b7280',
        'muted-soft':   '#898989',
        semantic: {
          success:      '#10b981',
          warning:      '#f59e0b',
          error:        '#ef4444',
          info:         '#3b82f6',
        },
      },
      fontFamily: {
        display: ['Cal Sans', 'Inter', 'sans-serif'],
        body:    ['Inter', 'sans-serif'],
        mono:    ['JetBrains Mono', 'monospace'],
      },
      borderRadius: {
        'xs': '4px',
        'sm': '6px',
        'md': '8px',
        'lg': '12px',
        'xl': '16px',
      },
      spacing: {
        '18': '72px',
        '24': '96px',
      },
    },
  },
};
```

**Utility classes hay dùng trong ERP:**
```html
<!-- Page header -->
<div class="flex items-center justify-between px-6 py-4 border-b border-hairline">

<!-- Feature card -->
<div class="bg-surface-card rounded-lg p-8">

<!-- KPI number -->
<span class="text-4xl font-semibold text-ink">

<!-- Badge active -->
<span class="bg-green-50 text-green-700 border border-green-200 rounded-full px-2.5 py-1 text-xs font-medium">
  Hoạt động
</span>

<!-- Table row -->
<tr class="border-b border-border-hairline-soft hover:bg-surface-soft transition-colors">
```

---

### A5. Component Naming Conventions

#### A4.1 Quy ước đặt tên Angular Component

```
Prefix: erp-
Format: erp-[domain]-[component-name]
```

| Loại Component | Ví dụ tên | File |
|---|---|---|
| Shared UI | `erp-button` | `shared/ui/button/` |
| Shared UI | `erp-data-table` | `shared/ui/data-table/` |
| Shared UI | `erp-badge` | `shared/ui/badge/` |
| Feature | `erp-user-list` | `features/users/user-list/` |
| Feature | `erp-user-form` | `features/users/user-form/` |
| Layout | `erp-app-shell` | `layout/app-shell/` |
| Layout | `erp-sidebar` | `layout/sidebar/` |
| Page | `erp-dashboard-page` | `pages/dashboard/` |

#### A4.2 Quy ước CSS Class trong Component

```scss
// Dùng BEM-lite: block__element--modifier
.erp-btn { }                    // block
.erp-btn--primary { }           // modifier
.erp-btn--sm { }                // modifier size
.erp-btn__icon { }              // element

.erp-table { }
.erp-table__header { }
.erp-table__row { }
.erp-table__row--selected { }
.erp-table__cell { }
```

#### A4.3 Template Pattern chuẩn

```html
<!-- Mỗi component phải có: role, aria-label (nếu cần), data-testid -->
<button
  class="erp-btn erp-btn--primary"
  [disabled]="isLoading"
  [attr.aria-busy]="isLoading"
  data-testid="btn-save-user"
  (click)="onSave()"
>
  <erp-icon name="save" size="16" *ngIf="!isLoading" />
  <erp-spinner size="16" *ngIf="isLoading" />
  {{ isLoading ? 'Đang lưu...' : 'Lưu' }}
</button>
```

---

### A6. File Structure Conventions

#### A5.1 Cấu trúc module tính năng (Feature Module)

```
src/app/
├── core/                          ← Singleton services, guards, interceptors
│   ├── auth/
│   │   ├── auth.service.ts
│   │   ├── auth.guard.ts
│   │   └── token.interceptor.ts
│   ├── tenant/
│   │   └── tenant.service.ts
│   └── core.module.ts
│
├── shared/                        ← Component, directive, pipe tái sử dụng
│   ├── ui/
│   │   ├── button/
│   │   │   ├── button.component.ts
│   │   │   ├── button.component.html
│   │   │   └── button.component.scss
│   │   ├── data-table/
│   │   ├── badge/
│   │   ├── modal/
│   │   ├── drawer/
│   │   ├── kpi-widget/
│   │   └── ...
│   ├── pipes/
│   │   ├── currency-vnd.pipe.ts    ← Format tiền VND
│   │   └── date-vi.pipe.ts         ← Format ngày Việt Nam
│   └── shared.module.ts
│
├── layout/                        ← App shell layout
│   ├── app-shell/
│   ├── sidebar/
│   ├── header-bar/
│   └── public-layout/
│
├── features/                      ← Feature modules theo phân hệ
│   ├── auth/                      ← Login, Register, Reset password
│   ├── dashboard/
│   ├── system-admin/
│   │   ├── users/
│   │   ├── roles/
│   │   ├── departments/
│   │   ├── audit-log/
│   │   └── settings/
│   ├── hr/
│   ├── sale/
│   ├── accounting/
│   ├── office/
│   └── ai-agent/
│
└── app.routes.ts
```

#### A5.2 Cấu trúc trong một Feature

```
features/system-admin/users/
├── user-list/
│   ├── user-list.component.ts
│   ├── user-list.component.html
│   └── user-list.component.scss
├── user-form/
│   ├── user-form.component.ts
│   ├── user-form.component.html
│   └── user-form.component.scss
├── user-detail/
├── services/
│   └── user.service.ts            ← API calls
├── models/
│   └── user.model.ts              ← TypeScript interfaces
└── users.routes.ts
```

#### A5.3 Quy tắc bắt buộc

- Mỗi component trong thư mục riêng, không gom nhiều component vào 1 file
- Style chỉ dùng `ViewEncapsulation.None` ở layout components; feature components dùng emulated (default)
- Không import trực tiếp từ Angular Material trong feature components — wrap qua shared/ui
- Service phải có `providedIn: 'root'` hoặc được cung cấp ở module phù hợp

---

### A7. Accessibility (A11y)

#### A6.1 Yêu cầu tối thiểu — WCAG 2.1 AA

| Yêu cầu | Cách thực hiện |
|---|---|
| **Color contrast** | Text thường ≥ 4.5:1, large text ≥ 3:1. Dùng `#374151` trên `#ffffff` = 7.0:1 ✓ |
| **Focus visible** | Focus ring: `outline: 2px solid var(--color-brand-accent); outline-offset: 2px` |
| **Keyboard navigation** | Tất cả interactive element có thể tab đến, Enter/Space để activate |
| **ARIA labels** | Icon-only buttons phải có `aria-label` |
| **Form labels** | Mọi input có `<label>` liên kết qua `for`/`id` hoặc `aria-labelledby` |
| **Error messages** | Input error: `aria-invalid="true"`, `aria-describedby` trỏ đến error message |
| **Live regions** | Toast, alert dynamically thêm: dùng `aria-live="polite"` hoặc `"assertive"` |

#### A6.2 Focus Management

```typescript
// Sau khi mở modal, focus vào phần tử đầu tiên trong modal
@Component({ ... })
export class ModalComponent implements AfterViewInit {
  @ViewChild('firstFocusable') firstFocusable!: ElementRef;

  ngAfterViewInit() {
    this.firstFocusable.nativeElement.focus();
  }
}

// Trap focus bên trong modal (dùng CDK FocusTrap)
import { FocusTrap, FocusTrapFactory } from '@angular/cdk/a11y';
```

#### A6.3 Template ARIA patterns

```html
<!-- Button với icon -->
<button aria-label="Xóa người dùng Nguyễn Văn A">
  <erp-icon name="trash-2" size="16" aria-hidden="true" />
</button>

<!-- Table với header liên kết -->
<table role="grid" aria-label="Danh sách người dùng">
  <thead>
    <tr>
      <th scope="col" id="col-name">Họ tên</th>
      <th scope="col" id="col-email">Email</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td headers="col-name">Nguyễn Văn A</td>
      <td headers="col-email">nva@company.com</td>
    </tr>
  </tbody>
</table>

<!-- Form group -->
<div class="form-group">
  <label for="input-email">
    Email <span aria-label="bắt buộc">*</span>
  </label>
  <input
    id="input-email"
    type="email"
    [attr.aria-invalid]="emailControl.invalid && emailControl.touched"
    [attr.aria-describedby]="emailControl.invalid ? 'email-error' : null"
  />
  <p id="email-error" role="alert" *ngIf="emailControl.invalid && emailControl.touched">
    {{ getEmailError() }}
  </p>
</div>

<!-- Live region cho toast -->
<div aria-live="polite" aria-atomic="true" class="sr-only">
  {{ toastMessage }}
</div>
```

#### A6.4 Screen reader-only class

```css
.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border-width: 0;
}
```

---

### A8. Internationalization (i18n)

#### A7.1 Nguyên tắc

- **Mọi chuỗi hiển thị** phải được đánh dấu để extract từ ngày đầu
- Dùng Angular built-in i18n (`$localize`) hoặc `@ngx-translate/core`
- Ngôn ngữ mặc định: **Tiếng Việt (vi-VN)**
- Ngôn ngữ hỗ trợ tiếp theo: Tiếng Anh (en-US)

#### A7.2 Cách đánh dấu string với `@ngx-translate`

```html
<!-- Trong template -->
<h1>{{ 'DASHBOARD.TITLE' | translate }}</h1>
<button>{{ 'COMMON.SAVE' | translate }}</button>
<p>{{ 'USERS.COUNT' | translate: { count: userCount } }}</p>

<!-- Với i18n attribute (Angular built-in) -->
<h1 i18n="Dashboard title@@dashboardTitle">Tổng quan</h1>
```

```typescript
// Trong TypeScript
import { TranslateService } from '@ngx-translate/core';

// Không dùng hardcoded string trong code
this.toast.show(this.translate.instant('USERS.SAVE_SUCCESS'));
```

#### A7.3 Cấu trúc file translation

```
src/assets/i18n/
├── vi.json     ← Tiếng Việt (ngôn ngữ gốc)
└── en.json     ← Tiếng Anh
```

```json
// vi.json
{
  "COMMON": {
    "SAVE": "Lưu",
    "CANCEL": "Hủy",
    "DELETE": "Xóa",
    "CONFIRM": "Xác nhận",
    "LOADING": "Đang tải...",
    "SEARCH_PLACEHOLDER": "Tìm kiếm..."
  },
  "USERS": {
    "LIST_TITLE": "Quản lý người dùng",
    "ADD_BUTTON": "Thêm người dùng",
    "SAVE_SUCCESS": "Lưu thông tin người dùng thành công",
    "DELETE_CONFIRM": "Bạn có chắc muốn xóa người dùng này không?",
    "COUNT": "{{ count }} người dùng"
  }
}
```

#### A7.4 Format dữ liệu địa phương

```typescript
// Pipe format tiền tệ VND
@Pipe({ name: 'currencyVnd' })
export class CurrencyVndPipe implements PipeTransform {
  transform(value: number): string {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
    }).format(value);
    // Output: "1.234.567 ₫"
  }
}

// Pipe format ngày Việt Nam
@Pipe({ name: 'dateVi' })
export class DateViPipe implements PipeTransform {
  transform(value: Date | string, format = 'short'): string {
    const date = new Date(value);
    if (format === 'short') {
      return date.toLocaleDateString('vi-VN'); // "09/05/2026"
    }
    return date.toLocaleString('vi-VN');       // "09/05/2026, 14:30:00"
  }
}
```

---

## Phần B — Ionic 8 (Mobile)

---

### B1. Override Ionic CSS Variables

Tất cả override Ionic CSS variables phải đặt trong `src/theme/variables.scss`.

#### B1.1 File `src/theme/variables.scss`

```scss
// Nhập font Inter (nếu chưa có trong index.html)
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&display=swap');

:root {
  /* ── Colors — Map sang Open ERP tokens ── */
  --ion-color-primary:              #111111;
  --ion-color-primary-rgb:          17, 17, 17;
  --ion-color-primary-contrast:     #ffffff;
  --ion-color-primary-shade:        #000000;
  --ion-color-primary-tint:         #374151;

  --ion-color-secondary:            #3b82f6;
  --ion-color-secondary-rgb:        59, 130, 246;
  --ion-color-secondary-contrast:   #ffffff;
  --ion-color-secondary-shade:      #1d4ed8;
  --ion-color-secondary-tint:       #60a5fa;

  --ion-color-success:              #10b981;
  --ion-color-warning:              #f59e0b;
  --ion-color-danger:               #ef4444;

  /* ── Background ── */
  --ion-background-color:           #f8f9fa;   /* surface-soft */
  --ion-background-color-rgb:       248, 249, 250;

  /* ── Text ── */
  --ion-text-color:                 #374151;   /* color-text-body */
  --ion-text-color-rgb:             55, 65, 81;

  /* ── Font ── */
  --ion-font-family:                'Inter', -apple-system, BlinkMacSystemFont, sans-serif;

  /* ── Toolbar (Header) ── */
  --ion-toolbar-background:         #ffffff;
  --ion-toolbar-color:              #111111;
  --ion-toolbar-border-color:       #f3f4f6;

  /* ── Item (List) ── */
  --ion-item-background:            #ffffff;
  --ion-item-border-color:          #f3f4f6;
  --ion-item-color:                 #374151;

  /* ── Tab bar ── */
  --ion-tab-bar-background:         #ffffff;
  --ion-tab-bar-border-color:       #e5e7eb;
  --ion-tab-bar-color:              #898989;
  --ion-tab-bar-color-selected:     #111111;

  /* ── Card ── */
  --ion-card-background:            #ffffff;

  /* ── Border radius ── */
  --ion-border-radius:              8px;
}

:root[data-color-mode='dark'] {
  --ion-color-primary:              #f3f4f6;
  --ion-color-primary-rgb:          243, 244, 246;
  --ion-color-primary-contrast:     #0b1220;

  --ion-color-secondary:            #60a5fa;
  --ion-color-secondary-rgb:        96, 165, 250;
  --ion-color-secondary-contrast:   #0b1220;

  --ion-background-color:           #0b1220;
  --ion-background-color-rgb:       11, 18, 32;

  --ion-text-color:                 #e5e7eb;
  --ion-text-color-rgb:             229, 231, 235;

  --ion-toolbar-background:         #111827;
  --ion-toolbar-color:              #f9fafb;
  --ion-toolbar-border-color:       #1f2937;

  --ion-item-background:            #111827;
  --ion-item-border-color:          #1f2937;
  --ion-item-color:                 #e5e7eb;

  --ion-tab-bar-background:         #111827;
  --ion-tab-bar-border-color:       #334155;
  --ion-tab-bar-color:              #9ca3af;
  --ion-tab-bar-color-selected:     #f9fafb;

  --ion-card-background:            #1f2937;
}
```

#### B1.2 Override component-level styles

```scss
// Trong global.scss

// ion-card → data-card style
ion-card {
  border: 1px solid #e5e7eb;
  border-radius: 12px;
  box-shadow: none;
  margin: 0 0 12px 0;
  --background: #ffffff;
}

// ion-button → btn-primary style
ion-button[color="primary"] {
  --background:        #111111;
  --color:             #ffffff;
  --border-radius:     8px;
  --padding-top:       12px;
  --padding-bottom:    12px;
  font-weight: 600;
  font-size: 14px;
}

// ion-input → text-input style
ion-input {
  --background:        #ffffff;
  --border-color:      #e5e7eb;
  --border-radius:     8px;
  --padding-start:     12px;
  --padding-end:       12px;
  --color:             #374151;
  font-size: 16px;
}

// ion-searchbar → search-input style
ion-searchbar {
  --background:        #f5f5f5;
  --border-radius:     8px;
  --icon-color:        #6b7280;
  --placeholder-color: #6b7280;
  --color:             #111111;
}
```

#### B1.3 Ionic 8 Dark Mode Override + Preferences

```ts
import { Preferences } from '@capacitor/preferences';

const COLOR_MODE_KEY = 'openErp.colorMode';

export async function applyMobileColorMode(): Promise<void> {
  const { value } = await Preferences.get({ key: COLOR_MODE_KEY });
  const mode = (value as 'light' | 'dark' | 'system' | null) ?? 'system';
  const resolved =
    mode === 'system'
      ? (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light')
      : mode;

  document.documentElement.setAttribute('data-color-mode', resolved);
}

export async function setMobileColorMode(mode: 'light' | 'dark' | 'system'): Promise<void> {
  await Preferences.set({ key: COLOR_MODE_KEY, value: mode });
  await applyMobileColorMode();
}
```

Lưu ý triển khai:

- Gọi `applyMobileColorMode()` ở `app.component.ts` trước khi render route đầu tiên.
- Nếu mode là `system`, lắng nghe `matchMedia('(prefers-color-scheme: dark)')` để cập nhật realtime.
- Không override màu trực tiếp trong từng `ion-*` component; luôn đi qua biến `--ion-*`.

---

### B2. ion-Component Usage Guidelines

#### B2.1 Mapping component Design System → Ionic

| Design System Component | Ionic Component | Ghi chú |
|---|---|---|
| `app-sidebar` | `ion-menu` | Dùng cho drawer navigation trên mobile |
| Bottom tab navigation | `ion-tab-bar` + `ion-tabs` | 5 tabs tối đa |
| `text-input` | `ion-input` | Trong `ion-item` |
| `select` | `ion-select` | Dùng `interface="action-sheet"` trên mobile |
| `modal/dialog` | `ion-modal` | `breakpoints` cho half-screen |
| `drawer/sheet` | `ion-modal` với `initialBreakpoint` | Bottom sheet |
| `toast` | `ion-toast` | Config vị trí và duration |
| `alert` | `ion-alert` | Confirmation dialogs |
| `data-card` | `ion-card` | Override styles như B1.2 |
| `loading-skeleton` | `ion-skeleton-text` | |
| `badge` | `ion-badge` | Override màu |
| `avatar` | `ion-avatar` | 36px default |
| FAB button | `ion-fab` + `ion-fab-button` | Bottom-right |
| Pull to refresh | `ion-refresher` | Trong `ion-content` |
| Infinite scroll | `ion-infinite-scroll` | Pagination mobile |

#### B2.2 ion-header chuẩn

```html
<ion-header [translucent]="false">
  <ion-toolbar>
    <ion-buttons slot="start">
      <ion-back-button defaultHref="/dashboard" text="Quay lại" />
    </ion-buttons>
    <ion-title>Quản lý người dùng</ion-title>
    <ion-buttons slot="end">
      <ion-button fill="clear" (click)="onAddUser()">
        <ion-icon name="add-outline" slot="icon-only" aria-label="Thêm người dùng" />
      </ion-button>
    </ion-buttons>
  </ion-toolbar>
  <!-- Searchbar nếu cần -->
  <ion-toolbar>
    <ion-searchbar
      placeholder="Tìm kiếm người dùng..."
      [(ngModel)]="searchTerm"
    />
  </ion-toolbar>
</ion-header>
```

#### B2.3 ion-content chuẩn

```html
<ion-content [fullscreen]="true">
  <!-- Pull to refresh -->
  <ion-refresher slot="fixed" (ionRefresh)="onRefresh($event)">
    <ion-refresher-content />
  </ion-refresher>

  <!-- Nội dung chính -->
  <div class="ion-padding">
    <!-- Components -->
  </div>

  <!-- Infinite scroll -->
  <ion-infinite-scroll (ionInfinite)="loadMore($event)">
    <ion-infinite-scroll-content loadingText="Đang tải..." />
  </ion-infinite-scroll>
</ion-content>
```

#### B2.4 ion-modal cho form

```typescript
// Mở modal form
const modal = await this.modalCtrl.create({
  component: UserFormComponent,
  componentProps: { userId: id },
  breakpoints: [0, 0.75, 1],
  initialBreakpoint: 0.75,
  // Bottom sheet style
});
await modal.present();
```

#### B2.5 ion-toast chuẩn

```typescript
const toast = await this.toastCtrl.create({
  message: 'Lưu thông tin thành công',
  duration: 4000,
  position: 'top',
  color: 'dark',                  // bg #111111
  buttons: [{
    icon: 'close',
    role: 'cancel',
  }],
});
await toast.present();
```

---

### B3. Native Feel Patterns

#### B3.1 Bottom Tab Navigation

```html
<!-- app.component.html (hoặc tabs.page.html) -->
<ion-tabs>
  <ion-tab-bar slot="bottom">
    <ion-tab-button tab="dashboard">
      <ion-icon name="grid-outline" />
      <ion-label>Tổng quan</ion-label>
    </ion-tab-button>

    <ion-tab-button tab="hr">
      <ion-icon name="people-outline" />
      <ion-label>Nhân sự</ion-label>
    </ion-tab-button>

    <ion-tab-button tab="sale">
      <ion-icon name="cart-outline" />
      <ion-label>Bán hàng</ion-label>
    </ion-tab-button>

    <ion-tab-button tab="office">
      <ion-icon name="briefcase-outline" />
      <ion-label>Văn phòng</ion-label>
    </ion-tab-button>

    <ion-tab-button tab="more">
      <ion-icon name="ellipsis-horizontal-outline" />
      <ion-label>Thêm</ion-label>
    </ion-tab-button>
  </ion-tab-bar>
</ion-tabs>
```

**Quy tắc tab bar:**
- Tối đa 5 tabs — nếu cần nhiều hơn, nhóm vào tab "Thêm" (More) dạng action sheet
- Label ngắn gọn ≤ 12 ký tự
- Không dùng tab bar trong sub-pages (detail, form) — chỉ ở root pages

#### B3.2 Swipe Gestures

```typescript
// Slide to delete trên list item
// Dùng ion-item-sliding
```

```html
<ion-list>
  <ion-item-sliding *ngFor="let user of users">
    <ion-item>
      <ion-avatar slot="start">
        <img [src]="user.avatar" [alt]="user.name" />
      </ion-avatar>
      <ion-label>
        <h2>{{ user.name }}</h2>
        <p>{{ user.email }}</p>
      </ion-label>
      <ion-badge slot="end" [color]="user.active ? 'success' : 'medium'">
        {{ user.active ? 'Hoạt động' : 'Vô hiệu' }}
      </ion-badge>
    </ion-item>

    <!-- Swipe left → Edit -->
    <ion-item-options side="end">
      <ion-item-option color="primary" (click)="onEdit(user)">
        <ion-icon slot="icon-only" name="pencil-outline" />
      </ion-item-option>
      <ion-item-option color="danger" (click)="onDelete(user)">
        <ion-icon slot="icon-only" name="trash-outline" />
      </ion-item-option>
    </ion-item-options>
  </ion-item-sliding>
</ion-list>
```

#### B3.3 Haptic Feedback

```typescript
import { Haptics, ImpactStyle } from '@capacitor/haptics';

// Khi thực hiện action quan trọng
async onDeleteConfirm() {
  await Haptics.impact({ style: ImpactStyle.Medium });
  // Tiến hành xóa
}

// Khi thành công
async onSaveSuccess() {
  await Haptics.notification({ type: NotificationType.Success });
}
```

#### B3.4 Keyboard Avoidance

```html
<!-- ion-content tự động xử lý keyboard avoidance -->
<!-- Chắc chắn thêm scrollY="true" khi có form dài -->
<ion-content [scrollY]="true">
  <form>
    <!-- Form fields -->
    <ion-button expand="block" type="submit">Lưu</ion-button>
  </form>
</ion-content>
```

---

### B4. Offline Handling UI

#### B4.1 Network Status Banner

```typescript
// network-status.service.ts
import { Network } from '@capacitor/network';

@Injectable({ providedIn: 'root' })
export class NetworkStatusService {
  isOnline$ = new BehaviorSubject<boolean>(true);

  constructor() {
    Network.addListener('networkStatusChange', status => {
      this.isOnline$.next(status.connected);
    });
  }
}
```

```html
<!-- Thêm vào app.component.html, hiển thị khi offline -->
<div
  class="offline-banner"
  [class.visible]="!(networkStatus.isOnline$ | async)"
  role="alert"
  aria-live="assertive"
>
  <ion-icon name="cloud-offline-outline" />
  Bạn đang offline. Một số tính năng có thể không khả dụng.
</div>
```

```scss
.offline-banner {
  display: flex;
  align-items: center;
  gap: 8px;
  background: #f59e0b;        /* semantic warning */
  color: #ffffff;
  padding: 8px 16px;
  font-size: 14px;
  font-weight: 500;
  transform: translateY(-100%);
  transition: transform 200ms ease;

  &.visible {
    transform: translateY(0);
  }
}
```

#### B4.2 Loading State cho cached data

```html
<!-- Hiển thị data cũ + badge "Dữ liệu đã lưu" khi offline -->
<ion-card *ngIf="isOffline && hasCachedData">
  <ion-card-content>
    <ion-badge color="warning">Dữ liệu tạm thời (offline)</ion-badge>
    <!-- Data content -->
  </ion-card-content>
</ion-card>

<!-- Empty state khi không có cache -->
<div class="empty-state" *ngIf="isOffline && !hasCachedData">
  <ion-icon name="cloud-offline-outline" size="large" />
  <h3>Không có kết nối</h3>
  <p>Vui lòng kiểm tra kết nối mạng và thử lại.</p>
  <ion-button (click)="onRetry()">Thử lại</ion-button>
</div>
```

#### B4.3 Optimistic UI cho actions offline

```typescript
// Khi submit form offline: lưu vào local queue, hiển thị trạng thái "Đang chờ đồng bộ"
// Khi online trở lại: tự động sync và cập nhật UI

const pendingBadge = '<ion-badge color="warning">Đang chờ đồng bộ</ion-badge>';
```

---

### B5. Push Notification UI

#### B5.1 Yêu cầu quyền Push

```typescript
import { PushNotifications } from '@capacitor/push-notifications';

async requestPushPermission(): Promise<boolean> {
  const permission = await PushNotifications.requestPermissions();
  if (permission.receive === 'granted') {
    await PushNotifications.register();
    return true;
  }
  return false;
}
```

**Thời điểm yêu cầu quyền:**
- KHÔNG yêu cầu ngay khi mở app lần đầu
- Yêu cầu sau khi người dùng hoàn thành onboarding (Bước 4e)
- Hoặc khi người dùng chủ động bật trong Notification Preferences

#### B5.2 Xử lý notification khi app foreground

```typescript
PushNotifications.addListener('pushNotificationReceived', notification => {
  // Hiển thị in-app toast thay vì system notification
  this.toastCtrl.create({
    header: notification.title,
    message: notification.body,
    duration: 5000,
    position: 'top',
    color: 'dark',
    buttons: [{
      text: 'Xem',
      handler: () => this.handleNotificationTap(notification.data),
    }, {
      icon: 'close',
      role: 'cancel',
    }],
  }).then(t => t.present());
});
```

#### B5.3 Notification icon trong header

```html
<!-- Header notification bell -->
<ion-button slot="end" fill="clear" (click)="openNotifications()">
  <ion-icon name="notifications-outline" slot="icon-only" />
  <!-- Badge số thông báo chưa đọc -->
  <ion-badge
    *ngIf="unreadCount > 0"
    class="notification-badge"
  >
    {{ unreadCount > 99 ? '99+' : unreadCount }}
  </ion-badge>
</ion-button>
```

```scss
// Vị trí badge trên bell icon
ion-button {
  position: relative;
}

.notification-badge {
  position: absolute;
  top: 4px;
  right: 4px;
  min-width: 16px;
  height: 16px;
  font-size: 10px;
  border-radius: 9999px;
  background: #ef4444;
  color: white;
  padding: 0 4px;
  line-height: 16px;
}
```

#### B5.4 Notification list page

```html
<ion-content>
  <ion-list>
    <ion-item
      *ngFor="let notif of notifications"
      [class.unread]="!notif.read"
      (click)="onNotifTap(notif)"
    >
      <!-- Icon module -->
      <ion-avatar slot="start">
        <ion-icon [name]="notif.moduleIcon" />
      </ion-avatar>

      <ion-label>
        <h3>{{ notif.title }}</h3>
        <p>{{ notif.body }}</p>
        <p class="ion-text-muted">
          <ion-icon name="time-outline" size="small" />
          {{ notif.createdAt | dateVi }}
        </p>
      </ion-label>

      <!-- Dot chưa đọc -->
      <div slot="end" class="unread-dot" *ngIf="!notif.read" />
    </ion-item>
  </ion-list>
</ion-content>
```

---

## Tóm tắt nhanh — Checklist cho Frontend Agent

### Web (Angular 21)
- [ ] Import và sử dụng CSS custom properties từ `styles/tokens.css`
- [ ] KHÔNG hardcode màu, spacing, font trong component styles
- [ ] Resolve color mode theo ưu tiên user setting > persisted > system
- [ ] Lưu key `openErp.colorMode` vào localStorage
- [ ] Dùng prefix `erp-` cho tất cả component selectors
- [ ] Mỗi feature module trong thư mục riêng theo cấu trúc quy định
- [ ] Mọi form input có label visible và aria attributes
- [ ] Strings dùng translate pipe / i18n từ ngày đầu
- [ ] Format tiền: `currencyVnd` pipe, format ngày: `dateVi` pipe
- [ ] Kiểm tra contrast ratio (WCAG AA) trên cả light và dark
- [ ] `data-testid` trên tất cả interactive elements

### Mobile (Ionic 8)
- [ ] Override Ionic CSS variables trong `src/theme/variables.scss`
- [ ] Áp dụng dark mode override bằng `:root[data-color-mode='dark']`
- [ ] Lưu key `openErp.colorMode` qua Capacitor Preferences
- [ ] Tab bar tối đa 5 tabs, không dùng trong sub-pages
- [ ] ion-modal với breakpoints cho bottom sheet pattern
- [ ] Offline banner và empty state khi mất mạng
- [ ] Yêu cầu push permission sau onboarding, không ngay lúc mở app
- [ ] Haptic feedback cho destructive actions
- [ ] `ion-refresher` trong mọi list page
- [ ] `ion-infinite-scroll` thay vì pagination trên mobile

---

*Tài liệu này là hướng dẫn bắt buộc cho tất cả Frontend Agent. Mọi exception phải được thảo luận và ghi chú vào đây.*
