# Ghi Chú Yêu Cầu Thô (Raw Notes) — Sprint 13: Plugin Quản Lý Kho, Xuất/Nhập Kho & Tồn Kho (`plugins/inventory`)

| Thuộc tính | Giá trị |
| :--- | :--- |
| ID | RAW-S13-001 |
| Sprint | Sprint 13 (`sprint_13_plugin_inventory`) |
| Tác giả | AI Business Analyst (BA) |
| Trạng thái | Draft / Chờ review |
| Phiên bản | 0.5 |
| Ngày cập nhật | 2026-11-15 |

---

## 1. Yêu Cầu Tổng Quan & Định Vị Plugin Quản Lý Kho (`plugins/inventory`)

Khởi tạo **Plugin Quản Lý Kho Hàng (`plugins/inventory`)** hoàn toàn độc lập trên nền tảng Open-ERP, tập trung chuyên sâu vào toàn bộ chu trình nghiệp vụ **Quản lý Kho, Xuất/Nhập Kho, Điều Chuyển Kho, Kiểm Kê và Quản Trị Tồn Kho**:
- **Ranh giới Plugin Sạch**: `plugins/inventory` đứng độc lập hoàn toàn, không phụ thuộc ngược vào bất kỳ phân hệ Bán hàng/Mua hàng hay quản trị khách hàng nào bên ngoài.
- **Tham chiếu Chứng từ Nguồn Tổng quát (`Reference-Agnostic`)**: Các lệnh Giữ hàng (`StockReservation`), Phiếu Nhập hoặc Phiếu Xuất lưu cặp khóa tham chiếu đa hình (`reference_type`, `reference_code`, `reference_id`, ví dụ: `MANUAL`, `PURCHASE_ORDER`, `DELIVERY_REQUEST`, `INTERNAL_REQUEST`, `EXTERNAL_PLUGIN`). Thủ kho và Điều phối viên thao tác trực tiếp ngay trong `plugins/inventory`, đồng thời bất kỳ plugin nghiệp vụ nào được phát triển về sau đều kết nối vào Kho qua hợp đồng `PluginDataServiceGrpc` / Kafka mà không cần chỉnh sửa lõi Kho.

---

## 2. Phân Rã 8 Nhóm Yêu Cầu Nghiệp Vụ Kho Chi Tiết

### 2.1. Cấu Trúc Đa Kho & Vị Trí Lưu Trữ (`Warehouse & Zone/Rack/Bin`)
- Quản lý nhiều Kho trực thuộc cây Chi nhánh (`organization.branch_id`), phân loại rõ Kho Vật lý (`PHYSICAL`), Kho/Khu Cách ly kiểm định (`QUARANTINE`), Kho Trung gian điều chuyển (`VIRTUAL_TRANSIT`), và Kho Gửi đối tác (`CONSIGNMENT`).
- Tùy chọn bật/tắt cây vị trí `Kho -> Khu vực (Zone) -> Dãy/Kệ (Rack) -> Tầng/Ô (Bin)` theo từng kho (kho lớn quản lý tới từng ô kệ; kho nhỏ dùng 1 vị trí mặc định để nhập/xuất nhanh 1 bước). Hỗ trợ khóa tạm từng Bin (`Freeze Bin`) khi bảo trì hoặc kiểm kê cuốn chiếu.

### 2.2. Hàng Hóa Lưu Kho, Đa Đơn Vị Tính & Truy Xuất Nguồn Gốc (`SKU / UoM / Lot / Serial`)
- Hồ sơ Hàng hóa lưu kho (`SKU`): mã hàng duy nhất theo tenant, mã vạch `Barcode/QR`, nhóm hàng liên kết từ `catalog`, định mức tồn tối thiểu/tối đa (`Min / Max / Safety Stock`).
- **Đa đơn vị tính (`Multi-UoM`)**: 1 Đơn vị cơ bản (`Base UoM`) kèm nhiều đơn vị quy đổi (`Hộp`, `Thùng`, `Pallet`) với hệ số quy đổi chính xác và mã vạch riêng cho từng quy cách đóng gói.
- **3 Chế độ Truy xuất (`Tracking Mode`)**: `NONE` (theo tổng số lượng), `LOT_EXPIRY` (theo Số Lô + Ngày sản xuất + Hạn sử dụng để xuất **FEFO**), và `SERIAL` (từng số Serial/IMEI duy nhất, `1 Serial = 1 Base Qty`).
- Hỗ trợ nhập liệu nhanh bằng máy quét mã vạch USB/Bluetooth (`HID`) trên Desktop và camera quét mã trên Mobile Ionic.

### 2.3. Nghiệp Vụ Nhập Kho, Kiểm Định QC & Nhập Thiếu (`Inbound, QC & Backorder`)
- Đầy đủ nguồn nhập: Nhập mua từ Nhà cung cấp (`PURCHASE_IN`), Nhập hàng trả lại (`RETURN_IN`), Nhập điều chuyển đến (`TRANSFER_IN`), Nhập bù thừa sau kiểm kê (`STOCKTAKE_GAIN`), Nhập tồn đầu kỳ (`OPENING_BALANCE`), Nhập khác (`OTHER_IN`).
- Hỗ trợ kiểm đếm thực nhận & Kiểm định chất lượng (`QC`): khi bật `require_qc`, hàng về tạm vào khu `QUARANTINE` (`Available = 0`) để nhân viên QC tách phần Đạt (`Pass` vào Bin chính) và phần Lỗi (`Fail` giữ tại khu cách ly).
- Hỗ trợ **Nhập một phần (`Partial Receipt`)**: khi thực nhận ít hơn dự kiến, cho phép ghi sổ phần đã về và tự động sinh **Phiếu chờ nhập bổ sung (`Backorder Receipt`)** cho phần còn thiếu.

### 2.4. Cơ Chế Giữ Hàng (`Stock Reservation`) & Xuất Kho (`Outbound / FEFO / FIFO / Serial`)
- Cơ chế **Giữ hàng (`Stock Reservation`)**: khóa tồn khả dụng trước khi xuất thực tế, tách bạch `On-Hand`, `Reserved`, `Available` cùng khóa đồng thời chống xuất trùng (`Race Condition`). Hỗ trợ giữ hàng có thời hạn (`hold_expires_at`) và tự giải phóng khi hủy phiếu hoặc hết hạn.
- Đầy đủ nguồn xuất: Xuất giao hàng (`DELIVERY_OUT`), Xuất sử dụng/cấp phát nội bộ (`INTERNAL_ISSUE` gắn `employee_id`/`department_id`), Xuất trả Nhà cung cấp (`SUPPLIER_RETURN`), Xuất hủy hàng lỗi/hết hạn (`DISPOSAL_OUT`), Xuất điều chuyển (`TRANSFER_OUT`), Xuất bù thiếu kiểm kê (`STOCKTAKE_LOSS`), Xuất khác (`OTHER_OUT`).
- Gợi ý lấy hàng (`Picking Allocation`) tự động theo **FEFO** (hết hạn trước xuất trước), **FIFO** (nhập trước xuất trước) hoặc quét **đích danh Serial/IMEI**; cấu hình kiểm soát xuất âm kho (`STRICT_BLOCK` mặc định).

### 2.5. Nghiệp Vụ Điều Chuyển Kho Nội Bộ (`1-Step` & `2-Step In-Transit`)
- Chuyển giữa các ô kệ trong cùng 1 kho (`Putaway / Bin-to-Bin`): ghi sổ **1 bước** tức thì.
- Chuyển giữa 2 kho / 2 chi nhánh khác nhau: luồng **2 bước (`In-Transit`)** gồm Kho xuất bàn giao (giảm `On-Hand` kho đi, cộng `In-Transit` kho đến) -> Kho nhận kiểm đếm xác nhận (cộng `On-Hand` kho đến), hỗ trợ ghi nhận và xử lý chênh lệch mất/hư hỏng trên đường vận chuyển để đưa `In-Transit` về `0`.

### 2.6. Kiểm Kê & Cân Bằng Tồn Kho (`Cycle Count & Physical Stocktake`)
- Hỗ trợ kiểm kê định kỳ toàn kho và kiểm kê cuốn chiếu (`Cycle Count`) theo khu vực `Zone/Bin` hoặc nhóm hàng mà không bắt buộc dừng hoạt động toàn bộ kho.
- Chốt ảnh số lượng sổ sách tại thời điểm bắt đầu (`Snapshot Qty`), hỗ trợ chế độ **Kiểm kê mù (`Blind Count`)** (ẩn số tồn hệ thống trên giao diện đếm thực địa), hỗ trợ nhiều nhân sự cùng quét cộng dồn.
- Tổng hợp chênh lệch Thừa/Thiếu -> Trình duyệt qua `workflow` -> Tự động sinh chứng từ bù trừ (`STOCKTAKE_GAIN` / `STOCKTAKE_LOSS`) vào Sổ cái.

### 2.7. Sổ Cái Bất Biến 5 Chỉ Số, Đảo Chứng Từ & Khóa Kỳ (`Stock Ledger & Period Lock`)
- **Sổ cái Tồn kho (`Stock Ledger Entry`)**: Append-only lưu toàn bộ biến động cộng/trừ theo `Base UoM` và thời điểm nghiệp vụ (`posting_at`), cấm `UPDATE/DELETE` trực tiếp; đồng bộ bảng `Stock Balance` 5 chỉ số (`On-Hand`, `Reserved`, `Available`, `In-Transit`, `Incoming`).
- Chứng từ đã ghi sổ (`POSTED`) là bất biến; sai sót trong kỳ mở xử lý bằng **Đảo chứng từ (`Reversal`)**.
- **Khóa kỳ kho (`Period Closing`)**: Chốt sổ cuối tháng/quý, chặn toàn bộ thao tác ghi sổ hoặc đảo phiếu trước ngày khóa kỳ.

### 2.8. Định Giá Vốn, Thẻ Kho, Báo Cáo XNT & Cảnh Báo Chủ Động
- Tính giá vốn tồn kho bình quân gia quyền tức thời (`AVCO`, sẵn sàng mở rộng `FIFO` theo Lô), phân quyền ẩn/hiện cột giá vốn (`INVENTORY_VIEW_COST`).
- Tra cứu **Thẻ kho chi tiết (`Stock Card`)**, **Báo cáo Xuất - Nhập - Tồn (`XNT`)** theo kỳ (`Đầu kỳ + Nhập - Xuất = Cuối kỳ`), **Báo cáo Tuổi tồn kho (`Inventory Aging`)** và xuất Excel/CSV theo bộ lọc.
- Cảnh báo tự động qua `in-app-notification`: Tồn dưới `Min`, Lô cận hạn `FEFO`, Phiếu chuyển `In-Transit` quá hạn nhận.

### 2.9. Phê Duyệt Đa Cấp (`DOA / SoD`), Lưu Vết 4 Tầng & Tùy Biến Biểu Mẫu Nhập Liệu (`plugins/form`) Theo Tenant / Chi Nhánh / Kho
- Áp dụng **Ma trận Phê duyệt (`plugins/workflow`)** kết hợp **Bất kiêm nhiệm (`SoD`)** cho `OPENING_BALANCE`, `DISPOSAL_OUT`, `OTHER_IN/OUT`, `TRANSFER_DISCREPANCY`, Kiểm kê lệch vượt ngưỡng, Đảo chứng từ `POSTED`, và `Maker-Checker` 2 mắt khi bật `ALLOW_NEGATIVE` hoặc Mở khóa kỳ (`Period Unlock`).
- Lưu vết **4 tầng bất biến**: *(1) `Approval History Log`*, *(2) `Before/After Diff` chính sách Kho/SKU/Lô QC*, *(3) `Inventory Lineage Graph`* và *(4) `Append-only Stock Ledger`* kèm Drawer `Audit & Lineage`.
- Toàn bộ biểu mẫu Kho (`Kho/Bin`, `SKU Master`, `Phiếu Nhập/QC`, `Phiếu Giữ/Xuất/Xuất hủy`, `Phiếu Chuyển kho`, `Phiếu Kiểm kê`) sử dụng **`plugins/form` (Sprint 08 — 32 loại trường, `GRID` Excel công thức RPN, `IMAGE_UPLOAD`, `SIGNATURE`)** cho phép từng **Tenant / Chi nhánh (`branch_id`) / Kho** tùy biến trường mở rộng trong `custom_fields_data` (`JSONB`) + `form_version`, giữ nguyên `System Locked Core Fields`.

---

## 3. Phân Vai Người Dùng & Ranh Giới Tích Hợp Liên Plugin

### 3.1. Vai Trò Nghiệp Vụ Trong Kho (`plugins/inventory`)
| Vai trò | Trách nhiệm chính | Phạm vi dữ liệu (`Data Scope`) |
| :--- | :--- | :--- |
| **Quản trị Kho / Tenant Admin** | Thiết lập Kho, cây Bin, chính sách âm kho, tiền tố chứng từ, quy tắc duyệt Workflow, Khóa kỳ. | Toàn bộ Kho trong Tenant |
| **Quản lý Kho** | Tạo đợt Kiểm kê, duyệt xử lý chênh lệch vận chuyển/kiểm kê, điều chuyển liên kho, xem báo cáo `XNT`. | Theo danh sách `warehouse_ids` / Chi nhánh được gán |
| **Điều phối Kho** | Tạo Phiếu đề nghị nhập/xuất/chuyển, tạo Lệnh giữ hàng (`StockReservation`), theo dõi hàng `Incoming / In-Transit`. | Theo Kho được phân công |
| **Thủ kho (Desktop & Mobile)** | Kiểm đếm thực nhận Nhập kho, Picking & Quét Barcode/Lot/Serial Xuất kho, Xác nhận nhận chuyển kho, Đếm kiểm kê. | Chỉ các Kho được gán; mặc định ẩn Giá vốn |
| **Nhân viên QC** | Kiểm định lô hàng tại khu `QUARANTINE`, phân loại Đạt (`Pass`) / Không đạt (`Fail`). | Khu QC & Kho được gán |
| **Kế toán Kho** | Kiểm tra giá nhập tạm tính vs chính thức, theo dõi giá vốn `AVCO`, đối chiếu Thẻ kho/XNT, thực hiện Đảo phiếu & Khóa kỳ. | Toàn Kho / Chi nhánh; có quyền `INVENTORY_VIEW_COST` |

### 3.2. Tích Hợp Hệ Sinh Thái Plugin Open-ERP
| Hệ thống / Plugin liên kết | Dữ liệu trao đổi | Hình thức giao tiếp |
| :--- | :--- | :--- |
| **Core Platform & IAM** | `tenant_id`, User RBAC, phân quyền `warehouse_ids`, đăng ký Entity tại Entity Registry. | JWT Context & Core Policy |
| **`organization`** | Chi nhánh (`branch_id`), Phòng ban (`department_id`). | `PluginDataServiceGrpc` / Sync Cache |
| **`catalog`** | Nhóm hàng hóa, Đơn vị tính (`UoM`), Lý do xuất/nhập kho. | `PluginDataServiceGrpc` |
| **`employee`** | Nhân sự Thủ kho, Người nhận xuất cấp phát nội bộ, Hội đồng kiểm kê. | `PluginDataServiceGrpc` |
| **`form` (Sprint 08)** | Tùy biến biểu mẫu Kho (`Warehouse/SKU/Phiếu Nhập/QC/Xuất/Chuyển/Kiểm kê`) theo Tenant, Chi nhánh (`branch_id`) và Kho với 32 loại trường, `GRID`, `SIGNATURE`. | Schema Lai (`System Locked` + `JSONB` `form_version`) qua Entity Registry |
| **`workflow` (Sprint 08)** | Phê duyệt nhiều cấp (`DOA/SoD`) cho Phiếu Xuất hủy, Kiểm kê vượt ngưỡng, Đề nghị xuất/chuyển, Đảo sổ & Mở khóa kỳ. | Workflow Event / Callback |
| **`in-app-notification`** | Cảnh báo dưới `Min`, lô cận hạn `FEFO`, phiếu `In-Transit` treo quá hạn. | Kafka / Outbox Event |

---

## 4. Ràng Buộc Kỹ Thuật & UI/UX Kế Thừa Từ Bộ Quy Tắc Dự Án

| Nhóm ràng buộc | Yêu cầu bắt buộc từ `AGENTS.md` | Ảnh hưởng tới tài liệu Sprint 13 |
| :--- | :--- | :--- |
| **Multi-Tenant & Core Boundary** | Cô lập `tenant_id` ở mọi bảng/truy vấn/cache/message; đăng ký mọi Entity vào Entity Registry; phân quyền phạm vi theo Chi nhánh/Kho (`warehouse_ids`). | `plugins/inventory` đứng độc lập; giao tiếp liên plugin qua `PluginDataServiceGrpc` / Kafka (cấm gọi REST chéo hoặc fix cứng `size = 100`). |
| **Quy chuẩn Data View & Bảng (`NGHIÊM CẤM #33`)** | Mọi màn hình danh sách/báo cáo (Danh mục SKU, Tồn kho 5 chỉ số, Phiếu Nhập/Xuất/Chuyển/Kiểm kê, Thẻ kho, `XNT`) phải hỗ trợ lọc, sắp xếp, ẩn/hiện cột, đổi thứ tự cột, chọn số hàng/trang; Table dùng chung `@shared/*` cố định Header & Footer, chỉ cuộn phần nội dung bên trong; bắt buộc có Context Menu chuột phải đầy đủ thao tác (và fallback `>= 40px` trên Mobile). | Đưa vào mục Đặc tả Trải nghiệm Dữ liệu trong `ANL-S13-001` & tiêu chí nghiệm thu `AC-18` tại `CONF-S13-001`. |
| **Anti-Modal, Route-Driven State & i18n** | Thay Modal bằng Nested Route / Stacked Drawer / Split-Screen; đồng bộ toàn bộ tab, filter, sort, pagination, drawer lên URL Query Params; 100% i18n (`vi.json`/`en.json`), **Zero-Emoji** trên giao diện sản phẩm. | Cấm thiết kế popup modal tạo/sửa phiếu nhập xuất; sử dụng Split-Screen hoặc Drawer nhiều tầng. |
| **Dual-Mode & Mobile Ionic** | Giao diện Desktop ERP (`>= 1280px`) mật độ cao (`High Density & Sharp`); Mobile Ionic (`390x844 px`) tối giản cho Thủ kho quét mã vạch, kiểm đếm nhập/xuất/kiểm kê và xác nhận nhận hàng chuyển kho. | Phân tách rõ phạm vi tính năng Desktop vs. Mobile ngay trong `ANL-S13-001` & `CONF-S13-001`. |
| **Kiểm thử Thực Dụng** | Backend test bằng JUnit 5 + RestAssured trên PostgreSQL & Redis thật (test đồng thời khóa bi quan/lạc quan khi giữ/xuất kho tránh âm kho); Frontend không viết `.spec.ts`, QA test Dual-Mode Browser. | Bổ sung yêu cầu kiểm thử concurrency (nhiều lệnh giữ/xuất cùng 1 mã hàng) trong `ANL-S13-001` & `CONF-S13-001`. |
