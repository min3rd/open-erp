# FEAT-48: Nền tảng Plugin Office WebApp — Backend Lưu trữ ERP & Lõi Xử lý Nhị phân OOXML/OLE2/PDF/CSV Thuần TypeScript

| Trường | Giá trị |
| :--- | :--- |
| **ID** | `FEAT-48` |
| **Sprint** | Sprint 12 — `office-webapp` Plugin |
| **Loại** | Feature (Backend + Core Pure TS Engine) |
| **Ưu tiên** | Critical |
| **Trạng thái** | `Open` |
| **Owner** | Developer Agent |
| **Tài liệu nguồn** | [00_READING_GUIDE.md](../00_READING_GUIDE.md), [SOL-S12-001](../05_solutions/01_SOL-S12-001_office_webapp_architecture.md), [ADR-S12-001](../05_solutions/02_ADR-S12-001_zero_third_party_ooxml_and_legacy_engine.md), [DES-ARCH-S12-001](../06_designs/arch/01_DES-ARCH-S12-001_components_and_flows.md), [DES-DB-S12-001](../06_designs/db/01_DES-DB-S12-001_office_storage_schema.md), [DES-API-S12-001](../06_designs/api/01_DES-API-S12-001_office_storage_api.md) |

---

## 1. Mục tiêu Nghiệp vụ & Kỹ thuật

Xây dựng trọn vẹn lớp nền tảng cho plugin `office-webapp` mà **tuyệt đối không phụ thuộc bất kỳ thư viện Office/ZIP/PDF/Editor bên thứ 3 nào** (`CONF-S12-001` / `BR-O09`, `AC-01`):

1. **Backend Lưu trữ Tùy chọn (`plugins/office-webapp`)**: Quarkus plugin tích hợp `plugin-sdk`, quản lý metadata tài liệu (`office_documents`) và lịch sử phiên bản (`office_document_versions`) trên PostgreSQL theo cơ chế cô lập dữ liệu đa khách thuê (`tenant_id` lấy từ `TenantContext` đã xác thực), kết hợp lưu blob phân tách theo prefix tenant (`OfficeBlobStore`).
2. **Lõi Nhị phân Thuần TypeScript (`plugins/office-webapp/web/src/app/core/binary/`)**: Giải nén/đóng gói OOXML `.docx`/`.xlsx`/`.pptx` trực tiếp từ chuẩn ZIP + Web Streams API (`CompressionStream` / `DecompressionStream`), kiểm tra Magic Bytes chống giả mạo đuôi file, từ chối file OOXML mã hóa (OLE2 EncryptedPackage), parser/serializer XML nội sinh, parser/serializer CSV chuẩn RFC 4180 (hỗ trợ UTF-8 BOM tiếng Việt), bộ đọc khung OLE2/CFB cho file nhị phân cũ (`.doc`, `.xls`, `.ppt`) và bộ đọc đối tượng PDF thuần TypeScript.

---

## 2. Danh sách Task Con

| Task ID | Tên Task | Trạng thái | Phụ thuộc | File chi tiết |
| :--- | :--- | :--- | :--- | :--- |
| `TASK-471` | Khởi tạo Plugin Backend `office-webapp`, Schema PostgreSQL V1, Storage API & JUnit 5 Tests | `Open` | Design `APPROVED 1.0` | [TASK-471](./TASK-471_office_backend_scaffold_schema_api.md) |
| `TASK-472` | Xây dựng Lõi Nhị phân Thuần TypeScript Zero-Third-Party (`crc32`, `magic-bytes`, `ooxml-zip-container`, `xml-model-bridge`, `csv-codec`, `legacy-ole2-reader`, `client-pdf-reader`) | `Open` | Design `APPROVED 1.0` | [TASK-472](./TASK-472_pure_ts_zero_third_party_binary_core.md) |

---

## 3. Tiêu chí Nghiệm thu Cấp Feature

- **AC-F48-01 (Zero-Third-Party Invariant)**: `plugins/office-webapp/web/package.json` không chứa bất kỳ dependency xử lý Office/ZIP/PDF/Canvas/Editor bên thứ 3 nào; `tsc --noEmit` đạt 0 lỗi.
- **AC-F48-02 (Tenant Isolation & Security)**: 100% endpoint của `office-webapp` lấy `tenant_id` từ `TenantContext`; khóa blob theo `<tenantId>/<documentId>/v<version>.<ext>`; từ chối file sai Magic Bytes (`OFFICE_MAGIC_BYTES_MISMATCH`) hoặc file mã hóa (`OFFICE_ENCRYPTED_FILE_UNSUPPORTED`).
- **AC-F48-03 (4 API Response Formats & Strong DTOs)**: Mọi API trả về `ApiResponse<T>` / `PagedData<T>` / `ListData<T>` / `ApiErrorResponse` với `OfficeErrorCode` dạng `UPPER_SNAKE_CASE`, `ResponseKey`, không trả `Map<String, Object>` tự do.
- **AC-F48-04 (JUnit 5 Verification)**: Bộ test Backend chạy thành công (`BUILD SUCCESS`, 0 failures) qua `mvn -f plugins/pom.xml -pl office-webapp -am test`.
