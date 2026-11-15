# [DES-API-S12-001] Thiết kế API Contract: Plugin `office-webapp` (ERP Cloud Storage)

| Trường | Giá trị |
| :--- | :--- |
| ID / loại / sprint | DES-API-S12-001 / Thiết kế API / Sprint 12 |
| Trạng thái / phiên bản / cập nhật | **✅ APPROVED 1.0 / 2026-11-15** — chủ dự án duyệt thiết kế qua hội thoại trực tiếp |
| Owner / reviewer | Solution Architect / Self-reviewed |
| Đầu vào | [DES-ARCH-S12-001](../arch/01_DES-ARCH-S12-001_components_and_flows.md) 0.1, [DES-DB-S12-001](../db/01_DES-DB-S12-001_office_storage_schema.md) 0.1, [api_standards](../../../../../.agents/rules/api_standards.md), [CONF-S12-001](../../04_confirmation/01_CONF-S12-001_sprint_12_scope_and_ac.md) 1.0 |
| Đọc trước / đọc tiếp | [DES-DB-S12-001](../db/01_DES-DB-S12-001_office_storage_schema.md) / [DES-UI-S12-001](../ui/01_DES-UI-S12-001_office_webapp_ui.md) |

## 1. Quy ước chung & Tuân thủ Chuẩn Dự Án

- **Base path qua Core Gateway**: `/api/v1/plugins/runtime/office-webapp/**` (trong plugin Quarkus resource gốc là `/documents/**`).
- **Phạm vi gọi API**: API chỉ được gọi khi người dùng sử dụng tính năng tùy chọn **Mở/Lưu từ ERP Cloud Storage** (`Q6`, `AC-03`). Toàn bộ thao tác mở/sửa/xuất file từ máy tính cá nhân (`AC-02`) **không gọi API này**.
- **Tenant Isolation**: `tenant_id` và `user_id` lấy duy nhất từ context JWT đã xác thực do Core truyền xuống (`SecurityContext`), tuyệt đối không nhận `tenant_id` từ body/query.
- **100% 4 Khuôn Mẫu Phản Hồi Chuẩn** ([api_standards.md](../../../../../.agents/rules/api_standards.md)):
  1. Single Resource: `{ success: true, code, message, params, data: {...} }`
  2. Paginated List: `{ success: true, code, message, params, data: { items: [...], page, size, total_items, total_pages } }`
  3. Non-Paginated List: `{ success: true, code, message, params, data: { items: [...] } }`
  4. Error Response: `{ success: false, code, message, params, errors: [{ field, code, params }], timestamp }`
- **Strict DTO & ResponseKey**: Trả về Java Record/DTO có kiểu mạnh (`OfficeDocumentDto`, `OfficeDocumentVersionDto`, `OfficeCapabilitiesDto`), dùng `ResponseKey` enum, **cấm trả `Map<String, Object>` tự do** và **cấm hardcode message tiếng Việt**.

## 2. Java & TypeScript Enums đồng bộ 1-1

| Enum | Giá trị hợp lệ | Mục đích |
| :--- | :--- | :--- |
| `OfficeDocumentType` | `WORD`, `EXCEL`, `POWERPOINT`, `CSV`, `PDF` | Phân loại engine hiển thị |
| `OfficeDocumentStatus` | `ACTIVE`, `ARCHIVED`, `DELETED` | Trạng thái lưu trữ trên ERP |
| `RibbonLayoutMode` (FE) | `SINGLE_LINE`, `CLASSIC` | Chế độ thanh Ribbon (học từ M365 Web) |
| `DocumentSourceType` (FE) | `LOCAL`, `ERP_STORAGE`, `NEW_BLANK` | Nguồn tài liệu đang mở |

## 3. Danh sách Endpoints

| Method & Path | Quyền RBAC | Mô tả & Khuôn mẫu Response | Lỗi chính (`code`) |
| :--- | :--- | :--- | :--- |
| `GET /documents` | `office:document:read` | Danh sách tài liệu trên ERP Storage; query `q?`, `doc_type?`, `status?` (mặc định `ACTIVE`), `page` (1), `size` (20, tối đa 100), `sort` (`updated_at:desc\|title:asc`). Trả **Paginated List** `OfficeDocumentDto`. Hỗ trợ client `pageThrough` nếu cần duyệt hết không bị cắt cứng (`ANTI-DATA-TRUNCATION`). | `OFFICE_INVALID_PAGINATION`, `OFFICE_FORBIDDEN` |
| `POST /documents` | `office:document:write` | Tạo mới / tải lên tài liệu vào ERP Storage (`multipart/form-data`: `file`, `title?`, `doc_type?`). Kiểm tra dung lượng `<= 25MB`, magic bytes hợp lệ (`PK`, `D0CF11E0`, `%PDF-`, hoặc UTF-8 text cho `.csv`). Trả HTTP `201`, **Single Resource** `OfficeDocumentDto`. | `OFFICE_FILE_REQUIRED`, `OFFICE_FILE_TOO_LARGE`, `OFFICE_UNSUPPORTED_EXTENSION`, `OFFICE_INVALID_MAGIC_BYTES` |
| `GET /documents/{id}` | `office:document:read` | Lấy metadata chi tiết tài liệu theo `id` (thuộc `tenant_id`). Trả **Single Resource** `OfficeDocumentDto`. | `OFFICE_DOCUMENT_NOT_FOUND` |
| `GET /documents/{id}/versions` | `office:document:read` | Lấy lịch sử phiên bản đã lưu lên ERP Storage. Trả **Non-Paginated List** `{ items: OfficeDocumentVersionDto[] }`. | `OFFICE_DOCUMENT_NOT_FOUND` |
| `GET /documents/{id}/content` | `office:document:read` | Tải stream nhị phân gốc (`MediaType.APPLICATION_OCTET_STREAM`) kèm header `Content-Disposition`, `ETag: "<sha256>"`, `X-Document-Version`. Hỗ trợ query `version?` để mở lại bản cũ. | `OFFICE_DOCUMENT_NOT_FOUND`, `OFFICE_BLOB_NOT_FOUND` |
| `PUT /documents/{id}/content` | `office:document:write` | Lưu đè nội dung đã sửa từ trình duyệt lên ERP Storage (`multipart/form-data`: `file`, `title?`, `change_note?`, tùy chọn `expected_version?` chống ghi đè xung đột). Tăng `current_version`, ghi bản ghi mới vào `plg_office_document_versions`. Trả **Single Resource** `OfficeDocumentDto`. | `OFFICE_DOCUMENT_NOT_FOUND`, `OFFICE_VERSION_CONFLICT`, `OFFICE_FILE_TOO_LARGE`, `OFFICE_INVALID_MAGIC_BYTES` |
| `PATCH /documents/{id}` | `office:document:write` | Đổi tên (`title`) hoặc chuyển `status` (`ACTIVE`/`ARCHIVED`). Trả **Single Resource** `OfficeDocumentDto`. | `OFFICE_DOCUMENT_NOT_FOUND`, `OFFICE_TITLE_REQUIRED` |
| `DELETE /documents/{id}` | `office:document:delete` | Xóa mềm (`status = DELETED`, `deleted_at = NOW()`). Trả **Single Resource** `{ document_id, status }`. | `OFFICE_DOCUMENT_NOT_FOUND` |

## 4. Hợp đồng DTO & Ví dụ chuẩn

### `OfficeDocumentDto`
```json
{
  "id": "a1b2c3d4-0000-4000-8000-000000000001",
  "title": "Bao cao tai chinh Q4",
  "original_filename": "bao_cao_q4.xlsx",
  "file_extension": "xlsx",
  "doc_type": "EXCEL",
  "mime_type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "size_bytes": 48290,
  "checksum_sha256": "e3b0c442...",
  "current_version": 3,
  "status": "ACTIVE",
  "created_by": "u1...",
  "updated_by": "u1...",
  "created_at": "2026-11-15T05:00:00Z",
  "updated_at": "2026-11-15T05:10:00Z"
}
```

### Ví dụ Error Response chuẩn (khi xung đột phiên bản lưu)
```json
{
  "success": false,
  "code": "OFFICE_VERSION_CONFLICT",
  "message": "Document version conflict",
  "params": {
    "expected_version": 2,
    "current_version": 3
  },
  "errors": [
    {
      "field": "expected_version",
      "code": "OFFICE_VERSION_CONFLICT",
      "params": {
        "expected_version": 2,
        "current_version": 3
      }
    }
  ],
  "timestamp": "2026-11-15T05:12:00Z"
}
```

## 5. Danh mục mã i18n (`OfficeErrorCode` + Client Codes)

| Mã `code` (`UPPER_SNAKE_CASE`) | Nguồn phát sinh | `params` kèm theo | Ý nghĩa |
| :--- | :--- | :--- | :--- |
| `OFFICE_DOCUMENTS_FETCH_SUCCESS` | Backend | `{ count }` | Lấy danh sách file thành công |
| `OFFICE_DOCUMENT_CREATED` | Backend | `{ id, title }` | Lưu mới lên ERP Storage thành công |
| `OFFICE_DOCUMENT_SAVED` | Backend | `{ id, version }` | Cập nhật phiên bản lên ERP Storage thành công |
| `OFFICE_DOCUMENT_DELETED` | Backend | `{ id }` | Xóa mềm thành công |
| `OFFICE_DOCUMENT_NOT_FOUND` | Backend | `{ id }` | Không tìm thấy file hoặc không thuộc tenant |
| `OFFICE_FILE_TOO_LARGE` | Backend & Client | `{ max_mb, actual_mb }` | Vượt giới hạn dung lượng (25MB Desktop / 10MB Mobile) |
| `OFFICE_INVALID_MAGIC_BYTES` | Backend & Client | `{ extension }` | File giả đuôi hoặc sai chữ ký nhị phân |
| `OFFICE_VERSION_CONFLICT` | Backend | `{ expected_version, current_version }` | Có người khác vừa lưu phiên bản mới hơn |
| `OFFICE_ENCRYPTED_FILE_UNSUPPORTED` | Client Engine | `{ filename }` | File có mật khẩu mã hóa (chưa hỗ trợ mở ở v1) |
| `OFFICE_LEGACY_EXPORT_AS_OOXML` | Client Engine | `{ from_ext, to_ext }` | Thông báo file `.doc`/`.xls`/`.ppt` sẽ xuất thành `.docx`/`.xlsx`/`.pptx` |
| `OFFICE_LEGACY_PARSE_PARTIAL` | Client Engine | `{ filename }` | Một số thành phần đồ họa cũ trong file nhị phân được bỏ qua an toàn |

## 6. Lịch sử

| Phiên bản | Ngày | Thay đổi | Nguồn |
| :--- | :--- | :--- | :--- |
| 0.1 | 2026-11-15 | Thiết kế API Contract đầy đủ theo 4 khuôn mẫu chuẩn & danh mục i18n code | Solution Architect |
