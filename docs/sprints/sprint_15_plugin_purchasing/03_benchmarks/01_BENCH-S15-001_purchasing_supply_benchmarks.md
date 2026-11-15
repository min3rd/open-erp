# Phân Tích Đối Thủ & Benchmark Nghiệp Vụ — Plugin Mua Hàng & Cung Ứng (`plugins/purchasing`) (Sprint 15)

| Thuộc tính | Giá trị |
| :--- | :--- |
| ID | BENCH-S15-001 |
| Sprint | Sprint 15 (`sprint_15_plugin_purchasing`) |
| Tác giả | AI Business Analyst (BA) |
| Trạng thái | Draft / Chờ review |
| Phiên bản | 0.1 |
| Tài liệu liên quan | [00_READING_GUIDE.md](../00_READING_GUIDE.md) · [RAW-S15-001](../01_raw_notes/01_RAW-S15-001_purchasing_supply_requirements.md) · [ANL-S15-001](../02_analysis/01_ANL-S15-001_purchasing_supply_workflows.md) |

---

## 1. Mục Tiêu Đối Sánh (Benchmarking Scope)

Tài liệu phân tích **10 hệ thống Quản lý Mua hàng, Cung ứng & P2P (Procure-to-Pay)** tiêu biểu (5 sản phẩm Quốc tế + 5 sản phẩm phổ biến tại Việt Nam) dưới lăng kính thực tế của **Doanh nghiệp Sản xuất, Thương mại và Dịch vụ**:
1. Luồng Đề nghị Mua hàng (`PR`), Kiểm soát Ngân sách (`Budget Check`) & Gộp yêu cầu (`PR Consolidation`).
2. Luồng Hỏi giá (`RFQ`) & **Bảng So sánh Báo giá Nhà cung cấp (`Bid Comparison Matrix`)**.
3. Nghiệp vụ **Hợp đồng Khung (`Blanket Order`)**, **`AVL` (Nhà cung cấp đạt chuẩn)**, `MOQ`, `Lead-time` & Bảng giá bậc số lượng.
4. Tách biệt **Mua hàng qua Kho (`GR`)** và **Mua Dịch vụ/Thuê ngoài (`Service Entry Sheet — SES`)**.
5. Phân bổ **Chi phí mua hàng (`Landed Cost`)** & **Đối chiếu 3 chiều (`3-Way Matching`)** kèm giới hạn sai số (`Tolerance`).
6. Đánh giá Nhà cung cấp (`Supplier Scorecard`), Trả hàng mua (`Purchase Return`) & Công nợ Phải trả (`AP Aging`).

---

## 2. Hồ Sơ Chi Tiết 10 Đối Thủ

### A. Nhóm Hệ Thống Quốc Tế (Enterprise P2P & Modern ERP Buying)

#### 2.1. SAP S/4HANA Materials Management (MM) & SAP Ariba
- **Chuẩn mực `3-Way Matching` & `Tolerance Keys`**: Đối chiếu tự động từng dòng giữa `Purchase Order (PO)`, `Goods Receipt (GR)` / `Service Entry Sheet (SES)`, và `Vendor Invoice (IR)`. Nếu chênh lệch đơn giá (`PP`) hoặc số lượng (`DQ`) vượt ngưỡng phần trăm/số tiền cho phép, hệ thống khóa thanh toán hóa đơn (`Invoice Block`) chuyển kế toán/quản lý rà soát.
- **Service Entry Sheet (`SES`) cho Doanh nghiệp Dịch vụ**: Tách bạch mua vật tư vật lý (`MIGO`) khỏi mua dịch vụ vô hình (bảo trì, vận chuyển, tư vấn) bằng chứng từ nghiệm thu `SES` gắn `Cost Center` hoặc `Project`, hỗ trợ nghiệm thu nhiều đợt theo khối lượng hoặc % hoàn thành.
- **Framework Order / Blanket PO & Release**: Quản lý hợp đồng nguyên tắc theo giá trị trần (`Overall Limit`) & kỳ hiệu lực để thanh toán các chi phí lặp lại mà không cần làm từng `PR/PO` rườm rà.
- **Bài học cho `plugins/purchasing`**: Áp dụng *3-Way Match + Tolerance* và *Service Entry Sheet (SES)* là chìa khóa phục vụ chuẩn cả Doanh nghiệp Sản xuất lẫn Doanh nghiệp Dịch vụ mà không bắt dịch vụ phải "nhập kho ảo".

#### 2.2. Coupa Procurement (Enterprise Procure-to-Pay)
- **Kiểm soát Ngân sách Thực Thời (`Pre-Spend Budget Check`)**: Chặn chi tiêu ngay tại thời điểm nhân viên tạo `Purchase Requisition (PR)` (trước khi ký hợp đồng hay đặt hàng) dựa trên `Department / Cost Center / Fiscal Period`.
- **Giao diện Mua sắm Hướng Người Dùng (`Guided Buying` & `Approval Chains`)**: Nhân viên không cần thuộc mã kế toán vẫn chọn được mặt hàng trong danh mục chuẩn (`Catalog`) hoặc gửi yêu cầu tự do (`Free-text PR`); chuỗi phê duyệt linh hoạt theo ma trận Giá trị tiền + Phòng ban + Vượt ngân sách.
- **Tối ưu Mobile Approval**: Phê duyệt tức thì `PR/PO` từ di động chỉ với 1 màn hình tóm tắt ngân sách còn lại & lịch sử giá gần nhất.

#### 2.3. Odoo Purchase
- **Purchase Agreements (`Call for Tender` vs `Blanket Orders`)**: Hỗ trợ đồng thời 2 kịch bản: *(1) Đấu thầu chọn 1 NCC* (nhận nhiều báo giá từ các NCC và chọn bản tốt nhất) và *(2) Đơn đặt hàng khung* (ký thỏa thuận giá với 1 NCC trong 1 năm rồi tạo các PO gọi hàng nhỏ lẻ `Release PO`).
- **Tạo `PO` tự động từ Định mức Kho (`Reorder Rules / Make-to-Order`)**: Tự sinh đề xuất mua khi tồn dự kiến xuống dưới `Min`, hỗ trợ nhập nhiều đợt trên 1 PO và tích hợp phân hệ `Landed Costs` chia phí cước/hải quan vào giá trị lô hàng nhập.
- **3-Way Match Policy**: Cho phép cấu hình ở cấp sản phẩm/NCC kiểm soát theo *Số lượng đặt (`Ordered Quantities`)* hoặc *Số lượng thực nhận (`Received Quantities`)*.

#### 2.4. ERPNext Buying (Frappe)
- **Chuỗi Chứng Từ Sạch (`Material Request -> RFQ -> Supplier Quotation -> PO -> Purchase Receipt -> Purchase Invoice`)**: Triệt tiêu nhập liệu lặp lại; hỗ trợ **Gộp nhiều `Material Request`** từ nhiều phòng ban thành 1 `RFQ / PO` lớn để đàm phán giá tốt hơn.
- **Budget Control & Cost Centers**: Cấu hình Ngân sách theo `Cost Center` & kỳ tài chính với 3 hành động: `Ignore`, `Warn`, hoặc `Stop` ngay tại bước `Material Request` hoặc `PO`.
- **Supplier Scorecard**: Tự động tính điểm tin cậy của NCC dựa trên lịch sử giao dịch thực tế: *On-Time Delivery %*, *Accepted vs Rejected Qty (QC)*, *Response Time*, phân hạng *Preferred / Watch / Blocked* (tự cảnh báo hoặc chặn đặt mua NCC bị `Blocked`).

#### 2.5. Oracle NetSuite Procurement
- **Tách Nghiệp vụ Mua Kho vs Chi tiêu Trực tiếp & Phân bổ Chi phí**: Hỗ trợ mạnh *Vendor Pricelist theo Bậc số lượng (Quantity Breaks)*, *Multi-currency PO* (mua ngoại tệ quy đổi tỷ giá tại ngày nhận hàng), và *Amortization / Expense Allocation* cho hợp đồng dịch vụ dài hạn.
- **Audit Lịch sử Thay đổi `PO` (`PO Change Order`)**: Khi đã gửi `PO` cho NCC mà thay đổi số lượng hoặc đơn giá vượt ngưỡng, tự động lưu lịch sử version và yêu cầu duyệt lại nếu tổng tiền tăng vượt mức.

---

### B. Nhóm Hệ Thống Phổ Biến Tại Việt Nam (Sản Xuất, Thương Mại & Dịch Vụ)

#### 2.6. MISA AMIS Mua Hàng
- **Điểm mạnh Thực tế VN (`Đề nghị mua hàng -> Hỏi giá -> Bảng so sánh báo giá -> PO`)**: Cho phép nhân viên mua hàng gửi Email mời chào giá hàng loạt tới các NCC, nhập lại báo giá và **tự động xuất Bảng so sánh báo giá** (so sánh đơn giá, chiết khấu, chi phí vận chuyển, thời gian giao hàng) để trình Lãnh đạo ký duyệt chọn nhà cung cấp.
- **Liên kết Chặt với Hóa đơn Đầu vào & Công nợ Phải trả**: Kiểm tra trùng số hóa đơn/MST của NCC, phân bổ chi phí mua hàng (vận chuyển, bốc xếp, hải quan) và đối chiếu công nợ phải trả theo hạn thanh toán.

#### 2.7. 1Office (Phân Hệ Đề Xuất Mua Hàng & Hợp Đồng Mua)
- **Tùy biến Workflow Đề xuất Nội bộ (`PR`) Cực Linh Hoạt**: Các công ty Dịch vụ và Thương mại tại VN ưa chuộng việc phòng ban tự tạo Đề xuất mua sắm trên 1Office -> tự động định tuyến duyệt theo cấp Quản lý -> Hành chính / Tài chính -> Bộ phận Mua hàng nhận việc -> theo dõi tiến độ thanh toán từng đợt của Hợp đồng mua.
- **Hồ sơ Nhà cung cấp tập trung**: Lưu toàn bộ hợp đồng nguyên tắc, phụ lục giá, lịch sử đánh giá năng lực và công nợ thanh toán trên cùng một hồ sơ.

#### 2.8. Fast Business Online
- **Thế mạnh Công ty Thương mại & Sản xuất Tầm Trung**: Quản lý chi tiết **Bảng giá NCC theo thời gian & số lượng**, dự trù nhu cầu mua hàng theo tiến độ sản xuất/tồn tối thiểu, theo dõi chặt tiến độ giao từng đợt của `PO` (`Đặt 1.000 -> Đã nhận 600 -> Còn chờ 400 -> Quá hạn 5 ngày`), phân bổ nhiều loại chi phí mua hàng trực tiếp vào từng phiếu nhập kho và quản trị tuổi nợ phải trả (`AP`).

#### 2.9. Bravo ERP
- **Thế mạnh Doanh nghiệp Sản xuất Quy Mô Lớn**: Rất mạnh ở bài toán **Mua NVL theo định mức sản xuất (`BOM/MRP`)**, phê duyệt **Danh mục Nhà cung cấp Đạt chuẩn (`AVL`)**, quy trình đấu thầu/chọn giá chặt chẽ (>= 3 báo giá với đơn hàng giá trị lớn, bắt buộc giải trình nếu không chọn giá rẻ nhất), và tích hợp cân xe / QC đầu vào cho từng lô nguyên liệu sản xuất.

#### 2.10. KiotViet / Sapo (Quản Lý Nhập Hàng & Nhà Cung Cấp)
- **Thao tác Nhanh Cho Thương Mại Bán Lẻ**: Mô hình gọn `Đặt hàng nhập -> Nhập nhiều đợt -> Trả hàng nhập -> Thanh toán NCC`, hỗ trợ tính thẳng chi phí nhập hàng (ship, bốc xếp) vào giá vốn bình quân ngay lúc nhập kho và theo dõi dư nợ NCC đơn giản.
- **Hạn chế so với Open-ERP**: Yếu ở khâu Đề nghị mua hàng đa phòng ban (`PR`), `Budget Check`, Ma trận So sánh Báo giá (`RFQ`), `AVL`, `SES` dịch vụ và `3-Way Matching`.

---

## 3. Ma Trận So Sánh 8 Khía Cạnh Nghiệp Vụ Mua Hàng & Cung Ứng

| Khía cạnh | SAP MM / Ariba | Coupa | Odoo Purchase | ERPNext | NetSuite | MISA AMIS | 1Office | Fast Business | Bravo ERP | KiotViet / Sapo |
| :--- | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: |
| **1. Đề nghị mua (`PR`) & Gộp nhiều PR** | Rất cao | Rất cao | Tốt | Rất tốt (`Material Req`) | Cao | Tốt | Rất tốt | Tốt | Rất cao | Không có |
| **2. Kiểm tra Ngân sách (`Budget Check`)** | Rất chặt | Rất chặt | Hạn chế (Add-on) | Tốt (`Cost Center`) | Cao | Cơ bản | Cơ bản | Tốt | Chặt | Không có |
| **3. `RFQ` & Ma trận So sánh Báo giá** | Rất cao | Cao | Khá (`Tender`) | Tốt | Cao | Rất tốt (Bảng so sánh) | Khá | Tốt | Rất chặt | Không có |
| **4. `AVL`, `Blanket Order`, `MOQ / Lead-time`** | Đầy đủ | Đầy đủ | Tốt (`Blanket`) | Khá (`Pricing Rule`) | Đầy đủ | Cơ bản | Hợp đồng khung | Tốt | Rất chặt (Sản xuất) | Không có |
| **5. Nghiệm thu Dịch vụ (`SES` — không qua kho)** | Chuẩn mực (`SES`) | Rất tốt | Cơ bản (Milestone) | Cơ bản | Tốt | Phiếu chi/HĐ | Theo đợt HĐ | Theo phiếu | Có | Không có |
| **6. Kiểm định QC đầu vào & `Landed Cost`** | Rất chặt | Hạn chế | Tốt (`Landed Cost`) | Tốt (`LVC`) | Tốt | Phân bổ chi phí | Hạn chế | Rất tốt | Rất chặt | Phân bổ đơn giản |
| **7. Đối chiếu 3 Chiều (`3-Way Matching` + Sai số)** | Chuẩn mực (`PP/DQ`) | Rất tốt | Cơ bản (Status) | Tốt | Rất tốt | Đối chiếu hóa đơn | Khá | Tốt | Rất chặt | Không có |
| **8. `Supplier Scorecard` & Trả hàng NCC** | Đầy đủ | Rất mạnh | Cơ bản (OTD) | Rất tốt (Tự động) | Tốt | Trả hàng NCC | Đánh giá thủ công | Tốt | Tốt | Trả hàng nhanh |

---

## 4. 12 Bài Học Kiến Trúc & Nghiệp Vụ Áp Dụng Cho `plugins/purchasing` (`L01`–`L12`)

| Mã | Bài học rút ra từ đối thủ | Định hướng áp dụng vào `plugins/purchasing` (Sprint 15) |
| :--- | :--- | :--- |
| `L01` | **Phục vụ Đa Hình thái: Hàng Qua Kho vs Dịch vụ `SES` (SAP / Coupa)** | Phân loại rõ dòng mua (`Item Type`): `STOCKABLE` (đồng bộ `Incoming` & `PURCHASE_IN` sang `plugins/inventory`) và `SERVICE_OR_EXPENSE` (nghiệm thu trực tiếp bằng **Service Entry Sheet `SES`** gắn `Cost Center/Project`, không bắt buộc qua Kho). |
| `L02` | **Phân cấp `AVL` + `MOQ` + Bảng giá Bậc số lượng cho Sản xuất & Thương mại (Bravo / NetSuite)** | Hồ sơ NCC không chỉ lưu tên/MST mà lưu **Approved Vendor List (`AVL`)**, trạng thái nhà cung cấp (`ACTIVE / WATCH / BLOCKED`), `Supplier SKU Code`, `MOQ`, `Lead-time` và bảng giá theo bậc số lượng (`Quantity Tiers`). |
| `L03` | **Gộp Đề nghị Mua (`PR Consolidation`) & Tự động Gợi ý từ Tồn `Min` (ERPNext / Odoo)** | Cho phép Buyer gom nhiều `PR` của các phòng ban/chi nhánh khác nhau (hoặc sinh từ cảnh báo dưới `Min` của `plugins/inventory`) vào cùng một `RFQ` hoặc `PO` để tối ưu sức mua và giảm chi phí vận chuyển. |
| `L04` | **Kiểm tra Ngân sách Sớm tại bước `PR / PO` (Coupa / ERPNext)** | Tích hợp thiết lập Ngân sách (`Department / Project Budget`) theo tháng/quý/năm; kiểm tra `Đã cam kết (Committed PO) + Thực chi + PR/PO mới <= Ngân sách` (Cảnh báo hoặc Chặn vượt ngân sách qua Workflow duyệt đặc biệt). |
| `L05` | **Ma trận So sánh Báo giá (`Bid Comparison`) & Giải trình Ngoại lệ (MISA / Bravo)** | Hỗ trợ Buyer nhập chào giá từ >= 2 NCC cho cùng 1 `RFQ`, tự động tô nổi giá tốt nhất / giao nhanh nhất và hỗ trợ **Tách chọn từng dòng cho nhiều NCC (`Split Award`)**; nếu chọn NCC không phải giá thấp nhất -> yêu cầu nhập lý do giải trình khi trình duyệt. |
| `L06` | **Hợp đồng Khung (`Blanket Order`) & Đơn gọi hàng (`Release PO`) (Odoo / SAP)** | Cho phép ký Hợp đồng khung chốt đơn giá & trần số lượng/giá trị theo kỳ (rất phổ biến ở nhà máy mua NVL và công ty dịch vụ thuê ngoài), sau đó lập nhanh các `Release PO` tự động trừ dần trần mà không cần lặp lại bước `RFQ`. |
| `L07` | **Quy trình `PO Change Order` giữ nguyên dấu vết thay đổi** | Một khi `PO` đã `CONFIRMED` gửi NCC, mọi chỉnh sửa tăng giá hoặc tăng số lượng vượt ngưỡng đều lưu lịch sử thay đổi và kích hoạt duyệt lại `workflow`, đồng thời gửi thông báo thay đổi sang `plugins/inventory` (`Incoming`). |
| `L08` | **Đối chiếu 3 Chiều (`3-Way Matching`) có Ngưỡng Sai Số (`Tolerance Limits`) (SAP / NetSuite)** | Khi kế toán ghi nhận `Vendor Bill`, hệ thống tự động đối khớp `PO <-> GR (từ inventory) hoặc SES <-> Bill`. Nếu chênh lệch SL hoặc Đơn giá vượt `Tolerance % / Amount`, tự động khóa ở trạng thái `BLOCKED_MISMATCH` chờ giải quyết. |
| `L09` | **Phân bổ Chi phí Mua hàng (`Landed Cost`) liên thông `inventory` (Odoo / MISA / Fast)** | Hỗ trợ nhập hóa đơn cước vận chuyển/hải quan/bốc xếp gắn với một hoặc nhiều phiếu nhập `GR` và chia theo *Giá trị / Số lượng / Trọng lượng*, gửi event/API điều chỉnh giá vốn sang `plugins/inventory`. |
| `L10` | **Chấm điểm Tự động `Supplier Scorecard` (ERPNext)** | Tự động thu thập dữ liệu khách quan: *Giao đúng hạn `OTD %`*, *Tỷ lệ đạt kiểm định QC `Accept %`*, *Chênh lệch giá*; cập nhật điểm NCC để cảnh báo khi chọn vào `RFQ/PO`. |
| `L11` | **Sổ Công nợ Phải trả (`AP Ledger`) & Giảm trừ Trả hàng (`Debit Note`) khép kín** | Chỉ ghi nhận Công nợ phải trả chính thức khi `3-Way Match` đạt chuẩn; khi trả hàng lỗi về NCC (`SUPPLIER_RETURN` hoàn tất tại Kho), tự sinh `Debit Note` cấn trừ đúng công nợ NCC. |
| `L12` | **Data View Mật độ Cao, Split-View Ma trận & Mobile Duyệt nhanh (`AGENTS.md` #33)** | Mọi bảng (`Suppliers`, `PR`, `RFQ`, `PO`, `Blanket`, `SES`, `Vendor Bills`, `AP Aging`) dùng Table `@shared/*` cố định Header/Footer, ẩn/hiện & đổi thứ tự cột, lọc đa điều kiện đồng bộ URL, **Context Menu chuột phải** đầy đủ tác vụ; Mobile Ionic tối giản tập trung Duyệt nhanh `PR/PO` & Nghiệm thu `SES` (`>= 40px`). |
