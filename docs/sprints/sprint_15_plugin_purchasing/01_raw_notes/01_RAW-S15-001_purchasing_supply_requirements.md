# Ghi Chú Yêu Cầu Thô (Raw Notes) — Sprint 15: Plugin Mua Hàng & Cung Ứng (`plugins/purchasing`)

| Thuộc tính | Giá trị |
| :--- | :--- |
| ID | RAW-S15-001 |
| Sprint | Sprint 15 (`sprint_15_plugin_purchasing`) |
| Tác giả | AI Business Analyst (BA) |
| Trạng thái | Draft / Chờ review |
| Phiên bản | 0.3 |
| Ngày tạo | 2026-11-15 |

---

## 1. Yêu Cầu Tổng Quan Từ Khách Hàng

> "tiếp tục là tài liệu cho sprint 15. là về plugin mua hàng hay cung ứng. hãy tìm hiểu các đối thử và phân tích theo các nghiệp vụ thực tế của các công ty sản xuất, hoặc các công ty thương mại dịch vụ"

Mục tiêu Sprint 15 là xây dựng **Plugin Quản Lý Mua Hàng & Cung Ứng (`plugins/purchasing`)** độc lập, chuẩn hóa chu trình **Procure-to-Pay (`P2P`)** cho cả doanh nghiệp **Sản xuất**, **Thương mại phân phối**, lẫn **Dịch vụ & Mua sắm nội bộ**, đồng thời kết nối lỏng (`PluginDataServiceGrpc` + Kafka) với **`plugins/inventory` (Sprint 13)** và **`plugins/crm` (Sprint 14)**.

---

## 2. Phân Tích Đặc Thù Thực Tế Theo 3 Loại Hình Doanh Nghiệp

Một plugin mua hàng thực tế tại Việt Nam không thể chỉ làm một form "Nhập mua 1 bước", bởi 3 loại hình doanh nghiệp có trọng tâm kiểm soát khác nhau hoàn toàn:

| Trục nghiệp vụ | Công ty Sản xuất (`Manufacturing`) | Công ty Thương mại / Phân phối (`Trading`) | Công ty Dịch vụ / Chi tiêu Nội bộ (`Services`) |
| :--- | :--- | :--- | :--- |
| **1. Thứ cần mua** | Nguyên vật liệu (`NVL`) sản xuất, Bao bì, Vật tư tiêu hao & Bảo trì máy (`MRO`). | Hàng hóa thương mại thành phẩm (`SKU`), Hàng khuyến mãi từ NCC. | Dịch vụ thuê ngoài (Bảo trì, Logistics, Quảng cáo, Tư vấn), Tài sản/Công cụ văn phòng. |
| **2. Nguồn phát sinh nhu cầu** | Định mức NVL thiếu cho lệnh sản xuất hoặc định mức tồn an toàn `Safety Stock`. | Cảnh báo hàng dưới `Min` từ Kho hoặc đơn đặt hàng lớn từ khách hàng (`Back-to-Back Order`). | Đề xuất mua sắm của Phòng ban (`Department PR`) hoặc Dự án/Hợp đồng dịch vụ. |
| **3. Nhà cung cấp & Hợp đồng** | Rất chặt: Chỉ mua từ **Danh mục NCC Đạt chuẩn (`AVL`)**, cần **Hợp đồng khung (`Blanket Order`)** chốt giá & sản lượng quý/năm, `MOQ`, `Lead-time`. | Linh hoạt: Gửi `RFQ` hỏi giá nhanh >= 3 NCC, săn giá bậc số lượng (`Tiered Pricing`), chiết khấu/thưởng doanh số (`Rebate`). | So sánh hồ sơ năng lực & báo giá gói dịch vụ; kiểm soát **Ngân sách phòng ban (`Budget Check`)** trước khi duyệt chi. |
| **4. Nghiệm thu / Nhận hàng** | Bắt buộc giao qua Kho + **Kiểm định QC đầu vào (`IQC`)**, trả ngay lô NVL không đạt chuẩn. | Giao nhận trực tiếp vào Kho (nhiều đợt `Partial Receipt`), cần chia **Chi phí vận chuyển/bốc xếp/nhập khẩu (`Landed Cost`)** vào giá vốn. | **Không đi qua Kho vật lý** -> Nghiệm thu bằng **Biên bản Nghiệm thu Dịch vụ / Khối lượng hoàn thành (`Service Entry Sheet — SES`)** nhiều đợt (% tiến độ). |
| **5. Kiểm soát thanh toán** | Thanh toán theo kỳ hạn `Net 30/60`, giữ lại tiền bảo hành/chất lượng nếu có, đối chiếu **3 Chiều (`PO <-> GR <-> Hóa đơn`)**. | Thanh toán theo hóa đơn thực nhập, đòi **Debit Note / Cấn trừ công nợ** khi trả hàng lỗi hoặc thiếu hụt. | Thanh toán theo **Đợt nghiệm thu (`SES Milestones`)** và tổng **Ngân sách được cấp** trong kỳ. |

---

## 3. Phân Rã 8 Nhóm Yêu Cầu Chức Năng Lõi (`plugins/purchasing`)

1. **Hồ Sơ Nhà Cung Cấp 360 (`Supplier Master`), `AVL`, Bảng Giá & Chấm Điểm (`Scorecard`)**:
   - Thông tin pháp nhân (`MST`, Tài khoản ngân hàng, Người liên hệ, Điều khoản thanh toán mặc định), Trạng thái (`ACTIVE`, `PROBATION_WATCH`, `BLACKLISTED`).
   - **Approved Vendor List (`AVL`)**: Đánh dấu cặp `(SKU, Supplier)` được phép mua, kèm `Supplier SKU Code`, `MOQ` (SL đặt tối thiểu), `Lead-time` dự kiến (ngày), và **Bảng giá NCC theo bậc số lượng (`Vendor Pricelist`)**.
   - **Supplier Scorecard**: Chấm điểm định kỳ dựa trên dữ liệu thực tế: *Tỷ lệ giao đúng hạn (`OTD %`)*, *Tỷ lệ hàng đạt QC (`Quality %`)*, *Mức độ cạnh tranh giá*.
2. **Đề Nghị Mua Hàng (`Purchase Requisition — PR`) & Kiểm Soát Ngân Sách (`Budget Check`)**:
   - Tạo tay bởi các phòng ban, tạo hàng loạt từ gợi ý **Tồn kho dưới `Min`** (`plugins/inventory`), hoặc tạo theo thiếu hụt từ **Đơn bán** (`plugins/crm`).
   - Cho phép gán **Loại mục chi (`Item Category`)**: *Hàng nhập kho (`STOCKABLE`)* vs *Dịch vụ / Tiêu dùng thẳng (`SERVICE / DIRECT_EXPENSE`)* kèm `Department / Cost Center`.
   - Kiểm tra **Ngân sách phòng ban (`Budget`)** theo tháng/quý (cảnh báo hoặc chặn vượt ngân sách) trước khi gửi duyệt qua `plugins/workflow`.
3. **Yêu Cầu Báo Giá (`RFQ`) & Ma Trận So Sánh Báo Giá (`Bid Comparison`)**:
   - Từ 1 hoặc nhiều `PR` đã duyệt (hỗ trợ **Gộp PR nhiều phòng ban** để lấy giá sỉ), Buyer phát hành **Yêu cầu Báo giá (`RFQ`)** tới nhiều NCC cùng lúc (tải file PDF/Excel hoặc gửi email/link).
   - Nhập chào giá từ các NCC -> Hệ thống dựng **Ma trận So sánh Báo giá (`Comparison Matrix`)** đặt cạnh nhau: *Đơn giá quy đổi `Base UoM`, Chiết khấu, Phí vận chuyển, VAT, Tổng thành tiền, Lead-time giao hàng, Điều khoản thanh toán, Điểm Scorecard NCC* -> Chốt NCC trúng thầu (cho phép tách chọn từng món cho nhiều NCC khác nhau — *Split Award*).
4. **Đơn Đặt Hàng Mua (`Purchase Order — PO`) & Hợp Đồng Khung (`Blanket Order`)**:
   - Hỗ trợ 2 loại chính:
     - **`Standard PO`**: Sinh từ `PR` / Báo giá trúng thầu hoặc lập trực tiếp (nếu vượt ngưỡng cho phép của Buyer -> duyệt `plugins/workflow`).
     - **`Blanket Purchase Agreement` (Hợp đồng nguyên tắc / Đơn hàng khung)**: Thỏa thuận giá + sản lượng trần hoặc ngân sách trần theo khoảng thời gian (`valid_from`..`valid_to`), rồi tạo các **Đơn gọi hàng lẻ (`Release PO`)** trừ dần hạn mức hợp đồng mà không cần hỏi giá/duyệt lại từ đầu.
   - Khi `PO` hàng hóa được xác nhận -> gửi sự kiện sang `plugins/inventory` tăng **`Incoming Qty`** và tạo lịch chờ nhập (`PURCHASE_IN`).
5. **Theo Dõi Giao Hàng, Kiểm Định Đầu Vào, Nghiệm Thu Dịch Vụ (`SES`) & `Landed Cost`**:
   - **Với Hàng hóa (`STOCKABLE`)**: Theo dõi `ordered_qty` vs `received_qty` vs `rejected_qty` đồng bộ real-time qua Kafka Event từ `plugins/inventory` (`PURCHASE_IN` + QC).
   - **Với Dịch vụ / Chi phí trực tiếp (`SERVICE`)**: Lập **Phiếu Nghiệm Thu Dịch Vụ (`Service Entry Sheet — SES`)** ghi nhận % hoặc khối lượng công việc đã hoàn tất, có chữ ký/duyệt của người phụ trách bộ phận yêu cầu.
   - **Phân bổ Chi phí Mua hàng (`Landed Cost`)**: Nhập hóa đơn phí vận chuyển, bảo hiểm, thuế nhập khẩu, hải quan -> chọn phương thức phân bổ (Theo *Giá trị hàng*, *Số lượng*, hoặc *Trọng lượng*) -> đẩy điều chỉnh giá vốn sang `plugins/inventory`.
6. **Đối Chiếu 3 Chiều (`3-Way Matching`), Hóa Đơn Đầu Vào & Sổ Công Nợ Phải Trả (`AP Ledger`)**:
   - Ghi nhận **Hóa đơn Mua hàng (`Vendor Bill`)** đối chiếu tự động **3 chiều (`PO <-> GR/SES <-> Vendor Bill`)**:
     - Kiểm tra `Billed Qty <= Received/Accepted Qty` (hoặc nằm trong ngưỡng sai số `Tolerance %` cho phép).
     - Kiểm tra `Billed Price == PO Price` (nằm trong sai số cấu hình). Nếu lệch vượt ngưỡng -> Gắn trạng thái **`MATCH_DISCREPANCY_BLOCKED`** không cho thanh toán cho tới khi Kế toán/Quản lý xử lý xong.
   - Ghi nhận vào **Sổ Công nợ Phải trả Bất biến (`Supplier Payable Ledger`)**, lập kế hoạch chi tiền & **Báo cáo Tuổi nợ Phải trả (`AP Aging`: Trong hạn, 1-30, 31-60, 61-90, >90 ngày)**.
7. **Trả Lại Hàng Mua & Đề Nghị Giảm Trừ Nợ (`Purchase Return & Debit Note`)**:
   - Khi hàng nhập không đạt QC hoặc phát hiện lỗi sau nhập -> Tạo Phiếu Trả lại NCC -> gửi yêu cầu xuất trả `SUPPLIER_RETURN` sang `plugins/inventory` -> sau khi Kho xuất trả xong, tự động sinh **Chứng từ Giảm trừ Công nợ (`Debit Note`)** trừ vào `Payable` của NCC đó.
8. **Phân Tích Chi Tiêu Mua Sắm & Cảnh Báo Chủ Động (`Spend Analytics & Alerts`)**:
   - Báo cáo Chi tiêu (`Spend by Department / Category / Supplier`), Lịch sử biến động giá mua theo thời gian (`Price Variance Trend`), Tỷ lệ giao trễ của NCC, cảnh báo `PO` quá hạn giao hàng và `Hợp đồng khung` sắp hết hạn/hết trần ngân sách.
9. **Ma Trận Phê Duyệt Đa Cấp (`DOA / SoD`) & Lưu Vết Kiểm Toán Bất Biến (`Immutable Audit Trail`)**:
   - Bất kỳ chứng từ/thao tác nhạy cảm nào trong Mua hàng (`Hồ sơ/Tài khoản ngân hàng NCC`, `AVL`, `PR`, `Chọn thầu RFQ`, `PO / Blanket / Change Order`, `Nghiệm thu SES`, `Variance Override 3-Way Match`, `Purchase Return / Debit Note`) phải qua **Ma trận Phê duyệt theo Hạn mức (`DOA`)** trên `plugins/workflow` và tuân thủ **Bất kiêm nhiệm (`Segregation of Duties — SoD`)** (cấm tự duyệt, cấm Buyer kiêm Nghiệm thu `SES`, bắt buộc 2 mắt `Maker-Checker` khi đổi STK ngân hàng NCC).
   - Lưu vết **4 tầng bất biến**: *(1) Lịch sử duyệt (`Approval History`)*, *(2) Diff Trước/Sau cấp trường (`Field-level Audit`)*, *(3) Đồ thị Truy vết Chuỗi chứng từ (`Document Lineage`: `PR -> RFQ -> PO -> GR/SES -> Bill -> Payment/Debit Note`)*, và *(4) Sổ cái Tài chính/Ngân sách bất biến (`Append-only Ledger`)*.
10. **Tùy Biến Biểu Mẫu Nhập Liệu Động Qua Form Builder (`plugins/form`) Theo Tenant & Chi Nhánh**:
   - Toàn bộ các màn hình nhập liệu hồ sơ & chứng từ (`Supplier Onboarding / KYC & AVL`, `PR`, `RFQ`, `PO / Blanket / Change Order`, `Nghiệm thu dịch vụ SES`, `Vendor Bill`, `Purchase Return`) phải dựng biểu mẫu thông qua **`plugins/form` (Sprint 08 — 32 loại trường, `GRID` bảng tính công thức RPN, `IMAGE_UPLOAD`, `SIGNATURE`)** để từng **Tenant** hoặc từng **Chi nhánh (`branch_id` thuộc `organization`)** tự tùy biến trường bổ sung, rule hiển thị (`Skip Logic`) và trường bắt buộc theo đặc thù ngành/chi nhánh mà không phải sửa mã nguồn.
   - Bảo vệ **Trường Lõi Hệ thống (`System Locked Core Fields`)** cho tính toán/sổ cái; dữ liệu mở rộng lưu vào `custom_fields_data` (`JSONB`) kèm **`form_version`** bất biến, liên thông làm biến điều kiện rẽ nhánh trên `plugins/workflow` và cột tùy chọn trên `@shared/*` Sticky Table.

---

## 4. Ràng Buộc Kỹ Thuật & UI/UX Kế Thừa Từ Bộ Quy Tắc Dự Án

| Nhóm ràng buộc | Yêu cầu bắt buộc từ `AGENTS.md` | Ảnh hưởng tới tài liệu Sprint 15 |
| :--- | :--- | :--- |
| **Multi-Tenant & Ranh giới Plugin** | Cô lập `tenant_id` triệt để; mọi Entity đăng ký Entity Registry; giao tiếp `inventory`, `crm`, `organization`, `catalog`, `employee`, `workflow`, `in-app-notification` 100% qua `PluginDataServiceGrpc` / Kafka (cấm gọi REST chéo, cấm `size = 100`). | Tách rạch ròi `PO/SES/3-Way Match/AP` (`purchasing`) khỏi `Stock Balance/Ledger/GR` (`inventory`). |
| **Data View & Sticky Scroll Table + Context Menu (`#33`)** | Mọi danh sách (`Suppliers`, `PR`, `RFQ`, `PO`, `Blanket Orders`, `SES`, `Vendor Bills`, `AP Ledger`) dùng Table `@shared/*` cố định Header/Footer, chỉ cuộn Content, ẩn/hiện & đổi thứ tự cột, chọn số hàng/trang, đồng bộ URL & **Context Menu chuột phải** đầy đủ tác vụ (fallback `>= 40px` trên Mobile). | Mô tả chi tiết trong `ANL-S15-001` & `AC-18` tại `CONF-S15-001`. |
| **Anti-Modal & Route-Driven State** | Tuyệt đối không dùng Modal tạo `PR/RFQ/PO/Bill`; dùng **Nested Routes** (Supplier 360), **Split-View** (Ma trận So sánh Báo giá & Đối chiếu 3 Chiều), và **Stacked Drawers** (`?drawer=...`). | Bảo toàn trạng thái lọc/tab/duyệt khi F5 hoặc chia sẻ link. |
| **Dual-Mode Desktop & Mobile Ionic** | Desktop (`>= 1280px`) mật độ cao phục vụ Buyer/Kế toán so sánh báo giá & 3-Way Match; Mobile Ionic (`390x844 px`) tối giản cho Quản lý duyệt nhanh `PR/PO`, Nhân viên tạo `PR` nhanh hoặc xác nhận nghiệm thu `SES` tại công trường/văn phòng (`>= 40px`). | Bảng phân tách rõ Desktop vs. Mobile. |
| **Zero-Emoji, 100% i18n & Test Thực Dụng** | Cấm emoji trên UI; 100% `vi.json`/`en.json`; Backend test JUnit 5 + RestAssured trên **PostgreSQL & Redis thật** (gồm concurrency check Ngân sách/Hạn mức Blanket Order & 3-Way Match); Frontend **0 file `.spec.ts`**. | Đưa vào `BR-P*` và `AC-20`. |
| **Dynamic Form Builder (`plugins/form` — Sprint 08)** | Toàn bộ form nhập liệu (`Supplier/AVL`, `PR`, `RFQ`, `PO`, `SES`, `Vendor Bill`, `Return`) kết xuất qua `plugins/form` (`32` loại trường, `GRID` Excel công thức, `SIGNATURE`) hỗ trợ kế thừa 3 tầng (`System -> Tenant -> Branch`) + `System Locked Core Fields` + lưu `JSONB` kèm `form_version`. | Cho phép từng Tenant/Chi nhánh thêm trường/section đặc thù không cần sửa code, đồng bộ cột bảng & điều kiện rẽ nhánh `workflow`. |
