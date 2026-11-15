# [ADR-S12-001] Quyết định kiến trúc: Bộ giải mã OOXML, OLE2 & PDF tự xây dựng 100% (Zero-Third-Party)

| Trường | Giá trị |
| :--- | :--- |
| ID / loại / sprint | ADR-S12-001 / Quyết định kiến trúc / Sprint 12 |
| Trạng thái / phiên bản / cập nhật | **✅ APPROVED 1.0 / 2026-11-15** — chủ dự án duyệt thiết kế qua hội thoại trực tiếp |
| Owner / reviewer | Solution Architect / Self-reviewed |
| Đầu vào | [CONF-S12-001](../04_confirmation/01_CONF-S12-001_sprint_12_scope_and_ac.md) 1.0 (`AC-01`, `AC-02`, `AC-08`), [SOL-S12-001](01_SOL-S12-001_office_webapp_architecture.md) 0.1 |
| Đọc trước / đọc tiếp | [SOL-S12-001](01_SOL-S12-001_office_webapp_architecture.md) / [ADR-S12-002](03_ADR-S12-002_m365_hybrid_canvas_dom_rendering.md) |

## 1. Bối cảnh và vấn đề

Chủ dự án yêu cầu xây dựng plugin `office-webapp` **tự làm từ đầu và không phụ thuộc vào thư viện Office/Editor bên thứ 3** (`BR-O09`, `AC-01`), đồng thời hỗ trợ đa dạng định dạng gồm OOXML (`.docx`, `.xlsx`, `.pptx`), văn bản phân tách (`.csv`), nhị phân Office cũ (`.doc`, `.xls`, `.ppt`) và `.pdf` hoàn toàn ở phía trình duyệt.

Cần quyết định kỹ thuật cụ thể để đọc/ghi toàn bộ các định dạng này chỉ bằng TypeScript thuần và Web APIs có sẵn trên trình duyệt hiện đại (Edge/Chrome/Firefox/Safari) mà không cài đặt thêm gói npm nào (`JSZip`, `SheetJS`, `pdf.js`, `mammoth`, v.v.).

## 2. Phương án lựa chọn

1. **OOXML Container (`OoxmlZipContainer`)**:
   - **Đọc ZIP**: Đọc ngược từ cuối `Uint8Array` để tìm `End of Central Directory (EOCD - 0x06054b50)`, phân tích bảng `Central Directory`, ánh xạ tới từng `Local File Header`. Hỗ trợ method `0` (STORE) và method `8` (DEFLATE).
   - **Giải nén & Nén DEFLATE**: Sử dụng Web Streams API chuẩn W3C `DecompressionStream('deflate-raw')` và `CompressionStream('deflate-raw')` chạy native bằng mã máy của trình duyệt (tốc độ gần bằng C++, dung lượng code wrapper < 350 dòng TypeScript).
   - **CRC-32**: Bảng tra 256 phần tử chuẩn IEEE 802.3 (`0xEDB88320`) viết thuần TS để kiểm chứng toàn vẹn từng entry khi đọc và ghi đúng header ZIP khi xuất file.
   - **XML Parse/Serialize**: Dùng `DOMParser().parseFromString(xml, 'application/xml')` và `XMLSerializer().serializeToString(doc)` chuẩn trình duyệt; bảo toàn nguyên gốc các file media/theme/rels chưa chỉnh sửa trong từ điển `Map<string, Uint8Array>`.

2. **Legacy Binary OLE2 (`LegacyOle2Reader`) cho `.doc`, `.xls`, `.ppt`**:
   - **Cơ chế**: Kiểm tra magic bytes `D0 CF 11 E0 A1 B1 1A E1`. Tự viết bộ đọc bảng phân bổ sector (`DIFAT` → `FAT` → `MiniFAT` → `Directory`) để giải mã luồng nhị phân:
     - `.xls` (BIFF8): Giải mã `Workbook` stream (hỗ trợ các record `BOF`, `BOUNDSHEET`, `SST`, `EXTSST`, `ROW`, `NUMBER`, `RK`, `MULRK`, `LABELSST`, `FORMULA` lấy giá trị/biểu thức cơ bản).
     - `.doc` (WordBinary): Đọc `FIB` (File Information Block) → xác định bảng `CLX` / Piece Table trong `0Table`/`1Table` để trích xuất văn bản UTF-16LE / Windows-1252 theo đoạn (`\r`, `\x07` bảng).
     - `.ppt` (PPTBinary): Duyệt cây record 8-byte trong stream `PowerPoint Document` tìm `SlideListWithText` / `TextCharsAtom` / `TextBytesAtom`.
   - **Giới hạn có chủ đích (Graceful Degradation)**: File nhị phân cũ được ánh xạ sang mô hình dữ liệu chuẩn nội bộ để xem và sửa; khi lưu/tải xuống sẽ xuất ra chuẩn OOXML hiện đại (`.docx`, `.xlsx`, `.pptx`) kèm thông báo non-blocking (`OFFICE_LEGACY_EXPORT_AS_OOXML`). File mã hóa mật khẩu trả lỗi `OFFICE_ENCRYPTED_FILE_UNSUPPORTED`.

3. **PDF Viewer (`ClientPdfReader`) cho `.pdf`**:
   - **Cơ chế Dual-Mode In-House**:
     - Tầng 1 (**Native Browser PDF Engine via Blob URL** trên Desktop): Tạo Blob URL an toàn (`application/pdf`) nhúng `<object>`/`<iframe>` sandbox cho trình duyệt Edge/Chrome hiển thị trọn vẹn 100% font nhúng, chữ ký, vector phức tạp khi ở chế độ đọc nhanh, **0 thư viện thứ 3**.
     - Tầng 2 (**Pure TS PDF Parser** cho trích xuất metadata/text/preview trên Canvas & Mobile Ionic): Đọc `xref`, cây `/Pages`, giải nén stream `/Filter /FlateDecode` qua `DecompressionStream('deflate')` để lấy số trang, mục lục và nội dung văn bản cơ bản khi chạy trên Mobile WebView không hỗ trợ PDF plugin nhúng.

## 3. Hệ quả và cách kiểm chứng

- **Lợi ích**: `plugins/office-webapp/web/package.json` chỉ dùng đúng `@angular/*` và `@shared/*` của workspace — **0 dependency bên thứ 3**, kích thước bundle cực gọn (< 300KB chưa gzip cho toàn bộ engine), không rủi ro bản quyền (MIT/AGPL/Commercial).
- **Đánh đổi**: Một số hiệu ứng đồ họa siêu phức tạp trong `.doc`/`.ppt` (SmartArt 3D, WordArt cũ) hoặc `.pdf` scan/font Type3 tùy biến ở Tầng 2 Mobile sẽ chỉ trích xuất được text/trang cơ bản (trên Desktop có Tầng 1 xử lý trọn vẹn).
- **Kiểm chứng**: Round-trip test mở file `.docx`/`.xlsx`/`.pptx` thật tạo từ Microsoft Office Desktop → sửa → xuất → mở lại trên Microsoft Office không báo lỗi hỏng file (`Corrupted file repair`).
