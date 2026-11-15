# Sprint 17 Reading Guide — Plugin Thu Chi & Kế Toán Doanh Nghiệp (`plugins/accounting`)

| Thuộc tính | Giá trị |
| :--- | :--- |
| ID | READ-S17-001 |
| Sprint | Sprint 17 — `sprint_17_plugin_accounting` |
| Trạng thái | APPROVED 1.0 (`CONF-S17-001` đã chốt `Q1`–`Q16` — Ready for Step 05 `SOL`) |
| Phiên bản | 1.0 |
| Điều phối / Cập nhật | AI BA & Coordinator Agent |
| Tài liệu nền tảng | [AGENTS.md](../../../AGENTS.md) · [core_sdlc.md](../../../.agents/rules/core_sdlc.md) · [ui_ux_standards.md](../../../.agents/rules/ui_ux_standards.md) · [api_standards.md](../../../.agents/rules/api_standards.md) |

---

## 1. Mục Tiêu Sprint 17

Xây dựng **Plugin Quản Lý Thu Chi, Ngân Quỹ & Kế Toán Doanh Nghiệp (`plugins/accounting`)** đóng vai trò **Trung tâm Tài chính & Sổ cái Hợp nhất (`Treasury & General Ledger Hub`)** của Open-ERP, khép kín toàn bộ vòng đời dòng tiền từ vận hành đến lập **Hồ sơ Báo cáo Tài chính & Công bố Thông tin** (`Order-to-Cash`, `Procure-to-Pay`, `Payroll-to-Bank`, `Acquire-to-Retire` và `Record-to-Report`) cho **5 loại hình doanh nghiệp thực tế tại Việt Nam**:
1. **Doanh nghiệp Thương mại & Phân phối (`Trading & Distribution`)**: Tốc độ thu/chi cao qua tiền mặt, chuyển khoản, `VietQR`, đối soát công nợ `AR/AP` theo từng hóa đơn & tuổi nợ (`Aging`), chiết khấu thanh toán, đối trừ trả hàng (`RMA / Debit Note`), tự động hạch toán Giá vốn hàng bán (`COGS` TK `632`) từ `plugins/inventory`.
2. **Doanh nghiệp Sản xuất (`Manufacturing`)**: Tập hợp chi phí sản xuất (`TK 621` NVL trực tiếp, `TK 622` Nhân công trực tiếp từ `payroll`, `TK 627` Chi phí SX chung → kết chuyển `TK 154` → nhập kho Thành phẩm `TK 155` theo Thông tư `200` hoặc `TK 154` theo Thông tư `133`), phân bổ chi phí mua hàng (`Landed Cost` từ `purchasing`), khấu hao TSCĐ/CCDC nhà xưởng (`TK 211/214`, `242`).
3. **Doanh nghiệp Dịch vụ, Dự án & Xây lắp (`Service, Agency & Project-Based`)**: Quản trị Thu - Chi & Lãi lỗ (`P&L`) theo **Dự án / Hợp đồng / Trung tâm chi phí (`Cost Center`)**, nghiệm thu thanh toán theo giai đoạn (`Milestone Billing`), quy trình **Tạm ứng & Quyết toán Hoàn ứng nhân viên (`TK 141`)**, phân bổ chi phí trả trước (`TK 242`) & trích trước chi phí phải trả (`TK 335`).
4. **Doanh nghiệp Vừa, Nhỏ & Vận hành Thu - Chi Tinh gọn (`SME / Cashbook-First`)**: Thiết kế kiến trúc **2 Chế độ Vận hành Linh hoạt (`Dual-Mode Accounting Engine`)**:
   - **Mode 1 (`Simple Treasury & Cashbook`)**: Chỉ cần lập Đề nghị Thu/Chi → Duyệt → Thủ quỹ/Ngân hàng Thu/Chi → Sổ Quỹ Tiền mặt & Ngân hàng + Công nợ + Dòng tiền/Lãi lỗ theo **Khoản mục Thu/Chi**, không bắt buộc nhân viên vận hành nhập Nợ/Có.
   - **Mode 2 (`Full Double-Entry GL — TT133 / TT200`)**: Bật động cơ **Sổ cái Kép (`Sum(Debit) == Sum(Credit)`)** theo chuẩn **Thông tư `200/2014/TT-BTC`** hoặc **Thông tư `133/2016/TT-BTC`**, tự động định khoản Nợ/Có từ chứng từ Thu/Chi và sự kiện từ `crm`, `purchasing`, `inventory`, `payroll` thông qua **Ma trận Quy tắc Định khoản Tự động (`Auto-Posting Matrix`)**. Có thể nâng cấp từ Mode 1 lên Mode 2 bất kỳ lúc nào mà không mất lịch sử.
5. **Doanh nghiệp Đại chúng / Đã IPO / Niêm yết (`HOSE / HNX / UPCoM`) & Tập đoàn Mẹ - Con**: Hỗ trợ lập **Trọn bộ Hồ sơ Báo cáo Tài chính & Hồ sơ Kiểm toán (`B01/B02/B03 Trực tiếp & Gián tiếp / B09 Thuyết minh 30+ biểu`, `Dự phòng 229/352`, `Thuế Hoãn lại 243/347`, `Bút toán Điều chỉnh Kiểm toán AJE/RJE`)**, quản lý Vốn cổ phần / ESOP / Cổ phiếu quỹ / Cổ tức & tính **`Basic/Diluted EPS` (`VAS 30`)**, kiểm soát & thuyết minh **Giao dịch Bên liên quan (`RPT` — `VAS 26`)**, **Báo cáo Bộ phận (`Segment Reporting` — `VAS 28`)**, **Hợp nhất BCTC (`TT202/2014/TT-BTC`)**, **Lịch Công bố Thông tin & Công văn Giải trình Chênh lệch Lợi nhuận (`TT96/2020/TT-BTC`: `>= 10% YoY`, `>= 5% Sau kiểm toán`, `Lãi <-> Lỗ`)**, **Theo dõi Tiến độ Sử dụng Vốn IPO** và lớp chuyển đổi song hành **`VAS <-> IFRS`**.

Plugin `accounting` tích hợp sạch qua `PluginDataServiceGrpc` & Kafka Outbox với các phân hệ trước, tận dụng trực tiếp **`plugins/form` (Sprint 08)** để tùy biến biểu mẫu theo Tenant/Chi nhánh, **`plugins/workflow` (Sprint 08)** cho **DOA / SoD** (bất kiêm nhiệm Lập phiếu vs Duyệt vs Thủ quỹ thực xuất, duyệt RPT/Hồ sơ BCTC), và **`plugins/document-template` (Sprint 16 — Ưu tiên trước)** để thiết kế & kết xuất `Phiếu Thu 01-TT`, `Phiếu Chi 02-TT`, `Đề nghị tạm ứng 03-TT`, `Hoàn ứng 04-TT`, `Ủy nhiệm chi`, `VietQR`, `Biên bản đối chiếu công nợ`, `Sổ Quỹ S07-DN`, `Sổ Cái S03b-DN`, trọn bộ `Hồ sơ BCTC B01/B02/B03/B09-DN` và `Công văn Giải trình TT96`.

---

## 2. Bản Đồ Tài Liệu & Trình Tự Đọc (Bước 00–09)

| Bước | Mã tài liệu | Tệp | Nội dung chính | Phiên bản | Trạng thái |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `00` | `READ-S17-001` | [00_READING_GUIDE.md](./00_READING_GUIDE.md) | Định hướng đọc, danh mục tệp, phụ thuộc liên plugin, cổng xác nhận Sprint 17 | `1.0` | Active |
| `01` | `RAW-S17-001` | [01_RAW-S17-001_accounting_finance_requirements.md](./01_raw_notes/01_RAW-S17-001_accounting_finance_requirements.md) | Phân tích đặc thù **5 loại hình công ty** (bổ sung **DN Đã IPO/Niêm yết**), 13 trụ cột nghiệp vụ (`Treasury`, `GL TT200/133`, `Advance 141`, `Bank Recon`, `AR/AP`, `Auto-Posting`, `TSCĐ/242`, `VAT`, **Hồ sơ BCTC & Kiểm toán AJE**, **IPO/CBTT/Hợp nhất TT202/IFRS**, `DOA/SoD`, `Form & Doc Template`) | `0.2` | Approved (via `CONF-S17-001`) |
| `03` | `BENCH-S17-001` | [01_BENCH-S17-001_accounting_finance_benchmarks.md](./03_benchmarks/01_BENCH-S17-001_accounting_finance_benchmarks.md) | Đối sánh 12 hệ thống Tài chính/Kế toán/BCTC Hợp nhất & Disclosure Quốc tế & VN (bổ sung SAP Group Reporting, Workiva/Caseware) + 14 bài học | `0.2` | Approved (via `CONF-S17-001`) |
| `02` | `ANL-S17-001` | [01_ANL-S17-001_accounting_finance_workflows.md](./02_analysis/01_ANL-S17-001_accounting_finance_workflows.md) | Kiến trúc `Dual-Mode` + Engine Hồ sơ BCTC/IPO, 5 chỉ số thanh khoản, **10 luồng nghiệp vụ end-to-end**, `BR-A01..A24`, `14 Edge Cases`, `33 User Stories` & chuẩn UI | `0.2` | Approved (via `CONF-S17-001`) |
| `04` | `CONF-S17-001` | [01_CONF-S17-001_sprint_17_scope_and_ac.md](./04_confirmation/01_CONF-S17-001_sprint_17_scope_and_ac.md) | 16 câu hỏi chốt nghiệp vụ (`Q1`–`Q16`), Phạm vi In/Out-of-Scope & 27 Acceptance Criteria (`AC-01`..`AC-27`) | `1.0` | APPROVED 1.0 (2026-11-15) |
| `05` | `SOL-S17-*` | `05_solutions/` *(Chưa tạo)* | Giải pháp kiến trúc, Multi-tenant, Data Flow & Plugin Isolation (`SOL-S17-*`) | — | Open (Ready for SOL) |
| `06` | `DES-S17-*` | `06_designs/` *(Chưa tạo)* | Chỉ khởi tạo sau `SOL-S17-*` | — | Locked (Pending `SOL`) |
| `07` | `FEAT/TASK-*` | `07_items/` *(Chưa tạo)* | Chỉ tách item lập trình sau `DES-S17-*` | — | Locked (Pending `DES`) |
| `08` | `QA-S17-*` | `08_testing/` *(Chưa tạo)* | Dual-Mode Browser Testing (Desktop & Mobile) + Backend Integration Test (PostgreSQL & Redis thật) | — | Locked |
| `09` | `REV-S17-*` | `09_review/` *(Chưa tạo)* | Nghiệm thu Sprint DoD Gate | — | Locked |

---

## 3. Liên Kết Phụ Thuộc Hệ Thống & Các Sprint Trước

| Hệ thống / Sprint | Vai trò đối với `plugins/accounting` | Ràng buộc tích hợp |
| :--- | :--- | :--- |
| **Core Platform & IAM** | Xác thực `tenant_id`, RBAC chức năng + Data Scope theo Chi nhánh/Phòng ban/Quỹ tiền/Hạn mức duyệt chi | Cô lập tuyệt đối `tenant_id` trên mọi truy vấn Sổ Quỹ, Công nợ, Sổ cái; đăng ký mọi entity tại [Entity Registry](../../system/entity_registry/README.md) |
| **Plugin `organization`** | Pháp nhân, Chi nhánh (`branch_id`), Phòng ban (`department_id` làm Trung tâm chi phí `Cost Center`) | Liên kết qua `PluginDataServiceGrpc` / Sync Cache |
| **Plugin `catalog`** | Master Data dùng chung: Tiền tệ & Tỷ giá, Thuế suất GTGT, Phương thức thanh toán, Ngân hàng (mã BIN `NAPAS`) | Liên kết qua `PluginDataServiceGrpc` |
| **Plugin `employee`** | Nhân viên Đề nghị chi, Người tạm ứng/Hoàn ứng (`TK 141`), Thủ quỹ, Kế toán viên, Giám đốc duyệt | Mapping `employee_id` chuẩn hóa |
| **Plugin `form` (Sprint 08)** | Kết xuất & cho phép từng Tenant/Chi nhánh (`branch_id`) tùy biến biểu mẫu `Đề nghị Thu/Chi`, `Phiếu Thu`, `Phiếu Chi`, `Ủy nhiệm chi`, `Đề nghị Tạm ứng`, `Bảng kê Hoàn ứng (GRID)`, `Bút toán Tổng hợp`, `TSCĐ/CCDC` | Bảo vệ `System Locked Core Fields` (số tiền, tài khoản Nợ/Có, quỹ, đối tác, ngày hạch toán); lưu `custom_fields_data` (`JSONB`) + `form_version` |
| **Plugin `workflow` (Sprint 08)** | Phê duyệt Đề nghị Chi, Tạm ứng, Hoàn ứng, Ủy nhiệm chi, Bút toán tay, Mở khóa kỳ kế toán theo ma trận hạn mức `DOA` & quy tắc bất kiêm nhiệm `SoD` | Tái sử dụng Workflow Engine thay vì tự viết engine duyệt riêng |
| **Plugin `in-app-notification`** | Cảnh báo Đề nghị chi/Tạm ứng chờ duyệt, Tạm ứng quá hạn chưa hoàn ứng, Hóa đơn `AR/AP` sắp đến hạn/quá hạn, Tồn quỹ thấp, Kỳ kế toán sắp khóa | Gửi thông báo bất đồng bộ qua Event Hub / Outbox |
| **Plugin `payroll` (Sprint 10)** | Nhận sự kiện `payroll.run.locked` chứa chi tiết lương Gross/Net, BHXH, Thuế TNCN, tiền thưởng để hạch toán chi phí lương (`622/627/641/642 -> 334/338/3335`), tạo **Ủy nhiệm chi trả lương** và cấn trừ Tạm ứng `TK 141` | Xem [Sprint 10 Reading Guide](../sprint_10_plugin_payroll/00_READING_GUIDE.md) |
| **Plugin `inventory` (Sprint 13)** | Nhận sự kiện biến động giá trị tồn kho (`Stock Ledger` `value_delta`, `PURCHASE_IN`, `SALES_OUT` tính Giá vốn `COGS`, `RETURN`, `ADJUSTMENT`, `LANDED_COST`) để hạch toán `152/156/632` | Xem [Sprint 13 Reading Guide](../sprint_13_plugin_inventory/00_READING_GUIDE.md) |
| **Plugin `crm` (Sprint 14)** | Đồng bộ `Sales Invoice / AR` & `RMA Credit` sang Công nợ Phải thu `131`, nhận Webhook/Phiếu Thu để gạch nợ hóa đơn và cập nhật trạng thái `PAID / PARTIAL` ngược về `crm` | Xem [Sprint 14 Reading Guide](../sprint_14_plugin_crm/00_READING_GUIDE.md) |
| **Plugin `purchasing` (Sprint 15)** | Nhận `Vendor Bill` đã đạt `3-Way Match` & `Debit Note` từ `purchasing` sang Công nợ Phải trả `331`; khi Chi trả NCC / Payment Run hoàn tất, phát event cập nhật `PAID` cho `purchasing` và thực chi ngân sách phòng ban | Xem [Sprint 15 Reading Guide](../sprint_15_plugin_purchasing/00_READING_GUIDE.md) |
| **Plugin `document-template` (Sprint 16 — Ưu tiên trước)** | Thiết kế & kết xuất `Phiếu Thu 01-TT`, `Phiếu Chi 02-TT`, `Giấy đề nghị tạm ứng 03-TT`, `Hoàn ứng 04-TT`, `Đề nghị thanh toán 05-TT`, `Ủy nhiệm chi`, sinh mã `VietQR`, `Biên bản đối chiếu công nợ`, `Sổ Quỹ S07-DN`, `Sổ Cái S03b-DN`, `BCTC B01/B02/B03-DN`, `Watermark` & `QR Verify` + Email đối tác/nhân viên | Giao tiếp qua `PluginDataServiceGrpc` / Kafka & nhúng Drawer `?drawer=doc-output` — xem [Sprint 16 Reading Guide](../sprint_16_plugin_document_template/00_READING_GUIDE.md) |

---

## 4. Bảng Kiểm Tra Xác Nhận (Confirmation Gate Checklist)

> [!IMPORTANT]
> Theo quy trình SDLC 9 bước của Open-ERP, nghiêm cấm chuyển sang Bước 05 (`05_solutions/`) hoặc viết mã nguồn khi **Confirmation Checklist** dưới đây chưa được Khách hàng phê duyệt rõ ràng.

| Hạng mục | Mô tả kiểm tra | Trạng thái | Ghi chú |
| :--- | :--- | :--- | :--- |
| `RAW-S17-001` | Yêu cầu gốc chuẩn hóa cho **5 loại hình doanh nghiệp** (gồm **DN Đã IPO / Niêm yết**), kiến trúc 2 chế độ, **Hồ sơ BCTC đầy đủ**, `DOA/SoD`, Lưu vết 4 tầng, `plugins/form` & `plugins/document-template` | Approved (1.0) | Đã nâng cấp `v0.2`, duyệt kèm `CONF-S17-001` (2026-11-15) |
| `BENCH-S17-001` | Đối sánh 12 hệ thống Tài chính/Kế toán, Hợp nhất & Disclosure IPO Quốc tế & Việt Nam + 14 bài học kiến trúc | Approved (1.0) | Đã nâng cấp `v0.2`, duyệt kèm `CONF-S17-001` (2026-11-15) |
| `ANL-S17-001` | Đặc tả Kiến trúc `Dual-Mode`, 5 chỉ số thanh khoản, 10 luồng nghiệp vụ (gồm Hồ sơ BCTC/Kiểm toán & DN Đã IPO), `BR-A01..A24`, `14 Edge Cases`, `33 User Stories` | Approved (1.0) | Đã nâng cấp `v0.2`, duyệt kèm `CONF-S17-001` (2026-11-15) |
| `CONF-S17-001` | Khách hàng review & chốt 16 câu hỏi (`Q1`–`Q16`) và ký duyệt 27 Acceptance Criteria (`AC-01`..`AC-27`) | APPROVED 1.0 | Đã chốt 16/16 theo Đề xuất BA (2026-11-15); Mở khóa Bước 05 (`SOL`) |
