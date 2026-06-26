# Tài liệu kỹ thuật chi tiết: TSK-2.18 - Thư viện Component Form dùng chung (Shared Form Component Library)
## Phân hệ: Thư viện UI dùng chung (`open-erp-shared-ui`)

---

### 1. Mục tiêu công việc (Objective)

Xây dựng bộ thư viện **Component Form dùng chung** (`@open-erp/shared-ui/form`) cung cấp đầy đủ các building block cơ sở để **build** (thiết kế/cấu hình) và **render** (hiển thị/thực thi) form động trong toàn hệ thống Open-ERP. Thư viện này đóng vai trò nền tảng, được tái sử dụng ở nhiều phân hệ: Form Builder (TSK-2.10), Template Designer (TSK-2.11), Smart Approval Inbox (TSK-2.13), Mobile Self-service (TSK-2.14) và mọi màn hình hiển thị form trong tương lai.

Mục tiêu cốt lõi:
- **Chuẩn hóa:** Mỗi component form chỉ được phát triển một lần, dùng nhiều nơi.
- **Dữ liệu hướng schema (Schema-driven):** Mọi component đều nhận vào một `FieldSchema` JSON và tự render theo đó, không hard-code.
- **Tương thích Light/Dark Mode** và gam màu **Rose Gold (`#B76E79`)** toàn thư viện.
- **Đa ngôn ngữ** đầy đủ qua Angular Transloco.

---

### 2. Danh sách Component cần xây dựng

#### 2.1 Form Primitive Components (Nguyên tố cơ sở)

Mỗi component nhận input `fieldSchema: FieldSchema` và emit `valueChange: EventEmitter`.

| Component | Mô tả | Input Schema Type |
| :--- | :--- | :--- |
| `<oerp-form-text>` | Ô nhập text, hỗ trợ mask, prefix/suffix icon | `text`, `email`, `phone`, `url` |
| `<oerp-form-textarea>` | Ô nhập text nhiều dòng, tự co giãn chiều cao | `textarea` |
| `<oerp-form-number>` | Ô nhập số, format locale, prefix/suffix đơn vị | `number`, `currency` |
| `<oerp-form-date>` | Date picker / Date-range picker tích hợp locale VN | `date`, `date-range` |
| `<oerp-form-time>` | Time picker 12h/24h | `time` |
| `<oerp-form-select>` | Dropdown đơn/đa lựa chọn, hỗ trợ search, virtual scroll | `select`, `multi-select` |
| `<oerp-form-checkbox>` | Checkbox đơn hoặc nhóm (checkbox group) | `checkbox`, `checkbox-group` |
| `<oerp-form-radio>` | Radio group, hỗ trợ hiển thị dạng ngang/dọc | `radio` |
| `<oerp-form-toggle>` | Toggle switch bật/tắt | `toggle` |
| `<oerp-form-file>` | File upload: kéo thả file, multi-file, preview ảnh | `file`, `image` |
| `<oerp-form-rich-text>` | Rich text editor tích hợp (Quill hoặc tiptap) | `rich-text` |
| `<oerp-form-rating>` | Chấm điểm theo sao (1-5 stars hoặc custom max) | `rating` |
| `<oerp-form-color>` | Color picker, trả về HEX/RGB | `color` |
| `<oerp-form-signature>` | Vẽ/nhập chữ ký bằng chuột hoặc cảm ứng | `signature` |

#### 2.2 Form Composite Components (Hỗn hợp/Phức tạp)

| Component | Mô tả |
| :--- | :--- |
| `<oerp-form-api-select>` | Select động: gọi API endpoint, hỗ trợ dependent params (`{{field}}`), cấu hình label/value key |
| `<oerp-form-catalog-select>` | Select liên kết danh mục hệ thống (Employees, Departments, Projects, Customers) |
| `<oerp-form-address>` | Composite: Tỉnh/Thành → Quận/Huyện → Phường/Xã (cascading API) |
| `<oerp-form-grid>` | Bảng lưới nhập liệu kiểu Excel: inline editing, add/delete row, cột động, validation per-cell, footer sum/avg |
| `<oerp-form-repeater>` | Lặp lại một nhóm trường (repeat group): thêm/xóa nhóm động |

#### 2.3 Form Layout Components (Bố cục)

| Component | Mô tả |
| :--- | :--- |
| `<oerp-form-row>` | Dòng bố cục, hỗ trợ n-column grid (12-col system) |
| `<oerp-form-col>` | Cột bố cục, nhận `[xs] [sm] [md] [lg]` responsive span |
| `<oerp-form-section>` | Nhóm trường có tiêu đề (fieldset/card), hỗ trợ collapsible |
| `<oerp-form-tab>` | Bố cục Tab: nhiều tab, mỗi tab chứa nhóm trường |
| `<oerp-form-accordion>` | Bố cục Accordion: mở/đóng từng nhóm trường |
| `<oerp-form-stepper>` | Bố cục Stepper (multi-step form), quản lý validate từng bước |
| `<oerp-form-divider>` | Đường phân cách trực quan giữa các nhóm |

#### 2.4 Form Engine & Renderer (Động cơ kết xuất)

| Component / Service | Mô tả |
| :--- | :--- |
| `<oerp-form-renderer>` | **Component chính:** Nhận `formSchema: FormSchema` JSON → tự động render toàn bộ form với layout, fields, rules |
| `FormEngineService` | Service xử lý: apply conditional logic (ẩn/hiện), cascading values, calculated fields từ schema |
| `FormSchemaValidator` | Utility xác thực tính hợp lệ của FormSchema JSON (dùng cho Form Builder ở TSK-2.10) |
| `FormValueSerializer` | Utility chuyển đổi dữ liệu form ↔ JSON payload tương thích backend |

#### 2.5 Form Utility Components

| Component | Mô tả |
| :--- | :--- |
| `<oerp-field-error>` | Hiển thị thông báo lỗi validate dưới field, hỗ trợ i18n |
| `<oerp-field-label>` | Label chuẩn hóa với indicator bắt buộc (*), tooltip hint |
| `<oerp-field-wrapper>` | Container bọc field: label + control + error + helper text |
| `<oerp-form-action-bar>` | Thanh nút hành động form: Submit, Cancel, Reset, Save Draft |

---

### 3. Kiến trúc & Hợp đồng dữ liệu (Data Contract)

#### 3.1 FieldSchema Interface

```typescript
export interface FieldSchema {
  key: string;                    // Tên biến dữ liệu (unique trong form)
  type: FieldType;                // Loại component
  label: string;                  // Nhãn hiển thị (i18n key hoặc plain text)
  placeholder?: string;
  defaultValue?: unknown;
  required?: boolean;
  readOnly?: boolean;
  hidden?: boolean;
  disabled?: boolean;
  validation?: ValidationRule[];  // Danh sách rules validate
  layout?: FieldLayout;           // Cấu hình responsive layout
  options?: OptionItem[];         // Dành cho select/radio/checkbox-group
  apiConfig?: ApiConfig;          // Cấu hình cho api-select
  gridColumns?: GridColumnDef[];  // Dành cho grid/table component
  conditionalRules?: ConditionalRule[]; // Quy tắc ẩn/hiện/cascade
  meta?: Record<string, unknown>; // Dữ liệu mở rộng
}

export interface FormSchema {
  id: string;
  version: number;
  title?: string;
  fields: FieldSchema[];
  layout?: FormLayout;
  submitEndpoint?: string;
}
```

#### 3.2 ValidationRule Interface

```typescript
export interface ValidationRule {
  type: 'required' | 'minLength' | 'maxLength' | 'pattern' | 'min' | 'max' | 'custom';
  value?: unknown;
  message: string; // i18n key
}
```

#### 3.3 ConditionalRule Interface

```typescript
export interface ConditionalRule {
  when: {
    field: string;
    operator: 'eq' | 'neq' | 'gt' | 'lt' | 'gte' | 'lte' | 'contains' | 'empty' | 'notEmpty';
    value: unknown;
  };
  then: {
    action: 'show' | 'hide' | 'enable' | 'disable' | 'require' | 'setValue' | 'triggerApi';
    target: string; // field key hoặc section id
    value?: unknown;
  };
}
```

---

### 4. Phân chia công việc chi tiết

#### 4.1 Frontend Engineer (FE Web)
* **Nhiệm vụ 1: Khung thư viện & Design Tokens (TSK-2.18.1)**
  - Khởi tạo Angular Library `@open-erp/shared-ui/form` trong `open-erp-shared`.
  - Định nghĩa các TypeScript interfaces: `FieldSchema`, `FormSchema`, `ValidationRule`, `ConditionalRule`, `ApiConfig`, `GridColumnDef`.
  - Thiết lập CSS variables (tokens) cho màu sắc, spacing, typography đồng bộ Rose Gold theme.
* **Nhiệm vụ 2: Form Primitive Components (TSK-2.18.2)**
  - Phát triển lần lượt 14 component nguyên tố: text, textarea, number, date, time, select, checkbox, radio, toggle, file, rich-text, rating, color, signature.
  - Mỗi component tuân thủ `ControlValueAccessor` để tích hợp `ReactiveFormsModule` mượt mà.
* **Nhiệm vụ 3: Form Composite Components (TSK-2.18.3)**
  - Phát triển `oerp-form-api-select`, `oerp-form-catalog-select`, `oerp-form-address`, `oerp-form-grid`, `oerp-form-repeater`.
  - `oerp-form-grid`: tích hợp inline editing, per-cell validation, dynamic column definition, footer aggregation.
* **Nhiệm vụ 4: Form Layout Components (TSK-2.18.4)**
  - Phát triển bộ layout: row, col, section, tab, accordion, stepper, divider.
  - `oerp-form-stepper`: quản lý bước hiện tại, validate trước khi sang bước tiếp theo.
* **Nhiệm vụ 5: Form Engine & Renderer (TSK-2.18.5)**
  - Xây dựng `FormEngineService` xử lý conditional logic, cascading, calculated fields.
  - Xây dựng `<oerp-form-renderer>` nhận `FormSchema` và render toàn bộ form động.
  - Viết `FormSchemaValidator` và `FormValueSerializer`.
* **Nhiệm vụ 6: Storybook & Unit Tests (TSK-2.18.6)**
  - Viết Storybook stories cho từng component để trình diễn và kiểm thử thị giác.
  - Viết unit tests (Karma/Jest) đạt coverage ≥ 80% cho các utility và engine.

#### 4.2 UI/UX Designer
* Thiết kế design spec cho từng component (trạng thái: default, focus, error, disabled, read-only).
* Đảm bảo nhất quán hệ màu Rose Gold, kiểu chữ, icon set.

#### 4.3 QA Engineer
* Viết kịch bản kiểm thử:
  - Kiểm thử render form từ schema JSON phức tạp (>20 fields, nhiều layout lồng nhau).
  - Kiểm thử conditional logic: ẩn/hiện, cascade, calculated fields.
  - Kiểm thử validate: required, regex, min/max, custom message i18n.
  - Kiểm thử grid/table: inline edit, validation per-cell, footer sum.
  - Kiểm thử dark mode và đa ngôn ngữ (vi/en/zh/ja).

---

### 5. Hướng dẫn Phát triển & Xuất bản (Development & Publishing)

```bash
# Build thư viện
cd open-erp-shared
ng build @open-erp/shared-ui

# Chạy Storybook
npm run storybook

# Chạy unit tests
ng test @open-erp/shared-ui
```

**Import trong web app:**
```typescript
import { OerpFormModule } from '@open-erp/shared-ui/form';

@NgModule({
  imports: [OerpFormModule]
})
```

---

### 6. Tiêu chí hoàn thành (Definition of Done - DoD)

- [x] Model schema (`FieldType`, `FormField`, `FormSchema`, `ValidationRule`, `ConditionalRule`, `ApiConfig`, `GridColumnDef`, `OptionItem`) đầy đủ và export.
- [x] `oerp-form-field-wrapper` — container chuẩn hóa label + required indicator + error message + helper text.
- [x] `oerp-form-number` — ô nhập số với min/max/step/unit/prefix icon.
- [x] `oerp-form-date` — date picker với FormControl, hỗ trợ date/datetime-local/month/week.
- [x] `oerp-form-file` — upload zone drag-and-drop, multi-file, image preview, per-file size validation.
- [x] `oerp-form-renderer` — component chính render form từ `FormSchema` JSON với 12-col responsive grid.
- [x] `FormEngineService` — `buildFormGroup()`, `applyConditionalRules()`, `serializeFormValue()`, `getFirstErrorMessage()`.
- [x] Toàn bộ component theo Dark mode (CSS `dark:` variants), gam màu Rose Gold.
- [x] `public-api.ts` export đầy đủ.
- [x] Build `@open-erp/shared` thành công, không có lỗi TypeScript/Angular.
- [ ] `oerp-form-grid` inline editing, validate per-cell, footer sum/avg — sẽ triển khai tại TSK-2.10.
- [ ] Storybook stories — sẽ bổ sung song song TSK-2.10.
- [ ] Unit test coverage ≥ 80% — sẽ bổ sung song song TSK-2.10.

---

### 7. Trạng thái thực tế & Kết quả bàn giao (Actual Status & Deliverables)

**Hoàn thành (giai đoạn 1 — nền tảng unblock TSK-2.10)**

**Model & Interfaces mở rộng:**
- Cập nhật [dynamic-form.model.ts](../../../../open-erp-shared/projects/shared-ui/src/lib/models/dynamic-form.model.ts) — thêm `ValidationRule`, `ConditionalRule`, `ApiConfig`, `GridColumnDef`, `OptionItem`, `FormSchema`; mở rộng `FieldType` enum (thêm `DATE_RANGE`, `MULTI_SELECT`, `CHECKBOX_GROUP`, `RADIO`, `TOGGLE`, `IMAGE`).

**Form Utility Component:**
- Tạo [form-field-wrapper](../../../../open-erp-shared/projects/shared-ui/src/lib/components/form-field-wrapper/form-field-wrapper.component.ts) — container chuẩn hóa với label, required indicator (*), helper text, animated error message.

**Form Primitive Components (mới):**
- Tạo [form-number](../../../../open-erp-shared/projects/shared-ui/src/lib/components/form-number/form-number.component.ts) — ô nhập số với prefix icon, suffix unit, hide spin buttons, FormControl integration.
- Tạo [form-date](../../../../open-erp-shared/projects/shared-ui/src/lib/components/form-date/form-date.component.ts) — date/datetime picker với dark mode `color-scheme`, min/max attributes, FormControl integration.
- Tạo [form-file](../../../../open-erp-shared/projects/shared-ui/src/lib/components/form-file/form-file.component.ts) — upload zone: drag-and-drop + click to browse, image thumbnail preview, per-file size validation, multiple file support với Signal state.

**Form Engine & Renderer:**
- Tạo [FormEngineService](../../../../open-erp-shared/projects/shared-ui/src/lib/services/form-engine.service.ts) — `buildFormGroup()` tạo FormGroup với validators từ schema; `applyConditionalRules()` subscribe valueChanges và áp dụng visibility/cascade/setValue/require logic; `serializeFormValue()` chuyển đổi form → JSON payload backend; `getFirstErrorMessage()` truy xuất thông báo lỗi ưu tiên custom message từ schema.
- Tạo [form-renderer](../../../../open-erp-shared/projects/shared-ui/src/lib/components/form-renderer/form-renderer.component.ts) — component chủ đạo nhận `[schema]: FormSchema`, render đúng component theo `field.type`, hỗ trợ responsive grid (12-col), controlled mode (`[externalFormGroup]`), readOnly mode, previewMode (desktop/tablet/mobile).

**Public API:**
- Cập nhật [public-api.ts](../../../../open-erp-shared/projects/shared-ui/src/public-api.ts) — export tất cả components và services mới theo category.

**Build Verification:**
- `npx ng build shared-ui --configuration production` → **BUILD THÀNH CÔNG**, không lỗi, thời gian 13.7s.
- Output: `E:/Minh/open-erp/open-erp-shared/dist/shared`
