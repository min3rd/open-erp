# Tài liệu kỹ thuật chi tiết: TSK-1.3 - Sơ đồ Tổ chức & Phòng ban
## Phân hệ: Quản trị doanh nghiệp (SaaS Organizational Tree - Sprint 1)

---

### 1. Mục tiêu công việc (Objective)
Xây dựng phân hệ quản lý Sơ đồ tổ chức doanh nghiệp. Cho phép Tenant Owner định nghĩa danh sách các chi nhánh vật lý và cấu trúc phòng ban phân cấp dưới dạng sơ đồ cây tự tham chiếu trực quan. Thiết lập các ràng buộc bảo toàn dữ liệu phòng ban và ngăn chặn đứt gãy luồng cây (như vòng lặp phòng ban tuần hoàn).

---

### 2. Thiết kế chi tiết Nghiệp vụ & Kỹ thuật

#### 2.1 Cấu trúc Cây tự tham chiếu (Self-Referencing Tree Schema)
Cấu trúc phòng ban được thiết kế trong bảng `departments` sử dụng khóa ngoại tự tham chiếu `parent_id` trỏ đến khóa chính `id` của chính bảng đó. Quy chuẩn chi tiết trong [data_model.md](../../../04_technical/data_model.md).

```text
       [ Ban Giám Đốc (parent_id: NULL) ]
                       │
          ┌────────────┴────────────┐
          ▼                         ▼
  [ Phòng Kinh Doanh ]      [ Phòng Kỹ Thuật ]
(parent_id: Ban Giám Đốc) (parent_id: Ban Giám Đốc)
          │
          ▼
 [ Nhóm Bán Hàng Hà Nội ]
(parent_id: Phòng Kinh Doanh)
```

#### 2.2 Các Quy tắc Nghiệp vụ cốt lõi (Business Rules)
* **Ngăn chặn vòng lặp tuần hoàn (Circular Loop Detection):** Khi thực hiện cập nhật `parent_id` của một phòng ban, hệ thống phải chạy thuật toán đệ quy kiểm tra xem nút cha mới được chọn có nằm trong nhóm các nút con cháu (descendants) của phòng ban đó hay không. Nếu có, lập tức trả về lỗi `400 Bad Request` và từ chối cập nhật.
* **Ngăn chặn mồ côi (Orphan Block):** Không cho phép xóa một phòng ban nếu phòng ban đó đang chứa các phòng ban con. Người dùng bắt buộc phải di chuyển hoặc xóa các phòng ban con trước.
* **Ngăn chặn xóa khi còn nhân sự:** Không cho phép xóa một phòng ban nếu bảng `employees` vẫn còn nhân viên hoạt động được gán vào phòng ban đó. Trả về lỗi `400 Bad Request`.

#### 2.3 Đặc tả API endpoint liên quan
Tham chiếu chi tiết trong [api_overview.md](../../../03_functional/api_overview.md).

* **`GET /api/v1/org/departments`** (Yêu cầu Header `X-Tenant-ID` và Auth)
  - Trả về cấu trúc cây JSON phân cấp đã được sắp xếp sẵn từ backend.
* **`POST /api/v1/org/departments`** (Tạo mới phòng ban)
* **`PATCH /api/v1/org/departments/:id`** (Cập nhật phòng ban, ví dụ: chuyển phòng cha `parent_id`)
* **`DELETE /api/v1/org/departments/:id`** (Xóa phòng ban)

---

### 3. Phân chia công việc chi tiết cho các thành viên

#### 3.1 Backend Engineer (BE)
* **Nhiệm vụ 1: CRUD & RLS cho Chi nhánh & Phòng ban**
  - Viết các APIs CRUD cho `branches` và `departments`. Đảm bảo các truy vấn đều áp dụng chính sách RLS dựa trên `tenant_id`.
* **Nhiệm vụ 2: Triển khai thuật toán kiểm tra đệ quy**
  - Viết hàm kiểm tra đệ quy phát hiện vòng lặp (ví dụ dùng thuật toán duyệt theo chiều sâu DFS hoặc truy vấn đệ quy CTE của PostgreSQL):
    ```sql
    WITH RECURSIVE sub_departments AS (
        SELECT id, parent_id FROM departments WHERE id = :new_parent_id
        UNION ALL
        SELECT d.id, d.parent_id FROM departments d
        INNER JOIN sub_departments sd ON d.id = sd.parent_id
    )
    SELECT COUNT(*) FROM sub_departments WHERE id = :current_department_id;
    ```
    *(Nếu kết quả > 0 nghĩa là phát hiện vòng lặp).*

#### 3.2 Web Frontend Engineer (FE Web)
* **Nhiệm vụ 1: Giao diện Split-Pane Sơ đồ tổ chức**
  - Thiết kế màn hình quản lý phòng ban dạng Split-pane: Cột bên trái hiển thị sơ đồ cây phòng ban trực quan, cột bên phải hiển thị chi tiết thông tin và danh sách nhân viên của phòng ban đó theo mockups trong [sitemap_and_wireframes.md](../../../02_user_requirements/sitemap_and_wireframes.md).
  - Sử dụng component TreeView từ thư viện dùng chung **`open-erp-ui`**, hỗ trợ kéo thả (Drag and Drop) thay đổi cấp bậc phòng ban, đồng bộ màu **Rose Gold** và hỗ trợ Light/Dark Mode.
* **Nhiệm vụ 2: Đa ngôn ngữ (Transloco)**
  - Tải động toàn bộ nhãn tiêu đề và các thông báo lỗi nghiệp vụ (ví dụ: "Không thể xóa phòng ban có nhân sự") từ file dịch đa ngôn ngữ.

#### 3.3 Mobile Frontend Engineer (FE Mobile)
* **Nhiệm vụ 1: Màn hình danh sách phòng ban tối giản**
  - Thiết kế màn hình xem sơ đồ tổ chức dưới dạng danh sách Accordion phân cấp thu gọn trên Mobile, giúp người dùng dễ dàng tra cứu danh bạ nhân sự theo phòng ban.

#### 3.4 UI/UX Designer
* Cung cấp thiết kế Figma màn hình Sơ đồ phòng ban dạng split-pane và responsive view tương ứng trên tablet/mobile.

#### 3.5 QA Engineer
* Thiết kế kịch bản kiểm thử:
  - Tạo sơ đồ phòng ban nhiều tầng (tối thiểu 4 tầng) thành công.
  - Thử nghiệm gán phòng cha gây ra vòng lặp tuần hoàn và xác nhận hệ thống báo lỗi chính xác.
  - Thử nghiệm xóa phòng ban đang có nhân viên hoạt động và xác nhận bị từ chối thành công.

---

### 4. Hướng dẫn Phát triển & Gỡ lỗi cục bộ (Local Development)

* **Bước 1 (Hạ tầng):** Đảm bảo cụm hạ tầng PostgreSQL & Redis local đang chạy:
  ```bash
  docker compose -f ../../../../docker-compose.local.yml up -d
  ```
* **Bước 2 (Gỡ lỗi Backend):** Mở dự án `open-erp-services` trong VSCode, đặt breakpoint trong `departments.service.ts` tại hàm kiểm tra vòng lặp đệ quy. Chạy debug cấu hình **"Debug NestJS Backend"**.
* **Bước 3 (Chạy client):** Khởi chạy dev server trên client Web (`npm run start`) để kiểm tra kéo thả cây phòng ban.

---

### 5. Tiêu chí hoàn thành (Definition of Done - DoD)
* **Kết quả bàn giao:**
  - Bộ APIs CRUD chi nhánh & phòng ban hoạt động ổn định, có unit test đầy đủ cho thuật toán phát hiện vòng lặp (coverage > 85%).
  - Giao diện sơ đồ cây trên Web hỗ trợ kéo thả mượt mà, phản hồi tốt trên mobile, sử dụng component từ `@open-erp/shared-ui`.
  - Hiển thị đầy đủ đa ngôn ngữ qua Transloco.
  - Toàn bộ source code được review, approve và merge vào nhánh `develop`.
