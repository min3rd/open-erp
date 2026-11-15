# [DES-DB-S12-001] Thiết kế CSDL & IndexedDB: Plugin `office-webapp`

| Trường | Giá trị |
| :--- | :--- |
| ID / loại / sprint | DES-DB-S12-001 / Thiết kế DB / Sprint 12 |
| Trạng thái / phiên bản / cập nhật | **✅ APPROVED 1.0 / 2026-11-15** — chủ dự án duyệt thiết kế qua hội thoại trực tiếp |
| Owner / reviewer | Solution Architect / Self-reviewed |
| Đầu vào | [DES-ARCH-S12-001](../arch/01_DES-ARCH-S12-001_components_and_flows.md) 0.1, [CONF-S12-001](../../04_confirmation/01_CONF-S12-001_sprint_12_scope_and_ac.md) 1.0 (`Q6`, `Q8`, `AC-03`, `AC-08`) |
| Đọc trước / đọc tiếp | [DES-ARCH-S12-001](../arch/01_DES-ARCH-S12-001_components_and_flows.md) / [DES-API-S12-001](../api/01_DES-API-S12-001_office_storage_api.md) |

## 1. Nguyên tắc lưu trữ & Cô lập Tenant

1. **Làm việc Local là mặc định (`AC-02`)**: Người dùng mở/sửa file từ máy tính không ghi bất kỳ bản ghi nào vào PostgreSQL hay Redis.
2. **CSDL PostgreSQL chỉ dùng cho ERP Cloud Storage (`AC-03`)**:
   - Schema riêng theo tenant và plugin: `tenant_<8 ký tự>_office`.
   - Mọi bảng mang tiền tố `plg_office_`, có cột `tenant_id UUID NOT NULL` lấy từ ngữ cảnh xác thực của Core (tuyệt đối không tin `tenant_id` từ client).
   - Thực thể đăng ký vào **Entity Registry** chung của hệ thống:
     - `plugin:office-webapp.OfficeDocument` (`tenant_scope: TENANT`)
     - `plugin:office-webapp.OfficeDocumentVersion` (`tenant_scope: TENANT`)
3. **File nhị phân thô**: Lưu trên Object Storage (MinIO `tenant-files` bucket với prefix `<tenantId>/office/<docId>/v<N>_<safeName>` hoặc fallback thư mục cục bộ cấu hình qua `office.document.storage-dir`), **tuyệt đối không lưu BLOB file Office vào PostgreSQL**.

## 2. Schema PostgreSQL (`V1.0.0__office_storage_schema.sql`)

### 2.1. Bảng `plg_office_documents` (Metadata tài liệu trên ERP Cloud Storage)

| Cột | Kiểu PostgreSQL | Ràng buộc / Mặc định | Mô tả |
| :--- | :--- | :--- | :--- |
| `id` | `UUID` | `PRIMARY KEY DEFAULT gen_random_uuid()` | ID tài liệu |
| `tenant_id` | `UUID` | `NOT NULL` | ID tenant sở hữu (lấy từ token xác thực) |
| `title` | `VARCHAR(255)` | `NOT NULL` | Tên hiển thị tài liệu (sửa được inline ở Title Bar) |
| `original_filename` | `VARCHAR(255)` | `NOT NULL` | Tên file gốc kèm đuôi |
| `file_extension` | `VARCHAR(16)` | `NOT NULL` | `docx`, `xlsx`, `pptx`, `csv`, `doc`, `xls`, `ppt`, `pdf` |
| `doc_type` | `VARCHAR(24)` | `NOT NULL` | Enum `OfficeDocumentType`: `WORD`, `EXCEL`, `POWERPOINT`, `CSV`, `PDF` |
| `mime_type` | `VARCHAR(128)` | `NOT NULL` | MIME chuẩn (VD: `application/vnd.openxmlformats-officedocument...`) |
| `size_bytes` | `BIGINT` | `NOT NULL CHECK (size_bytes >= 0)` | Dung lượng phiên bản hiện tại (bytes) |
| `storage_key` | `VARCHAR(512)` | `NOT NULL` | Key trên ObjectStorage (`<tenantId>/office/<docId>/v<N>_<name>`) |
| `checksum_sha256` | `VARCHAR(64)` | `NOT NULL` | Hash SHA-256 kiểm tra toàn vẹn |
| `current_version` | `INT` | `NOT NULL DEFAULT 1` | Số phiên bản mới nhất |
| `status` | `VARCHAR(24)` | `NOT NULL DEFAULT 'ACTIVE'` | Enum `OfficeDocumentStatus`: `ACTIVE`, `ARCHIVED`, `DELETED` |
| `created_by` | `UUID` | `NOT NULL` | User ID người tạo/upload |
| `updated_by` | `UUID` | `NOT NULL` | User ID người lưu gần nhất |
| `created_at` | `TIMESTAMPTZ` | `NOT NULL DEFAULT NOW()` | Thời điểm tạo |
| `updated_at` | `TIMESTAMPTZ` | `NOT NULL DEFAULT NOW()` | Thời điểm cập nhật cuối |
| `deleted_at` | `TIMESTAMPTZ` | `NULL` | Thời điểm xóa mềm |

**Indexes:**
- `idx_plg_office_docs_tenant_status_updated` trên `(tenant_id, status, updated_at DESC)` (phục vụ danh sách `GET /documents` có phân trang).
- `idx_plg_office_docs_tenant_type` trên `(tenant_id, doc_type, status)`.
- `idx_plg_office_docs_tenant_title` trên `(tenant_id, LOWER(title))` (phục vụ tìm kiếm nhanh theo tên file).

### 2.2. Bảng `plg_office_document_versions` (Lịch sử các lần lưu lên ERP Storage)

| Cột | Kiểu PostgreSQL | Ràng buộc / Mặc định | Mô tả |
| :--- | :--- | :--- | :--- |
| `id` | `UUID` | `PRIMARY KEY DEFAULT gen_random_uuid()` | ID phiên bản |
| `tenant_id` | `UUID` | `NOT NULL` | ID tenant (đồng bộ từ document) |
| `document_id` | `UUID` | `NOT NULL REFERENCES plg_office_documents(id) ON DELETE CASCADE` | FK nội bộ plugin |
| `version_number` | `INT` | `NOT NULL` | Số thứ tự phiên bản (`1, 2, 3...`) |
| `size_bytes` | `BIGINT` | `NOT NULL` | Dung lượng phiên bản |
| `storage_key` | `VARCHAR(512)` | `NOT NULL` | Object key của riêng phiên bản này |
| `checksum_sha256` | `VARCHAR(64)` | `NOT NULL` | SHA-256 |
| `change_note` | `VARCHAR(255)` | `NULL` | Ghi chú ngắn khi lưu (tùy chọn) |
| `created_by` | `UUID` | `NOT NULL` | User ID thực hiện lưu |
| `created_at` | `TIMESTAMPTZ` | `NOT NULL DEFAULT NOW()` | Thời điểm lưu phiên bản |

**Indexes & Constraints:**
- `uq_plg_office_doc_versions_num` `UNIQUE (tenant_id, document_id, version_number)`.
- `idx_plg_office_doc_versions_doc` trên `(tenant_id, document_id, version_number DESC)`.

### 2.3. Kịch bản Migration & Rollback
- **Up (`V1.0.0__office_storage_schema.sql`)**: Tạo 2 bảng trên, các index và kích hoạt Row-Level Security (`ALTER TABLE ... ENABLE ROW LEVEL SECURITY`) phòng vệ sâu theo `current_setting('app.current_tenant_id', true)::uuid`.
- **Down / Rollback**: Khôi phục qua `SNAPSHOT_RESTORE` (chuẩn `plugin.json`) hoặc `DROP TABLE IF EXISTS plg_office_document_versions, plg_office_documents;` khi gỡ hoàn toàn plugin và không giữ dữ liệu.

## 3. Schema IndexedDB phía Client (`Q8` — Tự động lưu nháp cục bộ)

Tên Database trình duyệt: `open_erp_office_drafts` (version `1`), Object Store: `drafts` (`keyPath: 'draftId'`).

| Thuộc tính | Kiểu JS/TS | Mô tả |
| :--- | :--- | :--- |
| `draftId` | `string` (PK) | Mã duy nhất cho tab/phiên làm việc (VD: `local:<fileName>:<size>` hoặc `erp:<documentId>`) |
| `tenantId` | `string` | Ngữ cảnh tenant hiện tại để tránh nhầm nháp khi user đổi workspace |
| `source` | `'LOCAL' \| 'ERP'` | Nguồn mở file ban đầu |
| `erpDocumentId` | `string \| null` | ID tài liệu ERP nếu mở từ Cloud Storage |
| `fileName` | `string` | Tên file hiện tại |
| `docType` | `OfficeDocumentType` | `WORD \| EXCEL \| POWERPOINT \| CSV \| PDF` |
| `binaryData` | `ArrayBuffer` | Bản snapshot OOXML / CSV đã đóng gói mới nhất của nháp |
| `isDirty` | `boolean` | Có thay đổi chưa lưu ra file gốc hay không |
| `updatedAt` | `number` | Timestamp (epoch ms) lần auto-save cuối |

**Indexes IndexedDB:** `by_tenant_updated` trên `[tenantId, updatedAt]` để hiển thị danh sách nháp có thể khôi phục hoặc dọn nháp cũ quá 7 ngày.

## 4. Lịch sử

| Phiên bản | Ngày | Thay đổi | Nguồn |
| :--- | :--- | :--- | :--- |
| 0.1 | 2026-11-15 | Thiết kế schema PostgreSQL cô lập tenant + schema IndexedDB lưu nháp client | Solution Architect |
