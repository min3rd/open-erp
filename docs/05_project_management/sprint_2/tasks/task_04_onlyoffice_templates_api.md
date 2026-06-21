# Tài liệu kỹ thuật chi tiết: TSK-2.4 - API Mẫu văn bản động & OnlyOffice Adapter
## Phân hệ: Quản lý Biểu mẫu & Tích hợp File (Document Generation - Sprint 2)

---

### 1. Mục tiêu công việc (Objective)
Xây dựng phân hệ APIs quản lý các mẫu tài liệu (templates) định dạng PDF, DOCX, XLSX. Triển khai OnlyOffice Adapter để biên tập trực quan biểu mẫu trực tuyến, cho phép cấu hình thiết lập các vị trí điền dữ liệu động (placeholders), thiết lập quy tắc tự động biến đổi dữ liệu (data transformation) từ context của luồng duyệt vào tài liệu trước khi xuất bản.

---

### 2. Thiết kế chi tiết Nghiệp vụ & Kỹ thuật

#### 2.1 Cơ chế hoạt động của OnlyOffice Adapter & Biến đổi dữ liệu
* **OnlyOffice Integration:** Backend OpenERP đóng vai trò là Document Storage Service, cung cấp các Endpoint để OnlyOffice Document Server tải tệp tin và gửi callback lưu lại tệp tin sau khi chỉnh sửa.
* **Cơ chế Map dữ liệu (Template Mapping):**
  - Người dùng đặt các token dạng `{{employeeName}}`, `{{totalAmount}}` trong tệp tin DOCX.
  - Hệ thống lưu trữ cấu hình ánh xạ ánh xạ dữ liệu (JSON) nối trường dữ liệu của Form động với các token trong file.
  - **Biến đổi dữ liệu (Transformation):** Hỗ trợ chuyển hóa dữ liệu đầu vào thông qua các hàm định sẵn như:
    - `currency(VND)` -> Chuyển số `1500000` thành `"1,500,000 VND"` hoặc `"Một triệu năm trăm nghìn đồng"`.
    - `dateFormat(DD/MM/YYYY)` -> Chuyển đổi định dạng ngày tháng.
    - `uppercase()` -> Chuyển thành chữ in hoa.

```text
[Form động: Dữ liệu nhập] ──► [Hàm biến đổi (Format/Text)] ──► [OnlyOffice DocBuilder Engine] ──► [File PDF/DOCX hoàn chỉnh]
```

#### 2.2 Đặc tả API endpoint liên quan
Tham chiếu đầy đủ trong [api_overview.md](../../../03_functional/api_overview.md).

* **`POST /api/v1/document-templates`** (Authorized: Admin)
  - Đăng ký tải lên một file template thô (ví dụ: `.docx`) và thiết lập cấu hình ánh xạ dữ liệu.
  - **Payload yêu cầu (Multipart Form Data):**
    - `file`: (Tệp tin mẫu tin .docx)
    - `name`: "Biểu mẫu thanh toán chi phí"
    - `mapping`:
      ```json
      [
        { "placeholder": "emp_name", "source": "context.employeeName", "transform": "uppercase" },
        { "placeholder": "amount", "source": "context.totalAmount", "transform": "currency_text" }
      ]
      ```
  - **Phản hồi thành công (201 Created):**
    ```json
    {
      "success": true,
      "data": {
        "templateId": "uuid-template-9999",
        "name": "Biểu mẫu thanh toán chi phí"
      }
    }
    ```

* **`POST /api/v1/document-templates/:id/generate`** (Authorized)
  - Sinh file tài liệu cụ thể bằng cách điền dữ liệu động vào template.
  - **Payload yêu cầu:**
    ```json
    {
      "instanceId": "uuid-workflow-instance-111"
    }
    ```
  - **Phản hồi thành công (200 OK):**
    ```json
    {
      "success": true,
      "data": {
        "fileUrl": "https://storage.open-erp.9ms.io.vn/generated/doc-12345.pdf",
        "fileName": "Quyết định thanh toán - Nguyễn Văn A.pdf"
      }
    }
    ```

* **`GET /api/v1/document-templates/onlyoffice/config`** (Authorized)
  - Trả về cấu hình để khởi tạo OnlyOffice Document Server editor trên giao diện Web.

---

### 3. Phân chia công việc chi tiết cho các thành viên

#### 3.1 Backend Engineer (BE)
* **Nhiệm vụ 1: Triển khai OnlyOffice Document Server Callback Handler**
  - Xây dựng API callback nhận và lưu file từ OnlyOffice Server gửi về sau khi kết thúc phiên chỉnh sửa.
* **Nhiệm vụ 2: Tích hợp thư viện sinh tài liệu (DocxTemplater / Carbone)**
  - Tích hợp động cơ sinh file tài liệu (ví dụ: thư viện `docx-templates` hoặc `carbone.io` chạy trên NodeJS) để thay thế tự động các trường placeholder bằng dữ liệu thực tế đã qua xử lý lọc định dạng.
  - Chuyển đổi định dạng từ `.docx` sang `.pdf` bằng cách giao tiếp với OnlyOffice Document Builder API hoặc LibreOffice headless service.

#### 3.2 Web Frontend Engineer (FE Web)
* **Nhiệm vụ: Nhúng Editor OnlyOffice**
  - Tải script OnlyOffice API và nhúng trình biên tập tài liệu trực tiếp vào một tab trong UI quản trị của Admin Web.
  - Liên kết với API để tải file template và lưu trữ trạng thái chỉnh sửa.

#### 3.3 Mobile Frontend Engineer (FE Mobile)
* **Nhiệm vụ: Xem file kết xuất**
  - Tích hợp bộ xem PDF (PDF Viewer) trên app di động để người dùng có thể duyệt nhanh tài liệu đã sinh trước khi ấn phê duyệt.

#### 3.4 UI/UX Designer
* Thiết kế thanh điều khiển (Sidebar) trong trình biên tập biểu mẫu để chọn trường dữ liệu form động và ánh xạ trực quan vào template OnlyOffice.

#### 3.5 DevOps
* Cài đặt container OnlyOffice Document Server (`onlyoffice/documentserver`) chạy độc lập trong cụm Docker/Kubernetes dev, cấu hình CORS đảm bảo kết nối thông suốt giữa backend, frontend và OnlyOffice.

#### 3.6 QA Engineer
* Viết kịch bản kiểm thử:
  - Sinh thành công file tài liệu PDF từ template DOCX với các giá trị trường tiếng Việt có dấu, ngày tháng, và tiền tệ hiển thị chính xác.
  - Kiểm tra hiệu năng sinh file khi tải đồng thời nhiều yêu cầu (Concurrences).

---

### 4. Hướng dẫn Phát triển & Gỡ lỗi cục bộ (Local Development)
* **Bước 1 (Docker):** Đảm bảo service OnlyOffice Server đang hoạt động trên cổng `8080`:
  ```bash
  docker run -i -t -d -p 8080:80 --restart=always onlyoffice/documentserver
  ```
* **Bước 2 (Gỡ lỗi API):** Kiểm tra callback API trong file test `src/features/onlyoffice/onlyoffice.spec.ts`.

---

### 5. Tiêu chí hoàn thành (Definition of Done - DoD)
* Hệ thống sinh file tài liệu (PDF, DOCX) hoạt động tốt, không bị lỗi font tiếng Việt.
* OnlyOffice Editor hoạt động trơn tru trong giao diện Web quản trị.
* Hoàn thành bộ kiểm thử tích hợp (Integration tests) cho luồng sinh file tự động.

---

### 6. Trạng thái thực tế & Kết quả bàn giao (Actual Status & Deliverables)
*(Chưa bắt đầu)*
