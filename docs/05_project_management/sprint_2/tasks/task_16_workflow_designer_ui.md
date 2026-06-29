# Tài liệu kỹ thuật chi tiết: TSK-2.16 - Giao diện thiết kế Workflow nâng cao (Web)
## Phân hệ: Giao diện Quản trị (Admin Web UI - Sprint 2)

| Trace | ID / Link |
|-------|-----------|
| PRD | [prd.md](../../../01_business/prd.md) §4 Core User Journey |
| URS/SRS | [urs.md](../../../02_user_requirements/urs.md) **US-WF-002** |
| Mockup | [sitemap_and_wireframes.md](../../../02_user_requirements/sitemap_and_wireframes.md) §2.6 |
| Backlog | **US-003** trong [product_backlog.md](../../../05_project_management/product_backlog.md) |
| Phụ thuộc | TSK-2.2 (API), TSK-2.19 (DnD), TSK-2.20 (Canvas) |

---

### 1. Mục tiêu công việc (Objective)
Xây dựng giao diện Web Workflow Designer trực quan sử dụng Canvas, giúp quản trị viên vẽ sơ đồ khối quy trình phê duyệt rẽ nhánh. Trình thiết kế này cho phép thêm node, cấu hình loại node, định nghĩa điều kiện chuyển node từ A sang B, thiết lập chức năng/hành động trong từng node, xử lý rẽ nhánh/đồng thuận, và cung cấp tính năng tự động sắp xếp node (auto-layout) để tối ưu hiển thị sơ đồ quy trình.

Đảm bảo giao diện đồng bộ thương hiệu với gam màu **Rose Gold (`#B76E79`)** và tương thích hoàn toàn chế độ Light/Dark Mode, đa ngôn ngữ qua Angular Transloco.

---

### 2. Thiết kế chi tiết Nghiệp vụ & Kỹ thuật

#### 2.1 Không gian vẽ Canvas & Quản lý các Node sơ đồ
* **Bố cục giao diện (Workflow Workspace):**
  - **Vùng chính (Canvas Workspace):**
    - Bảng vẽ vô hạn (Infinite canvas) hỗ trợ các thao tác Zoom-in, Zoom-out, Pan (kéo canvas) và Grid Snap (hút grid để thẳng hàng).
    - Hỗ trợ tính năng **Tự động sắp xếp node (Auto-arrange nodes / Auto-layout):** Sử dụng các thư viện sắp xếp đồ thị (ví dụ như Dagre engine) để tự động căn chỉnh vị trí các node và đường nối một cách tối ưu, trực quan và dễ nhìn chỉ với 1 click chuột.
  - **Cột trái - Danh sách các loại Node (Node Palette):**
    - **Node Bắt đầu (Start Node):** Điểm khởi đầu quy trình.
    - **Node Các bước duyệt (Step Node):** Nơi xử lý phê duyệt, gán người duyệt, thời hạn và liên kết dynamic form.
    - **Node Điều kiện/Rẽ nhánh (Decision / Branch Node):** Điểm rẽ nhánh luồng dựa trên điều kiện của form dữ liệu.
    - **Node Luồng song song (Fork Node):** Tách một luồng chính thành nhiều luồng duyệt chạy song song.
    - **Node Gộp luồng (Join Node):** Hội tụ các luồng song song lại thành một luồng duy nhất kèm cấu hình điều kiện gộp (`joinRules`).
    - **Node Kết thúc (End Node):** Kết thúc quy trình.
  - **Cột phải - Bảng cấu hình thuộc tính Node (Node Configuration Panel):**
    - Cấu hình chung: Tên node, mô tả.
    - Cấu hình chức năng/hành động trong Node (Node Functions): Định nghĩa các chức năng mà node đó thực hiện (ví dụ: gửi thông báo, tự động cập nhật trạng thái dữ liệu, gọi Webhook, sinh văn bản mẫu DOCX/PDF thông qua OnlyOffice).
    - Cấu hình kết quả hành động (Action Outcomes & Routing): Thiết lập kết quả của mỗi chức năng sẽ thực hiện gì hoặc chuyển tiếp sang node tiếp theo nào (ví dụ: nếu Approved -> Chuyển sang Node Step 2; nếu Rejected -> Quay lại Node Start; nếu Request Info -> Chuyển sang Node bổ sung thông tin).
    - Quy tắc đồng thuận (Consensus Rules): Áp dụng cho Step Node (ALL, ANY, Threshold %).
    - Cấu hình Phân quyền & Người nhận yêu cầu (Assignee & Fallback Configuration):
      - Đơn vị/Phòng ban xử lý (Department/Unit): Cho phép chọn một hoặc nhiều phòng ban trong hệ thống sẽ xử lý nhiệm vụ.
      - Danh sách người nhận yêu cầu (List of Users): Cho phép chọn trực tiếp một danh sách nhiều người dùng xử lý cụ thể.
      - Người mặc định nhận yêu cầu (Fallback Assignee): Cấu hình người nhận mặc định khi không tìm thấy ai xử lý hoặc phòng ban trống (chọn User cụ thể hoặc Vai trò hệ thống).
    - Liên kết biểu mẫu (Dynamic Form Binding): Chọn form động đã tạo từ Form Builder để nhúng vào bước duyệt này.

#### 2.2 Kết nối giữa các Node (Edges) & Cấu hình điều kiện chuyển node
- Cho phép người dùng nối dây (Edges) giữa các cổng ra/vào của Node để thiết lập luồng đi.
- **Cấu hình điều kiện chuyển tiếp (Routing Conditions):**
  - Khi nhấp vào một Edge hoặc cổng ra của Node Decision, bảng cấu hình thuộc tính sẽ hiển thị bộ thiết lập điều kiện chuyển node.
  - Cho phép định nghĩa điều kiện dựa trên dữ liệu của Form động (ví dụ: *Giá trị đề xuất từ Form động > 50,000,000 VND -> Đi theo nhánh phê duyệt của Giám đốc tài chính*; *Ngược lại -> Đi theo nhánh phê duyệt của Trưởng phòng*).
  - Hỗ trợ xây dựng biểu thức điều kiện logical phức tạp (AND, OR).

---

### 3. Phân chia công việc chi tiết cho các thành viên

#### 3.1 Backend Engineer (BE)
* *Không thuộc phạm vi trực tiếp (đã chuẩn bị các APIs cấu hình quy trình rẽ nhánh ở TSK-2.2).*

#### 3.2 Web Frontend Engineer (FE Web)
* **Nhiệm vụ 1: Xây dựng Canvas vẽ sơ đồ quy trình & Auto-layout (TSK-2.16.1)**
  - Tích hợp thư viện vẽ sơ đồ (ví dụ: `ngx-graph`, `Rete.js`, hoặc thư viện SVG tùy biến) để dựng không gian vẽ canvas.
  - Hỗ trợ các tính năng cơ bản: Zoom, Pan, Drag Node, Snap-to-grid.
  - Tích hợp thư viện đồ thị (như Dagre) để phát triển tính năng tự động sắp xếp node (Auto-arrange nodes) khi người dùng bấm nút tối ưu hóa sơ đồ.
* **Nhiệm vụ 2: Thiết kế các loại Node & Edges (TSK-2.16.2)**
  - Xây dựng component trực quan cho từng loại Node (Start, Step, Decision, Fork, Join, End) với màu sắc và biểu tượng nhận diện rõ ràng.
  - Phát triển tính năng vẽ đường nối (Edges) nối các node với nhau, hiển thị hướng mũi tên chỉ luồng di chuyển.
* **Nhiệm vụ 3: Xây dựng Bảng cấu hình thuộc tính Node & Chức năng hành động (TSK-2.16.3)**
  - Phát triển panel bên phải để cấu hình thuộc tính của node được chọn.
  - Cho phép liên kết Form động (gọi danh sách form động từ API của TSK-2.3).
  - Thiết lập cấu hình hành động trong node (Node Functions) và cấu hình điều hướng dựa trên kết quả của hành động (Action Outcomes Routing).
  - Cấu hình quy tắc đồng thuận (ALL, ANY, Threshold %).
  - Phát triển các control lựa chọn nâng cao: Bộ chọn Phòng ban/Đơn vị (Department Selector), Bộ chọn danh sách Người dùng (User Multi-selector) và Bộ chọn Người nhận mặc định (Fallback Assignee Selector).
* **Nhiệm vụ 4: Cấu hình điều kiện chuyển node và rẽ nhánh (TSK-2.16.4)**
  - Phát triển giao diện cấu hình điều kiện chuyển node khi nhấp vào Edge hoặc Decision Node.
  - Trích xuất schema của form động đã liên kết ở bước trước để cung cấp gợi ý chọn trường thông tin làm điều kiện rẽ nhánh.
* **Nhiệm vụ 5: Bộ sinh/phân tích đồ thị Workflow JSON (TSK-2.16.5)**
  - Viết bộ parser để chuyển đổi toàn bộ sơ đồ đồ thị trực quan (tọa độ các Node, các kết nối Edges, cấu hình điều kiện và hành động) thành định dạng JSON Graph tương thích với API Workflow của TSK-2.2.
  - Hỗ trợ import ngược JSON Graph từ cơ sở dữ liệu để vẽ lại sơ đồ nguyên vẹn khi người dùng mở lại quy trình để chỉnh sửa.

#### 3.3 Mobile Frontend Engineer (FE Mobile)
* *Không thuộc phạm vi task này (giao diện vẽ canvas phức tạp chỉ được hiển thị trên Web admin).*

#### 3.4 UI/UX Designer
* Thiết kế chi tiết giao diện làm việc của Workflow Canvas bao gồm các Node mẫu, đường kết nối Edges, panel cấu hình bên phải, bộ công cụ Zoom/Pan/Auto-arrange và giao diện cấu hình điều kiện rẽ nhánh trực quan.
* Đảm bảo theme màu nhấn Rose Gold cho các node active, hover và đường nối được highlight.

#### 3.5 QA Engineer
* Viết kịch bản kiểm thử:
  - Tạo quy trình mới -> Kéo thả Start, Step, Decision, End nodes -> Vẽ nối dây thành công.
  - Cấu hình chức năng hành động trong Node và gán kết quả chuyển node -> Lưu và load lại -> Đảm bảo đồ thị tải lại toàn vẹn.
  - Cấu hình gán việc cho phòng ban, danh sách người dùng cùng với người nhận mặc định (Fallback Assignee) -> Đảm bảo lưu đúng cấu hình JSON.
  - Kiểm thử tính năng tự động sắp xếp node -> Đảm bảo các node tự căn chỉnh thẳng hàng, không đè lên nhau, đường nối không bị rối.
  - Thiết lập điều kiện rẽ nhánh dựa trên giá trị form -> Lưu cấu hình -> Đảm bảo payload gửi đi chứa đúng định dạng điều kiện.

---

### 4. Hướng dẫn Phát triển & Gỡ lỗi cục bộ (Local Development)
* Khởi chạy Web Client trong thư mục `open-erp-web`:
  ```bash
  npm run start
  ```
* Bật Console và Debugger để theo dõi quá trình parse Graph Nodes & Edges sang JSON Schema.

---

### 5. Tiêu chí hoàn thành (Definition of Done - DoD)
* Vẽ được sơ đồ quy trình hoàn chỉnh trên Canvas một cách mượt mà.
* Hỗ trợ tính năng tự động sắp xếp (auto-arrange) các node cân đối và dễ nhìn.
* Cho phép cấu hình đầy đủ loại node, rẽ nhánh, điều kiện chuyển node, chức năng trong node, kết quả hành động và liên kết form động.
* Hỗ trợ cấu hình gán việc nâng cao theo phòng ban, danh sách người dùng và thiết lập người mặc định nhận yêu cầu (fallback assignee).
* Parse đồ thị trực quan sang JSON tương thích 100% với API ở Backend và ngược lại.
* Tích hợp màu nhấn Rose Gold và hỗ trợ Light/Dark mode, đa ngôn ngữ đầy đủ.

---

### 6. Trạng thái thực tế & Kết quả bàn giao (Actual Status & Deliverables)
*(Chưa bắt đầu)*
