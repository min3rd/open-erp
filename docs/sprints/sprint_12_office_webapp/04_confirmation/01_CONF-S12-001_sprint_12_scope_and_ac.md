# [CONF-S12-001] Scope, Acceptance Criteria & Câu hỏi — Sprint 12: Plugin Office WebApp

| Trường | Giá trị |
| :--- | :--- |
| ID / loại / sprint | CONF-S12-001 / Xác nhận / Sprint 12 |
| Trạng thái / phiên bản / cập nhật | **✅ APPROVED 1.2 / 2026-11-15** — phủ sóng **toàn bộ chức năng client** của Office 365 Web (78 nhóm), chỉ loại trừ 13 nhóm phụ thuộc dịch vụ/backend |
| Owner / reviewer | BA Agent / Chủ dự án (người duyệt) |
| Đầu vào | [RAW-S12-001](../01_raw_notes/01_RAW-S12-001_office_webapp_requirements.md) 0.2, [ANL-S12-001](../02_analysis/01_ANL-S12-001_office_webapp_plugin.md) 0.2, [BENCH-S12-001](../03_benchmarks/01_BENCH-S12-001_office_webapp_benchmarks.md) 0.4 |
| Đọc trước / đọc tiếp | [BENCH-S12-001](../03_benchmarks/01_BENCH-S12-001_office_webapp_benchmarks.md) / [00_READING_GUIDE](../00_READING_GUIDE.md) — bước 05 SOL mở sau khi APPROVED |

## 1. Mục tiêu Sprint 12

Bàn giao **1 plugin độc lập `office-webapp`** trong Open-ERP cho phép người dùng **tạo mới, mở, xem, chỉnh sửa và lưu/xuất** các tệp văn phòng ngay trên trình duyệt theo giao diện **Microsoft 365 Web**, **tự xây dựng 100% từ đầu (Zero-Third-Party Office Engine)**, xử lý định dạng/render/tính toán hoàn toàn phía Client (kèm tùy chọn mở/lưu file trên Cloud Storage MinIO/Backend của ERP theo `tenant_id`).

## 2. Phạm vi đã chốt qua 9 câu hỏi tương tác (Q1–Q9)

Nguồn: hội thoại tương tác giữa chủ dự án và BA Agent, **2026-11-15** (2 vòng, 9/9 câu trả lời đầy đủ):

| # | Chủ đề | Câu trả lời của chủ dự án |
| :--- | :--- | :--- |
| **Q1** | **Định dạng file v1** | **Hỗ trợ đầy đủ**: `.docx`, `.doc`, `.xlsx`, `.xls`, `.pptx`, `.ppt`, `.csv`, `.pdf` |
| **Q2** | **Mức độ Sửa Word** | Xem phân trang chuẩn (`816×1056px`) + Sửa văn bản, định dạng, bảng, ảnh, Find/Replace, Undo/Redo + Xuất `.docx` |
| **Q3** | **Mức độ Sửa Excel** | Xem & Sửa đa sheet, Formula Bar, **toàn bộ catalogue hàm Excel Web** (`SUM`, `IF`, `VLOOKUP`...), **CF/DV đầy đủ**, Pivot/Table/Slicer, format ô/viền/merge, sort/filter, freeze panes + Xuất `.xlsx`/`.csv` |
| **Q4** | **Mức độ Sửa PowerPoint** | Xem Thumbnail + Slide Stage 16:9 + Slideshow toàn màn hình + Sửa text, di chuyển/resize box qua SVG overlay, thêm/xóa/đổi thứ tự slide + Xuất `.pptx` |
| **Q5** | **Ribbon & Shell** | **Single Line Ribbon** (~40px) mặc định cho Word/PPT, **Classic Ribbon** (~90px) cho Excel, kèm nút chuyển đổi và menu `File` Compact Dropdown (Anti-Modal) |
| **Q6** | **Mở & Lưu file** | **Client-side mở/sửa + có tùy chọn lưu/mở file từ Cloud Storage của ERP (MinIO/Backend)** (mở từ máy, `Ctrl+S` qua File System Access API hoặc tải xuống, hoặc lưu/mở trực tiếp file trên ERP Storage) |
| **Q7** | **Tạo mới & Export** | Có tạo file mới (`.docx`/`.xlsx`/`.pptx` trống) + Export PDF (Print/Canvas PDF), CSV, Markdown (Word), ảnh JPEG slide (PPT) phía client |
| **Q8** | **Khôi phục nháp** | Có — tự động lưu nháp tạm cục bộ trên `IndexedDB` + nút xóa nháp khi đóng/mở lại |
| **Q9** | **Mobile Ionic (390×844)** | Chế độ **Viewer tối giản** trên Mobile (xem tài liệu, zoom, chuyển sheet/slide, tải về) |

### 2.1. Phạm vi In-Scope

1. **Lõi xử lý tệp tự xây dựng (Zero-Third-Party, 100% Client-side)**:
   - **OOXML Core**: Bộ đọc/ghi ZIP + XML thuần TypeScript (`Uint8Array`, `CompressionStream`/`DecompressionStream`, `DOMParser`/`XMLSerializer`) cho `.docx`, `.xlsx`, `.pptx`, `.csv`.
   - **Legacy Binary & PDF Core**: Bộ giải mã OLE2 Compound File Binary (`.doc`, `.xls`, `.ppt` — mức đọc/chuyển đổi sang mô hình nội bộ để xem/lưu lại thành OOXML) và bộ đọc/render `.pdf` cơ bản phía client.
2. **Office Shell UI (`@shared` Angular + Tailwind 4)**:
   - Title Bar (~36–40px): icon app, tên file editable inline, trạng thái lưu (`Đã lưu` / `Chưa lưu` / `Đang đồng bộ ERP`), nút mở file local & ERP Storage.
   - Ribbon: **Single Line Ribbon** mặc định cho Word/PPT (~40px), **Classic Ribbon** mặc định cho Excel (~90px), nút `Ribbon Display Options` chuyển đổi qua lại.
   - Menu `File` dạng Compact Dropdown (Anti-Modal): `Mới`, `Mở từ máy`, `Mở từ ERP Storage`, `Lưu / Lưu đè (Ctrl+S)`, `Lưu lên ERP Storage`, `Tải bản sao`, `Xuất (PDF/CSV/Markdown/JPEG)`, `In`.
   - Status Bar đáy (~24–28px): thông số ngữ cảnh + Zoom slider/Fit + Fullscreen/Slideshow.
   - 100% i18n (`vi.json`, `en.json`...), Zero-Emoji trong nhãn, hỗ trợ Dark/Light theme, Route-driven state (`?app=word|excel|ppt`, `?mode=view|edit`, `?docId=...`).
3. **Word Engine In-House**: Khung `div.Page` (`816×1056px`, `contain: size layout`), Canvas/DOM Hybrid renderer, sửa văn bản/định dạng/bảng/ảnh, Find/Replace, Undo/Redo, Export `.docx` / Markdown / PDF.
4. **Excel Engine In-House**: Tiled `<canvas>` Grid + Web Worker + Formula Engine tự viết (**toàn bộ catalogue hàm Excel Web**), Formula Bar + `[contenteditable]` overlay, format ô/viền/merge, **CF/DV đầy đủ**, Pivot/Table/Slicer, sort/filter, freeze panes, Export `.xlsx` / `.csv` / PDF.
5. **PowerPoint Engine In-House**: Split-Screen (Thumbnail Pane thu gọn được + Slide Stage 16:9 + Notes đáy + Fullscreen Slideshow), SVG Selection Overlay (chọn/di chuyển/resize box), sửa text, thêm/xóa/đổi thứ tự slide, Export `.pptx` / JPEG từng slide / PDF.
6. **Lưu trữ & Khôi phục**: File System Access API (`showOpenFilePicker`/`showSaveFilePicker`) + Fallback Download; tự động lưu nháp `IndexedDB`; tích hợp **ERP Cloud Storage (MinIO/Backend)** có phân quyền và cô lập `tenant_id` (lưu metadata file vào Entity Registry nếu bật lưu trữ server).
7. **Mobile Ionic**: Chế độ Viewer tối giản (xem, zoom, chuyển sheet/slide, tải về) trên viewport `390×844px`.

### 2.2. Phạm vi Out-of-Scope (chỉ dịch vụ/backend hoặc không khả thi client)

- Cộng tác thời gian thực (Real-time Co-authoring / CRDT / SignalR), `Show Changes` (dịch vụ).
- VBA/Macro, Power Query, Power BI, Stocks/Currencies/Geography, Analyze Data, Data from Picture, Insert Python, Office Scripts, Add-ins, M365 Stock Images, Designer/Visualize/Design Suggestions.
- Dictate, Translate, Editor AI, Read Aloud, Subtitles, Rehearse with Coach, Present in Teams (dịch vụ).
- Mở file có mật khẩu mã hóa (Encrypted OOXML/PDF).
- Xuất ngược lại định dạng nhị phân cũ (`.doc`, `.xls`, `.ppt`); file cũ sau khi sửa lưu thành OOXML.
- Thao tác dữ liệu ERP ngoài phạm vi client: `Add to favorites`, `Move file` (có thể bổ sung ở sprint khác).

## 3. Rủi ro kỹ thuật cần Chủ dự án lưu ý trước khi duyệt

1. **Rủi ro lớn nhất — Tự viết parser `.doc`, `.xls`, `.ppt` (OLE2 Binary) & `.pdf` từ đầu (`Q1`)**:
   - Định dạng `.docx`/`.xlsx`/`.pptx` là ZIP+XML có cấu trúc chuẩn, hoàn toàn khả thi tự viết bằng TS + Web APIs chuẩn.
   - Ngược lại, `.doc`/`.xls`/`.ppt` là định dạng nhị phân độc quyền cũ (OLE2 CFBF + BIFF8/WordBinary/PPTBinary) và `.pdf` là định dạng đồ họa vector/font/stream nhị phân phức tạp. Việc tự viết 100% từ đầu không dùng thư viện thứ 3 cho `.doc`/`.xls`/`.ppt`/`.pdf` sẽ tốn công sức rất lớn và khó đạt độ tương thích 100% với mọi file ngoài thực tế (đặc biệt là PDF nhúng font/nén ảnh phức tạp).
   - **Kiến nghị**: Solution Architect ở Bước 05 sẽ đánh giá mức hỗ trợ khả thi nhất trong Sprint 12 (VD: hỗ trợ chuẩn OOXML đầy đủ + `.csv`, còn `.doc`/`.xls`/`.ppt`/`.pdf` ở mức parser cơ bản / fallback cảnh báo rõ cho file phức tạp).
2. **Tích hợp Backend ERP Storage (`Q6`)**: Vì có tùy chọn lưu/mở file từ MinIO/Backend, Sprint 12 vẫn cần 1 phần API Backend Quarkus tối giản (chỉ làm nhiệm vụ lưu/tải file thô theo `tenant_id` + kiểm tra quyền, **không** convert hay xử lý nội dung file ở Backend).

## 4. Acceptance Criteria (dự thảo chốt theo Q1–Q9)

| ID | Tiêu chí nghiệm thu | Cách kiểm chứng |
| :--- | :--- | :--- |
| **CONF-S12-001/AC-01** | Plugin `office-webapp` đóng gói độc lập chuẩn Open-ERP, cài đặt/bật-tắt được, không phụ thuộc thư viện Office/Editor bên thứ 3 (`package.json` = 0 third-party office engine). | Kiểm tra `package.json` & bundle |
| **CONF-S12-001/AC-02** | Mở/sửa file từ máy tính hoàn toàn phía Client (**0 request upload nội dung file lên Backend** trong Network tab khi làm việc local). | Browser DevTools Network tab |
| **CONF-S12-001/AC-03** | Tùy chọn **Mở/Lưu từ ERP Cloud Storage (MinIO)** hoạt động đúng theo `tenant_id` đã xác thực, không rò rỉ file giữa các tenant. | Integration Test (Real PostgreSQL/MinIO) |
| **CONF-S12-001/AC-04** | Giao diện **Office Shell** tái hiện đúng Title Bar, Single Line Ribbon (~40px) / Classic Ribbon (~90px), Compact `File` Dropdown (Anti-Modal), Status Bar; Dark/Light theme & 100% i18n (Zero-Emoji). | Dual-Mode Browser Test |
| **CONF-S12-001/AC-05** | Word: xem phân trang (`div.Page`), sửa text/định dạng/bảng/ảnh, Find/Replace, Undo/Redo, Export `.docx` / Markdown / PDF. | Round-trip test trên trình duyệt |
| **CONF-S12-001/AC-06** | Excel: Tiled Canvas Grid + Worker + Formula Bar (**toàn bộ catalogue hàm Excel Web**), format/merge/sort/filter/freeze, **Pivot/Table/Slicer**, **Conditional Formatting đầy đủ**, **Data Validation đầy đủ 3 tab**, Export `.xlsx` / `.csv` / PDF. | Round-trip & Formula test |
| **CONF-S12-001/AC-07** | PowerPoint: Split-Screen Thumbnail + Stage 16:9 + Slideshow Fullscreen + SVG Selection Overlay sửa text/box/slide, Export `.pptx` / JPEG / PDF. | Round-trip & Slideshow test |
| **CONF-S12-001/AC-08** | Hỗ trợ đọc file `.doc`/`.xls`/`.ppt`/`.pdf` cơ bản (hoặc báo lỗi rõ mã i18n nếu file mã hóa/quá phức tạp); tự động lưu nháp `IndexedDB`; Mobile Ionic (`390×844`) xem mượt, `overflow = 0`, `0 console.error`. | Dual-Mode Browser Test |
| **CONF-S12-001/AC-09** | Shell dùng số đo thật: Title `48`, Tab `31/36`, Ribbon `76/136`, Formula Bar `32`, Status `24` (±1px). | DevTools `getBoundingClientRect` |
| **CONF-S12-001/AC-10** | Menu `File` có 9 mục, gồm **Share nội bộ ERP**: chọn user/role trong tenant, cấp quyền `READ`/`WRITE`, thu hồi; user không có quyền không xem được file. | Test 2 user cùng tenant + cross-tenant |
| **CONF-S12-001/AC-11** | Word **Comment**: tạo trên vùng chọn, reply, resolve, xóa, show/hide, prev/next; lưu vào `word/comments.xml`, mở lại bằng Word còn comment. | Round-trip + UI test |
| **CONF-S12-001/AC-12** | PowerPoint: đủ transition `None/Morph/Cut/Fade/Push/Wipe` + duration + apply to all; animation `Appear/Fade/Fly In` + options/order/animation pane; slideshow chạy đúng cả hai; lưu `.pptx` mở PowerPoint còn hiệu ứng. | Round-trip + slideshow test |
| **CONF-S12-001/AC-13** | Phủ sóng đầy đủ: **78/78 nhóm chức năng client** tại `AUDIT-S12-001` có FR + AC; 13 nhóm `SERVICE` được liệt kê loại trừ, không có nhóm client bị bỏ. | Đối chiếu audit + test report |
| **CONF-S12-001/AC-14** | Round-trip không mất part: comments/footnotes/endnotes/header/footer, chart + embedded workbook, SmartArt, media, ink, OMML được giữ nguyên khi không sửa; `part-coverage.json` 100%. | Binary round-trip test |

## 5. Ma trận nền tảng

| Chức năng | Desktop Web (>= 1280px) | Mobile Ionic (390×844) |
| :--- | :--- | :--- |
| Mở file từ máy / Kéo-thả / ERP Storage | ✅ Đầy đủ | ✅ Chọn file / Mở từ ERP Storage |
| Xem Word / Excel / PowerPoint / PDF | ✅ Đầy đủ + Zoom + Fullscreen Slideshow | ✅ Viewer tối giản (Fit width, chuyển sheet/slide) |
| Chỉnh sửa Word / Excel / PowerPoint | ✅ Đầy đủ | ❌ Chỉ xem (tối giản theo Q9) |
| Lưu đè (`Ctrl+S` File System Access) / Lưu ERP / Tải về | ✅ Đầy đủ | ✅ Tải xuống |
| Tạo mới / Export (PDF, CSV, Markdown, JPEG) / Nháp IndexedDB | ✅ Đầy đủ | ✅ Tải xuống / Nháp đọc |

## 6. Bổ sung 1.1 — 8 quyết định từ review tương tác (2026-11-15)

| # | Chủ đề | Quyết định của chủ dự án | Ảnh hưởng |
| :--- | :--- | :--- | :--- |
| R1 | Token Shell | Dùng số đo thật `48/31-36/76/136/32/24` | `AC-09`, `DES-UI`, `TASK-473` |
| R2 | Menu `File` | **9 mục**, thêm `Share nội bộ ERP` | `AC-10`, `TASK-471` (ACL), `TASK-473` (Share drawer) |
| R3 | Word nâng cao | **Chỉ Comment**, không Track Changes/Accept-Reject | `AC-11`, `TASK-474` |
| R4 | Excel hàm | **Toàn bộ catalogue hàm Excel Web** (không giới hạn 60) | `AC-06`, `TASK-475` |
| R5 | Excel nâng cao | **CF + Data Validation đầy đủ** | `AC-06`, `TASK-475` |
| R6 | PowerPoint | **Đủ transition + animation + Morph** | `AC-12`, `TASK-476` |
| R7 | PDF | Xem + search text + tải xuống (không form/ký số) | Giữ `AC-08` |
| R8 | Mobile | Chỉ xem (view-only) | Giữ `AC-08`, `Q9` |
| R9 | Phủ sóng đầy đủ | **Toàn bộ chức năng client** của Office 365 Web phải có trong Task; không dùng `OUT` cho client | `AC-13`, `AUDIT-S12-001` |
| R10 | Loại trừ dịch vụ | Chỉ loại trừ 13 nhóm `SERVICE` (AI, speech, Teams, cloud data, co-authoring, Store) | `AC-13` |

> Các mục R2, R4, R5, R6 làm tăng khối lượng so với 1.0; Architect phải cập nhật `DES-DB`/`DES-API`/`DES-UI` tương ứng trước khi code (xem `ITEM-REVIEW-S12`).

## 7. Lịch sử

| Phiên bản | Ngày | Thay đổi | Nguồn |
| :--- | :--- | :--- | :--- |
| 0.1 | 2026-11-15 | Bản nháp đầu tiên với 10 câu hỏi Q1–Q10 | BA Agent |
| 0.2 | 2026-11-15 | Cập nhật theo chỉ đạo tự xây dựng từ đầu (Zero-Third-Party) & kết quả reverse-engineer Microsoft 365 Web | BA Agent; chỉ đạo chủ dự án |
| 0.3 | 2026-11-15 | Chủ dự án trả lời **9/9 câu hỏi (`Q1`–`Q9`)** qua hội thoại tương tác; chốt dự thảo Scope, 8 AC và nêu rõ rủi ro `.doc`/`.xls`/`.ppt`/`.pdf` tự viết + ERP Storage | BA Agent; hội thoại tương tác |
| 1.1 | 2026-11-15 | **APPROVED 1.1** — 8 quyết định review: token đo thật; File 9 mục + Share nội bộ ERP; Word Comment; Excel 60 hàm + CF/DV đầy đủ; PPT full transition/animation/Morph; PDF/mobile giữ nguyên. Thêm `AC-09`–`AC-12` | Chủ dự án; 8 câu hỏi tương tác |
| 1.2 | 2026-11-15 | **APPROVED 1.2 — phủ sóng đầy đủ client**: thêm Track Changes, header/footer, footnote/endnote/citation, equation/ink/video, Pivot/Table/Slicer/full chart/Name Manager/protection, SmartArt/Icons/Chart/media/Cameo/master, PDF annotation; `AC-13`, `AC-14`; Out-of-scope chỉ còn 13 nhóm service | Chủ dự án; AUDIT-S12-001 |
