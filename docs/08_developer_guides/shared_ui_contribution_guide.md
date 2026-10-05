| Thuộc tính | Giá trị |
| :--- | :--- |
| ID | DEV-UI-001 |
| Loại / phạm vi | Developer guide — thư viện UI dùng chung Web và Ionic Mobile |
| Trạng thái / phiên bản | Reviewed / 1.0 |
| Cập nhật | 2026-10-05 |
| Owner / reviewer | Codex — Developer documentation / Self-reviewed |
| Đầu vào | [Developer rules](../../.agents/rules/agent_developer.md), [UI/UX standards](../../.agents/rules/ui_ux_standards.md), [shared source](../../src/frontend/shared/) |
| Đọc trước | [Reading guide](00_READING_GUIDE.md), [coding standards](coding_standards.md) |
| Đọc tiếp | UI spec/item của Sprint được giao; [QA rules](../../.agents/rules/agent_qa.md) — kiểm tra hai chế độ |

# Hướng Dẫn Đóng Góp Thư Viện Giao Diện Dùng Chung (Shared UI Library Guide)

Thư viện giao diện dùng chung được gọi là `shared-ui-lib` trong tài liệu thiết kế, nằm thực tế tại [src/frontend/shared](../../src/frontend/shared/). Web và Ionic Mobile dùng chung source qua `@shared`/`@shared/*`; hiện không phải package npm riêng. Mục tiêu là giao diện **Nhỏ gọn (Compact), Vuông vắn (Sharp) và Điều hướng Không Modal (Anti-Modal)**, không phải lời xác nhận mọi màn hình đã qua QA.

Nhận việc và bàn giao theo [Core SDLC](../../.agents/rules/core_sdlc.md), [phối hợp agent](../../.agents/rules/agent_collaboration.md), [chuẩn tài liệu](../../.agents/rules/documentation_standards.md) và [SDLC workflow](../../.agents/skills/sdlc-workflow/SKILL.md). Các snippet dưới đây là ví dụ đóng góp mới, đã đối chiếu contract source, chưa build/chạy browser; chỉ sửa source sau khi có thiết kế/item phù hợp.

---

## 1. Nguyên Tắc Cốt Lõi: Component-First
> **QUY TẮC BẤT DI BẤT DỊCH**: Không bao giờ viết trực tiếp một component giao diện mới trong màn hình nghiệp vụ nếu nó có tính chất tái sử dụng. Bắt buộc phải hiện thực trong `shared-ui-lib` trước, sau đó mới import vào Web hoặc Mobile.

Trước khi tạo mới, tìm trong [components/index.ts](../../src/frontend/shared/components/index.ts). Nút, input, drawer và bộ chuyển ngôn ngữ đã có component dùng chung; ưu tiên dùng chúng. Nếu cần cụm UI mới dùng nhiều nơi, đặt `.ts` và `.html` cạnh nhau trong `src/frontend/shared/components/<tên>/`.

---

## 2. Tiêu Chuẩn Thiết Kế Component Trong `shared-ui-lib`

1. **Công Nghệ**:
   - Sử dụng **Angular >= 22** với kiến trúc Standalone Component (`standalone: true`).
   - Sử dụng **Signals**: `input()`, `output()`, `model()`.
   - Styling độc quyền bằng **Tailwind CSS v4** (hỗ trợ Light / Dark mode).
   - Template **tách file `.html`**, khai báo `templateUrl`; mọi chuỗi hiển thị qua `TranslateDirective`/`TranslatePipe` và từ điển vi/en của app.
   - Dùng [ColorVariant, SizeVariant, ShapeVariant](../../src/frontend/shared/enums/theme.enum.ts) và [ButtonType](../../src/frontend/shared/enums/button.enum.ts), không tạo enum style riêng cho từng component.
2. **Quy Chuẩn UI/UX ERP Nhỏ Gọn & Vuông Vắn**:
   - **Font chữ nhỏ gọn**: Mặc định sử dụng `text-xs` (12px) hoặc `text-sm` (13px) cho text nội dung và inputs; nhãn form dùng `text-xs font-medium`.
   - **Đệm & lề tối thiểu**: Sử dụng `p-1`, `p-1.5`, `p-2`, `gap-1`, `gap-1.5`, `space-y-1`. Hạn chế khoảng trống thừa.
   - **Thiết kế vuông vắn (Sharp Aesthetic)**: Bắt buộc dùng `rounded-none` hoặc `rounded-sm` (tối đa 2px). Tuyệt đối tránh `rounded-lg`, `rounded-xl`, `rounded-full`.
   - **Đường viền sắc nét**: Sử dụng viền mảnh `border border-neutral-200 dark:border-neutral-800`.
3. **Triết Lý Điều Hướng Không Modal (Anti-Modal Components)**:
   - Thay vì tạo Popup/Modal nổi che khuất màn hình, thư viện ưu tiên cung cấp:
     - [DrawerComponent](../../src/frontend/shared/components/drawer/drawer.component.ts) (`app-drawer`): Side-sheet trượt từ cạnh phải, hỗ trợ xếp chồng; input `isOpen`, event `close`.
     - Split-screen theo thiết kế: dùng layout chia cột. Checkout hiện không export `SharedSplitPaneComponent`; chỉ thêm component dùng chung nếu thiết kế/item cần abstraction này.

---

## 3. Quy Trình Đóng Góp Component Mới

### Bước 1: Tạo Component Trong Thư Viện
Ví dụ **cụm thao tác Lưu/Hủy tái sử dụng** tên `ActionBarComponent`, dùng [SharpButtonComponent hiện có](../../src/frontend/shared/components/sharp-button/sharp-button.component.ts). Đây là code mẫu cần tạo trong item được giao, không phải component đã có trong checkout.

File dự kiến `src/frontend/shared/components/action-bar/action-bar.component.ts`:

```typescript
import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { ButtonType, ColorVariant, ShapeVariant, SizeVariant } from '../../enums';
import { TranslateDirective } from '../../i18n';
import { SharpButtonComponent } from '../sharp-button/sharp-button.component';

@Component({
  selector: 'app-action-bar',
  standalone: true,
  imports: [SharpButtonComponent, TranslateDirective],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './action-bar.component.html'
})
export class ActionBarComponent {
  readonly loading = input(false);
  readonly disabled = input(false);
  readonly cancelRequested = output<void>();
  readonly saveRequested = output<void>();
  readonly buttonType = ButtonType.BUTTON;
  readonly primary = ColorVariant.PRIMARY;
  readonly secondary = ColorVariant.SECONDARY;
  readonly size = SizeVariant.LG;
  readonly shape = ShapeVariant.SHARP;
}
```

File dự kiến `action-bar.component.html` cùng thư mục:

```html
<div class="flex items-center justify-end gap-1 border-t border-neutral-200 p-2 dark:border-neutral-800 [&_button]:min-h-10 [&_button]:min-w-10">
  <app-sharp-button
    [type]="buttonType" [variant]="secondary" [size]="size" [shape]="shape"
    [disabled]="loading()" (clicked)="cancelRequested.emit()">
    <span [appTranslate]="'COMMON_CANCEL'"></span>
  </app-sharp-button>
  <app-sharp-button
    [type]="buttonType" [variant]="primary" [size]="size" [shape]="shape"
    [disabled]="disabled()" [loading]="loading()" (clicked)="saveRequested.emit()">
    <span [appTranslate]="'COMMON_SAVE'"></span>
  </app-sharp-button>
</div>
```

Các key `COMMON_CANCEL`/`COMMON_SAVE` có trong từ điển [Web](../../src/frontend/web/public/i18n/) và [Mobile](../../src/frontend/mobile/public/i18n/). Khi thêm key mới, cập nhật `vi.json` và `en.json` của mỗi app sử dụng component; không dùng chuỗi fallback hardcode để che key thiếu. Nút dùng `ButtonType.BUTTON` và emit hành động; consumer quản lý validation/lưu dữ liệu, tránh vừa click handler vừa submit form gây gửi hai lần.

<a id="bước-2-export-trong-public-apits"></a>

### Bước 2: Export Trong `shared/index.ts`

Giữ anchor cũ để các caller tiếp tục tới bước export. Source dùng hai tầng barrel: thêm export vào [components/index.ts](../../src/frontend/shared/components/index.ts), rồi [shared/index.ts](../../src/frontend/shared/index.ts) đã export `./components`:

```typescript
// src/frontend/shared/components/index.ts — thêm khi tạo file ở Bước 1
export * from './action-bar/action-bar.component';

// src/frontend/shared/index.ts — export này đã có, không thêm trùng
export * from './components';
```

Trong [Web tsconfig](../../src/frontend/web/tsconfig.json) và [Mobile tsconfig](../../src/frontend/mobile/tsconfig.json), mappings hiện có:

```json
{
  "paths": {
    "@shared": ["../shared/index.ts"],
    "@shared/*": ["../shared/*"]
  }
}
```

Đây là phần trích `compilerOptions.paths`, không phải file tsconfig đầy đủ. Giữ các mapping khác của Mobile; không ghi đè toàn bộ config bằng snippet. Consumer import từ `@shared`, nội bộ shared dùng relative imports để tránh tự vòng qua barrel.

### Bước 3: Kiểm Thử Trực Quan Trên Trình Duyệt (Browser Manual Verification)
- **TUYỆT ĐỐI KHÔNG viết file Unit Test `.spec.ts`** cho component frontend (chính sách Zero-Unit-Test Frontend).
- Mở ứng dụng trực tiếp trên Web Browser:
  - Kiểm tra độ sắc nét của góc cạnh vuông (`rounded-none`/`rounded-sm`).
  - Kiểm tra kích thước font chữ nhỏ gọn `text-xs`/`text-sm` và khoảng cách đệm hẹp.
  - Web desktop ≥1280px, theme sáng/tối, vi/en, loading/disabled/click, drawer và keyboard focus.
  - Ionic **device emulation 390×844**, touch events; kiểm tra overflow ngang = 0, nút/input ≥40px, safe-area, menu và điều hướng.
  - Hai app phải có 0 `console.error`; chụp ảnh vào `08_testing/` của Sprint và dẫn từ item/report/user guide.

Dev build bằng `npm run web:build` và `npm run mobile:build` từ root sau tích hợp source; build PASS không thay QA browser. Các kiểm tra trên là tiêu chí cần thực hiện, chưa được chạy trong lần chỉnh guide này.

### Bước 4: Sử Dụng Trên Web Và Mobile
```typescript
import { Component, output, signal } from '@angular/core';
import {
  ActionBarComponent, ButtonType, ColorVariant, DrawerComponent,
  ShapeVariant, SharpButtonComponent, SizeVariant,
  TranslateDirective, TranslatePipe
} from '@shared';

@Component({
  selector: 'app-account-actions-example',
  standalone: true,
  imports: [ActionBarComponent, DrawerComponent, SharpButtonComponent,
    TranslateDirective, TranslatePipe],
  templateUrl: './account-actions-example.component.html'
})
export class AccountActionsExampleComponent {
  readonly drawerOpen = signal(false);
  readonly saving = signal(false);
  readonly saveRequested = output<void>();
  readonly buttonType = ButtonType.BUTTON;
  readonly color = ColorVariant.OUTLINE;
  readonly size = SizeVariant.LG;
  readonly shape = ShapeVariant.SHARP;
}
```

Template ví dụ `account-actions-example.component.html`:

```html
<div class="[&_button]:min-h-10 [&_button]:min-w-10">
  <app-sharp-button
    [type]="buttonType" [variant]="color" [size]="size" [shape]="shape"
    (clicked)="drawerOpen.set(true)">
    <span [appTranslate]="'ACCOUNT_DRAWER_TITLE'"></span>
  </app-sharp-button>
</div>
<app-drawer
  [isOpen]="drawerOpen()" [title]="'ACCOUNT_DRAWER_TITLE' | translate"
  (close)="drawerOpen.set(false)">
  <app-action-bar [loading]="saving()"
    (cancelRequested)="drawerOpen.set(false)"
    (saveRequested)="saveRequested.emit()" />
</app-drawer>
```

Ví dụ consumer chỉ minh họa binding sau khi **đã tạo/export ActionBar ở Bước 1–2**; không thay luồng account thật hoặc tự thêm màn hình nghiệp vụ vào Core. `ACCOUNT_DRAWER_TITLE` có trong cả hai app vi/en. `DrawerComponent.title` nhận chuỗi đã dịch và event đóng tên `close`; `SharpButtonComponent` có event `clicked`. Khi tích hợp màn hình thật, state Drawer/loading, request và lỗi phải theo thiết kế route/API của item; QA cả Web lẫn Ionic trên baseline đã tích hợp.
