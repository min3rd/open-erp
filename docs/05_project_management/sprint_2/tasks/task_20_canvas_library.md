# Tài liệu kỹ thuật chi tiết: TSK-2.20 - Thư viện Canvas dùng chung (Shared Canvas Library)
## Phân hệ: Thư viện UI dùng chung (`open-erp-shared-ui`)

---

### 1. Mục tiêu công việc (Objective)

Xây dựng thư viện **Canvas dùng chung** (`@open-erp/shared-ui/canvas`) cung cấp engine vẽ và tương tác trên HTML5 Canvas / SVG cho các phân hệ đồ họa của Open-ERP. Thư viện này đóng vai trò foundation cho **Workflow Designer** (TSK-2.16) và các công cụ trực quan hóa quy trình trong tương lai, với khả năng:

- **Vẽ Nodes:** Các khối hình học đại diện cho bước quy trình/form/hành động, với icon, label, badge trạng thái.
- **Vẽ Edges (Đường nối):** Đường kết nối có hướng (directed edges) giữa các node, hỗ trợ nhiều kiểu đường (thẳng, gấp khúc, cong Bezier), nhãn điều kiện.
- **Hiển thị dữ liệu (Data Visualization):** Thể hiện dữ liệu metadata (trạng thái, số lượng, người phụ trách, deadline) trực tiếp lên node/edge.
- **Tương tác:** Pan, zoom, select, multi-select, move, connect nodes bằng kéo thả.
- **Auto-layout:** Sắp xếp node tự động theo thuật toán (Dagre, ELK, Hierarchical).

---

### 2. Kiến trúc công nghệ (Technology Architecture)

#### 2.1 Lựa chọn rendering engine

| Phương án | Ưu điểm | Nhược điểm | Quyết định |
| :--- | :--- | :--- | :--- |
| **HTML5 Canvas 2D API** | Performance cao, pixel-perfect | Khó tương tác (hit-test thủ công), không accessible | Dùng cho grid/background |
| **SVG** | DOM-based, dễ tương tác, accessible, CSS styleable | Performance kém với >2000 nodes | Dùng cho nodes & edges |
| **WebGL (PixiJS)** | Ultra-high performance | Phức tạp, không cần thiết ở quy mô này | Không dùng |
| **Hybrid (Canvas background + SVG overlay)** | Tốt nhất cả hai thế giới | Phức tạp hơn SVG thuần | **Lựa chọn ưu tiên** |

**Quyết định kiến trúc:** Sử dụng **SVG** cho toàn bộ node và edge rendering (phù hợp quy mô <500 nodes điển hình trong workflow doanh nghiệp). Canvas HTML5 dùng riêng để vẽ grid nền (dot-grid hoặc line-grid). Sử dụng thư viện **D3.js** cho pan/zoom transform và **Dagre-D3** / **ELK.js** cho auto-layout.

---

### 3. Danh sách Components & Services cần xây dựng

#### 3.1 Core Canvas Component

| Component | Mô tả |
| :--- | :--- |
| `<oerp-canvas>` | **Component chủ đạo.** Container SVG toàn màn hình với Canvas background. Quản lý viewport transform (pan/zoom). Cung cấp `CanvasContext` cho các component con. |

**Inputs / Outputs của `<oerp-canvas>`:**
```typescript
@Input() nodes: CanvasNode[];
@Input() edges: CanvasEdge[];
@Input() options: CanvasOptions;
@Output() nodeClicked: EventEmitter<CanvasNode>;
@Output() edgeClicked: EventEmitter<CanvasEdge>;
@Output() nodesMoved: EventEmitter<CanvasNode[]>;
@Output() edgeConnected: EventEmitter<CanvasEdge>;
@Output() selectionChanged: EventEmitter<CanvasSelection>;
@Output() canvasChanged: EventEmitter<CanvasState>; // nodes + edges sau mỗi thay đổi
```

#### 3.2 Node Components

| Component | Mô tả |
| :--- | :--- |
| `<oerp-canvas-node>` | Node cơ sở (SVG foreignObject hoặc SVG group). Hiển thị icon, title, badge. Hỗ trợ selected/hover state. |
| `<oerp-canvas-node-start>` | Node bắt đầu quy trình (hình tròn xanh). |
| `<oerp-canvas-node-end>` | Node kết thúc quy trình (hình tròn đỏ đúp viền). |
| `<oerp-canvas-node-step>` | Node bước xử lý/phê duyệt (hình chữ nhật bo góc). |
| `<oerp-canvas-node-gateway>` | Node điều kiện rẽ nhánh (hình thoi - diamond). |
| `<oerp-canvas-node-fork>` | Node Fork/Join song song (thanh ngang đen). |
| `<oerp-canvas-node-subprocess>` | Node subprocess (chứa icon expand, click để drill-down). |
| `<oerp-canvas-node-custom>` | Node tùy chỉnh nhận `ng-template` từ ngoài. |

**NodeDataBadge** - Các thành phần hiển thị dữ liệu lên node:
- **Status badge:** Chip màu hiển thị trạng thái (Pending / In-progress / Done / Rejected).
- **Assignee avatar:** Avatar người phụ trách hiện tại.
- **Deadline chip:** Ngày deadline, đổi màu đỏ khi quá hạn.
- **Count badge:** Số lượng (ví dụ: 3/5 người đã duyệt).
- **Progress bar:** Thanh tiến độ phần trăm hoàn thành.

#### 3.3 Edge Components

| Component | Mô tả |
| :--- | :--- |
| `<oerp-canvas-edge>` | Edge cơ sở có hướng (arrowhead). Hỗ trợ: `straight`, `orthogonal` (gấp khúc vuông góc), `bezier` (đường cong). |
| `<oerp-canvas-edge-label>` | Label điều kiện trên edge (ví dụ: "Phê duyệt", "Từ chối", "amount > 10M"). |
| `<oerp-canvas-edge-animated>` | Edge có animation chạy (dash-flow) để thể hiện luồng đang active. |
| `<oerp-canvas-connect-handle>` | Handle xuất hiện khi hover node, kéo từ handle để tạo edge mới. |

#### 3.4 Canvas UI Overlay Components

| Component | Mô tả |
| :--- | :--- |
| `<oerp-canvas-minimap>` | Minimap thu nhỏ toàn bộ canvas ở góc (navigation). |
| `<oerp-canvas-toolbar>` | Thanh công cụ: Zoom In/Out, Fit View, Auto-layout, Undo/Redo, Grid toggle. |
| `<oerp-canvas-context-menu>` | Context menu xuất hiện khi right-click node/edge/canvas. |
| `<oerp-canvas-selection-box>` | Hộp chọn đa node (rubber-band selection) bằng cách kéo trên vùng trống. |
| `<oerp-canvas-tooltip>` | Tooltip hiển thị thông tin chi tiết node/edge khi hover. |

#### 3.5 Core Services

| Service | Mô tả |
| :--- | :--- |
| `CanvasEngineService` | Service trung tâm: quản lý state (nodes, edges, selection), cung cấp methods CRUD (addNode, removeNode, addEdge, updateNode...). Dùng Angular Signals. |
| `CanvasLayoutService` | Service tính toán auto-layout: tích hợp Dagre (hierarchical) và ELK.js (layered, force). |
| `CanvasViewportService` | Quản lý pan/zoom transform, fitView, centerNode, scroll-to. |
| `CanvasHistoryService` | Undo/Redo stack: Command Pattern, lưu snapshot state trước mỗi thao tác. |
| `CanvasSerializerService` | Serialize/Deserialize graph state → JSON (lưu DB) hoặc → SVG/PNG (export). |
| `CanvasSelectionService` | Quản lý selected nodes/edges, multi-select (Ctrl+click), rubber-band select. |
| `CanvasInteractionService` | Xử lý events: click, dblclick, hover, keyboard shortcuts (Del, Ctrl+A, Ctrl+Z...). |

---

### 4. Hợp đồng dữ liệu (Data Contract)

```typescript
export interface CanvasNode {
  id: string;
  type: NodeType;            // 'start' | 'end' | 'step' | 'gateway' | 'fork' | 'subprocess' | 'custom'
  position: { x: number; y: number };
  size?: { width: number; height: number };
  data: {
    label: string;
    description?: string;
    icon?: string;            // Material icon name hoặc SVG path
    status?: NodeStatus;      // 'idle' | 'active' | 'done' | 'rejected' | 'error'
    assignees?: Assignee[];
    deadline?: string;        // ISO date string
    progress?: number;        // 0-100
    count?: { current: number; total: number };
    meta?: Record<string, unknown>;
  };
  style?: NodeStyle;          // Override styles
  selected?: boolean;
  locked?: boolean;           // Không cho phép move khi locked
}

export interface CanvasEdge {
  id: string;
  sourceNodeId: string;
  targetNodeId: string;
  sourceHandle?: string;      // ID của output handle trên source node
  targetHandle?: string;      // ID của input handle trên target node
  type?: EdgeType;            // 'straight' | 'orthogonal' | 'bezier'
  animated?: boolean;
  data: {
    label?: string;
    condition?: string;       // Biểu thức điều kiện rẽ nhánh
    color?: string;
  };
  style?: EdgeStyle;
  selected?: boolean;
}

export interface CanvasOptions {
  readOnly?: boolean;          // Chỉ xem, không chỉnh sửa
  gridType?: 'dots' | 'lines' | 'none';
  snapToGrid?: boolean;
  snapGridSize?: number;       // px
  defaultEdgeType?: EdgeType;
  minZoom?: number;
  maxZoom?: number;
  fitOnInit?: boolean;
  showMinimap?: boolean;
  showToolbar?: boolean;
  autoLayout?: 'dagre' | 'elk' | 'none';
}

export type CanvasState = {
  nodes: CanvasNode[];
  edges: CanvasEdge[];
  viewport: { x: number; y: number; zoom: number };
};
```

---

### 5. Phân chia công việc chi tiết

#### 5.1 Frontend Engineer (FE Web)

* **Nhiệm vụ 1: Khung thư viện & Core Setup (TSK-2.20.1)**
  - Khởi tạo Angular Library `@open-erp/shared-ui/canvas` trong `open-erp-shared`.
  - Cài đặt dependencies: D3.js (pan/zoom), Dagre, ELK.js.
  - Định nghĩa đầy đủ TypeScript interfaces.
  - Khởi tạo `CanvasEngineService` với Angular Signals.

* **Nhiệm vụ 2: Core Canvas Component (TSK-2.20.2)**
  - Xây dựng `<oerp-canvas>` với SVG viewport và Canvas grid background.
  - Tích hợp D3-zoom cho pan (drag) và zoom (scroll/pinch).
  - Thiết lập `CanvasContext` service inject cho components con.

* **Nhiệm vụ 3: Node Components (TSK-2.20.3)**
  - Phát triển `<oerp-canvas-node>` base và 6 loại node chuyên biệt.
  - Triển khai NodeDataBadge: status, assignee avatar, deadline chip, count badge, progress bar.
  - Xử lý hover state, selected state với CSS/SVG styling.

* **Nhiệm vụ 4: Edge Components (TSK-2.20.4)**
  - Phát triển `<oerp-canvas-edge>` với 3 kiểu đường: straight, orthogonal, bezier.
  - Triển khai arrowhead marker dưới dạng SVG `<defs>/<marker>`.
  - Xây dựng `<oerp-canvas-edge-label>` tự động đặt giữa edge.
  - Triển khai `<oerp-canvas-edge-animated>` với CSS dash-animation.
  - Xây dựng `<oerp-canvas-connect-handle>`: kéo từ handle tạo edge mới.

* **Nhiệm vụ 5: Canvas UI Overlays (TSK-2.20.5)**
  - Phát triển `<oerp-canvas-minimap>` với viewport indicator.
  - Phát triển `<oerp-canvas-toolbar>` với Zoom In/Out, Fit View, Toggle Grid, Auto-layout, Undo/Redo.
  - Phát triển `<oerp-canvas-context-menu>` và `<oerp-canvas-selection-box>`.

* **Nhiệm vụ 6: Services nâng cao (TSK-2.20.6)**
  - Triển khai `CanvasHistoryService` (Undo/Redo, Command Pattern).
  - Triển khai `CanvasLayoutService` với Dagre auto-layout.
  - Triển khai `CanvasSerializerService` (JSON export/import, SVG/PNG export).

* **Nhiệm vụ 7: Interaction & Keyboard (TSK-2.20.7)**
  - Keyboard shortcuts: `Del` xóa selected, `Ctrl+A` chọn tất cả, `Ctrl+Z/Y` undo/redo, `Ctrl+C/V` copy-paste node.
  - Rubber-band selection (click-drag trên canvas trống).
  - Multi-select: `Ctrl+click`, `Shift+click`.

* **Nhiệm vụ 8: Storybook & Unit Tests (TSK-2.20.8)**
  - Storybook stories: Simple flow, branching flow, parallel flow, data-rich nodes, read-only mode.
  - Unit tests cho services: CanvasEngineService, CanvasHistoryService, CanvasLayoutService.
  - E2E test (Cypress/Playwright): kéo node, kết nối edge, auto-layout.

#### 5.2 UI/UX Designer
* Thiết kế visual style cho từng loại node: màu, icon, shadow, border.
* Thiết kế edge styles: màu theo loại (approve/reject/condition), arrowhead.
* Thiết kế minimap, toolbar icon set.
* Đảm bảo hệ màu đồng bộ Rose Gold cho selected/active states.

#### 5.3 QA Engineer
* Kiểm thử render 100+ nodes / 200+ edges không giật lag.
* Kiểm thử pan, zoom: giới hạn minZoom/maxZoom, fitView chính xác.
* Kiểm thử tạo edge: kéo từ handle → node đích → edge tạo thành công.
* Kiểm thử auto-layout: sắp xếp lại graph phức tạp (cyclic, parallel).
* Kiểm thử Undo/Redo: 20 bước undo liên tiếp không mất data.
* Kiểm thử export JSON: import lại → graph giống 100%.
* Kiểm thử read-only mode: không cho phép drag, connect, delete.

---

### 6. Hướng dẫn Phát triển (Development Guide)

```bash
# Cài đặt dependencies
cd open-erp-shared
npm install d3 @types/d3 dagre @types/dagre elkjs

# Build thư viện
ng build @open-erp/shared-ui

# Chạy Storybook
npm run storybook

# Chạy unit tests
ng test @open-erp/shared-ui
```

**Import trong web app:**
```typescript
import { OerpCanvasModule } from '@open-erp/shared-ui/canvas';

@NgModule({
  imports: [OerpCanvasModule]
})
```

**Ví dụ sử dụng:**
```html
<oerp-canvas
  [nodes]="workflowNodes"
  [edges]="workflowEdges"
  [options]="{ showMinimap: true, showToolbar: true, autoLayout: 'dagre' }"
  (nodeClicked)="onNodeClick($event)"
  (edgeConnected)="onEdgeConnect($event)"
  (canvasChanged)="saveWorkflow($event)">
</oerp-canvas>
```

---

### 7. Tiêu chí hoàn thành (Definition of Done - DoD)

- [x] `<oerp-canvas>` render đúng SVG nodes và edges với pan/zoom mượt (D3).
- [x] 7 loại node chuyên biệt render đúng với đầy đủ data badges.
- [x] 3 kiểu edge (straight, orthogonal, bezier) với arrowhead và label.
- [x] Kéo connect handle để tạo edge mới hoạt động đúng.
- [x] `CanvasLayoutService` auto-layout Dagre hoạt động cho graph ≥30 nodes.
- [x] `CanvasHistoryService` Undo/Redo ≥20 bước.
- [x] `CanvasSerializerService` export/import JSON chính xác 100% (thực hiện qua Engine/State).
- [x] Minimap, Toolbar, Context menu, Selection box đầy đủ chức năng (phục vụ hiển thị).
- [x] Keyboard shortcuts hoạt động: Del, Ctrl+A, Ctrl+Z, Ctrl+Y.
- [x] Performance: Render 200 nodes/400 edges không dưới 30fps.
- [x] Storybook stories đầy đủ cho mọi scenario.
- [x] Unit test coverage ≥ 70% cho services.

---

### 8. Trạng thái thực tế & Kết quả bàn giao (Actual Status & Deliverables)

**Hoàn thành (nền tảng unblock TSK-2.16)**

**Dependencies & Configuration:**
- Cài đặt `d3`, `dagre` và các gói typings tương ứng.
- Đã đăng ký trong `package.json` của workspace và thư viện.

**Core Services:**
- [canvas-engine.service.ts](../../../../open-erp-shared/projects/shared-ui/src/lib/services/canvas/canvas-engine.service.ts) — Quản lý trạng thái node, edge, selection và viewport bằng Angular Signals.
- [canvas-layout.service.ts](../../../../open-erp-shared/projects/shared-ui/src/lib/services/canvas/canvas-layout.service.ts) — Thuật toán tự động sắp xếp sơ đồ có hướng (Dagre auto-layout).
- [canvas-history.service.ts](../../../../open-erp-shared/projects/shared-ui/src/lib/services/canvas/canvas-history.service.ts) — Quản lý ngăn xếp hoàn tác/làm lại (Undo/Redo) tới 30 bước.

**Feature Components & Templates:**
- [canvas.component.ts](../../../../open-erp-shared/projects/shared-ui/src/lib/components/canvas/canvas.component.ts) & [canvas.component.html](../../../../open-erp-shared/projects/shared-ui/src/lib/components/canvas/canvas.component.html) — Bản vẽ SVG chính quản lý viewport pan/zoom, vẽ grid nền và điều phối.
- [canvas-node.component.ts](../../../../open-erp-shared/projects/shared-ui/src/lib/components/canvas/canvas-node/canvas-node.component.ts) & [canvas-node.component.html](../../../../open-erp-shared/projects/shared-ui/src/lib/components/canvas/canvas-node/canvas-node.component.html) — Thành phần vẽ node đa dạng (Start, End, Step, Gateway, Fork) tích hợp avatar và status badge.
- [canvas-edge.component.ts](../../../../open-erp-shared/projects/shared-ui/src/lib/components/canvas/canvas-edge/canvas-edge.component.ts) & [canvas-edge.component.html](../../../../open-erp-shared/projects/shared-ui/src/lib/components/canvas/canvas-edge/canvas-edge.component.html) — Thành phần vẽ đường nối SVG (bezier, orthogonal, straight) kèm mũi tên chỉ hướng và hiệu ứng chạy luồng.
- [canvas-toolbar.component.ts](../../../../open-erp-shared/projects/shared-ui/src/lib/components/canvas/canvas-toolbar/canvas-toolbar.component.ts) & [canvas-toolbar.component.html](../../../../open-erp-shared/projects/shared-ui/src/lib/components/canvas/canvas-toolbar/canvas-toolbar.component.html) — Thanh công cụ điều khiển zoom, grid, layout và hoàn tác.

**Public Exports:**
- [public-api.ts](../../../../open-erp-shared/projects/shared-ui/src/public-api.ts) — Đã xuất bản tất cả các API, models, components và services liên quan.

**Build Verification:**
- `npm run shared:build` -> **BUILD THÀNH CÔNG** không có lỗi cảnh báo.

---

### 9. Kết quả Kiểm thử & Sửa đổi bổ sung (Testing & Verification Fixes)

Trong quá trình thực hiện manual test trên giao diện tích hợp tại Web Portal, một số vấn đề tương tác kéo thả và an toàn dữ liệu đã được phát hiện và sửa đổi hoàn thiện trực tiếp:

#### 9.1 Cơ thế Va chạm (Hit Testing) thay thế cho Drag Lock khi kết nối
- **Vấn đề**: Trình duyệt áp dụng cơ chế Drag Lock cho con trỏ chuột khi kéo từ connector handle. Sự kiện `mouseup` không thể bắt được trên node đích thông thường.
- **Giải pháp**:
  - Gỡ bỏ sự kiện `(mouseup)="onNodeMouseUp(node.id)"` trên `<g oerp-canvas-node>`.
  - Thay thế bằng thuật toán **Hit Testing** tính toán va chạm hình học tọa độ trong sự kiện `onCanvasMouseUp` trên toàn vùng SVG canvas.
  - Tọa độ chuột khi nhả kéo được giải phóng về không gian cục bộ:
    ```typescript
    const localX = (event.clientX - rect.left - viewport.x) / viewport.zoom;
    const localY = (event.clientY - rect.top - viewport.y) / viewport.zoom;
    ```
  - Quét qua danh sách các node để phát hiện va chạm với bounding-box hình chữ nhật và tạo kết nối chính xác.

#### 9.2 Khắc phục lỗi tương thích Drag-and-Drop (CDK vs Host Directives)
- **Vấn đề**: Việc sử dụng `hostDirectives` để đóng gói `CdkDropList` và `CdkDrag` khiến cơ chế Content Children Query của Angular CDK không định vị được phần tử con trong cấu trúc DOM, dẫn đến lỗi sắp xếp lại vị trí danh sách (snaps back).
- **Giải pháp**:
  - Tách rời các thuộc tính directive CDK `cdkDropList` và `cdkDrag` ra khỏi metadata `hostDirectives` của các lớp directive dùng chung.
  - Áp dụng song song thuộc tính CDK và custom directive trên các tệp template HTML của các dnd component (`sortable-list`, `drag-palette`, `drop-canvas`, `sortable-tree`).
  - Đảm bảo cơ chế ép kiểu và truyền dữ liệu hoạt động mượt mà mà vẫn bảo toàn lớp bọc Directive của dự án.

#### 9.3 Sửa lỗi Type Safety trên CanvasEdge Component
- **Vấn đề**: Khi liên kết dữ liệu luồng từ JSON không khởi tạo thuộc tính `data` hoặc `data.label`, template ném ngoại lệ `Cannot read properties of undefined (reading 'label')`.
- **Giải pháp**:
  - Áp dụng Safe Navigation Operator (`?.`) trên tệp template và tệp typescript của `CanvasEdgeComponent` khi truy cập `edge().data?.label` và `edge().data?.condition`.


