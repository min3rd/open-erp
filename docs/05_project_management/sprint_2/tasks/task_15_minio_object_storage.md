# Tài liệu kỹ thuật chi tiết: TSK-2.15 - Tích hợp MinIO Object Storage & Quản lý File
## Phân hệ: Hạ tầng & Lưu trữ (Infrastructure & Storage - Sprint 2)

---

### 1. Mục tiêu công việc (Objective)
Cài đặt và tích hợp MinIO làm hệ thống Object Storage chính cho toàn bộ nền tảng OpenERP. Thay thế hoàn toàn cơ chế lưu trữ tệp tin trên ổ đĩa cục bộ (local storage) bằng dịch vụ lưu trữ đối tượng tương thích S3. Đảm bảo phân tách dữ liệu tệp tin theo từng doanh nghiệp (Tenant Isolation), hỗ trợ cơ chế sinh link tải tạm thời (Pre-signed URLs) có bảo mật thời hạn và kích hoạt tính năng lưu phiên bản tệp tin (Object Versioning).

---

### 2. Thiết kế chi tiết Nghiệp vụ & Kỹ thuật

#### 2.1 Kiến trúc tích hợp MinIO
* **Cơ chế cô lập dữ liệu (Multi-tenant Folder Isolation):**
  - Mọi tệp tin tải lên sẽ được lưu trữ trong một Bucket duy nhất của hệ thống (ví dụ: `erp-tenant-assets`) để dễ quản lý hạ tầng.
  - Dữ liệu được cô lập logic bằng đường dẫn thư mục: `${tenantId}/${moduleName}/${fileId}_${fileName}`.
* **Pre-signed URLs:**
  - Để bảo mật tài liệu doanh nghiệp, các tệp tin trong MinIO không được để ở chế độ Public.
  - Khi Client (Web/Mobile) yêu cầu tải hoặc xem file (ví dụ: biểu mẫu OnlyOffice hoặc PDF), Backend sử dụng S3 SDK để sinh một link tải có thời hạn ngắn (ví dụ: 15 phút): `https://minio.open-erp.9ms.io.vn/erp-tenant-assets/tenant-123/docx/abc.docx?Signature=xxx&Expires=yyy`.
* **Quản lý file trong DB:**
  - Tạo bảng `sys_files` để quản lý siêu dữ liệu (metadata) của file: `id` (UUID), `tenant_id` (UUID), `bucket_name` (VARCHAR), `object_key` (VARCHAR), `file_name` (VARCHAR), `mime_type` (VARCHAR), `file_size` (BIGINT), `created_at` (TIMESTAMPTZ).

```text
[Client] ──► Gọi API upload ──► [NestJS Backend] ──► Upload file lên [MinIO Object Storage]
                                      │
                                      ▼
                            [Ghi vào DB: sys_files]
```

#### 2.2 Đặc tả API endpoint liên quan
Tham chiếu đầy đủ trong [api_overview.md](../../../03_functional/api_overview.md).

* **`POST /api/v1/storage/upload`** (Authorized)
  - Tải lên tệp tin.
  - **Payload yêu cầu (Multipart Form Data):**
    - `file`: (Dữ liệu tệp tin nhị phân)
    - `module`: "workflow"
  - **Phản hồi thành công (201 Created):**
    ```json
    {
      "success": true,
      "data": {
        "fileId": "uuid-file-3333",
        "fileName": "giay_de_nghi_thanh_toan.docx",
        "mimeType": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "fileSize": 154200
      }
    }
    ```

* **`GET /api/v1/storage/files/:fileId/download`** (Authorized)
  - Lấy link Pre-signed URL để tải xuống hoặc xem tệp tin.
  - **Phản hồi thành công (200 OK):**
    ```json
    {
      "success": true,
      "data": {
        "downloadUrl": "http://localhost:9000/erp-tenant-assets/tenant-uuid/workflow/3333_giay_de_nghi.docx?AWSAccessKeyId=xxx&Expires=1718970000&Signature=yyy"
      }
    }
    ```

---

### 3. Phân chia công việc chi tiết cho các thành viên

#### 3.1 Backend Engineer (BE)
* **Nhiệm vụ 1: Triển khai Storage Module với NestJS**
  - Cài đặt SDK `@aws-sdk/client-s3` và `@aws-sdk/s3-request-presigner`.
  - Viết Service quản lý kết nối MinIO, tự động tạo Bucket mặc định khi khởi động ứng dụng nếu chưa tồn tại.
  - Xây dựng APIs tải lên, tải xuống qua Pre-signed URL và xóa tệp tin.
* **Nhiệm vụ 2: Tạo migration bảng `sys_files`**
  - Thiết kế bảng quản lý file đính kèm, kích hoạt RLS dựa trên `tenant_id`.

#### 3.2 Web Frontend Engineer (FE Web)
* **Nhiệm vụ: Cập nhật component Tải tệp tin (File Upload component)**
  - Cập nhật các component upload trong thư viện dùng chung `@open-erp/shared-ui` để gọi API upload mới của MinIO và hiển thị tiến độ tải lên (upload progress).

#### 3.3 Mobile Frontend Engineer (FE Mobile)
* **Nhiệm vụ: Tải file đính kèm trên Mobile**
  - Tích hợp gọi API upload tệp tin hình ảnh hóa đơn từ Camera điện thoại trực tiếp lên MinIO.

#### 3.4 UI/UX Designer
* Thiết kế thanh hiển thị tiến trình upload file trực quan và khung quản lý file đính kèm trực tuyến đẹp mắt.

#### 3.5 DevOps
* **Nhiệm vụ 1: Cấu hình Container MinIO**
  - Thêm service MinIO (`minio/minio`) và giao diện quản trị Console vào file `docker-compose.local.yml`.
  - Cài đặt các biến cấu hình: `MINIO_ROOT_USER`, `MINIO_ROOT_PASSWORD`, `MINIO_ENDPOINT`.
* **Nhiệm vụ 2: Cài đặt Production Object Storage**
  - Thiết lập phân nhóm (Cluster) MinIO hoặc liên kết AWS S3 / Cloudflare R2 trên môi trường Staging/Production.

#### 3.6 QA Engineer
* Viết kịch bản kiểm thử:
  - Tải lên tệp tin có dung lượng lớn (ví dụ: 10MB), đảm bảo upload thành công.
  - Kiểm tra xem link pre-signed url có bị hết hạn đúng thời gian cấu hình hay không.
  - Kiểm tra cô lập Tenant: Tài khoản doanh nghiệp A không thể lấy pre-signed url của file thuộc doanh nghiệp B.

---

### 4. Hướng dẫn Phát triển & Gỡ lỗi cục bộ (Local Development)
* **Bước 1 (Docker Compose):** Thêm MinIO vào file `docker-compose.local.yml`:
  ```yaml
  minio:
    image: minio/minio:latest
    ports:
      - "9000:9000"
      - "9001:9001"
    environment:
      MINIO_ROOT_USER: minioadmin
      MINIO_ROOT_PASSWORD: minioadminpassword
    command: server /data --console-address ":9001"
  ```
  Khởi động: `docker compose up -d minio`.
* **Bước 2 (Unit Test):** Chạy test suite của Storage Service:
  ```bash
  npm run test -- src/features/storage/storage.spec.ts
  ```

---

### 5. Tiêu chí hoàn thành (Definition of Done - DoD)
* Dịch vụ MinIO local chạy ổn định, backend kết nối thành công.
* Toàn bộ dữ liệu file của hệ thống được lưu trữ trên MinIO và được phân chia theo tenant.
* Pre-signed URL sinh ra có hiệu lực chính xác.
* Unit test đạt độ bao phủ dòng lệnh > 85%.

---

### 6. Trạng thái thực tế & Kết quả bàn giao (Actual Status & Deliverables)
*(Chưa bắt đầu)*
