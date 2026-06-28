# Hướng dẫn tích hợp & Tùy biến Trình thiết kế Form Động (Dynamic Form Builder)

Tài liệu này hướng dẫn cách tích hợp component `DynamicFormBuilderComponent` như một thư viện độc lập vào các module hoặc dự án khác trong hệ sinh thái Open-ERP, đồng thời hướng dẫn custom giao diện và cấu hình đa ngôn ngữ.

---

## 1. Tích hợp Component

Component `DynamicFormBuilderComponent` được thiết kế dưới dạng **Angular Standalone Component**. Bạn có thể import trực tiếp vào các component/module khác.

### Import vào Component khác:
```typescript
import { Component } from '@angular/core';
import { DynamicFormBuilderComponent } from './features/dynamic-form-builder/dynamic-form-builder.component';

@Component({
  selector: 'app-admin-layout',
  standalone: true,
  imports: [DynamicFormBuilderComponent],
  template: `
    <div class="my-admin-container">
      <app-dynamic-form-builder></app-dynamic-form-builder>
    </div>
  `
})
export class AdminLayoutComponent {}
```

---

## 2. Tùy biến Giao diện (Theme Customization)

Toàn bộ CSS của Form Builder đã được scope dưới lớp cha `.oerp-fb-root` và sử dụng hệ thống **CSS Custom Properties (Variables)**. Để ghi đè màu sắc chủ đạo hoặc font chữ cho khớp với dự án của bạn, chỉ cần định nghĩa lại các biến này trong file CSS global hoặc thẻ cha chứa Form Builder.

### Các biến CSS hỗ trợ ghi đè:

| Biến CSS | Giá trị mặc định | Mô tả |
|----------|------------------|-------|
| `--oerp-fb-primary` | `#c4874a` (Rose Gold) | Màu chủ đạo (nút bấm, active tabs, icon chính) |
| `--oerp-fb-primary-hover` | `#a36b36` | Màu khi hover vào các thành phần chủ đạo |
| `--oerp-fb-bg-base` | `#f8fafc` (Slate 50) | Màu nền phía dưới canvas |
| `--oerp-fb-bg-card` | `#ffffff` | Màu nền của panels, cards, và thanh công cụ |
| `--oerp-fb-bg-input` | `#f8fafc` | Màu nền của các input và dropdowns |
| `--oerp-fb-text` | `#1e293b` (Slate 800) | Màu chữ chính |
| `--oerp-fb-text-muted` | `#64748b` (Slate 500) | Màu chữ phụ |
| `--oerp-fb-border` | `#e2e8f0` (Slate 200) | Màu viền phân cách |
| `--oerp-fb-danger` | `#ef4444` (Red 500) | Màu nút xóa hoặc cảnh báo lỗi |
| `--oerp-fb-radius-lg` | `1rem` (16px) | Bo góc của panel blocks và layout chính |
| `--oerp-fb-radius-md` | `0.6rem` (10px) | Bo góc của các inputs, options, và thẻ fields |

### Ví dụ ghi đè Theme màu xanh dương (Ocean Blue) trong dự án của bạn:
```css
.my-admin-container {
  /* Ghi đè biến CSS của Form Builder */
  --oerp-primary: #0284c7;        /* Sky 600 */
  --oerp-primary-hover: #0369a1;  /* Sky 700 */
  --oerp-bg-base: #f0f9ff;         /* Sky 50 */
  --oerp-radius-lg: 0.5rem;       /* Bo góc gọn hơn */
}
```

---

## 3. Cấu hình Đa ngôn ngữ (Localization)

Toàn bộ các chuỗi văn bản cứng trên giao diện (Hardcoded strings) đã được tách riêng ra file cấu hình hằng số `dynamic-form-builder.constants.ts`.

Nếu muốn tích hợp đa ngôn ngữ (tiếng Anh, tiếng Việt, vv.), bạn chỉ cần chỉnh sửa đối tượng `I18N_LABELS` trong:
[dynamic-form-builder.constants.ts](file:///c:/Users/Minh/Documents/open-erp/open-erp-web/src/app/features/dynamic-form-builder/dynamic-form-builder.constants.ts)

Hoặc nâng cấp component để nhận nhãn hiển thị qua một `@Input() customLabels` từ bên ngoài truyền vào.

---

## 4. Cấu trúc dữ liệu đầu ra (JSON Output Schema)

Khi người dùng nhấn **Lưu Thiết Kế**, Component sẽ gửi một payload chứa schema của form lên API:

```json
{
  "formKey": "custom_dynamic_form",
  "name": "Biểu mẫu động mới",
  "description": "Mô tả biểu mẫu",
  "fields": [
    {
      "id": "field_a1b2c",
      "name": "input_username",
      "label": "Tên người dùng",
      "type": "TEXT",
      "required": true,
      "placeholder": "Nhập họ tên...",
      "layout": {
        "panelId": "panel_x9y8z",
        "colSpanDesktop": 6,
        "colSpanTablet": 12,
        "colSpanMobile": 12
      }
    }
  ],
  "meta": {
    "panels": [
      {
        "id": "panel_x9y8z",
        "name": "Thông tin cá nhân",
        "type": "default",
        "layout": {
          "desktop": { "cols": 2, "colSpan": 12 },
          "tablet": { "cols": 1, "colSpan": 12 },
          "mobile": { "cols": 1, "colSpan": 12 }
        },
        "columns": [
          {
            "id": "col_xyz_0",
            "colSpan": 6,
            "items": [
              { "kind": "field", "id": "field_a1b2c" }
            ]
          },
          {
            "id": "col_xyz_1",
            "colSpan": 6,
            "items": []
          }
        ]
      }
    ],
    "rootPanelOrder": ["panel_x9y8z"],
    "topLevelFieldOrder": []
  }
}
```

Kiến trúc này lưu trữ mối quan hệ phân cấp của layout trong trường `meta` và liên kết ngược các fields thông qua trường `layout.panelId` để trình renderer có thể khôi phục chính xác giao diện hiển thị cho người dùng cuối.
