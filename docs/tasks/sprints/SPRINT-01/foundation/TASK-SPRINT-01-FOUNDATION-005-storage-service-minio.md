# TASK-SPRINT-01-FOUNDATION-005: Storage Service — MinIO File Management

## Thông tin
| Thuộc tính | Giá trị |
|---|---|
| Task ID | TASK-SPRINT-01-FOUNDATION-005 |
| Sprint | Sprint 01 |
| Cluster | foundation |
| Loại | Feature |
| Người phụ trách | Backend |
| Story Points | 5 |
| Trạng thái | ⬜ TODO |
| Phụ thuộc | TASK-SPRINT-01-FOUNDATION-001 |

## Mô tả
Xây dựng `storage-service` đóng gói toàn bộ logic upload/download/delete file, tạo bucket per tenant, sinh pre-signed URL an toàn và quản lý metadata file. Tất cả microservices khác sử dụng storage-service thay vì gọi trực tiếp MinIO.

## Phạm vi kỹ thuật

### Backend (NestJS — `services/storage-service/`)
- Khởi tạo NestJS Microservice (TCP transport, port 3107) và HTTP server (port 4107 — internal only)
- Kết nối MinIO qua `minio` npm package
- **Bucket Management**:
  - `createTenantBucket(tenantId)`: tạo bucket `tenant-{tenantId}` khi onboarding
  - Bucket policy: private (không public access)
  - Lifecycle rules: auto-delete temp files sau 24 giờ (prefix `temp/`)
  - Lắng nghe event `tenant.created` → tạo bucket tự động
- **Upload File**:
  - Chunked upload cho file lớn (> 5MB dùng multipart upload MinIO)
  - Tối đa file size: 100MB (cấu hình per tenant theo plan)
  - Allowed MIME types: configurable, mặc định cho phép `image/*, application/pdf, application/vnd.openxmlformats-*`
  - Tạo unique `fileKey`: `{type}/{year}/{month}/{uuid}.{ext}`
  - Lưu metadata vào MongoDB `file_metadata` collection
  - Trả về: `fileId`, `fileKey`, `publicUrl` (pre-signed)
- **Pre-signed URL**:
  - `GET /storage/signed-url/{fileId}`: tạo pre-signed URL có hạn (mặc định 1 giờ)
  - Kiểm tra quyền truy cập file (tenantId phải khớp)
  - Dùng cho tất cả file download trong hệ thống
- **Upload Trực tiếp từ Client (Presigned PUT)**:
  - `POST /storage/presigned-upload`: tạo pre-signed PUT URL
  - Client upload trực tiếp lên MinIO (không qua backend)
  - Callback sau upload: client gọi `POST /storage/confirm-upload` để lưu metadata
- **Xóa file**:
  - Soft-delete: đánh dấu `isDeleted=true` trong metadata
  - Hard-delete: cron job hàng đêm xóa file soft-deleted > 30 ngày
  - Cascade: khi tenant bị TERMINATED → xóa toàn bộ bucket
- **Thống kê dung lượng**:
  - `GET /storage/usage/{tenantId}`: tổng dung lượng đang dùng
  - Kiểm tra quota trước khi upload
- **ONLYOFFICE Integration**:
  - `GET /storage/documents/{fileId}/download` (internal): endpoint cho ONLYOFFICE download
  - JWT verification cho ONLYOFFICE request
  - Trả về stream file từ MinIO

## Database (MongoDB)
- Collections:
  - `file_metadata` (fields: tenantId, fileId, fileKey, bucket, originalName, mimeType, sizeBytes, uploadedBy, isDeleted, metadata)
- Indexes:
  - `{ tenantId: 1, fileId: 1 }` — unique
  - `{ tenantId: 1, type: 1 }` (cho filter theo loại file)
  - `{ isDeleted: 1, deletedAt: 1 }` (cho cleanup job)

## API Endpoints
| Method | Path | Auth | Mô tả |
|---|---|---|---|
| `POST` | `/storage/upload` | JWT | Upload file trực tiếp |
| `POST` | `/storage/presigned-upload` | JWT | Lấy pre-signed PUT URL |
| `POST` | `/storage/confirm-upload` | JWT | Xác nhận upload hoàn thành |
| `GET` | `/storage/signed-url/{fileId}` | JWT | Lấy signed download URL |
| `DELETE` | `/storage/{fileId}` | JWT | Xóa file |
| `GET` | `/storage/usage` | JWT | Thống kê dung lượng tenant |

## Acceptance Criteria
- [ ] Upload file JPEG, PNG, PDF thành công
- [ ] Pre-signed URL cho download hoạt động và hết hạn đúng thời gian
- [ ] Upload vượt giới hạn kích thước → 413 Payload Too Large
- [ ] Upload file type không cho phép → 415 Unsupported Media Type
- [ ] Vượt quota lưu trữ → 403 với error code `QUOTA_EXCEEDED`
- [ ] Khi tenant TERMINATED, xóa toàn bộ bucket MinIO thành công
- [ ] ONLYOFFICE có thể download file qua internal endpoint
- [ ] Metadata được lưu đúng vào MongoDB
- [ ] Unit test coverage ≥ 80%

## Ghi chú kỹ thuật
- Dùng `minio` npm package v7+
- Pre-signed URL TTL: 1 giờ mặc định, có thể override
- File key format: `{moduleType}/{yyyy}/{MM}/{uuid}.{ext}` (vd: `documents/2026/05/abc123.docx`)
- Checksum: tính SHA-256 của file khi upload, lưu vào metadata để verify integrity
- MinIO endpoint: `http://minio:9000` (internal Docker network)
- Không expose MinIO trực tiếp ra ngoài — tất cả đi qua storage-service
