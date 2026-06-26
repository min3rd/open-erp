# Tài liệu kỹ thuật chi tiết: TSK-2.19 - Thư viện Kéo Thả dùng chung (Shared Drag-and-Drop Library)
## Phân hệ: Thư viện UI dùng chung (`open-erp-shared-ui`)

---

### 1. Mục tiêu công việc (Objective)

Xây dựng bộ thư viện **Drag-and-Drop (DnD) dùng chung** (`@open-erp/shared-ui/dnd`) cung cấp các directive, service và component trừu tượng hóa toàn bộ tính năng kéo thả trong hệ thống Open-ERP. Thư viện này được thiết kế như một **abstraction layer** trên nền `@angular/cdk/drag-drop`, bổ sung thêm các tính năng nâng cao (multi-list, nested DnD, touch support, keyboard navigation, drop placeholder animation) và chuẩn hóa API để tái sử dụng nhất quán ở:

- **Form Builder** (TSK-2.10): kéo thả field component vào canvas layout.
- **Workflow Designer** (TSK-2.16): kéo thả node vào canvas sơ đồ quy trình.
- **Template Designer** (TSK-2.11): kéo thả block văn bản vào vùng soạn thảo.
- Mọi màn hình quản trị danh sách có tính năng reorder trong tương lai.

---

### 2. Kiến trúc & Các module cần xây dựng

#### 2.1 Core Directives

| Directive | Mô tả |
| :--- | :--- |
| `oerpDraggable` | Đánh dấu element có thể kéo. Nhận `[oerpDraggableData]` (payload), `[oerpDraggableDisabled]`. Emit `(dragStarted)`, `(dragEnded)`. |
| `oerpDropZone` | Đánh dấu vùng có thể nhận drop. Nhận `[oerpDropZoneId]`, `[oerpDropZoneAccepts]` (filter theo type), `[oerpDropZoneOrientation]` (vertical/horizontal/grid). Emit `(itemDropped)`. |
| `oerpSortable` | Bao bọc danh sách, kết hợp `oerpDraggable` + `oerpDropZone`, hỗ trợ reorder trong cùng list. Emit `(sortChanged)`. |
| `oerpDragHandle` | Chỉ định khu vực handle để kéo (kéo theo handle, không phải toàn element). |
| `oerpDragPreview` | Template tùy chỉnh cho ghost/preview khi đang kéo. |

#### 2.2 Core Services

| Service | Mô tả |
| :--- | :--- |
| `DndRegistryService` | Quản lý tập trung danh sách drop zones đã đăng ký, phân giải kết nối giữa các list (multi-list DnD). |
| `DndStateService` | Lưu trạng thái kéo thả hiện tại (đang kéo item nào, từ list nào, con trỏ ở đâu). Dùng Signal/Observable. |
| `DndAutoScrollService` | Tự động cuộn trang/container khi con trỏ đến gần rìa trong lúc đang kéo. |
| `DndKeyboardService` | Xử lý điều khiển kéo thả bằng bàn phím (Space để pickup, mũi tên để di chuyển, Enter/Space để drop). |

#### 2.3 Feature Components

| Component | Mô tả |
| :--- | :--- |
| `<oerp-sortable-list>` | Danh sách có thể reorder bằng kéo thả, nhận `[items]` và emit `(reordered)`. Hỗ trợ animation khi sắp xếp lại. |
| `<oerp-drag-palette>` | Bảng linh kiện nguồn (source palette): hiển thị danh sách item có thể kéo ra khỏi palette để drop vào vùng đích (không xóa khỏi palette khi kéo đi). Dùng cho Form Builder, Workflow Designer. |
| `<oerp-drop-canvas>` | Canvas đích (drop target canvas) dạng tự do (free-form), nhận drop ở tọa độ x/y bất kỳ. Dùng cho Workflow Designer. |
| `<oerp-drop-placeholder>` | Component chỉ báo vị trí drop hiện tại (drop indicator) với animation mượt mà. |
| `<oerp-sortable-tree>` | Danh sách cây (tree) có thể kéo thả để sắp xếp, lồng nhau (nested reorder). |

#### 2.4 Nested & Multi-list DnD

- **Multi-list transfer:** Hỗ trợ kéo item từ list A sang list B (cross-list DnD), cấu hình qua `[connectedTo]` giữa các `oerpDropZone`.
- **Nested DnD:** Hỗ trợ drop vào container lồng nhau (nested containers). Giải quyết vấn đề event bubbling khi drop zones lồng nhau.
- **Type filtering:** Drop zone chỉ nhận item có `type` được khai báo trong `[oerpDropZoneAccepts]`.

#### 2.5 Touch & Accessibility Support

- **Touch events:** Xử lý `touchstart`, `touchmove`, `touchend` cho thiết bị cảm ứng (iOS/Android WebView).
- **Pointer Events API:** Sử dụng Pointer Events thay cho Mouse Events để thống nhất giữa chuột và cảm ứng.
- **ARIA:** Tự động thêm `aria-grabbed`, `aria-dropeffect`, thông báo screen reader khi pickup/drop.
- **Keyboard DnD:** Toàn bộ luồng kéo thả có thể thực hiện qua bàn phím (WCAG 2.1 Level AA).

#### 2.6 Animation & Visual Feedback

- **Ghost/Preview:** Element ghost tùy chỉnh theo `oerpDragPreview` template hoặc clone của element gốc.
- **Drop placeholder:** Vùng placeholder mờ xuất hiện tại vị trí drop, animate smooth bằng CSS transitions.
- **Reorder animation:** Các item trong list tự động animate khi bị đẩy lên/xuống do item đang kéo.
- **Drop confirmation:** Micro-animation "snap" khi item được drop thành công.

---

### 3. Hợp đồng dữ liệu (Data Contract)

```typescript
export interface DndItem<T = unknown> {
  id: string;
  type: string;          // Dùng để filter drop zones
  data: T;               // Payload tùy ý
  label?: string;        // Nhãn hiển thị khi kéo
  icon?: string;         // Icon hiển thị trong ghost
}

export interface DropEvent<T = unknown> {
  item: DndItem<T>;
  sourceZoneId: string;
  targetZoneId: string;
  previousIndex: number;
  currentIndex: number;
  dropPosition?: { x: number; y: number }; // Cho free-form canvas
}

export interface SortEvent<T = unknown> {
  items: DndItem<T>[];   // Danh sách sau khi đã sắp xếp lại
  movedItem: DndItem<T>;
  previousIndex: number;
  currentIndex: number;
}
```

---

### 4. Ví dụ sử dụng (Usage Examples)

#### 4.1 Sortable List cơ bản

```html
<oerp-sortable-list
  [items]="tasks"
  (reordered)="onReorder($event)">
  <ng-template let-item>
    <div class="task-card">{{ item.data.title }}</div>
  </ng-template>
</oerp-sortable-list>
```

#### 4.2 Palette → Canvas (Form Builder pattern)

```html
<!-- Bảng linh kiện nguồn -->
<oerp-drag-palette [items]="fieldComponents" connectedTo="form-canvas">
  <ng-template let-item>
    <div class="palette-item">{{ item.label }}</div>
  </ng-template>
</oerp-drag-palette>

<!-- Canvas đích -->
<div oerpDropZone oerpDropZoneId="form-canvas"
     [oerpDropZoneAccepts]="['field', 'layout']"
     (itemDropped)="onFieldDropped($event)">
</div>
```

#### 4.3 Free-form Canvas (Workflow Designer pattern)

```html
<oerp-drop-canvas
  [items]="workflowNodes"
  (itemDropped)="onNodeDropped($event)"
  (itemMoved)="onNodeMoved($event)">
</oerp-drop-canvas>
```

---

### 5. Phân chia công việc chi tiết

#### 5.1 Frontend Engineer (FE Web)
* **Nhiệm vụ 1: Khung thư viện & Abstraction layer (TSK-2.19.1)**
  - Khởi tạo Angular Library `@open-erp/shared-ui/dnd` trong `open-erp-shared`.
  - Định nghĩa interfaces `DndItem`, `DropEvent`, `SortEvent`.
  - Thiết lập `DndRegistryService` và `DndStateService` dùng Angular Signals.
* **Nhiệm vụ 2: Core Directives (TSK-2.19.2)**
  - Xây dựng `oerpDraggable`, `oerpDropZone`, `oerpSortable`, `oerpDragHandle`, `oerpDragPreview` trên nền `@angular/cdk/drag-drop`.
  - Xử lý multi-list connection, nested DnD event bubbling, type filtering.
* **Nhiệm vụ 3: Feature Components (TSK-2.19.3)**
  - Phát triển `<oerp-sortable-list>`, `<oerp-drag-palette>`, `<oerp-drop-canvas>`, `<oerp-drop-placeholder>`, `<oerp-sortable-tree>`.
* **Nhiệm vụ 4: Touch, Keyboard & Accessibility (TSK-2.19.4)**
  - Triển khai Pointer Events API, `DndKeyboardService`, ARIA attributes.
  - Test trên iOS Safari, Chrome Android.
* **Nhiệm vụ 5: Animation & Visual Feedback (TSK-2.19.5)**
  - Thiết kế và triển khai ghost template, drop placeholder animation, reorder animation, snap animation.
  - Sử dụng Angular Animations hoặc CSS transitions.
* **Nhiệm vụ 6: Auto-scroll & DndAutoScrollService (TSK-2.19.6)**
  - Phát triển `DndAutoScrollService` hỗ trợ cuộn tự động khi kéo đến rìa container.
* **Nhiệm vụ 7: Storybook & Unit Tests (TSK-2.19.7)**
  - Viết Storybook stories minh họa: sortable list, multi-list transfer, nested DnD, free-form canvas.
  - Unit tests đạt coverage ≥ 75%.

#### 5.2 UI/UX Designer
* Thiết kế ghost/preview style, drop placeholder style, animation timing.
* Đảm bảo visual feedback rõ ràng: drag state, valid drop zone highlight, invalid zone (red border), success snap.

#### 5.3 QA Engineer
* Kiểm thử kéo thả trên Desktop (Chrome, Firefox, Edge, Safari).
* Kiểm thử kéo thả cảm ứng trên iOS (Safari) và Android (Chrome).
* Kiểm thử keyboard DnD (Space → mũi tên → Enter).
* Kiểm thử nested DnD: kéo item vào drop zone con bên trong drop zone cha.
* Kiểm thử type filtering: kéo item sai type vào drop zone → từ chối drop.
* Kiểm thử performance: drag-move event với danh sách >200 items không giật lag.

---

### 6. Hướng dẫn Phát triển (Development Guide)

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
import { OerpDndModule } from '@open-erp/shared-ui/dnd';

@NgModule({
  imports: [OerpDndModule]
})
```

---

### 7. Tiêu chí hoàn thành (Definition of Done - DoD)

- [ ] `oerpDraggable` và `oerpDropZone` hoạt động đúng với multi-list, nested, type filtering.
- [ ] `oerpSortable` hỗ trợ reorder với animation mượt trong list dọc và ngang.
- [ ] `oerp-drag-palette` → `oerp-drop-canvas` (free-form) hoạt động đúng cho Workflow Designer.
- [ ] Touch DnD hoạt động trên iOS Safari và Android Chrome.
- [ ] Keyboard DnD đầy đủ (WCAG 2.1 AA).
- [ ] `DndAutoScrollService` cuộn mượt khi kéo đến rìa container.
- [ ] Animation ghost, placeholder, reorder, snap đẹp mượt.
- [ ] Storybook stories đầy đủ cho mọi scenario.
- [ ] Unit test coverage ≥ 75%.

---

### 8. Trạng thái thực tế & Kết quả bàn giao (Actual Status & Deliverables)
*(Chưa bắt đầu)*
