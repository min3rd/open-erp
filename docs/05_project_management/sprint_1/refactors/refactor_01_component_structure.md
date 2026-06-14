# Tài liệu hướng dẫn tái cấu trúc: REF-1.1 - Phân tách Template & Chuẩn hóa CSS Component
## Phân hệ: Thư viện UI (`open-erp-ui`) & Web Client (`open-erp-web`) - Sprint 1

---

### 1. Mục tiêu tái cấu trúc (Refactor Goal)
Nhằm tăng tính mô-đun hóa, cải thiện khả năng bảo trì và tối ưu hóa quy trình làm việc giữa lập trình viên Frontend và Designer, dự án thống nhất áp dụng quy chuẩn cấu trúc component mới:
1. **Phân tách Template**: Tất cả các component trong dự án (bao gồm cả thư viện UI dùng chung `@open-erp/shared-ui` và ứng dụng Web `open-erp-web`) bắt buộc phải tách biệt phần giao diện ra file template `.html` riêng thay vì viết inline trong file `.ts`.
2. **Chuẩn hóa Styles**: Tuyệt đối **không sử dụng các tệp tin CSS riêng biệt cho từng component** (không dùng `styleUrls` hoặc `styleUrl` trỏ đến file `.css`/`.scss` cục bộ). Mọi định dạng giao diện phải được giải quyết bằng các class tiện ích của Tailwind CSS hoặc khai báo tập trung tại file CSS dùng chung của hệ thống.

---

### 2. Lý do kỹ thuật & Lợi ích (Technical Rationale)

* **Tách biệt vai trò (Separation of Concerns)**: File template `.html` độc lập giúp dễ dàng đọc cấu trúc DOM, thuận tiện cho việc chỉnh sửa giao diện mà không ảnh hưởng hoặc vô tình làm sai lệch mã logic TypeScript bên trong file `.ts`.
* **Tận dụng Tailwind CSS tối đa**: Khai báo inline CSS cục bộ đi kèm component thường dẫn đến việc trùng lặp mã CSS và làm tăng kích thước bundle không đáng có. Sử dụng class của Tailwind CSS giúp tái sử dụng tối đa các thuộc tính CSS đã được sinh sẵn.
* **Tối ưu hóa hiệu năng Angular**: Tránh việc Angular phải tự động tạo CSS scoping (với cơ chế `ViewEncapsulation.Emulated` mặc định sinh ra các thuộc tính `_nghost-` và `_ngcontent-` làm tăng kích thước DOM và chậm hiệu năng render).
* **Đồng bộ hóa giao diện dễ dàng**: Khi toàn bộ custom CSS được đặt ở một nơi duy nhất (file CSS dùng chung của thư viện UI hoặc stylesheet toàn cục của Web client), việc thay đổi theme hoặc sửa lỗi vỡ khung giao diện sẽ diễn ra nhanh chóng và chính xác hơn.

---

### 3. Quy chuẩn cấu trúc mới (Structure Standards)

#### 3.1 Cấu trúc thư mục của một Component tiêu chuẩn:
```text
[component-name]/
├── [component-name].component.ts      # Chứa mã logic Angular, directive, signals, inputs, v.v.
└── [component-name].component.html    # Chỉ chứa mã template HTML thuần túy
```
*(Lưu ý: Không tạo file `[component-name].component.css` hoặc `[component-name].component.scss`)*

#### 3.2 Khai báo Decorator `@Component`:
* **Cấm viết inline template**: Không dùng thuộc tính `template: `\`...\``. Thay vào đó phải dùng `templateUrl: './[component-name].component.html'`.
* **Cấm viết CSS riêng**: Không sử dụng thuộc tính `styleUrl` hoặc `styleUrls` trong Decorator.

---

### 4. Minh họa trước và sau tái cấu trúc (Before vs After)

#### 4.1 Trước khi tái cấu trúc (Ví dụ: `InputComponent` viết inline template):
```typescript
// input.component.ts
@Component({
  selector: 'oerp-input',
  standalone: true,
  imports: [NgClass, ReactiveFormsModule],
  template: `
    <div class="flex flex-col gap-1">
      <label *ngIf="label()">{{ label() }}</label>
      <input [formControl]="control()" class="border px-3 py-2" />
    </div>
  `
})
export class InputComponent {
  label = input<string>('');
  control = input<FormControl>(new FormControl());
}
```

#### 4.2 Sau khi tái cấu trúc (Tách biệt cấu trúc):

**Tệp tin mã nguồn TypeScript (`input.component.ts`):**
```typescript
import { Component, input } from '@angular/core';
import { NgClass } from '@angular/common';
import { FormControl, ReactiveFormsModule } from '@angular/forms';

@Component({
  selector: 'oerp-input',
  standalone: true,
  host: {
    class: 'block w-full'
  },
  imports: [NgClass, ReactiveFormsModule],
  templateUrl: './input.component.html' // Đã tách ra file HTML riêng biệt
})
export class InputComponent {
  label = input<string>('');
  control = input<FormControl>(new FormControl());
}
```

**Tệp tin giao diện HTML (`input.component.html`):**
```html
<div class="flex flex-col w-full gap-1.5">
  @if (label()) {
    <label class="text-xs font-semibold text-slate-700 dark:text-slate-300">
      {{ label() }}
    </label>
  }
  <input
    [formControl]="control()"
    class="block w-full py-2.5 px-3.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 outline-none text-sm font-medium transition-all focus:border-rose-gold-500 focus:ring-1 focus:ring-rose-gold-500"
  />
</div>
```

---

### 5. Hướng dẫn quản lý Custom Styles

Nếu gặp trường hợp các class tiện ích của Tailwind CSS không đáp ứng được yêu cầu (ví dụ: các hiệu ứng animation phức tạp, style cho thư viện bên thứ ba, cấu hình scrollbar):

1. **Đối với thư viện UI (`open-erp-ui`)**:
   * Định nghĩa các class dùng chung hoặc custom CSS tập trung trong tệp tin CSS chính của thư viện (ví dụ: `projects/shared-ui/src/lib/styles/lib-styles.css` hoặc tệp tin stylesheet chung xuất khẩu).
2. **Đối với ứng dụng Web (`open-erp-web`)**:
   * Đưa các định dạng tùy biến vào tệp tin [styles.css](../../../../open-erp-web/src/styles.css) toàn cục của ứng dụng.
3. **Quy chuẩn viết CSS thủ công**:
   * Sử dụng cấu trúc biến thể hoặc custom class chuẩn Tailwind v4 như `@utility` hoặc sử dụng biến CSS để đảm bảo khả năng tương thích cao nhất.

---

### 6. Tiêu chí nghiệm thu (Acceptance Criteria)

1. **Kiểm tra cấu trúc**: Toàn bộ các component trong thư mục `open-erp-ui/projects/shared-ui/src/lib/components/` and `open-erp-web/src/app/` không chứa thuộc tính `template` dạng inline.
2. **Kiểm tra tệp tin Styles**: Không có bất kỳ tệp tin `.css`, `.scss`, `.sass` nào được sinh ra ở cấp độ component cục bộ, và không có trường `styleUrl`/`styleUrls` nào xuất hiện trong các file `.ts`.
3. **Biên dịch & Chạy thử**:
   * Hệ thống build thư viện thành công thông qua lệnh `npm run ui:build`.
   * Web client build thành công thông qua lệnh `npm run build --workspace=open-erp-web`.
   * Giao diện chạy thực tế không bị lỗi hiển thị hoặc mất định dạng so với trước khi tái cấu trúc.

---

### 7. Trạng thái thực hiện (Implementation Status)
- **Trạng thái**: [x] Đã hoàn thành (Completed)
- **Kết quả**:
  - Đã tách toàn bộ 18 component trong thư mục [components/](../../../../open-erp-ui/projects/shared-ui/src/lib/components/) của thư viện `@open-erp/shared-ui` từ inline template sang file `.html` riêng biệt tương ứng.
  - Đã tách component [RegisterComponent](../../../../open-erp-web/src/app/features/auth/register/register.component.ts) của Web Client sang [register.component.html](../../../../open-erp-web/src/app/features/auth/register/register.component.html).
  - Đã loại bỏ `styleUrl` và xóa tệp tin stylesheet trống cục bộ `app.css` tại [app.ts](../../../../open-erp-web/src/app/app.ts).
  - Kiểm tra build thành công 100%, đảm bảo hệ thống đồng bộ và sạch sẽ theo đúng quy chuẩn.

