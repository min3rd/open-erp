# [TASK-448] Tính năng Hoàn tác / Làm lại (Undo / Redo Engine) cho Workflow Designer

| Trường | Giá trị |
| :--- | :--- |
| ID / loại / sprint | TASK-448 / TASK / Sprint 08 |
| Trạng thái / phiên bản / cập nhật | Done / 1.0 / 2026-11-11 |
| Owner | Developer Agent / QA Agent |
| Cha | [FEAT-40](FEAT-40_plugin_workflow_core.md) |
| Đầu vào | Yêu cầu trực tiếp của chủ dự án (2026-11-11): "phần thiết kế quy trình chưa có undo/redo mà" |

---

## 1. Mục tiêu & Yêu cầu kỹ thuật

1. **Bộ máy Undo / Redo Engine cho Workflow Designer Studio**:
   - Lưu trữ snapshot lịch sử mọi đột biến dữ liệu quy trình đồ thị:
     - Thêm bước mới từ palette hoặc nút nối tiếp (`addNode`, `appendConnectedStep`).
     - Xóa bước (`deleteNode`).
     - Di chuyển vị trí nút trên canvas (`onGraphNodeMouseDown`, `moveNode`).
     - Tự động căn chỉnh đồ thị (`autoAlignGraph`).
     - Thêm / xóa liên kết nối (`toggleEdgeBetween`, `removeEdge`).
     - Đổi tên mã bước (`renameNodeId`).
     - Cập nhật thuộc tính bước qua bảng điều khiển cấu hình (`updateNode`).
     - Áp dụng cấu hình JSON trực tiếp (`applySelectedJson`).
   - Cấu trúc snapshot độc lập: `{ nodes: FlowNode[], selectedNodeIndex: number | null, flowKey: string }`.
   - Giới hạn tối đa 50 bản ghi lịch sử (`MAX_HISTORY = 50`), tự động dọn dẹp redo stack khi có thao tác mới.
   - Tự động khởi tạo và xóa lịch sử khi tạo mới hoặc mở quy trình khác (`startCreateFlow`, `editFlow`, `clearHistory`).

2. **Nút bấm thanh công cụ & Phím tắt tiêu chuẩn**:
   - Cặp nút bấm trên thanh công cụ studio với biểu tượng feather-icons:
     - Hoàn tác (`corner-up-left`): Vô hiệu hóa (`disabled`) khi không còn bước hoàn tác; Tooltip: `PLUGIN_WORKFLOW_UNDO (Ctrl+Z)`.
     - Làm lại (`corner-up-right`): Vô hiệu hóa khi không có bước làm lại; Tooltip: `PLUGIN_WORKFLOW_REDO (Ctrl+Y)`.
   - Phím tắt toàn cục `@HostListener('window:keydown')`:
     - `Ctrl+Z` / `Cmd+Z`: Hoàn tác thao tác đồ thị gần nhất.
     - `Ctrl+Y` / `Cmd+Y` hoặc `Ctrl+Shift+Z` / `Cmd+Shift+Z`: Làm lại thao tác vừa hoàn tác.
     - Bỏ qua khi người dùng đang nhập liệu trong thẻ input/textarea để không cướp sự kiện chỉnh sửa văn bản của trình duyệt.

3. **Đa ngôn ngữ i18n & Tuân thủ quy chuẩn**:
   - Bổ sung 2 khóa dịch `PLUGIN_WORKFLOW_UNDO` và `PLUGIN_WORKFLOW_REDO` đồng bộ 100% trên 13 ngôn ngữ.
   - Tuân thủ Rule 23: Không sử dụng native `fetch()`, 100% qua Angular `HttpClient` / `ApiService`.
   - Tuân thủ thiết kế ERP: Mật độ cao, vuông vắn, không tràn layout.

---

## 2. Kết quả kiểm thử thực nghiệm

| Kịch bản | Mong đợi | Trạng thái |
| :--- | :--- | :---: |
| Trạng thái ban đầu | Undo = disabled, Redo = disabled | ✅ PASS |
| Thêm bước quy trình (Add Node) | Undo = enabled, Redo = disabled | ✅ PASS |
| Nhấn nút Undo / `Ctrl+Z` | Bước vừa thêm biến mất, Redo = enabled | ✅ PASS |
| Nhấn nút Redo / `Ctrl+Y` | Bước vừa xóa được phục hồi, Redo = disabled | ✅ PASS |
| Kéo thả vị trí node & Undo | Node quay lại tọa độ x, y trước khi kéo | ✅ PASS |
| Nối cạnh (Edge) & Undo | Cạnh nối bị xóa, Redo phục hồi cạnh nối | ✅ PASS |
| Xóa node & Undo | Node và các liên kết liên quan được phục hồi | ✅ PASS |
| Console errors | 0 lỗi console | ✅ PASS |

