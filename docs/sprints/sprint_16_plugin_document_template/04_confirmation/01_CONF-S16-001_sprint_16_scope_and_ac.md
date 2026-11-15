# Tài Liệu Xác Nhận Phạm Vi & Tiêu Chí Nghiệm Thu — Sprint 16 (`plugins/document-template`)

| Thuộc tính | Giá trị |
| :--- | :--- |
| ID | CONF-S16-001 |
| Sprint | Sprint 16 (`sprint_16_plugin_document_template` — **Ưu tiên trước Sprint 13, 14, 15**) |
| Tác giả | AI Business Analyst (BA) |
| Trạng thái | APPROVED 1.0 — Đã chốt 12/12 câu hỏi (`Q1`–`Q12`) & `AC-01`..`AC-22` bởi Chủ dự án (2026-11-15) |
| Phiên bản | 1.0 |
| Tài liệu đầu vào | [00_READING_GUIDE.md](../00_READING_GUIDE.md) · [RAW-S16-001](../01_raw_notes/01_RAW-S16-001_document_template_requirements.md) · [BENCH-S16-001](../03_benchmarks/01_BENCH-S16-001_document_template_benchmarks.md) · [ANL-S16-001](../02_analysis/01_ANL-S16-001_document_template_workflows.md) |

> [!NOTE]
> **Gate `CONF-S16-001` đã được Chủ dự án PHÊ DUYỆT (`APPROVED 1.0`) ngày `2026-11-15`**: toàn bộ 12 quyết định nghiệp vụ (`Q1`–`Q12`) và 22 tiêu chí `AC-01`–`AC-22` đã chốt theo Đề xuất BA. Bước 05 (`SOL-S16-*`) và Bước 06 (`DES-S16-*`) chính thức mở khóa cho Architect (và được ưu tiên thực hiện trước Sprint 13, 14, 15).

---

## 1. Bảng Câu Hỏi Chốt Quyết Định Nghiệp Vụ (`Q1`–`Q12`)

| Mã | Chủ đề cần quyết định | Các phương án lựa chọn | Đề xuất của BA | Phản hồi Khách hàng |
| :--- | :--- | :--- | :--- | :--- |
| **`Q1`** | **Mức Ưu Tiên Triển Khai Trước Sprint 13, 14, 15** | Chốt ưu tiên triển khai **Sprint 16 (`plugins/document-template`) trước Sprint 13 (`inventory`), Sprint 14 (`crm`), Sprint 15 (`purchasing`)** để 3 phân hệ này tái sử dụng ngay nút *In / Xuất PDF-DOCX-XLSX / Gửi Email / Tem mã vạch* khi xây dựng? | **Có**, tránh các Sprint sau phải làm lại cơ chế in ấn, trộn mẫu hoặc gửi mail cục bộ. | Đã chốt theo Đề xuất BA (2026-11-15) |
| **`Q2`** | **Chế độ Thiết kế Mẫu (`Dual-Mode Designer`)** | **(A)** Hỗ trợ đồng thời cả **Upload/Soạn File Template `.docx` / `.xlsx` (kết nối `plugins/office-webapp` Sprint 12)** lẫn **Visual Print & Label Studio** (A4/A5/K80 & Tem Barcode `mm`).<br>**(B)** Chỉ làm Visual Studio HTML kéo thả, không hỗ trợ trộn file `.docx / .xlsx`. | **Phương án A** (Hợp đồng/Bảng kê phức tạp cực kỳ cần `.docx/.xlsx` giữ nguyên định dạng của Khách hàng, còn phiếu kho/hóa đơn nhiệt/tem mã vạch cần Visual Studio). | Đã chốt theo Đề xuất BA (2026-11-15) |
| **`Q3`** | **Tích Hợp Tự Động Biến Trộn Từ `plugins/form` & `workflow`** | Cây Biến Trộn (`Merge Field Picker`) tự động nạp đầy đủ Trường Lõi (`Entity Registry`) + **32 loại trường động (`custom_fields_data` JSONB, bảng lặp `GRID`, ảnh `IMAGE_UPLOAD`, chữ ký `SIGNATURE`) từ `plugins/form`** + Chữ ký/Lịch sử duyệt từ `plugins/workflow`? | **Có**, đảm bảo mọi trường Tenant tự thêm trên Form Builder đều in được ra tài liệu không cần viết code. | Đã chốt theo Đề xuất BA (2026-11-15) |
| **`Q4`** | **Kế Thừa Mẫu 3 Tầng (`System -> Tenant -> Branch`)** | Cho phép kế thừa 3 tầng: mẫu dùng chung của Hệ thống (`System Seed`) -> tùy biến cấp `Tenant` -> tùy biến riêng cấp `Chi nhánh` (`branch_id` thuộc `organization`, đổi Logo/MST/Địa chỉ/Tài khoản/Điều khoản riêng)? | **Có**, bắt buộc cho doanh nghiệp đa chi nhánh hoặc công ty thành viên dùng chung một hệ thống ERP. | Đã chốt theo Đề xuất BA (2026-11-15) |
| **`Q5`** | **Định Dạng Kết Xuất & Engine Chuyển Đổi Sang PDF** | **(A)** Hỗ trợ đủ `PDF`, `DOCX`, `XLSX`, `HTML`; với template `.docx/.xlsx` sang `.pdf` dùng worker chuyển đổi chuẩn hóa (container cô lập giới hạn RAM theo `docker-compose.yml` profile).<br>**(B)** Chỉ hỗ trợ HTML -> PDF. | **Phương án A** (Đảm bảo xuất được `.docx` thương thảo hợp đồng, `.xlsx` bảng kê có công thức và render `.pdf` trung thực bố cục Word/Excel). | Đã chốt theo Đề xuất BA (2026-11-15) |
| **`Q6`** | **In Ra Ký, Watermark Trạng thái & `Bản Gốc vs Bản Sao`** | Áp dụng tự động ép **`Watermark` (`BẢN NHÁP / CHỜ DUYỆT / ĐÃ HỦY`)** khi chứng từ chưa duyệt, hỗ trợ **Khối Chữ ký chuẩn VN không tách trang** + **đếm bản in (`BẢN GỐC` vs `BẢN SAO LẦN N`)** theo cấu hình từng mẫu? | **Có**, vừa phục vụ ký giấy chuẩn mực Việt Nam vừa chống in nháp lậu hoặc in trùng chứng từ tài chính. | Đã chốt theo Đề xuất BA (2026-11-15) |
| **`Q7`** | **Mã `QR Code` Xác Thực Chứng Từ Giấy (`QR Verify`)** | Tự động gắn `QR Verify Token` trên các mẫu chứng từ tài chính/giao nhận quan trọng để quét trên Mobile/Web đối chiếu lại bản gốc trên ERP (trạng thái, tổng tiền, mã băm `SHA-256`) sau khi in ra ký tay? | **Có**, giải quyết triệt để rủi ro chỉnh sửa bản giấy trước hoặc sau khi ký tươi. | Đã chốt theo Đề xuất BA (2026-11-15) |
| **`Q8`** | **Chế Độ Gửi Email Đối Tác / Khách Hàng (`Mail-Merge`)** | Bao gồm luôn **Mẫu Email đi kèm (`Subject + Body HTML` có biến trộn `vi/en`)**, cho phép **Gửi thủ công trên Drawer chứng từ** (chỉnh To/CC/nội dung/đính kèm) và **Tự động gửi qua `Workflow Event`** ngay trong Sprint 16? | **Có**, khép kín luồng từ tạo chứng từ -> kết xuất file -> gửi đối tác/khách hàng. | Đã chốt theo Đề xuất BA (2026-11-15) |
| **`Q9`** | **In Gộp & Kết Xuất Hàng Loạt (`Batch Print / Bulk ZIP`)** | Hỗ trợ tick chọn nhiều dòng trên `@shared/* Table` để **In gộp 1 file PDF** (tùy chọn chèn trang trắng khi in 2 mặt) hoặc tải `.zip` qua **Kafka Async Worker** khi lô lớn (`> 20` chứng từ)? | **Có**, cực kỳ cần thiết cho Thủ kho/Kế toán khi in hàng chục phiếu giao hàng hoặc gửi bảng kê công nợ cuối tháng. | Đã chốt theo Đề xuất BA (2026-11-15) |
| **`Q10`** | **Kho Mẫu Chuẩn Dựng Sẵn (`System Seeded Templates`)** | Đóng gói sẵn bộ mẫu chuẩn Việt Nam (`A4/A5`, `Tem Barcode`, `Hợp đồng DOCX`, `Đọc số tiền thành chữ Tiếng Việt/Anh`, `VietQR`) cho các phân hệ Kho, Bán hàng/CRM, Mua hàng, Nhân sự ngay trong Sprint 16? | **Có**, giúp Tenant cài xong dùng được ngay trước khi tùy biến nâng cao. | Đã chốt theo Đề xuất BA (2026-11-15) |
| **`Q11`** | **Phê Duyệt `Maker-Checker` (`SoD`) & Lưu Vết 4 Tầng + `SHA-256`** | Áp dụng `SoD` qua `plugins/workflow` (`Designer != Checker` khi Publish mẫu hợp đồng/hóa đơn, duyệt Ngoại lệ In lại bản gốc, duyệt đổi SMTP/Con dấu) và lưu vết 4 tầng bất biến (`Approval History`, `Template Diff`, `Document Output Lineage + SHA-256`, `Append-only Print/Email Ledger`) + Drawer `Audit & Lineage`? | **Có**, bắt buộc cho kiểm soát nội bộ và truy vết trách nhiệm khi có tranh chấp tài liệu gửi đối tác. | Đã chốt theo Đề xuất BA (2026-11-15) |
| **`Q12`** | **Tùy Biến Form Tham Số Trước Khi In / Gửi Email Qua `plugins/form`** | Sử dụng `plugins/form` (Sprint 08 — 32 loại trường) cho phép từng Tenant / Chi nhánh tùy biến **Form Tham số Kết xuất & Email** (`System -> Tenant -> Branch`), giữ `System Locked Core Fields` và lưu `runtime_params_data` (`JSONB`) + `form_version`? | **Có**, tránh hardcode các popup nhập tham số in cục bộ cho từng khách hàng khác nhau. | Đã chốt theo Đề xuất BA (2026-11-15) |

---

## 2. Phạm Vi Đề Xuất (Proposed Scope — `plugins/document-template`)

### 2.1. Trong Phạm Vi Sprint 16 (In-Scope — Triển Khai Trước Sprint 13, 14, 15)
1. **Kho Mẫu, Kế thừa 3 Tầng & Thiết kế Đa Chế độ**:
   - Quản lý Kho Mẫu theo phân hệ (`inventory`, `crm`, `purchasing`, `form`, `employee`), đa ngôn ngữ (`vi/en`), đa phiên bản (`v1, v2...`), kế thừa 3 tầng (`System -> Tenant -> Branch Override`).
   - Dual-Mode Designer: Upload/Sửa `.docx`, `.xlsx` trực tiếp trên trình duyệt qua **`plugins/office-webapp` (Sprint 12)** + **Visual Print & Label Studio** (khổ `A4/A5/K80/K58` và Tem `Barcode 1D / QR` kích thước `mm`).
2. **Kết nối Dữ liệu Hợp nhất (`Entity Registry + plugins/form + plugins/workflow`)**:
   - Cây Biến Trộn tự động nạp Trường Lõi chứng từ, **32 loại trường động từ `plugins/form`** (`custom_fields_data JSONB`, `GRID`, `IMAGE_UPLOAD`, `SIGNATURE`), `Approval History` từ `plugins/workflow`, và thông tin Chi nhánh từ `organization`.
   - Thư viện hàm ERP dựng sẵn: `num2words_vi`, `num2words_en`, `formatCurrency`, `formatDate`, `VietQR`, `qrVerify`, lặp `thead` và giữ nguyên Khối Ký tên (`break-inside: avoid`).
3. **Kết xuất File, In Ra Ký & Bảo Vệ Bản Giấy**:
   - Kết xuất `PDF` (Unicode tiếng Việt không vỡ font), `DOCX` (thương thảo), `XLSX` (giữ công thức/dịch dòng tổng), `HTML`.
   - Tự động ép `Watermark` trạng thái (`NHÁP / CHỜ DUYỆT / ĐÃ HỦY`), kiểm soát `BẢN GỐC` vs `BẢN SAO LẦN N`, gắn `QR Verify` và lưu bản chụp phát hành trên **MinIO** kèm mã băm **`SHA-256`**.
4. **Gửi Email Đối tác / Khách hàng & Xử lý Hàng loạt (`Batch`)**:
   - Companion Email Template (`Subject + Body HTML` trộn biến), gửi thủ công qua Drawer hoặc tự động khi `plugins/workflow` duyệt xong; log trạng thái `SENT/FAILED/BOUNCED` + `Resend`.
   - In gộp `Merged PDF` (kèm tùy chọn đệm trang trắng in 2 mặt) & xuất `.zip` bất đồng bộ qua `Kafka Worker` + `in-app-notification`.
5. **Phê duyệt (`DOA / SoD`), Lưu vết 4 Tầng & Bộ UI Reusable Cho Sprint 13–15**:
   - `Maker-Checker` duyệt Publish mẫu, duyệt In lại Bản gốc, Diff Trước/Sau, Drawer `Audit & Lineage` (`?drawer=audit`).
   - Toàn bộ bảng danh sách dùng `@shared/*` Table cố định Header/Footer (chỉ cuộn Content), tùy biến cột/số hàng, đồng bộ URL và **Context Menu chuột phải** (fallback `>= 40px` Mobile).
   - Cung cấp component/slot dùng chung (`Print & Email Drawer`) để Sprint 13, 14, 15 gắn trực tiếp vào mọi màn hình chứng từ.
6. **Tùy Biến Form Tham Số Kết Xuất & Email Qua `plugins/form`**:
   - Phân giải Form Tham số 3 tầng (`System -> Tenant -> Branch`), khóa `System Locked Core Fields`, lưu `runtime_params_data` (`JSONB`) + `form_version`, tích hợp cột/bộ lọc trên Sticky Table.

### 2.2. Ngoài Phạm Vi Sprint 16 (Out-of-Scope — Dời Sang Sprint / Gói Chuyên Sâu Sau)
- **Tích hợp Hạ tầng Ký Số Pháp Lý Đầy Đủ (`USB Token Plugin / VNPT SmartCA / Viettel-CA / eKYC OTP`)**: Sprint 16 chuẩn bị sẵn vị trí chữ ký trên PDF và hook tích hợp, chưa phát hành tích hợp cổng CA thương mại của bên thứ ba.
- **Khởi chạy Chiến dịch Email Marketing Hàng Loạt (`Newsletter / Bulk Campaign Tracking Open-Click` hàng chục ngàn địa chỉ)** — Sprint 16 tập trung gửi Email nghiệp vụ giao dịch (`Transactional / Operational Email`) gắn với từng chứng từ cho Khách hàng/NCC/Đối tác.
- **Kết nối Driver Máy In Vật Lý Nội Bộ Cài Ngầm (`Direct Silent OS Print Daemon`)**: Việc in thực hiện qua hộp thoại in chuẩn trình duyệt (hỗ trợ cả `A4` và máy in nhiệt `K80`/tem `TSC/Zebra` đã cài trên OS).

---

## 3. Bộ 22 Tiêu Chí Nghiệm Thu (`AC-01` – `AC-22`)

| Mã AC | Nhóm | Mô tả tiêu chí nghiệm thu cụ thể & đo lường được |
| :--- | :--- | :--- |
| **`AC-01`** | Multi-Tenant & Bảo mật MinIO | Cô lập `tenant_id` nghiêm ngặt mọi mẫu, lịch sử xuất file, log email; file lưu MinIO theo tiền tố tenant và chỉ tải qua Signed URL có thời hạn. |
| **`AC-02`** | Phân giải Mẫu 3 Tầng (`System -> Tenant -> Branch`) | Khi in/gửi mail tại Chi nhánh có cấu hình `Branch Override`, hệ thống chọn đúng mẫu Chi nhánh; Chi nhánh không Override tự rơi về `Tenant` hoặc `System Default`. |
| **`AC-03`** | Hợp nhất Biến Trộn (`Entity + Form + Workflow`) | Cây Biến Trộn tự động hiển thị đủ Trường Lõi, toàn bộ 32 loại trường động (`custom_fields_data` + `GRID` + `IMAGE_UPLOAD` + `SIGNATURE`) từ `plugins/form` và bước duyệt từ `plugins/workflow`. |
| **`AC-04`** | Thiết kế File `.docx / .xlsx` & Tích hợp `office-webapp` | Upload hoặc mở chỉnh sửa trực tiếp `.docx/.xlsx` qua `plugins/office-webapp`; XML runs bị Word cắt vụn vẫn match `{{tag}}` chính xác; có Validator báo biến sai cú pháp. |
| **`AC-05`** | Visual Print & Label Studio (`A4/A5/K80/Tem mm`) | Thiết kế được mẫu khổ `A4`, `A5`, cuộn `K80` và Tem nhãn kích thước `mm` kèm `Barcode 1D / QR Code`; Live Preview PDF đúng kích thước thiết kế. |
| **`AC-06`** | Kết xuất PDF Chuẩn Unicode & Đa Trang | Xuất PDF tiếng Việt 100% không lỗi font/mất dấu; bảng `>= 100` dòng tự lặp `thead` ở trang mới; **Khối Chữ Ký không bị tách đôi qua 2 trang** (`break-inside: avoid`). |
| **`AC-07`** | Kết xuất `DOCX` & `XLSX` Giữ Công Thức | Xuất `.docx` mở chỉnh sửa sạch; xuất `.xlsx` nhiều dòng tự động dịch chuyển dòng tổng bên dưới và cập nhật đúng dải công thức (`=SUM(...)`). |
| **`AC-08`** | Hàm Nghiệp vụ VN & `VietQR` | `num2words_vi` / `num2words_en` đọc chính xác tới hàng tỷ và phần lẻ; ảnh `IMAGE_UPLOAD` và `SIGNATURE` từ Form hiển thị đúng kích thước; tạo được `VietQR` động đúng số tài khoản & số tiền. |
| **`AC-09`** | `Watermark` Trạng thái & `Bản Gốc vs Bản Sao #N` | Chứng từ `DRAFT/PENDING/CANCELLED` bắt buộc dính `Watermark` trên PDF; lần in 1 ghi `ORIGINAL`, từ lần in 2 ghi `REPRINT COPY #N` trừ khi có duyệt Ngoại lệ. |
| **`AC-10`** | `QR Verify` Xác Thực Bản Giấy | Quét QR in trên PDF gọi đúng endpoint xác thực trả về metadata chứng từ gốc & khớp `SHA-256`; nếu chứng từ đã chỉnh sửa/hủy sau giờ in, màn hình xác thực cảnh báo đỏ rõ ràng. |
| **`AC-11`** | Trộn & Gửi Email Đối tác / Khách hàng | Trộn `Subject + HTML Body` đa ngôn ngữ + đính kèm `PDF/DOCX/XLSX` gửi được cả **thủ công trên Drawer** và **tự động qua Kafka từ `plugins/workflow`**; log đủ `SENT/FAILED/BOUNCED` + `Resend`. |
| **`AC-12`** | In Gộp `Merged PDF` & Xuất `.zip` Hàng Loạt | Chọn `<= 20` phiếu tạo `Merged PDF` tức thì (hỗ trợ chèn trang trắng in 2 mặt); chọn `> 20` phiếu đẩy vào Kafka Worker xuất `.zip` và gửi `in-app-notification` khi xong. |
| **`AC-13`** | Kho Mẫu Chuẩn Dựng Sẵn & Nút Gắn Cho S13/14/15 | Có sẵn `System Seeded Templates` cho Kho, CRM, Purchasing, Form/Employee; cung cấp Drawer dùng chung cho phép Sprint 13/14/15 gắn chỉ bằng `(entityType, recordId, branchId)`. |
| **`AC-14`** | Bảo toàn Phiên bản Cũ (`Immutable Published Snapshot`) | Nâng cấp Form lên `v2` hoặc sửa Mẫu lên `v3` không làm sai lệch hoặc không xem lại được bản `PDF + SHA-256` đã xuất trước đó từ chứng từ lịch sử. |
| **`AC-15`** | Kiến trúc Liên Plugin Sạch & Zero Rest Chéo | Mọi dữ liệu từ `organization`, `catalog`, `employee`, `form`, `workflow`, `inventory`, `crm`, `purchasing` nạp qua `PluginDataServiceGrpc` (dùng `pageThrough`, cấm `size = 100` cứng) & Kafka. |
| **`AC-16`** | Hiệu năng Render & Nén Ảnh Tự động | Ảnh `IMAGE_UPLOAD` dung lượng lớn tự nén hợp lý khi xuất PDF (không gây lỗi > giới hạn dung lượng Email); xử lý lỗi biến rỗng không in ra chuỗi thô `{{...}}` hay `null`. |
| **`AC-17`** | API Contract & Code Quality | 100% API Backend tuân thủ 4 khuôn mẫu `api_standards.md`, trả `code` `UPPER_SNAKE_CASE`, dùng DTO `record` và `ResponseKey` (cấm `Map<String, Object>`). |
| **`AC-18`** | Data View, Sticky Table & Context Menu | Tất cả danh sách (*Kho Mẫu*, *Lịch sử Xuất/In*, *Hàng đợi Email*, *Batch Jobs*) dùng Table `@shared/*` cố định Header/Footer (chỉ cuộn Content), ẩn/hiện & đổi thứ tự cột, lọc đồng bộ URL & **Context Menu chuột phải** (fallback `>= 40px` trên Mobile). |
| **`AC-19`** | Anti-Modal, Route-State, i18n & Zero-Emoji | Dùng Split-View Studio, Nested Routes và Stacked Drawers (`?drawer=doc-output|audit`) thay Modal popup; 100% i18n `vi.json`/`en.json`, **0 emoji Unicode**, **0 file `.spec.ts`**. |
| **`AC-20`** | Kiểm thử Thực dụng & Dual-Mode QA | Backend vượt qua JUnit 5 + RestAssured trên **PostgreSQL, Redis & MinIO thật** (test render `.docx/.xlsx -> .pdf` có tiếng Việt & Batch Kafka Job); QA chạy Dual-Mode Browser Testing (`>= 1280px` & Ionic `390x844 px`, `overflow = 0`, `touch >= 40px`, **0 `console.error`**) kèm ảnh chụp nghiệm thu. |
| **`AC-21`** | Phê duyệt `SoD` & Lưu vết 4 Tầng (`SHA-256`) | Chặn `Maker` tự duyệt `Publish` mẫu hoặc tự duyệt `Reprint Original Override` với `403 SOD_VIOLATION`; `Approval History`, `Template Diff`, `Document Output Lineage + SHA-256` và `Print/Email Ledger` bất biến dưới DB và hiển thị đủ trong Drawer `Audit & Lineage`. |
| **`AC-22`** | Form Tham số Động (`plugins/form`) Đa tầng | Phân giải 3 tầng (`Branch -> Tenant -> System`) hoạt động đúng trên Form Tham số In/Email; dữ liệu `runtime_params_data` truyền đúng vào `{{params.*}}` và xem lại được từ lịch sử Output. |

---

## 4. Ma Trận Giao Diện & Kiểm Chứng Dual-Mode (Desktop vs. Mobile)

| Màn hình / Luồng chính | Desktop Web (`>= 1280px`) | Mobile Ionic (`390x844 px`) | Trạng thái đồng bộ URL (`Route-Driven`) |
| :--- | :---: | :---: | :--- |
| Kho Mẫu (`Templates Registry`) | Đầy đủ (Sticky Table + Filter tầng + Context Menu) | Tra cứu nhanh danh sách mẫu đang phát hành | `?module=...&scope=SYSTEM|TENANT|BRANCH&status=...` |
| Studio Thiết kế (`.docx/.xlsx` `office-webapp` & Visual/Label) | Đầy đủ (Split-View Cây biến + Designer + Live PDF) | Không hỗ trợ thiết kế mẫu trên Mobile | `/document-template/studio/:id?tab=design|preview|email` |
| Drawer Xem trước, In & Xuất `PDF/DOCX/XLSX` | Đầy đủ (Split-View Form tham số + PDF Preview) | Xem PDF chứng từ nhanh & Bấm Chia sẻ/In OS (`>= 40px`) | `?drawer=doc-output&template=...&format=PDF` |
| Drawer Trộn & Gửi Email Đối tác / Khách hàng | Đầy đủ (Soạn nội dung + To/CC + Đính kèm + Resend) | Bấm Gửi nhanh theo mẫu Email đã cấu hình sẵn (`>= 40px`) | `?drawer=doc-output&step=email&id=...` |
| In Gộp / Xuất Hàng Loạt & Batch Jobs | Đầy đủ (Context Menu Sticky Table + Kafka Job) | Chỉ xem trạng thái hoàn tất của Job cá nhân | `?tab=batch-jobs&status=...` |
| Quét `QR Verify` Bản Giấy | Kiểm tra từ URL xác thực | **Đầy đủ**: Camera quét QR đối chiếu bản gốc ERP (`>= 40px`) | `/document-template/verify/:token` |
| Phê duyệt (`DOA/SoD`) & Drawer `Audit & Lineage` | Đầy đủ (Timeline + Diff + `SHA-256` Lineage + Print Log) | Duyệt Publish/Reprint trên `Workflow` & Xem lịch sử | `?drawer=audit&auditTab=approval|diff|lineage|print-log` |
