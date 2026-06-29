# Tài liệu kỹ thuật chi tiết: TSK-2.11 - Giao diện thiết kế Biểu mẫu động & Liên kết OnlyOffice (Web)
## Phân hệ: Giao diện Quản trị (Admin Web UI - Sprint 2)

| Trace | ID / Link |
|-------|-----------|
| PRD | [prd.md](../../../01_business/prd.md) §2 Goals — Tính đồng bộ All-in-one |
| URS/SRS | [urs.md](../../../02_user_requirements/urs.md) **US-DOC-001** |
| Mockup | [sitemap_and_wireframes.md](../../../02_user_requirements/sitemap_and_wireframes.md) §2.7 |
| Backlog | **US-003** (Workflow + tài liệu đính kèm) |
| Phụ thuộc | TSK-2.4 (OnlyOffice API), TSK-2.18 (Form lib) |

---

### 1. Mục tiêu công việc (Objective)
Xây dựng giao diện Web cho phép cấu hình và liên kết các mẫu tài liệu (PDF, DOCX) với các quy trình phê duyệt. Tích hợp khung soạn thảo OnlyOffice Document Server trực tuyến để chỉnh sửa mẫu, đồng thời thiết kế bảng điều khiển giúp quản trị viên cấu hình vị trí điền dữ liệu (mapping placeholders) và phương pháp biến đổi định dạng dữ liệu (data transformations) một cách trực quan.

---

### 2. Thiết kế chi tiết Nghiệp vụ & Kỹ thuật

#### 2.1 Cấu trúc giao diện biên tập mẫu tài liệu
* **Bố cục giao diện (Template Designer Layout):**
  - **Vùng chính (Main area):** Nhúng Iframe của OnlyOffice Document Editor hiển thị nội dung tệp tin văn bản (ví dụ: mẫu đơn mua sắm trang thiết bị dạng `.docx`).
  - **Bảng cấu hình bên phải (Right sidebar):**
    - Danh sách các trường dữ liệu của Form động (đã liên kết với bước).
    - Bộ công cụ cấu hình Ánh xạ: Click chọn trường từ danh sách -> Nhập mã token placeholder tương ứng trong file Word (ví dụ: `{{emp_name}}`).
    - Menu thả xuống chọn hàm biến đổi dữ liệu (ví dụ: chuyển số tiền thành chữ viết bằng tiếng Việt, định dạng dd/mm/yyyy cho ngày).

```text
┌─────────────────────────────────────────────────────────────┬──────────────────────────┐
│                                                             │ BẢNG ÁNH XẠ DỮ LIỆU      │
│                                                             ├──────────────────────────┤
│                  KHUNG SOẠN THẢO ONLYOFFICE                 │ Chọn Trường: [Tổng tiền] │
│                  (Trực quan, hiển thị DOCX)                 │ Placeholder: {{total}}   │
│                                                             │ Biến đổi: [Đọc số tiền]  │
│                                                             ├──────────────────────────┤
│                                                             │ [ Nút Lưu cấu hình ]     │
└─────────────────────────────────────────────────────────────┴──────────────────────────┘
```

#### 2.2 Tích hợp OnlyOffice API
- Web client load script: `http://<onlyoffice-server-ip>/web-apps/apps/api/documents/api.js`.
- Sử dụng hàm khởi tạo `new DocsAPI.DocEditor("iframe-container", config)` để nhúng và điều phối sự kiện giữa Web Client và máy chủ OnlyOffice.

---

### 3. Phân chia công việc chi tiết cho các thành viên

#### 3.1 Backend Engineer (BE)
* *Không thuộc phạm vi trực tiếp (đã chuẩn bị các APIs ở TSK-2.4).*

#### 3.2 Web Frontend Engineer (FE Web)
* **Nhiệm vụ 1: Nhúng OnlyOffice Document Server Editor**
  - Viết directive/component Angular để tải động script OnlyOffice, thiết lập cấu hình kết nối, xử lý mở tài liệu mẫu trực tiếp trên trình duyệt.
* **Nhiệm vụ 2: Thiết kế Bảng Mapping & Data Transformation**
  - Xây dựng sidebar quản lý ánh xạ. Lấy danh sách các trường của form động thuộc quy trình hiện tại, cho phép người dùng ghép nối trực quan với placeholder trong văn bản và lựa chọn kiểu format dữ liệu phù hợp.

#### 3.3 Mobile Frontend Engineer (FE Mobile)
* *Không thuộc phạm vi trực tiếp (chỉ hỗ trợ hiển thị tệp PDF kết quả dạng Read-only ở TSK-2.14).*

#### 3.4 UI/UX Designer
* Thiết kế thanh công cụ điều phối ánh xạ dữ liệu (mapping panel) trực quan, giảm thiểu việc người dùng phải gõ chữ bằng tay nhiều nhất có thể thông qua các hành động nhấp chuột để gán.

#### 3.5 QA Engineer
* Viết kịch bản kiểm thử:
  - Tải lên một file mẫu Word -> Mở thành công trong OnlyOffice Editor -> Thay đổi nội dung -> Đảm bảo OnlyOffice tự động gọi callback lưu trữ bản cập nhật.
  - Cấu hình thử ánh xạ cho 3 trường dữ liệu -> Đảm bảo cấu hình map được gửi lên lưu trữ chính xác trong DB.

---

### 4. Hướng dẫn Phát triển & Gỡ lỗi cục bộ (Local Development)
* **Bước 1:** Đảm bảo container OnlyOffice Server cục bộ đang chạy.
* **Bước 2 (Gỡ lỗi Web):** Mở Developer Tools trên trình duyệt Chrome/Firefox, theo dõi thẻ Network để đảm bảo không bị lỗi CORS hoặc lỗi tải script `api.js` từ OnlyOffice IP.

---

### 5. Tiêu chí hoàn thành (Definition of Done - DoD)
* OnlyOffice Editor hoạt động trơn tru trên Web, có đầy đủ công cụ định dạng văn bản.
* Khách hàng có thể cấu hình ánh xạ dữ liệu dễ dàng và lưu lại thành công.
* Tích hợp màu Rose Gold cho khung viền và sidebar mapping của giao diện.

---

### 6. Trạng thái thực tế & Kết quả bàn giao (Actual Status & Deliverables)
*(Chưa bắt đầu)*
