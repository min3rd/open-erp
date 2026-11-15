# Báo Cáo Đối Chuẩn Hệ Thống (Benchmarks) — Sprint 16: Plugin Thiết Kế & Kết Xuất Tài Liệu (`plugins/document-template`)

| Thuộc tính | Giá trị |
| :--- | :--- |
| ID | BENCH-S16-001 |
| Sprint | Sprint 16 (`sprint_16_plugin_document_template`) |
| Tác giả | AI Business Analyst (BA) |
| Trạng thái | Draft / Chờ review |
| Phiên bản | 0.1 |
| Tài liệu liên quan | [00_READING_GUIDE.md](../00_READING_GUIDE.md) · [RAW-S16-001](../01_raw_notes/01_RAW-S16-001_document_template_requirements.md) · [ANL-S16-001](../02_analysis/01_ANL-S16-001_document_template_workflows.md) |

---

## 1. Mục Tiêu Đối Chuẩn

Nghiên cứu **10 nền tảng / bộ engine Thiết kế Mẫu In & Kết Xuất Tài Liệu (`Document Generation & Print Engine`)** tiêu biểu ở quy mô Quốc tế và Việt Nam nhằm chắt lọc mô hình tốt nhất cho Open-ERP (`plugins/document-template`):
- **Quốc tế (ERP & Document Generation)**: Odoo Report Engine (`QWeb + Studio`), ERPNext Print Format (`Jinja2`), Carbone.io / Docmosis (`DOCX/XLSX Template Engine`), Conga Composer & PandaDoc (`CRM/P2P Quote-to-Contract & e-Sign`), JasperReports / Stimulsoft (`Banded Pixel-Perfect Reporting`), BarTender / Zebra Designer (`Thermal & Barcode Label`), Gotenberg (`Deterministic HTML/Office-to-PDF`).
- **Việt Nam (ERP & Văn phòng số)**: MISA AMIS (Mẫu chứng từ Thông tư & Đọc số VN), 1Office / Base Print Engine (Form/Workflow sang File trình ký), Fast Business & Bravo ERP (Khổ in A4/A5/Liên & Khối chữ ký chuẩn VN).

---

## 2. Phân Tích Chi Tiết 10 Hệ Thống Đối Thủ

### 2.1. Odoo Report Engine (`QWeb PDF & Studio Designer`)
- **Điểm mạnh**: Gắn liền 100% vào ngữ cảnh chứng từ (`Sales`, `Purchase`, `Inventory`); xem trước trực tiếp; tự động kế thừa thông tin Công ty (`Header/Footer Layout`), hỗ trợ in nhiều phiếu gộp thành 1 PDF (`Batch Print`), và tự động chọn mẫu Email + PDF đính kèm khi bấm *Send by Email*.
- **Hạn chế cần tránh**: Chỉnh sửa sâu phải sửa XML/QWeb hoặc phụ thuộc công cụ `wkhtmltopdf` cũ kỹ hay bị lỗi vỡ bảng/CSS Flexbox hiện đại và thiếu tính năng cho khách upload file `.docx` tự soạn từ Word.

### 2.2. ERPNext Print Format Builder (`Jinja2 / Frappe`)
- **Điểm mạnh**: Giao diện kéo-thả trực quan biến trường từ DocType (bao gồm cả **Custom Fields** tạo thêm) vào lưới bố cục Print Format; hỗ trợ Letterhead (Logo đầu trang/chân trang) riêng theo từng **Company / Branch**; tự động sinh nút In/PDF trên mọi màn hình DocType mà không phải code lại.
- **Hạn chế cần tránh**: Khi cần bảng hợp đồng dài 10–20 trang có đánh số điều khoản phức tạp kiểu Word (`.docx`) thì HTML kéo thả rất khó giữ căn lề chuẩn văn bản hành chính.

### 2.3. Carbone.io & Docmosis (`DOCX / XLSX / ODT Template Engine`)
- **Điểm mạnh**: Triết lý **"Doanh nghiệp tự thiết kế bằng Microsoft Word / Excel quen thuộc"** rồi chèn placeholder `{d.customer.name}` / `{d.lines[i].qty}` + formatters (`:convCurr`, `:formatN`). Giữ nguyên tuyệt đối bố cục văn bản pháp lý phức tạp, bảng biểu Excel có sẵn công thức (`SUM`, `VLOOKUP`) khi xuất ra `.xlsx` hoặc `.pdf`.
- **Hạn chế cần tránh**: Thiếu giao diện thiết kế nhanh tem mã vạch nhiệt `K80` hay khối kéo thả trực quan cho người không muốn mở Word.

### 2.4. Conga Composer & PandaDoc (`CRM/P2P Quote & Contract Automation`)
- **Điểm mạnh**: Mạnh về chuỗi nghiệp vụ với đối tác/khách hàng: kéo dữ liệu từ `Opportunity / Quote / PO`, trộn ra Proposal/Hợp đồng đa trang, cho phép xem trực tuyến, đóng dấu trạng thái, theo dõi **Audit ai đã mở/tải/xem lúc nào** và tích hợp luồng duyệt + chữ ký người mua/người bán.
- **Hạn chế cần tránh**: Nặng về bán hàng/hợp đồng, thiếu hỗ trợ xuất `XLSX` bảng kê và tem nhãn mã vạch Kho (`WMS Label`).

### 2.5. JasperReports & Stimulsoft Reports (`Pixel-Perfect Banded Reports`)
- **Điểm mạnh**: Kiểm soát từng milimet (`Band`: Title, Page Header, Column Header lặp lại mỗi trang, Detail, Group Footer, Page Footer `Trang X / Y`), hỗ trợ xuất nhiều định dạng (`PDF`, `XLSX`, `DOCX`, `HTML`) và rất mạnh khi bảng chi tiết dài hàng trăm dòng.
- **Hạn chế cần tránh**: Đường cong học tập rất cao (đòi hỏi kỹ sư IT dùng Studio chuyên biệt); người dùng HR/Kế toán/Sales phổ thông không tự chỉnh sửa được.

### 2.6. BarTender & Zebra Designer (`Industrial Barcode / QR Label Studio`)
- **Điểm mạnh**: Thiết kế tem nhãn kích thước tùy biến (VD: `50x30 mm`, `100x80 mm`), tem cuộn 2–3 tem/hàng, kéo-thả **Barcode 1D (`Code128`, `EAN13`), `QR Code`**, Lot/HSD/Serial phục vụ Kho (`Sprint 13`) và Tài sản.
- **Hạn chế cần tránh**: Tách rời hoàn toàn khỏi ERP nếu là phần mềm cài máy lẻ -> phải nhúng trình thiết kế tem `mm` ngay trong Visual Studio của ERP.

### 2.7. Gotenberg (`Headless Chromium + LibreOffice PDF Engine`)
- **Điểm mạnh**: Đóng gói sẵn Docker microservice biến `HTML/CSS Paged Media` (hỗ trợ CSS hiện đại `@page`, `break-inside: avoid`, `thead { display: table-header-group }`) và biến `.docx/.xlsx` (qua LibreOffice headless) sang `PDF` chuẩn font Unicode tiếng Việt cực kỳ ổn định.
- **Bài học kiến trúc**: Backend Java không nên tự viết thuật toán dàn trang PDF phức tạp bằng tay từ byte `PDF` thuần; dùng Engine chuẩn hóa (OpenHTMLToPDF / Apache POI / LibreOffice / Gotenberg container giới hạn RAM) bảo đảm chất lượng PDF `A4/A5` & giữ nguyên thiết kế Word/Excel của khách hàng.

### 2.8. MISA AMIS (Mẫu Chứng Từ Thông Tư & Đọc Số Tiếng Việt)
- **Điểm mạnh**: Rất sát thực tế doanh nghiệp Việt Nam: cung cấp sẵn bộ mẫu chuẩn **Thông tư 200 / 133** (Phiếu thu/chi, Phiếu nhập/xuất kho, Đơn đặt hàng, Đối chiếu công nợ), tự động **Đọc số thành chữ tiếng Việt chuẩn ngữ pháp** (*"linh năm"*, *"tỷ đồng chẵn"*), hỗ trợ sửa mẫu bằng Word/Designer ngay trên web và cảnh báo trùng/sai biến.
- **Hạn chế cần tránh**: Đóng kín theo bộ trường cố định của MISA; chưa tự động nhận diện **32 loại trường động + `GRID`** mà Tenant tự thêm bằng `Form Builder`.

### 2.9. 1Office & Base Print / Doc Engine (`Form + Workflow -> Print File`)
- **Điểm mạnh**: Điểm sáng lớn nhất là **mọi Form đề xuất động người dùng tự tạo đều tự động thành biến trộn** đưa ra file `.docx/.pdf` trình ký (Đề xuất mua hàng, Hợp đồng lao động, Đơn nghỉ phép) và gắn chữ ký duyệt từ Workflow vào mẫu in.
- **Hạn chế cần tránh**: Thiếu hỗ trợ chi tiết các bảng kê ERP nhiều trang hoặc **kế thừa mẫu riêng theo từng Chi nhánh (`Branch Override`)** + thiếu kiểm soát **In lại Bản sao (`Original vs Copy #N`)**.

### 2.10. Fast Business & Bravo ERP Print Engine
- **Điểm mạnh**: Rất chặt chẽ về **kiểm soát in ấn tài chính**: khóa in bản chính thức khi phiếu chưa được duyệt (`Watermark NHÁP`), đếm số lần in lại (`In lần 2 - Bản sao`), giữ **Khối chữ ký 4–5 cột cố định không bị tách đôi qua 2 trang** (`keep-together`).
- **Hạn chế cần tránh**: Giao diện chỉnh mẫu còn kỹ thuật, thiếu chức năng trộn Email kèm file gửi trực tiếp đối tác như các công cụ CRM/P2P hiện đại.

---

## 3. Ma Trận So Sánh Tổng Hợp

| Tiêu chí | Odoo | ERPNext | Carbone / Docmosis | PandaDoc / Conga | MISA AMIS | 1Office / Base | **Open-ERP S16 (Đề xuất)** |
| :--- | :---: | :---: | :---: | :---: | :---: | :---: | :---: |
| File Template `.docx` / `.xlsx` (giữ layout Office) | Không | Không | Xuất sắc | Trung bình | Khá | Khá | **Có (tích hợp `office-webapp`)** |
| Visual Studio Kéo-thả (`A4/A5/K80`) & Tem `QR/Barcode` | Khá | Tốt | Không | Tốt | Khá | Không | **Có (hỗ trợ cả Tem nhãn `mm`)** |
| Tự đọc biến từ **Form Builder Động (32 loại trường + `GRID`)** | Hạn chế | Tốt | JSON thủ công | Hạn chế | Hạn chế | Tốt | **100% Tự động (`plugins/form`)** |
| Kế thừa Mẫu 3 Tầng (`System -> Tenant -> Branch`) | Company | Company | Tự code | Workspace | Theo ĐV | Không | **Có (`System -> Tenant -> Branch`)** |
| Đọc số thành chữ chuẩn VN/EN + QR Chuyển khoản/Xác thực | Plugin ngoài | Thủ công | Tự viết | Không | Xuất sắc | Trung bình | **Built-in (`num2words_vi/en` + QR)** |
| Đóng dấu `Watermark` Trạng thái & Kiểm soát `Bản sao #N` | Tùy biến | Khá | Thủ công | Có | Tốt | Không | **Có (Audit + `SHA-256` + Copy #N)** |
| Trộn Email HTML + Đính kèm File & Tự gửi sau Duyệt `Workflow` | Xuất sắc | Tốt | Không | Xuất sắc | Hạn chế | Hạn chế | **Có (Thủ công Drawer + Auto Event)** |
| In & Xuất Hàng loạt (`Merged PDF` / `Bulk ZIP` Async) | Tốt | Tốt | Hạn chế | Hạn chế | Tốt | Không | **Có (`Merged PDF` + Kafka Worker)** |

---

## 4. 12 Bài Học Kiến Trúc Cho Sprint 16 (`L01`–`L12`)

| Mã | Bài học rút ra từ đối chuẩn | Áp dụng vào `plugins/document-template` |
| :--- | :--- | :--- |
| **`L01`** | **Dual-Mode Designer** (Carbone `.docx/.xlsx` + ERPNext/BarTender Visual Studio) | Không ép người dùng chỉ dùng 1 cách: Hợp đồng/Công văn phức tạp dùng `.docx/.xlsx` (sửa trực tiếp bằng **`plugins/office-webapp`**); Phiếu in nhanh, Hóa đơn `K80` & Tem mã vạch Kho dùng **Visual Print/Label Studio**. |
| **`L02`** | **Hợp nhất Biến Trộn Tự Động (`Form + Entity + Workflow`)** (1Office + ERPNext) | Người thiết kế mẫu chỉ cần chọn `Entity` / `Form` trong **Cây Biến Trộn (Merge Field Picker)** gồm cả Trường Lõi (`Entity Registry`), 32 loại trường động + bảng `GRID` + `IMAGE_UPLOAD` + `SIGNATURE` (`plugins/form`) và chữ ký/lịch sử duyệt (`plugins/workflow`). |
| **`L03`** | **Phân giải Mẫu 3 Tầng (`System -> Tenant -> Branch`)** | Khi in tại Chi nhánh A, tự động áp Logo/MST/Địa chỉ/Tài khoản ngân hàng & mẫu riêng của Chi nhánh A nếu có; ngược lại fallback về mẫu Tenant hoặc mẫu chuẩn Hệ thống. |
| **`L04`** | **Tách Riêng Lớp Bảo vệ Dữ liệu Khỏi Render (`Immutable Snapshot + SHA-256`)** | Mọi bản file chính thức sau khi kết xuất gửi đối tác/trình ký đều lưu bản chụp tại MinIO kèm mã băm `SHA-256`, `template_version`, `form_version` và dữ liệu JSON chụp tại thời điểm xuất — sau này sửa mẫu hay sửa form vẫn mở lại đúng bản đã gửi khách hàng. |
| **`L05`** | **Chống Vỡ Font Tiếng Việt & Lỗi Ngắt Trang Khối Ký** (Jasper + Fast/Bravo) | Sử dụng `@page`, CSS `break-inside: avoid` (khóa không cắt đôi bảng dòng hoặc **Khối Chữ Ký 4-5 cột** qua hai trang), lặp lại `thead` mỗi trang mới và nhúng sẵn bộ font Unicode (`Times New Roman` tương đương / `Liberation Serif` / `Inter` / `Roboto`). |
| **`L06`** | **Thư viện Hàm Nghiệp Vụ Việt Nam Tích Hợp Sẵn** (MISA) | Xây dựng sẵn `num2words_vi`, `num2words_en`, `formatCurrency`, `formatDateVi`, `sumColumn`, `pageBreak`, `qrVerify`, `vietQr` (tạo mã QR chuyển khoản ngân hàng trên Báo giá/Đơn hàng/Công nợ). |
| **`L07`** | **Kiểm Soát `Watermark` & Chống Gian Lận Bản Giấy (`QR Verify`)** | Phiếu `DRAFT` / `PENDING` / `CANCELLED` tự ép chìm `Watermark` trên toàn trang PDF; bản chính thức in lại từ lần thứ 2 hiển thị nhãn `BẢN SAO LẦN N` (theo cấu hình mẫu); gắn `QR Code` xác thực giúp quét kiểm tra bản gốc trên hệ thống ngay khi cầm tờ giấy ký tay. |
| **`L08`** | **Tích hợp Trọn Vòng Gửi Email Đối Tác / Khách Hàng** (Odoo + PandaDoc) | Mỗi mẫu tài liệu đi kèm luôn Mẫu tiêu đề & nội dung Email HTML (`Mail-Merge`); bấm 1 nút gửi hoặc cài Workflow duyệt xong tự động gửi PDF cho Đối tác/NCC/Khách hàng và lưu log `SENT/BOUNCED`. |
| **`L09`** | **In Gộp PDF & Hàng Đợi Xuất Hàng Loạt Bất Đồng Bộ** (Odoo Batch Print) | Chọn nhiều dòng trên `@shared/* Table` -> **In gộp 1 file PDF duy nhất** (ngắt trang theo từng phiếu để nhấn `Ctrl+P` 1 lần) hoặc tải `.zip`; tác vụ lớn đẩy qua Kafka Queue tránh timeout HTTP. |
| **`L10`** | **Phê Duyệt `Maker-Checker` & Lưu Vết 4 Tầng** | Không để nhân viên tự ý sửa mẫu Hợp đồng/Hóa đơn rồi in/gửi ngay: yêu cầu duyệt mẫu qua `plugins/workflow` (`Maker != Checker`), ghi Diff Trước/Sau phiên bản mẫu và log đầy đủ ai đã in/tải/gửi mail lúc nào. |
| **`L11`** | **Cung cấp Reusable Frontend Service & Drawer Tích Hợp Cho Mọi Plugin** | Đóng gói thành phần UI `@shared/*` / Web Component slot (`Print & Email Drawer`) để Sprint 13, 14, 15 chỉ cần truyền `(entityType, recordId, branchId)` là có đầy đủ *Chọn mẫu -> Xem trước PDF -> In -> Tải -> Gửi Email*. |
| **`L12`** | **Split-View Designer & Sticky Scroll Table Chuẩn ERP (`AGENTS.md`)** | Toàn bộ Studio thiết kế dùng **Split-View** (Cây biến trộn + Bộ soạn thảo bên trái, Preview PDF thật bên phải — cấm Modal popup); bảng Quản lý Mẫu, Nhật ký In/Gửi Mail dùng `@shared/*` Sticky Scroll Table + Context Menu chuột phải + URL Sync. |
