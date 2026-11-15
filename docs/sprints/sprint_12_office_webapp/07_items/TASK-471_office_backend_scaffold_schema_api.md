# TASK-471: Khởi tạo Plugin Backend `office-webapp`, Schema PostgreSQL V1, ERP Storage API & JUnit 5 Tests

| Trường | Giá trị |
| :--- | :--- |
| **ID** | `TASK-471` |
| **Thuộc Feature** | [FEAT-48](./FEAT-48_office_storage_and_pure_ts_binary_core.md) |
| **Loại** | Backend (Quarkus Java 21 + PostgreSQL) |
| **Ưu tiên** | Critical |
| **Trạng thái** | `Open` |
| **Phụ thuộc** | `CONF-S12-001` (`1.0`), `DES-DB-S12-001` (`1.0`), `DES-API-S12-001` (`1.0`) |
| **Owner** | Developer Agent |
| **Tài liệu nguồn** | [CONF-S12-001](../04_confirmation/01_CONF-S12-001_sprint_12_scope_and_ac.md), [DES-DB-S12-001](../06_designs/db/01_DES-DB-S12-001_office_storage_schema.md), [DES-API-S12-001](../06_designs/api/01_DES-API-S12-001_office_storage_api.md), [DES-ARCH-S12-001](../06_designs/arch/01_DES-ARCH-S12-001_components_and_flows.md) |

---

## 1. Phạm vi Công việc

1. Khai báo `<module>office-webapp</module>` trong `plugins/pom.xml`.
2. Tạo cấu trúc plugin Quarkus chuẩn Open-ERP tại `plugins/office-webapp/`:
   - `pom.xml`, `Dockerfile.dev`, `src/main/resources/application.properties`.
   - `migrations/V1.0.0__office_storage_schema.sql` định nghĩa bảng `office_documents` và `office_document_versions` cùng index theo `tenant_id`, checksum SHA-256, `current_version`, `lock_status` và constraints kích thước file.
   - `plugin.json` (`schema_version: "2.0"`) đăng ký entity registry (`OfficeDocument`, `OfficeDocumentVersion`), checksum SHA-256 của migration SQL, danh sách queries và `ui_manifest.screens` (`/apps/office`, Desktop + Mobile permissions).
3. Triển khai mã nguồn Java dưới `com.vn9melody.openerp.plugins.office`:
   - `OfficeErrorCode` (mã lỗi `UPPER_SNAKE_CASE`), `OfficeDocumentType`, `OfficeDocumentStatus`.
   - `OfficeDtos` (Java `record` định kiểu mạnh — cấm trả `Map<String, Object>` tự do).
   - `StoredOfficeBinary` & `OfficeBlobStore` (lưu trữ phân tầng `<tenantId>/<documentId>/v<version>.<ext>`, tính SHA-256, chống path traversal, tách cấu hình `@ConfigProperty`).
   - `OfficeDocumentService` & `OfficeDocumentResource` với đầy đủ endpoint chuẩn hóa 4 khuôn mẫu API (`ApiResponse`, `PagedData`, `ListData`, `ApiErrorResponse`, `ResponseKey`), kiểm tra `TenantContext`, kiểm tra Magic Bytes, từ chối file OOXML mã hóa (OLE2 `D0 CF 11 E0` trên `.docx`/`.xlsx`/`.pptx` hoặc EncryptedPackage), xử lý `OFFICE_VERSION_CONFLICT` (`expected_version`).
4. Viết bộ kiểm thử JUnit 5 (`OfficeDocumentTypeAndMagicTest`, `OfficeBlobStoreTest`, `OfficeDocumentServiceTest`) xác minh không dùng H2, có kiểm thử thực tế trên dữ liệu/blob store/query boundary.

---

## 2. Lưu ý Kỹ thuật Core SDK khi Triển khai (`opencode` / Developer Notes)

- `PluginMigrationExecutor` chuẩn hóa `\r\n` -> `\n` (UTF-8) trước khi băm `sha256:<hex>`, do đó cần tính checksum `plugin.json` trên nội dung chuẩn LF.
- Trong `plugin.json` (`schema_version: "2.0"`), enum `PluginQueryDescriptor.Operation` của Core là `LIST`, `GET`, `INSERT`, `UPDATE`, `DELETE` (dùng `GET`, không dùng `GET_ONE`); `PluginQueryCompiler` tự quản lý `tenant_id` nên không khai báo `tenant_id` bên trong `values{}` của các query `INSERT`/`UPDATE`.
- Upload multipart/download sử dụng `org.jboss.resteasy.reactive.server.multipart.MultipartFormDataInput` & `FormValue` (tham chiếu `EmployeeResource`), chuẩn phản hồi `ApiResponse` / `PagedData` / `ListData`, `ResponseKey`, `OfficeErrorCode` (`UPPER_SNAKE_CASE`) và Java `record` DTO định kiểu mạnh (cấm trả `Map<String, Object>` tự do).

---

## 3. Tiêu chí Nghiệm thu & Kiểm chứng

- Lệnh `mvn -f plugins/pom.xml -pl office-webapp -am test` đạt `BUILD SUCCESS` với 0 test thất bại hoặc bị bỏ qua.
- SHA-256 trong `plugin.json` khớp chính xác 100% với `migrations/V1.0.0__office_storage_schema.sql`.
- Mọi API không rò rỉ dữ liệu cross-tenant; response key dùng `ResponseKey` và `OfficeDtos`.
