# TASK-472: Xây dựng Lõi Nhị phân Thuần TypeScript Zero-Third-Party (`OOXML/ZIP`, `OLE2`, `PDF`, `CSV`, `Magic Bytes`)

| Trường | Giá trị |
| :--- | :--- |
| **ID** | `TASK-472` |
| **Thuộc Feature** | [FEAT-48](./FEAT-48_office_storage_and_pure_ts_binary_core.md) |
| **Loại** | Frontend Core Engine (Pure TypeScript, Zero Third-Party) |
| **Ưu tiên** | Critical |
| **Trạng thái** | `Open` |
| **Phụ thuộc** | `CONF-S12-001` (`1.0`), `ADR-S12-001` (`1.0`), `DES-ARCH-S12-001` (`1.0`) |
| **Owner** | Developer Agent |
| **Tài liệu nguồn** | [CONF-S12-001](../04_confirmation/01_CONF-S12-001_sprint_12_scope_and_ac.md), [ADR-S12-001](../05_solutions/02_ADR-S12-001_zero_third_party_ooxml_and_legacy_engine.md), [DES-ARCH-S12-001](../06_designs/arch/01_DES-ARCH-S12-001_components_and_flows.md) |

---

## 1. Phạm vi Công việc

Khởi tạo module frontend tại `plugins/office-webapp/web/` với `package.json` và `tsconfig.json` (bảo đảm **0 thư viện xử lý Office/ZIP/PDF/Editor bên thứ 3**) và xây dựng hoàn chỉnh 7 module cốt lõi dưới `plugins/office-webapp/web/src/app/core/binary/`:

1. `crc32.ts`: Tính CRC-32 chuẩn IEEE 802.3 bằng bảng tra 256 phần tử cho ZIP Local File Header / Central Directory / EOCD.
2. `magic-bytes.ts`: Nhận diện và đối chiếu chữ ký nhị phân (PKZIP, OLE2/CFB, PDF `%PDF-`, UTF-8 BOM / CSV text), phát hiện file giả mạo đuôi (`OFFICE_MAGIC_BYTES_MISMATCH`) và phát hiện gói OOXML mã hóa (`OFFICE_ENCRYPTED_FILE_UNSUPPORTED`).
3. `ooxml-zip-container.ts`: Parser & Serializer chuẩn ZIP dựa hoàn toàn trên Web Streams API (`CompressionStream('deflate-raw')` / `DecompressionStream('deflate-raw')`), hỗ trợ Store (`0`) và Deflate (`8`), đọc/ghi Local File Header, Central Directory, EOCD, UTF-8 filename flag (`0x0800`), phát hiện Zip Bomb / Zip Slip (`../`).
4. `xml-model-bridge.ts`: Bọc `DOMParser` & `XMLSerializer` với namespace chuẩn OOXML (`w:`, `x:`, `p:`, `a:`, `r:`, `rel:`), cung cấp các helper đọc/tạo node an toàn tránh XSS/XXE và giữ nguyên XML phần chưa chỉnh sửa khi round-trip.
5. `csv-codec.ts`: Parser/Serializer RFC 4180 thuần TypeScript, nhận diện delimiter (`,`, `;`, `\t`), tự động xử lý UTF-8 BOM + tiếng Việt có dấu.
6. `legacy-ole2-reader.ts`: Bộ đọc header, FAT/DIFAT sectors và Directory Entries chuẩn Microsoft Compound File Binary Format (`D0 CF 11 E0 A1 B1 1A E1`) cho `.doc`, `.xls`, `.ppt` nhằm trích xuất luồng text/stream cơ bản và xác định ranh giới chỉ-đọc/chuyển đổi an toàn.
7. `client-pdf-reader.ts`: Bộ phân tích cấu trúc đối tượng PDF (`xref`, `trailer`, `/Root`, `/Pages`, `/Page`, stream `FlateDecode` qua `DecompressionStream('deflate')`, trích xuất nội dung text operator `BT/ET`, `Tj`, `TJ`, `Tf`, `Tm`/`Td` và tài nguyên ảnh cơ bản) phục vụ trình xem PDF không dùng PDF.js.

---

## 2. Tiêu chí Nghiệm thu & Kiểm chứng

- Kiểm tra `plugins/office-webapp/web/package.json`: không có dependency nào ngoài nhóm `@angular/*` / `rxjs` / runtime Angular chuẩn nếu cần biên dịch (tuyệt đối không có `jszip`, `fflate`, `mammoth`, `xlsx`, `sheetjs`, `pptxgenjs`, `pdfjs-dist`, `tiptap`, `quill`, `prosemirror`, `luckysheet`, v.v.).
- Biên dịch TypeScript nghiêm ngặt `tsc -p plugins/office-webapp/web/tsconfig.json --noEmit` đạt 0 lỗi.
- Thực hiện kiểm thử khói (Node/TS verification script chạy nhất thời rồi dọn sạch, không tạo file `.spec.ts` trong repo) xác nhận round-trip ZIP + Deflate + CRC32, phát hiện Zip Slip, giải mã/mã hóa CSV UTF-8 BOM, nhận diện Magic Bytes & OLE2 Header.
