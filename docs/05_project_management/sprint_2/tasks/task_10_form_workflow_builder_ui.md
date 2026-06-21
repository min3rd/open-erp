# Tài liệu kỹ thuật chi tiết: TSK-2.10 - Giao diện thiết lập Form động & Workflow Builder nâng cao (Web)
## Phân hệ: Giao diện Quản trị (Admin Web UI - Sprint 2)

---

### 1. Mục tiêu công việc (Objective)
Xây dựng giao diện Web quản trị trực quan cao cấp, hỗ trợ các nhà quản lý/admin thiết kế:
1. **Dynamic Form Builder:** Trình thiết kế form động bằng cách kéo thả (drag-and-drop) các loại trường thông tin và thiết lập thuộc tính validate.
2. **Workflow Designer:** Sơ đồ vẽ khối trực quan thể hiện luồng quy trình phê duyệt rẽ nhánh, liên kết các bước với các điều kiện logic và gán người phê duyệt tương ứng.
Đảm bảo đồng bộ thương hiệu với gam màu **Rose Gold (`#B76E79`)** và tối ưu hóa trải nghiệm tương tác mượt mà.

---

### 2. Thiết kế chi tiết Nghiệp vụ & Kỹ thuật

#### 2.1 Thành phần Giao diện & Luồng tương tác
* **Màn hình Form Builder:**
  - Cột trái: Danh sách các Control mẫu (Text Input, Textarea, Number, Select, Date, Checkbox, File Attachment).
  - Vùng trung tâm: Canvas hiển thị các trường đã kéo vào, hỗ trợ sắp xếp thứ tự (sortable).
  - Cột phải: Bảng thuộc tính (Properties Panel) cấu hình nhãn (Label), tên biến (Name), bắt buộc nhập (Required), giá trị mặc định, và các điều kiện ràng buộc.
* **Màn hình Workflow Designer:**
  - Tích hợp thư viện hiển thị sơ đồ (như Rete.js, JointJS hoặc thư viện SVG tùy chỉnh).
  - Cho phép thêm các Node (Start, Step, Decision/Branch, Fork, Join, End) và nối dây (Edges) để tạo mối quan hệ.
  - Nhấp vào Node Step để cấu hình người duyệt, consensus rules (ALL, ANY, Threshold %) và nhúng Form động (đã tạo từ Form Builder).
  - **Thiết lập khối song song:** Hỗ trợ kéo thả và liên kết Node `FORK` và Node `JOIN` để biểu diễn luồng công việc song song (ví dụ: chia thành 3 luồng kiểm kho, kiểm giá sale, kiểm cs sau đó hội tụ lại). Hỗ trợ cấu hình `joinRules` cho Node `JOIN`.

```text
[Bảng công cụ kéo thả] ──► [Thả vào Canvas thiết kế] ──► [Cấu hình thuộc tính Node/Field] ──► [Lưu dạng JSON gửi lên API]
```

#### 2.2 Quy chuẩn thiết kế UI/UX
- Màu chủ đạo: **Rose Gold (`#B76E79`)** làm màu nhấn cho các trạng thái Active, Hover, nút Save chính.
- Giao diện hỗ trợ chuyển đổi Light/Dark mode mượt mà thông qua CSS Variables.
- Toàn bộ nhãn công cụ, thuộc tính hỗ trợ đa ngôn ngữ đầy đủ qua Angular Transloco.

---

### 3. Phân chia công việc chi tiết cho các thành viên

#### 3.1 Backend Engineer (BE)
* *Không thuộc phạm vi trực tiếp (chỉ hỗ trợ và tối ưu hóa APIs ở TSK-2.2 và TSK-2.3 để Web gọi nhanh).*

#### 3.2 Web Frontend Engineer (FE Web)
* **Nhiệm vụ 1: Phát triển Module Kéo thả Form động (Form Builder)**
  - Tích hợp thư viện `@angular/cdk/drag-drop` để xử lý kéo thả các trường nhập liệu từ thanh công cụ vào bảng vẽ thiết kế.
  - Xây dựng form cấu hình thuộc tính động cập nhật realtime vào schema JSON của form.
* **Nhiệm vụ 2: Phát triển Module Sơ đồ luồng (Workflow Designer)**
  - Sử dụng thư viện vẽ sơ đồ (ví dụ: `ngx-graph` hoặc một canvas SVG) để hiển thị cấu trúc bước duyệt rẽ nhánh và các luồng phê duyệt song song (Fork/Join).
  - Xây dựng bộ parser chuyển đổi cấu trúc đồ thị (Nodes & Edges) bao gồm cả các kết nối song song và điều kiện gộp luồng thành định dạng JSON tương thích với API của TSK-2.2.

#### 3.3 Mobile Frontend Engineer (FE Mobile)
* *Không thuộc phạm vi task này (giao diện cấu hình phức tạp chỉ triển khai trên màn hình lớn Web).*

#### 3.4 UI/UX Designer
* Cung cấp file thiết kế Figma hoàn chỉnh cho trình thiết kế Form và Workflow, các icon rõ ràng, các khối step phân biệt màu theo trạng thái cấu hình.

#### 3.5 QA Engineer
* Viết kịch bản kiểm thử giao diện:
  - Kéo thả trường mới, cấu hình Required -> Bấm Preview -> Điền thử không nhập trường bắt buộc -> Kiểm tra thông báo lỗi xuất hiện chính xác.
  - Vẽ sơ đồ rẽ nhánh phức tạp -> Lưu -> Load lại -> Đảm bảo đồ thị vẽ lại nguyên vẹn không mất kết nối giữa các node.

---

### 4. Hướng dẫn Phát triển & Gỡ lỗi cục bộ (Local Development)
* **Bước 1 (Web):** Khởi chạy Web Client trong thư mục `open-erp-web`:
  ```bash
  npm run start
  ```
* **Bước 2 (Gỡ lỗi UI):** Sử dụng Redux DevTools hoặc Angular DevTools để theo dõi sự thay đổi trạng thái của schema JSON thiết kế trong Store.

---

### 5. Tiêu chí hoàn thành (Definition of Done - DoD)
* Giao diện kéo thả mượt mà, trực quan, không giật lag.
* Chuyển đổi chính xác 100% bản vẽ trực quan thành cấu trúc JSON gửi lên backend lưu trữ.
* Tích hợp đầy đủ màu chủ đạo Rose Gold và hỗ trợ Light/Dark mode, đa ngôn ngữ Transloco.

---

### 6. Trạng thái thực tế & Kết quả bàn giao (Actual Status & Deliverables)
*(Chưa bắt đầu)*
