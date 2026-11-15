# [ANL-S12-001] Phân tích: Plugin Office WebApp

| Trường | Giá trị |
| :--- | :--- |
| ID / loại / sprint | ANL-S12-001 / Phân tích / Sprint 12 |
| Trạng thái / phiên bản / cập nhật | Draft / 0.2 / 2026-11-15 |
| Owner / reviewer | BA Agent / Chưa review |
| Đầu vào | [RAW-S12-001](../01_raw_notes/01_RAW-S12-001_office_webapp_requirements.md) 0.1, [BENCH-S12-001](../03_benchmarks/01_BENCH-S12-001_office_webapp_benchmarks.md) 0.1 |
| Đọc trước / đọc tiếp | [RAW-S12-001](../01_raw_notes/01_RAW-S12-001_office_webapp_requirements.md), [BENCH-S12-001](../03_benchmarks/01_BENCH-S12-001_office_webapp_benchmarks.md) / [CONF-S12-001](../04_confirmation/01_CONF-S12-001_sprint_12_scope_and_ac.md) |

## 1. Mục đích và bối cảnh

Phân tích các yêu cầu R1–R5 của [RAW-S12-001](../01_raw_notes/01_RAW-S12-001_office_webapp_requirements.md) thành User Stories, ranh giới phạm vi đề xuất, quy tắc nghiệp vụ (Business Rules) và các tình huống biên (Edge Cases) dựa trên kết quả đối chuẩn tại [BENCH-S12-001](../03_benchmarks/01_BENCH-S12-001_office_webapp_benchmarks.md).

Mục tiêu của plugin `office-webapp` là mang lại không gian làm việc tài liệu Office (Word, Excel, PowerPoint) **chạy trực tiếp trên trình duyệt (Client-side First)** bên trong Open-ERP, giúp nhân viên văn phòng không cần cài Microsoft Office Desktop hay phụ thuộc vào máy chủ chuyển đổi tài liệu.

### Vai trò người dùng
- **End User (Nhân viên / Quản lý / Người dùng ERP)**: Mở file từ máy tính (hoặc từ ERP), xem nội dung chuẩn xác, chỉnh sửa, lưu lại file về máy (hoặc xuất PDF/tải xuống).
- **Plugin Consumer (Các plugin khác trong ERP)**: Gọi mở preview/edit một file Office (Blob/URL) thông qua route hoặc slot của plugin `office-webapp` (tùy chọn).

## 2. User Stories

### 2.1. Không gian làm việc & Quản lý file phía Client (Workspace & File I/O)

| ID | User Story | Ghi chú |
| :--- | :--- | :--- |
| US-W01 | As an **End User**, I want **mở file Office (`.docx`, `.xlsx`, `.pptx`) bằng kéo-thả hoặc chọn file từ máy tính ngay trên trình duyệt** so that **tôi có thể xem/sửa ngay lập tức mà không cần upload lên server** | File API / File System Access API |
| US-W02 | As an **End User**, I want **làm việc với nhiều file Office cùng lúc dạng tab (hoặc chuyển nhanh file gần đây trong trình duyệt)** so that **tôi đối chiếu số liệu giữa Word và Excel thuận tiện** | Lưu nháp tạm trên IndexedDB (tùy chọn) |
| US-W03 | As an **End User**, I want **lưu thay đổi trực tiếp về file gốc trên máy (trên Edge/Chrome hỗ trợ File System Access API) hoặc tải xuống file mới** so that **công việc không bị mất và giữ đúng định dạng OOXML** | Fallback Download trên Safari/Firefox |
| US-W04 | As an **End User**, I want **tạo mới nhanh một tài liệu trống (Word / Excel / PowerPoint) ngay trên trình duyệt** so that **tôi có thể soạn thảo mới mà không cần file mẫu sẵn** | Template trống chuẩn OOXML |
| US-W05 | As an **End User**, I want **in ấn hoặc xuất tài liệu hiện tại ra PDF ngay từ trình duyệt** so that **tôi gửi bản cố định cho đối tác/lãnh đạo** | Browser Print / Client PDF export |

### 2.2. Trình xem & soạn thảo Word (`.docx`)

| ID | User Story | Ghi chú |
| :--- | :--- | :--- |
| US-D01 | As an **End User**, I want **xem file `.docx` với bố cục trang, bảng biểu, hình ảnh, font chữ và header/footer trung thực** so that **nội dung hiển thị sát với Microsoft Word** | Page layout view |
| US-D02 | As an **End User**, I want **chỉnh sửa văn bản (gõ chữ, in đậm/nghiêng/gạch chân, màu chữ, cỡ chữ, căn lề, danh sách, bảng, chèn ảnh)** so that **tôi hoàn thiện tài liệu ngay trên web** | Simplified Ribbon |
| US-D03 | As an **End User**, I want **tìm kiếm và thay thế văn bản (Find & Replace), hoàn tác/làm lại (Undo/Redo)** so that **tôi rà soát và sửa lỗi nhanh chóng** | Phím tắt `Ctrl+F`, `Ctrl+Z`, `Ctrl+Y` |

### 2.3. Trình xem & bảng tính Excel (`.xlsx`, `.csv`)

| ID | User Story | Ghi chú |
| :--- | :--- | :--- |
| US-X01 | As an **End User**, I want **xem file `.xlsx` nhiều sheet, giữ nguyên định dạng ô, màu sắc, viền, gộp ô (merge cells) và độ rộng cột/hàng** so that **tôi đọc báo cáo bảng tính chính xác** | Multi-sheet tabs ở đáy |
| US-X02 | As an **End User**, I want **nhập/sửa giá trị ô, dùng thanh công thức (Formula Bar) và các hàm phổ biến (`SUM`, `AVERAGE`, `IF`, `VLOOKUP`, `COUNT`...)** so that **tôi tính toán và cập nhật số liệu trực tiếp** | Client formula engine |
| US-X03 | As an **End User**, I want **định dạng ô (số, tiền tệ, phần trăm, font, màu nền, viền), thêm/xóa dòng/cột, sắp xếp và lọc dữ liệu** so that **tôi thao tác bảng tính tương tự Excel Web** | Freeze panes, sort/filter |
| US-X04 | As an **End User**, I want **import/export `.csv` hoặc tải xuống `.xlsx` sau khi chỉnh sửa** so that **tôi trao đổi dữ liệu với các phần mềm khác** | |

### 2.4. Trình xem & trình chiếu PowerPoint (`.pptx`)

| ID | User Story | Ghi chú |
| :--- | :--- | :--- |
| US-P01 | As an **End User**, I want **xem file `.pptx` với thanh danh sách slide thu nhỏ bên trái và khung hiển thị slide chính ở giữa** so that **tôi duyệt nhanh nội dung bài thuyết trình** | Thumbnail pane + Stage |
| US-P02 | As an **End User**, I want **chạy chế độ trình chiếu toàn màn hình (Slideshow / Present Mode) và chuyển slide bằng bàn phím/chuột** so that **tôi thuyết trình trực tiếp từ trình duyệt** | Fullscreen API |
| US-P03 | As an **End User**, I want **chỉnh sửa cơ bản nội dung text trên slide, thêm/xóa/sắp xếp lại thứ tự slide** so that **tôi cập nhật nhanh bài thuyết trình trước giờ họp** | Phụ thuộc lựa chọn engine tại CONF |

### 2.5. Trải nghiệm UI/UX & Tích hợp Open-ERP

| ID | User Story | Ghi chú |
| :--- | :--- | :--- |
| US-U01 | As an **End User**, I want **giao diện Simplified Ribbon 1 dòng gọn gàng, mật độ cao, hỗ trợ Dark/Light theme và đa ngôn ngữ (i18n)** so that **trải nghiệm đồng bộ với Open-ERP và không chiếm mất vùng đọc tài liệu** | Tuân thủ UI/UX Standards |
| US-U02 | As an **End User**, I want **khi mở trên Mobile (Ionic), giao diện tự chuyển sang chế độ đọc tối ưu (Viewer + Zoom + Download)** so that **tôi xem nhanh tài liệu mọi lúc mà không bị vỡ khung** | Dual-Mode Desktop/Mobile |

## 3. Đề xuất ranh giới Scope (chờ chốt tại CONF-S12-001)

| Hạng mục | Đề xuất In-Scope (v1) | Đề xuất Out-of-Scope (Backlog) |
| :--- | :--- | :--- |
| **Kiến trúc thực thi** | 100% Client-side parsing, rendering, editing và export (Zero-Backend conversion) | Server-side LibreOffice/Collabora conversion; WOPI server |
| **Word (`.docx`)** | Xem phân trang trung thực + Sửa văn bản, định dạng cơ bản, bảng, Find/Replace, Undo/Redo + Xuất `.docx` / Print PDF | Track Changes phức tạp, Mail Merge, Macro/VBA |
| **Excel (`.xlsx`, `.csv`)** | Xem & Sửa đa sheet, Formula Bar, hàm tính toán phổ biến, định dạng ô, thêm/xóa dòng/cột, sort/filter, freeze panes + Xuất `.xlsx`/`.csv` | Pivot Table tương tác phức tạp, Power Query, VBA Macros |
| **PowerPoint (`.pptx`)** | Xem danh sách slide + Trình chiếu toàn màn hình (Slideshow) + Sửa text cơ bản / đổi thứ tự slide (tùy chọn engine) | Thiết kế animation phức tạp, SmartArt editor nâng cao, nhúng video editor |
| **Lưu trữ** | Mở file local, lưu đè (File System Access API) hoặc tải xuống; lưu nháp khôi phục trên IndexedDB | Cộng tác đồng thời nhiều người (Real-time Co-authoring / CRDT), lịch sử phiên bản trên Cloud |
| **Định dạng cũ** | Cảnh báo lịch sự nếu người dùng mở `.doc`/`.xls`/`.ppt` (binary cũ chưa hỗ trợ client-side) | Bộ giải mã binary Office 97-2003 |

## 4. Quy tắc nghiệp vụ (Business Rules)

| ID | Quy tắc nghiệp vụ | Liên quan |
| :--- | :--- | :--- |
| **BR-O01** | **Client-Side Privacy Invariant**: Nội dung file người dùng mở từ máy cá nhân **tuyệt đối không được gửi lên Backend** dưới bất kỳ hình thức nào (kể cả telemetry hay log). | R4, US-W01 |
| **BR-O02** | **Lazy Engine Loading**: Các thư viện/WASM xử lý Word, Excel, PowerPoint chỉ được tải động (lazy-load) khi người dùng mở đúng loại file tương ứng, không làm chậm thời gian khởi động Core Open-ERP. | Performance |
| **BR-O03** | **Dirty State Guard**: Khi tài liệu có thay đổi chưa lưu (`isDirty = true`), hệ thống phải hiển thị trạng thái chưa lưu và cảnh báo xác nhận (dùng Drawer/Banner hoặc `beforeunload`, tránh modal lạm dụng) trước khi đóng tab hoặc rời trang. | US-W03 |
| **BR-O04** | **File Size Guardrail**: Hệ thống kiểm tra dung lượng file đầu vào (ngưỡng cảnh báo đề xuất: > 25MB trên Desktop, > 10MB trên Mobile) để tránh treo tab trình duyệt khi xử lý trên RAM client. | Edge Case |
| **BR-O05** | **Extension & MIME Verification**: Kiểm tra magic bytes (ZIP header `PK\x03\x04` của OOXML) bên cạnh phần mở rộng `.docx`/`.xlsx`/`.pptx` để báo lỗi đúng mã i18n khi file bị hỏng hoặc đổi đuôi giả. | Security/UX |
| **BR-O06** | **Read-Only Fallback**: Nếu trình duyệt không hỗ trợ ghi đè hoặc file có thành phần nâng cao không thể sửa an toàn, hệ thống cho phép xem ở chế độ Read-Only và thông báo rõ lý do (không làm hỏng file gốc). | US-W03 |
| **BR-O07** | **100% i18n & Zero-Emoji**: Toàn bộ nhãn Ribbon, thông báo lỗi, tooltip, trạng thái lưu đều dùng key i18n (`vi.json`, `en.json`...). | Guardrails |
| **BR-O08** | **Route-Driven Workspace**: Trạng thái tab loại app / chế độ xem (`?app=word|excel|ppt`, `?mode=view|edit`) được phản ánh trên URL theo quy chuẩn Angular Router. | Guardrails |
| **BR-O09** | **Zero-Third-Party Office Engine**: Toàn bộ bộ giải mã/mã hóa OOXML (ZIP + XML), công cụ render (Page Canvas/DOM, Tiled Grid Canvas, Slide Stage + SVG Selection) và Formula Engine phải **tự xây dựng từ đầu (in-house)** bằng TypeScript + Web APIs chuẩn, **không cài đặt thư viện Office/Editor bên thứ 3**. | R6 |

## 5. Edge Cases & Xử lý lỗi cần thiết kế

1. **File có mật khẩu bảo vệ (Encrypted OOXML)**: Phát hiện sớm và hiển thị thông báo rõ ràng (chưa hỗ trợ mở file mã hóa ở client v1 hoặc yêu cầu gỡ mật khẩu trước).
2. **File Office 97–2003 (`.doc`, `.xls`, `.ppt`)**: Phát hiện magic bytes OLE2 (`D0 CF 11 E0`) và hướng dẫn người dùng lưu lại thành `.docx`/`.xlsx`/`.pptx`.
3. **Font chữ thiếu trên máy người dùng**: Tài liệu dùng font nội bộ (VD: VNI-Times, Calibri không có trên Linux/macOS) → cơ chế fallback font hợp lý để không vỡ bảng.
4. **File Excel quá lớn (hàng chục nghìn dòng / nhiều công thức phức tạp)**: Cần Web Worker hoặc virtual scrolling (như Univer) để không đơ UI thread.
5. **Trình duyệt không hỗ trợ File System Access API (Firefox / Safari)**: Nút "Lưu" tự động chuyển thành "Tải xuống bản sao" kèm thông báo rõ cho người dùng.
