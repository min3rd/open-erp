# TASK-SPRINT-02-FRONTEND-003: Angular Web — Catalog và Dynamic Form Builder UI

## Thông tin

| Thuộc tính       | Giá trị                                                                            |
|------------------|------------------------------------------------------------------------------------|
| Task ID          | TASK-SPRINT-02-FRONTEND-003                                                        |
| Sprint           | Sprint 02                                                                          |
| Cluster          | frontend                                                                           |
| Loại             | Frontend                                                                           |
| Người phụ trách  | Frontend                                                                           |
| Story Points     | 8                                                                                  |
| Trạng thái       | ⬜ TODO                                                                            |
| Phụ thuộc        | TASK-SPRINT-01-FRONTEND-002, TASK-SPRINT-02-SYSTEM_ADMIN-003, TASK-SPRINT-02-SYSTEM_ADMIN-004 |

## Mô tả

Xây dựng 3 nhóm UI: (1) Quản lý Catalog — list/form CRUD cho các danh mục hệ thống; (2) Dynamic Form Builder — giao diện kéo-thả trực quan để tạo biểu mẫu tùy chỉnh, preview và quản lý forms; (3) Notification Preferences — trang cài đặt kênh nhận thông báo cho người dùng.

## Phạm vi kỹ thuật

### Frontend Web (Angular 18 — `open-erp-web`)

**Cấu trúc module:**
```
src/app/features/system-admin/
├── catalogs/
│   ├── catalogs.routes.ts
│   ├── catalog-type-list/
│   │   ├── catalog-type-list.component.ts    ← Danh sách loại danh mục
│   │   └── catalog-type-list.component.html
│   ├── catalog-item-list/
│   │   ├── catalog-item-list.component.ts    ← Items trong 1 type
│   │   └── catalog-item-list.component.html
│   ├── catalog-form/
│   │   ├── catalog-form.component.ts         ← Create/Edit modal
│   │   └── catalog-form.component.html
│   └── catalog.service.ts
├── dynamic-forms/
│   ├── dynamic-forms.routes.ts
│   ├── form-list/
│   │   ├── form-list.component.ts
│   │   └── form-list.component.html
│   ├── form-builder/
│   │   ├── form-builder.component.ts         ← Drag & drop builder
│   │   ├── form-builder.component.html
│   │   ├── form-builder.component.css
│   │   └── components/
│   │       ├── field-palette/                ← Field types panel (left)
│   │       ├── form-canvas/                  ← Drop zone (center)
│   │       ├── field-settings/              ← Field config panel (right)
│   │       └── form-preview/               ← Live preview
│   └── dynamic-form.service.ts
└── notification-preferences/
    ├── notification-preferences.component.ts
    └── notification-preferences.component.html
```

---

**1. Catalog Management UI:**

**CatalogTypeListComponent:**
- Grid cards hiển thị các loại danh mục (customer_group, leave_type, ...)
- Mỗi card: icon, tên, số items, nút "Quản lý"
- Click "Quản lý" → navigate sang CatalogItemListComponent

**CatalogItemListComponent:**
- Bảng items của type đang chọn
- Columns: Code | Tên | Mô tả | Màu sắc | Thứ tự | Trạng thái | Actions
- Nút "Thêm" → CatalogFormComponent (modal)
- Drag & drop để sắp xếp lại `order`
- Import CSV button → file picker → upload → hiển thị kết quả (success/errors)
- Export CSV button
- Toggle active/inactive inline

**CatalogFormComponent (Modal):**
- Fields: Code, Tên, Mô tả, Màu sắc (color picker), Icon, Thứ tự, Trạng thái
- Validation: code required + pattern `[A-Z0-9_]+`, tên required
- Metadata fields động theo catalog type (nếu có schema)

---

**2. Dynamic Form Builder UI:**

**FormListComponent:**
- Danh sách forms với status badge (DRAFT/PUBLISHED/ARCHIVED)
- Columns: Tên | Danh mục | Số submissions | Trạng thái | Ngày tạo | Actions
- Nút "Tạo form mới" → navigate sang FormBuilderComponent
- Actions: Edit (nếu DRAFT), Preview, Duplicate, Archive

**FormBuilderComponent — 3-panel layout:**

```
+------------------+----------------------------+-------------------+
|  FIELD PALETTE   |      FORM CANVAS           |  FIELD SETTINGS   |
|  (Left panel)    |      (Center)              |  (Right panel)    |
+------------------+----------------------------+-------------------+
| Text             | [Drag fields here]         | Label: __________ |
| Textarea         |                            | Placeholder: ____ |
| Number           | +----------------------------+                  |
| Date             | | Label: *Required           |  Required: [x]   |
| Select           | | Placeholder: ...           |  Width: [Full ▼] |
| Multi-select     | | [Input field preview]     |  Validation:      |
| Checkbox         | +----------------------------+    Min: ___       |
| File upload      |          ↕ (drag)          |    Max: ___       |
| User Picker      | +----------------------------+                  |
| Rich Text        | | ...another field...       |  Options: (list)  |
| Section Header   | +----------------------------+  [+ Add option]   |
| ...              |                            |                   |
+------------------+----------------------------+-------------------+
|  [Preview]  [Save Draft]  [Publish]           |                   |
+--------------------------------------------------+                |
```

**Field Palette (Left):** 
- List of draggable field type tiles
- Grouped by category: Basic | Advanced | Layout

**Form Canvas (Center):**
- Droppable area
- Drag from palette → add field to canvas
- Drag within canvas → reorder fields
- Click field → select (show settings in right panel)
- Delete button per field
- Width visual indicator (full/half/third)

**Field Settings (Right):**
- Reactive form driven by selected field type
- Common settings: Label, Placeholder, Help Text, Required, Width
- Type-specific settings:
  - Text: min/max length, pattern
  - Number: min/max value, step
  - Select: options list (add/remove), data source (catalog type)
  - File: allowed types, max size
  - User Picker: filter by department, role

**Form Preview Modal:**
- Render form dựa trên JSON schema hiện tại
- Dùng `@ngx-formly` hoặc tự implement dynamic form renderer
- Validate form theo schema

---

**3. Notification Preferences UI:**

**NotificationPreferencesComponent:**
- Nhóm theo event category (Nhân sự, Kinh doanh, Hệ thống)
- Mỗi event type: toggle In-App | Email | Push
- "Tắt tạm thời đến ngày": date picker
- Save button

```
Nhân sự
  ✅ Task được giao        [In-App ✅] [Email ✅] [Push ✅]
  ✅ Đơn nghỉ phép         [In-App ✅] [Email ✅] [Push ❌]
  ✅ Đánh giá hiệu suất    [In-App ✅] [Email ❌] [Push ❌]

Kinh doanh
  ✅ Đơn hàng mới          [In-App ✅] [Email ✅] [Push ✅]
  ...
```

## API Endpoints sử dụng

| API                                      | Component sử dụng            |
|------------------------------------------|------------------------------|
| `GET /api/v1/catalogs/types`             | CatalogTypeListComponent     |
| `GET /api/v1/catalogs?type=xxx`          | CatalogItemListComponent     |
| `POST /api/v1/catalogs`                  | CatalogFormComponent         |
| `PATCH /api/v1/catalogs/:id`             | CatalogFormComponent         |
| `DELETE /api/v1/catalogs/:id`            | CatalogItemListComponent     |
| `POST /api/v1/catalogs/bulk-import`      | CatalogItemListComponent     |
| `GET /api/v1/catalogs/export`            | CatalogItemListComponent     |
| `PATCH /api/v1/catalogs/reorder`         | CatalogItemListComponent     |
| `GET /api/v1/forms`                      | FormListComponent            |
| `POST /api/v1/forms`                     | FormBuilderComponent         |
| `PATCH /api/v1/forms/:id`                | FormBuilderComponent         |
| `POST /api/v1/forms/:id/publish`         | FormBuilderComponent         |
| `GET /api/v1/notifications/preferences`  | NotificationPreferencesComponent |
| `PATCH /api/v1/notifications/preferences`| NotificationPreferencesComponent |

## Acceptance Criteria

- [ ] Catalog: danh sách types, navigate sang items list
- [ ] Catalog: CRUD items, drag reorder, color picker hoạt động
- [ ] Catalog: Import CSV → hiển thị kết quả (N thành công, M lỗi)
- [ ] Form Builder: drag field từ palette → xuất hiện trên canvas
- [ ] Form Builder: drag reorder fields trên canvas
- [ ] Form Builder: click field → settings panel cập nhật đúng
- [ ] Form Builder: thay đổi settings → form canvas preview cập nhật realtime
- [ ] Form Builder: Preview modal render đúng form
- [ ] Form Builder: Save → JSON schema được lưu
- [ ] Form Builder: Publish → form chuyển sang PUBLISHED
- [ ] Form List: filter theo status, search tên
- [ ] Notification Preferences: toggle channels lưu đúng
- [ ] Các màn hình Catalog, Dynamic Form Builder và Notification Preferences hỗ trợ đầy đủ Light Mode và Dark Mode theo Design System tokens
- [ ] Dark mode tự áp dụng theo `prefers-color-scheme` và cho phép người dùng chuyển thủ công bằng toggle theme
- [ ] Preference giao diện được lưu bằng key `openErp.colorMode` trong localStorage
- [ ] Khi khởi động app, mode đã lưu được áp dụng trước lần render đầu tiên để tránh flash/sai màu ban đầu
- [ ] Toggle theme dùng lại component dùng chung (ví dụ `erp-theme-toggle` hoặc tương đương trong shared UI)
- [ ] Toàn bộ text UI dùng Transloco key (không hardcode text trực tiếp)
- [ ] Unit test coverage ≥ 80%
- [ ] Có test (unit/integration hoặc e2e) xác nhận hiển thị và chuyển đổi đúng ở cả Light Mode và Dark Mode

## Ghi chú kỹ thuật

- Angular CDK DragDrop cho cả Field Palette → Canvas và reorder trong Canvas.
- `@angular/cdk/drag-drop` `CdkDropList` với `cdkDropListConnectedTo` để kết nối 2 drop zones.
- Form Canvas state: dùng Angular Signal store (hoặc NgRx) để manage form schema.
- Dynamic form renderer: tự implement `DynamicFormRendererComponent` nhận JSON schema, render Angular `ReactiveForm` tương ứng.
- Color picker: Angular Material không có sẵn → dùng `@angular-material-components/color-picker` hoặc custom.
- Formly (`@ngx-formly`) là lựa chọn tốt cho dynamic form rendering — cân nhắc dùng.
- Auto-save draft sau 30 giây khi Form Builder có thay đổi (debounce).
- Tất cả file style cho Angular Web dùng `.css`, không dùng `.scss`.
