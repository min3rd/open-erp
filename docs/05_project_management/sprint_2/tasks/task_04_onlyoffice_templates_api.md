# Tài liệu kỹ thuật chi tiết: TSK-2.4 - API Mẫu văn bản động & OnlyOffice Adapter
## Phân hệ: Quản lý Biểu mẫu & Tích hợp File (Document Generation - Sprint 2)

---

### 1. Mục tiêu công việc (Objective)
Xây dựng phân hệ APIs quản lý các mẫu tài liệu (templates) định dạng PDF và Microsoft Office (DOCX, XLSX, PPTX). Triển khai OnlyOffice Adapter để:
1. Tự động sinh file tài liệu từ biểu mẫu động và dữ liệu luồng duyệt sang tất cả các định dạng: **DOCX, XLSX, PPTX, PDF**.
2. Tích hợp sâu OnlyOffice Document Server giúp người dùng có thể **xem và chỉnh sửa trực tiếp** mọi tài liệu Office trên phần mềm mà không cần tải về máy cá nhân.

---

### 2. Thiết kế chi tiết Nghiệp vụ & Kỹ thuật

#### 2.1 Cơ chế hoạt động của OnlyOffice Adapter & Biến đổi dữ liệu
* **OnlyOffice Integration:** Backend OpenERP đóng vai trò là Document Storage Service, cung cấp các Endpoint để OnlyOffice Document Server tải tệp tin và gửi callback lưu lại tệp tin sau khi chỉnh sửa.
* **Cơ chế Map dữ liệu (Template Mapping):**
  - Người dùng đặt các token dạng `{{employeeName}}`, `{{totalAmount}}` trong tệp tin mẫu (DOCX, XLSX).
  - Hệ thống thực hiện ánh xạ dữ liệu động từ Form vào các token trong file.
  - **Đa định dạng (Multi-format Generation):** Hỗ trợ sinh file kết quả đầu ra theo tùy chọn định dạng (`outputFormat`: PDF, DOCX, XLSX, PPTX) thông qua tích hợp OnlyOffice Document Builder.
* **Xem & Biên tập Trực tuyến (Online View/Edit without download):**
  - Khi xem tài liệu trong luồng duyệt, Web Client gọi API lấy cấu hình khởi tạo OnlyOffice Editor (`mode: "view"` để xem hoặc `mode: "edit"` để chỉnh sửa).
  - Khi người dùng chỉnh sửa và nhấn Lưu, OnlyOffice Server gửi callback chứa link file mới tải về cho Backend. Backend tải file đó về thay thế file cũ trong Storage, tạo phiên bản log mới cho tệp tin.

```text
[Yêu cầu xem/sửa] ──► [Backend: Sinh Editor Config] ──► [Web: Nhúng DocsAPI.DocEditor]
                                                                │
                                                                ▼ (Người dùng sửa & lưu)
[Backend: Thay thế file] ◄── [Tải file mới từ link] ◄── [OnlyOffice: Callback lưu file]
```

#### 2.2 Đặc tả API endpoint liên quan
Tham chiếu đầy đủ trong [api_overview.md](../../../03_functional/api_overview.md).

* **`POST /api/v1/document-templates`** (Authorized: Admin)
  - Đăng ký tải lên một file template thô (DOCX, XLSX, PPTX) và thiết lập cấu hình ánh xạ dữ liệu.
  - **Payload yêu cầu (Multipart Form Data):**
    - `file`: (Tệp tin mẫu)
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
      "instanceId": "uuid-workflow-instance-111",
      "outputFormat": "PDF" // Các định dạng hỗ trợ: PDF, DOCX, XLSX, PPTX
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

* **`GET /api/v1/files/:fileId/onlyoffice-config`** (Authorized)
  - Lấy cấu hình khởi tạo OnlyOffice Editor để xem hoặc chỉnh sửa trực tuyến một file tài liệu bất kỳ trong hệ thống.
  - **Tham số query:** `?mode=edit` (hoặc `view`)
  - **Phản hồi thành công (200 OK):**
    ```json
    {
      "success": true,
      "data": {
        "document": {
          "fileType": "docx",
          "key": "unique-file-version-key-12345",
          "title": "Báo cáo doanh thu tháng 6.docx",
          "url": "https://storage.open-erp.9ms.io.vn/files/report-123.docx"
        },
        "editorConfig": {
          "mode": "edit",
          "lang": "vi",
          "callbackUrl": "https://api.open-erp.9ms.io.vn/api/v1/files/onlyoffice-callback/report-123",
          "user": { "id": "usr-111", "name": "Nguyễn Văn A" }
        },
        "documentType": "word"
      }
    }
    ```

* **`POST /api/v1/files/onlyoffice-callback/:fileId`** (Public - Giao tiếp giữa OnlyOffice và Backend)
  - Nhận sự kiện lưu tệp tin từ OnlyOffice Server gửi về.
  - **Payload yêu cầu:**
    ```json
    {
      "status": 2, // Trạng thái 2: Document is ready for saving
      "url": "http://onlyoffice-server/download/new-file.docx", // Link file đã sửa
      "key": "unique-file-version-key-12345",
      "users": ["usr-111"]
    }
    ```
  - **Phản hồi (200 OK):** `{"error": 0}`

---

### 3. Phân chia công việc chi tiết cho các thành viên

#### 3.1 Backend Engineer (BE)
* **Nhiệm vụ 1: Triển khai các Endpoints tích hợp OnlyOffice**
  - Xây dựng API callback nhận trạng thái lưu file từ OnlyOffice Server, tải file về và ghi đè phiên bản mới của tệp tin.
  - Xây dựng API sinh cấu hình Editor Config cho các tệp tin Office (.docx, .xlsx, .pptx, .pdf) theo phân quyền của người dùng (chỉ người duyệt/người tạo có quyền sửa, người khác chỉ xem).
* **Nhiệm vụ 2: Tích hợp OnlyOffice DocBuilder & Hỗ trợ Đa định dạng**
  - Tích hợp OnlyOffice Document Builder Service hoặc APIs để sinh tệp tin đầu ra tương ứng với `outputFormat` (PDF, DOCX, XLSX, PPTX) được yêu cầu.

#### 3.2 Web Frontend Engineer (FE Web)
* **Nhiệm vụ: Nhúng Trình chỉnh sửa trực quan OnlyOffice**
  - Phát triển component `OnlyOfficeEditor` nhúng DocsAPI để người dùng mở rộng toàn màn hình xem/sửa file Excel, Word trực tiếp trên giao diện trình duyệt mà không cần tải về máy.
  - Đồng bộ cập nhật trạng thái hiển thị của tài liệu sau khi lưu.

#### 3.3 Mobile Frontend Engineer (FE Mobile)
* **Nhiệm vụ: Xem file kết xuất**
  - Tích hợp bộ xem PDF (PDF Viewer) trên app di động để người dùng có thể duyệt nhanh tài liệu đã sinh trước khi ấn phê duyệt.

#### 3.4 UI/UX Designer
* Thiết kế nút "Xem/Sửa trực tuyến" tinh tế trên giao diện danh sách file đính kèm, cùng với layout biên tập mở rộng toàn màn hình cho trình soạn thảo OnlyOffice.

#### 3.5 DevOps
* Cài đặt container OnlyOffice Document Server (`onlyoffice/documentserver`) chạy độc lập trong cụm Docker/Kubernetes dev, cấu hình CORS đảm bảo kết nối thông suốt giữa backend, frontend và OnlyOffice.

#### 3.6 QA Engineer
* Viết kịch bản kiểm thử:
  - Sinh thành công file tài liệu PDF, DOCX, XLSX từ mẫu tương ứng.
  - Mở một file Excel từ phần mềm -> Nhập thêm dòng dữ liệu -> Bấm lưu -> F5 tải lại -> Đảm bảo dữ liệu mới đã được cập nhật trực tiếp trên phần mềm.

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

Task TSK-2.4 đã được hoàn thành đầy đủ các tiêu chí bàn giao và tích hợp thành công trên nhánh `develop`:

* **Cài đặt thư viện:**
  - Thêm thư viện `adm-zip` vào dự án để hỗ trợ thao tác đọc/ghi file ZIP (DOCX, XLSX, PPTX) phục vụ thay thế placeholder trong các file XML cấu trúc.
* **Core Services (`open-erp-services`):**
  - Khởi tạo thực thể cơ sở dữ liệu [DocumentTemplate Entity](../../../../open-erp-services/src/core/document-template/entities/document-template.entity.ts) để quản lý biểu mẫu.
  - Xây dựng lớp dịch vụ [DocumentTemplateService](../../../../open-erp-services/src/core/document-template/document-template.service.ts) quản lý CRUD biểu mẫu, xử lý logic thay thế token dạng `{{placeholder}}` trong template file với các transformation (`uppercase`, `lowercase`, `currency_text`) từ context dữ liệu đơn của Workflow Instance, đồng thời tích hợp gọi OnlyOffice Conversion API để chuyển đổi các file đã sinh ra định dạng PDF.
  - Khởi tạo [CoreDocumentTemplateModule](../../../../open-erp-services/src/core/document-template/document-template.module.ts).
  - Cập nhật [StorageService](../../../../open-erp-services/src/core/storage/storage.service.ts) để hỗ trợ `updateFile` (ghi đè nội dung file) và `getFileStream` (truy xuất stream dữ liệu nhị phân của file).
* **APIs & Controllers (`open-erp-services`):**
  - Xây dựng [DocumentTemplateController](../../../../open-erp-services/src/features/document-template/document-template.controller.ts) để expose APIs CRUD `/api/v1/document-templates` và sinh file `/api/v1/document-templates/:id/generate`. Endpoint khởi tạo mẫu tài liệu yêu cầu quyền `TEMPLATE_ADMIN`.
  - Triển khai [FilesController](../../../../open-erp-services/src/features/storage/files.controller.ts) để phục vụ OnlyOffice integration:
    - `GET /files/:fileId/onlyoffice-config`: Trả về cấu hình DocsAPI để nhúng trình soạn thảo trực tuyến.
    - `POST /files/onlyoffice-callback/:fileId`: Callback nhận cập nhật từ OnlyOffice, ghi đè phiên bản mới của tệp tin.
    - `GET /files/:fileId/download-binary`: Serve stream nhị phân của file trực tiếp cho OnlyOffice download mà không bị vướng vấn đề mạng.
  - Cấu hình bỏ qua xác thực tenant trong [TenantMiddleware](../../../../open-erp-services/src/core/tenant/tenant.middleware.ts) cho callback của OnlyOffice.
  - Seeding quyền `TEMPLATE_ADMIN` trong [AuthService](../../../../open-erp-services/src/features/auth/auth.service.ts).
* **Đăng ký module & entity:**
  - Tích hợp đăng ký module và entity mới trong [app.module.ts](../../../../open-erp-services/src/app.module.ts).
* **Unit Tests:**
  - Hoàn thành bộ unit tests đầy đủ đạt tỷ lệ pass 100%:
    - [document-template.service.spec.ts](../../../../open-erp-services/src/core/document-template/document-template.service.spec.ts) (10 test cases)
    - [document-template.controller.spec.ts](../../../../open-erp-services/src/features/document-template/document-template.controller.spec.ts) (8 test cases)
    - [files.controller.spec.ts](../../../../open-erp-services/src/features/storage/files.controller.spec.ts) (6 test cases)

