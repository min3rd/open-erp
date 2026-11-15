# Tài Liệu Xác Nhận Phạm Vi & Tiêu Chí Nghiệm Thu — Sprint 14 (`plugins/crm`)

| Thuộc tính | Giá trị |
| :--- | :--- |
| ID | CONF-S14-001 |
| Sprint | Sprint 14 (`sprint_14_plugin_crm`) |
| Tác giả | AI Business Analyst (BA) |
| Trạng thái | APPROVED 1.0 — Đã chốt 13/13 câu hỏi (`Q1`–`Q13`) & `AC-01`..`AC-23` bởi Chủ dự án (2026-11-15) |
| Phiên bản | 1.0 |
| Tài liệu đầu vào | [00_READING_GUIDE.md](../00_READING_GUIDE.md) · [RAW-S14-001](../01_raw_notes/01_RAW-S14-001_crm_customer_requirements.md) · [BENCH-S14-001](../03_benchmarks/01_BENCH-S14-001_crm_customer_benchmarks.md) · [ANL-S14-001](../02_analysis/01_ANL-S14-001_crm_customer_workflows.md) |

> [!NOTE]
> **Gate `CONF-S14-001` đã được Chủ dự án PHÊ DUYỆT (`APPROVED 1.0`) ngày `2026-11-15`**: toàn bộ 13 quyết định nghiệp vụ (`Q1`–`Q13`) và 23 tiêu chí `AC-01`–`AC-23` đã chốt theo Đề xuất BA. Bước 05 (`SOL-S14-*`) và Bước 06 (`DES-S14-*`) chính thức mở khóa cho Architect (triển khai sau nền tảng `Sprint 16`).

---

## 1. Bảng Câu Hỏi Chốt Quyết Định Nghiệp Vụ CRM (`Q1`–`Q13`)

| Mã | Chủ đề cần quyết định | Các phương án lựa chọn | Đề xuất của BA | Phản hồi Khách hàng |
| :--- | :--- | :--- | :--- | :--- |
| **`Q1`** | **Quy trình đầu vào: Tầng `Lead` bắt buộc hay tùy chọn?** | **(A)** Cho phép cấu hình linh hoạt theo Tenant: có thể đi từ `Lead -> Convert` hoặc tạo thẳng `Opportunity / Quotation / Sales Order` cho Khách hàng hiện hữu.<br>**(B)** Bắt buộc mọi cơ hội/đơn mới đều phải đi qua `Lead`. | **Phương án A** (Phù hợp cả đội Telesales tìm khách mới lẫn Sales B2B chăm lại khách quen). | Đã chốt theo Đề xuất BA (2026-11-15) |
| **`Q2`** | **Chính sách Chống trùng lặp (`Duplicate Rule`)** | **(A)** Kiểm tra trùng `MST`, `SĐT`, `Email`: mặc định **Cảnh báo & Gợi ý mở/gộp**, cho phép Admin bật **Chặn cứng (`Strict Block`)** theo trường.<br>**(B)** Luôn chặn cứng khi trùng bất kỳ trường nào. | **Phương án A** (An toàn dữ liệu nhưng linh hoạt cho trường hợp công ty con dùng chung email/tổng đài). | Đã chốt theo Đề xuất BA (2026-11-15) |
| **`Q3`** | **Phân bổ Lead & Thu hồi tự động (`SLA Reclaim`)** | Hỗ trợ chia xoay vòng `Round-Robin` trong nhóm kinh doanh và tự động nhắc/thu hồi về Giỏ chung nếu quá X giờ chưa tương tác đầu tiên? | **Có**, bật tùy chọn quy tắc chia Lead & SLA theo Tenant/Chi nhánh. | Đã chốt theo Đề xuất BA (2026-11-15) |
| **`Q4`** | **Mức độ kiểm soát `Stage Guardrails` & Duyệt chiết khấu** | **(A)** Hỗ trợ cấu hình điều kiện bắt buộc khi chuyển giai đoạn Pipeline (`Guardrails`, bắt buộc `Lost Reason`) và tự động đẩy duyệt `plugins/workflow` khi chiết khấu vượt ngưỡng.<br>**(B)** Kéo thả Kanban tự do không kiểm tra điều kiện. | **Phương án A** (Chống Sales kéo bừa trạng thái và kiểm soát biên lợi nhuận). | Đã chốt theo Đề xuất BA (2026-11-15) |
| **`Q5`** | **Hành xử khi Xác nhận Đơn hàng (`Sales Order`) nhưng Kho (`inventory`) hết hàng tạm thời** | **(A)** Chặn xác nhận và hiển thị tồn các kho khác để Sales điều phối hoặc đặt trước.<br>**(B)** Cho phép cấu hình tùy chọn **"Xác nhận đặt trước (`Backorder / Pre-order`)"** không giữ hàng ngay để Kho nhập bù giao sau. | **Phương án A làm mặc định + tùy chọn cấu hình (B)** cấp Tenant để linh hoạt với hàng order theo đơn. | Đã chốt theo Đề xuất BA (2026-11-15) |
| **`Q6`** | **Kiểm soát Hạn mức Công nợ (`Credit Limit Enforcement`)** | **(A)** Tính `Open Receivable + Pending Exposure + Order Total`: vượt hạn mức thì **chặn hoặc chuyển luồng duyệt ngoại lệ `Credit Override`** qua `workflow`.<br>**(B)** Chỉ hiển thị cảnh báo chữ, vẫn cho Sales chốt đơn tự do. | **Phương án A** (Chuẩn ERP bảo vệ dòng tiền; doanh nghiệp nhỏ vẫn có thể đặt `Credit Limit = Không giới hạn` cho khách tin cậy). | Đã chốt theo Đề xuất BA (2026-11-15) |
| **`Q7`** | **Phạm vi Hợp đồng, Thanh toán & Công nợ Phải thu (`AR`)** | Sprint 14 bao gồm Quản lý **Hợp đồng + Đợt thanh toán (`Milestones`) + Ghi nhận Phiếu Thu nội bộ + Sổ Công nợ & Báo cáo Tuổi nợ (`AR Aging`)** (chưa bao gồm bút toán Nợ/Có Kế toán GL và xuất Hóa đơn điện tử)? | **Có**, khép kín vòng nghiệp vụ với khách hàng trong `plugins/crm` mà chưa ôm phần Kế toán sổ cái tài chính. | Đã chốt theo Đề xuất BA (2026-11-15) |
| **`Q8`** | **Liên thông Đổi / Trả hàng (`RMA`) với `plugins/inventory`** | Khi duyệt Phiếu Đổi/Trả hàng, `crm` gửi lệnh `RETURN_IN` sang `inventory` và **chỉ ghi nhận giảm trừ công nợ (`RETURN_CREDIT`) sau khi nhận event Kho đã kiểm đếm nhập lại thành công**? | **Có**, đảm bảo khớp 100% giữa hàng thu hồi thực tế và số tiền giảm nợ. | Đã chốt theo Đề xuất BA (2026-11-15) |
| **`Q9`** | **Ticket Hậu mãi / Bảo hành & Đồng hồ `SLA`** | Bao gồm phân hệ **Ticket Khiếu nại/Bảo hành gắn Khách hàng/Đơn hàng/Serial** kèm bộ đếm **SLA** (có tự động tạm dừng khi `WAITING_CUSTOMER` và cảnh báo qua `in-app-notification`) ngay trong Sprint 14? | **Có**, hoàn thiện trọn vòng Customer 360 từ Tiền bán hàng tới Hậu mãi. | Đã chốt theo Đề xuất BA (2026-11-15) |
| **`Q10`** | **Phạm vi Mobile Ionic Cho Nhân Viên Kinh Doanh Thực Địa** | Mobile tập trung tối giản vào: Tra cứu Customer 360 + Gọi nhanh, Check-in ghi chú gặp khách, Xem tồn kho/Tạo Báo giá nháp, Theo dõi tiến độ Đơn hàng/Công nợ sắp hạn & Cập nhật Ticket? | **Có**, giữ Mobile nhẹ, nút chạm `>= 40px` theo chuẩn Ionic 8. | Đã chốt theo Đề xuất BA (2026-11-15) |
| **`Q11`** | **Ma Trận Phê Duyệt CRM (`DOA / SoD`) & Lưu Vết 4 Tầng Bất Biến** | Áp dụng bắt buộc cơ chế **Bất kiêm nhiệm (`SoD`)** qua `plugins/workflow` (chặn `Sales Rep` tự duyệt chiết khấu vượt khung/`Credit Override`/chuyển quyền `Reassign`/gộp trùng; `Maker-Checker` khi đổi `Credit Limit` hoặc mở `Blacklist`; tách người duyệt hoàn tiền/giảm trừ `RMA`) kết hợp Lưu vết 4 tầng (`Approval History`, `Field Before/After Diff`, `CRM Lineage`, `Append-only AR Ledger`) + Drawer `Audit & Lineage`? | **Có**, bắt buộc để chống thất thoát chiết khấu/nới công nợ khống và đảm bảo truy vết kiểm toán. | Đã chốt theo Đề xuất BA (2026-11-15) |
| **`Q12`** | **Tùy Biến Biểu Mẫu CRM Qua `plugins/form` Theo Tenant & Chi Nhánh** | Toàn bộ form nhập liệu CRM (`Lead`, `Account/Contact`, `Opportunity Checklist`, `Quotation`, `Sales Order`, `Contract`, `RMA/Ticket/CSAT`) dựng qua **`plugins/form` (Sprint 08 — 32 loại trường, `GRID` công thức RPN, `IMAGE_UPLOAD`, `SIGNATURE`)** theo kế thừa 3 tầng (`System -> Tenant -> Branch`), giữ `System Locked Core Fields` và lưu `custom_fields_data` (`JSONB`) + `form_version`? | **Có**, tái sử dụng trọn vẹn `plugins/form` giúp từng ngành/chi nhánh tự tùy biến thông tin khách hàng/đơn hàng mà không sửa code. | Đã chốt theo Đề xuất BA (2026-11-15) |
| **`Q13`** | **Tận Dụng `plugins/document-template` (Sprint 16 — Ưu Tiên Trước) Cho Báo Giá, Hợp Đồng, `VietQR` & Email** | Ủy quyền toàn bộ việc thiết kế & kết xuất `Báo giá`, `Sales Order`, `Hợp đồng B2B (.docx/.pdf)`, `Thông báo/Đối chiếu công nợ kèm VietQR`, `Biên bản RMA`, `Watermark`, `QR Verify` và gửi Email khách hàng tự lưu vào `Customer 360 Timeline` sang **`plugins/document-template` (Sprint 16)**? | **Có**, tránh trùng lặp code in ấn/gửi mail, tận dụng trọn vẹn Sprint 16 được làm trước. | Đã chốt theo Đề xuất BA (2026-11-15) |

---

## 2. Phạm Vi Đề Xuất (Proposed Scope — `plugins/crm`)

### 2.1. Trong Phạm Vi Sprint 14 (In-Scope)
1. **Lead, Customer 360 & Hoạt Động Tương Tác**:
   - Quản lý `Lead` đa nguồn, kiểm tra trùng lặp (`MST/SĐT/Email`), phân bổ `Round-Robin` + SLA thu hồi, chuyển đổi 3-trong-1 (`Account + Contact + Opportunity`).
   - Hồ sơ `Customer Account` (B2B/B2C, phân cấp công ty mẹ-con, đa địa chỉ, hạng khách hàng, hạn mức công nợ) + `Contacts` + màn hình **Customer 360 (Nested Route)**.
   - Nhật ký tương tác (`Call`, `Meeting`, `Check-in`, `Email`, `Note`, `Follow-up Task`).
2. **Pipeline Cơ hội, Bảng giá & Báo giá**:
   - Multi-Pipeline (`Kanban Board` + `Sticky Table` đồng bộ URL), `Stage Guardrails`, Dự báo doanh thu trọng số (`Weighted Forecast`).
   - `Price Lists` theo nhóm/hạng khách hàng và ngày hiệu lực; Lập Báo giá đa phiên bản (`Revision`), tra cứu `Available Qty` tức thời từ `plugins/inventory`, duyệt chiết khấu qua `plugins/workflow`.
3. **Đơn Hàng, Hạn Mức Công Nợ, Hợp Đồng & Công Nợ Phải Thu**:
   - `Sales Order`: Kiểm tra đồng thời Hạn mức công nợ (`Credit Limit` + `Credit Override` qua `workflow`), gửi lệnh Giữ hàng (`StockReservation`) sang `plugins/inventory`, nhận đồng bộ tiến độ giao hàng (`OUTBOUND_POSTED`) qua Kafka.
   - `Contract` & `Payment Milestones` + cảnh báo gia hạn; `Payment Receipt` + `Customer Receivable Ledger` + Báo cáo **Tuổi nợ (`AR Aging`)**.
4. **Đổi / Trả Hàng (`RMA`), Ticket `SLA`, Báo Cáo & Data View Chuẩn ERP**:
   - Đổi/Trả hàng (`RMA`) duyệt qua `workflow` -> gửi lệnh `RETURN_IN` sang `plugins/inventory` -> cấn trừ công nợ sau khi Kho nhập lại.
   - Ticket CSKH/Bảo hành kèm `SLA` (hỗ trợ tạm dừng `WAITING_CUSTOMER`), cảnh báo leo thang qua `in-app-notification` và khảo sát `CSAT`.
   - Toàn bộ bảng dữ liệu dùng `@shared/*` Table cố định Header/Footer (chỉ cuộn Content), tùy biến ẩn/hiện & đổi thứ tự cột, số hàng/trang, đồng bộ URL Query Params và **Context Menu chuột phải** đầy đủ tác vụ (kèm fallback `>= 40px` trên Mobile Ionic).
5. **Kiểm Soát Phê Duyệt (`DOA / SoD`) & Lưu Vết Kiểm Toán 4 Tầng**:
   - Kiểm soát `SoD` qua `plugins/workflow` (chặn tự duyệt chiết khấu/`Credit Override`/`Reassign`/`Merge`, `Maker-Checker` khi nâng `Credit Limit` hoặc Đảo Phiếu Thu).
   - Lưu vết 4 tầng bất biến (`Approval History`, `Before/After Diff` sửa hạn mức/owner/giá/SLA, `CRM Lineage`, `Append-only AR Ledger`) và hiển thị trực quan qua Stacked Drawer `Audit & Lineage` (`?drawer=audit`).
6. **Tùy Biến Biểu Mẫu CRM Động Theo Tenant & Chi Nhánh (`plugins/form` — Sprint 08)**:
   - Kết xuất biểu mẫu `Lead`, `Customer Account`, `Opportunity`, `Quotation`, `Sales Order`, `Contract`, `RMA/Ticket/CSAT` qua `plugins/form` (`32` loại trường, `GRID`, `SIGNATURE`), kế thừa 3 tầng (`System -> Tenant -> Branch`), khóa `System Locked Core Fields`, lưu `custom_fields_data` (`JSONB`) + `form_version`, dùng làm biến điều kiện `workflow` & cột lọc Sticky Table.
7. **Kết Xuất Báo Giá, Hợp Đồng B2B, Thông Báo Nợ `VietQR` & Gửi Email (`plugins/document-template` — Sprint 16)**:
   - Tích hợp `PluginDataServiceGrpc` / Kafka & Stacked Drawer `?drawer=doc-output` của `plugins/document-template` (Sprint 16) cho xuất PDF/DOCX/XLSX `Quotation`, `SO`, `Hợp đồng B2B`, `Thông báo Công nợ kèm VietQR`, `RMA`, đóng `Watermark`, `QR Verify` và gửi Email lưu vết vào `Customer 360 Activity Timeline`.

### 2.2. Ngoài Phạm Vi Sprint 14 (Out-of-Scope — Dời sang Sprint / Plugin khác)
- Toàn bộ nghiệp vụ **Kho hàng vật lý** (Quản lý Kho/Bin, Nhập/Xuất/Chuyển/Kiểm kê, Giá vốn `AVCO`, Sổ cái Tồn kho) — đã tách sạch sang **`plugins/inventory` (Sprint 13)**.
- **Marketing Automation nâng cao** (Trình kéo thả Email Campaign hàng loạt, Chạy quảng cáo Facebook/Google/Zalo OA native integration).
- **Tổng đài VoIP Call Center tích hợp sâu** (Ghi âm cuộc gọi trực tiếp trên trình duyệt — chỉ lưu log cuộc gọi & bấm link `tel:` trên Mobile ở Sprint 14).
- **Hóa đơn điện tử (VNPT/Viettel/MISA eInvoice)** & **Hạch toán Sổ cái Kế toán Tài chính (GL Journal Nợ/Có)**.

---

## 3. Bộ 23 Tiêu Chí Nghiệm Thu (`AC-01` – `AC-23`)

| Mã AC | Nhóm | Mô tả tiêu chí nghiệm thu cụ thể & đo lường được |
| :--- | :--- | :--- |
| **`AC-01`** | Multi-Tenant & Data Scope | Mọi thực thể lọc nghiêm ngặt theo `tenant_id` từ JWT; Sales Rep chỉ xem/sửa khách hàng thuộc `Own / Shared`, Trưởng nhóm xem theo `Team/Branch` (`organization`), 0 lỗi rò rỉ dữ liệu chéo tenant/scope. |
| **`AC-02`** | Ranh giới & Entity Registry | Plugin `crm` không chứa logic quản lý kho nội bộ; 100% Entity mới đăng ký tại [docs/system/entity_registry/README.md](../../../system/entity_registry/README.md) và giao tiếp với `inventory`, `organization`, `catalog`, `employee`, `workflow` qua gRPC/Kafka (cấm gọi REST chéo, cấm `size = 100`). |
| **`AC-03`** | Lead & Duplicate Guard | Chuẩn hóa SĐT/Email/MST và phát hiện chính xác bản ghi trùng trên cả `Lead` và `Customer`; kích hoạt phân bổ `Round-Robin` và cảnh báo quá hạn chạm lần đầu đúng cấu hình. |
| **`AC-04`** | Convert Lead 3-trong-1 | Chuyển đổi `Lead` tạo hoặc gộp đúng `Customer Account` + `Contact` + `Opportunity` trong cùng 1 transaction, chuyển toàn bộ `Activity Timeline` sang hồ sơ mới và khóa `Lead` thành chỉ đọc. |
| **`AC-05`** | Customer 360 & Contacts | Quản lý được Khách B2B (MST, công ty mẹ-con, nhiều địa chỉ, nhiều Contacts với vai trò khác nhau) & Khách B2C; màn hình Nested Route Customer 360 tổng hợp đủ tương tác, cơ hội, báo giá, đơn hàng, công nợ và Ticket. |
| **`AC-06`** | Pipeline Kanban & Guardrails | Kéo thả chuyển bước Cơ hội trên Kanban hoặc Table đồng bộ URL; tính đúng `Weighted Forecast`; chặn chuyển bước nếu thiếu dữ liệu bắt buộc theo `Stage Guardrails` (kể cả `lost_reason` khi đóng Thua). |
| **`AC-07`** | Bảng giá & Báo giá Versioning | Áp đúng đơn giá ưu tiên theo `Price List`; hiển thị trực tiếp `Available Qty` lấy qua gRPC từ `plugins/inventory`; sửa Báo giá đã gửi tạo đúng `Revision` mới (`v2`) không ghi đè bản `v1`. |
| **`AC-08`** | Duyệt Chiết khấu `workflow` | Báo giá vượt hạn mức chiết khấu tự động khởi tạo quy trình phê duyệt trên `plugins/workflow`; chặn chuyển sang Đơn hàng nếu chưa được duyệt hoàn tất. |
| **`AC-09`** | Sales Order & Kho (`inventory`) | Xác nhận `Sales Order` gọi gRPC `ReserveStock (reference_type=SALES_ORDER)` sang `plugins/inventory`; hiển thị lỗi rõ khi Kho thiếu hàng; nhận event `OUTBOUND_POSTED` cập nhật đúng `PARTIAL_DELIVERED` / `DELIVERED`. |
| **`AC-10`** | Hạn mức Công nợ & Concurrency | Khi `Remaining Credit` chỉ còn đủ cho 1 đơn và gửi **>= 5 request xác nhận đơn đồng thời** cho cùng 1 `Customer` trên PostgreSQL thật, chỉ đúng **1 đơn thành công** (hoặc chuyển `Credit Override`), tuyệt đối không lọt vượt trần hạn mức. |
| **`AC-11`** | Hủy Đơn Nhả Giữ Hàng An Toàn | Hủy đơn khi `delivered_qty == 0` tự động gọi gRPC nhả `StockReservation` tại Kho và hoàn lại `Pending Exposure`; chặn hủy ngang đơn nếu Kho đã xuất giao 1 phần trở lên. |
| **`AC-12`** | Hợp đồng & Milestones | Quản lý Hợp đồng gắn Đơn hàng + chia nhiều Đợt thanh toán (`Milestones`); kích hoạt thông báo gia hạn đúng hạn qua `in-app-notification`. |
| **`AC-13`** | Phiếu Thu, AR Ledger & Tuổi nợ | Ghi nhận Thanh toán giảm chính xác `Open Receivable`, mở lại `Remaining Credit` tương ứng trên `Customer Receivable Ledger` bất biến; Báo cáo Tuổi nợ phân loại đúng 5 rổ (`Trong hạn`, `1-30`, `31-60`, `61-90`, `>90 ngày`). |
| **`AC-14`** | Đổi / Trả Hàng (`RMA`) Khép Kín | Chặn tổng SL trả vượt quá SL đã giao; duyệt RMA -> gửi lệnh `RETURN_IN` sang `plugins/inventory` -> chỉ ghi bút toán giảm trừ công nợ `RETURN_CREDIT` sau khi nhận event `RETURN_POSTED` từ Kho. |
| **`AC-15`** | Ticket `SLA` & Tạm Dừng | Tạo Ticket gắn Customer/Order/Serial; bộ đếm SLA tính đúng theo giờ làm việc, tự tạm dừng (`Paused`) khi ở trạng thái `WAITING_CUSTOMER` và bắn cảnh báo qua `in-app-notification` khi sắp/đã quá hạn. |
| **`AC-16`** | Báo cáo & Thống kê Kinh doanh | Xuất/hiển thị chính xác báo cáo Phễu chuyển đổi, Doanh số thực tế vs Dự báo theo Nhân viên/Chi nhánh, Tỷ lệ thắng/thua và Công nợ tuổi nợ. |
| **`AC-17`** | API Contract & Code Quality | 100% API Backend tuân thủ 4 khuôn mẫu `api_standards.md`, trả `code` `UPPER_SNAKE_CASE`, dùng DTO `record` và `ResponseKey` (cấm `Map<String, Object>`), `bigdecimal` chính xác cho tiền tệ/chiết khấu. |
| **`AC-18`** | Data View, Sticky Table & Context Menu | Tất cả danh sách (`Lead`, `Customer`, `Opportunity`, `Quotation`, `Order`, `Contract`, `AR`, `Ticket`) dùng Table `@shared/*` cố định Header/Footer (chỉ cuộn Content), cho phép lọc, sắp xếp, ẩn/hiện & đổi thứ tự cột, đổi số hàng/trang, đồng bộ URL và **Context Menu chuột phải** (fallback `>= 40px` trên Mobile). |
| **`AC-19`** | Anti-Modal, Route-State, i18n & Zero-Emoji | Dùng Nested Routes (`Customer 360`), Split-Screen và Stacked Drawers (`?drawer=...`) thay cho Modal popup; 100% text/tooltip/enum qua `vi.json`/`en.json`, **0 emoji Unicode**, **0 file `.spec.ts`**. |
| **`AC-20`** | Kiểm thử Thực dụng & Dual-Mode QA | Backend vượt qua JUnit 5 + RestAssured trên **PostgreSQL & Redis thật** (bao gồm concurrency test & gRPC/Kafka flow với Kho); QA thực hiện Dual-Mode Browser Testing (`>= 1280px` & Ionic `390x844 px`, `overflow = 0`, `touch >= 40px`, **0 `console.error`**) kèm screenshot nghiệm thu. |
| **`AC-21`** | Phê duyệt `SoD` & Lưu vết CRM 4 Tầng | Hệ thống chặn `Sales Rep` tự duyệt chiết khấu vượt khung, `Credit Override`, `Customer Merge/Reassign` và thay đổi `Credit Limit` / Đảo Phiếu Thu một mắt với `403 SOD_VIOLATION`; mọi Timeline `Workflow`, Diff Trước/Sau và chuỗi `Lead -> Order -> AR -> RMA` bất biến dưới DB và hiển thị trong Drawer `Audit & Lineage`. |
| **`AC-22`** | Tích hợp Dynamic Form Builder (`plugins/form`) | Phân giải biểu mẫu 3 tầng (`Branch Override -> Tenant Override -> System Default`) hoạt động đúng trên các form `Lead/Customer/Opportunity/Quotation/SO/Contract/RMA/Ticket`; `System Locked Core Fields` bị khóa xóa/đổi kiểu; dữ liệu cũ mở đúng `form_version` từ `JSONB`; trường động dùng được trong điều kiện `workflow` và cột lọc Sticky Table. |
| **`AC-23`** | Kết xuất Báo giá, Hợp đồng, `VietQR` & Email (`plugins/document-template`) | Toàn bộ `Quotation`, `Sales Order`, `Hợp đồng B2B (.docx/.pdf)`, `Thông báo/Đối chiếu công nợ` (nhúng đúng **`VietQR` động**) và `RMA` kết xuất thống nhất qua `plugins/document-template` (Sprint 16); chứng từ chờ duyệt chiết khấu/`Credit Override` tự gắn `Watermark`; bản in chính thức có `QR Verify`; gửi Email qua `?drawer=doc-output` tự động ghi nhận vào `Customer 360 Activity Timeline`. |

---

## 4. Ma Trận Giao Diện & Kiểm Chứng Dual-Mode (Desktop vs. Mobile)

| Màn hình / Luồng chính | Desktop Web (`>= 1280px`) | Mobile Ionic (`390x844 px`) | Trạng thái đồng bộ URL (`Route-Driven`) |
| :--- | :---: | :---: | :--- |
| `Leads` & Chuyển đổi 3-trong-1 | Đầy đủ (Sticky Table + Duplicate Drawer) | Danh sách Lead của tôi + Gọi/Check-in/Convert nhanh | `?owner=...&status=...&drawer=lead&id=...` |
| Customer 360 (`Account / Contacts / Timeline`) | Đầy đủ (Nested Route nhiều tab) | Tra cứu thông tin chính, bấm gọi/nhắn & ghi chú | `/crm/customers/:id/overview|orders|debt|tickets` |
| Pipeline Cơ hội (`Kanban` & `Table`) | Đầy đủ (Kéo thả Kanban + Sticky Table) | Danh sách thẻ Cơ hội + Đổi Stage & Ghi chú | `?view=kanban|table&pipelineId=...&stage=...` |
| Báo giá & Đơn đặt hàng + Tồn Kho | Đầy đủ (Split-View đa dòng + Credit/Stock check) | Xem trạng thái Đơn, Báo giá nhanh & Kiểm tồn | `?status=...&drawer=order&id=...` |
| Hợp đồng, Thanh toán & Tuổi nợ `AR Aging` | Đầy đủ (Milestones + Sổ nợ + Export) | Xem cảnh báo Công nợ tới/quá hạn của khách | `?agingBucket=...&customerId=...` |
| Đổi/Trả hàng (`RMA`) & Ticket `SLA` | Đầy đủ (Cấu hình SLA + Duyệt RMA + Split-View) | Danh sách Ticket được giao + Phản hồi/Đính kèm ảnh | `?priority=...&slaStatus=...&drawer=ticket&id=...` |
| Phê duyệt (`DOA/SoD`) & Drawer `Audit & Lineage` | Đầy đủ (Timeline + Diff Trước/Sau + Lineage) | Duyệt qua `Workflow` & Xem lịch sử duyệt gần nhất | `?drawer=audit&auditTab=approval|diff|lineage` |
| Tùy biến Biểu mẫu CRM (`plugins/form` Tenant/Chi nhánh) | Thiết kế & Publish Form Studio + Render Form động | Điền Form động đã Publish khi nhập `Lead` / Check-in / `Ticket` (`>= 40px`) | `?entity=...&branchId=...&formVersion=...` |
| Mẫu in Báo giá, Hợp đồng `.docx`, `VietQR` & Email (`plugins/document-template` S16) | Template Studio + Preview PDF/DOCX + Batch Công nợ + Email Timeline | Xem/Tải PDF Báo giá, Hợp đồng & Chia sẻ/Gửi Email nhanh (`>= 40px`) | `?drawer=doc-output&templateId=...&format=...` |
