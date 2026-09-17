# Hướng Dẫn Đóng Góp Thư Viện Giao Diện Dùng Chung (Shared UI Library Guide)

Thư viện giao diện dùng chung (`shared-ui-lib`) là trái tim của giao diện toàn bộ hệ thống `open-erp`, đảm bảo tính đồng nhất 100% giữa ứng dụng Web Desktop và Mobile App (Ionic 8), tuân thủ triết lý **Nhỏ gọn (Compact), Vuông vắn (Sharp) và Điều hướng Không Modal (Anti-Modal)**.

---

## 1. Nguyên Tắc Cốt Lõi: Component-First
> **QUY TẮC BẤT DI BẤT DỊCH**: Không bao giờ viết trực tiếp một component giao diện mới trong màn hình nghiệp vụ nếu nó có tính chất tái sử dụng. Bắt buộc phải hiện thực trong `shared-ui-lib` trước, sau đó mới import vào Web hoặc Mobile.

---

## 2. Tiêu Chuẩn Thiết Kế Component Trong `shared-ui-lib`

1. **Công Nghệ**:
   - Sử dụng **Angular >= 22** với kiến trúc Standalone Component (`standalone: true`).
   - Sử dụng **Signals**: `input()`, `output()`, `model()`.
   - Styling độc quyền bằng **Tailwind CSS v4** (hỗ trợ Light / Dark mode).
2. **Quy Chuẩn UI/UX ERP Nhỏ Gọn & Vuông Vắn**:
   - **Font chữ nhỏ gọn**: Mặc định sử dụng `text-xs` (12px) hoặc `text-sm` (13px) cho text nội dung và inputs; nhãn form dùng `text-xs font-medium`.
   - **Đệm & lề tối thiểu**: Sử dụng `p-1`, `p-1.5`, `p-2`, `gap-1`, `gap-1.5`, `space-y-1`. Hạn chế khoảng trống thừa.
   - **Thiết kế vuông vắn (Sharp Aesthetic)**: Bắt buộc dùng `rounded-none` hoặc `rounded-sm` (tối đa 2px). Tuyệt đối tránh `rounded-lg`, `rounded-xl`, `rounded-full`.
   - **Đường viền sắc nét**: Sử dụng viền mảnh `border border-neutral-200 dark:border-neutral-800`.
3. **Triết Lý Điều Hướng Không Modal (Anti-Modal Components)**:
   - Thay vì tạo Popup/Modal nổi che khuất màn hình, thư viện ưu tiên cung cấp:
     - `SharedDrawerComponent`: Side-sheet trượt từ cạnh phải, hỗ trợ xếp chồng đa tầng (Stacked Drawers).
     - `SharedSplitPaneComponent`: Chia trang thành 2 cột Master-Detail hiển thị song song danh sách và chi tiết.

---

## 3. Quy Trình Đóng Góp Component Mới

### Bước 1: Tạo Component Trong Thư Viện
Ví dụ tạo component nút bấm nhỏ gọn `shared-button`:
```typescript
import { Component, input, output, ChangeDetectionStrategy } from '@angular/core';

@Component({
  selector: 'shared-button',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <button
      [type]="type()"
      [disabled]="disabled() || loading()"
      [class]="buttonClasses()"
      (click)="clicked.emit($event)">
      @if (loading()) {
        <span class="animate-spin mr-1.5 text-xs">⏳</span>
      }
      <ng-content></ng-content>
    </button>
  `
})
export class SharedButtonComponent {
  variant = input<'primary' | 'secondary' | 'danger'>('primary');
  type = input<'button' | 'submit'>('button');
  disabled = input<boolean>(false);
  loading = input<boolean>(false);
  clicked = output<MouseEvent>();

  protected buttonClasses(): string {
    // Phong cách vuông vắn, font nhỏ (text-xs), đệm hẹp (px-2.5 py-1)
    const base = 'px-2.5 py-1 text-xs font-medium rounded-none transition duration-150 flex items-center justify-center border';
    if (this.variant() === 'primary') {
      return `${base} bg-neutral-900 text-white hover:bg-neutral-800 border-neutral-900 dark:bg-neutral-100 dark:text-neutral-900`;
    }
    if (this.variant() === 'danger') {
      return `${base} bg-red-600 text-white hover:bg-red-700 border-red-600`;
    }
    return `${base} bg-white text-neutral-700 hover:bg-neutral-50 border-neutral-300 dark:bg-neutral-800 dark:text-neutral-200 dark:border-neutral-700`;
  }
}
```

### Bước 2: Export Trong `public-api.ts`
Xuất component trong file index của thư viện:
```typescript
export * from './lib/components/button/button.component';
export * from './lib/components/drawer/drawer.component';
export * from './lib/components/split-pane/split-pane.component';
```

### Bước 3: Kiểm Thử Trực Quan Trên Trình Duyệt (Browser Manual Verification)
- **TUYỆT ĐỐI KHÔNG viết file Unit Test `.spec.ts`** cho component frontend (chính sách Zero-Unit-Test Frontend).
- Mở ứng dụng trực tiếp trên Web Browser:
  - Kiểm tra độ sắc nét của góc cạnh vuông (`rounded-none`/`rounded-sm`).
  - Kiểm tra kích thước font chữ nhỏ gọn `text-xs`/`text-sm` và khoảng cách đệm hẹp.
  - Kiểm tra tính tương thích trên cả Web Desktop lẫn Mobile viewport (Ionic 8).

### Bước 4: Sử Dụng Trên Web Và Mobile
```typescript
import { SharedButtonComponent, SharedDrawerComponent } from '@openerp/shared-ui';

@Component({
  imports: [SharedButtonComponent, SharedDrawerComponent],
  template: `
    <shared-button variant="primary" (clicked)="isDrawerOpen.set(true)">
      Tạo Đơn Hàng Mới
    </shared-button>

    <!-- Drawer trượt từ cạnh phải thay cho Modal popup -->
    <shared-drawer [isOpen]="isDrawerOpen()" (closed)="isDrawerOpen.set(false)" title="Chi Tiết Đơn Hàng">
      <form class="space-y-1.5 p-2 text-xs">
        <!-- Form nhập liệu nhỏ gọn, mật độ cao -->
      </form>
    </shared-drawer>
  `
})
export class OrderManagementComponent {
  isDrawerOpen = signal(false);
}
```
