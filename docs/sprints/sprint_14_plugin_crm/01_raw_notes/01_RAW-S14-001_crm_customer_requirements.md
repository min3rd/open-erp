# Ghi Chú Yêu Cầu Thô (Raw Notes) — Sprint 14: Plugin Quản Lý & Nghiệp Vụ Với Khách Hàng (`plugins/crm`)

| Thuộc tính | Giá trị |
| :--- | :--- |
| ID | RAW-S14-001 |
| Sprint | Sprint 14 (`sprint_14_plugin_crm`) |
| Tác giả | AI Business Analyst (BA) |
| Trạng thái | Draft / Chờ review |
| Phiên bản | 0.3 |
| Ngày tạo | 2026-11-15 |

---

## 1. Yêu Cầu Tổng Quan & Định Vị Plugin Quản Lý Khách Hàng (`plugins/crm`)

Khởi tạo **Plugin Quản Lý Khách Hàng & Các Nghiệp Vụ Với Khách Hàng (`plugins/crm`)** độc lập trên Open-ERP, tiếp nối ranh giới sạch với **Plugin Quản lý Kho (`plugins/inventory` — Sprint 13)**:
- **Nguyên văn yêu cầu từ Khách hàng**:
  > "tiếp tục sprint 14 về plugin quản lý và các nghiệp vụ với khách hàng"
- **Định vị ranh giới**:
  - `plugins/crm` làm chủ toàn bộ vòng đời thương mại và quan hệ khách hàng từ lúc tiếp cận đầu mối (`Lead`), quản lý hồ sơ **Khách hàng 360** (`Account` B2B/B2C & `Contact`), theo dõi Cơ hội bán hàng (`Opportunity Pipeline`), lập Báo giá (`Quotation`), ký Đơn hàng / Hợp đồng (`Sales Order / Contract`), theo dõi Thanh toán & Công nợ phải thu (`AR Milestones & Aging`), xử lý Đổi/Trả hàng (`Sales Return RMA`), tới Chăm sóc sau bán / Khiếu nại & Bảo hành (`Support Ticket & SLA`).
  - Khi cần kiểm tra hàng hóa còn hay hết, giữ hàng cho đơn đã chốt, xuất giao hàng hay nhập lại hàng trả, `plugins/crm` gọi sang `plugins/inventory` qua `PluginDataServiceGrpc` / Kafka (không tự quản lý tồn kho hay sửa thẳng dữ liệu Kho).

---

## 2. Phân Rã 8 Trụ Cột Nghiệp Vụ Khách Hàng

### 2.1. Quản Lý Tiềm Năng (`Lead`), Chống Trùng & Phân Bổ (`Routing`)
- Thu thập Lead đa nguồn (nhập tay, import Excel, webform/API webhook, chiến dịch marketing).
- **Kiểm tra trùng lặp thông minh (`Duplicate Detection`)**: Cảnh báo hoặc chặn trùng dựa trên Số điện thoại chuẩn hóa, Email, hoặc Mã số thuế (`MST`) ngay tại lúc tạo/chuyển đổi.
- **Chấm điểm & Phân bổ Lead (`Lead Assignment Rules`)**: Chia đều xoay vòng (`Round-Robin`) theo Chi nhánh/Nhóm kinh doanh hoặc gán theo khu vực/nguồn; tự động thu hồi nếu Sales không tương tác sau thời gian SLA cấu hình.
- **Chuyển đổi Lead (`Lead Conversion`)**: Chuyển 1 thao tác thành bộ ba `Customer Account` (hoặc gộp vào Khách hàng sẵn có) + `Contact` + `Opportunity` mới mà giữ trọn lịch sử ghi chú/cuộc gọi trước đó.

### 2.2. Hồ Sơ Khách Hàng 360 (`Account` B2B / B2C & `Contact` Hierarchy)
- Phân biệt rõ **Khách hàng Doanh nghiệp (`B2B`)** (có MST, Địa chỉ xuất hóa đơn, nhiều Địa chỉ giao hàng, nhiều Người liên hệ `Contact` kèm vai trò ra quyết định/kế toán/nhận hàng) và **Khách hàng Cá nhân (`B2C`)**.
- **Phân cấp Khách hàng & Xếp hạng (`Tier / Segmentation`)**: Công ty mẹ - Chi nhánh con (`Parent-Child Account`), phân hạng VIP/Gold/Silver/Standard làm căn cứ áp Bảng giá và Hạn mức công nợ.
- **Màn hình Customer 360**: Tập trung tại 1 góc nhìn: Thông tin chung, Danh sách người liên hệ, Dòng thời gian tương tác (`Activity Timeline`), Cơ hội đang mở, Báo giá, Đơn hàng/Hợp đồng, Tình trạng Công nợ & Tỷ lệ quá hạn, Lịch sử Khiếu nại/Bảo hành.

### 2.3. Phễu Cơ Hội Bán Hàng (`Opportunity Pipeline & Forecast`)
- Hỗ trợ nhiều **Quy trình bán hàng (`Multiple Pipelines`)** (VD: Bán lẻ nhanh, Dự án B2B dài hạn, Gia hạn hợp đồng).
- Quản trị trực quan theo **Kanban Board (Kéo/thả đồng bộ URL)** và **Danh sách bảng dữ liệu (Data View Sticky Table)**: mỗi bước có **Tỷ lệ thắng mặc định (`Win Probability %`)**, giúp tính **Doanh thu dự báo có trọng số (`Weighted Forecast = Amount * Probability`)**.
- **Kiểm soát điều kiện chuyển bước (`Stage Guardrails`)**: Bắt buộc nhập đủ trường thông tin hoặc tài liệu (VD: có Báo giá đính kèm mới sang `Thương lượng`, bắt buộc chọn `Lý do thua — Lost Reason` khi đóng `Closed Lost`).

### 2.4. Bảng Giá, Chính Sách Chiết Khấu & Báo Giá (`Price Book & Quotation`)
- Hỗ trợ **Bảng giá linh hoạt (`Price Lists`)** theo Nhóm khách hàng, Chi nhánh, hoặc khoảng thời gian khuyến mãi; đồng bộ danh mục sản phẩm & Đơn vị tính (`UoM`) từ `plugins/inventory` / `catalog`.
- Lập **Báo giá (`Quotation`)** có kiểm tra **Tồn khả dụng (`Available Qty`)** tức thời từ `plugins/inventory` để Sales không báo giá sai khả năng giao hàng.
- Hỗ trợ **Quản lý phiên bản Báo giá (`v1, v2...`)**, hạn hiệu lực (`Valid Until`), tính thuế VAT theo dòng/đơn, chiết khấu dòng/tổng đơn, và kích hoạt duyệt `plugins/workflow` nếu mức giảm giá vượt thẩm quyền của nhân viên kinh doanh.

### 2.5. Đơn Đặt Hàng (`Sales Order`), Hạn Mức Công Nợ & Phối Hợp Kho
- Chuyển đổi trực tiếp từ Cơ hội / Báo giá thành **Đơn đặt hàng (`Sales Order`)** không cần nhập lại dữ liệu.
- **Kiểm tra Hạn mức Công nợ (`Credit Limit Enforcement`)** trước khi xác nhận đơn: `Dư nợ hiện tại + Giá trị Đơn mới <= Hạn mức cho phép` (nếu vượt -> Chặn xác nhận hoặc đẩy sang luồng xin duyệt ngoại lệ `Credit Override` qua `workflow`).
- **Tích hợp Lệnh giữ hàng & Giao hàng sang `plugins/inventory`**: Khi Đơn hàng được xác nhận -> gửi yêu cầu giữ hàng (`StockReservation`) sang Kho -> theo dõi tiến độ Soạn hàng / Xuất giao (`Partial Delivery / Full Delivery`) ngay trên chi tiết Đơn hàng.

### 2.6. Hợp Đồng, Lịch Thanh Toán & Quản Trị Công Nợ Phải Thu (`Contracts & AR`)
- Quản lý **Hợp đồng (`Contract`)** gắn với 1 hoặc nhiều Đơn hàng: ngày hiệu lực, ngày hết hạn, cảnh báo gia hạn tự động (`Renewal Alert`), tệp scan/bản ký số đính kèm.
- Chia **Đợt thanh toán (`Payment Milestones / Schedules`)**: đặt cọc, thanh toán theo nghiệm thu, giữ lại bảo hành, công nợ trả chậm `Net 15/30/60`.
- Ghi nhận **Phiếu Thu / Thanh toán từ Khách hàng (`Payment Receipt`)**, cấn trừ vào từng Đơn hàng/Đợt thanh toán; theo dõi **Sổ Công nợ Phải thu (`Receivable Ledger`)** và **Báo cáo Tuổi nợ (`Debt Aging: Trong hạn, Quá hạn 1-30, 31-60, 61-90, >90 ngày`)**.

### 2.7. Nghiệp Vụ Đổi / Trả Hàng (`Sales Return / RMA`) & Hậu Mãi (`Tickets & SLA`)
- **Đổi / Trả hàng (`RMA / Sales Return`)**: Tiếp nhận yêu cầu trả lại từ Đơn hàng đã giao -> duyệt lý do -> gửi lệnh nhập trả hàng (`RETURN_IN`) sang `plugins/inventory` (giữ đúng Serial/Lô gốc) -> ghi nhận **Giảm trừ công nợ / Hoàn tiền** tương ứng.
- **Chăm sóc Khách hàng & Ticket Khiếu nại/Bảo hành**: Quản lý yêu cầu hỗ trợ gắn theo Khách hàng / Đơn hàng / Serial sản phẩm; áp dụng **SLA (`First Response Time` & `Resolution Time`)** có cảnh báo sắp trễ hạn qua `in-app-notification` và khảo sát mức độ hài lòng (`CSAT`).

### 2.8. Nhật Ký Tương Tác (`Activities`), Hoa Hồng Tham Chiếu & Báo Cáo Kinh Doanh
- Ghi nhận lịch sử Cuộc gọi, Lịch hẹn, Email, Ghi chú, Nhiệm vụ nhắc việc (`Follow-up Tasks`) liên kết với Lịch làm việc.
- **Báo cáo & Phân tích**: Phễu chuyển đổi (`Lead -> Opp -> Won`), Tỷ lệ thắng/thua theo lý do, Doanh số theo Nhân viên/Nhóm/Chi nhánh, Công nợ phải thu theo tuổi nợ, Thời gian xử lý Ticket trung bình.

### 2.9. Phê Duyệt Đa Cấp (`DOA / SoD`), Lưu Vết 4 Tầng & Tùy Biến Biểu Mẫu CRM (`plugins/form`) Theo Tenant / Chi Nhánh
- Áp dụng **Ma trận Phê duyệt (`plugins/workflow`)** + **Bất kiêm nhiệm (`SoD`)** cho `Customer Merge`, `Reassign`, thay đổi `Credit Limit` / `Payment Term` (`Maker-Checker`), `Discount Override`, `Credit Override`, duyệt `Contract`, `RMA`/Hoàn tiền và Đảo Phiếu Thu.
- Lưu vết **4 tầng bất biến**: *(1) `Approval History Log`*, *(2) `Before/After Diff` sửa `owner_id/credit_limit/discount/stage/SLA`*, *(3) `CRM Lineage Graph` (`Lead -> Account -> Opp -> Quote -> SO -> AR -> RMA`)* và *(4) `Append-only AR Ledger`* kèm Drawer `Audit & Lineage`.
- Toàn bộ biểu mẫu CRM (`Lead Capture / BANT`, `Customer Account B2B/B2C & Contact`, `Opportunity Checklist`, `Quotation & Sales Order`, `Contract`, `RMA & Ticket Bảo hành / CSAT Survey`) dựng qua **`plugins/form` (Sprint 08 — 32 loại trường, `GRID` công thức RPN, `IMAGE_UPLOAD`, `SIGNATURE`)** cho phép từng **Tenant / Chi nhánh (`branch_id`)** tùy biến trường mở rộng trong `custom_fields_data` (`JSONB`) + `form_version`, giữ nguyên `System Locked Core Fields`.

---

## 3. Phân Vai Người Dùng & Liên Kết Hệ Sinh Thái

| Vai trò | Trách nhiệm chính | Phạm vi dữ liệu (`Data Scope`) |
| :--- | :--- | :--- |
| **Telesales / Marketing** | Nhập & lọc trùng `Lead`, gọi điện sàng lọc, chấm điểm, chuyển đổi thành Cơ hội. | Lead được gán / theo Chiến dịch |
| **Nhân viên Kinh doanh (`Sales Rep`)** | Quản lý Khách hàng phụ trách, chạy Pipeline Cơ hội, lập Báo giá, lên Đơn hàng, theo dõi giao hàng & nhắc nợ đến hạn. | `Own Records` (hoặc chia sẻ đồng phụ trách `Co-Owner`) |
| **Trưởng Nhóm / Quản Lý Kinh Doanh** | Phân bổ Lead, giám sát Pipeline & Forecast của Team, duyệt chiết khấu ngoài khung, xem báo cáo doanh số chi nhánh. | `Team / Branch Scope` (`organization`) |
| **Kế toán Công Nợ (`AR Accountant`)** | Thiết lập Hạn mức công nợ, duyệt đơn vượt hạn mức, ghi nhận Thanh toán, đối chiếu tuổi nợ & xử lý hoàn/giảm trừ trả hàng. | Toàn Chi nhánh / Toàn Tenant |
| **Nhân viên CSKH / Bảo hành** | Tiếp nhận & xử lý Ticket theo SLA, lập yêu cầu Đổi/Trả hàng RMA, khảo sát CSAT. | Ticket / Khách hàng được phân công |
| **Quản trị Hệ thống CRM** | Cấu hình Pipeline & Stage Guardrails, Quy tắc trùng lặp, Quy tắc chia Lead, SLA Ticket, Bảng giá & Workflow duyệt. | Toàn Tenant |

---

## 4. Ràng Buộc Kỹ Thuật & UI/UX Kế Thừa Từ Bộ Quy Tắc Dự Án

| Nhóm ràng buộc | Yêu cầu bắt buộc từ `AGENTS.md` | Ảnh hưởng tới tài liệu Sprint 14 |
| :--- | :--- | :--- |
| **Multi-Tenant & Ranh giới Plugin** | Cô lập `tenant_id` triệt để; mọi Entity đăng ký Entity Registry; liên kết `inventory`, `organization`, `catalog`, `employee`, `form`, `workflow`, `in-app-notification` 100% qua gRPC/Kafka (cấm gọi REST chéo trực tiếp hay fix `size=100`). | Tách rạch ròi dữ liệu Khách hàng/Đơn hàng (`crm`) khỏi dữ liệu Tồn kho/Phiếu kho (`inventory`). |
| **Dynamic Form Builder (`plugins/form` — Sprint 08)** | Toàn bộ form nhập liệu CRM (`Lead`, `Account/Contact`, `Opportunity`, `Quotation`, `Sales Order`, `Contract`, `RMA/Ticket`) kết xuất qua `plugins/form` (`32` loại trường, `GRID`, `SIGNATURE`) theo kế thừa 3 tầng (`System -> Tenant -> Branch`) + `System Locked Core Fields` + `JSONB` kèm `form_version`. | Từng Tenant/Chi nhánh tùy biến trường bán hàng/chăm sóc khách mà không sửa code; hỗ trợ điều kiện rẽ nhánh `workflow` & cột lọc Sticky Table. |
| **Data View & Sticky Scroll Table + Context Menu (`#33`)** | Mọi danh sách (Lead, Customer, Contact, Opportunity List, Quotation, Sales Order, Contract, Receivable Debt, Ticket) dùng Table `@shared/*` cố định Header/Footer, chỉ cuộn Content, ẩn/hiện & đổi thứ tự cột, số hàng/trang, đồng bộ URL & **Context Menu chuột phải** đầy đủ tác vụ nghiệp vụ (cùng fallback `>= 40px` trên Mobile). | Mô tả chi tiết trong `ANL-S14-001` & tiêu chí `AC-18` trong `CONF-S14-001`. |
| **Anti-Modal & Route-Driven State** | Tuyệt đối không mở modal popup tạo Lead/Báo giá/Đơn hàng/Ticket; dùng **Split-View**, **Kanban Board đồng bộ URL**, **Nested Route** cho Customer 360 và **Stacked Drawers** (`?drawer=...`). | Bảo toàn trạng thái khi F5 hoặc chia sẻ link cho đồng nghiệp/sếp duyệt. |
| **Dual-Mode Desktop & Mobile Ionic** | Desktop (`>= 1280px`) tối ưu mật độ dữ liệu (`High Density & Sharp`); Mobile Ionic (`390x844 px`) tối ưu cho Sales đi thị trường (Tra cứu Khách 360, Check-in ghi chú gặp khách, Xem tồn kho/Tạo Báo giá nhanh, Theo dõi Đơn & Nhắc việc, nút chạm `>= 40px`). | Ma trận rõ ràng từng màn hình Desktop vs. Mobile. |
| **Zero-Emoji, 100% i18n & Test Thực Dụng** | Cấm emoji trên nhãn/badge/menu; 100% `vi.json`/`en.json`; Backend test JUnit 5 + RestAssured trên **PostgreSQL & Redis thật**; Frontend **0 file `.spec.ts`**, QA Dual-Mode Browser Testing. | Kiểm thử cả kịch bản Credit Limit concurrency & gRPC/Kafka sync với `inventory`. |
