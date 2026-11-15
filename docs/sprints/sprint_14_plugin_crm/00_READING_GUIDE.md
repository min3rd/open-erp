# Sprint 14 Reading Guide — Plugin Quản Lý & Nghiệp Vụ Khách Hàng (`plugins/crm`)

| Thuộc tính | Giá trị |
| :--- | :--- |
| ID | READ-S14-001 |
| Sprint | Sprint 14 — `sprint_14_plugin_crm` |
| Trạng thái | Draft / Discovery (Chờ Khách hàng review nghiệp vụ & chốt `CONF-S14-001` `Q1`–`Q12`) |
| Phiên bản | 0.3 |
| Điều phối / Cập nhật | AI BA & Coordinator Agent |
| Tài liệu nền tảng | [AGENTS.md](../../../AGENTS.md) · [core_sdlc.md](../../../.agents/rules/core_sdlc.md) · [ui_ux_standards.md](../../../.agents/rules/ui_ux_standards.md) · [api_standards.md](../../../.agents/rules/api_standards.md) |

---

## 1. Mục Tiêu Sprint 14

Xây dựng **Plugin Quản Lý Khách Hàng & Nghiệp Vụ Với Khách Hàng (`plugins/crm`)** độc lập trên nền tảng Open-ERP, tách bạch rõ ràng với **Plugin Quản Lý Kho (`plugins/inventory` — Sprint 13)**:
- Quản lý toàn diện vòng đời khách hàng **Customer 360** (`Lead` -> `Customer Account B2B/B2C` + `Contact` -> `Opportunity Pipeline` -> `Quotation` -> `Sales Order` -> `Contract & Payment Milestones` -> `Sales Return RMA` -> `After-Sales Ticket & SLA`).
- Kiểm soát chặt chẽ **Chống trùng lặp dữ liệu (`Duplicate Detection` qua MST/SĐT/Email)**, **Phân bổ Lead (`Lead Routing`)**, **Quy định chuyển giai đoạn (`Pipeline Stage Guardrails`)**, **Phê duyệt chiết khấu vượt ngưỡng (`workflow`)**, và **Kiểm tra Hạn mức Công nợ (`Credit Limit Check`)**.
- Phối hợp lỏng (`Loose Coupling`) với `plugins/inventory` thông qua `PluginDataServiceGrpc` và Kafka Events: Sales tra cứu tồn khả dụng (`Available`) ngay trên Báo giá, gửi yêu cầu giữ hàng (`StockReservation` với `reference_type = SALES_ORDER`) khi chốt Đơn hàng, theo dõi trạng thái xuất giao (`DELIVERY_OUT`) và liên thông Đổi/Trả hàng (`RETURN_IN`).
- Tuân thủ nghiêm ngặt ranh giới Core vs. Plugin, đăng ký Entity Registry, cô lập đa tenant (`tenant_id`) + Data Scope theo Nhóm/Nhân viên kinh doanh (`owner_id` / `branch_id`), kiến trúc UI `@shared/*` (**Anti-Modal**, **Route-Driven State**, **Sticky Scroll Data View & Context Menu**, **Zero-Emoji**, **100% i18n**) và kiểm thử trên **PostgreSQL + Redis thật**.

---

## 2. Bản Đồ Tài Liệu & Trình Tự Đọc (Bước 00–09)

| Bước | Mã tài liệu | Tệp | Nội dung chính | Phiên bản | Trạng thái |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `00` | `READ-S14-001` | [00_READING_GUIDE.md](./00_READING_GUIDE.md) | Định hướng đọc, danh mục tệp, cổng xác nhận Sprint 14 | `0.3` | Active |
| `01` | `RAW-S14-001` | [01_RAW-S14-001_crm_customer_requirements.md](./01_raw_notes/01_RAW-S14-001_crm_customer_requirements.md) | Ghi chú yêu cầu gốc, 8 trụ cột nghiệp vụ CRM, `DOA/SoD`, Lưu vết 4 tầng & Form Builder (`plugins/form`) | `0.3` | ⏳ Pending Review |
| `03` | `BENCH-S14-001` | [01_BENCH-S14-001_crm_customer_benchmarks.md](./03_benchmarks/01_BENCH-S14-001_crm_customer_benchmarks.md) | Đối sánh 10 hệ thống CRM/ERP Quốc tế & Việt Nam (Salesforce, HubSpot, Odoo, Zoho CRM, ERPNext, MISA AMIS CRM, 1Office CRM, Getfly, SlimCRM, Haravan/KiotViet) + 12 bài học kiến trúc | `0.1` | ⏳ Pending Review |
| `02` | `ANL-S14-001` | [01_ANL-S14-001_crm_customer_workflows.md](./02_analysis/01_ANL-S14-001_crm_customer_workflows.md) | Đặc tả Customer 360 + Sổ Công nợ phải thu, 9 luồng nghiệp vụ (`DOA/SoD`, Lưu vết 4 tầng & Form Builder `plugins/form`) & State Machine, `BR-C01..C18`, 10 Edge Cases, `26 User Stories` & chuẩn UI Data View | `0.3` | ⏳ Pending Review |
| `04` | `CONF-S14-001` | [01_CONF-S14-001_sprint_14_scope_and_ac.md](./04_confirmation/01_CONF-S14-001_sprint_14_scope_and_ac.md) | 12 câu hỏi chốt quyết định nghiệp vụ (`Q1`–`Q12`), Scope In/Out & 22 Acceptance Criteria (`AC-01`..`AC-22`) | `0.3` | ⏳ Pending Client Sign-off |
| `05` | `SOL-S14-*` | `05_solutions/` *(Chưa tạo)* | Chỉ khởi tạo sau khi Khách hàng phê duyệt `CONF-S14-001` | — | Locked (Pending `CONF`) |
| `06` | `DES-S14-*` | `06_designs/` *(Chưa tạo)* | Chỉ khởi tạo sau `SOL-S14-*` | — | Locked (Pending `SOL`) |
| `07` | `FEAT/TASK-*` | `07_items/` *(Chưa tạo)* | Chỉ tách item lập trình sau `DES-S14-*` | — | Locked (Pending `DES`) |
| `08` | `QA-S14-*` | `08_testing/` *(Chưa tạo)* | Dual-Mode Browser Testing (Desktop & Mobile) + API Integration Test | — | Locked |
| `09` | `REV-S14-*` | `09_review/` *(Chưa tạo)* | Nghiệm thu Sprint DoD Gate | — | Locked |

---

## 3. Liên Kết Phụ Thuộc Hệ Thống & Các Sprint Trước

| Hệ thống / Sprint | Vai trò đối với `plugins/crm` | Ràng buộc tích hợp |
| :--- | :--- | :--- |
| **Core Platform & IAM** | Xác thực `tenant_id`, RBAC chức năng + Data Scope (`Own / Team / Branch / All`), Audit log, Entity Registry | Mọi truy vấn và mutation bắt buộc lọc `tenant_id` từ JWT context; đăng ký entity tại [Entity Registry](../../system/entity_registry/README.md) |
| **Plugin `organization`** | Cây Chi nhánh / Nhóm Kinh doanh (`branch_id`, `team_id`) phục vụ báo cáo doanh số & phân quyền dữ liệu | Liên kết qua `PluginDataServiceGrpc` / Sync Cache |
| **Plugin `catalog`** | Master Data dùng chung (Nhóm khách hàng, Nguồn khách `Lead Source`, Ngành nghề, Tiền tệ, Điều khoản thanh toán, Loại Ticket) | Liên kết qua `PluginDataServiceGrpc` (cấm hardcode danh mục tĩnh hoặc fix `size = 100`) |
| **Plugin `employee`** | Nhân viên Kinh doanh (`Sales Owner`), Quản lý duyệt đơn, Nhân viên CSKH / Kỹ thuật | Mapping `employee_id` chuẩn hóa |
| **Plugin `form` (Sprint 08)** | Kết xuất & cho phép từng Tenant/Chi nhánh (`branch_id`) tùy biến biểu mẫu `Lead`, `Customer`, `Opportunity`, `Quotation`, `Sales Order`, `Contract`, `RMA/Ticket` qua 32 loại trường + `GRID` + `SIGNATURE` | Bảo vệ `System Locked Core Fields`; lưu `custom_fields_data` (`JSONB`) kèm `form_version` qua Entity Registry |
| **Plugin `workflow` (Sprint 08)** | Duyệt Báo giá/Đơn hàng chiết khấu vượt khung, Duyệt vượt Hạn mức Công nợ (`Credit Override`), Duyệt Đổi/Trả hàng | Tái sử dụng Workflow Engine thay vì tự viết luồng duyệt riêng |
| **Plugin `in-app-notification`** | Nhắc lịch chăm sóc/follow-up, cảnh báo Lead mới phân bổ, Báo giá sắp hết hạn, Công nợ sắp/quá hạn, Ticket sắp vi phạm `SLA` | Gửi notification bất đồng bộ qua Event Hub / Outbox |
| **Plugin `document-template` (Sprint 16 — Ưu tiên trước Sprint 14)** | Thiết kế & kết xuất Báo giá, Đơn đặt hàng, Hợp đồng B2B (`.docx/.pdf`), Thông báo công nợ kèm `VietQR`, Biên bản `RMA`, `QR Verify` bản giấy & Trộn Email gửi Khách hàng | Giao tiếp qua `PluginDataServiceGrpc` / Kafka & nhúng Drawer `Print & Email` — xem [Sprint 16 Reading Guide](../sprint_16_plugin_document_template/00_READING_GUIDE.md) |
| **Plugin `inventory` (Sprint 13)** | Cung cấp giá trị Tồn khả dụng (`Available`) khi lên Báo giá/Đơn hàng; giữ hàng (`StockReservation` với `reference_type = SALES_ORDER`) & phản hồi tiến độ giao hàng/nhập trả | Giao tiếp **100% qua `PluginDataServiceGrpc` & Kafka** (cấm gọi REST chéo hay truy cập thẳng DB Kho) — xem [Sprint 13 Reading Guide](../sprint_13_plugin_inventory/00_READING_GUIDE.md) |

---

## 4. Bảng Kiểm Tra Xác Nhận (Confirmation Gate Checklist)

> [!IMPORTANT]
> Theo quy trình SDLC 9 bước của Open-ERP, nghiêm cấm chuyển sang Bước 05 (`05_solutions/`) hoặc viết mã nguồn khi **Confirmation Checklist** dưới đây chưa được Khách hàng phê duyệt rõ ràng.

| Hạng mục | Mô tả kiểm tra | Trạng thái | Ghi chú |
| :--- | :--- | :--- | :--- |
| `RAW-S14-001` | Tập hợp đầy đủ yêu cầu CRM (`plugins/crm`) + `DOA/SoD`, Lưu vết 4 tầng & Form Builder | ⏳ Pending Review | Đã bổ sung `v0.3` |
| `BENCH-S14-001` | Phân tích 10 đối thủ CRM Quốc tế & VN + 12 bài học kiến trúc | ⏳ Pending Review | Mới khởi tạo `v0.1` |
| `ANL-S14-001` | Hoàn thiện 9 luồng nghiệp vụ CRM, Customer 360, Công nợ, `DOA/SoD`, Lưu vết 4 tầng, Form Builder (`plugins/form`) & `BR-C01..C18` | ⏳ Pending Review | Đã bổ sung `v0.3` |
| `CONF-S14-001` | Khách hàng trả lời `Q1`–`Q12` & ký duyệt `AC-01`..`AC-22` | ⏳ Pending | Chặn Bước 05 (`SOL`) & Bước 06 (`DES`) |
