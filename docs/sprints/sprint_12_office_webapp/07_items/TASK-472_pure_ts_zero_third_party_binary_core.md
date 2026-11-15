# TASK-472: Lõi Nhị phân Thuần TypeScript (`OOXML/ZIP`, `OLE2`, `PDF`, `CSV`, `Magic Bytes`) & Worker Parse

| Trường | Giá trị |
| :--- | :--- |
| **ID** | `TASK-472` |
| **Thuộc Feature** | [FEAT-48](./FEAT-48_office_storage_and_pure_ts_binary_core.md) |
| **Loại** | Frontend Core Engine (TypeScript thuần, 0 thư viện ngoài) |
| **Ưu tiên** | Critical |
| **Trạng thái** | `Open` — đặc tả chi tiết 0.2, chờ chủ dự án review |
| **Phụ thuộc** | `ADR-S12-001` 1.0, `DES-ARCH-S12-001` 1.0 |
| **Owner** | Developer Agent |
| **Tài liệu nguồn** | [ADR-S12-001](../05_solutions/02_ADR-S12-001_zero_third_party_ooxml_and_legacy_engine.md), [DES-ARCH-S12-001](../06_designs/arch/01_DES-ARCH-S12-001_components_and_flows.md), [BENCH-S12-003](../03_benchmarks/03_BENCH-S12-003_m365_feature_matrix.md) |

---

## 0. Kết quả bàn giao

1. 7 module lõi chạy trong browser lẫn Node (để test), **0 dependency** xử lý ZIP/XML/PDF/OLE2.
2. `npm run office:roundtrip` in bảng PASS/FAIL cho 12 fixture; round-trip file không sửa cho ra nội dung tương đương (hash phần XML không đổi).
3. Worker `office-parse.worker.ts` parse file ≥ 10MB mà main thread không block > 50ms/lần.
4. `part-coverage.json` chứng minh 100% part của 12 fixture được parse hoặc preserve; round-trip không mất part.

## 1. Phạm vi file

| Đường dẫn | Nội dung |
| :--- | :--- |
| `plugins/office-webapp/web/package.json` | Chỉ `@angular/*`, `rxjs`, `typescript`; **0** lib Office/ZIP/PDF |
| `plugins/office-webapp/web/tsconfig.json` | `strict`, alias `@shared/*` |
| `.../core/binary/crc32.ts` | CRC-32 IEEE, bảng 256 |
| `.../core/binary/magic-bytes.ts` | Nhận diện + đối chiếu chữ ký |
| `.../core/binary/ooxml-zip-container.ts` | Đọc/ghi ZIP |
| `.../core/binary/xml-model-bridge.ts` | DOMParser/XMLSerializer + helper namespace |
| `.../core/binary/csv-codec.ts` | RFC 4180 |
| `.../core/binary/legacy-ole2-reader.ts` | CFB header/FAT/DIFAT/directory/stream |
| `.../core/binary/client-pdf-reader.ts` | xref/trailer/page tree/stream/text |
| `.../core/binary/ooxml-part-catalog.ts` | Inventory part + `part-coverage.json` |
| `.../core/binary/embedded-objects.ts` | Chart/embedded workbook/SmartArt/media/ink passthrough |
| `.../core/workers/office-parse.worker.ts` | Message protocol parse/serialize |
| `.../core/binary/types.ts` | `BinaryParseResult`, `ParseWarning`, `OfficeError` |
| `plugins/office-webapp/web/scripts/office-roundtrip.mjs` | Script kiểm thử khói (Node, không phải `.spec.ts`) |

## 2. Yêu cầu chức năng

### 2.1 CRC-32

| Mã | Yêu cầu |
| :--- | :--- |
| 472-F01 | `crc32(bytes: Uint8Array): number` dùng bảng 256, kết quả khớp chuỗi test `"123456789" → 0xCBF43926`. |
| 472-F02 | Hỗ trợ cộng dồn nhiều chunk (`crc32Update`) để băm stream, không cấp phát lại toàn bộ. |

### 2.2 Magic bytes & phân loại

| Mã | Yêu cầu |
| :--- | :--- |
| 472-F03 | `detectFileKind(bytes)` trả `ZIP \| OLE2 \| PDF \| CSV_TEXT \| UNKNOWN`. |
| 472-F04 | `assertExtensionMatches(ext, kind)`: `.docx/.xlsx/.pptx` ↔ `ZIP`; `.doc/.xls/.ppt` ↔ `OLE2`; `.pdf` ↔ `PDF`; `.csv` ↔ `CSV_TEXT`; sai → `OFFICE_INVALID_MAGIC_BYTES`. |
| 472-F05 | OOXML có magic `OLE2` → `OFFICE_ENCRYPTED_FILE_UNSUPPORTED` (file có mật khẩu). |
| 472-F06 | `.csv` không chứa byte `0x00`; nếu chứa → `UNKNOWN`. |

### 2.3 ZIP container

| Mã | Yêu cầu |
| :--- | :--- |
| 472-F07 | Đọc EOCD, Central Directory, Local File Header; hỗ trợ method `0` (Store) và `8` (Deflate) qua `DecompressionStream('deflate-raw')`. |
| 472-F08 | Ghi ZIP: `CompressionStream('deflate-raw')`, CRC-32, UTF-8 filename flag `0x0800`, giữ thứ tự entry gốc. |
| 472-F09 | Giữ nguyên entry không sửa: metadata (method, timestamp, external attrs) và bytes; chỉ nén lại entry bị thay đổi. |
| 472-F10 | Chặn **Zip Slip**: tên entry chứa `..`, `/` tuyệt đối, `\`, ổ đĩa `C:` → `OFFICE_ZIP_UNSAFE_PATH`. |
| 472-F11 | Chặn **Zip Bomb**: tổng giải nén > 200MB hoặc tỉ lệ nén > 120:1 → `OFFICE_ZIP_TOO_LARGE`; dừng trước khi cấp phát. |
| 472-F12 | Entry trùng tên → giữ bản cuối, ghi `ParseWarning` `DUPLICATE_ENTRY`. |
| 472-F13 | ZIP64, nén method khác `0/8`, hoặc có mật khẩu → `OFFICE_ZIP_UNSUPPORTED`. |
| 472-F14 | `serialize(entries)` cho ra `Uint8Array` mở được bằng 7-Zip/Windows Explorer; có test bằng `unzip -t` trong CI thủ công. |

### 2.4 XML bridge

| Mã | Yêu cầu |
| :--- | :--- |
| 472-F15 | `parseXml(bytes, partName)` dùng `DOMParser` với `application/xml`; lỗi parser → `OFFICE_XML_MALFORMED` kèm `partName`. |
| 472-F16 | Từ chối `<!DOCTYPE` / `<!ENTITY` trước khi parse (XXE) → `OFFICE_XML_UNSAFE`. |
| 472-F17 | Helper namespace: `getChildrenNS(el, ns, local)`, `getAttrNS`, `setAttrNS`, `createElementNS`, `textOf`. |
| 472-F18 | `serializeXml(doc)` dùng `XMLSerializer`, giữ khai báo `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>`; phần không sửa phải giữ nguyên văn bản. |
| 472-F19 | Không tự ý sắp xếp lại attribute/thứ tự node ngoài vùng sửa; nếu serializer đổi thứ tự, ghi `ParseWarning` `XML_ATTR_ORDER`. |

### 2.5 CSV codec

| Mã | Yêu cầu |
| :--- | :--- |
| 472-F20 | Parse RFC 4180: quote `"`, escape `""`, xuống dòng trong ô, CRLF/LF; tự nhận delimiter `, ; \t` theo tần suất dòng đầu. |
| 472-F21 | Serialize luôn dùng `\r\n`, quote khi chứa delimiter/quote/newline, thêm BOM UTF-8 khi `withBom=true` (mặc định cho Excel). |
| 472-F22 | Giữ tiếng Việt có dấu; không tự đổi số thành date; mọi ô là `string` ở lớp codec. |

### 2.6 OLE2 CFB

| Mã | Yêu cầu |
| :--- | :--- |
| 472-F23 | Đọc header 512 bytes, sector size 512/4096, FAT, DIFAT, directory entries, mini-FAT. |
| 472-F24 | `listStreams()` + `readStream(name)` trả `Uint8Array`; chặn vòng lặp sector → `OFFICE_OLE2_CORRUPT`. |
| 472-F25 | Giới hạn stream 100MB, số sector 1 triệu; vượt → `OFFICE_OLE2_TOO_LARGE`. |
| 472-F26 | Trích text cơ bản cho `.doc/.xls/.ppt` (WordDocument/Workbook/PowerPoint Document stream) và ghi `ParseWarning` `LEGACY_PARTIAL` khi gặp record chưa hỗ trợ. |
| 472-F27 | Không cố sửa/ghi lại OLE2: mọi lưu legacy đều chuyển sang OOXML (xem `OFFICE_LEGACY_EXPORT_AS_OOXML`). |

### 2.7 PDF reader

| Mã | Yêu cầu |
| :--- | :--- |
| 472-F28 | Đọc `%PDF-1.x`, xref table cổ điển và xref stream; trailer `/Root`, `/Info`, `/Encrypt` (nếu có → `OFFICE_ENCRYPTED_FILE_UNSUPPORTED`). |
| 472-F29 | Duyệt `/Pages` → `/Kids` → `/Page`, trả `pageCount`, `MediaBox`, `Rotate`. |
| 472-F30 | Giải nén stream `FlateDecode` bằng `DecompressionStream('deflate')`; giới hạn 50MB/stream. |
| 472-F31 | Trích text operator `BT/ET`, `Tj`, `TJ`, `Tf`, `Tm`, `Td`, `TD`, `T*`; trả `textRuns[{text,x,y,fontSize}]` để dựng text layer. |
| 472-F32 | Ảnh: nhận `DCTDecode` (JPEG) và `FlateDecode` raw; ảnh khác → bỏ qua, ghi `ParseWarning` `PDF_IMAGE_UNSUPPORTED`. |
| 472-F33 | Không render vector path phức tạp ở v1; ghi warning, không crash. |

### 2.8 Worker protocol

| Mã | Yêu cầu |
| :--- | :--- |
| 472-F34 | Message: `PARSE_BINARY {requestId, fileName, ext, buffer}` → `PARSE_RESULT {requestId, kind, model, warnings}` hoặc `PARSE_ERROR {requestId, code, params}`. |
| 472-F35 | Message: `SERIALIZE_OOXML {requestId, docType, model, preservedEntries}` → `SERIALIZE_RESULT {requestId, buffer}` (transferable). |
| 472-F36 | Mỗi request có `requestId`; worker bỏ qua kết quả của request đã `CANCEL {requestId}`. |
| 472-F37 | Worker không giữ tham chiếu file sau khi trả kết quả (giải phóng bộ nhớ). |
| 472-F38 | Lỗi trong worker luôn trả code i18n, không trả stack thô ra UI. |

### 2.9 Part bổ sung cho phủ sóng đầy đủ

| Mã | Yêu cầu |
| :--- | :--- |
| 472-F39 | Parse/preserve `word/comments.xml`, `commentsExtended.xml`, `footnotes.xml`, `endnotes.xml`, `header*.xml`, `footer*.xml` + rels; giữ anchor/reference khi round-trip. |
| 472-F40 | Parse/preserve chart parts (`charts/chart*.xml`, embedded workbook `embeddings/*.xlsx`) cho Word/Excel/PPT. |
| 472-F41 | Parse/preserve SmartArt (`diagrams/data*.xml`, `layout*.xml`, `quickStyle*.xml`, `colors*.xml`) cho PPT. |
| 472-F42 | Parse/preserve media video/audio (`ppt/media/*`, `word/media/*`) và ink/drawing parts (`vmlDrawing`, `drawing*.xml`). |
| 472-F43 | Parse/preserve OMML equation (`m:oMath`, `m:oMathPara`) trong Word; không làm mất khi sửa đoạn xung quanh. |
| 472-F44 | Audit part coverage: liệt kê mọi part trong ZIP; part không xử lý vẫn được giữ nguyên byte + ghi `preservedParts`; test `part-coverage.json` cho 12 fixture. |

## 3. Giới hạn & mã lỗi

| Điều kiện | Mã lỗi |
| :--- | :--- |
| File local > 50MB | `OFFICE_FILE_TOO_LARGE` (`max_mb=50`) |
| Upload ERP > 25MB | `OFFICE_FILE_TOO_LARGE` (`max_mb=25`) |
| Sai chữ ký | `OFFICE_INVALID_MAGIC_BYTES` |
| ZIP có `..` | `OFFICE_ZIP_UNSAFE_PATH` |
| ZIP giải nén > 200MB / ratio > 120 | `OFFICE_ZIP_TOO_LARGE` |
| ZIP64 / method lạ / có mật khẩu | `OFFICE_ZIP_UNSUPPORTED` |
| XML có DOCTYPE/ENTITY | `OFFICE_XML_UNSAFE` |
| XML hỏng | `OFFICE_XML_MALFORMED` |
| OLE2 hỏng/vòng lặp | `OFFICE_OLE2_CORRUPT` |
| PDF mã hóa | `OFFICE_ENCRYPTED_FILE_UNSUPPORTED` |
| PDF font/ảnh không hỗ trợ | `OFFICE_PDF_PARTIAL_RENDER` (warning) |

## 4. Acceptance checklist

- [ ] AC-472-01 `tsc -p plugins/office-webapp/web/tsconfig.json --noEmit` → 0 lỗi.
- [ ] AC-472-02 `package.json` không chứa `jszip`, `fflate`, `pako`, `pdfjs-dist`, `xlsx`, `mammoth`, `docx`, `pptxgenjs`, `unzipit`, `fflate`.
- [ ] AC-472-03 Round-trip 1 `.docx` không sửa: giải nén → serialize → giải nén lại, mọi entry (trừ metadata ZIP) giống byte-for-byte.
- [ ] AC-472-04 CRC-32 khớp vector chuẩn; ZIP tạo ra mở được bằng `unzip -t`.
- [ ] AC-472-05 Entry `../evil` bị chặn trước khi ghi; không tạo file ngoài thư mục.
- [ ] AC-472-06 ZIP 201MB giải nén bị chặn trước khi cấp phát (đo `performance.memory` hoặc thời gian).
- [ ] AC-472-07 XML có `<!DOCTYPE` bị từ chối, không gọi mạng.
- [ ] AC-472-08 CSV round-trip giữ ô nhiều dòng, dấu `"`, tiếng Việt, BOM.
- [ ] AC-472-09 OLE2 đọc được 3 fixture `.doc/.xls/.ppt`, trả stream + warning, không crash.
- [ ] AC-472-10 PDF 3 fixture trả đúng `pageCount`, text runs; PDF mã hóa trả đúng mã lỗi.
- [ ] AC-472-11 Parse file 10MB trong worker: main thread không có task > 50ms (đo Performance panel).
- [ ] AC-472-12 Cancel request giữa chừng không trả kết quả cho UI.
- [ ] AC-472-13 Comments/footnotes/endnotes/header/footer parts round-trip byte-identical khi không sửa.
- [ ] AC-472-14 Chart + embedded workbook + SmartArt parts được giữ nguyên; mở lại bằng Office không mất.
- [ ] AC-472-15 Media video/audio + ink + OMML equation round-trip không mất nội dung.
- [ ] AC-472-16 `part-coverage.json` liệt kê 100% part của 12 fixture; 0 part bị mất sau round-trip.

## 5. Bộ fixture & bằng chứng

| Fixture | Mục đích |
| :--- | :--- |
| `tiny.docx` / `tiny.xlsx` / `tiny.pptx` | Round-trip cơ bản |
| `table-image.docx` | Bảng + ảnh nhúng |
| `formula-3sheet.xlsx` | Shared strings + công thức + 3 sheet |
| `shapes-3slide.pptx` | Shape + ảnh + quan hệ slide |
| `legacy.doc`, `legacy.xls`, `legacy.ppt` | OLE2 đọc |
| `text.pdf`, `image.pdf`, `multipage.pdf` | PDF đọc |
| `encrypted.docx`, `bomb.zip`, `slip.zip` | Ca lỗi bảo mật |

Bằng chứng: `08_testing/evidence/task-472-roundtrip.log` (bảng PASS/FAIL), `task-472-tsc.log`, `task-472-fixtures.md` (hash SHA-256 từng fixture).

## 6. Ngoài phạm vi

- Ghi ZIP64 (> 4GB), mật khẩu ZIP, nén method khác Deflate/Store.
- Render đầy đủ PDF vector/font shaping; PDF form/annotation.
- Chuyển `.doc/.xls/.ppt` sang OOXML ở tầng binary (chỉ trích xuất + model hóa tối thiểu).
- Bảo mật sandbox chống file độc hại ngoài giới hạn kích thước/XXE/zip bomb.

## 7. Rủi ro & cách xử lý

| Rủi ro | Cách xử lý |
| :--- | :--- |
| `DOMParser` tự decode sai encoding XML | Chỉ nhận UTF-8/UTF-16 theo khai báo; test fixture UTF-8 |
| Serializer đổi thứ tự attribute gây diff lớn | Test hash phần không sửa; chấp nhận warning nếu khác thứ tự |
| `DecompressionStream` khác hành vi giữa Chromium/Firefox | Test trên Chromium + Firefox; fallback báo `OFFICE_ZIP_UNSUPPORTED` |
| PDF lạ làm treo parser | Giới hạn 50MB/stream, timeout 10s mỗi file, chạy trong worker |
| Worker memory leak | Không giữ buffer sau khi trả; test 20 lần parse liên tiếp |

## 8. Lịch sử

| Phiên bản | Ngày | Thay đổi | Nguồn |
| :--- | :--- | :--- | :--- |
| 0.1 | 2026-11-15 | Phân rã task | Developer |
| 0.2 | 2026-11-15 | Đặc tả 38 FR, giới hạn bảo mật, 12 AC, fixture và bằng chứng | Architect; đối chiếu ADR-S12-001 |
| 0.3 | 2026-11-15 | Thêm part comments/footnotes/header/footer, chart/embedded workbook, SmartArt, media/ink, OMML, audit part coverage (`F39–F44`, `AC-13–AC-16`) | Chủ dự án; AUDIT-S12-001 |
