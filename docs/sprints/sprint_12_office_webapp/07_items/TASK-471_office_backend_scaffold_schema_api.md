# TASK-471: Plugin Backend `office-webapp` — Scaffold, Schema PostgreSQL V1, ERP Storage API & JUnit 5

| Trường | Giá trị |
| :--- | :--- |
| **ID** | `TASK-471` |
| **Thuộc Feature** | [FEAT-48](./FEAT-48_office_storage_and_pure_ts_binary_core.md) |
| **Loại** | Backend (Quarkus Java 21 + PostgreSQL + Object Storage) |
| **Ưu tiên** | Critical |
| **Trạng thái** | `Open` — đặc tả chi tiết 0.2, chờ chủ dự án review |
| **Phụ thuộc** | `CONF-S12-001` 1.0, `DES-DB-S12-001` 1.0, `DES-API-S12-001` 1.0, `DES-ARCH-S12-001` 1.0 |
| **Owner** | Developer Agent |
| **Tài liệu nguồn** | [DES-DB-S12-001](../06_designs/db/01_DES-DB-S12-001_office_storage_schema.md), [DES-API-S12-001](../06_designs/api/01_DES-API-S12-001_office_storage_api.md), [BENCH-S12-003](../03_benchmarks/03_BENCH-S12-003_m365_feature_matrix.md) |

---

## 0. Kết quả bàn giao (Definition of Done)

1. `plugins/office-webapp` build được trong `plugins/pom.xml`, cài qua Plugin Manager, không phụ thuộc plugin khác.
2. API ERP Storage chạy đúng 4 khuôn mẫu response, cô lập `tenant_id` từ JWT, lưu file thô trên Object Storage (không lưu BLOB vào PostgreSQL).
3. Migration V1 chạy trên PostgreSQL thật, có RLS; test JUnit 5 xanh 100% trên PostgreSQL thật (không H2).
4. Demo bằng `curl`/RestAssured: upload → list → download (có `ETag`) → lưu phiên bản mới → xung đột phiên bản → xóa mềm.
5. Share nội bộ ERP: cấp/thu hồi quyền `USER`/`ROLE`, list chỉ trả file owner hoặc được share, cross-tenant không thấy.

## 1. Phạm vi file

| Đường dẫn | Nội dung |
| :--- | :--- |
| `plugins/pom.xml` | Thêm `<module>office-webapp</module>` |
| `plugins/office-webapp/pom.xml` | Parent `plugins-parent`, dependency `sdk` (Core Plugin SDK) |
| `plugins/office-webapp/Dockerfile.dev` | Multi-stage dev image theo mẫu `plugins/attendance` |
| `plugins/office-webapp/plugin.json` | Manifest schema 2.0: id, quyền, entity registry, ui_manifest, checksum migration |
| `plugins/office-webapp/migrations/V1.0.0__office_storage_schema.sql` | Schema `tenant_<id8>_office`, 3 bảng (documents, versions, permissions), index, RLS |
| `plugins/office-webapp/src/main/java/com/vn9melody/openerp/plugins/office/enums/OfficeErrorCode.java` | Mã lỗi `UPPER_SNAKE_CASE` |
| `.../enums/OfficeDocumentType.java`, `OfficeDocumentStatus.java` | Enum đồng bộ 1-1 với TS |
| `.../dto/OfficeDtos.java` | `record OfficeDocumentDto`, `OfficeDocumentVersionDto`, `OfficeCapabilitiesDto` |
| `.../model/OfficeDocument.java`, `OfficeDocumentVersion.java`, `OfficeDocumentPermission.java`, `StoredOfficeBinary.java` | Entity/model nội bộ |
| `.../service/OfficeBlobStore.java` | Ghi/đọc Object Storage, fallback local, chống path traversal |
| `.../service/OfficeDocumentService.java` | Nghiệp vụ, magic bytes, version, tenant isolation |
| `.../resource/OfficeDocumentResource.java` | 8 endpoint dưới `/documents/**` |
| `plugins/office-webapp/src/test/java/...` | JUnit 5 + RestAssured, PostgreSQL thật |

## 2. Yêu cầu chức năng chi tiết

### 2.1 Manifest & đăng ký

| Mã | Yêu cầu |
| :--- | :--- |
| 471-F01 | `plugin.json` khai báo `schema_version: "2.0"`, `id: "office-webapp"`, `version: "1.0.0"`, `dependencies: []`. |
| 471-F02 | Quyền: `office:document:read`, `office:document:write`, `office:document:delete`, `office:document:share`; không xin quyền ngoài phạm vi. |
| 471-F03 | `platforms.desktop.features`: `office:local:open`, `office:local:edit`, `office:erp:storage`, `office:export:all`; `platforms.mobile.features`: `office:local:view`, `office:erp:view`, `office:export:download`. |
| 471-F04 | `entity_registry`: `plugin:office-webapp.OfficeDocument` và `plugin:office-webapp.OfficeDocumentVersion`, `tenant_scope: TENANT`. |
| 471-F05 | `ui_manifest.screens`: route `/apps/office`, `render_mode: WEB_COMPONENT`, `tag_name: op-office-webapp-app`, `entry: /plugins-runtime/office-webapp/main.js`, `platforms: ["desktop","mobile"]`. |
| 471-F06 | Checksum `sha256:<hex>` trong `plugin.json` tính trên nội dung migration **chuẩn LF UTF-8**; lệch checksum phải fail cài đặt. |

### 2.2 Migration & cô lập dữ liệu

| Mã | Yêu cầu |
| :--- | :--- |
| 471-F07 | Tạo schema `tenant_<8 ký tự đầu của tenant UUID>_office`; mọi bảng nằm trong schema này. |
| 471-F08 | Bảng `plg_office_documents` đúng cột/kiểu/ràng buộc tại DES-DB §2.1; `size_bytes >= 0`; `status IN ('ACTIVE','ARCHIVED','DELETED')`. |
| 471-F09 | Bảng `plg_office_document_versions` đúng DES-DB §2.2; `UNIQUE (tenant_id, document_id, version_number)`. |
| 471-F10 | Index: `(tenant_id, status, updated_at DESC)`, `(tenant_id, doc_type, status)`, `LOWER(title)`. |
| 471-F11 | Bật RLS + policy theo `current_setting('app.current_tenant_id', true)::uuid`; service vẫn phải lọc `tenant_id` tường minh (phòng vệ 2 lớp). |
| 471-F12 | Mọi truy vấn ghi/đọc đều lấy `tenant_id` từ `SecurityContext`, không nhận từ body/query/path. |

### 2.3 Blob store

| Mã | Yêu cầu |
| :--- | :--- |
| 471-F13 | Key lưu: `<tenantId>/office/<docId>/v<N>_<safeName>`; `<safeName>` chỉ `[A-Za-z0-9._-]`, chặn `..`, `/`, `\`, ký tự điều khiển. |
| 471-F14 | Cấu hình `office.document.storage-dir` (fallback local) và `office.document.bucket` (MinIO/S3) qua `@ConfigProperty`; không hardcode endpoint/bucket. |
| 471-F15 | Stream file 2 chiều, không nạp toàn bộ vào heap khi upload/download; giới hạn `25MB` (Desktop) kiểm tra trước khi ghi. |
| 471-F16 | Tính `SHA-256` khi ghi; lưu `checksum_sha256`, `size_bytes` vào DB; đọc lại kiểm tra khớp. |
| 471-F17 | Xóa mềm không xóa object ngay; object chỉ bị xóa khi purge (ngoài phạm vi task). |

### 2.4 API

| Mã | Yêu cầu |
| :--- | :--- |
| 471-F18 | 8 endpoint đúng DES-API §3, prefix runtime `/api/v1/plugins/runtime/office-webapp`, resource nội bộ `/documents/**`. |
| 471-F19 | `GET /documents`: `page` mặc định 1, `size` mặc định 20 **tối đa 100**; `sort` chỉ nhận whitelist `updated_at:desc`, `updated_at:asc`, `title:asc`, `title:desc`; `q` tìm `ILIKE` trên `title` + `original_filename`; `doc_type`/`status` validate enum. |
| 471-F20 | `POST /documents`: multipart `file` bắt buộc, `title?`, `doc_type?`; trả `201` + `OfficeDocumentDto`; nếu `title` rỗng lấy tên file không đuôi. |
| 471-F21 | `GET /documents/{id}`: chỉ trả bản ghi `tenant_id` hiện tại; không tồn tại → `404 OFFICE_DOCUMENT_NOT_FOUND` (không phân biệt "không có" và "của tenant khác"). |
| 471-F22 | `GET /documents/{id}/content`: `application/octet-stream`, `Content-Disposition: attachment; filename*=UTF-8''<name>`, `ETag: "<sha256>"`, `X-Document-Version: <n>`; hỗ trợ `?version=` (mặc định bản mới nhất). |
| 471-F23 | `PUT /documents/{id}/content`: multipart `file`, `title?`, `change_note?`, `expected_version?`; nếu `expected_version` khác `current_version` → `409 OFFICE_VERSION_CONFLICT` kèm `params.expected_version`, `params.current_version`; thành công tăng version, ghi bảng versions, cập nhật document. |
| 471-F24 | `PATCH /documents/{id}`: đổi `title` (1–255 ký tự, trim) hoặc `status` `ACTIVE`/`ARCHIVED`; không cho set `DELETED` qua PATCH. |
| 471-F25 | `DELETE /documents/{id}`: xóa mềm, trả `{ document_id, status }`; gọi lại lần 2 trả cùng kết quả (idempotent). |
| 471-F26 | `GET /documents/{id}/versions`: trả `{ items: [...] }` sắp xếp `version_number DESC`. |

### 2.5 Kiểm tra file

| Mã | Yêu cầu |
| :--- | :--- |
| 471-F27 | Magic bytes: ZIP `50 4B 03 04`, OLE2 `D0 CF 11 E0 A1 B1 1A E1`, PDF `%PDF-`, CSV: UTF-8 text không chứa byte NUL. Sai → `OFFICE_INVALID_MAGIC_BYTES`. |
| 471-F28 | Đuôi hợp lệ: `docx`, `doc`, `xlsx`, `xls`, `pptx`, `ppt`, `csv`, `pdf`; khác → `OFFICE_UNSUPPORTED_EXTENSION`. |
| 471-F29 | OOXML có magic OLE2 (file mã hóa) → `OFFICE_ENCRYPTED_FILE_UNSUPPORTED`; không lưu. |
| 471-F30 | `size_bytes = 0` → `OFFICE_FILE_REQUIRED`; vượt 25MB → `OFFICE_FILE_TOO_LARGE` với `params.max_mb`, `params.actual_mb`. |

### 2.6 Response & i18n

| Mã | Yêu cầu |
| :--- | :--- |
| 471-F31 | Đúng 4 khuôn mẫu: Single, Paginated, List, Error; key dùng `ResponseKey` enum, không string literal. |
| 471-F32 | Error `errors[]` chỉ chứa `field`, `code`, `params`; **không** chứa câu tiếng Việt/tiếng Anh. |
| 471-F33 | DTO là Java `record`; cấm `Map<String, Object>` trong service/resource. |
| 471-F34 | `code` success: `OFFICE_DOCUMENTS_FETCH_SUCCESS`, `OFFICE_DOCUMENT_CREATED`, `OFFICE_DOCUMENT_SAVED`, `OFFICE_DOCUMENT_DELETED`, `OFFICE_DOCUMENT_SHARED`; lỗi share: `OFFICE_SHARE_SUBJECT_NOT_FOUND`, `OFFICE_FORBIDDEN`. |

### 2.7 Chia sẻ nội bộ ERP (AC-10)

| Mã | Yêu cầu |
| :--- | :--- |
| 471-F35 | Bảng `plg_office_document_permissions`: `id UUID PK`, `tenant_id UUID NOT NULL`, `document_id UUID NOT NULL REFERENCES plg_office_documents(id) ON DELETE CASCADE`, `subject_type VARCHAR(16) CHECK IN ('USER','ROLE')`, `subject_id UUID NOT NULL`, `permission VARCHAR(8) CHECK IN ('READ','WRITE')`, `created_by UUID NOT NULL`, `created_at TIMESTAMPTZ DEFAULT NOW()`. |
| 471-F36 | `UNIQUE (tenant_id, document_id, subject_type, subject_id)`; index `(tenant_id, subject_id, subject_type)` để list file được share. |
| 471-F37 | Người tạo tài liệu (`created_by`) mặc định có `READ` + `WRITE` + quyền quản lý share; không tạo bản ghi ACL cho owner. |
| 471-F38 | `GET /documents/{id}/permissions` trả `{ items: OfficeDocumentPermissionDto[] }`; chỉ owner hoặc user có `office:document:share` được xem. |
| 471-F39 | `PUT /documents/{id}/permissions` nhận danh sách thay thế `{ items: [{subject_type, subject_id, permission}] }`; validate subject tồn tại trong tenant; trả danh sách sau cập nhật. |
| 471-F40 | `DELETE /documents/{id}/permissions/{permissionId}` thu hồi 1 quyền; idempotent. |
| 471-F41 | `GET /documents` trả cả file được share: `created_by = currentUser` **hoặc** tồn tại ACL khớp `subject_type=USER, subject_id=currentUser` **hoặc** `subject_type=ROLE, subject_id IN roles của JWT`. |
| 471-F42 | `GET /documents/{id}` + `/content` yêu cầu `READ`; `PUT /content` + `PATCH` yêu cầu `WRITE`; thiếu quyền → `403 OFFICE_FORBIDDEN`, không lộ metadata. |
| 471-F43 | Không cho share ra ngoài tenant: subject không thuộc tenant → `OFFICE_SHARE_SUBJECT_NOT_FOUND`; tự share cho owner → bỏ qua. |
| 471-F44 | Mọi thay đổi ACL ghi `created_by`/`created_at`; xóa document (mềm) không xóa ACL ngay, khôi phục giữ nguyên quyền. |

## 3. Hợp đồng API (tóm tắt để dev đối chiếu)

| Method | Path | Quyền | Success code | Lỗi chính |
| :--- | :--- | :--- | :--- | :--- |
| GET | `/documents` | read | `OFFICE_DOCUMENTS_FETCH_SUCCESS` | `OFFICE_INVALID_PAGINATION` |
| POST | `/documents` | write | `OFFICE_DOCUMENT_CREATED` | `OFFICE_FILE_REQUIRED`, `OFFICE_FILE_TOO_LARGE`, `OFFICE_INVALID_MAGIC_BYTES`, `OFFICE_ENCRYPTED_FILE_UNSUPPORTED` |
| GET | `/documents/{id}` | read | `OFFICE_DOCUMENTS_FETCH_SUCCESS` | `OFFICE_DOCUMENT_NOT_FOUND` |
| GET | `/documents/{id}/versions` | read | `OFFICE_DOCUMENTS_FETCH_SUCCESS` | `OFFICE_DOCUMENT_NOT_FOUND` |
| GET | `/documents/{id}/content` | read | — (binary) | `OFFICE_DOCUMENT_NOT_FOUND`, `OFFICE_BLOB_NOT_FOUND` |
| PUT | `/documents/{id}/content` | write | `OFFICE_DOCUMENT_SAVED` | `OFFICE_VERSION_CONFLICT`, `OFFICE_FILE_TOO_LARGE`, `OFFICE_INVALID_MAGIC_BYTES` |
| PATCH | `/documents/{id}` | write | `OFFICE_DOCUMENT_SAVED` | `OFFICE_TITLE_REQUIRED` |
| DELETE | `/documents/{id}` | delete | `OFFICE_DOCUMENT_DELETED` | `OFFICE_DOCUMENT_NOT_FOUND` |
| GET | `/documents/{id}/permissions` | share | `OFFICE_DOCUMENTS_FETCH_SUCCESS` | `OFFICE_FORBIDDEN` |
| PUT | `/documents/{id}/permissions` | share | `OFFICE_DOCUMENT_SHARED` | `OFFICE_SHARE_SUBJECT_NOT_FOUND`, `OFFICE_FORBIDDEN` |
| DELETE | `/documents/{id}/permissions/{permissionId}` | share | `OFFICE_DOCUMENT_SHARED` | `OFFICE_DOCUMENT_NOT_FOUND`, `OFFICE_FORBIDDEN` |

## 4. Ma trận kiểm thử JUnit 5 (PostgreSQL + MinIO thật)

| Test class | Ca kiểm thử bắt buộc |
| :--- | :--- |
| `OfficeManifestTest` | checksum migration khớp; thiếu quyền/entity registry → fail |
| `OfficeMigrationTest` | apply V1 trên schema trống; bảng/index/RLS tồn tại; cột đúng kiểu |
| `OfficeMagicBytesTest` | 4 chữ ký hợp lệ; file giả đuôi; OOXML mã hóa; CSV có NUL |
| `OfficeBlobStoreTest` | ghi/đọc/xóa; key có `../` bị chặn; SHA-256 khớp; file 25MB+1 bị chặn |
| `OfficeDocumentResourceTest` | 8 endpoint; 4 khuôn mẫu; phân trang max 100; sort whitelist |
| `OfficeTenantIsolationTest` | tenant A không đọc/sửa/xóa được bản ghi tenant B (404) |
| `OfficeVersionConflictTest` | `expected_version` cũ → 409 đúng `params`; lưu thành công tăng version |
| `OfficeSoftDeleteTest` | DELETE → list mặc định không thấy; `status=DELETED` thấy; gọi lại idempotent |
| `OfficeSharePermissionTest` | share USER/ROLE; list file được share; READ không PUT được; WRITE ghi được; thu hồi; subject tenant khác bị chặn |

## 5. Acceptance checklist

- [ ] AC-471-01 `mvn -f plugins/pom.xml -pl office-webapp -am test` → `BUILD SUCCESS`, 0 test bỏ qua.
- [ ] AC-471-02 `plugin.json` checksum khớp migration; sửa 1 byte migration → cài đặt fail.
- [ ] AC-471-03 Upload 1 `.docx` thật → `201`, DB có bản ghi, object storage có key đúng định dạng.
- [ ] AC-471-04 `GET /documents` trả đúng `{ items, page, size, total_items, total_pages }`, không trả `content`/`total_elements`.
- [ ] AC-471-05 `GET /content` có `ETag`, `X-Document-Version`, `Content-Disposition` đúng tên file Unicode.
- [ ] AC-471-06 `PUT` với `expected_version` cũ → 409, không tạo version mới.
- [ ] AC-471-07 Upload file `.docx` thực chất là OLE2 → `OFFICE_ENCRYPTED_FILE_UNSUPPORTED`, không ghi object.
- [ ] AC-471-08 Tenant B gọi `GET /documents/{id}` của tenant A → 404, log không lộ dữ liệu.
- [ ] AC-471-09 Response lỗi không chứa câu tiếng Việt; `errors[].code` là `UPPER_SNAKE_CASE`.
- [ ] AC-471-10 `grep -r "Map<String, Object>" plugins/office-webapp/src/main` → 0 kết quả.
- [ ] AC-471-11 Share USER quyền `READ`: user thấy file trong `GET /documents`, mở content được, `PUT /content` trả 403.
- [ ] AC-471-12 Share ROLE quyền `WRITE`: user có role ghi được version mới; user không có role bị 403.
- [ ] AC-471-13 Thu hồi quyền: file biến khỏi list của user, `GET /content` trả 403/404.
- [ ] AC-471-14 Share subject thuộc tenant khác → `OFFICE_SHARE_SUBJECT_NOT_FOUND`, không tạo bản ghi.
- [ ] AC-471-15 User không phải owner và không có `office:document:share` gọi `GET /permissions` → 403.

## 6. Bằng chứng bàn giao

| File | Nội dung |
| :--- | :--- |
| `08_testing/evidence/task-471-mvn-test.log` | Log test xanh |
| `08_testing/evidence/task-471-curl.md` | 8 lệnh curl + response thật (đã che token) |
| `08_testing/evidence/task-471-db.md` | `\d+ plg_office_documents` + 3 dòng dữ liệu mẫu |
| `08_testing/evidence/task-471-storage.md` | Danh sách object key trên MinIO/local |

## 7. Ngoài phạm vi

- Quét virus/malware, watermark, chuyển đổi định dạng phía server.
- Chia sẻ link ngoài tenant, bình luận thảo luận trên tài liệu (khác Word Comment), co-authoring lock.
- Purge object đã xóa mềm, retention policy.
- Tìm kiếm full-text trong nội dung file.

## 8. Rủi ro & cách xử lý

| Rủi ro | Cách xử lý |
| :--- | :--- |
| RLS làm test cross-tenant khó tái lập | Test dùng 2 tenant seed sẵn, set `app.current_tenant_id` đúng như Core |
| Upload lớn gây OOM | Stream 2 chiều, chặn theo `Content-Length` + đọc tối đa 25MB+1 |
| Checksum lệch do CRLF | Chuẩn hóa LF trước khi băm, có test riêng |
| MinIO không sẵn ở máy dev | Fallback local qua `office.document.storage-dir`, cùng interface |

## 9. Lịch sử

| Phiên bản | Ngày | Thay đổi | Nguồn |
| :--- | :--- | :--- | :--- |
| 0.1 | 2026-11-15 | Phân rã task từ Design 1.0 | Developer |
| 0.2 | 2026-11-15 | Đặc tả chi tiết 34 FR, 10 AC, ma trận test, bằng chứng và phạm vi loại trừ | BA/Architect; review theo BENCH-S12-003 |
| 0.3 | 2026-11-15 | Bổ sung ACL chia sẻ nội bộ ERP (`F35–F44`), 3 endpoint permissions, `AC-11–AC-15` theo quyết định R2 | Chủ dự án; 8 câu hỏi tương tác |
