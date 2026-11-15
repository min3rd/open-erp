# [BENCH-S12-001] Đối chuẩn: Office WebApp & Client-side Office Engines

| Trường | Giá trị |
| :--- | :--- |
| ID / loại / sprint | BENCH-S12-001 / Đối chuẩn / Sprint 12 |
| Trạng thái / phiên bản / cập nhật | Draft / 0.4 / 2026-11-15 |
| Owner / reviewer | BA Agent / Chưa review |
| Đầu vào | [RAW-S12-001](../01_raw_notes/01_RAW-S12-001_office_webapp_requirements.md) 0.1 (R1, R3, R4) |
| Đọc trước / đọc tiếp | [RAW-S12-001](../01_raw_notes/01_RAW-S12-001_office_webapp_requirements.md) / [ANL-S12-001](../02_analysis/01_ANL-S12-001_office_webapp_plugin.md), [CONF-S12-001](../04_confirmation/01_CONF-S12-001_sprint_12_scope_and_ac.md) |

## 1. Mục đích và bối cảnh

Khảo sát các sản phẩm Office trên trình duyệt (đặc biệt **Microsoft 365 for the Web**) và các **thư viện/engine xử lý OOXML thuần Client-side (JS/TS/WASM)** để trả lời 2 câu hỏi cốt lõi:
1. Giao diện và trải nghiệm người dùng của **Office 365 Web** được tổ chức như thế nào để áp dụng vào Open-ERP?
2. Giải pháp kỹ thuật nào khả thi nhất để **xem và sửa `.docx`, `.xlsx`, `.pptx` ngay trên trình duyệt mà không cần Backend**?

> **Ghi chú kiểm chứng thực tế (R1)**: Ngày **2026-11-15**, `browser` subagent đã kết nối trực tiếp vào phiên Microsoft 365 Web (`https://m365.cloud.microsoft/`) đã đăng nhập của chủ dự án và khảo sát thực tế cả 3 ứng dụng **Word Web**, **Excel Web**, **PowerPoint Web**. Các thông số UI/UX trong Mục 2 dưới đây phản ánh đúng cấu trúc quan sát trực tiếp trên bản live.

## 2. Đối chuẩn UX/UI: Microsoft 365 for the Web (Quan sát trực tiếp 2026-11-15)

| Thành phần UI | Quan sát thực tế trên Microsoft 365 Web (Word / Excel / PowerPoint) | Bài học áp dụng cho `office-webapp` |
| :--- | :--- | :--- |
| **Title Bar (Thanh tiêu đề)** | **Trái:** Nút 9 chấm `App launcher` → Icon App → Tên file sửa trực tiếp inline (`Rename file`, VD: `Document 2`, `Book 2`, `Presentation`) → Trạng thái lưu (`Saved`). **Giữa:** Ô tìm kiếm lệnh `Search for tools, help, and more (Alt + Q)`. **Phải:** Settings & Account. *Lưu ý:* Nút Export/Download/Print **không nằm ở Title Bar** mà nằm trong menu `File`. | Giữ 1 thanh gọn 36–40px: Icon app + Tên file editable inline + Trạng thái `Đã lưu / Chưa lưu` + Nút mở file nhanh; các lệnh Save As / Export / Print gom vào menu `File` gọn gàng. |
| **Ribbon (Single Line vs Classic)** | Nút `Ribbon Display Options` (góc phải) cho phép chuyển đổi **Single Line Ribbon** (~40px, 1 dòng icon + nút tràn `...` "More Options") ↔ **Classic Ribbon** (~90px, 2 dòng có nhãn nhóm `Clipboard`, `Font`, `Alignment`...). Word & PowerPoint mặc định **Single Line Ribbon**; Excel mặc định **Classic Ribbon**. Nút chế độ (`Mode`: Editing/Viewing), `Present` (PPT) nằm ở bên phải hàng Tab Ribbon. | **Rất phù hợp** với chuẩn High-Density của Open-ERP: mặc định **Single Line Ribbon** (~40px) cho Word/PPT, hỗ trợ toggle mở rộng Classic cho Excel/người dùng quen tay; mọi nút đều có tooltip i18n. |
| **Tabs theo từng App** | **Word:** `File`, `Home`, `Insert`, `Layout`, `References`, `Review`, `View`, `Help`. **Excel:** `File`, `Home`, `Insert`, `Page Layout`, `Formulas`, `Data`, `Review`, `View`... **PowerPoint:** `File`, `Home`, `Insert`, `Design`, `Transitions`, `Animations`, `Slide Show`, `Review`, `View`. | Chỉ hiển thị bộ tab cốt lõi phù hợp phạm vi Client-side (Word: `File, Home, Insert, Layout, View`; Excel: `File, Home, Insert, Formulas, Data, View`; PPT: `File, Home, Slide Show, View`). |
| **Word Canvas** | Trang giấy trắng căn giữa (`Separate Pages`) trên nền backdrop sáng/tối; nút bật/tắt `Navigation Pane` nổi bên trái; thước ngang/dọc (`Ruler`) tùy chọn (`View > Ruler`). | Nền canvas trung tính (`bg-neutral-100 dark:bg-neutral-900`), trang giấy sắc nét, hỗ trợ bật/tắt `Separate Pages` & zoom (10%–400% / Fit). |
| **Excel Workspace** | **Formula Bar** nằm ngay dưới Ribbon (`Name Box` `A1`, nút `Cancel`, `Commit`, `fx`, ô nhập công thức đa dòng); lưới cột `A, B, C...` / hàng `1, 2, 3...` với viền ô active; thanh **Sheet Tabs** ở đáy (`<`, `>`, `All Sheets`, `Sheet1`, `+`) chung hàng với thanh cuộn ngang. | Tái hiện đúng bố cục Formula Bar + Grid + Sheet Tabs dưới đáy; giữ màu sắc lưới rõ ràng ở cả Light/Dark theme. |
| **PowerPoint Workspace** | **Thumbnail Panel** bên trái (thu gọn được với `Ctrl+\`, kéo chỉnh độ rộng được, đánh số slide); **Slide Stage** 16:9 ở giữa; thanh ghi chú `Click to add notes` thu gọn được ở đáy; nút `Present` nổi bật trên thanh tab. | Dùng **Split-Screen** chuẩn của Open-ERP (Thumbnail bên trái + Stage giữa + Notes thu gọn ở đáy); trên Mobile ẩn Thumbnail thành thanh cuộn/drawer. |
| **Status Bar (Thanh đáy)** | **Word:** `Page 1 of 1`, `0 words`, nút `Separate Pages`, `Zoom` slider + `100%` + `Fit`. **Excel:** `Workbook Statistics`, `Zoom` combobox (`100%`), `Full Screen`. **PPT:** `Slide 1 of 1`, `Notes` toggle, `Editing View` / `Slide Sorter` / `Start Slide Show from Current Slide`, `Zoom` slider + `Fit`. | Thanh đáy cao 24–28px mật độ cao, chứa thông số ngữ cảnh (số trang/từ hoặc số slide) + bộ điều khiển Zoom + nút chuyển nhanh chế độ xem/trình chiếu. |
| **Menu `File` (Compact Dropdown)** | Thay vì mở Backstage toàn màn hình, `File` trên Web mở **dropdown dọc gọn gàng**: `New`, `Open`, `Create a Copy` (`Download a copy` định dạng gốc), `Export` (**Word:** PDF, ODT, Markdown; **Excel:** PDF, CSV UTF-8, CSV, ODS; **PPT:** PDF, ODP, Images JPEG), `Print`, `Rename`, `Info`. | **Phù hợp 100% quy chuẩn Anti-Modal** của Open-ERP: menu `File` dạng dropdown/panel gọn nhẹ, không che toàn màn hình; hỗ trợ xuất định dạng gốc + PDF + CSV/Markdown/Images ngay phía client. |

## 3. Đối chuẩn Công nghệ Client-Side (Zero-Backend)

### 3.1. Nhóm giải pháp Full Office Suite bằng WebAssembly (WASM)

| Giải pháp | Kiến trúc | Ưu điểm | Nhược điểm / Rủi ro | License |
| :--- | :--- | :--- | :--- | :--- |
| **ZIZIYI Office / ONLYOFFICE WASM** | Biên dịch engine C++ (`x2t` + canvas editor) của ONLYOFFICE sang WebAssembly chạy trong trình duyệt + IndexedDB | Độ trung thực **gần như 100% Desktop Office** cho cả `.docx`, `.xlsx`, `.pptx` (xem & sửa đầy đủ) | Kích thước WASM rất lớn (thường > 30–60MB), thời gian khởi tạo lần đầu chậm, tích hợp phức tạp vào Angular | **AGPL-v3** (ràng buộc copyleft mạnh nếu thương mại hóa/phân phối) |
| **BetterOffice** | Core Rust + WebAssembly cho DOCX, XLSX, PPTX | Hiệu năng cao, kiến trúc hiện đại, hỗ trợ headless API | Hệ sinh thái mới, wrapper chủ yếu hướng React, cần tự bọc Web Component / Angular bridge | **Apache-2.0** (thân thiện doanh nghiệp) |
| **LibreOffice WASM (ZetaJS)** | Biên dịch toàn bộ LibreOffice sang WASM | Mở được hầu hết định dạng kể cả `.doc`/`.xls`/`.ppt` cũ | Rất nặng (> 100MB WASM), tốn RAM trình duyệt, UX không giống Office 365 Web | **MPL-2.0** |

### 3.2. Nhóm giải pháp Chuyên biệt theo từng định dạng (Modular Pure JS/TS — Best-of-Breed)

Đây là hướng kết hợp các thư viện tốt nhất cho từng loại file, đóng gói gọn nhẹ trong Angular:

| Định dạng | Thư viện / Engine tiêu biểu | Khả năng Xem | Khả năng Sửa | Kích thước & License |
| :--- | :--- | :--- | :--- | :--- |
| **Excel (`.xlsx`, `.csv`)** | **Univer (`@univerjs/*`)** | Xuất sắc (hỗ trợ style, merge, freeze, multi-sheet, biểu đồ) | **Xuất sắc** (Formula Bar, >300 hàm Excel, format ô, sort/filter, undo/redo) | ~1–3MB (lazy-load); **Apache-2.0** |
| **Excel (`.xlsx`)** | **SheetJS (`xlsx`)** | Tốt ở mức parse dữ liệu | Không có UI (chỉ đọc/ghi file `.xlsx`, thường kết hợp với UI grid tự viết hoặc Univer import/export) | Nhẹ (~500KB); Apache-2.0 (bản CE) |
| **Word (`.docx`)** | **`docx-preview`** | **Rất tốt** (render phân trang, bảng, ảnh, style sát Word) | Không hỗ trợ sửa trực tiếp (chỉ Viewer) | Rất nhẹ (~150KB); **MIT** |
| **Word (`.docx`)** | **Mammoth.js + Rich Text Editor (Tiptap/ProseMirror) + `docx` (export)** | Chuyển `.docx` sang HTML sạch | **Sửa tốt** văn bản, bảng, ảnh, heading, list, Undo/Redo; xuất lại `.docx` qua thư viện `docx` | Nhẹ (~500KB tổng); **BSD-2 / MIT** |
| **Word (`.docx`)** | **Univer Docs (`@univerjs/docs`)** | Tốt (canvas-based) | Đang phát triển mạnh (đồng bộ kiến trúc với Univer Sheets) | **Apache-2.0** |
| **PowerPoint (`.pptx`)** | **PPTXjs / `@docmentis/udoc-viewer` / `pptx-preview` + `pptxgenjs`** | **Tốt** (render slide, shape, ảnh, bảng, trình chiếu) | Sửa `.pptx` phức tạp rất hạn chế ở pure JS (chỉ sửa được text/slide cơ bản hoặc cần WASM) | Nhẹ–Trung bình; **MIT / Apache-2.0** |

## 4. Tổng hợp bài học áp dụng cho Open-ERP (Sprint 12)

1. **Không có 1 thư viện pure-JS nhẹ nào hoàn hảo cho cả 3 định dạng ở mức "sửa full như Office 365 Desktop"**:
   - **Excel**: **Univer + SheetJS** giải quyết rất xuất sắc cả Xem lẫn Sửa thuần client-side, kiến trúc Apache-2.0 an toàn và UX giống Excel Web 90%.
   - **Word**: Nếu chỉ cần Xem trung thực → `docx-preview` (MIT). Nếu cần Xem + Sửa → có 2 lựa chọn chiến lược:
     - *Phương án A (Modular JS/TS — Khuyên dùng nếu ưu tiên nhẹ & license sạch)*: Dùng `docx-preview` cho chế độ **Xem trung thực (Read Mode)** và chuyển sang bộ soạn thảo **ProseMirror/Tiptap (hoặc Univer Docs)** + `mammoth` / `docx` cho chế độ **Sửa (Edit Mode)**; lưu ý cảnh báo nếu file gốc có macro/định dạng quá phức tạp.
     - *Phương án B (WASM Suite)*: Dùng engine WASM (như BetterOffice / ONLYOFFICE WASM) nếu chấp nhận bundle 30–60MB và đánh giá kỹ license (tránh AGPL nếu không muốn mở mã nguồn).
   - **PowerPoint**: Khả thi nhất ở v1 là **Xem slide trung thực + Slideshow toàn màn hình** (kèm sửa text/thứ tự slide cơ bản nếu dùng JSON/OOXML wrapper + `pptxgenjs`, hoặc nâng cấp WASM ở giai đoạn sau).
2. **Tách riêng UI Shell của Open-ERP với Document Engine**: Dù chọn engine nào bên dưới, thanh Title Bar, Simplified Ribbon, File Picker, Tabs và Status Bar nên bọc bằng component chuẩn của Open-ERP (`@shared`) để giữ 100% phong cách vuông vắn, mật độ cao, Dark/Light theme và đa ngôn ngữ.
3. **File System Access API trên Microsoft Edge**: Vì chủ dự án sử dụng Microsoft Edge (nhân Chromium), API `window.showOpenFilePicker()` và `window.showSaveFilePicker()` hoạt động nguyên bản, cho phép trải nghiệm **"Ctrl+S lưu thẳng xuống file trên ổ cứng"** giống hệt ứng dụng Desktop mà không cần Backend!

## 5. Phân tích Reverse Engineering Kiến trúc Microsoft 365 Web (Chrome DevTools)

Kết quả kiểm tra DOM, Scripts, Workers và Network trực tiếp bên trong các `iframe` ứng dụng của Microsoft 365 Web ngày **2026-11-15**:

| Ứng dụng & Origin | Kiến trúc Rendering Bề mặt (Surface) | Workers / WASM / Tech Stack | Mức độ phụ thuộc Server của Microsoft |
| :--- | :--- | :--- | :--- |
| **Word Web** (`word-edit.officeapps.live.com`) | **Hybrid DOM Page + Per-paragraph `<canvas>` + Hidden DOM Text Layer**: Khung trang cố định `div.Page` (`816×1056px` = 8.5×11" @96dpi, CSS `contain: size layout`), `div.Section` (margin `96px`). Mỗi đoạn vẽ lên `<canvas class="CanvasParagraph">` kèm `<p class="ParagraphTextContent">` (`opacity: 0`) & `[contenteditable="true"]` để chọn chữ/a11y. | **0 `.wasm`**; 0 Service Worker; Web Workers (`healthsmalloffline`, `otel`, blob worker); Chrome UI dùng **React + Fluent UI v9** (`fui-Button`, Griffel CSS) + `wordeditords.js`. | Cao cho co-authoring/WOPI (`wopi.ashx`, `LockRefresh_1`), nhưng mô hình **DOM Page + Canvas/DOM** hoàn toàn tái hiện được ở Client. |
| **Excel Web** (`excel.officeapps.live.com`) | **Tiled `<canvas>` Grid + Rich Text `[contenteditable]` Overlay**: Chia lưới thành 5 `<canvas class="ewr-sheettable">` (header cột `1920×30`, 2 tile header hàng `43×560`, 2 tile lưới ô `1920×560`) để cuộn mượt không lag DOM. Ô đang sửa & Formula Bar phủ **Quill** (`div.ql-editor` `contenteditable="true"`). | **0 `.wasm`**; **Web Worker tính lưới** (`gridWorker.min.js`) + `excelOnlineCalc.min.js` tính công thức ở client + SignalR co-authoring; UI dùng Fluent UI v9. | **Univer (`@univerjs/*`) dùng kiến trúc Tiled Canvas + Formula Engine + DOM Input Overlay giống hệt Excel Web**, chạy 100% client-side không cần Backend! |
| **PowerPoint Web** (`powerpoint.officeapps.live.com`) | **Hybrid `<canvas>` (2D + WebGL2 `#webgl-canvas` `1920×1080`) + SVG Selection Overlay + `[contenteditable]`**: Stage dùng Canvas 2D + WebGL2 cho hiệu ứng; khung chọn shape & tay nắm resize dùng vector `<svg>` (`selectionsvgggroup`); text layer dùng `contenteditable="true"`. | **0 `.wasm`**; 0 Service Worker; Fluent UI v9 + `ppteditDS.core*.js` + `slidegrid.min.js`. | **Phụ thuộc server rất nặng** cho render slide/thumbnail (`images.ashx`, `podedit.svc/GetThumbs`, `PowerPoint.ashx`). Vì vậy thuần client-side nên ưu tiên **Viewer + Slideshow + sửa text cơ bản**, không ôm đồm vẽ shape phức tạp ở v1. |

### Kết luận kiến trúc để dựng lại từ đầu giống Office 365 Web (100% Client-Side, ZERO Thư viện bên thứ 3)
Theo chỉ đạo trực tiếp của chủ dự án (**tự xây dựng từ đầu, không phụ thuộc thư viện bên thứ 3**), các thư viện tham khảo ở Mục 3 chỉ dùng để đối chiếu kỹ thuật, **không cài đặt vào dự án**. Toàn bộ plugin `office-webapp` sẽ tự xây bằng TypeScript + Angular >= 22 + Web APIs chuẩn theo đúng kiến trúc đã reverse-engineer từ Microsoft 365 Web:

1. **OOXML Core (Zero-Dependency ZIP + XML)**: Tự viết bộ đọc/ghi gói `.docx`/`.xlsx`/`.pptx` (cấu trúc ZIP + XML) thuần TypeScript trên `Uint8Array` + Web Streams API chuẩn trình duyệt (`DecompressionStream('deflate-raw')` / `CompressionStream('deflate-raw')`) + `DOMParser` / `XMLSerializer`.
2. **Shell UI (Title Bar + Ribbon + Status Bar + File Dropdown)**: Tự dựng 100% trên `@shared` Angular + Tailwind 4 (Single Line Ribbon ~40px mặc định + toggle Classic ~90px, menu `File` dropdown chống che màn hình, Status Bar đáy).
3. **Excel In-House Engine (`.xlsx`, `.csv`)**: Tự dựng **Tiled `<canvas>` Grid** (tách tile header cột, header hàng, lưới ô ảo hóa) + **Web Worker** tính toán & render + **Formula Engine** tự viết (Tokenizer + AST Parser + Evaluator) + **Overlay `[contenteditable]`** khi sửa ô & Formula Bar giống hệt kiến trúc Excel Web.
4. **Word In-House Engine (`.docx`)**: Tự dựng **DOM Page Container** (`816×1056px`, `contain: size layout`, `div.Section` margin) + **Canvas/DOM Hybrid renderer** + bộ nhập liệu, chọn vùng, Undo/Redo và xuất ngược ra `word/document.xml`.
5. **PowerPoint In-House Engine (`.pptx`)**: Tự dựng **Split-Screen** (Thumbnail Pane trái thu gọn được + Slide Stage 16:9 Canvas/SVG ở giữa + Notes đáy + Slideshow Fullscreen) + **SVG Selection Overlay** (`selectionsvgggroup` khung chọn & tay nắm resize) + `[contenteditable]` text layer giống hệt kiến trúc PowerPoint Web.
