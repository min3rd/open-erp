# Ghi Chú Yêu Cầu Thô (Raw Notes) — Sprint 16: Plugin Thiết Kế & Kết Xuất Tài Liệu, Mẫu In, Trình Ký & Gửi Email (`plugins/document-template`)

| Thuộc tính | Giá trị |
| :--- | :--- |
| ID | RAW-S16-001 |
| Sprint | Sprint 16 (`sprint_16_plugin_document_template`) |
| Tác giả | AI Business Analyst (BA) |
| Trạng thái | Draft / Chờ review |
| Phiên bản | 0.1 |
| Ngày tạo | 2026-11-15 |

---

## 1. Yêu Cầu Tổng Quan Từ Khách Hàng & Độ Ưu Tiên Triển Khai

- **Nguyên văn yêu cầu từ Khách hàng**:
  > "viết tài liệu cho sprint 16, ưu tiên hơn sprint 13,14,15 là plugin về thiết kế và kết xuất file theo dữ liệu form và file template để phục vụ in ấn, gửi mail,... cho đối tác, khách hàng, in ra ký,..."
- **Định vị Ưu tiên & Kiến trúc Nền tảng**:
  - `plugins/document-template` được **ưu tiên triển khai trước Sprint 13 (`inventory`), Sprint 14 (`crm`) và Sprint 15 (`purchasing`)**, đứng ngang hàng tầng hạ tầng dùng chung với `plugins/form`, `plugins/workflow` (Sprint 08) và `plugins/office-webapp` (Sprint 12).
  - Bất kỳ chứng từ, hồ sơ hay bản ghi Form nào trên Open-ERP đều có thể gắn **Mẫu tài liệu (`Template`)** để **Xem trước (`Preview`) → In ấn (`Print`) / In ra ký tay / Ký số → Xuất tệp (`PDF / DOCX / XLSX`) → Gửi Email cho Đối tác, Nhà cung cấp hoặc Khách hàng** mà từng phân hệ không phải tự lập trình lại cơ chế trộn file hay gửi thư.

---

## 2. Phân Rã 10 Trụ Cột Yêu Cầu Nghiệp Vụ

### 2.1. Thiết Kế Mẫu Đa Chế Độ (`File Template` + `Visual Print & Label Studio`)
1. **Chế độ File Template (`.docx`, `.xlsx`, `.html`)**:
   - Cho phép tải lên mẫu có sẵn (`.docx`, `.xlsx` soạn trong Microsoft Office) hoặc tạo mới & sửa trực tiếp trên trình duyệt thông qua tích hợp **`plugins/office-webapp` (Sprint 12)**.
   - Hỗ trợ thanh tra cứu & bấm copy/chèn trực tiếp thẻ trộn dữ liệu (`Merge Tags`: `{{supplier.name}}`, `{{#each items}}...{{/each}}`, `{{#if discount > 0}}...{{/if}}`) ngay bên cạnh màn hình soạn mẫu.
2. **Chế độ Visual Print & Label Studio (Kéo thả trực quan trên Web)**:
   - Tự thiết kế mẫu in chứng từ chuẩn khổ **`A4`**, **`A5`** (Dọc/Ngang), hóa đơn nhiệt cuộn **`K80 / K58`**, và **Tem nhãn Mã vạch / QR Code (`Barcode 1D Code128/EAN13` & `QR Label`)**.
   - Hỗ trợ thiết lập lề in, **Header lặp lại mỗi trang** (Logo, Tên công ty/Chi nhánh, MST, Địa chỉ), **Footer đánh số `Trang X / Y`**, và **Lặp tiêu đề cột bảng chi tiết** khi danh sách hàng hóa tràn qua nhiều trang.

### 2.2. Kết Nối Dữ Liệu Đa Nguồn (`Entity Registry + plugins/form + plugins/workflow`)
- Tự động tổng hợp cây biến trộn (`Field Picker Tree`) theo ngữ cảnh `entity_type / form_id` mà người dùng không cần nhớ tên biến kỹ thuật:
  1. **Dữ liệu Lõi từ `Entity Registry`**: Thông tin chính của chứng từ (`PR`, `RFQ`, `PO`, `GR`, `DO`, `Quotation`, `Sales Order`, `Contract`, `Invoice`, `Employee`, `Organization/Branch`...).
  2. **Dữ liệu Động từ `plugins/form` (Sprint 08)**: Toàn bộ **32 loại trường**, bao gồm các trường bổ sung lưu trong `custom_fields_data` (`JSONB`), bảng tính dòng **`GRID`** (tự động lặp thành các dòng bảng trong Word/Excel/PDF), tệp ảnh **`IMAGE_UPLOAD`** (nhúng ảnh hiện trường/sản phẩm đúng tỷ lệ) và ảnh chữ ký **`SIGNATURE`**.
  3. **Dữ liệu Phê duyệt từ `plugins/workflow` (Sprint 08)**: Danh sách người đã duyệt, chức danh, thời gian duyệt, ghi chú duyệt và hình ảnh chữ ký số/chữ ký mẫu tương ứng từng bước.

### 2.3. Kế Thừa & Tùy Biến 3 Tầng (`System Default -> Tenant Override -> Branch Override`)
- Giống `plugins/form`, hệ thống cho phép quản trị tùy biến mẫu in & mẫu email theo 3 tầng:
  - **Tầng 3 — `Branch Override` (theo `branch_id` thuộc `organization`)**: Ví dụ Chi nhánh Hà Nội và Nhà máy Bình Dương dùng cùng bộ phần mềm nhưng tự gắn Logo con/Thông tin địa chỉ kho/Hotline/Tài khoản ngân hàng riêng trên mẫu Hóa đơn, Phiếu Giao Hàng, Hợp đồng.
  - **Tầng 2 — `Tenant Override`**: Cấu hình chung cho toàn doanh nghiệp/Tenant.
  - **Tầng 1 — `System Seeded Templates`**: Kho mẫu mặc định dựng sẵn của Open-ERP (chuẩn chứng từ Việt Nam & song ngữ Anh-Việt).

### 2.4. Kết Xuất Đa Định Dạng (`PDF`, `DOCX`, `XLSX`, `HTML`) & Chất Lượng In Ấn Cao
- Xuất **`PDF` chuẩn in ấn (`Vector & Embedded Font Tiếng Việt`)** không vỡ font Unicode tiếng Việt (`Times New Roman`, `Arial`, `Inter`, `Roboto`).
- Xuất **`DOCX`** giữ nguyên định dạng bảng/đề mục để gửi đối tác thương thảo bổ sung điều khoản hợp đồng.
- Xuất **`XLSX`** giữ nguyên công thức tổng kết, định dạng số/tiền tệ để gửi bảng kê đối chiếu công nợ hoặc danh mục báo giá hàng trăm dòng.
- Hỗ trợ chuyển đổi `DOCX/XLSX` sau khi trộn dữ liệu thành `PDF` đồng nhất bố cục trên máy chủ (hoặc qua Worker cô lập).

### 2.5. Bộ Hàm Định Dạng Nghiệp Vụ ERP Việt Nam & Quốc Tế
- Tự động cung cấp thư viện hàm định dạng (`Formatters`) bên trong mẫu:
  - **Đọc số tiền thành chữ** tự động theo ngôn ngữ mẫu: tiếng Việt chuẩn chứng từ kế toán (`num2words_vi`: *"Một trăm hai mươi lăm triệu đồng chẵn"*) và tiếng Anh (`num2words_en`: *"One hundred twenty-five million VND only"*).
  - Định dạng ngày tháng (`dd/MM/yyyy`, `Ngày DD tháng MM năm YYYY`), tiền tệ theo từng mã tiền (`VND`, `USD`, `EUR` với độ chính xác `BigDecimal`), làm tròn, cộng dồn lũy kế từng trang / tổng cuối bảng, viết hoa/viết thường, cắt chuỗi, ảnh QR VietQR chuyển khoản theo số tài khoản & số tiền.

### 2.6. Phục Vụ In Ra Ký, Ký Số, Đóng Dấu `Watermark` & `QR` Xác Thực Bản Giấy
- Hỗ trợ cấu hình **Khối Ký Tên Động (`Signature Block`)**: chọn số cột ký (3, 4 hoặc 5 cột chuẩn chứng từ VN: *Người lập - Người mua/Nhận hàng - Thủ kho/Kế toán - Giám đốc*), tự động điền Họ tên & Chức danh bên dưới sau khi duyệt `workflow` hoặc nhúng ảnh chữ ký/con dấu (khi bật chế độ cho phép).
- **Watermark Trạng thái Thông minh**:
  - Chứng từ ở trạng thái `DRAFT / NHÁP` -> tự động đóng dấu chìm chéo **`BẢN NHÁP / DRAFT`**.
  - Đang chờ duyệt `PENDING_APPROVAL` -> **`CHỜ PHÊ DUYỆT`**.
  - Đã hủy/đảo -> **`ĐÃ HỦY / CANCELLED`** (hoặc chặn xuất bản chính thức).
  - Bản in lần thứ 2 trở đi (khi bật kiểm soát bản gốc) -> tự động đóng watermark **`BẢN SAO LẦN N / COPY #N`**.
- **QR Code Xác Thực Chứng Từ**: Mỗi file PDF xuất ra tự động gắn mã `QR` chứa token xác thực ngắn; khi in ra giấy đưa đi giao hàng hoặc trình ký tay, người kiểm tra quét `QR` trên Mobile/Web để xem chứng từ gốc trên ERP xem có bị chỉnh sửa số tiền/số lượng sau khi in hay không.
- Sẵn sàng vùng đặt chữ ký số (`Signature Placeholder` / `USB Token / Remote CA PDF Signing Hook`) cho phase chữ ký số.

### 2.7. Trộn & Gửi Email Cho Đối Tác / Khách Hàng (`Mail-Merge & Distribution`)
- Mỗi Mẫu tài liệu có thể gắn kèm **Mẫu Email (`Email Subject + Email Body HTML` cũng hỗ trợ biến trộn `{{customer.name}}`, `{{po.code}}`, `{{total_amount}}`)**.
- Hỗ trợ 2 chế độ gửi:
  1. **Gửi thủ công trên màn hình Chứng từ**: Mở Drawer *Xem trước & Gửi Email*, hệ thống tự điền `To` (Email liên hệ chính của Khách hàng/NCC), `CC` (Người phụ trách/Trưởng phòng), Subject, Body đã trộn và đính kèm ngay tệp `PDF / DOCX / XLSX` vừa kết xuất (cho phép chọn gửi thêm tài liệu đính kèm từ chứng từ).
  2. **Gửi tự động theo sự kiện (`Workflow Trigger`)**: Khi chứng từ hoàn tất phê duyệt (VD: `PO Approved -> tự động gửi PDF Đơn đặt hàng + link phản hồi xác nhận cho NCC`; `Quotation Approved -> gửi PDF Báo giá cho Khách hàng`).
- Theo dõi trạng thái gửi (`QUEUED / SENT / FAILED / BOUNCED`) và cho phép gửi lại (`Resend`).

### 2.8. In & Kết Xuất Hàng Loạt (`Batch Print / Merged PDF / Bulk ZIP`)
- Chọn nhiều dòng chứng từ từ `@shared/* Sticky Table` -> Context Menu chuột phải -> **In hàng loạt (`Merge thành 1 file PDF nhiều trang` có ngắt trang riêng từng phiếu để bấm in 1 lần toàn bộ xấp phiếu)** hoặc **Tải gói `.zip`** (mỗi chứng từ 1 file đặt tên theo quy tắc động `{{doc_code}}_{{partner_code}}.pdf`).
- Xử lý bất đồng bộ qua hàng đợi `Kafka` khi số lượng > ngưỡng đồng bộ (VD: > 20 chứng từ) và báo chuông `in-app-notification` khi xong.

### 2.9. Ma Trận Phê Duyệt (`DOA / SoD`) & Lưu Vết Kiểm Toán Bất Biến 4 Tầng
- Áp dụng **Bất kiêm nhiệm (`SoD`)** và duyệt **Maker -> Checker** qua `plugins/workflow` trước khi phát hành (`Publish`) mẫu hợp đồng/hóa đơn chính thức hoặc tắt dấu `Watermark`.
- Lưu vết **4 tầng bất biến**: *(1) Lịch sử duyệt mẫu*, *(2) Diff Trước/Sau khi sửa nội dung file mẫu, thẻ trộn hoặc cấu hình SMTP/Email*, *(3) Cây Truy vết Bản phát hành (`Document Output Lineage`: chứng từ nguồn + `form_version` + `template_version` + mã băm **`SHA-256`** của file xuất ra)*, và *(4) Sổ cái Nhật ký In / Tải / Gửi Email (`Append-only Print & Distribution Ledger`: ai in lần 1 bản gốc, ai in lại bản sao lần 2, ai tải file, đã gửi tới email nào lúc mấy giờ)*.

### 2.10. Tùy Biến Biểu Mẫu Tham Số Kết Xuất & Gửi Email Qua `plugins/form`
- Sử dụng `plugins/form` (Sprint 08) để từng Tenant/Chi nhánh tùy biến **Form Nhập Tham số Trước Khi Kết Xuất (`Runtime Print/Export Parameters`)** (VD: chọn ghi chú giao hàng bổ sung, lý do in lại, chọn người ký thay, ghi chú kèm Email) hoặc trường mở rộng của **Template Registry** theo 3 tầng kế thừa.

---

## 3. Phân Vai Người Dùng & Liên Kết Hệ Sinh Thái

| Vai trò | Trách nhiệm chính | Phạm vi dữ liệu (`Data Scope`) |
| :--- | :--- | :--- |
| **Quản trị Hệ thống / Template Designer** | Upload/Soạn `.docx`/`.xlsx`, thiết kế trên Visual Print/Label Studio, ánh xạ biến trộn `Entity + Form Builder`, cấu hình chữ ký & Email Template. | Toàn Tenant hoặc theo `branch_id` |
| **Người Phê duyệt Mẫu (`Checker / Pháp chế / Kế toán trưởng`)** | Rà soát nội dung pháp lý, bố cục, điều khoản trên mẫu mới/phiên bản mới (`Before/After Diff`) và duyệt `Publish` (`SoD` khác người thiết kế). | Toàn Tenant / Chi nhánh |
| **Nhân viên Nghiệp vụ (`Buyer / Sales / Thủ kho / HR`)** | Chọn mẫu theo chứng từ, Xem trước `PDF`, In phiếu/Tem mã vạch, Xuất `PDF/DOCX/XLSX`, In ra ký hoặc Gửi Email cho đối tác/khách hàng. | Theo quyền chứng từ nguồn (`Own / Team / Branch`) |
| **Kiểm toán / Kế toán / Quản lý** | Tra cứu Drawer `Audit & Lineage`: kiểm tra ai đã in bản gốc vs in lại nhiều lần (`Reprint`), đối chiếu file lịch sử theo `SHA-256` và log gửi Email. | Toàn Chi nhánh / Toàn Tenant |

---

## 4. Ràng Buộc Kỹ Thuật & UI/UX Kế Thừa Từ Bộ Quy Tắc Dự Án

| Nhóm ràng buộc | Yêu cầu bắt buộc từ `AGENTS.md` | Ảnh hưởng tới tài liệu Sprint 16 |
| :--- | :--- | :--- |
| **Multi-Tenant & Ranh giới Plugin** | Cô lập `tenant_id` triệt để; mọi Entity đăng ký Entity Registry; giao tiếp `form`, `workflow`, `office-webapp`, `organization`, `catalog`, `employee`, `in-app-notification` và các plugin nghiệp vụ (`inventory`, `crm`, `purchasing`) 100% qua `PluginDataServiceGrpc` / Kafka (cấm gọi REST chéo, cấm `size = 100`). | Tạo Contract API/gRPC chuẩn hóa để S13/S14/S15 cắm trực tiếp nút `Print / Export / Email` dùng chung. |
| **Lưu trữ Tệp & Bảo mật Tài liệu** | File template `.docx/.xlsx`, hình ảnh chữ ký/logo và bản `PDF` phát hành lưu trên **MinIO Object Storage** theo tiền tố `tenant_id`; sinh **Signed URL có thời hạn** khi tải; lưu **checksum `SHA-256`** chống tráo file. | Không lưu BLOB nhị phân lớn trực tiếp vào cột PostgreSQL. |
| **Data View & Sticky Scroll Table + Context Menu (`#33`)** | Mọi danh sách (*Kho Mẫu tài liệu*, *Lịch sử Kết xuất & In ấn*, *Hàng đợi Gửi Email*, *Batch Jobs*) dùng Table `@shared/*` cố định Header/Footer, chỉ cuộn Content, ẩn/hiện & đổi thứ tự cột, lọc đồng bộ URL và **Context Menu chuột phải** (fallback `>= 40px` Mobile). | Chi tiết tại `ANL-S16-001` Mục `6` & `AC-18` tại `CONF-S16-001`. |
| **Anti-Modal & Route-Driven State** | Cấm mở Modal popup thiết kế mẫu hoặc xem trước in; dùng **Split-View** (*Trình thiết kế / Cây biến trộn bên trái — Live Preview PDF bên phải*), **Nested Route** cho Studio, và **Stacked Drawers** (`?drawer=preview|email|audit`) đồng bộ URL. | Hỗ trợ mở nhanh `Print & Email Drawer` từ mọi màn hình ERP chỉ bằng Query Params. |
| **Zero-Emoji, 100% i18n & Test Thực Dụng** | Giao diện sản phẩm **0 emoji Unicode**, 100% `vi.json`/`en.json`; hỗ trợ đa ngôn ngữ ngay trên bộ mẫu in (`vi/en`); Backend test JUnit 5 + RestAssured trên **PostgreSQL & Redis thật** (tái hiện render `.docx/.xlsx -> .pdf` & kiểm tra tiếng Việt không vỡ font); Frontend **0 file `.spec.ts`**. | Kiểm chứng cả luồng Batch Print lớn & Audit `Reprint` trên Dual-Mode Browser Testing. |
