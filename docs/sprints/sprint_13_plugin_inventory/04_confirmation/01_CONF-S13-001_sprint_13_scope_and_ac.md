# Tài Liệu Xác Nhận Phạm Vi & Tiêu Chí Nghiệm Thu — Sprint 13 (`plugins/inventory`)

| Thuộc tính | Giá trị |
| :--- | :--- |
| ID | CONF-S13-001 |
| Sprint | Sprint 13 (`sprint_13_plugin_inventory`) |
| Tác giả | AI Business Analyst (BA) |
| Trạng thái | ⏳ PENDING — Chờ Khách hàng review luồng nghiệp vụ & chốt `Q1`–`Q12` + `AC-01`..`AC-22` |
| Phiên bản | 0.5 |
| Tài liệu đầu vào | [00_READING_GUIDE.md](../00_READING_GUIDE.md) · [RAW-S13-001](../01_raw_notes/01_RAW-S13-001_inventory_requirements.md) · [BENCH-S13-001](../03_benchmarks/01_BENCH-S13-001_inventory_warehouse_benchmarks.md) · [ANL-S13-001](../02_analysis/01_ANL-S13-001_inventory_workflows.md) |

> [!IMPORTANT]
> Đây là cổng **Confirmation Gate (Bước 04)**. Bước 05 (`SOL-S13-*`), Bước 06 (`DES-S13-*`) và việc lập trình **chỉ được phép khởi động** sau khi Khách hàng phản hồi xác nhận 12 quyết định nghiệp vụ Kho (`Q1`–`Q12`) và chốt bộ tiêu chí `AC-01`–`AC-22`.

---

## 1. Bảng Câu Hỏi Chốt Quyết Định Nghiệp Vụ Kho (`Q1`–`Q12`)

| Mã | Chủ đề cần quyết định | Các phương án lựa chọn | Đề xuất của BA | Phản hồi Khách hàng |
| :--- | :--- | :--- | :--- | :--- |
| **`Q1`** | **Độ sâu Cấu trúc Vị trí Kho (`Bin Tracking`)** | **(A)** Bắt buộc mọi kho chia tới từng Ô/Kệ (`Bin`).<br>**(B)** Cấu hình **theo từng Kho**: Kho lớn/tổng bật cây `Zone -> Rack -> Bin`; Kho nhỏ/chi nhánh dùng `DEFAULT_BIN` tự động để nhập/xuất nhanh 1 bước. | **Phương án B** (Cân bằng giữa sự đơn giản cho chi nhánh nhỏ và chuẩn WMS cho kho tổng). | ⏳ Chờ chốt |
| **`Q2`** | **Chính sách Truy xuất (`Lot/Date` & `Serial/IMEI`)** | **(A)** Hỗ trợ đủ cả 3 chế độ ở Sprint 13: `NONE` (Số lượng), `LOT_EXPIRY` (Lô + HSD, gợi ý FEFO), và `SERIAL` (Serial/IMEI từng chiếc).<br>**(B)** Chỉ làm `NONE` + `LOT_EXPIRY`, dời `SERIAL` sang Sprint sau. | **Phương án A** (Hỗ trợ đủ 3 chế độ vì đây là năng lực nền tảng khó sửa lại schema về sau). | ⏳ Chờ chốt |
| **`Q3`** | **Mức độ Giữ Hàng (`Reservation`) cho hàng có Lô** | **(A)** Giữ ở mức `(Warehouse, SKU)` để Thủ kho linh hoạt nhặt Lô theo gợi ý `FEFO` lúc xuất.<br>**(B)** Khóa cứng đích danh Lô ngay từ thời điểm tạo lệnh giữ hàng. | **Phương án A làm mặc định**, kèm tùy chọn chỉ định Lô đích danh khi có yêu cầu đặc biệt. | ⏳ Chờ chốt |
| **`Q4`** | **Kiểm soát Âm Kho (`Negative Stock`)** | **(A)** Chặn cứng tuyệt đối không cho xuất âm (`STRICT_BLOCK`).<br>**(B)** Chặn mặc định, cho phép cấu hình bật "Xuất âm tạm thời có cảnh báo" theo từng Kho (trừ hàng `SERIAL` luôn chặn). | **Phương án B** (Mặc định `STRICT_BLOCK` an toàn dữ liệu; mở cấu hình theo Kho khi cần giao hàng trước khi hoàn tất chứng từ nhập). | ⏳ Chờ chốt |
| **`Q5`** | **Phương pháp Tính Giá Vốn Xuất Kho** | **(A)** Triển khai **Bình quân gia quyền tức thời (`AVCO`)** ở Sprint 13, giữ cột `unit_cost` trên Lô để mở rộng `FIFO` sau.<br>**(B)** Triển khai đồng thời cả `AVCO`, `FIFO` và `Đích danh` ngay trong Sprint 13. | **Phương án A** (Tối ưu độ phức tạp giải thuật tính lại giá vốn, đáp ứng 90% doanh nghiệp thương mại/kho vận). | ⏳ Chờ chốt |
| **`Q6`** | **Kiểm định `QC` & Nhập thiếu `Backorder`** | **(A)** Bật tùy chọn `require_qc` theo Kho/Nhóm hàng để tách khu `QUARANTINE`, và hỗ trợ Nhập thiếu tự sinh `Backorder Receipt`.<br>**(B)** Nhập thẳng vào Kho chính 1 bước, không làm QC và Backorder. | **Phương án A** (Tùy chọn không làm chậm luồng đơn giản nhưng có sẵn cho hàng cần kiểm định/giao nhiều đợt). | ⏳ Chờ chốt |
| **`Q7`** | **Điều chuyển Liên kho 2 bước (`In-Transit`)** | **(A)** Bắt buộc luồng 2 bước (`Kho đi xuất -> Đang đi đường In-Transit -> Kho đến kiểm đếm nhận/báo thiếu`).<br>**(B)** Chuyển 1 bước trừ kho đi cộng thẳng kho đến. | **Phương án A** cho chuyển khác Kho; **1 bước** cho chuyển nội bộ cùng Kho (`Bin-to-Bin`). | ⏳ Chờ chốt |
| **`Q8`** | **Kiểm kê Mù (`Blind Count`) & Workflow Duyệt** | Hỗ trợ tùy chọn ẩn số tồn hệ thống khi kiểm kê ngoài hiện trường và dùng `plugins/workflow` (Sprint 08) để duyệt các phiếu nhạy cảm (Xuất hủy, Kiểm kê vượt ngưỡng, Đề nghị xuất nội bộ)? | **Có**, tích hợp trực tiếp `plugins/workflow` và `plugins/in-app-notification`. | ⏳ Chờ chốt |
| **`Q9`** | **Phân quyền Xem Giá vốn & Khóa Kỳ Kho** | Ẩn cột Giá vốn/Thành tiền với vai trò Thủ kho chỉ xem số lượng (`INVENTORY_VIEW_COST`), đồng thời có tính năng Khóa kỳ theo tháng (`Period Closing`)? | **Có**, tuân thủ phân tách vai trò Kế toán kho vs Thủ kho (`L02`, `L08`). | ⏳ Chờ chốt |
| **`Q10`** | **Phạm vi Mobile Ionic Thủ Kho Thực Địa** | Mobile tập trung tối giản vào 4 thao tác ngoài kho: Tra cứu tồn bằng quét mã, Kiểm đếm Nhập, Soạn hàng Xuất & Xác nhận Nhận chuyển kho, Đếm Kiểm kê (hỗ trợ Camera + Máy quét Bluetooth HID)? | **Có**, giữ Mobile gọn nhẹ, nút bấm `>= 40px` đúng chuẩn Ionic 8. | ⏳ Chờ chốt |
| **`Q11`** | **Ma Trận Phê Duyệt Kho (`DOA / SoD`) & Lưu Vết 4 Tầng Bất Biến** | Áp dụng bắt buộc cơ chế **Bất kiêm nhiệm (`SoD`)** qua `plugins/workflow` (chặn tự duyệt `OPENING_BALANCE`, `DISPOSAL_OUT`, chênh lệch Kiểm kê vượt ngưỡng, Đảo chứng từ `POSTED`; `Maker-Checker` 2 mắt khi bật `ALLOW_NEGATIVE` hoặc Mở khóa kỳ) kết hợp Lưu vết 4 tầng (`Approval History`, `Field Before/After Diff`, `Ledger Lineage`, `Immutable Stock Ledger`) + Drawer `Audit & Lineage`? | **Có**, bắt buộc để chống thất thoát/chỉnh tồn kho trái phép và đáp ứng kiểm toán tài sản. | ⏳ Chờ chốt |
| **`Q12`** | **Tùy Biến Biểu Mẫu Kho Qua `plugins/form` Theo Tenant, Chi Nhánh & Kho** | Toàn bộ form nhập liệu Kho (`Warehouse/Bin`, `SKU`, `Phiếu Nhập & QC`, `Xuất/Giữ hàng`, `Chuyển kho`, `Kiểm kê`) dựng qua **`plugins/form` (Sprint 08 — 32 loại trường, `GRID` Excel công thức RPN, `IMAGE_UPLOAD`, `SIGNATURE`)** theo kế thừa đa tầng (`System -> Tenant -> Branch/Warehouse`), giữ `System Locked Core Fields` và lưu `custom_fields_data` (`JSONB`) + `form_version`? | **Có**, đáp ứng đa dạng ngành nghề (Lạnh/Dược/Bán lẻ/Sản xuất) theo từng chi nhánh/kho mà không làm sai lệch `Stock Ledger`. | ⏳ Chờ chốt |

---

## 2. Phạm Vi Đề Xuất (Proposed Scope — Thuần `plugins/inventory`)

### 2.1. Trong Phạm Vi Sprint 13 (In-Scope)
1. **Master Data & Cấu hình Kho**:
   - Đa Kho theo Chi nhánh (`organization`), Kho Vật lý vs Kho Cách ly `QC` vs Kho trung gian `VIRTUAL_TRANSIT`.
   - Cây vị trí `Zone -> Rack -> Bin` (bật/tắt theo từng kho), khóa tạm Bin.
   - Danh mục Hàng hóa (`SKU`, `Barcode`, nhóm hàng `catalog`), `Multi-UoM` quy đổi về `Base UoM`, định mức `Min/Max/Safety Stock`, chính sách truy xuất (`NONE`, `LOT_EXPIRY`, `SERIAL`).
   - Cấu hình chính sách Kho theo Tenant (Chặn âm kho, Tiền tố mã phiếu `PN/PX/PC/KK`, Luồng duyệt `Workflow`).
2. **Sổ cái, Giữ hàng Độc lập & Quản trị Tồn kho**:
   - Bảng `Stock Ledger Entry` bất biến + `Stock Balance Snapshot` 5 chỉ số (`On-Hand`, `Reserved`, `Available`, `In-Transit`, `Incoming`).
   - Lệnh Giữ hàng tổng quát (`StockReservation`) với khóa tham chiếu đa hình (`reference_type`, `reference_code`, `reference_id`) + khóa đồng thời PostgreSQL `FOR UPDATE` + Redis Lock chống xuất trùng (`Race condition`).
   - Tính giá vốn `AVCO`, phân quyền ẩn/hiện Giá vốn, Hủy/Đảo chứng từ (`Reversal`), Khóa kỳ kho (`Period Lock`).
3. **Vận hành Xuất - Nhập - Chuyển - Kiểm Kê**:
   - **Nhập kho**: Nhập mua NCC (`PURCHASE_IN`), Hàng trả lại (`RETURN_IN`), Nhập đầu kỳ (`OPENING_BALANCE`), Nhập khác (`OTHER_IN`); hỗ trợ Khu kiểm định `QC` và Nhập một phần sinh `Backorder`.
   - **Xuất kho**: Gợi ý xuất **FEFO / FIFO / Đích danh Serial**; Xuất giao hàng (`DELIVERY_OUT`), Xuất nội bộ (`INTERNAL_ISSUE` gắn `employee_id`), Xuất trả NCC (`SUPPLIER_RETURN`), Xuất hủy (`DISPOSAL_OUT`), Xuất khác (`OTHER_OUT`).
   - **Điều chuyển**: Chuyển `Bin-to-Bin` 1 bước cùng kho; Chuyển Liên kho 2 bước có trạng thái `In-Transit` và xử lý chênh lệch thiếu/hỏng trên đường.
   - **Kiểm kê**: Kiểm kê toàn kho hoặc Cuốn chiếu (`Cycle Count`), tùy chọn Kiểm kê mù (`Blind Count`), cộng dồn nhiều lần quét, tự sinh phiếu bù trừ Thừa/Thiếu (`STOCKTAKE_GAIN` / `STOCKTAKE_LOSS`) sau khi duyệt.
4. **Báo cáo, Cảnh báo & Trải nghiệm Giao diện Chuẩn ERP**:
   - **Thẻ kho (`Stock Card`)**, Báo cáo **Xuất - Nhập - Tồn (`XNT`)**, Báo cáo **Tuổi tồn kho (`Aging`)**, xuất Excel/CSV theo bộ lọc hiện hành.
   - Cảnh báo chủ động qua `in-app-notification` (Tồn dưới `Min`, Lô cận hạn `FEFO`, Phiếu chuyển `In-Transit` quá hạn).
   - Toàn bộ bảng dữ liệu dùng `@shared/*` Data Table đạt chuẩn **Cố định Header & Footer, chỉ cuộn Content**, tùy biến ẩn/hiện/đổi thứ tự cột, số hàng/trang, đồng bộ URL Query Params và **Context Menu chuột phải đầy đủ thao tác** (cùng nút `>= 40px` trên Mobile Ionic).
5. **Kiểm Soát Phê Duyệt (`DOA / SoD`) & Lưu Vết Kiểm Toán 4 Tầng**:
   - Kiểm soát `SoD` trên `plugins/workflow` (chặn tự duyệt xuất hủy/điều chỉnh/kiểm kê vượt ngưỡng, `Maker-Checker` khi bật xuất âm kho hoặc mở khóa kỳ).
   - Lưu vết 4 tầng bất biến (`Approval History`, `Before/After Diff` chính sách Kho/SKU/Lô QC, `Inventory Lineage`, `Append-only Stock Ledger`) và hiển thị trực quan qua Stacked Drawer `Audit & Lineage` (`?drawer=audit`).
6. **Tùy Biến Biểu Mẫu Kho Động Theo Tenant, Chi Nhánh & Kho (`plugins/form` — Sprint 08)**:
   - Kết xuất biểu mẫu `Warehouse/SKU`, `Phiếu Nhập/QC`, `Xuất/Giữ hàng`, `Chuyển kho`, `Kiểm kê` qua `plugins/form` (`32` loại trường, `GRID`, `IMAGE_UPLOAD`, `SIGNATURE`), kế thừa 3 tầng (`System -> Tenant -> Branch/Warehouse`), khóa `System Locked Core Fields`, lưu `custom_fields_data` (`JSONB`) + `form_version`, dùng làm biến điều kiện `workflow` & cột lọc Sticky Table.

### 2.2. Ngoài Phạm Vi Sprint 13 (Out-of-Scope — Tách sang Plugin / Sprint khác)
- Phân hệ **Mua hàng (`Purchasing`)** & **Bán hàng / Chăm sóc khách hàng** hoàn chỉnh (Lead, Cơ hội, Đơn bán, Công nợ NCC/Khách hàng, Bảng giá chiết khấu).
- **Sản xuất / Lắp ráp nhiều cấp (`MRP / Multi-level BOM`)** và tính giá thành công đoạn.
- **Đồng bộ Sàn TMĐT (Shopee, TikTok Shop, Lazada)** & Webhook **Đơn vị vận chuyển 3PL (GHN, GHTK, ViettelPost)**.
- Tự động hạch toán **Bút toán Sổ cái Kế toán Tài chính (GL Journal Nợ/Có)** và Hóa đơn điện tử.

---

## 3. Bộ 22 Tiêu Chí Nghiệm Thu (`AC-01` – `AC-22`)

| Mã AC | Nhóm | Mô tả tiêu chí nghiệm thu cụ thể & đo lường được |
| :--- | :--- | :--- |
| **`AC-01`** | Multi-Tenant & Scope | Mọi truy vấn/thao tác Kho, SKU, Tồn kho, Sổ cái chỉ đọc/ghi dữ liệu đúng `tenant_id` từ JWT; Thủ kho bị giới hạn theo danh sách `warehouse_ids` được cấp và thực hiện thành công 0 trường hợp rò rỉ chéo tenant/kho. |
| **`AC-02`** | Độc lập & Entity Registry | Plugin `inventory` hoạt động độc lập hoàn toàn; 100% Entity mới đăng ký đầy đủ trong [docs/system/entity_registry/README.md](../../../system/entity_registry/README.md) và tích hợp `organization`, `catalog`, `employee`, `workflow` qua gRPC/Kafka (không gọi REST chéo, không fix cứng `size=100`). |
| **`AC-03`** | Topology & Master SKU | Tạo/cập nhật được Kho (Vật lý/QC), cây `Zone -> Rack -> Bin` (hỗ trợ tắt Bin theo kho), SKU với tối thiểu 2 cấp `UoM` quy đổi chính xác về `Base UoM`, và hỗ trợ đủ 3 chế độ `NONE` / `LOT_EXPIRY` / `SERIAL` (tùy kết quả chốt `Q2`). |
| **`AC-04`** | 5 Chỉ Số & Sổ cái | Bảng tồn kho hiển thị đúng 5 chỉ số (`On-Hand`, `Reserved`, `Available = On-Hand - Reserved`, `In-Transit`, `Incoming`) khớp 100% với tổng biến động trên `Stock Ledger Entry`; mọi giao dịch ghi nhận theo `Base UoM` không sai lệch làm tròn. |
| **`AC-05`** | Nhập kho + QC + Backorder | Lập và ghi sổ Phiếu Nhập cho đủ nguồn (NCC, Hàng trả lại, Đầu kỳ, Khác). Khi bật QC, hàng nhập nằm ở `QUARANTINE` (`Available = 0`) cho tới khi chốt `Pass`; khi giao thiếu, hệ thống ghi sổ số thực nhận và sinh đúng `Backorder Receipt` cho phần còn lại. |
| **`AC-06`** | Giữ hàng & Concurrency | Khi `Available = 1` và gửi **>= 10 request giữ hàng đồng thời** cùng lúc trên PostgreSQL & Redis thật, chỉ đúng **1 request thành công** (`Reserved = 1, Available = 0`), toàn bộ request còn lại trả lỗi chuẩn `ERR_INSUFFICIENT_AVAILABLE_STOCK`, không âm kho. |
| **`AC-07`** | Tự động Giải phóng Giữ hàng | Hủy hoặc giảm số lượng lệnh giữ hàng tự động trả lại `Available` tương ứng; lệnh giữ tạm quá hạn (`hold_expires_at`) tự động giải phóng qua cơ chế nền. |
| **`AC-08`** | Xuất kho FEFO / FIFO / Serial | Hàng `LOT_EXPIRY` gợi ý xuất tự động đúng Lô có `expiry_date` gần nhất còn hạn (bỏ qua Lô hết hạn/đang khóa); hàng `SERIAL` kiểm tra đúng trạng thái `IN_STOCK` tại kho xuất và chặn xuất trùng Serial đang ở nơi khác. |
| **`AC-09`** | Kiểm soát Âm kho | Khi bật `STRICT_BLOCK`, mọi nỗ lực ghi sổ xuất vượt `On-Hand` hoặc lấy phần đang bị giữ bởi lệnh khác bị từ chối với mã lỗi `UPPER_SNAKE_CASE` chuẩn `api_standards.md`. |
| **`AC-10`** | Chuyển kho 1 & 2 Bước | Chuyển `Bin-to-Bin` cùng kho cập nhật tức thì; Chuyển khác kho thực hiện 2 bước (`Bước 1` giảm `On-Hand` kho gửi và tăng đúng bằng `In-Transit` kho nhận; `Bước 2` nhận đủ đưa về `On-Hand` kho đích, nhận thiếu tạo `DISCREPANCY` làm sạch `In-Transit = 0`). |
| **`AC-11`** | Kiểm kê & Kiểm kê mù | Đợt kiểm kê chụp đúng `Snapshot Qty`; khi bật `Blind Count = true`, payload API trả về cho nhân viên đi đếm không chứa `system_qty` hay `variance`; sau khi duyệt, hệ thống tự sinh chứng từ `STOCKTAKE_GAIN` / `STOCKTAKE_LOSS` cân bằng đúng 100%. |
| **`AC-12`** | Bất biến & Đảo phiếu | Chứng từ `POSTED` không thể sửa/xóa; thao tác `Reverse` tạo chứng từ đảo ngược dấu, khôi phục số tồn và chặn đảo nếu hàng nhập đã bị xuất dùng dẫn đến âm tồn lịch sử. |
| **`AC-13`** | Khóa kỳ (`Period Lock`) | Sau khi đóng kỳ đến ngày `T`, mọi thao tác ghi sổ hoặc đảo phiếu có `posting_at <= T` đều bị chặn tại Backend với mã lỗi rõ ràng (`ERR_PERIOD_CLOSED`). |
| **`AC-14`** | Giá vốn & Bảo mật Chi phí | Tính chính xác giá vốn bình quân gia quyền tức thời (`AVCO`) sau mỗi lần nhập/xuất; tài khoản không có quyền `INVENTORY_VIEW_COST` không nhận được dữ liệu `unit_cost` và `stock_value` từ API lẫn UI. |
| **`AC-15`** | Thẻ Kho & Báo Cáo `XNT` | Xem Thẻ kho theo SKU/Kho/Lô đối chiếu khớp từng dòng số tồn trước -> biến động -> tồn sau; Báo cáo `XNT` khớp công thức `Đầu kỳ + Nhập - Xuất = Cuối kỳ` và xuất được file dữ liệu theo đúng bộ lọc. |
| **`AC-16`** | Cảnh báo `in-app-notification` | Kích hoạt đúng thông báo khi `Available <= min_stock`, Lô cận hạn trong ngưỡng cấu hình, và Phiếu chuyển kho `In-Transit` vượt ngưỡng thời gian chờ nhận. |
| **`AC-17`** | Tích hợp Workflow & API Contract | Duyệt phiếu qua `plugins/workflow` hoạt động đúng; 100% API Backend tuân thủ 4 khuôn mẫu `api_standards.md`, trả `code` `UPPER_SNAKE_CASE`, dùng DTO `record` và `ResponseKey` (cấm `Map<String, Object>`). |
| **`AC-18`** | Data View, Sticky Table & Context Menu | Tất cả màn hình dữ liệu Kho sử dụng Table `@shared/*` cố định Header & Footer (chỉ cuộn nội dung), hỗ trợ lọc, sắp xếp, ẩn/hiện cột, đổi thứ tự cột, đổi số hàng/trang, đồng bộ URL Query Params và **Context Menu chuột phải** đầy đủ thao tác (có nút fallback `>= 40px` trên Mobile). |
| **`AC-19`** | Anti-Modal, Route-State, i18n & Zero-Emoji | Không lạm dụng Modal popup; toàn bộ phiếu/chi tiết/Thẻ kho dùng Nested Routes hoặc Stacked Drawers (`?drawer=...`), 100% nhãn/tooltip/context-menu qua i18n `vi.json`/`en.json`, **0 emoji Unicode**, **0 file `.spec.ts`**. |
| **`AC-20`** | Kiểm thử Thực dụng & Dual-Mode QA | Backend vượt qua toàn bộ Integration Test JUnit 5 + RestAssured trên **PostgreSQL & Redis thật** (bao gồm test concurrency); QA chạy Dual-Mode Browser Testing (Desktop `>= 1280px` & Mobile Ionic `390x844 px`, `overflow = 0`, `touch >= 40px`, **0 `console.error`**) kèm ảnh chụp nghiệm thu. |
| **`AC-21`** | Phê duyệt `SoD` & Lưu vết Kho 4 Tầng | Hệ thống chặn thao tác tự duyệt `DISPOSAL_OUT` / `OPENING_BALANCE` / Kiểm kê lệch lớn và bật `ALLOW_NEGATIVE` / Mở khóa kỳ một mắt với `403 SOD_VIOLATION`; mọi thay đổi chính sách Kho/SKU, Timeline `Workflow` và `Lineage` bất biến dưới DB và hiển thị trong Drawer `Audit & Lineage`. |
| **`AC-22`** | Tích hợp Dynamic Form Builder (`plugins/form`) | Phân giải biểu mẫu đa tầng (`Branch/Warehouse Override -> Tenant Override -> System Default`) hoạt động đúng trên các form Kho; `System Locked Core Fields` (`sku_id`, `qty`, `uom_id`...) bị khóa xóa/đổi kiểu; chứng từ cũ mở đúng `form_version` từ `JSONB`; trường động kết nối điều kiện `workflow` và cột lọc Sticky Table. |

---

## 4. Ma Trận Giao Diện & Kiểm Chứng Dual-Mode (Desktop vs. Mobile)

| Màn hình / Luồng chính | Desktop Web (`>= 1280px`) | Mobile Ionic (`390x844 px`) | Trạng thái đồng bộ URL (`Route-Driven`) |
| :--- | :---: | :---: | :--- |
| Quản lý Kho, Bin & Danh mục SKU | Đầy đủ (Sticky Table + Drawer) | Chỉ Tra cứu & Quét mã xem nhanh | `?tab=...&warehouseId=...&drawer=...` |
| Bảng Tồn Kho 5 Chỉ Số / Lô / Serial | Đầy đủ (Đổi thứ tự/ẩn cột + Context Menu) | Danh sách thẻ gọn + Action Sheet `>= 40px` | `?warehouseId=...&view=by-lot&sort=...` |
| Nhập Kho, QC & Backorder | Đầy đủ (Split-View lập phiếu) | Thực thi quét Barcode/Lot/Serial xác nhận nhập | `?status=...&drawer=receipt&id=...` |
| Giữ Hàng & Xuất Kho (`FEFO/FIFO/Serial`) | Đầy đủ + Quản lý Lệnh giữ hàng | Xem danh sách Picking + Quét xuất kho | `?type=...&status=...&drawer=issue&id=...` |
| Chuyển Kho (1 Bước & 2 Bước `In-Transit`) | Đầy đủ | Xác nhận xuất chuyển & Quét nhận hàng đến | `?direction=incoming&status=IN_TRANSIT` |
| Kiểm Kê (`Cycle Count` / `Blind Count`) | Lập đợt, Phân công, Duyệt cân bằng | Quét Barcode đếm mù & Chốt số thực tế | `?stocktakeId=...&blind=true` |
| Thẻ Kho, Báo Cáo `XNT`, Khóa Kỳ | Đầy đủ + Export | Lịch sử giao dịch gần nhất của SKU | `?from=...&to=...&warehouseId=...&skuId=...` |
| Phê duyệt (`DOA/SoD`) & Drawer `Audit & Lineage` | Đầy đủ (Timeline + Diff Trước/Sau + Lineage) | Duyệt qua `Workflow` & Xem lịch sử duyệt gần nhất | `?drawer=audit&auditTab=approval|diff|lineage` |
| Tùy biến Biểu mẫu Kho (`plugins/form` Tenant/Chi nhánh/Kho) | Thiết kế & Publish Form Studio + Render Form động | Điền Form động đã Publish khi Nhập/QC/Xuất/Kiểm kê (`>= 40px`) | `?entity=...&branchId=...&warehouseId=...&formVersion=...` |
