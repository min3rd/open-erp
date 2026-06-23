# Tài liệu kỹ thuật chi tiết: TSK-2.10 - Giao diện thiết lập Form động nâng cao (Web)
## Phân hệ: Giao diện Quản trị (Admin Web UI - Sprint 2)

---

### 1. Mục tiêu công việc (Objective)
Xây dựng giao diện Web Dynamic Form Builder cao cấp giúp quản trị viên tự thiết kế, phân bố cục (layout) và định nghĩa các quy tắc ràng buộc/logic của các biểu mẫu động. Trình thiết kế form này cần hỗ trợ cả kéo thả (drag-and-drop) lẫn các nút chức năng để thao tác vị trí linh hoạt, định nghĩa layout đa thiết bị, thiết lập điều kiện động (ẩn/hiện, cập nhật giá trị cascading, công thức tính toán), và hỗ trợ các trường dữ liệu liên kết danh mục hệ thống hoặc gọi API ngoài.

Đảm bảo giao diện đồng bộ thương hiệu với gam màu **Rose Gold (`#B76E79`)** và tương thích hoàn toàn chế độ Light/Dark Mode, đa ngôn ngữ qua Angular Transloco.

---

### 2. Thiết kế chi tiết Nghiệp vụ & Kỹ thuật

#### 2.1 Cấu trúc màn hình Form Builder & Layout động
* **Bố cục giao diện (Layout Builder):**
  - **Cột trái - Bảng linh kiện (Field & Layout Palette):**
    - Nhóm 1: Bố cục & Layout (Container, Row, Grid Column, Panel/Tab, Accordion, Card).
    - Nhóm 2: Các trường nhập liệu cơ bản (Text, Area, Number, Date, Checkbox, Select, File).
    - Nhóm 3: Trường liên kết hệ thống & API (System Catalog Dropdown, API Select).
  - **Vùng trung tâm - Canvas thiết kế (Layout Workspace):**
    - Hiển thị trực quan cấu trúc grid layout của form.
    - Hỗ trợ đổi cấu trúc cột động (ví dụ: chia dòng thành 1, 2, 3 hoặc 4 cột; tỷ lệ 25%, 50%, 75%, 100%).
    - Hỗ trợ kéo thả (drag-and-drop) linh kiện vào canvas và sắp xếp vị trí giữa các dòng/cột.
    - Ngoài kéo thả, phải tích hợp các **nút điều hướng nhanh** (Di chuyển lên, xuống, sang trái, sang phải, xóa, cấu hình) tại mỗi linh kiện/layout để phục vụ người dùng thích sử dụng bàn phím/chuột mà không cần kéo thả.
    - Hỗ trợ chế độ xem trước (Preview) mô phỏng hiển thị trên các thiết bị: Desktop, Tablet, Mobile (Responsive Grid).
  - **Cột phải - Bảng thuộc tính chi tiết (Properties Panel):**
    - Tab 1: Thuộc tính cơ bản (Label, Variable Name, Placeholder, Default Value, Required, Read-only).
    - Tab 2: Thiết lập Layout (Width on Desktop/Tablet/Mobile, Margin, Padding, border).
    - Tab 3: Ràng buộc & Cấu hình dữ liệu (Validate RegEx, Min/Max length, định nghĩa nguồn dữ liệu API).

#### 2.2 Cơ chế logic điều kiện form động (Form Conditional Logic Engine)
Để đáp ứng tính mềm dẻo, trình thiết kế cần cung cấp bộ cấu hình quy tắc (Rule Designer) cho phép định nghĩa:
1. **Điều kiện Ẩn/Hiện (Visibility Logic):**
   - Định nghĩa: *Nếu [Trường A] [Bằng/Khác/Lớn hơn/...] [Giá trị X] Thì [Ẩn/Hiện] [Trường B hoặc Panel C]*.
2. **Cập nhật giá trị phụ thuộc (Cascading / Dependent Update):**
   - Định nghĩa: Khi giá trị của Trường A thay đổi, hệ thống tự động gọi API hoặc cập nhật dữ liệu của Trường B.
   - Ví dụ tiêu biểu: Chọn Quốc gia (Trường A) -> Gọi API lấy danh sách Tỉnh/Thành thuộc Quốc gia đó -> Tự động điền dữ liệu và reset giá trị ở trường Tỉnh/Thành (Trường B).
3. **Công thức tính toán tự động (Calculated Fields):**
   - Cho phép định nghĩa biểu thức toán học cơ bản giữa các trường số (ví dụ: `Thành tiền = Số lượng * Đơn giá`).
4. **Thay đổi tính chất trường (Dynamic Properties):**
   - Thay đổi trạng thái Bắt buộc nhập (Required) hoặc Chỉ đọc (Read-only) của Trường B dựa trên giá trị của Trường A.

#### 2.3 Liên kết dữ liệu Danh mục hệ thống & API động (System Catalog & API binding)
- **Danh mục hệ thống (System Catalogs):**
  - Cung cấp sẵn các loại trường liên kết nhanh với các bảng dữ liệu danh mục có sẵn trong Open-ERP: Danh sách Nhân viên (Employees), Phòng ban (Departments), Dự án (Projects), Khách hàng (Customers).
- **API ngoài/API động (Dynamic APIs):**
  - Cho phép người dùng nhập URL API nguồn (ví dụ: `/api/v1/catalogs/locations`).
  - Hỗ trợ cấu hình Query Parameters và Request Headers. Đặc biệt, Query Parameters có thể truyền động giá trị của trường khác làm tham số (ví dụ: `/api/v1/cities?countryCode={{country}}`).
  - Cấu hình mapping kết quả: Định nghĩa key nào trong JSON trả về sẽ làm hiển thị (Label) và key nào làm giá trị (Value) (ví dụ: `labelKey: 'cityName'`, `valueKey: 'cityCode'`).

---

### 3. Phân chia công việc chi tiết cho các thành viên

#### 3.1 Backend Engineer (BE)
* *Không thuộc phạm vi trực tiếp (đã chuẩn bị các APIs quản lý vòng đời form động ở TSK-2.3).*

#### 3.2 Web Frontend Engineer (FE Web)
* **Nhiệm vụ 1: Phát triển UI Layout Designer & Trực quan hóa Grid Responsive (TSK-2.10.1)**
  - Xây dựng canvas hiển thị layout chia dòng, cột động theo tỷ lệ lưới (12-column grid).
  - Tích hợp tính năng preview trực quan trên Desktop, Tablet, Mobile bằng cách thay đổi độ rộng viewport của canvas.
  - Cho phép thiết lập ẩn/hiện hoặc điều chỉnh độ rộng linh hoạt của panel/linh kiện theo từng breakpoint thiết bị.
* **Nhiệm vụ 2: Phát triển Cơ chế kéo thả kết hợp Button-based di chuyển (TSK-2.10.2)**
  - Tích hợp thư viện `@angular/cdk/drag-drop` để hỗ trợ kéo thả linh kiện từ cột trái vào dòng/cột trên canvas và sắp xếp vị trí (reorder/sort).
  - Phát triển bộ nút chức năng điều khiển nhanh trên từng Node/Field (Move Up, Move Down, Move Left, Move Right, Delete, Edit properties) để hỗ trợ thao tác không cần kéo thả.
* **Nhiệm vụ 3: Tích hợp Trường Danh mục hệ thống & Dynamic API dropdown (TSK-2.10.3)**
  - Phát triển component dynamic select có khả năng load dữ liệu bất đồng bộ.
  - Xây dựng giao diện cấu hình API (URL, Headers, Params) và mapping dữ liệu JSON trả về.
  - Thiết lập cơ chế lắng nghe sự thay đổi giá trị để trigger gọi lại API khi query params chứa biến động (ví dụ: `{{country}}`).
* **Nhiệm vụ 4: Xây dựng Công cụ cấu hình Logic điều kiện & Validate (TSK-2.10.4)**
  - Thiết lập giao diện trực quan để người dùng thêm mới các quy tắc điều kiện (Conditional Rules).
  - Phát triển engine xử lý logic động phía client (Dynamic Form Engine) để áp dụng các rule ẩn/hiện, cascade, tính toán công thức thời gian thực trên form khi người dùng điền dữ liệu.
* **Nhiệm vụ 5: Bộ sinh/phân tích Schema JSON và Preview mode (TSK-2.10.5)**
  - Chuyển đổi toàn bộ cấu trúc thiết kế (layout, fields, rules, API configuration) thành định dạng JSON Schema tương thích với backend.
  - Xây dựng component Renderer để render động form từ schema JSON, phục vụ cho việc Preview và tái sử dụng form ở các phân hệ khác (như Smart Approval Inbox TSK-2.13).

#### 3.3 Mobile Frontend Engineer (FE Mobile)
* *Không thuộc phạm vi task này (chỉ triển khai Web admin phục vụ màn hình lớn thiết kế).*

#### 3.4 UI/UX Designer
* Thiết kế chi tiết giao diện màn hình Form Builder bao gồm: bảng linh kiện, canvas lưới responsive, bảng cấu hình thuộc tính, giao diện trực quan của bộ thiết lập rule điều kiện.
* Đảm bảo trải nghiệm phối màu Rose Gold mượt mà cho các vùng active, hover.

#### 3.5 QA Engineer
* Viết kịch bản kiểm thử:
  - Kiểm thử kéo thả và sắp xếp linh kiện bằng cả chuột (drag-drop) và nút chức năng (button-based).
  - Kiểm thử cấu hình layout 2 cột trên Desktop tự động chuyển thành 1 cột trên Mobile.
  - Kiểm thử rule ẩn/hiện: chọn Loại hợp đồng là "Thời vụ" -> Ẩn trường "Số tháng thử việc", Hiện trường "Người bảo lãnh".
  - Kiểm thử cascading API: chọn Tỉnh/Thành -> API Quận/Huyện tự động load danh sách tương ứng.

---

### 4. Hướng dẫn Phát triển & Gỡ lỗi cục bộ (Local Development)
* Khởi chạy Web Client trong thư mục `open-erp-web`:
  ```bash
  npm run start
  ```
* Bật Angular DevTools để theo dõi reactive form state và cấu trúc schema JSON được cập nhật realtime khi thiết kế.

---

### 5. Tiêu chí hoàn thành (Definition of Done - DoD)
* Hỗ trợ đầy đủ cả kéo thả và nút chức năng để thay đổi vị trí trường.
* Cho phép định nghĩa layout dòng, cột và responsive linh hoạt theo grid system.
* Xử lý chính xác logic điều kiện động (ẩn/hiện, cascade update, calculations) trực tiếp trên Client.
* Hỗ trợ cấu hình liên kết API động và danh mục hệ thống thành công.
* Xuất/nhập schema JSON tương thích 100% với APIs của backend.
* Tích hợp màu nhấn Rose Gold và hỗ trợ Light/Dark mode, đa ngôn ngữ đầy đủ.

---

### 6. Trạng thái thực tế & Kết quả bàn giao (Actual Status & Deliverables)
*(Chưa bắt đầu)*
