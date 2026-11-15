# Sprint 13 Reading Guide — Plugin Quản Lý Kho, Xuất/Nhập Kho & Tồn Kho (`plugins/inventory`)

| Thuộc tính | Giá trị |
| :--- | :--- |
| ID | READ-S13-001 |
| Sprint | Sprint 13 — `sprint_13_plugin_inventory` |
| Trạng thái | Draft / Discovery (Chờ Khách hàng review luồng nghiệp vụ & chốt `CONF-S13-001` `Q1`–`Q10`) |
| Phiên bản | 0.3 |
| Điều phối / Cập nhật | AI BA & Coordinator Agent |
| Tài liệu nền tảng | [AGENTS.md](../../../AGENTS.md) · [core_sdlc.md](../../../.agents/rules/core_sdlc.md) · [ui_ux_standards.md](../../../.agents/rules/ui_ux_standards.md) · [api_standards.md](../../../.agents/rules/api_standards.md) |

---

## 1. Mục Tiêu Sprint 13

Xây dựng **Plugin Quản Lý Kho Hàng (`plugins/inventory`)** hoàn toàn độc lập, chuyên sâu về **Quản lý Kho, Xuất/Nhập Kho, Điều Chuyển, Kiểm Kê và Quản Trị Tồn Kho** trên nền tảng Open-ERP:
- Quản trị danh mục Kho / Vị trí lưu trữ (`Warehouse` -> `Zone` -> `Rack` -> `Bin/Location`), hàng hóa lưu kho (`Product/SKU`), Đa đơn vị tính (`Multi-UoM`), theo dõi Lô / Hạn sử dụng (`Lot/Batch` - `FEFO`) và số sê-ri (`Serial/IMEI`).
- Chuẩn hóa **Sổ cái Tồn kho Bất biến (`Stock Ledger Entry`)** kết hợp **Bảng tổng hợp Tồn kho tức thời (`Stock Balance`)** tách bạch 5 chỉ số (`On-Hand`, `Reserved`, `Available`, `In-Transit`, `Incoming`).
- Vận hành đầy đủ các luồng: **Nhập kho (`Inbound` + QC/Backorder)**, **Giữ hàng (`Stock Reservation` qua tham chiếu chứng từ tổng quát)** & **Xuất kho (`Outbound` FEFO/FIFO/Serial)**, **Chuyển kho nội bộ (`1-Step` & `2-Step In-Transit`)**, **Kiểm kê & Cân bằng kho (`Cycle Count / Stocktake`)**, **Điều chỉnh & Hủy sổ (`Immutable Reversal`)**, và **Thẻ kho / Báo cáo XNT / Cảnh báo định mức (`Min/Max/FEFO`)**.
- Cung cấp hợp đồng giao tiếp liên plugin chuẩn hóa (`PluginDataServiceGrpc` & Kafka Outbox Events) để các phân hệ nghiệp vụ bên ngoài tương lai (Mua hàng, Bán hàng, Nội bộ...) gọi giữ hàng và truy vấn tồn khả dụng mà không phụ thuộc chéo vào nội bộ `plugins/inventory`.
- Tuân thủ nghiêm ngặt ranh giới Core vs. Plugin, đăng ký Entity Registry, cô lập đa tenant (`tenant_id`), kiến trúc UI `@shared/*` (**Anti-Modal**, **Route-Driven State**, **Sticky Scroll Data View & Context Menu**, **Zero-Emoji**, **100% i18n**) và kiểm thử trên **PostgreSQL + Redis thật**.

---

## 2. Bản Đồ Tài Liệu & Trình Tự Đọc (Bước 00–09)

| Bước | Mã tài liệu | Tệp | Nội dung chính | Phiên bản | Trạng thái |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `00` | `READ-S13-001` | [00_READING_GUIDE.md](./00_READING_GUIDE.md) | Định hướng đọc, danh mục tệp, cổng xác nhận Sprint 13 | `0.3` | Active |
| `01` | `RAW-S13-001` | [01_RAW-S13-001_inventory_requirements.md](./01_raw_notes/01_RAW-S13-001_inventory_requirements.md) | Ghi chú yêu cầu gốc thuần Plugin Kho (`plugins/inventory`), phân vai & phụ thuộc liên plugin | `0.3` | ⏳ Pending Review |
| `03` | `BENCH-S13-001` | [01_BENCH-S13-001_inventory_warehouse_benchmarks.md](./03_benchmarks/01_BENCH-S13-001_inventory_warehouse_benchmarks.md) | Đối sánh 10 hệ thống Quản lý Kho/ERP Quốc tế & Việt Nam (Odoo, ERPNext, SAP/NetSuite, Zoho, InvenTree, MISA, KiotViet, Sapo, 1Office, Haravan) + 12 bài học kiến trúc | `0.3` | ⏳ Pending Review |
| `02` | `ANL-S13-001` | [01_ANL-S13-001_inventory_workflows.md](./02_analysis/01_ANL-S13-001_inventory_workflows.md) | Đặc tả chi tiết 7 luồng nghiệp vụ thuần Kho, State Machine, `Stock Ledger` 5 chỉ số, `24 User Stories`, `BR-W01..W14`, 10 Edge Cases & chuẩn UI Data View / Sticky Table | `0.3` | ⏳ Pending Review |
| `04` | `CONF-S13-001` | [01_CONF-S13-001_sprint_13_scope_and_ac.md](./04_confirmation/01_CONF-S13-001_sprint_13_scope_and_ac.md) | Bộ 10 câu hỏi chốt nghiệp vụ Kho (`Q1`–`Q10`) & 20 Acceptance Criteria (`AC-01`..`AC-20`) chờ Khách hàng xác nhận | `0.3` | ⏳ Pending Client Sign-off |
| `05` | `SOL-S13-*` | `05_solutions/` *(Chưa tạo)* | Chỉ khởi tạo sau khi Khách hàng phê duyệt `CONF-S13-001` | — | Locked (Pending `CONF`) |
| `06` | `DES-S13-*` | `06_designs/` *(Chưa tạo)* | Chỉ khởi tạo sau `SOL-S13-*` | — | Locked (Pending `SOL`) |
| `07` | `FEAT/TASK-*` | `07_items/` *(Chưa tạo)* | Chỉ tách item lập trình sau `DES-S13-*` | — | Locked (Pending `DES`) |
| `08` | `QA-S13-*` | `08_testing/` *(Chưa tạo)* | Dual-Mode Browser Testing (Desktop & Mobile) + API Integration Test | — | Locked |
| `09` | `REV-S13-*` | `09_review/` *(Chưa tạo)* | Nghiệm thu Sprint DoD Gate | — | Locked |

---

## 3. Liên Kết Phụ Thuộc Hệ Thống & Các Sprint Trước

| Hệ thống / Sprint | Vai trò đối với `plugins/inventory` | Ràng buộc tích hợp |
| :--- | :--- | :--- |
| **Core Platform & IAM** | Xác thực `tenant_id`, RBAC chức năng + Data Scope theo Kho / Chi nhánh | Mọi truy vấn và mutation bắt buộc lọc `tenant_id` từ JWT context; đăng ký entity tại [Entity Registry](../../system/entity_registry/README.md) |
| **Plugin `organization`** | Cây Chi nhánh / Phòng ban (`branch_id`, `department_id`) | Kho trực thuộc Chi nhánh; hỗ trợ chuyển kho liên chi nhánh |
| **Plugin `catalog`** | Master Data dùng chung (Nhóm hàng, Đơn vị tính `UoM`, Lý do xuất/nhập) | Liên kết liên plugin qua `PluginDataServiceGrpc` hoặc sự kiện Kafka (cấm gọi REST trực tiếp từ plugin khác) |
| **Plugin `employee`** | Nhân sự Thủ kho, Người đề nghị xuất nội bộ, Thành viên Hội đồng kiểm kê | Mapping `employee_id` chuẩn hóa thay cho text tự do |
| **Plugin `workflow` (Sprint 08)** | Phê duyệt nhiều cấp cho Phiếu đề nghị nhập/xuất/chuyển/kiểm kê vượt ngưỡng | Tái sử dụng Workflow Engine thay vì tự viết luồng duyệt riêng |
| **Plugin `in-app-notification`** | Cảnh báo tồn kho dưới `Min`, hàng cận hạn `FEFO`, phiếu chờ xác nhận nhận hàng | Gửi notification bất đồng bộ qua Event Hub / Outbox |
| **Các Plugin Nghiệp vụ Tương lai** *(Mua hàng, Bán hàng, Nội bộ...)* | Tách biệt hoàn toàn khỏi Sprint 13; khi triển khai sẽ gọi vào `inventory` qua gRPC/Kafka thông qua tham chiếu tổng quát (`reference_type`, `reference_id`) | `plugins/inventory` đứng độc lập hoàn toàn |

---

## 4. Bảng Kiểm Tra Xác Nhận (Confirmation Gate Checklist)

> [!IMPORTANT]
> Theo quy trình SDLC 9 bước của Open-ERP, nghiêm cấm chuyển sang Bước 05 (`05_solutions/`) hoặc viết mã nguồn khi **Confirmation Checklist** dưới đây chưa được Khách hàng phê duyệt rõ ràng.

| Hạng mục | Mô tả kiểm tra | Trạng thái | Ghi chú |
| :--- | :--- | :--- | :--- |
| `RAW-S13-001` | Yêu cầu gốc chuẩn hóa thuần Plugin Quản lý Kho (`plugins/inventory`) | ⏳ Pending Review | Đã hoàn thiện `v0.3` |
| `BENCH-S13-001` | Phân tích 10 đối thủ WMS/IMS Quốc tế & VN + 12 bài học kiến trúc | ⏳ Pending Review | Đã hoàn thiện `v0.3` |
| `ANL-S13-001` | Hoàn thiện 7 luồng nghiệp vụ thuần Kho, State Machine, Ledger & Business Rules | ⏳ Pending Review | Đã hoàn thiện `v0.3` |
| `CONF-S13-001` | Khách hàng review và chốt `Q1`–`Q10` & ký duyệt `AC-01`..`AC-20` | ⏳ Pending | Chặn Bước 05 (`SOL`) & Bước 06 (`DES`) |
