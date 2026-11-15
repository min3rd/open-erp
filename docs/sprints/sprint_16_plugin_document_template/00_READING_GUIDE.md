# Sprint 16 Reading Guide — Plugin Thiết Kế & Kết Xuất Tài Liệu, Mẫu In, Trình Ký & Gửi Email (`plugins/document-template`)

| Thuộc tính | Giá trị |
| :--- | :--- |
| ID | READ-S16-001 |
| Sprint | Sprint 16 — `sprint_16_plugin_document_template` (**Ưu tiên triển khai trước Sprint 13, 14, 15**) |
| Trạng thái | Draft / Discovery (Chờ Khách hàng review & chốt `CONF-S16-001` `Q1`–`Q12`) |
| Phiên bản | 0.1 |
| Điều phối / Cập nhật | AI BA & Coordinator Agent |
| Tài liệu nền tảng | [AGENTS.md](../../../AGENTS.md) · [core_sdlc.md](../../../.agents/rules/core_sdlc.md) · [ui_ux_standards.md](../../../.agents/rules/ui_ux_standards.md) · [api_standards.md](../../../.agents/rules/api_standards.md) |

---

## 1. Mục Tiêu & Vị Trí Chiến Lược (Ưu Tiên Trước Sprint 13, 14, 15)

Xây dựng **Plugin Thiết Kế & Kết Xuất Tài Liệu (`plugins/document-template`)** làm **hạ tầng nền tảng ngang (Horizontal Document Generation & Distribution Engine)** dùng chung cho toàn bộ hệ sinh thái Open-ERP.

> [!IMPORTANT]
> **Thứ tự ưu tiên triển khai**: **Sprint 16 (`plugins/document-template`) được ưu tiên thực hiện trước Sprint 13 (`plugins/inventory`), Sprint 14 (`plugins/crm`) và Sprint 15 (`plugins/purchasing`)** cùng với `plugins/form` & `plugins/workflow` (Sprint 08) và `plugins/office-webapp` (Sprint 12). Khi các phân hệ Kho, Khách hàng/Bán hàng và Mua hàng đi vào vận hành, toàn bộ phiếu nhập/xuất, báo giá, hợp đồng, đơn mua hàng và email gửi đối tác/khách hàng sẽ gọi thống nhất vào `plugins/document-template` mà không phải tự viết engine in ấn hay gửi file riêng lẻ.

Năng lực cốt lõi của `plugins/document-template`:
1. **Kết hợp Dữ liệu Đa nguồn**: Tự động đọc schema & cây biến trộn (`Merge Fields`) từ **Trường lõi (`Entity Registry`)**, **32 loại Trường động (`custom_fields_data` JSONB, bảng lặp `GRID`, ảnh `IMAGE_UPLOAD`, chữ ký `SIGNATURE`)** của `plugins/form`, và **Lịch sử / Chữ ký Duyệt** của `plugins/workflow`.
2. **Thiết kế Mẫu Đa Chế độ (`Dual-Mode Designer`)**: Upload/soạn trực tiếp file **`.docx` / `.xlsx` / `.html`** (liên kết `plugins/office-webapp`) kết hợp **Visual Print & Label Studio** (A4/A5, cuộn nhiệt `K80/K58`, Tem nhãn `Barcode 1D / QR`).
3. **Kế thừa 3 Tầng (`System Default -> Tenant Override -> Branch Override`)**: Mỗi Tenant và từng Chi nhánh (`branch_id` thuộc `organization`) tùy biến logo, thông tin pháp nhân, điều khoản, ngôn ngữ (`vi/en`) và phiên bản mẫu (`template_version`).
4. **Kết xuất File, In Ra Ký & Chống Giả Mạo**: Xuất `PDF`, `DOCX`, `XLSX`, `HTML`; nhúng khối chữ ký chuẩn VN, chữ ký ảnh/chữ ký duyệt, **Watermark trạng thái** (`BẢN NHÁP`, `CHỜ DUYỆT`, `ĐÃ HỦY`, `BẢN SAO LẦN N`) và **QR Code xác thực bản gốc** khi in ra ký giấy.
5. **Trộn & Gửi Email Cho Đối Tác / Khách Hàng (`Mail-Merge`) + In Hàng Loạt (`Batch Print`)**: Gửi email HTML kèm file đính kèm (thủ công hoặc tự động sau bước duyệt `workflow`), in gộp PDF nhiều chứng từ trong 1 lệnh hoặc nén `.zip` qua hàng đợi Kafka.
6. **Phê duyệt (`DOA / SoD`) & Lưu vết 4 Tầng (`SHA-256` & `Reprint Copy Log`) + UI chuẩn ERP**: `@shared/*` Sticky Scroll Table + Context Menu chuột phải, Anti-Modal, Route-Driven State, 100% i18n, Zero-Emoji.

---

## 2. Bản Đồ Tài Liệu & Trình Tự Đọc (Bước 00–09)

| Bước | Mã tài liệu | Tệp | Nội dung chính | Phiên bản | Trạng thái |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `00` | `READ-S16-001` | [00_READING_GUIDE.md](./00_READING_GUIDE.md) | Định hướng đọc, mức ưu tiên trước S13–S15, phụ thuộc liên plugin, cổng gate | `0.1` | Active |
| `01` | `RAW-S16-001` | [01_RAW-S16-001_document_template_requirements.md](./01_raw_notes/01_RAW-S16-001_document_template_requirements.md) | Yêu cầu gốc từ Khách hàng, 10 trụ cột thiết kế & kết xuất file, phân vai & ràng buộc | `0.1` | ⏳ Pending Review |
| `03` | `BENCH-S16-001` | [01_BENCH-S16-001_document_template_benchmarks.md](./03_benchmarks/01_BENCH-S16-001_document_template_benchmarks.md) | Đối sánh 10 hệ thống thiết kế mẫu in/document generation (Odoo QWeb, ERPNext, Carbone/Docmosis, Conga/PandaDoc, Jasper/Stimulsoft, Bartender, Gotenberg, MISA, 1Office/Base, Fast/Bravo) + 12 bài học | `0.1` | ⏳ Pending Review |
| `02` | `ANL-S16-001` | [01_ANL-S16-001_document_template_workflows.md](./02_analysis/01_ANL-S16-001_document_template_workflows.md) | Kiến trúc lõi, 9 luồng nghiệp vụ (`Merge Fields`, 3-Tier Override, `PDF/DOCX/XLSX`, In ra ký & QR, Email đối tác, Batch Print, `DOA/SoD` & Lưu vết 4 tầng), `BR-D01..D18`, `10 Edge Cases`, `26 User Stories` & chuẩn UI | `0.1` | ⏳ Pending Review |
| `04` | `CONF-S16-001` | [01_CONF-S16-001_sprint_16_scope_and_ac.md](./04_confirmation/01_CONF-S16-001_sprint_16_scope_and_ac.md) | Bộ 12 câu hỏi chốt (`Q1`–`Q12`), Scope In/Out & 22 Acceptance Criteria (`AC-01`..`AC-22`) | `0.1` | ⏳ Pending Client Sign-off |
| `05` | `SOL-S16-*` | `05_solutions/` *(Chưa tạo)* | Chỉ khởi tạo sau khi Khách hàng phê duyệt `CONF-S16-001` | — | Locked (Pending `CONF`) |
| `06` | `DES-S16-*` | `06_designs/` *(Chưa tạo)* | Chỉ khởi tạo sau `SOL-S16-*` | — | Locked (Pending `SOL`) |
| `07` | `FEAT/TASK-*` | `07_items/` *(Chưa tạo)* | Chỉ tách item lập trình sau `DES-S16-*` | — | Locked (Pending `DES`) |
| `08` | `QA-S16-*` | `08_testing/` *(Chưa tạo)* | Dual-Mode Browser Testing (Desktop & Mobile) + Backend Integration Test | — | Locked |
| `09` | `REV-S16-*` | `09_review/` *(Chưa tạo)* | Nghiệm thu Sprint DoD Gate | — | Locked |

---

## 3. Liên Kết Phụ Thuộc Hệ Thống & Các Sprint Khác

| Hệ thống / Sprint | Vai trò đối với `plugins/document-template` | Ràng buộc tích hợp |
| :--- | :--- | :--- |
| **Core Platform & IAM** | Xác thực `tenant_id`, RBAC xuất/in/ký/gửi mail, MinIO Object Storage (lưu file mẫu & file đã phát hành), Entity Registry | Lọc nghiêm ngặt `tenant_id`; đăng ký entity tại [Entity Registry](../../system/entity_registry/README.md); đọc dữ liệu liên plugin qua `PluginDataServiceGrpc` |
| **Plugin `organization`** | Chi nhánh (`branch_id`), Logo/Con dấu/Thông tin pháp nhân (MST, Địa chỉ, SĐT) làm ngữ cảnh trộn & phân giải mẫu 3 tầng | Liên kết qua `PluginDataServiceGrpc` / Sync Cache |
| **Plugin `catalog`** | Nhóm tài liệu, Tiền tệ, Đơn vị tính, Ngôn ngữ mẫu in | Liên kết qua `PluginDataServiceGrpc` |
| **Plugin `employee`** | Chữ ký ảnh nhân sự, Họ tên/Chức vụ người lập & người phê duyệt | Mapping `employee_id` chuẩn hóa |
| **Plugin `form` (Sprint 08)** | Nguồn Schema động (`32` loại trường, `GRID`, `IMAGE_UPLOAD`, `SIGNATURE`) & `custom_fields_data` (`JSONB`) để tự động sinh Cây biến trộn + form tham số kết xuất — xem [Sprint 08 Reading Guide](../sprint_08_plugin_form_workflow/00_READING_GUIDE.md) | Đọc schema theo `form_version` qua `PluginDataServiceGrpc` |
| **Plugin `workflow` (Sprint 08)** | Cung cấp `Approval History` + người duyệt để điền vào khối chữ ký; duyệt Publish mẫu (`Maker-Checker`); kích hoạt tự động render PDF & gửi Email cho đối tác sau bước `APPROVED` | Giao tiếp qua `PluginDataServiceGrpc` & Kafka Outbox Event |
| **Plugin `office-webapp` (Sprint 12)** | Cho phép mở và chỉnh sửa trực tiếp file mẫu `.docx` / `.xlsx` ngay trên trình duyệt kèm thanh công cụ chèn thẻ `{{field}}` — xem [Sprint 12 Reading Guide](../sprint_12_office_webapp/00_READING_GUIDE.md) | Mở bằng Nested Route / Split-View không cần tải về sửa thủ công |
| **Plugin `in-app-notification`** | Thông báo khi lệnh Xuất/In hàng loạt (`Batch ZIP/PDF`) hoàn tất hoặc Email gửi đối tác bị lỗi bounce | Event Hub bất đồng bộ |
| **Sprint 13, 14, 15 (`inventory`, `crm`, `purchasing`)** | Các plugin tiêu thụ trực tiếp (`Consumers`) sử dụng Bộ mẫu chuẩn & Engine kết xuất/gửi mail của Sprint 16 (Phiếu Kho/Tem mã vạch, Báo giá/Đơn hàng/Hợp đồng/Công nợ, `RFQ`/`PO`/`SES`/Đối chiếu) | [Sprint 13](../sprint_13_plugin_inventory/00_READING_GUIDE.md) · [Sprint 14](../sprint_14_plugin_crm/00_READING_GUIDE.md) · [Sprint 15](../sprint_15_plugin_purchasing/00_READING_GUIDE.md) |

---

## 4. Bảng Kiểm Tra Xác Nhận (Confirmation Gate Checklist)

> [!IMPORTANT]
> Theo quy trình SDLC 9 bước của Open-ERP, nghiêm cấm chuyển sang Bước 05 (`05_solutions/`) hoặc viết mã nguồn khi **Confirmation Checklist** dưới đây chưa được Khách hàng phê duyệt rõ ràng.

| Hạng mục | Mô tả kiểm tra | Trạng thái | Ghi chú |
| :--- | :--- | :--- | :--- |
| `RAW-S16-001` | Yêu cầu gốc cho Plugin Thiết kế & Kết xuất Mẫu Tài liệu, In ấn & Gửi Email (`plugins/document-template`) | ⏳ Pending Review | Mới khởi tạo `v0.1` |
| `BENCH-S16-001` | Phân tích 10 đối thủ/engine Quốc tế & VN + 12 bài học kiến trúc | ⏳ Pending Review | Mới khởi tạo `v0.1` |
| `ANL-S16-001` | Hoàn thiện 9 luồng nghiệp vụ, `BR-D01..D18`, 10 Edge Cases, `26 User Stories` & UI Data View | ⏳ Pending Review | Chờ khách hàng review |
| `CONF-S16-001` | Khách hàng review và chốt `Q1`–`Q12` & ký duyệt `AC-01`..`AC-22` | ⏳ Pending | Chặn Bước 05 (`SOL`) & Bước 06 (`DES`) |
