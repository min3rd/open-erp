# Sprint 15 Reading Guide — Plugin Mua Hàng & Cung Ứng (`plugins/purchasing`)

| Thuộc tính | Giá trị |
| :--- | :--- |
| ID | READ-S15-001 |
| Sprint | Sprint 15 — `sprint_15_plugin_purchasing` |
| Trạng thái | APPROVED 1.0 — Đã chốt Scope `Q1`–`Q13` & `23 AC` (Mở Bước 05 `SOL` cho Architect) |
| Phiên bản | 1.0 |
| Điều phối / Cập nhật | AI BA & Coordinator Agent |
| Tài liệu nền tảng | [AGENTS.md](../../../AGENTS.md) · [core_sdlc.md](../../../.agents/rules/core_sdlc.md) · [ui_ux_standards.md](../../../.agents/rules/ui_ux_standards.md) · [api_standards.md](../../../.agents/rules/api_standards.md) |

---

## 1. Mục Tiêu Sprint 15

Xây dựng **Plugin Quản Lý Mua Hàng & Cung Ứng (`plugins/purchasing`)** theo chu trình chuẩn **Procure-to-Pay (`P2P`)** trên Open-ERP, đáp ứng đồng thời thực tế vận hành của **3 nhóm hình thái doanh nghiệp**:
1. **Doanh nghiệp Sản xuất (`Manufacturing`)**: Mua nguyên vật liệu chính/phụ, bao bì, vật tư bảo trì (`MRO`), Danh mục Nhà cung cấp được phê duyệt (`AVL`), Hợp đồng khung (`Blanket Order`), kiểm soát `MOQ` & `Lead-time`, kiểm định đầu vào (`QC`) và phân bổ Chi phí mua hàng (`Landed Cost`).
2. **Doanh nghiệp Thương mại & Phân phối (`Trading & Distribution`)**: Tự động bổ sung tồn kho dưới mức `Min`, mua gom/mua thẳng theo Đơn bán (`Back-to-Back`), Bảng giá bậc số lượng (`Tiered Pricing`), chiết khấu thương mại/thưởng doanh số (`Rebate`), Trả lại hàng mua (`Purchase Return`).
3. **Doanh nghiệp Dịch vụ & Mua sắm Nội bộ (`Services & Indirect Spend`)**: Mua dịch vụ/thuê ngoài/văn phòng phẩm không qua kho vật lý, nghiệm thu bằng **Biên bản Nghiệm thu Dịch vụ (`Service Entry Sheet — SES`)** và kiểm soát **Ngân sách phòng ban/dự án (`Budget Check`)**.

Plugin `purchasing` giữ ranh giới sạch với **`plugins/inventory` (Sprint 13)** và **`plugins/crm` (Sprint 14)** qua `PluginDataServiceGrpc` & Kafka, tận dụng trực tiếp **`plugins/document-template` (Sprint 16 — Ưu tiên trước Sprint 15)** để kết xuất, in trình ký (`QR Verify`, `Watermark`) & gửi Email hàng loạt cho Nhà cung cấp (`PR`, `RFQ` mời thầu đa NCC, `PO / Blanket / Change Order`, `SES`, `Debit Note`), đồng thời tuân thủ cô lập đa tenant (`tenant_id`), đăng ký Entity Registry, chuẩn UI `@shared/*` (**Data View & Sticky Scroll Table + Context Menu**, **Anti-Modal**, **Route-Driven State**, **Zero-Emoji**, **100% i18n**) và kiểm thử trên **PostgreSQL + Redis thật**.

---

## 2. Bản Đồ Tài Liệu & Trình Tự Đọc (Bước 00–09)

| Bước | Mã tài liệu | Tệp | Nội dung chính | Phiên bản | Trạng thái |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `00` | `READ-S15-001` | [00_READING_GUIDE.md](./00_READING_GUIDE.md) | Định hướng đọc, danh mục tệp, cổng xác nhận Sprint 15 | `1.0` | Active |
| `01` | `RAW-S15-001` | [01_RAW-S15-001_purchasing_supply_requirements.md](./01_raw_notes/01_RAW-S15-001_purchasing_supply_requirements.md) | Yêu cầu gốc, phân tích đặc thù **Sản xuất vs Thương mại vs Dịch vụ**, `DOA/SoD`, Lưu vết 4 tầng, Form Builder & Kết xuất tài liệu (`document-template`) | `0.4` | Approved (Baseline) |
| `03` | `BENCH-S15-001` | [01_BENCH-S15-001_purchasing_supply_benchmarks.md](./03_benchmarks/01_BENCH-S15-001_purchasing_supply_benchmarks.md) | Đối sánh 10 hệ thống Mua hàng/SCM/ERP (SAP MM/Ariba, Coupa, Odoo, ERPNext, NetSuite, MISA, 1Office, Fast, Bravo, KiotViet/Sapo) + 12 bài học | `0.1` | Approved (Baseline) |
| `02` | `ANL-S15-001` | [01_ANL-S15-001_purchasing_supply_workflows.md](./02_analysis/01_ANL-S15-001_purchasing_supply_workflows.md) | Đặc tả Supplier 360, `3-Way Matching`, Sổ `AP Ledger`, 9 luồng nghiệp vụ (`DOA/SoD`, Lưu vết 4 tầng, Form Builder & Kết xuất qua `document-template`), `BR-P01..P19`, `27 User Stories` | `0.4` | Approved (Baseline) |
| `04` | `CONF-S15-001` | [01_CONF-S15-001_sprint_15_scope_and_ac.md](./04_confirmation/01_CONF-S15-001_sprint_15_scope_and_ac.md) | 13 câu hỏi chốt nghiệp vụ (`Q1`–`Q13`), Scope In/Out & 23 Acceptance Criteria (`AC-01`..`AC-23`) | `1.0` | APPROVED 1.0 (2026-11-15) |
| `05` | `SOL-S15-*` | `05_solutions/` *(Mở khóa — Ready for Architect)* | Kiến trúc giải pháp tổng thể sau khi `CONF-S15-001` đạt `APPROVED 1.0` | — | Open (Ready for `SOL`) |
| `06` | `DES-S15-*` | `06_designs/` *(Chưa tạo)* | Chỉ khởi tạo sau `SOL-S15-*` | — | Locked (Pending `SOL`) |
| `07` | `FEAT/TASK-*` | `07_items/` *(Chưa tạo)* | Chỉ tách item lập trình sau `DES-S15-*` | — | Locked (Pending `DES`) |
| `08` | `QA-S15-*` | `08_testing/` *(Chưa tạo)* | Dual-Mode Browser Testing (Desktop & Mobile) + API Integration Test | — | Locked |
| `09` | `REV-S15-*` | `09_review/` *(Chưa tạo)* | Nghiệm thu Sprint DoD Gate | — | Locked |

---

## 3. Liên Kết Phụ Thuộc Hệ Thống & Các Sprint Trước

| Hệ thống / Sprint | Vai trò đối với `plugins/purchasing` | Ràng buộc tích hợp |
| :--- | :--- | :--- |
| **Core Platform & IAM** | Xác thực `tenant_id`, RBAC chức năng + Data Scope theo Phòng ban/Chi nhánh & Hạn mức duyệt | Mọi truy vấn và mutation bắt buộc lọc `tenant_id` từ JWT context; đăng ký entity tại [Entity Registry](../../system/entity_registry/README.md) |
| **Plugin `organization`** | Chi nhánh, Phòng ban (`department_id` làm Trung tâm chi phí / Ngân sách đề nghị mua) | Liên kết qua `PluginDataServiceGrpc` / Sync Cache |
| **Plugin `catalog`** | Master Data dùng chung (Nhóm NCC, Đơn vị tính `UoM`, Tiền tệ, Thuế suất, Điều khoản thanh toán, Loại chi phí) | Liên kết qua `PluginDataServiceGrpc` |
| **Plugin `employee`** | Nhân viên Đề nghị mua (`Requester`), Nhân viên Mua hàng (`Buyer`), Hội đồng nghiệm thu | Mapping `employee_id` chuẩn hóa |
| **Plugin `form` (Sprint 08)** | Kết xuất & cho phép từng Tenant/Chi nhánh (`branch_id`) tùy biến biểu mẫu `Supplier KYC`, `PR`, `RFQ`, `PO`, `SES`, `Vendor Bill`, `Return` qua 32 loại trường + `GRID` công thức + `SIGNATURE` | Bảo vệ `System Locked Core Fields`; lưu `custom_fields_data` (`JSONB`) kèm `form_version` qua Entity Registry |
| **Plugin `workflow` (Sprint 08)** | Duyệt Đề nghị Mua hàng (`PR`), Duyệt chọn Báo giá trúng thầu, Duyệt `PO` theo bậc ngân sách, Duyệt Trả hàng (`RMA/Return`) | Tái sử dụng Workflow Engine thay vì tự viết luồng duyệt riêng |
| **Plugin `in-app-notification`** | Cảnh báo hàng sắp trễ giao (`PO Overdue`), `PR` chờ duyệt, Hợp đồng khung sắp hết hạn/hết ngân sách, Công nợ NCC tới hạn thanh toán | Gửi notification bất đồng bộ qua Event Hub / Outbox |
| **Plugin `document-template` (Sprint 16 — Ưu tiên trước Sprint 15)** | Thiết kế & kết xuất `RFQ`, Đơn mua hàng `PO`, Hợp đồng khung (`.docx`), Biên bản Nghiệm thu `SES` (kèm `GRID`/ảnh/chữ ký), `Debit Note`, `QR Verify` & Gửi Email tự động/thủ công cho NCC | Giao tiếp qua `PluginDataServiceGrpc` / Kafka & nhúng Drawer `Print & Email` — xem [Sprint 16 Reading Guide](../sprint_16_plugin_document_template/00_READING_GUIDE.md) |
| **Plugin `inventory` (Sprint 13)** | Nguồn SKU & `Available`; nhận cảnh báo thiếu tồn `Min` để gợi ý `PR`; đồng bộ `Incoming` & `PURCHASE_IN` (kèm QC/Backorder); thực hiện `SUPPLIER_RETURN` & nhận phân bổ `Landed Cost` | Giao tiếp qua `PluginDataServiceGrpc` & Kafka — xem [Sprint 13 Reading Guide](../sprint_13_plugin_inventory/00_READING_GUIDE.md) |
| **Plugin `crm` (Sprint 14)** | Khi `Sales Order` thiếu hàng hoặc cần mua thẳng (`Back-to-Back`), `purchasing` tham chiếu `reference_type = SALES_ORDER` để mua theo đơn hàng | Liên kết lỏng qua tham chiếu đa hình & Event — xem [Sprint 14 Reading Guide](../sprint_14_plugin_crm/00_READING_GUIDE.md) |

---

## 4. Bảng Kiểm Tra Xác Nhận (Confirmation Gate Checklist)

> [!IMPORTANT]
> Theo quy trình SDLC 9 bước của Open-ERP, nghiêm cấm chuyển sang Bước 05 (`05_solutions/`) hoặc viết mã nguồn khi **Confirmation Checklist** dưới đây chưa được Khách hàng phê duyệt rõ ràng.

| Hạng mục | Mô tả kiểm tra | Trạng thái | Ghi chú |
| :--- | :--- | :--- | :--- |
| `RAW-S15-001` | Yêu cầu gốc chuẩn hóa cho 3 mô hình Sản xuất / Thương mại / Dịch vụ + Phê duyệt, Lưu vết, Form Builder & Document Template (S16) | Approved (1.0) | Đã chốt ngày 2026-11-15 |
| `BENCH-S15-001` | Phân tích 10 đối thủ P2P/SCM Quốc tế & VN + 12 bài học kiến trúc | Approved (1.0) | Đã chốt ngày 2026-11-15 |
| `ANL-S15-001` | Hoàn thiện 9 luồng nghiệp vụ Mua hàng, 3-Way Match, `DOA/SoD`, Lưu vết 4 tầng, Form Builder & In/Email NCC qua `document-template` & `BR-P01..P19` | Approved (1.0) | Đã chốt ngày 2026-11-15 |
| `CONF-S15-001` | Khách hàng review & chốt `Q1`–`Q13` và ký duyệt `AC-01`..`AC-23` | APPROVED 1.0 | Đã ký chốt 13/13 câu hỏi bởi Chủ dự án (2026-11-15) — Mở Bước 05 (`SOL`) |
