# Phân Tích Đối Thủ & Benchmark Nghiệp Vụ — Plugin Quản Lý & Nghiệp Vụ Khách Hàng (`plugins/crm`) (Sprint 14)

| Thuộc tính | Giá trị |
| :--- | :--- |
| ID | BENCH-S14-001 |
| Sprint | Sprint 14 (`sprint_14_plugin_crm`) |
| Tác giả | AI Business Analyst (BA) |
| Trạng thái | Draft / Chờ review |
| Phiên bản | 0.1 |
| Tài liệu liên quan | [00_READING_GUIDE.md](../00_READING_GUIDE.md) · [RAW-S14-001](../01_raw_notes/01_RAW-S14-001_crm_customer_requirements.md) · [ANL-S14-001](../02_analysis/01_ANL-S14-001_crm_customer_workflows.md) |

---

## 1. Mục Tiêu Đối Sánh (Benchmarking Scope)

Tài liệu đối sánh **10 nền tảng CRM & Quản trị Nghiệp vụ Khách hàng hàng đầu** (5 nền tảng Quốc tế + 5 nền tảng phổ biến tại Việt Nam) trên toàn bộ chuỗi giá trị với khách hàng:
1. Vòng đời **Lead -> Customer Account -> Contact -> Opportunity** & chống trùng lặp.
2. Quản lý **Pipeline trực quan, Stage Guardrails (Blueprint) & Dự báo Doanh thu**.
3. Nghiệp vụ **Báo giá (`Quotation`) -> Đơn đặt hàng (`Sales Order`) -> Hợp đồng (`Contract`)**.
4. Liên thông **Kiểm tra Tồn kho & Giữ hàng** từ hệ thống Kho độc lập.
5. Kiểm soát **Hạn mức Công nợ (`Credit Limit`), Lịch thanh toán & Tuổi nợ (`AR Aging`)**.
6. Nghiệp vụ **Đổi/Trả hàng (`RMA`)** & **Chăm sóc/Ticket kèm `SLA`**.
7. Trải nghiệm **Customer 360, Bảng dữ liệu mật độ cao & Mobile Sales thực địa**.

---

## 2. Hồ Sơ Chi Tiết 10 Đối Thủ

### A. Nhóm Hệ Thống Quốc Tế (Enterprise & Modern ERP CRM)

#### 2.1. Salesforce Sales Cloud & Service Cloud
- **Mô hình Lead -> Account / Contact / Opportunity chuẩn mực toàn cầu**: `Lead` là bản ghi thô chưa định danh rõ. Khi *Convert Lead*, hệ thống tự động rẽ 3 thực thể: `Account` (Tổ chức/Khách hàng chính), `Contact` (Người liên hệ cụ thể, hỗ trợ quan hệ N-N hoặc nhiều vai trò trong 1 thương vụ *Contact Roles*), và `Opportunity` (Thương vụ gắn doanh số).
- **Duplicate Rules & Matching Rules**: So khớp mờ (Fuzzy Match) trên tên công ty, SĐT, Email, Website trước khi cho phép lưu hoặc gợi ý nút gộp bản ghi (*Merge Duplicates*).
- **Approval Processes & Quote Line Versioning**: Quản lý nhiều phiên bản Báo giá trong cùng 1 Opportunity nhưng chỉ đánh dấu 1 bản *Synced Quote*; tích hợp quy trình phê duyệt chiết khấu nhiều tầng.
- **Bài học cho Open-ERP**: Mô hình tách `Account` (Khách hàng pháp nhân/cá nhân để hạch toán công nợ) khỏi `Contact` (người giao dịch thực tế) và `Duplicate Detection` trước khi lưu là xương sống không thể thiếu cho B2B lẫn B2C.

#### 2.2. HubSpot CRM
- **Lifecycle Stages & Deal Pipelines**: Phân tách rõ **Vòng đời quan hệ** (*Lead -> MQL -> SQL -> Opportunity -> Customer -> Evangelist*) khỏi **Tiến trình chốt từng thương vụ** (*Deal Pipeline* — 1 Customer có thể đồng thời có nhiều Deal ở các giai đoạn khác nhau như Mua mới, Gia hạn, Up-sell).
- **Customer 360 Timeline**: Giao diện chia 3 cột kinh điển — Cột trái: Thông tin thuộc tính cốt lõi; Cột giữa: Dòng thời gian hợp nhất mọi email/cuộc gọi/ghi chú/cuộc họp/thay đổi đơn; Cột phải: Các đối tượng liên quan (Deals, Quotes, Tickets, Payments).
- **Task Queues & Sequences**: Giúp nhân viên kinh doanh xử lý liên hoàn chuỗi cuộc gọi/nhắc việc theo hàng đợi mà không quên follow-up khách hàng.

#### 2.3. Zoho CRM (Blueprint & CommandCenter)
- **Zoho CRM Blueprint (Stage Guardrails)**: Cơ chế *Guardrail* bắt buộc người dùng thực hiện đủ điều kiện (*Before/During/After* của mỗi lần chuyển trạng thái). Ví dụ: không thể kéo Deal từ `Thương lượng` sang `Chốt thắng` nếu chưa đính kèm Hợp đồng hoặc chưa điền số tiền chốt; không thể sang `Thua` nếu thiếu `Lost Reason`.
- **Liên thông Zoho Inventory / Books**: Tách riêng ứng dụng nhưng kết nối đồng bộ sản phẩm, tồn kho khả dụng, đơn hàng và hóa đơn/công nợ thông qua ID tham chiếu chung.
- **SLA & Escalation Rules**: Tự động leo thang cảnh báo lên Trưởng nhóm nếu Ticket hoặc Lead nóng không được phản hồi đúng khung thời gian cam kết.

#### 2.4. Odoo CRM & Sales
- **Chế độ bật/tắt tầng Lead**: Cho phép doanh nghiệp B2B thuần (bán lại cho khách quen) tạo thẳng `Opportunity` mà không bắt qua `Lead`; doanh nghiệp chạy quảng cáo nhiều thì bật tầng `Lead` để Telesales lọc thô trước.
- **Quotation Template & Electronic Sign/Confirm**: Báo giá đi kèm điều khoản chuẩn, hạn hiệu lực (`Expiration Date`), tự động tính quy đổi `UoM` và sinh `Sales Order` -> kích hoạt lệnh giữ/giao hàng sang phân hệ Kho (`Inventory`) khi bấm `Confirm`.
- **Khóa/Chặn theo Công nợ (`Credit Limit Warning`)**: Cảnh báo ngay trên đầu màn hình Báo giá/Đơn hàng tổng công nợ hiện tại của khách hàng so với hạn mức được cấp.

#### 2.5. ERPNext CRM & Selling
- **Chuỗi chứng từ khép kín & Kiểm soát `Credit Limit`**: `Lead -> Opportunity -> Quotation -> Sales Order -> Delivery Note (Kho) -> Sales Invoice (Công nợ)`.
- **Customer Credit Limit & Payment Terms Template**: Thiết lập hạn mức công nợ cấp Customer hoặc Customer Group; khi `Submit Sales Order`, hệ thống cộng tổng `(Dư nợ chưa thu + Giá trị đơn đã đặt chưa xuất hóa đơn + Đơn mới)` — nếu vượt hạn mức thì **chặn hoặc yêu cầu vai trò có quyền `Credit Controller` mở khóa ngoại lệ**.
- **Định nghĩa `Territory` & `Sales Partner`**: Phân vùng thị trường và theo dõi hoa hồng người giới thiệu/nhân viên phụ trách theo tỷ lệ chia sẻ trên từng đơn (`Sales Team Split`).

---

### B. Nhóm Hệ Thống Phổ Biến Tại Việt Nam

#### 2.6. MISA AMIS CRM
- **Sát thực tế doanh nghiệp Việt (`MST + Công nợ + Hóa đơn`)**: Khi nhập **Mã số thuế (`MST`)**, hỗ trợ tự tra cứu/gợi ý thông tin doanh nghiệp, kiểm tra trùng MST toàn công ty để tránh 2 nhân viên kinh doanh cùng tranh 1 khách B2B.
- **Chuỗi `Tiềm năng -> Cơ hội -> Báo giá -> Đơn hàng -> Đề nghị xuất hóa đơn / Theo dõi Công nợ`**: Hỗ trợ thiết lập **Quy tắc phân bổ nguồn Lead** (Chia đều tự động hoặc Thu hồi Lead sau X ngày không chăm sóc), phân quyền chặt dữ liệu *Cá nhân / Nhóm / Chi nhánh*, và đồng bộ tình trạng thu tiền - công nợ từ bộ phận Kế toán về để Sales chủ động nhắc khách hàng trước khi lên đơn tiếp.

#### 2.7. 1Office CRM
- **Liên thông Workflow Phê duyệt Nội bộ + Hợp đồng**: Điểm mạnh nổi bật tại VN là tích hợp chặt giữa **Báo giá / Hợp đồng / Phụ lục / Đề nghị giảm giá** với hệ thống duyệt nhiều cấp và **Quản lý Công việc (`Work`)**.
- **Quản lý Hợp đồng & Tiến độ Thanh toán (`Contract Milestones`)**: Chia rõ từng đợt nghiệm thu, đợt thu tiền trên hợp đồng (tạm ứng 30%, giao hàng 50%, nghiệm thu/bảo hành 20%) kèm cảnh báo tự động khi sắp tới hạn thu tiền hoặc hạn gia hạn hợp đồng.

#### 2.8. Getfly CRM
- **Tối ưu Telesales, Chăm sóc khách hàng & Đo lường KPI Sales**: Tích hợp chặt tổng đài Call/SMS/Email, tự động ghi log lịch sử chăm sóc vào hồ sơ khách hàng, thiết lập **Kịch bản chăm sóc tự động (`Marketing/Sales Automation`)** (nhắc lịch sinh nhật, tự nhắc Sales khi khách 30 ngày chưa có tương tác mới).
- **Quản lý Đơn bán & Trả hàng đơn giản**: Theo dõi doanh thu thực thu vs doanh số ghi nhận trên từng nhân viên để tính thưởng/chỉ tiêu minh bạch.

#### 2.9. SlimCRM
- **Triết lý Tinh gọn cho SME (Gộp chuẩn B2B + Thu chi nhẹ)**: Thiết kế rất gọn luồng `Cơ hội (Kanban) -> Báo giá PDF/Link -> Hợp đồng -> Hóa đơn/Đề nghị thanh toán`, gắn biểu đồ dòng tiền dự kiến và cảnh báo quá hạn thu tiền ngay trên thẻ khách hàng, tránh nhồi nhét hàng trăm trường dữ liệu gây ngán cho nhân viên sales.

#### 2.10. Haravan / KiotViet (Phân hệ Khách hàng, Đơn đặt hàng & Đổi trả)
- **Tốc độ xử lý Đơn hàng & Đổi trả (`Order & Return Flow`)**: Xử lý cực tốt bài toán **Đặt trước / Giao nhiều lần / Đổi trả hàng (`RMA`)** — tính toán chính xác tiền hoàn hoặc cấn trừ sang đơn mới, phân biệt `Khách lẻ (B2C)` và `Khách sỉ (Wholesale)` có **Nhóm khách gắn Bảng giá riêng**.
- **Tích điểm / Phân hạng Thành viên (`Loyalty Tier`)**: Tự động nâng hạng khách hàng dựa trên tổng chi tiêu tích lũy trong kỳ để hưởng chiết khấu tự động.

---

## 3. Ma Trận So Sánh 8 Khía Cạnh Nghiệp Vụ Khách Hàng

| Khía cạnh | Salesforce | HubSpot | Zoho CRM | Odoo | ERPNext | MISA AMIS | 1Office | Getfly | SlimCRM | KiotViet/Haravan |
| :--- | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: |
| **1. Lead + Chống trùng + Routing** | Rất cao (Fuzzy Match) | Cao | Cao | Tùy chọn | Tốt | Rất sát VN (MST) | Tốt | Cao (Telesales) | Cơ bản | Không có Lead |
| **2. Customer 360 (B2B/B2C + Contacts)** | Chuẩn mực (`Account/Contact`) | Rất trực quan (Timeline) | Tốt | Tốt | Tốt | Rất tốt (B2B/B2C) | Tốt | Khá | Gọn | Chỉ B2C/Khách sỉ |
| **3. Opportunity Pipeline & Guardrails** | Cao | Rất trực quan | Rất chặt (`Blueprint`) | Tốt | Cơ bản | Tốt | Khá | Tốt | Tốt | Không có |
| **4. Báo giá (Versioning + Giá/Chiết khấu)** | Rất cao | Khá | Tốt | Rất tốt | Tốt | Tốt | Tốt | Cơ bản | Khá | Cơ bản |
| **5. Đơn hàng + Kiểm soát Hạn mức Công nợ** | Cần Add-on | Yếu (Cần app) | Cần Zoho Books | Có cảnh báo | Rất chặt (`Credit Limit`) | Tốt (qua Kế toán) | Tốt (Hợp đồng) | Cơ bản | Khá | Cơ bản |
| **6. Hợp đồng & Lịch thanh toán / Tuổi nợ** | CPQ/Billing | Yếu | Qua Zoho Books | Qua Accounting | Rất chuẩn (`AR Aging`) | Mạnh (Hóa đơn/Nợ) | Rất mạnh (Đợt TT) | Cơ bản | Tốt | Có ghi nợ |
| **7. Đổi / Trả hàng (`RMA`) & Bảo hành/Ticket SLA** | Service Cloud mạnh | Service Hub tốt | Zoho Desk SLA | Helpdesk + RMA | Issue + Sales Return | Phối hợp Kho/CSKH | Ticket nội bộ | CSKH/Ticket | Hạn chế | Trả hàng rất nhanh |
| **8. Liên kết Lỏng Kho (`Inventory` Độc lập)** | API/AppExchange | Integration | App rời | Module nội bộ | Module nội bộ | Sync Kho/Kế toán | Sync Kho nội bộ | Tồn kho sơ khai | Không có Kho sâu | Gộp chặt POS/Kho |

---

## 4. 12 Bài Học Kiến Trúc & Nghiệp Vụ Áp Dụng Cho `plugins/crm` (`L01`–`L12`)

| Mã | Bài học rút ra từ đối thủ | Định hướng áp dụng vào `plugins/crm` (Sprint 14) |
| :--- | :--- | :--- |
| `L01` | **Tách `Customer Account` khỏi `Contact` (Salesforce / ERPNext)** | Một `Customer Account` (tổ chức B2B hoặc cá nhân B2C) có thể sở hữu nhiều `Contact` (Giám đốc, Kế toán, Thủ kho nhận hàng), nhiều địa chỉ giao hàng/xuất hóa đơn, nhưng **Công nợ & Doanh số luôn quy tụ về `Customer Account`**. |
| `L02` | **Lọc trùng đa tiêu chí + MST Việt Nam (Salesforce / MISA AMIS)** | Bắt buộc kiểm tra trùng `MST`, `Số điện thoại` (chuẩn hóa E.164/0xxx), và `Email` trước khi tạo `Lead` hoặc `Customer`; hiển thị Drawer cảnh báo trùng kèm thao tác chọn **Gộp / Mở hồ sơ có sẵn** tránh tranh chấp khách giữa các Sales. |
| `L03` | **Phân bổ Lead thông minh & Thu hồi SLA (`Lead Routing & Reclaim`) (MISA / Getfly)** | Hỗ trợ phân bổ tự động (`Round-Robin` theo nhóm/chi nhánh) kèm cấu hình thời gian *Chạm lần đầu*: quá X giờ Sales chưa tương tác -> cảnh báo qua `in-app-notification` hoặc tự động thu hồi về giỏ chung cho người khác nhận. |
| `L04` | **Mở khóa Pipeline với `Stage Guardrails` (Zoho Blueprint / HubSpot)** | Hỗ trợ nhiều Pipeline với các bước tùy biến, mỗi bước gắn tỷ lệ thắng (%) để tính `Weighted Forecast` và quy tắc **Bắt buộc trường thông tin** (VD: sang `Báo giá` phải gắn Quote, sang `Thua` bắt buộc có `Lost Reason`) nhằm chống Sales kéo bừa trạng thái. |
| `L05` | **Chế độ Linh hoạt: Bỏ qua Lead cho Khách quen (Odoo CRM)** | Cho phép Sales tạo thẳng `Opportunity / Quotation / Sales Order` đối với Khách hàng hiện hữu (`Existing Customer`) thay vì bắt buộc tạo lại `Lead`. |
| `L06` | **Báo giá Đóng phiên bản (`Quotation Revisions`) + Duyệt chiết khấu (`workflow`)** | Khi sửa Báo giá đã gửi khách, sinh phiên bản mới (`v2`, `v3`) giữ nguyên lịch sử đàm phán trước đó; nếu tổng % chiết khấu hoặc biên lợi nhuận thấp hơn ngưỡng của Sales Rep -> kích hoạt phê duyệt qua `plugins/workflow`. |
| `L07` | **Kiểm tra Tồn khả dụng & Giữ hàng Lỏng với `plugins/inventory` (Odoo / Zoho)** | Khi lên Báo giá/Đơn hàng, `plugins/crm` gọi gRPC sang `plugins/inventory` đọc `Available Qty` theo kho để Sales biết chính xác có đủ hàng giao không; khi Đơn hàng được xác nhận -> gửi yêu cầu `StockReservation (reference_type = SALES_ORDER)` sang Kho để khóa hàng, tuyệt đối không bán trùng. |
| `L08` | **Kiểm soát Hạn mức Công nợ (`Credit Limit Enforcement`) (ERPNext / MISA)** | Trước khi xác nhận `Sales Order`, tính `Tổng công nợ chưa thanh toán + Giá trị đơn chờ xuất + Đơn hiện tại`: nếu vượt `credit_limit` của Khách hàng -> Chặn xác nhận hoặc đẩy sang bước **Duyệt ngoại lệ công nợ (`Credit Override`)** cho Quản lý / Kế toán. |
| `L09` | **Hợp đồng + Đợt thanh toán (`Contract Milestones`) & Tuổi nợ (1Office / ERPNext)** | Tách rõ `Sales Order` (lệnh giao hàng/dịch vụ) với `Contract` (khung pháp lý nhiều đợt giao/nghiệm thu) và `Payment Milestone` (lịch thu tiền từng đợt), đồng thời duy trì Sổ Công nợ phải thu (`Receivable Ledger`) & Báo cáo Tuổi nợ (`AR Aging`). |
| `L10` | **Quy trình Đổi/Trả hàng (`Sales Return RMA`) khép kín với Kho & Công nợ (KiotViet / ERPNext)** | Cho phép tạo Phiếu yêu cầu Trả hàng gắn với Đơn hàng đã giao -> sau khi duyệt, gửi yêu cầu nhập trả `RETURN_IN` sang `plugins/inventory` -> khi Kho xác nhận đã nhận lại hàng, tự động phát sinh bút toán **Giảm trừ Công nợ / Đề nghị hoàn tiền**. |
| `L11` | **Customer 360 & Ticket Hậu mãi kèm `SLA` (HubSpot / Zoho / Service Cloud)** | Hợp nhất toàn bộ Lịch sử tương tác (`Activity Timeline`), Đơn hàng, Công nợ và Ticket Khiếu nại/Bảo hành vào giao diện **Nested Route Customer 360**, đo thời gian phản hồi & xử lý Ticket theo `SLA Policy` cảnh báo qua `in-app-notification`. |
| `L12` | **Data View Mật độ cao, Context Menu & Mobile Check-in Sales (`AGENTS.md` #33)** | Trên Web Desktop, chuyển đổi mượt giữa **Kanban Pipeline** và **Data View Sticky Table** (cố định Header/Footer, ẩn/hiện & đổi thứ tự cột, lọc đa chiều đồng bộ URL Query Params, **Context Menu chuột phải**: Gọi/Ghi chú, Tạo Báo giá, Chuyển giai đoạn, Chốt đơn, Mở Customer 360). Trên Mobile Ionic tối ưu tra cứu nhanh & Check-in gặp khách (`>= 40px`). |
