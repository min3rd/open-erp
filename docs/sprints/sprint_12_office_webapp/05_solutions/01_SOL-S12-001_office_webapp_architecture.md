# [SOL-S12-001] Giải pháp tổng thể: Plugin Office WebApp (`office-webapp`)

| Trường | Giá trị |
| :--- | :--- |
| ID / loại / sprint | SOL-S12-001 / Giải pháp tổng thể / Sprint 12 |
| Trạng thái / phiên bản / cập nhật | **✅ APPROVED 1.0 / 2026-11-15** — chủ dự án duyệt thiết kế qua hội thoại trực tiếp |
| Owner / reviewer | Solution Architect / Self-reviewed (chờ Chủ dự án duyệt Design ready) |
| Đầu vào | [CONF-S12-001](../04_confirmation/01_CONF-S12-001_sprint_12_scope_and_ac.md) 1.0 (APPROVED), [BENCH-S12-001](../03_benchmarks/01_BENCH-S12-001_office_webapp_benchmarks.md) 0.4, [ANL-S12-001](../02_analysis/01_ANL-S12-001_office_webapp_plugin.md) 0.2 |
| Đọc trước / đọc tiếp | [CONF-S12-001](../04_confirmation/01_CONF-S12-001_sprint_12_scope_and_ac.md) / [ADR-S12-001](02_ADR-S12-001_zero_third_party_ooxml_and_legacy_engine.md), [ADR-S12-002](03_ADR-S12-002_m365_hybrid_canvas_dom_rendering.md), [DES-ARCH-S12-001](../06_designs/arch/01_DES-ARCH-S12-001_components_and_flows.md) |

## 1. Mục đích và bối cảnh nền tảng

Tài liệu thiết kế phương án kiến trúc tổng thể cho plugin `office-webapp` đáp ứng 100% Scope & 8 Acceptance Criteria (`AC-01`–`AC-08`) đã được chủ dự án phê duyệt tại [CONF-S12-001](../04_confirmation/01_CONF-S12-001_sprint_12_scope_and_ac.md).

### Ràng buộc kiến trúc hiện hữu của dự án (đã kiểm chứng trong repo)
1. **Plugin Platform (Sprint 03 / 06)**: Mỗi plugin độc lập đặt trong `plugins/<plugin-id>/` với `plugin.json` (`schema_version: "2.0"`), backend Quarkus Java 21 (Maven module), migration SQL theo tenant schema `tenant_<id8>_<plugin>`, và frontend đóng gói dạng Web Component (`entry: "/plugins-runtime/<plugin-id>/main.js"`, `tag_name: "op-office-webapp-app"`, route `/apps/office`) tích hợp `@shared` (`src/frontend/shared/`).
2. **Gateway & Tenant Isolation**: Mọi request runtime từ Web/Mobile đi qua Core `PluginRuntimeGateway` (`/api/v1/plugins/runtime/office-webapp/**`), Core xác thực JWT, kiểm tra quyền và `tenant_id` (tuyệt đối không tin `tenant_id` từ client).
3. **Minimal Dev Footprint vs Full MinIO Storage**: `npm run infra` chỉ chạy PostgreSQL + Redis mặc định; profile `storage` bật MinIO (`ObjectStorage` / `TenantFileStorage`). Do đó, phần lưu trữ file tùy chọn của plugin phải hỗ trợ S3/MinIO khi bật profile `storage` và fallback thư mục cục bộ cấu hình qua `@ConfigProperty` (giống pattern `plugins/employee/EmployeeService`) để chạy ổn định trên môi trường dev tối giản.
4. **Ràng buộc Zero-Third-Party (`BR-O09`, `AC-01`)**: `package.json` của phần web plugin `office-webapp` **tuyệt đối không cài đặt thư viện Office/Editor/ZIP/PDF bên thứ 3** (không Univer, SheetJS, JSZip, pdf.js, docx-preview, Tiptap, ProseMirror, Quill). Toàn bộ bộ đọc/ghi file, tính toán công thức và bề mặt render đều tự xây bằng TypeScript + Angular >= 22 + Web APIs chuẩn.

## 2. Kiến trúc tổng thể (Client-First Hybrid + Optional ERP Storage)

```
┌──────────────────────────────────────────────────────────────────────────────┐
│                 TRÌNH DUYỆT (Desktop Web Angular 22 / Mobile Ionic 8)        │
│                                                                              │
│  ┌────────────────────────────────────────────────────────────────────────┐  │
│  │ Office Shell UI (@shared tokens, Single/Classic Ribbon, File Dropdown) │  │
│  └───┬──────────────────────┬───────────────────────┬─────────────────────┘  │
│      │                      │                       │                        │
│  ┌───▼───────────┐   ┌──────▼──────────────┐  ┌─────▼─────────────────────┐  │
│  │ Word Engine   │   │ Excel Engine        │  │ PowerPoint & PDF Engines  │  │
│  │ div.Page      │   │ Tiled <canvas> Grid │  │ Split-Screen + 16:9 Stage │  │
│  │ Canvas/DOM    │   │ Web Worker Calc     │  │ SVG Selection Overlay     │  │
│  │ contentedit   │   │ Formula AST + Quill │  │ Slideshow + PDF Canvas    │  │
│  └───┬───────────┘   └──────┬──────────────┘  └─────┬─────────────────────┘  │
│      └──────────────────────┼───────────────────────┘                        │
│                             ▼                                                │
│  ┌────────────────────────────────────────────────────────────────────────┐  │
│  │        In-House Binary & XML Core (100% Zero-Third-Party TS)           │  │
│  │  • OoxmlZipContainer (Uint8Array + CRC32 + Compression/Decompression)  │  │
│  │  • XmlModelBridge (DOMParser / XMLSerializer)                          │  │
│  │  • LegacyOle2Reader (CFBF FAT/MiniFAT → .doc/.xls/.ppt text/table)     │  │
│  │  • ClientPdfReader (Xref/Stream/FlateDecode → Canvas text/image)       │  │
│  └──────────────┬───────────────────────────────────────┬─────────────────┘  │
│                 │ Local I/O & Draft                     │ Optional ERP Sync  │
│   ┌─────────────▼──────────────┐                        │ (Chỉ khi user chọn │
│   │ File System Access API     │                        │  Mở/Lưu ERP Cloud) │
│   │ + <input type="file">      │                        │                    │
│   │ + IndexedDB Draft Store    │                        │                    │
│   └────────────────────────────┘                        │                    │
└─────────────────────────────────────────────────────────┼────────────────────┘
                                                          │ Bearer JWT + HTTPS
                                                          ▼
┌──────────────────────────────────────────────────────────────────────────────┐
│              Core Gateway (/api/v1/plugins/runtime/office-webapp/**)         │
│                    (Xác thực JWT, RBAC, ép tenant_id context)                 │
└─────────────────────────────────────────────────────────┬────────────────────┘
                                                          ▼
┌──────────────────────────────────────────────────────────────────────────────┐
│           Backend Plugin: plugins/office-webapp (Quarkus Java 21)            │
│  • Metadata: PostgreSQL (tenant_<id8>_office.plg_office_documents + versions)│
│  • Binary Blob: MinIO / S3 Object Storage (fallback PVC/local dir)           │
│  • ZERO server-side document conversion / parsing (chỉ lưu & stream bytes)   │
└──────────────────────────────────────────────────────────────────────────────┘
```

## 3. Phân rã giải pháp theo 5 phân hệ kỹ thuật

### 3.1. Phân hệ 1 — `OoxmlZipContainer` & `XmlModelBridge` (Zero-Dependency)
- **Đọc/ghi ZIP (`.docx`, `.xlsx`, `.pptx`)**:
  - Tự xây dựng `ZipArchiveReader` / `ZipArchiveWriter` trên `Uint8Array` + `DataView`: đọc `End of Central Directory (0x06054b50)`, duyệt `Central Directory (0x02014b50)`, đọc `Local File Header (0x04034b50)`, tính và kiểm tra bảng `CRC-32`.
  - Giải nén method `8` (DEFLATE) bằng Web Streams API chuẩn trình duyệt `new DecompressionStream('deflate-raw')`; nén lại bằng `new CompressionStream('deflate-raw')` (chạy tốt trên Edge, Chrome, Firefox >= 113, Safari >= 16.4 — fallback `STORE` method `0` nếu dữ liệu không nén hoặc môi trường test cần lưu không nén).
- **Xử lý XML**: Dùng `DOMParser` và `XMLSerializer` chuẩn trình duyệt để đọc/ghi các phần chuẩn OOXML (`[Content_Types].xml`, `_rels/.rels`, `word/document.xml`, `word/styles.xml`, `xl/workbook.xml`, `xl/sharedStrings.xml`, `xl/styles.xml`, `xl/worksheets/sheet*.xml`, `ppt/presentation.xml`, `ppt/slides/slide*.xml`).
- **Bảo toàn dữ liệu không chỉnh sửa (Round-Trip Preservation)**: Khi sửa một phần tử trong file `.docx`/`.xlsx`/`.pptx` gốc, mọi entry chưa đụng tới (như ảnh trong `word/media/*`, theme, chart XML gốc, relationships) được giữ nguyên vẹn byte-for-byte khi đóng gói lại ZIP để giảm tối đa sai lệch so với Microsoft Office Desktop.

### 3.2. Phân hệ 2 — `LegacyOle2Reader` (`.doc`, `.xls`, `.ppt`) & `ClientPdfReader` (`.pdf`)
Giải quyết thẳng rủi ro kỹ thuật đã nêu trong `CONF-S12-001 §3`:
- **OLE2 Compound File Binary (`D0 CF 11 E0 A1 B1 1A E1`)**:
  - Tự cài đặt `Ole2Container` đọc header 512-byte, bảng `DIFAT` → `FAT` → `MiniFAT` và cây `Directory Entries` để trích xuất các stream chính:
    - `.xls` (**BIFF8**): đọc stream `Workbook`, giải mã `SST` (Shared String Table), `BOUNDSHEET`, `ROW`, `NUMBER`, `RK`, `MULRK`, `LABELSST`, `FORMULA` (giá trị cached) → chuyển trực tiếp sang `ExcelWorkbookModel` để xem & sửa bình thường rồi lưu thành `.xlsx`.
    - `.doc` (**WordBinary**): đọc stream `WordDocument` + `1Table`/`0Table` (FIB + `PlcfBte` / Piece Table `CLX`) để trích xuất đoạn văn bản Unicode/CP1252, ngắt đoạn, bảng đơn giản → chuyển sang `WordDocumentModel` (hiển thị cảnh báo `OFFICE_LEGACY_CONVERT_NOTICE` khi lưu sang `.docx`).
    - `.ppt` (**PPTBinary**): đọc stream `PowerPoint Document` duyệt các Record Header 8-byte (`SlideAtom`, `TextCharsAtom`, `TextBytesAtom`) để trích xuất danh sách slide & nội dung chữ → chuyển sang `PptPresentationModel`.
  - Nếu gặp file `.doc`/`.xls`/`.ppt` mã hóa (`fEncrypted = 1`) hoặc cấu trúc quá cũ (Word 95 / BIFF5): trả mã lỗi chuẩn `OFFICE_ENCRYPTED_FILE_UNSUPPORTED` hoặc `OFFICE_LEGACY_UNSUPPORTED_VERSION`, không treo UI.
- **PDF Client Viewer (`.pdf`)**:
  - Tự viết bộ parser nhẹ (`ClientPdfReader`) đọc `%PDF-` header, `xref` / `startxref`, `Catalog` → `Pages`, stream `FlateDecode` (qua `DecompressionStream('deflate')` — zlib), dựng đối tượng trang PDF.
  - Kết hợp cơ chế **Dual Strategy**: render văn bản/ảnh stream trích xuất được lên `<canvas>` chuẩn Open-ERP (để hỗ trợ Mobile Ionic đồng nhất và zoom/đếm trang) kèm chế độ chuyển nhanh sang `<object type="application/pdf">` (trình render PDF gốc của Edge/Chrome qua Blob URL) khi người dùng mở file PDF chứa font nhúng phức tạp / vector nặng, đảm bảo xem chính xác 100% trên Desktop mà vẫn **0 thư viện thứ 3**.

### 3.3. Phân hệ 3 — Ba Engine Tài liệu Mô phỏng Microsoft 365 Web ([ADR-S12-002](03_ADR-S12-002_m365_hybrid_canvas_dom_rendering.md))
- **Word (`WordDocumentEngine`)**: Tái hiện `div.Page` (`816×1056px`, CSS `contain: size layout`, lề `96px`), render khối văn bản/bảng/ảnh với lớp nhập liệu `[contenteditable="true"]` chuẩn hóa về AST `WordDocumentModel`, Command Pattern cho Undo/Redo không giới hạn, Find/Replace, Export `.docx` / `.md` / Print-PDF.
- **Excel (`ExcelWorkbookEngine`)**: Tái hiện kiến trúc **Tiled `<canvas>` Grid** (header cột, header hàng, lưới ô ảo hóa theo viewport 560px) + **Web Worker** (`office-calc.worker.ts`) chạy Formula Engine tự viết (Tokenizer → Shunting-Yard AST → Dependency Graph DAG chống tham chiếu vòng `#REF!`/`#CIRC!` + 40+ hàm phổ biến) + `[contenteditable]` cell overlay đồng bộ 2 chiều với Formula Bar. Export `.xlsx` / `.csv` / Print-PDF.
- **PowerPoint (`PptPresentationEngine`)**: Tái hiện **Split-Screen** (Thumbnail Panel trái thu gọn được bằng `Ctrl+\` + Slide Stage 16:9 `<canvas>` ở giữa + Notes Bar đáy) + **SVG Selection Overlay** (`<svg>` với `<g class="selectionsvgggroup">` 8 tay nắm resize/move) + `[contenteditable]` text frame + Fullscreen Slideshow API. Export `.pptx` / JPEG từng slide (`canvas.toBlob('image/jpeg')`) / Print-PDF.

### 3.4. Phân hệ 4 — Local Persistence & Draft Recovery (`IndexedDB` + File System Access API)
- **Mở/Lưu Local**: Ưu tiên `window.showOpenFilePicker()` / `window.showSaveFilePicker()` để hỗ trợ **`Ctrl+S` lưu đè trực tiếp file gốc** trên Edge/Chrome mà không cần hỏi chọn đường dẫn lại; tự động fallback về `<input type="file">` + `Blob` Download trên Firefox/Safari/Mobile.
- **Nháp tự động (`IndexedDB`)**: Mỗi thao tác sửa kích hoạt debounce 1500ms ghi snapshot nháp (`ArrayBuffer` + `docType` + `fileName` + `sourceRef` + `updatedAt`) vào IndexedDB (`open_erp_office_drafts`). Khi mở lại trang hoặc F5, hiển thị thanh banner khôi phục nháp (Anti-Modal) kèm nút khôi phục hoặc xóa nháp.

### 3.5. Phân hệ 5 — Backend Storage Tối giản (`plugins/office-webapp`, tùy chọn ERP Cloud)
- Chỉ phục vụ khi người dùng chủ động bấm **"Mở từ ERP Storage"** hoặc **"Lưu lên ERP Storage"** (`Q6`).
- Tuyệt đối không chứa logic đọc/ghi/convert OOXML trên Java server — Backend chỉ lưu binary thô + metadata (`plg_office_documents`, `plg_office_document_versions`) gắn `tenant_id` từ JWT, tính SHA-256 kiểm toàn vẹn, kiểm tra dung lượng tối đa (mặc định 25MB) và magic bytes an toàn.

## 4. Đánh giá rủi ro & Phương án giảm thiểu

| Rủi ro | Mức độ | Biện pháp kỹ thuật |
| :--- | :--- | :--- |
| Parsing `.doc`/`.xls`/`.ppt`/`.pdf` nhị phân phức tạp gây lag hoặc lỗi file lạ | High | Chạy toàn bộ parser trong **Web Worker** với timeout/guardrail dung lượng; file nhị phân lỗi trả mã cảnh báo rõ ràng + fallback đọc từng phần an toàn (`BR-O06`); PDF có chế độ Blob native view dự phòng. |
| File Excel lớn (10.000+ ô / nhiều công thức) gây khựng UI | High | Dùng **Tiled `<canvas>` virtualization** (chỉ vẽ vùng nhìn thấy) + **Web Worker** tính DAG công thức bất đồng bộ. |
| Độ trễ đồng bộ khi sửa Word nhiều trang | Medium | Cô lập từng trang bằng CSS `contain: size layout` đúng như Word Web đã reverse-engineer; chỉ re-layout từ trang bị sửa trở xuống. |
| Rò rỉ file giữa các Tenant khi lưu trên ERP Storage | Critical | `tenant_id` luôn lấy từ `SecurityContext`/Core gateway, mọi query có `WHERE tenant_id = :tenantId` + prefix object key `<tenantId>/office/<docId>/...`. |

## 5. Truy vết AC → Giải pháp

| AC | Giải pháp đáp ứng |
| :--- | :--- |
| `AC-01` | Module hóa 100% trong `plugins/office-webapp/` + `web/package.json` 0 dependency Office/Editor bên thứ 3 |
| `AC-02` | Toàn bộ Open/Parse/Render/Edit/Export local thực thi trong trình duyệt; Network tab = 0 upload payload |
| `AC-03` | `plugins/office-webapp` Backend Quarkus + `plg_office_documents` (`tenant_<id8>_office`) + `TenantStorage` |
| `AC-04` | `OfficeShellComponent` dùng `@shared` tokens, `SingleLine`/`Classic` Ribbon, Compact `File` Dropdown, i18n 100% |
| `AC-05` | `WordDocumentEngine` + `div.Page` + Find/Replace + Undo/Redo + Export `.docx`/`.md`/PDF |
| `AC-06` | `ExcelWorkbookEngine` + Tiled `<canvas>` + Calc Worker (40+ hàm) + Formula Bar + Export `.xlsx`/`.csv`/PDF |
| `AC-07` | `PptPresentationEngine` + Split-Screen + SVG Selection Overlay + Slideshow + Export `.pptx`/JPEG/PDF |
| `AC-08` | `LegacyOle2Reader` + `ClientPdfReader` + `OfficeDraftIndexedDbService` + Mobile Ionic Viewer tối giản (`390×844`) |

## 6. Lịch sử

| Phiên bản | Ngày | Thay đổi | Nguồn |
| :--- | :--- | :--- | :--- |
| 0.1 | 2026-11-15 | Thiết kế giải pháp tổng thể Sprint 12 từ `CONF-S12-001` 1.0 & `BENCH-S12-001` 0.4 | Solution Architect |
