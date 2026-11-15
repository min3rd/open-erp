# Phân Tích Đối Thủ & Benchmark Nghiệp Vụ — Plugin Quản Lý Kho, Xuất/Nhập Kho & Tồn Kho (Sprint 13)

| Thuộc tính | Giá trị |
| :--- | :--- |
| ID | BENCH-S13-001 |
| Sprint | Sprint 13 (`sprint_13_plugin_inventory`) |
| Tác giả | AI Business Analyst (BA) |
| Trạng thái | Draft / Chờ review |
| Phiên bản | 0.3 |
| Tài liệu liên quan | [00_READING_GUIDE.md](../00_READING_GUIDE.md) · [RAW-S13-001](../01_raw_notes/01_RAW-S13-001_inventory_requirements.md) · [ANL-S13-001](../02_analysis/01_ANL-S13-001_inventory_workflows.md) |

---

## 1. Mục Tiêu Đối Sánh (Benchmarking Scope)

Tài liệu đối sánh cách **10 hệ thống Quản lý Kho & Tồn kho (WMS / IMS / ERP Stock Modules)** tiêu biểu (5 sản phẩm Quốc tế + 5 sản phẩm phổ biến tại Việt Nam) xử lý thuần bài toán Kho hàng:
1. Cấu trúc Kho & Vị trí lưu trữ (`Multi-Warehouse & Location Tree`).
2. Mô hình dữ liệu Tồn kho & Cơ chế Giữ hàng (`On-Hand`, `Reserved`, `Available`, `In-Transit`, `Incoming`).
3. Luồng Nhập kho (`Inbound`), Kiểm nhận (`QC`), Nhập thiếu (`Backorder`) & Xuất kho (`Outbound / Picking`).
4. Điều chuyển kho nội bộ (`1-Step` vs. `2-Step In-Transit`) & Kiểm kê cân bằng (`Cycle Count / Stocktake`).
5. Truy xuất nguồn gốc (`Multi-UoM`, `Lot/FEFO`, `Serial/IMEI`), Sổ cái bất biến (`Stock Ledger`), Định giá (`Costing`) & Khóa kỳ.
6. Liên kết lỏng (`Decoupled Interface`) với các phân hệ bên ngoài (Mua hàng / Bán hàng / Nội bộ) và Trải nghiệm Bảng dữ liệu / Mobile Thủ kho.

---

## 2. Hồ Sơ Chi Tiết 10 Đối Thủ

### A. Nhóm Hệ Thống Quốc Tế (WMS / Enterprise & Open-Source Inventory)

#### 2.1. Odoo Inventory
- **Mô hình cốt lõi — Kế toán Kép Tồn kho (Double-Entry Inventory)**: Mọi dịch chuyển hàng hóa đều là bản ghi `stock.move` đi từ `Location Nguồn` sang `Location Đích` (trong đó Nhà cung cấp, Đầu ra tiêu thụ/khách nhận, Kiểm kê, Hư hỏng đều được mô hình hóa là *Virtual Locations*), gom nhóm trên chứng từ `stock.picking` (`Receipts`, `Delivery Orders`, `Internal Transfers`).
- **Tồn kho & Giữ hàng**: Bảng `stock.quant` lưu số lượng thực tại từng `(Product, Location, Lot/Serial, Package)` tách biệt `quantity` (`On-Hand`) và `reserved_quantity` (`Reserved`). Hỗ trợ giữ hàng tự động theo ưu tiên phiếu xuất hoặc giữ thủ công theo lệnh xuất.
- **Chiến lược xuất & cất hàng**: Cấu hình Removal Strategy theo FIFO, LIFO, FEFO hoặc Closest Location; hỗ trợ *Putaway Rules* gợi ý ô kệ khi hàng vào.
- **Định giá & Sổ cái**: Tách lớp `stock.valuation.layer` (hỗ trợ Standard, FIFO, AVCO — Bình quân gia quyền tức thời) độc lập với chuyển động vật lý.
- **Bài học cho `plugins/inventory`**: Cực kỳ chuẩn xác về toán học và truy vết thất thoát; tuy nhiên khái niệm Virtual Location gây khó hiểu cho Thủ kho VN nếu không bọc lại bằng loại phiếu quen thuộc (Phiếu Nhập / Phiếu Xuất / Phiếu Chuyển / Kiểm Kê).

#### 2.2. ERPNext / Frappe Stock
- **Mô hình cốt lõi — Sổ cái Tồn kho Bất biến + Bin Snapshot**:
  - `Stock Ledger Entry (SLE)`: Bảng sổ cái append-only ghi nhận tuần tự theo `posting_date + posting_time` mọi thay đổi số lượng & giá trị (`actual_qty`, `qty_after_transaction`, `valuation_rate`, `stock_value`).
  - `Bin`: Bảng ảnh chụp tức thời cho mỗi cặp `(Item, Warehouse)` giữ 4 chỉ số cốt lõi: `Actual Qty` (Thực tế), `Reserved Qty` (Đang giữ cho chứng từ xuất), `Ordered Qty` (Đang chờ nhập), và công thức:
    `Projected Qty = Actual Qty + Ordered Qty - Reserved Qty`
- **Nghiệp vụ & Hủy sổ**: Phân tách rõ *Stock Entry* (nhập/xuất/chuyển kho nội bộ/vật tư), *Purchase Receipt*, *Delivery Note*, và *Stock Reconciliation* (kiểm kê đối chiếu số lượng + giá trị).
- **Quản lý Lô / Serial**: Từ v15 chuẩn hóa qua `Serial and Batch Bundle` giúp xuất một lần hàng trăm Serial/Lô gọn nhẹ trên chứng từ.
- **Bài học cho `plugins/inventory`**: Tách `Stock Ledger Entry` (Audit log bất biến) và `Bin` (Query tốc độ cao) là thiết kế lý tưởng cho PostgreSQL trên Open-ERP. Đồng thời giới hạn Khóa kỳ (`Period Closing`) để kiểm soát backdate.

#### 2.3. SAP S/4HANA EWM & Oracle NetSuite WMS
- **Phân cấp Vị trí vật lý nghiêm ngặt**: `Warehouse -> Storage Type (Khu lạnh, Khu hàng nặng, Khu picking) -> Storage Section -> Storage Bin`. Mỗi Bin có trạng thái khóa (`Putaway Block`, `Stock Removal Block`) phục vụ kiểm kê cuốn chiếu mà không dừng cả kho.
- **Nguyên tắc Chứng từ & Đảo bút toán (Document Principle & Movement Types)**: Mọi thao tác kho gắn mã Loại dịch chuyển (VD: `101` Nhập mua, `102` Đảo nhập mua, `201` Xuất nội bộ, `303/305` Chuyển kho 2 bước *Remove from Storage -> Place in Storage*). Tuyệt đối cấm xóa chứng từ đã ghi sổ; sai phải tạo chứng từ đảo (`Reversal Document`) tham chiếu chứng từ gốc.
- **Kiểm đếm mù (Blind Cycle Count) & Wave Picking**: Nhân viên kiểm kê không thấy số tồn sổ sách trên thiết bị di động để đảm bảo đếm thật; gom nhiều phiếu xuất cùng khu kệ thành 1 lượt lấy hàng.

#### 2.4. Zoho Inventory
- **Quản lý Kho độc lập + Tham chiếu Đơn hàng mở (`Reference Linking`)**: Theo dõi chuẩn vòng đời tồn kho từ Mua hàng -> Nhận hàng (`Purchase Receives`) -> Giữ hàng (`Committed Stock`) -> Đóng gói (`Packages`) -> Giao hàng (`Shipments`) -> Trả hàng (`Sales/Vendor Returns`), không phụ thuộc bắt buộc vào module bán hàng cụ thể nhờ tham chiếu chứng từ.
- **Tách bạch Điều chỉnh Số lượng vs Giá trị**: Module `Inventory Adjustments` chia làm 2 chế độ riêng biệt: *Quantity Adjustment* (hao hụt, vỡ hỏng, thừa kiểm kê) và *Value Adjustment* (đánh giá lại giá vốn tồn kho), bắt buộc chọn *Reason Code*.
- **Batch Tracking & Same-Batch Return**: Quản lý ngày sản xuất / hết hạn, hỗ trợ trả hàng về đúng Lô gốc đã xuất (`Same Batch Returns`) và luân chuyển bằng `Transfer Orders`.
- **UI Data View**: Mạnh về lọc nhanh, tùy chỉnh cột hiển thị trên bảng chứng từ và cảnh báo `Reorder Point`.

#### 2.5. InvenTree (Open-Source Inventory Management System)
- **Hệ thống thuần Kho & Vật tư Độc lập**: `InvenTree` chứng minh mô hình thiết kế một hệ thống Quản lý Kho hoàn chỉnh, đứng tách riêng và kết nối với các hệ thống bên ngoài qua API sạch.
- **Thế mạnh Location Tree & StockItem Lineage**: Cây vị trí không giới hạn độ sâu (`Location Tree`), tách *Master Part (SKU)* khỏi *StockItem (Lô vật lý đang nằm tại Vị trí X)*, hỗ trợ chia tách/gộp lô (`Splitting & Merging`), gắn kết quả kiểm định chất lượng (`QC Pass/Fail`) và lịch sử từng lần dịch chuyển lên chính lô hàng.

---

### B. Nhóm Hệ Thống Phổ Biến Tại Việt Nam (Kho ERP & Vận Hành Đa Chi Nhánh)

#### 2.6. MISA AMIS Kho
- **Phân tách 3 vai chuẩn kế toán Việt Nam (Thông tư 200 / 133)**:
  1. *Bộ phận Đề nghị / Điều phối*: Lập Lệnh điều động / Đề nghị xuất-nhập kho.
  2. *Thủ kho*: Kiểm nhận thực tế (đủ/thiếu/lỗi) và nhấn **Ghi sổ kho** (cập nhật số lượng thẻ kho ngay lập tức).
  3. *Kế toán kho*: Hoàn thiện đơn giá, tính giá xuất kho (Bình quân cuối kỳ, Bình quân tức thời, Đích danh, FIFO) và **Ghi sổ cái / Khóa kỳ**.
- **Chuyển kho 2 bước & Kiểm kê**: Xuất điều chuyển ghi giảm kho đi và treo trung gian -> Kho nhận đối chiếu xác nhận nhập kho đến; Biên bản kiểm kê tự động phân loại Thừa/Thiếu và **tự động sinh Phiếu nhập kho xử lý thừa / Phiếu xuất kho tổn thất** sau khi duyệt.

#### 2.7. KiotViet (Phân hệ Quản lý Hàng hóa & Kho)
- **4 chỉ số tồn kho trực quan cho người vận hành**: `Tồn kho` (On-Hand), `Đang đặt/Giữ` (Reserved), `Có thể xuất/bán` (`On-Hand - Reserved`), và `Dự kiến hết hàng`.
- **Vận hành nhanh**: Chuyển hàng 2 trạng thái (`Đang chuyển` -> `Đã nhận`, cho phép chỉnh số thực nhận nếu thiếu vỡ); Kiểm kho quét barcode cộng dồn dòng -> Nút `Cân bằng kho` điều chỉnh ngay chênh lệch; Tùy chỉnh bật/tắt cột ẩn/hiện ngay góc bảng và cảnh báo âm kho linh hoạt.

#### 2.8. Sapo (Phân hệ Quản lý Kho & Điều Chuyển)
- **Nhập kho nhiều đợt (`Partial Receiving`) & Phân bổ Chi phí nhập**: Hỗ trợ một lần đề nghị nhập nhưng nhà cung cấp giao nhiều đợt (`Backorder`), cho phép phân bổ chi phí vận chuyển/bốc xếp vào giá vốn bình quân gia quyền.
- **Xuất hủy / Xuất trả NCC / Xuất khác**: Phân tách rõ các nhóm lý do xuất kho không mang tính thương mại, giúp báo cáo `XNT` bóc tách rõ thất thoát vs xuất tiêu dùng.

#### 2.9. 1Office Inventory
- **Tích hợp Workflow Đề xuất Nội bộ <-> Kho**: Nhân viên các phòng ban lập Đề xuất cấp phát vật tư / xuất kho nội bộ -> Duyệt nhiều cấp -> Thủ kho nhận việc thực hiện xuất kho gắn `employee_id / department_id`.
- **Phân cấp vị trí kho chuẩn ERP**: `Kho -> Khu vực (Zone) -> Dãy (Aisle) -> Kệ (Rack) -> Tầng (Shelf) -> Ô chứa (Bin)`.
- **Theo dõi chi tiết**: Tùy chọn theo từng SKU quản lý theo Số lượng thuần, Lô/Hạn sử dụng (`Date/FEFO`), hoặc `Serial/IMEI`, đi kèm cảnh báo định mức `Min/Max`.

#### 2.10. Haravan Inventory (Đa kho & Mobile Barcode)
- **Kiểm soát Tồn kho Thời gian thực (`Real-time Stock Lock`)**: Ngăn chặn xuất trùng khi nhiều đầu mối cùng lúc tạo phiếu giữ hàng/xuất kho bằng cơ chế khóa tồn tức thời.
- **Thao tác Mobile & Thẻ kho**: Ứng dụng Mobile quét mã vạch kiểm kê từng khu vực; mọi biến động cộng/trừ tồn đều lưu **Thẻ kho (`Stock Card`)** ghi rõ ngày giờ, mã chứng từ, loại giao dịch, tồn trước -> biến động -> tồn sau -> người thực hiện.

---

## 3. Ma Trận So Sánh 8 Khía Cạnh Nghiệp Vụ Kho

| Khía cạnh | Odoo | ERPNext | SAP / NetSuite | Zoho Inv. | InvenTree | MISA AMIS | KiotViet | Sapo | 1Office | Haravan |
| :--- | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: |
| **1. Đa kho + Cây vị trí Bin** | Cao (Location tree) | Trung bình (Warehouse tree) | Rất cao (Zone-Rack-Bin) | Cơ bản | Rất cao (Location tree) | Trung bình (Kho/Vị trí) | Thấp (Chỉ cấp Kho) | Thấp (Chỉ cấp Kho) | Cao (Kho-Khu-Kệ-Ô) | Trung bình (Kho/Vị trí) |
| **2. Tách `On-Hand` vs `Reserved` vs `Available`** | Có (`stock.quant`) | Có (`Bin` 4 chỉ số) | Có (`ATP` Engine) | Có (`Committed Stock`) | Có (`Allocated`) | Có (Giữ theo lệnh) | Có (`Tồn` vs `Đặt`) | Có (`Có thể bán`) | Có | Có (Real-time sync) |
| **3. Sổ cái bất biến (`Ledger`) & Đảo phiếu** | Có (`stock.move`) | Rất chuẩn (`SLE`) | Rất chuẩn (`Material Doc`) | Có (Audit Log) | Có (Tracking) | Có (Ghi sổ + Đảo/Bỏ ghi) | Cơ bản (Thẻ kho) | Cơ bản (Thẻ kho) | Có (Thẻ kho) | Có (Lịch sử tồn) |
| **4. Nhập kho QC + Nhập thiếu (`Backorder`)** | Rất tốt (2/3-step + Backorder) | Tốt (QI + Partial PR) | Rất tốt (QM Inspection) | Tốt (Partial + Return) | Tốt (Test Result) | Tốt (Kiểm nhận + Nhập nhiều lần) | Cơ bản (Nhập 1 bước) | Tốt (PO nhiều đợt) | Tốt | Cơ bản |
| **5. Xuất kho FIFO / FEFO / Đích danh** | FIFO/LIFO/FEFO | FIFO/LIFO + Batch | Đầy đủ | FIFO/Batch | Lot/Serial | FIFO/FEFO/Đích danh | Hàng Lô/Date | Lô/Date + IMEI | FIFO/FEFO/Serial | Lô/Date |
| **6. Chuyển kho 2 bước (`In-Transit`)** | Có (Virtual Transit) | Có (Add to Transit) | Có (`303/305`) | Có (Transfer Order) | Hạn chế | Có (2 bước + xác nhận) | Có (`Đang chuyển -> Đã nhận`) | Có | Có | Có |
| **7. Kiểm kê mù (`Blind Count`) & Tự sinh cân bằng** | Có (Cấu hình) | Có (`Stock Reconciliation`) | Rất chặt (Freeze + Blind) | Có (`Inventory Adjustment`) | Cơ bản (Count date) | Có (Biên bản -> Phiếu thừa/thiếu) | Nhanh (Quét -> Cân bằng) | Nhanh | Có | Có (Mobile Barcode) |
| **8. Kết nối Lỏng với Phân hệ Ngoài / Workflow** | Module hóa | Module hóa + Workflow | Chuẩn IDoc/API | API + Reference | Thuần WMS + REST API | Tách Kế toán vs Kho | Khép kín | Khép kín | Workflow nội bộ mạnh | Webhook/API |

---

## 4. 12 Bài Học Kiến Trúc & Nghiệp Vụ Áp Dụng Cho `plugins/inventory` (`L01`–`L12`)

| Mã | Bài học rút ra từ đối thủ | Định hướng áp dụng vào `plugins/inventory` (Sprint 13) |
| :--- | :--- | :--- |
| `L01` | **Sổ cái Bất biến (`SLE` của ERPNext) + Ảnh chụp `Bin` 5 chỉ số** | Thiết kế tách 2 tầng dữ liệu: bảng `stock_ledger_entries` (append-only ghi mọi dòng cộng/trừ có `posting_at`, giá vốn, chứng từ nguồn) và bảng `stock_balances` lưu tức thời `On-Hand`, `Reserved`, `Available (= On-Hand - Reserved)`, `In-Transit`, `Incoming` để đọc tốc độ O(1). |
| `L02` | **Phân tách 2 vai Thủ kho vs Kế toán + Chứng từ VN (MISA AMIS)** | Bọc khái niệm kế toán kép bằng loại chứng từ trực quan (**Phiếu Nhập**, **Phiếu Xuất**, **Phiếu Chuyển**, **Phiếu Kiểm Kê**), đồng thời tách quyền **Thủ kho ghi sổ số lượng** khỏi quyền **Xem/Quản lý Giá vốn & Đóng kỳ** (`INVENTORY_VIEW_COST`). |
| `L03` | **Giữ hàng Độc lập & Tham chiếu Đa hình (`Reference-Agnostic Reservation`)** | Cơ chế giữ hàng (`StockReservation`) nhận khóa `(warehouse_id, sku_id, qty)` kèm `reference_type / reference_code / reference_id` bất kỳ (tạo tay trên Kho, đề nghị nội bộ, hay từ phân hệ Mua hàng/Bán hàng bên ngoài gọi qua gRPC). Bảo vệ bằng khóa PostgreSQL `FOR UPDATE` + Redis Lock chống xuất trùng (`Overselling`). |
| `L04` | **Chuyển kho 2 bước có trạng thái Đang đi đường (`In-Transit`)** | Chuyển cùng kho (`Bin-to-Bin`) ghi sổ 1 bước tức thì. Chuyển giữa 2 kho/chi nhánh hỗ trợ **2 bước**: Bước 1 Kho xuất xác nhận -> Trừ `On-Hand` kho đi, cộng `In-Transit` kho đến; Bước 2 Kho đến kiểm đếm xác nhận -> Trừ `In-Transit`, cộng `On-Hand` (hỗ trợ xử lý chênh lệch mất/vỡ trên đường). |
| `L05` | **Hỗ trợ Kiểm định chất lượng (`QC`) & Nhập thiếu (`Backorder`) (Odoo / Sapo)** | Hàng nhập cho phép chọn luồng *Nhập thẳng vào Kho chính* hoặc *Qua khu vực Chờ kiểm QC* (`QUARANTINE`) rồi mới phân loại đạt/hỏng; nếu giao thiếu so với dự kiến, cho phép xác nhận số thực nhận và sinh phần còn lại chờ nhập tiếp (`Backorder Receipt`). |
| `L06` | **Định danh Linh hoạt: `NONE` vs `LOT_EXPIRY (FEFO)` vs `SERIAL/IMEI`** | Khai báo cấp SKU phương thức quản lý (`NONE`, `LOT_EXPIRY`, `SERIAL`). Hệ thống gợi ý xuất tự động theo **FEFO** (hết hạn trước xuất trước) với hàng Lô/Date hoặc **FIFO** với hàng thường, giảm hàng hết đát và thao tác tìm thủ công. |
| `L07` | **Kiểm kê cuốn chiếu theo khu vực + Kiểm kê mù (`Blind Count`) (SAP / MISA)** | Hỗ trợ tạo đợt kiểm kê theo Kho, Zone/Kệ hoặc Nhóm hàng (không đóng băng toàn hệ thống); bật tùy chọn **Ẩn tồn hệ thống (`Blind Count`)** khi đếm ngoài hiện trường; sau khi duyệt tự động sinh chứng từ bù trừ Thừa/Thiếu. |
| `L08` | **Cấm sửa/xóa chứng từ đã ghi sổ — Đảo chứng từ (`Reversal`) & Khóa kỳ (SAP / MISA)** | Chứng từ `POSTED` là bất biến. Nếu sai sót trước khi Khóa kỳ, thực hiện **Đảo chứng từ** sinh bút toán ngược dấu bảo toàn Audit Trail; qua ngày Khóa kỳ (`Closed Period`) cấm đảo trực tiếp mà phải lập chứng từ Điều chỉnh ở kỳ mở hiện tại. |
| `L09` | **Đa đơn vị tính (`Multi-UoM`) quy đổi về Đơn vị gốc (`Base UoM`)** | Mọi tồn kho và Sổ cái lưu theo **Đơn vị cơ bản (`Base UoM`)** (VD: `Cái/Viên`) để tránh sai số làm tròn, nhưng chứng từ Nhập/Xuất cho phép chọn Đơn vị giao dịch (`Thùng`, `Hộp`) kèm hệ số quy đổi theo SKU. |
| `L10` | **Tận dụng Workflow Engine có sẵn (1Office / Open-ERP Sprint 08)** | Không hardcode cây duyệt trong module Kho. Cho phép Tenant bật/tắt luồng duyệt `plugins/workflow` cho các phiếu nhạy cảm (Xuất hủy, Điều chỉnh kiểm kê vượt ngưỡng, Đề nghị xuất vật tư nội bộ). |
| `L11` | **Phân quyền Data Scope theo Kho & Chi nhánh (`organization` + Core RBAC)** | Thủ kho A chỉ xem/ghi sổ được các Kho thuộc Chi nhánh hoặc danh sách `warehouse_ids` được gán, trong khi Quản lý kho / Điều phối vùng xem được tồn tổng hợp liên kho để điều chuyển. |
| `L12` | **Trải nghiệm Bảng dữ liệu Tối ưu & Mobile Thực địa (KiotViet / Haravan / Rule #33)** | Trên Web Desktop, mọi bảng (SKU, Tồn kho 5 chỉ số, Phiếu Nhập/Xuất/Chuyển/Kiểm kê, Thẻ kho, Báo cáo `XNT`) áp dụng chuẩn **Cố định Header & Footer, chỉ cuộn phần nội dung**, tùy biến ẩn/hiện cột, đổi thứ tự cột, lọc đa điều kiện, **Context Menu chuột phải** đầy đủ tác vụ nghiệp vụ. Trên Mobile Ionic tối giản tập trung Quét mã vạch kiểm đếm & xác nhận nhanh nút `>= 40px`. |
